import { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { ArrowLeft, Loader2, Copy, ExternalLink, Users } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import ThreadReplies from '@/components/ThreadReplies';
import {
  getFriend,
  deleteOwnFriend,
  updateOwnFriend,
  friendStyleLabelKey,
  friendPlatformLabelKey,
  FRIEND_PLAY_STYLES,
  FRIEND_PLATFORMS,
  type Friend,
} from '@/lib/friends';
import { useT, useLang } from '@/lib/i18n';
import { useSeo } from '@/hooks/useSeo';

const isUrl = (s: string) => /^https?:\/\//i.test(s.trim());

// 編集フォームの入力欄（削除フォームの入力欄と同じ見た目に合わせる）
const editInput =
  'w-full bg-white/[0.05] border border-white/15 rounded-lg px-3 py-2 text-[#f4eef8] text-sm focus:outline-none focus:border-[#22d3ee]/60';

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

  // 本人による編集（認可は削除と同じ：削除キー or 同一ブラウザ anon_id）。
  const [editOpen, setEditOpen] = useState(false);
  const [editKey, setEditKey] = useState('');
  const [editBusy, setEditBusy] = useState(false);
  const [editForm, setEditForm] = useState({
    author_name: '',
    title: '',
    platform: '',
    play_style: '',
    voice_chat: '',
    active_time: '',
    age_range: '',
    contact: '',
    body: '',
  });

  // 現在の値を初期値にして編集フォームを開く。
  const openEdit = () => {
    if (!friend) return;
    setEditForm({
      author_name: friend.author_name ?? '',
      title: friend.title,
      platform: friend.platform ?? '',
      play_style: friend.play_style ?? '',
      voice_chat: friend.voice_chat ?? '',
      active_time: friend.active_time ?? '',
      age_range: friend.age_range ?? '',
      contact: friend.contact ?? '',
      body: friend.body,
    });
    setEditOpen(true);
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friend) return;
    if (!editForm.title.trim() || !editForm.body.trim()) {
      toast.error(tr('fr.toast.titleBodyReq'));
      return;
    }
    if (!editForm.platform) {
      toast.error(tr('fr.toast.platformReq'));
      return;
    }
    setEditBusy(true);
    const { error } = await updateOwnFriend(
      friend.id,
      {
        title: editForm.title.trim(),
        platform: editForm.platform.trim() || null,
        play_style: editForm.play_style || null,
        voice_chat: editForm.voice_chat.trim() || null,
        active_time: editForm.active_time.trim() || null,
        age_range: editForm.age_range.trim() || null,
        body: editForm.body.trim(),
        contact: editForm.contact.trim() || null,
        author_name: editForm.author_name.trim() || null,
      },
      editKey.trim() || null,
    );
    setEditBusy(false);
    if (error) {
      // 禁止ワードだけは理由が分かるように出し分ける（それ以外は認可失敗の案内）。
      toast.error(
        error.message?.includes('banned word')
          ? lang === 'ja'
            ? '禁止ワードが含まれているため保存できません。'
            : 'Could not save: it contains a banned word.'
          : lang === 'ja'
            ? '保存できませんでした。削除キーが違うか、この端末では権限がありません。'
            : 'Could not save. Wrong key, or not permitted on this device.',
      );
      return;
    }
    toast.success(lang === 'ja' ? '募集を更新しました。' : 'Your post was updated.');
    window.location.reload();
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

            {/* 本人による編集・削除（削除キー or 同一ブラウザ）。できない人向けに依頼リンクも残す。 */}
            {friend.status !== 'closed' && (
              <div className="mb-6 -mt-2 px-1">
                {editOpen ? (
                  <form onSubmit={handleEdit} className="rounded-xl border border-white/12 bg-white/[0.03] p-4 max-w-[560px] space-y-3">
                    <p className="text-[13px] font-bold text-[#22d3ee]">
                      {lang === 'ja' ? '募集を編集する' : 'Edit your post'}
                    </p>
                    <div>
                      <label className="block text-[12px] font-bold text-white/60 mb-1">{lang === 'ja' ? '名前（任意）' : 'Name (optional)'}</label>
                      <input name="author_name" value={editForm.author_name} onChange={handleEditChange} placeholder={lang === 'ja' ? '未入力なら「名無しさん」' : 'Defaults to “名無しさん”'} maxLength={40} className={editInput} />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-white/60 mb-1">{tr('fr.title')}</label>
                      <input name="title" value={editForm.title} onChange={handleEditChange} maxLength={80} className={editInput} />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[12px] font-bold text-white/60 mb-1">{tr('fr.platform')}</label>
                        <select name="platform" value={editForm.platform} onChange={handleEditChange} className={`${editInput} h-[38px]`}>
                          <option value="" className="bg-[#15091c]">{tr('fr.pf.select')}</option>
                          {FRIEND_PLATFORMS.map((p) => (
                            <option key={p.id} value={p.id} className="bg-[#15091c]">{tr(p.labelKey)}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[12px] font-bold text-white/60 mb-1">{tr('fr.playStyle')}</label>
                        <select name="play_style" value={editForm.play_style} onChange={handleEditChange} className={`${editInput} h-[38px]`}>
                          {/* 旧データ（未設定・旧カテゴリ）で表示と値がずれないようにする */}
                          <option value="" className="bg-[#15091c]">{lang === 'ja' ? '未設定' : 'Not set'}</option>
                          {FRIEND_PLAY_STYLES.map((s) => (
                            <option key={s.id} value={s.id} className="bg-[#15091c]">{tr(s.labelKey)}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[12px] font-bold text-white/60 mb-1">{tr('fr.voiceChat')}</label>
                        <input name="voice_chat" value={editForm.voice_chat} onChange={handleEditChange} maxLength={30} className={editInput} />
                      </div>
                      <div>
                        <label className="block text-[12px] font-bold text-white/60 mb-1">{tr('fr.activeTime')}</label>
                        <input name="active_time" value={editForm.active_time} onChange={handleEditChange} maxLength={40} className={editInput} />
                      </div>
                      <div>
                        <label className="block text-[12px] font-bold text-white/60 mb-1">{tr('fr.ageRange')}</label>
                        <input name="age_range" value={editForm.age_range} onChange={handleEditChange} maxLength={30} className={editInput} />
                      </div>
                      <div>
                        <label className="block text-[12px] font-bold text-white/60 mb-1">{tr('fr.contact')}</label>
                        <input name="contact" value={editForm.contact} onChange={handleEditChange} maxLength={120} className={editInput} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-white/60 mb-1">{tr('fr.body')}</label>
                      <textarea name="body" value={editForm.body} onChange={handleEditChange} rows={5} maxLength={2000} className={editInput} />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-white/60 mb-1">{lang === 'ja' ? '削除キー' : 'Delete key'}</label>
                      <input
                        type="text"
                        value={editKey}
                        onChange={(e) => setEditKey(e.target.value)}
                        placeholder={lang === 'ja' ? '投稿時に設定した削除キー' : 'The key you set when posting'}
                        maxLength={60}
                        className={editInput}
                      />
                      <p className="text-[11px] text-white/40 mt-1.5">
                        {lang === 'ja'
                          ? '※ 投稿時に削除キーを設定した場合は必須です（同じ端末・ブラウザなら空欄でOK）。'
                          : '※ Required if you set a key when posting (leave blank if using the same device/browser).'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="submit"
                        disabled={editBusy}
                        className="inline-flex items-center gap-1.5 text-[#0b0714] font-bold text-[13px] px-4 h-9 rounded-lg transition disabled:opacity-60"
                        style={{ background: 'linear-gradient(95deg,#22d3ee,#a78bfa)' }}
                      >
                        {editBusy ? (lang === 'ja' ? '保存中…' : 'Saving…') : lang === 'ja' ? '保存する' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditOpen(false)}
                        className="text-[12px] text-white/50 hover:text-white px-2 h-9"
                      >
                        {lang === 'ja' ? 'キャンセル' : 'Cancel'}
                      </button>
                    </div>
                    <p className="text-[11px] text-white/40">
                      {lang === 'ja' ? '※ キーを忘れた場合は ' : '※ Forgot your key? '}
                      <a href={`/contact?ref=friends/${friend.id}`} className="underline hover:text-[#22d3ee]">
                        {lang === 'ja' ? '編集・削除を依頼' : 'request an edit'}
                      </a>
                      {lang === 'ja' ? ' からご連絡ください。' : ''}
                    </p>
                  </form>
                ) : !delOpen ? (
                  <div className="flex items-center gap-4 flex-wrap">
                    <button
                      type="button"
                      onClick={openEdit}
                      className="text-[12px] text-white/45 hover:text-[#22d3ee] underline underline-offset-2 transition-colors"
                    >
                      {lang === 'ja' ? '自分の投稿を編集する' : 'Edit my post'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDelOpen(true)}
                      className="text-[12px] text-white/45 hover:text-[#22d3ee] underline underline-offset-2 transition-colors"
                    >
                      {lang === 'ja' ? '自分の投稿を削除する' : 'Delete my post'}
                    </button>
                  </div>
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
