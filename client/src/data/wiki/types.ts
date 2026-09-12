// ============================================================================
//  GTA6まとめWiki の本文データの型。
//
//  確度ラベルは本文テキストの中に【公式】【取材】【証言】【考察】の形でそのまま書く。
//  表示側（components/wiki/WikiParts.tsx の WikiText）は現在ラベルを表示せず、取り除いて描く（㉛）。
//  データには残してあるので、バッジを復活させるときは WikiText 側だけを戻せばよい。
//  【公式/考察】のような併記や【公式（Rob Nelson発言）】のような補足付きも書ける
//  （判定は data/wiki/labels.ts の parseLabelToken）。
// ============================================================================

/** 確度ラベル。公式 / 取材 / 証言 / 考察。 */
export type WikiLabel = 'official' | 'preview' | 'testimony' | 'analysis';

export interface WikiItem {
  /** 項目名（人名・地域名など）。あれば太字で先頭に出す。 */
  term?: string;
  /** 本文。【公式】等のラベルを文中に含めてよい。 */
  text: string;
}

export interface WikiTable {
  head: string[];
  rows: string[][];
}

export interface WikiSection {
  heading: string;
  /** 見出し直下のリード（総評・前提など）。 */
  lead?: string;
  items?: WikiItem[];
  table?: WikiTable;
  /** 節末の補足（※…）。 */
  note?: string;
}

/** 本文右上の要点ボックス（ゲームWikiのインフォボックス）。画像は入れない。 */
export interface WikiInfobox {
  /** 省略時はカテゴリ名。 */
  title?: string;
  /** value は【公式】等を含んでよい（WikiText で描画）。 */
  rows: { label: string; value: string }[];
}

export interface WikiPage {
  slug: string;
  /** 最終更新日（YYYY-MM-DD）。 */
  updated: string;
  /** ページ冒頭の位置づけ（例：地域単位の概観。建物は別ページ）。 */
  intro?: string;
  infobox?: WikiInfobox;
  sections: WikiSection[];
  /** 出典（媒体名）。 */
  sources: string[];
}
