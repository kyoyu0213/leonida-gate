import type { WikiPage } from './types';

// ㉟ 公式映像（トレーラー1・2、An Extended Look）で使われた楽曲のまとめ。確度はラベル記号ではなく
// 地の文の言い回しで示す（「確定情報」「公式サイトも使用を告知」「映像の音声から同定」
// 「公式発表なし」「リーク由来・非公式」など）。
export const MUSIC: WikiPage = {
  slug: 'music',
  updated: '2026-09-18',
  intro:
    'このページでは、Rockstarが公開したGTA6の公式映像で実際に使われた楽曲をまとめます。トレーラーで流れた曲はRockstar自身が選曲したものなので信頼度は高い一方、曲名・アーティスト名の多くはRockstarが一覧を公表したわけではなく、各メディアやファンが映像の音声から同定したものです。2026年9月、Rockstarは公式サウンドトラックアルバム『Grand Theft Auto VI: The Album』を発表しました（下記）。一方で、ゲーム内ラジオ局の構成や全収録曲の詳細は、まだ公式に発表されていません。',
  infobox: {
    rows: [
      { label: 'トレーラー1 主題歌', value: 'Love Is a Long Road ／ Tom Petty' },
      { label: 'トレーラー2 主題歌', value: 'Hot Together ／ The Pointer Sisters' },
      { label: 'Extended Look', value: 'ゲーム内で14曲を確認（各メディア同定）' },
      { label: 'ラジオ局', value: '公式未発表（出回る局名はリーク由来）' },
      {
        label: 'サウンドトラック',
        value: '公式アルバム『GTA VI: The Album』発表（全34曲・2026/11/19／先行6曲配信中）',
      },
      { label: '注記', value: '曲名の多くは映像音声からの同定' },
    ],
  },
  sections: [
    {
      heading: '公式サウンドトラック『Grand Theft Auto VI: The Album』',
      lead: '2026年9月17日、RockstarとAtlantic Recordsが共同で、GTA6の公式サウンドトラックアルバムを正式発表しました。トレーラーの使用曲（下記）とは別に、ゲームのために作られたオリジナルのアルバムです。',
      items: [
        {
          text: '既存曲の寄せ集めではなく、バイスシティとレオニダ（Leonida）の世界観を表現するために作られた全34曲のオリジナル楽曲で構成されます。リリース日はゲーム本体と同じ2026年11月19日で、発表と同日に各ストリーミングでの事前保存とCD・レコードの予約が始まりました。発表直前の9月15日ごろに複数アーティストがGTA6を思わせるビジュアルを一斉投稿しており、これがアルバムのティザーだったことが後に判明しました。',
        },
        { text: '発表と同時に、34曲のうち最初の6曲が各ストリーミングで先行配信されました。' },
        { text: 'Yung Lean「That’s It」(feat. Future & Metro Boomin)' },
        { text: 'Travis Scott「RHYNO」' },
        { text: 'CA7RIEL & Paco Amoroso, PinkPantheress, Fred again.., Étienne de Crécy「Sexy Magic」' },
        { text: 'Morgan Wallen「Last Thing You Need」' },
        { text: 'Rauw Alejandro「Macacoa 2000」' },
        { text: 'Keith Richards「Bright Lights, Big City」' },
        {
          text: '参加アーティストはヒップホップ、カントリー、ラテン、エレクトロニック、ロックにまたがる顔ぶれです。特にTravis Scott「RHYNO」は、Daft PunkのGuy-Manuel de Homem-Christoがプロデュースを手がけたと複数の音楽メディアが報じています（Rockstar公式ページでの明記は本稿では確認できていません）。',
        },
        {
          text: '物理版も展開されます。米国公式ストアでは3種類（2026年9月時点の米国公式ストア価格）：CD＝19.98ドル、通常盤レコード＝49.98ドル（透明マゼンタ＋青スプラッターの2枚組）、限定盤レコード＝124.98ドル（青い液体を封入した透明マゼンタ2枚組＋限定アート）。公式ストアは米国外からの注文も受け付けており、FAQでは国際配送で到着まで最大8週間かかる場合があると案内されています。Best Buy・Walmart・Amazon・Target・Blood Records・独立系レコード店など複数の販売店でも、異なるカラー盤やアートの限定盤が予定されています。',
        },
        {
          text: '公開されたのは6曲のみで、残る28曲の曲目・アーティストは本稿執筆時点（2026年9月）で未公開です。『The Album』はゲームのために作られたオリジナル・アルバムであり、ゲーム内ラジオ局の全プレイリストとは別物である点に注意してください。',
        },
      ],
      note: '価格・発送条件は変わる可能性があります。ゲーム内ラジオ局や全収録曲の詳細は今後の発表待ちです。',
    },
    {
      heading: 'トレーラー1（2023年12月）',
      lead: 'トレーラー1で全編に流れる楽曲は1曲で、これは確定情報です。',
      items: [
        {
          term: 'Love Is a Long Road ／ Tom Petty（トム・ペティ）',
          text: '1989年のアルバム『Full Moon Fever』収録。トム・ペティ公式サイトも使用を告知しており確度は最高。フロリダ出身のペティの曲を、フロリダをモデルにした州レオニダが舞台の第1弾に使った点、困難な関係を歌う歌詞が主人公たちの関係を暗示する点が繰り返し語られています。',
        },
      ],
    },
    {
      heading: '「Love Is A Long Road」が選ばれた理由',
      lead: 'トレーラー1を飾ったこの曲には、選曲以上の意味があると開発者が明かしています。',
      items: [
        {
          text: 'この曲はトム・ペティが1989年のアルバム『Full Moon Fever』で発表したもので、共作者はハートブレイカーズのギタリスト、マイク・キャンベル（Mike Campbell）です。キャンベルはこの曲がバイクから着想を得たもので、「バイクがギアを切り替えるような感覚」があると語ったとされ、うねるようなリフの推進力に反映されていると評されます。',
        },
        {
          text: 'ロックスターとトム・ペティの縁は今回が初めてではありません。『GTA San Andreas』（2004年）のクラシックロック局 K-DST では、同じくペティの「Runnin\' Down A Dream」が流れており、シリーズがペティの曲を使うのは二度目にあたるとされます（San Andreas での使用はファンのデータベース由来で、公式サウンドトラックの一次資料での確認ではありません）。',
        },
        {
          text: 'そして今回、ロックスター・ノースの開発責任者ロブ・ネルソン氏は取材で、Trailer 1の時点ではゲームはまだ完全には固まっておらず、このトム・ペティの曲が「本当の意味でのミッション・ステートメント」＝作品が目指す方向を示す“導きの光”のようなものだったと語りました。開発チームにとっては、単なるトレーラー用のBGMではなく、進むべき道そのものを表す曲だったことになります。この発言は開発の経緯とも重なります（開発の歩みページも参照）。',
        },
        {
          text: '歌詞は、求め合いながらも簡単には離れられない複雑な関係と、その切実さを描いたものと読めます。長い道のりになぞらえた愛のもつれを主人公たちの関係と重ねて解釈する声も多くありますが、これは受け手の側の解釈で、開発側が歌詞と物語を結びつけて説明したわけではありません。',
        },
      ],
    },
    {
      heading: 'トレーラー2（2025年5月）',
      lead: 'トレーラー2ではメインテーマ1曲に加え、運転シーンのカーラジオから複数曲が短く流れます。メイン曲以外はRockstarの公式リストではなく、各メディアが音声から同定したものです。',
      table: {
        head: ['曲名', 'アーティスト', '場面・備考'],
        rows: [
          ['Hot Together', 'The Pointer Sisters（1986年）', 'トレーラーの主軸（メインテーマ）'],
          ['Thunder Island', 'Jay Ferguson（1977年）', '冒頭付近'],
          ['Child Support', 'Zenglen（ハイチのコンパ・バンド）', 'カーラジオ'],
          ['Everybody Have Fun Tonight', 'Wang Chung（1986年）', 'カーラジオ'],
          ["Talkin' to Myself Again", 'Tammy Wynette（1987年）', 'カーラジオ（カントリー）'],
        ],
      },
      note: 'メイン曲「Hot Together」はトレーラー2公開後に再生数が大きく伸びた目玉曲です。カーラジオの4曲は映像の音声から同定されたものです。',
    },
    {
      heading: 'An Extended Look（2026年8月27日・Netflix公開）',
      lead: '約26分のゲームプレイ映像では、ゲーム内のカーラジオや場面BGMとして多くの曲が確認されました。トレーラー用の編集曲ではなく、プレイ中に流れた曲を各メディア・ファンが聞き取って同定したもので、Rockstarが公式に曲目を公開したわけではありません。以下は複数メディアで一致して報じられている14曲です。',
      table: {
        head: ['曲名', 'アーティスト'],
        rows: [
          ['Pop Bottles', 'Birdman feat. Lil Wayne'],
          ['Pound Town', 'Sexyy Red feat. Tay Keith'],
          ['Skrilla', 'Kodak Black'],
          ['Let Your Love Flow', 'The Bellamy Brothers'],
          ['Love Bites', 'Def Leppard'],
          ['People Are People', 'Depeche Mode'],
          ["But I Think It's a Dream", 'Captain & Tennille'],
          ['Cars and Girls', 'Prefab Sprout'],
          ['Off the Grid', '!!!（Chk Chk Chk）feat. Meah Pace'],
          ['Devil Woman', 'Cliff Richard'],
          ['Se Me Nota (Agárrame)', 'Chimbala & Omega'],
          ['Against All Odds (Take a Look at Me Now)', 'Phil Collins'],
          ["Mine O' Mine", 'Aluna & Jayda G'],
          ['Inner Light', 'Elderbrook with Bob Moses'],
        ],
      },
      note: '曲順・時間はメディアが付けた目安で、数秒ずれる場合があります。',
    },
    {
      heading: 'ラジオ局・ゲーム内使用曲（未発表）',
      lead: '正式なサウンドトラックは『GTA VI: The Album』として発表済みですが（上記セクション参照）、ゲーム内ラジオ局の一覧・収録アーティスト・ゲーム中に実際に流れる曲目は、2026年9月時点でRockstarから公式発表されていません。以下は看板・衣装からの推測や2026年のリーク映像を出所とするもので、公式情報ではなく発売までに変わる可能性があります。',
      items: [
        {
          text: '出回っているラジオ局名（すべて非公式・リーク由来）：V-Rock、Back Country Radio、Stockyard FM、Symphony FM、CircoLoco Records Radio、Dirty South Classics、Emotion 98.3、Worldwide FM、Kaleidoscope FM など。※「V-Rock」は『Vice City』からの復活局とされ、トレーラー2のジェイソンのTシャツからも存在が推測されています。',
        },
        {
          text: '関与を示唆したと報じられるアーティスト（未確認）：T-Pain、Ski Mask the Slump God など。Rockstarは確認していません。',
        },
      ],
    },
    {
      heading: '注意点',
      items: [
        {
          text: '「Thunder Island」はトレーラー2の曲です（トレーラー1の曲とする記載は誤り）。トレーラー1はTom Pettyの1曲のみです。',
        },
        {
          text: "トレーラー2のAmmu-Nation CMで「I Love Rock 'n' Roll」が流れたという説がありますが、確定情報ではないため掲載していません。",
        },
        { text: '出所が不確かな「テーマ曲」情報が一部にありますが、裏付けが取れないため載せていません。' },
        { text: 'トレーラーで使われた曲が、そのままゲーム本編に収録される保証はなく、差し替えの可能性があります。' },
      ],
    },
  ],
  sources: [
    'Tom Petty 公式（トレーラー1使用告知）',
    'NME（トレーラー1・2の曲）',
    'GamesRadar（サウンドトラックまとめ）',
    'PCGamesN（トレーラー別ソングリスト）',
    'GTABase（確定曲・ラジオ局）',
    'GTA BOOM（サントラ・トラッカー）',
    'SVG（Extended Look 楽曲）',
    'gta6bible（Extended Look 全曲）',
    'GameRant（Extended Look 曲・時間）',
    'Rockstar Newswire（An Extended Look 公式告知）',
    'Kotaku（リーク由来の曲・ラジオ局／公式未発表の注意）',
    'GamesRadar（Nelson "mission statement" 発言）',
    'American Songwriter（Mike Campbell／バイク着想）',
    'Rockstar Newswire（Grand Theft Auto VI: The Album 発表）',
    'Rockstar Games 公式音楽ページ（曲名・feat. 表記）',
    'gtavi-thealbum.com 公式ストア（物理版3種・価格・国際配送FAQ）',
    'Consequence（先行6曲・残り28曲未公開）',
    'Complex（アルバム参加アーティスト）',
    'IBTimes（RHYNO＝Guy-Manuel de Homem-Christo プロデュース報道）',
    'Insider Gaming（物理版3種・価格）',
  ],
};
