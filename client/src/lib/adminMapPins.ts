// ============================================================================
//  管理画面「マップピン」タブの RPC（supabase/map_pins_admin.sql）。
//
//  lib/admin.ts ではなく別ファイルにしているのは、admin.ts が掲示板など公開ページからも
//  import されていて公開 entry チャンクに入るため。ここは AdminReports（/admin の lazy チャンク）
//  からだけ読むので、公開ページのバンドルに乗らない。
// ============================================================================
import { supabase } from './supabase';
import { getToken, adminErrorMessage, logout } from './admin';

export type MapPinStatus = 'pending' | 'approved' | 'rejected';

export interface AdminMapPinRow {
  id: string;
  map_id: string;
  category: string;
  x: number;
  y: number;
  z: number | null;
  title: string;
  description: string;
  status: MapPinStatus;
  source: 'user' | 'official';
  reviewed_at: string | null;
  review_note: string | null;
  author_name: string | null;
  anon_id: string | null;
  ip: string | null;
  ip_subnet: string | null;
  ua: string | null;
  created_at: string;
}

/** セッション切れ（forbidden）ならログアウト状態に戻す（admin.ts の他の RPC と同じ振る舞い）。 */
function onError(message?: string) {
  if ((message ?? '').includes('forbidden')) void logout();
}

/** map_pins_admin.sql 固有のエラーを日本語に（それ以外は共通の変換へ）。 */
function mapPinAdminError(message?: string, code?: string): string {
  const m = message ?? '';
  // 関数が無い＝SQL 未実行。PostgREST は PGRST202 を返す
  if (code === 'PGRST202' || m.includes('Could not find the function')) {
    return 'マップピンの管理機能は未設定です（supabase/map_pins_admin.sql を実行してください）';
  }
  if (m.includes('out of bounds')) return '地図の範囲外の座標です（X -5500〜6000 / Y -4000〜8000）';
  if (m.includes('invalid title')) return 'タイトルは1〜60文字で入力してください';
  if (m.includes('invalid description')) return '説明は400文字以内で入力してください';
  if (m.includes('invalid category')) return 'カテゴリが不正です';
  if (m.includes('invalid coordinates')) return '座標を確認してください（X・Y は必須、Z は -500〜3000）';
  if (m.includes('invalid note')) return '理由は500文字以内で入力してください';
  if (m.includes('not found')) return 'このピンは見つかりません（削除された可能性があります）';
  return adminErrorMessage(m);
}

export async function listAdminMapPins(
  status: MapPinStatus | 'all',
): Promise<{ data: AdminMapPinRow[]; error?: string }> {
  const { data, error } = await supabase.rpc('admin_list_map_pins', { p_token: getToken(), p_status: status });
  if (error) {
    onError(error.message);
    return { data: [], error: mapPinAdminError(error.message, error.code) };
  }
  // id は bigint。画面側は文字列で扱う（キー・比較を他のテーブルとそろえる）
  const rows = ((data as Record<string, unknown>[]) ?? []).map(
    (r) => ({ ...r, id: String(r.id), x: Number(r.x), y: Number(r.y), z: r.z == null ? null : Number(r.z) }) as AdminMapPinRow,
  );
  return { data: rows };
}

export async function reviewMapPin(id: string, status: 'approved' | 'rejected', note?: string) {
  const { error } = await supabase.rpc('admin_review_map_pin', {
    p_token: getToken(),
    p_id: Number(id),
    p_status: status,
    p_note: note?.trim() ? note.trim() : null,
  });
  if (error) onError(error.message);
  return { error: error ? mapPinAdminError(error.message, error.code) : undefined };
}

export async function updateMapPin(
  id: string,
  f: { category: string; title: string; description: string; x: number; y: number; z: number | null },
) {
  const { error } = await supabase.rpc('admin_update_map_pin', {
    p_token: getToken(),
    p_id: Number(id),
    p_category: f.category,
    p_title: f.title,
    p_description: f.description,
    p_x: f.x,
    p_y: f.y,
    p_z: f.z,
  });
  if (error) onError(error.message);
  return { error: error ? mapPinAdminError(error.message, error.code) : undefined };
}
