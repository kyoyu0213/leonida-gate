// Google Analytics 4（GA4）。
// このサイトは Vite + React の SPA なので、Next.js の <head>/_app ではなく
// 実行時に gtag.js を head へ注入し、ルート変更ごとに page_view を送る方式。
//
// 測定IDは環境変数 VITE_GA_ID で管理（未設定時は既定IDをフォールバック）。
//   本番ビルド時に Vite が import.meta.env.VITE_GA_ID を埋め込む。
// 本番（import.meta.env.PROD）でのみ有効。dev では一切読み込まない。

export const GA_ID = (import.meta.env.VITE_GA_ID as string | undefined) || 'G-37CH3TFBP4';
export const GA_ENABLED = import.meta.env.PROD && !!GA_ID;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

let initialized = false;

/** gtag.js を head に1度だけ読み込み、初期化する（本番のみ）。 */
export function initGA(): void {
  if (!GA_ENABLED || initialized || typeof window === 'undefined') return;
  initialized = true;

  // Google タグ（gtag.js）を head に設置
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  // SPA のため自動ページビューは無効化し、ルート変更時に手動送信する（二重計測防止）
  window.gtag('config', GA_ID, { send_page_view: false });
}

/** ページビューを送信する。 */
export function trackPageView(path: string): void {
  if (!GA_ENABLED || typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}
