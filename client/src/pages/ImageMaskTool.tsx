import { useEffect, useRef } from 'react';
import Header from '@/components/Header';
import { useSeo } from '@/hooks/useSeo';
import { useT } from '@/lib/i18n';
import './imageTools.css';

// モザイク・目隠しツール。
// 検証済みHTML（tool_image_mask.html）の挙動を「正」として移植したもの。
// 矩形は画像座標で保持し出力時に実解像度へ換算する／目隠し無しは元バイトを無加工で出力、
// といった計算ロジックは改変していない。
// 表示文言は i18n 化。動的文字列は最新の t を参照する tRef 経由で取得する。
export default function ImageMaskTool() {
  const t = useT();
  useSeo(t('tools.imageMask.seo.title'), t('tools.imageMask.seo.desc'));
  const rootRef = useRef<HTMLDivElement>(null);
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ac = new AbortController();
    const signal = ac.signal;
    const $ = (id: string): any => root.querySelector('#' + id);
    const tr = (k: string) => tRef.current(k);

    const drop = $('drop'), file = $('file'), ws = $('ws'), srcCanvas = $('srcCanvas'),
      fname = $('fname'), srcMeta = $('srcMeta'), reset = $('reset'),
      maskRow = $('maskRow'), maskNote = $('maskNote'), undoMask = $('undoMask'), clearMask = $('clearMask'),
      go = $('go'), resultNote = $('resultNote');

    let bitmap: any = null, baseW = 0, baseH = 0, originalSize = 0, originalName = 'image', originalMime = 'image/png', originalFile: any = null,
      outBlob: any = null, outName = '';
    let masks: any[] = [], maskStyle = 'solid';

    function fmtBytes(b: number) {
      if (b >= 1048576) return (b / 1048576).toFixed(2) + ' MB';
      if (b >= 1024) return (b / 1024).toFixed(0) + ' KB';
      return b + ' B';
    }

    function drawToCanvas(canvas: any, bmp: any, maxW: number, maxH: number) {
      const r = Math.min(maxW / bmp.width, maxH / bmp.height, 1);
      const w = Math.max(1, Math.round(bmp.width * r)), h = Math.max(1, Math.round(bmp.height * r));
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(bmp, 0, 0, w, h);
    }

    // 目隠しを1個描画。ctxのcanvasには既に画像が描かれている前提
    function renderMask(ctx: any, x: number, y: number, w: number, h: number, style: string) {
      x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
      if (w <= 1 || h <= 1) return;
      if (style === 'mosaic') {
        const long = Math.max(w, h), blocks = 12;
        const sw = Math.max(1, Math.round(w / long * blocks)), sh = Math.max(1, Math.round(h / long * blocks));
        const tmp = document.createElement('canvas'); tmp.width = sw; tmp.height = sh;
        const tt = tmp.getContext('2d')!; tt.imageSmoothingEnabled = false;
        tt.drawImage(ctx.canvas, x, y, w, h, 0, 0, sw, sh);
        ctx.save(); ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tmp, 0, 0, sw, sh, x, y, w, h);
        ctx.restore();
      } else {
        ctx.save(); ctx.fillStyle = '#000'; ctx.fillRect(x, y, w, h); ctx.restore();
      }
    }

    function redrawSource(tempRect?: any) {
      if (!bitmap) return;
      const ctx = srcCanvas.getContext('2d');
      const cw = srcCanvas.width, ch = srcCanvas.height;
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(bitmap, 0, 0, cw, ch);
      const sx = cw / baseW, sy = ch / baseH;
      masks.forEach((m: any) => renderMask(ctx, m.x * sx, m.y * sy, m.w * sx, m.h * sy, m.style));
      if (tempRect) {
        ctx.save();
        ctx.strokeStyle = '#2de2e6'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
        ctx.fillStyle = 'rgba(45,226,230,.15)';
        const rx = tempRect.x * sx, ry = tempRect.y * sy, rw = tempRect.w * sx, rh = tempRect.h * sy;
        ctx.fillRect(rx, ry, rw, rh); ctx.strokeRect(rx, ry, rw, rh);
        ctx.restore();
      }
      undoMask.disabled = masks.length === 0;
      clearMask.disabled = masks.length === 0;
      maskNote.innerHTML = masks.length
        ? tr('toolM.note.count').replace('{n}', String(masks.length))
        : tr('toolM.note.default');
    }

    // ---- load ----
    drop.addEventListener('click', () => file.click(), { signal });
    drop.addEventListener('keydown', (e: any) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); file.click(); } }, { signal });
    ['dragover', 'dragenter'].forEach(ev => drop.addEventListener(ev, (e: any) => { e.preventDefault(); drop.classList.add('drag'); }, { signal }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, (e: any) => { e.preventDefault(); drop.classList.remove('drag'); }, { signal }));
    drop.addEventListener('drop', (e: any) => { const f = e.dataTransfer.files[0]; if (f) loadFile(f); }, { signal });
    file.addEventListener('change', (e: any) => { const f = e.target.files[0]; if (f) loadFile(f); }, { signal });

    async function loadFile(f: any) {
      if (!/^image\/(png|jpeg|webp)$/.test(f.type)) {
        alert(tr('tool.alert.fileType'));
        return;
      }
      originalSize = f.size; originalName = f.name.replace(/\.[^.]+$/, '') || 'image'; originalMime = f.type; originalFile = f;
      try {
        bitmap = await createImageBitmap(f, { imageOrientation: 'from-image' });
      } catch (_) {
        bitmap = await createImageBitmap(f);
      }
      baseW = bitmap.width; baseH = bitmap.height;
      masks = [];
      drawToCanvas(srcCanvas, bitmap, 600, 340);
      redrawSource();
      fname.textContent = f.name;
      srcMeta.textContent = `${baseW}×${baseH}` + tr('tool.sep') + fmtBytes(originalSize);
      drop.style.display = 'none';
      ws.classList.add('on');
      go.disabled = false;
    }

    reset.addEventListener('click', () => {
      bitmap = null; outBlob = null; file.value = ''; masks = [];
      ws.classList.remove('on');
      drop.style.display = 'block';
    }, { signal });

    // ---- mask style / draw / undo / clear ----
    maskRow.addEventListener('click', (e: any) => {
      const f = e.target.closest('.fmt'); if (!f) return;
      [...maskRow.children].forEach((x: any) => x.classList.remove('active'));
      f.classList.add('active'); maskStyle = f.dataset.mask;
    }, { signal });
    undoMask.addEventListener('click', () => { masks.pop(); redrawSource(); }, { signal });
    clearMask.addEventListener('click', () => { masks = []; redrawSource(); }, { signal });

    let drawing = false, startImg: any = null;
    function toImgCoords(e: any) {
      const rect = srcCanvas.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width, py = (e.clientY - rect.top) / rect.height;
      return { x: Math.max(0, Math.min(1, px)) * baseW, y: Math.max(0, Math.min(1, py)) * baseH };
    }
    function rectFrom(a: any, b: any) {
      return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) };
    }
    srcCanvas.addEventListener('pointerdown', (e: any) => {
      if (!bitmap) return;
      drawing = true; startImg = toImgCoords(e);
      srcCanvas.setPointerCapture(e.pointerId);
    }, { signal });
    srcCanvas.addEventListener('pointermove', (e: any) => {
      if (!drawing) return;
      redrawSource(rectFrom(startImg, toImgCoords(e)));
    }, { signal });
    function endDraw(e: any) {
      if (!drawing) return;
      drawing = false;
      const r = rectFrom(startImg, toImgCoords(e));
      if (r.w > 3 && r.h > 3) { masks.push({ x: r.x, y: r.y, w: r.w, h: r.h, style: maskStyle }); }
      redrawSource();
    }
    srcCanvas.addEventListener('pointerup', endDraw, { signal });
    srcCanvas.addEventListener('pointercancel', endDraw, { signal });

    // ---- export ----
    function drawAt(w: number, h: number, outMime: string) {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const ctx = c.getContext('2d')!;
      if (outMime === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); }
      ctx.drawImage(bitmap, 0, 0, w, h);
      const sx = w / baseW, sy = h / baseH;
      masks.forEach((m: any) => renderMask(ctx, m.x * sx, m.y * sy, m.w * sx, m.h * sy, m.style));
      return c;
    }
    function toBlobAs(c: any, outMime: string, q?: number): Promise<any> { return new Promise(r => c.toBlob((b: any) => r(b), outMime, q)); }

    // 目隠し無し → 元ファイルを無加工で出力 / 目隠しあり → 画質維持で再エンコード
    async function buildOutput(): Promise<any> {
      if (masks.length === 0) {
        return { blob: originalFile, w: baseW, h: baseH, mime: originalMime, untouched: true };
      }
      const outMime = /^image\/(png|jpeg|webp)$/.test(originalMime) ? originalMime : 'image/png';
      const c = drawAt(baseW, baseH, outMime);
      const q = outMime === 'image/png' ? undefined : 0.95;
      const blob = await toBlobAs(c, outMime, q);
      return { blob, w: baseW, h: baseH, mime: outMime, untouched: false };
    }

    go.addEventListener('click', async () => {
      if (!bitmap) return;
      go.disabled = true; go.textContent = tr('toolM.go.busy');
      try {
        const res = await buildOutput();
        outBlob = res.blob;
        const ext = res.mime === 'image/jpeg' ? 'jpg' : res.mime === 'image/webp' ? 'webp' : 'png';
        const tag = masks.length ? '_masked' : '_out';
        outName = `${originalName}${tag}.${ext}`;

        // 即ダウンロード
        const url = URL.createObjectURL(outBlob);
        const a = document.createElement('a');
        a.href = url; a.download = outName; a.target = '_blank'; a.rel = 'noopener';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);

        let note;
        if (res.untouched) {
          note = tr('toolM.result.untouched');
        } else {
          note = tr('toolM.result.masked').replace('{n}', String(masks.length));
        }
        resultNote.textContent = note;
      } catch (err) {
        resultNote.textContent = tr('toolM.err');
      } finally {
        go.disabled = false; go.textContent = tr('toolM.go');
      }
    }, { signal });

    return () => ac.abort();
  }, []);

  return (
    <div className="vice-page vice-noise">
      <Header />

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[100px] pb-20 relative z-10">
        <div className="img-mask-tool" ref={rootRef}>
          <div className="wrap">
            <div className="eyebrow">{t('tool.eyebrow')}</div>
            <h1>{t('toolM.h1.pre')}<span className="hl">{t('toolM.h1.hl')}</span>{t('toolM.h1.post')}</h1>
            <p className="sub">{t('toolM.sub')}</p>
            <div className="privacy"><b>{t('tool.privacy.bold')}</b>{t('tool.privacy.rest')}</div>

            <div className="card">
              <div className="drop" id="drop" tabIndex={0} role="button" aria-label={t('tool.drop.title')}>
                <div className="ring">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 16V4M12 4l-4 4M12 4l4 4" /><path d="M5 20h14" />
                  </svg>
                </div>
                <h2>{t('tool.drop.title')}</h2>
                <p>{t('tool.drop.or')} <span className="browse">{t('tool.drop.browse')}</span> {t('tool.drop.formats')}</p>
                <input type="file" id="file" accept="image/png,image/jpeg,image/webp" hidden />
              </div>

              <div className="ws" id="ws">
                <div className="preview">
                  <div className="stage"><canvas id="srcCanvas"></canvas></div>
                  <div className="filerow">
                    <span className="filename" id="fname">—</span>
                    <span id="srcMeta">—</span>
                    <button className="reset" id="reset">{t('tool.reset')}</button>
                  </div>
                </div>

                <div className="controls">
                  <div className="group">
                    <span className="lab">{t('toolM.lab')}</span>
                    <div className="formats" id="maskRow">
                      <div className="fmt active" data-mask="solid">{t('toolM.solid')}<small>{t('toolM.solid.small')}</small></div>
                      <div className="fmt" data-mask="mosaic">{t('toolM.mosaic')}<small>{t('toolM.mosaic.small')}</small></div>
                    </div>
                    <p className="masknote" id="maskNote">{t('toolM.note.default')}</p>
                    <div className="maskbtns">
                      <button type="button" id="undoMask" disabled>{t('toolM.undo')}</button>
                      <button type="button" id="clearMask" disabled>{t('toolM.clear')}</button>
                    </div>
                  </div>

                  <button className="go" id="go" disabled>{t('toolM.go')}</button>
                  <p className="note" id="resultNote"></p>
                </div>
              </div>
            </div>

            <p className="footnote">
              {t('tool.footnote.privacy')}<br />
              {t('toolM.footnote.bPre')}<b style={{ color: 'var(--text)' }}>{t('toolM.footnote.bBold')}</b>{t('toolM.footnote.bPost')}
            </p>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/10" style={{ background: 'rgba(8,6,15,.6)' }}>
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-[30px] py-8 text-center text-[11.5px] text-white/40">
          {t('footer.disclaimer')} © 2026 GTA6 FEED
        </div>
      </footer>
    </div>
  );
}
