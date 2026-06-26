import { supabase } from './supabase';
import { getToken } from './admin';
import type { NewsArticle, NewsCategory } from '@/data/news';

// 管理画面から投稿された DB 記事の取得・管理。
// 静的記事（client/src/data/news.ts）と衝突しないよう、DB記事の表示用 id は
// ID_OFFSET を足した番号にする（URL は /news/<ID_OFFSET + 行id>）。
export const NEWS_ID_OFFSET = 100000;

export interface NewsPostRow {
  id: number;
  title: string;
  description: string;
  body: string;
  category: NewsCategory;
  icon: string;
  eyecatch_url: string | null;
  published: boolean;
  published_at: string; // "YYYY-MM-DD HH:MM"
  created_at: string;
  updated_at: string;
}

/** DB行を、既存コンポーネントがそのまま描画できる NewsArticle 形へ変換。 */
function rowToArticle(r: NewsPostRow): NewsArticle {
  return {
    id: NEWS_ID_OFFSET + Number(r.id),
    title: r.title,
    description: r.description,
    fullContent: r.body,
    icon: r.icon || '📰',
    category: r.category,
    date: (r.published_at || '').slice(0, 10),
    publishedAt: r.published_at || undefined,
    source: 'GTA6 FEED 編集部',
    sourceUrl: '#',
    relatedArticles: [],
    image: r.eyecatch_url || undefined,
  };
}

/** 表示用 id が DB記事のものか（静的記事は小さい番号）。 */
export function isDbArticleId(id: number | string): boolean {
  return Number(id) >= NEWS_ID_OFFSET;
}

/** 公開中の DB 記事を新しい順で取得（一覧・トップ用）。 */
export async function listDbArticles(): Promise<NewsArticle[]> {
  const { data, error } = await supabase
    .from('news_posts')
    .select('*')
    .eq('published', true)
    .order('published_at', { ascending: false });
  if (error) return [];
  return ((data as NewsPostRow[]) ?? []).map(rowToArticle);
}

/** 表示用 id から DB 記事を1件取得（詳細ページ用）。 */
export async function getDbArticle(displayId: number): Promise<NewsArticle | null> {
  const dbId = Number(displayId) - NEWS_ID_OFFSET;
  if (!Number.isFinite(dbId) || dbId <= 0) return null;
  const { data, error } = await supabase
    .from('news_posts')
    .select('*')
    .eq('id', dbId)
    .eq('published', true)
    .maybeSingle();
  if (error || !data) return null;
  return rowToArticle(data as NewsPostRow);
}

// ---- 管理（投稿・編集・削除・一覧） ---------------------------------------

export interface NewsInput {
  title: string;
  description: string;
  body: string;
  category: NewsCategory;
  icon?: string;
  eyecatchUrl?: string | null;
  publishedAt: string; // "YYYY-MM-DD HH:MM"
  published: boolean;
}

function newsErrorMessage(message?: string): string {
  const m = message ?? '';
  if (m.includes('forbidden')) return 'セッションの有効期限が切れています。再ログインしてください';
  if (m.includes('title and body')) return 'タイトルと本文は必須です';
  if (m.includes('invalid category')) return 'カテゴリの指定が不正です';
  return '操作に失敗しました。時間をおいて再度お試しください';
}

/** 管理一覧（非公開含む全件）。 */
export async function adminListNews(): Promise<{ data: NewsPostRow[]; error?: string }> {
  const { data, error } = await supabase.rpc('admin_list_news', { p_token: getToken() });
  if (error) return { data: [], error: newsErrorMessage(error.message) };
  return { data: (data as NewsPostRow[]) ?? [] };
}

/** 記事を作成。新しい行id（オフセット前）を返す。 */
export async function adminCreateNews(input: NewsInput): Promise<{ id?: number; error?: string }> {
  const { data, error } = await supabase.rpc('admin_create_news', {
    p_token: getToken(),
    p_title: input.title,
    p_description: input.description,
    p_body: input.body,
    p_category: input.category,
    p_icon: input.icon ?? null,
    p_eyecatch_url: input.eyecatchUrl ?? null,
    p_published_at: input.publishedAt,
    p_published: input.published,
  });
  if (error) return { error: newsErrorMessage(error.message) };
  return { id: data as number };
}

/** 記事を更新（dbId はオフセット前の行id）。 */
export async function adminUpdateNews(dbId: number, input: NewsInput): Promise<{ error?: string }> {
  const { error } = await supabase.rpc('admin_update_news', {
    p_token: getToken(),
    p_id: dbId,
    p_title: input.title,
    p_description: input.description,
    p_body: input.body,
    p_category: input.category,
    p_icon: input.icon ?? null,
    p_eyecatch_url: input.eyecatchUrl ?? null,
    p_published_at: input.publishedAt,
    p_published: input.published,
  });
  return { error: error ? newsErrorMessage(error.message) : undefined };
}

/** 記事を削除（dbId はオフセット前の行id）。 */
export async function adminDeleteNews(dbId: number): Promise<{ error?: string }> {
  const { error } = await supabase.rpc('admin_delete_news', { p_token: getToken(), p_id: dbId });
  return { error: error ? newsErrorMessage(error.message) : undefined };
}
