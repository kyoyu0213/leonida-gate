import Header from '@/components/Header';
import { useLang } from '@/lib/i18n';

type Block = { p: string } | { ul: string[] } | { contact: true };
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
  disclaimer: string;
}

const JA: TermsContent = {
  title: '利用規約・プライバシーポリシー',
  updated: '最終更新日: 2026-06-22',
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
        { p: '掲示板への投稿時、当サイトは荒らし・不正行為の防止および健全な運営のため、次の情報を記録します。' },
        {
          ul: [
            '投稿日時',
            '投稿者のIPアドレス（およびその匿名化ハッシュ・サブネット）',
            'ブラウザ情報（User-Agent）',
            '端末を識別する匿名ID（ブラウザに保存される識別子）',
            '投稿内容、入力された名前',
          ],
        },
        {
          p: 'IPアドレスは一般には公開されず、運営が不正対応などの管理目的でのみ閲覧します。ただし、法令に基づく正当な開示請求があった場合など、正当な理由がある場合には、関係機関へ開示することがあります。',
        },
        { p: 'また、連投防止や表示制御のために、ブラウザのCookieおよびローカルストレージを最小限の範囲で使用します。' },
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
  disclaimer:
    '本サイトは GTA6 の非公式ファンコミュニティです。Rockstar Games / Take-Two とは一切関係ありません。',
};

const EN: TermsContent = {
  title: 'Terms of Service & Privacy Policy',
  updated: 'Last updated: 2026-06-22',
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
        { p: 'When you post to the board, this site records the following information to prevent trolling and abuse and to keep the site healthy.' },
        {
          ul: [
            'Date and time of posting',
            "The poster's IP address (and its anonymized hash and subnet)",
            'Browser information (User-Agent)',
            'An anonymous ID identifying the device (an identifier stored in the browser)',
            'The post content and the name entered',
          ],
        },
        {
          p: 'IP addresses are not made public; the operator views them only for administrative purposes such as handling abuse. However, where there is a legitimate reason, such as a lawful disclosure request based on applicable law, they may be disclosed to the relevant authorities.',
        },
        { p: 'We also use browser cookies and local storage to a minimal extent to prevent repeated posting and to control display.' },
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
  disclaimer:
    'This is an unofficial GTA6 (Grand Theft Auto VI) fan community. Not affiliated with Rockstar Games / Take-Two.',
};

export default function Terms() {
  const lang = useLang();
  const c = lang === 'en' ? EN : JA;

  const h2 = 'vice-display text-xl text-white mb-3';
  const p = 'text-white/70 text-sm md:text-[15px] leading-relaxed';
  const li = 'text-white/70 text-sm md:text-[15px] leading-relaxed';

  return (
    <div className="vice-page vice-noise">
      <Header />

      <main className="max-w-[820px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[100px] pb-20 relative z-10">
        <span className="text-xs font-extrabold tracking-[0.2em] text-[#22d3ee] uppercase">Terms &amp; Privacy</span>
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
                // contact
                return (
                  <p key={i} className={p}>
                    {c.contactPrefix}
                    <a href="/contact" className="text-[#22d3ee] underline hover:text-white transition-colors">
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
          <a href="/" className="inline-flex items-center gap-2 text-[#22d3ee] hover:text-white transition-colors font-bold text-sm">
            {c.back}
          </a>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/10" style={{ background: 'rgba(8,6,15,.6)' }}>
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-[30px] py-8 text-center text-[11.5px] text-white/40">
          {c.disclaimer} © 2026 GTA6 FEED
        </div>
      </footer>
    </div>
  );
}
