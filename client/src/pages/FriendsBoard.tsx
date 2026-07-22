import { useEffect, useState } from 'react';
import { Plus, X, Send, Loader2, Search, Users } from 'lucide-react';
import Header from '@/components/Header';
import RecruitTabs from '@/components/RecruitTabs';
import FriendCard from '@/components/FriendCard';
import { toast } from 'sonner';
import { listPublishedFriends, createFriend, FRIEND_PLAY_STYLES, FRIEND_PLATFORMS, type Friend } from '@/lib/friends';
import { boardErrorMessage } from '@/lib/board';
import { useT, useLang } from '@/lib/i18n';
import { useSeo } from '@/hooks/useSeo';

const emptyForm = {
  title: '',
  play_style: 'casual',
  platform: '',
  voice_chat: '',
  active_time: '',
  age_range: '',
  body: '',
  contact: '',
};

const inputClass =
  'w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-[#f4eef8] placeholder:text-white/35 focus:outline-none focus:border-[#22d3ee]/60 transition-colors';

export default function FriendsBoard() {
  const tr = useT();
  const lang = useLang();
  useSeo(tr('seo.friends.title'), tr('seo.friends.desc'), { url: '/board/friends' });

  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [hp, setHp] = useState('');

  const load = async () => {
    setLoading(true);
    const { data, error } = await listPublishedFriends();
    if (error) {
      console.error('フレンド募集の取得に失敗:', error);
      toast.error(tr('fr.toast.loadFail'));
      setFriends([]);
    } else {
      setFriends((data as Friend[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = friends.filter((f) => {
    const matchesStyle = selectedStyle === 'all' || f.play_style === selectedStyle;
    const matchesPlatform = selectedPlatform === 'all' || f.platform === selectedPlatform;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      f.title.toLowerCase().includes(q) ||
      f.body.toLowerCase().includes(q);
    return matchesStyle && matchesPlatform && matchesSearch;
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
    if (!form.title.trim() || !form.body.trim()) {
      toast.error(tr('fr.toast.titleBodyReq'));
      return;
    }
    if (!form.platform) {
      toast.error(tr('fr.toast.platformReq'));
      return;
    }
    setSubmitting(true);
    const { error } = await createFriend({
      title: form.title.trim(),
      platform: form.platform.trim() || null,
      play_style: form.play_style || null,
      voice_chat: form.voice_chat.trim() || null,
      active_time: form.active_time.trim() || null,
      age_range: form.age_range.trim() || null,
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
    toast.success(tr('fr.toast.posted'));
    setForm(emptyForm);
    setShowForm(false);
    load();
  };

  const styleTabs = [{ id: 'all', labelKey: 'fr.style.all' }, ...FRIEND_PLAY_STYLES];
  const platformTabs = [{ id: 'all', labelKey: 'fr.pf.all' }, ...FRIEND_PLATFORMS];

  return (
    <div className="vice-page vice-noise">
      <Header />

      <main className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[100px] pb-16 relative z-10">
        {/* 募集掲示板グループの共通タブ帯 */}
        <RecruitTabs active="friends" />

        {/* Hero */}
        <div className="flex items-end justify-between gap-5 flex-wrap mb-2">
          <div>
            <span className="text-xs font-extrabold tracking-[0.2em] text-[#22d3ee] uppercase">Find Friends</span>
            <h1 className="font-black text-3xl md:text-[46px] leading-tight mt-2 flex items-center gap-3">
              <Users className="text-[#22d3ee]" size={38} /> {tr('fr.heading')}
            </h1>
            <p className="text-white/60 text-sm mt-2.5 leading-relaxed max-w-[560px]">{tr('fr.lead')}</p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex-none text-sm font-extrabold px-[22px] py-3 rounded-full inline-flex items-center gap-1.5 hover:-translate-y-px transition-transform"
            style={{
              background: showForm ? 'rgba(255,255,255,.1)' : 'linear-gradient(95deg,#22d3ee,#a78bfa)',
              boxShadow: showForm ? 'none' : '0 4px 20px rgba(34,211,238,.35)',
              color: '#0b0714',
            }}
          >
            {showForm ? (<><X size={16} /> {tr('fr.close')}</>) : (<><Plus size={16} strokeWidth={3} /> {tr('fr.post')}</>)}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="mt-6 rounded-2xl border border-[#22d3ee]/25 bg-[#22d3ee]/[0.04] p-6">
            <h2 className="text-xl font-black text-white mb-1">{tr('fr.formTitle')}</h2>
            <p className="text-[13px] text-white/60 mb-5">{tr('fr.formNote')}</p>
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
              <div>
                <label className="block text-sm font-bold text-[#22d3ee] mb-2">{tr('fr.title')}</label>
                <input name="title" value={form.title} onChange={handleFormChange} placeholder={tr('fr.ph.title')} maxLength={80} className={inputClass} />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#22d3ee] mb-2">{tr('fr.platform')} <span className="text-[#f472b6]">*</span></label>
                  <select name="platform" value={form.platform} onChange={handleFormChange} className={`${inputClass} h-[46px]`}>
                    <option value="" className="bg-[#15091c]">{tr('fr.pf.select')}</option>
                    {FRIEND_PLATFORMS.map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#15091c]">{tr(p.labelKey)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#22d3ee] mb-2">{tr('fr.playStyle')}</label>
                  <select name="play_style" value={form.play_style} onChange={handleFormChange} className={`${inputClass} h-[46px]`}>
                    {FRIEND_PLAY_STYLES.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[#15091c]">{tr(s.labelKey)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#22d3ee] mb-2">{tr('fr.voiceChat')}</label>
                  <input name="voice_chat" value={form.voice_chat} onChange={handleFormChange} placeholder={tr('fr.ph.voiceChat')} maxLength={30} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#22d3ee] mb-2">{tr('fr.activeTime')}</label>
                  <input name="active_time" value={form.active_time} onChange={handleFormChange} placeholder={tr('fr.ph.activeTime')} maxLength={40} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#22d3ee] mb-2">{tr('fr.ageRange')}</label>
                  <input name="age_range" value={form.age_range} onChange={handleFormChange} placeholder={tr('fr.ph.ageRange')} maxLength={30} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#22d3ee] mb-2">{tr('fr.contact')}</label>
                  <input name="contact" value={form.contact} onChange={handleFormChange} placeholder={tr('fr.ph.contact')} maxLength={120} className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#22d3ee] mb-2">{tr('fr.body')}</label>
                <textarea name="body" value={form.body} onChange={handleFormChange} placeholder={tr('fr.ph.body')} rows={4} maxLength={2000} className={inputClass} />
              </div>
              <p className="text-xs text-white/40">{tr('fr.required')}</p>
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 font-extrabold py-3 rounded-full hover:-translate-y-0.5 transition-transform disabled:opacity-60"
                style={{ background: 'linear-gradient(95deg,#22d3ee,#a78bfa)', color: '#0b0714' }}
              >
                {submitting ? (<><Loader2 size={16} className="animate-spin" /> {tr('fr.submitting')}</>) : (<><Send size={16} /> {tr('fr.post')}</>)}
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
              placeholder={tr('fr.searchPlaceholder')}
              className="bg-transparent border-none outline-none text-[#f4eef8] text-[13px] w-full min-w-0 placeholder:text-white/40"
            />
          </div>
        </div>

        {/* Filter: プラットフォーム（クロスプレイ非対応のため最重要の絞り込み軸） */}
        <div className="mt-5">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#a78bfa] mb-2">{tr('fr.filterByPlatform')}</div>
          <div className="flex gap-2 overflow-x-auto pb-1.5">
            {platformTabs.map((p) => {
              const active = selectedPlatform === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlatform(p.id)}
                  className="flex-none px-4 py-2.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors"
                  style={{
                    border: `1px solid ${active ? '#a78bfa' : 'rgba(255,255,255,.14)'}`,
                    background: active ? 'rgba(167,139,250,.16)' : 'rgba(255,255,255,.05)',
                    color: active ? '#fff' : 'rgba(244,238,248,.65)',
                  }}
                >
                  {tr(p.labelKey)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter: 目的・プレイ内容 */}
        <div className="mt-4">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#22d3ee] mb-2">{tr('fr.filterByStyle')}</div>
          <div className="flex gap-2 overflow-x-auto pb-1.5">
            {styleTabs.map((s) => {
              const active = selectedStyle === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedStyle(s.id)}
                  className="flex-none px-4 py-2.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors"
                  style={{
                    border: `1px solid ${active ? '#22d3ee' : 'rgba(255,255,255,.14)'}`,
                    background: active ? 'rgba(34,211,238,.13)' : 'rgba(255,255,255,.05)',
                    color: active ? '#fff' : 'rgba(244,238,248,.65)',
                  }}
                >
                  {tr(s.labelKey)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 text-white/50 text-sm font-mono">
          {loading
            ? tr('fr.loading')
            : lang === 'ja'
              ? `${filtered.length} 件の募集`
              : `${filtered.length} post${filtered.length === 1 ? '' : 's'}`}
        </div>

        {/* Grid */}
        <div className="mt-5">
          {loading ? (
            <div className="text-center py-16 text-white/50">
              <Loader2 size={28} className="mx-auto mb-4 animate-spin" />
              {tr('fr.fetching')}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(308px,1fr))' }}>
              {filtered.map((f) => (
                <FriendCard key={f.id} friend={f} onStyleClick={setSelectedStyle} onPlatformClick={setSelectedPlatform} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Users size={40} className="mx-auto mb-4 text-white/30" />
              <p className="text-white/50 mb-4">{friends.length === 0 ? tr('fr.emptyNone') : tr('fr.noMatch')}</p>
              <button
                onClick={() => {
                  if (friends.length === 0) setShowForm(true);
                  else { setSearchQuery(''); setSelectedStyle('all'); setSelectedPlatform('all'); }
                }}
                className="font-extrabold px-6 py-3 rounded-full inline-flex items-center gap-1.5"
                style={{ background: 'linear-gradient(95deg,#22d3ee,#a78bfa)', color: '#0b0714' }}
              >
                {friends.length === 0 ? (<><Plus size={16} strokeWidth={3} /> {tr('fr.postFirst')}</>) : tr('fr.resetFilter')}
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
