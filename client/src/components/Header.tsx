import { useState } from 'react';
import { useLocation } from 'wouter';
import { Search, Menu, X } from 'lucide-react';
import LangToggle from '@/components/LangToggle';
import { isRecruitPath, isThreadBoardPath } from '@/lib/boards';
import { useT, useLang, pathForLang, stripLangPrefix } from '@/lib/i18n';
import { WIKI_RELEASED } from '@/data/wiki/release';
import { WIKI_BASE, WIKI_NAME } from '@/data/wiki/categories';

interface NavItem {
  key: string;
  /** 辞書を通さない固定ラベル（日本語のみのページ用）。無ければ t(key)。 */
  label?: string;
  href: string;
  localized: boolean;
  match: (l: string) => boolean;
}

// href は日本語側の論理パス。localized:true の項目だけ、英語ページでは /en 版へ向ける。
// localized:false（掲示板・募集板）は英語版が存在しないため、英語ページでも ja へ送る。
// ここが ja 固定だったせいで、英語ページ51本のナビが全部 ja を指し、
// /en 配下がリンクグラフ上 orphan になっていた（2026-08-06 の監査で判明）。
const NAV: NavItem[] = [
  { key: 'nav.home', href: '/', localized: true, match: (l: string) => l === '/' },
  // GTA6本編のニュース。GTARP専用一覧（/news/gtarp）は別項目なので active 判定から外す。
  {
    key: 'nav.news',
    href: '/news',
    localized: true,
    match: (l: string) => l.startsWith('/news') && !l.startsWith('/news/gtarp'),
  },
  {
    key: 'nav.gtarpnews',
    href: '/news/gtarp',
    localized: true,
    match: (l: string) => l.startsWith('/news/gtarp'),
  },
  // GTA6まとめWiki（日本語のみ）。公開フラグ（data/wiki/release.ts）が立つまで出さない。
  ...(WIKI_RELEASED
    ? [
        {
          key: 'nav.wiki',
          label: WIKI_NAME,
          href: WIKI_BASE,
          localized: false,
          match: (l: string) => l === WIKI_BASE || l.startsWith(`${WIKI_BASE}/`),
        },
      ]
    : []),
  // RPまとめWiki（/fivem-gtarp ハブ。ページの H1 は「GTARPまとめWiki」）。「RPニュース」と表記を揃える。
  // Wikiの右隣に置く。ラベルは固定（i18n 非依存）。
  {
    key: 'nav.fivemgtarp',
    label: 'RPまとめWiki',
    href: '/fivem-gtarp',
    localized: true,
    // 体験記（/fivem-gtarp/field-notes/...）はヘッダーの常設項目から外し（㊿）、ハブ配下のコンテンツとして
    // この項目をアクティブにする。体験記へはハブ（最新カード＋一覧リンク）とトップから辿れる。
    match: (l: string) => l.startsWith('/fivem-gtarp'),
  },
  { key: 'nav.servers', href: '/recruit', localized: false, match: isRecruitPath },
  { key: 'nav.board', href: '/board', localized: false, match: isThreadBoardPath },
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
  const navHref = (item: NavItem) => (item.localized ? pathForLang(item.href, lang) : item.href);
  const navLabel = (item: NavItem) => item.label ?? t(item.key);

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
      {/* ナビが9項目（GTA6まとめWiki／GTARPまとめWiki）になり、固定幅の検索欄がデスクトップの全幅で
          はみ出していたため、ナビの余白を詰め、検索欄は空き幅に合わせて縮むようにしている（㊾）。 */}
      <div className="max-w-[1320px] mx-auto px-4 sm:px-[30px] h-[66px] flex items-center gap-3 md:gap-3.5">
        {/* Logo */}
        <a href={pathForLang('/', lang)} className="flex items-center flex-none cursor-pointer">
          <img
            src="/images/gta6feed-logo.webp"
            alt="GTA6 FEED"
            className="h-9 sm:h-10 w-auto select-none"
            draggable={false}
          />
        </a>

        {/* Desktop nav（それぞれを四角いボタンにして区切りを付ける） */}
        <nav className="hidden md:flex items-center gap-[3px] flex-none">
          {NAV.map((item) => {
            const active = item.match(logicalPath);
            return (
              <a
                key={item.href}
                href={navHref(item)}
                className={`px-2.5 py-1.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-all ${
                  active
                    ? 'text-white'
                    : 'text-[#cfc6e0] bg-white/[0.05] hover:bg-white/[0.12] hover:text-white'
                }`}
                style={
                  active
                    ? { background: 'linear-gradient(95deg,#ff8a3d,#ff2d95)', boxShadow: '0 2px 14px rgba(255,45,149,.35)' }
                    : undefined
                }
              >
                {navLabel(item)}
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
          // 幅は固定せず、空き幅に合わせて縮む（最大320px）。固定幅だとナビが長いときにヘッダーからはみ出す。
          className="hidden sm:flex flex-auto items-center gap-2 rounded-full px-3.5 py-2 min-w-0 max-w-[320px]"
          style={{
            background: 'rgba(255,255,255,.05)',
            border: '1px solid rgba(255,255,255,.1)',
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
                {navLabel(item)}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
