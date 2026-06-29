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

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ORIGIN = 'https://gta6-feed.com';
const DEFAULT_IMAGE = '/images/news/Official_Cover_Art_landscape.webp';

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

interface RenderResult {
  html: string;
  seo: { title: string; description?: string; image?: string; type?: string; url?: string } | null;
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
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`);
  html = setMeta(html, 'description', desc);
  html = setMeta(html, 'og:type', seo?.type || 'website');
  html = setMeta(html, 'og:url', url);
  html = setMeta(html, 'og:title', title);
  html = setMeta(html, 'og:description', desc);
  html = setMeta(html, 'og:image', image);
  html = setMeta(html, 'twitter:title', title);
  html = setMeta(html, 'twitter:description', desc);
  html = setMeta(html, 'twitter:image', image);

  // #root に本文を焼き込む（クライアントの createRoot がマウント時に置き換える）。
  if (!html.includes('<div id="root"></div>')) {
    throw new Error('[prerender-routes] index.html に空の #root が見つからない（テンプレート想定外）');
  }
  html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);

  const dir = resolve(ROOT, `dist/public${route}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), html, 'utf8');
  count++;
}

console.log(`[prerender-routes] ${count} ルートを生成: dist/public/<route>/index.html`);
if (skipped.length) console.log(`[prerender-routes] スキップ: ${skipped.join(', ')}`);
