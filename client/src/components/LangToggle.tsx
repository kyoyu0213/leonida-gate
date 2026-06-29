import { useLocation } from 'wouter';
import { useLang, pathForLang, stripLangPrefix, type Lang } from '@/lib/i18n';
import { isLocalizedPath } from '@/lib/routes';

const OPTS: { id: Lang; label: string }[] = [
  { id: 'ja', label: 'JPN' },
  { id: 'en', label: 'ENG' },
];

/**
 * 言語切替（日本語 / EN）。第3弾で「同一ページの別言語版URLへ遷移」する方式に変更。
 * 日英の対が無いページ（掲示板・servers 等）では切替先が無いので、現在言語以外は無効化する。
 */
export default function LangToggle() {
  const lang = useLang();
  const [loc, navigate] = useLocation();
  const localized = isLocalizedPath(stripLangPrefix(loc));

  const go = (l: Lang) => {
    if (l === lang || !localized) return;
    navigate(pathForLang(loc, l));
  };

  return (
    <div className="flex items-center rounded-full border border-white/15 overflow-hidden flex-none">
      {OPTS.map((o) => {
        const active = lang === o.id;
        // 対訳が無いページでは、現在言語以外のボタンを無効化（押しても遷移しない）。
        const disabled = !localized && !active;
        return (
          <button
            key={o.id}
            onClick={() => go(o.id)}
            aria-pressed={active}
            disabled={disabled}
            title={disabled ? 'No translation for this page' : undefined}
            className="px-2.5 py-1 text-[12px] font-bold whitespace-nowrap transition-colors disabled:cursor-not-allowed"
            style={{
              background: active ? 'linear-gradient(95deg,#ff8a3d,#ff2d95)' : 'transparent',
              color: active ? '#fff' : disabled ? 'rgba(244,238,248,.25)' : 'rgba(244,238,248,.6)',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
