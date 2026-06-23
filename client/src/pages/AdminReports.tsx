import { useEffect, useState } from 'react';
import { Loader2, ShieldCheck, LogOut, EyeOff, Eye, Trash2, Check, ExternalLink, X, Mail } from 'lucide-react';
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
  type ReportRow,
  type PendingImage,
  type ContactRow,
  type ApplicationRow,
} from '@/lib/admin';
import { imagePublicUrl } from '@/lib/images';
import { REPORT_REASONS, formatPostDate } from '@/lib/board';
import { getBoard } from '@/lib/boards';

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

function ReportsPanel() {
  const [rows, setRows] = useState<ReportRow[]>([]);
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
                className="inline-flex items-center gap-1 text-[12px] font-bold text-white/70 hover:text-white border border-white/15 rounded-lg px-3 py-1.5 transition-colors"
              >
                <ExternalLink size={13} /> 投稿へ
              </a>
              <button
                disabled={busy}
                onClick={() =>
                  act(r.post_id, () => setPostHidden(r.post_id, !r.hidden), r.hidden ? '再表示しました' : '非表示にしました')
                }
                className="inline-flex items-center gap-1 text-[12px] font-bold text-[#ffcf8a] border border-[#ffcf8a]/30 rounded-lg px-3 py-1.5 hover:bg-[#ffcf8a]/10 disabled:opacity-50"
              >
                {r.hidden ? <Eye size={13} /> : <EyeOff size={13} />} {r.hidden ? '再表示' : '非表示'}
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
            <div className="flex justify-end mt-2">
              <button
                disabled={busy}
                onClick={() => remove(c.id)}
                className="inline-flex items-center gap-1 text-[12px] font-bold text-[#ff8fc0] border border-[#ff2d95]/30 rounded-lg px-3 py-1.5 hover:bg-[#ff2d95]/10 disabled:opacity-50"
              >
                {busy ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} 削除
              </button>
            </div>
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
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminReports() {
  const [authed, setAuthed] = useState(isLoggedIn());
  const [tab, setTab] = useState<'reports' | 'images' | 'contacts' | 'applications'>('reports');
  useEffect(() => subscribeAdmin(() => setAuthed(isLoggedIn())), []);
  const tabLabel = {
    reports: '通報',
    images: '画像承認',
    contacts: 'お問い合わせ',
    applications: '掲載申請',
  } as const;

  return (
    <div className="vice-page vice-noise">
      <Header />
      <main className="max-w-[860px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[100px] pb-20 relative z-10">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
          <div>
            <span className="text-xs font-extrabold tracking-[0.2em] text-[#a78bfa] uppercase">Moderation</span>
            <h1 className="font-black text-3xl md:text-[40px] leading-tight mt-2">通報の管理</h1>
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
              {(['reports', 'images', 'contacts', 'applications'] as const).map((t) => (
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
            {tab === 'reports' ? (
              <ReportsPanel />
            ) : tab === 'images' ? (
              <ImagesPanel />
            ) : tab === 'contacts' ? (
              <ContactsPanel />
            ) : (
              <ApplicationsPanel />
            )}
          </>
        ) : (
          <LoginGate />
        )}
      </main>
    </div>
  );
}
