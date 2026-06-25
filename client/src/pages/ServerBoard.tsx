import { useEffect, useState } from 'react';
import { Plus, X, Send, Server as ServerIcon, Loader2, Search, ImagePlus } from 'lucide-react';
import Header from '@/components/Header';
import ServerCard from '@/components/ServerCard';
import { toast } from 'sonner';
import { type FivemServer } from '@/lib/supabase';
import { listApprovedServers, createFivemServer } from '@/lib/servers';
import { uploadRawImages } from '@/lib/images';
import { boardErrorMessage } from '@/lib/board';
import { useT, useLang } from '@/lib/i18n';

const SERVER_TYPES = [
  { id: 'all', label: 'すべて' },
  { id: 'RP', label: 'RP' },
  { id: 'Racing', label: 'レース' },
  { id: 'Survival', label: 'サバイバル' },
  { id: 'Other', label: 'その他' },
];

const emptyForm = {
  name: '',
  description: '',
  type: 'RP',
  connect_info: '',
  discord_url: '',
  language: '日本語',
  tags: '',
};

const inputClass =
  'w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-[#f4eef8] placeholder:text-white/35 focus:outline-none focus:border-[#ff2d95]/60 transition-colors';

export default function ServerBoard() {
  const tr = useT();
  const lang = useLang();
  const [servers, setServers] = useState<FivemServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  // サーバーのアイコン画像（任意・承認不要で即時表示）
  const [iconFile, setIconFile] = useState<File | null>(null);
  // ハニーポット（人間には見えない・ボット対策）
  const [hp, setHp] = useState('');

  const loadServers = async () => {
    setLoading(true);
    const { data, error } = await listApprovedServers();
    if (error) {
      console.error('サーバー一覧の取得に失敗:', error);
      toast.error(tr('srv.toast.loadFail'));
      setServers([]);
    } else {
      setServers((data as FivemServer[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadServers();
  }, []);

  const allTags = Array.from(new Set(servers.flatMap((s) => s.tags ?? [])));

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const filteredServers = servers.filter((server) => {
    const matchesType = selectedType === 'all' || server.type === selectedType;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      server.name.toLowerCase().includes(q) || server.description.toLowerCase().includes(q);
    const matchesTags =
      selectedTags.length === 0 || selectedTags.some((tag) => (server.tags ?? []).includes(tag));
    return matchesType && matchesSearch && matchesTags;
  });

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hp) return; // ハニーポット＝ボット。静かに無視。
    if (!form.name.trim() || !form.description.trim()) {
      toast.error(tr('srv.toast.nameDescReq'));
      return;
    }
    if (!form.connect_info.trim() && !form.discord_url.trim()) {
      toast.error(tr('srv.toast.connectOrDiscord'));
      return;
    }
    setSubmitting(true);
    const tags = form.tags
      .split(/[,、\s]+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 8);

    // アイコン画像が選ばれていれば、先にアップロード（EXIF除去・圧縮）。即時表示（承認不要）。
    let iconPath: string | null = null;
    if (iconFile) {
      const { paths, error: upErr } = await uploadRawImages('fivem-server', [iconFile]);
      if (upErr) {
        setSubmitting(false);
        toast.error(upErr);
        return;
      }
      iconPath = paths[0] ?? null;
    }

    const { error } = await createFivemServer({
      name: form.name.trim(),
      description: form.description.trim(),
      type: form.type,
      connect_info: form.connect_info.trim() || null,
      discord_url: form.discord_url.trim() || null,
      language: form.language.trim() || null,
      tags,
      icon: iconPath,
      hp,
    });
    setSubmitting(false);

    if (error) {
      console.error('投稿に失敗:', error);
      toast.error(boardErrorMessage(error.message));
      return;
    }
    toast.success(tr('srv.toast.posted'));
    setForm(emptyForm);
    setIconFile(null);
    setShowForm(false);
    loadServers();
  };

  return (
    <div className="vice-page vice-noise">
      <Header />

      <main className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[100px] pb-16 relative z-10">
        {/* Hero */}
        <div className="flex items-end justify-between gap-5 flex-wrap mb-2">
          <div>
            <span className="text-xs font-extrabold tracking-[0.2em] text-[#22d3ee] uppercase">
              FiveM Server Recruit
            </span>
            <h1 className="font-black text-3xl md:text-[46px] leading-tight mt-2">{tr('srv.heading')}</h1>
            <p className="text-white/60 text-sm mt-2.5 leading-relaxed max-w-[560px]">
              {tr('srv.lead')}
            </p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex-none text-sm font-extrabold px-[22px] py-3 rounded-full inline-flex items-center gap-1.5 hover:-translate-y-px transition-transform"
            style={{
              background: showForm ? 'rgba(255,255,255,.1)' : 'linear-gradient(95deg,#ff8a3d,#ff2d95 60%,#c44be0)',
              boxShadow: showForm ? 'none' : '0 4px 20px rgba(255,45,149,.4)',
              color: showForm ? '#fff' : '#fff',
            }}
          >
            {showForm ? (<><X size={16} /> {tr('srv.close')}</>) : (<><Plus size={16} strokeWidth={3} /> {tr('srv.post')}</>)}
          </button>
        </div>

        {/* Submission form */}
        {showForm && (
          <div className="mt-6 rounded-2xl border border-[#ff2d95]/25 bg-[#ff2d95]/[0.05] p-6">
            <h2 className="text-xl font-black text-white mb-1">{tr('srv.formTitle')}</h2>
            <p className="text-[13px] text-white/60 mb-5">{tr('srv.formNote')}</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ハニーポット（人間には見えない・ボット対策） */}
              <input
                type="text"
                name="hp_url"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={hp}
                onChange={(e) => setHp(e.target.value)}
                style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
              />
              <div>
                <label className="block text-sm font-bold text-[#22d3ee] mb-2">{tr('srv.name')}</label>
                <input name="name" value={form.name} onChange={handleFormChange} placeholder={tr('srv.ph.name')} maxLength={60} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#22d3ee] mb-2">{tr('srv.desc')}</label>
                <textarea name="description" value={form.description} onChange={handleFormChange} placeholder={tr('srv.ph.desc')} rows={4} maxLength={500} className={inputClass} />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#22d3ee] mb-2">{tr('srv.typeLabel')}</label>
                  <select name="type" value={form.type} onChange={handleFormChange} className={`${inputClass} h-[46px]`}>
                    {SERVER_TYPES.filter((x) => x.id !== 'all').map((x) => (
                      <option key={x.id} value={x.id} className="bg-[#15091c]">{tr(`srv.type.${x.id}`)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#22d3ee] mb-2">{tr('srv.lang')}</label>
                  <input name="language" value={form.language} onChange={handleFormChange} placeholder={tr('srv.ph.lang')} maxLength={30} className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#22d3ee] mb-2">{tr('srv.connect')}</label>
                <input name="connect_info" value={form.connect_info} onChange={handleFormChange} placeholder={tr('srv.ph.connect')} maxLength={120} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#22d3ee] mb-2">{tr('srv.discord')}</label>
                <input name="discord_url" value={form.discord_url} onChange={handleFormChange} placeholder="https://discord.gg/xxxxxxx" maxLength={120} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#22d3ee] mb-2">{tr('srv.tags')}</label>
                <input name="tags" value={form.tags} onChange={handleFormChange} placeholder={tr('srv.ph.tags')} maxLength={120} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#22d3ee] mb-2">{tr('srv.icon')}</label>
                {iconFile ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={URL.createObjectURL(iconFile)}
                      alt="アイコンプレビュー"
                      className="w-16 h-16 rounded-xl object-cover border border-white/15"
                    />
                    <button
                      type="button"
                      onClick={() => setIconFile(null)}
                      className="inline-flex items-center gap-1.5 text-[13px] font-bold text-white/70 hover:text-[#ff8fc0] border border-white/15 rounded-lg px-3 py-2"
                    >
                      <X size={14} /> {tr('srv.iconCancel')}
                    </button>
                  </div>
                ) : (
                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-[13px] font-bold text-white/70 hover:text-[#22d3ee] border border-white/15 rounded-lg px-3 py-2 transition-colors">
                    <ImagePlus size={16} /> {tr('srv.iconPick')}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        setIconFile(f);
                        e.target.value = '';
                      }}
                    />
                  </label>
                )}
                <p className="text-[11px] text-white/40 mt-1.5">{tr('srv.iconNote')}</p>
              </div>
              <p className="text-xs text-white/40">{tr('srv.required')}</p>
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 text-white font-extrabold py-3 rounded-full hover:-translate-y-0.5 transition-transform disabled:opacity-60"
                style={{ background: 'linear-gradient(95deg,#ff8a3d,#ff2d95 60%,#c44be0)' }}
              >
                {submitting ? (<><Loader2 size={16} className="animate-spin" /> {tr('srv.submitting')}</>) : (<><Send size={16} /> {tr('srv.post')}</>)}
              </button>
            </form>
          </div>
        )}

        {/* Search + filters */}
        <div className="mt-8 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 rounded-full px-4 py-2.5 flex-1 min-w-[220px]" style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)' }}>
            <Search size={15} className="opacity-60 flex-none" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tr('srv.searchPlaceholder')}
              className="bg-transparent border-none outline-none text-[#f4eef8] text-[13px] w-full min-w-0 placeholder:text-white/40"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1.5">
          {SERVER_TYPES.map((x) => {
            const active = selectedType === x.id;
            return (
              <button
                key={x.id}
                onClick={() => setSelectedType(x.id)}
                className="flex-none px-4 py-2.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors"
                style={{
                  border: `1px solid ${active ? '#ff2d95' : 'rgba(255,255,255,.14)'}`,
                  background: active ? 'rgba(255,45,149,.13)' : 'rgba(255,255,255,.05)',
                  color: active ? '#fff' : 'rgba(244,238,248,.65)',
                }}
              >
                {tr(`srv.type.${x.id}`)}
              </button>
            );
          })}
        </div>

        {allTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {allTags.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className="text-[12px] font-bold px-3 py-1.5 rounded-full transition-colors"
                  style={{
                    border: `1px solid ${active ? '#a78bfa' : 'rgba(255,255,255,.12)'}`,
                    background: active ? 'rgba(167,139,250,.15)' : 'rgba(255,255,255,.05)',
                    color: active ? '#fff' : 'rgba(244,238,248,.65)',
                  }}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-5 text-white/50 text-sm font-mono">
          {loading
            ? tr('srv.loading')
            : lang === 'ja'
              ? `${filteredServers.length} 件のサーバー`
              : `${filteredServers.length} server${filteredServers.length === 1 ? '' : 's'}`}
        </div>

        {/* Grid */}
        <div className="mt-5">
          {loading ? (
            <div className="text-center py-16 text-white/50">
              <Loader2 size={28} className="mx-auto mb-4 animate-spin" />
              {tr('srv.fetching')}
            </div>
          ) : filteredServers.length > 0 ? (
            <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(308px,1fr))' }}>
              {filteredServers.map((server) => (
                <ServerCard key={server.id} server={server} onTagClick={toggleTag} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <ServerIcon size={40} className="mx-auto mb-4 text-white/30" />
              {servers.length === 0 ? (
                <>
                  <p className="text-white/50 mb-4">{tr('srv.emptyNone')}</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="text-white font-extrabold px-6 py-3 rounded-full inline-flex items-center gap-1.5"
                    style={{ background: 'linear-gradient(95deg,#ff8a3d,#ff2d95 60%,#c44be0)' }}
                  >
                    <Plus size={16} strokeWidth={3} /> {tr('srv.postFirst')}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-white/50 mb-4">{tr('srv.noMatch')}</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedType('all');
                      setSelectedTags([]);
                    }}
                    className="text-[#f4eef8] font-bold px-6 py-3 rounded-full bg-white/[0.05] border border-white/15 hover:bg-white/10 transition-colors"
                  >
                    {tr('srv.resetFilter')}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/10" style={{ background: 'rgba(8,6,15,.6)' }}>
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-[30px] py-8 text-center text-[11.5px] text-white/40">
          {tr('footer.disclaimer')} © 2026 GTA6 FEED
        </div>
      </footer>
    </div>
  );
}
