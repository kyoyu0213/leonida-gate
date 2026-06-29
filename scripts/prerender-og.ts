// ============================================================================
//  記事ページのプリレンダ（SEO/SNSカード用）。
//  vite build 後に実行し、各ニュース記事 /news/:id 用の静的HTMLを生成する。
//  SPAなのでSNS（X/Discord等）のクローラはJSを実行せず初期HTMLのOGタグだけを見る。
//  → 記事ごとにOGタグ・タイトル・canonical を差し替え、JSON-LD構造化データも注入。
//
//  出力: dist/public/news/<id>/index.html （Vercelが /news/<id> で配信）
//  実行: tsx scripts/prerender-og.ts （build スクリプトから呼ぶ）
// ============================================================================
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { newsArticles } from '../client/src/data/news';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ORIGIN = 'https://gta6-feed.com';
const DEFAULT_IMAGE = '/images/news/Official_Cover_Art_landscape.webp';
const SITE_NAME = 'GTA6 FEED';

const TEMPLATE = readFileSync(resolve(ROOT, 'dist/public/index.html'), 'utf8');

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const toAbs = (p: string) => (/^https?:\/\//i.test(p) ? p : ORIGIN + (p.startsWith('/') ? p : `/${p}`));

function setMeta(html: string, key: string, content: string): string {
  const re = new RegExp(
    `(<meta (?:name|property)="${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}" content=")[^"]*(")`,
  );
  return html.replace(re, `$1${esc(content)}$2`);
}

function buildHtml(article: (typeof newsArticles)[number], lang: 'ja' | 'en'): string {
  const isEn = lang === 'en';
  const aTitle = (isEn && article.titleEn ? article.titleEn : article.title) || '';
  const aDesc = isEn && article.descriptionEn ? article.descriptionEn : article.description;

  const title = `${aTitle} | ${SITE_NAME}`;
  const desc = (aDesc || '').replace(/\s+/g, ' ').trim().slice(0, 160);
  const base = `/news/${article.id}`;
  const url = `${ORIGIN}${isEn ? '/en' : ''}${base}`;
  const jaUrl = `${ORIGIN}${base}`;
  const enUrl = `${ORIGIN}/en${base}`;
  const image = toAbs(article.image || DEFAULT_IMAGE);
  const published = /T|\s/.test(article.publishedAt || '')
    ? (article.publishedAt as string).replace(' ', 'T')
    : `${article.date}T09:00:00+09:00`;

  let html = TEMPLATE;
  // <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  // canonical（各言語版は自言語URLを自己参照）
  html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`);
  // meta 各種
  html = setMeta(html, 'description', desc);
  html = setMeta(html, 'og:type', 'article');
  html = setMeta(html, 'og:url', url);
  html = setMeta(html, 'og:title', title);
  html = setMeta(html, 'og:description', desc);
  html = setMeta(html, 'og:image', image);
  html = setMeta(html, 'twitter:title', title);
  html = setMeta(html, 'twitter:description', desc);
  html = setMeta(html, 'twitter:image', image);

  // hreflang（記事は日英の対あり）。
  const alt = [
    `<link rel="alternate" hreflang="ja" href="${jaUrl}" />`,
    `<link rel="alternate" hreflang="en" href="${enUrl}" />`,
    `<link rel="alternate" hreflang="x-default" href="${jaUrl}" />`,
  ].join('\n    ');
  html = html.replace('</head>', `    ${alt}\n  </head>`);

  // JSON-LD（NewsArticle + パンくず）。"<" はエスケープして </script> 破壊を防ぐ。
  const crumbHome = isEn ? 'Home' : 'ホーム';
  const crumbNews = isEn ? 'News' : '最新情報';
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'NewsArticle',
        inLanguage: isEn ? 'en' : 'ja',
        headline: aTitle,
        description: desc,
        image: [image],
        datePublished: published,
        dateModified: published,
        author: { '@type': 'Organization', name: SITE_NAME },
        publisher: { '@type': 'Organization', name: SITE_NAME },
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: crumbHome, item: `${ORIGIN}${isEn ? '/en' : '/'}` },
          { '@type': 'ListItem', position: 2, name: crumbNews, item: `${ORIGIN}${isEn ? '/en' : ''}/news` },
          { '@type': 'ListItem', position: 3, name: aTitle, item: url },
        ],
      },
    ],
  };
  const ldScript = `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`;
  html = html.replace('</head>', `${ldScript}</head>`);

  return html;
}

let count = 0;
for (const article of newsArticles) {
  // 日本語版（/news/<id>）と英語版（/en/news/<id>）の両方を生成。
  for (const lang of ['ja', 'en'] as const) {
    const html = buildHtml(article, lang);
    const dir = resolve(ROOT, `dist/public${lang === 'en' ? '/en' : ''}/news/${article.id}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, 'index.html'), html, 'utf8');
    count++;
  }
}
console.log(`[prerender] ${count} 記事ページ（日英）を生成: dist/public/(en/)news/<id>/index.html`);
