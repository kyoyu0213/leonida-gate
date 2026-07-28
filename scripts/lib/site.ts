// ============================================================================
//  プリレンダ系スクリプト共通のサイト定数（単一の正）。
// ----------------------------------------------------------------------------
//  ORIGIN / 既定OG画像 / ロゴ は prerender-og・prerender-routes・prerender-home の
//  3スクリプトがそれぞれ別々に持っていた。JSON-LD でも同じ絶対URLが要るため、
//  ここへ集約する（SSR時に origin が未定義になって相対パスが混入する事故の再発防止）。
//
//  クライアント側の正は client/src/hooks/useSeo.ts の SITE_ORIGIN。値は同じ。
//  （scripts は node 実行で @/ エイリアスを解決しないため、ここに定数を置く）
// ============================================================================

/** 本番オリジン。JSON-LD・canonical・OGP の絶対URL生成に使う。 */
export const ORIGIN = 'https://gta6-feed.com';

/** サイト名（publisher / author / og:site_name）。 */
export const SITE_NAME = 'GTA6 FEED';

/** ページ側で画像指定が無いときの既定OG画像。 */
export const DEFAULT_IMAGE = '/images/news/Official_Cover_Art_landscape.webp';

/** publisher.logo に使うサイトロゴ。 */
export const SITE_LOGO = '/images/gta6feed-logo.webp';

/** パスを絶対URLへ（http(s) で始まるものはそのまま）。 */
export const toAbs = (p: string): string =>
  /^https?:\/\//i.test(p) ? p : ORIGIN + (p.startsWith('/') ? p : `/${p}`);

/** タイトル末尾のサイト名（'｜GTA6 FEED' / '| GTA6 FEED'）を落とす。
 *  JSON-LD の headline やパンくずの末端名にはサイト名を含めないため。 */
export const stripSiteName = (title: string): string =>
  title.replace(/\s*[|｜]\s*GTA6\s*FEED\s*$/u, '').trim();
