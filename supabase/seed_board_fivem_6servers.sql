-- ============================================================================
--  FiveMサーバー掲示板（board='gtarp-servers'）に6サーバーのスレッドを追加するシード。
--  連投制限を回避するため、SQL Editor にまとめて貼って Run する用（第2弾）。
--
--  追加サーバー：GMC／IF city／Flecity RP／Azure city／35VILLAGE／Mio city
--
--  方針（既存シードと同じ）：
--   - 利用者が自由に語るための「鯖別スレ」。公式説明・自己紹介や公式の機能名・数字は使わない。
--   - 1レス目は「〇〇について語ろう」系の話題出し。レスは一般的な感想・質問にとどめる。
--   - 名前はすべて匿名（名無しさん）。
--   - スレ作成日時・レス投稿日時はばらけさせる。一覧の並び・「更新」表示は last_posted_at を
--     使うので、最後のレスの日時＝last_posted_at に合わせている。
--
--  再実行時の重複防止のため、先頭で同名スレを削除している（レスはカスケード削除）。
--  ※ 既にこのスレへ実投稿が付いている場合、再実行すると消えるので注意。
-- ============================================================================

delete from public.board_threads where board = 'gtarp-servers' and title in (
  'GMC','IF city','Flecity RP','Azure city','35VILLAGE','Mio city'
);

-- GMC（約60日前作成・4レス・最終8日前）
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gtarp-servers', 'GMC', 4, now() - make_interval(days => 60, hours => 5), now() - make_interval(days => 8, hours => 3))
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(days => v.d, hours => v.h)
from t cross join (values
  (1, '名無しさん', 'GMCってどんな鯖？雰囲気とか人の入り教えて', 60, 5),
  (2, '名無しさん', '名前は聞くけど入ったことないな', 48, 12),
  (3, '名無しさん', 'この前少し覗いたら落ち着いた感じだった', 26, 7),
  (4, '名無しさん', '初心者でも大丈夫そう？気になってる', 8, 3)
) as v(n, nm, bd, d, h);

-- IF city（約47日前作成・3レス・最終19日前）
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gtarp-servers', 'IF city', 3, now() - make_interval(days => 47, hours => 9), now() - make_interval(days => 19, hours => 6))
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(days => v.d, hours => v.h)
from t cross join (values
  (1, '名無しさん', 'IF cityについて語ろう。人の入りどんな感じ？', 47, 9),
  (2, '名無しさん', '最近名前見るようになった気がする', 31, 4),
  (3, '名無しさん', '雰囲気よさそうで気になってる', 19, 6)
) as v(n, nm, bd, d, h);

-- Flecity RP（約33日前作成・5レス・最終4日前）
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gtarp-servers', 'Flecity RP', 5, now() - make_interval(days => 33, hours => 6), now() - make_interval(days => 4, hours => 2))
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(days => v.d, hours => v.h)
from t cross join (values
  (1, '名無しさん', 'Flecity RPってどんな感じ？住み心地語ろう', 33, 6),
  (2, '名無しさん', '人多い時間帯っていつ頃？', 28, 15),
  (3, '名無しさん', '平日でもそこそこ見かけるイメージ', 18, 8),
  (4, '名無しさん', 'この前入ったら賑わってた', 10, 11),
  (5, '名無しさん', '続けてる人多そうでいいね', 4, 2)
) as v(n, nm, bd, d, h);

-- Azure city（約28日前作成・4レス・最終13日前）
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gtarp-servers', 'Azure city', 4, now() - make_interval(days => 28, hours => 7), now() - make_interval(days => 13, hours => 9))
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(days => v.d, hours => v.h)
from t cross join (values
  (1, '名無しさん', 'Azure cityについて語るスレ。雰囲気どう？', 28, 7),
  (2, '名無しさん', '名前おしゃれだな、気になる', 22, 13),
  (3, '名無しさん', 'ちょっと覗いたけど親切な人多かった', 17, 5),
  (4, '名無しさん', '初心者歓迎な感じ？入ってみたい', 13, 9)
) as v(n, nm, bd, d, h);

-- 35VILLAGE（約20日前作成・3レス・最終9日前）
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gtarp-servers', '35VILLAGE', 3, now() - make_interval(days => 20, hours => 4), now() - make_interval(days => 9, hours => 3))
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(days => v.d, hours => v.h)
from t cross join (values
  (1, '名無しさん', '35VILLAGEってどんな鯖？入ってる人いる？', 20, 4),
  (2, '名無しさん', '名前インパクトあるなw', 14, 10),
  (3, '名無しさん', '雰囲気気になるから誰か感想ほしい', 9, 3)
) as v(n, nm, bd, d, h);

-- Mio city（約12日前作成・5レス・最終2日前）
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gtarp-servers', 'Mio city', 5, now() - make_interval(days => 12, hours => 6), now() - make_interval(days => 2, hours => 1))
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(days => v.d, hours => v.h)
from t cross join (values
  (1, '名無しさん', 'Mio cityについて語ろう。住み心地どう？', 12, 6),
  (2, '名無しさん', '最近できた感じ？名前見るようになった', 10, 14),
  (3, '名無しさん', 'この前覗いたら結構人いた', 7, 8),
  (4, '名無しさん', 'のんびりできそうで気になってる', 4, 5),
  (5, '名無しさん', '続けやすそうでいいね', 2, 1)
) as v(n, nm, bd, d, h);

-- ============================================================================
--  ▼ 全削除（このシードで作った6スレを消したいとき）
-- delete from public.board_threads where board = 'gtarp-servers'
--   and title in ('GMC','IF city','Flecity RP','Azure city','35VILLAGE','Mio city');
-- ============================================================================
