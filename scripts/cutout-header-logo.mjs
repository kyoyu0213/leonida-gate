import sharp from 'sharp';
const src = 'client/public/images/logo-header.png';
const out = 'client/public/images/logo-header.webp';

const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info; // channels = 4
const idx = (x, y) => (y * W + x) * 4;
const isWhite = (i) => data[i] > 230 && data[i+1] > 230 && data[i+2] > 230; // 背景の白/ほぼ白

// 四辺の白ピクセルからフラッドフィルして、外側に繋がった背景だけを透過にする。
const visited = new Uint8Array(W * H);
const stack = [];
const push = (x, y) => { if (x>=0&&x<W&&y>=0&&y<H) { const p=y*W+x; if(!visited[p]){ visited[p]=1; stack.push(p);} } };
for (let x = 0; x < W; x++) { push(x, 0); push(x, H-1); }
for (let y = 0; y < H; y++) { push(0, y); push(W-1, y); }
let cleared = 0;
while (stack.length) {
  const p = stack.pop();
  const i = p * 4;
  if (!isWhite(i)) continue;      // 背景の白でなければ（＝ロゴ縁）ここで止める
  data[i+3] = 0;                  // 透過に
  cleared++;
  const x = p % W, y = (p / W) | 0;
  push(x+1, y); push(x-1, y); push(x, y+1); push(x, y-1);
}

// 透過にした画像から、内容の境界を検出してトリム → リサイズ → webp
let minX=W,minY=H,maxX=0,maxY=0;
for (let y=0;y<H;y++) for (let x=0;x<W;x++){ if(data[idx(x,y)+3]>10){ if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y; } }
const pad=8; minX=Math.max(0,minX-pad);minY=Math.max(0,minY-pad);maxX=Math.min(W-1,maxX+pad);maxY=Math.min(H-1,maxY+pad);
const cw=maxX-minX+1, ch=maxY-minY+1;

const meta = await sharp(Buffer.from(data), { raw: { width: W, height: H, channels: 4 } })
  .extract({ left:minX, top:minY, width:cw, height:ch })
  .resize({ height: 140, withoutEnlargement: true })
  .webp({ quality: 92, alphaQuality: 100 })
  .toFile(out);
console.log('cleared', cleared, 'bbox', cw+'x'+ch, '-> out', meta.width+'x'+meta.height, Math.round((meta.size||0)/1024)+'KB');
