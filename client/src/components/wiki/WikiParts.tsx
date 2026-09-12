// ============================================================================
//  GTA6まとめWiki の共通部品（本文テキスト・冒頭の注記・パンくず・インフォボックス）。
//  スタイルは pages/gtaWiki.css（.gta-wiki 配下にスコープ）。
// ============================================================================
import type { ReactNode } from 'react';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { splitLabels } from '@/data/wiki/labels';
import type { WikiInfobox as WikiInfoboxData } from '@/data/wiki/types';

// ----------------------------------------------------------------------------
//  確度ラベル（【公式】【取材】【証言】【考察】）は表示しない（㉛）。
//  データ（data/wiki/*.ts）には【…】を残してあるので、表示時に取り除く
//  （バッジを復活させるなら、ここで splitLabels のラベル部分を描き直せばよい）。
//
//  ラベルの大半は文末・文頭に添えた注記なので丸ごと消す。ただし「位置づけは【公式】。」
//  「数値は【取材】か【考察】にとどまります」のように、ラベルが文の一部（名詞）になって
//  いる箇所は、消すと文が壊れるので括弧を外した語（公式・取材・考察…）として残す。
//  文の一部かどうかは直前・直後の1文字で判定する：
//    直前が「は」「＝」／直後が助詞「で・の・を・に・か・と」
// ----------------------------------------------------------------------------
const NOUN_BEFORE = /[は＝]$/;
const NOUN_AFTER = /^[でのをにかと]/;

/** 本文から確度ラベルを取り除いたプレーンな文字列（空白・括弧まわりも整える）。 */
export function plainText(text: string): string {
  const chunks = splitLabels(text);
  let out = '';
  chunks.forEach((c, i) => {
    if (c.type === 'text') {
      out += c.text;
      return;
    }
    const next = chunks[i + 1];
    const nextText = next?.type === 'text' ? next.text : '';
    if (NOUN_BEFORE.test(out) || NOUN_AFTER.test(nextText)) {
      out += c.parts.map((p) => p.text).join('／');
    }
  });
  return out
    .replace(/[ 　]{2,}/g, ' ')
    .replace(/[ 　]+([。、，．）」』／,.)])/g, '$1')
    .replace(/([（「『(])[ 　]+/g, '$1')
    .replace(/（）|\(\)/g, '')
    .trim();
}

/** 本文テキスト（確度ラベルを取り除いて描く）。 */
export function WikiText({ text }: { text: string }) {
  return <>{plainText(text)}</>;
}

/** 全ページ共通の冒頭注記（一文）。 */
export function WikiNotice() {
  return (
    <p className="wiki-notice">
      ※本ページは公式発表・トレーラー・各メディアの先行取材・考察をもとにした非公式のまとめです。GTA6は2026年11月19日発売予定で、発売後に内容が変わる場合があります。
    </p>
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

/**
 * 要点ボックス（ゲームWikiのインフォボックス）。アイコン＋文字だけで組む
 * （Rockstar の公式アート等は著作権上使えないため画像は入れない）。
 * 配置（PC は本文右上に float・スマホはフル幅ブロック）は gtaWiki.css 側で決める。
 */
export function WikiInfobox({
  data,
  title,
  icon: Icon,
  accent,
  className = '',
}: {
  data: WikiInfoboxData;
  /** data.title が無いときの見出し（カテゴリ名）。 */
  title: string;
  icon: LucideIcon;
  accent: string;
  className?: string;
}) {
  const heading = data.title ?? title;
  return (
    <aside
      className={`wiki-infobox ${className}`.trim()}
      style={{ ['--accent' as string]: accent }}
      aria-label={`${heading}の要点`}
    >
      <p className="wiki-infobox__head">
        <span className="wiki-infobox__icon">
          <Icon size={18} aria-hidden="true" />
        </span>
        {heading}
      </p>
      <table className="wiki-infobox__table">
        <tbody>
          {data.rows.map((r) => (
            <tr key={r.label}>
              <th scope="row">{r.label}</th>
              <td>
                <WikiText text={r.value} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </aside>
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
