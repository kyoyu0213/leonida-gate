import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import BoardTabs from '@/components/BoardTabs';
import HubPreviewList, { type PreviewItem } from '@/components/HubPreviewList';
import { BOARDS, boardColor } from '@/lib/boards';
import { listThreads, formatPostDate, type BoardThread } from '@/lib/board';
import { seedThreads } from '@/lib/ssrSeed';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { useSeo } from '@/hooks/useSeo';
import { useT, useLang } from '@/lib/i18n';

// 掲示板のトップ（まとめ）。/board を開くと先頭の板だけが出て「その板しか無い」と
// 誤解されるため、全ジャンルの板をカードで一覧する。各板は /board/:slug のまま。
//
// 各カードの下には、その板の最新スレッドを数件プレビューする。
// ビルド時は ssrSeed（③で全板ぶん取得済み）から、ブラウザではマウント後に
// listThreads で取り直す＝板ページと同じパターン。取得に失敗したら
// プレビューを出さずカードだけにフォールバックする（ページは壊さない）。
const PREVIEW_PER_BOARD = 3;

export default function BoardIndex() {
  const t = useT();
  const lang = useLang();
  useSeo(`${t('board.hub.title')} | GTA6 FEED`, t('board.hub.lead'));
  const langPrefix = lang === 'en' ? '/en' : '';

  // SSR ではシードから初期値を作る。ブラウザではシードが空なので {} 始まり。
  const [threads, setThreads] = useState<Record<string, BoardThread[]>>(() => {
    const init: Record<string, BoardThread[]> = {};
    for (const b of BOARDS) {
      const s = seedThreads(b.slug);
      if (s.length) init[b.slug] = s as BoardThread[];
    }
    return init;
  });

  useEffect(() => {
    let alive = true;
    Promise.all(
      BOARDS.map((b) =>
        listThreads(b.slug)
          .then(({ data, error }) => ({ slug: b.slug, rows: error ? [] : ((data as BoardThread[]) ?? []) }))
          // 1板の失敗で全体を落とさない
          .catch(() => ({ slug: b.slug, rows: [] as BoardThread[] })),
      ),
    ).then((res) => {
      if (!alive) return;
      const next: Record<string, BoardThread[]> = {};
      for (const r of res) if (r.rows.length) next[r.slug] = r.rows;
      // 1件も取れなかったら既存（シード）を残す
      if (Object.keys(next).length) setThreads(next);
    });
    return () => {
      alive = false;
    };
  }, []);

  const previewFor = (slug: string): PreviewItem[] =>
    (threads[slug] ?? []).slice(0, PREVIEW_PER_BOARD).map((th) => ({
      href: `${langPrefix}/thread/${th.id}`,
      title: th.title,
      meta: [
        formatPostDate(th.last_posted_at),
        lang === 'en' ? `${th.post_count} replies` : `${th.post_count} レス`,
      ],
    }));

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

        {/* 各ジャンルの板カード（縦並びのリスト。アイコン左・テキスト右の横型カード）
            プレビューのリンクを入れ子にしないよう、カードの外枠は div にして
            見出し行だけを <a> にしている（カード全体のホバーは維持）。 */}
        <div className="mt-8 flex flex-col gap-3">
          {BOARDS.map((b) => {
            const c = boardColor(b.accent);
            const items = previewFor(b.slug);
            return (
              <div
                key={b.slug}
                className="group rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 sm:p-5 transition-colors"
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${c}99`)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)')}
              >
                <a href={`${langPrefix}/board/${b.slug}`} className="flex items-center gap-4">
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

                <HubPreviewList
                  items={items}
                  color={c}
                  moreHref={`${langPrefix}/board/${b.slug}`}
                  moreLabel={lang === 'en' ? 'See all threads' : 'スレッドをすべて見る'}
                />
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
