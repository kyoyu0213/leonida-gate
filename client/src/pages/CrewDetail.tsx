import { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { ArrowLeft, Loader2, Copy, ExternalLink, Shield } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import ThreadReplies from '@/components/ThreadReplies';
import {
  getCrew,
  deleteOwnCrew,
  updateOwnCrew,
  CREW_GENRES,
  CREW_PLATFORMS,
  crewPlatformLabelKey,
  type Crew,
} from '@/lib/crews';
import { formatPostDate } from '@/lib/board';
import { useT, useLang } from '@/lib/i18n';
import { useSeo } from '@/hooks/useSeo';
import SiteFooter from '@/components/SiteFooter';

const isUrl = (s: string) => /^https?:\/\//i.test(s.trim());

// 編集フォームの入力欄（削除フォームの入力欄と同じ見た目に合わせる）
const editInput =
  'w-full bg-white/[0.05] border border-white/15 rounded-lg px-3 py-2 text-[#f4eef8] text-sm focus:outline-none focus:border-[#ff8a3d]/60';

export default function CrewDetail() {
  const tr = useT();
  const lang = useLang();
  const [, paramsJa] = useRoute('/board/crews/:id');
  const [, paramsEn] = useRoute('/en/board/crews/:id');
  const id = paramsJa?.id ?? paramsEn?.id;

  const [crew, setCrew] = useState<Crew | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useSeo(
    crew?.title ? `${crew.title}｜${tr('cr.heading')}｜GTA6 FEED` : tr('cr.heading'),
    crew?.body?.slice(0, 120) || tr('seo.crews.desc'),
    { url: id ? `/board/crews/${id}` : undefined },
  );

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getCrew(id).then(({ data, error }) => {
      if (error || !data) setNotFound(true);
      else {
        setCrew(data as Crew);
        setNotFound(false);
      }
      setLoading(false);
    });
  }, [id]);

  const genreLabel = crew ? CREW_GENRES.find((g) => g.id === crew.genre) : undefined;
  const platformLabelKey = crew ? crewPlatformLabelKey(crew.platform) : null;
  const platformText = crew ? (platformLabelKey ? tr(platformLabelKey) : crew.platform) : null;

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(tr('cr.card.copied'));
  };

  // 本人による削除（削除キー or 同一ブラウザ anon_id）。
  const [delOpen, setDelOpen] = useState(false);
  const [delKey, setDelKey] = useState('');
  const [delBusy, setDelBusy] = useState(false);
  const handleDelete = async () => {
    if (!crew) return;
    setDelBusy(true);
    const { data, error } = await deleteOwnCrew(crew.id, delKey.trim() || null);
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
      window.location.href = '/board/crews';
    }
  };

  // 本人による編集（認可は削除と同じ：削除キー or 同一ブラウザ anon_id）。
  const [editOpen, setEditOpen] = useState(false);
  const [editKey, setEditKey] = useState('');
  const [editBusy, setEditBusy] = useState(false);
  const [editForm, setEditForm] = useState({
    author_name: '',
    crew_name: '',
    title: '',
    platform: '',
    genre: '',
    size: '',
    requirements: '',
    active_time: '',
    contact: '',
    body: '',
  });

  // 現在の値を初期値にして編集フォームを開く。
  const openEdit = () => {
    if (!crew) return;
    setEditForm({
      author_name: crew.author_name ?? '',
      crew_name: crew.crew_name,
      title: crew.title,
      platform: crew.platform ?? '',
      genre: crew.genre ?? '',
      size: crew.size ?? '',
      requirements: crew.requirements ?? '',
      active_time: crew.active_time ?? '',
      contact: crew.contact ?? '',
      body: crew.body,
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
    if (!crew) return;
    if (!editForm.crew_name.trim() || !editForm.title.trim() || !editForm.body.trim()) {
      toast.error(tr('cr.toast.req'));
      return;
    }
    if (!editForm.platform) {
      toast.error(tr('cr.toast.platformReq'));
      return;
    }
    setEditBusy(true);
    const { error } = await updateOwnCrew(
      crew.id,
      {
        crew_name: editForm.crew_name.trim(),
        title: editForm.title.trim(),
        platform: editForm.platform.trim() || null,
        genre: editForm.genre || null,
        size: editForm.size.trim() || null,
        requirements: editForm.requirements.trim() || null,
        active_time: editForm.active_time.trim() || null,
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

  const meta: Array<[string, string | null | undefined]> = crew
    ? [
        [tr('cr.size'), crew.size],
        [tr('cr.requirements'), crew.requirements],
        [tr('cr.activeTime'), crew.active_time],
      ]
    : [];

  return (
    <div className="vice-page vice-noise">
      <Header />
      <main className="max-w-[860px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[100px] pb-32 relative z-10">
        {loading ? (
          <div className="text-center py-16 text-white/50">
            <Loader2 size={28} className="mx-auto mb-4 animate-spin" /> {tr('cr.loading')}
          </div>
        ) : notFound || !crew ? (
          <div className="text-center py-16">
            <p className="text-white/60 mb-4">{tr('cr.notFound')}</p>
            <a href="/board/crews" className="text-[#ff8a3d] hover:text-white font-bold">
              {tr('cr.backToList')}
            </a>
          </div>
        ) : (
          <>
            <a
              href="/board/crews"
              className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-[13px] font-bold mb-5 transition-colors"
            >
              <ArrowLeft size={15} /> {tr('cr.backToList')}
            </a>

            {crew.status === 'closed' && (
              <div className="mb-5 rounded-xl border border-white/15 bg-white/[0.05] px-4 py-3 text-[13px] text-white/70">
                {lang === 'ja'
                  ? 'この募集は終了しました（募集主が締め切り）。返信の閲覧のみできます。'
                  : 'This post is closed by the author. Replies are read-only.'}
              </div>
            )}

            {/* card header */}
            <div className="rounded-2xl border border-[#ff8a3d]/25 bg-gradient-to-br from-[#ff8a3d]/[0.06] to-[#ff2d95]/[0.06] p-6 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <span
                  className="w-12 h-12 rounded-xl flex-none flex items-center justify-center text-white"
                  style={{ background: 'linear-gradient(135deg,#ff8a3d,#ff2d95)' }}
                >
                  <Shield size={22} />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    {platformText && (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold text-[#c4b5fd] border border-[#a78bfa]/50 bg-[#a78bfa]/10">
                        {platformText}
                      </span>
                    )}
                    {genreLabel && (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold text-[#ff8a3d] border border-[#ff8a3d]/50 bg-[#ff8a3d]/10">
                        {tr(genreLabel.labelKey)}
                      </span>
                    )}
                    <span className="text-[13px] font-bold text-white/60 break-words">{crew.crew_name}</span>
                  </div>
                  <h1 className="font-black text-2xl md:text-[30px] leading-snug m-0 break-words">
                    {crew.title}
                  </h1>
                  <p className="text-[12px] text-white/40 mt-1 font-mono">{(crew.author_name || '名無しさん')}・{formatPostDate(crew.created_at)}</p>
                </div>
              </div>

              <p className="text-white/85 text-[15px] leading-[1.8] whitespace-pre-wrap break-words mb-4">
                {crew.body}
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

              {crew.contact &&
                (isUrl(crew.contact) ? (
                  <button
                    onClick={() => window.open(crew.contact!, '_blank', 'noopener')}
                    className="inline-flex items-center gap-1.5 bg-[#5865F2] hover:brightness-110 text-white font-bold text-[13px] px-4 h-9 rounded-lg transition"
                  >
                    <ExternalLink size={14} /> {tr('cr.card.contact')}
                  </button>
                ) : (
                  <button
                    onClick={() => copy(crew.contact!)}
                    className="inline-flex items-center gap-1.5 bg-white/[0.06] border border-white/15 hover:bg-white/10 text-[#f4eef8] font-bold text-[13px] px-4 h-9 rounded-lg transition"
                    title={crew.contact}
                  >
                    <Copy size={14} /> {tr('cr.card.contact')}: {crew.contact}
                  </button>
                ))}
            </div>

            {/* 本人による編集・削除（削除キー or 同一ブラウザ）。できない人向けに依頼リンクも残す。 */}
            {crew.status !== 'closed' && (
              <div className="mb-6 -mt-2 px-1">
                {editOpen ? (
                  <form onSubmit={handleEdit} className="rounded-xl border border-white/12 bg-white/[0.03] p-4 max-w-[560px] space-y-3">
                    <p className="text-[13px] font-bold text-[#ff8a3d]">
                      {lang === 'ja' ? '募集を編集する' : 'Edit your post'}
                    </p>
                    <div>
                      <label className="block text-[12px] font-bold text-white/60 mb-1">{lang === 'ja' ? '名前（任意）' : 'Name (optional)'}</label>
                      <input name="author_name" value={editForm.author_name} onChange={handleEditChange} placeholder={lang === 'ja' ? '未入力なら「名無しさん」' : 'Defaults to “名無しさん”'} maxLength={40} className={editInput} />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[12px] font-bold text-white/60 mb-1">{tr('cr.crewName')}</label>
                        <input name="crew_name" value={editForm.crew_name} onChange={handleEditChange} maxLength={80} className={editInput} />
                      </div>
                      <div>
                        <label className="block text-[12px] font-bold text-white/60 mb-1">{tr('cr.genre')}</label>
                        <select name="genre" value={editForm.genre} onChange={handleEditChange} className={`${editInput} h-[38px]`}>
                          {/* 旧データでジャンル未設定の場合に、表示と値がずれないようにする */}
                          <option value="" className="bg-[#15091c]">{lang === 'ja' ? '未設定' : 'Not set'}</option>
                          {CREW_GENRES.map((g) => (
                            <option key={g.id} value={g.id} className="bg-[#15091c]">{tr(g.labelKey)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-white/60 mb-1">{tr('cr.title')}</label>
                      <input name="title" value={editForm.title} onChange={handleEditChange} maxLength={80} className={editInput} />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[12px] font-bold text-white/60 mb-1">{tr('cr.platform')}</label>
                        <select name="platform" value={editForm.platform} onChange={handleEditChange} className={`${editInput} h-[38px]`}>
                          <option value="" className="bg-[#15091c]">{tr('cr.pf.select')}</option>
                          {CREW_PLATFORMS.map((p) => (
                            <option key={p.id} value={p.id} className="bg-[#15091c]">{tr(p.labelKey)}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[12px] font-bold text-white/60 mb-1">{tr('cr.size')}</label>
                        <input name="size" value={editForm.size} onChange={handleEditChange} maxLength={40} className={editInput} />
                      </div>
                      <div>
                        <label className="block text-[12px] font-bold text-white/60 mb-1">{tr('cr.requirements')}</label>
                        <input name="requirements" value={editForm.requirements} onChange={handleEditChange} maxLength={120} className={editInput} />
                      </div>
                      <div>
                        <label className="block text-[12px] font-bold text-white/60 mb-1">{tr('cr.activeTime')}</label>
                        <input name="active_time" value={editForm.active_time} onChange={handleEditChange} maxLength={40} className={editInput} />
                      </div>
                      <div>
                        <label className="block text-[12px] font-bold text-white/60 mb-1">{tr('cr.contact')}</label>
                        <input name="contact" value={editForm.contact} onChange={handleEditChange} maxLength={120} className={editInput} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-white/60 mb-1">{tr('cr.body')}</label>
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
                        style={{ background: 'linear-gradient(95deg,#ff8a3d,#ff2d95)' }}
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
                      <a href={`/contact?ref=crews/${crew.id}`} className="underline hover:text-[#ff8a3d]">
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
                      className="text-[12px] text-white/45 hover:text-[#ff8a3d] underline underline-offset-2 transition-colors"
                    >
                      {lang === 'ja' ? '自分の投稿を編集する' : 'Edit my post'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDelOpen(true)}
                      className="text-[12px] text-white/45 hover:text-[#ff8a3d] underline underline-offset-2 transition-colors"
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
                      className="w-full bg-white/[0.05] border border-white/15 rounded-lg px-3 py-2 text-[#f4eef8] text-sm mb-3 focus:outline-none focus:border-[#ff8a3d]/60"
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
                      <a href={`/contact?ref=crews/${crew.id}`} className="underline hover:text-[#ff8a3d]">
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
            {crew.thread_id ? (
              <ThreadReplies threadId={crew.thread_id} startNumber={2} />
            ) : (
              <p className="text-white/40 text-sm py-8 text-center">{tr('rep.empty')}</p>
            )}
          </>
        )}
      </main>

      <SiteFooter inset />
    </div>
  );
}
