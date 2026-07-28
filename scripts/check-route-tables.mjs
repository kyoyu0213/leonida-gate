// ============================================================================
//  ルート3表の同期チェック（prebuild で実行）。
// ----------------------------------------------------------------------------
//  「sitemap に登録されているのにプリレンダされず、空シェル（#root 空・canonical が
//   トップ吸われ）で配信されるURL」を検出してビルドを止める。
//
//  /contact・/terms が日英4URLとも白紙で配信されていた事故の再発防止。
//  原因は下の3つの表が別ファイルに分散し、互いに同期していなかったこと：
//
//    1. STATIC_ROUTES          scripts/lib/static-routes.mjs   … sitemap に載せる
//    2. LOCALIZED_STATIC_PATHS client/src/lib/routes.ts        … 日英の対がある
//    3. LOCALIZED_ROUTES /     client/src/entry-server.tsx     … 実際にプリレンダする
//       JA_ONLY_ROUTES
//
//  2 と 3 は TypeScript だが、entry-server.tsx は React ページ（CSS import 込み）を
//  取り込むため素の node からは import できない。よってテキスト解析で読む。
//  表が見つからない／0件になった場合は「解析失敗」として fail する（黙って
//  チェックが素通りするのを防ぐ）。
//
//  実行: node scripts/check-route-tables.mjs
// ============================================================================
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { STATIC_ROUTES, isLocalizedStaticPath } from './lib/static-routes.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// --- 表以外の経路でプリレンダされるルート ------------------------------------
// '/' は prerender-home.ts が dist/public/index.html と /en/index.html に焼く
// （ROUTE_PATHS に入れると catch-all シェル兼テンプレートを上書きしてしまうため、
//   意図的に表から外してある）。日本語版・英語版の両方がここで生成されるので、
//   検査A（日本語版）・検査B（英語版）の両方でスキップ対象になる。
const PRERENDERED_OUTSIDE_TABLES = new Set(['/']);

// --- 既知の差分（明示的に許容するもの） --------------------------------------
// ここに入れたパスは「sitemap に載るがプリレンダされない」状態を承知で許容する。
// 放置ではなく、判断が保留中であることの記録として使う。理由を必ず書くこと。
//
// ※ /news はここに入れていた（news方針の保留中）が、記事18本の一時非表示で方針が
//   確定したため JA_ONLY_ROUTES へ追加して解消済み。現在は空。
const KNOWN_GAPS = new Map([]);

const errors = [];
const warnings = [];

/** src から `名前 ... = [ ... ]` / `{ ... }` のブロック本文を切り出す。見つからなければ null。 */
function sliceBlock(src, startMarker, closeChar) {
  const i = src.indexOf(startMarker);
  if (i < 0) return null;
  const from = i + startMarker.length;
  const end = src.indexOf(`\n${closeChar}`, from);
  if (end < 0) return null;
  return src.slice(from, end);
}

// --- 2. LOCALIZED_STATIC_PATHS（client/src/lib/routes.ts） --------------------
const routesSrc = readFileSync(resolve(ROOT, 'client/src/lib/routes.ts'), 'utf8');
const localizedBlock = sliceBlock(routesSrc, 'export const LOCALIZED_STATIC_PATHS: string[] = [', ']');
const LOCALIZED_STATIC_PATHS = localizedBlock
  ? [...localizedBlock.matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1])
  : [];
if (!LOCALIZED_STATIC_PATHS.length) {
  errors.push(
    'routes.ts の LOCALIZED_STATIC_PATHS を解析できなかった（宣言の書式が変わった可能性）。' +
      'このチェックが無効化されるため、check-route-tables.mjs 側の解析を直すこと。',
  );
}

// --- 3. LOCALIZED_ROUTES / JA_ONLY_ROUTES（client/src/entry-server.tsx） ------
const entrySrc = readFileSync(resolve(ROOT, 'client/src/entry-server.tsx'), 'utf8');

function parseRouteMap(name) {
  const block = sliceBlock(entrySrc, `const ${name}: Record<string, ComponentType> = {`, '}');
  if (block === null) return null;
  // キーだけを拾う（'/path': Component,）。値側にクォートは出てこない。
  return [...block.matchAll(/^\s*['"]([^'"]+)['"]\s*:/gm)].map((m) => m[1]);
}

const LOCALIZED_ROUTES = parseRouteMap('LOCALIZED_ROUTES');
const JA_ONLY_ROUTES = parseRouteMap('JA_ONLY_ROUTES');

for (const [name, val] of [
  ['LOCALIZED_ROUTES', LOCALIZED_ROUTES],
  ['JA_ONLY_ROUTES', JA_ONLY_ROUTES],
]) {
  if (!val || !val.length) {
    errors.push(
      `entry-server.tsx の ${name} を解析できなかった（宣言の書式が変わった可能性）。` +
        'このチェックが無効化されるため、check-route-tables.mjs 側の解析を直すこと。',
    );
  }
}

const localizedSet = new Set(LOCALIZED_ROUTES ?? []);
const prerenderedJa = new Set([...(LOCALIZED_ROUTES ?? []), ...(JA_ONLY_ROUTES ?? [])]);

// ============================================================================
//  検査A（fail）：sitemap に載るのに、どこでもプリレンダされないルート
//  → 本番で空シェル配信になる。今回の /contact・/terms・/news がこれ。
// ============================================================================
const gaps = [];
for (const { path } of STATIC_ROUTES) {
  if (PRERENDERED_OUTSIDE_TABLES.has(path)) continue;
  if (prerenderedJa.has(path)) continue;
  if (KNOWN_GAPS.has(path)) {
    warnings.push(`[既知の差分] ${path} — ${KNOWN_GAPS.get(path)}`);
    continue;
  }
  gaps.push(path);
}
if (gaps.length) {
  errors.push(
    `sitemap に登録されているのにプリレンダされないルート: ${gaps.join(', ')}\n` +
      '    → 本番では #root が空のシェルで配信され、canonical がトップへ吸われます。\n' +
      '    → entry-server.tsx の LOCALIZED_ROUTES（日英の対がある）または JA_ONLY_ROUTES に追加するか、\n' +
      '       scripts/lib/static-routes.mjs の STATIC_ROUTES から外してください。',
  );
}

// ============================================================================
//  検査B（fail）：sitemap が /en/ 版を出すのに、英語版がプリレンダされないルート
//  prerender-routes は LOCALIZED_ROUTES のキーにだけ /en/ を生成する。
// ============================================================================
const enGaps = [];
for (const { path } of STATIC_ROUTES) {
  if (!isLocalizedStaticPath(path)) continue;
  // '/' の英語版（/en）は prerender-home.ts が本文ごと焼くため LOCALIZED_ROUTES に無くてよい。
  if (PRERENDERED_OUTSIDE_TABLES.has(path)) continue;
  if (localizedSet.has(path)) continue;
  if (KNOWN_GAPS.has(path)) continue;
  enGaps.push(path);
}
if (enGaps.length) {
  errors.push(
    `sitemap が /en 版を出すのに英語版がプリレンダされないルート: ${enGaps.join(', ')}\n` +
      '    → /en<path> が空シェルになります。entry-server.tsx の LOCALIZED_ROUTES に追加してください。',
  );
}

// ============================================================================
//  検査C（warn）：LOCALIZED_STATIC_PATHS（routes.ts）と LOCALIZED_ROUTES の食い違い
//  routes.ts は hreflang・言語トグル・誘導バナーの出し分けに使われるため、
//  実際にプリレンダされる英語版の集合とズレると「英語版がある」と誤って案内する。
// ============================================================================
const onlyInRoutesTs = LOCALIZED_STATIC_PATHS.filter((p) => !localizedSet.has(p));
const onlyInEntry = [...localizedSet].filter((p) => !LOCALIZED_STATIC_PATHS.includes(p));
if (onlyInRoutesTs.length) {
  warnings.push(
    `routes.ts の LOCALIZED_STATIC_PATHS にあるが entry-server.tsx の LOCALIZED_ROUTES に無い: ${onlyInRoutesTs.join(', ')}` +
      ' — 言語トグル/hreflang が存在しない英語版を指す可能性。',
  );
}
if (onlyInEntry.length) {
  warnings.push(
    `entry-server.tsx の LOCALIZED_ROUTES にあるが routes.ts の LOCALIZED_STATIC_PATHS に無い: ${onlyInEntry.join(', ')}` +
      ' — 英語版を生成しているのに言語トグルが出ない可能性。',
  );
}

// ============================================================================
//  検査D（warn）：プリレンダされているのに sitemap に載っていないルート
// ============================================================================
const staticPaths = new Set(STATIC_ROUTES.map((r) => r.path));
const notInSitemap = [...prerenderedJa].filter((p) => !staticPaths.has(p));
if (notInSitemap.length) {
  warnings.push(
    `プリレンダされているが sitemap に無いルート: ${notInSitemap.join(', ')}` +
      ' — 意図的なら無視して問題ありません。',
  );
}

// ============================================================================
//  検査E（fail）：一時的に非表示にした news 記事の3点整合
//    1. client/src/data/news.ts の HIDDEN_NEWS_IDS   … 表示・プリレンダから外す
//    2. scripts/generate-sitemap.mjs                  … sitemap から除外（1 を自動で読む）
//    3. vercel.json の 302 リダイレクト                … URL を /fivem-gtarp へ逃がす
//  3つがズレると「sitemap には載るのに 302 される」「一覧から消えたのに URL は生きていて
//  空シェルが返る」といった不整合になる。復帰時（発売後）に消し忘れる事故も防ぐ。
// ============================================================================
const newsSrc = readFileSync(resolve(ROOT, 'client/src/data/news.ts'), 'utf8');
const hiddenBlock = newsSrc.match(/export const HIDDEN_NEWS_IDS:\s*readonly number\[\]\s*=\s*\[([\s\S]*?)\]/);
if (!hiddenBlock) {
  errors.push(
    'news.ts の HIDDEN_NEWS_IDS を解析できなかった（宣言の書式が変わった可能性）。' +
      'check-route-tables.mjs と generate-sitemap.mjs の両方の解析を直すこと。',
  );
} else {
  const hiddenIds = [...hiddenBlock[1].matchAll(/\d+/g)].map((m) => m[0]).sort((a, b) => a - b);

  const vercel = JSON.parse(readFileSync(resolve(ROOT, 'vercel.json'), 'utf8'));
  const redirectIds = { ja: [], en: [] };
  for (const r of vercel.redirects ?? []) {
    const m = String(r.source).match(/^(\/en)?\/news\/:id\(([^)]*)\)$/);
    if (!m) continue;
    const ids = m[2].split('|').map((s) => s.trim()).sort((a, b) => a - b);
    redirectIds[m[1] ? 'en' : 'ja'] = { ids, status: r.statusCode };
  }

  for (const lang of ['ja', 'en']) {
    const entry = redirectIds[lang];
    if (!entry) {
      if (hiddenIds.length) {
        errors.push(
          `vercel.json に ${lang === 'en' ? '/en' : ''}/news/:id(...) の一時非表示リダイレクトが無い。` +
            `非表示 ${hiddenIds.length} 件の URL が空シェルのまま残る。`,
        );
      }
      continue;
    }
    const missing = hiddenIds.filter((id) => !entry.ids.includes(id));
    const extra = entry.ids.filter((id) => !hiddenIds.includes(id));
    if (missing.length) {
      errors.push(
        `非表示なのに vercel.json の ${lang} リダイレクトに無い記事ID: ${missing.join(', ')}` +
          ' → 一覧からは消えるが URL が生き残り、空シェルが返る。',
      );
    }
    if (extra.length) {
      errors.push(
        `vercel.json の ${lang} リダイレクトにあるが HIDDEN_NEWS_IDS に無い記事ID: ${extra.join(', ')}` +
          ' → 公開中の記事が意図せずリダイレクトされる。',
      );
    }
    if (hiddenIds.length && entry.status !== 302) {
      warnings.push(
        `${lang} の一時非表示リダイレクトが ${entry.status} になっている。` +
          '発売後に戻す前提なので 302（一時）が正しい。',
      );
    }
  }

  // 301統合済み・noindex 済みの記事を二重に非表示リストへ入れると、
  // 301 → 302 のリダイレクトチェーンや意図の重複になるため弾く。
  for (const [id, why] of [
    ['17', 'id19 へ 301 統合済み（vercel.json）。302 と重なるとリダイレクトチェーンになる'],
    ['29', 'noindex,follow 済み（prerender-og の NOINDEX_IDS）'],
  ]) {
    if (hiddenIds.includes(id)) {
      errors.push(`id${id} は HIDDEN_NEWS_IDS に入れないこと — ${why}。`);
    }
  }

  if (hiddenIds.length) {
    warnings.push(
      `[一時非表示] news 記事 ${hiddenIds.length} 件を配信から外している（id ${hiddenIds.join(', ')}）。` +
        'GTA6発売後に戻す手順は client/src/data/news.ts の HIDDEN_NEWS_IDS のコメントを参照。',
    );
  }
}

// --- 結果 --------------------------------------------------------------------
for (const w of warnings) console.warn(`[check-routes] WARN: ${w}`);

if (errors.length) {
  console.error('\n[check-routes] ルート表の同期エラー:');
  for (const e of errors) console.error(`  ✗ ${e}`);
  console.error('');
  process.exit(1);
}

console.log(
  `[check-routes] OK — sitemap固定ページ ${STATIC_ROUTES.length}件 / ` +
    `プリレンダ ${prerenderedJa.size}件（うち日英対 ${localizedSet.size}件）、` +
    `未解決の差分 ${warnings.length}件（WARN）。`,
);
