import { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { ArrowLeft, Loader2, Copy, ExternalLink, Users } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import ThreadReplies from '@/components/ThreadReplies';
import { getFriend, FRIEND_PLAY_STYLES, type Friend } from '@/lib/friends';
import { useT, useLang } from '@/lib/i18n';
import { useSeo } from '@/hooks/useSeo';

const isUrl = (s: string) => /^https?:\/\//i.test(s.trim());

export default function FriendDetail() {
  const tr = useT();
  const lang = useLang();
  const [, paramsJa] = useRoute('/board/friends/:id');
  const [, paramsEn] = useRoute('/en/board/friends/:id');
  const id = paramsJa?.id ?? paramsEn?.id;

  const [friend, setFriend] = useState<Friend | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // 詳細は自己参照 canonical（一覧に集約しない）。sitemap/prerender 非対象は /thread と同じ。
  useSeo(
    friend?.title ? `${friend.title}｜${tr('fr.heading')}｜GTA6 FEED` : tr('fr.heading'),
    friend?.body?.slice(0, 120) || tr('seo.friends.desc'),
    { url: id ? `/board/friends/${id}` : undefined },
  );

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getFriend(id).then(({ data, error }) => {
      if (error || !data) setNotFound(true);
      else {
        setFriend(data as Friend);
        setNotFound(false);
      }
      setLoading(false);
    });
  }, [id]);

  const styleLabel = friend
    ? FRIEND_PLAY_STYLES.find((s) => s.id === friend.play_style)
    : undefined;

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(tr('fr.card.copied'));
  };

  const meta: Array<[string, string | null | undefined]> = friend
    ? [
        [tr('fr.platform'), friend.platform],
        [tr('fr.voiceChat'), friend.voice_chat],
        [tr('fr.activeTime'), friend.active_time],
        [tr('fr.ageRange'), friend.age_range],
      ]
    : [];

  return (
    <div className="vice-page vice-noise">
      <Header />
      <main className="max-w-[860px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[100px] pb-32 relative z-10">
        {loading ? (
          <div className="text-center py-16 text-white/50">
            <Loader2 size={28} className="mx-auto mb-4 animate-spin" /> {tr('fr.loading')}
          </div>
        ) : notFound || !friend ? (
          <div className="text-center py-16">
            <p className="text-white/60 mb-4">{tr('fr.notFound')}</p>
            <a href="/board/friends" className="text-[#22d3ee] hover:text-white font-bold">
              {tr('fr.backToList')}
            </a>
          </div>
        ) : (
          <>
            <a
              href="/board/friends"
              className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-[13px] font-bold mb-5 transition-colors"
            >
              <ArrowLeft size={15} /> {tr('fr.backToList')}
            </a>

            {/* card header */}
            <div className="rounded-2xl border border-[#22d3ee]/25 bg-gradient-to-br from-[#22d3ee]/[0.06] to-[#a78bfa]/[0.06] p-6 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <span
                  className="w-12 h-12 rounded-xl flex-none flex items-center justify-center text-white"
                  style={{ background: 'linear-gradient(135deg,#22d3ee,#a78bfa)' }}
                >
                  <Users size={22} />
                </span>
                <div className="min-w-0">
                  {styleLabel && (
                    <span className="inline-block px-2.5 py-0.5 mb-1 rounded-full text-[11px] font-bold text-[#22d3ee] border border-[#22d3ee]/50 bg-[#22d3ee]/10">
                      {tr(styleLabel.labelKey)}
                    </span>
                  )}
                  <h1 className="font-black text-2xl md:text-[30px] leading-snug m-0 break-words">
                    {friend.title}
                  </h1>
                  <p className="text-[12px] text-white/40 mt-1 font-mono">{friend.created_at.slice(0, 10)}</p>
                </div>
              </div>

              <p className="text-white/85 text-[15px] leading-[1.8] whitespace-pre-wrap break-words mb-4">
                {friend.body}
              </p>

              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[13px] mb-4">
                {meta
                  .filter(([, v]) => v)
                  .map(([label, v]) => (
                    <div key={label} className="flex items-center justify-between gap-2 border-b border-white/[0.06] py-1">
                      <span className="text-white/45 flex-none">{label}</span>
                      <span className="text-white/85 text-right break-words">{v}</span>
                    </div>
                  ))}
              </div>

              {friend.contact &&
                (isUrl(friend.contact) ? (
                  <button
                    onClick={() => window.open(friend.contact!, '_blank', 'noopener')}
                    className="inline-flex items-center gap-1.5 bg-[#5865F2] hover:brightness-110 text-white font-bold text-[13px] px-4 h-9 rounded-lg transition"
                  >
                    <ExternalLink size={14} /> {tr('fr.card.contact')}
                  </button>
                ) : (
                  <button
                    onClick={() => copy(friend.contact!)}
                    className="inline-flex items-center gap-1.5 bg-white/[0.06] border border-white/15 hover:bg-white/10 text-[#f4eef8] font-bold text-[13px] px-4 h-9 rounded-lg transition"
                    title={friend.contact}
                  >
                    <Copy size={14} /> {tr('fr.card.contact')}: {friend.contact}
                  </button>
                ))}
            </div>

            {/* replies (post #1 は本文の複製なので #2 以降を表示) */}
            <h2 className="text-sm font-extrabold text-white/70 mb-1 px-1">
              {lang === 'en' ? 'Replies' : '返信'}
            </h2>
            {friend.thread_id ? (
              <ThreadReplies threadId={friend.thread_id} startNumber={2} />
            ) : (
              <p className="text-white/40 text-sm py-8 text-center">{tr('rep.empty')}</p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
