import { lazy, Suspense, useEffect, useMemo, useState, type ComponentType, type LazyExoticComponent } from 'react';
import Header from '@/components/Header';
import BoardGuide from '@/components/BoardGuide';
import SiteFooter from '@/components/SiteFooter';
import MapErrorBoundary from '@/components/map/MapErrorBoundary';
// 型だけの import（ビルド時に消える）。Leaflet を実行時に読み込むのは下の lazy だけ。
import type { MapCanvasProps } from '@/components/map/MapCanvas';
import { TOOL_GUIDES } from '@/data/boardGuides';
import { GTA5_MAP } from '@/data/maps/gta5/meta';
import { GTA5_CATEGORIES, GTA5_CATEGORY_BY_ID } from '@/data/maps/gta5/categories';
import { GTA5_SAMPLE_PINS } from '@/data/maps/gta5/samplePins';
import { MAP_RELEASED } from '@/data/maps/release';
import { useSeo } from '@/hooks/useSeo';
import { useT, useLang } from '@/lib/i18n';
import { lazyWithRetry } from '@/lib/lazyLoad';
import {
  createMapPin,
  listApprovedMapPins,
  loadDone,
  mapPinErrorMessage,
  pinKey,
  saveDone,
  type MapPin,
} from '@/lib/mapPins';
import { formatVector } from '@/lib/mapTransform';
import { seedMapPins } from '@/lib/ssrSeed';
import './mapTool.css';

// ============================================================================
//  GTA5 隠し要素マップ（/fivem-gtarp/tools/gta5-map）。
//
//  ▼ バンドル方針（⑫の再発防止）
//    このページ本体は App.tsx で事前 import する（プリレンダ対象。説明・カテゴリ一覧・
//    承認済みピンのテキスト一覧はここで描く＝空シェルにならない）。
//    Leaflet を含む地図キャンバスだけを lazyWithRetry で、しかもマウント後にだけ読む。
//    取得に失敗しても MapErrorBoundary が地図枠の中で止め、本文は残る。
//
//  ▼ 絞り込みの規約（NewsList と同じ）
//    カテゴリで絞っても一覧の項目は DOM から外さず hidden で隠す（初期状態は全表示）。
// ============================================================================

const DATASET = GTA5_MAP;
const RELEASED = MAP_RELEASED.gta5;

type Canvas = LazyExoticComponent<ComponentType<MapCanvasProps>>;
const loadCanvas = () => import('@/components/map/MapCanvas');
const makeCanvas = () => lazyWithRetry(loadCanvas as never) as unknown as Canvas;

/** 承認済みピン（焼き込み seed）。無く、かつ未公開ならサンプルで代用する。 */
function initialPins(): MapPin[] {
  const seeded = seedMapPins(DATASET.id).map((p) => ({ ...p }));
  if (seeded.length) return seeded;
  return RELEASED ? [] : GTA5_SAMPLE_PINS;
}

function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  return new Promise((resolve, reject) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      resolve();
    } catch (e) {
      reject(e);
    } finally {
      document.body.removeChild(ta);
    }
  });
}

export default function MapTool() {
  const t = useT();
  const lang = useLang();
  useSeo(t('tools.gta5Map.seo.title'), t('tools.gta5Map.seo.desc'), { localized: true });

  const [pins, setPins] = useState<MapPin[]>(initialPins);
  const [active, setActive] = useState<Set<string>>(() => new Set(GTA5_CATEGORIES.map((c) => c.id)));
  const [done, setDone] = useState<Set<string>>(() => new Set());
  const [mounted, setMounted] = useState(false);
  const [Canvas, setCanvas] = useState<Canvas>(makeCanvas);
  const [retryKey, setRetryKey] = useState(0);
  const [toast, setToast] = useState('');

  // 投稿フォーム
  const [fCat, setFCat] = useState(GTA5_CATEGORIES[0].id);
  const [fTitle, setFTitle] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fX, setFX] = useState('');
  const [fY, setFY] = useState('');
  const [fZ, setFZ] = useState('');
  const [fName, setFName] = useState('');
  const [hp, setHp] = useState('');
  const [sending, setSending] = useState(false);
  const [formMsg, setFormMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const catLabel = (id: string) => {
    const c = GTA5_CATEGORY_BY_ID[id];
    return c ? (lang === 'en' ? c.en : c.ja) : id;
  };

  useEffect(() => {
    setMounted(true);
    setDone(loadDone(DATASET.id));
    // 承認直後のピンも出せるよう、焼き込み分に DB の最新を合成する（失敗時は焼き込み分のまま）。
    listApprovedMapPins(DATASET.id).then((live) => {
      if (!live.length) return;
      setPins((prev) => {
        const byId = new Map(prev.filter((p) => !p.sample).map((p) => [p.id, p]));
        for (const p of live) byId.set(p.id, p);
        return Array.from(byId.values());
      });
    });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 1800);
    return () => clearTimeout(id);
  }, [toast]);

  const sorted = useMemo(() => {
    const order = new Map(GTA5_CATEGORIES.map((c, i) => [c.id, i]));
    return [...pins].sort(
      (a, b) => (order.get(a.category) ?? 99) - (order.get(b.category) ?? 99) || a.title.localeCompare(b.title, 'ja'),
    );
  }, [pins]);
  const visiblePins = useMemo(() => sorted.filter((p) => active.has(p.category)), [sorted, active]);
  const countByCat = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of pins) m.set(p.category, (m.get(p.category) ?? 0) + 1);
    return m;
  }, [pins]);
  const doneVisible = visiblePins.filter((p) => done.has(pinKey(p))).length;
  const hasSamples = pins.some((p) => p.sample);

  const toggleCat = (id: string) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleDone = (key: string) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      saveDone(DATASET.id, next);
      return next;
    });
  const copy = (text: string) =>
    copyText(text)
      .then(() => setToast(t('toolMap.copied')))
      .catch(() => setToast(t('toolMap.copyFailed')));
  const pick = (x: number, y: number) => {
    setFX((Math.round(x * 100) / 100).toString());
    setFY((Math.round(y * 100) / 100).toString());
  };
  // Chrome は取得に失敗した動的 import を同じURLのまま再取得しない（失敗がキャッシュされる）。
  // まず読み直してみて、取れれば（描画時エラーだった等）その場で差し替え、取れなければページごと読み直す。
  const retry = () => {
    loadCanvas().then(
      (mod) => {
        setCanvas(() => lazy(() => Promise.resolve(mod)));
        setRetryKey((k) => k + 1);
      },
      () => window.location.reload(),
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hp) return; // ハニーポット（人間は触らない欄）
    const x = Number(fX);
    const y = Number(fY);
    const z = fZ.trim() === '' ? null : Number(fZ);
    if (!fTitle.trim() || !Number.isFinite(x) || !Number.isFinite(y) || (z !== null && !Number.isFinite(z))) {
      setFormMsg({ ok: false, text: t('toolMap.form.invalid') });
      return;
    }
    setSending(true);
    setFormMsg(null);
    const { error } = await createMapPin({
      mapId: DATASET.id,
      category: fCat,
      x,
      y,
      z,
      title: fTitle.trim(),
      description: fDesc.trim(),
      authorName: fName.trim(),
      hp,
    });
    setSending(false);
    if (error) {
      setFormMsg({ ok: false, text: mapPinErrorMessage(error.message, error.code) });
      return;
    }
    // 承認されるまで公開地図には出さない（ここでは地図に足さない）。
    setFormMsg({ ok: true, text: t('toolMap.form.done') });
    setFTitle('');
    setFDesc('');
  };

  const placeholder = (
    <div className="mt-map-placeholder" aria-hidden="true">
      <span>{t('toolMap.map.loading')}</span>
    </div>
  );

  const labels: MapCanvasProps['labels'] = {
    zMissing: t('toolMap.zMissing'),
    copy: t('toolMap.copy'),
    markDone: t('toolMap.markDone'),
    markUndone: t('toolMap.markUndone'),
    sample: t('toolMap.sample'),
    picked: t('toolMap.picked'),
  };

  return (
    <div className="vice-page vice-noise">
      <Header />

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[100px] pb-20 relative z-10">
        <div className="map-tool">
          <div className="eyebrow">{t('tool.eyebrow')}</div>
          <h1>
            {t('toolMap.h1.pre')}
            <span className="hl">{t('toolMap.h1.hl')}</span>
          </h1>
          <p className="sub">{t('toolMap.sub')}</p>
          {!RELEASED ? <div className="mt-preview">{t('toolMap.preview')}</div> : null}

          {/* カテゴリ（地図と一覧の両方を絞る） */}
          <div className="mt-cats" role="group" aria-label={t('toolMap.lab.categories')}>
            {GTA5_CATEGORIES.map((c) => {
              const on = active.has(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`mt-chip${on ? ' on' : ''}`}
                  style={{ ['--chip' as string]: c.color }}
                  aria-pressed={on}
                  onClick={() => toggleCat(c.id)}
                >
                  <span className="dot" />
                  {lang === 'en' ? c.en : c.ja}
                  <span className="n">{countByCat.get(c.id) ?? 0}</span>
                </button>
              );
            })}
            <button type="button" className="mt-chip ghost" onClick={() => setActive(new Set(GTA5_CATEGORIES.map((c) => c.id)))}>
              {t('toolMap.cats.all')}
            </button>
            <button type="button" className="mt-chip ghost" onClick={() => setActive(new Set())}>
              {t('toolMap.cats.none')}
            </button>
          </div>

          {/* 地図枠（高さ固定。読み込み前・失敗時も同じ大きさを保つ） */}
          <div className="mt-map">
            {mounted ? (
              <MapErrorBoundary message={t('toolMap.map.error')} retryLabel={t('toolMap.map.retry')} onRetry={retry} resetKey={retryKey}>
                <Suspense fallback={placeholder}>
                  <Canvas
                    dataset={DATASET}
                    categories={GTA5_CATEGORY_BY_ID}
                    pins={visiblePins}
                    done={done}
                    onToggleDone={toggleDone}
                    onPick={pick}
                    picked={fX !== '' && fY !== '' && Number.isFinite(Number(fX)) && Number.isFinite(Number(fY)) ? { x: Number(fX), y: Number(fY) } : null}
                    onCopy={copy}
                    labels={labels}
                  />
                </Suspense>
              </MapErrorBoundary>
            ) : (
              placeholder
            )}
          </div>
          <div className="mt-under">
            <span>{t('toolMap.progress').replace('{done}', String(doneVisible)).replace('{total}', String(visiblePins.length))}</span>
            <span className="mt-attr">{DATASET.attribution}</span>
          </div>
          {toast ? <div className="mt-toast" role="status">{toast}</div> : null}

          {/* 登録されている場所（プリレンダに焼く一覧。絞り込みは hidden で隠すだけ） */}
          <section className="mt-list">
            <h2>{t('toolMap.list.title')}</h2>
            {hasSamples ? <p className="mt-note">{t('toolMap.list.sampleNote')}</p> : null}
            {GTA5_CATEGORIES.map((c) => {
              const rows = sorted.filter((p) => p.category === c.id);
              return (
                <div key={c.id} className="mt-group" hidden={!active.has(c.id)}>
                  <h3 style={{ color: c.color }}>
                    {lang === 'en' ? c.en : c.ja}（{rows.length}）
                  </h3>
                  {rows.length === 0 ? (
                    <p className="mt-empty">{t('toolMap.list.empty')}</p>
                  ) : (
                    <ul>
                      {rows.map((p) => {
                        const key = pinKey(p);
                        const vec = formatVector(p.x, p.y, p.z);
                        return (
                          <li key={key} className={done.has(key) ? 'is-done' : undefined}>
                            <label className="mt-check">
                              <input type="checkbox" checked={done.has(key)} onChange={() => toggleDone(key)} />
                              <span className="mt-li-title">{p.title}</span>
                              {p.sample ? <span className="mt-sample">{t('toolMap.sample')}</span> : null}
                            </label>
                            {p.description ? <p className="mt-li-desc">{p.description}</p> : null}
                            <div className="mt-vec">
                              <code>{vec}</code>
                              {p.z == null ? <span className="mt-zmissing">{t('toolMap.zMissing')}</span> : null}
                              <button type="button" onClick={() => copy(vec)}>{t('toolMap.copy')}</button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </section>

          {/* 投稿（承認キューへ） */}
          <section className="mt-form-wrap">
            <h2>{t('toolMap.form.title')}</h2>
            <p className="mt-note">{t('toolMap.form.lead')}</p>
            <form className="mt-form" onSubmit={submit}>
              <label>
                <span>{t('toolMap.form.category')}</span>
                <select value={fCat} onChange={(e) => setFCat(e.target.value)}>
                  {GTA5_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{catLabel(c.id)}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>{t('toolMap.form.name')}</span>
                <input value={fTitle} maxLength={60} onChange={(e) => setFTitle(e.target.value)} required />
              </label>
              <div className="mt-xyz">
                <label>
                  <span>X</span>
                  <input inputMode="decimal" value={fX} onChange={(e) => setFX(e.target.value)} required />
                </label>
                <label>
                  <span>Y</span>
                  <input inputMode="decimal" value={fY} onChange={(e) => setFY(e.target.value)} required />
                </label>
                <label>
                  <span>{t('toolMap.form.z')}</span>
                  <input inputMode="decimal" value={fZ} onChange={(e) => setFZ(e.target.value)} />
                </label>
              </div>
              <label>
                <span>{t('toolMap.form.desc')}</span>
                <textarea value={fDesc} maxLength={400} rows={3} onChange={(e) => setFDesc(e.target.value)} />
              </label>
              <label>
                <span>{t('toolMap.form.author')}</span>
                <input value={fName} maxLength={30} onChange={(e) => setFName(e.target.value)} />
              </label>
              {/* ハニーポット：人間には見えない欄。埋まっていたら送信しない（サーバー側でも破棄）。 */}
              <input
                type="text"
                name="hp_url"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={hp}
                onChange={(e) => setHp(e.target.value)}
                style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
              />
              <button type="submit" className="mt-submit" disabled={sending}>
                {sending ? t('toolMap.form.sending') : t('toolMap.form.submit')}
              </button>
              {formMsg ? <p className={formMsg.ok ? 'mt-ok' : 'mt-ng'} role="status">{formMsg.text}</p> : null}
            </form>
          </section>
        </div>

        {/* ツール本体はブラウザ内で動くUIのため、生HTMLに実コンテンツを残すのはこのブロック。 */}
        <BoardGuide content={TOOL_GUIDES['gta5-map']} />
      </main>

      <SiteFooter width={1100} />
    </div>
  );
}
