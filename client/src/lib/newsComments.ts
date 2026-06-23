import { supabase } from './supabase';
import { getAnonId } from './board';

// ニュース記事へのコメント（supabase/news_comments.sql）。
// 投稿はログイン不要。NGワード＋連投制限はサーバー側（create_news_comment）で行う。

export interface NewsComment {
  id: string;
  article_id: string;
  name: string;
  body: string;
  created_at: string;
}

export const NEWS_COMMENT_DEFAULT_NAME = '名無しさん';
export const NEWS_COMMENT_MAX_BODY = 1000;
/** 連投防止のクールダウン（ミリ秒）。サーバー側は8秒。 */
export const NEWS_COMMENT_COOLDOWN_MS = 8000;

export async function listNewsComments(articleId: string) {
  // hidden=false のみ RLS で返る。IP は非公開。
  return supabase
    .from('news_comments')
    .select('id, article_id, name, body, created_at')
    .eq('article_id', articleId)
    .order('created_at', { ascending: true });
}

export async function createNewsComment(articleId: string, name: string, body: string) {
  return supabase.rpc('create_news_comment', {
    p_article_id: articleId,
    p_name: name,
    p_body: body,
    p_anon_id: getAnonId(),
  });
}

/** RPC のエラーメッセージを利用者向けの日本語に変換する */
export function newsCommentErrorMessage(message?: string): string {
  const m = message ?? '';
  if (m.includes('banned word')) return '禁止ワードが含まれているため投稿できません';
  if (m.includes('blocked')) return '現在コメントを投稿できません（管理者による制限）';
  if (m.includes('rate limited')) return '連投はできません。少し時間をおいてから投稿してください';
  return 'コメントの投稿に失敗しました。時間をおいて再度お試しください';
}
