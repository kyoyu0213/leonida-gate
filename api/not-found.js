// ============================================================================
//  未知URLに 404 を返す（Vercelサーバーレス関数）
// ----------------------------------------------------------------------------
//  vercel.json の rewrites で、
//    - 静的プリレンダ済みページ … ファイルシステムが先に勝つのでここへ来ない
//    - 既知の CSR ルート        … 明示的に /app.html へ rewrite しているので来ない
//    - /news/<数字>             … /api/news-og が処理するので来ない
//  つまり、ここに到達するのは「アプリのどのルートにも該当しない未知URL」だけ。
//
//  返すHTMLはシェル（app.html）そのままなので、React は URL を見て NotFound を
//  描画する＝ユーザーの見た目は従来と変わらない。違いはステータスが 404 になること。
//
//  背景：以前は catch-all が全ての未知URLに 200 を返しており、
//  noindex で守れてはいたがソフト404の構造だった（2026-08-08 の監査）。
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
    // app.html を取れなかったときの最小フォールバック。
    // noindex は必ず付ける（保険）。canonical は付けない。
    html =
      '<!doctype html><html lang="ja"><head><meta charset="utf-8" />' +
      '<meta name="robots" content="noindex" />' +
      '<title>ページが見つかりません｜GTA6 FEED</title>' +
      '</head><body><div id="root"></div></body></html>';
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // 同じ未知URLへの再アクセスは Edge キャッシュで返し、関数の呼び出しを抑える。
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(404).send(html);
}
