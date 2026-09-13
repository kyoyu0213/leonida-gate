import { useState, type ReactNode } from 'react';
import { useLocation } from 'wouter';
import { Calendar, Tag, Sparkles, ChevronDown, ChevronUp, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import { Streamdown, defaultRehypePlugins } from 'streamdown';
import { useSeo, SITE_ORIGIN } from '@/hooks/useSeo';
import { useT, useLang, stripLangPrefix, type Lang } from '@/lib/i18n';
import { localizedHref } from '@/components/LocalLink';
import { FooterLinks } from '@/components/SiteFooter';
// 白Wiki風モード（53）：地とヘッダー／フッターの暗色裏打ちは Wiki と共用の .wiki-shell（gtaWiki.css）、
// 記事部分の上書きは .rp-wiki 配下（rpArticle.css）。
import '@/pages/gtaWiki.css';
import './rpArticle.css';

// NewsDetail と同じく、自サイトのオリジンを渡して相対パス画像/リンクを許可する。
// SSR（プリレンダ）では window が無く origin を取れないため、本番オリジンを既定にする。
// これが無いと rehype-harden が本文中の /images/... や内部リンクを解決できずブロックし、
// prerender 生HTMLから <img>・<a> が丸ごと落ちる（CSRハイドレーション後にしか出ない）。
// 体験記・解説記事の画像とaltがクローラーに見えなくなるため、undefined にはしないこと。
const articleRehypePlugins = Object.entries(defaultRehypePlugins).map(([key, plugin]) => {
  if (key === 'harden' && Array.isArray(plugin)) {
    return [
      plugin[0],
      {
        allowedImagePrefixes: ['*'],
        allowedLinkPrefixes: ['*'],
        allowDataImages: true,
        defaultOrigin: typeof window !== 'undefined' ? window.location.origin : SITE_ORIGIN,
      },
    ];
  }
  return plugin;
}) as never;

/**
 * 本文（Markdown）内のサイト内リンクを、表示言語に合わせて解決する。
 *
 * 英語本文（bodyEn）の中に `[FiveM Command Dictionary](/fivem-gtarp/commands)` のように
 * 日本語URLが直書きされており、英語ページから日本語ページへ逆流していた（2026-08-06 の監査）。
 * 本文の文章には手を入れず、描画時にリンク先だけを解決する。
 *
 * localizedHref() が「英語版が実在するパスか」を判定するので、
 * 画像（/images/...）や英語版の無いページ（/servers・/board/...）はそのまま残る。
 */
/** `## 見出し` の行から目次用の文字列を作る（リンク・強調などの Markdown 記号を落とす）。 */
function headingText(line: string): string {
  return line
    .replace(/^##\s+/, '')
    .replace(/\s+#+\s*$/, '') // 閉じ ATX の #
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // [text](url) → text
    .replace(/[*_`]/g, '')
    .trim();
}

function localizeMarkdownLinks(md: string, lang: Lang): string {
  if (lang === 'ja') return md;
  return md.replace(/\]\((\/[^)\s]*)\)/g, (m, path) => `](${localizedHref(path, lang)})`);
}

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
  // /fivem-gtarp/<slug> の解説記事だけ白のWikipedia風（ハブと揃える）。同じレイアウトを使う
  // 体験記（field-notes）とツールは対象外でダークのまま。スタイルは .rp-wiki が付いたときだけ当たる。
  const [loc] = useLocation();
  const p = stripLangPrefix(loc);
  const light =
    p.startsWith('/fivem-gtarp/') &&
    !p.startsWith('/fivem-gtarp/field-notes') &&
    !p.startsWith('/fivem-gtarp/tools');
  // EN表示時は英語版を使い、無ければ日本語にフォールバック。
  const effTitle = isEn && titleEn ? titleEn : title;
  const effBody = localizeMarkdownLinks(isEn && bodyEn ? bodyEn : body, lang);

  // 左目次（56・白Wiki風のときだけ）：本文の `## 見出し`（h2）を出現順に拾う。
  // id は下の h2 描画側の連番（sec-1, sec-2, …）と対応するので、数と順序を必ず揃えること。
  // コードブロック内の `## ` は見出しとして描画されないため、フェンスの中は数えない。
  const toc: { id: string; text: string }[] = [];
  if (light) {
    let inFence = false;
    for (const l of effBody.split('\n')) {
      if (/^\s*(```|~~~)/.test(l)) inFence = !inFence;
      else if (!inFence && /^##\s+/.test(l)) toc.push({ id: `sec-${toc.length + 1}`, text: headingText(l) });
    }
  }

  // 本文（Markdown）の画像に読み込み属性を付ける。
  // これまで components を渡していなかったため属性が一切付かず、体験記・解説記事は
  // 本文画像が全部 eager だった（訪問記は1ページ20枚・37MB を一斉に読み込んでいた）。
  //
  // ただし先頭の1枚は LCP 要素（Lighthouse の LCP element が article-body の
  // 最初の img を指していた）なので lazy にしてはいけない。ここだけ eager のまま
  // fetchPriority="high" を付け、2枚目以降を lazy にする。
  // カウンタはレンダーごとに作り直すので、ページを跨いで持ち越さない。
  const imgIndex = { n: 0 };
  // h2 の連番（目次のアンカー）。@youtube で本文が複数の Streamdown に割れても通し番号になるよう、
  // map の外（レンダーごと）に1つだけ持つ。Streamdown はブロックを content 比較で memo するので、
  // 本文が変わらない再レンダーでは h2 自体が描き直されず、DOM の id はそのまま残る。
  const hIndex = { n: 0 };
  const bodyComponents = {
    // 本文Markdownの `# 見出し` は h2 で描画する（ページの h1 は記事タイトル1つに保つ）。
    // スタイルは data-streamdown="heading-1" の属性セレクタで当たっているため、
    // 属性を保ったままタグだけ変えれば見た目は変わらない。
    h1: ({ children }: { children?: ReactNode }) => (
      <h2 data-streamdown="heading-1">{children}</h2>
    ),
    // `## 見出し` に目次用の id を振る。クラスは Streamdown 既定の h2 と同じ（体験記などダーク側の太さを保つ）。
    h2: ({ children }: { children?: ReactNode }) => (
      <h2 id={`sec-${++hIndex.n}`} className="mt-6 mb-2 font-semibold text-2xl" data-streamdown="heading-2">
        {children}
      </h2>
    ),
    img: ({ src, alt }: { src?: string; alt?: string }) => {
      const isFirst = imgIndex.n++ === 0;
      return (
        <span className="group relative my-4 inline-block" data-streamdown="image-wrapper">
          <img
            src={src}
            alt={alt}
            className="max-w-full rounded-lg"
            data-streamdown="image"
            decoding="async"
            {...(isFirst ? { fetchPriority: 'high' as const } : { loading: 'lazy' as const })}
          />
        </span>
      );
    },
  } as never;
  const effSummary = isEn && aiSummaryEn ? aiSummaryEn : aiSummary;
  const effSource = source ?? t('article.editorial');
  useSeo(isEn && seoTitleEn ? seoTitleEn : seoTitle, isEn && seoDescEn ? seoDescEn : seoDesc, {
    localized: true,
  });
  const [summaryOpen, setSummaryOpen] = useState(false);

  // 白Wiki風で見出しがあるときだけ「左：目次／右：本文」の2カラムにする。ダーク（体験記など）や
  // 見出しの無い記事は従来どおり <article> を直に置く。目次は <a href="#sec-n"> なのでプリレンダHTMLにも残る。
  const withToc = (articleEl: ReactNode) =>
    light && toc.length > 0 ? (
      <div className="rp-wiki-wrap">
        <aside className="rp-toc" aria-label={isEn ? 'Contents' : '目次'}>
          <p className="rp-toc__h">{isEn ? 'Contents' : '目次'}</p>
          <ol>
            {toc.map((it) => (
              <li key={it.id}>
                <a href={`#${it.id}`}>{it.text}</a>
              </li>
            ))}
          </ol>
        </aside>
        {articleEl}
      </div>
    ) : (
      articleEl
    );

  return (
    <div className={light ? 'min-h-screen pt-16 wiki-shell rp-wiki' : 'min-h-screen bg-background text-foreground pt-16'}>
      <Header />

      {withToc(
        <article className="article-container">
          <div>
            {/* Header：カテゴリ／タイトル／メタ情報を1枚の“帯”にまとめる（記事詳細と共通の見た目） */}
            <header className="article-band">
              <div className="flex items-center gap-3 mb-5">
                <span className="text-2xl">{icon}</span>
                <span
                  className={
                    light
                      ? 'px-3 py-1 rounded text-xs font-mono border border-[#c8ccd1] bg-[#eef1f4] text-[#2a55b7]'
                      : 'px-3 py-1 rounded text-xs font-mono border border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
                  }
                >
                  {badge}
                </span>
              </div>

              {/* タイトルの背面にだけ敷く帯（記事詳細ページと共通） */}
              <div className="article-title-band">
                <h1 className="article-title font-bold">
                  {effTitle}
                </h1>
              </div>

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
            </header>

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
                  <Streamdown
                    key={i}
                    parseIncompleteMarkdown={false}
                    rehypePlugins={articleRehypePlugins}
                    components={bodyComponents}
                  >
                    {part.text}
                  </Streamdown>
                ),
              )}
            </div>

            {/* 記事末尾の「AIによる3行まとめ」：押すと3行が開く（トップのボタンからここへスクロール）。
                まとめ本文は常に DOM へ出し、開閉は hidden 属性だけで切り替える。
                {summaryOpen && …} の条件レンダリングにすると、閉じている初期状態＝
                プリレンダ時にまとめが DOM に存在せず、全記事でクローラーに読まれない
                （JS実行後にしか現れない）ため。表示上の挙動は hidden の display:none で同じ。 */}
            {effSummary && effSummary.length > 0 && (
              <div id="ai-summary" className="mb-10 scroll-mt-24">
                <button
                  onClick={() => setSummaryOpen((o) => !o)}
                  aria-expanded={summaryOpen}
                  aria-controls="ai-summary-body"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-white text-black border border-black/10 hover:bg-white/90 transition-colors"
                >
                  {summaryOpen ? t('sum.close') : t('sum.open')}
                  {summaryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <div
                  id="ai-summary-body"
                  hidden={!summaryOpen}
                  className={`mt-3 rounded-2xl border p-5 ${
                    light ? 'border-[#c8ccd1] bg-[#f8f9fa]' : 'border-[#22d3ee]/30 bg-[#22d3ee]/[0.06]'
                  }`}
                >
                  <ul className="m-0 list-none p-0 space-y-2.5">
                    {effSummary.map((line, i) => (
                      <li
                        key={i}
                        className={`flex gap-2.5 text-[14px] leading-relaxed ${light ? 'text-[#1e2022]' : 'text-white/85'}`}
                      >
                        <span className={`font-bold flex-none ${light ? 'text-[#2a55b7]' : 'text-[#22d3ee]'}`}>{i + 1}.</span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                  <p className={`text-[11px] mt-3 mb-0 ${light ? 'text-[#6b7075]' : 'text-white/35'}`}>{t('sum.note')}</p>
                </div>
              </div>
            )}

            <div className={light ? 'border-t border-[#e6e8eb] my-10' : 'border-t border-cyan-500/30 my-10'} />

            {/* シェア：リンクをコピー／Xでシェア（掲示板以外の解説記事に表示） */}
            <div className="flex flex-wrap gap-3 mb-10">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  toast.success(t('nd.copied'));
                }}
                className={`inline-flex items-center gap-2 px-4 h-10 font-mono text-sm rounded transition-colors ${
                  light ? 'bg-[#2a55b7] hover:bg-[#1f4499] text-white' : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                }`}
              >
                <Link2 size={14} />
                {t('nd.copyLink')}
              </button>
              <button
                onClick={() => {
                  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    `${effTitle} | GTA6 FEED`,
                  )}&url=${encodeURIComponent(window.location.href)}`;
                  window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500');
                }}
                className={`inline-flex items-center gap-2 px-4 h-10 font-mono text-sm rounded transition-colors border ${
                  light
                    ? 'bg-white hover:bg-[#f2f4f7] text-[#1e2022] border-[#c8ccd1]'
                    : 'bg-black hover:bg-zinc-800 text-white border-white/20'
                }`}
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                {t('nd.shareX')}
              </button>
            </div>

            {children}
          </div>
        </article>,
      )}

      <footer
        className={`py-8 px-4 text-center font-mono text-sm border-t ${
          light ? 'border-[#e6e8eb] text-[#54595d]' : 'border-cyan-500/30 text-gray-500'
        }`}
      >
        <p className="mb-2">
          <FooterLinks />
        </p>
        <p>&copy; 2026 GTA6 FEED. All rights reserved.</p>
      </footer>
    </div>
  );
}
