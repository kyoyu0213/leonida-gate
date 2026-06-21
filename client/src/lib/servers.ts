import { supabase } from './supabase';

// 承認済みのFiveMサーバーを新しい順に取得。limit を渡すと件数を絞る（Topのプレビュー用）。
export async function listApprovedServers(limit?: number) {
  let query = supabase
    .from('fivem_servers')
    .select('*')
    .eq('approved', true)
    .order('created_at', { ascending: false });

  if (limit) query = query.limit(limit);
  return query;
}
