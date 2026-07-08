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
  { path: '/board/fivem-dev', priority: '0.7', changefreq: 'daily' },
  { path: '/fivem-gtarp', priority: '0.8', changefreq: 'weekly' },
  { path: '/fivem-gtarp/what-is-fivem', priority: '0.7', changefreq: 'monthly' },
  { path: '/fivem-gtarp/what-is-gtarp', priority: '0.7', changefreq: 'monthly' },
  { path: '/fivem-gtarp/fivem-vs-gtarp', priority: '0.7', changefreq: 'monthly' },
  { path: '/fivem-gtarp/server-guide', priority: '0.7', changefreq: 'monthly' },
  { path: '/fivem-gtarp/server-setup', priority: '0.7', changefreq: 'monthly' },
  { path: '/fivem-gtarp/field-notes/dev-diary', priority: '0.7', changefreq: 'weekly' },
  { path: '/fivem-gtarp/field-notes/visit-note', priority: '0.6', changefreq: 'weekly' },
  { path: '/fivem-gtarp/how-to-install', priority: '0.7', changefreq: 'monthly' },
  { path: '/fivem-gtarp/history', priority: '0.7', changefreq: 'monthly' },
  { path: '/fivem-gtarp/glossary', priority: '0.7', changefreq: 'monthly' },
  { path: '/fivem-gtarp/faq', priority: '0.7', changefreq: 'monthly' },
  { path: '/fivem-gtarp/commands', priority: '0.7', changefreq: 'monthly' },
  { path: '/fivem-gtarp/streamer-server-history', priority: '0.7', changefreq: 'monthly' },
  { path: '/fivem-gtarp/observer-guide', priority: '0.7', changefreq: 'monthly' },
  { path: '/fivem-gtarp/first-day-guide', priority: '0.7', changefreq: 'monthly' },
  { path: '/fivem-gtarp/tools', priority: '0.6', changefreq: 'monthly' },
  { path: '/fivem-gtarp/tools/image-resize', priority: '0.6', changefreq: 'monthly' },
  { path: '/fivem-gtarp/tools/image-mask', priority: '0.6', changefreq: 'monthly' },
  { path: '/about', priority: '0.5', changefreq: 'yearly' },
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

// --- 体験記（fieldNotes.ts から slug と日付を抽出） ------------------------
// 体験記の記事は動的ルート（/fivem-gtarp/field-notes/<slug>）で日英の対がある。
function extractFieldNotes() {
  const src = readFileSync(resolve(ROOT, 'client/src/data/fieldNotes.ts'), 'utf8');
  const notes = [];
  const slugRe = /\bslug:\s*["']([a-z0-9-]+)["']/g;
  let m;
  while ((m = slugRe.exec(src))) {
    const slug = m[1];
    const rest = src.slice(m.index, m.index + 800);
    const catMatch = rest.match(/\bcategory:\s*["'](dev-diary|visit-note)["']/);
    const dateMatch = rest.match(/\bdate:\s*["'](\d{4}-\d{2}-\d{2})["']/);
    notes.push({ slug, category: catMatch ? catMatch[1] : 'dev-diary', date: dateMatch ? dateMatch[1] : null });
  }
  return notes;
}

const articles = extractArticles();
const fieldNotes = extractFieldNotes();

// 日英の対がある（=/en/ 版を持つ）静的ルートか。client/src/lib/routes.ts と一致させる。
const isLocalized = (p) =>
  p.startsWith('/fivem-gtarp') || p === '/about' || p === '/contact' || p === '/terms';

const entries = [
  // 日本語：固定ページ
  ...STATIC_ROUTES.map((r) =>
    urlEntry({ loc: `${ORIGIN}${r.path}`, priority: r.priority, changefreq: r.changefreq }),
  ),
  // 英語：日英の対がある固定ページのみ /en/ を追加
  ...STATIC_ROUTES.filter((r) => isLocalized(r.path)).map((r) =>
    urlEntry({ loc: `${ORIGIN}/en${r.path}`, priority: r.priority, changefreq: r.changefreq }),
  ),
  // 日本語：記事
  ...articles.map((a) =>
    urlEntry({ loc: `${ORIGIN}/news/${a.id}`, lastmod: a.date, priority: '0.8', changefreq: 'weekly' }),
  ),
  // 英語：記事（日英の対あり）
  ...articles.map((a) =>
    urlEntry({ loc: `${ORIGIN}/en/news/${a.id}`, lastmod: a.date, priority: '0.8', changefreq: 'weekly' }),
  ),
  // 日本語：体験記の記事（/fivem-gtarp/field-notes/<category>/<slug>）
  ...fieldNotes.map((n) =>
    urlEntry({ loc: `${ORIGIN}/fivem-gtarp/field-notes/${n.category}/${n.slug}`, lastmod: n.date, priority: '0.7', changefreq: 'monthly' }),
  ),
  // 英語：体験記の記事（日英の対あり）
  ...fieldNotes.map((n) =>
    urlEntry({ loc: `${ORIGIN}/en/fivem-gtarp/field-notes/${n.category}/${n.slug}`, lastmod: n.date, priority: '0.7', changefreq: 'monthly' }),
  ),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

const out = resolve(ROOT, 'client/public/sitemap.xml');
writeFileSync(out, xml, 'utf8');
console.log(`[sitemap] ${STATIC_ROUTES.length} static + ${articles.length} articles + ${fieldNotes.length} field-notes → client/public/sitemap.xml`);
