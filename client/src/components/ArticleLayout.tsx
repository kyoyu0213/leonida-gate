import type { ReactNode } from 'react';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
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
  backHref?: string;
  backLabel?: string;
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
  backHref = '/fivem-gtarp',
  backLabel = 'FiveM / GTARP 一覧へ',
  children,
}: Props) {
  useSeo(seoTitle, seoDesc);

  return (
    <div className="min-h-screen bg-background text-foreground pt-16">
      <Header />

      {/* Back Button */}
      <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-md border-b border-cyan-500/30">
        <div className="container py-4">
          <a
            href={backHref}
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
          >
            <ArrowLeft size={16} />
            {backLabel}
          </a>
        </div>
      </div>

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

          {/* Body */}
          <div className="article-body mb-8">
            <Streamdown parseIncompleteMarkdown={false} rehypePlugins={articleRehypePlugins}>
              {body}
            </Streamdown>
          </div>

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
