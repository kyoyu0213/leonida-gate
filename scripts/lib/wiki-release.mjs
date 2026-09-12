// ============================================================================
//  GTA6まとめWiki の公開フラグとカテゴリ一覧を client/src/data/wiki/ から読む（.mjs 用）。
//  map-release.mjs と同じく、TS を import できないスクリプト（static-routes.mjs 等）向けに
//  正規表現で拾う。書式が変わって読めなくなったら黙って既定値にせず、ビルドを止める。
// ============================================================================
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WIKI_DIR = resolve(__dirname, '../../client/src/data/wiki');

/** Wiki のトップ。client/src/data/wiki/categories.ts の WIKI_BASE と同じ値。 */
export const WIKI_BASE = '/gta6-wiki';

/** WIKI_RELEASED（client/src/data/wiki/release.ts）。 */
export function isWikiReleased() {
  const src = readFileSync(resolve(WIKI_DIR, 'release.ts'), 'utf8');
  const m = src.match(/^export const WIKI_RELEASED\s*=\s*(true|false)\s+as const;/m);
  if (!m) {
    throw new Error(
      '[wiki-release] release.ts から WIKI_RELEASED を読めませんでした。' +
        '`export const WIKI_RELEASED = false as const;` の書式で書かれているか確認してください。',
    );
  }
  return m[1] === 'true';
}

/** カテゴリの slug 一覧（categories.ts の `slug: '...'` を宣言順に）。 */
export function readWikiSlugs() {
  const src = readFileSync(resolve(WIKI_DIR, 'categories.ts'), 'utf8');
  const slugs = [...src.matchAll(/^\s*slug:\s*'([a-z0-9-]+)',/gm)].map((m) => m[1]);
  if (!slugs.length) {
    throw new Error(
      '[wiki-release] categories.ts からカテゴリの slug を1件も読めませんでした。' +
        "`    slug: 'characters',` の書式で書かれているか確認してください。",
    );
  }
  return slugs;
}

/** Wiki の全URL（日本語のみ。index＋各カテゴリ）。 */
export function wikiPaths() {
  return [WIKI_BASE, ...readWikiSlugs().map((s) => `${WIKI_BASE}/${s}`)];
}

/** Wiki 配下のパスか（日本語側の論理パス）。 */
export const isWikiPath = (p) => p === WIKI_BASE || p.startsWith(`${WIKI_BASE}/`);
