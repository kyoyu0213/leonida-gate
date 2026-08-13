// ============================================================================
//  広告（AdSense）を出すページ／出さないページの単一の正。
// ----------------------------------------------------------------------------
//  AdSense の Ad Inventory Value ポリシーは「価値の低いページに広告を置くこと」を
//  問題にする。投稿量に依存する UGC 系（掲示板・募集板・スレッド詳細）、操作目的の
//  ツール画面、ポリシー・問い合わせ等の固定ページからは広告を外し、
//  「広告が載るページはすべて編集部制作のコンテンツ（ホーム・ニュース・解説ガイド・
//   体験記）」という状態を作る。
//
//  ※ noindex は使わない。インデックス戦略は現状維持で、広告の有無だけを切り替える。
//
//  審査通過後に板単位で広告を戻すときは、下の配列から該当行を1行消すだけでよい。
//
//  この定数を参照する側（二重管理を作らないこと）:
//    - client/src/components/AdsLoader.tsx … SPA遷移時のローダー動的注入
//    - scripts/prerender-routes.ts          … プリレンダHTMLから script を落とす
//    - scripts/prerender-home.ts            … app.html（CSRシェル）から落とす
//    - scripts/check-ads.mjs                … ビルド後の期待値検査
// ============================================================================

/** AdSense のパブリッシャーID付きローダーURL。client/index.html の <script> と同じもの。 */
export const ADSENSE_SRC =
  'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5843612739538319';

/**
 * 広告を出さないルート（日本語側の論理パス。前方一致で配下も含む）。
 * /en 版は isAdFreePath がプレフィックスを外して判定するので、ここには書かない。
 */
export const AD_FREE_PREFIXES: string[] = [
  // --- UGC（投稿量に内容が依存する） ---
  '/board', // 掲示板ハブ・各板・フレンド/クルー募集（詳細ページ含む）
  '/thread', // スレッド詳細
  '/recruit', // 募集ハブ
  '/servers', // サーバー募集板
  // --- 操作目的の画面・検索結果・管理 ---
  '/fivem-gtarp/tools', // ツールハブと各ツール
  '/search',
  '/admin',
  '/404',
  // --- 固定ページ（収益実態がなく、ポリシー/問い合わせ上に広告を置く意味がない） ---
  '/about',
  '/contact',
  '/terms',
  '/privacy',
];

/** 言語プレフィックス（/en）を外した論理パスにする。 */
function toLogicalPath(path: string): string {
  const p = path.split('?')[0].split('#')[0];
  if (p === '/en') return '/';
  return p.startsWith('/en/') ? p.slice(3) : p;
}

/** そのパスで広告を出さないか（/en 版も同じ判定になる）。 */
export function isAdFreePath(path: string): boolean {
  const p = toLogicalPath(path);
  return AD_FREE_PREFIXES.some((pre) => p === pre || p.startsWith(`${pre}/`));
}
