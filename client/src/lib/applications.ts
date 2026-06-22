import { supabase } from './supabase';

// GTARP鯖別掲示板の「スレッド作成申請」。
// ユーザーが申請 → 管理者が内容確認のうえスレッドを作成する。
export async function submitServerApplication(data: {
  server_name: string;
  description: string;
  contact: string;
  applicant: string;
}) {
  return supabase.from('server_applications').insert({
    server_name: data.server_name,
    description: data.description,
    contact: data.contact || null,
    applicant: data.applicant || null,
    // approved は DB 側のデフォルト false（申請制）
  });
}
