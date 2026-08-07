// ============================================================================
//  画像最適化スクリプト（手動実行ツール）
// ----------------------------------------------------------------------------
//  実行: node scripts/optimize-images.mjs [--dry]
//
//  client/public/images 配下を、用途別のポリシーで一括最適化する。
//  変換に成功した元ファイルは削除する（--dry を付けると何も書き換えず見積りだけ出す）。
//  画像パスの拡張子は scripts/rewrite-image-refs.mjs が client/src 側を書き換える。
//
//  ▼ ポリシー（2026-08-08 の画像監査で決定）
//  1) png/jpg → webp・最大幅1280
//       品質は元の幅で出し分ける：
//         元幅 1400px 未満 … q85（FAQ等の文字入りUIスクショ。可読性を優先）
//         元幅 1400px 以上 … q80（ゲーム画面などの写真系）
//       実データではUIスクショが小さく、ゲーム画面が1900px級という傾向が明確なため、
//       この単純な分岐で用途を判別できる。
//
//  2) /images/icon/ だけは例外：ファイル名も拡張子も変えず、中身だけ再圧縮する
//       板スレッドのアイコンは DB（board_threads.icon）に .jpg のファイル名が
//       入っており、supabase/board_thread_icon.sql の許可リストとも対応している。
//       リネームすると既存スレッドのアイコンが404になり、SQL側の移行も必要になる。
//       表示は 42x42px なので 256px 幅まで落として十分。
//
//  3) 既存の webp も大きいものは再圧縮する
//       ロゴ 253KB（1100x417・表示は36〜40px高）等、桁違いに過剰なものがあるため。
// ============================================================================
import { readdirSync, statSync, unlinkSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, extname, join, relative, sep } from 'node:path';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = resolve(__dirname, '..', 'client/public/images');
const DRY = process.argv.includes('--dry');

const MAX_WIDTH = 1280;
/** この幅未満の画像は「文字入りUIスクショ」とみなして高品質側に倒す。 */
const TEXT_SHOT_WIDTH = 1400;
const Q_TEXT = 85;
const Q_PHOTO = 80;

/** アイコン（DB参照のためリネーム禁止）の再圧縮設定。 */
const ICON_DIR = 'icon';
const ICON_WIDTH = 256;
const ICON_QUALITY = 82;

/** 既存 webp を再圧縮する閾値と、個別に幅を指定するもの。 */
const WEBP_RECOMPRESS_OVER = 120 * 1024;
const WEBP_WIDTH_OVERRIDES = {
  'gta6feed-logo.webp': 440,   // 表示は h-9/h-10（36〜40px高）。2x でも十分な余裕をみた幅。
  'hero-mobile.webp': 860,     // モバイル幅 430px の 2x。
};

/** 変換後に品質を上げ直したい個別画像（劣化が目立った場合にここへ足す）。 */
const QUALITY_OVERRIDES = {
  // 例: 'FAQ/cache.webp': 90,
};

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const rel = (f) => relative(IMAGES_DIR, f).split(sep).join('/');
const kb = (n) => Math.round(n / 1024);
const mb = (n) => (n / 1048576).toFixed(1);

const all = walk(IMAGES_DIR);
let before = 0;
let after = 0;
let converted = 0;
let skipped = 0;
const failures = [];

for (const file of all) {
  const ext = extname(file).toLowerCase();
  const r = rel(file);
  const srcSize = statSync(file).size;
  const isIcon = r.startsWith(ICON_DIR + '/');

  try {
    // --- 1) アイコン：拡張子・ファイル名を維持して中身だけ再圧縮 ---
    if (isIcon) {
      if (!/\.(png|jpe?g)$/i.test(ext)) { skipped++; continue; }
      // 上書きするので、元ファイルはバッファに読んでから処理する
      // （sharp にパスを渡すとハンドルが残り、Windows では上書き/削除が EBUSY になる）。
      const srcBuf = readFileSync(file);
      const meta = await sharp(srcBuf).metadata();
      if ((meta.width ?? 0) <= ICON_WIDTH && srcSize < 64 * 1024) { skipped++; before += srcSize; after += srcSize; continue; }
      const buf = await sharp(srcBuf)
        .resize({ width: ICON_WIDTH, withoutEnlargement: true })
        .jpeg({ quality: ICON_QUALITY, mozjpeg: true })
        .toBuffer();
      before += srcSize; after += buf.length; converted++;
      if (!DRY) writeFileSync(file, buf);
      console.log(`✓ [icon] ${r}  ${kb(srcSize)}KB → ${kb(buf.length)}KB (-${Math.round((1 - buf.length / srcSize) * 100)}%)`);
      continue;
    }

    // --- 2) png/jpg → webp ---
    if (/\.(png|jpe?g)$/i.test(ext)) {
      const meta = await sharp(file).metadata();
      const w = meta.width ?? 0;
      const quality = QUALITY_OVERRIDES[r.replace(/\.(png|jpe?g)$/i, '.webp')]
        ?? (w > 0 && w < TEXT_SHOT_WIDTH ? Q_TEXT : Q_PHOTO);
      const buf = await sharp(file)
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality })
        .toBuffer();
      before += srcSize; after += buf.length; converted++;
      const dest = file.replace(extname(file), '.webp');
      if (!DRY) {
        await sharp(buf).toFile(dest);
        if (dest !== file) unlinkSync(file);
      }
      console.log(`✓ ${r}  ${w}px q${quality}  ${kb(srcSize)}KB → ${kb(buf.length)}KB (-${Math.round((1 - buf.length / srcSize) * 100)}%)`);
      continue;
    }

    // --- 3) 既存 webp の再圧縮（大きいものだけ） ---
    if (ext === '.webp') {
      const name = r.split('/').pop();
      const overrideWidth = WEBP_WIDTH_OVERRIDES[name];
      if (!overrideWidth && srcSize < WEBP_RECOMPRESS_OVER) { skipped++; before += srcSize; after += srcSize; continue; }
      const srcBuf2 = readFileSync(file);
      const meta = await sharp(srcBuf2).metadata();
      const targetW = overrideWidth ?? MAX_WIDTH;
      const quality = QUALITY_OVERRIDES[r] ?? ((meta.width ?? 0) < TEXT_SHOT_WIDTH && !overrideWidth ? Q_TEXT : Q_PHOTO);
      // 同名で上書きするため、元ファイルはバッファに読んでから処理する（EBUSY 回避）。
      const buf = await sharp(srcBuf2)
        .resize({ width: targetW, withoutEnlargement: true })
        .webp({ quality })
        .toBuffer();
      // 再圧縮で増えるなら据え置く
      if (buf.length >= srcSize) { skipped++; before += srcSize; after += srcSize; continue; }
      before += srcSize; after += buf.length; converted++;
      if (!DRY) writeFileSync(file, buf);
      console.log(`✓ [webp] ${r}  →w${targetW} q${quality}  ${kb(srcSize)}KB → ${kb(buf.length)}KB (-${Math.round((1 - buf.length / srcSize) * 100)}%)`);
      continue;
    }

    skipped++; before += srcSize; after += srcSize;
  } catch (e) {
    failures.push(`${r}: ${e.message}`);
    before += srcSize; after += srcSize;
  }
}

console.log(`\n${DRY ? '[DRY RUN] ' : ''}${converted} 枚を最適化 / ${skipped} 枚は据え置き`);
console.log(`合計 ${mb(before)}MB → ${mb(after)}MB (-${Math.round((1 - after / before) * 100)}%)`);
if (failures.length) {
  console.log(`\n失敗 ${failures.length} 件:`);
  failures.forEach((f) => console.log(`  ✗ ${f}`));
  process.exitCode = 1;
}
