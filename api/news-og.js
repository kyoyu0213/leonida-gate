// ============================================================================
//  DB記事（管理画面から投稿）用の OGP/Twitter Card 配信（Vercelサーバーレス関数）
//
//  静的記事(/news/1..) はビルド時にプリレンダ済み（scripts/prerender-og.ts）。
//  DB記事(/news/100001..) はビルド後に作られるためプリレンダできないので、
//  この関数が Supabase から記事を引き、index.html に OGP メタを差し込んで返す。
//  vercel.json の rewrite で /news/<数字> のうち静的ファイルが無いものがここへ来る。
// ============================================================================

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://uawyuxegcywatkfgyycp.supabase.co';
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'sb_publishable_56-mcQqzWE-afZce8zFb7Q_qhGAclS3';

const SITE = 'https://gta6-feed.com';
const ID_OFFSET = 100000;
const DEFAULT_IMAGE = `${SITE}/images/news/Official_Cover_Art_landscape.webp`;

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default async function handler(req, res) {
  const id = parseInt(String((req.query && req.query.id) || ''), 10);

  // 1) ベースの index.html を自ホストから取得（SPA本体を維持したままメタだけ差し替える）。
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  let html = '';
  try {
    const r = await fetch(`${proto}://${host}/index.html`);
    if (r.ok) html = await r.text();
  } catch {
    /* fallback below */
  }

  // 2) DB記事を取得（公開記事のみ）。
  let title = 'GTA6 FEED';
  let desc = 'GTA6・FiveM RPの最新情報';
  let image = DEFAULT_IMAGE;
  if (Number.isFinite(id) && id >= ID_OFFSET) {
    const dbId = id - ID_OFFSET;
    try {
      const u = `${SUPABASE_URL}/rest/v1/news_posts?id=eq.${dbId}&published=eq.true&select=title,description,eyecatch_url`;
      const r = await fetch(u, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      });
      const rows = await r.json();
      if (Array.isArray(rows) && rows[0]) {
        if (rows[0].title) title = rows[0].title;
        if (rows[0].description) desc = rows[0].description;
        if (rows[0].eyecatch_url) image = rows[0].eyecatch_url;
      }
    } catch {
      /* keep defaults */
    }
  }

  const url = `${SITE}/news/${id}`;
  const fullTitle = `${title}｜GTA6 FEED`;
  const meta = [
    `<meta property="og:type" content="article" />`,
    `<meta property="og:site_name" content="GTA6 FEED" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:title" content="${esc(fullTitle)}" />`,
    `<meta property="og:description" content="${esc(desc)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(fullTitle)}" />`,
    `<meta name="twitter:description" content="${esc(desc)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
  ].join('\n    ');

  if (html) {
    html = html
      .replace(/\n\s*<meta property="og:[^>]*>/g, '')
      .replace(/\n\s*<meta name="twitter:[^>]*>/g, '')
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(fullTitle)}</title>`)
      .replace('</head>', `    ${meta}\n  </head>`);
  } else {
    // index.html を取れなかった場合の最小フォールバック（クローラ向けメタのみ）。
    html = `<!doctype html><html lang="ja"><head><meta charset="utf-8" /><title>${esc(fullTitle)}</title>\n    ${meta}\n  </head><body></body></html>`;
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600');
  res.status(200).send(html);
}
