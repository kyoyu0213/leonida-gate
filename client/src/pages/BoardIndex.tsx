import Header from '@/components/Header';
import BoardTabs from '@/components/BoardTabs';
import { BOARDS, boardColor } from '@/lib/boards';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { useSeo } from '@/hooks/useSeo';
import { useT, useLang } from '@/lib/i18n';

// 掲示板のトップ（まとめ）。/board を開くと先頭の板だけが出て「その板しか無い」と
// 誤解されるため、全ジャンルの板をカードで一覧する。各板は /board/:slug のまま。
export default function BoardIndex() {
  const t = useT();
  const lang = useLang();
  useSeo(`${t('board.hub.title')} | GTA6 FEED`, t('board.hub.lead'));
  const langPrefix = lang === 'en' ? '/en' : '';

  return (
    <div className="vice-page vice-noise">
      <Header />

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[100px] pb-20 relative z-10">
        {/* 掲示板グループの共通タブ帯 */}
        <BoardTabs active="index" />

        {/* Hero */}
        <span className="text-xs font-extrabold tracking-[0.25em] text-[#22d3ee] uppercase">Community Board</span>
        <h1 className="font-black text-3xl md:text-[44px] leading-tight mt-2">{t('board.hub.title')}</h1>
        <p className="text-white/60 text-sm md:text-[15px] mt-3 leading-relaxed max-w-[720px]">
          {t('board.hub.lead')}
        </p>

        {/* 各ジャンルの板カード */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BOARDS.map((b) => {
            const c = boardColor(b.accent);
            return (
              <a
                key={b.slug}
                href={`${langPrefix}/board/${b.slug}`}
                className="group relative flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 transition-all hover:-translate-y-0.5"
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${c}99`)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)')}
              >
                <span
                  className="w-11 h-11 flex-none rounded-xl flex items-center justify-center mb-3"
                  style={{
                    background: `${c}1f`,
                    border: `1px solid ${c}55`,
                    boxShadow: `0 0 18px ${c}33`,
                    color: c,
                  }}
                >
                  <MessageSquare size={20} />
                </span>
                <h2 className="text-[16px] font-extrabold text-white m-0 mb-1.5">{t(`board.${b.slug}`)}</h2>
                <p className="text-[13px] text-white/60 leading-relaxed flex-1 m-0 line-clamp-3">{b.description}</p>
                <span
                  className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-bold"
                  style={{ color: c }}
                >
                  {t('recruit.hub.view')}
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </span>
              </a>
            );
          })}
        </div>
      </main>
    </div>
  );
}
