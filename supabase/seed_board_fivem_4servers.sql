-- ============================================================================
--  FiveMサーバー掲示板（board='gtarp-servers'）に4サーバーのスレッドを追加するシード。
--  連投制限を回避するため、SQL Editor にまとめて貼って Run する用。
--
--  追加サーバー：さくら島／Refloria Town／PWRP／Endless Happiness
--
--  方針（既存シードと同じ）：
--   - 利用者が自由に語るための「鯖別スレ」。公式説明・自己紹介や公式の機能名・数字は使わない。
--   - 1レス目は「〇〇について語ろう」系の話題出し。レスは一般的な感想・質問にとどめる。
--   - 名前はすべて匿名（名無しさん）。
--   - スレ作成日時・レス投稿日時はばらけさせる（days/hours で散らす）。
--
--  再実行時の重複防止のため、先頭で同名スレを削除している（レスはカスケード削除）。
-- ============================================================================

delete from public.board_threads where board = 'gtarp-servers' and title in (
  'さくら島','Refloria Town','PWRP','Endless Happiness'
);

-- さくら島（約52日前作成・4レス）
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gtarp-servers', 'さくら島', 4, now() - make_interval(days => 52, hours => 6), now() - make_interval(days => 6, hours => 3))
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(days => v.d, hours => v.h)
from t cross join (values
  (1, '名無しさん', 'さくら島について語ろう。雰囲気とか人の入りどんな感じ？', 52, 6),
  (2, '名無しさん', '名前よく見るけど実際どうなんだろ', 44, 13),
  (3, '名無しさん', 'この前ちょっと入ってみたけど親切な人多かった', 30, 9),
  (4, '名無しさん', '初心者でも馴染みやすい感じ？気になってる', 6, 3)
) as v(n, nm, bd, d, h);

-- Refloria Town（約38日前作成・3レス）
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gtarp-servers', 'Refloria Town', 3, now() - make_interval(days => 38, hours => 2), now() - make_interval(days => 11, hours => 5))
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(days => v.d, hours => v.h)
from t cross join (values
  (1, '名無しさん', 'Refloria Townってどんな鯖？入ってる人いたら教えて', 38, 2),
  (2, '名無しさん', '最近名前見るようになった気がする', 27, 16),
  (3, '名無しさん', '雰囲気よさそうだから気になってる', 11, 5)
) as v(n, nm, bd, d, h);

-- PWRP（約26日前作成・5レス）
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gtarp-servers', 'PWRP', 5, now() - make_interval(days => 26, hours => 8), now() - make_interval(days => 3, hours => 1))
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(days => v.d, hours => v.h)
from t cross join (values
  (1, '名無しさん', 'PWRPについて語るスレ。住み心地どう？', 26, 8),
  (2, '名無しさん', '人多い時間帯っていつ頃？', 22, 14),
  (3, '名無しさん', '平日夜はそこそこ見かけるイメージ', 15, 7),
  (4, '名無しさん', 'この前覗いたら賑わってた', 7, 10),
  (5, '名無しさん', '続けてる人多そうで良いね', 3, 1)
) as v(n, nm, bd, d, h);

-- Endless Happiness（約17日前作成・4レス）
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gtarp-servers', 'Endless Happiness', 4, now() - make_interval(days => 17, hours => 4), now() - make_interval(days => 1, hours => 2))
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(days => v.d, hours => v.h)
from t cross join (values
  (1, '名無しさん', 'Endless Happinessってどんな感じ？気になってる', 17, 4),
  (2, '名無しさん', '名前が良いな、雰囲気も良さそう', 12, 9),
  (3, '名無しさん', '入ってる人いる？感想聞きたい', 5, 6),
  (4, '名無しさん', 'のんびり系っぽくて気になってる', 1, 2)
) as v(n, nm, bd, d, h);

-- ============================================================================
--  ▼ 全削除（このシードで作った4スレを消したいとき）
-- delete from public.board_threads where board = 'gtarp-servers'
--   and title in ('さくら島','Refloria Town','PWRP','Endless Happiness');
-- ============================================================================
