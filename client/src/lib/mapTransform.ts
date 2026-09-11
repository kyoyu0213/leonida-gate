// ============================================================================
//  マップの座標変換（Leaflet 非依存。SSR からも安全に import できる）。
//
//  ワールド座標 (x, y) → 元画像ピクセル (px, py) を
//      px = a·x + b·y + c
//      py = d·x + e·y + f
//  のアフィン変換で表し、コントロールポイント3点以上から最小二乗で係数を求める。
//  Leaflet（CRS.Simple ＋ L.Transformation）は軸平行の変換しか持てないので、
//  回転・せん断成分（b, d）が十分小さいことを rotationRatio で確かめてから a, c, e, f だけを使う。
// ============================================================================
import type { MapControlPoint, MapDataset } from '@/data/maps/gta5/meta';

export interface Affine {
  a: number; b: number; c: number;
  d: number; e: number; f: number;
  /** フィット残差の RMS（px）。コントロールポイントの打ち間違い検出用。 */
  rmsPx: number;
  /** 回転・せん断成分の大きさ（|b|+|d| を |a|+|e| で割った比）。0 に近いほど北が上の画像。 */
  rotationRatio: number;
}

/** 3×3 の連立一次方程式を解く（クラメル）。 */
function solve3(m: number[][], v: number[]): [number, number, number] {
  const det = (q: number[][]) =>
    q[0][0] * (q[1][1] * q[2][2] - q[1][2] * q[2][1]) -
    q[0][1] * (q[1][0] * q[2][2] - q[1][2] * q[2][0]) +
    q[0][2] * (q[1][0] * q[2][1] - q[1][1] * q[2][0]);
  const D = det(m);
  if (Math.abs(D) < 1e-12) throw new Error('コントロールポイントが一直線上に並んでいて変換を決められません');
  const col = (i: number) => m.map((row, r) => row.map((x, c) => (c === i ? v[r] : x)));
  return [det(col(0)) / D, det(col(1)) / D, det(col(2)) / D];
}

/** コントロールポイントからアフィン変換を最小二乗で求める（3点以上）。 */
export function fitAffine(points: MapControlPoint[]): Affine {
  if (points.length < 3) throw new Error('コントロールポイントは3点以上必要です');
  // 正規方程式 (AᵀA)k = Aᵀb。A の行は [x, y, 1]。
  const ata = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  const atPx = [0, 0, 0];
  const atPy = [0, 0, 0];
  for (const p of points) {
    const row = [p.world[0], p.world[1], 1];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) ata[i][j] += row[i] * row[j];
      atPx[i] += row[i] * p.pixel[0];
      atPy[i] += row[i] * p.pixel[1];
    }
  }
  const [a, b, c] = solve3(ata, atPx);
  const [d, e, f] = solve3(ata, atPy);
  let se = 0;
  for (const p of points) {
    const px = a * p.world[0] + b * p.world[1] + c;
    const py = d * p.world[0] + e * p.world[1] + f;
    se += (px - p.pixel[0]) ** 2 + (py - p.pixel[1]) ** 2;
  }
  const rmsPx = Math.sqrt(se / points.length);
  const rotationRatio = (Math.abs(b) + Math.abs(d)) / (Math.abs(a) + Math.abs(e));
  return { a, b, c, d, e, f, rmsPx, rotationRatio };
}

/**
 * Leaflet の L.Transformation に渡す4係数（CRS.Simple でワールド座標をそのまま LatLng にする）。
 * LatLng は [y, x]。ズーム z のピクセルは 2^z 倍されるので、最大ネイティブズームで元画像ピクセルに
 * 一致するよう 1/2^maxNativeZoom を掛けておく。
 */
export function leafletTransformation(ds: MapDataset): [number, number, number, number] {
  const t = fitAffine(ds.controlPoints);
  if (t.rotationRatio > 0.01) {
    // 北が上の画像なら通常ここには来ない。来たらコントロールポイントの見直しが必要。
    console.warn(`[map] 回転・せん断成分が大きい（${t.rotationRatio.toFixed(4)}）。軸平行近似で表示します。`);
  }
  const k = 1 / 2 ** ds.maxNativeZoom;
  return [t.a * k, t.c * k, t.e * k, t.f * k];
}

/** 元画像全体がワールド座標でどこからどこまでか（Leaflet の表示範囲・タイル範囲に使う）。 */
export function imageWorldBounds(ds: MapDataset): { minX: number; maxX: number; minY: number; maxY: number } {
  const t = fitAffine(ds.controlPoints);
  const toWorldX = (px: number) => (px - t.c) / t.a;
  const toWorldY = (py: number) => (py - t.f) / t.e;
  const xs = [toWorldX(0), toWorldX(ds.imageSize)];
  const ys = [toWorldY(0), toWorldY(ds.imageSize)];
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

const fix2 = (n: number) => (Math.round(n * 100) / 100).toFixed(2);

/**
 * FiveM の座標表記。z があれば vector3(x, y, z)、無ければ vector2(x, y)。
 * 地図クリックでは高さ（z）が取れないので、z が無いピンは vector2 として扱う。
 */
export function formatVector(x: number, y: number, z: number | null | undefined): string {
  return z == null ? `vector2(${fix2(x)}, ${fix2(y)})` : `vector3(${fix2(x)}, ${fix2(y)}, ${fix2(z)})`;
}
