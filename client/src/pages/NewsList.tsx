import { useState } from 'react';
import Header from '@/components/Header';
import NewsCard from '@/components/NewsCard';
import { CATEGORIES, CATEGORY_CONFIG, type NewsCategory } from '@/data/news';
import { useMergedNews, useNewsCommentCounts } from '@/hooks/useNews';
import { useT, useLang } from '@/lib/i18n';
import { useSeo } from '@/hooks/useSeo';

/**
 * ニュース一覧ページ（/news）。全記事をカテゴリ絞り込み付きで表示する。
 */
export default function NewsList() {
  const t = useT();
  const lang = useLang();
  useSeo(t('seo.news.title'), t('seo.news.desc'), { url: '/news' });
  const [selectedCat, setSelectedCat] = useState<NewsCategory | 'all'>('all');
  const { articles: allNews } = useMergedNews();
  const commentCounts = useNewsCommentCounts();

  const filtered =
    selectedCat === 'all' ? allNews : allNews.filter((n) => n.category === selectedCat);

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
              ? `GTA6の公式情報・考察・リークを日本語でお届け。全${allNews.length}件の記事を掲載中。`
              : `Official news, analysis, and leaks on GTA6. ${allNews.length} articles published.`}
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

      <footer className="relative z-10 border-t border-white/10" style={{ background: 'rgba(8,6,15,.6)' }}>
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-[30px] py-8 text-center text-[11.5px] text-white/40">
          {t('footer.disclaimer')} © 2026 GTA6 FEED
        </div>
      </footer>
    </div>
  );
}
