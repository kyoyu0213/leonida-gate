import { useEffect, useState } from 'react';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  listNewsComments,
  createNewsComment,
  newsCommentErrorMessage,
  NEWS_COMMENT_DEFAULT_NAME,
  NEWS_COMMENT_MAX_BODY,
  NEWS_COMMENT_COOLDOWN_MS,
  type NewsComment,
} from '@/lib/newsComments';
import { formatPostDate } from '@/lib/board';

const COOLDOWN_KEY = 'news_comment_last';

interface Props {
  articleId: string;
}

export default function NewsComments({ articleId }: Props) {
  const [comments, setComments] = useState<NewsComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await listNewsComments(articleId);
    if (!error) setComments((data as NewsComment[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) {
      toast.error('コメントを入力してください');
      return;
    }
    const last = Number(localStorage.getItem(COOLDOWN_KEY) || 0);
    if (Date.now() - last < NEWS_COMMENT_COOLDOWN_MS) {
      toast.error('投稿の間隔が短すぎます。少し待ってください');
      return;
    }
    setSubmitting(true);
    const { error } = await createNewsComment(articleId, name.trim(), body.trim());
    setSubmitting(false);
    if (error) {
      toast.error(newsCommentErrorMessage(error.message));
      return;
    }
    localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
    setBody('');
    toast.success('コメントを投稿しました');
    load();
  };

  const inputClass =
    'w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-[#f4eef8] placeholder:text-white/35 focus:outline-none focus:border-cyan-500/60 transition-colors font-sans';

  return (
    <section className="mt-12">
      <h2 className="flex items-center gap-2 text-2xl font-bold mb-6 text-[#22d3ee] font-mono">
        <MessageSquare size={22} /> コメント
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
          placeholder={`名前（空欄で「${NEWS_COMMENT_DEFAULT_NAME}」）`}
          maxLength={30}
          className={inputClass}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="この記事へのコメントを書く…"
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
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} 投稿する
          </button>
        </div>
      </form>

      {/* コメント一覧 */}
      {loading ? (
        <div className="text-center py-10 text-white/50">
          <Loader2 size={24} className="mx-auto mb-2 animate-spin" /> 取得中…
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-10 text-white/45 font-mono text-sm">
          まだコメントはありません。最初のコメントを書いてみよう。
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {comments.map((c) => (
            <div key={c.id} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="text-sm font-bold text-white">{c.name}</span>
                <span className="text-[11.5px] text-white/40 font-mono">
                  {formatPostDate(c.created_at)}
                </span>
              </div>
              <p className="text-sm leading-[1.8] text-white/80 m-0 whitespace-pre-wrap break-words">
                {c.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
