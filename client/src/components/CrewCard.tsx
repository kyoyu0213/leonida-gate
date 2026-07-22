import { Copy, ExternalLink, Shield, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import type { Crew } from '@/lib/crews';
import { CREW_GENRES, crewPlatformLabelKey } from '@/lib/crews';
import { useT } from '@/lib/i18n';

interface CrewCardProps {
  crew: Crew;
  /** ジャンルバッジのクリック（一覧の絞り込み用） */
  onGenreClick?: (id: string) => void;
  /** プラットフォームバッジのクリック（一覧の絞り込み用） */
  onPlatformClick?: (id: string) => void;
}

const isUrl = (s: string) => /^https?:\/\//i.test(s.trim());

/** クルー募集のカード（/board/crews）。1募集=1カード。 */
export default function CrewCard({ crew, onGenreClick, onPlatformClick }: CrewCardProps) {
  const tr = useT();
  const genreLabel = CREW_GENRES.find((g) => g.id === crew.genre);
  const platformLabelKey = crewPlatformLabelKey(crew.platform);
  // 既知のIDはラベル、旧・自由入力値は生値をそのまま表示。
  const platformText = platformLabelKey ? tr(platformLabelKey) : crew.platform;

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(tr('cr.card.copied'));
  };

  const meta: Array<[string, string | null]> = [
    [tr('cr.size'), crew.size],
    [tr('cr.requirements'), crew.requirements],
    [tr('cr.activeTime'), crew.active_time],
  ];

  return (
    <div className="group relative border border-[#ff8a3d]/30 rounded-2xl p-5 bg-gradient-to-br from-[#ff8a3d]/[0.05] to-[#ff2d95]/[0.05] hover:border-[#ff8a3d]/70 transition-colors flex flex-col">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <span className="w-11 h-11 rounded-xl flex-none flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg,#ff8a3d,#ff2d95)' }}>
          <Shield size={20} />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            {platformText && (
              <button
                type="button"
                onClick={onPlatformClick && platformLabelKey ? () => onPlatformClick(crew.platform!) : undefined}
                className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold text-[#c4b5fd] border border-[#a78bfa]/50 bg-[#a78bfa]/10 ${onPlatformClick && platformLabelKey ? 'cursor-pointer hover:bg-[#a78bfa]/20' : ''}`}
              >
                {platformText}
              </button>
            )}
            {genreLabel && (
              <button
                type="button"
                onClick={onGenreClick ? () => onGenreClick(genreLabel.id) : undefined}
                className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold text-[#ff8a3d] border border-[#ff8a3d]/50 bg-[#ff8a3d]/10 ${onGenreClick ? 'cursor-pointer hover:bg-[#ff8a3d]/20' : ''}`}
              >
                {tr(genreLabel.labelKey)}
              </button>
            )}
            <span className="text-[12px] font-bold text-white/60 truncate">{crew.crew_name}</span>
          </div>
          <h3 className="text-lg font-black text-[#f4eef8] leading-snug m-0 break-words">{crew.title}</h3>
        </div>
      </div>

      {/* Body */}
      <p className="text-white/70 text-sm mb-3 whitespace-pre-wrap break-words flex-grow line-clamp-4">
        {crew.body}
      </p>

      {/* Meta */}
      <div className="space-y-1 mb-3 text-[13px]">
        {meta
          .filter(([, v]) => v)
          .map(([label, v]) => (
            <div key={label} className="flex items-center justify-between gap-2">
              <span className="text-white/45 flex-none">{label}</span>
              <span className="text-white/80 text-right break-words">{v}</span>
            </div>
          ))}
      </div>

      {/* Contact + date */}
      <div className="flex items-center gap-2 pt-3 border-t border-white/10 mt-auto">
        {crew.contact ? (
          isUrl(crew.contact) ? (
            <button
              onClick={() => window.open(crew.contact!, '_blank', 'noopener')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#5865F2] hover:brightness-110 text-white font-bold text-[13px] h-9 rounded-lg transition"
            >
              <ExternalLink size={14} /> {tr('cr.card.contact')}
            </button>
          ) : (
            <button
              onClick={() => copy(crew.contact!)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white/[0.06] border border-white/15 hover:bg-white/10 text-[#f4eef8] font-bold text-[13px] h-9 rounded-lg transition"
              title={crew.contact}
            >
              <Copy size={14} /> {tr('cr.card.contact')}
            </button>
          )
        ) : (
          <span className="flex-1 text-[12px] text-white/35">{tr('cr.card.noContact')}</span>
        )}
        <span className="flex-none text-[11px] text-white/35 font-mono">{crew.created_at.slice(0, 10)}</span>
      </div>

      {/* 詳細・返信への導線 */}
      <a
        href={`/board/crews/${crew.id}`}
        className="mt-2.5 inline-flex items-center justify-center gap-1.5 text-[12px] font-bold text-[#ff8a3d] hover:text-white transition-colors"
      >
        <MessageSquare size={13} /> {tr('rep.viewDetail')}
      </a>
    </div>
  );
}
