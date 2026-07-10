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
  // admin_login は失敗時に例外ではなく NULL を返す（失敗ログを残すため）。
  // error は通信/タイムアウト等、data が空は合言葉不一致。
  if (error) return { ok: false, error: adminErrorMessage(error.message) };
  if (!data) return { ok: false, error: '合言葉が違います' };
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
  if (m.includes('locked'))
    return 'ログイン試行が多すぎるため一時的にロックされています。しばらく待ってから再度お試しください';
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
  // まず専用RPC（reasons等の詳細つき）を試す。
  const primary = await supabase.rpc('admin_reports', { p_token: adminToken });
  if (!primary.error) {
    return { data: (primary.data as ReportRow[]) ?? [] };
  }
  handleAuthError(primary.error.message);
  // セッション切れ等はそのままエラー表示。
  if ((primary.error.message ?? '').includes('forbidden')) {
    return { data: [], error: adminErrorMessage(primary.error.message) };
  }
  // フォールバック：動作確認済みの admin_list_posts（report_count を持つ）から
  // 通報数>0 の投稿を抽出して通報一覧を再構成する（reasons は取得できない）。
  const fb = await supabase.rpc('admin_list_posts', { p_token: adminToken, p_limit: 200 });
  if (fb.error) {
    handleAuthError(fb.error.message);
    return { data: [], error: adminErrorMessage(fb.error.message) };
  }
  const rows: ReportRow[] = ((fb.data as AdminPostRow[]) ?? [])
    .filter((p) => p.report_count > 0)
    .map((p) => ({
      post_id: p.id,
      thread_id: p.thread_id,
      board: p.board,
      post_number: p.post_number,
      body: p.body,
      hidden: p.hidden,
      report_count: p.report_count,
      reasons: [],
      last_reported_at: p.created_at,
      status: 'open',
    }));
  return { data: rows };
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

/** 投稿ログの1ページの件数（「もっと見る」で offset を増やして遡る）。 */
export const ADMIN_POSTS_PAGE = 200;

export async function listAdminPosts(
  board?: string,
  offset = 0,
): Promise<{ data: AdminPostRow[]; error?: string }> {
  // p_board / p_offset は必要なときだけ渡す。未選択かつ先頭ページのときは渡さないことで、
  // board/offset 対応SQL を適用する前でも従来の admin_list_posts(token, limit) で動く。
  const params: Record<string, unknown> = { p_token: adminToken, p_limit: ADMIN_POSTS_PAGE };
  if (board) params.p_board = board;
  if (offset > 0) params.p_offset = offset;
  const { data, error } = await supabase.rpc('admin_list_posts', params);
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

// ---- 募集掲示板（フレンド／クルー）の管理 ---------------------------------
export interface FriendAdminRow {
  id: string;
  title: string;
  platform: string | null;
  play_style: string | null;
  voice_chat: string | null;
  active_time: string | null;
  age_range: string | null;
  body: string;
  contact: string | null;
  thread_id: string | null;
  status: string;
  ip: string | null;
  ua: string | null;
  anon_id: string | null;
  ip_subnet: string | null;
  created_at: string;
}

export interface CrewAdminRow {
  id: string;
  crew_name: string;
  title: string;
  platform: string | null;
  genre: string | null;
  size: string | null;
  requirements: string | null;
  active_time: string | null;
  body: string;
  contact: string | null;
  thread_id: string | null;
  status: string;
  ip: string | null;
  ua: string | null;
  anon_id: string | null;
  ip_subnet: string | null;
  created_at: string;
}

export async function listFriends(): Promise<{ data: FriendAdminRow[]; error?: string }> {
  const { data, error } = await supabase.rpc('admin_list_friends', { p_token: adminToken });
  if (error) {
    handleAuthError(error.message);
    return { data: [], error: adminErrorMessage(error.message) };
  }
  return { data: (data as FriendAdminRow[]) ?? [] };
}

export async function listCrews(): Promise<{ data: CrewAdminRow[]; error?: string }> {
  const { data, error } = await supabase.rpc('admin_list_crews', { p_token: adminToken });
  if (error) {
    handleAuthError(error.message);
    return { data: [], error: adminErrorMessage(error.message) };
  }
  return { data: (data as CrewAdminRow[]) ?? [] };
}

/** カードを削除（合成スレ→CASCADE で返信・通報・投票も消える）。 */
export async function deleteFriend(id: string) {
  const { error } = await supabase.rpc('admin_delete_friend', { p_token: adminToken, p_id: id });
  if (error) handleAuthError(error.message);
  return { error: error ? adminErrorMessage(error.message) : undefined };
}

export async function deleteCrew(id: string) {
  const { error } = await supabase.rpc('admin_delete_crew', { p_token: adminToken, p_id: id });
  if (error) handleAuthError(error.message);
  return { error: error ? adminErrorMessage(error.message) : undefined };
}

/** カードの公開ステータスを切り替える（'published' | 'hidden'）。 */
export async function setFriendStatus(id: string, status: 'published' | 'hidden') {
  const { error } = await supabase.rpc('admin_set_friend_status', {
    p_token: adminToken,
    p_id: id,
    p_status: status,
  });
  if (error) handleAuthError(error.message);
  return { error: error ? adminErrorMessage(error.message) : undefined };
}

export async function setCrewStatus(id: string, status: 'published' | 'hidden') {
  const { error } = await supabase.rpc('admin_set_crew_status', {
    p_token: adminToken,
    p_id: id,
    p_status: status,
  });
  if (error) handleAuthError(error.message);
  return { error: error ? adminErrorMessage(error.message) : undefined };
}

// フレンド募集カードを合成スレ経由で削除（通報→カード削除用）。CASCADE で post/通報/投票も消える。
export async function deleteFriendByThread(threadId: string) {
  const { error } = await supabase.rpc('admin_delete_friend_by_thread', {
    p_token: adminToken,
    p_thread_id: threadId,
  });
  if (error) handleAuthError(error.message);
  return { error: error ? adminErrorMessage(error.message) : undefined };
}

// クルー募集カードを合成スレ経由で削除。
export async function deleteCrewByThread(threadId: string) {
  const { error } = await supabase.rpc('admin_delete_crew_by_thread', {
    p_token: adminToken,
    p_thread_id: threadId,
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

// ---- スレッドの一覧・削除 -------------------------------------------------

export interface AdminThreadRow {
  id: string;
  board: string;
  title: string;
  post_count: number;
  created_at: string;
  last_posted_at: string;
  op_body: string | null;
}

/** スレッド一覧（板で絞り込み可・新着順）。board 未指定で全板。 */
export async function listAdminThreads(
  board?: string,
): Promise<{ data: AdminThreadRow[]; error?: string }> {
  const { data, error } = await supabase.rpc('admin_list_threads', {
    p_token: adminToken,
    p_board: board ?? null,
  });
  if (error) {
    handleAuthError(error.message);
    return { data: [], error: adminErrorMessage(error.message) };
  }
  return { data: (data as AdminThreadRow[]) ?? [] };
}

/** スレッドを丸ごと削除（レス・投票・通報・画像も連鎖削除）。 */
export async function deleteThread(threadId: string) {
  const { error } = await supabase.rpc('admin_delete_thread', {
    p_token: adminToken,
    p_thread_id: threadId,
  });
  if (error) handleAuthError(error.message);
  return { error: error ? adminErrorMessage(error.message) : undefined };
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
  ip: string | null;
  ua: string | null;
  anon_id: string | null;
  ip_subnet: string | null;
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
  board: string;
  server_name: string;
  description: string;
  contact: string | null;
  applicant: string | null;
  approved: boolean;
  ip: string | null;
  ua: string | null;
  anon_id: string | null;
  ip_subnet: string | null;
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

// ---- FiveMサーバー募集板（fivem_servers）の管理 ----
export interface FivemServerRow {
  id: string;
  name: string;
  description: string;
  type: string;
  connect_info: string | null;
  discord_url: string | null;
  language: string | null;
  tags: string[] | null;
  icon: string | null;
  ip: string | null;
  ua: string | null;
  anon_id: string | null;
  ip_subnet: string | null;
  created_at: string;
}

export async function listFivemServers(): Promise<{ data: FivemServerRow[]; error?: string }> {
  const { data, error } = await supabase.rpc('admin_list_fivem_servers', { p_token: adminToken });
  if (error) {
    handleAuthError(error.message);
    return { data: [], error: adminErrorMessage(error.message) };
  }
  return { data: (data as FivemServerRow[]) ?? [] };
}

export async function deleteFivemServer(id: string) {
  const { error } = await supabase.rpc('admin_delete_fivem_server', { p_token: adminToken, p_id: id });
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
