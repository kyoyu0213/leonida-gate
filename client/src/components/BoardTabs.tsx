import { BOARDS, boardColor, type Accent } from '@/lib/boards';
import { useT } from '@/lib/i18n';

// /board 配下の共通ジャンルタブ帯。既存のスレッド型板（BOARDS）＋カード型の
// フレンド募集・クルー募集を1本の帯にまとめ、全 /board/* ページで使い回す。
interface TabItem {
  slug: string;
  href: string;
  accent: Accent;
}

// 既存タブの並びの後ろに「フレンド募集」「クルー募集」を追加する。
const EXTRA_TABS: TabItem[] = [
  { slug: 'friends', href: '/board/friends', accent: 'cyan' },
  { slug: 'crews', href: '/board/crews', accent: 'orange' },
];

interface BoardTabsProps {
  /** アクティブなタブの slug（'gtarp' / 'friends' / 'crews' など）。 */
  active: string;
}

export default function BoardTabs({ active }: BoardTabsProps) {
  const tr = useT();
  const tabs: TabItem[] = [
    ...BOARDS.map((b) => ({ slug: b.slug, href: `/board/${b.slug}`, accent: b.accent })),
    ...EXTRA_TABS,
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:overflow-x-auto pb-2 mb-5">
      {tabs.map((t) => {
        const on = t.slug === active;
        const c = boardColor(t.accent);
        return (
          <a
            key={t.slug}
            href={t.href}
            className="w-full sm:w-auto sm:flex-none flex items-center gap-2 px-5 py-2.5 rounded-[13px] text-sm font-extrabold whitespace-nowrap transition-colors"
            style={{
              border: `1px solid ${on ? c : 'rgba(255,255,255,.1)'}`,
              background: on ? `${c}1f` : 'rgba(255,255,255,.05)',
              color: on ? '#fff' : 'rgba(244,238,248,.65)',
            }}
          >
            <span className="w-2 h-2 rounded-full flex-none" style={{ background: c, boxShadow: `0 0 7px ${c}` }} />
            {tr(`board.${t.slug}`)}
          </a>
        );
      })}
    </div>
  );
}
