import { useLocation } from 'wouter';
import { useLang, pathForLang, type Lang } from '@/lib/i18n';

const OPTS: { id: Lang; label: string }[] = [
  { id: 'ja', label: 'JPN' },
  { id: 'en', label: 'ENG' },
];

/**
 * 言語切替（日本語 / EN）。同一ページの別言語版URL（/en プレフィックスの有無）へ遷移する。
 * 全ページで切替可能（掲示板・servers 等も UI を英語表示できる）。
 * ※ hreflang/sitemap で正式な英語版として扱うのは対訳が実在するページのみ（routes.ts）。
 *   それ以外の /en ページは canonical を日本語版へ集約しており、UI言語の切替用途。
 */
export default function LangToggle() {
  const lang = useLang();
  const [loc, navigate] = useLocation();

  const go = (e: React.MouseEvent, l: Lang) => {
    // 修飾キー・中クリックは既定動作（別タブで開く等）に任せる。
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    if (l === lang) return;
    navigate(pathForLang(loc, l));
  };

  return (
    <div className="flex items-center rounded-full border border-white/15 overflow-hidden flex-none">
      {OPTS.map((o) => {
        const active = lang === o.id;
        return (
          // <button> ではなく <a href> で出す。button だとクローラーが辿れず、
          // ja→en の内部リンク経路がサイト内に1本も存在しない状態だった
          // （2026-08-08 の監査で /en 配下が orphan 化していた一因）。
          // クリック時は preventDefault して従来どおり SPA 遷移する＝挙動は不変。
          <a
            key={o.id}
            href={pathForLang(loc, o.id)}
            onClick={(e) => go(e, o.id)}
            aria-current={active ? 'true' : undefined}
            hrefLang={o.id}
            className="px-2.5 py-1 text-[12px] font-bold whitespace-nowrap transition-colors"
            style={{
              background: active ? 'linear-gradient(95deg,#ff8a3d,#ff2d95)' : 'transparent',
              color: active ? '#fff' : 'rgba(244,238,248,.6)',
            }}
          >
            {o.label}
          </a>
        );
      })}
    </div>
  );
}
