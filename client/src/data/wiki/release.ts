// ============================================================================
//  GTA6まとめWiki（/gta6-wiki 配下）の公開フラグ。
//
//  マップツールの client/src/data/maps/release.ts と同じ「蓄積まで非公開」方式。
//  false の間の扱い：
//    - URL（/gta6-wiki と各カテゴリ）は動く。プリレンダも生成する（空シェルにしない）
//    - prerender-routes が <meta name="robots" content="noindex"> を入れる
//    - sitemap から外す（scripts/lib/static-routes.mjs）
//    - ヘッダーナビ・フッター・ホームに入口を出さない
//    - index の JSON-LD ItemList を出さない
//  広告は公開フラグと無関係に当面出さない（client/src/lib/ads.ts の AD_FREE_PREFIXES）。
//  公開するときはここを true にするだけ。
//
//  ※ scripts/lib/wiki-release.mjs が正規表現でこの行を読む。
//    書式（`export const WIKI_RELEASED = true|false as const;`）を変えないこと。
// ============================================================================
export const WIKI_RELEASED = false as const;
