import { useEffect } from 'react';

/** 本番ドメイン（OGP/canonical の絶対URL生成に使う）。 */
export const SITE_ORIGIN = 'https://gta6-feed.com';
/** OGP画像が記事側で指定されていないときの既定画像（変換済みWebP）。 */
const DEFAULT_OG_IMAGE = '/images/news/Official_Cover_Art_landscape.webp';

export interface SeoOptions {
  /** OGP画像のパス（'/images/...'）または絶対URL。未指定なら既定画像。 */
  image?: string;
  /** og:type。記事ページは 'article'、それ以外は 'website'。 */
  type?: 'website' | 'article';
  /** canonical / og:url。未指定なら現在のURL。 */
  url?: string;
}

/** パスを絶対URLへ（http(s) で始まるものはそのまま）。 */
function toAbsolute(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return SITE_ORIGIN + (pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`);
}

/** name か property のメタタグを取得（無ければ作成）。戻り値は [element, 新規作成したか]。 */
function ensureMeta(key: string, isProperty: boolean): [HTMLMetaElement, boolean] {
  const attr = isProperty ? 'property' : 'name';
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (el) return [el, false];
  el = document.createElement('meta');
  el.setAttribute(attr, key);
  document.head.appendChild(el);
  return [el, true];
}

/**
 * ページの <title> / description / canonical / OGP / Twitterカード を設定し、
 * 離脱時に元の値へ戻す。
 *
 * このサイトは Vite + React の SPA なので、各ページでこのフックを呼んで
 * 検索・SNS共有用のメタ情報を反映する。
 *
 * 注意：SNS（X / Discord 等）のリンクプレビューはJSを実行せず、サーバーが返す
 * 初期HTMLのOGPだけを見るものが多い。JSで差し込む本フックはGoogle等の
 * JSレンダリング型クローラーには効くが、SNSカードを記事ごとに出すには
 * SSR/プリレンダリング（別途）が必要。サイト共通の既定OGPは index.html 側に置く。
 */
export function useSeo(title: string, description?: string, options?: SeoOptions) {
  const image = options?.image;
  const type = options?.type ?? 'website';
  const url = options?.url;

  useEffect(() => {
    const restore: Array<() => void> = [];

    // <title>
    const prevTitle = document.title;
    document.title = title;
    restore.push(() => {
      document.title = prevTitle;
    });

    const ogImage = toAbsolute(image || DEFAULT_OG_IMAGE);
    const ogUrl = url ? toAbsolute(url) : window.location.href;

    // name / property のメタタグを設定し、復元用クロージャを積む。
    const setMeta = (key: string, isProperty: boolean, content?: string) => {
      if (!content) return;
      const [el, created] = ensureMeta(key, isProperty);
      const prev = el.getAttribute('content');
      el.setAttribute('content', content);
      restore.push(() => {
        if (created) el.remove();
        else if (prev !== null) el.setAttribute('content', prev);
      });
    };

    setMeta('description', false, description);
    setMeta('og:title', true, title);
    setMeta('og:description', true, description);
    setMeta('og:type', true, type);
    setMeta('og:url', true, ogUrl);
    setMeta('og:image', true, ogImage);
    setMeta('twitter:card', false, 'summary_large_image');
    setMeta('twitter:title', false, title);
    setMeta('twitter:description', false, description);
    setMeta('twitter:image', false, ogImage);

    // canonical（<link rel="canonical">）
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const createdLink = !link;
    const prevHref = link?.getAttribute('href') ?? null;
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', ogUrl);
    restore.push(() => {
      if (createdLink) link!.remove();
      else if (prevHref !== null) link!.setAttribute('href', prevHref);
    });

    return () => {
      // 逆順で元に戻す。
      for (let i = restore.length - 1; i >= 0; i--) restore[i]();
    };
  }, [title, description, image, type, url]);
}
