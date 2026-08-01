import { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { ArrowLeft, Loader2, Copy, ExternalLink, Users } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import ThreadReplies from '@/components/ThreadReplies';
import { getFriend, deleteOwnFriend, friendStyleLabelKey, friendPlatformLabelKey, type Friend } from '@/lib/friends';
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

  const styleLabelKey = friend ? friendStyleLabelKey(friend.play_style) : null;
  const platformLabelKey = friend ? friendPlatformLabelKey(friend.platform) : null;
  const platformText = friend ? (platformLabelKey ? tr(platformLabelKey) : friend.platform) : null;

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(tr('fr.card.copied'));
  };

  // 本人による削除（削除キー or 同一ブラウザ anon_id）。
  const [delOpen, setDelOpen] = useState(false);
  const [delKey, setDelKey] = useState('');
  const [delBusy, setDelBusy] = useState(false);
  const handleDelete = async () => {
    if (!friend) return;
    setDelBusy(true);
    const { data, error } = await deleteOwnFriend(friend.id, delKey.trim() || null);
    setDelBusy(false);
    if (error) {
      toast.error(
        lang === 'ja'
          ? '削除できませんでした。削除キーが違うか、この端末では権限がありません。'
          : 'Could not delete. Wrong key, or not permitted on this device.',
      );
      return;
    }
    if (data === 'closed') {
      toast.success(lang === 'ja' ? '返信があるため「募集終了」にしました。' : 'Marked as closed (it has replies).');
      window.location.reload();
    } else {
      toast.success(lang === 'ja' ? '募集を削除しました。' : 'Your post was deleted.');
      window.location.href = '/board/friends';
    }
  };

  const meta: Array<[string, string | null | undefined]> = friend
    ? [
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

            {friend.status === 'closed' && (
              <div className="mb-5 rounded-xl border border-white/15 bg-white/[0.05] px-4 py-3 text-[13px] text-white/70">
                {lang === 'ja'
                  ? 'この募集は終了しました（募集主が締め切り）。返信の閲覧のみできます。'
                  : 'This post is closed by the author. Replies are read-only.'}
              </div>
            )}

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
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    {platformText && (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold text-[#c4b5fd] border border-[#a78bfa]/50 bg-[#a78bfa]/10">
                        {platformText}
                      </span>
                    )}
                    {styleLabelKey && (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold text-[#22d3ee] border border-[#22d3ee]/50 bg-[#22d3ee]/10">
                        {tr(styleLabelKey)}
                      </span>
                    )}
                  </div>
                  <h1 className="font-black text-2xl md:text-[30px] leading-snug m-0 break-words">
                    {friend.title}
                  </h1>
                  <p className="text-[12px] text-white/40 mt-1 font-mono">{(friend.author_name || '名無しさん')}・{friend.created_at.slice(0, 10)}</p>
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

            {/* 本人による削除（削除キー or 同一ブラウザ）。できない人向けに依頼リンクも残す。 */}
            {friend.status !== 'closed' && (
              <div className="mb-6 -mt-2 px-1">
                {!delOpen ? (
                  <button
                    type="button"
                    onClick={() => setDelOpen(true)}
                    className="text-[12px] text-white/45 hover:text-[#22d3ee] underline underline-offset-2 transition-colors"
                  >
                    {lang === 'ja' ? '自分の投稿を削除する' : 'Delete my post'}
                  </button>
                ) : (
                  <div className="rounded-xl border border-white/12 bg-white/[0.03] p-4 max-w-[460px]">
                    <p className="text-[12px] text-white/60 mb-2">
                      {lang === 'ja'
                        ? '投稿時に削除キーを設定した場合は入力してください（同じ端末・ブラウザなら空欄でOK）。'
                        : 'Enter your delete key (leave blank if using the same device/browser).'}
                    </p>
                    <input
                      type="text"
                      value={delKey}
                      onChange={(e) => setDelKey(e.target.value)}
                      placeholder={lang === 'ja' ? '削除キー' : 'Delete key'}
                      maxLength={60}
                      className="w-full bg-white/[0.05] border border-white/15 rounded-lg px-3 py-2 text-[#f4eef8] text-sm mb-3 focus:outline-none focus:border-[#22d3ee]/60"
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={delBusy}
                        className="inline-flex items-center gap-1.5 bg-[#ff2d95]/90 hover:bg-[#ff2d95] text-white font-bold text-[13px] px-4 h-9 rounded-lg transition disabled:opacity-60"
                      >
                        {delBusy ? (lang === 'ja' ? '処理中…' : 'Working…') : lang === 'ja' ? '削除する' : 'Delete'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDelOpen(false)}
                        className="text-[12px] text-white/50 hover:text-white px-2 h-9"
                      >
                        {lang === 'ja' ? 'キャンセル' : 'Cancel'}
                      </button>
                    </div>
                    <p className="text-[11px] text-white/40 mt-3">
                      {lang === 'ja'
                        ? '※ 返信が付いている募集は、完全削除ではなく「募集終了」になります。キーを忘れた場合は '
                        : '※ Posts with replies become “closed” instead of deleted. Forgot your key? '}
                      <a href={`/contact?ref=friends/${friend.id}`} className="underline hover:text-[#22d3ee]">
                        {lang === 'ja' ? '編集・削除を依頼' : 'request removal'}
                      </a>
                      {lang === 'ja' ? ' からご連絡ください。' : ''}
                    </p>
                  </div>
                )}
              </div>
            )}

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
