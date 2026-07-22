import { Copy, ExternalLink, Users, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import type { Friend } from '@/lib/friends';
import { friendStyleLabelKey, friendPlatformLabelKey } from '@/lib/friends';
import { useT } from '@/lib/i18n';

interface FriendCardProps {
  friend: Friend;
  /** 目的バッジのクリック（一覧の絞り込み用） */
  onStyleClick?: (id: string) => void;
  /** プラットフォームバッジのクリック（一覧の絞り込み用） */
  onPlatformClick?: (id: string) => void;
}

const isUrl = (s: string) => /^https?:\/\//i.test(s.trim());

/** フレンド募集のカード（/board/friends）。1募集=1カード。 */
export default function FriendCard({ friend, onStyleClick, onPlatformClick }: FriendCardProps) {
  const tr = useT();
  const styleLabelKey = friendStyleLabelKey(friend.play_style);
  const platformLabelKey = friendPlatformLabelKey(friend.platform);
  // 既知のIDはラベル、旧・自由入力値は生値をそのまま表示。
  const platformText = platformLabelKey ? tr(platformLabelKey) : friend.platform;

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(tr('fr.card.copied'));
  };

  const meta: Array<[string, string | null]> = [
    [tr('fr.voiceChat'), friend.voice_chat],
    [tr('fr.activeTime'), friend.active_time],
    [tr('fr.ageRange'), friend.age_range],
  ];

  return (
    <div className="group relative border border-[#22d3ee]/30 rounded-2xl p-5 bg-gradient-to-br from-[#22d3ee]/[0.05] to-[#a78bfa]/[0.05] hover:border-[#22d3ee]/70 transition-colors flex flex-col">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <span className="w-11 h-11 rounded-xl flex-none flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg,#22d3ee,#a78bfa)' }}>
          <Users size={20} />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            {platformText && (
              <button
                type="button"
                onClick={onPlatformClick && platformLabelKey ? () => onPlatformClick(friend.platform!) : undefined}
                className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold text-[#c4b5fd] border border-[#a78bfa]/50 bg-[#a78bfa]/10 ${onPlatformClick && platformLabelKey ? 'cursor-pointer hover:bg-[#a78bfa]/20' : ''}`}
              >
                {platformText}
              </button>
            )}
            {styleLabelKey && (
              <button
                type="button"
                onClick={onStyleClick && friend.play_style ? () => onStyleClick(friend.play_style!) : undefined}
                className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold text-[#22d3ee] border border-[#22d3ee]/50 bg-[#22d3ee]/10 ${onStyleClick ? 'cursor-pointer hover:bg-[#22d3ee]/20' : ''}`}
              >
                {tr(styleLabelKey)}
              </button>
            )}
          </div>
          <h3 className="text-lg font-black text-[#f4eef8] leading-snug m-0 break-words">{friend.title}</h3>
        </div>
      </div>

      {/* Body */}
      <p className="text-white/70 text-sm mb-3 whitespace-pre-wrap break-words flex-grow line-clamp-4">
        {friend.body}
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
        {friend.contact ? (
          isUrl(friend.contact) ? (
            <button
              onClick={() => window.open(friend.contact!, '_blank', 'noopener')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#5865F2] hover:brightness-110 text-white font-bold text-[13px] h-9 rounded-lg transition"
            >
              <ExternalLink size={14} /> {tr('fr.card.contact')}
            </button>
          ) : (
            <button
              onClick={() => copy(friend.contact!)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white/[0.06] border border-white/15 hover:bg-white/10 text-[#f4eef8] font-bold text-[13px] h-9 rounded-lg transition"
              title={friend.contact}
            >
              <Copy size={14} /> {tr('fr.card.contact')}
            </button>
          )
        ) : (
          <span className="flex-1 text-[12px] text-white/35">{tr('fr.card.noContact')}</span>
        )}
        <span className="flex-none text-[11px] text-white/35 font-mono">{friend.created_at.slice(0, 10)}</span>
      </div>

      {/* 詳細・返信への導線 */}
      <a
        href={`/board/friends/${friend.id}`}
        className="mt-2.5 inline-flex items-center justify-center gap-1.5 text-[12px] font-bold text-[#22d3ee] hover:text-white transition-colors"
      >
        <MessageSquare size={13} /> {tr('rep.viewDetail')}
      </a>
    </div>
  );
}
