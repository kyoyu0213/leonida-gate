// ============================================================================
//  /en 配下（英語版）の公開・インデックス状態を決める単一の正（審査対策・可逆設計）。
// ----------------------------------------------------------------------------
//  背景：AdSense 審査が「有用性の低いコンテンツ」で繰り返し却下され、GSC の実データ
//  でも /en 配下の検索表示・アクセスはほぼゼロだった。読まれていない対訳ページ
//  約70本がサイト全体の独自性評価を下げている仮説に基づき、段階的に絞っている。
//  英語版のソース（ページ・翻訳データ titleEn / fullContentEn 等）は一切消さない。
//
//  ── フラグは2つ。組合せで3段階になる ──────────────────────────────────
//
//    EN_SITE_ENABLED  EN_INDEXING_ENABLED  状態
//    ---------------  -------------------  --------------------------------
//    false            （無視される）        ⑲ 公開停止。/en/* は vercel.json が
//                                          対応する日本語URLへ 302。プリレンダ
//                                          HTMLも作らない。言語切替UIも出ない。
//    true             false                ⑰ 公開するが検索対象外。/en は 200 で
//                                          配信され noindex。sitemap・hreflang・
//                                          広告は付けない。
//    true             true                 完全復帰（元の状態）。
//
//  EN_SITE_ENABLED=false のとき EN_INDEXING_ENABLED は意味を持たない
//  （/en の HTML がそもそも生成されず、URL は日本語へ 302 されるため）。
//  真偽の組合せで迷わないよう、参照側は下の EN_PUBLIC_INDEXABLE と各ヘルパーを使う。
//
//  ── 復帰手順 ────────────────────────────────────────────────
//   段階1（⑰の状態へ＝/en を公開だけ再開）:
//     1. EN_SITE_ENABLED を true にする
//     2. vercel.json の redirects 先頭にある「/en 一時公開停止」2行を削除する
//        （※フラグだけでは戻らない唯一の箇所。prebuild の check-route-tables が
//          フラグと vercel.json の食い違いを検出してビルドを止めるので、
//          片方だけ直した状態のままデプロイされることはない）
//   段階2（完全復帰）:
//     3. EN_INDEXING_ENABLED を true にする
//   段階1を飛ばして 1〜3 を一度にやってもよい。
//
//  ── フラグが連動する先（二重管理を作らないこと） ──────────────────────
//    EN_SITE_ENABLED:
//      - client/src/entry-server.tsx      … ROUTE_PATHS から /en 版を外す
//      - scripts/prerender-og.ts          … /en/news/<id> を生成しない
//      - scripts/prerender-home.ts        … /en（英語ホーム）を生成しない
//      - client/src/components/LangToggle.tsx … 言語切替トグルを出さない
//      - client/src/components/LangBanner.tsx … 英語版への誘導バナーを出さない
//      - scripts/check-route-tables.mjs   … vercel.json の 302 とフラグの整合を検査
//    EN_PUBLIC_INDEXABLE（= 両方 true）:
//      - scripts/generate-sitemap.mjs     … sitemap への /en 掲載
//      - scripts/prerender-routes.ts 他   … hreflang の出力
//      - client/src/hooks/useSeo.ts       … CSR遷移時の hreflang
//      - client/src/lib/ads.ts            … /en を広告対象外にするか
//    EN_SITE_ENABLED && !EN_INDEXING_ENABLED:
//      - プリレンダ3本                     … /en へ robots noindex を焼く
//
//  変えないもの：canonical（各ページ自己参照）・robots.txt（Disallow はしない）・
//  英語版のソースコードと翻訳データ。
//
//  ※ 素の node で動くスクリプト（generate-sitemap.mjs / check-ads.mjs /
//    check-route-tables.mjs）は TS を import できないため、
//    scripts/lib/en-indexing.mjs がこのファイルをテキスト解析して同じ値を読む。
// ============================================================================

/** /en 配下を配信するか。false の間は vercel.json が日本語URLへ 302 する（⑲）。 */
export const EN_SITE_ENABLED: boolean = false;

/** /en 配下を検索対象にするか。false の間は noindex（⑰）。EN_SITE_ENABLED=false なら無意味。 */
export const EN_INDEXING_ENABLED: boolean = false;

/**
 * /en を「公開されていて、かつ検索対象」として扱ってよいか。
 * sitemap 掲載・hreflang・広告の可否はすべてこれで判定する
 * （公開停止中の /en を alternate として宣言したり、そこに広告を載せたりしないため）。
 */
export const EN_PUBLIC_INDEXABLE: boolean = EN_SITE_ENABLED && EN_INDEXING_ENABLED;

/** 英語版のパスか（'/en' 本体と '/en/...' 配下）。クエリ・ハッシュは落として判定する。 */
export function isEnPath(path: string): boolean {
  const p = path.split('?')[0].split('#')[0];
  return p === '/en' || p.startsWith('/en/');
}

/**
 * そのパスの HTML に robots noindex を焼くか。
 * 「/en を公開しているが検索対象にしない」段階でのみ true。公開停止中は /en の HTML を
 * そもそも生成しない（＝焼く相手がいない）ので false。
 */
export function isEnNoindexPath(path: string): boolean {
  return EN_SITE_ENABLED && !EN_INDEXING_ENABLED && isEnPath(path);
}

/** hreflang（ja/en/x-default）を出してよいか。/en が公開かつ検索対象のときだけ。 */
export function isHreflangEnabled(): boolean {
  return EN_PUBLIC_INDEXABLE;
}

/** 言語切替UI（LangToggle / LangBanner）を出してよいか。 */
export function isLangSwitchEnabled(): boolean {
  return EN_SITE_ENABLED;
}
