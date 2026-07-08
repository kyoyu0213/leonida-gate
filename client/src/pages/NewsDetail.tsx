import { useEffect, useRef, useState } from 'react';
import { useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Calendar, Share2, ExternalLink, Sparkles, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import Header from '@/components/Header';
import NewsComments from '@/components/NewsComments';
import { Streamdown, defaultRehypePlugins } from 'streamdown';
import { getArticleById, formatArticleDate } from '@/data/news';
import { useArticleById } from '@/hooks/useNews';
import { useLang, useT } from '@/lib/i18n';
import { useSeo } from '@/hooks/useSeo';

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

// 記事本文のメディアレンダラ。動画ファイル（.mp4 等）は <video> プレーヤー、
// X(旧Twitter)の投稿URLは公式ウィジェットの引用埋め込みとして描画し、
// それ以外の画像は Streamdown 標準と同じ image-wrapper 構造を再現して既存記事の見た目を保つ。
// これにより本文中の `![キャプション](/path/foo.mp4)` で動画、
// `![](https://x.com/user/status/123)` でX投稿を、好きな位置に埋め込める。
const VIDEO_EXT_RE = /\.(mp4|webm|ogg|ogv|mov)(\?.*)?$/i;
const TWEET_URL_RE = /^https?:\/\/(?:www\.)?(?:x|twitter|mobile\.twitter)\.com\/[^/]+\/status\/(\d+)/i;

// X(旧Twitter)投稿を公式 widgets.js で埋め込む。スクリプト読込前後どちらでも描画されるよう、
// 既存スクリプトがあれば load() を呼び、無ければ動的に読み込む。読込失敗時は blockquote 内の
// リンク（投稿への導線）がそのまま残るため、最低限のフォールバックになる。
function TweetEmbed({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const w = window as unknown as { twttr?: { widgets?: { load?: (el?: HTMLElement | null) => void } } };
    // 引数なしの load() はページ全体の未変換 .twitter-tweet を走査するため、
    // 万一 blockquote がラッパー外に移動しても確実に描画される。
    const render = () => w.twttr?.widgets?.load?.();
    if (w.twttr?.widgets) {
      render();
      return;
    }
    const existing = document.getElementById('twitter-wjs') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', render, { once: true });
      return;
    }
    const s = document.createElement('script');
    s.id = 'twitter-wjs';
    s.src = 'https://platform.twitter.com/widgets.js';
    s.async = true;
    s.addEventListener('load', render, { once: true });
    document.body.appendChild(s);
  }, [url]);

  return (
    <span className="article-tweet" ref={ref as never}>
      <blockquote className="twitter-tweet" data-dnt="true" data-theme="dark">
        <a href={url}>{url}</a>
      </blockquote>
    </span>
  );
}

function ArticleMedia({ src, alt }: { src?: string; alt?: string }) {
  if (!src) return null;
  if (TWEET_URL_RE.test(src)) {
    return <TweetEmbed url={src} />;
  }
  if (VIDEO_EXT_RE.test(src)) {
    return (
      <span data-streamdown="video-wrapper" className="article-inline-video">
        <video src={src} controls playsInline preload="metadata" aria-label={alt || undefined} />
      </span>
    );
  }
  return (
    <span className="group relative my-4 inline-block" data-streamdown="image-wrapper">
      <img alt={alt} className="max-w-full rounded-lg" data-streamdown="image" src={src} loading="lazy" />
    </span>
  );
}

const articleComponents = { img: ArticleMedia } as never;

export default function NewsDetail() {
  // 日本語 /news/:id と英語 /en/news/:id の両方にマッチさせる（言語は useLang が URL から判定）。
  const [matchJa, paramsJa] = useRoute('/news/:id');
  const [matchEn, paramsEn] = useRoute('/en/news/:id');
  const match = matchJa || matchEn;
  const params = (paramsJa || paramsEn) as { id: string } | undefined;
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [commentCount, setCommentCount] = useState<number | null>(null);
  const lang = useLang();
  const t = useT();
  const isEn = lang === 'en';

  // 記事は静的データ（data/news.ts）＋管理画面から投稿された DB 記事を解決する。
  const { article, loading } = useArticleById(match ? params?.id : undefined);

  // 記事ごとに <title> / description / OGP を設定（フックは早期returnの前で呼ぶ）。
  const seoTitle = article
    ? `${isEn && article.titleEn ? article.titleEn : article.title} | GTA6 FEED`
    : 'GTA6 FEED';
  const seoDesc = article
    ? (isEn && article.descriptionEn ? article.descriptionEn : article.description)?.slice(0, 120)
    : undefined;
  useSeo(seoTitle, seoDesc, {
    image: article?.image,
    type: 'article',
    // canonical/og:url は自言語URL（現在URL）。hreflang は ja/en の対として出す。
    localized: true,
  });

  if (!match) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="container py-20 text-center">
          <p className="text-gray-400 font-mono">{lang === 'ja' ? '読み込み中…' : 'Loading…'}</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="container py-20 text-center">
          <p className="text-gray-400 font-mono mb-4">{lang === 'ja' ? '記事が見つかりません' : 'Article not found'}</p>
          <a href="/" className="text-cyan-400 hover:text-cyan-300 font-mono">
            {lang === 'ja' ? 'ホームに戻る' : 'Back to home'}
          </a>
        </div>
      </div>
    );
  }

  const categoryLabel = t(`cat.${article.category}`);
  // EN表示時は英語フィールドを使い、無ければ日本語にフォールバック。
  const title = isEn && article.titleEn ? article.titleEn : article.title;
  const body = isEn && article.fullContentEn ? article.fullContentEn : article.fullContent;
  const summary = isEn && article.aiSummaryEn ? article.aiSummaryEn : article.aiSummary;
  // ファーストビューで本文冒頭が見えるように、タイトル＋メタの直下に出すリード文
  const lead = isEn && article.descriptionEn ? article.descriptionEn : article.description;
  // 記事ページのh1に出す表示用タイトル（無ければSEO用のtitleをそのまま使う）。
  // displayTitle の改行はそのまま反映される（.article-title は white-space: pre-line）。
  const headingTitle = (isEn ? article.displayTitleEn : article.displayTitle) ?? title;

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
          {/* パンくず（内部リンク・SEO） */}
          <nav className="flex items-center gap-1.5 text-[12px] text-gray-400 font-mono mb-5" aria-label="パンくず">
            <a href="/" className="hover:text-cyan-300 transition-colors">{lang === 'ja' ? 'ホーム' : 'Home'}</a>
            <span className="opacity-50">/</span>
            <a href="/news" className="hover:text-cyan-300 transition-colors">{lang === 'ja' ? '最新情報' : 'News'}</a>
            <span className="opacity-50">/</span>
            <span className="text-gray-500 truncate max-w-[55vw] sm:max-w-[420px]">{title}</span>
          </nav>

          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-2xl">{article.icon}</span>
              <span className={`px-3 py-1 rounded text-xs font-mono border ${categoryColors[article.category]}`}>
                {categoryLabel}
              </span>
            </div>

            <h1 className="article-title font-bold">
              {headingTitle}
            </h1>

            {/* 日付＋トップのボタン群（コメント欄へ移動／末尾の3行まとめへスクロール）を同じ行に並べる */}
            <div className="article-meta text-gray-400 font-mono text-sm">
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                {formatArticleDate(article, lang)}
              </div>

              {/* この記事へのコメント：押すとコメント欄までスクロール */}
              <button
                onClick={() =>
                  document.getElementById('news-comments')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border border-cyan-500/50 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20 transition-colors whitespace-nowrap"
              >
                <MessageSquare size={16} />
                {isEn
                  ? `Comments on this article${commentCount !== null ? ` (${commentCount})` : ''}`
                  : `この記事へのコメント${commentCount !== null ? `（${commentCount}件）` : ''}`}
                <ChevronDown size={16} />
              </button>

              {/* AIによる3行まとめ：押すと記事末尾の「3行まとめ」までスクロール */}
              {summary && summary.length > 0 && (
                <button
                  onClick={() =>
                    document.getElementById('ai-summary')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-white text-black border border-black/10 hover:bg-white/90 transition-colors whitespace-nowrap"
                >
                  <Sparkles size={16} /> {t('sum.button')}
                  <ChevronDown size={16} />
                </button>
              )}
            </div>

            {/* リード文：開いてすぐ本文冒頭が読めるように、メタ情報の下に2〜3行だけ出す */}
            {lead && <p className="article-lead">{lead}</p>}
          </div>

          {/* アイキャッチ画像（記事に image がある場合のみ。記事冒頭に表示） */}
          {article.image && (
            <div className="article-hero rounded-2xl overflow-hidden border border-cyan-500/30 shadow-lg shadow-cyan-500/10">
              <img
                src={article.image}
                alt={article.title}
                loading="lazy"
                className="w-full block"
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
            <Streamdown parseIncompleteMarkdown={false} rehypePlugins={articleRehypePlugins} components={articleComponents}>
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
                {summaryOpen ? t('sum.close') : t('sum.open')}
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
                  <p className="text-[11px] text-white/35 mt-3 mb-0">{t('sum.note')}</p>
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
                alert(t('nd.copied'));
              }}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-sm h-10 rounded transition-all duration-300"
            >
              <Share2 size={14} className="mr-2" />
              {t('nd.share')}
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
              {t('nd.shareX')}
            </button>
            {article.sourceUrl !== '#' && (
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white font-mono text-sm rounded transition-all duration-300"
              >
                <ExternalLink size={14} />
                {t('nd.source')}
              </a>
            )}
          </div>

          {/* Related Articles */}
          <div className="bg-gradient-to-br from-cyan-500/5 to-pink-500/5 border border-cyan-500/30 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-cyan-300 font-mono">{t('nd.related')}</h2>
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
                      {t(`cat.${related.category}`)}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm mb-2 text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
                    {isEn && related.titleEn ? related.titleEn : related.title}
                  </h3>
                  <p className="text-xs text-gray-400">{related.date}</p>
                </a>
              ))}
            </div>
          </div>

          {/* コメント */}
          <NewsComments articleId={String(article.id)} onCountChange={setCommentCount} />
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t border-cyan-500/30 py-8 px-4 text-center text-gray-500 font-mono text-sm">
        <p>&copy; 2026 GTA6 FEED. All rights reserved.</p>
      </footer>
    </div>
  );
}
