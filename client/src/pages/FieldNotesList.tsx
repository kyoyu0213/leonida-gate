import { ArrowRight, Calendar } from 'lucide-react';
import { useRoute } from 'wouter';
import Header from '@/components/Header';
import FieldNoteTabs from '@/components/FieldNoteTabs';
import { useSeo } from '@/hooks/useSeo';
import { useLang } from '@/lib/i18n';
import {
  fieldNotes,
  FIELD_NOTE_CATEGORY_CONFIG,
  type FieldNoteCategory,
} from '@/data/fieldNotes';

// カテゴリごとの一覧ページ文言（ヒーロー見出し・リード・SEO）。
const CATEGORY_COPY: Record<
  FieldNoteCategory,
  {
    heading: string;
    headingEn: string;
    lead: string;
    leadEn: string;
    seoTitle: string;
    seoTitleEn: string;
    seoDesc: string;
    seoDescEn: string;
  }
> = {
  'dev-diary': {
    heading: 'サーバー開発日記',
    headingEn: 'Server Dev Diary',
    lead: 'GTA6 FEED運営者が、FiveMサーバーをゼロから建てていく過程をそのまま記録する開発日記の連載です。',
    leadEn:
      'A running dev-diary series in which the GTA6 FEED operator builds a FiveM server from scratch, recorded exactly as it happens.',
    seoTitle: 'FiveMサーバー開発日記｜GTA6 FEEDの体験記',
    seoTitleEn: 'FiveM Server Dev Diary | GTA6 FEED Field Notes',
    seoDesc:
      'GTA6 FEED運営者がFiveMサーバーをゼロから建てていく開発日記の一覧。txAdmin・車追加・ZeroTier・MLO・QBCoreなど、無料でできる過程を一次記録で連載します。',
    seoDescEn:
      'A list of dev-diary entries where the GTA6 FEED operator builds a FiveM server from scratch — txAdmin, add-on cars, ZeroTier, MLO, QBCore and more, recorded first-hand.',
  },
  'visit-note': {
    heading: 'サーバー訪問記',
    headingEn: 'Server Visit Notes',
    lead: 'GTA6 FEED運営者が実際にGTARPサーバーを訪ね、遊んで確かめた記録を連載していきます。',
    leadEn:
      'First-hand notes from the GTA6 FEED operator actually visiting and playing on GTARP servers.',
    seoTitle: 'GTARPサーバー訪問記｜GTA6 FEEDの体験記',
    seoTitleEn: 'GTARP Server Visit Notes | GTA6 FEED Field Notes',
    seoDesc:
      'GTA6 FEED運営者が実際にGTARPサーバーを訪ねて遊んで確かめた訪問記の一覧。実体験にもとづくサーバーの雰囲気やルールの記録を連載します。',
    seoDescEn:
      'A list of visit notes from the GTA6 FEED operator actually visiting and playing on GTARP servers — first-hand records of each server’s vibe and rules.',
  },
};

/**
 * 体験記のカテゴリ別一覧ページ。
 *   /fivem-gtarp/field-notes/dev-diary   … 開発日記
 *   /fivem-gtarp/field-notes/visit-note  … 訪問記
 * URL からカテゴリを判定し、そのカテゴリの記事だけをカードで並べる（news の一覧と同じ操作感）。
 */
export default function FieldNotesList() {
  const lang = useLang();
  const isEn = lang === 'en';
  const prefix = isEn ? '/en' : '';

  // どのカテゴリの一覧かを URL から判定（SSR/CSR 共通。Router の ssrPath で解決される）。
  const [devJa] = useRoute('/fivem-gtarp/field-notes/dev-diary');
  const [devEn] = useRoute('/en/fivem-gtarp/field-notes/dev-diary');
  const category: FieldNoteCategory = devJa || devEn ? 'dev-diary' : 'visit-note';

  const cat = FIELD_NOTE_CATEGORY_CONFIG[category];
  const copy = CATEGORY_COPY[category];

  useSeo(isEn ? copy.seoTitleEn : copy.seoTitle, isEn ? copy.seoDescEn : copy.seoDesc, {
    localized: true,
  });

  const items = fieldNotes.filter((n) => n.category === category);

  return (
    <div className="vice-page vice-noise">
      <Header />

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[100px] pb-20 relative z-10">
        {/* パンくず */}
        <nav className="flex items-center gap-1.5 text-[12px] text-white/45 mb-5" aria-label="パンくず">
          <a href={`${prefix}/fivem-gtarp`} className="hover:text-[#fb923c] transition-colors">
            FiveM / GTARP
          </a>
          <span className="opacity-50">/</span>
          <span className="text-white/60">{isEn ? cat.en : cat.ja}</span>
        </nav>

        {/* 開発日記 ⇄ サーバー訪問記 の切り替え（掲示板の RecruitTabs と同じ操作感） */}
        <FieldNoteTabs active={category} />

        {/* Hero */}
        <span className="text-xs font-extrabold tracking-[0.25em] uppercase" style={{ color: cat.color }}>
          {isEn ? 'Field Notes' : '体験記'} — {isEn ? cat.en : cat.ja}
        </span>
        <h1 className="font-black text-3xl md:text-[44px] leading-tight mt-2">
          {isEn ? copy.headingEn : copy.heading}
        </h1>
        <p className="text-white/60 text-sm md:text-[15px] mt-3 leading-relaxed max-w-[720px]">
          {isEn ? copy.leadEn : copy.lead}
        </p>

        {/* カード一覧 or 準備中 */}
        {items.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((n) => (
              <a
                key={n.slug}
                href={`${prefix}/fivem-gtarp/field-notes/${n.category}/${n.slug}`}
                className="group flex flex-col rounded-2xl overflow-hidden border border-black/10 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${cat.color}99`)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,.10)')}
              >
                <div className="relative overflow-hidden" style={{ aspectRatio: '16/10', background: '#160a22' }}>
                  <img
                    src={n.image}
                    alt={isEn ? n.titleEn : n.title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300"
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(180deg,rgba(8,6,15,0) 55%,rgba(8,6,15,.55) 100%)' }}
                  />
                  <span
                    className="absolute top-3 left-3 text-[10.5px] font-black rounded-md"
                    style={{ background: cat.color, color: '#0a0612', padding: '4px 10px' }}
                  >
                    {isEn ? cat.en : cat.ja}
                  </span>
                  <span className="absolute top-3 right-3 text-2xl">{n.icon}</span>
                </div>
                <div className="p-5 flex flex-col gap-2.5 flex-1">
                  <div className="flex items-center gap-2 text-black/45 text-[11.5px] font-semibold">
                    <Calendar size={13} />
                    <span className="vice-num">{n.date}</span>
                  </div>
                  <h2 className="text-[15px] font-extrabold text-[#15091c] leading-[1.5] m-0 line-clamp-3">
                    {isEn ? n.titleEn : n.title}
                  </h2>
                  <p className="text-[13px] text-black/55 leading-relaxed flex-1 m-0 line-clamp-3">
                    {isEn ? n.excerptEn : n.excerpt}
                  </p>
                  <span
                    className="mt-1 inline-flex items-center gap-1.5 text-[12.5px] font-bold"
                    style={{ color: cat.color }}
                  >
                    {isEn ? 'Read more' : 'くわしく見る'}
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div
            className="mt-8 rounded-2xl border border-dashed p-10 text-center"
            style={{ borderColor: `${cat.color}55`, background: `${cat.color}0f` }}
          >
            <p className="text-white/70 text-[15px] font-bold m-0">
              {isEn ? 'Coming soon.' : '準備中です。'}
            </p>
            <p className="text-white/45 text-[13px] mt-2 mb-0">
              {isEn
                ? 'The first entry in this series is being prepared. Please check back later.'
                : 'この連載の第1回を準備中です。公開までお待ちください。'}
            </p>
          </div>
        )}
      </main>

      <footer className="relative z-10 border-t border-white/10" style={{ background: 'rgba(8,6,15,.6)' }}>
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-[30px] py-8 text-center text-[11.5px] text-white/40">
          © 2026 GTA6 FEED
        </div>
      </footer>
    </div>
  );
}
