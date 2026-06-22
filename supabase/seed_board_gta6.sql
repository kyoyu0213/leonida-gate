-- ============================================================================
--  GTA6情報交換掲示板（board='gta6'）にダミースレッドを投入するシード。
--  掲示板が寂しくないように一時的に表示する用。本物が増えたら Table Editor で削除可。
--  まとめて消したいときは末尾のコメントのSQLを実行。
-- ============================================================================

-- スレ1: トレーラー
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gta6', '第3弾トレーラー、6/25に来ると思う？', 3, now() - interval '3 hours', now() - interval '2 hours')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(mins => v.ago)
from t cross join (values
  (1, '名無しさん', 'プレオーダー6/25開始だし、同時に第3弾トレーラー来るって読みが多いよな', 180),
  (2, '名無しさん', 'Rockstarは公式に日付言ってないからまだ油断できない。予約だけ先行もありえる', 150),
  (3, '名無しさん', '過去のパターン的にはそろそろゲームプレイトレーラー欲しいわ', 120)
) as v(n, nm, bd, ago);

-- スレ2: 主人公
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gta6', 'ルシアが主人公なの胸熱すぎる', 4, now() - interval '50 minutes', now() - interval '25 minutes')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(mins => v.ago)
from t cross join (values
  (1, '名無しさん', 'メインラインで初の本格女性主人公だよね。ボニー&クライド感ある', 50),
  (2, '名無しさん', 'ジェイソンとの関係性がどう描かれるか楽しみ', 42),
  (3, '名無しさん', 'トレーラーの刑務所出所シーンかっこよかった', 33),
  (4, '名無しさん', '結局2人を自由に切り替えできるのかだけ気になる', 25)
) as v(n, nm, bd, ago);

-- スレ3: Switch2
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gta6', 'Switch2版って結局出るの？', 3, now() - interval '6 hours', now() - interval '5 hours')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(mins => v.ago)
from t cross join (values
  (1, '名無しさん', 'リーカーは開発してるって言ってるけど、発売時は無理っぽいな', 360),
  (2, '名無しさん', '性能的にきつそう。出ても2027以降でしょ', 330),
  (3, '名無しさん', 'クラウド版ならワンチャンあるかも？でも遅延が心配', 300)
) as v(n, nm, bd, ago);

-- スレ4: マップ
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gta6', 'マップGTA5の2倍、移動だるくならない？', 3, now() - interval '1 day', now() - interval '20 hours')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(mins => v.ago)
from t cross join (values
  (1, '名無しさん', '広いのは嬉しいけど、移動が単調だと逆に疲れるんだよな', 1440),
  (2, '名無しさん', 'ファストトラベルちゃんとしてほしいわ', 1320),
  (3, '名無しさん', 'RDR2みたいに移動自体が楽しいならアリ', 1200)
) as v(n, nm, bd, ago);

-- スレ5: 発売待ち
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gta6', '発売まであと約5ヶ月、待ちきれん', 2, now() - interval '15 minutes', now() - interval '5 minutes')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, now() - make_interval(mins => v.ago)
from t cross join (values
  (1, '名無しさん', '11/19が待ち遠しすぎる…毎日トレーラー見返してる', 15),
  (2, '名無しさん', '延期だけはもう勘弁してくれ…', 5)
) as v(n, nm, bd, ago);

-- ▼ あとでこのダミースレ（gta6掲示板ぶん）をまとめて削除したいとき:
-- delete from public.board_threads where board = 'gta6' and title in (
--   '第3弾トレーラー、6/25に来ると思う？','ルシアが主人公なの胸熱すぎる','Switch2版って結局出るの？',
--   'マップGTA5の2倍、移動だるくならない？','発売まであと約5ヶ月、待ちきれん'
-- );
-- （board_posts は thread 削除時に on delete cascade で自動的に消えます）
