import { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { Send, Loader2, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import { toast } from 'sonner';
import {
  getThread,
  listPosts,
  createPost,
  formatPostDate,
  boardErrorMessage,
  DEFAULT_NAME,
  MAX_BODY,
  POST_COOLDOWN_MS,
  type BoardThread as ThreadType,
  type BoardPost,
} from '@/lib/board';
import { getBoard, boardColor as boardColorFor } from '@/lib/boards';

const COOLDOWN_KEY = 'board_last_post';

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
      setThread(t as ThreadType);
      setNotFound(false);
    }
    if (!pe) setPosts((p as BoardPost[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    const { error } = await createPost(threadId, name.trim(), body.trim());
    setSubmitting(false);
    if (error) {
      console.error(error);
      toast.error(boardErrorMessage(error.message));
      return;
    }
    localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
    setBody('');
    toast.success('書き込みました');
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

            {/* posts */}
            <div className="flex flex-col">
              {posts.map((post) => (
                <div key={post.id} id={`post-${post.post_number}`} className="flex gap-3.5 py-[18px] border-b border-white/[0.06]">
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
                    </div>
                    <p className="text-sm leading-[1.75] text-white/90 m-0 whitespace-pre-wrap break-words">{post.body}</p>
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
              <form
                onSubmit={handleSubmit}
                className="flex gap-2.5 items-end rounded-2xl border border-white/15 bg-white/[0.06] p-2.5 backdrop-blur-md"
              >
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={DEFAULT_NAME}
                  maxLength={30}
                  className="flex-none w-[90px] sm:w-[120px] bg-white/[0.05] border border-white/10 rounded-lg px-2.5 py-2 text-[#f4eef8] text-[12px] outline-none focus:border-[#a78bfa]/60 placeholder:text-white/35"
                />
                <textarea
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
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
