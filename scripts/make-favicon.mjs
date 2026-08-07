// ============================================================================
//  favicon 生成（手動実行ツール）
// ----------------------------------------------------------------------------
//  実行: node scripts/make-favicon.mjs
//
//  ロゴのワードマーク中心をクロップして、用途別に2サイズ出力する。
//
//  ▼ なぜ2サイズか
//  以前は 512x512 の PNG を1枚だけ出しており、それを favicon と
//  apple-touch-icon の両方で使っていた。ブラウザのタブに 16〜32px で
//  表示するだけの画像に 170KB を初回ロードで払っていた（2026-08-08 の画像監査）。
//    favicon.png       …  48x48（タブ表示用。実質 16/32px で描画される）
//    apple-touch-icon  … 180x180（iOS のホーム画面追加用。Apple の推奨サイズ）
//
//  ▼ 参照側
//  client/index.html の <link rel="icon"> / <link rel="apple-touch-icon"> は
//  ?v= のクエリでバージョニングしている。出力を差し替えたらここを上げること
//  （/images 配下と同じく 1日キャッシュ + 30日 SWR で配信しているため）。
// ============================================================================
import sharp from 'sharp';
import { readFileSync, statSync } from 'node:fs';

const SRC = 'client/public/images/gta6feed-logo.webp';

// ワードマーク中心をクロップ（左右のスピードライン・下の星屑影を除外）して大きく見せる。
// ロゴ自体を 440px 幅へ再圧縮したので、クロップ座標は元画像の比率から算出する。
const meta = await sharp(readFileSync(SRC)).metadata();
const scale = (meta.width ?? 1100) / 1100;
const box = {
  left: Math.round(150 * scale),
  top: Math.round(15 * scale),
  width: Math.round(830 * scale),
  height: Math.round(250 * scale),
};

async function build(size, out) {
  const core = await sharp(readFileSync(SRC))
    .extract(box)
    .trim()
    .resize({
      width: Math.round(size * 0.97),
      height: Math.round(size * 0.97),
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 11, g: 7, b: 20, alpha: 1 } },
  })
    .composite([{ input: core, gravity: 'center' }])
    .png({ compressionLevel: 9, palette: true })
    .toFile(out);

  console.log(`✓ ${out}  ${size}x${size}  ${Math.round(statSync(out).size / 1024)}KB`);
}

await build(48, 'client/public/favicon.png');
await build(180, 'client/public/apple-touch-icon.png');
