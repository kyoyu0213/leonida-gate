// ============================================================================
//  マップのピン（Supabase の map_pins）とチェック消し込み（localStorage）。
//
//  - 読み取りは承認済みだけ（RLS で status='approved' の行しか返らない）。
//    列は公開 allowlist だけを明示指定する（select('*') は列権限で拒否される）。
//  - 投稿は create_map_pin RPC 経由のみ。入った行は pending で、承認されるまで地図に出ない。
//  - supabase/map_pins.sql が未実行の環境では、取得は失敗して空配列、投稿は「準備中」を返す。
// ============================================================================
import { supabase } from './supabase';
import { getAnonId } from './board';

export interface MapPin {
  id: string;
  map_id: string;
  category: string;
  x: number;
  y: number;
  z: number | null;
  title: string;
  description: string;
  source: 'official' | 'user';
  created_at: string;
  /** 公開前プレビューの仮置きピン（DB には無い）。 */
  sample?: boolean;
}

/** 匿名に公開してよい列（map_pins.sql の grant select と一致させる）。 */
export const MAP_PIN_PUBLIC_COLS = 'id,map_id,category,x,y,z,title,description,source,created_at';

/** DB の行（id は bigint）を画面用の形へ。 */
export function toMapPin(r: Record<string, unknown>): MapPin {
  return {
    id: String(r.id),
    map_id: String(r.map_id),
    category: String(r.category),
    x: Number(r.x),
    y: Number(r.y),
    z: r.z == null ? null : Number(r.z),
    title: String(r.title ?? ''),
    description: String(r.description ?? ''),
    source: r.source === 'user' ? 'user' : 'official',
    created_at: String(r.created_at ?? ''),
  };
}

/** 承認済みピンを取得。テーブルが無い・通信失敗は空配列（地図は既存データで動き続ける）。 */
export async function listApprovedMapPins(mapId: string): Promise<MapPin[]> {
  try {
    const { data, error } = await supabase
      .from('map_pins')
      .select(MAP_PIN_PUBLIC_COLS)
      .eq('map_id', mapId)
      .eq('status', 'approved')
      .order('created_at', { ascending: true })
      .limit(2000);
    if (error || !Array.isArray(data)) return [];
    return data.map((r) => toMapPin(r as Record<string, unknown>));
  } catch {
    return [];
  }
}

export interface NewMapPin {
  mapId: string;
  category: string;
  x: number;
  y: number;
  z: number | null;
  title: string;
  description: string;
  authorName: string;
  /** ハニーポット（人間は空）。 */
  hp: string;
}

/** ピンを投稿（承認キューへ）。 */
export function createMapPin(p: NewMapPin) {
  return supabase.rpc('create_map_pin', {
    p_map_id: p.mapId,
    p_category: p.category,
    p_x: p.x,
    p_y: p.y,
    p_z: p.z,
    p_title: p.title,
    p_description: p.description,
    p_author_name: p.authorName,
    p_anon_id: getAnonId(),
    p_hp: p.hp,
  });
}

/** RPC のエラーを利用者向けの日本語に。 */
export function mapPinErrorMessage(message?: string, code?: string): string {
  const m = message ?? '';
  // 関数が無い（SQL 未実行）… PostgREST は PGRST202 を返す
  if (code === 'PGRST202' || m.includes('Could not find the function')) {
    return '投稿機能は準備中です。公開までもう少しお待ちください';
  }
  if (m.includes('rate limited')) return '連続では投稿できません。少し時間をおいてから投稿してください';
  if (m.includes('daily limit')) return '審査待ちの投稿が上限（24時間で10件）に達しています。反映を待ってから投稿してください';
  if (m.includes('banned word')) return '禁止ワードが含まれているため投稿できません';
  if (m.includes('blocked')) return '現在この地図に投稿できません（管理者による制限）';
  if (m.includes('out of bounds')) return '地図の範囲外の座標です。地図上をクリックして座標を入れ直してください';
  if (m.includes('duplicate pin')) return 'すぐ近くに同じカテゴリの場所が登録済み、または審査中です';
  if (m.includes('not accepting')) return 'この地図は現在、投稿を受け付けていません';
  if (m.includes('invalid')) return '入力内容を確認してください（タイトル必須・座標は数値）';
  return '投稿に失敗しました。時間をおいて再度お試しください';
}

// ---------------------------------------------------------------------------
//  チェック消し込み（このブラウザだけに保存）
// ---------------------------------------------------------------------------

/** データセットと版ごとのキー。タイルの版とは独立（ピンIDは版をまたいで変わらない）。 */
const doneKey = (mapId: string) => `vh_map:${mapId}:v1`;
/** ピンの消し込み用キー（map をまたいで衝突しないよう map_id を前に付ける）。 */
export const pinKey = (p: MapPin) => `${p.map_id}:${p.id}`;

export function loadDone(mapId: string): Set<string> {
  try {
    const raw = localStorage.getItem(doneKey(mapId));
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(arr) ? arr.filter((v): v is string => typeof v === 'string') : []);
  } catch {
    return new Set();
  }
}

export function saveDone(mapId: string, done: Set<string>): void {
  try {
    localStorage.setItem(doneKey(mapId), JSON.stringify(Array.from(done)));
  } catch {
    // 容量超過・プライベートモードでも地図は使えるようにする（保存だけ諦める）
  }
}
