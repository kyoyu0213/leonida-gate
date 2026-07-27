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
//  17: id19 へ 301 統合（vercel.json redirects）
//  29: noindex,follow（prerender-og.ts の NOINDEX_IDS）
//  それ以外: 一時的に非表示にしている記事（client/src/data/news.ts の HIDDEN_NEWS_IDS）。
//    ここは news.ts をテキストとして読んで自動同期する。片方だけ直して
//    「sitemap には載るのに 302 される」不整合が起きるのを防ぐため。
const MERGED_OR_NOINDEX_IDS = ['17', '29'];

function readHiddenNewsIds() {
  const src = readFileSync(resolve(ROOT, 'client/src/data/news.ts'), 'utf8');
  const m = src.match(/export const HIDDEN_NEWS_IDS:\s*readonly number\[\]\s*=\s*\[([\s\S]*?)\]/);
  if (!m) {
    // 宣言の書式が変わるとチェックが黙って素通りするため、ビルドを止める。
    throw new Error(
      '[sitemap] news.ts の HIDDEN_NEWS_IDS を解析できませんでした。' +
        'generate-sitemap.mjs の readHiddenNewsIds() を宣言の書式に合わせて直してください。',
    );
  }
  return [...m[1].matchAll(/\d+/g)].map((x) => x[0]);
}

const hiddenIds = readHiddenNewsIds();
const EXCLUDE_IDS = new Set([...MERGED_OR_NOINDEX_IDS, ...hiddenIds]);

const articles = extractArticles().filter((a) => !EXCLUDE_IDS.has(String(a.id)));
const fieldNotes = extractFieldNotes();

// 日英の対がある（=/en/ 版を持つ）静的ルートかの判定は static-routes.mjs 側に集約。
const isLocalized = isLocalizedStaticPath;

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
console.log(
  `[sitemap] ${STATIC_ROUTES.length} static + ${articles.length} articles + ${fieldNotes.length} field-notes → client/public/sitemap.xml` +
    `（記事除外 ${EXCLUDE_IDS.size}件: 統合/noindex ${MERGED_OR_NOINDEX_IDS.join(',')} / 非表示 ${hiddenIds.join(',')}）`,
);
