import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { GA_ENABLED, initGA, trackPageView } from '@/lib/ga';

/**
 * GA4 を初期化し、wouter のルート変更ごとにページビューを送信する。
 * 本番（import.meta.env.PROD）でのみ動作。UI は描画しない。
 */
export default function GoogleAnalytics() {
  const [location] = useLocation();

  useEffect(() => {
    initGA();
  }, []);

  useEffect(() => {
    if (!GA_ENABLED) return;
    // location は pathname のみ。クエリも含めて送る。
    trackPageView(location + window.location.search);
  }, [location]);

  return null;
}
