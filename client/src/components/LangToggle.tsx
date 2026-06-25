import { setLang, useLang, type Lang } from '@/lib/i18n';

const OPTS: { id: Lang; label: string }[] = [
  { id: 'ja', label: '日本語' },
  { id: 'en', label: 'EN' },
];

/** 言語切替（日本語 / EN）。ヘッダー右上に置く。 */
export default function LangToggle() {
  const lang = useLang();
  return (
    <div className="flex items-center rounded-full border border-white/15 overflow-hidden flex-none">
      {OPTS.map((o) => {
        const active = lang === o.id;
        return (
          <button
            key={o.id}
            onClick={() => setLang(o.id)}
            aria-pressed={active}
            className="px-2.5 py-1 text-[12px] font-bold whitespace-nowrap transition-colors"
            style={{
              background: active ? 'linear-gradient(95deg,#ff8a3d,#ff2d95)' : 'transparent',
              color: active ? '#fff' : 'rgba(244,238,248,.6)',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
