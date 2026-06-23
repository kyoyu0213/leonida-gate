import { nanoid } from 'nanoid';
import { supabase } from './supabase';

// 画像投稿（承認制）。クライアント側で再エンコード（EXIF/GPS除去＋圧縮）してから
// Supabase Storage（public バケット board-images）へ直接アップロードし、
// create_board_image RPC で「承認待ち」として登録する。公開は管理者の承認後のみ。
// ★ board の images_enabled が false の間は UI 側で入口を出さない（デフォルト無効）。

const BUCKET = 'board-images';
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_INPUT_BYTES = 12 * 1024 * 1024; // 入力上限 12MB（再エンコードで縮む）
const MAX_DIM = 1600; // 長辺の最大px（これを超えたら縮小）

export interface BoardImageSetting {
  board: string;
  images_enabled: boolean;
  require_approval: boolean;
}

/** カテゴリの画像設定を取得（入口の表示判定用）。 */
export async function getBoardImageSetting(board: string): Promise<BoardImageSetting | null> {
  const { data } = await supabase
    .from('board_image_settings')
    .select('board, images_enabled, require_approval')
    .eq('board', board)
    .maybeSingle();
  return (data as BoardImageSetting) ?? null;
}

/** Storage パス → 公開URL（public バケット board-images）。 */
export function imagePublicUrl(storagePath: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

export interface ApprovedImage {
  post_id: string | null;
  url: string;
}

/** スレッドの承認済み画像を、紐づくレス（post_id）付きで取得。 */
export async function listApprovedImages(threadId: string): Promise<ApprovedImage[]> {
  const { data } = await supabase
    .from('board_images')
    .select('post_id, storage_path')
    .eq('thread_id', threadId)
    .eq('status', 'approved')
    .eq('hidden', false)
    .order('created_at', { ascending: true });
  const rows = (data as { post_id: string | null; storage_path: string }[] | null) ?? [];
  return rows.map((r) => ({ post_id: r.post_id, url: imagePublicUrl(r.storage_path) }));
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('decode failed'));
    img.src = url;
  });
}

// canvas で再エンコードして EXIF/GPS を含む全メタデータを除去（＋長辺を縮小）。
async function reencode(file: File): Promise<{ blob: Blob; mime: string } | { error: string }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    let w = img.naturalWidth || img.width;
    let h = img.naturalHeight || img.height;
    if (!w || !h) return { error: '画像を読み込めませんでした' };
    const scale = Math.min(1, MAX_DIM / Math.max(w, h));
    w = Math.round(w * scale);
    h = Math.round(h * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { error: '画像処理に失敗しました' };
    ctx.drawImage(img, 0, 0, w, h);

    const mime =
      file.type === 'image/png' ? 'image/png' : file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
    const quality = mime === 'image/png' ? undefined : 0.85;
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, mime, quality));
    if (!blob) return { error: '画像処理に失敗しました' };
    return { blob, mime };
  } catch {
    return { error: '画像を読み込めませんでした' };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * 再エンコード（EXIF除去・圧縮）して Storage に保存し、保存パスの配列を返す汎用関数。
 * 掲示板以外（お問い合わせ等）の添付に使う。RPC 登録はしない。
 */
export async function uploadRawImages(
  prefix: string,
  files: File[],
): Promise<{ paths: string[]; error?: string }> {
  const paths: string[] = [];
  for (const file of files) {
    if (!ALLOWED.includes(file.type)) return { paths, error: 'jpg / png / webp のみ添付できます' };
    if (file.size > MAX_INPUT_BYTES) return { paths, error: 'ファイルサイズが大きすぎます（12MBまで）' };
    const enc = await reencode(file);
    if ('error' in enc) return { paths, error: enc.error };
    const ext = enc.mime === 'image/png' ? 'png' : enc.mime === 'image/webp' ? 'webp' : 'jpg';
    const path = `${prefix}/${nanoid(24)}.${ext}`;
    const up = await supabase.storage.from(BUCKET).upload(path, enc.blob, {
      contentType: enc.mime,
      upsert: false,
    });
    if (up.error) return { paths, error: '画像のアップロードに失敗しました' };
    paths.push(path);
  }
  return { paths };
}

/**
 * 画像をアップロードして「承認待ち」で登録する。
 * 各画像：型チェック → 再エンコード（EXIF除去・圧縮）→ Storage 保存 → RPC 登録。
 */
export async function uploadImages(
  board: string,
  files: File[],
  ref: { threadId?: string; postId?: string },
): Promise<{ error?: string }> {
  for (const file of files) {
    if (!ALLOWED.includes(file.type)) {
      return { error: 'jpg / png / webp のみアップロードできます' };
    }
    if (file.size > MAX_INPUT_BYTES) {
      return { error: 'ファイルサイズが大きすぎます（12MBまで）' };
    }

    const enc = await reencode(file);
    if ('error' in enc) return { error: enc.error };

    const ext = enc.mime === 'image/png' ? 'png' : enc.mime === 'image/webp' ? 'webp' : 'jpg';
    const path = `${board}/${nanoid(24)}.${ext}`;

    const up = await supabase.storage.from(BUCKET).upload(path, enc.blob, {
      contentType: enc.mime,
      upsert: false,
    });
    if (up.error) return { error: '画像のアップロードに失敗しました' };

    const { error: rpcErr } = await supabase.rpc('create_board_image', {
      p_board: board,
      p_thread_id: ref.threadId ?? null,
      p_post_id: ref.postId ?? null,
      p_storage_path: path,
      p_mime: enc.mime,
    });
    if (rpcErr) {
      // 登録に失敗したら、アップロード済みファイルは掃除を試みる
      await supabase.storage.from(BUCKET).remove([path]);
      const m = rpcErr.message ?? '';
      if (m.includes('images disabled')) return { error: 'この掲示板では画像投稿は無効です' };
      if (m.includes('rate limited')) return { error: '投稿の間隔が短すぎます。少し待ってください' };
      return { error: '画像の登録に失敗しました' };
    }
  }
  return {};
}
