// ============================================================================
//  ビルド時に掲示板・募集板の投稿を Supabase から取得し、
//  プリレンダ（renderToString）へ渡す初期データを組み立てる。
//
//  ▼ 焼き込むもの（ルール）
//    一覧に出る情報だけ。スレタイ・本文の冒頭抜粋(120字)・返信件数・投稿日など。
//
//  ▼ 焼き込まないもの（重要）
//    連絡先カラムは「クエリの列リストに一切含めない」。
//    クライアント側の PUBLIC_COLS には contact / contact_kind / connect_info /
//    discord_url が含まれているが、それを流用してはいけない。
//    投稿者名（author_name）も、静的HTMLに残す必要が無いため取得しない。
//
//  ▼ 堅牢性
//    取得に失敗してもビルドは止めない。空の seed を返して WARN を出す。
//    空 seed のときプリレンダ結果は現行（説明文のみ）と同一になる。
// ============================================================================

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://uawyuxegcywatkfgyycp.supabase.co';
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'sb_publishable_56-mcQqzWE-afZce8zFb7Q_qhGAclS3';

/** スレッド式の板（BoardThreadList が描画する5板）。friends / crews は専用ページで扱う。 */
export const THREAD_BOARDS = ['gta6', 'gtarp', 'gtarp-servers', 'streamer-servers', 'fivem-dev'];

/** 各ページに焼く最大件数。クライアントは board系100件・募集系は全件だが、
 *  静的HTMLはクローラー向けのスナップショットなので30件で打ち切る。 */
const MAX_ITEMS = 30;

/** 本文抜粋の長さ（字）。 */
const EXCERPT_LEN = 120;

const EMPTY = { threads: {}, friends: [], crews: [], servers: [] };

/** 本文を1行に潰して EXCERPT_LEN で切る。切ったら … を付ける。 */
function excerpt(body) {
  const s = String(body ?? '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')   // 画像記法は落とす
    .replace(/\s+/g, ' ')
    .trim();
  return s.length > EXCERPT_LEN ? s.slice(0, EXCERPT_LEN) + '…' : s;
}

async function q(path, timeoutMs = 10000) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      signal: ac.signal,
    });
    if (!r.ok) throw new Error(`HTTP ${r.status} ${path.split('?')[0]}`);
    const j = await r.json();
    if (!Array.isArray(j)) throw new Error(`想定外のレスポンス: ${path.split('?')[0]}`);
    return j;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 全ページぶんの seed を1回で組み立てて返す。
 * 失敗しても throw せず、空 seed と警告文を返す（呼び出し側がビルドを続行できるように）。
 */
export async function buildBoardSeed() {
  const warnings = [];
  try {
    const [threadRows, friends, crews, servers] = await Promise.all([
      // 板スレッド：連絡先という概念が無いテーブル。一覧に出る列だけ。
      q(
        'board_threads?select=id,board,title,last_posted_at,post_count,icon' +
          '&order=last_posted_at.desc&limit=500',
      ),
      // 募集系：contact / contact_kind / author_name は列リストに入れない。
      q(
        'friends?select=id,title,platform,play_style,active_time,body,thread_id,created_at' +
          '&status=eq.published&order=created_at.desc&limit=' + MAX_ITEMS,
      ),
      q(
        'crews?select=id,crew_name,title,platform,genre,body,created_at' +
          '&status=eq.published&order=created_at.desc&limit=' + MAX_ITEMS,
      ),
      // サーバー：connect_info / discord_url は列リストに入れない。
      q(
        'fivem_servers?select=id,name,description,type,language,tags,created_at' +
          '&approved=eq.true&order=created_at.desc&limit=' + MAX_ITEMS,
      ),
    ]);

    const threads = {};
    for (const b of THREAD_BOARDS) threads[b] = [];
    for (const t of threadRows) {
      if (!THREAD_BOARDS.includes(t.board)) continue;      // friends/crews の合成スレは除く
      const list = threads[t.board];
      if (list.length >= MAX_ITEMS) continue;
      list.push({
        id: t.id,
        board: t.board,
        title: t.title,
        post_count: t.post_count ?? 0,
        last_posted_at: t.last_posted_at,
        icon: t.icon ?? null,
      });
    }

    // 募集の返信数は board_threads.post_count から補完（本文複製の #1 を除いた数）。
    const countByThread = new Map(threadRows.map((t) => [t.id, t.post_count ?? 0]));
    const replyCount = (threadId) =>
      threadId ? Math.max(0, (countByThread.get(threadId) ?? 0) - 1) : 0;

    const seed = {
      threads,
      friends: friends.map((f) => ({
        id: f.id,
        title: f.title,
        excerpt: excerpt(f.body),
        platform: f.platform ?? null,
        play_style: f.play_style ?? null,
        active_time: f.active_time ?? null,
        created_at: f.created_at,
        reply_count: replyCount(f.thread_id),
      })),
      crews: crews.map((c) => ({
        id: c.id,
        crew_name: c.crew_name,
        title: c.title,
        excerpt: excerpt(c.body),
        platform: c.platform ?? null,
        genre: c.genre ?? null,
        created_at: c.created_at,
      })),
      servers: servers.map((s) => ({
        id: s.id,
        name: s.name,
        excerpt: excerpt(s.description),
        type: s.type,
        language: s.language ?? null,
        tags: Array.isArray(s.tags) ? s.tags : null,
        created_at: s.created_at,
      })),
    };

    const total =
      Object.values(seed.threads).reduce((a, v) => a + v.length, 0) +
      seed.friends.length +
      seed.crews.length +
      seed.servers.length;
    return { seed, total, warnings };
  } catch (e) {
    warnings.push(
      `[board-seed] WARN: Supabase から投稿を取得できませんでした（${e?.message || e}）。` +
        ' 板ページは説明文のみで生成します（現行と同じ出力）。',
    );
    return { seed: EMPTY, total: 0, warnings };
  }
}
