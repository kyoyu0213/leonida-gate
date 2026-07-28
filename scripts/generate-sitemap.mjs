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
import { STATIC_ROUTES, isLocalizedStaticPath } from './lib/static-routes.mjs';
import { readNewsIdLists, isIndexableNewsId } from './lib/news-visibility.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ORIGIN = 'https://gta6-feed.com';

// --- 固定ページ ---------------------------------------------------------------
// STATIC_ROUTES は scripts/lib/static-routes.mjs へ切り出し済み（単一の正）。
// scripts/check-route-tables.mjs が prebuild で「sitemap に載るがプリレンダされない」
// ルートを検出するために同じ配列を参照する。

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

// sitemap から除外する記事ID。
// 判定は client/src/data/news.ts の isIndexableNewsId() が正で、
// ここは scripts/lib/news-visibility.mjs 経由で同じ3配列
//  （HIDDEN_NEWS_IDS / REDIRECTED_NEWS_IDS / NOINDEX_NEWS_IDS）を読む。
// 以前はこのファイルに ['17','29'] という手書きの別リストがあり、news.ts と
// 二重管理になっていた（片方だけ直すと「sitemap には載るのに 302 される」不整合）。
const newsIds = readNewsIdLists();

const articles = extractArticles().filter((a) => isIndexableNewsId(a.id, newsIds));
const fieldNotes = extractFieldNotes();

// 日英の対がある（=/en/ 版を持つ）静的ルートかの判定は static-routes.mjs 側に集約。
const isLocalized = isLocalizedStaticPath;

const entries = [
  // 日本語：固定ページ
  ...STATIC_ROUTES.map((r) =>
    urlEntry({ loc: `${ORIGIN}${r.path}`, priority: r.priority, changefreq: r.changefreq }),
  ),
  // 英語：日英の対がある固定ページのみ /en/ を追加
  // ホーム（path='/'）だけは素朴に連結すると /en/ になり、canonical・hreflang が
  // 出す /en（末尾スラッシュ無し）と別URLになってしまうため、ここで落とす。
  ...STATIC_ROUTES.filter((r) => isLocalized(r.path)).map((r) =>
    urlEntry({
      loc: `${ORIGIN}/en${r.path === '/' ? '' : r.path}`,
      priority: r.priority,
      changefreq: r.changefreq,
    }),
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
console.log(
  `[sitemap] ${STATIC_ROUTES.length} static + ${articles.length} articles + ${fieldNotes.length} field-notes → client/public/sitemap.xml` +
    `（記事除外 ${newsIds.excluded.size}件: 非表示 ${newsIds.hidden.join(',')} / ` +
    `301統合 ${newsIds.redirected.join(',')} / noindex ${newsIds.noindex.join(',')}）`,
);
