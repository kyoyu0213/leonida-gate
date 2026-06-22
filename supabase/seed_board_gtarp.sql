-- ============================================================================
--  GTARPプレイヤー交流掲示板（board='gtarp'）にダミースレッドを投入するシード。
--  本物が増えたら Table Editor で削除可。末尾コメントに一括削除SQLあり。
-- ============================================================================

-- スレ1: 初心者おすすめサーバー
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gtarp', '初心者におすすめのRPサーバー教えて', 4, now() - interval '4 hours', now() - interval '3 hours')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(mins => v.ago)
from t cross join (values
  (1, '名無しさん', 'FiveM始めたばかり。日本語で初心者歓迎のサーバーないかな', 240),
  (2, '名無しさん', 'ホワイトリスト緩めで人が多いとこがいいよ。まずは雰囲気見るのが大事', 220),
  (3, '名無しさん', '最初はチュートリアルが丁寧なとこ選ぶといい', 200),
  (4, '名無しさん', 'Discordで質問しやすいサーバーが結局長く続くよ', 180)
) as v(n, nm, bd, ago);

-- スレ2: ホワイトリスト審査
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gtarp', 'ホワイトリスト審査、何聞かれた？', 3, now() - interval '7 hours', now() - interval '6 hours')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(mins => v.ago)
from t cross join (values
  (1, '名無しさん', '来週面接ある。だいたい何聞かれるの？', 420),
  (2, '名無しさん', 'RPの基本ルール理解してるか、キャラ設定、年齢確認とかだったよ', 390),
  (3, '名無しさん', '正直に答えれば大丈夫。設定をガチガチに作らなくてもOK', 360)
) as v(n, nm, bd, ago);

-- スレ3: OOC論争
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gtarp', 'RP中のOOC（メタ発言）、どこまで許容する？', 3, now() - interval '1 hour', now() - interval '35 minutes')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(mins => v.ago)
from t cross join (values
  (1, '名無しさん', '戦闘中にメタ発言する人がいてちょっと萎えた', 60),
  (2, '名無しさん', '緊急時以外はIC徹底してほしいよね', 48),
  (3, '名無しさん', '初心者はうっかりやりがちだから、優しく指摘してあげよう', 35)
) as v(n, nm, bd, ago);

-- スレ4: 最初の職業
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gtarp', '初めての職業、何がおすすめ？', 4, now() - interval '1 day', now() - interval '22 hours')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(mins => v.ago)
from t cross join (values
  (1, '名無しさん', '警察と一般職、どっちから始めるべき？', 1440),
  (2, '名無しさん', '最初は一般職で街に慣れるのがおすすめ。警察は責任重いよ', 1410),
  (3, '名無しさん', '運送系は一人でもできて稼ぎやすいからおすすめ', 1380),
  (4, '名無しさん', '医者は人との関わりが多くてRP上達するからアリ', 1350)
) as v(n, nm, bd, ago);

-- スレ5: ボイスRP
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gtarp', 'ボイスRP緊張する…慣れるもの？', 2, now() - interval '20 minutes', now() - interval '8 minutes')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(mins => v.ago)
from t cross join (values
  (1, '名無しさん', 'マイク使うの恥ずかしくて、ついテキストばっかになっちゃう', 20),
  (2, '名無しさん', '最初はみんなそう。数回やれば慣れるから大丈夫', 8)
) as v(n, nm, bd, ago);

-- ▼ あとでこのダミースレ（gtarp掲示板ぶん）をまとめて削除したいとき:
-- delete from public.board_threads where board = 'gtarp' and title in (
--   '初心者におすすめのRPサーバー教えて','ホワイトリスト審査、何聞かれた？','RP中のOOC（メタ発言）、どこまで許容する？',
--   '初めての職業、何がおすすめ？','ボイスRP緊張する…慣れるもの？'
-- );
