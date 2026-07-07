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
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { newsArticles } from '../client/src/data/news';
import { injectSsrBody } from './lib/inject-ssr-body';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ORIGIN = 'https://gta6-feed.com';
const DEFAULT_IMAGE = '/images/news/Official_Cover_Art_landscape.webp';
const SITE_NAME = 'GTA6 FEED';

const TEMPLATE = readFileSync(resolve(ROOT, 'dist/public/index.html'), 'utf8');

// SSRバンドル（dist/server/entry-server.js）の render() で記事本文を生HTML化する。
// このスクリプトは <head>（title/canonical/OG/JSON-LD）の所有者であり続け、本文だけを
// #root へ足す。render は同期（getArticleById で記事を即解決）。
// ※ build スクリプトは vite build --ssr の後にこのスクリプトを実行すること。
interface ServerEntry {
  render: (url: string) => { html: string } | null;
}
const server = (await import(
  pathToFileURL(resolve(ROOT, 'dist/server/entry-server.js')).href
)) as unknown as ServerEntry;

// 本文SSRに失敗した（本文が入らなかった）ルートを集約し、最後に WARN する。
// head は入っているので致命ではないが、CSRシェルに逆戻りした記事を検知できるようにする。
const bodyFailures: string[] = [];

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const toAbs = (p: string) => (/^https?:\/\//i.test(p) ? p : ORIGIN + (p.startsWith('/') ? p : `/${p}`));

// 置換パターンが1つも見つからなかったキーを集約し、ビルド最後に WARN する。
// （テンプレートの <head> フォーマット変更で silent に既定値が残る事故を検知するため）
const missedReplacements = new Set<string>();

/** re がマッチしなければ label を記録して素通しする（silent no-op を検知可能にする）。 */
function replaceTracked(html: string, re: RegExp, replacement: string, label: string): string {
  if (!re.test(html)) {
    missedReplacements.add(label);
    return html;
  }
  return html.replace(re, replacement);
}

// <meta name|property="key" content="..."> の content を置換。
// 属性間の空白は \s+ とし、prettier が長い content を折り返した複数行<meta>
// （<meta 改行 name="..." 改行 content="...">）にもマッチさせる。key で確実にアンカーし、
// content="[^"]*" の非貪欲な文字クラスで隣接する他の<meta>は巻き込まない。
function setMeta(html: string, key: string, content: string): string {
  const k = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(<meta\\s+(?:name|property)="${k}"\\s+content=")[^"]*(")`);
  return replaceTracked(html, re, `$1${esc(content)}$2`, `meta[${key}]`);
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
  html = replaceTracked(html, /<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`, 'title');
  // canonical（各言語版は自言語URLを自己参照）
  html = replaceTracked(html, /(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`, 'canonical');
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

  // 本文を #root へ焼き込む（head はここまでで確定済み。body だけ足す）。
  // SSRで例外が出ても head は残したままビルドを止めない（本文はCSRにフォールバック）。
  const route = `${isEn ? '/en' : ''}/news/${article.id}`;
  try {
    const out = server.render(route);
    if (out && out.html) {
      html = injectSsrBody(html, out.html, 'prerender-og');
    } else {
      bodyFailures.push(route);
    }
  } catch (e) {
    bodyFailures.push(`${route} (${(e as Error).message})`);
  }

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
if (bodyFailures.length) {
  console.warn(
    `[prerender] WARN: 本文SSRが入らなかったルート: ${bodyFailures.join(', ')} ` +
      `— head は出力済みだが #root は空シェルのまま（該当記事は本文がCSRに逆戻り）。`,
  );
}
if (missedReplacements.size) {
  console.warn(
    `[prerender] WARN: <head> 置換が未マッチ: ${[...missedReplacements].join(', ')} ` +
      `— テンプレート(dist/public/index.html)の<head>フォーマット変更の可能性。該当メタが既定値のまま出力されています。`,
  );
}
