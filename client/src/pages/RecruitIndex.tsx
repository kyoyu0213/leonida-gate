import Header from '@/components/Header';
import RecruitTabs from '@/components/RecruitTabs';
import { Server, Users, Shield, ArrowRight } from 'lucide-react';
import { useSeo } from '@/hooks/useSeo';
import { useT, useLang } from '@/lib/i18n';

// 募集掲示板のトップ（まとめ）。FiveMサーバー募集だけが入口だと「サーバー募集しか
// 無い」と誤解されるため、3カテゴリ（サーバー／フレンド／クルー）をカードで示す。
interface Cat {
  titleKey: string;
  descKey: string;
  href: string;
  icon: typeof Server;
  color: string;
}

const CATS: Cat[] = [
  { titleKey: 'recruit.servers', descKey: 'recruit.hub.servers.desc', href: '/servers', icon: Server, color: '#ff2d95' },
  { titleKey: 'board.friends', descKey: 'recruit.hub.friends.desc', href: '/board/friends', icon: Users, color: '#22d3ee' },
  { titleKey: 'board.crews', descKey: 'recruit.hub.crews.desc', href: '/board/crews', icon: Shield, color: '#ff8a3d' },
];

export default function RecruitIndex() {
  const t = useT();
  const lang = useLang();
  useSeo(`${t('recruit.hub.title')} | GTA6 FEED`, t('recruit.hub.lead'));
  const langPrefix = lang === 'en' ? '/en' : '';

  return (
    <div className="vice-page vice-noise">
      <Header />

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[100px] pb-20 relative z-10">
        {/* 募集掲示板グループの共通タブ帯 */}
        <RecruitTabs active="index" />

        {/* Hero */}
        <span className="text-xs font-extrabold tracking-[0.25em] text-[#22d3ee] uppercase">Recruitment</span>
        <h1 className="font-black text-3xl md:text-[44px] leading-tight mt-2">{t('recruit.hub.title')}</h1>
        <p className="text-white/60 text-sm md:text-[15px] mt-3 leading-relaxed max-w-[720px]">
          {t('recruit.hub.lead')}
        </p>

        {/* 3カテゴリのカード（縦並びのリスト。アイコン左・テキスト右の横型カード） */}
        <div className="mt-8 flex flex-col gap-3">
          {CATS.map((c) => {
            const Icon = c.icon;
            return (
              <a
                key={c.href}
                href={`${langPrefix}${c.href}`}
                className="group flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 sm:p-5 transition-all hover:-translate-y-0.5"
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${c.color}99`)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)')}
              >
                <span
                  className="w-11 h-11 flex-none rounded-xl flex items-center justify-center"
                  style={{
                    background: `${c.color}1f`,
                    border: `1px solid ${c.color}55`,
                    boxShadow: `0 0 18px ${c.color}33`,
                    color: c.color,
                  }}
                >
                  <Icon size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[16px] font-extrabold text-white m-0 mb-1">{t(c.titleKey)}</h2>
                  <p className="text-[13px] text-white/60 leading-relaxed m-0 line-clamp-2">{t(c.descKey)}</p>
                </div>
                <ArrowRight
                  size={18}
                  className="flex-none transition-transform group-hover:translate-x-1"
                  style={{ color: c.color }}
                />
              </a>
            );
          })}
        </div>
      </main>
    </div>
  );
}
