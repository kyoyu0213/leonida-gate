-- ============================================================================
--  管理者：スレッドの一覧取得・削除
--  Supabase → SQL Editor に貼って Run。
--  前提：admin_auth.sql（_admin_check）/ board.sql（board_threads・board_posts）適用済み。
--
--  方針：
--   - admin_list_threads：板で絞り込んでスレッドを新着順に一覧（OP本文プレビュー付き）。
--   - admin_delete_thread：スレッドを丸ごと削除。board_posts は ON DELETE CASCADE で、
--     さらに board_post_votes / board_reports も投稿・スレッドの CASCADE で消える。
--     board_images はスレ削除で thread_id が NULL になる（ON DELETE SET NULL）ため、
--     掃除として該当スレ・該当投稿に紐づく画像行も明示的に削除する。
-- ============================================================================

-- 管理者：スレッド一覧（板で絞り込み可・OP本文プレビュー付き）
drop function if exists public.admin_list_threads(text, text);
create or replace function public.admin_list_threads(p_token text, p_board text default null)
returns table (
  id uuid, board text, title text, post_count int,
  created_at timestamptz, last_posted_at timestamptz, op_body text
) language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  return query
  select t.id, t.board, t.title, t.post_count, t.created_at, t.last_posted_at,
         (select p.body from board_posts p
            where p.thread_id = t.id order by p.post_number asc limit 1) as op_body
  from board_threads t
  where p_board is null or t.board = p_board
  order by t.last_posted_at desc
  limit 200;
end; $$;
grant execute on function public.admin_list_threads(text, text) to anon;

-- 管理者：スレッドを削除（レス・投票・通報も連鎖削除／画像行は明示削除）
create or replace function public.admin_delete_thread(p_token text, p_thread_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  -- 画像行（ON DELETE SET NULL のため孤児化する）を先に掃除。
  delete from board_images
    where thread_id = p_thread_id
       or post_id in (select id from board_posts where thread_id = p_thread_id);
  -- スレ削除 → board_posts(CASCADE) → board_post_votes / board_reports(CASCADE)
  delete from board_threads where id = p_thread_id;
end; $$;
grant execute on function public.admin_delete_thread(text, uuid) to anon;

select pg_notify('pgrst', 'reload schema');
