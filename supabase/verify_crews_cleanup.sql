-- ============================================================================
--  verify_crews.sql のテストデータ後始末（結果確認後に本番 SQL Editor で Run）
-- ============================================================================

-- 合成スレを消す（board_posts / board_reports / board_post_votes は CASCADE で消える）
delete from public.board_threads t
  using public.crews c
  where c.thread_id = t.id and c.title like '[[VERIFYC]]%';

-- 念のため：印付きの合成スレが孤立して残っていれば消す
delete from public.board_threads
  where board = 'crews' and title like '[[VERIFYC]]%';

-- カード本体（hidden の単独行も含む）
delete from public.crews where title like '[[VERIFYC]]%';

-- 一時フィクスチャ
delete from public.banned_words where word = 'zzbadword';
delete from public.board_blocks where kind = 'anon' and value = 'verify-crew-blocked';
delete from public.admin_sessions where token = 'verify-admin-token';

drop table if exists _vres;

-- 後始末の確認（すべて 0 であること）
select
  (select count(*) from public.crews where title like '[[VERIFYC]]%')                       as crews_left,
  (select count(*) from public.board_threads where board='crews' and title like '[[VERIFYC]]%') as threads_left,
  (select count(*) from public.banned_words where word='zzbadword')                         as banned_left,
  (select count(*) from public.board_blocks where value='verify-crew-blocked')              as blocks_left,
  (select count(*) from public.admin_sessions where token='verify-admin-token')             as sessions_left;
