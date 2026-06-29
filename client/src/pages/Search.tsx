import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useSearch } from 'wouter';
import { Search as SearchIcon, Loader2, Newspaper, MessageSquare } from 'lucide-react';
import Header from '@/components/Header';
import { newsArticles, CATEGORY_CONFIG, type NewsArticle } from '@/data/news';
import { searchPosts, searchThreads, formatPostDate } from '@/lib/board';
import { getBoard, boardColor } from '@/lib/boards';
import { logSearch } from '@/lib/searchLog';
import { useT } from '@/lib/i18n';
import { useSeo } from '@/hooks/useSeo';

interface BoardHit {
  key: string;
  threadId: string;
  title: string;
  board: string;
  postNumber?: number;
  snippet: string;
  date: string;
}

// 検索ワードに一致する部分を <mark> で強調表示する（大文字小文字を無視）
function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const parts: ReactNode[] = [];
  const lower = text.toLowerCase();
  const ql = q.toLowerCase();
  let i = 0;
  let idx: number;
  let k = 0;
  while ((idx = lower.indexOf(ql, i)) !== -1) {
    if (idx > i) parts.push(text.slice(i, idx));
    parts.push(
      <mark key={k++} className="bg-[#ffe27a] text-[#1c1730] rounded-sm px-0.5">
        {text.slice(idx, idx + q.length)}
      </mark>,
    );
    i = idx + q.length;
  }
  parts.push(text.slice(i));
  return <>{parts}</>;
}

// 一致箇所の前後を抜き出して読みやすいスニペットにする
const makeSnippet = (text: string, q: string, len = 120): string => {
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text.slice(0, len) + (text.length > len ? '…' : '');
  const start = Math.max(0, i - 30);
  const slice = text.slice(start, start + len);
  return (start > 0 ? '…' : '') + slice + (start + len < text.length ? '…' : '');
};

export default function SearchPage() {
  const t = useT();
  useSeo(t('seo.search.title'), t('seo.search.desc'), { url: '/search' });
  const search = useSearch();
  const params = new URLSearchParams(search);
  const q = (params.get('q') ?? '').trim();
  // scope=board のときは掲示板のみを検索対象にする
  const boardOnly = params.get('scope') === 'board';

  const [loading, setLoading] = useState(false);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [board, setBoard] = useState<BoardHit[]>([]);
  const loggedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!q) {
      setNews([]);
      setBoard([]);
      return;
    }
    let cancelled = false;

    const run = async () => {
      setLoading(true);

      // ニュース記事（タイトル・説明・本文をクライアント側で検索）。掲示板スコープ時は対象外。
      const lower = q.toLowerCase();
      const newsHits = boardOnly
        ? []
        : newsArticles.filter(
            (a) =>
              a.title.toLowerCase().includes(lower) ||
              a.description.toLowerCase().includes(lower) ||
              a.fullContent.toLowerCase().includes(lower),
          );

      // 掲示板（スレタイ＋レス本文）
      const [{ data: threads }, { data: posts }] = await Promise.all([
        searchThreads(q),
        searchPosts(q),
      ]);

      const hits: BoardHit[] = [];
      const seen = new Set<string>();
      const push = (h: BoardHit) => {
        if (seen.has(h.key)) return;
        seen.add(h.key);
        hits.push(h);
      };

      (threads ?? []).forEach((t: any) =>
        push({
          key: `t-${t.id}`,
          threadId: t.id,
          title: t.title,
          board: t.board,
          snippet: t.title,
          date: t.last_posted_at,
        }),
      );
      (posts ?? []).forEach((p: any) => {
        const th = Array.isArray(p.board_threads) ? p.board_threads[0] : p.board_threads;
        push({
          key: `p-${p.thread_id}-${p.post_number}`,
          threadId: p.thread_id,
          title: th?.title ?? '(無題)',
          board: th?.board ?? '',
          postNumber: p.post_number,
          snippet: makeSnippet(p.body, q),
          date: p.created_at,
        });
      });

      if (!cancelled) {
        setNews(newsHits);
        setBoard(hits);
        setLoading(false);
        // 検索キーワードを記録（同じ語の重複ログは避ける）
        const key = `${boardOnly ? 'board' : 'all'}:${q.toLowerCase()}`;
        if (loggedRef.current !== key) {
          loggedRef.current = key;
          logSearch(q, boardOnly ? 'board' : 'all', newsHits.length + hits.length);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [q, search, boardOnly]);

  const total = news.length + board.length;

  return (
    <div className="vice-page vice-noise">
      <Header />
      <main className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[100px] pb-20 relative z-10">
        <span className="text-xs font-extrabold tracking-[0.2em] text-[#a78bfa] uppercase">
          {boardOnly ? 'Board Search' : 'Search'}
        </span>
        <h1 className="font-black text-3xl md:text-[40px] leading-tight mt-2 mb-1">
          {boardOnly ? '掲示板内検索' : '検索'}
        </h1>
        {q ? (
          <p className="text-white/55 text-sm mb-7">
            「<span className="font-bold text-white">{q}</span>」の検索結果
            {!loading && <span className="text-white/40">（{total}件）</span>}
          </p>
        ) : (
          <p className="text-white/55 text-sm mb-7">キーワードを入力して検索してください。</p>
        )}

        {loading ? (
          <div className="text-center py-16 text-white/50">
            <Loader2 size={26} className="mx-auto mb-3 animate-spin" /> 検索中…
          </div>
        ) : q && total === 0 ? (
          <div className="text-center py-16 text-white/50">一致する記事・投稿は見つかりませんでした。</div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* ニュース記事 */}
            {news.length > 0 && (
              <section>
                <h2 className="flex items-center gap-2 text-lg font-black mb-3 text-white">
                  <Newspaper size={18} className="text-[#22d3ee]" /> ニュース記事
                  <span className="text-sm text-white/40">{news.length}</span>
                </h2>
                <div className="flex flex-col gap-2.5">
                  {news.map((a) => (
                    <a
                      key={a.id}
                      href={`/news/${a.id}`}
                      className="block rounded-2xl border border-black/10 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-2 mb-1 text-[12px]">
                        <span
                          className="font-extrabold rounded px-2 py-0.5"
                          style={{
                            color: CATEGORY_CONFIG[a.category].vice,
                            border: `1px solid ${CATEGORY_CONFIG[a.category].vice}55`,
                          }}
                        >
                          {CATEGORY_CONFIG[a.category].label}
                        </span>
                        <span className="text-black/40">{a.date}</span>
                      </div>
                      <div className="font-bold text-[#15091c]">
                        <Highlight text={a.title} q={q} />
                      </div>
                      <p className="text-[13px] text-black/60 mt-1 line-clamp-2 m-0">
                        <Highlight text={a.description} q={q} />
                      </p>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* 掲示板 */}
            {board.length > 0 && (
              <section>
                <h2 className="flex items-center gap-2 text-lg font-black mb-3 text-white">
                  <MessageSquare size={18} className="text-[#a78bfa]" /> 掲示板
                  <span className="text-sm text-white/40">{board.length}</span>
                </h2>
                <div className="flex flex-col gap-2.5">
                  {board.map((h) => {
                    const b = getBoard(h.board);
                    const href = h.postNumber
                      ? `/thread/${h.threadId}#post-${h.postNumber}`
                      : `/thread/${h.threadId}`;
                    return (
                      <a
                        key={h.key}
                        href={href}
                        className="block rounded-2xl border border-black/10 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-2 mb-1 text-[12px] flex-wrap">
                          <span className="font-bold" style={{ color: boardColor(b?.accent) }}>
                            {b?.title.replace('掲示板', '') ?? h.board}
                          </span>
                          <span className="text-black/30">・</span>
                          <span className="text-black/40">{formatPostDate(h.date)}</span>
                          {h.postNumber && <span className="vice-num text-[#ff2d95]">#{h.postNumber}</span>}
                        </div>
                        <div className="font-bold text-[15px] text-[#15091c]">
                          <Highlight text={h.title} q={q} />
                        </div>
                        {h.postNumber && (
                          <p className="text-[13px] text-black/70 mt-1 whitespace-pre-wrap break-words line-clamp-2 m-0">
                            <Highlight text={h.snippet} q={q} />
                          </p>
                        )}
                      </a>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
