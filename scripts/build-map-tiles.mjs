// ============================================================================
//  マップのタイルを生成する（prebuild で実行。dev で地図を見るときも1回実行する）。
//
//    node scripts/build-map-tiles.mjs
//
//  - 元画像 1 枚から sharp（libvips）の .tile({ layout: 'google' }) でピラミッドを作る。
//    出力: client/public/maps/<map>/<tileVersion>/{z}/{y}/{x}.webp（vite build が dist へコピー）
//    ※ 出力先は .gitignore 済み。タイル数千枚を git 履歴に積まないため、リポジトリには元画像だけを置く。
//  - tileVersion は client/src/data/maps/<map>/meta.ts から読む。
//      'placeholder' … 自前生成のグリッド画像からタイルを作る（Rockstar の画像は使わない）
//      'v1' など     … assets-src/maps/<map>/atlas-<tileVersion>.(webp|png|jpg) を使う。
//                       無ければ WARN を出してスキップ（ビルドは止めない。地図は空タイルになる）。
//  - 同じ元画像から作ったタイルが既にあれば作り直さない（.stamp で判定）。
//  - /maps 配下は 1 年 immutable で配信する（vercel.json）。元画像を差し替えたら
//    meta.ts の tileVersion を必ず新しい値にすること（同じ URL を上書きしない）。
// ============================================================================
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

// sharp が読めない環境（ネイティブバイナリ不整合など）でもサイト全体のビルドは止めない。
let sharp;
try {
  sharp = (await import('sharp')).default;
} catch (e) {
  console.warn(`[map-tiles] WARN: sharp を読み込めませんでした（${e?.message ?? e}）。タイル生成をスキップします。`);
  process.exit(0);
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MAPS = ['gta5'];
const SIZE = 8192; // meta.ts の imageSize と同じ（= 256 × 2^5）
const GENERATOR = 1; // 生成方法を変えたら上げる（既存タイルを作り直させる）

function readTileVersion(mapId) {
  const meta = readFileSync(resolve(ROOT, `client/src/data/maps/${mapId}/meta.ts`), 'utf8');
  const m = meta.match(/^\s*tileVersion:\s*'([a-z0-9-]+)'/m);
  if (!m) throw new Error(`[map-tiles] ${mapId}/meta.ts から tileVersion を読めませんでした`);
  return m[1];
}

/** 自前のプレースホルダ画像（暗い地にグリッド）。ゲームの地図ではない。 */
async function placeholderImage() {
  const minor = [];
  for (let i = 0; i <= SIZE; i += 256) {
    const major = i % 1024 === 0;
    const stroke = major ? 'rgba(45,226,230,0.55)' : 'rgba(45,226,230,0.16)';
    const w = major ? 4 : 1;
    minor.push(`<line x1="${i}" y1="0" x2="${i}" y2="${SIZE}" stroke="${stroke}" stroke-width="${w}"/>`);
    minor.push(`<line x1="0" y1="${i}" x2="${SIZE}" y2="${i}" stroke="${stroke}" stroke-width="${w}"/>`);
  }
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">` +
    `<rect width="100%" height="100%" fill="#0b1622"/>` +
    `<circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${SIZE * 0.36}" fill="#12263a"/>` +
    minor.join('') +
    `<text x="50%" y="50%" fill="rgba(255,255,255,0.35)" font-size="420" font-family="sans-serif" ` +
    `text-anchor="middle" dominant-baseline="middle">PLACEHOLDER MAP</text>` +
    `</svg>`;
  return sharp(Buffer.from(svg), { limitInputPixels: false }).png().toBuffer();
}

function findSource(mapId, version) {
  for (const ext of ['webp', 'png', 'jpg', 'jpeg']) {
    const p = resolve(ROOT, `assets-src/maps/${mapId}/atlas-${version}.${ext}`);
    if (existsSync(p)) return p;
  }
  return null;
}

function countTiles(dir) {
  let n = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) n += countTiles(join(dir, e.name));
    else if (e.name.endsWith('.webp')) n++;
  }
  return n;
}

for (const mapId of MAPS) {
  const version = readTileVersion(mapId);
  const outDir = resolve(ROOT, `client/public/maps/${mapId}/${version}`);
  const stampPath = join(outDir, '.stamp');

  let input;
  let stamp;
  if (version === 'placeholder') {
    stamp = { generator: GENERATOR, source: 'placeholder' };
  } else {
    const src = findSource(mapId, version);
    if (!src) {
      console.warn(
        `[map-tiles] WARN: ${mapId} の元画像 assets-src/maps/${mapId}/atlas-${version}.(webp|png|jpg) がありません。` +
          'タイル生成をスキップします（地図は空タイルで表示されます）。',
      );
      continue;
    }
    const st = statSync(src);
    stamp = { generator: GENERATOR, source: src.replace(ROOT, ''), size: st.size, mtimeMs: Math.round(st.mtimeMs) };
    input = src;
  }

  if (existsSync(stampPath) && readFileSync(stampPath, 'utf8') === JSON.stringify(stamp)) {
    console.log(`[map-tiles] ${mapId}/${version}: 生成済み（${countTiles(outDir)} 枚）。スキップ`);
    continue;
  }

  const t0 = Date.now();
  try {
    rmSync(outDir, { recursive: true, force: true });
    mkdirSync(dirname(outDir), { recursive: true });
    const buf = input ? input : await placeholderImage();
    // 元画像のサイズが違っても SIZE 四方に合わせる（meta.ts の imageSize と一致させるため）。
    const src = sharp(buf, { limitInputPixels: false }).resize(SIZE, SIZE, { fit: 'fill' });
    await src.webp({ quality: 80 }).tile({ size: 256, layout: 'google', depth: 'onepixel' }).toFile(outDir);
    // google レイアウトが出す空タイル用の blank.png は使わない
    rmSync(join(outDir, 'blank.png'), { force: true });
    writeFileSync(stampPath, JSON.stringify(stamp));
    console.log(
      `[map-tiles] ${mapId}/${version}: ${countTiles(outDir)} 枚を生成（${((Date.now() - t0) / 1000).toFixed(1)}s）`,
    );
  } catch (e) {
    // 途中までのタイルを残すと .stamp 無しで次回作り直しになるだけだが、中途半端な版は配信しない。
    rmSync(outDir, { recursive: true, force: true });
    console.warn(`[map-tiles] WARN: ${mapId}/${version} のタイル生成に失敗しました（${e?.message ?? e}）。スキップします。`);
  }
}
