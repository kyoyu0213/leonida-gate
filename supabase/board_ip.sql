-- ============================================================================
--  掲示板：複数掲示板対応 ＋ 投稿者IPの保存（非公開）
--  既に board.sql を実行済みの前提。これ1本で multiboard と IP保存をまとめて適用。
--  IP は board_posts.ip に保存。匿名ユーザーからは読み取り不可（管理画面でのみ閲覧）。
-- ============================================================================

-- 複数掲示板：board 列（既存ぶんは 'gtarp'）
alter table public.board_threads add column if not exists board text not null default 'gtarp';
create index if not exists board_threads_board_idx on public.board_threads (board, last_posted_at desc);

-- 投稿者IP列（レス側に保存。スレ主のIPは post_number=1 のレスに入る）
alter table public.board_posts add column if not exists ip text;

-- IP列を匿名・認証ユーザーから読めなくする（保存はするが公開しない）
revoke select (ip) on public.board_posts from anon;
revoke select (ip) on public.board_posts from authenticated;

-- 古い3引数版があれば削除
drop function if exists public.create_thread(text, text, text);

-- スレ作成（board対応・IP保存）
create or replace function public.create_thread(p_board text, p_title text, p_name text, p_body text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_thread_id uuid;
  v_ip text;
begin
  if char_length(coalesce(trim(p_board), '')) = 0 or char_length(p_board) > 40 then raise exception 'invalid board'; end if;
  if char_length(coalesce(trim(p_title), '')) = 0 or char_length(p_title) > 60 then raise exception 'invalid title'; end if;
  if char_length(coalesce(trim(p_body), '')) = 0 or char_length(p_body) > 2000 then raise exception 'invalid body'; end if;

  -- API ゲートウェイが付ける x-forwarded-for の先頭を投稿者IPとして拾う
  v_ip := nullif(btrim(split_part(
    coalesce(nullif(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for', ''),
    ',', 1)), '');

  insert into board_threads (board, title) values (trim(p_board), trim(p_title)) returning id into v_thread_id;
  insert into board_posts (thread_id, post_number, name, body, ip)
    values (v_thread_id, 1, coalesce(nullif(trim(p_name), ''), '名無しさん'), trim(p_body), v_ip);
  return v_thread_id;
end; $$;

-- レス投稿（IP保存）
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
