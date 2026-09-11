// ============================================================================
//  マップのタイルを生成する（prebuild で実行。dev で地図を見るときも1回実行する）。
//
//    node scripts/build-map-tiles.mjs
//
//  ▼ 素材（道1：既にタイル分割された公開データを形式変換して使う）
//    martonp96/GTAV-Maps（MIT）の atlas。ファイル名は {z}-{x}_{y}.png（x=列・y=行、z0〜z7）。
//    それを Leaflet 標準の {z}/{x}/{y}.webp に並べ替えて webp 化し、
//      client/public/maps/<map>/<tileVersion>/{z}/{x}/{y}.webp
//    へ出力する（vite build が dist へコピー）。
//    ※ 画像内容の権利は Rockstar Games。Rockstar の画像を git 履歴に残さないため、
//      元PNGはビルド時に取得し（node_modules/.cache に保存して再利用）、出力先も .gitignore 済み。
//
//  ▼ 素材のタイル枠（非自明）
//    atlas は「z7 で一辺 11000px の絵」を左上そろえで 256px に切ったもの。各ズームの一辺の枚数は
//    ceil(11000 / 2^(7-z) / 256)（z7=43, z6=22, z5=11 … z0=1）で、右端・下端のタイルは一部が透明。
//    座標変換（meta.ts の transformation）はこの枠に合わせてある。
//
//  ▼ 版の固定
//    取得元は commit SHA で固定する。/maps 配下は 1 年 immutable で配信するため（vercel.json）、
//    同じ tileVersion の中身が変わってはいけない。素材を変えるときは SOURCES に新しい版を足し、
//    meta.ts の tileVersion を新しい値にする（同じ URL を上書きしない）。
//
//  ▼ 失敗時
//    取得・変換に失敗してもサイト全体のビルドは止めない（WARN を出してその版をスキップ）。
//    ただし途中までのタイルは配信しない（出力ディレクトリごと消す）。
// ============================================================================
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, readdirSync } from 'node:fs';
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
const GENERATOR = 2; // 生成方法を変えたら上げる（既存タイルを作り直させる）
const QUALITY = 80; // 256px の地図タイルで 1〜6KB。q80 で文字・道路の縁の劣化は見分けられない
const CACHE = resolve(ROOT, 'node_modules/.cache/map-tiles-src');

/** 版ごとの取得元。tileVersion をキーにする。 */
const SOURCES = {
  gta5: {
    v1: {
      repo: 'martonp96/GTAV-Maps',
      commit: '17b57d9dc15b4a5cbe6179088b2328b9299d308c', // 2019-07-09（master の最終コミット）
      dir: 'atlas',
    },
  },
};

/** meta.ts から tileVersion / imageSize / maxNativeZoom を読む（TS を import できないのでテキスト解析）。 */
function readMeta(mapId) {
  const src = readFileSync(resolve(ROOT, `client/src/data/maps/${mapId}/meta.ts`), 'utf8');
  const pick = (re, name) => {
    const m = src.match(re);
    if (!m) throw new Error(`[map-tiles] ${mapId}/meta.ts から ${name} を読めませんでした`);
    return m[1];
  };
  return {
    version: pick(/^\s*tileVersion:\s*'([a-z0-9-]+)'/m, 'tileVersion'),
    imageSize: Number(pick(/^\s*imageSize:\s*(\d+)/m, 'imageSize')),
    maxZoom: Number(pick(/^\s*maxNativeZoom:\s*(\d+)/m, 'maxNativeZoom')),
  };
}

/** 各ズームの一辺のタイル枚数（左上そろえ・端は一部透明）。 */
const tilesPerSide = (imageSize, maxZoom, z) => Math.ceil(imageSize / 2 ** (maxZoom - z) / 256);

function tileList(imageSize, maxZoom) {
  const list = [];
  for (let z = 0; z <= maxZoom; z++) {
    const n = tilesPerSide(imageSize, maxZoom, z);
    for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) list.push({ z, x, y });
  }
  return list;
}

/** 並列数を絞って順に処理する。 */
async function pool(items, limit, fn) {
  let i = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (i < items.length) {
      const item = items[i++];
      await fn(item);
    }
  });
  await Promise.all(workers);
}

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

async function fetchPng(url) {
  let lastErr;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (!buf.subarray(0, 4).equals(PNG_SIG)) throw new Error('PNG ではない応答');
      return buf;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
    }
  }
  throw new Error(`${url}: ${lastErr?.message ?? lastErr}`);
}

/** 元PNGをキャッシュへそろえる（既にあるものは取りに行かない）。 */
async function ensureSource(source, tiles) {
  const dir = join(CACHE, `${source.repo.replace('/', '__')}@${source.commit}`, source.dir);
  mkdirSync(dir, { recursive: true });
  const missing = tiles.filter((t) => !existsSync(join(dir, `${t.z}-${t.x}_${t.y}.png`)));
  if (missing.length > 0) {
    console.log(`[map-tiles] 元タイルを取得: ${missing.length} / ${tiles.length} 枚（${source.repo}@${source.commit.slice(0, 7)}）`);
    await pool(missing, 16, async (t) => {
      const name = `${t.z}-${t.x}_${t.y}.png`;
      const url = `https://raw.githubusercontent.com/${source.repo}/${source.commit}/${source.dir}/${name}`;
      writeFileSync(join(dir, name), await fetchPng(url));
    });
  }
  return dir;
}

function countTiles(dir) {
  let n = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) n += countTiles(join(dir, e.name));
    else if (e.name.endsWith('.webp')) n++;
  }
  return n;
}

/** 今の版以外の出力（古い版・旧生成器の残骸）を消す。手元の dist を Vercel と同じ中身にするため。 */
function removeStale(mapId, version) {
  const mapDir = resolve(ROOT, `client/public/maps/${mapId}`);
  if (!existsSync(mapDir)) return;
  for (const e of readdirSync(mapDir, { withFileTypes: true })) {
    if (e.name === version) continue;
    rmSync(join(mapDir, e.name), { recursive: true, force: true });
    console.log(`[map-tiles] ${mapId}: 古い出力 ${e.name} を削除`);
  }
}

for (const mapId of MAPS) {
  const { version, imageSize, maxZoom } = readMeta(mapId);
  removeStale(mapId, version);
  const source = SOURCES[mapId]?.[version];
  if (!source) {
    console.warn(`[map-tiles] WARN: ${mapId}/${version} の取得元が SOURCES にありません。タイル生成をスキップします。`);
    continue;
  }
  const outDir = resolve(ROOT, `client/public/maps/${mapId}/${version}`);
  const stampPath = join(outDir, '.stamp');
  const tiles = tileList(imageSize, maxZoom);
  const stamp = JSON.stringify({ generator: GENERATOR, quality: QUALITY, ...source, imageSize, maxZoom, count: tiles.length });

  if (existsSync(stampPath) && readFileSync(stampPath, 'utf8') === stamp) {
    console.log(`[map-tiles] ${mapId}/${version}: 生成済み（${countTiles(outDir)} 枚）。スキップ`);
    continue;
  }

  const t0 = Date.now();
  try {
    const srcDir = await ensureSource(source, tiles);
    rmSync(outDir, { recursive: true, force: true });
    await pool(tiles, 8, async (t) => {
      const dir = join(outDir, String(t.z), String(t.x));
      mkdirSync(dir, { recursive: true });
      await sharp(join(srcDir, `${t.z}-${t.x}_${t.y}.png`))
        .webp({ quality: QUALITY, effort: 5 })
        .toFile(join(dir, `${t.y}.webp`));
    });
    writeFileSync(stampPath, stamp);
    console.log(`[map-tiles] ${mapId}/${version}: ${countTiles(outDir)} 枚を生成（${((Date.now() - t0) / 1000).toFixed(1)}s）`);
  } catch (e) {
    // 中途半端な版は配信しない。
    rmSync(outDir, { recursive: true, force: true });
    console.warn(`[map-tiles] WARN: ${mapId}/${version} のタイル生成に失敗しました（${e?.message ?? e}）。スキップします。`);
  }
}
