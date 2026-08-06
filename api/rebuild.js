// ============================================================================
//  定期再ビルドのトリガ（Vercel Cron から1日1回叩かれる）。
//
//  掲示板・募集板の投稿はビルド時に静的HTMLへ焼き込んでいる（scripts/lib/board-seed.mjs）。
//  そのままだと投稿が増えてもHTMLが古いままなので、1日1回だけ再ビルドして
//  スナップショットを更新する。投稿のたびに叩く Webhook は作らない
//  （ビルド回数を浪費するため。鮮度は1日1回で足りるという判断）。
//
//  ▼ 保護
//  公開エンドポイントのままだと第三者にビルド回数を浪費させられるので、
//  Vercel Cron の規約どおり Authorization: Bearer <CRON_SECRET> を検証する。
//  不一致は 401。CRON_SECRET または DEPLOY_HOOK_URL が未設定なら
//  「何もせず 200」で終える（環境変数を設定する前でも安全に配置できる）。
//
//  ▼ 運営者の手作業（環境変数の設定）
//    1. Vercel → Settings → Git → Deploy Hooks で main 向けフックを作成し URL を控える
//    2. Settings → Environment Variables に DEPLOY_HOOK_URL を登録（Production）
//    3. 同じく CRON_SECRET を登録（十分に長いランダム文字列）
//  robots.txt の Disallow: /api/ は既存のまま（このURLをクロールさせる必要はない）。
// ============================================================================

export default async function handler(req, res) {
  const hookUrl = process.env.DEPLOY_HOOK_URL;
  const secret = process.env.CRON_SECRET;

  // 未設定なら何もしない（設定前でも 200 を返して cron を失敗させない）。
  if (!hookUrl || !secret) {
    return res.status(200).json({
      ok: true,
      skipped: true,
      reason: !hookUrl ? 'DEPLOY_HOOK_URL 未設定' : 'CRON_SECRET 未設定',
    });
  }

  if (req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  try {
    const r = await fetch(hookUrl, { method: 'POST' });
    if (!r.ok) throw new Error(`deploy hook HTTP ${r.status}`);
    return res.status(200).json({ ok: true, triggered: true });
  } catch (e) {
    // 失敗しても cron 側で再試行されるだけなので、理由を返して 500。
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
