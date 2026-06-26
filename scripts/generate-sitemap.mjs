// ============================================================================
//  sitemap.xml 自動生成スクリプト（ビルド前に実行）
// ----------------------------------------------------------------------------
//  client/src/data/news.ts から記事ID・日付を読み取り、固定ページと記事ページを
//  まとめた sitemap を client/public/sitemap.xml に書き出す。
//  記事を追加しても再ビルドすれば自動で sitemap に反映される。
// ============================================================================
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ORIGIN = 'https://gta6-feed.com';

// --- 固定ページ（手動メンテ） -------------------------------------------------
const STATIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/news', priority: '0.9', changefreq: 'daily' },
  { path: '/servers', priority: '0.8', changefreq: 'daily' },
  { path: '/board', priority: '0.8', changefreq: 'daily' },
  { path: '/board/gta6', priority: '0.7', changefreq: 'daily' },
  { path: '/board/gtarp', priority: '0.7', changefreq: 'daily' },
  { path: '/board/gtarp-servers', priority: '0.7', changefreq: 'daily' },
  { path: '/board/streamer-servers', priority: '0.7', changefreq: 'daily' },
  { path: '/fivem-gtarp', priority: '0.8', changefreq: 'weekly' },
  { path: '/fivem-gtarp/what-is-fivem', priority: '0.7', changefreq: 'monthly' },
  { path: '/fivem-gtarp/what-is-gtarp', priority: '0.7', changefreq: 'monthly' },
  { path: '/fivem-gtarp/fivem-vs-gtarp', priority: '0.7', changefreq: 'monthly' },
  { path: '/fivem-gtarp/server-guide', priority: '0.7', changefreq: 'monthly' },
  { path: '/fivem-gtarp/how-to-install', priority: '0.7', changefreq: 'monthly' },
  { path: '/contact', priority: '0.4', changefreq: 'yearly' },
  { path: '/terms', priority: '0.3', changefreq: 'yearly' },
];

// --- ニュース記事（news.ts から id と日付を抽出） -----------------------------
function extractArticles() {
  const src = readFileSync(resolve(ROOT, 'client/src/data/news.ts'), 'utf8');
  const articles = [];
  // `id: 12,` の直後に続くブロックから date を拾う。記事オブジェクト単位で走査。
  const idRe = /\bid:\s*(\d+)\s*,/g;
  let m;
  while ((m = idRe.exec(src))) {
    const id = m[1];
    // この id 以降の最初の date を採用（同じオブジェクト内のはず）。
    const rest = src.slice(m.index, m.index + 2000);
    const dateMatch = rest.match(/\bdate:\s*["'](\d{4}-\d{2}-\d{2})["']/);
    articles.push({ id, date: dateMatch ? dateMatch[1] : null });
  }
  return articles;
}

function urlEntry({ loc, lastmod, priority, changefreq }) {
  return [
    '  <url>',
    `    <loc>${loc}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
    priority ? `    <priority>${priority}</priority>` : null,
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');
}

const articles = extractArticles();
const entries = [
  ...STATIC_ROUTES.map((r) =>
    urlEntry({ loc: `${ORIGIN}${r.path}`, priority: r.priority, changefreq: r.changefreq }),
  ),
  ...articles.map((a) =>
    urlEntry({
      loc: `${ORIGIN}/news/${a.id}`,
      lastmod: a.date,
      priority: '0.8',
      changefreq: 'weekly',
    }),
  ),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

const out = resolve(ROOT, 'client/public/sitemap.xml');
writeFileSync(out, xml, 'utf8');
console.log(`[sitemap] ${STATIC_ROUTES.length} static + ${articles.length} articles → client/public/sitemap.xml`);
