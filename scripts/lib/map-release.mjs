// ============================================================================
//  マップツールの公開フラグを client/src/data/maps/release.ts から読む（.mjs 用）。
//  TS を import できないスクリプト（static-routes.mjs 等）向けに、正規表現で1行だけ拾う。
//  書式が変わって読めなくなったら黙って既定値にせず、ビルドを止める。
// ============================================================================
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RELEASE_TS = resolve(__dirname, '../../client/src/data/maps/release.ts');

/** データセットIDの公開フラグ（gta5 など）。 */
export function isMapReleased(mapId) {
  const src = readFileSync(RELEASE_TS, 'utf8');
  const m = src.match(new RegExp('^\\s*' + mapId + ':\\s*(true|false)\\s*,', 'm'));
  if (!m) {
    throw new Error(
      `[map-release] release.ts から ${mapId} の公開フラグを読めませんでした。` +
        '`  gta5: true,` の書式で書かれているか確認してください。',
    );
  }
  return m[1] === 'true';
}
