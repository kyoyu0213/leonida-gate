// ============================================================================
//  画像最適化スクリプト（一度だけ実行する手動ツール）
// ----------------------------------------------------------------------------
//  client/public/images 配下の .png/.jpg/.jpeg を、最大幅 MAX_WIDTH に縮小して
//  WebP(q80) へ変換する。変換に成功したら元ファイルは削除する。
//  画像パスの拡張子は別途 client/src 側で .webp に置換すること。
//
//  実行: node scripts/optimize-images.mjs
// ============================================================================
import { readdirSync, statSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, extname, join } from 'node:path';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = resolve(__dirname, '..', 'client/public/images');
const MAX_WIDTH = 1280;
const QUALITY = 80;

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const files = walk(IMAGES_DIR).filter((f) => /\.(png|jpe?g)$/i.test(f));
let before = 0;
let after = 0;
let converted = 0;

for (const file of files) {
  const srcSize = statSync(file).size;
  const dest = file.replace(extname(file), '.webp');
  try {
    const img = sharp(file);
    const meta = await img.metadata();
    const pipeline = meta.width && meta.width > MAX_WIDTH ? img.resize({ width: MAX_WIDTH }) : img;
    await pipeline.webp({ quality: QUALITY }).toFile(dest);
    const dstSize = statSync(dest).size;
    before += srcSize;
    after += dstSize;
    converted++;
    unlinkSync(file); // 変換成功後に元ファイルを削除
    const pct = Math.round((1 - dstSize / srcSize) * 100);
    console.log(
      `✓ ${file.replace(IMAGES_DIR + '/', '')}  ${(srcSize / 1024 / 1024).toFixed(2)}MB → ${(dstSize / 1024 / 1024).toFixed(2)}MB (-${pct}%)`,
    );
  } catch (e) {
    console.error(`✗ FAILED ${file}: ${e.message}`);
  }
}

const mb = (n) => (n / 1024 / 1024).toFixed(1);
console.log(
  `\n${converted}/${files.length} converted. Total ${mb(before)}MB → ${mb(after)}MB ` +
    `(-${Math.round((1 - after / before) * 100)}%)`,
);
