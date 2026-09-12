import { useLocation } from 'wouter';
import { ArrowRight, CalendarClock, ChevronLeft, Info } from 'lucide-react';
import Header from '@/components/Header';
import SiteFooter from '@/components/SiteFooter';
import NotFound from '@/pages/NotFound';
import { WikiBreadcrumb, WikiDisclaimer, WikiNotice, WikiText } from '@/components/wiki/WikiParts';
import { wikiIcon } from '@/components/wiki/wikiIcons';
import {
  WIKI_CATEGORIES,
  WIKI_CATEGORY_BY_SLUG,
  WIKI_NAME,
  wikiPath,
  type WikiCategory,
} from '@/data/wiki/categories';
import { WIKI_PAGES } from '@/data/wiki';
import type { WikiPage, WikiSection } from '@/data/wiki/types';
import { useSeo } from '@/hooks/useSeo';
import { stripLangPrefix } from '@/lib/i18n';
import './gtaWiki.css';

// ============================================================================
//  GTA6まとめWiki のカテゴリページ（/gta6-wiki/<slug>）。日本語のみ。
//  1コンポーネントで6カテゴリを描き分ける（NewsList・FieldNotesList と同じく URL から判定）。
//  本文は data/wiki/<slug>.ts。【公式】等のラベルは WikiText がバッジにする。
//  ルートは App.tsx と entry-server.tsx の JA_ONLY_ROUTES に slug ごとに列挙している
//  （:slug の動的ルートにするとプリレンダ対象から外れるため）。
// ============================================================================

const sectionId = (i: number) => `sec-${i + 1}`;

/** 本文冒頭から直接飛ばす相互リンク（マップ ⇄ 建物・ロケーション）。 */
const CROSS_LINKS: Record<string, string> = { map: 'locations', locations: 'map' };

function Section({ s, index }: { s: WikiSection; index: number }) {
  return (
    <section id={sectionId(index)} className="wiki-section">
      <h2 className="wiki-h2">{s.heading}</h2>
      {s.lead && (
        <p className="wiki-section__lead">
          <WikiText text={s.lead} />
        </p>
      )}
      {s.items && (
        <ul className="wiki-items">
          {s.items.map((it, i) => (
            <li key={i} className={it.term ? 'wiki-item wiki-item--term' : 'wiki-item'}>
              {it.term && <span className="wiki-item__term">{it.term}</span>}
              <span className="wiki-item__text">
                <WikiText text={it.text} />
              </span>
            </li>
          ))}
        </ul>
      )}
      {s.table && (
        <div className="wiki-table-wrap">
          <table className="wiki-table">
            <thead>
              <tr>
                {s.table.head.map((h) => (
                  <th key={h} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {s.table.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) =>
                    c === 0 ? (
                      <th key={c} scope="row">
                        <WikiText text={cell} />
                      </th>
                    ) : (
                      <td key={c}>
                        <WikiText text={cell} />
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {s.note && (
        <p className="wiki-section__note">
          <WikiText text={s.note} />
        </p>
      )}
    </section>
  );
}

function CategoryCard({ c }: { c: WikiCategory }) {
  const Icon = wikiIcon(c.slug);
  return (
    <a href={wikiPath(c.slug)} className="wiki-card" style={{ ['--accent' as string]: c.accent }}>
      <span className="wiki-card__head">
        <span className="wiki-card__icon">
          <Icon size={20} aria-hidden="true" />
        </span>
        <span className="wiki-card__title">{c.title}</span>
      </span>
      <span className="wiki-card__summary">{c.summary}</span>
      <span className="wiki-card__more">
        くわしく見る
        <ArrowRight size={14} aria-hidden="true" />
      </span>
    </a>
  );
}

function CategoryView({ cat, page }: { cat: WikiCategory; page: WikiPage }) {
  useSeo(cat.seoTitle, cat.description);

  const Icon = wikiIcon(cat.slug);
  const related = cat.related.map((s) => WIKI_CATEGORY_BY_SLUG[s]).filter(Boolean);
  const cross = CROSS_LINKS[cat.slug] ? WIKI_CATEGORY_BY_SLUG[CROSS_LINKS[cat.slug]] : undefined;

  return (
    <div className="vice-page vice-noise">
      <Header />

      <main className="gta-wiki max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[100px] pb-20 relative z-10">
        <WikiBreadcrumb
          items={[{ name: 'ホーム', href: '/' }, { name: WIKI_NAME, href: wikiPath() }, { name: cat.title }]}
        />

        <span className="wiki-eyebrow">{WIKI_NAME}</span>
        <h1 className="wiki-h1 wiki-h1--cat" style={{ ['--accent' as string]: cat.accent }}>
          <span className="wiki-h1__icon">
            <Icon size={24} aria-hidden="true" />
          </span>
          {cat.title}
        </h1>
        <p className="wiki-updated">
          <CalendarClock size={14} aria-hidden="true" />
          最終更新：{page.updated}
        </p>

        {page.intro && (
          <p className="wiki-intro">
            <Info size={16} aria-hidden="true" className="wiki-intro__icon" />
            <span>
              <WikiText text={page.intro} />
              {cross && (
                <>
                  {' '}
                  <a href={wikiPath(cross.slug)} className="wiki-intro__link">
                    「{cross.title}」へ →
                  </a>
                </>
              )}
            </span>
          </p>
        )}

        <WikiNotice />

        <div className="wiki-layout">
          {/* PC は左に目次＋カテゴリの2カラム、スマホは本文の上に目次だけの1カラム。 */}
          <aside className="wiki-side">
            <nav className="wiki-toc" aria-label="目次">
              <p className="wiki-side__title">目次</p>
              <ol>
                {page.sections.map((s, i) => (
                  <li key={i}>
                    <a href={`#${sectionId(i)}`}>{s.heading}</a>
                  </li>
                ))}
              </ol>
            </nav>
            <nav className="wiki-catnav" aria-label="カテゴリ">
              <p className="wiki-side__title">カテゴリ</p>
              <ul>
                {WIKI_CATEGORIES.map((c) => (
                  <li key={c.slug}>
                    {c.slug === cat.slug ? (
                      <span aria-current="page">{c.shortTitle}</span>
                    ) : (
                      <a href={wikiPath(c.slug)}>{c.shortTitle}</a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <div className="wiki-body">
            {page.sections.map((s, i) => (
              <Section key={i} s={s} index={i} />
            ))}

            <section className="wiki-sources">
              <h2 className="wiki-h3">出典</h2>
              <p>{page.sources.join('、')} ほか。</p>
            </section>

            {related.length > 0 && (
              <section className="wiki-related">
                <h2 className="wiki-h2">関連カテゴリ</h2>
                <div className="wiki-cards wiki-cards--related">
                  {related.map((c) => (
                    <CategoryCard key={c.slug} c={c} />
                  ))}
                </div>
              </section>
            )}

            <a href={wikiPath()} className="wiki-back">
              <ChevronLeft size={15} aria-hidden="true" />
              {WIKI_NAME} のトップへ戻る
            </a>

            <WikiDisclaimer />
          </div>
        </div>
      </main>

      <SiteFooter width={1100} />
    </div>
  );
}

export default function GtaWikiCategory() {
  const [location] = useLocation();
  const slug = stripLangPrefix(location).split('/')[2] ?? '';
  const cat = WIKI_CATEGORY_BY_SLUG[slug];
  const page = WIKI_PAGES[slug];
  if (!cat || !page) return <NotFound />;
  return <CategoryView cat={cat} page={page} />;
}
