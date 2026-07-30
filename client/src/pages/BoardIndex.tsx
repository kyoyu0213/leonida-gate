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

        {/* 各ジャンルの板カード（縦並びのリスト。アイコン左・テキスト右の横型カード） */}
        <div className="mt-8 flex flex-col gap-3">
          {BOARDS.map((b) => {
            const c = boardColor(b.accent);
            return (
              <a
                key={b.slug}
                href={`${langPrefix}/board/${b.slug}`}
                className="group flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 sm:p-5 transition-all hover:-translate-y-0.5"
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${c}99`)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)')}
              >
                <span
                  className="w-11 h-11 flex-none rounded-xl flex items-center justify-center"
                  style={{
                    background: `${c}1f`,
                    border: `1px solid ${c}55`,
                    boxShadow: `0 0 18px ${c}33`,
                    color: c,
                  }}
                >
                  <MessageSquare size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[16px] font-extrabold text-white m-0 mb-1">{t(`board.${b.slug}`)}</h2>
                  <p className="text-[13px] text-white/60 leading-relaxed m-0 line-clamp-2">{b.description}</p>
                </div>
                <ArrowRight
                  size={18}
                  className="flex-none transition-transform group-hover:translate-x-1"
                  style={{ color: c }}
                />
              </a>
            );
          })}
        </div>
      </main>
    </div>
  );
}
