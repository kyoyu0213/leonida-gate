-- ============================================================================
--  GTARP鯖別掲示板（board='gtarp-servers'）に各サーバー専用スレッドを投入するシード。
--  ※ KataCity（既存）／STGR For Viewers・同 Casual（パトロン支援者向け）は除外。
--  本物の運用に切り替えたら Table Editor で削除可。末尾に一括削除SQLあり。
--
--  方針：これは利用者が自由に語るための「鯖別スレ」。各サーバーの公式説明・自己紹介は
--  使わず、1レス目は「〇〇について語ろう」系の話題出しにする。レスも公式の機能名・数字を
--  引用しない、一般的な感想・質問にとどめる（勝手に立てているため公式情報は使わない）。
--  日付は約2か月前〜直近にばらけさせる。名前はすべて匿名（名無しさん）。
-- ============================================================================

-- 既存の鯖別ダミースレを削除（レスはカスケードで一緒に消える）。再実行時の重複防止も兼ねる。
delete from public.board_threads where board = 'gtarp-servers' and title in (
  'ClownRP 本番環境','Hideout City','ココットランド','Turtle City（11月1日オープン）','HeliosCity',
  'マシュマロシティ','ラフシティ','Raftel City season2','ウィズグラ','Lien City',
  'ASCENT LA','NOVARIS TOWN','AZUA CITY 2','NMGR 本番環境'
);

-- ClownRP 本番環境
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gtarp-servers', 'ClownRP 本番環境', 4, now() - make_interval(days => 58, hours => 5), now() - make_interval(days => 9, hours => 2))
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(days => v.d, hours => v.h)
from t cross join (values
  (1, '名無しさん', 'ClownRPってぶっちゃけどう？住み心地とか人の多さとか語ろう', 58, 5),
  (2, '名無しさん', '週末は結構人いるって聞いた', 50, 12),
  (3, '名無しさん', 'この前ちょっと覗いたけど賑やかだった', 31, 8),
  (4, '名無しさん', '長く続けてる人多いイメージある', 9, 2)
) as v(n, nm, bd, d, h);

-- Hideout City
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gtarp-servers', 'Hideout City', 3, now() - make_interval(days => 55, hours => 9), now() - make_interval(days => 22, hours => 3))
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(days => v.d, hours => v.h)
from t cross join (values
  (1, '名無しさん', 'Hideout City気になってるんだけど、入ってる人いたら雰囲気教えて', 55, 9),
  (2, '名無しさん', '落ち着いた感じって噂は聞いたことある', 41, 6),
  (3, '名無しさん', '少人数でも濃く遊べるなら良さそうだね', 22, 3)
) as v(n, nm, bd, d, h);

-- ココットランド
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gtarp-servers', 'ココットランド', 4, now() - make_interval(days => 52, hours => 2), now() - make_interval(days => 6, hours => 7))
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(days => v.d, hours => v.h)
from t cross join (values
  (1, '名無しさん', 'ココットランドについて語るスレ。実際どんな感じか知りたい', 52, 2),
  (2, '名無しさん', 'キャラ作り込める系は好きだから気になる', 44, 18),
  (3, '名無しさん', 'おしゃれ好きには合いそうな雰囲気', 25, 10),
  (4, '名無しさん', '最近人増えてる気がするね', 6, 7)
) as v(n, nm, bd, d, h);

-- Turtle City
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gtarp-servers', 'Turtle City（11月1日オープン）', 3, now() - make_interval(days => 49, hours => 14), now() - make_interval(days => 18, hours => 5))
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(days => v.d, hours => v.h)
from t cross join (values
  (1, '名無しさん', 'Turtle Cityって新しくできた鯖だよね。入ろうか迷ってるから語ろう', 49, 14),
  (2, '名無しさん', '新鯖は最初に入ると馴染みやすいよね', 37, 9),
  (3, '名無しさん', '運営の方針次第で伸びそうな気がする', 18, 5)
) as v(n, nm, bd, d, h);

-- HeliosCity
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gtarp-servers', 'HeliosCity', 4, now() - make_interval(days => 60, hours => 8), now() - make_interval(days => 11, hours => 4))
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(days => v.d, hours => v.h)
from t cross join (values
  (1, '名無しさん', 'HeliosCity住んでる人いる？雰囲気とか教えてほしい', 60, 8),
  (2, '名無しさん', '初心者でもいけるのか気になってる', 46, 15),
  (3, '名無しさん', 'お店持てる系好きだから興味ある', 33, 11),
  (4, '名無しさん', 'ちょっと前に始めたけど楽しいよ', 11, 4)
) as v(n, nm, bd, d, h);

-- マシュマロシティ
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gtarp-servers', 'マシュマロシティ', 3, now() - make_interval(days => 45, hours => 3), now() - make_interval(days => 14, hours => 9))
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(days => v.d, hours => v.h)
from t cross join (values
  (1, '名無しさん', 'マシュマロシティってどう？住み心地を語ろうぜ', 45, 3),
  (2, '名無しさん', '居心地いいって聞いたことあるな', 30, 13),
  (3, '名無しさん', '雰囲気やわらかいなら新規でも安心かも', 14, 9)
) as v(n, nm, bd, d, h);

-- ラフシティ
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gtarp-servers', 'ラフシティ', 4, now() - make_interval(days => 42, hours => 11), now() - make_interval(days => 3, hours => 6))
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(days => v.d, hours => v.h)
from t cross join (values
  (1, '名無しさん', 'ラフシティの話しよう。どんな街か気になってる', 42, 11),
  (2, '名無しさん', 'にぎやかそうな印象あるけど実際どうなんだろ', 28, 16),
  (3, '名無しさん', '夜でも人いるのはありがたいよね', 13, 7),
  (4, '名無しさん', 'ギャング系の動きが活発って噂は聞いた', 3, 6)
) as v(n, nm, bd, d, h);

-- Raftel City season2
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gtarp-servers', 'Raftel City season2', 3, now() - make_interval(days => 39, hours => 7), now() - make_interval(days => 8, hours => 2))
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(days => v.d, hours => v.h)
from t cross join (values
  (1, '名無しさん', 'Raftel City season2どう？前のシーズンからやってる人いる？', 39, 7),
  (2, '名無しさん', 's2から始めても大丈夫なのか気になる', 26, 12),
  (3, '名無しさん', '街の作り込み進んでるらしいね', 8, 2)
) as v(n, nm, bd, d, h);

-- ウィズグラ
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gtarp-servers', 'ウィズグラ', 3, now() - make_interval(days => 36, hours => 13), now() - make_interval(days => 10, hours => 8))
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(days => v.d, hours => v.h)
from t cross join (values
  (1, '名無しさん', 'ウィズグラ気になってるんだけど、雰囲気どんな感じ？', 36, 13),
  (2, '名無しさん', '穏やかにRPしたい人向けって感じなのかな', 23, 10),
  (3, '名無しさん', 'のんびり勢には合いそうだね', 10, 8)
) as v(n, nm, bd, d, h);

-- Lien City
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gtarp-servers', 'Lien City', 3, now() - make_interval(days => 33, hours => 4), now() - make_interval(days => 7, hours => 5))
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(days => v.d, hours => v.h)
from t cross join (values
  (1, '名無しさん', 'Lien Cityってどんなとこ？入ってる人いたら教えて', 33, 4),
  (2, '名無しさん', '英語表記だけど日本人もいるって聞いたよ', 20, 14),
  (3, '名無しさん', 'じっくり遊べる系なら気になるな', 7, 5)
) as v(n, nm, bd, d, h);

-- ASCENT LA
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gtarp-servers', 'ASCENT LA', 4, now() - make_interval(days => 30, hours => 10), now() - make_interval(days => 2, hours => 3))
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(days => v.d, hours => v.h)
from t cross join (values
  (1, '名無しさん', 'ASCENT LAについて語ろう。実際の雰囲気が知りたい', 30, 10),
  (2, '名無しさん', '撃ち合いメインの人にはどうなんだろ', 18, 16),
  (3, '名無しさん', 'PVP好きが集まってるって噂は聞いた', 9, 7),
  (4, '名無しさん', 'ガチ勢多そうなイメージあるな', 2, 3)
) as v(n, nm, bd, d, h);

-- NOVARIS TOWN
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gtarp-servers', 'NOVARIS TOWN', 3, now() - make_interval(days => 27, hours => 6), now() - make_interval(days => 5, hours => 9))
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(days => v.d, hours => v.h)
from t cross join (values
  (1, '名無しさん', 'NOVARIS TOWN気になる。入った人いたら語ろう', 27, 6),
  (2, '名無しさん', 'やること多いって聞いたけどどうなんだろ', 15, 11),
  (3, '名無しさん', '一人でも黙々遊べるなら良いな', 5, 9)
) as v(n, nm, bd, d, h);

-- AZUA CITY 2
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gtarp-servers', 'AZUA CITY 2', 3, now() - make_interval(days => 24, hours => 12), now() - make_interval(days => 4, hours => 2))
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(days => v.d, hours => v.h)
from t cross join (values
  (1, '名無しさん', 'AZUA CITY 2の話するスレ。雰囲気とか教えて', 24, 12),
  (2, '名無しさん', 'コミュニティ温かいって評判みたことある', 13, 15),
  (3, '名無しさん', '常連の距離感ちょうど良さそうだね', 4, 2)
) as v(n, nm, bd, d, h);

-- NMGR 本番環境
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gtarp-servers', 'NMGR 本番環境', 3, now() - make_interval(days => 21, hours => 9), now() - make_interval(days => 1, hours => 4))
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(days => v.d, hours => v.h)
from t cross join (values
  (1, '名無しさん', 'NMGRって最近の鯖だよね。どんな感じか語ろう', 21, 9),
  (2, '名無しさん', 'できたばかりだと今が入りどきかも', 10, 13),
  (3, '名無しさん', '新規多そうだし馴染みやすそうだね', 1, 4)
) as v(n, nm, bd, d, h);

-- ▼ あとでこの鯖別ダミースレをまとめて削除したいとき:
-- delete from public.board_threads where board = 'gtarp-servers' and title in (
--   'ClownRP 本番環境','Hideout City','ココットランド','Turtle City（11月1日オープン）','HeliosCity',
--   'マシュマロシティ','ラフシティ','Raftel City season2','ウィズグラ','Lien City',
--   'ASCENT LA','NOVARIS TOWN','AZUA CITY 2','NMGR 本番環境'
-- );
