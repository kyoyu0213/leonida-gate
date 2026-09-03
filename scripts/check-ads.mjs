// ============================================================================
//  広告コードの配置検査（ビルド後に実行）。
// ----------------------------------------------------------------------------
//  期待値：
//    - 広告を出すページ（ホーム・ニュース・解説ガイド・体験記）… ローダー script 1本
//    - 広告を出さないページ（client/src/lib/ads.ts の AD_FREE_PREFIXES）… 0本
//    - app.html（CSRシェル）… 0本（到達するのは全て広告対象外のルート）
//    - /en 配下 … EN_INDEXING_ENABLED（client/src/lib/en-indexing.ts）が false の間は 0本、
//      true に戻せば日本語側と同じ判定（＝記事・ガイドは1本）に戻る。両状態で検査できる。
//  ズレたらビルドを止める。以前は「全ページ 1本」を前提にした検査しか無かったため、
//  UGC から広告を外したときに「意図せず記事からも消えた／UGC に残った」を検知できない。
//
//  実行: node scripts/check-ads.mjs
// ============================================================================
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative, sep, join } from 'node:path';
import { EN_INDEXING_ENABLED, isEnPath } from './lib/en-indexing.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = resolve(ROOT, 'dist/public');

// AD_FREE_PREFIXES は client/src/lib/ads.ts（単一の正）から読む。
// 素の node からは TS を import できないため、配列リテラルをテキスト解析する。
// 解析できなければ throw（検査が黙って素通りするのを防ぐ）。
const adsSrc = readFileSync(resolve(ROOT, 'client/src/lib/ads.ts'), 'utf8');
const block = adsSrc.match(/export const AD_FREE_PREFIXES: string\[\] = \[([\s\S]*?)\n\];/);
if (!block) {
  throw new Error('[check-ads] client/src/lib/ads.ts の AD_FREE_PREFIXES を解析できなかった（書式変更の可能性）');
}
const AD_FREE_PREFIXES = [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
if (!AD_FREE_PREFIXES.length) throw new Error('[check-ads] AD_FREE_PREFIXES が空');

const toLogicalPath = (p) => (p === '/en' ? '/' : p.startsWith('/en/') ? p.slice(3) : p);
// client/src/lib/ads.ts の isAdFreePath と同じ判定（素の node から TS を import できないため写し）。
// /en 配下の一括除外もフラグ連動でそちらと揃える。
const isAdFreePath = (path) => {
  if (!EN_INDEXING_ENABLED && isEnPath(path)) return true;
  const p = toLogicalPath(path);
  return AD_FREE_PREFIXES.some((pre) => p === pre || p.startsWith(`${pre}/`));
};

const files = [];
(function walk(d) {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) files.push(p);
  }
})(DIST);

const errors = [];
const stats = { withAd: 0, withoutAd: 0 };
for (const f of files) {
  const rel = relative(DIST, f).split(sep).join('/');
  // sample/ は配信していない置き土産のHTML（検査対象外）。
  if (rel.startsWith('sample/')) continue;
  const html = readFileSync(f, 'utf8');
  const n = (html.match(/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/g) || []).length;
  // '<route>/index.html' → '/<route>'、'index.html' → '/'
  const route = rel === 'index.html' ? '/' : '/' + rel.replace(/\/index\.html$/, '').replace(/\.html$/, '');
  // app.html は CSR シェル。到達する全ルートが広告対象外なので 0本が正。
  const want = rel === 'app.html' || isAdFreePath(route) ? 0 : 1;
  if (n !== want) errors.push(`${rel} … adsbygoogle ${n}本（期待 ${want}本）`);
  if (n) stats.withAd++;
  else stats.withoutAd++;
}

if (errors.length) {
  console.error('\n[check-ads] 広告コードの配置が期待と違う:');
  for (const e of errors) console.error(`  ✗ ${e}`);
  console.error('');
  process.exit(1);
}

console.log(
  `[check-ads] OK — 広告あり ${stats.withAd} ページ / 広告なし ${stats.withoutAd} ページ` +
    `（対象外プレフィックス ${AD_FREE_PREFIXES.length} 件: ${AD_FREE_PREFIXES.join(', ')}` +
    `${EN_INDEXING_ENABLED ? '' : ' ＋ /en 配下すべて（EN_INDEXING_ENABLED=false）'}）`,
);
