import Header from '@/components/Header';
import { ImageDown, EyeOff, ArrowRight, ChevronLeft } from 'lucide-react';
import { useSeo } from '@/hooks/useSeo';
import { useT } from '@/lib/i18n';

// 便利ツール一覧。FiveM/GTARPページ下部の「便利ツール」セクションと同じ2カードを並べる軽い一覧。
// カードの体裁は FivemGtarp.tsx のものを踏襲している。
const CARDS = [
  { titleKey: 'fg.card.imageResize.title', descKey: 'fg.card.imageResize.desc', href: '/fivem-gtarp/tools/image-resize', icon: ImageDown, accent: '#2de2e6' },
  { titleKey: 'fg.card.imageMask.title', descKey: 'fg.card.imageMask.desc', href: '/fivem-gtarp/tools/image-mask', icon: EyeOff, accent: '#ff2d95' },
];

export default function ToolsIndex() {
  const t = useT();
  useSeo(t('tools.index.seo.title'), t('tools.index.seo.desc'));

  return (
    <div className="vice-page vice-noise">
      <Header />

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[100px] pb-20 relative z-10">
        <a
          href="/fivem-gtarp"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-white/50 hover:text-white transition-colors"
        >
          <ChevronLeft size={15} />
          {t('tools.index.back')}
        </a>

        <span className="block text-xs font-extrabold tracking-[0.25em] text-[#ff2d95] uppercase mt-6">
          FiveM / GTARP
        </span>
        <h1 className="font-black text-3xl md:text-[44px] leading-tight mt-2">{t('fg.group.tools')}</h1>
        <p className="text-white/60 text-sm md:text-[15px] mt-3 leading-relaxed max-w-[720px]">
          {t('tools.index.lead')}
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((c) => {
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
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
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
