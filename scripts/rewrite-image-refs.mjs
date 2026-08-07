// ============================================================================
//  画像パスの拡張子を .webp へ書き換える（手動実行ツール）
// ----------------------------------------------------------------------------
//  実行: node scripts/rewrite-image-refs.mjs [--dry]
//
//  scripts/optimize-images.mjs が png/jpg を webp へ変換したあとに1回だけ走らせる。
//  ソース中の /images/... の .png/.jpg/.jpeg を .webp へ置換する。
//
//  ▼ 対象外
//  /images/icon/ は除外する。板スレッドのアイコンは DB（board_threads.icon）に
//  .jpg のファイル名が入っており、optimize-images 側もリネームしないため。
//
//  ▼ 置換して良い根拠
//  「変換後の .webp が実在するもの」だけを置換する。実在しないものは触らずに
//  警告を出す（例示コメント中のダミーパスを壊さないため）。
// ============================================================================
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, relative, sep } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PUBLIC_DIR = resolve(ROOT, 'client/public');
const DRY = process.argv.includes('--dry');

const SCAN_DIRS = ['client/src', 'scripts', 'api'];
const SCAN_FILES = ['client/index.html'];
const EXT_RE = /\.(ts|tsx|js|mjs|jsx|css|html|json)$/;

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (EXT_RE.test(name)) out.push(p);
  }
  return out;
}

const files = [
  ...SCAN_DIRS.flatMap((d) => walk(resolve(ROOT, d))),
  ...SCAN_FILES.map((f) => resolve(ROOT, f)),
];

// 拡張子はURLの末尾でなければならない。末尾を確かめないと
// `foo.png.webp`（過去の変換で二重拡張子になったファイル）の `.png` に誤ってマッチし、
// 実在する `.png.webp` を存在しない `.webp` に書き換えてしまう。
const REF_RE = /\/images\/[^"'`)\s\\]+\.(?:png|jpe?g)(?![\w.])/gi;

let touchedFiles = 0;
let replaced = 0;
const missing = new Map();

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  let changed = false;
  const out = src.replace(REF_RE, (url) => {
    if (url.startsWith('/images/icon/')) return url;          // DB参照のため据え置き
    const webp = url.replace(/\.(png|jpe?g)$/i, '.webp');
    if (!existsSync(join(PUBLIC_DIR, webp))) {
      const k = url;
      missing.set(k, (missing.get(k) ?? 0) + 1);
      return url;                                             // 実体が無いものは触らない
    }
    replaced++; changed = true;
    return webp;
  });
  if (changed) {
    touchedFiles++;
    if (!DRY) writeFileSync(file, out, 'utf8');
    console.log(`  ${relative(ROOT, file).split(sep).join('/')}`);
  }
}

console.log(`\n${DRY ? '[DRY RUN] ' : ''}${touchedFiles} ファイル / ${replaced} 箇所を .webp へ書き換え`);
if (missing.size) {
  console.log(`\n変換後の .webp が見つからず据え置いた参照 ${missing.size} 種:`);
  for (const [u, n] of missing) console.log(`  ${u}  (${n}箇所)`);
}
