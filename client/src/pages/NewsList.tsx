import { useState } from 'react';
import { useRoute } from 'wouter';
import Header from '@/components/Header';
import NewsCard from '@/components/NewsCard';
import {
  CATEGORIES,
  CATEGORY_CONFIG,
  GTARP_TAGS,
  GTARP_TAG_CONFIG,
  getGtarpTag,
  isNoindexNewsId,
  type GtarpTag,
  type NewsCategory,
} from '@/data/news';
import { useMergedNews, useNewsCommentCounts } from '@/hooks/useNews';
import { useT, useLang, pathForLang } from '@/lib/i18n';
import { useSeo } from '@/hooks/useSeo';
import SiteFooter from '@/components/SiteFooter';

/**
 * ニュース一覧ページ。1つのコンポーネントで2本のルートを受け持つ：
 *   /news        … GTA6本編のニュース（GTARP カテゴリを除く）＋カテゴリ絞り込み
 *   /news/gtarp  … GTARP のニュースだけ＋タグ絞り込み（公式発表／SURGE Town／コラム）
 * どちらのパスで描画するかは useRoute で判定する（体験記の /field-notes/<category> と同じ作り）。
 * GTA6本編だけを追いたい読者にとって GTARP の連載が邪魔になっていたため、2026-09-10 に分離した。
 *
 * ▼ 絞り込みUIの規約（クローラー対策・全一覧ページ共通）
 *   初期状態は必ず「すべて表示（'all'）」にすること。プリレンダされる生HTMLは
 *   この初期状態なので、記事カードの <a> が1本残らずDOMに出る。
 *   逆に、初期状態で一部しか出さないUI（開閉パネル・タブ・ページネーション）を
 *   作るときは、閉じている分も DOM に残して hidden / CSS の display だけで
 *   切り替えること。{open && …} でDOMから外す・クリック時にJSでリンクを後挿入する
 *   実装は禁止（プリレンダHTMLからリンクと本文が丸ごと消え、クローラーに読まれない）。
 */
export default function NewsList() {
  const t = useT();
  const lang = useLang();
  const [gtarpJa] = useRoute('/news/gtarp');
  const [gtarpEn] = useRoute('/en/news/gtarp');
  const onlyGtarp = gtarpJa || gtarpEn;

  // canonical は自言語URL（/news ↔ /en/news、/news/gtarp ↔ /en/news/gtarp）。
  useSeo(
    t(onlyGtarp ? 'seo.newsGtarp.title' : 'seo.news.title'),
    t(onlyGtarp ? 'seo.newsGtarp.desc' : 'seo.news.desc'),
    { url: pathForLang(onlyGtarp ? '/news/gtarp' : '/news', lang), localized: true },
  );
  const [selectedCat, setSelectedCat] = useState<NewsCategory | 'all'>('all');
  // GTARP一覧の中の二次分類（公式発表／SURGE Town／コラム）。初期値は必ず all（上の規約）。
  const [selectedTag, setSelectedTag] = useState<GtarpTag | 'all'>('all');
  const { articles: allNews } = useMergedNews();
  const commentCounts = useNewsCommentCounts();

  // 一覧からは noindex 記事（NOINDEX_NEWS_IDS）を外す。日英とも同じ扱いにする。
  // noindex のURLへ一覧から導線を張ると「インデックスするな」と言いながら
  // 内部リンクで推す形になり、ja/en で掲載本数もずれる（2026-08-08 の監査）。
  // 記事URL自体（/news/29）は残す（直リンク・既存の被リンクは生かす）。
  const listed = allNews
    .filter((n) => !isNoindexNewsId(n.id))
    .filter((n) => (onlyGtarp ? n.category === 'gtarp' : n.category !== 'gtarp'));

  const filtered = onlyGtarp
    ? selectedTag === 'all'
      ? listed
      : listed.filter((n) => getGtarpTag(n) === selectedTag)
    : selectedCat === 'all'
      ? listed
      : listed.filter((n) => n.category === selectedCat);

  // 相手側の一覧へ渡す導線。切り分けた以上、両方から相互に行き来できるようにしておく。
  const otherPath = pathForLang(onlyGtarp ? '/news' : '/news/gtarp', lang);
  const otherColor = onlyGtarp ? '#ff2d95' : CATEGORY_CONFIG.gtarp.vice;
  const otherLabel = onlyGtarp
    ? lang === 'ja'
      ? 'GTA6最新情報を見る →'
      : 'Go to GTA6 News →'
    : lang === 'ja'
      ? 'GTARP最新情報を見る →'
      : 'Go to GTA RP News →';

  return (
    <div className="vice-page vice-noise">
      <Header />

      <main className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[100px] pb-16 relative z-10">
        {/* Hero */}
        <div className="mb-8">
          <span className="text-xs font-extrabold tracking-[0.2em] text-[#22d3ee] uppercase">
            {onlyGtarp ? 'GTA RP News' : 'News'}
          </span>
          <h1 className="font-black text-3xl md:text-[46px] leading-tight mt-2">
            {t(onlyGtarp ? 'newsList.gtarpTitle' : 'newsList.title')}
          </h1>
          <p className="text-white/60 text-sm mt-2.5 leading-relaxed max-w-[560px]">
            {onlyGtarp
              ? lang === 'ja'
                ? `FiveM・NoPixel・ストリーマーサーバーなど、GTA RPの話題だけを集めた一覧。全${listed.length}件の記事を掲載中。`
                : `Everything about GTA RP — FiveM, NoPixel, and streamer servers. ${listed.length} articles published.`
              : lang === 'ja'
                ? `GTA6の公式情報・考察・リークを日本語でお届け。全${listed.length}件の記事を掲載中。`
                : `Official news, analysis, and leaks on GTA6. ${listed.length} articles published.`}
          </p>

          {/* もう一方の一覧への導線 */}
          <a
            href={otherPath}
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-full text-[13px] font-bold transition-colors hover:bg-white/10"
            style={{
              background: 'rgba(255,255,255,.05)',
              border: `1px solid ${otherColor}66`,
              color: otherColor,
            }}
          >
            <span className="w-[7px] h-[7px] rounded-full" style={{ background: otherColor }} />
            {otherLabel}
          </a>
        </div>

        {/* GTARP専用ページのタグ絞り込み（公式発表／SURGE Town／コラム） */}
        {onlyGtarp && (
          <div className="flex gap-2 overflow-x-auto pb-1.5 mb-7">
            {GTARP_TAGS.map((id) => {
              const active = selectedTag === id;
              const conf = id === 'all' ? null : GTARP_TAG_CONFIG[id];
              const color = conf ? conf.vice : '#ff2d95';
              const label = conf
                ? lang === 'en'
                  ? conf.en
                  : conf.ja
                : lang === 'en'
                  ? 'All'
                  : 'すべて';
              return (
                <button
                  key={id}
                  onClick={() => setSelectedTag(id)}
                  className="flex-none flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors"
                  style={{
                    border: `1px solid ${active ? color : 'rgba(255,255,255,.14)'}`,
                    background: active ? `${color}22` : 'rgba(255,255,255,.05)',
                    color: active ? color : 'rgba(255,255,255,.7)',
                  }}
                >
                  <span className="w-[7px] h-[7px] rounded-full" style={{ background: color }} />
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* filter chips（GTA6本編のカテゴリ絞り込み） */}
        {!onlyGtarp && (
          <div className="flex gap-2 overflow-x-auto pb-1.5 mb-7">
            {CATEGORIES.filter((c) => c.id !== 'gtarp').map((c) => {
              const active = selectedCat === c.id;
              const color = c.id === 'all' ? '#ff2d95' : CATEGORY_CONFIG[c.id as NewsCategory].vice;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCat(c.id as NewsCategory | 'all')}
                  className="flex-none flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors"
                  style={{
                    border: `1px solid ${active ? color : 'rgba(255,255,255,.14)'}`,
                    background: active ? `${color}22` : 'rgba(255,255,255,.05)',
                    color: active ? color : 'rgba(255,255,255,.7)',
                  }}
                >
                  <span className="w-[7px] h-[7px] rounded-full" style={{ background: color }} />
                  {t(`cat.${c.id}`)}
                </button>
              );
            })}
          </div>
        )}

        {/* grid */}
        {filtered.length > 0 ? (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(248px,1fr))' }}>
            {filtered.map((item, idx) => (
              <NewsCard
                key={item.id}
                article={item}
                index={idx}
                commentCount={commentCounts[String(item.id)] ?? 0}
              />
            ))}
          </div>
        ) : (
          <p className="text-white/50 py-16 text-center">{t('newsList.empty')}</p>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
