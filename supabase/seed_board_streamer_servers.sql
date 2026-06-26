-- ============================================================================
--  スト鯖掲示板（board='streamer-servers'）に、人気ストリーマー系GTA RPサーバーの
--  スレッドをあらかじめ投入するシード。Supabase → SQL Editor に貼って Run。
--
--  方針（gtarp-servers のシードと同じ）：
--   - 利用者が自由に語るための「鯖別スレ」。各サーバーの公式説明・自己紹介や、
--     公式の機能名・数字は使わない。1レス目は「〇〇について語ろう」系の話題出し。
--   - レスは一般的な感想・質問にとどめる。名前はすべて匿名（名無しさん）。
--   - 日付は約2か月前〜直近にばらけさせる。
--
--  ▼ サーバーを追加するには：末尾の「テンプレート」をコピーして名前と内容を変えるだけ。
--  ▼ 再実行時の重複防止のため、先頭で同名スレを削除している（レスはカスケード削除）。
-- ============================================================================

-- 再実行時の重複防止（このシードで作るスレをまとめて削除。レスも一緒に消える）
delete from public.board_threads
where board = 'streamer-servers'
  and title in (
    'ストグラ'
    -- ここに追加したサーバー名も並べておくと再実行時に重複しません
  );

-- ストグラ
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values (
    'streamer-servers',
    'ストグラ',
    5,
    now() - make_interval(days => 41, hours => 4),
    now() - make_interval(days => 2, hours => 1)
  )
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(days => v.d, hours => v.h)
from t cross join (values
  (1, '名無しさん', 'ストグラについて語るスレ。配信よく見てる人いる？推しの動きとか共有しよう', 41, 4),
  (2, '名無しさん', '最近見始めたけど人多くて追うの大変だわ', 33, 9),
  (3, '名無しさん', '誰のキャラから追うのがおすすめ？', 21, 2),
  (4, '名無しさん', '絡みが多い人を何人か追うと流れが分かりやすいよ', 12, 16),
  (5, '名無しさん', 'この前の事件めっちゃ盛り上がってたな', 2, 1)
) as v(n, nm, bd, d, h);

-- ============================================================================
--  ▼ サーバー追加テンプレート（コピーして名前・本文を変える）
--    1. 上の delete の title リストにサーバー名を追記
--    2. 下をコピーして 'サーバー名' と各レス本文を書き換え
-- ============================================================================
-- with t as (
--   insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
--   values ('streamer-servers', 'サーバー名', 3, now() - make_interval(days => 30, hours => 2), now() - make_interval(days => 5, hours => 1))
--   returning id
-- )
-- insert into public.board_posts (thread_id, post_number, name, body, created_at)
-- select t.id, v.n, v.nm, v.bd, now() - make_interval(days => v.d, hours => v.h)
-- from t cross join (values
--   (1, '名無しさん', 'サーバー名について語るスレ', 30, 2),
--   (2, '名無しさん', '雰囲気どんな感じ？', 18, 5),
--   (3, '名無しさん', '気になってるので入ってる人教えて', 5, 1)
-- ) as v(n, nm, bd, d, h);

-- ============================================================================
--  ▼ 全削除（このシードで作ったスト鯖スレを消したいとき）
-- delete from public.board_threads where board = 'streamer-servers';
-- ============================================================================
