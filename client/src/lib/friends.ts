import { supabase } from './supabase';
import { getAnonId } from './board';

// フレンド募集（/board/friends）のデータ型・API。
// 書き込みは RPC（create_friend）経由のみ。返信は既存のレス基盤（board_posts /
// create_post）を合成スレッド（friends.thread_id）経由で流用する。

export interface Friend {
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
  created_at: string;
}

// 匿名に許可された公開列だけを明示指定する（select('*') は列権限で拒否されるため）。
const PUBLIC_COLS =
  'id,title,platform,play_style,voice_chat,active_time,age_range,body,contact,thread_id,status,created_at';

// 目的・プレイ内容（play_style 列に保存）。「何をして遊ぶか」の軸。
// プラットフォーム軸（下）と組み合わせて絞り込む。id は DB 保存値、ラベルは i18n キー。
export const FRIEND_PLAY_STYLES = [
  { id: 'casual', labelKey: 'fr.style.casual' },
  { id: 'heist', labelKey: 'fr.style.heist' },
  { id: 'race', labelKey: 'fr.style.race' },
  { id: 'carmeet', labelKey: 'fr.style.carmeet' },
  { id: 'rarecars', labelKey: 'fr.style.rarecars' },
  { id: 'afk', labelKey: 'fr.style.afk' },
  { id: 'serious', labelKey: 'fr.style.serious' },
  { id: 'other', labelKey: 'fr.style.other' },
];

// プラットフォーム（platform 列に保存）。GTAオンラインはクロスプレイ非対応のため、
// フレンド探しでは最重要の絞り込み軸。id は DB 保存値、ラベルは i18n キー。
export const FRIEND_PLATFORMS = [
  { id: 'ps5', labelKey: 'fr.pf.ps5' },
  { id: 'ps4', labelKey: 'fr.pf.ps4' },
  { id: 'xbox_series', labelKey: 'fr.pf.xboxSeries' },
  { id: 'xbox_one', labelKey: 'fr.pf.xboxOne' },
  { id: 'pc_enhanced', labelKey: 'fr.pf.pcEnhanced' },
  { id: 'pc_legacy', labelKey: 'fr.pf.pcLegacy' },
];

// 過去データ（旧カテゴリ）も表示を壊さないためのラベル探索。
const LEGACY_STYLE_LABELS: Record<string, string> = {
  story: 'fr.style.story',
  social: 'fr.style.social',
};

/** play_style の表示ラベルキー。旧値(story/social)も解決。未知なら null。 */
export function friendStyleLabelKey(id: string | null): string | null {
  if (!id) return null;
  const s = FRIEND_PLAY_STYLES.find((x) => x.id === id);
  if (s) return s.labelKey;
  return LEGACY_STYLE_LABELS[id] ?? null;
}

/** platform の表示ラベルキー。未知（旧・自由入力値）は null（呼び出し側で生値にフォールバック）。 */
export function friendPlatformLabelKey(id: string | null): string | null {
  if (!id) return null;
  return FRIEND_PLATFORMS.find((x) => x.id === id)?.labelKey ?? null;
}

/** 公開中のフレンド募集を新しい順に取得。limit でプレビュー件数を絞れる。 */
export async function listPublishedFriends(limit?: number) {
  let query = supabase
    .from('friends')
    .select(PUBLIC_COLS)
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  if (limit) query = query.limit(limit);
  return query;
}

/** 1件取得（公開中のみ）。詳細ページ用。 */
export async function getFriend(id: string) {
  return supabase
    .from('friends')
    .select(PUBLIC_COLS)
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle();
}

/** 募集を掲載（NGワード・IP/Cookie連投制限つきの RPC 経由・即時掲載）。 */
export async function createFriend(f: {
  title: string;
  platform: string | null;
  play_style: string | null;
  voice_chat: string | null;
  active_time: string | null;
  age_range: string | null;
  body: string;
  contact: string | null;
  hp: string; // ハニーポット（人間は空）
}) {
  return supabase.rpc('create_friend', {
    p_title: f.title,
    p_platform: f.platform,
    p_play_style: f.play_style,
    p_voice_chat: f.voice_chat,
    p_active_time: f.active_time,
    p_age_range: f.age_range,
    p_body: f.body,
    p_contact: f.contact,
    p_anon_id: getAnonId(),
    p_hp: f.hp,
  });
}
