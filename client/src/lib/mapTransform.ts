// ============================================================================
//  マップの座標変換（Leaflet 非依存。SSR からも安全に import できる）。
//
//  データセットの transformation [a, b, c, d] で
//      ズーム0の画面X = a·worldX + b
//      ズーム0の画面Y = c·worldY + d
//  と変換する（Leaflet の L.Transformation と同じ式。係数の根拠は data/maps/gta5/meta.ts）。
//  ズーム z の画面座標はこれを 2^z 倍したもの。
// ============================================================================
import type { MapDataset, WorldRect } from '@/data/maps/gta5/meta';

/** Leaflet の L.Transformation に渡す4係数（CRS.Simple でワールド座標をそのまま LatLng にする）。 */
export function leafletTransformation(ds: MapDataset): [number, number, number, number] {
  return ds.transformation;
}

/** 画像全体（タイルがある範囲）がワールド座標でどこからどこまでか。タイルの要求範囲に使う。 */
export function imageWorldBounds(ds: MapDataset): WorldRect {
  const [a, b, c, d] = ds.transformation;
  const side = ds.imageSize / 2 ** ds.maxNativeZoom; // ズーム0での一辺
  const xs = [(0 - b) / a, (side - b) / a];
  const ys = [(0 - d) / c, (side - d) / c];
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
