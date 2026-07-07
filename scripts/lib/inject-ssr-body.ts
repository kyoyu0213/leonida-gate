// ============================================================================
//  プリレンダ共通ヘルパー：SSR本文を index.html の空 #root に焼き込む。
//  prerender-routes.ts（掲示板・servers・fivem-gtarp）と prerender-og.ts（news記事）
//  の両方から使う。両者で #root 置換ロジックを重複させないための単一の実装。
//
//  クライアントの createRoot はマウント時にこの中身を置き換える（ハイドレーションではなく
//  再マウント）。生HTMLに本文があればクローラは本文を読め、ブラウザでは通常どおり動く。
// ============================================================================

const ROOT_MARKER = '<div id="root"></div>';

/**
 * html 内の空 #root（<div id="root"></div>）を body で満たす。
 * マーカーが見つからなければ throw（テンプレート想定外を検知するため）。
 * @param ctx 呼び出し元ラベル（エラーメッセージ用）
 */
export function injectSsrBody(html: string, body: string, ctx = 'inject-ssr-body'): string {
  if (!html.includes(ROOT_MARKER)) {
    throw new Error(`[${ctx}] index.html に空の #root が見つからない（テンプレート想定外）`);
  }
  return html.replace(ROOT_MARKER, `<div id="root">${body}</div>`);
}
