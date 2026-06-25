import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useRoute } from 'wouter';
import { Send, Loader2, ArrowLeft, ImagePlus, X, Reply, ThumbsUp, ThumbsDown } from 'lucide-react';
import Header from '@/components/Header';
import ReportDialog from '@/components/ReportDialog';
import { toast } from 'sonner';
import {
  getThread,
  listPosts,
  createPost,
  getPostId,
  formatPostDate,
  boardErrorMessage,
  votePost,
  loadMyVotes,
  saveMyVote,
  DEFAULT_NAME,
  MAX_BODY,
  POST_COOLDOWN_MS,
  type BoardThread as ThreadType,
  type BoardPost,
  type VoteKind,
} from '@/lib/board';
import { getBoard, boardColor as boardColorFor } from '@/lib/boards';
import { getBoardImageSetting, uploadImages, listApprovedImages } from '@/lib/images';

const COOLDOWN_KEY = 'board_last_post';
const REPORTED_KEY = 'board_reported_posts';

// このブラウザで通報済みの post id 集合（UIでボタンを抑制するだけ。本当の重複防止はサーバー側）
const loadReported = (): Set<string> => {
  try {
    return new Set(JSON.parse(localStorage.getItem(REPORTED_KEY) || '[]'));
  } catch {
    return new Set();
  }
};

const AVATARS = [
  'linear-gradient(135deg,#ff2d95,#ff6a3d)',
  'linear-gradient(135deg,#22d3ee,#a78bfa)',
  'linear-gradient(135deg,#a78bfa,#ff2d95)',
  'linear-gradient(135deg,#ff8a3d,#c44be0)',
  'linear-gradient(135deg,#3de0a0,#22d3ee)',
];
const avatarFor = (s: string) =>
  AVATARS[s.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATARS.length];

export default function BoardThread() {
  const [match, params] = useRoute('/thread/:id');
  const threadId = params?.id;

  const [thread, setThread] = useState<ThreadType | null>(null);
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reported, setReported] = useState<Set<string>>(loadReported);
  // グッド/バッドの集計（postId→{good,bad}）と、このブラウザの投票（postId→kind）
  const [counts, setCounts] = useState<Record<string, { good: number; bad: number }>>({});
  const [myVotes, setMyVotes] = useState<Record<string, VoteKind>>(loadMyVotes);
  // ハニーポット（ボット対策・人間には見えない。埋まっていたら送信しない）
  const [hp, setHp] = useState('');

  // 画像投稿（②）。board の images_enabled が true のときだけ入口を出す（デフォルト false）。
  const [imagesEnabled, setImagesEnabled] = useState(false);
  const [requireApproval, setRequireApproval] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  // レスに紐付かない画像（旧データ）はスレ先頭に、post_id 付きは各レス直下に表示
  const [threadImages, setThreadImages] = useState<string[]>([]);
  const [postImages, setPostImages] = useState<Record<string, string[]>>({});

  const markReported = (postId: string) => {
    setReported((prev) => {
      const next = new Set(prev).add(postId);
      localStorage.setItem(REPORTED_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  // 返信（アンカー）。入力欄に >>レス番号 を差し込んでフォーカスする。
  const replyRef = useRef<HTMLTextAreaElement>(null);
  const [highlight, setHighlight] = useState<number | null>(null);

  const replyTo = (n: number) => {
    setBody((prev) => `${prev}${prev && !prev.endsWith('\n') ? '\n' : ''}>>${n}\n`);
    replyRef.current?.focus();
  };

  // 本文中の >>N をクリックでそのレスへジャンプ＆一瞬ハイライト
  const jumpToPost = (n: number) => {
    const el = document.getElementById(`post-${n}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlight(n);
    window.setTimeout(() => setHighlight((cur) => (cur === n ? null : cur)), 3000);
  };

  // 本文をレンダリング：>>N をアンカーリンクに変換する
  const renderBody = (text: string): ReactNode[] => {
    const parts: ReactNode[] = [];
    const re = />>(\d+)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    let k = 0;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) parts.push(text.slice(last, m.index));
      const n = Number(m[1]);
      parts.push(
        <button
          key={k++}
          type="button"
          onClick={() => jumpToPost(n)}
          className="text-[#22d3ee] hover:text-[#7df9ff] font-bold underline underline-offset-2"
        >
          {`>>${n}`}
        </button>,
      );
      last = m.index + m[0].length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts;
  };

  const load = async () => {
    if (!threadId) return;
    setLoading(true);
    const [{ data: t, error: te }, { data: p, error: pe }] = await Promise.all([
      getThread(threadId),
      listPosts(threadId),
    ]);
    if (te || !t) {
      setNotFound(true);
    } else {
      const thread = t as ThreadType;
      setThread(thread);
      setNotFound(false);
      // 画像設定と承認済み画像（無効カテゴリでは入口も表示も出ない）
      const setting = await getBoardImageSetting(thread.board);
      setImagesEnabled(!!setting?.images_enabled);
      setRequireApproval(setting?.require_approval ?? true);
      if (setting?.images_enabled) {
        const imgs = await listApprovedImages(thread.id);
        const byPost: Record<string, string[]> = {};
        const noPost: string[] = [];
        imgs.forEach((im) => {
          if (im.post_id) (byPost[im.post_id] ??= []).push(im.url);
          else noPost.push(im.url);
        });
        setPostImages(byPost);
        setThreadImages(noPost);
      }
    }
    if (!pe) {
      const arr = (p as BoardPost[]) ?? [];
      setPosts(arr);
      // グッド/バッドの初期集計
      setCounts(
        Object.fromEntries(arr.map((post) => [post.id, { good: post.good ?? 0, bad: post.bad ?? 0 }])),
      );
    }
    setLoading(false);
  };

  // グッド/バッド投票（楽観更新→RPCの結果で確定）
  const vote = async (postId: string, kind: VoteKind) => {
    const { data, error } = await votePost(postId, kind);
    if (error) {
      toast.error('投票に失敗しました。時間をおいて再度お試しください');
      return;
    }
    const r = data as { good: number; bad: number; my: VoteKind | null };
    setCounts((c) => ({ ...c, [postId]: { good: r.good, bad: r.bad } }));
    setMyVotes((m) => {
      const next = { ...m };
      if (r.my) next[postId] = r.my;
      else delete next[postId];
      return next;
    });
    saveMyVote(postId, r.my);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  // URLの #post-N（管理画面の「投稿へ」等）で開いたら、その投稿へスクロール＆ハイライト
  const hashJumpedRef = useRef(false);
  useEffect(() => {
    if (hashJumpedRef.current || posts.length === 0) return;
    const m = window.location.hash.match(/^#post-(\d+)$/);
    if (m) {
      hashJumpedRef.current = true;
      window.setTimeout(() => jumpToPost(Number(m[1])), 150);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hp) return; // ハニーポットが埋まっている＝ボット。静かに無視。
    if (!threadId) return;
    if (!body.trim()) {
      toast.error('本文を入力してください');
      return;
    }
    const last = Number(localStorage.getItem(COOLDOWN_KEY) || 0);
    if (Date.now() - last < POST_COOLDOWN_MS) {
      toast.error('投稿の間隔が短すぎます。少し待ってください');
      return;
    }
    setSubmitting(true);
    const { data: postNum, error } = await createPost(threadId, name.trim(), body.trim());
    if (error) {
      setSubmitting(false);
      console.error(error);
      toast.error(boardErrorMessage(error.message));
      return;
    }
    // 画像が選択されていれば、今投稿したレスに紐付けてアップロード
    let imageNote = '';
    if (imagesEnabled && files.length > 0) {
      const postId = (await getPostId(threadId, postNum as number)) ?? undefined;
      const { error: upErr } = await uploadImages(thread!.board, files, { threadId, postId });
      if (upErr) {
        toast.error(upErr);
      } else {
        imageNote = requireApproval ? '（画像は承認後に表示されます）' : '（画像を添付しました）';
      }
      setFiles([]);
    }
    setSubmitting(false);
    localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
    setBody('');
    toast.success('書き込みました' + imageNote);
    load();
  };

  if (!match) return null;

  const board = getBoard(thread?.board);
  const backHref = board ? `/board/${board.slug}` : '/board';
  const boardColor = boardColorFor(board?.accent);
  const full = (thread?.post_count ?? 0) >= 1000;

  return (
    <div className="vice-page vice-noise">
      <Header />

      <main className="max-w-[860px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[100px] pb-32 relative z-10">
        {loading ? (
          <div className="text-center py-16 text-white/50">
            <Loader2 size={28} className="mx-auto mb-4 animate-spin" /> 取得中…
          </div>
        ) : notFound ? (
          <div className="text-center py-16">
            <p className="text-white/60 mb-4">スレッドが見つかりません</p>
            <a href="/board" className="text-[#a78bfa] hover:text-white font-bold">掲示板一覧に戻る</a>
          </div>
        ) : (
          <>
            <a href={backHref} className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-[13px] font-bold mb-5 transition-colors">
              <ArrowLeft size={15} /> 一覧へ戻る
            </a>

            {/* thread header */}
            <div className="border-b border-white/10 pb-5 mb-1">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {board && (
                  <span className="text-[11px] font-extrabold rounded-md px-2.5 py-1" style={{ color: boardColor, border: `1px solid ${boardColor}` }}>
                    {board.title.replace('掲示板', '')}
                  </span>
                )}
              </div>
              <h1 className="font-black text-2xl md:text-[30px] leading-snug m-0 break-words">{thread?.title}</h1>
              <p className="text-[13px] text-white/50 mt-3 m-0">
                {thread?.post_count}件の返信・最終更新 {thread ? formatPostDate(thread.last_posted_at) : ''}
              </p>
            </div>

            {/* thread images (承認済みのみ・画像有効カテゴリのみ) */}
            {imagesEnabled && threadImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {threadImages.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={url}
                      alt="投稿画像"
                      className="h-28 w-28 object-cover rounded-xl border border-white/10"
                      loading="lazy"
                    />
                  </a>
                ))}
              </div>
            )}

            {/* posts */}
            <div className="flex flex-col">
              {posts.map((post) => (
                <div
                  key={post.id}
                  id={`post-${post.post_number}`}
                  className="flex gap-3.5 py-[18px] px-3 -mx-3 border-b border-white/[0.06] rounded-lg transition-colors"
                  style={
                    highlight === post.post_number
                      ? { background: 'rgba(34,211,238,.16)', boxShadow: '0 0 0 2px rgba(34,211,238,.55)' }
                      : undefined
                  }
                >
                  <span
                    className="w-10 h-10 rounded-full flex-none flex items-center justify-center font-black text-base text-white"
                    style={{ background: avatarFor(`${post.name}-${post.post_number}`) }}
                  >
                    {post.name.trim().charAt(0) || '名'}
                  </span>
                  <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-sm font-extrabold text-[#f4eef8]">{post.name}</span>
                      <span className="vice-num text-[11px] text-[#ff2d95]">#{post.post_number}</span>
                      <span className="text-[11.5px] text-white/40">{formatPostDate(post.created_at)}</span>
                      {!post.hidden && (
                        <span className="ml-auto flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => replyTo(post.post_number)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-white/30 hover:text-[#22d3ee] transition-colors"
                            title="このレスに返信"
                          >
                            <Reply size={12} /> 返信
                          </button>
                          <ReportDialog
                            postId={post.id}
                            reported={reported.has(post.id)}
                            onReported={markReported}
                          />
                        </span>
                      )}
                    </div>
                    {post.hidden ? (
                      <p className="text-sm leading-[1.75] text-white/40 italic m-0">
                        ※ この投稿は管理者により非表示にされました
                      </p>
                    ) : (
                      <>
                        <p className="text-sm leading-[1.75] text-white/80 m-0 whitespace-pre-wrap break-words">{renderBody(post.body)}</p>
                        {postImages[post.id]?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {postImages[post.id].map((url) => (
                              <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={url}
                                  alt="投稿画像"
                                  className="h-32 w-32 object-cover rounded-xl border border-white/10"
                                  loading="lazy"
                                />
                              </a>
                            ))}
                          </div>
                        )}
                        {/* グッド / バッド */}
                        <div className="flex items-center gap-2 mt-1.5">
                          {(['good', 'bad'] as const).map((kind) => {
                            const active = myVotes[post.id] === kind;
                            const count =
                              kind === 'good'
                                ? counts[post.id]?.good ?? post.good ?? 0
                                : counts[post.id]?.bad ?? post.bad ?? 0;
                            const accent = kind === 'good' ? '#3de0a0' : '#ff8fc0';
                            return (
                              <button
                                key={kind}
                                type="button"
                                onClick={() => vote(post.id, kind)}
                                className="inline-flex items-center gap-1.5 text-[12px] font-bold rounded-full px-3 py-1 transition-colors"
                                style={{
                                  border: `1px solid ${active ? accent : 'rgba(255,255,255,.14)'}`,
                                  background: active ? `${accent}1f` : 'transparent',
                                  color: active ? accent : 'rgba(244,238,248,.55)',
                                }}
                                aria-pressed={active}
                                title={kind === 'good' ? 'グッド' : 'バッド'}
                              >
                                {kind === 'good' ? <ThumbsUp size={13} /> : <ThumbsDown size={13} />}
                                {count}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* sticky reply box */}
      {!loading && !notFound && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50"
          style={{ background: 'linear-gradient(180deg,rgba(8,6,15,0),rgba(8,6,15,.97) 28%)' }}
        >
          <div className="max-w-[860px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-4 pb-3">
            {full ? (
              <div className="rounded-2xl border border-[#ff2d95]/40 bg-[#ff2d95]/[0.08] px-4 py-3 text-center text-[#ff8fc0] text-[13px] font-bold">
                このスレッドは1000レスに到達したため書き込めません。新しいスレを立ててください。
              </div>
            ) : (
              <>
                <p className="text-[11px] text-white/40 text-center mb-1.5 px-2 leading-relaxed">
                  誹謗中傷・個人情報の晒し・スパム等は禁止。違反投稿は予告なく削除・非表示にされます
                  {imagesEnabled ? '（画像は承認後に表示）' : ''}。
                </p>
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-white/15 bg-white/[0.06] p-2.5 backdrop-blur-md"
              >
                {/* ハニーポット（人間には見えない。ボットが埋めると送信を弾く） */}
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
                {/* 選択中の画像プレビュー（画像有効カテゴリのみ） */}
                {imagesEnabled && files.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2 px-1">
                    {files.map((f, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 text-[11px] text-white/70 bg-white/[0.05] border border-white/10 rounded-lg px-2 py-1"
                      >
                        {f.name.length > 18 ? f.name.slice(0, 16) + '…' : f.name}
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
                <div className="flex gap-2.5 items-end">
                {imagesEnabled && (
                  <label className="flex-none cursor-pointer text-white/55 hover:text-[#a78bfa] transition-colors self-center" title="画像を追加（jpg/png/webp・最大3枚）">
                    <ImagePlus size={20} />
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
                )}
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={DEFAULT_NAME}
                  maxLength={30}
                  className="flex-none w-[90px] sm:w-[120px] bg-white/[0.05] border border-white/10 rounded-lg px-2.5 py-2 text-[#f4eef8] text-[12px] outline-none focus:border-[#a78bfa]/60 placeholder:text-white/35"
                />
                <textarea
                  ref={replyRef}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="返信を入力…"
                  rows={1}
                  maxLength={MAX_BODY}
                  className="flex-1 min-w-0 bg-transparent border-none outline-none text-[#f4eef8] text-sm leading-relaxed resize-none py-2 placeholder:text-white/35"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-none text-white text-sm font-extrabold px-4 py-2.5 rounded-xl disabled:opacity-60"
                  style={{ background: 'linear-gradient(95deg,#ff8a3d,#ff2d95 60%,#c44be0)' }}
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
                </div>
              </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
