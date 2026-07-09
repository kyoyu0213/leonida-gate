-- ============================================================================
--  board_posts：匿名メタ列の露出を塞ぐ（列grant方式・ケースA）
--  ------------------------------------------------------------------------
--  フロントの board_posts 読み取りは全て明示列（メタ非含有）なので、フロント変更は不要。
--    - listPosts:  id,thread_id,post_number,name,body,created_at,hidden,good,bad
--    - searchPosts: thread_id,post_number,body,created_at,hidden (+ board_threads結合)
--    - getPostId:  id
--  非公開メタ ip/ua/anon_id/ip_hash/ip_subnet/delete_reason/admin_note は grant しない。
-- ============================================================================

revoke select on public.board_posts from anon, authenticated;

grant select (
  id, thread_id, post_number, name, body, created_at, hidden, good, bad
) on public.board_posts to anon, authenticated;

select pg_notify('pgrst', 'reload schema');
