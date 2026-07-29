// ============================================================================
//  news 記事の「検索対象にするか」判定（ビルドスクリプト側の写し）。
// ----------------------------------------------------------------------------
//  正は client/src/data/news.ts の3配列と isIndexableNewsId()：
//    HIDDEN_NEWS_IDS      … 一時的に非表示（発売後に戻す）
//    REDIRECTED_NEWS_IDS  … 他記事へ301統合済み（恒久）
//    NOINDEX_NEWS_IDS     … URL・本文は残すが検索から外す
//
//  generate-sitemap.mjs / check-route-tables.mjs は素の node 実行で TypeScript を
//  import できないため、ここで news.ts をテキストとして読み、同じ判定を再現する。
//  以前は sitemap 側に MERGED_OR_NOINDEX_IDS = ['17','29'] という別の手書きリストが
//  あり、news.ts 側の宣言と二重管理になっていた（片方だけ直すと不整合になる）。
//
//  宣言の書式が変わって解析できなくなったら黙って素通りせず throw する。
// ============================================================================
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const NEWS_TS = resolve(__dirname, '../../client/src/data/news.ts');

/** news.ts から `export const <name>: readonly number[] = [ ... ]` の数値を読む。 */
function readIdList(src, name) {
  const m = src.match(new RegExp(`export const ${name}:\\s*readonly number\\[\\]\\s*=\\s*\\[([\\s\\S]*?)\\]`));
  if (!m) {
    throw new Error(
      `[news-visibility] news.ts の ${name} を解析できませんでした。` +
        'scripts/lib/news-visibility.mjs の readIdList() を宣言の書式に合わせて直してください。',
    );
  }
  return [...m[1].matchAll(/\d+/g)].map((x) => x[0]);
}

/** 3つの除外リストを news.ts から読み出す（文字列のID配列）。 */
export function readNewsIdLists() {
  const src = readFileSync(NEWS_TS, 'utf8');
  const hidden = readIdList(src, 'HIDDEN_NEWS_IDS');
  const redirected = readIdList(src, 'REDIRECTED_NEWS_IDS');
  const noindex = readIdList(src, 'NOINDEX_NEWS_IDS');
  return {
    hidden,
    redirected,
    noindex,
    /** 検索対象から外す全ID（＝ !isIndexableNewsId）。 */
    excluded: new Set([...hidden, ...redirected, ...noindex]),
  };
}

/** client/src/data/news.ts の isIndexableNewsId() と同じ判定。 */
export function isIndexableNewsId(id, lists) {
  return !(lists ?? readNewsIdLists()).excluded.has(String(id));
}
