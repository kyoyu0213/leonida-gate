// ============================================================================
//  ビルド時プリレンダ（SSR）専用の初期データ置き場。
//
//  背景：掲示板・募集板の投稿はブラウザ上で Supabase から後読みしているため、
//  プリレンダHTMLには板の説明文しか入らず、Googlebot と AdSense には
//  「説明文だけの空ページ」に見えていた（2026-08-06 の監査）。
//  ビルド時に投稿を取得してここへ置き、renderToString に拾わせる。
//
//  ▼ 使い方
//    ビルド側: scripts/prerender-routes.ts が render() を回す前に setSsrSeed() を1回呼ぶ。
//    画面側  : useState の初期値で seed アクセサを呼ぶ。
//              ブラウザでは常に空なので、クライアントの挙動は一切変わらない。
//
//  ▼ ルート間リーク対策
//    prerender-routes は同一プロセスで複数ルートを順に render する。
//    そこで seed は「全ページぶんをキー付きで1回だけセットする」方式にしている
//    （ルートごとにセット→クリアはしない）。読み出しは純粋な参照だけなので、
//    前のルートのデータを引きずる余地が構造的に無い。
//
//  ▼ 焼き込まないもの
//    連絡先（friends.contact / contact_kind、crews.contact、
//    fivem_servers.connect_info / discord_url）と投稿者名（author_name）は
//    そもそもビルド時クエリの列リストに含めない。ここの型にも存在しない。
// ============================================================================

/**
 * 板スレッドの一覧行（焼き込み用の最小形）。
 *
 * ※ 本文の抜粋は意図的に持たない。スレッド一覧のカードはタイトル・板名・更新日・
 *   レス数しか描画しておらず、SSR でだけ本文抜粋を出すと「クローラーにだけ見える
 *   テキスト」になってクローキングに当たるため。ここは実際に描画される項目に揃える。
 *   （募集系カードは body/description を描画しているので、そちらは抜粋を持つ）
 */
export interface SeedThread {
  id: string;
  board: string;
  title: string;
  post_count: number;
  last_posted_at: string;
  icon: string | null;
}

/** フレンド募集の一覧行。 */
export interface SeedFriend {
  id: string;
  title: string;
  excerpt: string;
  platform: string | null;
  play_style: string | null;
  active_time: string | null;
  created_at: string;
  reply_count: number;
}

/** クルー募集の一覧行。 */
export interface SeedCrew {
  id: string;
  crew_name: string;
  title: string;
  excerpt: string;
  platform: string | null;
  genre: string | null;
  created_at: string;
}

/** FiveMサーバー掲載の一覧行。 */
export interface SeedServer {
  id: string;
  name: string;
  excerpt: string;
  type: string;
  language: string | null;
  tags: string[] | null;
  created_at: string;
}

export interface SsrSeed {
  /** 板スラッグ（gta6 / gtarp / ...）→ スレッド一覧。 */
  threads: Record<string, SeedThread[]>;
  friends: SeedFriend[];
  crews: SeedCrew[];
  servers: SeedServer[];
}

const EMPTY: SsrSeed = { threads: {}, friends: [], crews: [], servers: [] };

let seed: SsrSeed = EMPTY;

/** ビルド時に1回だけ呼ぶ。ブラウザからは呼ばれない。 */
export function setSsrSeed(next: SsrSeed | null | undefined): void {
  seed = next ?? EMPTY;
}

/** SSR 中か（ブラウザでは常に false → seed は使われない）。 */
const isSsr = () => typeof window === 'undefined';

export const seedThreads = (board: string): SeedThread[] =>
  isSsr() ? (seed.threads[board] ?? []) : [];

export const seedFriends = (): SeedFriend[] => (isSsr() ? seed.friends : []);

export const seedCrews = (): SeedCrew[] => (isSsr() ? seed.crews : []);

export const seedServers = (): SeedServer[] => (isSsr() ? seed.servers : []);
