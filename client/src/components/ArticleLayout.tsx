import { useState, type ReactNode } from 'react';
import { Calendar, Tag, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import Header from '@/components/Header';
import { Streamdown, defaultRehypePlugins } from 'streamdown';
import { useSeo } from '@/hooks/useSeo';
import { useT, useLang } from '@/lib/i18n';

// NewsDetail と同じく、自サイトのオリジンを渡して相対パス画像/リンクを許可する。
const articleRehypePlugins = Object.entries(defaultRehypePlugins).map(([key, plugin]) => {
  if (key === 'harden' && Array.isArray(plugin)) {
    return [
      plugin[0],
      {
        allowedImagePrefixes: ['*'],
        allowedLinkPrefixes: ['*'],
        allowDataImages: true,
        defaultOrigin: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    ];
  }
  return plugin;
}) as never;

// 本文を「@youtube:動画ID」だけの行で分割し、動画埋め込み部分と Markdown 部分に分ける。
type BodyPart = { type: 'md'; text: string } | { type: 'youtube'; id: string };
const YOUTUBE_LINE = /^@youtube:\s*([A-Za-z0-9_-]{6,})\s*$/;
function splitBodyByYoutube(body: string): BodyPart[] {
  const parts: BodyPart[] = [];
  let buf: string[] = [];
  const flush = () => {
    if (buf.length) {
      parts.push({ type: 'md', text: buf.join('\n') });
      buf = [];
    }
  };
  for (const line of body.split('\n')) {
    const m = line.match(YOUTUBE_LINE);
    if (m) {
      flush();
      parts.push({ type: 'youtube', id: m[1] });
    } else {
      buf.push(line);
    }
  }
  flush();
  return parts;
}

interface Props {
  seoTitle: string;
  seoDesc: string;
  title: string;
  icon: string;
  body: string;
  badge?: string;
  date?: string;
  source?: string;
  aiSummary?: string[]; // 記事トップの「AIによる3行まとめ」（開閉）
  // 英語版（EN表示時に使う。無ければ日本語にフォールバック）
  titleEn?: string;
  bodyEn?: string;
  aiSummaryEn?: string[];
  seoTitleEn?: string;
  seoDescEn?: string;
  children?: ReactNode; // 本文下の関連リンク等
}

/** ニュース記事風の共通レイアウト（FiveM/GTARP の解説ページ用）。 */
export default function ArticleLayout({
  seoTitle,
  seoDesc,
  title,
  icon,
  body,
  badge = 'FiveM / GTARP',
  date = '2026-06-24',
  source,
  aiSummary,
  titleEn,
  bodyEn,
  aiSummaryEn,
  seoTitleEn,
  seoDescEn,
  children,
}: Props) {
  const t = useT();
  const lang = useLang();
  const isEn = lang === 'en';
  // EN表示時は英語版を使い、無ければ日本語にフォールバック。
  const effTitle = isEn && titleEn ? titleEn : title;
  const effBody = isEn && bodyEn ? bodyEn : body;
  const effSummary = isEn && aiSummaryEn ? aiSummaryEn : aiSummary;
  const effSource = source ?? t('article.editorial');
  useSeo(isEn && seoTitleEn ? seoTitleEn : seoTitle, isEn && seoDescEn ? seoDescEn : seoDesc);
  const [summaryOpen, setSummaryOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground pt-16">
      <Header />

      <article className="article-container">
        <div>
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-2xl">{icon}</span>
              <span className="px-3 py-1 rounded text-xs font-mono border border-cyan-500/50 bg-cyan-500/10 text-cyan-300">
                {badge}
              </span>
            </div>

            <h1 className="article-title font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-cyan-400 to-lime-400 font-mono">
              {effTitle}
            </h1>

            <div className="article-meta text-gray-400 font-mono text-sm">
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                {date}
              </div>
              <div className="flex items-center gap-2">
                <Tag size={14} />
                {effSource}
              </div>
            </div>
          </div>

          {/* トップのボタン：押すと記事末尾の「3行まとめ」までスクロール */}
          {effSummary && effSummary.length > 0 && (
            <div className="mb-8">
              <button
                onClick={() =>
                  document.getElementById('ai-summary')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-white text-black border border-black/10 hover:bg-white/90 transition-colors"
              >
                <Sparkles size={16} /> {t('sum.button')}
                <ChevronDown size={16} />
              </button>
            </div>
          )}

          {/* Body：本文中に「@youtube:動画ID」だけの行があれば、その位置に動画を埋め込む。
              それ以外は通常どおり Markdown として表示する（マーカーが無ければ従来と同じ）。 */}
          <div className="article-body mb-8">
            {splitBodyByYoutube(effBody).map((part, i) =>
              part.type === 'youtube' ? (
                <div key={i} className="article-video my-8">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${part.id}`}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              ) : (
                <Streamdown key={i} parseIncompleteMarkdown={false} rehypePlugins={articleRehypePlugins}>
                  {part.text}
                </Streamdown>
              ),
            )}
          </div>

          {/* 記事末尾の「AIによる3行まとめ」：押すと3行が開く（トップのボタンからここへスクロール） */}
          {effSummary && effSummary.length > 0 && (
            <div id="ai-summary" className="mb-10 scroll-mt-24">
              <button
                onClick={() => setSummaryOpen((o) => !o)}
                aria-expanded={summaryOpen}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-white text-black border border-black/10 hover:bg-white/90 transition-colors"
              >
                {summaryOpen ? t('sum.close') : t('sum.open')}
                {summaryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {summaryOpen && (
                <div className="mt-3 rounded-2xl border border-[#22d3ee]/30 bg-[#22d3ee]/[0.06] p-5">
                  <ul className="m-0 list-none p-0 space-y-2.5">
                    {effSummary.map((line, i) => (
                      <li key={i} className="flex gap-2.5 text-[14px] text-white/85 leading-relaxed">
                        <span className="text-[#22d3ee] font-bold flex-none">{i + 1}.</span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-white/35 mt-3 mb-0">{t('sum.note')}</p>
                </div>
              )}
            </div>
          )}

          <div className="border-t border-cyan-500/30 my-10" />

          {children}
        </div>
      </article>

      <footer className="border-t border-cyan-500/30 py-8 px-4 text-center text-gray-500 font-mono text-sm">
        <p>&copy; 2026 GTA6 FEED. All rights reserved.</p>
      </footer>
    </div>
  );
}
