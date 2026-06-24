import { useEffect } from 'react';

/**
 * ページの <title> と meta[name="description"] を設定し、離脱時に元へ戻す。
 * SPA（Vite/React）なので各ページでこのフックを呼んでSEO用のタイトル等を反映する。
 */
export function useSeo(title: string, description?: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    let meta: HTMLMetaElement | null = null;
    let prevDesc: string | null = null;
    let createdMeta = false;

    if (description) {
      meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
        createdMeta = true;
      } else {
        prevDesc = meta.getAttribute('content');
      }
      meta.setAttribute('content', description);
    }

    return () => {
      document.title = prevTitle;
      if (meta) {
        if (createdMeta) meta.remove();
        else if (prevDesc !== null) meta.setAttribute('content', prevDesc);
      }
    };
  }, [title, description]);
}
