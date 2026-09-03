// ============================================================================
//  EN_INDEXING_ENABLED の読み出し（素の node 実行のスクリプト向け）。
// ----------------------------------------------------------------------------
//  正は client/src/lib/en-indexing.ts。generate-sitemap.mjs / check-ads.mjs は
//  素の node 実行で TypeScript を import できないため、ここで同ファイルを
//  テキストとして読み、フラグの値だけを取り出す
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
const m = src.match(/export const EN_INDEXING_ENABLED:\s*boolean\s*=\s*(true|false)\s*;/);
if (!m) {
  throw new Error(
    '[en-indexing] client/src/lib/en-indexing.ts の EN_INDEXING_ENABLED を解析できませんでした。' +
      'scripts/lib/en-indexing.mjs の正規表現を宣言の書式に合わせて直してください。',
  );
}

/** /en 配下を検索対象にするか（client/src/lib/en-indexing.ts と同じ値）。 */
export const EN_INDEXING_ENABLED = m[1] === 'true';

/** 英語版のパスか（'/en' 本体と '/en/...' 配下）。 */
export function isEnPath(path) {
  const p = String(path).split('?')[0].split('#')[0];
  return p === '/en' || p.startsWith('/en/');
}
