import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import NewsCard from '@/components/NewsCard';
import { newsArticles, newsByDate, CATEGORY_CONFIG, CATEGORIES, type NewsCategory } from '@/data/news';
import { listApprovedServers } from '@/lib/servers';
import { listRecentThreads, type BoardThread } from '@/lib/board';
import { getBoard } from '@/lib/boards';
import { type FivemServer } from '@/lib/supabase';

// Topページに表示するニュースサムネの件数
const TOP_NEWS_COUNT = 6;

export default function Home() {
  const [selectedCat, setSelectedCat] = useState<NewsCategory | 'all'>('all');
  const [servers, setServers] = useState<FivemServer[]>([]);
  const [threads, setThreads] = useState<BoardThread[]>([]);

  useEffect(() => {
    listApprovedServers(4).then(({ data }) => setServers((data as FivemServer[]) ?? []));
    listRecentThreads(4).then(({ data }) => setThreads((data as BoardThread[]) ?? []));
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
            background: 'radial-gradient(120% 120% at 50% 0%,#3a1248 0%,#1a0a26 55%,#0c0718 100%)',
            padding: 'clamp(36px,6vw,80px) clamp(20px,4vw,40px)',
          }}
        >
          {/* glow */}
          <div
            className="absolute"
            style={{
              left: '50%',
              top: '-40px',
              transform: 'translateX(-50%)',
              width: 'clamp(200px,40vw,420px)',
              height: 'clamp(200px,40vw,420px)',
              borderRadius: '50%',
              background:
                'radial-gradient(circle,rgba(255,138,61,.45) 0%,rgba(255,45,149,.18) 45%,rgba(255,45,149,0) 70%)',
            }}
          />
          <div className="relative">
            <span className="text-xs font-extrabold tracking-[0.3em] text-[#22d3ee] uppercase">
              Grand Theft Auto VI
            </span>
            <h1
              className="vice-display vice-glow text-white"
              style={{ fontSize: 'clamp(64px,15vw,200px)', lineHeight: 0.86, margin: '10px 0 0', letterSpacing: '1px' }}
            >
              GTA VI
            </h1>
            <p
              className="font-black text-white/90"
              style={{ fontSize: 'clamp(15px,2.2vw,24px)', margin: '14px 0 0', letterSpacing: '.06em' }}
            >
              バイスシティ総合情報 ＆ コミュニティ
            </p>
            <div className="flex gap-2.5 justify-center flex-wrap mt-6">
              {newsByDate.slice(0, 3).map((m) => {
                const color = CATEGORY_CONFIG[m.category].vice;
                return (
                  <a
                    key={m.id}
                    href={`/news/${m.id}`}
                    className="flex items-center gap-2 rounded-full px-[18px] py-2.5 border transition-colors"
                    style={{ background: 'rgba(255,255,255,.05)', borderColor: 'rgba(255,255,255,.12)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = color)}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)')}
                  >
                    <span
                      className="w-[7px] h-[7px] rounded-full flex-none"
                      style={{ background: color, boxShadow: `0 0 8px ${color}` }}
                    />
                    <span className="text-[13px] font-bold text-[#f4eef8] whitespace-nowrap overflow-hidden text-ellipsis max-w-[240px]">
                      {m.title}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        {/* ===================== CONTENT GRID: news + rail ===================== */}
        <div className="flex gap-5 lg:gap-[30px] mt-8 lg:mt-10 flex-wrap items-start">
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
              最新情報
            </h2>

            {/* filter chips */}
            <div className="flex gap-2 overflow-x-auto pb-1.5 mb-5">
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
                      background: active ? `${color}22` : 'rgba(255,255,255,.03)',
                      color: active ? '#fff' : 'rgba(244,238,248,.7)',
                    }}
                  >
                    <span className="w-[7px] h-[7px] rounded-full" style={{ background: color }} />
                    {c.label}
                  </button>
                );
              })}
            </div>

            {/* news grid */}
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(248px,1fr))' }}>
              {filteredNews.map((item, idx) => (
                <NewsCard key={item.id} article={item} index={idx} />
              ))}
            </div>

            <div className="mt-7">
              <a
                href="/news"
                className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/15 text-white text-sm font-bold px-6 py-3 rounded-full hover:bg-white/10 transition-colors"
              >
                すべての記事を見る（全{newsArticles.length}件）→
              </a>
            </div>
          </div>

          {/* side rail */}
          <aside className="flex flex-col gap-[18px] min-w-[260px]" style={{ flex: '1 1 280px' }}>
            {/* trending threads */}
            <div className="rounded-[18px] border border-white/10 bg-white/[0.04] px-[18px] pt-[18px] pb-2">
              <h3 className="text-sm font-black m-0 mb-3.5 flex items-center gap-2">
                <span className="text-[#22d3ee]">▲</span>トレンドのスレッド
              </h3>
              {threads.length > 0 ? (
                threads.map((t, i) => (
                  <a
                    key={t.id}
                    href={`/thread/${t.id}`}
                    className="flex gap-[11px] items-start w-full text-left border-t border-white/[0.07] py-3.5 hover:opacity-80 transition-opacity"
                  >
                    <span className="vice-num text-[17px] leading-none flex-none" style={{ color: 'rgba(255,45,149,.7)' }}>
                      {i + 1}
                    </span>
                    <span className="flex flex-col gap-1.5 min-w-0">
                      <span className="text-[13px] font-semibold text-[#f4eef8] leading-[1.4] line-clamp-2">
                        {t.title}
                      </span>
                      <span className="text-[11px] text-white/45">
                        {getBoard(t.board)?.title.replace('掲示板', '') ?? t.board}・{t.post_count}レス
                      </span>
                    </span>
                  </a>
                ))
              ) : (
                <p className="text-white/40 text-xs py-3 border-t border-white/[0.07]">
                  まだスレッドがありません
                </p>
              )}
              <a
                href="/board"
                className="block text-center text-[12.5px] font-bold text-[#22d3ee] hover:text-white transition-colors py-3 border-t border-white/[0.07] mt-1"
              >
                掲示板を見る →
              </a>
            </div>

            {/* fivem recruit */}
            <div
              className="rounded-[18px] p-[18px]"
              style={{
                background: 'linear-gradient(160deg,rgba(255,45,149,.14),rgba(167,139,250,.1))',
                border: '1px solid rgba(255,45,149,.25)',
              }}
            >
              <h3 className="text-sm font-black m-0 mb-1.5">🎮 FiveMサーバー募集</h3>
              <p className="text-[12.5px] text-white/60 m-0 mb-3.5 leading-relaxed">
                いま掲載中のRP・フリー鯖をチェック。仲間を探そう。
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
                  まだ募集がありません
                </p>
              )}
              <a
                href="/servers"
                className="block text-center w-full mt-3 bg-white/10 border border-white/15 text-[#f4eef8] text-[13px] font-extrabold py-2.5 rounded-[11px] hover:bg-white/15 transition-colors"
              >
                募集一覧を見る →
              </a>
            </div>
          </aside>
        </div>
      </main>

      {/* ===================== FOOTER ===================== */}
      <footer className="relative z-10 border-t border-white/10" style={{ background: 'rgba(8,6,15,.6)' }}>
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-[30px] py-8 flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: 'radial-gradient(circle,#fff,#ff2d95 80%)', boxShadow: '0 0 10px #ff2d95' }}
            />
            <span className="vice-display vice-grad text-lg">VICE&nbsp;HUB</span>
          </div>
          <p className="text-[11.5px] text-white/40 m-0 leading-relaxed max-w-[640px]">
            本サイトは GTA6（Grand Theft Auto VI）の非公式ファンコミュニティです。Rockstar Games / Take-Two
            とは一切関係ありません。{' '}
            <a href="/terms" className="underline hover:text-white/70">利用規約・プライバシー</a>
            　© 2026 VICE HUB
          </p>
        </div>
      </footer>
    </div>
  );
}
