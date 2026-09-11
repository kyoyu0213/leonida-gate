// ============================================================================
//  公開を終了した記事に 410 Gone を返す（Vercelサーバーレス関数）
// ----------------------------------------------------------------------------
//  vercel.json の rewrites で /news/<id> と /en/news/<id>（id は client/src/data/news.ts の
//  GONE_NEWS_IDS）をここへ送る。静的HTMLは生成していない（prerender-og が飛ばす）ので、
//  ファイルシステムより先に拾われることはない。
//
//  返すHTMLはシェル（app.html）そのままで、React の NewsDetail が GONE_NEWS_IDS を見て
//  「この記事は公開を終了しました」を描画する。違いはステータスが 410 になること。
//  api/not-found.js（404）と同じ作り。
//
//  背景：2026-07-27 から非表示にしていた記事を記事と無関係な /fivem-gtarp へ 302 していたが、
//  「無関係なページへの転送」はソフト404と判定されうるため、2026-09-12 に 410 へ切り替えた
//  （内容を引き継いだ後継記事がある ID は REDIRECTED_NEWS_IDS で 301）。
// ============================================================================

export default async function handler(req, res) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';

  let html = '';
  try {
    const r = await fetch(`${proto}://${host}/app.html`);
    if (r.ok) html = await r.text();
  } catch {
    /* 下のフォールバックへ */
  }

  if (!html) {
    // app.html を取れなかったときの最小フォールバック。noindex は必ず付ける。
    html =
      '<!doctype html><html lang="ja"><head><meta charset="utf-8" />' +
      '<meta name="robots" content="noindex" />' +
      '<title>この記事は公開を終了しました｜GTA6 FEED</title>' +
      '</head><body><p>この記事は公開を終了しました。</p></body></html>';
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // 410 でも本来 noindex は不要だが、安全側でヘッダーでも明示する。
  res.setHeader('X-Robots-Tag', 'noindex');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(410).send(html);
}
