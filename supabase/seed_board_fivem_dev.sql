-- ============================================================================
--  FiveM開発者交流掲示板（board='fivem-dev'）にダミースレッドを投入するシード。
--  自由スレ板。日時は6月上旬〜現在に分散させてある。
--  ※ 再実行（やり直し）できるよう、先に同タイトルの既存ダミーを削除してから投入する。
--  本物が増えたら Table Editor で削除可。末尾に一括削除SQLあり。
-- ============================================================================

-- 既存の同名ダミーを削除（posts は ON DELETE CASCADE で一緒に消える）
delete from public.board_threads where board = 'fivem-dev' and title in (
  'おすすめのレンタルサーバー教えて！','チート対策、みんなどうしてる','ESXとQBCore、これから始めるならどっち？',
  'txAdminのデプロイで詰まった、助けて','AIにFiveMのスクリプト書かせてる人いる？',
  '運営対応で疲れた人が集まるスレ','おすすめ無料MOD教えて！','サーバーの集客、どうやって人集めた？',
  'Discord BOT、何使ってる？','鯖の維持費、月いくらかかってる？'
);

-- スレ1: レンタルサーバー / VPS（6月上旬）
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('fivem-dev', 'おすすめのレンタルサーバー教えて！', 4, now() - interval '20 days', now() - interval '18 days')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(mins => v.ago)
from t cross join (values
  (1, '名無しさん', 'ローカルで動かせたから今度こそ公開鯖にしたい。日本で借りるならどこがいい？コスパ重視で', 28800),
  (2, '名無しさん', 'ConoHaかXserver VPSが無難。回線安定してるし日本語サポートあるのがでかい', 28680),
  (3, '名無しさん', '海外勢ならOVHとかも安いけど、Ping気にするなら国内一択かな', 27000),
  (4, '名無しさん', '最初は一番安いプランで十分。人増えてからメモリ盛ればいい', 25920)
) as v(n, nm, bd, ago);

-- スレ2: チート対策（6月初め〜最近まで伸びてる長寿スレ）
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('fivem-dev', 'チート対策、みんなどうしてる', 5, now() - interval '22 days', now() - interval '1 day')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(mins => v.ago)
from t cross join (values
  (1, '名無しさん', '小規模鯖だけどmod menu持ち込まれて荒らされた。みんな何入れてる？', 31680),
  (2, '名無しさん', 'まずはtxAdminのban機能とログ監視。基本だけど抑止力になる', 31000),
  (3, '名無しさん', 'FiveM標準のアンチチートはあるけど過信は禁物。怪しい挙動は手動でも見る', 20000),
  (4, '名無しさん', 'サーバー側でイベントの検証ちゃんと書くのが結局一番効く。クライアント信用しないのが鉄則', 8000),
  (5, '名無しさん', '↑これ。リソース入れる前に自前のスクリプトの穴を塞ぐのが先だった', 1440)
) as v(n, nm, bd, ago);

-- スレ3: ESX vs QBCore（6月中旬）
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('fivem-dev', 'ESXとQBCore、これから始めるならどっち？', 4, now() - interval '13 days', now() - interval '12 days')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(mins => v.ago)
from t cross join (values
  (1, '名無しさん', '生活系の鯖作りたい。今から学ぶならESXとQBCoreどっちがいい？', 18720),
  (2, '名無しさん', '日本語の情報量ならESXが多い印象。QBは新しめでモダンだけど資料が英語寄り', 18600),
  (3, '名無しさん', 'どっち触っても考え方は似てるから、最終的に使いたいリソースが多い方でいいと思う', 17600),
  (4, '名無しさん', '最初は無理にフレームワーク入れず、standaloneで小さく作って構造覚えるのもアリ', 17280)
) as v(n, nm, bd, ago);

-- スレ4: txAdmin デプロイで詰まった（6月下旬）
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('fivem-dev', 'txAdminのデプロイで詰まった、助けて', 3, now() - interval '7 days', now() - interval '6 days')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(mins => v.ago)
from t cross join (values
  (1, '名無しさん', 'レシピ選んでデプロイしたらライセンスキー関連で止まる。cfxk_のキーは入れたんだけど', 10080),
  (2, '名無しさん', 'キーの前後にスペース入ってない？コピペでよくやらかすやつ', 9900),
  (3, '名無しさん', '直った…余計な空白だった。ありがとう助かった', 8640)
) as v(n, nm, bd, ago);

-- スレ5: AIでスクリプト（直近）
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('fivem-dev', 'AIにFiveMのスクリプト書かせてる人いる？', 3, now() - interval '2 days', now() - interval '3 hours')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(mins => v.ago)
from t cross join (values
  (1, '名無しさん', '最近AIに簡単なリソース書かせてるんだけど、意外とちゃんと動く。みんな使ってる？', 2880),
  (2, '名無しさん', 'fxmanifest.luaの雛形作らせると楽。細かいイベント周りは結局自分で直すけど', 1500),
  (3, '名無しさん', 'たたき台作るのには便利だよね。構造理解してないと修正できないのは変わらないけど', 180)
) as v(n, nm, bd, ago);

-- スレ6: 運営の愚痴（6月上旬〜最近まで伸びる長寿スレ）
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('fivem-dev', '運営対応で疲れた人が集まるスレ', 6, now() - interval '19 days', now() - interval '3 days')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(mins => v.ago)
from t cross join (values
  (1, '名無しさん', '荒らし対応に追われて正直しんどい。同じ運営の人いる？', 27360),
  (2, '名無しさん', 'わかる。ルール説明しても聞かない人ほんと多い', 27000),
  (3, '名無しさん', 'BANしてもサブ垢で戻ってくるのが一番きつい', 20000),
  (4, '名無しさん', 'ログ見てる時間で一日終わるときある…', 12000),
  (5, '名無しさん', '理不尽なクレーム来ると心折れるよな', 6000),
  (6, '名無しさん', 'たまには運営同士で愚痴るの大事。みんな無理すんなよ', 4320)
) as v(n, nm, bd, ago);

-- スレ7: おすすめ無料MOD（教え合うスレ・レスは軽め）
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('fivem-dev', 'おすすめ無料MOD教えて！', 4, now() - interval '16 days', now() - interval '15 days')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(mins => v.ago)
from t cross join (values
  (1, '名無しさん', '無料で入れられるおすすめMODある？定番でいいから教えて', 23040),
  (2, '名無しさん', 'vMenuは鉄板。管理にも使えるし最初に入れるべき', 22900),
  (3, '名無しさん', 'pma-voice入れとくと幸せになれる。ボイス周り安定する', 22000),
  (4, '名無しさん', 'マップ系ならCodeWalkerで自作も楽しいよ', 21600)
) as v(n, nm, bd, ago);

-- スレ8: 集客（6月中旬）
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('fivem-dev', 'サーバーの集客、どうやって人集めた？', 4, now() - interval '11 days', now() - interval '10 days')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(mins => v.ago)
from t cross join (values
  (1, '名無しさん', 'オープンしたけど人が来ない…みんなどうやって集めた？', 15840),
  (2, '名無しさん', 'Disboardとxでの告知が基本。あと配信者に来てもらえると一気に伸びる', 15600),
  (3, '名無しさん', '最初は身内で賑やかしして、雰囲気作るのが大事だった', 14800),
  (4, '名無しさん', 'GTA6 FEEDの募集板にも載せた。地味に流入あるよ', 14400)
) as v(n, nm, bd, ago);

-- スレ9: Discord BOT（6月中旬〜下旬）
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('fivem-dev', 'Discord BOT、何使ってる？', 3, now() - interval '8 days 6 hours', now() - interval '8 days')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(mins => v.ago)
from t cross join (values
  (1, '名無しさん', 'サーバー運営でおすすめのDiscord BOTある？', 11880),
  (2, '名無しさん', 'txAdminの通知連携と、申請管理系のBOTは助かる', 11700),
  (3, '名無しさん', 'ticket系BOT入れると問い合わせ対応が楽になった', 11520)
) as v(n, nm, bd, ago);

-- スレ10: 維持費（6月下旬）
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('fivem-dev', '鯖の維持費、月いくらかかってる？', 3, now() - interval '5 days', now() - interval '4 days')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(mins => v.ago)
from t cross join (values
  (1, '名無しさん', 'みんな鯖の維持費って月いくらくらい？参考にしたい', 7200),
  (2, '名無しさん', 'うちは小規模VPSで月2000円くらい。人増えたら上げる予定', 7000),
  (3, '名無しさん', 'DB分けたりすると上がるけど、最初は安いので十分だと思う', 5760)
) as v(n, nm, bd, ago);

-- ▼ あとでこのダミースレ（fivem-dev掲示板ぶん）をまとめて削除したいとき:
-- delete from public.board_threads where board = 'fivem-dev' and title in (
--   'おすすめのレンタルサーバー教えて！','チート対策、みんなどうしてる','ESXとQBCore、これから始めるならどっち？',
--   'txAdminのデプロイで詰まった、助けて','AIにFiveMのスクリプト書かせてる人いる？',
--   '運営対応で疲れた人が集まるスレ','おすすめ無料MOD教えて！','サーバーの集客、どうやって人集めた？',
--   'Discord BOT、何使ってる？','鯖の維持費、月いくらかかってる？'
-- );
