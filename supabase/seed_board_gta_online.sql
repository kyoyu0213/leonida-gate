-- ============================================================================
--  GTAオンライン掲示板（board='gta-online'）の初期ダミースレッド。
--  Supabase → SQL Editor に貼って Run（1回でOK）。
--  ・14スレッド／計67レス。書き込み時刻は 2026年7〜8月に分散（自演に見えないよう）。
--  ・投稿者は「名無しさん」、IP/anon_id は入れない（＝IPランキング等には出ない）。
--  本物が増えたら不要。末尾の一括削除SQLで丸ごと消せる。
-- ============================================================================

-- スレ1: GTA6が出たらオンラインどうなる
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gta-online', 'GTA6出たらオンライン過疎る？それとも続く？', 6, '2026-07-28 22:14:00+09', '2026-08-05 23:31:00+09')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, v.ts::timestamptz from t cross join (values
  (1, '名無しさん', 'GTA6のオンライン来たら5のオンラインって過疎るのかな。今の資産どうなるんだろ', '2026-07-28 22:14:00+09'),
  (2, '名無しさん', 'しばらくは併存でしょ。金だけ引き継ぎとかありそう', '2026-07-28 22:41:00+09'),
  (3, '名無しさん', '>>2 資産全部持ち越せたら神なんだけどな。まあ無理か', '2026-07-29 00:03:00+09'),
  (4, '名無しさん', '6が出ても5のRP(FiveM)は残るから、バニラオンライン勢がどう動くかだな', '2026-07-30 19:22:00+09'),
  (5, '名無しさん', '正直6の情報出るたびに5のモチベ下がるわ…', '2026-08-02 21:47:00+09'),
  (6, '名無しさん', '発売までまだあるし今のうちに5で稼いどくのが吉', '2026-08-05 23:31:00+09')
) as v(n, nm, bd, ts);

-- スレ2: カヨペリコ金策
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gta-online', 'カヨペリコ、ソロで安定して2000万稼ぐ立ち回り', 5, '2026-07-10 20:05:00+09', '2026-07-11 01:12:00+09')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, v.ts::timestamptz from t cross join (values
  (1, '名無しさん', 'カヨペリコソロでやってるけど毎回1500万くらい。もっと伸ばせる？', '2026-07-10 20:05:00+09'),
  (2, '名無しさん', 'プライマリはパナ、二次で金塊とコカイン回れば2000万超えるよ', '2026-07-10 20:33:00+09'),
  (3, '名無しさん', '>>2 二次確保めんどくない？時間かかるわ', '2026-07-10 21:10:00+09'),
  (4, '名無しさん', '慣れれば潜入40分くらい。ルートは滑走路→格納庫→コンパウンドで固定してる', '2026-07-10 21:48:00+09'),
  (5, '名無しさん', 'クールダウン挟むの忘れてハードモード維持できてなかった、気をつけて', '2026-07-11 01:12:00+09')
) as v(n, nm, bd, ts);

-- スレ3: 初心者
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gta-online', '今から始めても遅くない？初心者です', 5, '2026-07-22 18:40:00+09', '2026-07-23 12:18:00+09')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, v.ts::timestamptz from t cross join (values
  (1, '名無しさん', 'セールで5買った。今からオンライン始めても大丈夫？古参ばっかで怖い', '2026-07-22 18:40:00+09'),
  (2, '名無しさん', '全然いける。まずキャリアビルダーでCEOかバイカー選ぶといい', '2026-07-22 19:02:00+09'),
  (3, '名無しさん', '>>1 最初に金もらえるプロモあるからそれ使っとけ', '2026-07-22 19:35:00+09'),
  (4, '名無しさん', '招待限定セッションでビジネス回すと絡まれないよ', '2026-07-22 20:50:00+09'),
  (5, '名無しさん', '初心者狩り多いから公開セッションは慣れてからでいい', '2026-07-23 12:18:00+09')
) as v(n, nm, bd, ts);

-- スレ4: 金策総合
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gta-online', '2026年、一番効率いい金策おしえて', 6, '2026-07-05 21:30:00+09', '2026-08-01 22:38:00+09')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, v.ts::timestamptz from t cross join (values
  (1, '名無しさん', '最近復帰。今の鉄板金策ってやっぱカヨ？', '2026-07-05 21:30:00+09'),
  (2, '名無しさん', 'カヨ＋アセット売却が安定。バンカーとコカインは放置で貯まる', '2026-07-05 22:11:00+09'),
  (3, '名無しさん', 'アーケードのマスタープラン(ダイヤカジノ強盗)もソロなら悪くないよ', '2026-07-07 20:44:00+09'),
  (4, '名無しさん', '>>3 セットアップだるくない？俺はカヨ一択だわ', '2026-07-12 23:05:00+09'),
  (5, '名無しさん', '今週ボーナスでナイトクラブ売却が美味しかった', '2026-07-20 19:50:00+09'),
  (6, '名無しさん', '結局ビジネス複数回して物資自動で貯めるのが一番楽', '2026-08-01 22:38:00+09')
) as v(n, nm, bd, ts);

-- スレ5: カジノのポディウムカー
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gta-online', '今週のカジノのポディウムカー、当たり？', 4, '2026-08-03 19:12:00+09', '2026-08-04 00:51:00+09')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, v.ts::timestamptz from t cross join (values
  (1, '名無しさん', '今週のルーレットの車なんだっけ、回す価値ある？', '2026-08-03 19:12:00+09'),
  (2, '名無しさん', 'スポーツ系だったはず。俺は3回目で当たったわラッキー', '2026-08-03 19:40:00+09'),
  (3, '名無しさん', '>>2 うらやま、俺15回外した…確率ほんとに1/20か？', '2026-08-03 20:25:00+09'),
  (4, '名無しさん', '毎日ログインで無料スピン回すだけでも小遣いになる', '2026-08-04 00:51:00+09')
) as v(n, nm, bd, ts);

-- スレ6: ソロ疲れた
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gta-online', 'ソロでビジネス回すの疲れた…みんなどうしてる', 4, '2026-07-15 23:20:00+09', '2026-07-16 20:30:00+09')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, v.ts::timestamptz from t cross join (values
  (1, '名無しさん', '一人で補給→販売の繰り返し飽きた。効率と楽さの両立むずい', '2026-07-15 23:20:00+09'),
  (2, '名無しさん', '販売は招待限定でやれば妨害されないぶん気楽だよ', '2026-07-15 23:52:00+09'),
  (3, '名無しさん', '>>1 ながら作業でナイトクラブ放置がおすすめ。ほぼ何もしなくていい', '2026-07-16 01:15:00+09'),
  (4, '名無しさん', 'フレンドと分担すると一気に楽になる。ソロは限界あるわ', '2026-07-16 20:30:00+09')
) as v(n, nm, bd, ts);

-- スレ7: シャークカード
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gta-online', 'シャークカード、結局買う価値ある？', 4, '2026-07-08 21:00:00+09', '2026-07-09 12:40:00+09')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, v.ts::timestamptz from t cross join (values
  (1, '名無しさん', '時間ないんだけどシャークカード課金ってあり？', '2026-07-08 21:00:00+09'),
  (2, '名無しさん', '最初のプロパティ揃えるまでは時短でアリ。それ以降は自分で稼げる', '2026-07-08 21:22:00+09'),
  (3, '名無しさん', '>>1 セール時にまとめ買いが一番コスパいいよ', '2026-07-08 22:05:00+09'),
  (4, '名無しさん', '金策覚えたら要らなくなるから急がなくてもいい', '2026-07-09 12:40:00+09')
) as v(n, nm, bd, ts);

-- スレ8: グリーファー対処
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gta-online', 'フリーモードで絡んでくる奴の対処法', 4, '2026-07-19 22:15:00+09', '2026-07-20 13:05:00+09')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, v.ts::timestamptz from t cross join (values
  (1, '名無しさん', 'オプレッサーで延々狩ってくる奴きつい。どうしてる？', '2026-07-19 22:15:00+09'),
  (2, '名無しさん', 'パッシブモード＋招待限定に逃げるのが基本', '2026-07-19 22:40:00+09'),
  (3, '名無しさん', '>>1 ロビー変えるのが一番早い。相手にするだけ時間の無駄', '2026-07-19 23:18:00+09'),
  (4, '名無しさん', 'MK2は最近弱体化したからそこまででもなくなった気がする', '2026-07-20 13:05:00+09')
) as v(n, nm, bd, ts);

-- スレ9: コサトカ
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gta-online', 'コサトカ(潜水艦)って買っとくべき？', 4, '2026-07-12 20:30:00+09', '2026-07-13 10:20:00+09')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, v.ts::timestamptz from t cross join (values
  (1, '名無しさん', 'カヨやるのにコサトカ必須って聞いたけど高いよね', '2026-07-12 20:30:00+09'),
  (2, '名無しさん', '元は一瞬で取れる。金策の入り口だから最優先で買っていい', '2026-07-12 20:58:00+09'),
  (3, '名無しさん', '>>1 ガイド付き弾道ミサイルも地味に便利だぞ', '2026-07-12 21:44:00+09'),
  (4, '名無しさん', 'スパローも一緒に付けとくと移動が神になる', '2026-07-13 10:20:00+09')
) as v(n, nm, bd, ts);

-- スレ10: アーケードvsペントハウス
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gta-online', 'アーケードとカジノペントハウス、次買うならどっち', 4, '2026-07-26 21:05:00+09', '2026-07-27 01:05:00+09')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, v.ts::timestamptz from t cross join (values
  (1, '名無しさん', '金貯まってきた。アーケードとペントハウスどっち先？', '2026-07-26 21:05:00+09'),
  (2, '名無しさん', '稼ぎ目的ならアーケード(マスタープラン)。ペントは見た目とミッション用', '2026-07-26 21:33:00+09'),
  (3, '名無しさん', '>>2 だなー。アーケードのゲーム機収益も地味に貯まるしな', '2026-07-26 22:20:00+09'),
  (4, '名無しさん', '遊びで買うならペントのカジノ雰囲気楽しいけどね', '2026-07-27 01:05:00+09')
) as v(n, nm, bd, ts);

-- スレ11: 復帰勢
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gta-online', '2年ぶりに復帰したんだが何が変わった？', 4, '2026-08-01 20:10:00+09', '2026-08-02 11:22:00+09')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, v.ts::timestamptz from t cross join (values
  (1, '名無しさん', '久々に戻ってきた。浦島すぎて何から手つければ…', '2026-08-01 20:10:00+09'),
  (2, '名無しさん', 'とりあえずカヨペリコで稼げる。あとサラリー系ビジネスが増えた', '2026-08-01 20:35:00+09'),
  (3, '名無しさん', '>>1 ロスサントスチューナーとかカーミーティングも増えたよ', '2026-08-01 21:50:00+09'),
  (4, '名無しさん', 'セーブデータ無事ならプロパティそのままだからラッキーだね', '2026-08-02 11:22:00+09')
) as v(n, nm, bd, ts);

-- スレ12: 好きな車
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gta-online', 'ロスサントスで一番好きな車おしえて', 5, '2026-07-03 22:40:00+09', '2026-07-31 23:48:00+09')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, v.ts::timestamptz from t cross join (values
  (1, '名無しさん', 'みんなの愛車教えて。俺はエリート乗り回してる', '2026-07-03 22:40:00+09'),
  (2, '名無しさん', '見た目ならZタイプでしょ。走りは微妙だけどロマン', '2026-07-03 23:15:00+09'),
  (3, '名無しさん', '>>1 実用ならデラックスォかクリーガー。とにかく速い', '2026-07-05 19:30:00+09'),
  (4, '名無しさん', '結局ドリフト系がロマンある。チューナー最高', '2026-07-14 21:12:00+09'),
  (5, '名無しさん', '最近はオフローダーで山走るのにハマってる', '2026-07-31 23:48:00+09')
) as v(n, nm, bd, ts);

-- スレ13: プラットフォーム
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gta-online', '今から始めるならPS5とPC、どっち？', 4, '2026-07-17 21:20:00+09', '2026-07-18 12:05:00+09')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, v.ts::timestamptz from t cross join (values
  (1, '名無しさん', '5のオンライン始めたい。PS5とPCで迷ってる', '2026-07-17 21:20:00+09'),
  (2, '名無しさん', 'MOD遊びたいならPC(FiveM)、公式オンラインメインならどっちでもいい', '2026-07-17 21:45:00+09'),
  (3, '名無しさん', '>>1 PCはチーターがたまにいる。PS5のが治安いいかも', '2026-07-17 22:30:00+09'),
  (4, '名無しさん', '拡張版(PS5)は読み込み早いしグラ綺麗でおすすめ', '2026-07-18 12:05:00+09')
) as v(n, nm, bd, ts);

-- スレ14: 深夜まったり
with t as (
  insert into public.board_threads (board, title, post_count, created_at, last_posted_at)
  values ('gta-online', '深夜にまったり遊べる人おらん？', 4, '2026-08-05 23:50:00+09', '2026-08-06 01:40:00+09')
  returning id
)
insert into public.board_posts (thread_id, post_number, name, body, created_at)
select t.id, v.n, v.nm, v.bd, v.ts::timestamptz from t cross join (values
  (1, '名無しさん', '平日深夜にゆるく金策手伝ってくれる人おらんかな', '2026-08-05 23:50:00+09'),
  (2, '名無しさん', '深夜勢ここにおるで。カヨ手伝うよ', '2026-08-06 00:20:00+09'),
  (3, '名無しさん', '>>1 ガチ勢じゃなくてまったり派ならありがたい', '2026-08-06 00:55:00+09'),
  (4, '名無しさん', '募集板のフレンド募集板でも探せるよ、活動時間書いとくと集まりやすい', '2026-08-06 01:40:00+09')
) as v(n, nm, bd, ts);

select pg_notify('pgrst', 'reload schema');

-- ============================================================================
--  一括削除（このダミーを丸ごと消す。CASCADE で投稿も一緒に消える）
--    delete from public.board_threads where board = 'gta-online';
-- ============================================================================
