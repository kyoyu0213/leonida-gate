import { useState } from 'react';
import { useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Calendar, Tag, Share2, ExternalLink, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import Header from '@/components/Header';
import NewsComments from '@/components/NewsComments';
import { Streamdown, defaultRehypePlugins } from 'streamdown';
import { getArticleById, CATEGORY_CONFIG, formatArticleDate } from '@/data/news';
import { useLang } from '@/lib/i18n';

// Streamdown 同梱の rehype-harden は、自サイトのオリジン(defaultOrigin)が無いと
// 相対パス画像（/images/...）を解決できずブロックしてしまう。
// 自サイトのオリジンを渡して、相対パスの記事画像を表示できるようにする。
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

export default function NewsDetail() {
  const [match, params] = useRoute('/news/:id');
  const [summaryOpen, setSummaryOpen] = useState(false);
  const lang = useLang();

  if (!match) {
    return null;
  }

  // 記事データは client/src/data/news.ts で一元管理しています
  const article = getArticleById(params.id);

  if (!article) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="container py-20 text-center">
          <p className="text-gray-400 font-mono mb-4">記事が見つかりません</p>
          <a href="/" className="text-cyan-400 hover:text-cyan-300 font-mono">
            ホームに戻る
          </a>
        </div>
      </div>
    );
  }

  const categoryLabel = CATEGORY_CONFIG[article.category].label;
  // EN表示時は英語フィールドを使い、無ければ日本語にフォールバック。
  const isEn = lang === 'en';
  const title = isEn && article.titleEn ? article.titleEn : article.title;
  const body = isEn && article.fullContentEn ? article.fullContentEn : article.fullContent;
  const summary = isEn && article.aiSummaryEn ? article.aiSummaryEn : article.aiSummary;

  const relatedArticles = article.relatedArticles
    .map((id) => getArticleById(id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  const categoryColors: Record<string, string> = {
    release: 'border-orange-500/50 bg-orange-500/10 text-orange-300',
    update: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300',
    speculation: 'border-pink-500/50 bg-pink-500/10 text-pink-300',
    event: 'border-purple-500/50 bg-purple-500/10 text-purple-300'
  };

  return (
    <div className="min-h-screen bg-background text-foreground pt-16">
      <Header />

      {/* Article Content */}
      <article className="article-container">
        <div>
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-2xl">{article.icon}</span>
              <span className={`px-3 py-1 rounded text-xs font-mono border ${categoryColors[article.category]}`}>
                {categoryLabel}
              </span>
            </div>

            <h1 className="article-title font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-cyan-400 to-lime-400 font-mono">
              {title}
            </h1>

            <div className="article-meta text-gray-400 font-mono text-sm">
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                {formatArticleDate(article)}
              </div>
              <div className="flex items-center gap-2">
                <Tag size={14} />
                {article.source}
              </div>
            </div>
          </div>

          {/* AIによる3行まとめ（あらかじめ用意した要約をクリックで開閉） */}
          {/* トップのボタン：押すと記事末尾の「3行まとめ」までスクロール */}
          {summary && summary.length > 0 && (
            <div className="mb-8">
              <button
                onClick={() =>
                  document.getElementById('ai-summary')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-white text-black border border-black/10 hover:bg-white/90 transition-colors"
              >
                <Sparkles size={16} /> AIによる3行まとめ
                <ChevronDown size={16} />
              </button>
            </div>
          )}

          {/* アイキャッチ画像（記事に image がある場合のみ。記事冒頭に表示） */}
          {article.image && (
            <div className="mb-10 rounded-2xl overflow-hidden border border-cyan-500/30 shadow-lg shadow-cyan-500/10">
              <img
                src={article.image}
                alt={article.title}
                loading="lazy"
                className="w-full h-auto block"
              />
            </div>
          )}

          {/* 動画プレーヤー（記事に youtubeId がある場合のみ。記事内で再生可能） */}
          {article.youtubeId && (
            <div className="article-video mb-10">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${article.youtubeId}`}
                title={article.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              />
            </div>
          )}

          {/* Full Content (Markdown対応)。
              parseIncompleteMarkdown はストリーミング表示用の「未完成Markdown除去」機能で、
              静的記事では画像などを誤って消すため false にする。 */}
          <div className="article-body mb-8">
            <Streamdown parseIncompleteMarkdown={false} rehypePlugins={articleRehypePlugins}>
              {body}
            </Streamdown>
          </div>

          {/* 記事末尾の「AIによる3行まとめ」：押すと3行が開く（トップのボタンからここへスクロール） */}
          {summary && summary.length > 0 && (
            <div id="ai-summary" className="mb-10 scroll-mt-24">
              <button
                onClick={() => setSummaryOpen((o) => !o)}
                aria-expanded={summaryOpen}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-white text-black border border-black/10 hover:bg-white/90 transition-colors"
              >
                {summaryOpen ? '3行まとめを閉じる' : '3行まとめを開く'}
                {summaryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {summaryOpen && (
                <div className="mt-3 rounded-2xl border border-[#22d3ee]/30 bg-[#22d3ee]/[0.06] p-5">
                  <ul className="m-0 list-none p-0 space-y-2.5">
                    {summary.map((line, i) => (
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

          {/* Divider */}
          <div className="border-t border-cyan-500/30 my-10"></div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-12">
            <Button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('リンクをコピーしました');
              }}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-sm h-10 rounded transition-all duration-300"
            >
              <Share2 size={14} className="mr-2" />
              シェア
            </Button>
            <button
              onClick={() => {
                const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  `${title} | GTA6 FEED`
                )}&url=${encodeURIComponent(window.location.href)}`;
                window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500');
              }}
              className="inline-flex items-center gap-2 px-4 h-10 bg-black hover:bg-zinc-800 text-white font-mono text-sm rounded transition-all duration-300 border border-white/20"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Xでシェア
            </button>
            {article.sourceUrl !== '#' && (
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white font-mono text-sm rounded transition-all duration-300"
              >
                <ExternalLink size={14} />
                出典を見る
              </a>
            )}
          </div>

          {/* Related Articles */}
          <div className="bg-gradient-to-br from-cyan-500/5 to-pink-500/5 border border-cyan-500/30 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-cyan-300 font-mono">関連記事</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedArticles.map((related) => (
                <a
                  key={related.id}
                  href={`/news/${related.id}`}
                  className="group border border-cyan-500/30 rounded-lg p-4 bg-background/50 hover:border-cyan-500/60 hover:bg-cyan-500/10 transition-all duration-300"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-lg">{related.icon}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-mono border ${categoryColors[related.category]}`}>
                      {CATEGORY_CONFIG[related.category].label}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm mb-2 text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
                    {related.title}
                  </h3>
                  <p className="text-xs text-gray-400">{related.date}</p>
                </a>
              ))}
            </div>
          </div>

          {/* コメント */}
          <NewsComments articleId={String(article.id)} />
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t border-cyan-500/30 py-8 px-4 text-center text-gray-500 font-mono text-sm">
        <p>&copy; 2026 GTA6 FEED. All rights reserved.</p>
      </footer>
    </div>
  );
}
