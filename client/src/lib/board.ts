import { supabase } from './supabase';

// GTARPプレイヤー交流掲示板のデータ型・API。
// 書き込みは RPC（create_thread / create_post）経由のみ。

export interface BoardThread {
  id: string;
  board: string;
  title: string;
  created_at: string;
  last_posted_at: string;
  post_count: number;
  icon: string | null;
}

// スレッド作成時に選べるプリセットアイコン（client/public/images/icon/ に実体を配置）。
// 値は createThread の許可リスト（board_thread_icon.sql）と一致させること。
export const BOARD_ICONS = [
  'Official_Cover_Art_square.jpg',
  'Jason_and_Lucia_01_square.jpg',
  'Jason_and_Lucia_02_square.jpg',
  'Jason_and_Lucia_03_square.jpg',
  'Jason_and_Lucia_Motel_square.jpg',
  'Boobie_Ike_square.jpg',
  'Brian_Heder_square.jpg',
  'Cal_Hampton_square.jpg',
  'DreQuan_Priest_square.jpg',
  'Raul_Bautista_square.jpg',
  'Real_Dimez_square.jpg',
];

/** プリセットアイコンのファイル名から公開URLを作る。 */
export function boardIconUrl(icon: string): string {
  return `/images/icon/${icon}`;
}

export interface BoardPost {
  id: string;
  thread_id: string;
  post_number: number;
  name: string;
  body: string;
  created_at: string;
  hidden: boolean;
  good: number;
  bad: number;
}

export type VoteKind = 'good' | 'bad';

/** 通報理由の選択肢（report_post の許可集合と一致させること） */
export const REPORT_REASONS: { value: string; label: string }[] = [
  { value: 'harassment', label: '誹謗中傷・ハラスメント' },
  { value: 'personal_info', label: '個人情報・晒し' },
  { value: 'spam', label: 'スパム・宣伝' },
  { value: 'obscene', label: 'わいせつ・グロテスク' },
  { value: 'impersonation', label: '虚偽情報・なりすまし' },
  { value: 'other', label: 'その他' },
];

export const DEFAULT_NAME = '名無しさん';
export const MAX_TITLE = 60;
export const MAX_BODY = 2000;
/** 連投防止のクールダウン（ミリ秒） */
export const POST_COOLDOWN_MS = 8000;

export async function listThreads(board: string) {
  return supabase
    .from('board_threads')
    .select('*')
    .eq('board', board)
    .order('last_posted_at', { ascending: false })
    .limit(100);
}

// 全掲示板を横断して最近動いたスレッドを取得（トップのサイドレール用）
export async function listRecentThreads(limit = 5) {
  return supabase
    .from('board_threads')
    .select('*')
    .order('last_posted_at', { ascending: false })
    .limit(limit);
}

export async function getThread(id: string) {
  return supabase.from('board_threads').select('*').eq('id', id).single();
}

export async function listPosts(threadId: string) {
  // ip 列は意図的に取得しない（匿名ユーザーには公開しない。管理はSupabase管理画面で）
  // hidden は取得する（非表示投稿は本文を伏せて「あぼーん」表示し、採番は維持する）
  return supabase
    .from('board_posts')
    .select('id, thread_id, post_number, name, body, created_at, hidden, good, bad')
    .eq('thread_id', threadId)
    .order('post_number', { ascending: true });
}

// このブラウザの投票記録（postId → 'good'|'bad'）。UI のハイライト用。
const VOTES_KEY = 'board_votes';
export function loadMyVotes(): Record<string, VoteKind> {
  try {
    return JSON.parse(localStorage.getItem(VOTES_KEY) || '{}');
  } catch {
    return {};
  }
}
export function saveMyVote(postId: string, kind: VoteKind | null): void {
  try {
    const m = loadMyVotes();
    if (kind) m[postId] = kind;
    else delete m[postId];
    localStorage.setItem(VOTES_KEY, JSON.stringify(m));
  } catch {
    /* ignore */
  }
}

/** レスにグッド/バッド投票（1人1票・同じボタンで取消・反対側で切替）。新しい集計を返す。 */
export async function votePost(postId: string, kind: VoteKind) {
  return supabase.rpc('vote_post', {
    p_post_id: postId,
    p_kind: kind,
    p_anon_id: getAnonId(),
  });
}

/** 投稿を通報する（ログイン不要）。reason は REPORT_REASONS の value。 */
export async function reportPost(postId: string, reason: string, detail: string) {
  return supabase.rpc('report_post', {
    p_post_id: postId,
    p_reason: reason,
    p_detail: detail || null,
  });
}

// 匿名ID（このブラウザを示す永続ID）。荒らし対策の突合用に投稿へ付与する。
const ANON_ID_KEY = 'vh_anon_id';
export function getAnonId(): string {
  try {
    let id = localStorage.getItem(ANON_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ANON_ID_KEY, id);
    }
    return id;
  } catch {
    return '';
  }
}

export async function createThread(
  board: string, title: string, name: string, body: string, icon?: string | null,
) {
  return supabase.rpc('create_thread', {
    p_board: board,
    p_title: title,
    p_name: name,
    p_body: body,
    p_anon_id: getAnonId(),
    p_icon: icon ?? null,
  });
}

export async function createPost(threadId: string, name: string, body: string) {
  return supabase.rpc('create_post', {
    p_thread_id: threadId,
    p_name: name,
    p_body: body,
    p_anon_id: getAnonId(),
  });
}

/** スレッド内のレス番号から、そのレスの id を取得（画像をレスに紐付けるため）。 */
export async function getPostId(threadId: string, postNumber: number): Promise<string | null> {
  const { data } = await supabase
    .from('board_posts')
    .select('id')
    .eq('thread_id', threadId)
    .eq('post_number', postNumber)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

// フレンド募集・クルー募集の合成スレ（board='friends'/'crews'）は、掲示板横断検索の
// 対象外にする（返信やカード本文がスレ検索結果に混ざらないように）。専用ページで扱う。
const EXCLUDED_SEARCH_BOARDS = '(friends,crews)';

/** レス本文を全文検索（非表示・friends/crews は除外）。スレタイ・板も一緒に取得。 */
export async function searchPosts(q: string) {
  return supabase
    .from('board_posts')
    .select('thread_id, post_number, body, created_at, hidden, board_threads!inner(title, board)')
    .ilike('body', `%${q}%`)
    .eq('hidden', false)
    .not('board_threads.board', 'in', EXCLUDED_SEARCH_BOARDS)
    .order('created_at', { ascending: false })
    .limit(50);
}

/** スレッドのタイトルを検索（friends/crews は除外）。 */
export async function searchThreads(q: string) {
  return supabase
    .from('board_threads')
    .select('id, title, board, last_posted_at, post_count')
    .ilike('title', `%${q}%`)
    .not('board', 'in', EXCLUDED_SEARCH_BOARDS)
    .order('last_posted_at', { ascending: false })
    .limit(50);
}

/** RPC のエラーメッセージを利用者向けの日本語に変換する */
export function boardErrorMessage(message?: string): string {
  const m = message ?? '';
  if (m.includes('banned word')) return '禁止ワードが含まれているため投稿できません';
  if (m.includes('blocked')) return '現在この掲示板に投稿できません（管理者による制限）';
  if (m.includes('duplicate body')) return '同じ内容を連続で投稿することはできません';
  if (m.includes('duplicate report')) return 'この投稿はすでに通報済みです';
  if (m.includes('rate limited')) return '連投はできません。少し時間をおいてから投稿してください';
  if (m.includes('thread full')) return 'このスレッドは1000レスに達したため書き込めません';
  return '投稿に失敗しました。時間をおいて再度お試しください';
}

/** 投稿日時を 5ch 風に整形（例: 2026-06-22 12:34） */
export function formatPostDate(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
