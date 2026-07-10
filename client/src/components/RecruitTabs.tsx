import { boardColor, type Accent } from '@/lib/boards';
import { useT } from '@/lib/i18n';

// 「募集掲示板」グループ（カード式の3板）のタブ帯。
// ここの FiveMサーバー募集は /servers であって、スレッド式の /board/gtarp-servers とは別物。
interface TabItem {
  /** i18n キー。 */
  labelKey: string;
  /** アクティブ判定に使う識別子。 */
  id: string;
  href: string;
  accent: Accent;
}

const TABS: TabItem[] = [
  { id: 'servers', labelKey: 'recruit.servers', href: '/servers', accent: 'pink' },
  { id: 'friends', labelKey: 'board.friends', href: '/board/friends', accent: 'cyan' },
  { id: 'crews', labelKey: 'board.crews', href: '/board/crews', accent: 'orange' },
];

interface RecruitTabsProps {
  /** アクティブなタブ（'servers' / 'friends' / 'crews'）。 */
  active: string;
}

export default function RecruitTabs({ active }: RecruitTabsProps) {
  const tr = useT();

  // 横スクロールはさせず、収まらない分は折り返す（BoardTabs と同じ見せ方）。
  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-5">
      {TABS.map((t) => {
        const on = t.id === active;
        const c = boardColor(t.accent);
        return (
          <a
            key={t.id}
            href={t.href}
            className="flex-none inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-[12px] sm:text-[13px] font-extrabold whitespace-nowrap transition-colors"
            style={{
              border: `1px solid ${on ? c : 'rgba(255,255,255,.1)'}`,
              background: on ? `${c}1f` : 'rgba(255,255,255,.05)',
              color: on ? '#fff' : 'rgba(244,238,248,.65)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: c, boxShadow: `0 0 6px ${c}` }} />
            {tr(t.labelKey)}
          </a>
        );
      })}
    </div>
  );
}
