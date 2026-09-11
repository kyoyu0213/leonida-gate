// ============================================================================
//  GTA5 マップのデータセット定義（差し替え可能な単位）。
//
//  GTA6 対応時は client/src/data/maps/gta6/ を同じ形で作り、ページ側は
//  データセットを受け取るだけにする（地図画像・タイル・座標変換・カテゴリは全部ここ側）。
//
//  ▼ 座標変換の考え方
//    ゲーム内のワールド座標 (x, y) → 元画像のピクセル座標 (px, py) を、既知の地点
//    （コントロールポイント）3点以上からアフィン変換で最小二乗フィットする
//    （lib/mapTransform.ts の fitAffine）。北が上の地図画像なら回転・せん断成分は
//    ほぼ 0 になるので、Leaflet には軸平行成分（CRS.Simple ＋ L.Transformation）で渡す。
//
//  ▼ 暫定値について（重要）
//    元画像はまだ置いていない（運営者が用意する）。今の controlPoints は
//    プレースホルダ画像（自前生成のグリッド）の「四隅」を仮に置いたもので、
//    実在のランドマークではない。元画像が決まったら、LSIA滑走路・チリアド山頂・
//    Maze Bank Tower など既知の地点のワールド座標と、元画像上のピクセル位置を
//    3点以上ここに入れ直す。bounds も同時に更新し、supabase/map_pins.sql の
//    map_datasets（投稿の範囲外判定）とそろえること。
// ============================================================================

export interface MapControlPoint {
  /** 地点名（どこを基準にしたかの記録用）。 */
  name: string;
  /** ゲーム内ワールド座標 [x, y]。 */
  world: [number, number];
  /** 元画像（最大ネイティブズーム＝imageSize四方）上のピクセル座標 [px, py]。左上が原点。 */
  pixel: [number, number];
}

export interface MapDataset {
  /** データセットID。DB の map_pins.map_id / map_datasets.map_id と一致させる。 */
  id: 'gta5';
  /**
   * タイルの版。URL に入り、/maps 配下は1年 immutable でキャッシュされるため、
   * 元画像を差し替えたら必ず新しい値にする（上書きしない）。
   * 'placeholder' のときは scripts/build-map-tiles.mjs が自前のグリッド画像からタイルを作る。
   */
  tileVersion: 'placeholder' | `v${number}`;
  /** 元画像の一辺（px）。= tileSize × 2^maxNativeZoom。 */
  imageSize: number;
  tileSize: 256;
  minZoom: number;
  /** タイルを実際に持っている最大ズーム。 */
  maxNativeZoom: number;
  /** これより上は maxNativeZoom のタイルを拡大表示する。 */
  maxZoom: number;
  /** 座標変換のコントロールポイント（3点以上）。 */
  controlPoints: MapControlPoint[];
  /** 投稿を受け付けるワールド座標の範囲（map_datasets と同じ値にする）。 */
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  /** 地図の帰属表示。 */
  attribution: string;
}

/** タイル URL（{z}/{y}/{x} は sharp の layout:'google' の出力に合わせた並び）。 */
export const tileUrlOf = (ds: MapDataset) => `/maps/${ds.id}/${ds.tileVersion}/{z}/{y}/{x}.webp`;

export const GTA5_MAP: MapDataset = {
  id: 'gta5',
  tileVersion: 'placeholder',
  imageSize: 8192,
  tileSize: 256,
  minZoom: 0,
  maxNativeZoom: 5,
  maxZoom: 7,
  // 暫定：プレースホルダ画像の四隅（1.5m/px・12,288m四方を仮定）。実在の地点ではない。
  controlPoints: [
    { name: '暫定: 画像の左上', world: [-5144, 8144], pixel: [0, 0] },
    { name: '暫定: 画像の右上', world: [7144, 8144], pixel: [8192, 0] },
    { name: '暫定: 画像の左下', world: [-5144, -4144], pixel: [0, 8192] },
  ],
  bounds: { minX: -5144, maxX: 7144, minY: -4144, maxY: 8144 },
  attribution: 'Map © Rockstar Games',
};
