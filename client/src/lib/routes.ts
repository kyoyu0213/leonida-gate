// 日英の対が存在する（=/en/ 版を作る）ルートの定義と判定。
// ここを一元管理し、ルーター・useSeo・言語トグル・誘導バナー・prerender・sitemap で参照する。
//
// 重要：日本語URLは現行のまま（プレフィックス無し）。英語は /en/ プレフィックス。
//   例: /fivem-gtarp/what-is-fivem（日） ↔ /en/fivem-gtarp/what-is-fivem（英）
// 掲示板・servers・thread などユーザー投稿/動的ページは英語版を作らない（ここに含めない）。

/** 日英の対がある静的ルート（日本語側の論理パス）。 */
export const LOCALIZED_STATIC_PATHS: string[] = [
  '/fivem-gtarp',
  '/fivem-gtarp/what-is-fivem',
  '/fivem-gtarp/what-is-gtarp',
  '/fivem-gtarp/fivem-vs-gtarp',
  '/fivem-gtarp/history',
  '/fivem-gtarp/glossary',
  '/fivem-gtarp/faq',
  '/fivem-gtarp/commands',
  '/fivem-gtarp/streamer-server-history',
  '/fivem-gtarp/observer-guide',
  '/fivem-gtarp/first-day-guide',
  '/fivem-gtarp/server-guide',
  '/fivem-gtarp/server-setup',
  '/fivem-gtarp/how-to-install',
  '/fivem-gtarp/tools',
  '/fivem-gtarp/tools/image-resize',
  '/fivem-gtarp/tools/image-mask',
  '/contact',
  '/terms',
];

/** ニュース記事（/news/:id）は日英の対がある（記事データに titleEn/bodyEn を持つ）。 */
const NEWS_PATH_RE = /^\/news\/\d+$/;

/**
 * 日本語側の論理パス（プレフィックス無し）に英語版が存在するか。
 * 言語トグル・誘導バナー・hreflang の出し分けに使う。
 */
export function isLocalizedPath(jaPath: string): boolean {
  return LOCALIZED_STATIC_PATHS.includes(jaPath) || NEWS_PATH_RE.test(jaPath);
}
