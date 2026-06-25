// 掲示板の一覧設定。ここに足すだけで掲示板を増やせる。
// slug は URL（/board/:slug）とDBの board 列に使う。

export type Accent = 'lime' | 'cyan' | 'purple' | 'pink';

export interface BoardConfig {
  slug: string;
  title: string;
  description: string;
  accent: Accent;
  /** 申請制：ユーザーは自由にスレを立てられず、申請フォームから申請→管理者がスレ立て */
  submitOnly?: boolean;
}

export const BOARDS: BoardConfig[] = [
  {
    slug: 'gtarp-servers',
    title: 'FiveMサーバー掲示板',
    description:
      '各GTARPサーバー専用のスレッド。掲載は申請制で、管理者が内容を確認のうえスレッドを作成します（過疎・架空鯖の乱立防止のため）。',
    accent: 'purple',
    submitOnly: true,
  },
  {
    slug: 'streamer-servers',
    title: '配信者サーバー掲示板',
    description:
      '人気ストリーマー／VTuberが参加するGTA RPサーバー専用のスレッド。掲載は申請制で、管理者が内容を確認のうえスレッドを作成します。',
    accent: 'pink',
    submitOnly: true,
  },
  {
    slug: 'gtarp',
    title: 'GTARPプレイヤー交流掲示板',
    description: '匿名でGTA/FiveM RPについて自由に語り合う場所',
    accent: 'lime',
  },
  {
    slug: 'gta6',
    title: 'GTA6情報交換掲示板',
    description: 'GTA6の最新情報・リーク・考察・雑談を交換する場所',
    accent: 'cyan',
  },
];

export const getBoard = (slug?: string): BoardConfig | undefined =>
  BOARDS.find((b) => b.slug === slug);

// 管理者判定・申請制スレの作成はサーバー側で認可する（client/src/lib/admin.ts）。
// 合言葉はクライアント／バンドルに一切置かない。

/** 掲示板アクセント色（VICEデザイン用） */
export const boardColor = (accent?: Accent): string =>
  accent === 'cyan'
    ? '#22d3ee'
    : accent === 'purple'
      ? '#a78bfa'
      : accent === 'pink'
        ? '#ff2d95'
        : '#3de0a0';

// 配色（旧サイバーパンクデザイン用に残置）
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
  purple: {
    text: 'text-purple-400',
    badge: 'border-purple-500/50 bg-purple-500/10 text-purple-400',
    gradient: 'from-purple-400 via-pink-500 to-cyan-400',
    button: 'bg-purple-600 hover:bg-purple-500 text-white',
    border: 'border-purple-500/30',
    borderHover: 'hover:border-purple-500/70 hover:bg-purple-500/5',
    bgSoft: 'bg-purple-500/5',
    inputBorder: 'border-purple-500/40',
  },
  pink: {
    text: 'text-pink-400',
    badge: 'border-pink-500/50 bg-pink-500/10 text-pink-400',
    gradient: 'from-pink-500 via-purple-400 to-cyan-400',
    button: 'bg-pink-600 hover:bg-pink-500 text-white',
    border: 'border-pink-500/30',
    borderHover: 'hover:border-pink-500/70 hover:bg-pink-500/5',
    bgSoft: 'bg-pink-500/5',
    inputBorder: 'border-pink-500/40',
  },
};
