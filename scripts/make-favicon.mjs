import sharp from 'sharp';
// ワードマーク中心をクロップ（左右のスピードライン・下の星屑影を除外）して大きく見せる
const core = await sharp('client/public/images/gta6feed-logo.webp')
  .extract({ left: 150, top: 15, width: 830, height: 250 })
  .trim()
  .resize({ width: 496, height: 496, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: { r: 11, g: 7, b: 20, alpha: 1 } } })
  .composite([{ input: core, gravity: 'center' }])
  .png()
  .toFile('client/public/favicon-tight.png');
console.log('done');
