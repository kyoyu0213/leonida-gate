// ============================================================================
//  ホーム（/ と /en）のプリレンダ。
//  ホームの `/` は catch-all シェル兼テンプレートである dist/public/index.html に
//  ファイルシステムで束縛されているため、prerender-routes の汎用ループには載せず
//  （載せると index.html＝シェルを上書きしてしまう）、この専用ステップで扱う。
//
//  手順（ビルドスクリプトで prerender-og / prerender-routes の「後」に実行すること）：
//   1) pristine な dist/public/index.html を dist/public/app.html にコピー
//      （catch-all `/(.*) → /app.html` が返す空シェル。内容は従来の index.html と同一）
//   2) ホーム本文＋head を焼いて
//        - ja → dist/public/index.html      （`/` はこれをFS配信）
//        - en → dist/public/en/index.html   （`/en` はこれをFS配信・catch-allより優先）
//      に書き出す。
//
//  ※ prerender-og / prerender-routes は起動時に index.html を TEMPLATE として読むだけで
//    上書きはしないため、この時点の index.html はまだ pristine。順序が要。
// ============================================================================
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { injectSsrBody } from './lib/inject-ssr-body';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ORIGIN = 'https://gta6-feed.com';
const DEFAULT_IMAGE = '/images/news/Official_Cover_Art_landscape.webp';

const INDEX_PATH = resolve(ROOT, 'dist/public/index.html');
const APP_PATH = resolve(ROOT, 'dist/public/app.html');

// この時点の index.html は pristine シェル（vite build 出力）。TEMPLATE として読む。
const TEMPLATE = readFileSync(INDEX_PATH, 'utf8');

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const toAbs = (p: string) => (/^https?:\/\//i.test(p) ? p : ORIGIN + (p.startsWith('/') ? p : `/${p}`));

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
copyFileSync(INDEX_PATH, APP_PATH);

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
  const desc = (seo?.description || '').replace(/\s+/g, ' ').trim().slice(0, 160);
  // canonical/og:url は自己参照：ja→ORIGIN + '/'、en→ORIGIN + '/en'
  const selfUrl = route === '/' ? `${ORIGIN}/` : `${ORIGIN}/en`;
  const image = toAbs(seo?.image || DEFAULT_IMAGE);

  let html = TEMPLATE;
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
