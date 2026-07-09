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
  thread_id: string | null;
  status: string;
  created_at: string;
}

// 匿名に許可された公開列だけを明示指定する（select('*') は列権限で拒否されるため）。
const PUBLIC_COLS =
  'id,crew_name,title,platform,genre,size,requirements,active_time,body,contact,thread_id,status,created_at';

// カテゴリ内フィルタ（genre）。id は DB 保存値、ラベルは i18n キー。
export const CREW_GENRES = [
  { id: 'RP', labelKey: 'cr.genre.RP' },
  { id: 'race', labelKey: 'cr.genre.race' },
  { id: 'freeroam', labelKey: 'cr.genre.freeroam' },
  { id: 'combat', labelKey: 'cr.genre.combat' },
  { id: 'social', labelKey: 'cr.genre.social' },
  { id: 'other', labelKey: 'cr.genre.other' },
];

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

/** 1件取得（公開中のみ）。詳細ページ用。 */
export async function getCrew(id: string) {
  return supabase
    .from('crews')
    .select(PUBLIC_COLS)
    .eq('id', id)
    .eq('status', 'published')
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
  });
}
