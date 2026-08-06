import { useLocation } from 'wouter';
import { Home, Newspaper, MessageSquare, Server, Gamepad2 } from 'lucide-react';
import { isRecruitPath, isThreadBoardPath, isReplyDetailPath } from '@/lib/boards';
import { useT, useLang, pathForLang, stripLangPrefix } from '@/lib/i18n';

interface Tab {
  key: string;
  href: string;
  /** 英語版が存在するか。true の項目だけ英語ページで /en 版へ向ける。 */
  localized: boolean;
  icon: typeof Home;
  match: (l: string) => boolean;
}

const TABS: Tab[] = [
  { key: 'tab.home', href: '/', localized: true, icon: Home, match: (l) => l === '/' },
  { key: 'tab.news', href: '/news', localized: true, icon: Newspaper, match: (l) => l.startsWith('/news') },
  { key: 'tab.board', href: '/board', localized: false, icon: MessageSquare, match: isThreadBoardPath },
  { key: 'tab.servers', href: '/recruit', localized: false, icon: Server, match: isRecruitPath },
  { key: 'tab.fivemgtarp', href: '/fivem-gtarp', localized: true, icon: Gamepad2, match: (l) => l.startsWith('/fivem-gtarp') },
];

/** スマホ専用の下部固定クイックバー（sm以上では非表示）。主要動線へワンタップで飛べる。 */
export default function MobileTabBar() {
  const t = useT();
  const [location] = useLocation();
  const lang = useLang();
  // active 判定は言語プレフィックスを外した論理パスで行う。
  const logicalPath = stripLangPrefix(location);

  // 返信ボックス（fixed bottom-0）が出る詳細ページ（スレッド／フレンド募集／クルー募集）では、
  // タブバーと重なって入力欄がタップできなくなるため、タブバーを隠す。
  if (isReplyDetailPath(location)) return null;

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
          const active = tab.match(logicalPath);
          return (
            <li key={tab.href} className="flex-1">
              <a
                href={tab.localized ? pathForLang(tab.href, lang) : tab.href}
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
