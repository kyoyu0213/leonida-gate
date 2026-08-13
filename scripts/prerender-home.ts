// ============================================================================
//  ホーム（/ と /en）のプリレンダ。
//  ホームの `/` は catch-all シェル兼テンプレートである dist/public/index.html に
//  ファイルシステムで束縛されているため、prerender-routes の汎用ループには載せず
//  （載せると index.html＝シェルを上書きしてしまう）、この専用ステップで扱う。
//
//  手順（ビルドスクリプトで prerender-og / prerender-routes の「後」に実行すること）：
//   1) pristine な dist/public/index.html を dist/public/app.html へ書き出す
//      （catch-all `/(.*) → /app.html` が返す空シェル）。このとき app.html にだけ
//      <meta name="robots" content="noindex"> を焼く。→ 下の NOTE 参照
//   2) ホーム本文＋head を焼いて
//        - ja → dist/public/index.html      （`/` はこれをFS配信）
//        - en → dist/public/en/index.html   （`/en` はこれをFS配信・catch-allより優先）
//      に書き出す。
//
//  ※ prerender-og / prerender-routes は起動時に index.html を TEMPLATE として読むだけで
//    上書きはしないため、この時点の index.html はまだ pristine。順序が要。
// ============================================================================
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { injectSsrBody } from './lib/inject-ssr-body';
import { stripAdsScript } from './lib/ads-html';
import { ORIGIN, DEFAULT_IMAGE, toAbs } from './lib/site';
import { webSiteNode, organizationNode, collectionNode, injectLd } from './lib/jsonld';
import { indexableNewsArticles } from '../client/src/data/news';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

/** ホームの ItemList に載せる最新記事の件数（トップの記事セクションと同じ趣旨）。 */
const HOME_ITEMLIST_MAX = 12;

const INDEX_PATH = resolve(ROOT, 'dist/public/index.html');
const APP_PATH = resolve(ROOT, 'dist/public/app.html');

// この時点の index.html は pristine シェル（vite build 出力）。TEMPLATE として読む。
const TEMPLATE = readFileSync(INDEX_PATH, 'utf8');

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const missedReplacements = new Set<string>();
function replaceTracked(html: string, re: RegExp, replacement: string, label: string): string {
  if (!re.test(html)) {
    missedReplacements.add(label);
    return html;
  }
  return html.replace(re, replacement);
}
function setMeta(html: string, key: string, content: string): string {
  const k = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(<meta\\s+(?:name|property)="${k}"\\s+content=")[^"]*(")`);
  return replaceTracked(html, re, `$1${esc(content)}$2`, `meta[${key}]`);
}

interface RenderResult {
  html: string;
  seo: {
    title: string;
    description?: string;
    image?: string;
    type?: string;
    url?: string;
    localized?: boolean;
  } | null;
}
interface ServerEntry {
  render: (url: string) => RenderResult | null;
}
const mod = (await import(
  pathToFileURL(resolve(ROOT, 'dist/server/entry-server.js')).href
)) as unknown as ServerEntry;

// 1) pristine シェルを app.html として退避（catch-all の宛先）。ホーム焼き込みの前に行う。
//
// NOTE: app.html にだけ noindex を焼く理由
//   Vercel はファイルシステムを先に見るため、プリレンダ済みのページ
//   （dist/public/index.html＝ホーム、news/<id>/、fivem-gtarp/**、board/**、servers/ …）は
//   それぞれ独立したファイルとして配信され、app.html を経由しない。
//   app.html に到達するのは catch-all `/(.*) → /app.html` だけ、すなわち
//   「プリレンダされず #root が空のまま返るURL」＝
//     /search・/thread/<id>・/board/friends/<id>・/board/crews/<id>・/en/board 等の
//     CSR専用ルート、存在しない全URL（/news/99999・/404・タイポURL）、/app.html 自身。
//   境界がちょうど「空シェルで返るページ全体」と一致するので、ここ1箇所で一括 noindex にできる。
//
//   副作用（対応済み）: api/news-og.js が DB記事のOGP配信でこの app.html を取得して使うため、
//   記事が実在するときは同ハンドラ側で noindex を除去している（記事を noindex にしないため）。
const ROBOTS_META = '<meta name="robots" content="noindex" />';
if (!TEMPLATE.includes('</head>')) {
  throw new Error('[prerender-home] index.html に </head> が見つからない（テンプレート想定外）');
}
// app.html からは canonical を落とす。
//   テンプレート（client/index.html）の canonical はトップ（/）を指しており、
//   これが noindex と併存すると「インデックスするな」と「正規URLはトップだ」という
//   相反するシグナルを同時に送ることになる（2026-08-08 の監査）。
//   このシェルが返るのは CSR ルートと未知URLだけで、いずれも noindex 単独が正しい。
//   CSR の正当ページはマウント後に useSeo が自己参照 canonical を張り直す。
//   （api/news-og.js は元々この canonical を除去してから自前のものを足しているので影響なし）
// app.html からは AdSense のローダーも落とす。
//   このシェルが返るのは CSRルート（/thread/<id>・/board/friends|crews/<id>・/search・
//   /admin/*・/en/board* など）と未知URL＝すべて広告を出さない対象（client/src/lib/ads.ts）。
//   広告を出す唯一の例外は api/news-og.js が使うDB記事（/news/100001〜）だが、
//   そちらは CSR で AdsLoader がマウント時に注入するため、ここで落として問題ない。
const shell = stripAdsScript(
  TEMPLATE.replace(/\n?\s*<link rel="canonical"[^>]*>/, ''),
  'prerender-home',
).replace('</head>', `    ${ROBOTS_META}\n  </head>`);
if (shell.includes('rel="canonical"')) {
  throw new Error('[prerender-home] app.html から canonical を除去できなかった（書式変更の可能性）');
}
writeFileSync(APP_PATH, shell, 'utf8');

// 2) ホームを ja/en で焼く。
//    route は '/'（ja）と '/en'（en）。canonical は route 由来の自己参照、hreflang も付与。
const targets: { route: string; out: string }[] = [
  { route: '/', out: resolve(ROOT, 'dist/public/index.html') },
  { route: '/en', out: resolve(ROOT, 'dist/public/en/index.html') },
];

let count = 0;
const failures: string[] = [];
for (const { route, out } of targets) {
  const result = mod.render(route);
  if (!result || !result.html) {
    failures.push(route);
    continue;
  }
  const { html: body, seo } = result;
  const title = seo?.title || 'GTA6 FEED';
  // meta description は 160字で切る。JSON-LD には切らない説明を使う。
  const descFull = (seo?.description || '').replace(/\s+/g, ' ').trim();
  const desc = descFull.slice(0, 160);
  // canonical/og:url は自己参照：ja→ORIGIN + '/'、en→ORIGIN + '/en'
  const selfUrl = route === '/' ? `${ORIGIN}/` : `${ORIGIN}/en`;
  const image = toAbs(seo?.image || DEFAULT_IMAGE);

  // 言語（'/en'＝英語）。<html lang> と JSON-LD の inLanguage の両方で使う。
  const lang = route === '/en' ? 'en' : 'ja';
  const isEn = lang === 'en';

  let html = TEMPLATE;
  // <html lang>：テンプレート（client/index.html）は ja 固定なので、英語版は en へ差し替える。
  html = replaceTracked(html, /(<html\s+lang=")[^"]*(")/, `$1${lang}$2`, 'html[lang]');
  html = replaceTracked(html, /<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`, 'title');
  html = replaceTracked(html, /(<link rel="canonical" href=")[^"]*(")/, `$1${selfUrl}$2`, 'canonical');
  html = setMeta(html, 'description', desc);
  html = setMeta(html, 'og:type', seo?.type || 'website');
  html = setMeta(html, 'og:url', selfUrl);
  html = setMeta(html, 'og:title', title);
  html = setMeta(html, 'og:description', desc);
  html = setMeta(html, 'og:image', image);
  html = setMeta(html, 'twitter:title', title);
  html = setMeta(html, 'twitter:description', desc);
  html = setMeta(html, 'twitter:image', image);

  // hreflang（ja/en/x-default）。ホームは日英の対がある。
  const jaUrl = `${ORIGIN}/`;
  const enUrl = `${ORIGIN}/en`;
  const alt = [
    `<link rel="alternate" hreflang="ja" href="${jaUrl}" />`,
    `<link rel="alternate" hreflang="en" href="${enUrl}" />`,
    `<link rel="alternate" hreflang="x-default" href="${jaUrl}" />`,
  ].join('\n    ');
  html = html.replace('</head>', `    ${alt}\n  </head>`);

  // JSON-LD：サイト全体（WebSite / Organization）＋トップが並べる最新記事の ItemList。
  // 記事ページ・一覧ページ側の JSON-LD は prerender-og / prerender-routes が焼く。
  // lang / isEn は <html lang> の差し替えで先に算出済み。
  const latest = indexableNewsArticles.slice(0, HOME_ITEMLIST_MAX);
  html = injectLd(
    html,
    [
      webSiteNode(lang),
      organizationNode(),
      collectionNode({
        url: selfUrl,
        name: title,
        description: descFull,
        lang,
        // トップの記事カードは日本語記事へ（英語表示でも記事URLは /en/news/<id>）。
        itemUrls: latest.map((a) => `${ORIGIN}${isEn ? '/en' : ''}/news/${a.id}`),
        itemNames: latest.map((a) => (isEn && a.titleEn ? a.titleEn : a.title)),
      }),
    ],
    'prerender-home',
  );

  html = injectSsrBody(html, body, 'prerender-home');

  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html, 'utf8');
  count++;
}

console.log(`[prerender-home] ${count} ページ（/ と /en）を生成。app.html にシェルを退避。`);
if (failures.length) {
  console.warn(`[prerender-home] WARN: 本文が焼けなかった: ${failures.join(', ')}`);
}
if (missedReplacements.size) {
  console.warn(
    `[prerender-home] WARN: <head> 置換が未マッチ: ${[...missedReplacements].join(', ')} ` +
      `— テンプレート(dist/public/index.html)の<head>フォーマット変更の可能性。`,
  );
}
