// ============================================================================
//  プリレンダHTMLから AdSense のローダー <script> を落とす。
//  どのページで落とすかの判定は client/src/lib/ads.ts（単一の正）を参照する。
// ============================================================================

/** client/index.html の `<!-- Google AdSense -->` + <script ... adsbygoogle.js ...> を丸ごと拾う。 */
const AD_SCRIPT_RE = /\n?[ \t]*(?:<!-- Google AdSense -->\s*)?<script\b[^>]*adsbygoogle\.js[\s\S]*?<\/script>/;

/** 広告ローダーを除去した HTML を返す。見つからなければ throw（テンプレート変更の検知）。 */
export function stripAdsScript(html: string, ctx: string): string {
  if (!AD_SCRIPT_RE.test(html)) {
    throw new Error(
      `[${ctx}] adsbygoogle のローダー <script> が見つからない（client/index.html の書式変更の可能性）。` +
        '広告を出さないページから広告コードを落とせていません。',
    );
  }
  const out = html.replace(AD_SCRIPT_RE, '');
  if (/adsbygoogle/.test(out)) {
    throw new Error(`[${ctx}] adsbygoogle の記述が残っている（除去の正規表現を見直すこと）`);
  }
  return out;
}
