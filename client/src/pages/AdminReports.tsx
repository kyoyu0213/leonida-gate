import { useEffect, useState } from 'react';
import { Loader2, ShieldCheck, LogOut, EyeOff, Eye, Trash2, Check, ExternalLink, X, Mail, Info, Ban, Search } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import {
  isLoggedIn,
  subscribeAdmin,
  login,
  logout,
  listReports,
  setPostHidden,
  deletePost,
  resolveReports,
  listPendingImages,
  approveImage,
  rejectImage,
  listContacts,
  deleteContact,
  listApplications,
  approveApplication,
  deleteApplication,
  listFivemServers,
  deleteFivemServer,
  getPostMeta,
  setPostNote,
  listAdminPosts,
  searchAdminPosts,
  listBlocks,
  addBlock,
  removeBlock,
  listNewsComments,
  setNewsCommentHidden,
  deleteNewsComment,
  listSearches,
  topSearches,
  type ReportRow,
  type PendingImage,
  type ContactRow,
  type ApplicationRow,
  type FivemServerRow,
  type PostMeta,
  type AdminPostRow,
  type BlockRow,
  type NewsCommentRow,
  type SearchLogRow,
  type TopSearchRow,
} from '@/lib/admin';
import { imagePublicUrl } from '@/lib/images';
import { REPORT_REASONS, formatPostDate } from '@/lib/board';
import { getBoard } from '@/lib/boards';
import { getArticleById } from '@/data/news';
import { NewsEditor } from './AdminNews';

const reasonLabel = (value: string) =>
  REPORT_REASONS.find((r) => r.value === value)?.label ?? value;

const inputClass =
  'w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-[#f4eef8] placeholder:text-white/35 focus:outline-none focus:border-[#a78bfa]/60 transition-colors';

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

// 投稿のモデレーション詳細（IP/UA/Cookie・集計・管理者メモ）
function PostMetaDetail({ postId }: { postId: string }) {
  const [meta, setMeta] = useState<PostMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  // 同一IP/同一Cookieのドリルダウン
  const [drill, setDrill] = useState<'ip' | 'anon' | null>(null);
  const [drillRows, setDrillRows] = useState<AdminPostRow[]>([]);
  const [drillLoading, setDrillLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await getPostMeta(postId);
      if (cancelled) return;
      if (error) toast.error(error);
      setMeta(data ?? null);
      setNote(data?.admin_note ?? '');
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const saveNote = async () => {
    setSavingNote(true);
    const { error } = await setPostNote(postId, note);
    setSavingNote(false);
    toast[error ? 'error' : 'success'](error ?? '管理者メモを保存しました');
  };

  const openDrill = async (kind: 'ip' | 'anon') => {
    if (drill === kind) {
      setDrill(null);
      return;
    }
    setDrill(kind);
    setDrillLoading(true);
    const { data, error } = await searchAdminPosts(
      kind === 'ip' ? { ip: meta?.ip ?? '' } : { anon: meta?.anon_id ?? '' },
    );
    if (error) toast.error(error);
    setDrillRows(data);
    setDrillLoading(false);
  };

  if (loading) {
    return (
      <div className="mt-3 text-[12px] text-white/50">
        <Loader2 size={14} className="inline animate-spin" /> 詳細を取得中…
      </div>
    );
  }
  if (!meta) return null;

  const Row = ({ k, v }: { k: string; v: React.ReactNode }) => (
    <div className="flex gap-2">
      <span className="text-white/40 w-28 flex-none">{k}</span>
      <span className="text-white/80 break-all min-w-0">{v ?? '—'}</span>
    </div>
  );

  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-[12px] flex flex-col gap-1.5">
      <Row k="IPアドレス" v={meta.ip} />
      <Row k="IPサブネット" v={meta.ip_subnet} />
      <Row k="IPハッシュ" v={meta.ip_hash ? meta.ip_hash.slice(0, 16) + '…' : null} />
      <Row k="匿名Cookie ID" v={meta.anon_id} />
      <Row k="User-Agent" v={meta.ua} />
      <Row k="投稿日時" v={formatPostDate(meta.created_at)} />
      <div className="flex gap-2 flex-wrap mt-1 text-[11px]">
        <span className="rounded bg-[#ff2d95]/10 border border-[#ff2d95]/25 text-[#ff8fc0] px-2 py-0.5">
          通報 {meta.report_count} 件
        </span>
        <button
          onClick={() => openDrill('ip')}
          disabled={!meta.ip}
          className="rounded bg-white/[0.06] border border-white/10 text-white/70 px-2 py-0.5 hover:bg-white/15 hover:text-white disabled:opacity-50"
        >
          同一IP投稿 {meta.same_ip_count} 件 ▾
        </button>
        <span className="rounded bg-white/[0.06] border border-white/10 text-white/70 px-2 py-0.5">
          直近24h同一IP {meta.recent_24h_same_ip} 件
        </span>
        <button
          onClick={() => openDrill('anon')}
          disabled={!meta.anon_id}
          className="rounded bg-white/[0.06] border border-white/10 text-white/70 px-2 py-0.5 hover:bg-white/15 hover:text-white disabled:opacity-50"
        >
          同一Cookie投稿 {meta.same_anon_count} 件 ▾
        </button>
      </div>

      {drill && (
        <div className="mt-1 rounded-lg border border-white/10 bg-black/30 p-2 flex flex-col gap-1">
          <div className="text-white/40 text-[11px] mb-0.5">
            {drill === 'ip' ? `IP ${meta.ip} の投稿` : 'この匿名Cookie IDの投稿'}
          </div>
          {drillLoading ? (
            <div className="text-white/50 text-[11px] py-1">
              <Loader2 size={12} className="inline animate-spin" /> 取得中…
            </div>
          ) : drillRows.length === 0 ? (
            <div className="text-white/40 text-[11px] py-1">該当なし</div>
          ) : (
            drillRows.map((d) => (
              <a
                key={d.id}
                href={`/thread/${d.thread_id}#post-${d.post_number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-2 items-baseline rounded px-1.5 py-1 hover:bg-white/[0.06]"
              >
                <span className="text-white/35 flex-none">{formatPostDate(d.created_at)}</span>
                <span className="text-white/80 truncate">{d.body}</span>
                {d.hidden && <span className="text-white/30 flex-none">[非表示]</span>}
              </a>
            ))
          )}
        </div>
      )}
      {meta.delete_reason && <Row k="削除理由" v={meta.delete_reason} />}
      <div className="mt-2">
        <span className="text-white/40">管理者メモ</span>
        <div className="flex gap-2 mt-1">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="このユーザー/投稿についてのメモ"
            className="flex-1 min-w-0 bg-white/[0.05] border border-white/10 rounded-lg px-2.5 py-1.5 text-white/85 text-[12px] outline-none focus:border-[#a78bfa]/60"
          />
          <button
            onClick={saveNote}
            disabled={savingNote}
            className="flex-none text-[12px] font-bold text-[#a78bfa] border border-[#a78bfa]/40 rounded-lg px-3 hover:bg-[#a78bfa]/10 disabled:opacity-50"
          >
            {savingNote ? <Loader2 size={13} className="animate-spin" /> : '保存'}
          </button>
        </div>
      </div>

      {/* ブロック操作 */}
      <div className="flex flex-wrap gap-2 mt-2">
        {meta.ip && (
          <button
            onClick={async () => {
              if (!confirm(`IP ${meta.ip} をブロックします。よろしいですか？`)) return;
              const { error } = await addBlock('ip', meta.ip!, '管理画面から');
              toast[error ? 'error' : 'success'](error ?? 'このIPをブロックしました');
            }}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#ff8fc0] border border-[#ff2d95]/30 rounded-lg px-2.5 py-1 hover:bg-[#ff2d95]/10"
          >
            <Ban size={12} /> このIPをブロック
          </button>
        )}
        {meta.anon_id && (
          <button
            onClick={async () => {
              if (!confirm('この匿名Cookie IDをブロックします。よろしいですか？')) return;
              const { error } = await addBlock('anon', meta.anon_id!, '管理画面から');
              toast[error ? 'error' : 'success'](error ?? 'このCookieをブロックしました');
            }}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#ff8fc0] border border-[#ff2d95]/30 rounded-lg px-2.5 py-1 hover:bg-[#ff2d95]/10"
          >
            <Ban size={12} /> このCookieをブロック
          </button>
        )}
      </div>
    </div>
  );
}

function ReportsPanel() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await listReports();
    if (error) toast.error(error);
    setRows(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const act = async (id: string, fn: () => Promise<{ error?: string }>, okMsg: string) => {
    setBusyId(id);
    const { error } = await fn();
    setBusyId(null);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(okMsg);
    load();
  };

  if (loading) {
    return (
      <div className="text-center py-16 text-white/50">
        <Loader2 size={26} className="mx-auto mb-3 animate-spin" /> 取得中…
      </div>
    );
  }

  if (rows.length === 0) {
    return <div className="text-center py-16 text-white/50">未対応の通報はありません</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((r) => {
        const board = getBoard(r.board);
        const jump = `/thread/${r.thread_id}#post-${r.post_number}`;
        const busy = busyId === r.post_id;
        return (
          <div
            key={r.post_id}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4"
            style={{ borderColor: r.status === 'open' ? 'rgba(255,45,149,.35)' : undefined }}
          >
            <div className="flex items-center gap-2 flex-wrap mb-2 text-[12px]">
              <span
                className="font-extrabold rounded px-2 py-0.5"
                style={{
                  color: r.status === 'open' ? '#ff8fc0' : '#3de0a0',
                  border: `1px solid ${r.status === 'open' ? '#ff2d95' : '#3de0a0'}55`,
                }}
              >
                {r.status === 'open' ? '未対応' : '対応済み'}
              </span>
              <span className="text-white/55">{board?.title.replace('掲示板', '') ?? r.board}</span>
              <span className="text-white/30">#{r.post_number}</span>
              <span className="vice-num text-[#ff2d95]">通報 {r.report_count} 件</span>
              {r.hidden && <span className="text-white/40">（非表示中）</span>}
              <span className="ml-auto text-white/40">{formatPostDate(r.last_reported_at)}</span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-2">
              {r.reasons.map((reason) => (
                <span
                  key={reason}
                  className="text-[11px] font-bold text-[#a78bfa] bg-[#a78bfa]/10 border border-[#a78bfa]/25 rounded px-2 py-0.5"
                >
                  {reasonLabel(reason)}
                </span>
              ))}
            </div>

            <p className="text-sm text-white/80 whitespace-pre-wrap break-words bg-black/20 rounded-lg p-3 m-0 max-h-40 overflow-auto">
              {r.body}
            </p>

            <div className="flex flex-wrap gap-2 mt-3">
              <a
                href={jump}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[12px] font-bold text-white/70 hover:text-white border border-white/15 rounded-lg px-3 py-1.5 transition-colors"
              >
                <ExternalLink size={13} /> 投稿へ
              </a>
              <button
                disabled={busy}
                onClick={() => {
                  if (r.hidden) {
                    act(r.post_id, () => setPostHidden(r.post_id, false), '再表示しました');
                  } else {
                    const reason = prompt('非表示の理由（任意・記録されます）') ?? '';
                    act(r.post_id, () => setPostHidden(r.post_id, true, reason), '非表示にしました');
                  }
                }}
                className="inline-flex items-center gap-1 text-[12px] font-bold text-[#ffcf8a] border border-[#ffcf8a]/30 rounded-lg px-3 py-1.5 hover:bg-[#ffcf8a]/10 disabled:opacity-50"
              >
                {r.hidden ? <Eye size={13} /> : <EyeOff size={13} />} {r.hidden ? '再表示' : '非表示'}
              </button>
              <button
                onClick={() => setExpanded((cur) => (cur === r.post_id ? null : r.post_id))}
                className="inline-flex items-center gap-1 text-[12px] font-bold text-white/70 border border-white/15 rounded-lg px-3 py-1.5 hover:bg-white/10"
              >
                <Info size={13} /> {expanded === r.post_id ? '詳細を閉じる' : '詳細'}
              </button>
              <button
                disabled={busy}
                onClick={() => {
                  if (confirm('この投稿を完全に削除します。よろしいですか？')) {
                    act(r.post_id, () => deletePost(r.post_id), '削除しました');
                  }
                }}
                className="inline-flex items-center gap-1 text-[12px] font-bold text-[#ff8fc0] border border-[#ff2d95]/30 rounded-lg px-3 py-1.5 hover:bg-[#ff2d95]/10 disabled:opacity-50"
              >
                <Trash2 size={13} /> 削除
              </button>
              {r.status === 'open' && (
                <button
                  disabled={busy}
                  onClick={() => act(r.post_id, () => resolveReports(r.post_id), '対応済みにしました')}
                  className="inline-flex items-center gap-1 text-[12px] font-bold text-[#3de0a0] border border-[#3de0a0]/30 rounded-lg px-3 py-1.5 hover:bg-[#3de0a0]/10 disabled:opacity-50"
                >
                  <Check size={13} /> 対応済み
                </button>
              )}
              {busy && <Loader2 size={15} className="animate-spin text-white/50 self-center" />}
            </div>

            {expanded === r.post_id && <PostMetaDetail postId={r.post_id} />}
          </div>
        );
      })}
    </div>
  );
}

function ImagesPanel() {
  const [rows, setRows] = useState<PendingImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await listPendingImages();
    if (error) toast.error(error);
    setRows(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const act = async (id: string, fn: () => Promise<{ error?: string }>, okMsg: string) => {
    setBusyId(id);
    const { error } = await fn();
    setBusyId(null);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(okMsg);
    load();
  };

  if (loading) {
    return (
      <div className="text-center py-16 text-white/50">
        <Loader2 size={26} className="mx-auto mb-3 animate-spin" /> 取得中…
      </div>
    );
  }
  if (rows.length === 0) {
    return <div className="text-center py-16 text-white/50">承認待ちの画像はありません</div>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {rows.map((img) => {
        const busy = busyId === img.id;
        const url = imagePublicUrl(img.storage_path);
        return (
          <div key={img.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-2.5">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <img
                src={url}
                alt="承認待ち画像"
                className="w-full h-36 object-cover rounded-xl border border-white/10"
                loading="lazy"
              />
            </a>
            <div className="text-[11px] text-white/45 mt-1.5">{formatPostDate(img.created_at)}</div>
            <div className="flex gap-2 mt-2">
              <button
                disabled={busy}
                onClick={() => act(img.id, () => approveImage(img.id), '承認しました')}
                className="flex-1 inline-flex items-center justify-center gap-1 text-[12px] font-bold text-[#3de0a0] border border-[#3de0a0]/30 rounded-lg px-2 py-1.5 hover:bg-[#3de0a0]/10 disabled:opacity-50"
              >
                <Check size={13} /> 承認
              </button>
              <button
                disabled={busy}
                onClick={() => act(img.id, () => rejectImage(img.id), '却下しました')}
                className="flex-1 inline-flex items-center justify-center gap-1 text-[12px] font-bold text-[#ff8fc0] border border-[#ff2d95]/30 rounded-lg px-2 py-1.5 hover:bg-[#ff2d95]/10 disabled:opacity-50"
              >
                <X size={13} /> 却下
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ContactsPanel() {
  const [rows, setRows] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await listContacts();
    if (error) toast.error(error);
    setRows(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remove = async (id: string) => {
    if (!confirm('このお問い合わせを削除します。よろしいですか？')) return;
    setBusyId(id);
    const { error } = await deleteContact(id);
    setBusyId(null);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success('削除しました');
    load();
  };

  if (loading) {
    return (
      <div className="text-center py-16 text-white/50">
        <Loader2 size={26} className="mx-auto mb-3 animate-spin" /> 取得中…
      </div>
    );
  }
  if (rows.length === 0) {
    return <div className="text-center py-16 text-white/50">お問い合わせはありません</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((c) => {
        const busy = busyId === c.id;
        return (
          <div key={c.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 mb-1.5 text-[12px] flex-wrap">
              <Mail size={13} className="text-[#22d3ee]" />
              <span className="font-bold text-white">{c.name || '（名前なし）'}</span>
              {c.email ? (
                <a href={`mailto:${c.email}`} className="text-[#22d3ee] hover:underline">
                  {c.email}
                </a>
              ) : (
                <span className="text-white/35">（メール未記入）</span>
              )}
              <span className="ml-auto text-white/40">{formatPostDate(c.created_at)}</span>
            </div>
            <p className="text-sm text-white/85 whitespace-pre-wrap break-words bg-black/20 rounded-lg p-3 m-0">
              {c.message}
            </p>
            {c.images && c.images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {c.images.map((path) => {
                  const url = imagePublicUrl(path);
                  return (
                    <a key={path} href={url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={url}
                        alt="添付画像"
                        className="h-28 w-28 object-cover rounded-xl border border-white/10"
                        loading="lazy"
                      />
                    </a>
                  );
                })}
              </div>
            )}
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setExpanded((cur) => (cur === c.id ? null : c.id))}
                className="inline-flex items-center gap-1 text-[12px] font-bold text-white/70 border border-white/15 rounded-lg px-3 py-1.5 hover:bg-white/10"
              >
                <Info size={13} /> {expanded === c.id ? '詳細を閉じる' : '詳細'}
              </button>
              <button
                disabled={busy}
                onClick={() => remove(c.id)}
                className="inline-flex items-center gap-1 text-[12px] font-bold text-[#ff8fc0] border border-[#ff2d95]/30 rounded-lg px-3 py-1.5 hover:bg-[#ff2d95]/10 disabled:opacity-50"
              >
                {busy ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} 削除
              </button>
            </div>

            {expanded === c.id && (
              <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-[12px] flex flex-col gap-1.5">
                <div className="flex gap-2"><span className="text-white/40 w-28 flex-none">IPアドレス</span><span className="text-white/80 break-all">{c.ip ?? '—'}</span></div>
                <div className="flex gap-2"><span className="text-white/40 w-28 flex-none">IPサブネット</span><span className="text-white/80 break-all">{c.ip_subnet ?? '—'}</span></div>
                <div className="flex gap-2"><span className="text-white/40 w-28 flex-none">匿名Cookie ID</span><span className="text-white/80 break-all">{c.anon_id ?? '—'}</span></div>
                <div className="flex gap-2"><span className="text-white/40 w-28 flex-none">User-Agent</span><span className="text-white/80 break-all">{c.ua ?? '—'}</span></div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {c.ip && (
                    <button
                      onClick={async () => {
                        if (!confirm(`IP ${c.ip} をブロックします。よろしいですか？`)) return;
                        const { error } = await addBlock('ip', c.ip!, 'お問い合わせから');
                        toast[error ? 'error' : 'success'](error ?? 'このIPをブロックしました');
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#ff8fc0] border border-[#ff2d95]/30 rounded-lg px-2.5 py-1 hover:bg-[#ff2d95]/10"
                    >
                      <Ban size={12} /> このIPをブロック
                    </button>
                  )}
                  {c.anon_id && (
                    <button
                      onClick={async () => {
                        if (!confirm('この匿名Cookie IDをブロックします。よろしいですか？')) return;
                        const { error } = await addBlock('anon', c.anon_id!, 'お問い合わせから');
                        toast[error ? 'error' : 'success'](error ?? 'このCookieをブロックしました');
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#ff8fc0] border border-[#ff2d95]/30 rounded-lg px-2.5 py-1 hover:bg-[#ff2d95]/10"
                    >
                      <Ban size={12} /> このCookieをブロック
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ApplicationsPanel() {
  const [rows, setRows] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await listApplications();
    if (error) toast.error(error);
    setRows(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const approve = async (a: ApplicationRow) => {
    if (!confirm(`「${a.server_name}」のスレッドを作成して承認します。よろしいですか？`)) return;
    setBusyId(a.id);
    const { data: threadId, error } = await approveApplication(a.id);
    setBusyId(null);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success('承認してスレッドを作成しました');
    if (threadId) window.open(`/thread/${threadId}`, '_blank');
    load();
  };

  const reject = async (a: ApplicationRow) => {
    if (!confirm(`「${a.server_name}」の申請を削除します。よろしいですか？`)) return;
    setBusyId(a.id);
    const { error } = await deleteApplication(a.id);
    setBusyId(null);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success('申請を削除しました');
    load();
  };

  const isUrl = (s: string) => /^https?:\/\//i.test(s);

  if (loading) {
    return (
      <div className="text-center py-16 text-white/50">
        <Loader2 size={26} className="mx-auto mb-3 animate-spin" /> 取得中…
      </div>
    );
  }
  if (rows.length === 0) {
    return <div className="text-center py-16 text-white/50">掲載申請はありません</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((a) => {
        const busy = busyId === a.id;
        return (
          <div
            key={a.id}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4"
            style={{ borderColor: a.approved ? undefined : 'rgba(255,45,149,.35)' }}
          >
            <div className="flex items-center gap-2 mb-1.5 text-[12px] flex-wrap">
              <span
                className="font-extrabold rounded px-2 py-0.5"
                style={{
                  color: a.approved ? '#3de0a0' : '#ff8fc0',
                  border: `1px solid ${a.approved ? '#3de0a0' : '#ff2d95'}55`,
                }}
              >
                {a.approved ? '対応済み' : '未対応'}
              </span>
              <span className="font-bold text-white text-[14px]">{a.server_name}</span>
              {a.applicant && <span className="text-white/45">申請者: {a.applicant}</span>}
              <span className="ml-auto text-white/40">{formatPostDate(a.created_at)}</span>
            </div>
            <p className="text-sm text-white/85 whitespace-pre-wrap break-words bg-black/20 rounded-lg p-3 m-0">
              {a.description}
            </p>
            {a.contact && (
              <p className="text-[12px] text-white/60 mt-2 m-0 break-all">
                連絡先：{' '}
                {isUrl(a.contact) ? (
                  <a href={a.contact} target="_blank" rel="noopener noreferrer" className="text-[#22d3ee] hover:underline">
                    {a.contact}
                  </a>
                ) : (
                  a.contact
                )}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              {!a.approved && (
                <button
                  disabled={busy}
                  onClick={() => approve(a)}
                  className="inline-flex items-center gap-1 text-[12px] font-bold text-[#3de0a0] border border-[#3de0a0]/30 rounded-lg px-3 py-1.5 hover:bg-[#3de0a0]/10 disabled:opacity-50"
                >
                  {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} 承認（スレッド作成）
                </button>
              )}
              <button
                disabled={busy}
                onClick={() => reject(a)}
                className="inline-flex items-center gap-1 text-[12px] font-bold text-[#ff8fc0] border border-[#ff2d95]/30 rounded-lg px-3 py-1.5 hover:bg-[#ff2d95]/10 disabled:opacity-50"
              >
                <Trash2 size={13} /> {a.approved ? '削除' : '却下'}
              </button>
              <button
                onClick={() => setExpanded((cur) => (cur === a.id ? null : a.id))}
                className="inline-flex items-center gap-1 text-[12px] font-bold text-white/70 border border-white/15 rounded-lg px-3 py-1.5 hover:bg-white/10"
              >
                <Info size={13} /> {expanded === a.id ? '詳細を閉じる' : '詳細'}
              </button>
            </div>

            {expanded === a.id && (
              <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-[12px] flex flex-col gap-1.5">
                <div className="flex gap-2"><span className="text-white/40 w-28 flex-none">IPアドレス</span><span className="text-white/80 break-all">{a.ip ?? '—'}</span></div>
                <div className="flex gap-2"><span className="text-white/40 w-28 flex-none">IPサブネット</span><span className="text-white/80 break-all">{a.ip_subnet ?? '—'}</span></div>
                <div className="flex gap-2"><span className="text-white/40 w-28 flex-none">匿名Cookie ID</span><span className="text-white/80 break-all">{a.anon_id ?? '—'}</span></div>
                <div className="flex gap-2"><span className="text-white/40 w-28 flex-none">User-Agent</span><span className="text-white/80 break-all">{a.ua ?? '—'}</span></div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {a.ip && (
                    <button
                      onClick={async () => {
                        if (!confirm(`IP ${a.ip} をブロックします。よろしいですか？`)) return;
                        const { error } = await addBlock('ip', a.ip!, '掲載申請から');
                        toast[error ? 'error' : 'success'](error ?? 'このIPをブロックしました');
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#ff8fc0] border border-[#ff2d95]/30 rounded-lg px-2.5 py-1 hover:bg-[#ff2d95]/10"
                    >
                      <Ban size={12} /> このIPをブロック
                    </button>
                  )}
                  {a.anon_id && (
                    <button
                      onClick={async () => {
                        if (!confirm('この匿名Cookie IDをブロックします。よろしいですか？')) return;
                        const { error } = await addBlock('anon', a.anon_id!, '掲載申請から');
                        toast[error ? 'error' : 'success'](error ?? 'このCookieをブロックしました');
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#ff8fc0] border border-[#ff2d95]/30 rounded-lg px-2.5 py-1 hover:bg-[#ff2d95]/10"
                    >
                      <Ban size={12} /> このCookieをブロック
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ServersPanel() {
  const [rows, setRows] = useState<FivemServerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await listFivemServers();
    if (error) toast.error(error);
    setRows(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remove = async (s: FivemServerRow) => {
    if (!confirm(`「${s.name}」を募集板から削除します。よろしいですか？`)) return;
    setBusyId(s.id);
    const { error } = await deleteFivemServer(s.id);
    setBusyId(null);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success('削除しました');
    load();
  };

  const isUrl = (s: string) => /^https?:\/\//i.test(s);

  if (loading) {
    return (
      <div className="text-center py-16 text-white/50">
        <Loader2 size={26} className="mx-auto mb-3 animate-spin" /> 取得中…
      </div>
    );
  }
  if (rows.length === 0) {
    return <div className="text-center py-16 text-white/50">掲載中のサーバーはありません</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((s) => {
        const busy = busyId === s.id;
        return (
          <div key={s.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 mb-1.5 text-[12px] flex-wrap">
              {s.icon && (
                <img src={imagePublicUrl(s.icon)} alt="" className="w-7 h-7 rounded object-cover border border-white/15 flex-none" loading="lazy" />
              )}
              <span className="font-extrabold rounded px-2 py-0.5 text-[#22d3ee] border border-[#22d3ee]/40">{s.type || 'RP'}</span>
              <span className="font-bold text-white text-[14px]">{s.name}</span>
              {s.language && <span className="text-white/45">{s.language}</span>}
              <span className="ml-auto text-white/40">{formatPostDate(s.created_at)}</span>
            </div>
            <p className="text-sm text-white/85 whitespace-pre-wrap break-words bg-black/20 rounded-lg p-3 m-0">
              {s.description}
            </p>
            {(s.connect_info || s.discord_url) && (
              <div className="text-[12px] text-white/60 mt-2 flex flex-col gap-1">
                {s.connect_info && <span className="break-all">接続: {s.connect_info}</span>}
                {s.discord_url && (
                  <span className="break-all">
                    Discord:{' '}
                    {isUrl(s.discord_url) ? (
                      <a href={s.discord_url} target="_blank" rel="noopener noreferrer" className="text-[#22d3ee] hover:underline">{s.discord_url}</a>
                    ) : (
                      s.discord_url
                    )}
                  </span>
                )}
              </div>
            )}
            {s.tags && s.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {s.tags.map((t) => (
                  <span key={t} className="text-[11px] text-white/55 bg-white/[0.05] border border-white/10 rounded px-2 py-0.5">#{t}</span>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setExpanded((cur) => (cur === s.id ? null : s.id))}
                className="inline-flex items-center gap-1 text-[12px] font-bold text-white/70 border border-white/15 rounded-lg px-3 py-1.5 hover:bg-white/10"
              >
                <Info size={13} /> {expanded === s.id ? '詳細を閉じる' : '詳細'}
              </button>
              <button
                disabled={busy}
                onClick={() => remove(s)}
                className="inline-flex items-center gap-1 text-[12px] font-bold text-[#ff8fc0] border border-[#ff2d95]/30 rounded-lg px-3 py-1.5 hover:bg-[#ff2d95]/10 disabled:opacity-50"
              >
                {busy ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} 削除
              </button>
            </div>

            {expanded === s.id && (
              <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-[12px] flex flex-col gap-1.5">
                <div className="flex gap-2"><span className="text-white/40 w-28 flex-none">IPアドレス</span><span className="text-white/80 break-all">{s.ip ?? '—'}</span></div>
                <div className="flex gap-2"><span className="text-white/40 w-28 flex-none">IPサブネット</span><span className="text-white/80 break-all">{s.ip_subnet ?? '—'}</span></div>
                <div className="flex gap-2"><span className="text-white/40 w-28 flex-none">匿名Cookie ID</span><span className="text-white/80 break-all">{s.anon_id ?? '—'}</span></div>
                <div className="flex gap-2"><span className="text-white/40 w-28 flex-none">User-Agent</span><span className="text-white/80 break-all">{s.ua ?? '—'}</span></div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {s.ip && (
                    <button
                      onClick={async () => {
                        if (!confirm(`IP ${s.ip} をブロックします。よろしいですか？`)) return;
                        const { error } = await addBlock('ip', s.ip!, 'サーバー募集から');
                        toast[error ? 'error' : 'success'](error ?? 'このIPをブロックしました');
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#ff8fc0] border border-[#ff2d95]/30 rounded-lg px-2.5 py-1 hover:bg-[#ff2d95]/10"
                    >
                      <Ban size={12} /> このIPをブロック
                    </button>
                  )}
                  {s.anon_id && (
                    <button
                      onClick={async () => {
                        if (!confirm('この匿名Cookie IDをブロックします。よろしいですか？')) return;
                        const { error } = await addBlock('anon', s.anon_id!, 'サーバー募集から');
                        toast[error ? 'error' : 'success'](error ?? 'このCookieをブロックしました');
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#ff8fc0] border border-[#ff2d95]/30 rounded-lg px-2.5 py-1 hover:bg-[#ff2d95]/10"
                    >
                      <Ban size={12} /> このCookieをブロック
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PostsPanel() {
  const [rows, setRows] = useState<AdminPostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await listAdminPosts();
    if (error) toast.error(error);
    setRows(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const act = async (id: string, fn: () => Promise<{ error?: string }>, okMsg: string) => {
    setBusyId(id);
    const { error } = await fn();
    setBusyId(null);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(okMsg);
    load();
  };

  if (loading) {
    return (
      <div className="text-center py-16 text-white/50">
        <Loader2 size={26} className="mx-auto mb-3 animate-spin" /> 取得中…
      </div>
    );
  }
  if (rows.length === 0) {
    return <div className="text-center py-16 text-white/50">投稿がありません</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((p) => {
        const board = getBoard(p.board);
        const busy = busyId === p.id;
        return (
          <div key={p.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 flex-wrap mb-1.5 text-[12px]">
              <span className="text-white/55">{board?.title.replace('掲示板', '') ?? p.board}</span>
              <span className="text-white/30">#{p.post_number}</span>
              <span className="font-bold text-white">{p.name}</span>
              {p.report_count > 0 && <span className="vice-num text-[#ff2d95]">通報 {p.report_count}</span>}
              {p.hidden && <span className="text-white/40">（非表示中）</span>}
              <span className="ml-auto text-white/40">{formatPostDate(p.created_at)}</span>
            </div>
            <p className="text-sm text-white/80 whitespace-pre-wrap break-words bg-black/20 rounded-lg p-3 m-0 max-h-32 overflow-auto">
              {p.body}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <a
                href={`/thread/${p.thread_id}#post-${p.post_number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[12px] font-bold text-white/70 hover:text-white border border-white/15 rounded-lg px-3 py-1.5"
              >
                <ExternalLink size={13} /> 投稿へ
              </a>
              <button
                disabled={busy}
                onClick={() => {
                  if (p.hidden) {
                    act(p.id, () => setPostHidden(p.id, false), '再表示しました');
                  } else {
                    const reason = prompt('非表示の理由（任意・記録されます）') ?? '';
                    act(p.id, () => setPostHidden(p.id, true, reason), '非表示にしました');
                  }
                }}
                className="inline-flex items-center gap-1 text-[12px] font-bold text-[#ffcf8a] border border-[#ffcf8a]/30 rounded-lg px-3 py-1.5 hover:bg-[#ffcf8a]/10 disabled:opacity-50"
              >
                {p.hidden ? <Eye size={13} /> : <EyeOff size={13} />} {p.hidden ? '再表示' : '非表示'}
              </button>
              <button
                disabled={busy}
                onClick={() => {
                  if (confirm('この投稿を完全に削除します。よろしいですか？'))
                    act(p.id, () => deletePost(p.id), '削除しました');
                }}
                className="inline-flex items-center gap-1 text-[12px] font-bold text-[#ff8fc0] border border-[#ff2d95]/30 rounded-lg px-3 py-1.5 hover:bg-[#ff2d95]/10 disabled:opacity-50"
              >
                <Trash2 size={13} /> 削除
              </button>
              <button
                onClick={() => setExpanded((cur) => (cur === p.id ? null : p.id))}
                className="inline-flex items-center gap-1 text-[12px] font-bold text-white/70 border border-white/15 rounded-lg px-3 py-1.5 hover:bg-white/10"
              >
                <Info size={13} /> {expanded === p.id ? '詳細を閉じる' : '詳細'}
              </button>
            </div>
            {expanded === p.id && <PostMetaDetail postId={p.id} />}
          </div>
        );
      })}
    </div>
  );
}

function BlocksPanel() {
  const [rows, setRows] = useState<BlockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ kind: BlockRow['kind']; value: string; reason: string; days: string }>({
    kind: 'ip',
    value: '',
    reason: '',
    days: '',
  });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await listBlocks();
    if (error) toast.error(error);
    setRows(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.value.trim()) {
      toast.error('値を入力してください');
      return;
    }
    setBusy(true);
    const { error } = await addBlock(
      form.kind,
      form.value.trim(),
      form.reason.trim() || undefined,
      form.days ? Number(form.days) : undefined,
    );
    setBusy(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success('ブロックを追加しました');
    setForm({ kind: 'ip', value: '', reason: '', days: '' });
    load();
  };

  const kindLabel = { ip: 'IP', ip_subnet: 'IPサブネット', anon: 'Cookie ID' } as const;
  const sel = 'bg-white/[0.05] border border-white/12 rounded-lg px-2.5 py-2 text-[#f4eef8] text-[13px] outline-none focus:border-[#a78bfa]/60';

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 flex flex-wrap gap-2 items-end">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-white/45">種別</span>
          <select
            value={form.kind}
            onChange={(e) => setForm({ ...form, kind: e.target.value as BlockRow['kind'] })}
            className={sel}
          >
            <option value="ip">IP</option>
            <option value="ip_subnet">IPサブネット(/24)</option>
            <option value="anon">Cookie ID</option>
          </select>
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
          <span className="text-[11px] text-white/45">値</span>
          <input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="例: 1.2.3.4 / 1.2.3.0/24 / uuid" className={sel + ' w-full'} />
        </div>
        <div className="flex flex-col gap-1 w-[120px]">
          <span className="text-[11px] text-white/45">理由(任意)</span>
          <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className={sel + ' w-full'} />
        </div>
        <div className="flex flex-col gap-1 w-[90px]">
          <span className="text-[11px] text-white/45">日数(空=無期限)</span>
          <input value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value.replace(/[^0-9]/g, '') })} className={sel + ' w-full'} />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="text-white font-extrabold text-[13px] px-4 py-2 rounded-lg disabled:opacity-60"
          style={{ background: 'linear-gradient(95deg,#ff8a3d,#ff2d95 60%,#c44be0)' }}
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : '追加'}
        </button>
      </form>

      {loading ? (
        <div className="text-center py-12 text-white/50"><Loader2 size={24} className="mx-auto mb-2 animate-spin" /> 取得中…</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12 text-white/50">ブロックはありません</div>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((b) => (
            <div key={b.id} className="flex items-center gap-2 flex-wrap rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-[12px]">
              <span className="font-extrabold text-[#ff8fc0]">{kindLabel[b.kind]}</span>
              <span className="text-white/85 break-all">{b.value}</span>
              {b.reason && <span className="text-white/45">（{b.reason}）</span>}
              <span className="text-white/40">
                {b.expires_at ? `〜${formatPostDate(b.expires_at)}` : '無期限'}
              </span>
              <button
                onClick={async () => {
                  if (!confirm('このブロックを解除しますか？')) return;
                  const { error } = await removeBlock(b.id);
                  if (error) toast.error(error);
                  else {
                    toast.success('解除しました');
                    load();
                  }
                }}
                className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-white/60 hover:text-white border border-white/15 rounded-lg px-2.5 py-1"
              >
                <X size={12} /> 解除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SearchPanel() {
  const [ip, setIp] = useState('');
  const [anon, setAnon] = useState('');
  const [rows, setRows] = useState<AdminPostRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchRows = async () => {
    setLoading(true);
    const { data, error } = await searchAdminPosts({ ip: ip.trim() || undefined, anon: anon.trim() || undefined });
    if (error) toast.error(error);
    setRows(data);
    setLoading(false);
  };

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ip.trim() && !anon.trim()) {
      toast.error('IPアドレスまたはCookie IDを入力してください');
      return;
    }
    setSearched(true);
    fetchRows();
  };

  const act = async (id: string, fn: () => Promise<{ error?: string }>, okMsg: string) => {
    setBusyId(id);
    const { error } = await fn();
    setBusyId(null);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(okMsg);
    fetchRows();
  };

  const sel = 'bg-white/[0.05] border border-white/12 rounded-lg px-3 py-2 text-[#f4eef8] text-[13px] outline-none focus:border-[#a78bfa]/60';

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={run} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 flex flex-wrap gap-2 items-end">
        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
          <span className="text-[11px] text-white/45">IPアドレス（部分一致可）</span>
          <input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="例: 119.150.18.145" className={sel + ' w-full'} />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
          <span className="text-[11px] text-white/45">匿名Cookie ID（完全一致）</span>
          <input value={anon} onChange={(e) => setAnon(e.target.value)} placeholder="任意" className={sel + ' w-full'} />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-white font-extrabold text-[13px] px-5 py-2 rounded-lg disabled:opacity-60"
          style={{ background: 'linear-gradient(95deg,#ff8a3d,#ff2d95 60%,#c44be0)' }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} 検索
        </button>
      </form>

      {loading ? (
        <div className="text-center py-12 text-white/50"><Loader2 size={24} className="mx-auto mb-2 animate-spin" /> 検索中…</div>
      ) : !searched ? (
        <div className="text-center py-12 text-white/45">IPアドレス等を入力して検索してください。</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12 text-white/50">該当する投稿はありません</div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="text-[12px] text-white/50">{rows.length} 件</div>
          {rows.map((p) => {
            const board = getBoard(p.board);
            const busy = busyId === p.id;
            return (
              <div key={p.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
                <div className="flex items-center gap-2 flex-wrap mb-1.5 text-[12px]">
                  <span className="text-white/55">{board?.title.replace('掲示板', '') ?? p.board}</span>
                  <span className="text-white/30">#{p.post_number}</span>
                  <span className="font-bold text-white">{p.name}</span>
                  {p.report_count > 0 && <span className="vice-num text-[#ff2d95]">通報 {p.report_count}</span>}
                  {p.hidden && <span className="text-white/40">（非表示中）</span>}
                  <span className="ml-auto text-white/40">{formatPostDate(p.created_at)}</span>
                </div>
                <p className="text-sm text-white/80 whitespace-pre-wrap break-words bg-black/20 rounded-lg p-3 m-0 max-h-32 overflow-auto">
                  {p.body}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <a href={`/thread/${p.thread_id}#post-${p.post_number}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] font-bold text-white/70 hover:text-white border border-white/15 rounded-lg px-3 py-1.5">
                    <ExternalLink size={13} /> 投稿へ
                  </a>
                  <button
                    disabled={busy}
                    onClick={() => {
                      if (p.hidden) act(p.id, () => setPostHidden(p.id, false), '再表示しました');
                      else {
                        const reason = prompt('非表示の理由（任意・記録されます）') ?? '';
                        act(p.id, () => setPostHidden(p.id, true, reason), '非表示にしました');
                      }
                    }}
                    className="inline-flex items-center gap-1 text-[12px] font-bold text-[#ffcf8a] border border-[#ffcf8a]/30 rounded-lg px-3 py-1.5 hover:bg-[#ffcf8a]/10 disabled:opacity-50"
                  >
                    {p.hidden ? <Eye size={13} /> : <EyeOff size={13} />} {p.hidden ? '再表示' : '非表示'}
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => { if (confirm('この投稿を完全に削除します。よろしいですか？')) act(p.id, () => deletePost(p.id), '削除しました'); }}
                    className="inline-flex items-center gap-1 text-[12px] font-bold text-[#ff8fc0] border border-[#ff2d95]/30 rounded-lg px-3 py-1.5 hover:bg-[#ff2d95]/10 disabled:opacity-50"
                  >
                    <Trash2 size={13} /> 削除
                  </button>
                  <button
                    onClick={() => setExpanded((cur) => (cur === p.id ? null : p.id))}
                    className="inline-flex items-center gap-1 text-[12px] font-bold text-white/70 border border-white/15 rounded-lg px-3 py-1.5 hover:bg-white/10"
                  >
                    <Info size={13} /> {expanded === p.id ? '詳細を閉じる' : '詳細'}
                  </button>
                </div>
                {expanded === p.id && <PostMetaDetail postId={p.id} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NewsCommentsPanel() {
  const [rows, setRows] = useState<NewsCommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await listNewsComments();
    if (error) toast.error(error);
    setRows(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const act = async (id: string, fn: () => Promise<{ error?: string }>, okMsg: string) => {
    setBusyId(id);
    const { error } = await fn();
    setBusyId(null);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(okMsg);
    load();
  };

  if (loading) {
    return (
      <div className="text-center py-16 text-white/50">
        <Loader2 size={26} className="mx-auto mb-3 animate-spin" /> 取得中…
      </div>
    );
  }
  if (rows.length === 0) {
    return <div className="text-center py-16 text-white/50">記事コメントはありません</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((c) => {
        const article = getArticleById(c.article_id);
        const busy = busyId === c.id;
        return (
          <div key={c.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 mb-1.5 text-[12px] flex-wrap">
              <span className="font-bold text-white">{c.name}</span>
              {c.ip && <span className="text-white/35">{c.ip}</span>}
              {c.hidden && <span className="text-white/40">（非表示中）</span>}
              <span className="ml-auto text-white/40">{formatPostDate(c.created_at)}</span>
            </div>
            <div className="text-[12px] text-white/50 mb-1.5">
              記事：{' '}
              <a href={`/news/${c.article_id}`} className="text-[#22d3ee] hover:underline">
                {article ? article.title : `ID ${c.article_id}`}
              </a>
            </div>
            <p className="text-sm text-white/85 whitespace-pre-wrap break-words bg-black/20 rounded-lg p-3 m-0">
              {c.body}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <a
                href={`/news/${c.article_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[12px] font-bold text-white/70 hover:text-white border border-white/15 rounded-lg px-3 py-1.5"
              >
                <ExternalLink size={13} /> 記事へ
              </a>
              <button
                disabled={busy}
                onClick={() => act(c.id, () => setNewsCommentHidden(c.id, !c.hidden), c.hidden ? '再表示しました' : '非表示にしました')}
                className="inline-flex items-center gap-1 text-[12px] font-bold text-[#ffcf8a] border border-[#ffcf8a]/30 rounded-lg px-3 py-1.5 hover:bg-[#ffcf8a]/10 disabled:opacity-50"
              >
                {c.hidden ? <Eye size={13} /> : <EyeOff size={13} />} {c.hidden ? '再表示' : '非表示'}
              </button>
              <button
                disabled={busy}
                onClick={() => { if (confirm('このコメントを削除します。よろしいですか？')) act(c.id, () => deleteNewsComment(c.id), '削除しました'); }}
                className="inline-flex items-center gap-1 text-[12px] font-bold text-[#ff8fc0] border border-[#ff2d95]/30 rounded-lg px-3 py-1.5 hover:bg-[#ff2d95]/10 disabled:opacity-50"
              >
                <Trash2 size={13} /> 削除
              </button>
              <button
                onClick={() => setExpanded((cur) => (cur === c.id ? null : c.id))}
                className="inline-flex items-center gap-1 text-[12px] font-bold text-white/70 border border-white/15 rounded-lg px-3 py-1.5 hover:bg-white/10"
              >
                <Info size={13} /> {expanded === c.id ? '詳細を閉じる' : '詳細'}
              </button>
            </div>

            {expanded === c.id && (
              <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-[12px] flex flex-col gap-1.5">
                <div className="flex gap-2"><span className="text-white/40 w-28 flex-none">IPアドレス</span><span className="text-white/80 break-all">{c.ip ?? '—'}</span></div>
                <div className="flex gap-2"><span className="text-white/40 w-28 flex-none">IPサブネット</span><span className="text-white/80 break-all">{c.ip_subnet ?? '—'}</span></div>
                <div className="flex gap-2"><span className="text-white/40 w-28 flex-none">匿名Cookie ID</span><span className="text-white/80 break-all">{c.anon_id ?? '—'}</span></div>
                <div className="flex gap-2"><span className="text-white/40 w-28 flex-none">User-Agent</span><span className="text-white/80 break-all">{c.ua ?? '—'}</span></div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {c.ip && (
                    <button
                      onClick={async () => {
                        if (!confirm(`IP ${c.ip} をブロックします。よろしいですか？`)) return;
                        const { error } = await addBlock('ip', c.ip!, '記事コメントから');
                        toast[error ? 'error' : 'success'](error ?? 'このIPをブロックしました');
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#ff8fc0] border border-[#ff2d95]/30 rounded-lg px-2.5 py-1 hover:bg-[#ff2d95]/10"
                    >
                      <Ban size={12} /> このIPをブロック
                    </button>
                  )}
                  {c.anon_id && (
                    <button
                      onClick={async () => {
                        if (!confirm('この匿名Cookie IDをブロックします。よろしいですか？')) return;
                        const { error } = await addBlock('anon', c.anon_id!, '記事コメントから');
                        toast[error ? 'error' : 'success'](error ?? 'このCookieをブロックしました');
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#ff8fc0] border border-[#ff2d95]/30 rounded-lg px-2.5 py-1 hover:bg-[#ff2d95]/10"
                    >
                      <Ban size={12} /> このCookieをブロック
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SearchLogsPanel() {
  const [top, setTop] = useState<TopSearchRow[]>([]);
  const [recent, setRecent] = useState<SearchLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [t, r] = await Promise.all([topSearches(30), listSearches()]);
      if (t.error) toast.error(t.error);
      setTop(t.data);
      setRecent(r.data);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-16 text-white/50">
        <Loader2 size={26} className="mx-auto mb-3 animate-spin" /> 取得中…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h3 className="text-[15px] font-black mb-3 flex items-center gap-2">
          <Search size={16} className="text-[#a78bfa]" /> 人気キーワード（直近30日）
        </h3>
        {top.length === 0 ? (
          <div className="text-white/45 text-[13px] py-4">まだ検索データがありません</div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {top.map((t, i) => (
              <div key={t.query} className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2">
                <span className="vice-num text-[15px] w-5 text-center flex-none" style={{ color: 'rgba(255,45,149,.7)' }}>{i + 1}</span>
                <span className="font-bold text-white truncate flex-1 min-w-0">{t.query}</span>
                {t.zero_hits > 0 && (
                  <span className="text-[11px] text-[#ffcf8a] flex-none">0件 {t.zero_hits}回</span>
                )}
                <span className="vice-num text-[14px] text-white/70 flex-none">{t.cnt}回</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-[15px] font-black mb-3 text-white/80">最近の検索</h3>
        {recent.length === 0 ? (
          <div className="text-white/45 text-[13px] py-4">まだ検索データがありません</div>
        ) : (
          <div className="flex flex-col gap-1">
            {recent.map((s) => (
              <div key={s.id} className="flex items-center gap-2 text-[12px] px-2 py-1.5 border-b border-white/[0.06]">
                <span className="text-white/85 truncate flex-1 min-w-0">{s.query}</span>
                <span className="text-white/40 flex-none">{s.scope === 'board' ? '掲示板' : '全体'}</span>
                <span className="text-white/40 flex-none">{s.results_count}件</span>
                <span className="text-white/35 flex-none">{formatPostDate(s.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function AdminReports() {
  const [authed, setAuthed] = useState(isLoggedIn());
  const [tab, setTab] = useState<
    'newspost' | 'reports' | 'posts' | 'search' | 'searchlog' | 'images' | 'contacts' | 'applications' | 'servers' | 'news' | 'blocks'
  >('newspost');
  useEffect(() => subscribeAdmin(() => setAuthed(isLoggedIn())), []);
  const tabLabel = {
    newspost: '記事投稿',
    reports: '通報',
    posts: '投稿ログ',
    search: 'IP検索',
    searchlog: '検索ログ',
    images: '画像承認',
    contacts: 'お問い合わせ',
    applications: '掲載申請',
    servers: 'サーバー募集',
    news: '記事コメント',
    blocks: 'ブロック',
  } as const;

  return (
    <div className="vice-page vice-noise">
      <Header />
      <main className="max-w-[860px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[100px] pb-20 relative z-10">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
          <div>
            <span className="text-xs font-extrabold tracking-[0.2em] text-[#a78bfa] uppercase">Moderation</span>
            <h1 className="font-black text-3xl md:text-[40px] leading-tight mt-2">管理画面</h1>
          </div>
          {authed && (
            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-1.5 text-[13px] font-bold text-white/60 hover:text-white border border-white/15 rounded-full px-4 py-2 transition-colors"
            >
              <LogOut size={14} /> ログアウト
            </button>
          )}
        </div>

        {authed ? (
          <>
            <div className="flex gap-2 mb-5 flex-wrap">
              {(['newspost', 'news', 'servers', 'posts', 'applications', 'images', 'reports', 'contacts', 'searchlog', 'search', 'blocks'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="px-4 py-2 rounded-full text-sm font-extrabold transition-colors"
                  style={{
                    border: `1px solid ${tab === t ? '#a78bfa' : 'rgba(255,255,255,.1)'}`,
                    background: tab === t ? 'rgba(167,139,250,.12)' : 'rgba(255,255,255,.05)',
                    color: tab === t ? '#fff' : 'rgba(244,238,248,.65)',
                  }}
                >
                  {tabLabel[t]}
                </button>
              ))}
            </div>
            {tab === 'newspost' ? (
              <NewsEditor />
            ) : tab === 'reports' ? (
              <ReportsPanel />
            ) : tab === 'posts' ? (
              <PostsPanel />
            ) : tab === 'search' ? (
              <SearchPanel />
            ) : tab === 'searchlog' ? (
              <SearchLogsPanel />
            ) : tab === 'images' ? (
              <ImagesPanel />
            ) : tab === 'contacts' ? (
              <ContactsPanel />
            ) : tab === 'applications' ? (
              <ApplicationsPanel />
            ) : tab === 'servers' ? (
              <ServersPanel />
            ) : tab === 'news' ? (
              <NewsCommentsPanel />
            ) : (
              <BlocksPanel />
            )}
          </>
        ) : (
          <LoginGate />
        )}
      </main>
    </div>
  );
}
