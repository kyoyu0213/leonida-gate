import { CalendarClock, Gamepad2 } from 'lucide-react';
import Header from '@/components/Header';
import SiteFooter from '@/components/SiteFooter';
import { WikiBreadcrumb, WikiDisclaimer, WikiInfobox, WikiNotice, WikiText } from '@/components/wiki/WikiParts';
import WikiSidebar from '@/components/wiki/WikiSidebar';
import {
  WIKI_CATEGORY_BY_SLUG,
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
//  カテゴリの網羅は左の WikiSidebar（全ページ共通）が担う。カテゴリが増えても破綻しないよう、
//  以前のカード一覧はやめた（57）。JSON-LD の ItemList は prerender-routes が categories.ts から出す。
// ============================================================================
/** リード文（プリレンダに焼く）。 */
const LEAD =
  'GTA6（グランド・セフト・オート6／2026年11月19日発売予定）の判明情報をまとめた非公式ファンWikiです。公式発表・トレーラー・各メディアの先行取材・考察をもとに掲載しています。各カテゴリへはページ左のメニュー（スマホでは上部の「カテゴリ」）から移動できます。未発売時点の暫定情報のため、発売後に大きく更新されることがあり、攻略・データベースなどのカテゴリも発売後に追加する予定です。';

/** ヒーロー画像（Rockstar のキーアート・プレス素材。16:9 のまま出す＝上のロゴと下の「VI」を切らない）。 */
const HERO = {
  src: '/images/news/Jason_and_Lucia_01_With_Logos_landscape.webp',
  alt: '『Grand Theft Auto VI』のキーアート。ヤシの木とアールデコ調の建物を背景に、車のボンネットに腰かけたルシアとジェイソン',
  width: 1280,
  height: 720,
};

/** 「はじめての方へ」で案内するカテゴリ（要約は categories.ts の summary）。 */
const START_SLUGS = ['characters', 'map', 'police', 'development'];

export default function GtaWikiIndex() {
  useSeo(WIKI_INDEX_SEO.title, WIKI_INDEX_SEO.description);
  const start = START_SLUGS.map((s) => WIKI_CATEGORY_BY_SLUG[s]).filter(Boolean);

  return (
    <div className="wiki-shell">
      <Header />

      <main className="gta-wiki max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[100px] pb-20 relative z-10">
        {/* PC は左にカテゴリメニュー／右にメイン。スマホはメニューを「カテゴリ」の開閉にしてメインの上に置く。 */}
        <div className="wiki-index-layout">
          <aside className="wiki-side">
            <WikiSidebar />
          </aside>

          <div className="wiki-index-main">
            <WikiBreadcrumb items={[{ name: 'ホーム', href: '/' }, { name: WIKI_NAME }]} />
            <span className="wiki-eyebrow">GTA6 WIKI</span>
            <h1 className="wiki-h1">{WIKI_NAME}</h1>
            <p className="wiki-updated">
              <CalendarClock size={14} aria-hidden="true" />
              最終更新：{WIKI_UPDATED}
            </p>

            {/* 上部の大きな画像＝LCP なので lazy にしない。width/height で枠を先に確保する（CLS 防止）。 */}
            <img
              className="wiki-hero-img"
              src={HERO.src}
              alt={HERO.alt}
              width={HERO.width}
              height={HERO.height}
              decoding="async"
              fetchPriority="high"
            />

            {/* PC はリード文の右に「GTA6 概要」ボックス、スマホはリード文の下にフル幅で積む。 */}
            <div className="wiki-hero">
              <p className="wiki-lead">
                <WikiText text={LEAD} />
              </p>
              <WikiInfobox data={WIKI_INDEX_INFOBOX} title="GTA6 概要" icon={Gamepad2} accent="#c01766" />
            </div>

            <WikiNotice />

            <h2 className="wiki-h2">はじめての方へ</h2>
            <ul className="wiki-list wiki-start">
              {start.map((c) => (
                <li key={c.slug}>
                  <a href={wikiPath(c.slug)}>{c.title}</a>：{c.summary}
                </li>
              ))}
            </ul>

            <WikiDisclaimer>
              トップの画像は Rockstar Games のプレス素材です（© Rockstar Games / Take-Two Interactive）。
            </WikiDisclaimer>
          </div>
        </div>
      </main>

      <SiteFooter width={1100} />
    </div>
  );
}
