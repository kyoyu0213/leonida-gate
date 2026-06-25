import { useState, type ReactNode } from 'react';
import { Calendar, Tag, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import Header from '@/components/Header';
import { Streamdown, defaultRehypePlugins } from 'streamdown';
import { useSeo } from '@/hooks/useSeo';

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
  source = 'GTA6 FEED 編集部',
  aiSummary,
  children,
}: Props) {
  useSeo(seoTitle, seoDesc);
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
              {title}
            </h1>

            <div className="article-meta text-gray-400 font-mono text-sm">
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                {date}
              </div>
              <div className="flex items-center gap-2">
                <Tag size={14} />
                {source}
              </div>
            </div>
          </div>

          {/* トップのボタン：押すと記事末尾の「3行まとめ」までスクロール */}
          {aiSummary && aiSummary.length > 0 && (
            <div className="mb-8">
              <button
                onClick={() =>
                  document.getElementById('ai-summary')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold text-white transition-transform hover:-translate-y-px"
                style={{ background: 'linear-gradient(95deg,#7c3aed,#22d3ee)', boxShadow: '0 4px 18px rgba(34,211,238,.3)' }}
              >
                <Sparkles size={16} /> AIによる3行まとめ
                <ChevronDown size={16} />
              </button>
            </div>
          )}

          {/* Body */}
          <div className="article-body mb-8">
            <Streamdown parseIncompleteMarkdown={false} rehypePlugins={articleRehypePlugins}>
              {body}
            </Streamdown>
          </div>

          {/* 記事末尾の「AIによる3行まとめ」：押すと3行が開く（トップのボタンからここへスクロール） */}
          {aiSummary && aiSummary.length > 0 && (
            <div id="ai-summary" className="mb-10 scroll-mt-24">
              <button
                onClick={() => setSummaryOpen((o) => !o)}
                aria-expanded={summaryOpen}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold text-white transition-transform hover:-translate-y-px"
                style={{ background: 'linear-gradient(95deg,#7c3aed,#22d3ee)', boxShadow: '0 4px 18px rgba(34,211,238,.3)' }}
              >
                <Sparkles size={16} /> AIによる3行まとめ
                {summaryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {summaryOpen && (
                <div className="mt-3 rounded-2xl border border-[#22d3ee]/30 bg-[#22d3ee]/[0.06] p-5">
                  <ul className="m-0 list-none p-0 space-y-2.5">
                    {aiSummary.map((line, i) => (
                      <li key={i} className="flex gap-2.5 text-[14px] text-white/85 leading-relaxed">
                        <span className="text-[#22d3ee] font-bold flex-none">{i + 1}.</span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-white/35 mt-3 mb-0">※ 記事の要点を3行でまとめたものです。詳しくは本文をご確認ください。</p>
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
