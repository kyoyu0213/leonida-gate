import { createClient } from '@supabase/supabase-js';

// Supabase 接続情報。
// publishable（anon）キーは公開front用で、ブラウザに露出して問題ない設計のキー。
// データの保護は Supabase 側の RLS（Row Level Security）ポリシーで行う。
// プロジェクトを移行する場合はこの2つを差し替えるだけでよい。
const SUPABASE_URL = 'https://uawyuxegcywatkfgyycp.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_56-mcQqzWE-afZce8zFb7Q_qhGAclS3';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// FiveM サーバー掲示板の1件分の型
export interface FivemServer {
  id: string;
  name: string;
  description: string;
  type: string;
  connect_info: string | null;
  discord_url: string | null;
  language: string | null;
  tags: string[];
  approved: boolean;
  created_at: string;
}
