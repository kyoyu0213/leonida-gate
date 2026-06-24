import { supabase } from './supabase';
import { getAnonId } from './board';

// GTARP鯖別掲示板の「スレッド作成申請」。
// ユーザーが申請 → 管理者が内容確認のうえスレッドを作成する。
// 直接 insert ではなく RPC 経由（連投制限・NGワード・ブロック・メタ保存はサーバー側）。
export async function submitServerApplication(data: {
  server_name: string;
  description: string;
  contact: string;
  applicant: string;
  hp: string; // ハニーポット（人間は空）
}) {
  return supabase.rpc('create_server_application', {
    p_server_name: data.server_name,
    p_description: data.description,
    p_contact: data.contact || null,
    p_applicant: data.applicant || null,
    p_anon_id: getAnonId(),
    p_hp: data.hp,
  });
}
