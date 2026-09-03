// ============================================================================
//  /en の公開・インデックスフラグの読み出し（素の node 実行のスクリプト向け）。
// ----------------------------------------------------------------------------
//  正は client/src/lib/en-indexing.ts。generate-sitemap.mjs / check-ads.mjs /
//  check-route-tables.mjs は素の node 実行で TypeScript を import できないため、
//  ここで同ファイルをテキストとして読み、フラグの値だけを取り出す
//  （news-visibility.mjs が news.ts の3配列を読んでいるのと同じやり方）。
//
//  宣言の書式が変わって解析できなくなったら黙って素通りせず throw する。
// ============================================================================
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EN_INDEXING_TS = resolve(__dirname, '../../client/src/lib/en-indexing.ts');

const src = readFileSync(EN_INDEXING_TS, 'utf8');

/** `export const <name>: boolean = true|false;` を読む。 */
function readFlag(name) {
  const m = src.match(new RegExp(`export const ${name}:\\s*boolean\\s*=\\s*(true|false)\\s*;`));
  if (!m) {
    throw new Error(
      `[en-indexing] client/src/lib/en-indexing.ts の ${name} を解析できませんでした。` +
        'scripts/lib/en-indexing.mjs の readFlag() を宣言の書式に合わせて直してください。',
    );
  }
  return m[1] === 'true';
}

/** /en 配下を配信するか（false の間は vercel.json が日本語URLへ 302）。 */
export const EN_SITE_ENABLED = readFlag('EN_SITE_ENABLED');

/** /en 配下を検索対象にするか（EN_SITE_ENABLED=false なら無意味）。 */
export const EN_INDEXING_ENABLED = readFlag('EN_INDEXING_ENABLED');

/** /en を「公開かつ検索対象」として扱ってよいか（sitemap掲載・hreflang・広告の可否）。 */
export const EN_PUBLIC_INDEXABLE = EN_SITE_ENABLED && EN_INDEXING_ENABLED;

/** 英語版のパスか（'/en' 本体と '/en/...' 配下）。 */
export function isEnPath(path) {
  const p = String(path).split('?')[0].split('#')[0];
  return p === '/en' || p.startsWith('/en/');
}
