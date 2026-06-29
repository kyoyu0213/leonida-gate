import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useLang, prefersEnglish, pathForLang, stripLangPrefix } from '@/lib/i18n';
import { isLocalizedPath } from '@/lib/routes';

const DISMISS_KEY = 'lang_banner_dismissed';

/**
 * 英語ブラウザのユーザーが「英語版が実在する日本語ページ」に来たときだけ出す、手動の案内。
 * - 押下で同一ページの英語版（/en/...）へ遷移（トップではなく対応ページ）。
 * - 自動リダイレクトはしない（クローラーを巻き込まないため）。
 * - 閉じる/英語へ遷移したら再表示しない（localStorage 記憶）。
 * - 英語版が無いページ（掲示板等）では出さない。
 */
export default function LangBanner() {
  const [loc, navigate] = useLocation();
  const lang = useLang();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (lang !== 'ja' || !isLocalizedPath(stripLangPrefix(loc))) {
      setShow(false);
      return;
    }
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      /* ignore */
    }
    setShow(!dismissed && prefersEnglish());
  }, [loc, lang]);

  if (!show) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-20 md:bottom-4 z-[80] flex justify-center px-3 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/15 bg-[#160d24]/95 px-4 py-2.5 shadow-lg backdrop-blur">
        <span className="text-[13px] text-white/80">This page is available in English.</span>
        <button
          onClick={() => {
            dismiss();
            navigate(pathForLang(loc, 'en'));
          }}
          className="text-[12.5px] font-bold text-[#22d3ee] hover:text-white transition-colors whitespace-nowrap"
        >
          View in English →
        </button>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="text-white/40 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
