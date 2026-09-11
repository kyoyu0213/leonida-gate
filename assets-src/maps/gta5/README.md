# GTA5 マップの元画像置き場

ここに地図の元画像を **1枚だけ** 置きます。タイルは `scripts/build-map-tiles.mjs` がビルド時に生成します（`client/public/maps/` は .gitignore 済みなので、タイルを git に積まないため）。

## 置き方

1. 元画像のファイル名を `atlas-<版>.webp`（`.png` / `.jpg` も可）にします。例: `atlas-v1.webp`
   - 8192×8192 前後を想定しています（違うサイズでも 8192 四方に合わせて生成します）
2. `client/src/data/maps/gta5/meta.ts` を次のように更新します
   - `tileVersion` を `'placeholder'` から `'v1'` に変更
   - `controlPoints` に既知の地点を3点以上登録（ワールド座標と元画像上のピクセル位置）
   - `bounds` を更新
3. `supabase/map_pins.sql` の `map_datasets`（`gta5` の行）の範囲を、`bounds` と同じ値に更新します
4. `node scripts/build-map-tiles.mjs` で手元のタイルを作り、`corepack pnpm dev` で位置合わせを確認します

## 注意

- 地図画像の著作権は Rockstar Games にあります。帰属表示（Map © Rockstar Games）は地図上に自動で出ます
- `/maps` 配下は1年間キャッシュ（immutable）されます。元画像を差し替えるときは、`tileVersion` を必ず新しい値（`v2` など）にしてください。同じ版のまま上書きすると、古いタイルが残ります
