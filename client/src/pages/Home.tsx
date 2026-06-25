import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import NewsCard from '@/components/NewsCard';
import { newsArticles, newsByDate, CATEGORY_CONFIG, CATEGORIES, type NewsCategory } from '@/data/news';
import { listApprovedServers } from '@/lib/servers';
import { listThreads, type BoardThread } from '@/lib/board';
import { BOARDS, boardColor, type BoardConfig } from '@/lib/boards';
import { type FivemServer } from '@/lib/supabase';
import { useT, useLang } from '@/lib/i18n';

// Topページに表示するニュースサムネの件数
const TOP_NEWS_COUNT = 6;
// 各掲示板で表示するトレンドスレッドの件数
const TREND_PER_BOARD = 3;

export default function Home() {
  const t = useT();
  const lang = useLang();
  const [selectedCat, setSelectedCat] = useState<NewsCategory | 'all'>('all');
  const [servers, setServers] = useState<FivemServer[]>([]);
  const [trends, setTrends] = useState<{ board: BoardConfig; threads: BoardThread[] }[]>([]);

  useEffect(() => {
    listApprovedServers(4).then(({ data }) => setServers((data as FivemServer[]) ?? []));
    // 掲示板ごとに、最近動いたスレッド上位を取得（＝各板のトレンド）
    Promise.all(
      BOARDS.map((board) =>
        listThreads(board.slug).then(({ data }) => ({
          board,
          threads: ((data as BoardThread[]) ?? []).slice(0, TREND_PER_BOARD),
        })),
      ),
    ).then(setTrends);
  }, []);

  const filteredNews = (
    selectedCat === 'all' ? newsByDate : newsByDate.filter((n) => n.category === selectedCat)
  ).slice(0, TOP_NEWS_COUNT);

  return (
    <div className="vice-page vice-noise">
      <Header />

      <main className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[88px] pb-16 relative z-10">
        {/* ===================== HERO C : GTA VI ワードマーク ===================== */}
        <section
          className="relative rounded-3xl overflow-hidden border border-white/10 text-center"
          style={{
            background: 'radial-gradient(120% 120% at 50% 0%,#2a0e35 0%,#18091f 55%,#08060f 100%)',
            padding: 'clamp(14px,2vw,24px) clamp(18px,3vw,32px)',
          }}
        >
          {/* glow */}
          <div
            className="absolute"
            style={{
              left: '50%',
              top: '-24px',
              transform: 'translateX(-50%)',
              width: 'clamp(120px,22vw,220px)',
              height: 'clamp(120px,22vw,220px)',
              borderRadius: '50%',
              background:
                'radial-gradient(circle,rgba(255,138,61,.45) 0%,rgba(255,45,149,.18) 45%,rgba(255,45,149,0) 70%)',
            }}
          />
          <div className="relative">
            <span className="text-[10px] font-extrabold tracking-[0.3em] text-[#22d3ee] uppercase">
              Grand Theft Auto VI
            </span>
            <h1
              className="vice-display vice-glow text-white"
              style={{ fontSize: 'clamp(34px,6vw,68px)', lineHeight: 0.92, margin: '2px 0 0', letterSpacing: '1px' }}
            >
              GTA VI
            </h1>
            <p
              className="font-black text-white/80"
              style={{ fontSize: 'clamp(12px,1.5vw,15px)', margin: '6px 0 0', letterSpacing: '.06em' }}
            >
              {t('hero.tagline')}
            </p>
          </div>
        </section>

        {/* ===================== CONTENT GRID: news + rail ===================== */}
        <div className="flex gap-5 lg:gap-[30px] mt-6 flex-wrap items-start">
          {/* main: news */}
          <div className="flex-1 min-w-0" style={{ flexBasis: '560px' }}>
            <h2 className="font-black text-xl md:text-[28px] m-0 mb-4 flex items-center gap-2.5">
              <span
                className="inline-block rounded-[3px]"
                style={{
                  width: 5,
                  height: 24,
                  background: 'linear-gradient(#ff8a3d,#ff2d95)',
                  boxShadow: '0 0 12px rgba(255,45,149,.6)',
                }}
              />
              {t('home.latest')}
            </h2>

            {/* filter chips（スマホでは非表示：縦に長くなるのを防ぐ） */}
            <div className="hidden sm:flex gap-2 sm:overflow-x-auto pb-1.5 mb-5">
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
                      color: active ? '#fff' : 'rgba(244,238,248,.7)',
                    }}
                  >
                    <span className="w-[7px] h-[7px] rounded-full" style={{ background: color }} />
                    {t(`cat.${c.id}`)}
                  </button>
                );
              })}
            </div>

            {/* news grid（スマホでは最新1件のみ表示。sm以上は全件） */}
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(248px,1fr))' }}>
              {filteredNews.map((item, idx) => (
                <div key={item.id} className={idx === 0 ? '' : 'hidden sm:block'}>
                  <NewsCard article={item} index={idx} />
                </div>
              ))}
            </div>

            <div className="mt-7">
              <a
                href="/news"
                className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/15 text-[#f4eef8] text-sm font-bold px-6 py-3 rounded-full hover:bg-white/10 transition-colors"
              >
                {lang === 'ja'
                  ? `すべての記事を見る（全${newsArticles.length}件）→`
                  : `View all articles (${newsArticles.length}) →`}
              </a>
            </div>
          </div>

          {/* side rail（FiveM募集をトレンドの上に出すため反転） */}
          <aside className="flex flex-col-reverse gap-[18px] min-w-[260px] self-start" style={{ flex: '1 1 280px' }}>
            {/* trending threads（掲示板ごと） */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="text-[15px] font-black m-0 mb-1 flex items-center gap-2">
                <span className="text-[#22d3ee]">▲</span>{t('home.trending')}
              </h3>

              {trends.map(({ board, threads }) => {
                const c = boardColor(board.accent);
                return (
                  <div key={board.slug} className="mt-6 first:mt-5">
                    {/* カテゴリー見出し＋区切り線 */}
                    <div
                      className="flex items-center gap-2 pb-2 mb-2.5 border-b"
                      style={{ borderColor: `${c}40` }}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-none"
                        style={{ background: c, boxShadow: `0 0 8px ${c}` }}
                      />
                      <span className="text-[13.5px] font-extrabold tracking-wide" style={{ color: c }}>
                        {t(`board.${board.slug}`)}
                      </span>
                    </div>

                    {threads.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        {threads.map((t, i) => (
                          <a
                            key={t.id}
                            href={`/thread/${t.id}`}
                            className="flex gap-3 items-start rounded-xl px-3 py-2.5 bg-white/[0.03] hover:bg-white/[0.08] transition-colors"
                          >
                            <span
                              className="vice-num text-[16px] leading-[1.5] flex-none w-4 text-center"
                              style={{ color: c }}
                            >
                              {i + 1}
                            </span>
                            <span className="flex flex-col min-w-0">
                              <span className="text-[14px] font-bold text-white leading-[1.5] line-clamp-2">
                                {t.title}
                              </span>
                              <span className="text-[11px] text-white/35 mt-0.5">
                                {lang === 'ja' ? `${t.post_count}レス` : `${t.post_count} replies`}
                              </span>
                            </span>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-white/35 text-xs px-3 py-2">{t('home.noThreads')}</p>
                    )}
                  </div>
                );
              })}

              {/* 掲示板を見るボタン */}
              <div className="mt-6 pt-4 border-t border-white/[0.07] flex justify-center">
                <a
                  href="/board"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-[12.5px] font-bold text-[#22d3ee] border border-[#22d3ee]/40 hover:bg-[#22d3ee]/10 hover:border-[#22d3ee]/70 transition-colors"
                >
                  {t('home.viewBoard')}
                </a>
              </div>
            </div>

            {/* fivem recruit */}
            <div
              className="rounded-[18px] p-[18px]"
              style={{
                background: 'linear-gradient(160deg,rgba(255,45,149,.14),rgba(167,139,250,.1))',
                border: '1px solid rgba(255,45,149,.25)',
              }}
            >
              <h3 className="text-sm font-black m-0 mb-1.5">{t('home.recruitTitle')}</h3>
              <p className="text-[12.5px] text-white/60 m-0 mb-3.5 leading-relaxed">
                {t('home.recruitDesc')}
              </p>
              {servers.length > 0 ? (
                servers.map((s) => (
                  <a
                    key={s.id}
                    href="/servers"
                    className="flex items-center gap-2.5 py-2.5 border-t border-white/10 hover:opacity-80 transition-opacity"
                  >
                    <span
                      className="w-[30px] h-[30px] rounded-lg flex-none"
                      style={{ background: 'linear-gradient(135deg,#ff2d95,#9b4bd8)' }}
                    />
                    <span className="flex-1 min-w-0 text-[12.5px] font-bold truncate">{s.name}</span>
                    <span className="flex-none text-[11px] font-extrabold text-[#3de0a0]">{s.type}</span>
                  </a>
                ))
              ) : (
                <p className="text-white/40 text-xs py-2.5 border-t border-white/10">
                  {t('home.noRecruit')}
                </p>
              )}
              <a
                href="/servers"
                className="block text-center w-full mt-3 bg-white/[0.04] border border-white/15 text-[#f4eef8] text-[13px] font-extrabold py-2.5 rounded-[11px] hover:bg-white/10 transition-colors"
              >
                {t('home.viewRecruit')}
              </a>
            </div>
          </aside>
        </div>
      </main>

      {/* ===================== FOOTER ===================== */}
      <footer className="relative z-10 border-t border-white/10" style={{ background: 'rgba(8,6,15,.6)' }}>
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-[30px] py-8 flex flex-col gap-3">
          <div className="flex items-center gap-2.5 self-start">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: 'radial-gradient(circle,#fff,#ff2d95 80%)', boxShadow: '0 0 10px #ff2d95' }}
            />
            <span className="vice-display vice-grad text-lg">GTA6&nbsp;FEED</span>
            <a
              href="https://x.com/GTA6FEEDo"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GTA6 FEED 公式X（旧Twitter）"
              title="公式X"
              className="ml-1.5 inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/15 text-white/80 hover:text-white hover:border-white/40 transition-colors"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
          <p className="text-[11.5px] text-white/40 m-0 leading-relaxed max-w-[640px] mx-auto text-center">
            {t('footer.disclaimer')}{' '}
            <a href="/terms" className="underline hover:text-white/70">{t('footer.terms')}</a>
            　© 2026 GTA6 FEED
          </p>
        </div>
      </footer>
    </div>
  );
}
