// ============================================================================
//  sitemap に載せる固定ページの一覧（単一の正）。
//
//  以前は generate-sitemap.mjs の中に閉じており、
//  「sitemap に載っているのにプリレンダされていない」ルート（/contact・/terms・/news）
//  を誰も検知できなかった。ここへ切り出して、
//    - scripts/generate-sitemap.mjs   … sitemap.xml の生成
//    - scripts/check-route-tables.mjs … 3表の同期チェック（prebuild）
//  の両方から同じ配列を参照させる。
// ============================================================================

/** 固定ページ（手動メンテ）。path は日本語側の論理パス。 */
export const STATIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/news', priority: '0.9', changefreq: 'daily' },
  { path: '/recruit', priority: '0.8', changefreq: 'daily' },
  { path: '/servers', priority: '0.8', changefreq: 'daily' },
  { path: '/board', priority: '0.8', changefreq: 'daily' },
  { path: '/board/gta6', priority: '0.7', changefreq: 'daily' },
  { path: '/board/gtarp', priority: '0.7', changefreq: 'daily' },
  { path: '/board/gtarp-servers', priority: '0.7', changefreq: 'daily' },
  { path: '/board/streamer-servers', priority: '0.7', changefreq: 'daily' },
  { path: '/board/fivem-dev', priority: '0.7', changefreq: 'daily' },
  { path: '/board/friends', priority: '0.7', changefreq: 'daily' },
  { path: '/board/crews', priority: '0.7', changefreq: 'daily' },
  { path: '/fivem-gtarp', priority: '0.8', changefreq: 'weekly' },
  { path: '/fivem-gtarp/what-is-fivem', priority: '0.7', changefreq: 'monthly' },
  { path: '/fivem-gtarp/what-is-gtarp', priority: '0.7', changefreq: 'monthly' },
  { path: '/fivem-gtarp/fivem-vs-gtarp', priority: '0.7', changefreq: 'monthly' },
  { path: '/fivem-gtarp/server-guide', priority: '0.7', changefreq: 'monthly' },
  { path: '/fivem-gtarp/server-setup', priority: '0.7', changefreq: 'monthly' },
  { path: '/fivem-gtarp/field-notes/dev-diary', priority: '0.7', changefreq: 'weekly' },
  { path: '/fivem-gtarp/field-notes/visit-note', priority: '0.6', changefreq: 'weekly' },
  { path: '/fivem-gtarp/how-to-install', priority: '0.7', changefreq: 'monthly' },
  { path: '/fivem-gtarp/history', priority: '0.7', changefreq: 'monthly' },
  { path: '/fivem-gtarp/glossary', priority: '0.7', changefreq: 'monthly' },
  { path: '/fivem-gtarp/faq', priority: '0.7', changefreq: 'monthly' },
  { path: '/fivem-gtarp/commands', priority: '0.7', changefreq: 'monthly' },
  { path: '/fivem-gtarp/streamer-server-history', priority: '0.7', changefreq: 'monthly' },
  { path: '/fivem-gtarp/observer-guide', priority: '0.7', changefreq: 'monthly' },
  { path: '/fivem-gtarp/first-day-guide', priority: '0.7', changefreq: 'monthly' },
  { path: '/fivem-gtarp/tools', priority: '0.6', changefreq: 'monthly' },
  { path: '/fivem-gtarp/tools/image-resize', priority: '0.6', changefreq: 'monthly' },
  { path: '/fivem-gtarp/tools/image-mask', priority: '0.6', changefreq: 'monthly' },
  { path: '/about', priority: '0.5', changefreq: 'yearly' },
  { path: '/contact', priority: '0.4', changefreq: 'yearly' },
  { path: '/terms', priority: '0.3', changefreq: 'yearly' },
];

/**
 * 日英の対がある（=/en/ 版を sitemap に出す）固定ページか。
 * client/src/lib/routes.ts の LOCALIZED_STATIC_PATHS と一致していること。
 * （一致は scripts/check-route-tables.mjs が検証する）
 *
 * 例外は '/'（ホーム）。routes.ts の表には載せていない——Home.tsx が useSeo へ
 * localized: true を直接渡して hreflang を出しており、表を経由しないため——が、
 * /en は prerender-home.ts が本文ごと焼いていて実在する。表に無いことを理由に
 * sitemap から漏れていたので、ここだけ明示的に対に含める。
 */
export const isLocalizedStaticPath = (p) =>
  p === '/' || p.startsWith('/fivem-gtarp') || p === '/about' || p === '/contact' || p === '/terms';
