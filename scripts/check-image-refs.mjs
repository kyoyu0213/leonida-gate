// ============================================================================
//  ビルド成果物の画像参照が実ファイルと一致しているかを検査する（postbuild）。
// ----------------------------------------------------------------------------
//  実行: node scripts/check-image-refs.mjs
//
//  dist/public 配下の全HTMLを走査し、下記すべての画像参照について
//  実ファイルが存在するかを確かめる。1件でも欠ければ exit 1 でビルドを落とす。
//
//    - <img src="...">
//    - <meta property="og:image" content="...">
//    - <meta name="twitter:image" content="...">
//    - JSON-LD（application/ld+json）の image / logo / url（ImageObject 配下）
//
//  ▼ なぜ恒久設置するか
//  2026-08-08 の画像最適化で png/jpg 200枚を webp へ一括変換し、
//  ソース306箇所の参照を機械的に書き換えた。この種の一括リネームは
//  「1箇所だけ書き換え漏れて画像が出ない」事故が起きやすく、しかも
//  ビルドは通ってしまうため気づけない。再発防止として検査を常設する。
//
//  外部URL（http/https から始まるもの）と data: URI は対象外。
// ============================================================================
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, relative, sep } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = resolve(ROOT, 'dist/public');
const ORIGIN = 'https://gta6-feed.com';

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

/** 絶対URL・相対パスを dist からの実ファイルパスに落とす。対象外なら null。 */
function toLocal(u) {
  if (!u) return null;
  let s = String(u).trim();
  if (s.startsWith('data:')) return null;
  if (s.startsWith(ORIGIN)) s = s.slice(ORIGIN.length);
  if (/^https?:\/\//i.test(s)) return null;   // 他ドメインは検査対象外
  s = s.split('#')[0].split('?')[0];
  if (!s.startsWith('/')) return null;        // 相対参照は使っていない想定
  return decodeURIComponent(s);
}

/** JSON-LD を再帰的に辿って画像らしき値を集める。 */
function collectLdImages(node, out) {
  if (!node) return;
  if (Array.isArray(node)) { node.forEach((n) => collectLdImages(n, out)); return; }
  if (typeof node !== 'object') return;
  for (const [k, v] of Object.entries(node)) {
    if ((k === 'image' || k === 'logo' || k === 'thumbnailUrl') && v) {
      if (typeof v === 'string') out.push(v);
      else if (Array.isArray(v)) v.forEach((x) => (typeof x === 'string' ? out.push(x) : collectLdImages(x, out)));
      else if (typeof v === 'object') {
        if (typeof v.url === 'string') out.push(v.url);
        collectLdImages(v, out);
      }
    } else if (typeof v === 'object') {
      collectLdImages(v, out);
    }
  }
}

const files = walk(DIST);
const missing = new Map();   // パス -> 参照元HTMLの集合
let checked = 0;

for (const f of files) {
  const relHtml = relative(DIST, f).split(sep).join('/');
  if (relHtml.startsWith('sample/')) continue;   // 配信していない単独の静的ファイル
  const html = readFileSync(f, 'utf8');
  const refs = [];

  for (const m of html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/gi)) refs.push(m[1]);
  for (const m of html.matchAll(/<meta[^>]+property="og:image"[^>]*content="([^"]+)"/gi)) refs.push(m[1]);
  for (const m of html.matchAll(/<meta[^>]+name="twitter:image"[^>]*content="([^"]+)"/gi)) refs.push(m[1]);
  for (const m of html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    try { collectLdImages(JSON.parse(m[1]), refs); } catch { /* JSON-LD の構文は別途 check される */ }
  }

  for (const r of refs) {
    const local = toLocal(r);
    if (!local) continue;
    checked++;
    if (!existsSync(join(DIST, local))) {
      if (!missing.has(local)) missing.set(local, new Set());
      missing.get(local).add(relHtml);
    }
  }
}

console.log(`[check-image-refs] ${files.length} ページ / 画像参照 ${checked} 件を検査`);
if (missing.size) {
  console.error(`[check-image-refs] FAIL: 実ファイルが存在しない画像参照が ${missing.size} 種あります`);
  for (const [p, pages] of missing) {
    const list = [...pages];
    console.error(`  ${p}\n      <- ${list.slice(0, 5).join(', ')}${list.length > 5 ? ` (他${list.length - 5}ページ)` : ''}`);
  }
  process.exit(1);
}
console.log('[check-image-refs] OK — 欠損なし');
