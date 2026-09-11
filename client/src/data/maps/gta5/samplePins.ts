// ============================================================================
//  公開前プレビュー用のサンプルピン（仮置き）。
//
//  隠し要素の場所ではない。座標変換の位置合わせを目で確かめられるよう、GTA5 の有名な地点
//  （空港・山頂・桟橋など）のワールド座標に置いてある。高さ（z）は測っていないので全部 null。
//  「DB に承認済みピンが1件も無い」かつ「未公開（release.ts が false）」のときだけ表示する。
//  種データ（source='official' の承認済みピン）が DB に入った時点で自動的に出なくなる。
// ============================================================================
import type { MapPin } from '@/lib/mapPins';

const NOTE = '位置合わせ確認用のサンプルです（隠し要素の場所ではありません）。';
const AT = '2026-09-11T00:00:00Z';

export const GTA5_SAMPLE_PINS: MapPin[] = [
  { id: 'sample-1', map_id: 'gta5', category: 'spaceship-parts', x: 501.8, y: 5604.1, z: null, title: 'サンプル：チリアド山頂', description: NOTE, source: 'official', created_at: AT, sample: true },
  { id: 'sample-2', map_id: 'gta5', category: 'letter-scraps', x: -1037, y: -2737, z: null, title: 'サンプル：ロスサントス国際空港（LSIA）', description: NOTE, source: 'official', created_at: AT, sample: true },
  { id: 'sample-3', map_id: 'gta5', category: 'nuclear-waste', x: 1733, y: 3309, z: null, title: 'サンプル：サンディ海岸飛行場', description: NOTE, source: 'official', created_at: AT, sample: true },
  { id: 'sample-4', map_id: 'gta5', category: 'peyote', x: -448, y: 6008, z: null, title: 'サンプル：パレト・ベイ', description: NOTE, source: 'official', created_at: AT, sample: true },
  { id: 'sample-5', map_id: 'gta5', category: 'easter-eggs', x: -75, y: -818, z: null, title: 'サンプル：メイズ・バンク・タワー', description: NOTE, source: 'official', created_at: AT, sample: true },
  { id: 'sample-6', map_id: 'gta5', category: 'playing-cards', x: -1663, y: -1126, z: null, title: 'サンプル：デルペロ桟橋', description: NOTE, source: 'official', created_at: AT, sample: true },
];
