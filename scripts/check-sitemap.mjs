// ============================================================================
//  配信される sitemap.xml の検査（build の最後に実行）。
// ----------------------------------------------------------------------------
//  sitemap は prebuild の generate-sitemap.mjs が client/public/sitemap.xml へ生成し、
//  vite build がそれを dist/public/sitemap.xml へコピーしたものが /sitemap.xml になる。
//  check-route-tables.mjs は生成「前」に走るため、生成物そのものは見ていない。
//  ここでは Vercel が実際に配信するファイル（dist/public/sitemap.xml）を読んで、
//  古い版や公開停止中の /en が紛れ込んだまま配信されるのを止める。
//
//  fail:
//    - dist の sitemap が今回生成した client/public/sitemap.xml と一致しない
//    - /en 配下を載せていないはずの間（EN_PUBLIC_INDEXABLE=false）に /en の <loc> がある
//    - 固定ページ（STATIC_ROUTES）のうち sitemap に無いものがある
//    - <loc> の先に dist の実体HTMLが無い（公開終了・統合済み・未生成のURL）
//    - <loc> の先のHTMLが noindex（公開前の地図ツールなど）
//    - robots.txt の Sitemap: が /sitemap.xml を指していない
//  warn:
//    - <loc> の総数が想定レンジ（80〜130）を外れた
//
//  実行: node scripts/check-sitemap.mjs [検査する sitemap.xml のパス]
//        （引数なしなら dist/public/sitemap.xml。引数はガード自体の動作確認用）
// ============================================================================
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative } from 'node:path';
import { STATIC_ROUTES } from './lib/static-routes.mjs';
import { EN_PUBLIC_INDEXABLE } from './lib/en-indexing.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = resolve(ROOT, 'dist/public');
const ORIGIN = 'https://gta6-feed.com';

/** 総数の想定レンジ。外れたら warn（記事の増減で動くので fail にはしない）。 */
const LOC_RANGE = [80, 130];
/** 名指しで存在を確かめる独自ツール（古い sitemap が紛れ込むと真っ先に消えるもの）。 */
const MUST_HAVE = [
  '/fivem-gtarp/tools/chara-maker',
  '/fivem-gtarp/tools/crew-name-generator',
  '/fivem-gtarp/tools/rp-scenario',
];

const target = resolve(ROOT, process.argv[2] || 'dist/public/sitemap.xml');
const errors = [];
const warnings = [];

if (!existsSync(target)) {
  console.error(`[check-sitemap] NG — ${target} が無い（sitemap が配信されない）。`);
  process.exit(1);
}
const xml = readFileSync(target, 'utf8');
const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
if (!locs.length) errors.push('<loc> を1件も読めなかった（sitemap が空か、書式が変わった）。');

// 1. 今回の生成物と一致するか（古いファイルが dist に残る・差し替わる事故の検出）
const generated = resolve(ROOT, 'client/public/sitemap.xml');
if (!existsSync(generated)) {
  errors.push('client/public/sitemap.xml が無い（generate-sitemap.mjs が走っていない）。');
} else if (readFileSync(generated, 'utf8') !== xml) {
  errors.push(`${relative(ROOT, target).replace(/\\/g, '/')} が今回生成した client/public/sitemap.xml と一致しない（古い sitemap が紛れ込んでいる）。`);
}

// URL → 日本語側の論理パス
const toPath = (loc) => (loc.startsWith(ORIGIN) ? loc.slice(ORIGIN.length) || '/' : null);
const paths = locs.map(toPath);
const foreign = locs.filter((_, i) => paths[i] === null);
if (foreign.length) errors.push(`${ORIGIN} 以外の <loc>: ${foreign.slice(0, 5).join(', ')}`);

// 2. /en の混入
if (!EN_PUBLIC_INDEXABLE) {
  const en = paths.filter((p) => p && (p === '/en' || p.startsWith('/en/')));
  if (en.length) {
    errors.push(
      `/en を sitemap から外している間（EN_PUBLIC_INDEXABLE=false）なのに /en の <loc> が ${en.length} 件ある` +
        `（例: ${en.slice(0, 3).join(', ')}）。`,
    );
  }
}

// 3. 固定ページの欠落（名指しのツールは個別に出す）
const pathSet = new Set(paths.filter(Boolean));
for (const p of MUST_HAVE) {
  if (!pathSet.has(p)) errors.push(`${p} が sitemap に無い。`);
}
const missingStatic = STATIC_ROUTES.map((r) => r.path).filter((p) => !MUST_HAVE.includes(p) && !pathSet.has(p));
if (missingStatic.length) errors.push(`固定ページ（STATIC_ROUTES）のうち sitemap に無いもの: ${missingStatic.join(', ')}`);

// 4・5. 各 <loc> の実体HTML（存在・noindex）
const dup = paths.filter((p, i) => p && paths.indexOf(p) !== i);
if (dup.length) errors.push(`重複した <loc>: ${[...new Set(dup)].join(', ')}`);
const noFile = [];
const noindex = [];
for (const p of pathSet) {
  const file = p === '/' ? resolve(DIST, 'index.html') : resolve(DIST, `.${p}`, 'index.html');
  if (!existsSync(file)) {
    noFile.push(p);
    continue;
  }
  if (/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(readFileSync(file, 'utf8'))) noindex.push(p);
}
if (noFile.length) {
  errors.push(
    `実体HTMLが dist に無い <loc> が ${noFile.length} 件（公開終了・統合済み・未生成のURL）: ` +
      `${noFile.slice(0, 8).join(', ')}${noFile.length > 8 ? ' ほか' : ''}`,
  );
}
if (noindex.length) errors.push(`noindex のページが sitemap に載っている: ${noindex.join(', ')}`);

// 6. robots.txt の Sitemap: 宣言
const robotsFile = resolve(DIST, 'robots.txt');
if (!existsSync(robotsFile)) {
  errors.push('dist/public/robots.txt が無い。');
} else if (!/^Sitemap:\s*https:\/\/gta6-feed\.com\/sitemap\.xml\s*$/m.test(readFileSync(robotsFile, 'utf8'))) {
  errors.push(`robots.txt の Sitemap: が ${ORIGIN}/sitemap.xml を指していない。`);
}

// 総数
if (locs.length < LOC_RANGE[0] || locs.length > LOC_RANGE[1]) {
  warnings.push(`<loc> が ${locs.length} 件で、想定レンジ ${LOC_RANGE[0]}〜${LOC_RANGE[1]} を外れている（古い sitemap の混入や /en の復帰を確認）。`);
}

warnings.forEach((w) => console.warn(`[check-sitemap] WARN: ${w}`));
if (errors.length) {
  errors.forEach((e) => console.error(`[check-sitemap] NG: ${e}`));
  process.exit(1);
}
const en = paths.filter((p) => p && (p === '/en' || p.startsWith('/en/'))).length;
console.log(
  `[check-sitemap] OK — <loc> ${locs.length} 件（/en ${en} 件・固定ページ ${STATIC_ROUTES.length} 件すべて掲載・` +
    `${MUST_HAVE.map((p) => p.split('/').pop()).join(' / ')} あり・全URLに実体HTML・noindex 0件）`,
);
