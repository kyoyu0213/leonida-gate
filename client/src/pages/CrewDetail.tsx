import { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { ArrowLeft, Loader2, Copy, ExternalLink, Shield } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import ThreadReplies from '@/components/ThreadReplies';
import { getCrew, CREW_GENRES, crewPlatformLabelKey, type Crew } from '@/lib/crews';
import { useT, useLang } from '@/lib/i18n';
import { useSeo } from '@/hooks/useSeo';

const isUrl = (s: string) => /^https?:\/\//i.test(s.trim());

export default function CrewDetail() {
  const tr = useT();
  const lang = useLang();
  const [, paramsJa] = useRoute('/board/crews/:id');
  const [, paramsEn] = useRoute('/en/board/crews/:id');
  const id = paramsJa?.id ?? paramsEn?.id;

  const [crew, setCrew] = useState<Crew | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useSeo(
    crew?.title ? `${crew.title}｜${tr('cr.heading')}｜GTA6 FEED` : tr('cr.heading'),
    crew?.body?.slice(0, 120) || tr('seo.crews.desc'),
    { url: id ? `/board/crews/${id}` : undefined },
  );

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getCrew(id).then(({ data, error }) => {
      if (error || !data) setNotFound(true);
      else {
        setCrew(data as Crew);
        setNotFound(false);
      }
      setLoading(false);
    });
  }, [id]);

  const genreLabel = crew ? CREW_GENRES.find((g) => g.id === crew.genre) : undefined;
  const platformLabelKey = crew ? crewPlatformLabelKey(crew.platform) : null;
  const platformText = crew ? (platformLabelKey ? tr(platformLabelKey) : crew.platform) : null;

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(tr('cr.card.copied'));
  };

  const meta: Array<[string, string | null | undefined]> = crew
    ? [
        [tr('cr.size'), crew.size],
        [tr('cr.requirements'), crew.requirements],
        [tr('cr.activeTime'), crew.active_time],
      ]
    : [];

  return (
    <div className="vice-page vice-noise">
      <Header />
      <main className="max-w-[860px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[100px] pb-32 relative z-10">
        {loading ? (
          <div className="text-center py-16 text-white/50">
            <Loader2 size={28} className="mx-auto mb-4 animate-spin" /> {tr('cr.loading')}
          </div>
        ) : notFound || !crew ? (
          <div className="text-center py-16">
            <p className="text-white/60 mb-4">{tr('cr.notFound')}</p>
            <a href="/board/crews" className="text-[#ff8a3d] hover:text-white font-bold">
              {tr('cr.backToList')}
            </a>
          </div>
        ) : (
          <>
            <a
              href="/board/crews"
              className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-[13px] font-bold mb-5 transition-colors"
            >
              <ArrowLeft size={15} /> {tr('cr.backToList')}
            </a>

            {/* card header */}
            <div className="rounded-2xl border border-[#ff8a3d]/25 bg-gradient-to-br from-[#ff8a3d]/[0.06] to-[#ff2d95]/[0.06] p-6 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <span
                  className="w-12 h-12 rounded-xl flex-none flex items-center justify-center text-white"
                  style={{ background: 'linear-gradient(135deg,#ff8a3d,#ff2d95)' }}
                >
                  <Shield size={22} />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    {platformText && (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold text-[#c4b5fd] border border-[#a78bfa]/50 bg-[#a78bfa]/10">
                        {platformText}
                      </span>
                    )}
                    {genreLabel && (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold text-[#ff8a3d] border border-[#ff8a3d]/50 bg-[#ff8a3d]/10">
                        {tr(genreLabel.labelKey)}
                      </span>
                    )}
                    <span className="text-[13px] font-bold text-white/60 break-words">{crew.crew_name}</span>
                  </div>
                  <h1 className="font-black text-2xl md:text-[30px] leading-snug m-0 break-words">
                    {crew.title}
                  </h1>
                  <p className="text-[12px] text-white/40 mt-1 font-mono">{crew.created_at.slice(0, 10)}</p>
                </div>
              </div>

              <p className="text-white/85 text-[15px] leading-[1.8] whitespace-pre-wrap break-words mb-4">
                {crew.body}
              </p>

              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[13px] mb-4">
                {meta
                  .filter(([, v]) => v)
                  .map(([label, v]) => (
                    <div key={label} className="flex items-center justify-between gap-2 border-b border-white/[0.06] py-1">
                      <span className="text-white/45 flex-none">{label}</span>
                      <span className="text-white/85 text-right break-words">{v}</span>
                    </div>
                  ))}
              </div>

              {crew.contact &&
                (isUrl(crew.contact) ? (
                  <button
                    onClick={() => window.open(crew.contact!, '_blank', 'noopener')}
                    className="inline-flex items-center gap-1.5 bg-[#5865F2] hover:brightness-110 text-white font-bold text-[13px] px-4 h-9 rounded-lg transition"
                  >
                    <ExternalLink size={14} /> {tr('cr.card.contact')}
                  </button>
                ) : (
                  <button
                    onClick={() => copy(crew.contact!)}
                    className="inline-flex items-center gap-1.5 bg-white/[0.06] border border-white/15 hover:bg-white/10 text-[#f4eef8] font-bold text-[13px] px-4 h-9 rounded-lg transition"
                    title={crew.contact}
                  >
                    <Copy size={14} /> {tr('cr.card.contact')}: {crew.contact}
                  </button>
                ))}
            </div>

            {/* replies (post #1 は本文の複製なので #2 以降を表示) */}
            <h2 className="text-sm font-extrabold text-white/70 mb-1 px-1">
              {lang === 'en' ? 'Replies' : '返信'}
            </h2>
            {crew.thread_id ? (
              <ThreadReplies threadId={crew.thread_id} startNumber={2} />
            ) : (
              <p className="text-white/40 text-sm py-8 text-center">{tr('rep.empty')}</p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
