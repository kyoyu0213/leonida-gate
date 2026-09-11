// ============================================================================
//  Leaflet の混入ガード（⑫の再発防止）。
//
//  Leaflet は読み込んだ瞬間に window を触るため、SSR（プリレンダ）の import グラフに入ると
//  ビルドが落ちる。さらに entry に入ると全ページの初回読み込みが重くなる。
//  そこで「Leaflet を import してよいのは client/src/components/map/ だけ」「その地図キャンバスは
//  動的 import でしか読まない」を機械的に守らせる。
//
//    node scripts/check-leaflet-imports.mjs          … ソースを検査（prebuild）
//    node scripts/check-leaflet-imports.mjs --dist   … SSR ビルド成果物を検査（build 中）
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
  }
}

if (errors.length) {
  errors.forEach((e) => console.error(`[check-leaflet] ERROR: ${e}`));
  process.exit(1);
}
console.log(`[check-leaflet] OK — Leaflet の import は components/map/ に閉じている${process.argv.includes('--dist') ? '（SSR 成果物）' : ''}`);
