// ============================================================================
//  掲示板・募集板の静的な解説本文。
// ----------------------------------------------------------------------------
//  なぜ必要か：
//    これらのページはスレッドや募集カードを Supabase からクライアント取得するため、
//    プリレンダされた生HTMLには nav と見出しと「取得中…」しか入っていなかった。
//    sitemap には priority 0.7〜0.8 で申告しているのに、クローラから見ると
//    実質空のページが9本並んでいる状態だった（AdSense の「有用性の低いコンテンツ」に直結）。
//
//    ここに置いた本文は data 取得を待たずに描画されるため、
//    prerender-routes.ts が #root に焼き込む生HTMLへそのまま入る。
//
//  本文の直し方：
//    下の BOARD_GUIDES の該当キーを書き換えるだけ。日英それぞれ独立に持つ。
//    表示は components/BoardGuide.tsx。ページ側は <BoardGuide guideKey="..." /> を置くだけ。
// ============================================================================

export interface BoardGuideSection {
  heading: string;
  /** 段落。配列の各要素が <p> になる。 */
  body: string[];
}

export interface BoardGuideContent {
  /** 見出し直下のリード文。 */
  lead: string;
  sections: BoardGuideSection[];
}

/** 解説を出すページの識別子。/board（slug無し）は既定板と同じ gtarp-servers を使う。 */
export type BoardGuideKey =
  | 'gtarp-servers'
  | 'streamer-servers'
  | 'gtarp'
  | 'gta6'
  | 'fivem-dev'
  | 'friends'
  | 'crews'
  | 'servers';

export const BOARD_GUIDES: Record<BoardGuideKey, { ja: BoardGuideContent; en: BoardGuideContent }> = {
  // --------------------------------------------------------------------------
  'gtarp-servers': {
    ja: {
      lead: 'FiveMサーバー掲示板は、日本語で遊べるGTARP（FiveM）サーバーごとに専用スレッドを立て、そのサーバーの参加者・興味のある人が情報を交換するための板です。',
      sections: [
        {
          heading: 'この板の使いかた',
          body: [
            'スレッドは1サーバーにつき1本を原則としています。参加方法や申請の流れ、街の雰囲気、活動時間帯、初心者の受け入れ体制など、そのサーバーに関する話題をスレッド内でまとめて追えるようにするためです。',
            'これから入るサーバーを選んでいる段階の人は、まず気になるサーバーのスレッドを読むことをおすすめします。公式Discordの告知だけでは分からない「実際の人口感」「新規が馴染めるか」といった空気は、参加者どうしのやり取りに出やすいためです。',
          ],
        },
        {
          heading: 'スレッドの作成が申請制になっている理由',
          body: [
            'この板だけはスレッドを自由に立てられません。「掲載を申請する」から送っていただき、管理者が内容を確認したうえでスレッドを作成します。',
            '自由にスレッドを立てられる形にすると、実体のないサーバーや、開設直後で人がまったくいないサーバーのスレッドが大量に並び、一覧としての機能を失います。実際に遊べるサーバーだけが並んでいる状態を保つための仕組みです。',
            '申請時は、サーバー名・どんなRPをする街なのか・参加方法（Discord等）を書いていただけると、確認がスムーズです。',
          ],
        },
        {
          heading: '書き込みのルール',
          body: [
            '特定のサーバーや個人への誹謗中傷、荒らし、他サーバーへの勧誘目的の書き込みはご遠慮ください。サーバー間の比較そのものは問題ありませんが、一方を貶める形での比較は削除対象になります。',
            'サーバー内で起きたトラブルの当事者どうしの言い争いは、この掲示板ではなく各サーバーの運営へお願いします。',
          ],
        },
      ],
    },
    en: {
      lead: 'The FiveM Server Board hosts one dedicated thread per Japanese-language GTARP (FiveM) server, where current players and prospective members can exchange information.',
      sections: [
        {
          heading: 'How to use this board',
          body: [
            'As a rule, each server gets a single thread. Keeping everything in one place — how to join, the application process, the atmosphere of the city, peak hours, how newcomers are received — makes it possible to follow a server\'s history in one read.',
            'If you are still deciding which server to join, start by reading the thread for the servers you are interested in. The things an official Discord announcement will not tell you — how populated it actually feels, whether newcomers settle in — tend to surface in conversation between players.',
          ],
        },
        {
          heading: 'Why thread creation is application-only',
          body: [
            'This is the one board where you cannot open a thread freely. Send a request through "Apply for listing" and an administrator will create the thread after reviewing it.',
            'If anyone could open a thread, the list would fill up with servers that do not really exist or that opened yesterday and have no players, and it would stop working as an index. This keeps the list to servers you can actually play on.',
            'Including the server name, what kind of roleplay the city is built around, and how to join (Discord, etc.) makes review much faster.',
          ],
        },
        {
          heading: 'Posting rules',
          body: [
            'Please avoid personal attacks on servers or individuals, trolling, and posts made to recruit for another server. Comparing servers is fine; comparisons framed to disparage one of them will be removed.',
            'Disputes between people involved in an in-server incident belong with that server\'s staff, not on this board.',
          ],
        },
      ],
    },
  },

  // --------------------------------------------------------------------------
  'streamer-servers': {
    ja: {
      lead: '配信者サーバー掲示板は、人気ストリーマーやVTuberが参加するGTA RPサーバーについて、視聴者と参加者が情報を交換するための板です。',
      sections: [
        {
          heading: 'この板の使いかた',
          body: [
            '配信を見て「この街に興味を持った」という入り方をする人が多いため、この板ではサーバーごとのスレッドに、参加している配信者、企画やイベントの流れ、視聴者が参加できるのかどうか、といった話題が集まります。',
            '配信のアーカイブや切り抜きで話題になった出来事の背景を確認したいときにも使えます。RPは長期の物語として続いていくため、単発の配信だけでは経緯が分からないことが多いためです。',
          ],
        },
        {
          heading: 'スレッドの作成が申請制になっている理由',
          body: [
            'この板もスレッドは申請制で、管理者が内容を確認してから作成します。配信者の名前を使った実体のないスレッドが立つことを防ぐためです。',
            '掲載を希望される場合は「掲載を申請する」からお送りください。',
          ],
        },
        {
          heading: '書き込みのルール',
          body: [
            '配信者本人や視聴者への誹謗中傷、私生活への言及、いわゆる「メタ的な」情報の持ち込みはご遠慮ください。配信外で得た情報をRPの場に持ち込む行為は、多くのRPサーバーでルール違反にあたります。',
            '未配信の内容やネタバレの扱いには配慮をお願いします。',
          ],
        },
      ],
    },
    en: {
      lead: 'The Streamer Server Board is where viewers and players exchange information about GTA RP servers that popular streamers and VTubers play on.',
      sections: [
        {
          heading: 'How to use this board',
          body: [
            'Many people discover a city by watching a stream, so threads here tend to collect discussion of which streamers are playing, how storylines and events are unfolding, and whether viewers can join.',
            'It is also useful for catching up on the background of something you saw in a VOD or a clip. Roleplay runs as a long-form story, and a single stream rarely explains how a situation got there.',
          ],
        },
        {
          heading: 'Why thread creation is application-only',
          body: [
            'Threads on this board are also created by an administrator after review, which prevents threads being opened in a streamer\'s name for a server that does not exist.',
            'If you would like a server listed, send a request through "Apply for listing".',
          ],
        },
        {
          heading: 'Posting rules',
          body: [
            'Please avoid personal attacks on streamers or viewers, comments about their private lives, and bringing in so-called metagaming information. Carrying information obtained outside the roleplay into the roleplay itself breaks the rules on most RP servers.',
            'Please be considerate about spoilers and about content that has not aired yet.',
          ],
        },
      ],
    },
  },

  // --------------------------------------------------------------------------
  gtarp: {
    ja: {
      lead: 'ロールプレイ情報交換掲示板は、GTA / FiveM のロールプレイについて匿名で自由に話せる板です。特定のサーバーに属さない、GTARP全般の話題を扱います。',
      sections: [
        {
          heading: 'どんな話題を扱うか',
          body: [
            'RPを始めるときの疑問（PC版GTA5とFiveMの導入、キャラクターの作りかた、最初の一日の過ごしかた）から、IC/OOCの線引き、RDMやメタゲーミングといった用語の解釈、警察RPや医療RPなどの職業ロール、長期キャラクターの育てかたまで、GTARPに関することであれば何でも扱います。',
            '「初心者すぎて何を聞けばいいか分からない」という書き込みも歓迎です。RPは暗黙の了解が多く、経験者にとって当たり前のことほど言語化されにくいため、素朴な質問がそのまま他の人の役に立ちます。',
          ],
        },
        {
          heading: 'この板は自由に書き込めます',
          body: [
            '申請は不要で、どなたでもスレッドを立てて書き込めます。名前を入れずに投稿でき、アカウント登録も必要ありません。',
            'まず用語や全体像から知りたい場合は、サイト内のFiveM/GTARPガイド（用語辞典・よくある質問・初日の過ごしかた）も併せてご覧ください。',
          ],
        },
        {
          heading: '書き込みのルール',
          body: [
            '特定の個人・サーバーへの誹謗中傷、荒らし、繰り返しの宣伝はご遠慮ください。他サーバーのメンバー引き抜きを目的とした書き込みも対象です。',
            'サーバー内のトラブルについては、当事者の実名や配信者名を挙げての糾弾ではなく、一般化した相談の形での投稿をお願いします。',
          ],
        },
      ],
    },
    en: {
      lead: 'The Roleplay Discussion Board is an anonymous, open board for talking about GTA / FiveM roleplay in general — topics that are not tied to any one server.',
      sections: [
        {
          heading: 'What gets discussed here',
          body: [
            'Everything from getting-started questions (installing FiveM on PC GTA5, building a character, what to do on day one) to where the IC/OOC line sits, how terms like RDM and metagaming are actually interpreted, job roles such as police and EMS RP, and how to develop a long-running character.',
            'Posts along the lines of "I am too new to even know what to ask" are welcome. Roleplay runs on a lot of unwritten convention, and the things veterans take for granted are exactly the things nobody writes down — so a naive question is often useful to everyone reading.',
          ],
        },
        {
          heading: 'This board is open to everyone',
          body: [
            'No application is needed. Anyone can start a thread and post, without a name and without registering an account.',
            'If you want the terminology and the big picture first, the FiveM/GTARP guides on this site (glossary, FAQ, first-day guide) cover that ground.',
          ],
        },
        {
          heading: 'Posting rules',
          body: [
            'Please avoid personal attacks on individuals or servers, trolling, and repeated advertising, including posts intended to poach members from another server.',
            'For in-server disputes, please post as a general question rather than naming and calling out the people or streamers involved.',
          ],
        },
      ],
    },
  },

  // --------------------------------------------------------------------------
  gta6: {
    ja: {
      lead: 'GTA6情報交換掲示板は、Grand Theft Auto VI の最新情報・考察・リーク・雑談を扱う板です。発売前の情報が錯綜しやすい時期なので、出どころを確かめながら話せる場所として用意しています。',
      sections: [
        {
          heading: 'どんな話題を扱うか',
          body: [
            'トレーラーの内容や公式発表の解釈、発売日・エディション・予約特典まわり、プラットフォームごとの仕様の予想、オンラインモードがどうなるかの考察などを扱います。発売後は、実際に遊んだ感想やミッションの攻略も対象になります。',
            'GTA6のオンラインが既存のGTAオンラインやFiveM RPとどう関係していくのかは、このコミュニティで特に関心の高い話題です。',
          ],
        },
        {
          heading: 'リーク情報の扱いについて',
          body: [
            '発売前は、公式発表・信頼できる報道・出どころ不明のリーク・完全な創作が同じ見た目で流れてきます。書き込むときは、どこで見た情報なのかを一緒に書いていただけると、読む側が判断できて助かります。',
            '真偽の分からない情報を「これは未確認だが」と添えて共有すること自体は歓迎です。断定形で広めることだけ避けていただければ十分です。',
          ],
        },
        {
          heading: '書き込みのルール',
          body: [
            '申請は不要で、どなたでも自由にスレッドを立てられます。匿名で投稿できます。',
            '違法なコピーの入手方法、いわゆる偽ベータ版や事前予約を装った詐欺サイトへの誘導は禁止です。実際にそうした詐欺は世界的に確認されているため、リンクの共有には特にご注意ください。',
          ],
        },
      ],
    },
    en: {
      lead: 'The GTA6 Discussion Board covers news, analysis, leaks, and general talk about Grand Theft Auto VI. Information moves fast and unreliably before launch, so this board is meant to be a place where sources can be checked as you go.',
      sections: [
        {
          heading: 'What gets discussed here',
          body: [
            'Trailer readings and interpretations of official announcements, release date and edition/pre-order details, predictions about platform-specific specs, and analysis of what the online mode will look like. After launch, impressions and mission strategy belong here too.',
            'How GTA6\'s online mode will relate to the existing GTA Online and to FiveM RP is a topic of particular interest in this community.',
          ],
        },
        {
          heading: 'On handling leaks',
          body: [
            'Before launch, official announcements, credible reporting, leaks of unknown origin, and outright fabrication all arrive looking the same. If you note where you saw something, readers can judge it for themselves.',
            'Sharing unverified information is fine as long as you flag it as unverified. What we ask you to avoid is stating it as fact.',
          ],
        },
        {
          heading: 'Posting rules',
          body: [
            'No application needed — anyone can start a thread, anonymously.',
            'Do not post ways to obtain illegal copies, or links to fake beta and fake pre-order scam sites. Scams of exactly this kind have been confirmed worldwide, so please be especially careful with links.',
          ],
        },
      ],
    },
  },

  // --------------------------------------------------------------------------
  'fivem-dev': {
    ja: {
      lead: 'FiveM開発者交流掲示板は、FiveMサーバーの構築・運営・スクリプト制作について情報を交換する板です。これから鯖を立てる人と、すでに運営している人の両方を想定しています。',
      sections: [
        {
          heading: 'どんな話題を扱うか',
          body: [
            'txAdminでのサーバー構築、artifactsのバージョン選び、ESX / QBCoreといったフレームワークの選定、リソースの導入と競合の解消、MySQL周りの設定、パフォーマンス（サーバーFPSやhitch warning）の改善、チート対策やアンチチートの運用などを扱います。',
            'Luaスクリプトの書きかた、NUIでのUI制作、MLOやカスタム車両の導入といった制作寄りの話題も歓迎です。エラーログを貼って原因を相談する使いかたもできます。',
          ],
        },
        {
          heading: '運営そのものの相談も',
          body: [
            '技術的な話だけでなく、サーバー運営で実際に難しいのは人の部分です。スタッフの集めかた、ルールの決めかたと運用、トラブル対応の線引き、人口が減ってきたときの立て直しなど、運営者どうしでないと話しにくい話題も扱っています。',
            'サーバーを一から作る過程は、サイト内の「FiveMさんぽ日記（開発日記）」でも記録しています。実際にどこでつまずくのかの具体例として参照できます。',
          ],
        },
        {
          heading: 'この板は自由に書き込めます',
          body: [
            '申請は不要で、どなたでもスレッドを立てて書き込めます。匿名で投稿でき、アカウント登録も必要ありません。',
            '質問を書くときは、使っているフレームワークやartifactsのバージョン、実際に出ているエラーの文面を添えていただけると、答える側が状況を再現しやすくなります。解決したあとに「何が原因だったか」を書き足していただけると、同じところで詰まった人がそのまま参考にできます。',
          ],
        },
      ],
    },
    en: {
      lead: 'The FiveM Developer Board is for exchanging information about building, running, and scripting FiveM servers — aimed at both people about to start a server and people already running one.',
      sections: [
        {
          heading: 'What gets discussed here',
          body: [
            'Setting up a server with txAdmin, choosing artifact versions, picking a framework such as ESX or QBCore, installing resources and resolving conflicts, MySQL configuration, performance work (server FPS, hitch warnings), and anti-cheat operation.',
            'Creative topics are welcome too: writing Lua scripts, building UI with NUI, adding MLOs and custom vehicles. Pasting an error log to debug it together is a perfectly good use of this board.',
          ],
        },
        {
          heading: 'Running a server, not just building one',
          body: [
            'The genuinely hard part of running a server is rarely technical. Recruiting staff, writing rules and actually enforcing them, deciding where to draw the line on incidents, and rebuilding when the population drops — these are things it helps to discuss with other operators.',
            'The process of building a server from scratch is also documented in this site\'s Field Notes dev diary, which is worth reading as a concrete account of where things actually go wrong.',
          ],
        },
        {
          heading: 'This board is open to everyone',
          body: [
            'No application is needed. Anyone can start a thread and post, without a name and without registering an account.',
            'When asking a question, including the framework you are on, your artifacts version, and the actual error text makes it far easier for someone to reproduce your situation. Coming back to note what the cause turned out to be helps the next person who gets stuck in the same place.',
          ],
        },
      ],
    },
  },

  // --------------------------------------------------------------------------
  friends: {
    ja: {
      lead: 'フレンド募集板は、GTA6 / GTAオンラインを一緒に遊ぶ相手を探すためのカード型の募集板です。プラットフォームと遊びかたで絞り込めるようになっています。',
      sections: [
        {
          heading: '募集の書きかた',
          body: [
            '相手が見つかりやすいのは、条件がはっきり書かれている募集です。プレイするプラットフォーム（PS5 / PS4 / Xbox / PC）、だいたいの活動時間帯、やりたいこと（強盗ミッション、レース、カーミーティング、金策、まったり遊ぶ、など）、ボイスチャットの有無を書いておくと、そもそも合わない相手からの連絡が減ります。',
            'PC版はエンハンスト版とレガシー版でマッチングが分かれるため、PCの方はどちらかも書いておくと確実です。',
          ],
        },
        {
          heading: '掲載の流れ',
          body: [
            '「募集する」から投稿できます。どなたでも掲載でき、投稿するとそのまま一覧に反映されます。承認待ちはありません。',
            '募集が埋まったあとも投稿が残っていると、他の方が無駄に連絡してしまいます。終わった募集はそのままにせず、ご連絡ください。',
          ],
        },
        {
          heading: '安全のためのお願い',
          body: [
            '連絡先には、Discordのユーザー名やゲーム内IDなど、必要最小限のものだけを書いてください。本名・住所・学校名・電話番号・メールアドレスなどの個人情報は絶対に書かないでください。誰でも閲覧できるページです。',
            '金銭のやり取りを伴う募集（アカウント売買、代行、有料でのミッション手伝いなど）は禁止です。未成年の方は特に、個人情報を求めてくる相手や、通話アプリ以外での連絡を強く求めてくる相手にご注意ください。',
          ],
        },
      ],
    },
    en: {
      lead: 'The Find Friends board is a card-style listing board for finding people to play GTA6 / GTA Online with, filterable by platform and by what you want to do.',
      sections: [
        {
          heading: 'Writing a good listing',
          body: [
            'The listings that get answered are the specific ones. Stating your platform (PS5 / PS4 / Xbox / PC), roughly when you play, what you want to do (heists, races, car meets, grinding, just hanging out), and whether you use voice chat cuts down on replies from people who were never a fit.',
            'On PC, Enhanced and Legacy match separately, so PC players should say which one they are on.',
          ],
        },
        {
          heading: 'How listing works',
          body: [
            'Post through the "Create listing" button. Anyone can list, and your post appears in the listing immediately — there is no approval queue.',
            'A listing left up after you have found people wastes other players\' time. Please let us know when yours is done rather than leaving it.',
          ],
        },
        {
          heading: 'Staying safe',
          body: [
            'Put only the minimum in your contact field — a Discord username or in-game ID. Never post real names, addresses, schools, phone numbers, or email addresses. This page is public.',
            'Listings involving money (selling accounts, paid carries, paid mission help) are prohibited. Younger players in particular should be wary of anyone asking for personal details or pushing hard to move the conversation off a normal voice app.',
          ],
        },
      ],
    },
  },

  // --------------------------------------------------------------------------
  crews: {
    ja: {
      lead: 'クルー募集板は、GTA6 / GTAオンラインのクルー（チーム）がメンバーを募集したり、入るクルーを探したりするためのカード型の募集板です。',
      sections: [
        {
          heading: 'クルーを募集する場合',
          body: [
            'クルー名と活動方針をはっきり書いてください。ガチで稼ぐのか、レース中心なのか、カーミーティングなどの交流が中心なのか、まったり遊ぶ場なのかで、集まる人がまったく変わります。',
            'あわせて、主な活動時間帯、ボイスチャットの必須度、年齢層の目安、加入条件（初心者可かどうか、掛け持ち可かどうか）を書いておくと、入ってから「思っていたのと違った」となりにくくなります。',
          ],
        },
        {
          heading: 'クルーを探す場合',
          body: [
            '掲載されているクルーの方針と自分の遊びかたが合っているかを、加入前に確認することをおすすめします。特に活動時間帯は、合わないと在籍していてもほとんど一緒に遊べません。',
            '気になるクルーがあれば、記載の連絡先から直接お問い合わせください。',
          ],
        },
        {
          heading: '掲載の流れと注意',
          body: [
            '「募集する」から投稿できます。どなたでも掲載でき、投稿するとそのまま一覧に反映されます。承認待ちはありません。',
            '連絡先は必要最小限にとどめ、本名や住所などの個人情報は書かないでください。金銭のやり取りを伴う募集や、アカウントの売買・代行の勧誘は禁止です。',
          ],
        },
      ],
    },
    en: {
      lead: 'The Crew Recruitment board is a card-style listing board where GTA6 / GTA Online crews recruit members and players look for a crew to join.',
      sections: [
        {
          heading: 'If you are recruiting',
          body: [
            'State the crew name and what the crew is actually for. Whether you grind seriously, focus on racing, centre on car meets and socialising, or just play casually completely changes who applies.',
            'Adding your main play hours, how essential voice chat is, a rough age range, and joining conditions (beginners welcome? multi-crew allowed?) makes it far less likely that someone joins and finds it was not what they expected.',
          ],
        },
        {
          heading: 'If you are looking for a crew',
          body: [
            'Check that a crew\'s direction matches how you actually play before joining. Play hours especially — if they do not line up, being a member will not translate into playing together.',
            'If a crew interests you, contact them directly through the details on their listing.',
          ],
        },
        {
          heading: 'Listing process and cautions',
          body: [
            'Post through the "Create listing" button. Anyone can list, and your post appears immediately — there is no approval queue.',
            'Keep contact details minimal and never post real names or addresses. Listings involving money, and solicitations to buy, sell, or boost accounts, are prohibited.',
          ],
        },
      ],
    },
  },

  // --------------------------------------------------------------------------
  servers: {
    ja: {
      lead: 'FiveMサーバー募集板は、日本語で遊べるFiveM RPサーバーを探したり、自分のサーバーを掲載したりするための一覧です。RP・レース・サバイバルなど、ジャンルで絞り込めます。',
      sections: [
        {
          heading: 'サーバーを探す場合',
          body: [
            '掲載されているサーバーには、どんな街なのかの説明、ジャンル、使用言語、参加用のDiscordなどが載っています。まずジャンルで絞り、気になったサーバーのDiscordを見て、募集状況とルールを確認するのが確実です。',
            'FiveMのサーバーに入るにはPC版のGTA5とFiveM本体が必要です。導入がまだの方は、サイト内の「FiveMの始めかた」で手順を解説しています。初めてRPサーバーに入る日の流れは「初日の過ごしかた」にまとめています。',
            'サーバーごとの雰囲気は、実際に訪問して書いた「FiveMさんぽ日記（サーバー訪問記）」も参考になります。',
          ],
        },
        {
          heading: 'サーバーを掲載する場合',
          body: [
            '「掲載する」からどなたでも投稿できます。サーバー名、どんなRPをする街なのか、ジャンル、参加方法（Discord等）を記入してください。投稿するとそのまま一覧に反映され、承認待ちはありません。',
            '説明文は、他のサーバーとの違いが分かるように書くと参加者が集まりやすくなります。「初心者歓迎」だけではどのサーバーも同じに見えてしまうため、その街ならではの仕組みや遊びかたに触れることをおすすめします。',
          ],
        },
        {
          heading: '掲載のルール',
          body: [
            '実在し、実際に参加できるサーバーのみ掲載してください。開設予定の段階のものや、参加方法が明示されていないものはお断りする場合があります。',
            '掲載後にサーバーを閉じた場合や、参加方法が変わった場合はご連絡ください。古い情報が残っていると、探している人が無駄足になります。',
          ],
        },
      ],
    },
    en: {
      lead: 'The FiveM Server Board is a directory for finding Japanese-language FiveM RP servers, or listing your own. You can filter by genre — RP, racing, survival, and more.',
      sections: [
        {
          heading: 'If you are looking for a server',
          body: [
            'Each listing includes a description of the city, its genre, the language spoken, and a Discord invite for joining. Filtering by genre first, then checking the Discord of anything that looks interesting for its current recruitment status and rules, is the reliable approach.',
            'Joining a FiveM server requires PC GTA5 and the FiveM client. If you have not installed it yet, the "How to install FiveM" guide on this site walks through the steps, and the "First day guide" covers what actually happens the first time you enter an RP server.',
            'For a sense of what individual servers feel like, the Field Notes visit reports are written from actual visits.',
          ],
        },
        {
          heading: 'If you want to list a server',
          body: [
            'Anyone can post through the "Create listing" button. Include the server name, what kind of roleplay the city is built around, its genre, and how to join (Discord, etc.). Your listing appears immediately — there is no approval queue.',
            'Descriptions that make clear how your server differs from others attract more players. "Beginners welcome" makes every server look identical, so it is worth describing the systems and play patterns specific to your city.',
          ],
        },
        {
          heading: 'Listing rules',
          body: [
            'Please list only servers that exist and can actually be joined. Servers still in the planning stage, or with no stated way to join, may be declined.',
            'If you close your server or change how to join, let us know. Stale entries send people looking for a server on a wasted trip.',
          ],
        },
      ],
    },
  },
};

// ============================================================================
//  ツールページの解説。
//  ツール本体はブラウザ内で動く操作UIのため、生HTMLに残るテキストが極端に少なかった
//  （/fivem-gtarp/tools 系は 397〜589字）。使いかたと仕組みの説明を静的に添える。
//  表示は掲示板と同じ components/BoardGuide.tsx（content プロパティで直接渡す）。
// ============================================================================

// ============================================================================
//  固定ページの解説（お問い合わせ等）。
//  /contact はフォーム主体でテキストが少なかった（466字）。窓口としての用途・返信の
//  目安・非公式サイトである旨を静的に添える。表示は components/BoardGuide.tsx。
// ============================================================================

export type PageGuideKey = 'contact';

export const PAGE_GUIDES: Record<PageGuideKey, { ja: BoardGuideContent; en: BoardGuideContent }> = {
  contact: {
    ja: {
      lead: 'お問い合わせフォームから、GTA6 FEED編集部へご連絡いただけます。',
      sections: [
        {
          heading: 'このフォームの用途',
          body: [
            'このフォームは、FiveM/GTARPサーバーの掲載に関するご依頼や、掲示板への投稿の削除・修正のご依頼などの窓口としてご用意しております。そのほかのご連絡も受け付けております。',
          ],
        },
        {
          heading: '返信について',
          body: [
            'いただいたお問い合わせには、通常2〜3日以内にご返信いたします。内容によっては、ご返信までにお時間をいただく場合がございます。ご返信はフォームにご記入いただいた連絡先へお送りいたしますので、入力内容にお間違いがないかご確認のうえ送信してください。',
          ],
        },
        {
          heading: 'お問い合わせ前にご確認ください',
          body: [
            'なお、当サイトはRockstar GamesおよびTake-Two Interactiveとは一切関係のない、非公式のファンサイトです。ゲーム本体やアカウントに関するお問い合わせには対応できかねますので、そちらは各公式サポートへお問い合わせください。',
          ],
        },
      ],
    },
    en: {
      lead: 'Use the contact form to reach the GTA6 FEED editorial team.',
      sections: [
        {
          heading: 'What this form is for',
          body: [
            'This form exists as the point of contact for requests to list a FiveM/GTARP server, and for requests to remove or correct a board post. Other enquiries are welcome as well.',
          ],
        },
        {
          heading: 'About replies',
          body: [
            'We normally reply within two to three days. Depending on the enquiry, a reply may take longer. Replies go to the contact details you enter on the form, so please check them for mistakes before sending.',
          ],
        },
        {
          heading: 'Before you get in touch',
          body: [
            'This site is an unofficial fan site with no connection to Rockstar Games or Take-Two Interactive. We cannot help with enquiries about the game itself or about your account — please contact the relevant official support for those.',
          ],
        },
      ],
    },
  },
};

export type ToolGuideKey = 'tools' | 'image-resize' | 'image-mask';

export const TOOL_GUIDES: Record<ToolGuideKey, { ja: BoardGuideContent; en: BoardGuideContent }> = {
  tools: {
    ja: {
      lead: 'ここに置いているツールは、FiveM/GTARPサーバーの紹介や掲示板への投稿、配信のサムネイル作りなどで「画像をひと手間だけ加工したい」場面のために作ったものです。すべてブラウザの中だけで処理します。',
      sections: [
        {
          heading: '画像がサーバーに送られない仕組み',
          body: [
            'これらのツールは、選んだ画像をアップロードしません。処理はブラウザ上のCanvasで完結し、加工した画像もそのまま端末に保存されます。GTARPのスクリーンショットには、他のプレイヤーの名前やDiscordの表示、ゲーム内のチャットログなどが写り込みやすいため、外部に送信されない形にしてあります。',
            'オフラインでも動作します。ページを一度開いたあとであれば、通信を切っても加工と保存ができます。',
          ],
        },
        {
          heading: 'どんなときに使うか',
          body: [
            'サイズ変更は、掲示板やDiscordの添付サイズ制限に引っかかる画像を縮めたいとき、サーバー紹介用に縦横比を揃えたいときに使います。',
            'マスクは、スクリーンショットの一部を隠したいときに使います。他のプレイヤーのIDや、公開したくない座標・チャット内容を伏せてから共有できます。',
          ],
        },
      ],
    },
    en: {
      lead: 'These tools exist for the moments when you need one quick edit to an image — for a server listing, a board post, or a stream thumbnail. Everything runs inside your browser.',
      sections: [
        {
          heading: 'Why your images never leave your device',
          body: [
            'These tools do not upload the image you select. Processing happens entirely on the browser\'s Canvas, and the edited file is saved straight back to your device. GTARP screenshots easily catch other players\' names, Discord overlays, and in-game chat logs, so nothing is transmitted anywhere.',
            'They work offline. Once the page has loaded, you can disconnect and still edit and save.',
          ],
        },
        {
          heading: 'When to use them',
          body: [
            'Use resize when an image is over the attachment limit on a board or on Discord, or when you want consistent aspect ratios across server listings.',
            'Use mask when you want to hide part of a screenshot — another player\'s ID, coordinates, or chat you would rather not publish — before sharing it.',
          ],
        },
      ],
    },
  },

  'image-resize': {
    ja: {
      lead: '画像のサイズ変更ツールです。長辺のピクセル数を指定して縮小し、WebPまたはJPEGとして保存できます。読み込みから保存まで、画像は端末の外に出ません。',
      sections: [
        {
          heading: '使いかた',
          body: [
            '画像を選ぶかドラッグして読み込み、変更後のサイズを指定して保存するだけです。縦横比は保たれるため、長辺だけを指定すれば短辺は自動で決まります。',
            '保存形式はWebPとJPEGから選べます。同じ見た目ならWebPのほうがファイルサイズが小さくなるため、掲示板やDiscordの添付サイズに引っかかる場合はWebPを試してください。品質のスライダーを下げると、さらに小さくできます。',
          ],
        },
        {
          heading: 'サイズの目安',
          body: [
            '掲示板やDiscordに貼るスクリーンショットであれば、長辺1600px前後あれば十分に見られます。4K解像度で撮ったスクリーンショットは、そのままだと数MBになることが多いため、縮小するだけで扱いやすくなります。',
            'サーバー紹介やサムネイルとして使う場合は、長辺1200px前後にしておくと、表示側で縮小されたときのぼやけが出にくくなります。',
          ],
        },
        {
          heading: '注意点',
          body: [
            '一度縮小した画像を元の大きさに戻すことはできません。元のファイルは残しておいてください。',
            '画像に含まれる撮影情報（Exif）は、変換の過程で失われます。位置情報などを消したい場合には、この挙動が役に立ちます。',
          ],
        },
      ],
    },
    en: {
      lead: 'A resize tool. Set the long edge in pixels, scale the image down, and save it as WebP or JPEG. The image never leaves your device, from load to save.',
      sections: [
        {
          heading: 'How to use it',
          body: [
            'Select or drag in an image, set the target size, and save. Aspect ratio is preserved, so setting the long edge determines the short edge automatically.',
            'You can save as WebP or JPEG. At equivalent visual quality WebP produces smaller files, so try it first if you are hitting an attachment limit on a board or Discord. Lowering the quality slider shrinks it further.',
          ],
        },
        {
          heading: 'Picking a size',
          body: [
            'For screenshots posted to a board or Discord, around 1600px on the long edge is plenty. Screenshots captured at 4K are often several megabytes as-is, and simply scaling them down makes them far easier to work with.',
            'For server listings and thumbnails, around 1200px on the long edge tends to avoid the softness you get when the display scales an oversized image down.',
          ],
        },
        {
          heading: 'Things to know',
          body: [
            'A downscaled image cannot be restored to its original size. Keep the original file.',
            'Capture metadata (Exif) is dropped during conversion. That is useful if you specifically want to strip location data.',
          ],
        },
      ],
    },
  },

  'image-mask': {
    ja: {
      lead: '画像の一部を隠すツールです。隠したい範囲を選ぶと、その部分をぼかしたり塗りつぶしたりできます。処理はブラウザ内で完結し、画像はアップロードされません。',
      sections: [
        {
          heading: '使いかた',
          body: [
            '画像を読み込み、隠したい範囲をドラッグで囲んで適用し、保存します。範囲は複数指定できるため、名前欄とチャット欄を別々に隠すといった使いかたができます。',
            '適用のしかたは、ぼかしと塗りつぶしから選べます。ぼかしは元の雰囲気を残したいとき、塗りつぶしは確実に読めなくしたいときに向いています。',
          ],
        },
        {
          heading: 'GTARPのスクリーンショットで隠したほうがよいもの',
          body: [
            'GTA5 / FiveM のスクリーンショットには、意図せず他人の情報が写り込みます。他のプレイヤーの名前やIDの表示、ボイスチャットの参加者一覧、Discordのオーバーレイ、ゲーム内チャットのログなどは、共有前に確認することをおすすめします。',
            'RPサーバーでは、まだ公開されていない設定や進行中の事件に関わる情報が画面に出ていることもあります。訪問記やレポートを書く場合は、そのサーバーのルールに沿って伏せる範囲を判断してください。',
            '自分の情報にも注意が必要です。接続先のサーバーアドレス、Discordのユーザー名、実況ソフトの通知などが端に写っていることがあります。',
          ],
        },
        {
          heading: '注意点',
          body: [
            'ぼかしは強度が弱いと元の文字が推測できてしまう場合があります。確実に読めなくしたい情報は、塗りつぶしを使ってください。',
            '保存後の画像には隠した情報は含まれませんが、加工前の元ファイルには残っています。共有するのは保存後のファイルであることを確認してください。',
          ],
        },
      ],
    },
    en: {
      lead: 'A tool for hiding parts of an image. Select the area you want to obscure and blur or fill it. Everything runs in your browser — the image is never uploaded.',
      sections: [
        {
          heading: 'How to use it',
          body: [
            'Load an image, drag to select the area you want hidden, apply, and save. You can select multiple areas, so you can hide a name field and a chat panel separately.',
            'Choose between blur and solid fill. Blur keeps the look of the original; fill is the right choice when something must be unreadable.',
          ],
        },
        {
          heading: 'What to hide in GTARP screenshots',
          body: [
            'GTA5 / FiveM screenshots pick up other people\'s information without you meaning to. Player names and ID displays, voice chat participant lists, Discord overlays, and in-game chat logs are all worth checking before you share.',
            'On RP servers, the screen may show setting details that have not been revealed yet, or information tied to an ongoing storyline. If you are writing a visit report, judge what to obscure according to that server\'s rules.',
            'Watch your own information too. Server addresses, your Discord username, and streaming-software notifications often sit in a corner of the frame.',
          ],
        },
        {
          heading: 'Things to know',
          body: [
            'A weak blur can leave the original text guessable. Use solid fill for anything that must genuinely be unreadable.',
            'The saved image does not contain the hidden information, but your original file still does. Make sure the file you share is the saved one.',
          ],
        },
      ],
    },
  },
};
