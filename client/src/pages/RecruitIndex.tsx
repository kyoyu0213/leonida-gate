import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import RecruitTabs from '@/components/RecruitTabs';
import HubPreviewList, { type PreviewItem } from '@/components/HubPreviewList';
import { Server, Users, Shield, ArrowRight } from 'lucide-react';
import { useSeo } from '@/hooks/useSeo';
import { useT, useLang } from '@/lib/i18n';
import { seedFriends, seedCrews, seedServers } from '@/lib/ssrSeed';
import { listPublishedFriends, friendPlatformLabelKey } from '@/lib/friends';
import { listPublishedCrews } from '@/lib/crews';
import { listApprovedServers } from '@/lib/servers';
import SiteFooter from '@/components/SiteFooter';

// 募集掲示板のトップ（まとめ）。FiveMサーバー募集だけが入口だと「サーバー募集しか
// 無い」と誤解されるため、3カテゴリ（サーバー／フレンド／クルー）をカードで示す。
//
// 各カードの下には、そのカテゴリの最新募集を数件プレビューする。
// ビルド時は ssrSeed（③で取得済み）から、ブラウザではマウント後に取り直す。
// 取得に失敗したらプレビューを出さずカードだけにフォールバックする。
//
// 表示するのはタイトルと属性（プラットフォーム・ジャンル・タイプ）と投稿日だけ。
// 連絡先（contact / connect_info / discord_url）と投稿者名は seed に含めていない。
const PREVIEW_PER_CAT = 5;

interface Cat {
  titleKey: string;
  descKey: string;
  href: string;
  icon: typeof Server;
  color: string;
}

const CATS: Cat[] = [
  { titleKey: 'board.friends', descKey: 'recruit.hub.friends.desc', href: '/board/friends', icon: Users, color: '#22d3ee' },
  { titleKey: 'board.crews', descKey: 'recruit.hub.crews.desc', href: '/board/crews', icon: Shield, color: '#ff8a3d' },
  { titleKey: 'recruit.servers', descKey: 'recruit.hub.servers.desc', href: '/servers', icon: Server, color: '#ff2d95' },
];

/** 一覧プレビュー1行ぶんの最小形（各テーブルの差を吸収する）。 */
interface Row {
  id: string;
  title: string;
  meta: string[];
}

const shortDate = (s: string) => String(s || '').slice(0, 10);

export default function RecruitIndex() {
  const t = useT();
  const lang = useLang();
  useSeo(`${t('recruit.hub.title')} | GTA6 FEED`, t('recruit.hub.lead'));
  const langPrefix = lang === 'en' ? '/en' : '';

  const [rows, setRows] = useState<Record<string, Row[]>>(() => ({
    '/board/friends': seedFriends().map((f) => ({
      id: f.id,
      title: f.title,
      meta: [f.platform ? t(friendPlatformLabelKey(f.platform) ?? '') || f.platform : '', shortDate(f.created_at)].filter(Boolean),
    })),
    '/board/crews': seedCrews().map((c) => ({
      id: c.id,
      title: c.crew_name ? `${c.crew_name}｜${c.title}` : c.title,
      meta: [c.genre ?? '', shortDate(c.created_at)].filter(Boolean),
    })),
    '/servers': seedServers().map((s) => ({
      id: s.id,
      title: s.name,
      meta: [s.type ?? '', shortDate(s.created_at)].filter(Boolean),
    })),
  }));

  useEffect(() => {
    let alive = true;
    Promise.all([
      listPublishedFriends().then(({ data, error }) => (error ? [] : ((data as never[]) ?? []))).catch(() => []),
      listPublishedCrews().then(({ data, error }) => (error ? [] : ((data as never[]) ?? []))).catch(() => []),
      listApprovedServers().then(({ data, error }) => (error ? [] : ((data as never[]) ?? []))).catch(() => []),
    ]).then(([fr, cr, sv]) => {
      if (!alive) return;
      const next: Record<string, Row[]> = {
        '/board/friends': (fr as { id: string; title: string; platform: string | null; created_at: string }[]).map((f) => ({
          id: f.id,
          title: f.title,
          meta: [f.platform ? t(friendPlatformLabelKey(f.platform) ?? '') || f.platform : '', shortDate(f.created_at)].filter(Boolean),
        })),
        '/board/crews': (cr as { id: string; crew_name: string; title: string; genre: string | null; created_at: string }[]).map((c) => ({
          id: c.id,
          title: c.crew_name ? `${c.crew_name}｜${c.title}` : c.title,
          meta: [c.genre ?? '', shortDate(c.created_at)].filter(Boolean),
        })),
        '/servers': (sv as { id: string; name: string; type: string; created_at: string }[]).map((s) => ({
          id: s.id,
          title: s.name,
          meta: [s.type ?? '', shortDate(s.created_at)].filter(Boolean),
        })),
      };
      // 1件も取れなかったら既存（シード）を残す
      if (Object.values(next).some((v) => v.length)) setRows(next);
    });
    return () => {
      alive = false;
    };
  }, [t]);

  /** 募集は個別ページを持つもの（friends/crews）だけ詳細へ、servers は一覧へ。 */
  const previewFor = (cat: Cat): PreviewItem[] =>
    (rows[cat.href] ?? []).slice(0, PREVIEW_PER_CAT).map((r) => ({
      href:
        cat.href === '/servers'
          ? `${langPrefix}/servers`
          : `${langPrefix}${cat.href}/${r.id}`,
      title: r.title,
      meta: r.meta,
    }));

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

        {/* 3カテゴリのカード。プレビューのリンクを入れ子にしないよう、
            カードの外枠は div にして見出し行だけを <a> にしている。 */}
        <div className="mt-8 flex flex-col gap-3">
          {CATS.map((c) => {
            const Icon = c.icon;
            const items = previewFor(c);
            return (
              <div
                key={c.href}
                className="group rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 sm:p-5 transition-colors"
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${c.color}99`)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)')}
              >
                <a href={`${langPrefix}${c.href}`} className="flex items-center gap-4">
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
                    <h2 className="text-[16px] font-extrabold text-white m-0 mb-1 jp-head">{t(c.titleKey)}</h2>
                    <p className="text-[13px] text-white/60 leading-relaxed m-0 line-clamp-2">{t(c.descKey)}</p>
                  </div>
                  <ArrowRight
                    size={18}
                    className="flex-none transition-transform group-hover:translate-x-1"
                    style={{ color: c.color }}
                  />
                </a>

                <HubPreviewList
                  items={items}
                  color={c.color}
                  moreHref={`${langPrefix}${c.href}`}
                  moreLabel={lang === 'en' ? 'See all posts' : '募集をすべて見る'}
                />
              </div>
            );
          })}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
