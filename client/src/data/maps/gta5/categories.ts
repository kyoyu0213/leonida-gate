// ============================================================================
//  GTA5 マップのカテゴリ（削ぎ落とし型：ゲーム内マップで分かる店・施設は載せない）。
//  id は DB の map_pins.category に入る値（^[a-z0-9-]{1,32}$）。表示名だけ変えるのは自由だが、
//  id を変えると既存ピン・チェック済み状態との対応が切れるので変えないこと。
//  件数などゲーム側の数字はここに書かない（検証済みの種データがそろってから本文で扱う）。
// ============================================================================

export interface MapCategory {
  id: string;
  ja: string;
  en: string;
  /** マーカーとチップの色。 */
  color: string;
}

export const GTA5_CATEGORIES: MapCategory[] = [
  { id: 'spaceship-parts', ja: '宇宙船の部品', en: 'Spaceship parts', color: '#22d3ee' },
  { id: 'letter-scraps', ja: '手紙の切れ端', en: 'Letter scraps', color: '#fbbf24' },
  { id: 'nuclear-waste', ja: '核廃棄物', en: 'Nuclear waste', color: '#a3e635' },
  { id: 'submarine-parts', ja: '潜水艦の部品', en: 'Submarine parts', color: '#60a5fa' },
  { id: 'peyote', ja: 'ペヨーテ', en: 'Peyote plants', color: '#f472b6' },
  { id: 'signal-jammers', ja: '信号妨害装置', en: 'Signal jammers', color: '#fb923c' },
  { id: 'playing-cards', ja: 'トランプ（オンライン）', en: 'Playing cards (Online)', color: '#c084fc' },
  { id: 'easter-eggs', ja: 'イースターエッグ', en: 'Easter eggs', color: '#ff2d95' },
];

export const GTA5_CATEGORY_BY_ID: Record<string, MapCategory> = Object.fromEntries(
  GTA5_CATEGORIES.map((c) => [c.id, c]),
);
