// ============================================================================
//  言語対応の内部リンク。
//
//  href には「日本語側の論理パス」を渡す（例: /fivem-gtarp/what-is-gtarp）。
//  英語ページでは、そのパスに英語版が実在する場合だけ /en 版へ向ける。
//  英語版が無いページ（掲示板・募集板・servers など）は日本語版へ送る＝現状維持。
//
//  背景：2026-08-06 の監査で、英語ページの内部リンクがほぼ全部 ja URL を指しており、
//  /en 配下 33ページがリンクグラフ上 orphan（GSC「検出-未登録」の主塊）になっていた。
//  各ページで手書きしていた href を、この 1 箇所の判定に集約する。
//
//  「英語版が実在するか」の正は client/src/lib/routes.ts の isLocalizedPath()
//  （＝LOCALIZED_STATIC_PATHS／体験記／非表示でない news 記事）。
//  3表の同期は scripts/check-route-tables.mjs が prebuild で検証する。
// ============================================================================
import type { AnchorHTMLAttributes } from 'react';
import { useLang, pathForLang, stripLangPrefix, type Lang } from '@/lib/i18n';
import { isLocalizedPath } from '@/lib/routes';

/** 日本語側の論理パスを、指定言語の実URLに変換する。 */
export function localizedHref(jaPath: string, lang: Lang): string {
  if (lang === 'ja') return stripLangPrefix(jaPath);
  const base = stripLangPrefix(jaPath);
  // ホーム '/' は routes.ts の表には無い（Home.tsx が useSeo へ localized を直接渡すため）が、
  // /en は prerender-home.ts が本文ごと焼いていて実在する。ここだけ明示的に対に含める。
  if (base === '/') return '/en';
  return isLocalizedPath(base) ? pathForLang(base, 'en') : base;
}

/** 現在の言語で内部パスを解決する関数を返すフック。既存の <a> の href だけ差し替えたい場合に使う。 */
export function useLocalHref(): (jaPath: string) => string {
  const lang = useLang();
  return (jaPath: string) => localizedHref(jaPath, lang);
}

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string };

/** <a> のドロップイン代替。href は日本語側の論理パスで書く。 */
export default function LocalLink({ href, ...rest }: Props) {
  const lang = useLang();
  return <a href={localizedHref(href, lang)} {...rest} />;
}
