-- ============================================================================
--  掲示板モデレーション：禁止ワード ＋ サーバー側の連投制限
--  Supabase → SQL Editor に貼って Run。
--  ※ board.sql / board_ip.sql を実行済みの前提（board_threads / board_posts /
--    create_thread / create_post が存在すること）。
--  このスクリプトは create_thread / create_post を「NGワード＋IP連投制限つき」に
--  置き換える（IP取得・採番・1000レス上限などの既存仕様は維持）。
-- ============================================================================

-- 禁止ワード表（管理画面 Table Editor で単語を追加・削除できる）
create table if not exists public.banned_words (
  word text primary key
);
-- ↓ 例。実際のNGワードは Table Editor から追加してください（部分一致・大小無視）。
-- insert into public.banned_words (word) values ('死ね'), ('荒らし例') on conflict do nothing;

-- banned_words は一般ユーザーから読めないようにする（RLS有効＋selectポリシー無し）。
-- SECURITY DEFINER 関数からは参照できる。
alter table public.banned_words enable row level security;

-- 連投制限の秒数
--  レス: 8秒に1回 / スレ作成: 60秒に1回（同一IP）
-- 既存の create_thread を NGワード＋連投制限つきに置き換え
create or replace function public.create_thread(p_board text, p_title text, p_name text, p_body text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_thread_id uuid;
  v_ip text;
begin
  if char_length(coalesce(trim(p_board), '')) = 0 or char_length(p_board) > 40 then raise exception 'invalid board'; end if;
  if char_length(coalesce(trim(p_title), '')) = 0 or char_length(p_title) > 60 then raise exception 'invalid title'; end if;
  if char_length(coalesce(trim(p_body), '')) = 0 or char_length(p_body) > 2000 then raise exception 'invalid body'; end if;

  v_ip := nullif(btrim(split_part(
    coalesce(nullif(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for', ''),
    ',', 1)), '');

  -- 禁止ワード（タイトル・本文・名前を部分一致・大小無視で検査）
  if exists (
    select 1 from banned_words bw
    where bw.word <> ''
      and ( position(lower(bw.word) in lower(p_title)) > 0
         or position(lower(bw.word) in lower(p_body)) > 0
         or position(lower(bw.word) in lower(coalesce(p_name, ''))) > 0 )
  ) then
    raise exception 'banned word';
  end if;

  -- 連投制限：同一IPからのスレ作成は60秒に1回
  if v_ip is not null and exists (
    select 1 from board_posts where ip = v_ip and post_number = 1 and created_at > now() - interval '60 seconds'
  ) then
    raise exception 'rate limited';
  end if;

  insert into board_threads (board, title) values (trim(p_board), trim(p_title)) returning id into v_thread_id;
  insert into board_posts (thread_id, post_number, name, body, ip)
    values (v_thread_id, 1, coalesce(nullif(trim(p_name), ''), '名無しさん'), trim(p_body), v_ip);
  return v_thread_id;
end; $$;

-- 既存の create_post を NGワード＋連投制限つきに置き換え
create or replace function public.create_post(p_thread_id uuid, p_name text, p_body text)
returns int language plpgsql security definer set search_path = public as $$
declare
  v_num int;
  v_ip text;
begin
  if char_length(coalesce(trim(p_body), '')) = 0 or char_length(p_body) > 2000 then raise exception 'invalid body'; end if;

  v_ip := nullif(btrim(split_part(
    coalesce(nullif(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for', ''),
    ',', 1)), '');

  -- 禁止ワード（本文・名前）
  if exists (
    select 1 from banned_words bw
    where bw.word <> ''
      and ( position(lower(bw.word) in lower(p_body)) > 0
         or position(lower(bw.word) in lower(coalesce(p_name, ''))) > 0 )
  ) then
    raise exception 'banned word';
  end if;

  -- 連投制限：同一IPからのレスは8秒に1回
  if v_ip is not null and exists (
    select 1 from board_posts where ip = v_ip and created_at > now() - interval '8 seconds'
  ) then
    raise exception 'rate limited';
  end if;

  update board_threads set post_count = post_count + 1, last_posted_at = now()
    where id = p_thread_id returning post_count into v_num;
  if v_num is null then raise exception 'thread not found'; end if;
  if v_num > 1000 then raise exception 'thread full'; end if;

  insert into board_posts (thread_id, post_number, name, body, ip)
    values (p_thread_id, v_num, coalesce(nullif(trim(p_name), ''), '名無しさん'), trim(p_body), v_ip);
  return v_num;
end; $$;

grant execute on function public.create_thread(text, text, text, text) to anon;
grant execute on function public.create_post(uuid, text, text) to anon;
