import { useState } from 'react';
import Header from '@/components/Header';
import NewsCard from '@/components/NewsCard';
import { CATEGORIES, CATEGORY_CONFIG, isNoindexNewsId, type NewsCategory } from '@/data/news';
import { useMergedNews, useNewsCommentCounts } from '@/hooks/useNews';
import { useT, useLang, pathForLang } from '@/lib/i18n';
import { useSeo } from '@/hooks/useSeo';
import SiteFooter from '@/components/SiteFooter';

/**
 * ニュース一覧ページ（/news）。全記事をカテゴリ絞り込み付きで表示する。
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
  // canonical は自言語URL（/news ↔ /en/news）。localized:true で hreflang の対を出す。
  useSeo(t('seo.news.title'), t('seo.news.desc'), {
    url: pathForLang('/news', lang),
    localized: true,
  });
  const [selectedCat, setSelectedCat] = useState<NewsCategory | 'all'>('all');
  const { articles: allNews } = useMergedNews();
  const commentCounts = useNewsCommentCounts();

  // 一覧からは noindex 記事（NOINDEX_NEWS_IDS）を外す。日英とも同じ扱いにする。
  // noindex のURLへ一覧から導線を張ると「インデックスするな」と言いながら
  // 内部リンクで推す形になり、ja/en で掲載本数もずれる（2026-08-08 の監査）。
  // 記事URL自体（/news/29）は残す（直リンク・既存の被リンクは生かす）。
  const listed = allNews.filter((n) => !isNoindexNewsId(n.id));

  const filtered =
    selectedCat === 'all' ? listed : listed.filter((n) => n.category === selectedCat);

  return (
    <div className="vice-page vice-noise">
      <Header />

      <main className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[100px] pb-16 relative z-10">
        {/* Hero */}
        <div className="mb-8">
          <span className="text-xs font-extrabold tracking-[0.2em] text-[#22d3ee] uppercase">News</span>
          <h1 className="font-black text-3xl md:text-[46px] leading-tight mt-2">{t('newsList.title')}</h1>
          <p className="text-white/60 text-sm mt-2.5 leading-relaxed max-w-[560px]">
            {lang === 'ja'
              ? `GTA6の公式情報・考察・リークを日本語でお届け。全${listed.length}件の記事を掲載中。`
              : `Official news, analysis, and leaks on GTA6. ${listed.length} articles published.`}
          </p>
        </div>

        {/* filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1.5 mb-7">
          {CATEGORIES.map((c) => {
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
