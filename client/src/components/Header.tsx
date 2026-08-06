import { useState } from 'react';
import { useLocation } from 'wouter';
import { Search, Menu, X } from 'lucide-react';
import LangToggle from '@/components/LangToggle';
import { isRecruitPath, isThreadBoardPath } from '@/lib/boards';
import { useT, useLang, pathForLang, stripLangPrefix } from '@/lib/i18n';

// href は日本語側の論理パス。localized:true の項目だけ、英語ページでは /en 版へ向ける。
// localized:false（掲示板・募集板）は英語版が存在しないため、英語ページでも ja へ送る。
// ここが ja 固定だったせいで、英語ページ51本のナビが全部 ja を指し、
// /en 配下がリンクグラフ上 orphan になっていた（2026-08-06 の監査で判明）。
const NAV = [
  { key: 'nav.home', href: '/', localized: true, match: (l: string) => l === '/' },
  { key: 'nav.news', href: '/news', localized: false, match: (l: string) => l.startsWith('/news') },
  { key: 'nav.servers', href: '/recruit', localized: false, match: isRecruitPath },
  { key: 'nav.board', href: '/board', localized: false, match: isThreadBoardPath },
  {
    key: 'nav.fivemgtarp',
    href: '/fivem-gtarp',
    localized: true,
    // 体験記は別項目で扱うため、ハブ側の active 判定からは field-notes 配下を除外。
    match: (l: string) => l.startsWith('/fivem-gtarp') && !l.startsWith('/fivem-gtarp/field-notes'),
  },
  {
    key: 'nav.fieldnotes',
    href: '/fivem-gtarp/field-notes/dev-diary',
    localized: true,
    match: (l: string) => l.startsWith('/fivem-gtarp/field-notes'),
  },
  { key: 'nav.contact', href: '/contact', localized: true, match: (l: string) => l.startsWith('/contact') },
];

export default function Header() {
  const [location, navigate] = useLocation();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useT();
  const lang = useLang();
  // active 判定は言語プレフィックスを外した論理パスで行う（/en/fivem-gtarp も一致させる）。
  const logicalPath = stripLangPrefix(location);
  /** ナビ項目の実リンク先。localized な項目のみ現在の言語へ寄せる。 */
  const navHref = (item: (typeof NAV)[number]) =>
    item.localized ? pathForLang(item.href, lang) : item.href;

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    // ニュース記事＋掲示板（レス本文）を横断検索する検索結果ページへ
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <header
      className="absolute md:fixed top-0 left-0 right-0 z-[60] border-b border-white/[0.08]"
      style={{
        background: 'rgba(11,7,20,.72)',
        backdropFilter: 'blur(20px) saturate(1.3)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
      }}
    >
      <div className="max-w-[1320px] mx-auto px-4 sm:px-[30px] h-[66px] flex items-center gap-3 md:gap-6">
        {/* Logo */}
        <a href={pathForLang('/', lang)} className="flex items-center flex-none cursor-pointer">
          <img
            src="/images/gta6feed-logo.webp"
            alt="GTA6 FEED"
            className="h-9 sm:h-10 w-auto select-none"
            draggable={false}
          />
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-2 lg:gap-3 flex-none">
          {NAV.map((item) => {
            const active = item.match(logicalPath);
            return (
              <a
                key={item.href}
                href={navHref(item)}
                className="relative px-1 py-1.5 text-[14px] font-bold whitespace-nowrap tracking-wide transition-colors"
                style={{ color: active ? '#fff' : '#bdb2d0' }}
              >
                {t(item.key)}
                {active && (
                  <span
                    className="absolute left-1 right-1 -bottom-[21px] h-0.5 rounded-full"
                    style={{ background: 'linear-gradient(95deg,#ff8a3d,#ff2d95)' }}
                  />
                )}
              </a>
            );
          })}
        </nav>

        {/* spacer */}
        <div className="flex-1 min-w-[8px]" />

        {/* 言語切替（PCの右上） */}
        <div className="hidden md:block flex-none">
          <LangToggle />
        </div>

        {/* Search（ログイン・新規投稿ボタンを廃止し、その位置に配置） */}
        <form
          onSubmit={onSearch}
          className="hidden sm:flex items-center gap-2 rounded-full px-3.5 py-2 min-w-0 flex-none"
          style={{
            background: 'rgba(255,255,255,.05)',
            border: '1px solid rgba(255,255,255,.1)',
            width: 'clamp(180px,24vw,320px)',
          }}
        >
          <Search size={15} className="flex-none opacity-60" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('header.search')}
            className="bg-transparent border-none outline-none text-[#f4eef8] text-[13px] w-full min-w-0 placeholder:text-white/40"
          />
        </form>

        {/* 言語切替（スマホはハンバーガーの左に常時表示） */}
        <div className="md:hidden flex-none">
          <LangToggle />
        </div>

        {/* Mobile menu toggle */}
        <button className="md:hidden text-white flex-none" onClick={() => setMenuOpen((v) => !v)}>
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile nav
          ここは {menuOpen && …} で DOM から出し入れしてよい唯一の例外：同じ NAV のリンクを
          上の Desktop nav が常時DOMに出しており（CSSの hidden md:flex で見た目だけ切替）、
          プリレンダHTMLからナビのリンクが消えることはないため。
          新しいリンクをモバイル側だけに足さないこと（生HTMLから漏れる）。 */}
      {menuOpen && (
        <nav className="md:hidden border-t border-white/10" style={{ background: 'rgba(11,7,20,.96)' }}>
          <div className="max-w-[1320px] mx-auto px-4 py-4 flex flex-col gap-4">
            {/* モバイル用の検索 */}
            <form
              onSubmit={(e) => {
                onSearch(e);
                setMenuOpen(false);
              }}
              className="flex items-center gap-2 rounded-full px-3.5 py-2"
              style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)' }}
            >
              <Search size={15} className="flex-none opacity-60" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('header.search')}
                className="bg-transparent border-none outline-none text-[#f4eef8] text-[14px] w-full min-w-0 placeholder:text-white/40"
              />
            </form>
            {NAV.map((item) => (
              <a
                key={item.href}
                href={navHref(item)}
                onClick={() => setMenuOpen(false)}
                className="text-[15px] font-bold text-[#cfc6e0] hover:text-white transition-colors"
              >
                {t(item.key)}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
