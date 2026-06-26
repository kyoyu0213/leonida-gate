import { useEffect, useMemo, useState } from 'react';
import { newsByDate, getArticleById, type NewsArticle } from '@/data/news';
import { listDbArticles, getDbArticle, isDbArticleId } from '@/lib/newsDb';

// 静的記事（data/news.ts）と DB 記事（管理画面から投稿）をまとめて扱うためのフック群。

const effDate = (a: NewsArticle) => a.publishedAt || a.date;

/**
 * 静的記事 ＋ 公開中の DB 記事 をマージし、新しい順に並べて返す。
 * 静的記事は同期的に即返し、DB 記事は取得でき次第マージされる（トップ・一覧で使用）。
 */
export function useMergedNews(): { articles: NewsArticle[]; loadingDb: boolean } {
  const [db, setDb] = useState<NewsArticle[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);

  useEffect(() => {
    let alive = true;
    listDbArticles()
      .then((rows) => {
        if (alive) setDb(rows);
      })
      .finally(() => {
        if (alive) setLoadingDb(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const articles = useMemo(
    () =>
      [...db, ...newsByDate].sort(
        (a, b) => effDate(b).localeCompare(effDate(a)) || Number(b.id) - Number(a.id),
      ),
    [db],
  );

  return { articles, loadingDb };
}

/**
 * 表示用 id から記事を1件解決する。静的記事は即返し、DB 記事は取得する。
 * loading は DB 取得中のみ true（静的記事や id 不正のときは false）。
 */
export function useArticleById(id: string | undefined): {
  article: NewsArticle | undefined;
  loading: boolean;
} {
  const staticArticle = id ? getArticleById(id) : undefined;
  const [dbArticle, setDbArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(false);

  const needDb = !staticArticle && id != null && isDbArticleId(id);

  useEffect(() => {
    if (!needDb || id == null) {
      setDbArticle(null);
      return;
    }
    let alive = true;
    setLoading(true);
    getDbArticle(Number(id))
      .then((a) => {
        if (alive) setDbArticle(a);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, needDb]);

  return { article: staticArticle ?? dbArticle ?? undefined, loading: needDb ? loading : false };
}
