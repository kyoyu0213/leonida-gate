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

/** クライアントが初期stateに使う seed を入れる script タグの id。
 *  client/src/lib/ssrSeed.ts の SSR_SEED_ELEMENT_ID と対。 */
export const SSR_SEED_ELEMENT_ID = 'ssr-seed';

/**
 * 板・募集板の投稿（そのページに実際に描画されている分）を JSON として </body> の直前に埋める。
 *
 * createRoot はプリレンダ本文を捨てて再マウントするため、これが無いとブラウザ側の
 * 初期stateが空配列から始まり、Supabase が不達だと「投稿0件の板」で確定してしまう。
 *
 * ▼ なぜ window.__SSR_SEED__ = ... ではなく application/json のタグなのか
 *   投稿タイトルや本文抜粋は訪問者が書いた文字列で、`</script>` を含みうる。
 *   実行される <script> に文字列として埋めると、脱出された瞬間に任意コードになる。
 *   application/json なら中身は実行されず、HTMLパーサが見るのは `</script` だけなので、
 *   JSON文字列内の `<` を < にエスケープすれば閉じタグを作れなくなる
 *   （< は JSON として正当なので JSON.parse 側は元の文字に戻る）。
 */
export function injectSsrSeed(html: string, seed: unknown, ctx = 'inject-ssr-body'): string {
  if (!html.includes('</body>')) {
    throw new Error(`[${ctx}] index.html に </body> が見つからない（テンプレート想定外）`);
  }
  const json = JSON.stringify(seed).replace(/</g, '\\u003c');
  return html.replace(
    '</body>',
    `    <script id="${SSR_SEED_ELEMENT_ID}" type="application/json">${json}</script>\n  </body>`,
  );
}
