-- ============================================================================
--  掲示板モデレーション強化：投稿メタ情報の取得・保存と管理用RPC
--  Supabase → SQL Editor に貼って Run。
--  前提：board.sql / board_ip.sql / board_moderation.sql / board_reports.sql /
--        admin_auth.sql 実行済み。
--
--  追加で保存：User-Agent / 匿名ID(クライアント生成) / IPハッシュ / IPサブネット(/24)
--             削除理由 / 管理者メモ
--  ※ IPハッシュは突合用（sault付きsha256）。生IPは従来どおり ip 列に保持。
--  ※ ログインユーザーIDは未実装のため対象外。VPN判定は外部APIが必要なため別途。
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

-- 追加カラム（いずれも任意）
alter table public.board_posts add column if not exists ua text;
alter table public.board_posts add column if not exists anon_id text;
alter table public.board_posts add column if not exists ip_hash text;
alter table public.board_posts add column if not exists ip_subnet text;
alter table public.board_posts add column if not exists delete_reason text;
alter table public.board_posts add column if not exists admin_note text;

-- これらの内部情報は匿名から読めないようにする（管理RPC経由のみ）
revoke select (ua, anon_id, ip_hash, ip_subnet, delete_reason, admin_note)
  on public.board_posts from anon;
revoke select (ua, anon_id, ip_hash, ip_subnet, delete_reason, admin_note)
  on public.board_posts from authenticated;
create index if not exists board_posts_anon_idx on public.board_posts (anon_id);
create index if not exists board_posts_iphash_idx on public.board_posts (ip_hash);

-- 投稿者メタを取得するヘルパー（リクエストヘッダ＋IP）。
--  ※ ソルトは突合専用。必要なら変更可（変更すると過去ハッシュと突合できなくなる）。
create or replace function public._req_meta(out ip text, out ua text, out ip_hash text, out ip_subnet text)
language plpgsql security definer set search_path = public, extensions as $$
declare h json;
begin
  h := nullif(current_setting('request.headers', true), '')::json;
  ip := nullif(btrim(split_part(coalesce(h ->> 'x-forwarded-for', ''), ',', 1)), '');
  ua := left(coalesce(h ->> 'user-agent', ''), 400);
  if ip is not null then
    ip_hash := encode(digest(ip || '|gta6feed-ip-salt-v1', 'sha256'), 'hex');
    if ip ~ '^\d+\.\d+\.\d+\.\d+$' then
      ip_subnet := split_part(ip,'.',1)||'.'||split_part(ip,'.',2)||'.'||split_part(ip,'.',3)||'.0/24';
    end if;
  end if;
end; $$;

-- ----------------------------------------------------------------------------
-- create_thread / create_post を作り直し（NGワード＋連投制限は維持、メタ保存を追加）。
--  匿名IDをクライアントから受け取る p_anon_id を追加（デフォルトnullで後方互換）。
-- ----------------------------------------------------------------------------
drop function if exists public.create_thread(text, text, text, text);
create or replace function public.create_thread(
  p_board text, p_title text, p_name text, p_body text, p_anon_id text default null
) returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare
  v_thread_id uuid;
  m record;
begin
  if char_length(coalesce(trim(p_board), '')) = 0 or char_length(p_board) > 40 then raise exception 'invalid board'; end if;
  if char_length(coalesce(trim(p_title), '')) = 0 or char_length(p_title) > 60 then raise exception 'invalid title'; end if;
  if char_length(coalesce(trim(p_body), '')) = 0 or char_length(p_body) > 2000 then raise exception 'invalid body'; end if;

  select * into m from _req_meta();

  if exists (
    select 1 from banned_words bw
    where bw.word <> ''
      and ( position(lower(bw.word) in lower(p_title)) > 0
         or position(lower(bw.word) in lower(p_body)) > 0
         or position(lower(bw.word) in lower(coalesce(p_name, ''))) > 0 )
  ) then raise exception 'banned word'; end if;

  if m.ip is not null and exists (
    select 1 from board_posts where ip = m.ip and post_number = 1 and created_at > now() - interval '60 seconds'
  ) then raise exception 'rate limited'; end if;

  insert into board_threads (board, title) values (trim(p_board), trim(p_title)) returning id into v_thread_id;
  insert into board_posts (thread_id, post_number, name, body, ip, ua, anon_id, ip_hash, ip_subnet)
    values (v_thread_id, 1, coalesce(nullif(trim(p_name), ''), '名無しさん'), trim(p_body),
            m.ip, m.ua, nullif(btrim(p_anon_id), ''), m.ip_hash, m.ip_subnet);
  return v_thread_id;
end; $$;

drop function if exists public.create_post(uuid, text, text);
create or replace function public.create_post(
  p_thread_id uuid, p_name text, p_body text, p_anon_id text default null
) returns int language plpgsql security definer set search_path = public, extensions as $$
declare
  v_num int;
  m record;
begin
  if char_length(coalesce(trim(p_body), '')) = 0 or char_length(p_body) > 2000 then raise exception 'invalid body'; end if;

  select * into m from _req_meta();

  if exists (
    select 1 from banned_words bw
    where bw.word <> ''
      and ( position(lower(bw.word) in lower(p_body)) > 0
         or position(lower(bw.word) in lower(coalesce(p_name, ''))) > 0 )
  ) then raise exception 'banned word'; end if;

  if m.ip is not null and exists (
    select 1 from board_posts where ip = m.ip and created_at > now() - interval '8 seconds'
  ) then raise exception 'rate limited'; end if;

  update board_threads set post_count = post_count + 1, last_posted_at = now()
    where id = p_thread_id returning post_count into v_num;
  if v_num is null then raise exception 'thread not found'; end if;
  if v_num > 1000 then raise exception 'thread full'; end if;

  insert into board_posts (thread_id, post_number, name, body, ip, ua, anon_id, ip_hash, ip_subnet)
    values (p_thread_id, v_num, coalesce(nullif(trim(p_name), ''), '名無しさん'), trim(p_body),
            m.ip, m.ua, nullif(btrim(p_anon_id), ''), m.ip_hash, m.ip_subnet);
  return v_num;
end; $$;

grant execute on function public.create_thread(text, text, text, text, text) to anon;
grant execute on function public.create_post(uuid, text, text, text) to anon;

-- ----------------------------------------------------------------------------
-- 管理：非表示（削除理由つき）／管理者メモ／投稿メタ＋集計の取得
-- ----------------------------------------------------------------------------

-- 非表示／再表示（理由を任意で記録）。既存の3引数呼び出しも default で動く。
drop function if exists public.admin_set_post_hidden(text, uuid, boolean);
create or replace function public.admin_set_post_hidden(
  p_token text, p_post_id uuid, p_hidden boolean, p_reason text default null
) returns void language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  update board_posts
     set hidden = p_hidden,
         delete_reason = case when p_hidden then coalesce(nullif(btrim(p_reason), ''), delete_reason) else delete_reason end
   where id = p_post_id;
end; $$;
grant execute on function public.admin_set_post_hidden(text, uuid, boolean, text) to anon;

-- 管理者メモの保存
create or replace function public.admin_set_post_note(p_token text, p_post_id uuid, p_note text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  update board_posts set admin_note = nullif(btrim(p_note), '') where id = p_post_id;
end; $$;
grant execute on function public.admin_set_post_note(text, uuid, text) to anon;

-- 投稿のモデレーション詳細＋集計（IP・UA・Cookie・投稿頻度・同一Cookie履歴・通報数）
create or replace function public.admin_post_meta(p_token text, p_post_id uuid)
returns table (
  ip text, ip_hash text, ip_subnet text, ua text, anon_id text,
  created_at timestamptz, hidden boolean, delete_reason text, admin_note text,
  report_count bigint, same_ip_count bigint, same_anon_count bigint, recent_24h_same_ip bigint
) language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  return query
  select
    p.ip, p.ip_hash, p.ip_subnet, p.ua, p.anon_id,
    p.created_at, p.hidden, p.delete_reason, p.admin_note,
    (select count(*) from board_reports r where r.post_id = p.id),
    (select count(*) from board_posts x where x.ip is not null and x.ip = p.ip),
    (select count(*) from board_posts x where x.anon_id is not null and x.anon_id = p.anon_id),
    (select count(*) from board_posts x where x.ip is not null and x.ip = p.ip
        and x.created_at > now() - interval '24 hours')
  from board_posts p
  where p.id = p_post_id;
end; $$;
grant execute on function public.admin_post_meta(text, uuid) to anon;
