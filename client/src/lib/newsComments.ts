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
  // 返信機能（news_comments_votes_replies.sql 適用後）。未適用時は undefined。
  parent_id?: string | null;
  good?: number;
  bad?: number;
}

export type NewsCommentVoteKind = 'good' | 'bad';

export const NEWS_COMMENT_DEFAULT_NAME = '名無しさん';
export const NEWS_COMMENT_MAX_BODY = 1000;
/** 連投防止のクールダウン（ミリ秒）。サーバー側は8秒。 */
export const NEWS_COMMENT_COOLDOWN_MS = 8000;

const FULL_COLS = 'id, article_id, name, body, created_at, parent_id, good, bad';
const BASIC_COLS = 'id, article_id, name, body, created_at';

export async function listNewsComments(articleId: string) {
  // hidden=false のみ RLS で返る。IP は非公開。
  // good/bad/parent_id 列は news_comments_votes_replies.sql 適用後に存在する。
  // 未適用の環境でも壊れないよう、列が無ければ基本列だけで再取得する。
  const full = await supabase
    .from('news_comments')
    .select(FULL_COLS)
    .eq('article_id', articleId)
    .order('created_at', { ascending: true });
  if (!full.error) return full;
  return supabase
    .from('news_comments')
    .select(BASIC_COLS)
    .eq('article_id', articleId)
    .order('created_at', { ascending: true });
}

/** コメントを投稿する。parentId を渡すと返信になる（1階層）。 */
export async function createNewsComment(
  articleId: string,
  name: string,
  body: string,
  parentId?: string | null,
) {
  const params: Record<string, unknown> = {
    p_article_id: articleId,
    p_name: name,
    p_body: body,
    p_anon_id: getAnonId(),
  };
  // 返信のときだけ p_parent_id を渡す（マイグレーション前でもトップレベル投稿は動く）。
  if (parentId) params.p_parent_id = parentId;
  return supabase.rpc('create_news_comment', params);
}

/** コメントにグッド/バッド投票（1人1票・同じボタンで取消・反対側で切替）。新しい集計を返す。 */
export async function voteNewsComment(commentId: string, kind: NewsCommentVoteKind) {
  return supabase.rpc('vote_news_comment', {
    p_comment_id: commentId,
    p_kind: kind,
    p_anon_id: getAnonId(),
  });
}

// このブラウザの投票記録（commentId → 'good'|'bad'）。UI のハイライト用。
const CMT_VOTES_KEY = 'news_comment_votes';
export function loadMyCommentVotes(): Record<string, NewsCommentVoteKind> {
  try {
    return JSON.parse(localStorage.getItem(CMT_VOTES_KEY) || '{}');
  } catch {
    return {};
  }
}
export function saveMyCommentVote(commentId: string, kind: NewsCommentVoteKind | null): void {
  try {
    const m = loadMyCommentVotes();
    if (kind) m[commentId] = kind;
    else delete m[commentId];
    localStorage.setItem(CMT_VOTES_KEY, JSON.stringify(m));
  } catch {
    /* ignore */
  }
}

/** RPC のエラーメッセージを利用者向けの日本語に変換する */
export function newsCommentErrorMessage(message?: string): string {
  const m = message ?? '';
  if (m.includes('banned word')) return '禁止ワードが含まれているため投稿できません';
  if (m.includes('blocked')) return '現在コメントを投稿できません（管理者による制限）';
  if (m.includes('rate limited')) return '連投はできません。少し時間をおいてから投稿してください';
  if (m.includes('invalid parent')) return '返信先のコメントが見つかりません';
  return 'コメントの投稿に失敗しました。時間をおいて再度お試しください';
}
