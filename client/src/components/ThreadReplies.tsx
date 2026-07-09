import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Send, Loader2, Reply, ThumbsUp, ThumbsDown } from 'lucide-react';
import ReportDialog from '@/components/ReportDialog';
import { toast } from 'sonner';
import {
  listPosts,
  createPost,
  formatPostDate,
  boardErrorMessage,
  votePost,
  loadMyVotes,
  saveMyVote,
  DEFAULT_NAME,
  MAX_BODY,
  POST_COOLDOWN_MS,
  type BoardPost,
  type VoteKind,
} from '@/lib/board';
import { useT, useLang } from '@/lib/i18n';

const COOLDOWN_KEY = 'board_last_post';
const REPORTED_KEY = 'board_reported_posts';

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

interface ThreadRepliesProps {
  /** 返信を積むスレッド（カードの合成スレ）の ID。 */
  threadId: string;
  /**
   * 表示を始めるレス番号。カード詳細では通報用オープニング投稿(#1)＝本文の複製を
   * ヘッダーと重複させないため 2 を渡す（既定は 1）。
   */
  startNumber?: number;
}

/**
 * スレッドの返信一覧＋返信フォームの共有コンポーネント。
 * board_posts / create_post / vote_post / report_post をそのまま流用し、
 * BoardThread と friends/crews の詳細ページで共通のレス体験を提供する。
 * （画像添付は扱わない。画像は BoardThread 側の専用機能）
 */
export default function ThreadReplies({ threadId, startNumber = 1 }: ThreadRepliesProps) {
  const tr = useT();
  const lang = useLang();

  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reported, setReported] = useState<Set<string>>(loadReported);
  const [counts, setCounts] = useState<Record<string, { good: number; bad: number }>>({});
  const [myVotes, setMyVotes] = useState<Record<string, VoteKind>>(loadMyVotes);
  const [hp, setHp] = useState('');
  const [highlight, setHighlight] = useState<number | null>(null);
  const replyRef = useRef<HTMLTextAreaElement>(null);

  const markReported = (postId: string) => {
    setReported((prev) => {
      const next = new Set(prev).add(postId);
      localStorage.setItem(REPORTED_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const replyTo = (n: number) => {
    setBody((prev) => `${prev}${prev && !prev.endsWith('\n') ? '\n' : ''}>>${n}\n`);
    replyRef.current?.focus();
  };

  const jumpToPost = (n: number) => {
    const el = document.getElementById(`post-${n}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlight(n);
    window.setTimeout(() => setHighlight((cur) => (cur === n ? null : cur)), 3000);
  };

  // 本文中の >>N をアンカーに、URL をリンクに変換する
  const renderBody = (text: string): ReactNode[] => {
    const parts: ReactNode[] = [];
    const re = /(>>\d+)|(https?:\/\/[^\s<>"']+)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    let k = 0;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) parts.push(text.slice(last, m.index));
      if (m[1]) {
        const n = Number(m[1].slice(2));
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
      } else {
        let url = m[2];
        let trail = '';
        const tm = url.match(/[)\]}>＞、。，．,.!?！？…]+$/);
        if (tm) {
          trail = tm[0];
          url = url.slice(0, url.length - trail.length);
        }
        parts.push(
          <a
            key={k++}
            href={url}
            target="_blank"
            rel="noopener noreferrer nofollow ugc"
            className="text-[#22d3ee] hover:text-[#7df9ff] underline underline-offset-2 break-all"
          >
            {url}
          </a>,
        );
        if (trail) parts.push(trail);
      }
      last = m.index + m[0].length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts;
  };

  const extractYoutubeIds = (text: string): string[] => {
    const re =
      /(?:youtube\.com\/(?:watch\?(?:[^\s]*&)?v=|live\/|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/g;
    const ids: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (!ids.includes(m[1])) ids.push(m[1]);
    }
    return ids;
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await listPosts(threadId);
    if (error) {
      console.error(error);
      setPosts([]);
    } else {
      const arr = (data as BoardPost[]) ?? [];
      setPosts(arr);
      setCounts(
        Object.fromEntries(arr.map((p) => [p.id, { good: p.good ?? 0, bad: p.bad ?? 0 }])),
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  const vote = async (postId: string, kind: VoteKind) => {
    const { data, error } = await votePost(postId, kind);
    if (error) {
      toast.error(tr('brd.toast.voteFail'));
      return;
    }
    const r = data as { good: number; bad: number; my: VoteKind | null };
    setCounts((c) => ({ ...c, [postId]: { good: r.good, bad: r.bad } }));
    setMyVotes((mv) => {
      const next = { ...mv };
      if (r.my) next[postId] = r.my;
      else delete next[postId];
      return next;
    });
    saveMyVote(postId, r.my);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hp) return; // ハニーポット＝ボット。静かに無視。
    if (!body.trim()) {
      toast.error(tr('brd.toast.bodyReq'));
      return;
    }
    const last = Number(localStorage.getItem(COOLDOWN_KEY) || 0);
    if (Date.now() - last < POST_COOLDOWN_MS) {
      toast.error(tr('brd.toast.tooFast'));
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
    toast.success(tr('brd.toast.posted'));
    load();
  };

  const visible = posts.filter((p) => p.post_number >= startNumber);
  const full = posts.some((p) => p.post_number >= 1000);

  return (
    <>
      {/* replies */}
      {loading ? (
        <div className="text-center py-10 text-white/50">
          <Loader2 size={24} className="mx-auto mb-3 animate-spin" /> {tr('brd.loading')}
        </div>
      ) : visible.length === 0 ? (
        <p className="text-center py-10 text-white/40 text-sm">{tr('rep.empty')}</p>
      ) : (
        <div className="flex flex-col">
          {visible.map((post) => (
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
                {post.name.trim().charAt(0) || (lang === 'en' ? 'A' : '名')}
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
                        title={lang === 'en' ? 'Reply to this post' : 'このレスに返信'}
                      >
                        <Reply size={12} /> {tr('brd.replyAction')}
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
                  <p className="text-sm leading-[1.75] text-white/40 italic m-0">{tr('brd.hiddenPost')}</p>
                ) : (
                  <>
                    <p className="text-sm leading-[1.75] text-white/80 m-0 whitespace-pre-wrap break-words">
                      {renderBody(post.body)}
                    </p>
                    {extractYoutubeIds(post.body).map((vid) => (
                      <div key={vid} className="article-video mt-3 max-w-[480px]">
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${vid}`}
                          title="YouTube video player"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          loading="lazy"
                        />
                      </div>
                    ))}
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
                            title={kind === 'good' ? tr('brd.good') : tr('brd.bad')}
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
      )}

      {/* sticky reply box */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{ background: 'linear-gradient(180deg,rgba(8,6,15,0),rgba(8,6,15,.97) 28%)' }}
      >
        <div
          className="max-w-[860px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-4 pb-3"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
        >
          {full ? (
            <div className="rounded-2xl border border-[#ff2d95]/40 bg-[#ff2d95]/[0.08] px-4 py-3 text-center text-[#ff8fc0] text-[13px] font-bold">
              {tr('brd.full')}
            </div>
          ) : (
            <>
              <p className="text-[11px] text-white/40 text-center mb-1.5 px-2 leading-relaxed">
                {lang === 'en'
                  ? 'No harassment, doxxing, spam, etc. Violating posts may be removed or hidden without notice.'
                  : '誹謗中傷・個人情報の晒し・スパム等は禁止。違反投稿は予告なく削除・非表示にされます。'}
              </p>
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-white/15 bg-white/[0.06] p-2.5 backdrop-blur-md"
              >
                {/* ハニーポット */}
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
                <div className="flex gap-2.5 items-end">
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
                    placeholder={tr('brd.replyPlaceholder')}
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
    </>
  );
}
