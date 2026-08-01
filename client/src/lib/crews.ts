import { supabase } from './supabase';
import { getAnonId } from './board';

// クルー募集（/board/crews）のデータ型・API。friends と同型（フィルタは genre）。
// 書き込みは RPC（create_crew）経由のみ。返信は合成スレッド（crews.thread_id）経由で
// 既存のレス基盤（board_posts / create_post）を流用する。

export interface Crew {
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
  author_name: string | null;
  thread_id: string | null;
  status: string; // 'published' | 'closed'（募集終了）
  created_at: string;
}

// 匿名に許可された公開列だけを明示指定する（select('*') は列権限で拒否されるため）。
// delete_key_hash は非公開（GRANT していない）ので含めない。
const PUBLIC_COLS =
  'id,crew_name,title,platform,genre,size,requirements,active_time,body,contact,author_name,thread_id,status,created_at';

// カテゴリ内フィルタ（genre）。id は DB 保存値、ラベルは i18n キー。
export const CREW_GENRES = [
  { id: 'RP', labelKey: 'cr.genre.RP' },
  { id: 'race', labelKey: 'cr.genre.race' },
  { id: 'freeroam', labelKey: 'cr.genre.freeroam' },
  { id: 'combat', labelKey: 'cr.genre.combat' },
  { id: 'social', labelKey: 'cr.genre.social' },
  { id: 'other', labelKey: 'cr.genre.other' },
];

// プラットフォーム（platform 列に保存）。GTAオンラインはクロスプレイ非対応のため、
// クルー探しでも最重要の絞り込み軸。フレンド募集と同じ選択肢。
export const CREW_PLATFORMS = [
  { id: 'ps5', labelKey: 'cr.pf.ps5' },
  { id: 'ps4', labelKey: 'cr.pf.ps4' },
  { id: 'xbox_series', labelKey: 'cr.pf.xboxSeries' },
  { id: 'xbox_one', labelKey: 'cr.pf.xboxOne' },
  { id: 'pc_enhanced', labelKey: 'cr.pf.pcEnhanced' },
  { id: 'pc_legacy', labelKey: 'cr.pf.pcLegacy' },
];

/** platform の表示ラベルキー。未知（旧・自由入力値）は null（呼び出し側で生値にフォールバック）。 */
export function crewPlatformLabelKey(id: string | null): string | null {
  if (!id) return null;
  return CREW_PLATFORMS.find((x) => x.id === id)?.labelKey ?? null;
}

/** 公開中のクルー募集を新しい順に取得。 */
export async function listPublishedCrews(limit?: number) {
  let query = supabase
    .from('crews')
    .select(PUBLIC_COLS)
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  if (limit) query = query.limit(limit);
  return query;
}

/** 1件取得（公開＝published／募集終了＝closed）。詳細ページ用。 */
export async function getCrew(id: string) {
  return supabase
    .from('crews')
    .select(PUBLIC_COLS)
    .eq('id', id)
    .in('status', ['published', 'closed'])
    .maybeSingle();
}

/** 募集を掲載（NGワード・IP/Cookie連投制限つきの RPC 経由・即時掲載）。 */
export async function createCrew(c: {
  crew_name: string;
  title: string;
  platform: string | null;
  genre: string | null;
  size: string | null;
  requirements: string | null;
  active_time: string | null;
  body: string;
  contact: string | null;
  author_name?: string | null; // 掲示板フォーム更新前でも動くよう任意
  delete_key?: string | null;
  hp: string; // ハニーポット（人間は空）
}) {
  return supabase.rpc('create_crew', {
    p_crew_name: c.crew_name,
    p_title: c.title,
    p_platform: c.platform,
    p_genre: c.genre,
    p_size: c.size,
    p_requirements: c.requirements,
    p_active_time: c.active_time,
    p_body: c.body,
    p_contact: c.contact,
    p_anon_id: getAnonId(),
    p_hp: c.hp,
    p_author_name: c.author_name ?? null,
    p_delete_key: c.delete_key ?? null,
  });
}

/** 本人による削除（削除キー or 同一ブラウザ anon_id で認可）。
 *  返信ありは 'closed'（募集終了）、返信なしは 'deleted'（完全削除）を返す。 */
export async function deleteOwnCrew(id: string, deleteKey: string | null) {
  return supabase.rpc('delete_own_crew', {
    p_id: id,
    p_delete_key: deleteKey,
    p_anon_id: getAnonId(),
  });
}

/** 本人による編集（認可は削除と同じ）。 */
export async function updateOwnCrew(
  id: string,
  c: {
    crew_name: string;
    title: string;
    platform: string | null;
    genre: string | null;
    size: string | null;
    requirements: string | null;
    active_time: string | null;
    body: string;
    contact: string | null;
    author_name: string | null;
  },
  deleteKey: string | null,
) {
  return supabase.rpc('update_own_crew', {
    p_id: id,
    p_crew_name: c.crew_name,
    p_title: c.title,
    p_platform: c.platform,
    p_genre: c.genre,
    p_size: c.size,
    p_requirements: c.requirements,
    p_active_time: c.active_time,
    p_body: c.body,
    p_contact: c.contact,
    p_author_name: c.author_name,
    p_delete_key: deleteKey,
    p_anon_id: getAnonId(),
  });
}
