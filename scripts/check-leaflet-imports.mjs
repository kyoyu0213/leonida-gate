// ============================================================================
//  Leaflet の混入ガード（⑫の再発防止）。
//
//  Leaflet は読み込んだ瞬間に window を触るため、SSR（プリレンダ）の import グラフに入ると
//  ビルドが落ちる。さらに entry に入ると全ページの初回読み込みが重くなる。
//  そこで「Leaflet を import してよいのは client/src/components/map/ だけ」「その地図キャンバスは
//  動的 import でしか読まない」「動的 import してよいのは想定したページだけ」を機械的に守らせる。
//
//    node scripts/check-leaflet-imports.mjs          … ソースを検査（prebuild）
//    node scripts/check-leaflet-imports.mjs --dist   … ビルド成果物を検査（build 中・SSR とクライアントの両方）
//
//  ▼ 地図キャンバスを使ってよいページ（CANVAS_IMPORTERS）
//    公開マップ（MapTool）と管理画面のマップピン承認（AdminReports・/admin は元々 lazy チャンク）。
//    どちらも同じ MapCanvas チャンクを動的 import するので、Leaflet は1チャンクにまとまり、
//    公開ページのバンドルは管理画面の有無で変わらない。ページを増やすならここに足す。
// ============================================================================
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, relative, sep } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(ROOT, 'client/src');
const ALLOWED_DIR = resolve(SRC, 'components/map') + sep;
const LEAFLET_SPEC = String.raw`(?:leaflet(?:\/[^'"]*)?|react-leaflet(?:\/[^'"]*)?|@react-leaflet\/core(?:\/[^'"]*)?)`;
// import … from 'leaflet' / import 'leaflet/dist/leaflet.css' / require('leaflet') / import('react-leaflet')
const LEAFLET_RE = new RegExp(
  String.raw`(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)['"]` + LEAFLET_SPEC + `['"]`,
);
// 地図キャンバスを静的に import していないか（import type は実行時に消えるので可）
const STATIC_CANVAS_RE = /^\s*import\s+(?!type\b)[^;]*?from\s*['"][^'"]*components\/map\/MapCanvas['"]/m;
// 地図キャンバスの動的 import
const DYNAMIC_CANVAS_RE = /\bimport\s*\(\s*['"][^'"]*components\/map\/MapCanvas['"]\s*\)/;
const CANVAS_IMPORTERS = new Set(['client/src/pages/MapTool.tsx', 'client/src/pages/AdminReports.tsx']);
// ビルド後のクライアントチャンクに Leaflet 本体が入っているかの目印（minify 後も残る CSS クラス名）
const LEAFLET_BUNDLE_RE = /leaflet-container|leaflet-tile-pane/;
const LEAFLET_CHUNK_OK = /^MapCanvas-[\w-]+\.js$/;

const errors = [];

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?|mjs|cjs)$/.test(e.name)) out.push(p);
  }
  return out;
}

if (process.argv.includes('--dist')) {
  // SSR バンドルの entry（全ルートを事前 import しているファイル）に Leaflet が静的に入っていないか。
  // 地図キャンバスは別チャンクに分かれ、プリレンダ中は一度も読み込まれない想定。
  const entry = resolve(ROOT, 'dist/server/entry-server.js');
  if (!existsSync(entry)) {
    console.error('[check-leaflet] dist/server/entry-server.js がありません（SSR ビルドの後に実行してください）');
    process.exit(1);
  }
  const code = readFileSync(entry, 'utf8');
  if (LEAFLET_RE.test(code)) {
    errors.push('dist/server/entry-server.js が Leaflet を静的に import しています（SSR で window 参照により落ちます）');
  }

  // クライアント：Leaflet 本体を含むチャンクは MapCanvas-*.js の1つだけ。公開 entry（index.html が読む JS）には入れない。
  const assets = resolve(ROOT, 'dist/public/assets');
  // build 中（prerender-home の前）は index.html がまだ素のシェル。後から単体で流したときは app.html がシェル。
  const appShell = resolve(ROOT, 'dist/public/app.html');
  const html = existsSync(appShell) ? appShell : resolve(ROOT, 'dist/public/index.html');
  if (existsSync(assets)) {
    const jsFiles = readdirSync(assets).filter((f) => f.endsWith('.js'));
    const withLeaflet = jsFiles.filter((f) => LEAFLET_BUNDLE_RE.test(readFileSync(join(assets, f), 'utf8')));
    for (const f of withLeaflet) {
      if (!LEAFLET_CHUNK_OK.test(f)) errors.push(`dist/public/assets/${f} に Leaflet が入っています（MapCanvas チャンク以外は不可）`);
    }
    const shell = existsSync(html) ? readFileSync(html, 'utf8') : '';
    const entries = [...shell.matchAll(/<script[^>]+src="\/assets\/([^"]+\.js)"/g)].map((m) => m[1]);
    const dirty = entries.filter((f) => withLeaflet.includes(f));
    if (dirty.length) errors.push(`公開 entry（${dirty.join(', ')}）に Leaflet が入っています`);
    console.log(
      `[check-leaflet] クライアント: Leaflet を含むチャンク ${withLeaflet.length} 個（${withLeaflet.join(', ') || 'なし'}）` +
        ` / 公開 entry ${entries.length} 個中 ${dirty.length} 個`,
    );
  }
} else {
  for (const file of walk(SRC)) {
    const code = readFileSync(file, 'utf8');
    const rel = relative(ROOT, file);
    if (!file.startsWith(ALLOWED_DIR) && LEAFLET_RE.test(code)) {
      errors.push(`${rel}: Leaflet は client/src/components/map/ 以外から import できません`);
    }
    if (!file.startsWith(ALLOWED_DIR) && STATIC_CANVAS_RE.test(code)) {
      errors.push(`${rel}: components/map/MapCanvas は動的 import（lazyWithRetry）でだけ読み込んでください`);
    }
    if (DYNAMIC_CANVAS_RE.test(code) && !CANVAS_IMPORTERS.has(rel.split(sep).join('/'))) {
      errors.push(`${rel}: components/map/MapCanvas を読み込んでよいのは ${[...CANVAS_IMPORTERS].join(' / ')} だけです`);
    }
  }
}

if (errors.length) {
  errors.forEach((e) => console.error(`[check-leaflet] ERROR: ${e}`));
  process.exit(1);
}
console.log(`[check-leaflet] OK — Leaflet の import は components/map/ に閉じている${process.argv.includes('--dist') ? '（SSR 成果物）' : ''}`);
