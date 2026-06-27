import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import NewsCard from '@/components/NewsCard';
import { CATEGORY_CONFIG, CATEGORIES, type NewsCategory } from '@/data/news';
import { useMergedNews, useNewsCommentCounts } from '@/hooks/useNews';
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

  const { articles: allNews } = useMergedNews();
  const commentCounts = useNewsCommentCounts();
  const filteredNews = (
    selectedCat === 'all' ? allNews : allNews.filter((n) => n.category === selectedCat)
  ).slice(0, TOP_NEWS_COUNT);

  // 発売まで（2026-11-19）の残り日数
  const releaseDays = Math.max(0, Math.ceil((new Date('2026-11-19T00:00:00').getTime() - Date.now()) / 86400000));

  return (
    <div className="vice-page vice-noise">
      <Header />

      <main className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[88px] pb-16 relative z-10">
        {/* ===================== HERO : シネマティック全面（Frame A） ===================== */}
        <section
          className="relative rounded-3xl overflow-hidden border border-white/10"
          style={{
            minHeight: 'clamp(440px,52vw,560px)',
            background: 'radial-gradient(130% 140% at 16% 64%,#220c30 0%,#100819 56%,#08060f 100%)',
          }}
        >
          {/* PC：右側に大きくカバーアート（左へフェード） */}
          <img
            src="/images/news/Official_Cover_Art_landscape.webp"
            alt="Grand Theft Auto VI"
            className="home-hero-cover hidden sm:block absolute right-0 top-0 h-full select-none pointer-events-none"
            style={{
              width: '72%',
              objectFit: 'cover',
              WebkitMaskImage:
                'linear-gradient(90deg,transparent 0%,rgba(0,0,0,.4) 30%,#000 64%)',
              maskImage: 'linear-gradient(90deg,transparent 0%,rgba(0,0,0,.4) 30%,#000 64%)',
            }}
          />
          {/* スマホのカバーアートはコンテンツ側でインライン配置（黒い隙間を防ぐ） */}
          {/* PC：下からの黒グラデで可読性確保 */}
          <div
            className="hidden sm:block absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(180deg,rgba(8,6,15,.1) 0%,rgba(8,6,15,0) 34%,rgba(8,6,15,.5) 70%,rgba(8,6,15,.95) 100%)',
            }}
          />

          {/* 発売カウントダウンのバッジ（PCは右上・スマホはロゴ下に別途配置） */}
          <div
            className="hidden sm:flex absolute items-center gap-2 pointer-events-none"
            style={{
              top: 'clamp(16px,2.4vw,24px)',
              right: 'clamp(16px,2.4vw,24px)',
              background: 'rgba(8,6,15,.5)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,138,61,.45)',
              borderRadius: 999,
              padding: '9px 16px',
            }}
          >
            <span
              className="w-2 h-2 rounded-full flex-none"
              style={{ background: '#ff8a3d', boxShadow: '0 0 9px #ff8a3d' }}
            />
            <span className="text-[12.5px] font-extrabold whitespace-nowrap" style={{ color: '#ffd0a8' }}>
              {lang === 'ja' ? '発売まで ' : 'Release in '}
              <span className="vice-num" style={{ fontSize: 15, color: '#fff' }}>{releaseDays}</span>
              {lang === 'ja' ? ' 日' : ' days'}
            </span>
          </div>

          {/* PC：テキスト＋ロゴ＋CTA（下寄せ／スマホは非表示） */}
          <div
            className="hidden sm:flex flex-col justify-end absolute inset-0"
            style={{ padding: '0 clamp(22px,4vw,46px) clamp(26px,4vw,42px)' }}
          >
            <span
              className="block font-bold uppercase"
              style={{
                fontFamily: "'Chakra Petch', sans-serif",
                fontSize: 'clamp(10px,1.4vw,12.5px)',
                letterSpacing: '.32em',
                color: '#22d3ee',
                marginBottom: 'clamp(10px,1.6vw,14px)',
              }}
            >
              Grand Theft Auto VI&nbsp;&nbsp;&nbsp;Community
            </span>

            <img
              src="/images/gta6feed-logo.webp"
              alt="GTA6 FEED"
              className="block select-none"
              style={{
                width: 'clamp(300px,46vw,560px)',
                height: 'auto',
                maxWidth: '80%',
                objectFit: 'contain',
                filter:
                  'drop-shadow(0 4px 22px rgba(0,0,0,.7)) drop-shadow(0 0 26px rgba(255,45,149,.28))',
                marginLeft: '-2px',
              }}
            />

            <p
              className="font-black"
              style={{
                fontSize: 'clamp(15px,2.2vw,21px)',
                margin: 'clamp(12px,1.8vw,16px) 0 0',
                color: 'rgba(244,238,248,.92)',
                letterSpacing: '.04em',
                textWrap: 'pretty',
              }}
            >
              {t('hero.tagline')}
            </p>

            <div className="flex gap-2.5 flex-wrap" style={{ marginTop: 'clamp(18px,2.6vw,24px)' }}>
              <a
                href="/news"
                className="font-extrabold text-white"
                style={{
                  fontSize: 'clamp(13px,1.6vw,14.5px)',
                  padding: '13px 24px',
                  borderRadius: 999,
                  background: 'linear-gradient(95deg,#ff8a3d,#ff2d95 60%,#c44be0)',
                  boxShadow: '0 6px 24px rgba(255,45,149,.45)',
                }}
              >
                {lang === 'ja' ? '最新情報を見る →' : 'View latest →'}
              </a>
              <a
                href="/board"
                className="font-extrabold text-white"
                style={{
                  fontSize: 'clamp(13px,1.6vw,14.5px)',
                  padding: '13px 24px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,.1)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,.25)',
                }}
              >
                {lang === 'ja' ? '掲示板を見る' : 'Board'}
              </a>
              <a
                href="/servers"
                className="font-extrabold text-white"
                style={{
                  fontSize: 'clamp(13px,1.6vw,14.5px)',
                  padding: '13px 24px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,.1)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,.25)',
                }}
              >
                {lang === 'ja' ? 'サーバーを探す' : 'Find servers'}
              </a>
            </div>
          </div>

          {/* スマホ：ロゴを上に・文言は縦積み・ボタン2つ（サーバー探すは無し） */}
          <div className="sm:hidden relative">
            {/* アート（全体表示）にロゴ・カウントダウンを重ねる */}
            <div className="relative">
              <img
                src="/images/hero-mobile.webp"
                alt="Grand Theft Auto VI"
                className="block w-full h-auto select-none"
              />
              {/* 上：ロゴを立たせる暗転 */}
              <div
                className="absolute inset-x-0 top-0 pointer-events-none"
                style={{ height: '36%', background: 'linear-gradient(180deg,rgba(8,6,15,.9) 0%,rgba(8,6,15,.45) 52%,rgba(8,6,15,0) 100%)' }}
              />
              {/* 下：本文エリアへ馴染ませる暗転 */}
              <div
                className="absolute inset-x-0 bottom-0 pointer-events-none"
                style={{ height: '34%', background: 'linear-gradient(0deg,#08060f 0%,rgba(8,6,15,.55) 48%,rgba(8,6,15,0) 100%)' }}
              />
              {/* ロゴ（左上） */}
              <img
                src="/images/gta6feed-logo.webp"
                alt="GTA6 FEED"
                className="absolute select-none"
                style={{
                  top: 16,
                  left: 20,
                  width: 'clamp(230px,64vw,320px)',
                  height: 'auto',
                  filter:
                    'drop-shadow(0 2px 14px rgba(0,0,0,.95)) drop-shadow(0 0 22px rgba(255,45,149,.32))',
                }}
              />
              {/* カウントダウン（左下） */}
              <div
                className="absolute flex items-center gap-2"
                style={{
                  left: 20,
                  bottom: 14,
                  background: 'rgba(8,6,15,.55)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,138,61,.45)',
                  borderRadius: 999,
                  padding: '8px 14px',
                }}
              >
                <span
                  className="w-2 h-2 rounded-full flex-none"
                  style={{ background: '#ff8a3d', boxShadow: '0 0 9px #ff8a3d' }}
                />
                <span className="text-[12.5px] font-extrabold whitespace-nowrap" style={{ color: '#ffd0a8' }}>
                  {lang === 'ja' ? '発売まで ' : 'Release in '}
                  <span className="vice-num" style={{ fontSize: 15, color: '#fff' }}>{releaseDays}</span>
                  {lang === 'ja' ? ' 日' : ' days'}
                </span>
              </div>
            </div>
            {/* 文言＋ボタン（アートの下・ダーク背景） */}
            <div style={{ padding: '14px 20px 22px' }}>
              <div>
                {t('hero.tagline')
                  .split('｜')
                  .slice(0, -1)
                  .map((line, i) => (
                    <p
                      key={i}
                      className="font-black"
                      style={{
                        fontSize: 16,
                        lineHeight: 1.75,
                        margin: 0,
                        color: 'rgba(244,238,248,.94)',
                        letterSpacing: '.03em',
                      }}
                    >
                      {line}
                    </p>
                  ))}
              </div>
              <div className="flex flex-col items-start gap-2.5" style={{ marginTop: 16 }}>
                <a
                  href="/news"
                  className="font-extrabold text-white"
                  style={{
                    fontSize: 14.5,
                    padding: '13px 26px',
                    borderRadius: 999,
                    background: 'linear-gradient(95deg,#ff8a3d,#ff2d95 60%,#c44be0)',
                    boxShadow: '0 6px 24px rgba(255,45,149,.45)',
                  }}
                >
                  {lang === 'ja' ? '最新情報を見る →' : 'View latest →'}
                </a>
                <div className="flex gap-2.5">
                  <a
                    href="/board"
                    className="font-extrabold text-white"
                    style={{
                      fontSize: 14.5,
                      padding: '13px 20px',
                      borderRadius: 999,
                      background: 'rgba(255,255,255,.1)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,.25)',
                    }}
                  >
                    {lang === 'ja' ? '掲示板を見る' : 'Board'}
                  </a>
                  <a
                    href="/servers"
                    className="font-extrabold text-white"
                    style={{
                      fontSize: 14.5,
                      padding: '13px 20px',
                      borderRadius: 999,
                      background: 'rgba(255,255,255,.1)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,.25)',
                    }}
                  >
                    {lang === 'ja' ? 'サーバーを探す' : 'Find servers'}
                  </a>
                </div>
              </div>
            </div>
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
                  <NewsCard article={item} index={idx} commentCount={commentCounts[String(item.id)] ?? 0} />
                </div>
              ))}
            </div>

            <div className="mt-7">
              <a
                href="/news"
                className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/15 text-[#f4eef8] text-sm font-bold px-6 py-3 rounded-full hover:bg-white/10 transition-colors"
              >
                {lang === 'ja'
                  ? `すべての記事を見る（全${allNews.length}件）→`
                  : `View all articles (${allNews.length}) →`}
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
                    {/* カテゴリー見出し＝その掲示板一覧へのリンク */}
                    <a
                      href={`/board/${board.slug}`}
                      className="group flex items-center gap-2 pb-2 mb-2.5 border-b hover:opacity-90 transition-opacity"
                      style={{ borderColor: `${c}40` }}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-none"
                        style={{ background: c, boxShadow: `0 0 8px ${c}` }}
                      />
                      <span
                        className="text-[13.5px] font-extrabold tracking-wide group-hover:underline"
                        style={{ color: c }}
                      >
                        {t(`board.${board.slug}`)}
                      </span>
                      <span
                        className="ml-auto text-[12px] opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: c }}
                      >
                        →
                      </span>
                    </a>

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
