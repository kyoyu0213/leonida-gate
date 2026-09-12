// ============================================================================
//  GTA6まとめWiki の共通部品（確度ラベルのバッジ・本文テキスト・状態注記・パンくず）。
//  スタイルは pages/gtaWiki.css（.gta-wiki 配下にスコープ）。
// ============================================================================
import { Fragment, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { WIKI_LABELS, WIKI_LABEL_ORDER, splitLabels, type LabelPart } from '@/data/wiki/labels';
import type { WikiLabel } from '@/data/wiki/types';

/** 確度ラベル1つ（pill）。text に補足（例：「公式映像」）があればそのまま出す。 */
export function WikiBadge({ kind, text }: { kind: WikiLabel; text?: string }) {
  const meta = WIKI_LABELS[kind];
  return (
    <span className={`wiki-badge wiki-badge--${kind}`} title={`${meta.name}：${meta.desc}`}>
      {text ?? meta.name}
    </span>
  );
}

function BadgeGroup({ parts }: { parts: LabelPart[] }) {
  return (
    <span className="wiki-badges">
      {parts.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="wiki-badge-sep">/</span>}
          <WikiBadge kind={p.kind} text={p.text} />
        </Fragment>
      ))}
    </span>
  );
}

/** 本文テキスト。文中の【公式】等をバッジに置き換えて描画する。 */
export function WikiText({ text }: { text: string }) {
  return (
    <>
      {splitLabels(text).map((c, i) =>
        c.type === 'text' ? <Fragment key={i}>{c.text}</Fragment> : <BadgeGroup key={i} parts={c.parts} />,
      )}
    </>
  );
}

/** 確度ラベルの凡例。 */
export function WikiLegend() {
  return (
    <ul className="wiki-legend">
      {WIKI_LABEL_ORDER.map((k) => (
        <li key={k}>
          <WikiBadge kind={k} />
          <span>{WIKI_LABELS[k].desc}</span>
        </li>
      ))}
    </ul>
  );
}

/** 全ページ共通の「この情報について」注記（固定文）。 */
export function WikiNotice() {
  return (
    <aside className="wiki-notice" aria-label="この情報について">
      <p className="wiki-notice__title">この情報について（2026年9月時点）</p>
      <p>
        GTA6は 2026年11月19日発売予定で、まだ発売されていません。本ページは公式発表・トレーラー・各メディアの先行取材・招待クリエイターの証言・考察をもとにした暫定情報で、発売後に大きく更新されます。
      </p>
      <p>
        なお
        <strong>
          2026年8月の先行公開（Extended Look）と各メディア／クリエイターの取材はすべて「ハンズオフ（開発者がプレイし、招待者は視聴のみ）」
        </strong>
        で、Rockstar社外でまだ誰も実プレイしていません。「取材」「証言」ラベルの情報は“映像で見えた観察”に基づく点にご留意ください。
      </p>
      <p className="wiki-notice__legend-title">確度ラベル</p>
      <WikiLegend />
    </aside>
  );
}

export interface Crumb {
  name: string;
  href?: string;
}

/** 表示用のパンくず（JSON-LD の BreadcrumbList は prerender-routes が別途焼く）。 */
export function WikiBreadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className="wiki-crumbs" aria-label="パンくずリスト">
      <ol>
        {items.map((c, i) => (
          <li key={i}>
            {i > 0 && <ChevronRight size={13} className="wiki-crumbs__sep" aria-hidden="true" />}
            {c.href ? <a href={c.href}>{c.name}</a> : <span aria-current="page">{c.name}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** 免責1行。 */
export function WikiDisclaimer({ children }: { children?: ReactNode }) {
  return (
    <p className="wiki-disclaimer">
      Rockstar Games及びTake-Two非公式。商標は各権利者に帰属。{children}
    </p>
  );
}
