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
  const { data, error } = await supabase.rpc('admin_reports', { p_token: adminToken });
  if (error) {
    handleAuthError(error.message);
    return { data: [], error: adminErrorMessage(error.message) };
  }
  return { data: (data as ReportRow[]) ?? [] };
}

export async function setPostHidden(postId: string, hidden: boolean, reason?: string) {
  const { error } = await supabase.rpc('admin_set_post_hidden', {
    p_token: adminToken,
    p_post_id: postId,
    p_hidden: hidden,
    p_reason: reason ?? null,
  });
  if (error) handleAuthError(error.message);
  return { error: error ? adminErrorMessage(error.message) : undefined };
}

export async function setPostNote(postId: string, note: string) {
  const { error } = await supabase.rpc('admin_set_post_note', {
    p_token: adminToken,
    p_post_id: postId,
    p_note: note,
  });
  if (error) handleAuthError(error.message);
  return { error: error ? adminErrorMessage(error.message) : undefined };
}

export interface PostMeta {
  ip: string | null;
  ip_hash: string | null;
  ip_subnet: string | null;
  ua: string | null;
  anon_id: string | null;
  created_at: string;
  hidden: boolean;
  delete_reason: string | null;
  admin_note: string | null;
  report_count: number;
  same_ip_count: number;
  same_anon_count: number;
  recent_24h_same_ip: number;
}

export async function getPostMeta(postId: string): Promise<{ data?: PostMeta; error?: string }> {
  const { data, error } = await supabase.rpc('admin_post_meta', {
    p_token: adminToken,
    p_post_id: postId,
  });
  if (error) {
    handleAuthError(error.message);
    return { error: adminErrorMessage(error.message) };
  }
  const row = (data as PostMeta[] | null)?.[0];
  return { data: row };
}

// ---- 投稿ログ（全投稿を横断） --------------------------------------------

export interface AdminPostRow {
  id: string;
  board: string;
  thread_id: string;
  post_number: number;
  name: string;
  body: string;
  hidden: boolean;
  ip: string | null;
  ua: string | null;
  anon_id: string | null;
  created_at: string;
  report_count: number;
}

export async function listAdminPosts(): Promise<{ data: AdminPostRow[]; error?: string }> {
  const { data, error } = await supabase.rpc('admin_list_posts', { p_token: adminToken, p_limit: 100 });
  if (error) {
    handleAuthError(error.message);
    return { data: [], error: adminErrorMessage(error.message) };
  }
  return { data: (data as AdminPostRow[]) ?? [] };
}

/** IP（部分一致）／匿名Cookie ID（完全一致）で投稿を検索。 */
export async function searchAdminPosts(opts: {
  ip?: string;
  anon?: string;
}): Promise<{ data: AdminPostRow[]; error?: string }> {
  const { data, error } = await supabase.rpc('admin_search_posts', {
    p_token: adminToken,
    p_ip: opts.ip ?? null,
    p_anon: opts.anon ?? null,
  });
  if (error) {
    handleAuthError(error.message);
    return { data: [], error: adminErrorMessage(error.message) };
  }
  return { data: (data as AdminPostRow[]) ?? [] };
}

// ---- 自動ブロック（IP / サブネット / Cookie） -----------------------------

export interface BlockRow {
  id: string;
  kind: 'ip' | 'ip_subnet' | 'anon';
  value: string;
  reason: string | null;
  created_at: string;
  expires_at: string | null;
}

export async function listBlocks(): Promise<{ data: BlockRow[]; error?: string }> {
  const { data, error } = await supabase.rpc('admin_list_blocks', { p_token: adminToken });
  if (error) {
    handleAuthError(error.message);
    return { data: [], error: adminErrorMessage(error.message) };
  }
  return { data: (data as BlockRow[]) ?? [] };
}

export async function addBlock(kind: BlockRow['kind'], value: string, reason?: string, days?: number) {
  const { error } = await supabase.rpc('admin_add_block', {
    p_token: adminToken,
    p_kind: kind,
    p_value: value,
    p_reason: reason ?? null,
    p_days: days ?? null,
  });
  if (error) handleAuthError(error.message);
  return { error: error ? adminErrorMessage(error.message) : undefined };
}

export async function removeBlock(id: string) {
  const { error } = await supabase.rpc('admin_remove_block', { p_token: adminToken, p_id: id });
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

// ---- お問い合わせ ---------------------------------------------------------

export interface ContactRow {
  id: string;
  name: string;
  email: string | null;
  message: string;
  images: string[] | null;
  created_at: string;
}

export async function listContacts(): Promise<{ data: ContactRow[]; error?: string }> {
  const { data, error } = await supabase.rpc('admin_list_contacts', { p_token: adminToken });
  if (error) {
    handleAuthError(error.message);
    return { data: [], error: adminErrorMessage(error.message) };
  }
  return { data: (data as ContactRow[]) ?? [] };
}

export async function deleteContact(id: string) {
  const { error } = await supabase.rpc('admin_delete_contact', { p_token: adminToken, p_id: id });
  if (error) handleAuthError(error.message);
  return { error: error ? adminErrorMessage(error.message) : undefined };
}

// ---- 記事コメント ---------------------------------------------------------

export interface NewsCommentRow {
  id: string;
  article_id: string;
  name: string;
  body: string;
  ip: string | null;
  ua: string | null;
  anon_id: string | null;
  ip_subnet: string | null;
  hidden: boolean;
  created_at: string;
}

export async function listNewsComments(): Promise<{ data: NewsCommentRow[]; error?: string }> {
  const { data, error } = await supabase.rpc('admin_list_news_comments', { p_token: adminToken });
  if (error) {
    handleAuthError(error.message);
    return { data: [], error: adminErrorMessage(error.message) };
  }
  return { data: (data as NewsCommentRow[]) ?? [] };
}

export async function setNewsCommentHidden(id: string, hidden: boolean) {
  const { error } = await supabase.rpc('admin_set_news_comment_hidden', {
    p_token: adminToken,
    p_comment_id: id,
    p_hidden: hidden,
  });
  if (error) handleAuthError(error.message);
  return { error: error ? adminErrorMessage(error.message) : undefined };
}

export async function deleteNewsComment(id: string) {
  const { error } = await supabase.rpc('admin_delete_news_comment', { p_token: adminToken, p_comment_id: id });
  if (error) handleAuthError(error.message);
  return { error: error ? adminErrorMessage(error.message) : undefined };
}

// ---- 検索ログ -------------------------------------------------------------

export interface SearchLogRow {
  id: string;
  query: string;
  scope: string;
  results_count: number;
  created_at: string;
}

export interface TopSearchRow {
  query: string;
  cnt: number;
  zero_hits: number;
  last_at: string;
}

export async function listSearches(): Promise<{ data: SearchLogRow[]; error?: string }> {
  const { data, error } = await supabase.rpc('admin_list_searches', { p_token: adminToken });
  if (error) {
    handleAuthError(error.message);
    return { data: [], error: adminErrorMessage(error.message) };
  }
  return { data: (data as SearchLogRow[]) ?? [] };
}

export async function topSearches(days = 30): Promise<{ data: TopSearchRow[]; error?: string }> {
  const { data, error } = await supabase.rpc('admin_top_searches', { p_token: adminToken, p_days: days });
  if (error) {
    handleAuthError(error.message);
    return { data: [], error: adminErrorMessage(error.message) };
  }
  return { data: (data as TopSearchRow[]) ?? [] };
}

// ---- GTARP鯖別 掲載申請 ----------------------------------------------------

export interface ApplicationRow {
  id: string;
  server_name: string;
  description: string;
  contact: string | null;
  applicant: string | null;
  approved: boolean;
  created_at: string;
}

export async function listApplications(): Promise<{ data: ApplicationRow[]; error?: string }> {
  const { data, error } = await supabase.rpc('admin_list_applications', { p_token: adminToken });
  if (error) {
    handleAuthError(error.message);
    return { data: [], error: adminErrorMessage(error.message) };
  }
  return { data: (data as ApplicationRow[]) ?? [] };
}

/** 申請を承認 → gtarp-servers にスレッド作成。新スレIDを返す。 */
export async function approveApplication(id: string) {
  const { data, error } = await supabase.rpc('admin_approve_application', {
    p_token: adminToken,
    p_id: id,
  });
  if (error) handleAuthError(error.message);
  return { data: data as string | null, error: error ? adminErrorMessage(error.message) : undefined };
}

export async function deleteApplication(id: string) {
  const { error } = await supabase.rpc('admin_delete_application', { p_token: adminToken, p_id: id });
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
