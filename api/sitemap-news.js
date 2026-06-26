// ============================================================================
//  管理画面から投稿した DB 記事（news_posts）用の動的サイトマップ。
//
//  静的記事・固定ページはビルド時生成の /sitemap.xml に含まれる。
//  DB記事は再ビルドなしでスマホから増えるため、ここでリクエスト時に Supabase を
//  引いて最新の記事URLを返す。robots.txt から追加サイトマップとして参照する。
//  vercel.json の rewrite: /sitemap-news.xml -> /api/sitemap-news
// ============================================================================

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://uawyuxegcywatkfgyycp.supabase.co';
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'sb_publishable_56-mcQqzWE-afZce8zFb7Q_qhGAclS3';

const ORIGIN = 'https://gta6-feed.com';
const ID_OFFSET = 100000;

export default async function handler(_req, res) {
  let rows = [];
  try {
    const u = `${SUPABASE_URL}/rest/v1/news_posts?published=eq.true&select=id,published_at,updated_at&order=published_at.desc`;
    const r = await fetch(u, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (r.ok) rows = await r.json();
  } catch {
    /* 取得失敗時は空のサイトマップを返す */
  }

  const entries = (Array.isArray(rows) ? rows : [])
    .map((row) => {
      const id = ID_OFFSET + Number(row.id);
      const lastmod = String(row.updated_at || row.published_at || '').slice(0, 10);
      return [
        '  <url>',
        `    <loc>${ORIGIN}/news/${id}</loc>`,
        lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
        '    <changefreq>weekly</changefreq>',
        '    <priority>0.8</priority>',
        '  </url>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600');
  res.status(200).send(xml);
}
