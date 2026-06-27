-- ============================================================================
--  FiveM開発者交流掲示板（board='fivem-dev'）にダミースレッドを投入するシード。
--  自由スレ板。本物が増えたら Table Editor で削除可。末尾に一括削除SQLあり。
-- ============================================================================

-- スレ1: レンタルサーバー / VPS
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('fivem-dev', 'おすすめのレンタルサーバー教えて！', 4, now() - interval '5 hours', now() - interval '4 hours')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(mins => v.ago)
from t cross join (values
  (1, '名無しさん', 'ローカルで動かせたから今度こそ公開鯖にしたい。日本で借りるならどこがいい？コスパ重視で', 300),
  (2, '名無しさん', 'ConoHaかXserver VPSが無難。回線安定してるし日本語サポートあるのがでかい', 285),
  (3, '名無しさん', '海外勢ならOVHとかも安いけど、Ping気にするなら国内一択かな', 260),
  (4, '名無しさん', '最初は一番安いプランで十分。人増えてからメモリ盛ればいい', 240)
) as v(n, nm, bd, ago);

-- スレ2: チート対策
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('fivem-dev', 'チート対策、みんなどうしてる', 5, now() - interval '2 days', now() - interval '5 hours')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(mins => v.ago)
from t cross join (values
  (1, '名無しさん', '小規模鯖だけどmod menu持ち込まれて荒らされた。みんな何入れてる？', 2880),
  (2, '名無しさん', 'まずはtxAdminのban機能とログ監視。基本だけど抑止力になる', 2850),
  (3, '名無しさん', 'FiveM標準のアンチチートはあるけど過信は禁物。怪しい挙動は手動でも見る', 1500),
  (4, '名無しさん', 'サーバー側でイベントの検証ちゃんと書くのが結局一番効く。クライアント信用しないのが鉄則', 700),
  (5, '名無しさん', '↑これ。リソース入れる前に自前のスクリプトの穴を塞ぐのが先だった', 300)
) as v(n, nm, bd, ago);

-- スレ3: ESX vs QBCore
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('fivem-dev', 'ESXとQBCore、これから始めるならどっち？', 4, now() - interval '1 day', now() - interval '20 hours')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(mins => v.ago)
from t cross join (values
  (1, '名無しさん', '生活系の鯖作りたい。今から学ぶならESXとQBCoreどっちがいい？', 1440),
  (2, '名無しさん', '日本語の情報量ならESXが多い印象。QBは新しめでモダンだけど資料が英語寄り', 1410),
  (3, '名無しさん', 'どっち触っても考え方は似てるから、最終的に使いたいリソースが多い方でいいと思う', 1300),
  (4, '名無しさん', '最初は無理にフレームワーク入れず、standaloneで小さく作って構造覚えるのもアリ', 1200)
) as v(n, nm, bd, ago);

-- スレ4: txAdmin デプロイで詰まった
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('fivem-dev', 'txAdminのデプロイで詰まった、助けて', 3, now() - interval '3 hours', now() - interval '2 hours')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(mins => v.ago)
from t cross join (values
  (1, '名無しさん', 'レシピ選んでデプロイしたらライセンスキー関連で止まる。cfxk_のキーは入れたんだけど', 180),
  (2, '名無しさん', 'キーの前後にスペース入ってない？コピペでよくやらかすやつ', 150),
  (3, '名無しさん', '直った…余計な空白だった。ありがとう助かった', 120)
) as v(n, nm, bd, ago);

-- スレ5: AIでスクリプト
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('fivem-dev', 'AIにFiveMのスクリプト書かせてる人いる？', 3, now() - interval '40 minutes', now() - interval '12 minutes')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(mins => v.ago)
from t cross join (values
  (1, '名無しさん', '最近AIに簡単なリソース書かせてるんだけど、意外とちゃんと動く。みんな使ってる？', 40),
  (2, '名無しさん', 'fxmanifest.luaの雛形作らせると楽。細かいイベント周りは結局自分で直すけど', 25),
  (3, '名無しさん', 'たたき台作るのには便利だよね。構造理解してないと修正できないのは変わらないけど', 12)
) as v(n, nm, bd, ago);

-- ▼ あとでこのダミースレ（fivem-dev掲示板ぶん）をまとめて削除したいとき:
-- delete from public.board_threads where board = 'fivem-dev' and title in (
--   'おすすめのレンタルサーバー教えて！','チート対策、みんなどうしてる','ESXとQBCore、これから始めるならどっち？',
--   'txAdminのデプロイで詰まった、助けて','AIにFiveMのスクリプト書かせてる人いる？'
-- );
