import Header from '@/components/Header';
import { Server, Users, GitCompare, MessageSquare, ArrowRight } from 'lucide-react';
import { useSeo } from '@/hooks/useSeo';

interface Card {
  title: string;
  desc: string;
  href: string;
  icon: typeof Server;
  accent: string; // ネオン色
}

const CARDS: Card[] = [
  {
    title: 'FiveMとは？',
    desc: 'GTA5で人気を集めたカスタムサーバー環境「FiveM」について、初心者向けにわかりやすく解説。',
    href: '/fivem-gtarp/what-is-fivem',
    icon: Server,
    accent: '#22d3ee',
  },
  {
    title: 'GTARPとは？',
    desc: 'GTAの世界で警察・市民・ギャングなどの役割を演じて遊ぶ、ロールプレイ文化を解説。',
    href: '/fivem-gtarp/what-is-gtarp',
    icon: Users,
    accent: '#a78bfa',
  },
  {
    title: 'FiveMとGTARPの違い',
    desc: 'FiveMは遊ぶための土台、GTARPはその中で行われる遊び方。その違いを整理します。',
    href: '/fivem-gtarp/fivem-vs-gtarp',
    icon: GitCompare,
    accent: '#ff8a3d',
  },
  {
    title: 'GTARP掲示板',
    desc: '鯖選び、募集、雑談、RP文化について語れるGTARP専用掲示板。',
    href: '/board/gtarp',
    icon: MessageSquare,
    accent: '#ff2d95',
  },
];

export default function FivemGtarp() {
  useSeo(
    'FiveM/GTARP｜GTA6時代のロールプレイ文化・掲示板まとめ',
    'FiveMとは何か、GTARPとは何か、GTA6時代のロールプレイ文化や掲示板情報を初心者向けにまとめています。',
  );

  return (
    <div className="vice-page vice-noise">
      <Header />

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[100px] pb-20 relative z-10">
        {/* Hero */}
        <span className="text-xs font-extrabold tracking-[0.25em] text-[#22d3ee] uppercase">
          FiveM / GTARP
        </span>
        <h1 className="font-black text-3xl md:text-[44px] leading-tight mt-2">FiveM / GTARP とは</h1>
        <p className="text-white/60 text-sm md:text-[15px] mt-3 leading-relaxed max-w-[720px]">
          GTA5から続くロールプレイ(RP)文化は、GTA6時代に向けてますます広がっています。
          「FiveMって何？」「GTARPはどう遊ぶの？」という初心者向けに、基本と違いをまとめました。
          GTARP専用の掲示板もこちらから。
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
                <h2 className="text-lg font-extrabold text-white mb-1.5">{c.title}</h2>
                <p className="text-[13.5px] text-white/60 leading-relaxed flex-1 m-0">{c.desc}</p>
                <span
                  className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold"
                  style={{ color: c.accent }}
                >
                  くわしく見る
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
          本サイトは GTA6 の非公式ファンコミュニティです。Rockstar Games / Take-Two とは一切関係ありません。© 2026 GTA6 FEED
        </div>
      </footer>
    </div>
  );
}
