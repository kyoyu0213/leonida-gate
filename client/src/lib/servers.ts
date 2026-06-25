import { supabase } from './supabase';
import { getAnonId } from './board';

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

// サーバーを掲載（NGワード・IP連投制限つきの RPC 経由・即時掲載）。
export async function createFivemServer(s: {
  name: string;
  description: string;
  type: string;
  connect_info: string | null;
  discord_url: string | null;
  language: string | null;
  tags: string[];
  icon: string | null; // アイコン画像の Storage パス（任意）
  hp: string; // ハニーポット（人間は空）
}) {
  return supabase.rpc('create_fivem_server', {
    p_name: s.name,
    p_description: s.description,
    p_type: s.type,
    p_connect_info: s.connect_info,
    p_discord_url: s.discord_url,
    p_language: s.language,
    p_tags: s.tags,
    p_anon_id: getAnonId(),
    p_hp: s.hp,
    p_icon: s.icon,
  });
}
