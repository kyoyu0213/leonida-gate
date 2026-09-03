// ============================================================================
//  /en 配下を検索対象にするかどうかの単一フラグ（審査対策・可逆設計）。
// ----------------------------------------------------------------------------
//  背景：AdSense 審査が「有用性の低いコンテンツ」で繰り返し却下され、GSC の実データ
//  でも /en 配下の検索表示はほぼゼロだった。読まれていない対訳ページ約70本が
//  サイト全体の独自性評価を下げている仮説に基づき、審査を通すまで /en 全体を
//  検索対象から外す。ページ自体は消さない（URL は 200 のまま、ユーザーは閲覧可能）。
//
//  EN_INDEXING_ENABLED = false のとき、以下がすべて連動して切り替わる：
//    1. /en 配下のプリレンダHTMLに <meta name="robots" content="noindex"> を焼く
//         … scripts/prerender-routes.ts / prerender-og.ts / prerender-home.ts
//    2. sitemap.xml から /en 配下のURLを全て落とす
//         … scripts/generate-sitemap.mjs
//    3. hreflang（ja/en/x-default）を日英どちらのページからも出さない
//         … 上記プリレンダ3本 ＋ client/src/hooks/useSeo.ts（CSR側）
//       ※ noindex のページを alternate として宣言すると矛盾シグナルになるため。
//    4. /en 配下から AdSense のローダーを外す
//         … client/src/lib/ads.ts の isAdFreePath() が /en を広告対象外として扱う
//       ※ 「noindex＝低価値と自己申告したページに広告が載っている」状態を作らない。
//
//  変えないもの：/en ページの存在・canonical（各ページ自己参照）・ヘッダーの
//  言語切替リンク・robots.txt（Disallow はしない。noindex を読ませる必要がある）。
//
//  【元に戻す方法】この定数を true にして再ビルドするだけ。1〜4 が同時に復帰する。
//
//  この定数を参照する側（二重管理を作らないこと）:
//    - client/src/lib/ads.ts        … 広告対象外の判定に /en を足す
//    - client/src/hooks/useSeo.ts   … CSR遷移時の hreflang 出力
//    - scripts/lib/en-indexing.mjs  … 素の node 実行のスクリプト向け（この値をテキスト解析）
// ============================================================================

/** /en 配下を検索対象にするか。false の間だけ noindex 化が有効になる。 */
export const EN_INDEXING_ENABLED: boolean = false;

/** 英語版のパスか（'/en' 本体と '/en/...' 配下）。クエリ・ハッシュは落として判定する。 */
export function isEnPath(path: string): boolean {
  const p = path.split('?')[0].split('#')[0];
  return p === '/en' || p.startsWith('/en/');
}

/** そのパスを noindex にするか（＝ /en 配下 かつ フラグ false）。 */
export function isEnNoindexPath(path: string): boolean {
  return !EN_INDEXING_ENABLED && isEnPath(path);
}

/** hreflang（ja/en/x-default）を出してよいか。noindex 中は出さない。 */
export function isHreflangEnabled(): boolean {
  return EN_INDEXING_ENABLED;
}
