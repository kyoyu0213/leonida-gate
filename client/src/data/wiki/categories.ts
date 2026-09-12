// ============================================================================
//  GTA6まとめWiki のカテゴリ（単一の正）。
//
//  index のカードグリッド・各ページのサイドナビ・関連リンク・パンくずはこの配列から作る
//  （別表を作らない）。作成済みのカテゴリだけをここに置く（未作成は出さない）。
//
//  ※ scripts/lib/wiki-release.mjs が `slug: '...'` の行を正規表現で読み、
//    公開時の sitemap（STATIC_ROUTES）を組み立てる。書式を変えないこと。
//    ルートを増やしたら App.tsx と entry-server.tsx の JA_ONLY_ROUTES にも足す
//    （3者の一致は scripts/check-route-tables.mjs が prebuild で検証する）。
// ============================================================================
import type { WikiInfobox } from './types';

export interface WikiCategory {
  slug: string;
  /** H1・パンくずに出す名前。 */
  title: string;
  /** サイドナビ等の短い名前。 */
  shortTitle: string;
  /** <title>。 */
  seoTitle: string;
  /** meta description。 */
  description: string;
  order: number;
  /** カードのアクセント色。 */
  accent: string;
  /** index のカードに出す要約。 */
  summary: string;
  /** 関連カテゴリ（ページ末尾の内部リンク）。 */
  related: string[];
}

/** Wiki のトップ。 */
export const WIKI_BASE = '/gta6-wiki';
export const WIKI_NAME = 'GTA6まとめWiki';
/** 全ページ共通の最終更新日（YYYY-MM-DD）。各ページの updated が優先。 */
export const WIKI_UPDATED = '2026-09-13';

export const WIKI_INDEX_SEO = {
  title: 'GTA6まとめWiki｜キャラクター・マップ・車両・警察・NPCの判明情報まとめ',
  description:
    'GTA6（2026年11月19日発売予定）の判明情報を体系化した非公式ファンWiki。キャラクター・マップ・建物・車両・警察システム・NPCを、公式発表・トレーラー・先行取材・考察をもとに整理しています。',
};

/** トップ（/gta6-wiki）の「GTA6 概要」ボックス。value の【】は表示時に WikiText が取り除く。 */
export const WIKI_INDEX_INFOBOX: WikiInfobox = {
  title: 'GTA6 概要',
  rows: [
    { label: 'タイトル', value: 'Grand Theft Auto VI' },
    { label: '発売日', value: '2026年11月19日（予定）【公式】' },
    { label: '対応機種', value: 'PS5／Xbox Series X|S【公式】' },
    { label: '開発', value: 'Rockstar Games【公式】' },
    { label: '舞台', value: 'レオニダ州（フロリダがモデル）【公式】' },
    { label: '主人公', value: 'ルシア＆ジェイソン（デュアル主人公）【公式】' },
  ],
};

export const WIKI_CATEGORIES: WikiCategory[] = [
  {
    slug: 'characters',
    title: 'キャラクター',
    shortTitle: 'キャラクター',
    seoTitle: 'GTA6 キャラクター一覧｜ルシア・ジェイソンと登場人物まとめ｜GTA6まとめWiki',
    description:
      'GTA6の主人公ルシア・カミノスとジェイソン・デュヴァル、公式バイオが公開された主要キャラクター、トレーラーや取材で判明した登場人物を整理。声優は未発表です。',
    order: 1,
    accent: '#ff2d95',
    summary: 'シリーズ初のデュアル主人公ルシアとジェイソン、公式バイオのある主要人物、トレーラー・取材で判明した登場人物。',
    related: ['map', 'locations'],
  },
  {
    slug: 'map',
    title: 'マップ',
    shortTitle: 'マップ',
    seoTitle: 'GTA6 マップ｜レオニダ州の6大地域・規模・地形まとめ｜GTA6まとめWiki',
    description:
      'GTA6の舞台レオニダ州の地理を地域単位で整理。公式確定の6大地域（バイスシティ・グラスリバーズ・レオニダキーズほか）、郡区分の扱い、マップの規模、地形・天候を解説。',
    order: 2,
    accent: '#2de2e6',
    summary: 'レオニダ州の公式6大地域、郡区分の扱い、マップ規模の公式・取材・考察の区別、地形と天候。',
    related: ['locations', 'vehicles'],
  },
  {
    slug: 'locations',
    title: '建物・ロケーション',
    shortTitle: '建物・ロケーション',
    seoTitle: 'GTA6 建物・ロケーション一覧｜バイスシティほか地域別スポットまとめ｜GTA6まとめWiki',
    description:
      'GTA6のトレーラー・公式素材で確認された建物・店舗・ランドマークを地域別に整理。名称が確認されたものと、噂・ファン呼称のものを区別しています。セーフハウスや拠点もまとめて掲載。',
    order: 3,
    accent: '#ff8a3d',
    summary: 'バイスシティ・キーズ・グラスリバーズなど地域別のスポット、店舗、ランドマーク、セーフハウス。',
    related: ['map', 'characters'],
  },
  {
    slug: 'vehicles',
    title: '車両',
    shortTitle: '車両',
    seoTitle: 'GTA6 車両一覧｜判明した車・バイク・ボート・航空機まとめ｜GTA6まとめWiki',
    description:
      'GTA6の公式素材で確認された車両を種類別に整理。乗用車・バイク・ボート・航空機・公共交通・緊急車両、カスタムショップの状況まで。現実の元ネタ車種はRockstar非公表のため考察として扱います。',
    order: 4,
    accent: '#fbbf24',
    summary: '車名が確定した乗用車・バイク・ボート・航空機、集計台数の幅、Rideout Customs の現状。',
    related: ['police', 'map'],
  },
  {
    slug: 'police',
    title: '警察システム',
    shortTitle: '警察システム',
    seoTitle: 'GTA6 警察システム｜6スター手配・目撃ベースの通報・変装での逃走まとめ｜GTA6まとめWiki',
    description:
      'GTA6の手配（Wanted）システムを整理。最大6スターへの回帰、目撃・アラームで初めて通報される仕組み、服装・顔・車・武器で追跡される識別ベースの設計、警察組織とGTA5からの変更点。',
    order: 5,
    accent: '#f87171',
    summary: '最大6スター、目撃・証拠ベースの通報、変装や乗り換えでの逃走、警察組織、GTA5からの変更点。',
    related: ['npc', 'vehicles'],
  },
  {
    slug: 'npc',
    title: 'NPC',
    shortTitle: 'NPC',
    seoTitle: 'GTA6 NPC｜60万超のアニメーション・武器への反応・盗み聞き・動物まとめ｜GTA6まとめWiki',
    description:
      'GTA6のNPC（歩行者）について、開発者インタビューと先行取材で判明したことを整理。60万種以上のアニメーション、武器や服装への段階的な反応、盗み聞き、会話プロンプト、動物、GTA5からの進化。',
    order: 6,
    accent: '#a3e635',
    summary: '60万種以上のアニメーション、武器・服装への反応、盗み聞き・会話プロンプト、動物、技術基盤。',
    related: ['police', 'characters'],
  },
  {
    slug: 'music',
    title: '楽曲・サウンドトラック',
    shortTitle: '楽曲',
    seoTitle: 'GTA6 楽曲・サウンドトラック｜トレーラー・Extended Lookの使用曲まとめ｜GTA6まとめWiki',
    description:
      'GTA6の公式トレーラーやExtended Lookで使われた楽曲の一覧。トレーラー1のTom Petty「Love Is a Long Road」など、公式映像で確認された曲をまとめています（ラジオ局・サントラは公式未発表）。',
    order: 7,
    accent: '#a78bfa',
    summary: '公式トレーラー／Extended Lookの使用曲まとめ。',
    related: ['characters', 'locations'],
  },
].sort((a, b) => a.order - b.order);

export const WIKI_CATEGORY_BY_SLUG: Record<string, WikiCategory> = Object.fromEntries(
  WIKI_CATEGORIES.map((c) => [c.slug, c]),
);

export const wikiPath = (slug?: string) => (slug ? `${WIKI_BASE}/${slug}` : WIKI_BASE);
