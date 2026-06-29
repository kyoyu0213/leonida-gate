import { useEffect, useRef } from 'react';
import Header from '@/components/Header';
import { useSeo } from '@/hooks/useSeo';
import { useT } from '@/lib/i18n';
import './imageTools.css';

// 画像リサイズ・圧縮ツール。
// 検証済みHTML（tool_image_resize.html）の挙動を「正」として移植したもの。
// Canvas処理ロジック（品質の二分探索・寸法縮小フォールバック）は改変していない。
// 表示文言は i18n 化。静的部分は t()、useEffect 内の動的文字列は最新の t を参照する
// tRef 経由で取得する（言語切替後も再アタッチ無しで最新言語の文言になる）。
export default function ImageResizeTool() {
  const t = useT();
  useSeo(t('tools.imageResize.seo.title'), t('tools.imageResize.seo.desc'), { localized: true });
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
      targetSegs = $('targetSegs'), customWrap = $('customWrap'), customMb = $('customMb'),
      fmtRow = $('fmtRow'), wIn = $('w'), hIn = $('h'), aspect = $('aspect'),
      go = $('go'), result = $('result'), verdict = $('verdict'),
      beforeSize = $('beforeSize'), afterSize = $('afterSize'), ratio = $('ratio'),
      fill = $('fill'), targetMark = $('targetMark'), afterLabel = $('afterLabel'),
      tgtLabel = $('tgtLabel'), dl = $('dl'), resultNote = $('resultNote');

    let bitmap: any = null, baseW = 0, baseH = 0, originalSize = 0, originalName = 'image',
      targetMb = 10, mime = 'image/jpeg', outBlob: any = null, outName = '';

    function fmtBytes(b: number) {
      if (b >= 1048576) return (b / 1048576).toFixed(2) + ' MB';
      if (b >= 1024) return (b / 1024).toFixed(0) + ' KB';
      return b + ' B';
    }

    // bitmapをcanvasに、最大表示サイズに合わせて描画（blob制約を避けるためcanvas表示）
    function drawToCanvas(canvas: any, bmp: any, maxW: number, maxH: number) {
      const r = Math.min(maxW / bmp.width, maxH / bmp.height, 1);
      const w = Math.max(1, Math.round(bmp.width * r)), h = Math.max(1, Math.round(bmp.height * r));
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(bmp, 0, 0, w, h);
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
      originalSize = f.size; originalName = f.name.replace(/\.[^.]+$/, '') || 'image';
      try {
        bitmap = await createImageBitmap(f, { imageOrientation: 'from-image' });
      } catch (_) {
        bitmap = await createImageBitmap(f);
      }
      baseW = bitmap.width; baseH = bitmap.height;
      drawToCanvas(srcCanvas, bitmap, 600, 340);
      fname.textContent = f.name;
      srcMeta.textContent = `${baseW}×${baseH}` + tr('tool.sep') + fmtBytes(originalSize);
      wIn.value = baseW; hIn.value = baseH;
      drop.style.display = 'none';
      ws.classList.add('on');
      result.classList.remove('on');
      go.disabled = false;
    }

    reset.addEventListener('click', () => {
      bitmap = null; outBlob = null; file.value = '';
      ws.classList.remove('on'); result.classList.remove('on');
      drop.style.display = 'block';
    }, { signal });

    // ---- target presets ----
    targetSegs.addEventListener('click', (e: any) => {
      const b = e.target.closest('.seg'); if (!b) return;
      [...targetSegs.children].forEach((s: any) => s.classList.remove('active'));
      b.classList.add('active');
      if (b.dataset.mb === 'custom') { customWrap.classList.add('on'); customMb.focus(); }
      else { customWrap.classList.remove('on'); targetMb = parseFloat(b.dataset.mb); }
    }, { signal });
    customMb.addEventListener('input', () => { const v = parseFloat(customMb.value); if (v > 0) targetMb = v; }, { signal });

    // ---- format ----
    fmtRow.addEventListener('click', (e: any) => {
      const f = e.target.closest('.fmt'); if (!f) return;
      [...fmtRow.children].forEach((x: any) => x.classList.remove('active'));
      f.classList.add('active'); mime = f.dataset.fmt;
    }, { signal });

    // ---- aspect-locked dims ----
    wIn.addEventListener('input', () => { if (aspect.checked && baseW) { hIn.value = Math.max(1, Math.round(wIn.value * baseH / baseW)); } }, { signal });
    hIn.addEventListener('input', () => { if (aspect.checked && baseH) { wIn.value = Math.max(1, Math.round(hIn.value * baseW / baseH)); } }, { signal });

    // ---- encode helpers ----
    function draw(w: number, h: number) {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const ctx = c.getContext('2d')!;
      if (mime === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); } // JPEGは透過不可→白地
      ctx.drawImage(bitmap, 0, 0, w, h);
      return c;
    }
    function toBlob(c: any, q?: number): Promise<any> { return new Promise(r => c.toBlob((b: any) => r(b), mime, q)); }

    async function compress(): Promise<any> {
      const targetBytes = Math.round(targetMb * 1048576);
      let dw = parseInt(wIn.value) || baseW, dh = parseInt(hIn.value) || baseH;
      dw = Math.min(dw, baseW * 4); dh = Math.min(dh, baseH * 4); // 拡大しすぎ防止
      let scale = 1, attempts = 0, last: any = null, lastQ: any = null;

      while (attempts < 14) {
        const w = Math.max(1, Math.round(dw * scale)), h = Math.max(1, Math.round(dh * scale));
        const c = draw(w, h);

        if (mime === 'image/png') {
          const blob = await toBlob(c, undefined);
          last = blob; lastQ = null;
          if (blob.size <= targetBytes) return { blob, w, h, q: null, scaled: scale < 1 };
          scale *= 0.85; attempts++; continue;
        }

        // JPEG / WebP: 品質を二分探索
        const top = await toBlob(c, 0.95);
        if (top.size <= targetBytes) {
          return { blob: top, w, h, q: 0.95, scaled: scale < 1 };
        }
        let lo = 0.05, hi = 0.95, best: any = null, bestQ: any = null;
        for (let i = 0; i < 8; i++) {
          const mid = (lo + hi) / 2;
          const blob = await toBlob(c, mid);
          if (blob.size <= targetBytes) { best = blob; bestQ = mid; lo = mid; } else { hi = mid; }
        }
        if (best) { return { blob: best, w, h, q: bestQ, scaled: scale < 1 }; }
        // 最低品質でも超過 → 縮小して再挑戦
        last = await toBlob(c, 0.05); lastQ = 0.05;
        scale *= 0.82; attempts++;
      }
      return { blob: last, w: Math.round(dw * scale), h: Math.round(dh * scale), q: lastQ, scaled: true, failed: true };
    }

    go.addEventListener('click', async () => {
      if (!bitmap) return;
      go.disabled = true; go.textContent = tr('toolR.go.busy');
      try {
        const targetBytes = Math.round(targetMb * 1048576);
        const res = await compress();
        outBlob = res.blob;
        const ext = mime === 'image/jpeg' ? 'jpg' : mime === 'image/webp' ? 'webp' : 'png';
        outName = `${originalName}_${(outBlob.size / 1048576).toFixed(1)}mb.${ext}`;

        beforeSize.textContent = fmtBytes(originalSize);
        afterSize.textContent = fmtBytes(outBlob.size);
        try {
          const outBmp = await createImageBitmap(outBlob);
          drawToCanvas($('outCanvas'), outBmp, 600, 300);
        } catch (_) { }
        const pct = Math.max(0, Math.round((1 - outBlob.size / originalSize) * 100));
        ratio.textContent = (outBlob.size < originalSize) ? `−${pct}%` : tr('toolR.noChange');

        const under = outBlob.size <= targetBytes;
        verdict.textContent = under ? tr('toolR.verdict.under') : tr('toolR.verdict.over');
        verdict.className = 'verdict ' + (under ? 'ok' : 'over');

        const ratioToTarget = Math.min(140, (outBlob.size / targetBytes) * 100);
        fill.style.width = Math.min(100, ratioToTarget) + '%';
        fill.style.background = under
          ? 'linear-gradient(90deg,var(--cyan),var(--green))'
          : 'linear-gradient(90deg,var(--sunset),var(--magenta))';
        targetMark.style.left = '100%';
        afterLabel.textContent = tr('toolR.afterLabel') + fmtBytes(outBlob.size);
        tgtLabel.textContent = tr('toolR.tgtLabel') + fmtBytes(targetBytes);

        let note = `${res.w}×${res.h}` + tr('toolR.note.size');
        if (res.q !== null) note += tr('tool.sep') + tr('toolR.note.qualityLabel') + ` ${Math.round(res.q * 100)}%`;
        if (res.scaled) note += tr('tool.sep') + tr('toolR.note.scaled');
        if (mime === 'image/png' && !under) note += tr('tool.sep') + tr('toolR.note.png');
        if (res.failed) note += tr('tool.sep') + tr('toolR.note.failed');
        resultNote.textContent = note;

        result.classList.add('on');
        result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (err) {
        resultNote.textContent = tr('toolR.err');
        result.classList.add('on');
      } finally {
        go.disabled = false; go.textContent = tr('toolR.go');
      }
    }, { signal });

    dl.addEventListener('click', () => {
      if (!outBlob) return;
      const url = URL.createObjectURL(outBlob);
      const a = document.createElement('a');
      a.href = url; a.download = outName; a.target = '_blank'; a.rel = 'noopener';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }, { signal });

    return () => ac.abort();
  }, []);

  return (
    <div className="vice-page vice-noise">
      <Header />

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[100px] pb-20 relative z-10">
        <div className="img-resize-tool" ref={rootRef}>
          <div className="wrap">
            <div className="eyebrow">{t('tool.eyebrow')}</div>
            <h1>{t('toolR.h1.pre')}<span className="hl">{t('toolR.h1.hl')}</span>{t('toolR.h1.post')}</h1>
            <p className="sub">{t('toolR.sub')}</p>
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
                    <span className="lab">{t('toolR.lab.target')}</span>
                    <div className="segs" id="targetSegs">
                      <button className="seg active" data-mb="10">10 MB</button>
                      <button className="seg" data-mb="8">8 MB</button>
                      <button className="seg" data-mb="custom">{t('toolR.seg.custom')}</button>
                    </div>
                    <div className="custom" id="customWrap">
                      <input type="number" id="customMb" min="0.1" step="0.1" placeholder={t('toolR.customPh')} />
                      <span className="unit">{t('toolR.unit')}</span>
                    </div>
                  </div>

                  <div className="group">
                    <span className="lab">{t('toolR.lab.format')}</span>
                    <div className="formats" id="fmtRow">
                      <div className="fmt active" data-fmt="image/jpeg">JPEG<small>{t('toolR.fmt.jpeg.small')}</small></div>
                      <div className="fmt" data-fmt="image/webp">WebP<small>{t('toolR.fmt.webp.small')}</small></div>
                      <div className="fmt" data-fmt="image/png">PNG<small>{t('toolR.fmt.png.small')}</small></div>
                    </div>
                  </div>

                  <details className="adv">
                    <summary>{t('toolR.adv.summary')}</summary>
                    <div className="dims">
                      <input type="number" id="w" min="1" placeholder={t('toolR.dim.w')} />
                      <span className="x">×</span>
                      <input type="number" id="h" min="1" placeholder={t('toolR.dim.h')} />
                    </div>
                    <label className="lock"><input type="checkbox" id="aspect" defaultChecked />{t('toolR.lock')}</label>
                  </details>

                  <button className="go" id="go">{t('toolR.go')}</button>
                </div>
              </div>

              <div className="result" id="result">
                <div className="rhead">
                  <span className="ttl">{t('toolR.result.title')}</span>
                  <span className="verdict ok" id="verdict">{t('toolR.verdict.under')}</span>
                </div>
                <div className="stage" style={{ minHeight: 'auto', marginBottom: 18 }}><canvas id="outCanvas"></canvas></div>
                <div className="nums">
                  <div className="num"><div className="k">{t('toolR.before')}</div><div className="v before" id="beforeSize">—</div></div>
                  <span className="arrow">→</span>
                  <div className="num"><div className="k">{t('toolR.after')}</div><div className="v after" id="afterSize">—</div></div>
                  <span className="ratio" id="ratio">—</span>
                </div>
                <div className="meter"><div className="fill" id="fill"></div><div className="target" id="targetMark"></div></div>
                <div className="meterlab"><span id="afterLabel">—</span><span className="tgt" id="tgtLabel">{t('toolR.tgtLabel')}—</span></div>
                <button className="dl" id="dl">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v12M12 16l-4-4M12 16l4-4" /><path d="M5 20h14" /></svg>
                  {t('toolR.dl')}
                </button>
                <p className="note" id="resultNote"></p>
                <p className="note">{t('toolR.note.fallback')}</p>
              </div>
            </div>

            <p className="footnote">
              {t('tool.footnote.privacy')}<br />
              {t('toolR.footnote.b')}
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
