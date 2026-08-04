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
  author_name: string | null;
  gender: string | null; // 'male' | 'female' | 'other' | null（任意）
  contact_kind: string | null; // 'discord'|'psn'|'xbox'|'rockstar'|'link'|null（null=自動判定）
  thread_id: string | null;
  status: string; // 'published' | 'closed'（募集終了）
  created_at: string;
  reply_count?: number; // 一覧取得時に board_threads.post_count から補完（本文複製の #1 を除いた返信数）
}

// 匿名に許可された公開列だけを明示指定する（select('*') は列権限で拒否されるため）。
// delete_key_hash は非公開（GRANT していない）ので含めない。
const PUBLIC_COLS =
  'id,title,platform,play_style,voice_chat,active_time,age_range,body,contact,author_name,gender,contact_kind,thread_id,status,created_at';

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

// 性別（gender 列に保存）。任意項目で、未指定は非表示。id は DB 保存値、ラベルは i18n キー。
export const FRIEND_GENDERS = [
  { id: 'male', labelKey: 'fr.gender.male' },
  { id: 'female', labelKey: 'fr.gender.female' },
  { id: 'other', labelKey: 'fr.gender.other' },
];

/** gender の表示ラベルキー。未指定・未知は null。 */
export function friendGenderLabelKey(id: string | null): string | null {
  if (!id) return null;
  return FRIEND_GENDERS.find((x) => x.id === id)?.labelKey ?? null;
}

// 連絡先の種類（contact_kind 列に保存）。投稿者が明示的に選ぶ。
// 未選択（null）は従来どおりプラットフォーム＋値から自動判定する。
// id は DB 保存値 兼 ContactBrandIcon の kind、ラベルは i18n キー。
export const FRIEND_CONTACT_KINDS = [
  { id: 'discord', labelKey: 'fr.ck.discord' },
  { id: 'psn', labelKey: 'fr.ck.psn' },
  { id: 'xbox', labelKey: 'fr.ck.xbox' },
  { id: 'rockstar', labelKey: 'fr.ckopt.rockstar' }, // Rockstar ID（ゲーム内フレンド）
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

/** プラットフォーム別バッジ色。PS=紫 / Xbox=緑 / PC=オレンジ（未知は紫）。 */
export function friendPlatformAccent(id: string | null): string {
  switch (id) {
    case 'xbox_series':
    case 'xbox_one':
      return '#34d399'; // 緑
    case 'pc_enhanced':
    case 'pc_legacy':
      return '#ff8a3d'; // オレンジ
    case 'ps5':
    case 'ps4':
    default:
      return '#a78bfa'; // 紫（現状維持・未知も紫）
  }
}

/**
 * 連絡先が「何のID」なのかを示すラベルキー。
 * 「連絡先: lf2manyoriginals」だけでは、投稿者以外にはPSN IDなのかDiscordなのか判別できない。
 * そこで、値の見た目（招待リンク／Discord）を優先し、それ以外はプラットフォームから種別を補う。
 * 値が「Discord: xxx」のように自分で種別を書いている場合は null（二重表示を避ける）。
 */
export function friendContactKindLabelKey(
  contact: string | null,
  platform: string | null,
): string | null {
  const v = (contact ?? '').trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) {
    return /discord\.(gg|com)/i.test(v) ? 'fr.ck.discordLink' : 'fr.ck.link';
  }
  if (/discord/i.test(v)) return 'fr.ck.discord';
  // 「PSN: xxx」「ゲームID：xxx」など、投稿者自身が種別を書いている場合はそのまま出す。
  if (/^[^\s:：]{1,24}[:：]\s*\S/.test(v)) return null;
  switch (platform) {
    case 'ps5':
    case 'ps4':
      return 'fr.ck.psn';
    case 'xbox_series':
    case 'xbox_one':
      return 'fr.ck.xbox';
    case 'pc_enhanced':
    case 'pc_legacy':
      return 'fr.ck.rockstar';
    default:
      return 'fr.ck.gameId';
  }
}

/**
 * 連絡先ボタンに出す表示用テキスト。先頭のブランドアイコンで種別が分かるので、
 * IDだけを見せる：URLは http(s):// と www. を省き、IDは先頭の「種別:」プレフィックス
 * （例: 「discord:xxx」「PSN：xxx」）を省く。
 */
export function friendContactDisplay(contact: string | null): string {
  const v = (contact ?? '').trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  // 「discord:」「PSN：」など、値の先頭に自分で書いた種別ラベルを除去（半角/全角コロン対応）。
  return v.replace(/^[^\s:：]{1,24}[:：]\s*/, '');
}

/** 公開中のフレンド募集を新しい順に取得。limit でプレビュー件数を絞れる。
 *  各募集の返信数（reply_count）を board_threads.post_count から補完する
 *  （post #1 は本文の複製なので、返信数 = post_count - 1）。 */
export async function listPublishedFriends(limit?: number) {
  let query = supabase
    .from('friends')
    .select(PUBLIC_COLS)
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  if (limit) query = query.limit(limit);
  const res = await query;
  if (res.error || !res.data) return res;

  const rows = res.data as Friend[];
  const threadIds = rows.map((f) => f.thread_id).filter((v): v is string => !!v);
  if (threadIds.length) {
    const { data: threads } = await supabase
      .from('board_threads')
      .select('id, post_count')
      .in('id', threadIds);
    const counts = new Map((threads ?? []).map((t) => [t.id as string, t.post_count as number]));
    for (const f of rows) {
      const pc = f.thread_id ? counts.get(f.thread_id) : undefined;
      f.reply_count = typeof pc === 'number' ? Math.max(0, pc - 1) : 0;
    }
  }
  return res;
}

/** 1件取得（公開＝published／募集終了＝closed）。詳細ページ用。 */
export async function getFriend(id: string) {
  return supabase
    .from('friends')
    .select(PUBLIC_COLS)
    .eq('id', id)
    .in('status', ['published', 'closed'])
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
  author_name?: string | null; // 掲示板フォーム更新前でも動くよう任意
  gender?: string | null;
  contact_kind?: string | null;
  delete_key?: string | null;
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
    p_author_name: f.author_name ?? null,
    p_delete_key: f.delete_key ?? null,
    p_gender: f.gender ?? null,
    p_contact_kind: f.contact_kind ?? null,
  });
}

/** 本人による削除（削除キー or 同一ブラウザ anon_id で認可）。
 *  返信ありは 'closed'（募集終了）、返信なしは 'deleted'（完全削除）を返す。 */
export async function deleteOwnFriend(id: string, deleteKey: string | null) {
  return supabase.rpc('delete_own_friend', {
    p_id: id,
    p_delete_key: deleteKey,
    p_anon_id: getAnonId(),
  });
}

/** 本人による編集（認可は削除と同じ）。 */
export async function updateOwnFriend(
  id: string,
  f: {
    title: string;
    platform: string | null;
    play_style: string | null;
    voice_chat: string | null;
    active_time: string | null;
    age_range: string | null;
    body: string;
    contact: string | null;
    author_name: string | null;
    gender: string | null;
    contact_kind: string | null;
  },
  deleteKey: string | null,
) {
  return supabase.rpc('update_own_friend', {
    p_id: id,
    p_title: f.title,
    p_platform: f.platform,
    p_play_style: f.play_style,
    p_voice_chat: f.voice_chat,
    p_active_time: f.active_time,
    p_age_range: f.age_range,
    p_body: f.body,
    p_contact: f.contact,
    p_author_name: f.author_name,
    p_delete_key: deleteKey,
    p_anon_id: getAnonId(),
    p_gender: f.gender,
    p_contact_kind: f.contact_kind,
  });
}
