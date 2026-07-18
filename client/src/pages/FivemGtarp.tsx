import { useState } from 'react';
import Header from '@/components/Header';
import { Server, Users, GitCompare, MessageSquare, Compass, Download, History, BookOpen, HelpCircle, Terminal, Tv, Megaphone, Eye, Footprints, Wrench, ArrowRight, ImageDown, EyeOff, NotebookPen, MapPinned } from 'lucide-react';
import { useSeo } from '@/hooks/useSeo';
import { useT, useLang } from '@/lib/i18n';
import { fieldNotes, FIELD_NOTE_CATEGORY_CONFIG } from '@/data/fieldNotes';

interface Card {
  titleKey: string;
  descKey: string;
  href: string;
  icon: typeof Server;
  accent: string; // ネオン色
}

interface CardGroup {
  labelKey: string;
  accent: string;
  cards: Card[];
}

// カードが増えて縦に長くなったため、用途ごとに3グループへ分けて見つけやすくする。
const GROUPS: CardGroup[] = [
  {
    labelKey: 'fg.group.basics',
    accent: '#22d3ee',
    cards: [
      { titleKey: 'fg.card.fivem.title', descKey: 'fg.card.fivem.desc', href: '/fivem-gtarp/what-is-fivem', icon: Server, accent: '#22d3ee' },
      { titleKey: 'fg.card.gtarp.title', descKey: 'fg.card.gtarp.desc', href: '/fivem-gtarp/what-is-gtarp', icon: Users, accent: '#a78bfa' },
      { titleKey: 'fg.card.diff.title', descKey: 'fg.card.diff.desc', href: '/fivem-gtarp/fivem-vs-gtarp', icon: GitCompare, accent: '#ff8a3d' },
    ],
  },
  {
    // オリジナル一次情報（体験記）をハブ上位＝基本の直後に昇格。カードは render 側で
    // 個別4記事への直リンク（言語対応）としてデータ駆動描画する。ここの cards は
    // 「一覧への導線」を併存させるための予備であり、実描画では個別記事を主にする。
    labelKey: 'fg.group.fieldnotes',
    accent: '#fb923c',
    cards: [
      { titleKey: 'fg.card.devDiary.title', descKey: 'fg.card.devDiary.desc', href: '/fivem-gtarp/field-notes/dev-diary', icon: NotebookPen, accent: '#fb923c' },
      { titleKey: 'fg.card.visitNote.title', descKey: 'fg.card.visitNote.desc', href: '/fivem-gtarp/field-notes/visit-note', icon: MapPinned, accent: '#38bdf8' },
    ],
  },
  {
    labelKey: 'fg.group.play',
    accent: '#34d399',
    cards: [
      { titleKey: 'fg.card.install.title', descKey: 'fg.card.install.desc', href: '/fivem-gtarp/how-to-install', icon: Download, accent: '#38bdf8' },
      { titleKey: 'fg.card.guide.title', descKey: 'fg.card.guide.desc', href: '/fivem-gtarp/server-guide', icon: Compass, accent: '#3de0a0' },
      { titleKey: 'fg.card.firstDay.title', descKey: 'fg.card.firstDay.desc', href: '/fivem-gtarp/first-day-guide', icon: Footprints, accent: '#facc15' },
      { titleKey: 'fg.card.faq.title', descKey: 'fg.card.faq.desc', href: '/fivem-gtarp/faq', icon: HelpCircle, accent: '#34d399' },
      { titleKey: 'fg.card.commands.title', descKey: 'fg.card.commands.desc', href: '/fivem-gtarp/commands', icon: Terminal, accent: '#fb7185' },
      { titleKey: 'fg.card.servers.title', descKey: 'fg.card.servers.desc', href: '/servers', icon: Megaphone, accent: '#fbbf24' },
      { titleKey: 'fg.card.serverBoard.title', descKey: 'fg.card.serverBoard.desc', href: '/board/gtarp-servers', icon: MessageSquare, accent: '#ff8a3d' },
      { titleKey: 'fg.card.board.title', descKey: 'fg.card.board.desc', href: '/board/gtarp', icon: MessageSquare, accent: '#ff2d95' },
    ],
  },
  {
    labelKey: 'fg.group.watch',
    accent: '#f472b6',
    cards: [
      { titleKey: 'fg.card.observer.title', descKey: 'fg.card.observer.desc', href: '/fivem-gtarp/observer-guide', icon: Eye, accent: '#e879f9' },
      { titleKey: 'fg.card.streamerHistory.title', descKey: 'fg.card.streamerHistory.desc', href: '/fivem-gtarp/streamer-server-history', icon: Tv, accent: '#f472b6' },
      { titleKey: 'fg.card.streamerBoard.title', descKey: 'fg.card.streamerBoard.desc', href: '/board/streamer-servers', icon: MessageSquare, accent: '#ff2d95' },
    ],
  },
  {
    labelKey: 'fg.group.more',
    accent: '#c084fc',
    cards: [
      { titleKey: 'fg.card.glossary.title', descKey: 'fg.card.glossary.desc', href: '/fivem-gtarp/glossary', icon: BookOpen, accent: '#c084fc' },
      { titleKey: 'fg.card.history.title', descKey: 'fg.card.history.desc', href: '/fivem-gtarp/history', icon: History, accent: '#f0b429' },
    ],
  },
  {
    labelKey: 'fg.group.dev',
    accent: '#60a5fa',
    cards: [
      { titleKey: 'fg.card.serverSetup.title', descKey: 'fg.card.serverSetup.desc', href: '/fivem-gtarp/server-setup', icon: Wrench, accent: '#60a5fa' },
      { titleKey: 'fg.card.serverPromo.title', descKey: 'fg.card.serverPromo.desc', href: '/servers', icon: Megaphone, accent: '#38bdf8' },
      { titleKey: 'fg.card.devBoard.title', descKey: 'fg.card.devBoard.desc', href: '/board/fivem-dev', icon: MessageSquare, accent: '#22d3ee' },
    ],
  },
  {
    labelKey: 'fg.group.tools',
    accent: '#ff2d95',
    cards: [
      { titleKey: 'fg.card.imageResize.title', descKey: 'fg.card.imageResize.desc', href: '/fivem-gtarp/tools/image-resize', icon: ImageDown, accent: '#2de2e6' },
      { titleKey: 'fg.card.imageMask.title', descKey: 'fg.card.imageMask.desc', href: '/fivem-gtarp/tools/image-mask', icon: EyeOff, accent: '#ff2d95' },
    ],
  },
];

// カテゴリ絞り込みチップ。'all' + 各グループ。チップのラベルは短縮版（fg.tab.*）。
const TABS = [
  { id: 'all', tabKey: 'fg.tab.all', color: '#ff2d95' },
  ...GROUPS.map((g) => ({
    id: g.labelKey,
    tabKey: g.labelKey.replace('fg.group.', 'fg.tab.'),
    color: g.accent,
  })),
];

export default function FivemGtarp() {
  const t = useT();
  const lang = useLang();
  useSeo(t('fg.seo.title'), t('fg.seo.desc'), { localized: true });
  const [selected, setSelected] = useState<string>('all');

  const visibleGroups = selected === 'all' ? GROUPS : GROUPS.filter((g) => g.labelKey === selected);

  // 体験記は個別4記事を新しい順で、言語対応の直リンクとして描画する（データ駆動）。
  const notesSorted = [...fieldNotes].sort((a, b) => b.date.localeCompare(a.date));
  const langPrefix = lang === 'en' ? '/en' : '';

  return (
    <div className="vice-page vice-noise">
      <Header />

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[100px] pb-20 relative z-10">
        {/* Hero */}
        <span className="text-xs font-extrabold tracking-[0.25em] text-[#22d3ee] uppercase">
          FiveM / GTARP
        </span>
        <h1 className="font-black text-3xl md:text-[44px] leading-tight mt-2">{t('fg.heading')}</h1>
        <p className="text-white/60 text-sm md:text-[15px] mt-3 leading-relaxed max-w-[720px]">
          {t('fg.lead')}
        </p>

        {/* カテゴリ絞り込みチップ（newsの一覧と同じ操作感）。カードが増えたため用途で絞れるように。 */}
        <div className="flex gap-2 overflow-x-auto pb-1.5 mt-8">
          {TABS.map((tab) => {
            const active = selected === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelected(tab.id)}
                className="flex-none flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors"
                style={{
                  border: `1px solid ${active ? tab.color : 'rgba(255,255,255,.14)'}`,
                  background: active ? `${tab.color}22` : 'rgba(255,255,255,.05)',
                  color: active ? tab.color : 'rgba(255,255,255,.7)',
                }}
              >
                <span className="w-[7px] h-[7px] rounded-full" style={{ background: tab.color }} />
                {t(tab.tabKey)}
              </button>
            );
          })}
        </div>

        {/* Cards：用途ごとにグループ化し、デスクトップは3列で並べてスクロールを抑える */}
        <div className="mt-7 flex flex-col gap-9">
          {visibleGroups.map((g) => (
            <section key={g.labelKey}>
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="h-4 w-1 rounded-full"
                  style={{ background: g.accent, boxShadow: `0 0 10px ${g.accent}88` }}
                />
                <h2
                  className="text-[12px] font-extrabold tracking-[0.18em] uppercase m-0"
                  style={{ color: g.accent }}
                >
                  {t(g.labelKey)}
                </h2>
                <span className="flex-1 h-px bg-white/10" />
              </div>

              {g.labelKey === 'fg.group.fieldnotes' ? (
                <>
                  {/* 体験記＝オリジナル一次情報。個別4記事へ言語対応で直リンク（1ホップ）。 */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {notesSorted.map((note) => {
                      const cat = FIELD_NOTE_CATEGORY_CONFIG[note.category];
                      return (
                        <a
                          key={note.slug}
                          href={`${langPrefix}/fivem-gtarp/field-notes/${note.category}/${note.slug}`}
                          className="group relative flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 transition-all hover:-translate-y-0.5"
                          onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${cat.color}99`)}
                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)')}
                        >
                          <div className="flex items-center gap-3 mb-2.5">
                            <span
                              className="w-10 h-10 flex-none rounded-xl flex items-center justify-center text-xl"
                              style={{
                                background: `${cat.color}1f`,
                                border: `1px solid ${cat.color}55`,
                                boxShadow: `0 0 18px ${cat.color}33`,
                              }}
                            >
                              {note.icon}
                            </span>
                            <span
                              className="text-[10.5px] font-black rounded-md px-2 py-0.5"
                              style={{ background: cat.color, color: '#0a0612' }}
                            >
                              {lang === 'en' ? cat.en : cat.ja}
                            </span>
                          </div>
                          <h3 className="text-[14.5px] font-extrabold text-white m-0 mb-1.5 leading-snug line-clamp-2">
                            {lang === 'en' ? note.titleEn : note.title}
                          </h3>
                          <p className="text-[13px] text-white/60 leading-relaxed flex-1 m-0 line-clamp-2">
                            {lang === 'en' ? note.excerptEn : note.excerpt}
                          </p>
                          <span
                            className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-bold"
                            style={{ color: cat.color }}
                          >
                            {t('fg.learnMore')}
                            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                          </span>
                        </a>
                      );
                    })}
                  </div>
                  {/* 一覧ページへの導線も併存（sitemap収録・被リンク経路として維持） */}
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[12.5px] font-bold">
                    <a
                      href={`${langPrefix}/fivem-gtarp/field-notes/dev-diary`}
                      className="inline-flex items-center gap-1 text-[#fb923c] hover:underline"
                    >
                      {lang === 'en' ? 'All dev diaries' : '開発日記の一覧'} →
                    </a>
                    <a
                      href={`${langPrefix}/fivem-gtarp/field-notes/visit-note`}
                      className="inline-flex items-center gap-1 text-[#38bdf8] hover:underline"
                    >
                      {lang === 'en' ? 'All visit notes' : '訪問記の一覧'} →
                    </a>
                  </div>
                </>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {g.cards.map((c) => {
                    const Icon = c.icon;
                    return (
                      <a
                        key={c.href}
                        href={c.href}
                        className="group relative flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 transition-all hover:-translate-y-0.5"
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${c.accent}99`)}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)')}
                      >
                        <div className="flex items-center gap-3 mb-2.5">
                          <span
                            className="w-10 h-10 flex-none rounded-xl flex items-center justify-center"
                            style={{
                              background: `${c.accent}1f`,
                              border: `1px solid ${c.accent}55`,
                              color: c.accent,
                              boxShadow: `0 0 18px ${c.accent}33`,
                            }}
                          >
                            <Icon size={20} />
                          </span>
                          <h3 className="text-[15px] font-extrabold text-white m-0">{t(c.titleKey)}</h3>
                        </div>
                        <p className="text-[13px] text-white/60 leading-relaxed flex-1 m-0">{t(c.descKey)}</p>
                        <span
                          className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-bold"
                          style={{ color: c.accent }}
                        >
                          {t('fg.learnMore')}
                          <ArrowRight
                            size={14}
                            className="transition-transform group-hover:translate-x-1"
                          />
                        </span>
                      </a>
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/10" style={{ background: 'rgba(8,6,15,.6)' }}>
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-[30px] py-8 text-center text-[11.5px] text-white/40">
          {t('footer.disclaimer')} © 2026 GTA6 FEED
        </div>
      </footer>
    </div>
  );
}
