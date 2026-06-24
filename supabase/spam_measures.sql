-- ============================================================================
--  スパム対策の強化
--  Supabase → SQL Editor に貼って Run。
--  前提：board_blocks.sql / board_moderation_meta.sql / board_reports.sql 適用済み
--        （_req_meta / _is_blocked / banned_words / board_reports を利用）。
--
--  追加する対策：
--   1. 匿名Cookie単位の連投制限（IPを変えても効く）
--   2. 同一本文の連投拒否（直近10分に同じ本文を同一IP/Cookieが投稿したら拒否）
--   3. 通報しきい値での自動非表示（open通報が3件以上たまったら自動で hidden）
--  ※ 関数のシグネチャは変えないので追加の不具合は出ない（body差し替えのみ）。
-- ============================================================================

-- スレ作成（既存＋Cookie連投・同一本文拒否）
create or replace function public.create_thread(
  p_board text, p_title text, p_name text, p_body text, p_anon_id text default null
) returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare
  v_thread_id uuid;
  m record;
  v_anon text := nullif(btrim(p_anon_id), '');
begin
  if char_length(coalesce(trim(p_board), '')) = 0 or char_length(p_board) > 40 then raise exception 'invalid board'; end if;
  if char_length(coalesce(trim(p_title), '')) = 0 or char_length(p_title) > 60 then raise exception 'invalid title'; end if;
  if char_length(coalesce(trim(p_body), '')) = 0 or char_length(p_body) > 2000 then raise exception 'invalid body'; end if;

  select * into m from _req_meta();
  if _is_blocked(m.ip, m.ip_subnet, v_anon) then raise exception 'blocked'; end if;

  if exists (
    select 1 from banned_words bw
    where bw.word <> ''
      and ( position(lower(bw.word) in lower(p_title)) > 0
         or position(lower(bw.word) in lower(p_body)) > 0
         or position(lower(bw.word) in lower(coalesce(p_name, ''))) > 0 )
  ) then raise exception 'banned word'; end if;

  -- 連投制限：同一IP / 同一Cookie からのスレ作成は60秒に1回
  if m.ip is not null and exists (
    select 1 from board_posts where ip = m.ip and post_number = 1 and created_at > now() - interval '60 seconds'
  ) then raise exception 'rate limited'; end if;
  if v_anon is not null and exists (
    select 1 from board_posts where anon_id = v_anon and post_number = 1 and created_at > now() - interval '60 seconds'
  ) then raise exception 'rate limited'; end if;

  -- 同一本文の連投（直近10分・同一IPまたはCookie）
  if exists (
    select 1 from board_posts
    where created_at > now() - interval '10 minutes'
      and body = trim(p_body)
      and ((m.ip is not null and ip = m.ip) or (v_anon is not null and anon_id = v_anon))
  ) then raise exception 'duplicate body'; end if;

  insert into board_threads (board, title) values (trim(p_board), trim(p_title)) returning id into v_thread_id;
  insert into board_posts (thread_id, post_number, name, body, ip, ua, anon_id, ip_hash, ip_subnet)
    values (v_thread_id, 1, coalesce(nullif(trim(p_name), ''), '名無しさん'), trim(p_body),
            m.ip, m.ua, v_anon, m.ip_hash, m.ip_subnet);
  return v_thread_id;
end; $$;

-- レス投稿（既存＋Cookie連投・同一本文拒否）
create or replace function public.create_post(
  p_thread_id uuid, p_name text, p_body text, p_anon_id text default null
) returns int language plpgsql security definer set search_path = public, extensions as $$
declare
  v_num int;
  m record;
  v_anon text := nullif(btrim(p_anon_id), '');
begin
  if char_length(coalesce(trim(p_body), '')) = 0 or char_length(p_body) > 2000 then raise exception 'invalid body'; end if;

  select * into m from _req_meta();
  if _is_blocked(m.ip, m.ip_subnet, v_anon) then raise exception 'blocked'; end if;

  if exists (
    select 1 from banned_words bw
    where bw.word <> ''
      and ( position(lower(bw.word) in lower(p_body)) > 0
         or position(lower(bw.word) in lower(coalesce(p_name, ''))) > 0 )
  ) then raise exception 'banned word'; end if;

  -- 連投制限：同一IP / 同一Cookie からのレスは8秒に1回
  if m.ip is not null and exists (
    select 1 from board_posts where ip = m.ip and created_at > now() - interval '8 seconds'
  ) then raise exception 'rate limited'; end if;
  if v_anon is not null and exists (
    select 1 from board_posts where anon_id = v_anon and created_at > now() - interval '8 seconds'
  ) then raise exception 'rate limited'; end if;

  -- 同一本文の連投（直近10分・同一IPまたはCookie）
  if exists (
    select 1 from board_posts
    where created_at > now() - interval '10 minutes'
      and body = trim(p_body)
      and ((m.ip is not null and ip = m.ip) or (v_anon is not null and anon_id = v_anon))
  ) then raise exception 'duplicate body'; end if;

  update board_threads set post_count = post_count + 1, last_posted_at = now()
    where id = p_thread_id returning post_count into v_num;
  if v_num is null then raise exception 'thread not found'; end if;
  if v_num > 1000 then raise exception 'thread full'; end if;

  insert into board_posts (thread_id, post_number, name, body, ip, ua, anon_id, ip_hash, ip_subnet)
    values (p_thread_id, v_num, coalesce(nullif(trim(p_name), ''), '名無しさん'), trim(p_body),
            m.ip, m.ua, v_anon, m.ip_hash, m.ip_subnet);
  return v_num;
end; $$;

grant execute on function public.create_thread(text, text, text, text, text) to anon;
grant execute on function public.create_post(uuid, text, text, text) to anon;

-- 通報（既存＋通報3件以上で自動非表示）
create or replace function public.report_post(p_post_id uuid, p_reason text, p_detail text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_ip text;
  v_thread_id uuid;
  v_open int;
begin
  if p_reason not in ('harassment','personal_info','spam','obscene','impersonation','other') then
    raise exception 'invalid reason';
  end if;
  if char_length(coalesce(p_detail, '')) > 500 then raise exception 'detail too long'; end if;

  select thread_id into v_thread_id from board_posts where id = p_post_id;
  if v_thread_id is null then raise exception 'post not found'; end if;

  v_ip := nullif(btrim(split_part(
    coalesce(nullif(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for', ''),
    ',', 1)), '');

  if v_ip is not null and exists (
    select 1 from board_reports where post_id = p_post_id and reporter_ip = v_ip and status = 'open'
  ) then raise exception 'duplicate report'; end if;
  if v_ip is not null and exists (
    select 1 from board_reports where reporter_ip = v_ip and created_at > now() - interval '30 seconds'
  ) then raise exception 'rate limited'; end if;

  insert into board_reports (post_id, thread_id, reason, detail, reporter_ip)
  values (p_post_id, v_thread_id, p_reason, nullif(btrim(coalesce(p_detail, '')), ''), v_ip);

  -- 自動非表示：open通報が3件以上たまったら自動で非表示にする（管理者は後で復元/削除可）
  select count(*) into v_open from board_reports where post_id = p_post_id and status = 'open';
  if v_open >= 3 then
    update board_posts
       set hidden = true,
           delete_reason = coalesce(delete_reason, '通報多数により自動非表示')
     where id = p_post_id and hidden = false;
  end if;
end; $$;
grant execute on function public.report_post(uuid, text, text) to anon;

select pg_notify('pgrst', 'reload schema');
