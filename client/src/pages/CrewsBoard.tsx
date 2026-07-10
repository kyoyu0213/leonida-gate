import { useEffect, useState } from 'react';
import { Plus, X, Send, Loader2, Search, Shield } from 'lucide-react';
import Header from '@/components/Header';
import RecruitTabs from '@/components/RecruitTabs';
import CrewCard from '@/components/CrewCard';
import { toast } from 'sonner';
import { listPublishedCrews, createCrew, CREW_GENRES, type Crew } from '@/lib/crews';
import { boardErrorMessage } from '@/lib/board';
import { useT, useLang } from '@/lib/i18n';
import { useSeo } from '@/hooks/useSeo';

const emptyForm = {
  crew_name: '',
  title: '',
  genre: 'RP',
  platform: '',
  size: '',
  requirements: '',
  active_time: '',
  body: '',
  contact: '',
};

const inputClass =
  'w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-[#f4eef8] placeholder:text-white/35 focus:outline-none focus:border-[#ff8a3d]/60 transition-colors';

export default function CrewsBoard() {
  const tr = useT();
  const lang = useLang();
  useSeo(tr('seo.crews.title'), tr('seo.crews.desc'), { url: '/board/crews' });

  const [crews, setCrews] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [hp, setHp] = useState('');

  const load = async () => {
    setLoading(true);
    const { data, error } = await listPublishedCrews();
    if (error) {
      console.error('クルー募集の取得に失敗:', error);
      toast.error(tr('cr.toast.loadFail'));
      setCrews([]);
    } else {
      setCrews((data as Crew[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = crews.filter((c) => {
    const matchesGenre = selectedGenre === 'all' || c.genre === selectedGenre;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.crew_name.toLowerCase().includes(q) ||
      c.body.toLowerCase().includes(q);
    return matchesGenre && matchesSearch;
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
    if (!form.crew_name.trim() || !form.title.trim() || !form.body.trim()) {
      toast.error(tr('cr.toast.req'));
      return;
    }
    setSubmitting(true);
    const { error } = await createCrew({
      crew_name: form.crew_name.trim(),
      title: form.title.trim(),
      platform: form.platform.trim() || null,
      genre: form.genre || null,
      size: form.size.trim() || null,
      requirements: form.requirements.trim() || null,
      active_time: form.active_time.trim() || null,
      body: form.body.trim(),
      contact: form.contact.trim() || null,
      hp,
    });
    setSubmitting(false);
    if (error) {
      console.error('投稿に失敗:', error);
      toast.error(boardErrorMessage(error.message));
      return;
    }
    toast.success(tr('cr.toast.posted'));
    setForm(emptyForm);
    setShowForm(false);
    load();
  };

  const genreTabs = [{ id: 'all', labelKey: 'cr.genre.all' }, ...CREW_GENRES];

  return (
    <div className="vice-page vice-noise">
      <Header />

      <main className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[100px] pb-16 relative z-10">
        {/* 募集掲示板グループの共通タブ帯 */}
        <RecruitTabs active="crews" />

        {/* Hero */}
        <div className="flex items-end justify-between gap-5 flex-wrap mb-2">
          <div>
            <span className="text-xs font-extrabold tracking-[0.2em] text-[#ff8a3d] uppercase">Find a Crew</span>
            <h1 className="font-black text-3xl md:text-[46px] leading-tight mt-2 flex items-center gap-3">
              <Shield className="text-[#ff8a3d]" size={36} /> {tr('cr.heading')}
            </h1>
            <p className="text-white/60 text-sm mt-2.5 leading-relaxed max-w-[560px]">{tr('cr.lead')}</p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex-none text-sm font-extrabold px-[22px] py-3 rounded-full inline-flex items-center gap-1.5 hover:-translate-y-px transition-transform"
            style={{
              background: showForm ? 'rgba(255,255,255,.1)' : 'linear-gradient(95deg,#ff8a3d,#ff2d95)',
              boxShadow: showForm ? 'none' : '0 4px 20px rgba(255,138,61,.35)',
              color: '#fff',
            }}
          >
            {showForm ? (<><X size={16} /> {tr('cr.close')}</>) : (<><Plus size={16} strokeWidth={3} /> {tr('cr.post')}</>)}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="mt-6 rounded-2xl border border-[#ff8a3d]/25 bg-[#ff8a3d]/[0.04] p-6">
            <h2 className="text-xl font-black text-white mb-1">{tr('cr.formTitle')}</h2>
            <p className="text-[13px] text-white/60 mb-5">{tr('cr.formNote')}</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ハニーポット */}
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
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#ff8a3d] mb-2">{tr('cr.crewName')}</label>
                  <input name="crew_name" value={form.crew_name} onChange={handleFormChange} placeholder={tr('cr.ph.crewName')} maxLength={80} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#ff8a3d] mb-2">{tr('cr.genre')}</label>
                  <select name="genre" value={form.genre} onChange={handleFormChange} className={`${inputClass} h-[46px]`}>
                    {CREW_GENRES.map((g) => (
                      <option key={g.id} value={g.id} className="bg-[#15091c]">{tr(g.labelKey)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#ff8a3d] mb-2">{tr('cr.title')}</label>
                <input name="title" value={form.title} onChange={handleFormChange} placeholder={tr('cr.ph.title')} maxLength={80} className={inputClass} />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#ff8a3d] mb-2">{tr('cr.platform')}</label>
                  <input name="platform" value={form.platform} onChange={handleFormChange} placeholder={tr('cr.ph.platform')} maxLength={40} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#ff8a3d] mb-2">{tr('cr.size')}</label>
                  <input name="size" value={form.size} onChange={handleFormChange} placeholder={tr('cr.ph.size')} maxLength={40} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#ff8a3d] mb-2">{tr('cr.activeTime')}</label>
                  <input name="active_time" value={form.active_time} onChange={handleFormChange} placeholder={tr('cr.ph.activeTime')} maxLength={40} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#ff8a3d] mb-2">{tr('cr.contact')}</label>
                  <input name="contact" value={form.contact} onChange={handleFormChange} placeholder={tr('cr.ph.contact')} maxLength={120} className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#ff8a3d] mb-2">{tr('cr.requirements')}</label>
                <input name="requirements" value={form.requirements} onChange={handleFormChange} placeholder={tr('cr.ph.requirements')} maxLength={120} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#ff8a3d] mb-2">{tr('cr.body')}</label>
                <textarea name="body" value={form.body} onChange={handleFormChange} placeholder={tr('cr.ph.body')} rows={4} maxLength={2000} className={inputClass} />
              </div>
              <p className="text-xs text-white/40">{tr('cr.required')}</p>
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 text-white font-extrabold py-3 rounded-full hover:-translate-y-0.5 transition-transform disabled:opacity-60"
                style={{ background: 'linear-gradient(95deg,#ff8a3d,#ff2d95)' }}
              >
                {submitting ? (<><Loader2 size={16} className="animate-spin" /> {tr('cr.submitting')}</>) : (<><Send size={16} /> {tr('cr.post')}</>)}
              </button>
            </form>
          </div>
        )}

        {/* Search */}
        <div className="mt-8 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 rounded-full px-4 py-2.5 flex-1 min-w-[220px]" style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)' }}>
            <Search size={15} className="opacity-60 flex-none" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tr('cr.searchPlaceholder')}
              className="bg-transparent border-none outline-none text-[#f4eef8] text-[13px] w-full min-w-0 placeholder:text-white/40"
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1.5">
          {genreTabs.map((g) => {
            const active = selectedGenre === g.id;
            return (
              <button
                key={g.id}
                onClick={() => setSelectedGenre(g.id)}
                className="flex-none px-4 py-2.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors"
                style={{
                  border: `1px solid ${active ? '#ff8a3d' : 'rgba(255,255,255,.14)'}`,
                  background: active ? 'rgba(255,138,61,.13)' : 'rgba(255,255,255,.05)',
                  color: active ? '#fff' : 'rgba(244,238,248,.65)',
                }}
              >
                {tr(g.labelKey)}
              </button>
            );
          })}
        </div>

        <div className="mt-5 text-white/50 text-sm font-mono">
          {loading
            ? tr('cr.loading')
            : lang === 'ja'
              ? `${filtered.length} 件の募集`
              : `${filtered.length} post${filtered.length === 1 ? '' : 's'}`}
        </div>

        {/* Grid */}
        <div className="mt-5">
          {loading ? (
            <div className="text-center py-16 text-white/50">
              <Loader2 size={28} className="mx-auto mb-4 animate-spin" />
              {tr('cr.fetching')}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(308px,1fr))' }}>
              {filtered.map((c) => (
                <CrewCard key={c.id} crew={c} onGenreClick={setSelectedGenre} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Shield size={40} className="mx-auto mb-4 text-white/30" />
              <p className="text-white/50 mb-4">{crews.length === 0 ? tr('cr.emptyNone') : tr('cr.noMatch')}</p>
              <button
                onClick={() => {
                  if (crews.length === 0) setShowForm(true);
                  else { setSearchQuery(''); setSelectedGenre('all'); }
                }}
                className="text-white font-extrabold px-6 py-3 rounded-full inline-flex items-center gap-1.5"
                style={{ background: 'linear-gradient(95deg,#ff8a3d,#ff2d95)' }}
              >
                {crews.length === 0 ? (<><Plus size={16} strokeWidth={3} /> {tr('cr.postFirst')}</>) : tr('cr.resetFilter')}
              </button>
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
