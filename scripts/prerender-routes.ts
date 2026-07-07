// ============================================================================
//  静的ルートのプリレンダ（SEO・本文の生HTML化）。
//  vite build → prerender-og の後、SSRバンドル(dist/server/entry-server.js)を使って
//  fivem-gtarp 配下の静的ページを本文ごと生HTML化し、<head> も差し替える。
//
//  出力: dist/public/<route>/index.html （Vercel が <route> で配信。catch-all より優先）
//  実行: tsx scripts/prerender-routes.ts （build スクリプトから呼ぶ）
//
//  ※ /news/<id>（prerender-og）や CSR ルート（掲示板・servers 等）には触れない。
//     生成は各ルートのサブディレクトリに限定し、ベースの index.html は変更しない。
// ============================================================================
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { injectSsrBody } from './lib/inject-ssr-body';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ORIGIN = 'https://gta6-feed.com';
const DEFAULT_IMAGE = '/images/news/Official_Cover_Art_landscape.webp';

const TEMPLATE = readFileSync(resolve(ROOT, 'dist/public/index.html'), 'utf8');

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
  ROUTE_PATHS: string[];
}

const mod = (await import(
  pathToFileURL(resolve(ROOT, 'dist/server/entry-server.js')).href
)) as unknown as ServerEntry;

let count = 0;
const skipped: string[] = [];

for (const route of mod.ROUTE_PATHS) {
  const out = mod.render(route);
  if (!out) {
    skipped.push(route);
    continue;
  }
  const { html: body, seo } = out;
  const title = seo?.title || 'GTA6 FEED';
  const desc = (seo?.description || '').replace(/\s+/g, ' ').trim().slice(0, 160);
  const url = `${ORIGIN}${route}`;
  const image = toAbs(seo?.image || DEFAULT_IMAGE);

  let html = TEMPLATE;
  // <head>：title / canonical / 各メタを当該ルートの値へ差し替え
  html = replaceTracked(html, /<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`, 'title');
  html = replaceTracked(html, /(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`, 'canonical');
  html = setMeta(html, 'description', desc);
  html = setMeta(html, 'og:type', seo?.type || 'website');
  html = setMeta(html, 'og:url', url);
  html = setMeta(html, 'og:title', title);
  html = setMeta(html, 'og:description', desc);
  html = setMeta(html, 'og:image', image);
  html = setMeta(html, 'twitter:title', title);
  html = setMeta(html, 'twitter:description', desc);
  html = setMeta(html, 'twitter:image', image);

  // hreflang（日英の対があるページのみ）。日URL/英URL/x-default(=日) を相互に張る。
  if (seo?.localized) {
    const jaPath = route.startsWith('/en/') ? route.slice(3) : route;
    const jaUrl = `${ORIGIN}${jaPath}`;
    const enUrl = `${ORIGIN}/en${jaPath}`;
    const alt = [
      `<link rel="alternate" hreflang="ja" href="${jaUrl}" />`,
      `<link rel="alternate" hreflang="en" href="${enUrl}" />`,
      `<link rel="alternate" hreflang="x-default" href="${jaUrl}" />`,
    ].join('\n    ');
    html = html.replace('</head>', `    ${alt}\n  </head>`);
  }

  // #root に本文を焼き込む（クライアントの createRoot がマウント時に置き換える）。
  html = injectSsrBody(html, body, 'prerender-routes');

  const dir = resolve(ROOT, `dist/public${route}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), html, 'utf8');
  count++;
}

console.log(`[prerender-routes] ${count} ルートを生成: dist/public/<route>/index.html`);
if (skipped.length) console.log(`[prerender-routes] スキップ: ${skipped.join(', ')}`);
if (missedReplacements.size) {
  console.warn(
    `[prerender-routes] WARN: <head> 置換が未マッチ: ${[...missedReplacements].join(', ')} ` +
      `— テンプレート(dist/public/index.html)の<head>フォーマット変更の可能性。該当メタが既定値のまま出力されています。`,
  );
}
