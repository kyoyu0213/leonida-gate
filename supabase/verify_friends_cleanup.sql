-- ============================================================================
--  verify_friends.sql のテストデータ後始末（結果確認後に本番 SQL Editor で Run）
--  ------------------------------------------------------------------------
--  verify_friends.sql が作った '[[VERIFY]]' 印のカード・合成スレ・レス・通報・
--  投票、および一時フィクスチャ（NGワード / ブロック / 管理トークン）を消す。
--  friends 本体・RPC・他データには一切触れない。
-- ============================================================================

-- 合成スレを消す（board_posts / board_reports / board_post_votes は CASCADE で消える）
delete from public.board_threads t
  using public.friends f
  where f.thread_id = t.id and f.title like '[[VERIFY]]%';

-- 念のため：印付きの合成スレが孤立して残っていれば消す
delete from public.board_threads
  where board = 'friends' and title like '[[VERIFY]]%';

-- カード本体（hidden の単独行も含む）
delete from public.friends where title like '[[VERIFY]]%';

-- 一時フィクスチャ
delete from public.banned_words where word = 'zzbadword';
delete from public.board_blocks where kind = 'anon' and value = 'verify-anon-blocked';
delete from public.admin_sessions where token = 'verify-admin-token';

-- 検証結果の一時表
drop table if exists _vres;

-- 後始末の確認（すべて 0 / 空であること）
select
  (select count(*) from public.friends where title like '[[VERIFY]]%')                    as friends_left,
  (select count(*) from public.board_threads where board='friends' and title like '[[VERIFY]]%') as threads_left,
  (select count(*) from public.banned_words where word='zzbadword')                       as banned_left,
  (select count(*) from public.board_blocks where value='verify-anon-blocked')            as blocks_left,
  (select count(*) from public.admin_sessions where token='verify-admin-token')           as sessions_left;
