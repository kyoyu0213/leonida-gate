-- ============================================================================
--  掲示板：投稿の通報 ＋ 管理者によるモデレーション（非表示／削除／対応済み）
--  Supabase → SQL Editor に貼って Run。
--  前提：board.sql / board_ip.sql / board_moderation.sql / admin_auth.sql を実行済み。
--
--  - 通報はログイン不要（anon が report_post を呼べる）。重複・連投を抑制。
--  - 通報の閲覧・モデレーションは管理者のみ（admin_auth.sql の _admin_check で認可）。
--  - anon に board_posts への update/delete ポリシーは与えない（RLS デフォルト拒否のまま）。
--    非表示／削除は SECURITY DEFINER の管理 RPC 経由でのみ可能。
-- ============================================================================

-- 投稿の非表示フラグ（あぼーん）。公開クエリは hidden=false のみ表示する想定。
alter table public.board_posts add column if not exists hidden boolean not null default false;

-- 通報テーブル。anon からは閲覧不可（select ポリシー無し＝管理者 RPC でのみ参照）。
create table if not exists public.board_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.board_posts(id) on delete cascade,
  thread_id uuid references public.board_threads(id) on delete cascade,
  reason text not null,
  detail text,
  reporter_ip text,
  status text not null default 'open',   -- 'open' | 'resolved'
  created_at timestamptz not null default now()
);
alter table public.board_reports enable row level security;
create index if not exists board_reports_post_idx on public.board_reports (post_id);
create index if not exists board_reports_status_idx on public.board_reports (status, created_at desc);

-- ----------------------------------------------------------------------------
-- 通報（ログイン不要）。理由を検証し、IPで重複・連投を抑制して記録する。
-- ----------------------------------------------------------------------------
create or replace function public.report_post(p_post_id uuid, p_reason text, p_detail text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_ip text;
  v_thread_id uuid;
begin
  if p_reason not in
     ('harassment','personal_info','spam','obscene','impersonation','other') then
    raise exception 'invalid reason';
  end if;
  if char_length(coalesce(p_detail, '')) > 500 then
    raise exception 'detail too long';
  end if;

  select thread_id into v_thread_id from board_posts where id = p_post_id;
  if v_thread_id is null then
    raise exception 'post not found';
  end if;

  v_ip := nullif(btrim(split_part(
    coalesce(nullif(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for', ''),
    ',', 1)), '');

  -- 重複抑制：同一IP×同一postの open 通報が既にあれば弾く
  if v_ip is not null and exists (
    select 1 from board_reports
    where post_id = p_post_id and reporter_ip = v_ip and status = 'open'
  ) then
    raise exception 'duplicate report';
  end if;

  -- レート制限：同一IPからの通報は30秒に1回
  if v_ip is not null and exists (
    select 1 from board_reports
    where reporter_ip = v_ip and created_at > now() - interval '30 seconds'
  ) then
    raise exception 'rate limited';
  end if;

  insert into board_reports (post_id, thread_id, reason, detail, reporter_ip)
  values (p_post_id, v_thread_id, p_reason, nullif(btrim(coalesce(p_detail, '')), ''), v_ip);
end; $$;

grant execute on function public.report_post(uuid, text, text) to anon;

-- ----------------------------------------------------------------------------
-- 管理者：通報一覧（post 単位に集約）。open＋直近24h以内の resolved を返す。
-- ----------------------------------------------------------------------------
-- 通報一覧（関数名 admin_reports）。
-- ※ 戻り値は json。RETURNS TABLE に配列(text[])があると一部環境の PostgREST が
--    関数を取り込めず404になるため、配列は json の中に隠して回避している。
-- ※ table→json へ戻り値を変えるため、既存があれば DROP してから作り直す。
drop function if exists public.admin_reports(text);
create or replace function public.admin_reports(p_token text)
returns json language plpgsql security definer set search_path = public as $$
declare result json;
begin
  perform _admin_check(p_token);
  select coalesce(json_agg(row_to_json(x)), '[]'::json) into result
  from (
    select r.post_id,
           max(r.thread_id::text)::uuid           as thread_id,  -- uuidにmax()は無いのでtext経由
           max(t.board)                           as board,
           max(p.post_number)                     as post_number,
           coalesce(max(p.body), '(削除済みの投稿)') as body,
           coalesce(bool_or(p.hidden), false)     as hidden,
           count(*)                               as report_count,
           array_agg(distinct r.reason)           as reasons,
           max(r.created_at)                      as last_reported_at,
           (case when bool_or(r.status = 'open') then 'open' else 'resolved' end) as status
    from board_reports r
    left join board_posts p on p.id = r.post_id
    left join board_threads t on t.id = r.thread_id
    where r.status = 'open' or r.created_at > now() - interval '24 hours'
    group by r.post_id
    order by 10 desc, 9 desc
  ) x;
  return result;
end; $$;

-- 管理者：投稿の非表示／再表示
create or replace function public.admin_set_post_hidden(p_token text, p_post_id uuid, p_hidden boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  update board_posts set hidden = p_hidden where id = p_post_id;
end; $$;

-- 管理者：投稿の物理削除（採番は維持。OP=post_number 1 は削除せず非表示推奨）
create or replace function public.admin_delete_post(p_token text, p_post_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  delete from board_posts where id = p_post_id;
end; $$;

-- 管理者：その post に対する通報をすべて対応済みにする
create or replace function public.admin_resolve_reports(p_token text, p_post_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  update board_reports set status = 'resolved' where post_id = p_post_id and status = 'open';
end; $$;

grant execute on function public.admin_reports(text) to anon;
grant execute on function public.admin_set_post_hidden(text, uuid, boolean) to anon;
grant execute on function public.admin_delete_post(text, uuid) to anon;
grant execute on function public.admin_resolve_reports(text, uuid) to anon;

-- ----------------------------------------------------------------------------
-- 管理者：申請制ジャンルへのスレッド作成（旧 ?admin= ガードの置き換え）。
--  通常の create_thread は board が submitOnly でも anon が呼べてしまうため、
--  管理者専用の認可付き版を用意する。NGワード／IP保存は create_thread に準ずる。
-- ----------------------------------------------------------------------------
create or replace function public.admin_create_thread(
  p_token text, p_board text, p_title text, p_name text, p_body text
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_thread_id uuid;
  v_ip text;
begin
  perform _admin_check(p_token);
  if char_length(coalesce(trim(p_board), '')) = 0 or char_length(p_board) > 40 then raise exception 'invalid board'; end if;
  if char_length(coalesce(trim(p_title), '')) = 0 or char_length(p_title) > 60 then raise exception 'invalid title'; end if;
  if char_length(coalesce(trim(p_body), '')) = 0 or char_length(p_body) > 2000 then raise exception 'invalid body'; end if;

  v_ip := nullif(btrim(split_part(
    coalesce(nullif(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for', ''),
    ',', 1)), '');

  insert into board_threads (board, title) values (trim(p_board), trim(p_title)) returning id into v_thread_id;
  insert into board_posts (thread_id, post_number, name, body, ip)
    values (v_thread_id, 1, coalesce(nullif(trim(p_name), ''), '名無しさん'), trim(p_body), v_ip);
  return v_thread_id;
end; $$;

grant execute on function public.admin_create_thread(text, text, text, text, text) to anon;
