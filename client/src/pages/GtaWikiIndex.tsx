import { ArrowRight, CalendarClock, Gamepad2 } from 'lucide-react';
import Header from '@/components/Header';
import SiteFooter from '@/components/SiteFooter';
import { WikiBreadcrumb, WikiDisclaimer, WikiInfobox, WikiNotice, WikiText } from '@/components/wiki/WikiParts';
import { wikiIcon } from '@/components/wiki/wikiIcons';
import {
  WIKI_CATEGORIES,
  WIKI_INDEX_INFOBOX,
  WIKI_INDEX_SEO,
  WIKI_NAME,
  WIKI_UPDATED,
  wikiPath,
} from '@/data/wiki/categories';
import { useSeo } from '@/hooks/useSeo';
import './gtaWiki.css';

// ============================================================================
//  GTA6まとめWiki のトップ（/gta6-wiki）。日本語のみ（/en 版は作らない）。
//  公開前は data/wiki/release.ts の WIKI_RELEASED=false で隠している
//  （noindex・sitemap除外・ナビ非表示は prerender / static-routes / 各ナビ側が担当）。
//  カードは categories.ts の配列からそのまま作る（別表を作らない）。
// ============================================================================
/** リード文（プリレンダに焼く）。【…】はバッジで描画される。 */
const LEAD =
  'GTA6（グランド・セフト・オート6／2026年11月19日発売予定）の判明情報をまとめた非公式ファンWikiです。公式発表・トレーラー・各メディアの先行取材・招待クリエイターの証言・考察をもとに、情報の確度を【公式】【取材】【証言】【考察】のラベルで区別して掲載しています。未発売時点の暫定情報のため、発売後に大きく更新されます。';

export default function GtaWikiIndex() {
  useSeo(WIKI_INDEX_SEO.title, WIKI_INDEX_SEO.description);

  return (
    <div className="vice-page vice-noise">
      <Header />

      <main className="gta-wiki max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[100px] pb-20 relative z-10">
        <WikiBreadcrumb items={[{ name: 'ホーム', href: '/' }, { name: WIKI_NAME }]} />

        {/* PC はリード文の右に「GTA6 概要」ボックス、スマホはリード文の下にフル幅で積む。 */}
        <div className="wiki-hero">
          <div className="wiki-hero__text">
            <span className="wiki-eyebrow">GTA6 WIKI</span>
            <h1 className="wiki-h1">{WIKI_NAME}</h1>
            <p className="wiki-updated">
              <CalendarClock size={14} aria-hidden="true" />
              最終更新：{WIKI_UPDATED}
            </p>
            <p className="wiki-lead">
              <WikiText text={LEAD} />
            </p>
          </div>
          <WikiInfobox data={WIKI_INDEX_INFOBOX} title="GTA6 概要" icon={Gamepad2} accent="#ff2d95" />
        </div>

        <WikiNotice />

        <h2 className="wiki-h2">カテゴリ</h2>
        <div className="wiki-cards">
          {WIKI_CATEGORIES.map((c) => {
            const Icon = wikiIcon(c.slug);
            return (
              <a
                key={c.slug}
                href={wikiPath(c.slug)}
                className="wiki-card"
                style={{ ['--accent' as string]: c.accent }}
              >
                <span className="wiki-card__head">
                  <span className="wiki-card__icon">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <h3 className="wiki-card__title">{c.title}</h3>
                </span>
                <p className="wiki-card__summary">{c.summary}</p>
                <span className="wiki-card__more">
                  くわしく見る
                  <ArrowRight size={14} aria-hidden="true" />
                </span>
              </a>
            );
          })}
        </div>

        <WikiDisclaimer />
      </main>

      <SiteFooter width={1100} />
    </div>
  );
}
