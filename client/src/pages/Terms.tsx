import Header from '@/components/Header';
import { useT, useLang } from '@/lib/i18n';
import { useSeo } from '@/hooks/useSeo';
import { useLocalHref } from '@/components/LocalLink';
import SiteFooter from '@/components/SiteFooter';

type Block =
  | { p: string }
  | { ul: string[] }
  | { link: { prefix: string; path: string; label: string; suffix: string } }
  | { contact: true };
interface Section {
  h: string;
  blocks: Block[];
}
interface TermsContent {
  title: string;
  updated: string;
  sections: Section[];
  contactPrefix: string;
  contactLink: string;
  contactSuffix: string;
  back: string;
}

const JA: TermsContent = {
  title: '利用規約',
  updated: '最終更新日: 2026-08-13',
  sections: [
    {
      h: '1. はじめに',
      blocks: [
        {
          p: 'GTA6 FEED（以下「当サイト」）は、Grand Theft Auto VI（GTA6）および FiveM / GTA RP に関する情報発信と、プレイヤー同士の交流を目的とした非公式のファンコミュニティサイトです。Rockstar Games、Take-Two Interactive をはじめとする各権利者とは一切関係がありません。当サイトをご利用いただいた時点で、本規約に同意したものとみなします。',
        },
      ],
    },
    {
      h: '2. 投稿について（掲示板・サーバー募集板）',
      blocks: [
        { p: '当サイトの掲示板およびサーバー募集板は、どなたでも投稿できます。投稿にあたっては、次の行為を禁止します。' },
        {
          ul: [
            '法令または公序良俗に反する行為',
            '誹謗中傷、差別、脅迫、ハラスメント、その他他者を害する行為',
            '他人の個人情報・プライバシーを暴露する行為',
            'スパム、過度な宣伝、無関係なリンクの投稿',
            'わいせつ・グロテスクな内容、その他不快感を与える内容',
            'なりすまし、虚偽の情報の流布',
            '第三者の著作権・商標権その他の権利を侵害する行為',
            'サーバーへの攻撃・不正アクセスを助長する行為',
          ],
        },
        {
          p: 'サーバー募集板への掲載は運営の承認制です。交流掲示板は即時投稿ですが、運営は予告なく投稿を削除・非表示にし、または特定の利用者の投稿を制限することができます。禁止ワードの自動フィルタや連投制限を設けています。',
        },
      ],
    },
    {
      h: '3. プライバシー・記録する情報',
      blocks: [
        {
          p: '当サイトは、掲示板への投稿時に投稿内容・投稿日時・IPアドレスなどを記録し、荒らし・不正行為の防止および健全な運営のために利用します。また、広告配信・アクセス解析・連投防止のためにCookieを使用します。',
        },
        {
          link: {
            prefix: '取得する情報の詳細、その利用目的、Cookieの無効化方法については、',
            path: '/privacy',
            label: 'プライバシーポリシー',
            suffix: 'に定めるとおりとします。',
          },
        },
      ],
    },
    {
      h: '4. 免責事項',
      blocks: [
        {
          ul: [
            '掲示板・サーバー募集板の投稿内容は各投稿者の責任に基づくものであり、当サイトはその正確性・安全性・適法性を保証しません。',
            '掲載されたサーバーへの参加や、利用者間で生じたトラブルについて、当サイトは一切の責任を負いません。自己責任でご利用ください。',
            '当サイトのニュース・考察記事には、未確認のリーク情報や推測を含む場合があります。各記事内の注記をご確認ください。',
            '当サイトの利用により生じたいかなる損害についても、当サイトは責任を負いません。',
          ],
        },
      ],
    },
    {
      h: '5. 著作権・商標',
      blocks: [
        {
          p: '「Grand Theft Auto」「GTA」「Rockstar Games」等の名称・ロゴ・関連する著作物の権利は、各権利者に帰属します。当サイトは非公式のファンサイトであり、これらの権利者から公認・提携・後援を受けたものではありません。',
        },
      ],
    },
    {
      h: '6. 規約の変更',
      blocks: [
        {
          p: '当サイトは、本規約を必要に応じて予告なく変更することがあります。変更後の規約は、当ページに掲載した時点で効力を生じます。',
        },
      ],
    },
    { h: '7. お問い合わせ', blocks: [{ contact: true }] },
  ],
  contactPrefix: '本規約に関するお問い合わせは、',
  contactLink: 'お問い合わせフォーム',
  contactSuffix: 'よりお願いいたします。',
  back: '← ホームに戻る',
};

const EN: TermsContent = {
  title: 'Terms of Service',
  updated: 'Last updated: 2026-08-13',
  sections: [
    {
      h: '1. Introduction',
      blocks: [
        {
          p: 'GTA6 FEED ("this site") is an unofficial fan community site for sharing information about Grand Theft Auto VI (GTA6) and FiveM / GTA RP, and for interaction among players. It is in no way affiliated with Rockstar Games, Take-Two Interactive, or any other rights holders. By using this site, you are deemed to have agreed to these terms.',
        },
      ],
    },
    {
      h: '2. Posting (Board & Server Recruit Board)',
      blocks: [
        { p: 'Anyone can post on this site’s board and server recruit board. When posting, the following acts are prohibited.' },
        {
          ul: [
            'Acts that violate laws or public order and morals',
            'Defamation, discrimination, threats, harassment, or other acts that harm others',
            'Disclosing the personal information or privacy of others',
            'Spam, excessive advertising, or posting unrelated links',
            'Obscene or grotesque content, or other content that causes discomfort',
            'Impersonation or spreading false information',
            'Infringing the copyrights, trademarks, or other rights of third parties',
            'Acts that facilitate attacks on or unauthorized access to servers',
          ],
        },
        {
          p: 'Listings on the server recruit board are subject to operator approval. Posts on the community board are published immediately, but the operator may delete or hide posts without notice, or restrict posts from specific users. We use an automatic banned-word filter and rate limits on repeated posting.',
        },
      ],
    },
    {
      h: '3. Privacy & Information We Record',
      blocks: [
        {
          p: 'When you post to the board, this site records the post content, the date and time, the IP address, and similar information, and uses it to prevent trolling and abuse and to keep the site healthy. Cookies are also used for advertising, analytics, and post rate limiting.',
        },
        {
          link: {
            prefix: 'The details of the information collected, the purposes for which it is used, and how to disable cookies are set out in our ',
            path: '/privacy',
            label: 'Privacy Policy',
            suffix: '.',
          },
        },
      ],
    },
    {
      h: '4. Disclaimer',
      blocks: [
        {
          ul: [
            'Content posted on the board and server recruit board is the responsibility of each poster, and this site does not guarantee its accuracy, safety, or legality.',
            'This site bears no responsibility for joining listed servers or for any trouble arising between users. Use at your own risk.',
            "This site's news and analysis articles may include unconfirmed leaks or speculation. Please check the notes within each article.",
            'This site bears no responsibility for any damages arising from use of this site.',
          ],
        },
      ],
    },
    {
      h: '5. Copyright & Trademarks',
      blocks: [
        {
          p: 'The rights to names, logos, and related works such as "Grand Theft Auto," "GTA," and "Rockstar Games" belong to their respective rights holders. This site is an unofficial fan site and is not endorsed by, affiliated with, or sponsored by these rights holders.',
        },
      ],
    },
    {
      h: '6. Changes to the Terms',
      blocks: [
        {
          p: 'This site may change these terms without notice as needed. The revised terms take effect when posted on this page.',
        },
      ],
    },
    { h: '7. Contact', blocks: [{ contact: true }] },
  ],
  contactPrefix: 'For inquiries about these terms, please use the ',
  contactLink: 'contact form',
  contactSuffix: '.',
  back: '← Back to home',
};

export default function Terms() {
  const L = useLocalHref();
  const lang = useLang();
  const t = useT();
  useSeo(t('seo.terms.title'), t('seo.terms.desc'), { localized: true });
  const c = lang === 'en' ? EN : JA;

  const h2 = 'vice-display text-xl text-white mb-3';
  const p = 'text-white/70 text-sm md:text-[15px] leading-relaxed';
  const li = 'text-white/70 text-sm md:text-[15px] leading-relaxed';

  return (
    <div className="vice-page vice-noise">
      <Header />

      <main className="max-w-[820px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[100px] pb-20 relative z-10">
        <span className="text-xs font-extrabold tracking-[0.2em] text-[#22d3ee] uppercase">Terms of Service</span>
        <h1 className="vice-display vice-grad text-3xl md:text-[44px] mt-2 mb-2">{c.title}</h1>
        <p className="text-sm font-mono text-white/45 mb-10">{c.updated}</p>

        <div className="space-y-10">
          {c.sections.map((sec) => (
            <section key={sec.h}>
              <h2 className={h2}>{sec.h}</h2>
              {sec.blocks.map((block, i) => {
                if ('p' in block) {
                  return (
                    <p key={i} className={`${p} ${i > 0 ? 'mt-3' : ''}`}>
                      {block.p}
                    </p>
                  );
                }
                if ('ul' in block) {
                  return (
                    <ul key={i} className={`list-disc pl-6 space-y-1.5 ${i > 0 ? 'mt-3' : ''}`}>
                      {block.ul.map((item, j) => (
                        <li key={j} className={li}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  );
                }
                if ('link' in block) {
                  return (
                    <p key={i} className={`${p} ${i > 0 ? 'mt-3' : ''}`}>
                      {block.link.prefix}
                      <a href={L(block.link.path)} className="text-[#22d3ee] underline hover:text-white transition-colors">
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
                    <a href={L('/contact')} className="text-[#22d3ee] underline hover:text-white transition-colors">
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

      <SiteFooter />
    </div>
  );
}
