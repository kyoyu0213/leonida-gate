-- ============================================================================
--  ④-a スモークテストのテストデータ掃除（本番 SQL Editor で Run）
--  '[[SMOKE]]' 印の friends/crews カードと合成スレを削除。
--  合成スレ削除で board_posts / board_reports / board_post_votes は CASCADE で消える。
-- ============================================================================

-- 合成スレを消す（→ posts/通報/投票が CASCADE）
delete from public.board_threads t using public.friends f
  where f.thread_id = t.id and f.title like '[[SMOKE]]%';
delete from public.board_threads t using public.crews c
  where c.thread_id = t.id and c.title like '[[SMOKE]]%';
-- 念のため孤立スレも
delete from public.board_threads
  where board in ('friends','crews') and title like '[[SMOKE]]%';

-- カード本体
delete from public.friends where title like '[[SMOKE]]%';
delete from public.crews   where title like '[[SMOKE]]%';

-- 確認（すべて 0）
select
  (select count(*) from public.friends where title like '[[SMOKE]]%')                                as friends_left,
  (select count(*) from public.crews   where title like '[[SMOKE]]%')                                as crews_left,
  (select count(*) from public.board_threads where board in ('friends','crews') and title like '[[SMOKE]]%') as threads_left;
