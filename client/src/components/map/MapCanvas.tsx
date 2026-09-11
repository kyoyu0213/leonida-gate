// ============================================================================
//  地図キャンバス（Leaflet）。
//
//  ★ Leaflet / react-leaflet を import してよいのはこのディレクトリ（components/map/）だけ。
//    Leaflet は読み込んだ瞬間に window を触るため、SSR（プリレンダ）の import グラフに
//    入るとビルドが落ちる。このファイルは pages/MapTool.tsx から lazyWithRetry で
//    「マウント後にだけ」読み込まれる。静的 import はしないこと。
//    （scripts/check-leaflet-imports.mjs が prebuild で違反を検出する）
//
//  マーカーは画像を使わない divIcon（外部アセット・既定アイコンの404を持ち込まない）。
// ============================================================================
import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapDataset } from '@/data/maps/gta5/meta';
import { tileUrlOf } from '@/data/maps/gta5/meta';
import type { MapCategory } from '@/data/maps/gta5/categories';
import type { MapPin } from '@/lib/mapPins';
import { pinKey } from '@/lib/mapPins';
import { leafletTransformation, imageWorldBounds, formatVector } from '@/lib/mapTransform';

export interface MapCanvasProps {
  dataset: MapDataset;
  categories: Record<string, MapCategory>;
  /** 表示するピン（カテゴリの絞り込みは呼び出し側で済ませる）。 */
  pins: MapPin[];
  done: Set<string>;
  onToggleDone: (key: string) => void;
  /** 投稿フォーム用。地図クリックでワールド座標を返す。 */
  onPick: (x: number, y: number) => void;
  picked: { x: number; y: number } | null;
  onCopy: (text: string) => void;
  labels: {
    zMissing: string;
    copy: string;
    markDone: string;
    markUndone: string;
    sample: string;
    picked: string;
  };
}

function pinIcon(color: string, done: boolean) {
  return L.divIcon({
    className: 'mt-pin-icon',
    html: `<span class="mt-pin${done ? ' is-done' : ''}" style="--pin:${color}"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });
}

const pickedIcon = L.divIcon({
  className: 'mt-pin-icon',
  html: '<span class="mt-pick"></span>',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

function ClickToPick({ onPick }: { onPick: (x: number, y: number) => void }) {
  // CRS.Simple でワールド座標をそのまま LatLng にしているので、lng = x・lat = y。
  useMapEvents({ click: (e) => onPick(e.latlng.lng, e.latlng.lat) });
  return null;
}

/** 初回だけ地図全体が収まる位置へ合わせる。 */
function FitOnce({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export default function MapCanvas(props: MapCanvasProps) {
  const { dataset, categories, pins, done, onToggleDone, onPick, picked, onCopy, labels } = props;

  // CRS.Simple（scale(z)=2^z・zoom(s)=log(s)/ln2）の transformation だけを差し替える。
  const crs = useMemo(() => {
    const [a, b, c, d] = leafletTransformation(dataset);
    return L.extend({}, L.CRS.Simple, { transformation: new L.Transformation(a, b, c, d) }) as L.CRS;
  }, [dataset]);

  // ドラッグできる範囲・初期表示（LatLng は [y, x]）
  const viewBounds = useMemo<L.LatLngBoundsExpression>(() => {
    const m = dataset.maxBounds;
    return [[m.minY, m.minX], [m.maxY, m.maxX]];
  }, [dataset]);

  // タイルが存在する範囲。これより外のタイルは要求しない（存在しない URL を叩かない）。
  const tileBounds = useMemo<L.LatLngBoundsExpression>(() => {
    const w = imageWorldBounds(dataset);
    return [[w.minY, w.minX], [w.maxY, w.maxX]];
  }, [dataset]);

  return (
    <MapContainer
      crs={crs}
      center={[0, 0]}
      zoom={dataset.minZoom}
      minZoom={dataset.minZoom}
      maxZoom={dataset.maxZoom}
      maxBounds={viewBounds}
      maxBoundsViscosity={0.8}
      className="mt-leaflet"
      attributionControl
    >
      <FitOnce bounds={viewBounds} />
      <TileLayer
        url={tileUrlOf(dataset)}
        tileSize={dataset.tileSize}
        noWrap
        bounds={tileBounds}
        minZoom={dataset.minZoom}
        maxNativeZoom={dataset.maxNativeZoom}
        maxZoom={dataset.maxZoom}
        attribution={dataset.attribution}
      />
      <ClickToPick onPick={onPick} />
      {pins.map((p) => {
        const cat = categories[p.category];
        const key = pinKey(p);
        const isDone = done.has(key);
        const vec = formatVector(p.x, p.y, p.z);
        return (
          <Marker key={key} position={[p.y, p.x]} icon={pinIcon(cat?.color ?? '#ffffff', isDone)}>
            <Popup>
              <div className="mt-popup">
                <div className="mt-popup-cat" style={{ color: cat?.color }}>
                  {cat?.ja ?? p.category}
                  {p.sample ? <span className="mt-sample">{labels.sample}</span> : null}
                </div>
                <div className="mt-popup-title">{p.title}</div>
                {p.description ? <p className="mt-popup-desc">{p.description}</p> : null}
                <div className="mt-vec">
                  <code>{vec}</code>
                  {p.z == null ? <span className="mt-zmissing">{labels.zMissing}</span> : null}
                </div>
                <div className="mt-popup-actions">
                  <button type="button" onClick={() => onCopy(vec)}>{labels.copy}</button>
                  <button type="button" onClick={() => onToggleDone(key)}>
                    {isDone ? labels.markUndone : labels.markDone}
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
      {picked ? (
        <Marker position={[picked.y, picked.x]} icon={pickedIcon}>
          <Popup>
            <div className="mt-popup">
              <div className="mt-popup-title">{labels.picked}</div>
              <div className="mt-vec"><code>{formatVector(picked.x, picked.y, null)}</code></div>
            </div>
          </Popup>
        </Marker>
      ) : null}
    </MapContainer>
  );
}
