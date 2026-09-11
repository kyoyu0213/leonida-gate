-- ============================================================================
--  GTA5 マップの投稿受付範囲を tileVersion v1（martonp96 atlas・実座標変換）に合わせる。
--  Supabase → SQL Editor に貼って Run（1回・何度実行しても同じ結果）。
--
--  ▼ 実行が必要なのは
--    map_pins.sql を「v1 より前（プレースホルダの範囲 -5144〜7144 / -4144〜8144）」で
--    適用済みの場合だけ。map_pins.sql をまだ実行していないなら不要
--    （map_pins.sql 側の初期値を既に v1 の範囲に更新してある）。
--
--  ▼ 値
--    client/src/data/maps/gta5/meta.ts の bounds と同じ。X -5500〜6000 / Y -4000〜8000。
--    範囲外の座標で create_map_pin を呼ぶと 'out of bounds' で弾かれる。
-- ============================================================================
insert into public.map_datasets (map_id, min_x, max_x, min_y, max_y, accepting)
values ('gta5', -5500, 6000, -4000, 8000, true)
on conflict (map_id) do update
  set min_x = excluded.min_x,
      max_x = excluded.max_x,
      min_y = excluded.min_y,
      max_y = excluded.max_y;
-- accepting（受付停止フラグ）は運営の設定を残すため更新しない。

-- 確認：select * from public.map_datasets where map_id = 'gta5';
