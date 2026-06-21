import { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import { toast } from 'sonner';
import {
  getThread,
  listPosts,
  createPost,
  formatPostDate,
  DEFAULT_NAME,
  MAX_BODY,
  POST_COOLDOWN_MS,
  type BoardThread as ThreadType,
  type BoardPost,
} from '@/lib/board';
import { getBoard, ACCENTS } from '@/lib/boards';

const COOLDOWN_KEY = 'board_last_post';

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
    if (pe) {
      console.error(pe);
    } else {
      setPosts((p as BoardPost[]) ?? []);
    }
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
      toast.error('投稿に失敗しました');
      return;
    }

    localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
    setBody('');
    toast.success('書き込みました');
    load();
  };

  if (!match) return null;

  const board = getBoard(thread?.board);
  const a = ACCENTS[board?.accent ?? 'lime'];
  const backHref = board ? `/board/${board.slug}` : '/board';

  return (
    <div className="min-h-screen bg-background text-foreground pt-16">
      <Header />

      {/* Back bar */}
      <div className={`sticky top-16 z-40 bg-background/80 backdrop-blur-md border-b ${a.border}`}>
        <div className="container py-3">
          <a
            href={backHref}
            className={`inline-flex items-center gap-2 ${a.text} hover:opacity-80 transition-opacity font-mono text-sm`}
          >
            <ArrowLeft size={16} />
            スレ一覧に戻る
          </a>
        </div>
      </div>

      <section className="py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {loading ? (
            <div className={`text-center py-16 ${a.text} font-mono`}>
              <Loader2 size={28} className="mx-auto mb-4 animate-spin" />
              &gt; 取得中...
            </div>
          ) : notFound ? (
            <div className="text-center py-16">
              <p className="text-gray-400 font-mono mb-4">&gt; スレッドが見つかりません</p>
              <a href="/board" className="text-lime-400 hover:text-lime-300 font-mono">
                スレ一覧に戻る
              </a>
            </div>
          ) : (
            <>
              {/* Thread title */}
              <h1 className="text-2xl md:text-3xl font-bold mb-2 text-cyan-300 break-words font-mono">
                {thread?.title}
              </h1>
              <p className="text-xs font-mono text-muted-foreground mb-6">
                {thread?.post_count} レス
              </p>

              {/* Posts */}
              <div className="space-y-4 mb-10">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    id={`post-${post.post_number}`}
                    className="border-b border-border/40 pb-4"
                  >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono mb-2">
                      <span className={`${a.text} font-bold`}>{post.post_number}</span>
                      <span className="text-pink-400">
                        名前：<span className="text-green-400">{post.name}</span>
                      </span>
                      <span className="text-muted-foreground">{formatPostDate(post.created_at)}</span>
                    </div>
                    <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap break-words pl-1">
                      {post.body}
                    </p>
                  </div>
                ))}
              </div>

              {/* Reply form */}
              {(thread?.post_count ?? 0) >= 1000 ? (
                <div className="border border-pink-500/40 rounded-lg p-4 bg-pink-500/5 text-center text-pink-300 font-mono text-sm">
                  このスレッドは1000レスに到達したため、書き込めません。新しいスレを立ててください。
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className={`border ${a.border} rounded-lg p-5 ${a.bgSoft} space-y-4`}
                >
                  <p className={`${a.text} font-mono text-sm`}>◆ この話題に書き込む</p>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={`名前（空欄で「${DEFAULT_NAME}」）`}
                    maxLength={30}
                    className={`bg-background/60 ${a.inputBorder} text-foreground`}
                  />
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="本文を入力..."
                    rows={4}
                    maxLength={MAX_BODY}
                    className={`bg-background/60 ${a.inputBorder} text-foreground`}
                  />
                  <Button
                    type="submit"
                    disabled={submitting}
                    className={`w-full ${a.button} font-mono font-bold disabled:opacity-60`}
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" /> 書き込み中...
                      </>
                    ) : (
                      <>
                        <Send size={16} className="mr-2" /> 書き込む
                      </>
                    )}
                  </Button>
                </form>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
