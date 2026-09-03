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
import {
  newsArticles,
  isHiddenNewsId,
  isRedirectedNewsId,
  isNoindexNewsId,
  HIDDEN_NEWS_IDS,
  REDIRECTED_NEWS_IDS,
} from '../client/src/data/news';
import { injectSsrBody } from './lib/inject-ssr-body';
import { stripAdsScript } from './lib/ads-html';
import { isAdFreePath } from '../client/src/lib/ads';
import { isEnNoindexPath, isHreflangEnabled } from '../client/src/lib/en-indexing';
import { ORIGIN, SITE_NAME, DEFAULT_IMAGE, toAbs } from './lib/site';
import { articleNode, breadcrumbNode, homeCrumb, injectLd } from './lib/jsonld';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const TEMPLATE = readFileSync(resolve(ROOT, 'dist/public/index.html'), 'utf8');

// noindex 対象の記事ID（本文・URLは残しつつ検索インデックスからのみ外す）は
// client/src/data/news.ts の NOINDEX_NEWS_IDS に集約した（isNoindexNewsId）。
// ここに入れた記事は <head> に <meta name="robots" content="noindex,follow"> を
// 焼き込む（日英とも）。CSR側(useSeo)は robots メタに触れないため実行時も保持される。
// sitemap 側の除外も同じ定義（news.ts）を読むので、片方だけズレることはない。

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
  // meta description は 160字で切る。JSON-LD には切らない説明を使う。
  const descFull = (aDesc || '').replace(/\s+/g, ' ').trim();
  const desc = descFull.slice(0, 160);
  const base = `/news/${article.id}`;
  // 言語プレフィックス付きの実パス（robots / 広告の判定に使う）。
  const localizedPath = `${isEn ? '/en' : ''}${base}`;
  const url = `${ORIGIN}${localizedPath}`;
  const jaUrl = `${ORIGIN}${base}`;
  const enUrl = `${ORIGIN}/en${base}`;
  const image = toAbs(article.image || DEFAULT_IMAGE);
  const published = /T|\s/.test(article.publishedAt || '')
    ? (article.publishedAt as string).replace(' ', 'T')
    : `${article.date}T09:00:00+09:00`;
  // 公開後に訂正した記事（updatedAt あり）は dateModified だけ更新日にする。
  const modified = article.updatedAt ? `${article.updatedAt}T09:00:00+09:00` : published;

  let html = TEMPLATE;
  // <html lang>：テンプレート（client/index.html）は ja 固定なので、英語版は en へ差し替える。
  html = replaceTracked(html, /(<html\s+lang=")[^"]*(")/, `$1${lang}$2`, 'html[lang]');
  // <title>
  html = replaceTracked(html, /<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`, 'title');
  // canonical（各言語版は自言語URLを自己参照）
  html = replaceTracked(html, /(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`, 'canonical');
  // robots: noindex 対象のみ <head> に焼き込む（本文・canonical は残す）。
  //   - NOINDEX_NEWS_IDS の記事（日英とも）                     … noindex,follow
  //   - /en 配下の一時 noindex（en-indexing.ts の EN_INDEXING_ENABLED=false） … noindex
  // 両方に当たる記事でも robots メタは1本だけ出す（2本あると解釈が不定になる）。
  const robots = isNoindexNewsId(article.id)
    ? 'noindex,follow'
    : isEnNoindexPath(localizedPath)
      ? 'noindex'
      : null;
  if (robots) {
    html = html.replace('</head>', `    <meta name="robots" content="${robots}" />\n  </head>`);
  }
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

  // hreflang（記事は日英の対あり）。/en を noindex にしている間は出さない
  // （noindex のページを alternate として宣言すると矛盾シグナルになるため）。
  if (isHreflangEnabled()) {
    const alt = [
      `<link rel="alternate" hreflang="ja" href="${jaUrl}" />`,
      `<link rel="alternate" hreflang="en" href="${enUrl}" />`,
      `<link rel="alternate" hreflang="x-default" href="${jaUrl}" />`,
    ].join('\n    ');
    html = html.replace('</head>', `    ${alt}\n  </head>`);
  }

  // JSON-LD（NewsArticle + パンくず）。組み立ては scripts/lib/jsonld.ts に集約している
  // （プリレンダ3スクリプトで publisher・絶対URLの扱いを1本にするため）。
  html = injectLd(
    html,
    [
      articleNode({
        type: 'NewsArticle',
        url,
        headline: aTitle,
        description: descFull,
        image,
        datePublished: published,
        dateModified: modified,
        lang,
      }),
      breadcrumbNode([
        homeCrumb(lang),
        { name: isEn ? 'News' : '最新情報', url: `${ORIGIN}${isEn ? '/en' : ''}/news` },
        { name: aTitle, url },
      ]),
    ],
    'prerender-og',
  );

  // 広告：記事ページは通常 AdSense を載せるが、/en を noindex にしている間は
  // /en 版から落とす（判定は client/src/lib/ads.ts の isAdFreePath が単一の正）。
  if (isAdFreePath(localizedPath)) {
    html = stripAdsScript(html, 'prerender-og');
    adFree++;
  }

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
let adFree = 0;
for (const article of newsArticles) {
  // 非表示記事（data/news.ts の HIDDEN_NEWS_IDS）は静的HTMLを生成しない。
  // URL は vercel.json が /fivem-gtarp へ 302 する。記事データ自体は残っているので、
  // HIDDEN_NEWS_IDS から id を消して再ビルドすればそのまま復活する。
  if (isHiddenNewsId(article.id)) continue;
  // 301統合済みの記事（id17→19）も生成しない。URL は必ずリダイレクトされるため、
  // 生成しても配信されない死んだファイルになる。
  if (isRedirectedNewsId(article.id)) continue;
  // 日本語版（/news/<id>）と英語版（/en/news/<id>）の両方を生成。
  for (const lang of ['ja', 'en'] as const) {
    const html = buildHtml(article, lang);
    const dir = resolve(ROOT, `dist/public${lang === 'en' ? '/en' : ''}/news/${article.id}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, 'index.html'), html, 'utf8');
    count++;
  }
}
console.log(
  `[prerender] ${count} 記事ページ（日英）を生成: dist/public/(en/)news/<id>/index.html` +
    (HIDDEN_NEWS_IDS.length
      ? `（非表示 ${HIDDEN_NEWS_IDS.length}件はスキップ: id ${HIDDEN_NEWS_IDS.join(', ')}`
      : '（') +
    (REDIRECTED_NEWS_IDS.length ? ` / 301統合: id ${REDIRECTED_NEWS_IDS.join(', ')}）` : '）') +
    (adFree ? `（うち広告なし ${adFree} ページ）` : ''),
);
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
