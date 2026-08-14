// ============================================================================
//  静的ルートのプリレンダ（SEO・本文の生HTML化）。
//  vite build → prerender-og の後、SSRバンドル(dist/server/entry-server.js)を使って
//  fivem-gtarp 配下の静的ページを本文ごと生HTML化し、<head> も差し替える。
//
//  出力: dist/public/<route>/index.html （Vercel が <route> で配信。catch-all より優先）
//  実行: tsx scripts/prerender-routes.ts （build スクリプトから呼ぶ）
//
//  ※ /news/<id>（prerender-og）や CSR ルート（掲示板・servers 等）には触れない。
//     生成は各ルートのサブディレクトリに限定し、ベースの index.html は変更しない。
// ============================================================================
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { injectSsrBody, injectSsrSeed } from './lib/inject-ssr-body';
import { stripAdsScript } from './lib/ads-html';
import { isAdFreePath } from '../client/src/lib/ads';
import { ORIGIN, DEFAULT_IMAGE, toAbs, stripSiteName } from './lib/site';
import {
  articleNode,
  breadcrumbNode,
  collectionNode,
  webPageNode,
  homeCrumb,
  injectLd,
  type CrumbInput,
  type Lang,
} from './lib/jsonld';
import { fieldNotes, FIELD_NOTE_CATEGORY_CONFIG } from '../client/src/data/fieldNotes';
import { indexableNewsArticles } from '../client/src/data/news';
import { buildBoardSeed } from './lib/board-seed.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const TEMPLATE = readFileSync(resolve(ROOT, 'dist/public/index.html'), 'utf8');

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 置換パターンが1つも見つからなかったキーを集約し、ビルド最後に WARN する。
// （テンプレートの <head> フォーマット変更で silent に既定値が残る事故を検知するため）
const missedReplacements = new Set<string>();

/** re がマッチしなければ label を記録して素通しする（silent no-op を検知可能にする）。 */
function replaceTracked(html: string, re: RegExp, replacement: string, label: string): string {
  if (!re.test(html)) {
    missedReplacements.add(label);
    return html;
  }
  return html.replace(re, replacement);
}

// <meta name|property="key" content="..."> の content を置換。
// 属性間の空白は \s+ とし、prettier が長い content を折り返した複数行<meta>
// （<meta 改行 name="..." 改行 content="...">）にもマッチさせる。key で確実にアンカーし、
// content="[^"]*" の非貪欲な文字クラスで隣接する他の<meta>は巻き込まない。
function setMeta(html: string, key: string, content: string): string {
  const k = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(<meta\\s+(?:name|property)="${k}"\\s+content=")[^"]*(")`);
  return replaceTracked(html, re, `$1${esc(content)}$2`, `meta[${key}]`);
}

interface RenderResult {
  html: string;
  seo: {
    title: string;
    description?: string;
    image?: string;
    type?: string;
    url?: string;
    localized?: boolean;
  } | null;
}
interface ServerEntry {
  render: (url: string) => RenderResult | null;
  ROUTE_PATHS: string[];
  setSsrSeed: (seed: unknown) => void;
}

const mod = (await import(
  pathToFileURL(resolve(ROOT, 'dist/server/entry-server.js')).href
)) as unknown as ServerEntry;

// 掲示板・募集板の投稿をビルド時に取得して SSR へ渡す。
// 全ページぶんをキー付きで1回だけセットする（ルートごとのセット/クリアはしない）ため、
// 下の render ループで前のルートのデータを引きずることが構造的に起きない。
// 取得に失敗しても throw しない設計なので、Supabase 断でもビルドは止まらない。
const { seed: boardSeed, total: seedTotal, warnings: seedWarnings } = await buildBoardSeed();
seedWarnings.forEach((w) => console.warn(w));
mod.setSsrSeed(boardSeed);
console.log(`[board-seed] 投稿 ${seedTotal} 件をプリレンダへ注入`);

// ----------------------------------------------------------------------------
//  seed のクライアント引き継ぎ（ルート単位のスライス）
// ----------------------------------------------------------------------------
//  createRoot は生HTMLの本文を捨てて再マウントするため、埋め込みが無いと
//  ブラウザ側の初期stateは空配列から始まる。Supabase が不達だとそのまま
//  「投稿0件の板」で確定してしまうので、各ページに「そのページが実際に
//  描画している行」だけを JSON で埋め、同じ初期stateから描き直せるようにする。
//
//  全ページぶんを毎ページ配ると /board/gta6 に他5板ぶんが乗って無駄なので、
//  ルートごとに必要な分だけ切り出す。切り出す件数は各ページの描画件数に合わせる
//  （＝生HTMLに出ているものと一致させる。クローラーにだけ見えるデータを作らない）。
//
//  連絡先（contact / contact_kind / connect_info / discord_url）と author_name は
//  そもそも buildBoardSeed のSELECT列に無く、この型にも存在しない。埋め込み先が
//  増えても漏れようがない設計は維持する。
// ----------------------------------------------------------------------------

/** ハブのプレビュー件数（BoardIndex.PREVIEW_PER_BOARD / RecruitIndex.PREVIEW_PER_CAT と対）。 */
const HUB_PREVIEW = 3;

type Seed = typeof boardSeed;
const EMPTY_SEED: Seed = { threads: {}, friends: [], crews: [], servers: [] };

/** route（日本語パス）に対して、そのページが描画している分だけの seed を返す。
 *  seed を使わないルートは null（＝タグを埋めない）。 */
function seedForRoute(jaPath: string): Seed | null {
  const board = /^\/board\/(?!friends$|crews$)(.+)$/.exec(jaPath)?.[1];
  if (board) {
    const rows = boardSeed.threads[board];
    return rows?.length ? { ...EMPTY_SEED, threads: { [board]: rows } } : null;
  }
  if (jaPath === '/board') {
    // 全板のカード＋各板の最新3件プレビュー。
    const threads: Seed['threads'] = {};
    for (const [slug, rows] of Object.entries(boardSeed.threads)) {
      if (rows.length) threads[slug] = rows.slice(0, HUB_PREVIEW);
    }
    return Object.keys(threads).length ? { ...EMPTY_SEED, threads } : null;
  }
  if (jaPath === '/board/friends') {
    return boardSeed.friends.length ? { ...EMPTY_SEED, friends: boardSeed.friends } : null;
  }
  if (jaPath === '/board/crews') {
    return boardSeed.crews.length ? { ...EMPTY_SEED, crews: boardSeed.crews } : null;
  }
  if (jaPath === '/servers') {
    return boardSeed.servers.length ? { ...EMPTY_SEED, servers: boardSeed.servers } : null;
  }
  if (jaPath === '/recruit') {
    // 3カテゴリの最新3件ずつをプレビュー。
    const s = {
      ...EMPTY_SEED,
      friends: boardSeed.friends.slice(0, HUB_PREVIEW),
      crews: boardSeed.crews.slice(0, HUB_PREVIEW),
      servers: boardSeed.servers.slice(0, HUB_PREVIEW),
    };
    return s.friends.length || s.crews.length || s.servers.length ? s : null;
  }
  return null;
}

let seededPages = 0;

// ============================================================================
//  JSON-LD（構造化データ）
// ----------------------------------------------------------------------------
//  プリレンダ時に生HTMLへ焼く（クライアントからは挿入しない）。ルートの種類で出し分ける：
//    記事（体験記）        … BlogPosting + BreadcrumbList
//    一覧（体験記カテゴリ・news・ハブ） … CollectionPage(+ItemList) + BreadcrumbList
//    解説記事（/fivem-gtarp 配下） … Article + BreadcrumbList
//    固定ページ・ツール・掲示板   … WebPage/AboutPage/ContactPage/CollectionPage + BreadcrumbList
//  URL・画像はすべて site.ts の ORIGIN 基準の絶対URL（相対パスを混ぜない）。
// ============================================================================
const FIELD_NOTE_DETAIL_RE = /^\/fivem-gtarp\/field-notes\/(dev-diary|visit-note)\/([a-z0-9-]+)$/;
const FIELD_NOTE_LIST_RE = /^\/fivem-gtarp\/field-notes\/(dev-diary|visit-note)$/;

/** /news の ItemList に載せる件数（一覧の先頭から。全件だとLDが肥大するため）。 */
const NEWS_ITEMLIST_MAX = 30;

/** ハブ（/fivem-gtarp）が束ねる下位ページのURL一覧。ROUTE_PATHS から導出する（別表を作らない）。
 *  体験記の個別記事は各カテゴリ一覧（/field-notes/<cat>）の ItemList 側で列挙するため除く。 */
function hubItemUrls(routePaths: string[], prefix: string): string[] {
  return routePaths
    .filter(
      (p) =>
        p.startsWith('/fivem-gtarp/') && !p.startsWith('/en/') && !FIELD_NOTE_DETAIL_RE.test(p),
    )
    .map((p) => `${ORIGIN}${prefix}${p}`);
}

interface LdContext {
  route: string;
  jaPath: string;
  lang: Lang;
  /** 言語プレフィックス（'' | '/en'）。 */
  prefix: string;
  url: string;
  title: string;
  desc: string;
  image: string;
  routePaths: string[];
}

function fivemHubCrumb(prefix: string): CrumbInput {
  return { name: 'FiveM / GTARP', url: `${ORIGIN}${prefix}/fivem-gtarp` };
}

function buildLdNodes(ctx: LdContext): Record<string, unknown>[] {
  const { jaPath, lang, prefix, url, desc, image } = ctx;
  const isEn = lang === 'en';
  const name = stripSiteName(ctx.title);
  const home = homeCrumb(lang);
  const self: CrumbInput = { name, url };

  // 体験記の記事
  const detail = FIELD_NOTE_DETAIL_RE.exec(jaPath);
  if (detail) {
    const [, category, slug] = detail;
    const note = fieldNotes.find((n) => n.slug === slug && n.category === category);
    const cat = FIELD_NOTE_CATEGORY_CONFIG[category as keyof typeof FIELD_NOTE_CATEGORY_CONFIG];
    const published = note ? `${note.date}T09:00:00+09:00` : undefined;
    return [
      articleNode({
        type: 'BlogPosting',
        url,
        headline: note ? (isEn ? note.titleEn : note.title) : name,
        description: desc,
        image: note?.image ?? image,
        datePublished: published,
        lang,
      }),
      breadcrumbNode([
        home,
        fivemHubCrumb(prefix),
        { name: isEn ? cat.en : cat.ja, url: `${ORIGIN}${prefix}/fivem-gtarp/field-notes/${category}` },
        self,
      ]),
    ];
  }

  // 体験記のカテゴリ別一覧
  const list = FIELD_NOTE_LIST_RE.exec(jaPath);
  if (list) {
    const category = list[1];
    const items = fieldNotes
      .filter((n) => n.category === category)
      .sort((a, b) => b.date.localeCompare(a.date));
    return [
      collectionNode({
        url,
        name,
        description: desc,
        lang,
        itemUrls: items.map((n) => `${ORIGIN}${prefix}/fivem-gtarp/field-notes/${n.category}/${n.slug}`),
        itemNames: items.map((n) => (isEn ? n.titleEn : n.title)),
      }),
      breadcrumbNode([home, fivemHubCrumb(prefix), self]),
    ];
  }

  // news 一覧（日本語のみ。英語版は作っていない）
  if (jaPath === '/news') {
    const items = indexableNewsArticles.slice(0, NEWS_ITEMLIST_MAX);
    return [
      collectionNode({
        url,
        name,
        description: desc,
        lang,
        itemUrls: items.map((a) => `${ORIGIN}${prefix}/news/${a.id}`),
        itemNames: items.map((a) => (isEn && a.titleEn ? a.titleEn : a.title)),
      }),
      breadcrumbNode([home, self]),
    ];
  }

  // FiveM / GTARP ハブ
  if (jaPath === '/fivem-gtarp') {
    return [
      collectionNode({
        url,
        name,
        description: desc,
        lang,
        itemUrls: hubItemUrls(ctx.routePaths, prefix),
      }),
      breadcrumbNode([home, self]),
    ];
  }

  // ツール（記事ではないので Article にしない）
  if (jaPath.startsWith('/fivem-gtarp/tools')) {
    const crumbs =
      jaPath === '/fivem-gtarp/tools'
        ? [home, fivemHubCrumb(prefix), self]
        : [
            home,
            fivemHubCrumb(prefix),
            { name: isEn ? 'Tools' : 'ツール', url: `${ORIGIN}${prefix}/fivem-gtarp/tools` },
            self,
          ];
    return [
      webPageNode({ type: 'WebPage', url, name, description: desc, lang }),
      breadcrumbNode(crumbs),
    ];
  }

  // /fivem-gtarp 配下の解説記事
  if (jaPath.startsWith('/fivem-gtarp/')) {
    return [
      // NOTE: datePublished は出さない。これらは公開日を保持していない常設ガイドで、
      //       ビルド時に確かな日付が取れないため（推測日を焼くより省略する）。
      articleNode({ type: 'Article', url, headline: name, description: desc, image, lang }),
      breadcrumbNode([home, fivemHubCrumb(prefix), self]),
    ];
  }

  // 掲示板・サーバー募集（中身は実行時にDBから引くため ItemList は付けない）
  if (jaPath === '/servers' || jaPath === '/board' || jaPath.startsWith('/board/')) {
    const crumbs =
      jaPath === '/board' || jaPath === '/servers'
        ? [home, self]
        : [home, { name: isEn ? 'Boards' : '掲示板', url: `${ORIGIN}${prefix}/board` }, self];
    return [
      collectionNode({ url, name, description: desc, lang, itemUrls: [] }),
      breadcrumbNode(crumbs),
    ];
  }

  // 固定ページ（/about・/contact・/terms）
  const pageType: 'AboutPage' | 'ContactPage' | 'WebPage' =
    jaPath === '/about' ? 'AboutPage' : jaPath === '/contact' ? 'ContactPage' : 'WebPage';
  return [
    webPageNode({ type: pageType, url, name, description: desc, lang }),
    breadcrumbNode([home, self]),
  ];
}

let count = 0;
let adFree = 0;
const skipped: string[] = [];

for (const route of mod.ROUTE_PATHS) {
  const out = mod.render(route);
  if (!out) {
    skipped.push(route);
    continue;
  }
  const { html: body, seo } = out;
  const title = seo?.title || 'GTA6 FEED';
  // meta description は 160字で切るが、JSON-LD には切らない説明を渡す
  // （語の途中で切れた説明が構造化データに残るのを避ける）。
  const descFull = (seo?.description || '').replace(/\s+/g, ' ').trim();
  const desc = descFull.slice(0, 160);
  const url = `${ORIGIN}${route}`;
  const image = toAbs(seo?.image || DEFAULT_IMAGE);

  // 言語（/en 配下＝英語）。<html lang> と JSON-LD の inLanguage の両方で使う。
  const isEn = route.startsWith('/en/') || route === '/en';
  const jaPath = route === '/en' ? '/' : isEn ? route.slice(3) : route;

  let html = TEMPLATE;
  // <html lang>：テンプレート（client/index.html）は ja 固定なので、英語版は en へ差し替える。
  // これを入れるまで /en 配下の全ページが lang="ja" のまま配信され、
  // hreflang="en"・JSON-LD の inLanguage:"en" と三者で矛盾していた。
  html = replaceTracked(html, /(<html\s+lang=")[^"]*(")/, `$1${isEn ? 'en' : 'ja'}$2`, 'html[lang]');
  // <head>：title / canonical / 各メタを当該ルートの値へ差し替え
  html = replaceTracked(html, /<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`, 'title');
  html = replaceTracked(html, /(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`, 'canonical');
  html = setMeta(html, 'description', desc);
  html = setMeta(html, 'og:type', seo?.type || 'website');
  html = setMeta(html, 'og:url', url);
  html = setMeta(html, 'og:title', title);
  html = setMeta(html, 'og:description', desc);
  html = setMeta(html, 'og:image', image);
  html = setMeta(html, 'twitter:title', title);
  html = setMeta(html, 'twitter:description', desc);
  html = setMeta(html, 'twitter:image', image);

  // hreflang（日英の対があるページのみ）。日URL/英URL/x-default(=日) を相互に張る。
  if (seo?.localized) {
    const jaPath = route.startsWith('/en/') ? route.slice(3) : route;
    const jaUrl = `${ORIGIN}${jaPath}`;
    const enUrl = `${ORIGIN}/en${jaPath}`;
    const alt = [
      `<link rel="alternate" hreflang="ja" href="${jaUrl}" />`,
      `<link rel="alternate" hreflang="en" href="${enUrl}" />`,
      `<link rel="alternate" hreflang="x-default" href="${jaUrl}" />`,
    ].join('\n    ');
    html = html.replace('</head>', `    ${alt}\n  </head>`);
  }

  // JSON-LD（構造化データ）を <head> へ焼く。ルート種別で出し分ける（buildLdNodes）。
  // isEn / jaPath は <html lang> の差し替えで先に算出済み。
  html = injectLd(
    html,
    buildLdNodes({
      route,
      jaPath,
      lang: isEn ? 'en' : 'ja',
      prefix: isEn ? '/en' : '',
      url,
      title,
      desc: descFull,
      image,
      routePaths: mod.ROUTE_PATHS,
    }),
    'prerender-routes',
  );

  // 広告を出さないページ（UGC・ツール・固定ページ）からは AdSense のローダーを落とす。
  // 判定は client/src/lib/ads.ts の AD_FREE_PREFIXES が単一の正。
  if (isAdFreePath(jaPath)) {
    html = stripAdsScript(html, 'prerender-routes');
    adFree++;
  }

  // #root に本文を焼き込む（クライアントの createRoot がマウント時に置き換える）。
  html = injectSsrBody(html, body, 'prerender-routes');

  // 板・募集板は、置き換え後のクライアントが同じ初期stateから描き直せるよう seed も埋める。
  const routeSeed = seedForRoute(jaPath);
  if (routeSeed) {
    html = injectSsrSeed(html, routeSeed, 'prerender-routes');
    seededPages++;
  }

  const dir = resolve(ROOT, `dist/public${route}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), html, 'utf8');
  count++;
}

console.log(
  `[prerender-routes] ${count} ルートを生成: dist/public/<route>/index.html` +
    `（うち広告なし ${adFree} ルート / seed埋め込み ${seededPages} ルート）`,
);
if (skipped.length) console.log(`[prerender-routes] スキップ: ${skipped.join(', ')}`);
if (missedReplacements.size) {
  console.warn(
    `[prerender-routes] WARN: <head> 置換が未マッチ: ${[...missedReplacements].join(', ')} ` +
      `— テンプレート(dist/public/index.html)の<head>フォーマット変更の可能性。該当メタが既定値のまま出力されています。`,
  );
}
