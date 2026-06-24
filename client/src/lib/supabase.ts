import { createClient } from '@supabase/supabase-js';

// Supabase 接続情報。
// publishable（anon）キーは公開front用で、ブラウザに露出して問題ない設計のキー。
// データの保護は Supabase 側の RLS（Row Level Security）ポリシーで行う。
//
// 環境変数（VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY）があればそれを使い、
// 無ければ既定値にフォールバックする（未設定でも従来どおり動く）。
// ※ VITE_* はビルド時にバンドルへ埋め込まれる。別プロジェクトへ移行する場合は
//   デプロイ環境（Vercel 等）の環境変数に設定してから再ビルドすること。
const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  'https://uawyuxegcywatkfgyycp.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  'sb_publishable_56-mcQqzWE-afZce8zFb7Q_qhGAclS3';

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
