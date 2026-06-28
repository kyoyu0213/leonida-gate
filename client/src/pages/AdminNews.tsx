import { useEffect, useState } from 'react';
import { Loader2, ShieldCheck, LogOut, Plus, Pencil, Trash2, ExternalLink, ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import { isLoggedIn, subscribeAdmin, login, logout } from '@/lib/admin';
import {
  adminListNews,
  adminCreateNews,
  adminUpdateNews,
  adminDeleteNews,
  NEWS_ID_OFFSET,
  type NewsPostRow,
  type NewsInput,
} from '@/lib/newsDb';
import { uploadRawImages, imagePublicUrl } from '@/lib/images';
import { CATEGORY_CONFIG, type NewsCategory } from '@/data/news';

const CATS: NewsCategory[] = ['release', 'topic', 'update', 'speculation', 'event'];

const inputClass =
  'w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-[#f4eef8] placeholder:text-white/35 focus:outline-none focus:border-[#a78bfa]/60 transition-colors';

// 現在時刻（ローカル＝日本時間想定）を datetime-local 用 "YYYY-MM-DDTHH:MM" に整形。
function nowLocalInput(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function LoginGate() {
  const [secret, setSecret] = useState('');
  const [busy, setBusy] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret) return;
    setBusy(true);
    const { ok, error } = await login(secret);
    setBusy(false);
    setSecret('');
    if (!ok) toast.error(error ?? 'ログインに失敗しました');
  };
  return (
    <div className="max-w-[420px] mx-auto mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-7">
      <h1 className="flex items-center gap-2 font-black text-xl mb-2">
        <ShieldCheck size={20} className="text-[#a78bfa]" /> 管理者ログイン
      </h1>
      <p className="text-[13px] text-white/60 mb-5 leading-relaxed">
        合言葉を入力してください。認証はサーバー側で行われ、合言葉はこの端末に保存されません（ページ再読込で再ログインが必要です）。
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="合言葉"
          autoComplete="off"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 text-white font-extrabold py-3 rounded-full disabled:opacity-60"
          style={{ background: 'linear-gradient(95deg,#ff8a3d,#ff2d95 60%,#c44be0)' }}
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />} ログイン
        </button>
      </form>
    </div>
  );
}

const emptyForm = () => ({
  editingId: null as number | null,
  title: '',
  category: 'speculation' as NewsCategory,
  description: '',
  body: '',
  eyecatchUrl: null as string | null,
  publishedAt: nowLocalInput(),
  published: true,
});

export function NewsEditor() {
  const [rows, setRows] = useState<NewsPostRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [form, setForm] = useState(emptyForm());
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    setLoadingList(true);
    const { data, error } = await adminListNews();
    if (error) toast.error(error);
    setRows(data);
    setLoadingList(false);
  };

  useEffect(() => {
    reload();
  }, []);

  const resetForm = () => setForm(emptyForm());

  const onPickImage = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    const { paths, error } = await uploadRawImages('news', [file]);
    setUploading(false);
    if (error || !paths[0]) {
      toast.error(error ?? '画像のアップロードに失敗しました');
      return;
    }
    setForm((f) => ({ ...f, eyecatchUrl: imagePublicUrl(paths[0]) }));
    toast.success('アイキャッチ画像をアップロードしました');
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error('タイトルと本文は必須です');
      return;
    }
    const input: NewsInput = {
      title: form.title,
      description: form.description,
      body: form.body,
      category: form.category,
      icon: CATEGORY_CONFIG[form.category].filterIcon,
      eyecatchUrl: form.eyecatchUrl,
      publishedAt: form.publishedAt.replace('T', ' '),
      published: form.published,
    };
    setSaving(true);
    const res =
      form.editingId == null
        ? await adminCreateNews(input)
        : await adminUpdateNews(form.editingId, input);
    setSaving(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(form.editingId == null ? '記事を投稿しました' : '記事を更新しました');
    resetForm();
    reload();
  };

  const startEdit = (r: NewsPostRow) => {
    setForm({
      editingId: r.id,
      title: r.title,
      category: r.category,
      description: r.description,
      body: r.body,
      eyecatchUrl: r.eyecatch_url,
      publishedAt: (r.published_at || nowLocalInput().replace('T', ' ')).replace(' ', 'T').slice(0, 16),
      published: r.published,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (r: NewsPostRow) => {
    if (!window.confirm(`「${r.title}」を削除しますか？`)) return;
    const { error } = await adminDeleteNews(r.id);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success('記事を削除しました');
    if (form.editingId === r.id) resetForm();
    reload();
  };

  return (
    <div className="max-w-[760px] mx-auto">
      <h1 className="flex items-center gap-2 font-black text-xl mb-5">
        <Pencil size={18} className="text-[#a78bfa]" /> 記事の投稿・管理
      </h1>

      {/* フォーム */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 mb-8 space-y-4">
        <div className="flex items-center gap-2 text-[13px] font-bold text-white/80">
          {form.editingId == null ? (
            <>
              <Plus size={15} className="text-[#3de0a0]" /> 新規投稿
            </>
          ) : (
            <>
              <Pencil size={15} className="text-[#22d3ee]" /> 編集中（id: {NEWS_ID_OFFSET + form.editingId}）
              <button onClick={resetForm} className="ml-2 text-white/50 hover:text-white underline text-[12px]">
                新規に戻す
              </button>
            </>
          )}
        </div>

        {/* タイトル */}
        <div>
          <label className="block text-[12px] font-bold text-white/55 mb-1">タイトル *</label>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="記事タイトル"
            className={inputClass}
          />
        </div>

        {/* カテゴリ */}
        <div>
          <label className="block text-[12px] font-bold text-white/55 mb-1">カテゴリ</label>
          <div className="flex flex-wrap gap-2">
            {CATS.map((c) => {
              const active = form.category === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, category: c }))}
                  className="px-3.5 py-2 rounded-full text-[13px] font-bold transition-colors"
                  style={{
                    border: `1px solid ${active ? CATEGORY_CONFIG[c].vice : 'rgba(255,255,255,.14)'}`,
                    background: active ? `${CATEGORY_CONFIG[c].vice}22` : 'rgba(255,255,255,.05)',
                    color: active ? '#fff' : 'rgba(244,238,248,.7)',
                  }}
                >
                  {CATEGORY_CONFIG[c].filterIcon} {CATEGORY_CONFIG[c].label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 説明 */}
        <div>
          <label className="block text-[12px] font-bold text-white/55 mb-1">説明（一覧カードに出る短い文）</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="1〜2文の要約"
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* アイキャッチ */}
        <div>
          <label className="block text-[12px] font-bold text-white/55 mb-1">アイキャッチ画像（jpg/png/webp）</label>
          {form.eyecatchUrl ? (
            <div className="relative inline-block">
              <img
                src={form.eyecatchUrl}
                alt=""
                className="w-full max-w-[360px] rounded-xl border border-white/15"
              />
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, eyecatchUrl: null }))}
                className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white rounded-full p-1.5"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <label className="inline-flex items-center gap-2 cursor-pointer text-[13px] font-bold text-white/70 hover:text-[#a78bfa] border border-white/15 rounded-lg px-4 py-2.5 transition-colors">
              {uploading ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
              {uploading ? 'アップロード中…' : '画像を選ぶ'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={uploading}
                onChange={(e) => onPickImage(e.target.files?.[0])}
              />
            </label>
          )}
        </div>

        {/* 本文 */}
        <div>
          <label className="block text-[12px] font-bold text-white/55 mb-1">
            本文 *（Markdown対応。## 見出し、- 箇条書き、![説明](画像URL) 等）
          </label>
          <textarea
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            placeholder={'本文をMarkdownで入力\n\n## 見出し\n\n段落…'}
            rows={14}
            className={`${inputClass} resize-y font-mono text-[13.5px] leading-relaxed`}
          />
        </div>

        {/* 公開日時・公開状態 */}
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-[12px] font-bold text-white/55 mb-1">公開日時</label>
            <input
              type="datetime-local"
              value={form.publishedAt}
              onChange={(e) => setForm((f) => ({ ...f, publishedAt: e.target.value }))}
              className="bg-white/[0.04] border border-white/12 rounded-xl px-3 py-2.5 text-[#f4eef8] focus:outline-none focus:border-[#a78bfa]/60"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-[13px] font-bold text-white/75 cursor-pointer pb-2.5">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
              className="w-4 h-4 accent-[#3de0a0]"
            />
            公開する（オフ＝下書き・サイト非表示）
          </label>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="w-full flex items-center justify-center gap-2 text-white font-extrabold py-3 rounded-full disabled:opacity-60"
          style={{ background: 'linear-gradient(95deg,#ff8a3d,#ff2d95 60%,#c44be0)' }}
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          {form.editingId == null ? '記事を投稿する' : '記事を更新する'}
        </button>
      </div>

      {/* 既存記事の一覧 */}
      <h2 className="font-bold text-[15px] mb-3 text-white/80">投稿済みの記事（{rows.length}）</h2>
      {loadingList ? (
        <div className="text-center py-8 text-white/50">
          <Loader2 size={20} className="mx-auto animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-8 text-white/45 text-sm font-mono">まだ投稿はありません</div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3"
            >
              {r.eyecatch_url ? (
                <img src={r.eyecatch_url} alt="" className="w-14 h-14 rounded-lg object-cover flex-none" />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-white/[0.06] flex items-center justify-center text-xl flex-none">
                  {r.icon}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-white truncate">{r.title}</div>
                <div className="text-[11.5px] text-white/45 font-mono flex items-center gap-2">
                  <span>{CATEGORY_CONFIG[r.category].label}</span>
                  <span>{r.published_at}</span>
                  {!r.published && <span className="text-[#ff8fc0]">下書き</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-none">
                <a
                  href={`/news/${NEWS_ID_OFFSET + r.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
                  title="表示"
                >
                  <ExternalLink size={15} />
                </a>
                <button
                  onClick={() => startEdit(r)}
                  className="p-2 rounded-lg text-[#22d3ee] hover:bg-white/10"
                  title="編集"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleDelete(r)}
                  className="p-2 rounded-lg text-[#ff5a78] hover:bg-white/10"
                  title="削除"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminNews() {
  const [authed, setAuthed] = useState(isLoggedIn());
  useEffect(() => subscribeAdmin(() => setAuthed(isLoggedIn())), []);

  return (
    <div className="vice-page vice-noise">
      <Header />
      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[100px] pb-24 relative z-10">
        {authed ? (
          <div className="max-w-[760px] mx-auto">
            <div className="flex justify-end mb-3">
              <button
                onClick={() => logout()}
                className="inline-flex items-center gap-1.5 text-[13px] font-bold text-white/70 hover:text-white border border-white/15 rounded-lg px-3 py-1.5"
              >
                <LogOut size={14} /> ログアウト
              </button>
            </div>
            <NewsEditor />
          </div>
        ) : (
          <LoginGate />
        )}
      </main>
    </div>
  );
}
