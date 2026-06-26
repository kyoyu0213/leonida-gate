import Header from '@/components/Header';
import { Server, Users, GitCompare, MessageSquare, Compass, Download, History, ArrowRight } from 'lucide-react';
import { useSeo } from '@/hooks/useSeo';
import { useT } from '@/lib/i18n';

interface Card {
  titleKey: string;
  descKey: string;
  href: string;
  icon: typeof Server;
  accent: string; // ネオン色
}

const CARDS: Card[] = [
  {
    titleKey: 'fg.card.fivem.title',
    descKey: 'fg.card.fivem.desc',
    href: '/fivem-gtarp/what-is-fivem',
    icon: Server,
    accent: '#22d3ee',
  },
  {
    titleKey: 'fg.card.gtarp.title',
    descKey: 'fg.card.gtarp.desc',
    href: '/fivem-gtarp/what-is-gtarp',
    icon: Users,
    accent: '#a78bfa',
  },
  {
    titleKey: 'fg.card.diff.title',
    descKey: 'fg.card.diff.desc',
    href: '/fivem-gtarp/fivem-vs-gtarp',
    icon: GitCompare,
    accent: '#ff8a3d',
  },
  {
    titleKey: 'fg.card.history.title',
    descKey: 'fg.card.history.desc',
    href: '/fivem-gtarp/history',
    icon: History,
    accent: '#f0b429',
  },
  {
    titleKey: 'fg.card.install.title',
    descKey: 'fg.card.install.desc',
    href: '/fivem-gtarp/how-to-install',
    icon: Download,
    accent: '#38bdf8',
  },
  {
    titleKey: 'fg.card.guide.title',
    descKey: 'fg.card.guide.desc',
    href: '/fivem-gtarp/server-guide',
    icon: Compass,
    accent: '#3de0a0',
  },
  {
    titleKey: 'fg.card.board.title',
    descKey: 'fg.card.board.desc',
    href: '/board/gtarp',
    icon: MessageSquare,
    accent: '#ff2d95',
  },
];

export default function FivemGtarp() {
  const t = useT();
  useSeo(t('fg.seo.title'), t('fg.seo.desc'));

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

        {/* Cards */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {CARDS.map((c) => {
            const Icon = c.icon;
            return (
              <a
                key={c.href}
                href={c.href}
                className="group relative flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 transition-all hover:-translate-y-0.5"
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${c.accent}99`)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)')}
              >
                <span
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{
                    background: `${c.accent}1f`,
                    border: `1px solid ${c.accent}55`,
                    color: c.accent,
                    boxShadow: `0 0 18px ${c.accent}33`,
                  }}
                >
                  <Icon size={22} />
                </span>
                <h2 className="text-lg font-extrabold text-white mb-1.5">{t(c.titleKey)}</h2>
                <p className="text-[13.5px] text-white/60 leading-relaxed flex-1 m-0">{t(c.descKey)}</p>
                <span
                  className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold"
                  style={{ color: c.accent }}
                >
                  {t('fg.learnMore')}
                  <ArrowRight
                    size={15}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </span>
              </a>
            );
          })}
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
