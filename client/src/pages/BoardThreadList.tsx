import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Plus, X, Send, Loader2, Search, ImagePlus } from 'lucide-react';
import Header from '@/components/Header';
import { toast } from 'sonner';
import { getBoardImageSetting, uploadImages } from '@/lib/images';
import {
  listThreads,
  createThread,
  getPostId,
  formatPostDate,
  boardErrorMessage,
  DEFAULT_NAME,
  MAX_TITLE,
  MAX_BODY,
  POST_COOLDOWN_MS,
  BOARD_ICONS,
  boardIconUrl,
  type BoardThread,
} from '@/lib/board';
import { getBoard, BOARDS, boardColor } from '@/lib/boards';
import { isLoggedIn, subscribeAdmin, adminCreateThread } from '@/lib/admin';
import { submitServerApplication } from '@/lib/applications';

const COOLDOWN_KEY = 'board_last_post';

// スレッドのアバター色（タイトルから決定）
const AVATARS = [
  'linear-gradient(135deg,#ff2d95,#ff6a3d)',
  'linear-gradient(135deg,#22d3ee,#a78bfa)',
  'linear-gradient(135deg,#a78bfa,#ff2d95)',
  'linear-gradient(135deg,#ff8a3d,#c44be0)',
  'linear-gradient(135deg,#3de0a0,#22d3ee)',
];
const avatarFor = (s: string) =>
  AVATARS[s.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATARS.length];

const inputClass =
  'w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-[#f4eef8] placeholder:text-white/35 focus:outline-none focus:border-[#a78bfa]/60 transition-colors';

// 並び替えの種類
type SortKey = 'new' | 'count' | 'buzz';
const SORTS: { key: SortKey; label: string }[] = [
  { key: 'new', label: '新着' },
  { key: 'count', label: 'レス数' },
  { key: 'buzz', label: '賑わい' },
];
// 賑わい（勢い）：レス数 ÷ 経過時間（時間）。短期間に伸びているスレほど高い。
const buzzScore = (t: BoardThread) => {
  const hours = Math.max((Date.now() - new Date(t.created_at).getTime()) / 3_600_000, 1);
  return t.post_count / hours;
};

export default function BoardThreadList() {
  const [, navigate] = useLocation();
  const [, params] = useRoute('/board/:slug');
  // /board（slugなし）は先頭の掲示板を既定表示
  const slug = params?.slug ?? BOARDS[0].slug;
  const board = getBoard(slug);

  const [threads, setThreads] = useState<BoardThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // ハニーポット（ボット対策）
  const [hp, setHp] = useState('');
  // スレッドのアイコン（プリセット。null＝文字アイコン）
  const [icon, setIcon] = useState<string | null>(null);

  // 申請制（GTARP鯖別）用フォーム
  const [app, setApp] = useState({ server_name: '', description: '', contact: '', applicant: '' });

  // 一覧の並び替え（新着＝最終更新順／レス数／賑わい＝勢い）
  const [sort, setSort] = useState<SortKey>('new');

  // 掲示板内検索（スレタイ＋レス本文）。送信で掲示板スコープの検索結果ページへ。
  const [boardQuery, setBoardQuery] = useState('');
  const onBoardSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = boardQuery.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}&scope=board`);
  };

  // 管理者ログイン状態（メモリ保持のトークン有無）。/admin/reports でログインすると有効になる。
  const [admin, setAdmin] = useState(isLoggedIn());
  useEffect(() => subscribeAdmin(() => setAdmin(isLoggedIn())), []);

  // 画像投稿（②）。board の images_enabled が true のときだけスレ作成フォームに入口を出す。
  const [imagesEnabled, setImagesEnabled] = useState(false);
  const [requireApproval, setRequireApproval] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  useEffect(() => {
    if (!board) return;
    getBoardImageSetting(board.slug).then((s) => {
      setImagesEnabled(!!s?.images_enabled);
      setRequireApproval(s?.require_approval ?? true);
    });
    setFiles([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const load = async () => {
    if (!board) return;
    setLoading(true);
    const { data, error } = await listThreads(board.slug);
    if (error) {
      console.error(error);
      toast.error('スレッド一覧の取得に失敗しました');
      setThreads([]);
    } else {
      setThreads((data as BoardThread[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (!board) {
    return (
      <div className="vice-page vice-noise">
        <Header />
        <div className="max-w-[1080px] mx-auto px-4 pt-[120px] text-center">
          <p className="text-white/60 mb-4">掲示板が見つかりません</p>
          <a href="/board" className="text-[#a78bfa] hover:text-white font-bold">掲示板一覧に戻る</a>
        </div>
      </div>
    );
  }

  // 管理者モード：/admin/reports でログイン済み（メモリのトークン有）なら、
  // 申請制ジャンルでも認可付きでスレ作成が可能に。
  const isAdmin = admin;
  // 申請制として扱うか（申請制ジャンル かつ 管理者でない）
  const restricted = !!board.submitOnly && !isAdmin;

  // 並び替え後のスレッド一覧
  const sortedThreads = [...threads].sort((a, b) => {
    if (sort === 'count') return b.post_count - a.post_count;
    if (sort === 'buzz') return buzzScore(b) - buzzScore(a);
    return new Date(b.last_posted_at).getTime() - new Date(a.last_posted_at).getTime();
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hp) return; // ハニーポット＝ボット。静かに無視。
    if (!title.trim() || !body.trim()) {
      toast.error('スレタイと本文を入力してください');
      return;
    }
    const last = Number(localStorage.getItem(COOLDOWN_KEY) || 0);
    if (Date.now() - last < POST_COOLDOWN_MS) {
      toast.error('投稿の間隔が短すぎます。少し待ってください');
      return;
    }
    setSubmitting(true);
    // 申請制ジャンルへのスレ作成は管理者のみ＝認可付き RPC を使う。
    // 通常ジャンルは従来どおり anon の create_thread。
    const { data, error } =
      board.submitOnly && isAdmin
        ? await adminCreateThread(board.slug, title.trim(), name.trim(), body.trim())
        : await createThread(board.slug, title.trim(), name.trim(), body.trim(), icon);
    if (error) {
      setSubmitting(false);
      console.error(error);
      toast.error(boardErrorMessage(error.message));
      return;
    }
    const newThreadId = data as string;
    // 画像が選択されていれば、1レス目（OP）に紐付けてアップロード
    let imageNote = '';
    if (imagesEnabled && files.length > 0) {
      const opId = (await getPostId(newThreadId, 1)) ?? undefined;
      const { error: upErr } = await uploadImages(board.slug, files, { threadId: newThreadId, postId: opId });
      if (upErr) {
        toast.error(upErr);
      } else {
        imageNote = requireApproval ? '（画像は承認後に表示されます）' : '（画像を添付しました）';
      }
      setFiles([]);
    }
    setSubmitting(false);
    setIcon(null);
    localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
    toast.success('スレッドを立てました' + imageNote);
    navigate(`/thread/${newThreadId}`);
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hp) return; // ハニーポット＝ボット。静かに無視。
    if (!app.server_name.trim() || !app.description.trim()) {
      toast.error('サーバー名と説明は必須です');
      return;
    }
    setSubmitting(true);
    const { error } = await submitServerApplication({
      server_name: app.server_name.trim(),
      description: app.description.trim(),
      contact: app.contact.trim(),
      applicant: app.applicant.trim(),
      hp,
    });
    setSubmitting(false);
    if (error) {
      console.error(error);
      const m = error.message ?? '';
      if (m.includes('rate limited')) toast.error('申請の間隔が短すぎます。少し時間をおいてからお試しください');
      else if (m.includes('banned word')) toast.error('禁止ワードが含まれているため申請できません');
      else if (m.includes('blocked')) toast.error('現在申請できません');
      else toast.error('申請に失敗しました。時間をおいて再度お試しください');
      return;
    }
    toast.success('申請を受け付けました！管理者の確認後にスレッドが作成されます');
    setApp({ server_name: '', description: '', contact: '', applicant: '' });
    setShowForm(false);
  };

  return (
    <div className="vice-page vice-noise">
      <Header />

      <main className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[100px] pb-16 relative z-10">
        {/* header */}
        <div className="flex items-end justify-between gap-5 flex-wrap mb-5">
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <span className="text-xs font-extrabold tracking-[0.2em] text-[#a78bfa] uppercase">Community Board</span>
              <h1 className="font-black text-3xl md:text-[44px] leading-tight mt-2">掲示板</h1>
            </div>
            {/* 掲示板内検索 */}
            <form
              onSubmit={onBoardSearch}
              className="flex items-center gap-2 rounded-full px-3.5 py-2 mb-1"
              style={{
                background: 'rgba(255,255,255,.05)',
                border: '1px solid rgba(255,255,255,.12)',
                width: 'clamp(180px,26vw,280px)',
              }}
            >
              <Search size={15} className="flex-none opacity-50" />
              <input
                value={boardQuery}
                onChange={(e) => setBoardQuery(e.target.value)}
                placeholder="掲示板内を検索…"
                className="bg-transparent border-none outline-none text-[#f4eef8] text-[13px] w-full min-w-0 placeholder:text-white/35"
              />
            </form>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex-none text-sm font-extrabold px-5 py-3 rounded-full inline-flex items-center gap-1.5 hover:-translate-y-px transition-transform"
            style={{
              background: showForm ? 'rgba(255,255,255,.1)' : 'linear-gradient(95deg,#ff8a3d,#ff2d95 60%,#c44be0)',
              boxShadow: showForm ? 'none' : '0 4px 18px rgba(255,45,149,.4)',
              color: showForm ? '#fff' : '#fff',
            }}
          >
            {showForm ? (
              <><X size={16} /> 閉じる</>
            ) : restricted ? (
              <><Plus size={16} strokeWidth={3} /> 掲載を申請する</>
            ) : (
              <><Plus size={16} strokeWidth={3} /> スレッドを立てる</>
            )}
          </button>
        </div>

        {isAdmin && board.submitOnly && (
          <div className="mb-5 inline-flex items-center gap-2 text-[12px] font-extrabold text-[#3de0a0] bg-[#3de0a0]/10 border border-[#3de0a0]/30 rounded-full px-3 py-1.5">
            ● 管理者モード：このジャンルにスレッドを作成できます
          </div>
        )}

        {/* board tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
          {BOARDS.map((b) => {
            const active = b.slug === board.slug;
            const c = boardColor(b.accent);
            return (
              <a
                key={b.slug}
                href={`/board/${b.slug}`}
                className="flex-none flex items-center gap-2 px-5 py-2.5 rounded-[13px] text-sm font-extrabold whitespace-nowrap transition-colors"
                style={{
                  border: `1px solid ${active ? c : 'rgba(255,255,255,.1)'}`,
                  background: active ? `${c}1f` : 'rgba(255,255,255,.05)',
                  color: active ? '#fff' : 'rgba(244,238,248,.65)',
                }}
              >
                <span className="w-2 h-2 rounded-full flex-none" style={{ background: c, boxShadow: `0 0 7px ${c}` }} />
                {b.title.replace('掲示板', '')}
              </a>
            );
          })}
        </div>

        {/* form: 申請制（鯖別・非管理者）は申請フォーム、それ以外は通常のスレ作成フォーム */}
        {showForm && restricted && (
          <form onSubmit={handleApply} className="rounded-2xl border border-[#a78bfa]/25 bg-[#a78bfa]/[0.06] p-6 mb-7 space-y-4">
            {/* ハニーポット（人間には見えない・ボット対策） */}
            <input
              type="text"
              name="hp_url"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={hp}
              onChange={(e) => setHp(e.target.value)}
              style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
            />
            <p className="text-[13px] text-white/60 leading-relaxed">
              このジャンルは<strong className="text-[#a78bfa]">申請制</strong>です。掲載したいGTARPサーバーの情報を送信してください。管理者が内容を確認のうえ、専用スレッドを作成します（架空サーバー等の乱立を防ぐため厳選しています）。
            </p>
            <div>
              <label className="block text-sm font-bold text-[#a78bfa] mb-2">サーバー名 *</label>
              <input value={app.server_name} onChange={(e) => setApp({ ...app, server_name: e.target.value })} placeholder="例: LEONIDA RP" maxLength={60} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#a78bfa] mb-2">サーバーの説明 *</label>
              <textarea value={app.description} onChange={(e) => setApp({ ...app, description: e.target.value })} placeholder="サーバーの特徴・規模・コンセプトなど" rows={4} maxLength={500} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#a78bfa] mb-2">連絡先（Discord招待URL など・任意）</label>
              <input value={app.contact} onChange={(e) => setApp({ ...app, contact: e.target.value })} placeholder="https://discord.gg/xxxxxxx" maxLength={120} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#a78bfa] mb-2">申請者名（任意）</label>
              <input value={app.applicant} onChange={(e) => setApp({ ...app, applicant: e.target.value })} placeholder="運営者名・ハンドルネームなど" maxLength={40} className={inputClass} />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 text-white font-extrabold py-3 rounded-full hover:-translate-y-0.5 transition-transform disabled:opacity-60"
              style={{ background: 'linear-gradient(95deg,#ff8a3d,#ff2d95 60%,#c44be0)' }}
            >
              {submitting ? (<><Loader2 size={16} className="animate-spin" /> 送信中…</>) : (<><Send size={16} /> 掲載を申請する</>)}
            </button>
          </form>
        )}

        {showForm && !restricted && (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-[#a78bfa]/25 bg-[#a78bfa]/[0.06] p-6 mb-7 space-y-4">
            {/* ハニーポット（人間には見えない・ボット対策） */}
            <input
              type="text"
              name="hp_url"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={hp}
              onChange={(e) => setHp(e.target.value)}
              style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
            />
            <div>
              <label className="block text-sm font-bold text-[#a78bfa] mb-2">スレタイ *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例: 初心者向けのおすすめRPサーバー教えて" maxLength={MAX_TITLE} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#a78bfa] mb-2">名前（空欄で「{DEFAULT_NAME}」）</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={DEFAULT_NAME} maxLength={30} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#a78bfa] mb-2">本文（1レス目）*</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="本文を入力…" rows={5} maxLength={MAX_BODY} className={inputClass} />
            </div>

            {/* 画像添付（画像有効カテゴリのみ） */}
            {imagesEnabled && (
              <div>
                <label className="block text-sm font-bold text-[#a78bfa] mb-2">
                  画像（任意・jpg/png/webp・最大3枚{requireApproval ? '・承認後に表示' : ''}）
                </label>
                {files.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {files.map((f, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 text-[11px] text-white/70 bg-white/[0.06] border border-white/10 rounded-lg px-2 py-1"
                      >
                        {f.name.length > 20 ? f.name.slice(0, 18) + '…' : f.name}
                        <button
                          type="button"
                          onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-white/40 hover:text-[#ff8fc0]"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-[13px] font-bold text-white/70 hover:text-[#a78bfa] border border-white/15 rounded-lg px-3 py-2 transition-colors">
                  <ImagePlus size={16} /> 画像を選ぶ
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const picked = Array.from(e.target.files ?? []);
                      setFiles((prev) => [...prev, ...picked].slice(0, 3));
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            )}

            {/* スレッドアイコン（プリセットから選択・任意） */}
            <div>
              <label className="block text-sm font-bold text-[#a78bfa] mb-2">スレッドのアイコン（任意）</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setIcon(null)}
                  title="文字アイコン（デフォルト）"
                  className="w-12 h-12 rounded-xl flex-none flex items-center justify-center text-[11px] font-bold text-white/70 bg-white/[0.05]"
                  style={{ border: `2px solid ${icon === null ? '#a78bfa' : 'rgba(255,255,255,.12)'}` }}
                >
                  なし
                </button>
                {BOARD_ICONS.map((ic) => (
                  <button
                    type="button"
                    key={ic}
                    onClick={() => setIcon(ic)}
                    title={ic.replace(/_square\.jpg$/, '').replace(/_/g, ' ')}
                    className="w-12 h-12 rounded-xl flex-none overflow-hidden p-0"
                    style={{ border: `2px solid ${icon === ic ? '#a78bfa' : 'rgba(255,255,255,.12)'}` }}
                  >
                    <img src={boardIconUrl(ic)} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            </div>

            {/* 注意書き */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-[12px] text-white/55 leading-relaxed">
              <p className="m-0 font-bold text-white/70 mb-1">投稿前にご確認ください</p>
              <ul className="list-disc pl-5 space-y-0.5 m-0">
                <li>誹謗中傷・個人情報の晒し・スパム・わいせつ等の投稿は禁止です。</li>
                <li>違反・不適切な投稿は、予告なく削除・非表示にすることがあります。</li>
                {imagesEnabled && <li>画像は管理者の承認後に表示されます（即時には公開されません）。</li>}
              </ul>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 text-white font-extrabold py-3 rounded-full hover:-translate-y-0.5 transition-transform disabled:opacity-60"
              style={{ background: 'linear-gradient(95deg,#ff8a3d,#ff2d95 60%,#c44be0)' }}
            >
              {submitting ? (<><Loader2 size={16} className="animate-spin" /> 作成中…</>) : (<><Send size={16} /> スレを立てる</>)}
            </button>
          </form>
        )}

        {/* 申請制の案内（フォーム未展開時・非管理者） */}
        {restricted && !showForm && (
          <div className="rounded-xl border border-[#a78bfa]/25 bg-[#a78bfa]/[0.06] px-4 py-3 mb-6">
            <p className="text-[13px] text-white/60 leading-relaxed">
              ※ このジャンルは申請制です。スレッドは管理者が作成します。掲載を希望する場合は「掲載を申請する」からお送りください。
            </p>
          </div>
        )}

        {/* 並び替え */}
        {!loading && threads.length > 0 && (
          <div className="flex items-center justify-end gap-2 mb-4 flex-wrap">
            <span className="text-[12px] font-bold text-white/45">並び替え</span>
            {SORTS.map((s) => {
              const active = sort === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setSort(s.key)}
                  className="text-[12.5px] font-extrabold px-3.5 py-1.5 rounded-full transition-colors"
                  style={{
                    border: `1px solid ${active ? '#a78bfa' : 'rgba(255,255,255,.12)'}`,
                    background: active ? 'rgba(167,139,250,.12)' : 'rgba(255,255,255,.05)',
                    color: active ? '#fff' : 'rgba(244,238,248,.65)',
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        )}

        {/* thread list */}
        {loading ? (
          <div className="text-center py-16 text-white/50">
            <Loader2 size={28} className="mx-auto mb-4 animate-spin" /> 取得中…
          </div>
        ) : threads.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {sortedThreads.map((t) => (
              <a
                key={t.id}
                href={`/thread/${t.id}`}
                className="flex items-center gap-3.5 w-full rounded-2xl border border-black/10 bg-white p-[15px] shadow-sm hover:shadow-md transition-shadow"
                style={{ ['--h' as string]: '' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(167,139,250,.55)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,.1)')}
              >
                {t.icon ? (
                  <img
                    src={boardIconUrl(t.icon)}
                    alt=""
                    className="w-[42px] h-[42px] rounded-xl flex-none object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span
                    className="w-[42px] h-[42px] rounded-xl flex-none flex items-center justify-center vice-display text-lg text-white"
                    style={{ background: avatarFor(t.title) }}
                  >
                    {t.title.trim().charAt(0) || '?'}
                  </span>
                )}
                <span className="flex flex-col gap-1.5 min-w-0 flex-1">
                  <span className="text-[15px] font-bold text-[#15091c] truncate">{t.title}</span>
                  <span className="text-[12px] text-black/50 flex items-center gap-2 flex-wrap">
                    <span className="font-bold" style={{ color: boardColor(board.accent) }}>
                      {board.title.replace('掲示板', '')}
                    </span>
                    <span className="opacity-50">・</span>
                    <span>{formatPostDate(t.last_posted_at)} 更新</span>
                  </span>
                </span>
                <span className="flex flex-col items-center gap-0.5 flex-none">
                  <span className="vice-num text-[19px] text-[#15091c] leading-none">{t.post_count}</span>
                  <span className="text-[10px] text-black/45">レス</span>
                </span>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-white/50 mb-4">
              {restricted ? 'まだ掲載されたサーバーがありません' : 'まだスレッドがありません'}
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="text-white font-extrabold px-6 py-3 rounded-full inline-flex items-center gap-1.5"
              style={{ background: 'linear-gradient(95deg,#ff8a3d,#ff2d95 60%,#c44be0)' }}
            >
              <Plus size={16} strokeWidth={3} /> {restricted ? '掲載を申請する' : '最初のスレを立てる'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
