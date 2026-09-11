// ============================================================================
//  GTA5 マップのデータセット定義（差し替え可能な単位）。
//
//  GTA6 対応時は client/src/data/maps/gta6/ を同じ形で作り、ページ側は
//  データセットを受け取るだけにする（タイル・座標変換・範囲・カテゴリは全部ここ側）。
//
//  ▼ タイル
//    martonp96/GTAV-Maps（MIT）の atlas を scripts/build-map-tiles.mjs が webp に変換したもの。
//    z7 で一辺 11000px の絵を左上そろえで 256px に切った枠（z0 では 85.9375px）。
//
//  ▼ 座標変換（Leaflet の CRS.Simple ＋ L.Transformation にそのまま渡す4係数）
//      ズーム0の画面X = a·worldX + b ／ ズーム0の画面Y = c·worldY + d
//      ズーム z では 2^z 倍（CRS.Simple の scale(z)=2^z・zoom(s)=log(s)/ln2）。
//    元になる実測値は RiceaRaul/gta-v-map-leaflet の
//      L.Transformation(0.02072, 117.3, -0.0205, 172.8)
//    ただしこれは「ズーム0で同じ絵が 256px ちょうどに収まる」タイル枠での値。
//    atlas は同じ絵が z0 で 85.9375px（= 11000 / 2^7）なので、4係数すべてに
//      ATLAS_FRAME = 85.9375 / 256
//    を掛けて枠を合わせる。これは両タイルを画像照合して確かめた（416 点・残差 RMS 約 0.6m・
//    回転なし・原点のずれなし）。LSIA・チリアド山頂・デルペロ桟橋など10地点が図上の正しい位置に落ちる。
// ============================================================================

export interface WorldRect {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface MapDataset {
  /** データセットID。DB の map_pins.map_id / map_datasets.map_id と一致させる。 */
  id: 'gta5';
  /**
   * タイルの版。URL に入り、/maps 配下は1年 immutable でキャッシュされるため、
   * 素材を変えたら必ず新しい値にする（上書きしない）。取得元は build-map-tiles.mjs の SOURCES。
   */
  tileVersion: `v${number}`;
  /** 最大ネイティブズームでの絵の一辺（px）。タイルは左上そろえで、端のタイルは一部透明。 */
  imageSize: number;
  tileSize: 256;
  minZoom: number;
  /** タイルを実際に持っている最大ズーム。 */
  maxNativeZoom: number;
  /** これより上は maxNativeZoom のタイルを拡大表示する。 */
  maxZoom: number;
  /** ワールド座標 → ズーム0の画面座標の係数 [a, b, c, d]（L.Transformation と同じ並び）。 */
  transformation: [number, number, number, number];
  /** 地図をドラッグできる範囲（ワールド座標）。 */
  maxBounds: WorldRect;
  /** 投稿を受け付けるワールド座標の範囲（supabase の map_datasets と同じ値にする）。 */
  bounds: WorldRect;
  /** 地図の帰属表示。 */
  attribution: string;
}

/** タイル URL（build-map-tiles.mjs の出力に合わせた Leaflet 標準の並び）。 */
export const tileUrlOf = (ds: MapDataset) => `/maps/${ds.id}/${ds.tileVersion}/{z}/{x}/{y}.webp`;

/** RiceaRaul/gta-v-map-leaflet の実測値（z0 で絵が 256px に収まるタイル枠での係数）。 */
const RICEARAUL_GTA5: [number, number, number, number] = [0.02072, 117.3, -0.0205, 172.8];
/** atlas の枠（z0 で 11000 / 2^7 = 85.9375px）への縮尺。 */
const ATLAS_FRAME = 11000 / 2 ** 7 / 256;

export const GTA5_MAP: MapDataset = {
  id: 'gta5',
  tileVersion: 'v1',
  imageSize: 11000,
  tileSize: 256,
  minZoom: 1,
  maxNativeZoom: 7,
  maxZoom: 8,
  // = [0.0069556, 39.3768, -0.0068817, 58.0078]
  transformation: RICEARAUL_GTA5.map((v) => v * ATLAS_FRAME) as [number, number, number, number],
  maxBounds: { minX: -5500, maxX: 6000, minY: -4000, maxY: 8000 },
  bounds: { minX: -5500, maxX: 6000, minY: -4000, maxY: 8000 },
  // Leaflet の帰属表示と地図下の注記の両方に出す（素材は MIT なので出典も併記する）。
  attribution: 'Map © Rockstar Games · Tiles: martonp96/GTAV-Maps (MIT)',
};
