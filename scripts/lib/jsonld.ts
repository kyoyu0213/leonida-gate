// ============================================================================
//  JSON-LD（構造化データ）の組み立て。プリレンダ時に生HTMLの <head> へ焼く。
// ----------------------------------------------------------------------------
//  ▼ 方針
//   - 生成はビルド時のみ。クライアント（useSeo）からは一切挿入しない。
//     JSを実行しないクローラ（SNS・一部の検索クローラ）にも必ず届かせるため。
//   - URL・画像は必ず ORIGIN 基準の絶対URL（site.ts の toAbs を通す）。
//     相対パスを混ぜると別ドメイン扱い／画像未取得になる。
//   - 1ページ 1本の <script type="application/ld+json"> に @graph でまとめる。
//
//  ▼ 使う側
//     scripts/prerender-og.ts     … /news/<id>（NewsArticle + パンくず）
//     scripts/prerender-routes.ts … 記事・一覧・固定ページ
//     scripts/prerender-home.ts   … ホーム（WebSite + Organization）
// ============================================================================
import { ORIGIN, SITE_NAME, SITE_LOGO, toAbs } from './site';

export type Lang = 'ja' | 'en';

/** 発行元（＝運営者）。publisher / author の両方に使う。 */
export function organizationNode(): Record<string, unknown> {
  return {
    '@type': 'Organization',
    name: SITE_NAME,
    url: ORIGIN,
    logo: { '@type': 'ImageObject', url: toAbs(SITE_LOGO) },
  };
}

export interface ArticleNodeInput {
  /** 'Article' | 'NewsArticle' | 'BlogPosting' */
  type: 'Article' | 'NewsArticle' | 'BlogPosting';
  /** 記事URL（絶対URL）。canonical と一致させること。 */
  url: string;
  headline: string;
  description?: string;
  /** 画像パスまたは絶対URL。 */
  image?: string;
  /** ISO8601。無ければ出力しない（常設ガイドなど日付を持たないページ）。 */
  datePublished?: string;
  dateModified?: string;
  lang: Lang;
}

/** 記事ノード（Article / NewsArticle / BlogPosting）。 */
export function articleNode(input: ArticleNodeInput): Record<string, unknown> {
  const node: Record<string, unknown> = {
    '@type': input.type,
    inLanguage: input.lang,
    headline: input.headline,
    mainEntityOfPage: { '@type': 'WebPage', '@id': input.url },
    url: input.url,
    author: organizationNode(),
    publisher: organizationNode(),
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: ORIGIN },
  };
  if (input.description) node.description = input.description;
  if (input.image) node.image = [toAbs(input.image)];
  // 日付は「持っているページだけ」出す。常設ガイド（/fivem-gtarp 配下の解説記事）は
  // 公開日を保持していないため、嘘の日付を出さずに省略する。
  if (input.datePublished) node.datePublished = input.datePublished;
  if (input.dateModified ?? input.datePublished)
    node.dateModified = input.dateModified ?? input.datePublished;
  return node;
}

export interface CrumbInput {
  name: string;
  /** 絶対URL。末端（現在ページ）も自己URLを入れる。 */
  url: string;
}

/** パンくず（BreadcrumbList）。items は上位→下位の順。 */
export function breadcrumbNode(items: CrumbInput[]): Record<string, unknown> {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
}

export interface CollectionNodeInput {
  /** 一覧ページ自身のURL（絶対URL）。 */
  url: string;
  name: string;
  description?: string;
  lang: Lang;
  /** 一覧が並べている項目のURL（絶対URL）。順序はページの表示順。 */
  itemUrls: string[];
  /** 任意：項目名（itemUrls と同じ並び・同じ長さのときだけ使う）。 */
  itemNames?: string[];
}

/** 一覧・ハブページ（CollectionPage + 中身の ItemList）。 */
export function collectionNode(input: CollectionNodeInput): Record<string, unknown> {
  const named = input.itemNames && input.itemNames.length === input.itemUrls.length;
  const node: Record<string, unknown> = {
    '@type': 'CollectionPage',
    '@id': input.url,
    url: input.url,
    name: input.name,
    inLanguage: input.lang,
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: ORIGIN },
  };
  if (input.description) node.description = input.description;
  // 中身をビルド時に列挙できる一覧（体験記・news・ハブ）だけ ItemList を付ける。
  // 掲示板のように実行時にDBから引く一覧は空の ItemList を出さない（0件と主張しないため）。
  if (input.itemUrls.length) {
    node.mainEntity = {
      '@type': 'ItemList',
      numberOfItems: input.itemUrls.length,
      itemListElement: input.itemUrls.map((url, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url,
        ...(named ? { name: input.itemNames![i] } : {}),
      })),
    };
  }
  return node;
}

export interface WebPageNodeInput {
  /** 'WebPage' | 'AboutPage' | 'ContactPage' */
  type: 'WebPage' | 'AboutPage' | 'ContactPage';
  url: string;
  name: string;
  description?: string;
  lang: Lang;
}

/** 一般ページ（about / contact / terms / ツール）。 */
export function webPageNode(input: WebPageNodeInput): Record<string, unknown> {
  const node: Record<string, unknown> = {
    '@type': input.type,
    '@id': input.url,
    url: input.url,
    name: input.name,
    inLanguage: input.lang,
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: ORIGIN },
    publisher: organizationNode(),
  };
  if (input.description) node.description = input.description;
  return node;
}

/** サイト全体（ホームにだけ出す）。 */
export function webSiteNode(lang: Lang): Record<string, unknown> {
  const url = lang === 'en' ? `${ORIGIN}/en` : `${ORIGIN}/`;
  return {
    '@type': 'WebSite',
    '@id': `${ORIGIN}/#website`,
    url,
    name: SITE_NAME,
    inLanguage: lang,
    publisher: organizationNode(),
  };
  // NOTE: SearchAction（サイトリンク検索ボックス）は出さない。
  //   検索結果ページ /search は robots.txt で Disallow にしているため、
  //   クロールできないURLを target に指定することになり整合しない。
}

/** ノード群を1本の <script type="application/ld+json"> に包む。
 *  "<" をエスケープして、本文中の文字列が </script> を破壊するのを防ぐ。 */
export function ldScript(nodes: Record<string, unknown>[]): string {
  const graph = { '@context': 'https://schema.org', '@graph': nodes };
  return `<script type="application/ld+json">${JSON.stringify(graph).replace(/</g, '\\u003c')}</script>`;
}

/** </head> の直前に JSON-LD を挿入する。マーカーが無ければ throw（想定外テンプレートの検知）。 */
export function injectLd(html: string, nodes: Record<string, unknown>[], ctx = 'jsonld'): string {
  if (!html.includes('</head>')) {
    throw new Error(`[${ctx}] </head> が見つからない（テンプレート想定外）`);
  }
  return html.replace('</head>', `    ${ldScript(nodes)}\n  </head>`);
}

/** パンくずの「ホーム」項目（言語別）。 */
export function homeCrumb(lang: Lang): CrumbInput {
  return { name: lang === 'en' ? 'Home' : 'ホーム', url: lang === 'en' ? `${ORIGIN}/en` : `${ORIGIN}/` };
}
