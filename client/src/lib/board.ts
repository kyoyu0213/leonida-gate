import { supabase } from './supabase';

// GTARPプレイヤー交流掲示板のデータ型・API。
// 書き込みは RPC（create_thread / create_post）経由のみ。

export interface BoardThread {
  id: string;
  board: string;
  title: string;
  created_at: string;
  last_posted_at: string;
  post_count: number;
}

export interface BoardPost {
  id: string;
  thread_id: string;
  post_number: number;
  name: string;
  body: string;
  created_at: string;
}

export const DEFAULT_NAME = '名無しさん';
export const MAX_TITLE = 60;
export const MAX_BODY = 2000;
/** 連投防止のクールダウン（ミリ秒） */
export const POST_COOLDOWN_MS = 8000;

export async function listThreads(board: string) {
  return supabase
    .from('board_threads')
    .select('*')
    .eq('board', board)
    .order('last_posted_at', { ascending: false })
    .limit(100);
}

export async function getThread(id: string) {
  return supabase.from('board_threads').select('*').eq('id', id).single();
}

export async function listPosts(threadId: string) {
  // ip 列は意図的に取得しない（匿名ユーザーには公開しない。管理はSupabase管理画面で）
  return supabase
    .from('board_posts')
    .select('id, thread_id, post_number, name, body, created_at')
    .eq('thread_id', threadId)
    .order('post_number', { ascending: true });
}

export async function createThread(board: string, title: string, name: string, body: string) {
  return supabase.rpc('create_thread', {
    p_board: board,
    p_title: title,
    p_name: name,
    p_body: body,
  });
}

export async function createPost(threadId: string, name: string, body: string) {
  return supabase.rpc('create_post', {
    p_thread_id: threadId,
    p_name: name,
    p_body: body,
  });
}

/** 投稿日時を 5ch 風に整形（例: 2026-06-22 12:34） */
export function formatPostDate(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
