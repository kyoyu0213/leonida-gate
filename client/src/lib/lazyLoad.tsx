// ============================================================================
//  動的import（コード分割）の取りこぼし対策。
//
//  背景：2026-08-14 の GSC ライブテストで、Googleレンダラーが
//  ルートチャンク（assets/Contact-*.js）の取得に失敗し、
//  「Failed to fetch dynamically imported module」→ 最上位 ErrorBoundary が
//  全画面エラーを描画 → ソフト404 と判定される事故が起きた。
//
//  対策の本体は「公開ページのルートを事前importにしてチャンクを1本に畳む」こと
//  （App.tsx）。ここはそれでも残る動的import（/admin/* の2本）向けの保険で、
//  React.lazy が reject をキャッシュして二度と復帰しない挙動を、
//  1回だけの再試行で緩和する。
// ============================================================================
import { lazy, type ComponentType } from 'react';

/** 失敗したら1回だけ間を置いて import し直す React.lazy。 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch {
      // 一時的なネットワーク断やデプロイ直後の取りこぼしを拾い直す。
      // 2回目も失敗したら例外はそのまま上げる（ErrorBoundary が受ける）。
      await new Promise((r) => setTimeout(r, 500));
      return factory();
    }
  });
}
