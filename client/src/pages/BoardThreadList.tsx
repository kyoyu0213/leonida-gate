import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, Send, Loader2, MessageSquare, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import { toast } from 'sonner';
import {
  listThreads,
  createThread,
  formatPostDate,
  DEFAULT_NAME,
  MAX_TITLE,
  MAX_BODY,
  POST_COOLDOWN_MS,
  type BoardThread,
} from '@/lib/board';
import { getBoard, ACCENTS } from '@/lib/boards';

const COOLDOWN_KEY = 'board_last_post';

export default function BoardThreadList() {
  const [, navigate] = useLocation();
  const [, params] = useRoute('/board/:slug');
  const slug = params?.slug ?? '';
  const board = getBoard(slug);

  const [threads, setThreads] = useState<BoardThread[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      <div className="min-h-screen bg-background text-foreground pt-16">
        <Header />
        <div className="container py-20 text-center">
          <p className="text-gray-400 font-mono mb-4">掲示板が見つかりません</p>
          <a href="/board" className="text-cyan-400 hover:text-cyan-300 font-mono">
            掲示板一覧に戻る
          </a>
        </div>
      </div>
    );
  }

  const a = ACCENTS[board.accent];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    const { data, error } = await createThread(board.slug, title.trim(), name.trim(), body.trim());
    setSubmitting(false);

    if (error) {
      console.error(error);
      toast.error('スレッドの作成に失敗しました');
      return;
    }

    localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
    toast.success('スレッドを立てました');
    navigate(`/thread/${data as string}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pt-16">
      <Header />

      {/* Back to boards index */}
      <div className={`sticky top-16 z-40 bg-background/80 backdrop-blur-md border-b ${a.border}`}>
        <div className="container py-3">
          <a
            href="/board"
            className={`inline-flex items-center gap-2 ${a.text} hover:opacity-80 transition-opacity font-mono text-sm`}
          >
            <ArrowLeft size={16} />
            掲示板一覧
          </a>
        </div>
      </div>

      {/* Hero */}
      <section className={`relative py-12 px-4 border-b ${a.border}`}>
        <div className="relative max-w-4xl mx-auto text-center">
          <h1
            className={`text-3xl md:text-4xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r ${a.gradient} font-mono`}
          >
            {board.title}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base mb-6 font-mono">
            &gt; {board.description}
          </p>
          <Button
            onClick={() => setShowForm((v) => !v)}
            className={`${a.button} font-mono font-bold shadow-lg`}
          >
            {showForm ? (
              <>
                <X size={16} className="mr-2" /> 閉じる
              </>
            ) : (
              <>
                <Plus size={16} className="mr-2" /> スレを立てる
              </>
            )}
          </Button>
        </div>
      </section>

      {/* New thread form */}
      {showForm && (
        <section className={`py-8 px-4 border-b ${a.border} ${a.bgSoft}`}>
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-mono ${a.text} mb-2`}>スレタイ *</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例: 初心者向けのおすすめRPサーバー教えて"
                  maxLength={MAX_TITLE}
                  className={`bg-background/60 ${a.inputBorder} text-foreground`}
                />
              </div>
              <div>
                <label className={`block text-sm font-mono ${a.text} mb-2`}>
                  名前（空欄で「{DEFAULT_NAME}」）
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={DEFAULT_NAME}
                  maxLength={30}
                  className={`bg-background/60 ${a.inputBorder} text-foreground`}
                />
              </div>
              <div>
                <label className={`block text-sm font-mono ${a.text} mb-2`}>本文（1レス目）*</label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="本文を入力..."
                  rows={5}
                  maxLength={MAX_BODY}
                  className={`bg-background/60 ${a.inputBorder} text-foreground`}
                />
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className={`w-full ${a.button} font-mono font-bold disabled:opacity-60`}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" /> 作成中...
                  </>
                ) : (
                  <>
                    <Send size={16} className="mr-2" /> スレを立てる
                  </>
                )}
              </Button>
            </form>
          </div>
        </section>
      )}

      {/* Thread list */}
      <section className="py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className={`mb-4 ${a.text} font-mono text-sm`}>
            &gt; {loading ? '読み込み中...' : `${threads.length} 件のスレッド`}
          </div>

          {loading ? (
            <div className={`text-center py-16 ${a.text} font-mono`}>
              <Loader2 size={28} className="mx-auto mb-4 animate-spin" />
              &gt; 取得中...
            </div>
          ) : threads.length > 0 ? (
            <div className="space-y-3">
              {threads.map((t) => (
                <a
                  key={t.id}
                  href={`/thread/${t.id}`}
                  className={`block border ${a.border} ${a.borderHover} rounded-lg p-4 bg-background/50 transition-all duration-200`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-bold text-cyan-300 break-words flex-1">{t.title}</h3>
                    <span className={`shrink-0 inline-flex items-center gap-1 text-xs font-mono ${a.text}`}>
                      <MessageSquare size={13} />
                      {t.post_count}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-mono text-muted-foreground">
                    最終更新: {formatPostDate(t.last_posted_at)}
                  </p>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <MessageSquare size={40} className={`mx-auto mb-4 ${a.text} opacity-50`} />
              <p className="text-gray-400 font-mono mb-4">&gt; まだスレッドがありません</p>
              <Button
                onClick={() => setShowForm(true)}
                className={`${a.button} font-mono font-bold`}
              >
                <Plus size={16} className="mr-2" /> 最初のスレを立てる
              </Button>
            </div>
          )}
        </div>
      </section>

      <footer className={`border-t ${a.border} py-8 px-4 text-center text-gray-500 font-mono text-sm`}>
        <p>&copy; 2026 Leonida Gate. All rights reserved.</p>
      </footer>
    </div>
  );
}
