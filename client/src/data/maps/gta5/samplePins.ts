// ============================================================================
//  公開前プレビュー用のサンプルピン（仮置き）。
//
//  実在の場所ではない。プレースホルダ画像の上に散らしただけの点で、
//  「DB に承認済みピンが1件も無い」かつ「未公開（release.ts が false）」のときだけ表示する。
//  種データ（source='official' の承認済みピン）が DB に入った時点で自動的に出なくなる。
// ============================================================================
import type { MapPin } from '@/lib/mapPins';

export const GTA5_SAMPLE_PINS: MapPin[] = [
  { id: 'sample-1', map_id: 'gta5', category: 'spaceship-parts', x: -1200, y: 2400, z: 32.5, title: 'サンプルピン A', description: '動作確認用の仮置きです（実在の場所ではありません）。', source: 'official', created_at: '2026-09-11T00:00:00Z', sample: true },
  { id: 'sample-2', map_id: 'gta5', category: 'letter-scraps', x: 850, y: -1300, z: null, title: 'サンプルピン B', description: 'Z未計測の例です（vector2 で表示されます）。', source: 'official', created_at: '2026-09-11T00:00:00Z', sample: true },
  { id: 'sample-3', map_id: 'gta5', category: 'nuclear-waste', x: 3100, y: 600, z: -12.75, title: 'サンプルピン C', description: '動作確認用の仮置きです（実在の場所ではありません）。', source: 'official', created_at: '2026-09-11T00:00:00Z', sample: true },
  { id: 'sample-4', map_id: 'gta5', category: 'peyote', x: -2600, y: 5200, z: 410.2, title: 'サンプルピン D', description: '動作確認用の仮置きです（実在の場所ではありません）。', source: 'official', created_at: '2026-09-11T00:00:00Z', sample: true },
  { id: 'sample-5', map_id: 'gta5', category: 'easter-eggs', x: 1700, y: 6100, z: null, title: 'サンプルピン E', description: 'Z未計測の例です（vector2 で表示されます）。', source: 'official', created_at: '2026-09-11T00:00:00Z', sample: true },
  { id: 'sample-6', map_id: 'gta5', category: 'playing-cards', x: -400, y: -2800, z: 21.0, title: 'サンプルピン F', description: '動作確認用の仮置きです（実在の場所ではありません）。', source: 'official', created_at: '2026-09-11T00:00:00Z', sample: true },
];
