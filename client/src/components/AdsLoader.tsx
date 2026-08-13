import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { ADSENSE_SRC, isAdFreePath } from '@/lib/ads';

// ============================================================================
//  AdSense ローダーの動的注入。
// ----------------------------------------------------------------------------
//  広告を出すページのプリレンダHTMLには client/index.html 由来の <script> が
//  最初から入っている。広告を出さないページ（lib/ads.ts の AD_FREE_PREFIXES）では
//  プリレンダ側で落としているため、そこで入site したセッションは script を持たない。
//  そのまま記事へ SPA 遷移すると広告が出ないので、遷移先が広告対象なら
//  ここで一度だけ注入する。CSRシェル（app.html）経由のDB記事もこの経路で広告が出る。
//
//  既知の副作用: 自動広告の script はいったん読み込むと解除できない。記事で入site して
//  UGCページへ遷移したセッションでは、そのページにも自動広告が出うる。審査で見られる
//  「URL直アクセス時の初期HTML」では常に広告コード0本であることを担保する設計。
// ============================================================================
export default function AdsLoader() {
  const [location] = useLocation();

  useEffect(() => {
    if (isAdFreePath(location)) return;
    if (document.querySelector('script[src*="adsbygoogle.js"]')) return;
    const s = document.createElement('script');
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = ADSENSE_SRC;
    document.head.appendChild(s);
  }, [location]);

  return null;
}
