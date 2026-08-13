// ============================================================================
//  サイト共通フッター（免責＋固定ページへのリンク）。
// ----------------------------------------------------------------------------
//  運営者情報・利用規約・プライバシーポリシーへのリンクはここ1箇所に集約する。
//  以前はホームのフッターにしか無く（しかも「利用規約・プライバシー」の1本）、
//  ポリシー類が全ページから辿れなかった。AdSense は必須コンテンツ（お問い合わせ・
//  プライバシーポリシー）が容易に見つかることを求めるため、各ページのフッターから
//  このコンポーネントを使う。
//
//  リンク先は useLocalHref を通す＝英語ページでは /en 版が実在するものだけ /en へ向く。
// ============================================================================
import { useT } from '@/lib/i18n';
import { useLocalHref } from '@/components/LocalLink';

/** 固定ページへのリンク3本（区切り付き）。独自レイアウトのフッターから使う。 */
export function FooterLinks() {
  const L = useLocalHref();
  const t = useT();
  const cls = 'underline hover:text-white/70';
  return (
    <>
      <a href={L('/about')} className={cls}>
        {t('footer.about')}
      </a>
      {' / '}
      <a href={L('/terms')} className={cls}>
        {t('footer.terms')}
      </a>
      {' / '}
      <a href={L('/privacy')} className={cls}>
        {t('footer.privacy')}
      </a>
    </>
  );
}

/** 標準のフッター。
 *  width … 本文の最大幅に合わせる（記事系は 1100、一覧・掲示板系は 1320）。
 *  inset … 画面下に固定の返信ボックスが出るページ（スレッド・フレンド／クルー詳細）用。
 *          そのままだと固定要素がフッターに重なるため、下側の余白を増やす。 */
export default function SiteFooter({
  width = 1320,
  inset = false,
}: {
  width?: 1320 | 1100;
  inset?: boolean;
}) {
  const t = useT();
  return (
    <footer className="relative z-10 border-t border-white/10" style={{ background: 'rgba(8,6,15,.6)' }}>
      <div
        className={`${width === 1100 ? 'max-w-[1100px]' : 'max-w-[1320px]'} mx-auto px-4 sm:px-6 lg:px-[30px] pt-8 ${inset ? 'pb-28' : 'pb-8'} text-center text-[11.5px] text-white/40 leading-relaxed`}
      >
        {t('footer.disclaimer')} <FooterLinks />　© 2026 GTA6 FEED
      </div>
    </footer>
  );
}
