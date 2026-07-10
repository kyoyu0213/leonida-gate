import { useLocation } from 'wouter';
import { Home, Newspaper, MessageSquare, Server, Gamepad2 } from 'lucide-react';
import { isRecruitPath, isThreadBoardPath } from '@/lib/boards';
import { useT } from '@/lib/i18n';

interface Tab {
  key: string;
  href: string;
  icon: typeof Home;
  match: (l: string) => boolean;
}

const TABS: Tab[] = [
  { key: 'tab.home', href: '/', icon: Home, match: (l) => l === '/' },
  { key: 'tab.news', href: '/news', icon: Newspaper, match: (l) => l.startsWith('/news') },
  { key: 'tab.board', href: '/board', icon: MessageSquare, match: isThreadBoardPath },
  { key: 'tab.servers', href: '/servers', icon: Server, match: isRecruitPath },
  { key: 'tab.fivemgtarp', href: '/fivem-gtarp', icon: Gamepad2, match: (l) => l.startsWith('/fivem-gtarp') },
];

/** スマホ専用の下部固定クイックバー（sm以上では非表示）。主要動線へワンタップで飛べる。 */
export default function MobileTabBar() {
  const t = useT();
  const [location] = useLocation();

  // スレッド詳細では下部に返信ボックスが固定表示されるため、タブバーを隠す。
  // （両方が fixed bottom-0 になり、入力欄がタブバーに被って書き込めない問題の対策）
  if (location.startsWith('/thread')) return null;

  return (
    <nav
      className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 backdrop-blur-md"
      style={{
        background: 'rgba(8,6,15,.92)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <ul className="flex items-stretch">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = tab.match(location);
          return (
            <li key={tab.href} className="flex-1">
              <a
                href={tab.href}
                className="flex flex-col items-center justify-center gap-1 py-2 transition-colors"
                style={{ color: active ? '#ff2d95' : 'rgba(244,238,248,.55)' }}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10.5px] font-bold leading-none">{t(tab.key)}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
