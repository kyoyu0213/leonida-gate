import { Copy, ExternalLink, Users, MessageSquare, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import type { Friend } from '@/lib/friends';
import {
  friendStyleLabelKey,
  friendPlatformLabelKey,
  friendPlatformAccent,
  friendPlatformCanonical,
  friendContactKindLabelKey,
  friendContactDisplay,
  friendGenderLabelKey,
} from '@/lib/friends';
import ContactBrandIcon, { contactKindFromKey, CONTACT_BRAND_COLOR } from '@/components/ContactBrandIcon';
import { formatPostDate } from '@/lib/board';
import { useT, useLang } from '@/lib/i18n';

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
  const lang = useLang();
  const styleLabelKey = friendStyleLabelKey(friend.play_style);
  const platformLabelKey = friendPlatformLabelKey(friend.platform);
  // 既知のIDはラベル、旧・自由入力値は生値をそのまま表示。
  const platformText = platformLabelKey ? tr(platformLabelKey) : friend.platform;
  const pfAccent = friendPlatformAccent(friend.platform);
  // 連絡先は種別アイコン＋IDを直接表示する（先頭のアイコンで何のIDかが分かるので種別テキストは不要）。
  // 投稿者が種類を明示（contact_kind）していればそれを優先、無ければ値＋プラットフォームから自動判定。
  const contactKindKey = friend.contact_kind
    ? `fr.ck.${friend.contact_kind}`
    : friendContactKindLabelKey(friend.contact, friend.platform);
  const contactKind = contactKindFromKey(contactKindKey);
  const brandColor = CONTACT_BRAND_COLOR[contactKind];
  const contactDisplay = friendContactDisplay(friend.contact);
  const genderLabelKey = friendGenderLabelKey(friend.gender);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(tr('fr.card.copied'));
  };

  const meta: Array<[string, string | null]> = [
    [tr('fr.gender'), genderLabelKey ? tr(genderLabelKey) : null],
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
                onClick={onPlatformClick && platformLabelKey ? () => onPlatformClick(friendPlatformCanonical(friend.platform)!) : undefined}
                className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition ${onPlatformClick && platformLabelKey ? 'cursor-pointer hover:brightness-125' : ''}`}
                style={{ color: pfAccent, borderColor: `${pfAccent}80`, background: `${pfAccent}1a` }}
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
          {/* 名前（ハンドルネーム）は誰の募集か分かる重要情報なので、アイコン付きで目立たせる。 */}
          <div className="inline-flex items-center gap-1.5 mt-1.5 max-w-full px-2 py-0.5 rounded-md bg-[#22d3ee]/10 border border-[#22d3ee]/25">
            <UserRound size={12} strokeWidth={2.5} className="text-[#22d3ee] flex-none" />
            <span className="text-[12.5px] font-bold text-[#f4eef8] truncate">{friend.author_name || '名無しさん'}</span>
          </div>
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
              className="flex-1 min-w-0 inline-flex items-center gap-1.5 px-3 bg-[#5865F2] hover:brightness-110 text-white font-bold text-[13px] h-9 rounded-lg transition"
              title={friend.contact}
            >
              <ContactBrandIcon kind={contactKind} size={15} className="flex-none" />
              <span className="truncate flex-1 text-left">{contactDisplay}</span>
              <ExternalLink size={13} className="opacity-70 flex-none" />
            </button>
          ) : (
            <button
              onClick={() => copy(friend.contact!)}
              className="flex-1 min-w-0 inline-flex items-center gap-1.5 px-3 bg-white/[0.06] border border-white/15 hover:bg-white/10 text-[#f4eef8] font-bold text-[13px] h-9 rounded-lg transition"
              title={friend.contact}
            >
              <span className="flex-none inline-flex" style={{ color: brandColor }}>
                <ContactBrandIcon kind={contactKind} size={15} />
              </span>
              <span className="truncate flex-1 text-left">{contactDisplay}</span>
              <Copy size={12} className="opacity-50 flex-none" />
            </button>
          )
        ) : (
          <span className="flex-1 text-[12px] text-white/35">{tr('fr.card.noContact')}</span>
        )}
        <span className="flex-none text-[11px] text-white/35 font-mono">{formatPostDate(friend.created_at)}</span>
      </div>

      {/* 詳細・返信への導線 */}
      <a
        href={`/board/friends/${friend.id}`}
        className="mt-2.5 inline-flex items-center justify-center gap-1.5 text-[12px] font-bold text-[#22d3ee] hover:text-white transition-colors"
      >
        <MessageSquare size={13} /> {tr('rep.viewReplies')}
        {friend.reply_count ? (lang === 'ja' ? `（${friend.reply_count}件）` : ` (${friend.reply_count})`) : ''}
      </a>
    </div>
  );
}
