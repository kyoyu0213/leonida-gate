import Header from '@/components/Header';
import { useT, useLang } from '@/lib/i18n';
import { useSeo } from '@/hooks/useSeo';

// 運営者情報・編集方針（About）。Terms と同じ固定ページの型（見出し＋段落）で組む。
// 本文はハウススタイル（常体・三人称・ボールドなし）。h3 は編集方針の各項目に使う。
type Block = { p: string } | { h3: string } | { contact: true };
interface Section {
  h: string;
  blocks: Block[];
}
interface AboutContent {
  eyebrow: string;
  title: string;
  sections: Section[];
  contactPrefix: string;
  contactLink: string;
  contactSuffix: string;
  back: string;
  disclaimer: string;
}

const JA: AboutContent = {
  eyebrow: 'About',
  title: '運営者情報・編集方針',
  sections: [
    {
      h: 'GTA6 FEED について',
      blocks: [
        {
          p: 'GTA6 FEED は、Grand Theft Auto VI（GTA6）と FiveM／GTARP に関する情報を、日本語で扱うファンメディアである。GTA6 の最新情報・分析記事、FiveM／GTARP の解説・ガイド、コミュニティ掲示板、サーバー募集板を通じて、日本語圏の GTA6・FiveM ファンのための情報拠点となることを目指している。',
        },
        { p: '本サイトは個人によって運営されている。運営主体は「GTA6 FEED編集部」として表記する。' },
      ],
    },
    {
      h: '編集方針',
      blocks: [
        { p: 'GTA6 FEED は、読者が情報を正しく受け取れるよう、以下の方針で記事を作成している。' },
        { h3: '確定情報・未確認情報・考察を区別する' },
        {
          p: 'GTA6 は発売前のタイトルであり、公式発表・リーク・噂・考察が入り混じる。本サイトでは、公式に確認された情報、未確認のリーク情報、編集部による考察を、本文および記事末尾で明確に区別して記載する。未確認の情報を確定情報であるかのように扱わない。',
        },
        { h3: 'リーク・噂の扱い' },
        {
          p: '発売前の性質上、リークや噂を扱うことがある。その際は、情報の出どころと確度を可能な範囲で示し、「未確認である」ことを明示する。裏付けの取れない情報を断定的に書かない。',
        },
        { h3: '出典の明示' },
        {
          p: '海外メディア・Wiki・公式発表などの外部情報にもとづく場合は、その出典を記事内に示す。事実と、事実にもとづく考察を分けて記述する。',
        },
        { h3: '情報の検証' },
        {
          p: '記事作成にあたって各種の調査手段を用いるが、内容は公開前に可能な範囲で検証する。裏付けの取れない情報、検証できない情報は、その旨を明示するか、掲載を見送る。',
        },
        { h3: '中立性' },
        {
          p: 'ニュース・解説・ガイド記事では、特定のサーバーや個人・団体を一方的に持ち上げたり貶めたりしない。事実を記述し、評価は読者にゆだねる。コミュニティ掲示板における個々のユーザーの発言は、各投稿者の意見であり、編集部の見解ではない。',
        },
      ],
    },
    {
      h: '情報の正確性について',
      blocks: [
        {
          p: '本サイトは正確な情報の提供に努めているが、内容の完全性・正確性・最新性を保証するものではない。特に発売前の GTA6 に関する情報は、公式の発表や状況の変化により変わる可能性がある。本サイトの情報を利用した結果生じたいかなる損害についても、責任を負いかねる。',
        },
        {
          p: '掲載内容に誤りを見つけた場合や、修正・削除の依頼がある場合は、下記の連絡先より知らせてほしい。',
        },
      ],
    },
    {
      h: 'お問い合わせ',
      blocks: [{ contact: true }],
    },
    {
      h: '免責事項',
      blocks: [
        {
          p: '本サイトは、GTA6（Grand Theft Auto VI）に関する非公式のファンコミュニティである。Rockstar Games、Take-Two Interactive とは一切関係がない。GTA6 および関連するすべての商標・著作権は、それぞれの権利者に帰属する。',
        },
        { p: '© 2026 GTA6 FEED' },
      ],
    },
  ],
  contactPrefix: '情報提供、記事・掲示板・サーバー掲載内容の削除／修正の依頼、その他の連絡は、',
  contactLink: 'お問い合わせフォーム',
  contactSuffix: 'より受け付けている。',
  back: '← ホームに戻る',
  disclaimer:
    '本サイトは GTA6 の非公式ファンコミュニティです。Rockstar Games / Take-Two とは一切関係ありません。',
};

const EN: AboutContent = {
  eyebrow: 'About',
  title: 'About Us & Editorial Policy',
  sections: [
    {
      h: 'About GTA6 FEED',
      blocks: [
        {
          p: 'GTA6 FEED is a Japanese-language fan media outlet covering Grand Theft Auto VI (GTA6) and FiveM / GTARP. Through GTA6 news and analysis, FiveM / GTARP explainers and guides, a community board, and a server recruitment board, it aims to be an information hub for GTA6 and FiveM fans in the Japanese-speaking world.',
        },
        {
          p: 'This site is operated by an individual. The operator is credited as the “GTA6 FEED Editorial Team.”',
        },
      ],
    },
    {
      h: 'Editorial Policy',
      blocks: [
        {
          p: 'So that readers can take information at its proper weight, GTA6 FEED writes its articles according to the following policies.',
        },
        { h3: 'Distinguishing confirmed information, unconfirmed information, and analysis' },
        {
          p: 'GTA6 is an unreleased title, and official announcements, leaks, rumors, and analysis are all mixed together. On this site, officially confirmed information, unconfirmed leaks, and the editorial team’s own analysis are clearly distinguished within the body of the article and at its end. Unconfirmed information is never treated as though it were confirmed.',
        },
        { h3: 'Handling leaks and rumors' },
        {
          p: 'Given the pre-release nature of the subject, leaks and rumors are sometimes covered. When they are, the source and the degree of confidence are indicated as far as possible, and the fact that the information is unconfirmed is stated explicitly. Information that cannot be corroborated is never written as though it were settled.',
        },
        { h3: 'Citing sources' },
        {
          p: 'Where an article is based on external information such as overseas media, wikis, or official announcements, the source is indicated within the article. Facts and analysis based on those facts are described separately.',
        },
        { h3: 'Verification' },
        {
          p: 'Various research methods are used in producing articles, and content is verified as far as possible before publication. Information that cannot be corroborated or verified is either flagged as such or not published.',
        },
        { h3: 'Neutrality' },
        {
          p: 'In news, explainer, and guide articles, no particular server, individual, or organization is one-sidedly praised or disparaged. Facts are described, and judgment is left to the reader. Statements by individual users on the community board are the opinions of those posters and are not the views of the editorial team.',
        },
      ],
    },
    {
      h: 'On the Accuracy of Information',
      blocks: [
        {
          p: 'This site strives to provide accurate information, but does not guarantee the completeness, accuracy, or currency of its content. Information about the unreleased GTA6 in particular may change through official announcements or changing circumstances. No responsibility is accepted for any damages arising from the use of information on this site.',
        },
        {
          p: 'If you find an error in the published content, or wish to request a correction or removal, please let us know via the contact details below.',
        },
      ],
    },
    {
      h: 'Contact',
      blocks: [{ contact: true }],
    },
    {
      h: 'Disclaimer',
      blocks: [
        {
          p: 'This site is an unofficial fan community for GTA6 (Grand Theft Auto VI). It has no affiliation whatsoever with Rockstar Games or Take-Two Interactive. GTA6 and all related trademarks and copyrights belong to their respective rights holders.',
        },
        { p: '© 2026 GTA6 FEED' },
      ],
    },
  ],
  contactPrefix:
    'Tips, requests to remove or correct articles, board posts, or server listings, and any other inquiries are accepted via the ',
  contactLink: 'contact form',
  contactSuffix: '.',
  back: '← Back to home',
  disclaimer:
    'This is an unofficial GTA6 (Grand Theft Auto VI) fan community. Not affiliated with Rockstar Games / Take-Two.',
};

export default function About() {
  const lang = useLang();
  const t = useT();
  useSeo(t('seo.about.title'), t('seo.about.desc'), { localized: true });
  const c = lang === 'en' ? EN : JA;
  const prefix = lang === 'en' ? '/en' : '';

  const h2 = 'vice-display text-xl text-white mb-3';
  const h3 = 'text-[15px] md:text-base font-extrabold text-white/90 mt-6 mb-2';
  const p = 'text-white/70 text-sm md:text-[15px] leading-relaxed';

  return (
    <div className="vice-page vice-noise">
      <Header />

      <main className="max-w-[820px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[100px] pb-20 relative z-10">
        <span className="text-xs font-extrabold tracking-[0.2em] text-[#22d3ee] uppercase">{c.eyebrow}</span>
        <h1 className="vice-display vice-grad text-3xl md:text-[44px] mt-2 mb-10">{c.title}</h1>

        <div className="space-y-10">
          {c.sections.map((sec) => (
            <section key={sec.h}>
              <h2 className={h2}>{sec.h}</h2>
              {sec.blocks.map((block, i) => {
                if ('h3' in block) {
                  return (
                    <h3 key={i} className={h3}>
                      {block.h3}
                    </h3>
                  );
                }
                if ('p' in block) {
                  // 直前が h3 のときは h3 側の mb で間隔が足りるので、段落側の上余白は付けない
                  const prev = i > 0 ? sec.blocks[i - 1] : undefined;
                  const tight = !prev || 'h3' in prev;
                  return (
                    <p key={i} className={`${p} ${tight ? '' : 'mt-3'}`}>
                      {block.p}
                    </p>
                  );
                }
                // contact
                return (
                  <p key={i} className={p}>
                    {c.contactPrefix}
                    <a
                      href={`${prefix}/contact`}
                      className="text-[#22d3ee] underline hover:text-white transition-colors"
                    >
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
          <a
            href={prefix || '/'}
            className="inline-flex items-center gap-2 text-[#22d3ee] hover:text-white transition-colors font-bold text-sm"
          >
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
