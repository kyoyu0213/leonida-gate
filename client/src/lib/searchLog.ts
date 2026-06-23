import { supabase } from './supabase';

// 検索キーワードの記録（キーワード・スコープ・件数のみ。個人情報は送らない）。
// 失敗しても検索体験に影響させない（fire-and-forget）。
export function logSearch(query: string, scope: 'all' | 'board', results: number): void {
  const q = query.trim();
  if (!q) return;
  void supabase.rpc('log_search', { p_query: q, p_scope: scope, p_results: results });
}
