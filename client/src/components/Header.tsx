import { useState } from 'react';
import { useLocation } from 'wouter';
import { Search, Menu, X } from 'lucide-react';

const NAV = [
  { label: 'ホーム', href: '/', match: (l: string) => l === '/' },
  { label: 'GTA6最新情報', href: '/news', match: (l: string) => l.startsWith('/news') },
  { label: 'FiveMサーバー募集', href: '/servers', match: (l: string) => l.startsWith('/servers') },
  { label: '掲示板', href: '/board', match: (l: string) => l.startsWith('/board') || l.startsWith('/thread') },
  { label: 'FiveM/GTARP', href: '/fivem-gtarp', match: (l: string) => l.startsWith('/fivem-gtarp') },
  { label: 'お問い合わせ', href: '/contact', match: (l: string) => l.startsWith('/contact') },
];

export default function Header() {
  const [location, navigate] = useLocation();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    // ニュース記事＋掲示板（レス本文）を横断検索する検索結果ページへ
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[60] border-b border-white/[0.08]"
      style={{
        background: 'rgba(11,7,20,.72)',
        backdropFilter: 'blur(20px) saturate(1.3)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
      }}
    >
      <div className="max-w-[1320px] mx-auto px-4 sm:px-[30px] h-[66px] flex items-center gap-3 md:gap-6">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 flex-none cursor-pointer">
          <span
            className="w-[13px] h-[13px] rounded-full flex-none"
            style={{
              background: 'radial-gradient(circle,#fff 0%,#ff8a3d 40%,#ff2d95 80%)',
              boxShadow: '0 0 12px #ff2d95, 0 0 26px rgba(255,45,149,.6)',
            }}
          />
          <span className="vice-display vice-grad text-2xl tracking-[0.5px]">GTA6&nbsp;FEED</span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-2 lg:gap-3 flex-none">
          {NAV.map((item) => {
            const active = item.match(location);
            return (
              <a
                key={item.href}
                href={item.href}
                className="relative px-1 py-1.5 text-[14px] font-bold whitespace-nowrap tracking-wide transition-colors"
                style={{ color: active ? '#fff' : '#bdb2d0' }}
              >
                {item.label}
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
            placeholder="記事・掲示板を検索…"
            className="bg-transparent border-none outline-none text-[#f4eef8] text-[13px] w-full min-w-0 placeholder:text-white/40"
          />
        </form>

        {/* Mobile menu toggle */}
        <button className="md:hidden text-white flex-none" onClick={() => setMenuOpen((v) => !v)}>
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile nav */}
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
                placeholder="記事・掲示板を検索…"
                className="bg-transparent border-none outline-none text-[#f4eef8] text-[14px] w-full min-w-0 placeholder:text-white/40"
              />
            </form>
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="text-[15px] font-bold text-[#cfc6e0] hover:text-white transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
