// ============================================================================
//  マップツールの公開フラグ（データセット単位）。
//
//  種データ（正規ピンの座標）と元画像がそろうまでは false のまま運用する。
//  false の間の扱い：
//    - URL（/fivem-gtarp/tools/gta5-map）は動く。プリレンダも生成する（空シェルにしない）
//    - prerender-routes が <meta name="robots" content="noindex"> を入れる
//    - sitemap から外す（scripts/lib/static-routes.mjs）
//    - ツール一覧・FiveM/GTARP の「便利ツール」カードを出さない
//    - ハブ（/fivem-gtarp）の JSON-LD ItemList から外す
//    - DB に承認済みピンが1件も無いときだけ、仮置きのサンプルピンを表示する
//  公開するときはここを true にするだけ。
//
//  ※ scripts/lib/map-release.mjs が正規表現でこの行を読む。書式（`gta5: true|false`）を変えないこと。
// ============================================================================
export const MAP_RELEASED = {
  gta5: false,
} as const;
