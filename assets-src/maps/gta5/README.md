# GTA5 マップのタイルについて

地図のタイルは **このディレクトリには置きません**。`scripts/build-map-tiles.mjs` がビルド時（prebuild）に取得・変換します。

- 素材: [martonp96/GTAV-Maps](https://github.com/martonp96/GTAV-Maps)（MIT）の `atlas`。commit SHA で固定しています（スクリプトの `SOURCES`）
- 変換: `{z}-{x}_{y}.png` → `client/public/maps/gta5/<tileVersion>/{z}/{x}/{y}.webp`（q80）
- 元PNGのキャッシュ: `node_modules/.cache/map-tiles-src/`（2回目以降は取りに行きません）
- 出力先 `client/public/maps/` は .gitignore 済みです。地図画像の権利は Rockstar Games にあるため、元画像もタイルも git 履歴には入れません

## 手元で地図を見るとき

`node scripts/build-map-tiles.mjs`（または `corepack pnpm map:tiles`）を1回実行してから `corepack pnpm dev`。

## 座標変換

`client/src/data/maps/gta5/meta.ts` の `transformation`。RiceaRaul/gta-v-map-leaflet の実測値 `L.Transformation(0.02072, 117.3, -0.0205, 172.8)` を、atlas のタイル枠（z7 で一辺 11000px）に合わせて `85.9375 / 256` 倍したものです。根拠は meta.ts のコメントを参照してください。

## 素材を差し替えるとき

1. `build-map-tiles.mjs` の `SOURCES` に新しい版（`v2` など）を足す
2. `meta.ts` の `tileVersion` を新しい値にし、必要なら `imageSize` / `maxNativeZoom` / `transformation` を直す
3. 投稿範囲（`bounds`）を変えた場合は `supabase/map_datasets_gta5_v1_bounds.sql` と同じ形の SQL で `map_datasets` も更新する

`/maps` 配下は1年間キャッシュ（immutable）されます。同じ版のまま中身を変えないでください。

## 注意

- 地図の帰属表示（Map © Rockstar Games · Tiles: martonp96/GTAV-Maps (MIT)）は地図上と地図の下に自動で出ます
- `/maps` 配下は `X-Robots-Tag: noindex` で配信しています（vercel.json）
