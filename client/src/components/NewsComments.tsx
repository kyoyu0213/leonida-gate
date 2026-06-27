import { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Send, Loader2, ThumbsUp, ThumbsDown, CornerDownRight, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  listNewsComments,
  createNewsComment,
  voteNewsComment,
  loadMyCommentVotes,
  saveMyCommentVote,
  newsCommentErrorMessage,
  NEWS_COMMENT_MAX_BODY,
  NEWS_COMMENT_COOLDOWN_MS,
  type NewsComment,
  type NewsCommentVoteKind,
} from '@/lib/newsComments';
import { formatPostDate } from '@/lib/board';
import { useT } from '@/lib/i18n';

const COOLDOWN_KEY = 'news_comment_last';

interface Props {
  articleId: string;
  // コメント件数が変わったら親に通知（記事トップの「コメントへ」ボタンの件数表示に使う）
  onCountChange?: (count: number) => void;
}

export default function NewsComments({ articleId, onCountChange }: Props) {
  const t = useT();
  const [comments, setComments] = useState<NewsComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myVotes, setMyVotes] = useState<Record<string, NewsCommentVoteKind>>({});
  // 返信中のコメントID（nullなら返信フォーム非表示）
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await listNewsComments(articleId);
    if (!error) {
      const list = (data as NewsComment[]) ?? [];
      setComments(list);
      onCountChange?.(list.length);
    }
    setLoading(false);
  };

  useEffect(() => {
    setMyVotes(loadMyCommentVotes());
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  // トップレベルと返信に分け、親IDごとに返信をまとめる。
  const { topLevel, repliesByParent } = useMemo(() => {
    const top: NewsComment[] = [];
    const byParent: Record<string, NewsComment[]> = {};
    for (const c of comments) {
      if (c.parent_id) {
        (byParent[c.parent_id] ??= []).push(c);
      } else {
        top.push(c);
      }
    }
    return { topLevel: top, repliesByParent: byParent };
  }, [comments]);

  const postComment = async (text: string, parentId: string | null): Promise<boolean> => {
    const last = Number(localStorage.getItem(COOLDOWN_KEY) || 0);
    if (Date.now() - last < NEWS_COMMENT_COOLDOWN_MS) {
      toast.error(t('cmt.toast.tooFast'));
      return false;
    }
    const { error } = await createNewsComment(articleId, name.trim(), text.trim(), parentId);
    if (error) {
      toast.error(newsCommentErrorMessage(error.message));
      return false;
    }
    localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
    toast.success(parentId ? t('cmt.toast.replied') : t('cmt.toast.posted'));
    await load();
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) {
      toast.error(t('cmt.toast.required'));
      return;
    }
    setSubmitting(true);
    const ok = await postComment(body, null);
    setSubmitting(false);
    if (ok) setBody('');
  };

  const handleVote = async (commentId: string, kind: NewsCommentVoteKind) => {
    const { data, error } = await voteNewsComment(commentId, kind);
    if (error || !data) {
      toast.error(t('cmt.toast.voteFail'));
      return;
    }
    const res = data as { good: number; bad: number; my: NewsCommentVoteKind | null };
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, good: res.good, bad: res.bad } : c)),
    );
    saveMyCommentVote(commentId, res.my);
    setMyVotes(loadMyCommentVotes());
  };

  const inputClass =
    'w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-[#f4eef8] placeholder:text-white/35 focus:outline-none focus:border-cyan-500/60 transition-colors font-sans';

  // 1コメント分の表示（本文＋グッド/バッド＋返信ボタン）。
  const renderComment = (c: NewsComment, isReply: boolean) => {
    const my = myVotes[c.id];
    return (
      <div
        key={c.id}
        className={`rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 ${
          isReply ? 'mt-2 ml-5 sm:ml-8 border-l-2 border-l-cyan-500/30' : ''
        }`}
      >
        <div className="flex items-center gap-2.5 mb-1.5">
          {isReply && <CornerDownRight size={13} className="text-cyan-400/70 flex-none" />}
          <span className="text-sm font-bold text-white">{c.name}</span>
          <span className="text-[11.5px] text-white/40 font-mono">{formatPostDate(c.created_at)}</span>
        </div>
        <p className="text-sm leading-[1.8] text-white/80 m-0 whitespace-pre-wrap break-words">
          {c.body}
        </p>

        {/* アクション行：グッド / バッド / 返信 */}
        <div className="flex items-center gap-2 mt-2.5">
          <button
            type="button"
            onClick={() => handleVote(c.id, 'good')}
            aria-label={t('cmt.good')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono border transition-colors ${
              my === 'good'
                ? 'border-emerald-400/60 bg-emerald-400/15 text-emerald-300'
                : 'border-white/12 text-white/55 hover:border-emerald-400/40 hover:text-emerald-300'
            }`}
          >
            <ThumbsUp size={13} /> {c.good ?? 0}
          </button>
          <button
            type="button"
            onClick={() => handleVote(c.id, 'bad')}
            aria-label={t('cmt.bad')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono border transition-colors ${
              my === 'bad'
                ? 'border-rose-400/60 bg-rose-400/15 text-rose-300'
                : 'border-white/12 text-white/55 hover:border-rose-400/40 hover:text-rose-300'
            }`}
          >
            <ThumbsDown size={13} /> {c.bad ?? 0}
          </button>
          {/* 返信は親コメントにのみ表示（1階層） */}
          {!isReply && (
            <button
              type="button"
              onClick={() => setReplyTo((cur) => (cur === c.id ? null : c.id))}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono border border-white/12 text-white/55 hover:border-cyan-400/40 hover:text-cyan-300 transition-colors"
            >
              <CornerDownRight size={13} /> {t('cmt.reply')}
            </button>
          )}
        </div>

        {/* 返信フォーム（このコメントに返信中のときだけ） */}
        {!isReply && replyTo === c.id && (
          <ReplyForm
            inputClass={inputClass}
            name={name}
            onNameChange={setName}
            onCancel={() => setReplyTo(null)}
            onSubmit={async (text) => {
              const ok = await postComment(text, c.id);
              if (ok) setReplyTo(null);
              return ok;
            }}
          />
        )}
      </div>
    );
  };

  return (
    <section id="news-comments" className="mt-12 scroll-mt-24">
      <h2 className="flex items-center gap-2 text-2xl font-bold mb-6 text-[#22d3ee] font-mono">
        <MessageSquare size={22} /> {t('cmt.title')}
        <span className="text-base text-white/40">（{comments.length}）</span>
      </h2>

      {/* 投稿フォーム */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 mb-8 space-y-3"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('cmt.namePh')}
          maxLength={30}
          className={inputClass}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t('cmt.bodyPh')}
          rows={3}
          maxLength={NEWS_COMMENT_MAX_BODY}
          className={`${inputClass} resize-none`}
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 text-white font-extrabold px-6 py-2.5 rounded-full disabled:opacity-60"
            style={{ background: 'linear-gradient(95deg,#ff8a3d,#ff2d95 60%,#c44be0)' }}
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} {t('cmt.submit')}
          </button>
        </div>
      </form>

      {/* コメント一覧 */}
      {loading ? (
        <div className="text-center py-10 text-white/50">
          <Loader2 size={24} className="mx-auto mb-2 animate-spin" /> {t('cmt.loading')}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-10 text-white/45 font-mono text-sm">{t('cmt.empty')}</div>
      ) : (
        <div className="flex flex-col gap-3">
          {topLevel.map((c) => (
            <div key={c.id}>
              {renderComment(c, false)}
              {(repliesByParent[c.id] ?? []).map((r) => renderComment(r, true))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// 返信フォーム（本文は内部状態。名前は親フォームと共有）。
function ReplyForm({
  inputClass,
  name,
  onNameChange,
  onCancel,
  onSubmit,
}: {
  inputClass: string;
  name: string;
  onNameChange: (v: string) => void;
  onCancel: () => void;
  onSubmit: (text: string) => Promise<boolean>;
}) {
  const t = useT();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      toast.error(t('cmt.toast.required'));
      return;
    }
    setSubmitting(true);
    const ok = await onSubmit(text);
    setSubmitting(false);
    if (ok) setText('');
  };

  return (
    <form onSubmit={submit} className="mt-3 ml-5 sm:ml-8 space-y-2">
      <input
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder={t('cmt.namePh')}
        maxLength={30}
        className={inputClass}
      />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('cmt.replyPh')}
        rows={2}
        maxLength={NEWS_COMMENT_MAX_BODY}
        className={`${inputClass} resize-none`}
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold border border-white/15 text-white/60 hover:text-white/85 transition-colors"
        >
          <X size={15} /> {t('cmt.cancel')}
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 text-white font-extrabold px-5 py-2 rounded-full disabled:opacity-60"
          style={{ background: 'linear-gradient(95deg,#ff8a3d,#ff2d95 60%,#c44be0)' }}
        >
          {submitting ? <Loader2 size={15} className="animate-spin" /> : <CornerDownRight size={15} />}{' '}
          {t('cmt.replySubmit')}
        </button>
      </div>
    </form>
  );
}
