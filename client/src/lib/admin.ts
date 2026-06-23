import { supabase } from './supabase';

// アプリ内管理者のクライアント側ロジック。
// 合言葉はここにも置かない。ユーザーが入力した合言葉を admin_login RPC に送り、
// サーバー側で bcrypt 照合 → 短命トークンを受け取る。
// トークンはメモリのみで保持（localStorage/sessionStorage は使わない）。
//  → ページをリロードすると再ログインが必要（管理者のみの想定なので許容）。

let adminToken: string | null = null;
// ログイン状態の変化を購読する（管理画面の再描画用）
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

export function subscribeAdmin(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getToken(): string | null {
  return adminToken;
}

export function isLoggedIn(): boolean {
  return adminToken !== null;
}

/** 合言葉でログイン。成功すればトークンをメモリに保持する。 */
export async function login(secret: string): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('admin_login', { p_secret: secret });
  if (error || !data) {
    return { ok: false, error: adminErrorMessage(error?.message) };
  }
  adminToken = data as string;
  notify();
  return { ok: true };
}

export async function logout(): Promise<void> {
  if (adminToken) {
    await supabase.rpc('admin_logout', { p_token: adminToken });
  }
  adminToken = null;
  notify();
}

/** RPC のエラーメッセージを管理者向けの日本語に変換する */
export function adminErrorMessage(message?: string): string {
  const m = message ?? '';
  if (m.includes('too many attempts'))
    return '試行回数が多すぎます。しばらく待ってから再度お試しください';
  if (m.includes('forbidden')) return '合言葉が違うか、セッションの有効期限が切れています';
  return '操作に失敗しました。時間をおいて再度お試しください';
}

// セッション切れ（forbidden）を検知したらログアウト状態に戻す
function handleAuthError(message?: string) {
  if ((message ?? '').includes('forbidden')) {
    adminToken = null;
    notify();
  }
}

// ---- 通報の管理 -----------------------------------------------------------

export interface ReportRow {
  post_id: string;
  thread_id: string;
  board: string;
  post_number: number;
  body: string;
  hidden: boolean;
  report_count: number;
  reasons: string[];
  last_reported_at: string;
  status: string;
}

export async function listReports(): Promise<{ data: ReportRow[]; error?: string }> {
  const { data, error } = await supabase.rpc('admin_list_reports', { p_token: adminToken });
  if (error) {
    handleAuthError(error.message);
    return { data: [], error: adminErrorMessage(error.message) };
  }
  return { data: (data as ReportRow[]) ?? [] };
}

export async function setPostHidden(postId: string, hidden: boolean) {
  const { error } = await supabase.rpc('admin_set_post_hidden', {
    p_token: adminToken,
    p_post_id: postId,
    p_hidden: hidden,
  });
  if (error) handleAuthError(error.message);
  return { error: error ? adminErrorMessage(error.message) : undefined };
}

export async function deletePost(postId: string) {
  const { error } = await supabase.rpc('admin_delete_post', {
    p_token: adminToken,
    p_post_id: postId,
  });
  if (error) handleAuthError(error.message);
  return { error: error ? adminErrorMessage(error.message) : undefined };
}

export async function resolveReports(postId: string) {
  const { error } = await supabase.rpc('admin_resolve_reports', {
    p_token: adminToken,
    p_post_id: postId,
  });
  if (error) handleAuthError(error.message);
  return { error: error ? adminErrorMessage(error.message) : undefined };
}

/** 申請制ジャンルへ管理者としてスレッドを立てる（認可付き）。新スレIDを返す。 */
export async function adminCreateThread(board: string, title: string, name: string, body: string) {
  const { data, error } = await supabase.rpc('admin_create_thread', {
    p_token: adminToken,
    p_board: board,
    p_title: title,
    p_name: name,
    p_body: body,
  });
  if (error) handleAuthError(error.message);
  return { data: data as string | null, error };
}

// ---- 画像の承認キュー（②・デフォルトOFF） --------------------------------

export interface PendingImage {
  id: string;
  thread_id: string | null;
  post_id: string | null;
  storage_path: string;
  mime: string;
  created_at: string;
  signed_url?: string;
}

export async function listPendingImages(): Promise<{ data: PendingImage[]; error?: string }> {
  const { data, error } = await supabase.rpc('admin_list_pending_images', { p_token: adminToken });
  if (error) {
    handleAuthError(error.message);
    return { data: [], error: adminErrorMessage(error.message) };
  }
  return { data: (data as PendingImage[]) ?? [] };
}

export async function approveImage(imageId: string) {
  const { error } = await supabase.rpc('admin_approve_image', {
    p_token: adminToken,
    p_image_id: imageId,
  });
  if (error) handleAuthError(error.message);
  return { error: error ? adminErrorMessage(error.message) : undefined };
}

export async function rejectImage(imageId: string) {
  const { error } = await supabase.rpc('admin_reject_image', {
    p_token: adminToken,
    p_image_id: imageId,
  });
  if (error) handleAuthError(error.message);
  return { error: error ? adminErrorMessage(error.message) : undefined };
}

export async function setBoardImageSetting(
  board: string,
  enabled: boolean,
  requireApproval: boolean,
) {
  const { error } = await supabase.rpc('admin_set_board_image_setting', {
    p_token: adminToken,
    p_board: board,
    p_enabled: enabled,
    p_require_approval: requireApproval,
  });
  if (error) handleAuthError(error.message);
  return { error: error ? adminErrorMessage(error.message) : undefined };
}
