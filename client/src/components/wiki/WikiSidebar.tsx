import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Search } from 'lucide-react';
import { plainText } from '@/components/wiki/WikiParts';
import {
  WIKI_BASE,
  WIKI_CATEGORIES,
  WIKI_GROUP_ORDER,
  WIKI_NAME,
  wikiPath,
} from '@/data/wiki/categories';
import { WIKI_PAGES } from '@/data/wiki';

// ============================================================================
//  GTA6まとめWiki の左サイドバー（index・全カテゴリページ共通・57）。
//  categories.ts の group ごとに見出しを立て、実在するカテゴリだけを並べる（「準備中」は出さない）。
//
//  <details> で包み、スマホは「カテゴリ」で開閉、PC（1024px〜）は summary を隠して常時展開する
//  （CSS の ::details-content。未対応ブラウザは下の useEffect で open を立てる）。
//  閉じていてもリンクは DOM に残るので、プリレンダHTMLに全カテゴリの <a> が出る。
//  条件レンダリングでリンクを出し入れしないこと。
// ============================================================================

interface Hit {
  href: string;
  label: string;
  sub: string;
  /** カテゴリ名・見出しに一致したら大きく加点し、あとは本文での出現回数。 */
  score: number;
}

const norm = (s: string) => s.normalize('NFKC').toLowerCase();

/** 検索対象（カテゴリ名＋各節の見出し・項目名・本文）。初回検索時に1度だけ作る。 */
let searchIndex: { href: string; label: string; sub: string; title: string; body: string }[] | null = null;
function getSearchIndex() {
  if (searchIndex) return searchIndex;
  searchIndex = [];
  for (const c of WIKI_CATEGORIES) {
    searchIndex.push({ href: wikiPath(c.slug), label: c.title, sub: WIKI_NAME, title: norm(c.title), body: norm(c.summary) });
    const page = WIKI_PAGES[c.slug];
    page?.sections.forEach((s, i) => {
      const parts = [
        s.lead ?? '',
        ...(s.items ?? []).flatMap((it) => [it.term ?? '', it.text]),
        ...(s.table ? [...s.table.head, ...s.table.rows.flat()] : []),
        s.note ?? '',
      ];
      searchIndex!.push({
        href: `${wikiPath(c.slug)}#sec-${i + 1}`,
        label: s.heading,
        sub: c.shortTitle,
        title: norm(s.heading),
        body: norm(parts.map(plainText).join(' ')),
      });
    });
  }
  return searchIndex;
}

function searchWiki(q: string): Hit[] {
  const k = norm(q.trim());
  if (!k) return [];
  return getSearchIndex()
    .map((e) => ({
      href: e.href,
      label: e.label,
      sub: e.sub,
      score: (e.title.includes(k) ? 100 : 0) + (e.body.split(k).length - 1),
    }))
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

export default function WikiSidebar({ currentSlug }: { currentSlug?: string }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const [q, setQ] = useState('');
  const hits = q.trim() ? searchWiki(q) : [];

  // ::details-content に対応していないブラウザだけ、PC幅では open を立てて中身を見せる。
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof CSS === 'undefined' || CSS.supports?.('selector(::details-content)')) return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const sync = () => {
      if (mq.matches) el.open = true;
    };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return (
    <details ref={ref} className="wiki-sidebar">
      <summary>カテゴリ</summary>
      <div className="wiki-sidebar__body">
        <form
          role="search"
          className="wiki-sidebar__search"
          onSubmit={(e) => {
            e.preventDefault();
            if (hits[0]) window.location.href = hits[0].href;
          }}
        >
          <Search size={14} aria-hidden="true" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Wiki内を検索…"
            aria-label="Wiki内を検索"
          />
        </form>
        {q.trim() &&
          (hits.length > 0 ? (
            <ul className="wiki-sidebar__results">
              {hits.map((h) => (
                <li key={h.href}>
                  <a href={h.href}>
                    {h.label}
                    <small>{h.sub}</small>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="wiki-sidebar__empty">該当する項目がありません</p>
          ))}

        <nav aria-label={`${WIKI_NAME}のカテゴリ`}>
          <a
            href={WIKI_BASE}
            className="wiki-sidebar__top"
            aria-current={currentSlug === undefined ? 'page' : undefined}
          >
            {WIKI_NAME} トップ
          </a>
          {WIKI_GROUP_ORDER.map((g) => {
            const cats = WIKI_CATEGORIES.filter((c) => c.group === g);
            if (cats.length === 0) return null;
            return (
              <div key={g} className="wiki-sidebar__grp">
                <p className="wiki-sidebar__grp-h">{g}</p>
                <ul>
                  {cats.map((c) => (
                    <li key={c.slug}>
                      <a
                        href={wikiPath(c.slug)}
                        className="wiki-sidebar__link"
                        aria-current={c.slug === currentSlug ? 'page' : undefined}
                        style={{ '--catcolor': c.accent } as CSSProperties}
                      >
                        <span className="wiki-sidebar__dot" aria-hidden="true" />
                        {c.shortTitle}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>
      </div>
    </details>
  );
}
