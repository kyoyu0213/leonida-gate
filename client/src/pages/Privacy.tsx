import type { ReactNode } from 'react';
import Header from '@/components/Header';
import { useT, useLang } from '@/lib/i18n';
import { useSeo } from '@/hooks/useSeo';
import { useLocalHref } from '@/components/LocalLink';

// プライバシーポリシー。Terms と同じ固定ページの型（見出し＋段落＋箇条書き）で組む。
// AdSense のプログラムポリシーが必須とする記載（第三者配信事業者のCookie利用、
// パーソナライズ広告の無効化手段、アクセス解析、投稿時に取得する情報、Cookieの
// 無効化方法、改定の告知）をここに集約する。利用規約側には重複して置かない。
//
// 本文中の外部リンクは [表示文字](https://...) の記法で書く（renderInline が <a> にする）。
type Block =
  | { p: string }
  | { ul: string[] }
  | { link: { prefix: string; path: string; label: string; suffix: string } }
  | { contact: true };
interface Section {
  h: string;
  blocks: Block[];
}
interface PrivacyContent {
  eyebrow: string;
  title: string;
  dates: string;
  sections: Section[];
  contactPrefix: string;
  contactLink: string;
  contactSuffix: string;
  back: string;
}

const JA: PrivacyContent = {
  eyebrow: 'Privacy Policy',
  title: 'プライバシーポリシー',
  dates: '制定日: 2026-08-13 ／ 最終改定日: 2026-08-13',
  sections: [
    {
      h: '1. はじめに',
      blocks: [
        {
          p: 'GTA6 FEED（以下「当サイト」）は、利用者のプライバシーを尊重し、取得する情報とその取り扱いについて、以下のとおり定めます。本ポリシーは、当サイト（https://gta6-feed.com）が提供するすべてのページに適用されます。',
        },
        {
          link: {
            prefix: '投稿の禁止事項や免責など、サイトの利用条件については',
            path: '/terms',
            label: '利用規約',
            suffix: 'をご覧ください。',
          },
        },
      ],
    },
    {
      h: '2. 広告の配信について',
      blocks: [
        {
          p: '当サイトは、第三者配信の広告サービス「Google AdSense（グーグルアドセンス）」を利用しています。',
        },
        {
          ul: [
            'Google などの第三者配信事業者は、Cookie を使用して、利用者が当サイトや他のサイトに過去にアクセスした際の情報にもとづいて広告を配信します。',
            'Cookie を使用することにより、Google およびそのパートナーは、利用者の興味に応じた広告を表示できます。',
            'パーソナライズ広告は、Google の[広告設定](https://adssettings.google.com)ページで無効にできます。',
            'また、[www.aboutads.info](https://www.aboutads.info/choices/) にアクセスすれば、第三者配信事業者がパーソナライズ広告に使用する Cookie を無効にできます。',
            '当サイトは、広告配信のために、氏名・住所・電話番号・メールアドレスなど個人を特定できる情報を第三者配信事業者へ提供することはありません。',
          ],
        },
      ],
    },
    {
      h: '3. アクセス解析について',
      blocks: [
        {
          p: '当サイトは、サイトの利用状況を把握するために Google アナリティクス（GA4）を使用しています。Google アナリティクスは Cookie を使用して匿名のトラフィックデータを収集します。収集されるデータは匿名であり、個人を特定するものではありません。',
        },
        {
          p: 'データの収集を拒否したい場合は、ブラウザの設定で Cookie を無効にするか、Google が提供する[Google アナリティクス オプトアウト アドオン](https://tools.google.com/dlpage/gaoptout?hl=ja)を利用してください。',
        },
        {
          p: 'このほか、ページの表示速度とアクセス数の計測のために Vercel Analytics を使用しています。こちらは Cookie を使用せず、個人を特定する情報を収集しません。',
        },
      ],
    },
    {
      h: '4. 掲示板・投稿機能で取得する情報',
      blocks: [
        {
          p: '掲示板・募集板・コメント欄などの投稿機能では、スパム対策・荒らし対策・不正利用の防止のため、投稿時に次の情報を取得し、保管します。',
        },
        {
          ul: [
            '投稿内容、入力された名前',
            '投稿日時',
            '投稿時のIPアドレス（およびその匿名化ハッシュ・サブネット）',
            'ブラウザ情報（User-Agent）',
            '端末を識別する匿名ID（ブラウザに保存される識別子）',
          ],
        },
        {
          p: 'これらの情報は一般には公開されず、上記の目的および健全な運営のために運営のみが閲覧します。法令にもとづく正当な開示請求があった場合など、正当な理由がある場合を除き、第三者へ提供することはありません。',
        },
      ],
    },
    {
      h: '5. お問い合わせで取得する情報',
      blocks: [
        {
          p: 'お問い合わせフォームからのご連絡では、返信に必要な範囲で、入力された名前・連絡先・お問い合わせ内容を取得します。これらの情報は、内容の確認と返信のためにのみ使用し、それ以外の目的で利用したり、第三者へ提供したりすることはありません。',
        },
      ],
    },
    {
      h: '6. Cookie の無効化について',
      blocks: [
        {
          p: 'Cookie は、ブラウザの設定でいつでも無効にできます。ただし無効にした場合、連投防止・表示設定の保持・言語の切り替えなど、当サイトの一部の機能が正しく動作しないことがあります。設定方法は、ご利用のブラウザのヘルプをご確認ください。',
        },
      ],
    },
    {
      h: '7. 免責事項',
      blocks: [
        {
          ul: [
            '当サイトからリンクしている外部サイトの内容・サービス・個人情報の取り扱いについて、当サイトは責任を負いません。各サイトのプライバシーポリシーをご確認ください。',
            '当サイトに掲載された情報の利用により生じたいかなる損害についても、当サイトは責任を負いません。',
          ],
        },
      ],
    },
    {
      h: '8. 本ポリシーの改定',
      blocks: [
        {
          p: '当サイトは、法令の変更やサービス内容の変更に応じて、本ポリシーを改定することがあります。改定した場合は本ページに掲載して告知し、掲載した時点で効力を生じます。',
        },
      ],
    },
    { h: '9. お問い合わせ', blocks: [{ contact: true }] },
  ],
  contactPrefix: '本ポリシーに関するお問い合わせは、',
  contactLink: 'お問い合わせフォーム',
  contactSuffix: 'よりお願いいたします。',
  back: '← ホームに戻る',
};

const EN: PrivacyContent = {
  eyebrow: 'Privacy Policy',
  title: 'Privacy Policy',
  dates: 'Effective: 2026-08-13 / Last revised: 2026-08-13',
  sections: [
    {
      h: '1. Introduction',
      blocks: [
        {
          p: 'GTA6 FEED ("this site") respects the privacy of its users and sets out below what information it collects and how that information is handled. This policy applies to every page provided by this site (https://gta6-feed.com).',
        },
        {
          link: {
            prefix: 'For the conditions of use, including prohibited posts and disclaimers, please see the ',
            path: '/terms',
            label: 'Terms of Service',
            suffix: '.',
          },
        },
      ],
    },
    {
      h: '2. Advertising',
      blocks: [
        {
          p: 'This site uses Google AdSense, a third-party advertising service.',
        },
        {
          ul: [
            'Third-party vendors, including Google, use cookies to serve ads based on a user’s prior visits to this site or other sites.',
            'The use of cookies enables Google and its partners to show ads suited to the user’s interests.',
            'Users may opt out of personalized advertising on Google’s [Ads Settings](https://adssettings.google.com) page.',
            'Users may also visit [www.aboutads.info](https://www.aboutads.info/choices/) to opt out of a third-party vendor’s use of cookies for personalized advertising.',
            'This site never provides personally identifiable information — such as name, address, phone number, or email address — to third-party advertising vendors for the purpose of serving ads.',
          ],
        },
      ],
    },
    {
      h: '3. Analytics',
      blocks: [
        {
          p: 'This site uses Google Analytics (GA4) to understand how the site is used. Google Analytics uses cookies to collect anonymous traffic data. The data collected is anonymous and does not identify individuals.',
        },
        {
          p: 'If you wish to refuse this collection, you can disable cookies in your browser settings or install the [Google Analytics Opt-out Browser Add-on](https://tools.google.com/dlpage/gaoptout) provided by Google.',
        },
        {
          p: 'In addition, this site uses Vercel Analytics to measure page speed and traffic volume. It does not use cookies and does not collect personally identifying information.',
        },
      ],
    },
    {
      h: '4. Information Collected by the Board and Posting Features',
      blocks: [
        {
          p: 'On the board, recruitment boards, comment areas, and other posting features, this site collects and stores the following information when you post, in order to prevent spam, trolling, and abuse.',
        },
        {
          ul: [
            'The post content and the name entered',
            'The date and time of posting',
            'The IP address used when posting (and its anonymized hash and subnet)',
            'Browser information (User-Agent)',
            'An anonymous ID identifying the device (an identifier stored in the browser)',
          ],
        },
        {
          p: 'This information is not made public; only the operator views it, and only for the purposes above and for the sound running of the site. It is not provided to third parties except where there is a legitimate reason, such as a lawful disclosure request based on applicable law.',
        },
      ],
    },
    {
      h: '5. Information Collected via Contact',
      blocks: [
        {
          p: 'When you contact us through the contact form, we collect the name, contact details, and inquiry content you enter, to the extent needed to reply. This information is used only to review and respond to your inquiry, and is not used for any other purpose or provided to third parties.',
        },
      ],
    },
    {
      h: '6. Disabling Cookies',
      blocks: [
        {
          p: 'Cookies can be disabled at any time in your browser settings. Note that if you disable them, some features of this site — such as post rate limiting, retaining display settings, and language switching — may not work correctly. Please refer to your browser’s help for how to change these settings.',
        },
      ],
    },
    {
      h: '7. Disclaimer',
      blocks: [
        {
          ul: [
            'This site bears no responsibility for the content, services, or handling of personal information on external sites linked from this site. Please check the privacy policy of each site.',
            'This site bears no responsibility for any damages arising from the use of information published on this site.',
          ],
        },
      ],
    },
    {
      h: '8. Changes to This Policy',
      blocks: [
        {
          p: 'This site may revise this policy in response to changes in law or in the services offered. Any revision will be announced by posting it on this page, and takes effect when posted.',
        },
      ],
    },
    { h: '9. Contact', blocks: [{ contact: true }] },
  ],
  contactPrefix: 'For inquiries about this policy, please use the ',
  contactLink: 'contact form',
  contactSuffix: '.',
  back: '← Back to home',
};

const LINK_CLASS = 'text-[#22d3ee] underline hover:text-white transition-colors';
const INLINE_LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;

/** 本文中の [表示文字](https://...) を <a> に変換する（外部リンクのみ）。 */
function renderInline(text: string) {
  const out: ReactNode[] = [];
  const re = new RegExp(INLINE_LINK_RE.source, 'g');
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      <a key={m.index} href={m[2]} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
        {m[1]}
      </a>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function Privacy() {
  const L = useLocalHref();
  const lang = useLang();
  const t = useT();
  useSeo(t('seo.privacy.title'), t('seo.privacy.desc'), { localized: true });
  const c = lang === 'en' ? EN : JA;

  const h2 = 'vice-display text-xl text-white mb-3';
  const p = 'text-white/70 text-sm md:text-[15px] leading-relaxed';
  const li = 'text-white/70 text-sm md:text-[15px] leading-relaxed';

  return (
    <div className="vice-page vice-noise">
      <Header />

      <main className="max-w-[820px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[100px] pb-20 relative z-10">
        <span className="text-xs font-extrabold tracking-[0.2em] text-[#22d3ee] uppercase">{c.eyebrow}</span>
        <h1 className="vice-display vice-grad text-3xl md:text-[44px] mt-2 mb-2">{c.title}</h1>
        <p className="text-sm font-mono text-white/45 mb-10">{c.dates}</p>

        <div className="space-y-10">
          {c.sections.map((sec) => (
            <section key={sec.h}>
              <h2 className={h2}>{sec.h}</h2>
              {sec.blocks.map((block, i) => {
                if ('p' in block) {
                  return (
                    <p key={i} className={`${p} ${i > 0 ? 'mt-3' : ''}`}>
                      {renderInline(block.p)}
                    </p>
                  );
                }
                if ('ul' in block) {
                  return (
                    <ul key={i} className={`list-disc pl-6 space-y-1.5 ${i > 0 ? 'mt-3' : ''}`}>
                      {block.ul.map((item, j) => (
                        <li key={j} className={li}>
                          {renderInline(item)}
                        </li>
                      ))}
                    </ul>
                  );
                }
                if ('link' in block) {
                  return (
                    <p key={i} className={`${p} ${i > 0 ? 'mt-3' : ''}`}>
                      {block.link.prefix}
                      <a href={L(block.link.path)} className={LINK_CLASS}>
                        {block.link.label}
                      </a>
                      {block.link.suffix}
                    </p>
                  );
                }
                // contact
                return (
                  <p key={i} className={p}>
                    {c.contactPrefix}
                    <a href={L('/contact')} className={LINK_CLASS}>
                      {c.contactLink}
                    </a>
                    {c.contactSuffix}
                  </p>
                );
              })}
            </section>
          ))}
        </div>

        <div className="mt-12">
          <a href={L('/')} className="inline-flex items-center gap-2 text-[#22d3ee] hover:text-white transition-colors font-bold text-sm">
            {c.back}
          </a>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/10" style={{ background: 'rgba(8,6,15,.6)' }}>
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-[30px] py-8 text-center text-[11.5px] text-white/40">
          {t('footer.disclaimer')} © 2026 GTA6 FEED
        </div>
      </footer>
    </div>
  );
}
