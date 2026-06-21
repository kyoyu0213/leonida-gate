// 掲示板の一覧設定。ここに足すだけで掲示板を増やせる。
// slug は URL（/board/:slug）とDBの board 列に使う。

export type Accent = 'lime' | 'cyan';

export interface BoardConfig {
  slug: string;
  title: string;
  description: string;
  accent: Accent;
}

export const BOARDS: BoardConfig[] = [
  {
    slug: 'gta6',
    title: 'GTA6情報交換掲示板',
    description: 'GTA6の最新情報・リーク・考察・雑談を交換する場所',
    accent: 'cyan',
  },
  {
    slug: 'gtarp',
    title: 'GTARPプレイヤー交流掲示板',
    description: '匿名でGTA/FiveM RPについて自由に語り合う場所',
    accent: 'lime',
  },
];

export const getBoard = (slug?: string): BoardConfig | undefined =>
  BOARDS.find((b) => b.slug === slug);

// 配色（Tailwindの動的生成を避けるため、完成形のクラス文字列で持つ）
interface AccentStyle {
  text: string;
  badge: string;
  gradient: string;
  button: string;
  border: string;
  borderHover: string;
  bgSoft: string;
  inputBorder: string;
}

export const ACCENTS: Record<Accent, AccentStyle> = {
  lime: {
    text: 'text-lime-400',
    badge: 'border-lime-500/50 bg-lime-500/10 text-lime-400',
    gradient: 'from-lime-400 via-cyan-400 to-pink-500',
    button: 'bg-lime-600 hover:bg-lime-500 text-black',
    border: 'border-lime-500/30',
    borderHover: 'hover:border-lime-500/70 hover:bg-lime-500/5',
    bgSoft: 'bg-lime-500/5',
    inputBorder: 'border-lime-500/40',
  },
  cyan: {
    text: 'text-cyan-400',
    badge: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400',
    gradient: 'from-cyan-400 via-pink-500 to-lime-400',
    button: 'bg-cyan-600 hover:bg-cyan-500 text-white',
    border: 'border-cyan-500/30',
    borderHover: 'hover:border-cyan-500/70 hover:bg-cyan-500/5',
    bgSoft: 'bg-cyan-500/5',
    inputBorder: 'border-cyan-500/40',
  },
};
