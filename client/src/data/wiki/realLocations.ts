import type { WikiPage } from './types';

// ㊳ 映像に映る建物・施設と、現実のマイアミ/フロリダの照合まとめ。
// 編集方針：
//  - 映像のタイムスタンプ（分:秒の時間表記）は載せない（不正確なため）。
//  - 個々の建物・施設で Rockstar が公式にモデルと認めたものは無い。公式に確定しているのは
//    「バイスシティ＝マイアミ／州レオニダ＝フロリダ」等の大枠だけで、個別スポットはすべて
//    「コミュニティによる特定・有力候補・考察」の水準で書く。
//  - 確度はラベル記号ではなく地の文の言い回しで示す。
export const REAL_LOCATIONS: WikiPage = {
  slug: 'real-locations',
  updated: '2026-09-13',
  intro:
    'GTA6の舞台バイスシティが現実のマイアミをモデルにしていることは広く知られています。ただし、以下で挙げる個々の建物・施設の「実在モデル」は、ファンコミュニティが映像と現実の風景を照合して割り出したもので、Rockstarが公式に「この建物がモデル」と認めたものは一つもありません。公式に確定しているのは「州レオニダ＝フロリダ」「バイスシティ＝マイアミ」といった大枠だけです。個別スポットは「よく似ている」「同じ場所と思われる」という水準の情報として読んでください。',
  infobox: {
    rows: [
      { label: '街のモデル', value: 'マイアミ（州レオニダ＝フロリダ）' },
      { label: '個別モデル', value: 'すべてコミュニティ特定（公式のモデル認定は無し）' },
      { label: '特定手法', value: '映像と現実の照合。取り壊し済みの建物は過去のStreet Viewも活用' },
      { label: '代表例', value: 'W South Beach／Signature Aviation／Belmar Condominium など' },
      { label: '確度', value: '特定〜有力候補が中心（断定はしない）' },
      { label: '注記', value: 'Rockstarが公式にモデルと認めた個別スポットは現時点でゼロ' },
    ],
  },
  sections: [
    {
      heading: '街全体の下敷き（大枠）',
      lead: 'ここは映像・地形から明確で、コミュニティ間でもほぼ争いがありません。',
      items: [
        { text: 'バイスシティ＝マイアミ、州レオニダ＝フロリダ（シリーズの伝統でもあります）。' },
        { text: '湿地グラスリバーズ＝エバーグレーズ、南の島々レオニダ・キーズ＝フロリダ・キーズ。' },
        { text: 'サウスビーチ／オーシャンドライブのアールデコとネオンの通りも、マイアミの実在エリアが下敷きとされています。' },
      ],
    },
    {
      heading: 'Extended Lookで話題になった個別スポット',
      lead: '以下はいずれもコミュニティによる特定で、住所は実在しますが、ゲーム内との対応はファンの照合です。Rockstarの公式認定ではありません。',
      items: [
        {
          term: '高級ホテル「Y」← W South Beach Hotel（2201 Collins Avenue, マイアミビーチ）',
          text: 'ブランド名を W→Y にもじった海沿いのホテル。実在の W South Beach として特定されており、有力です。（ゲーム内の正式名は W をもじった名称と見られ、「Y City Hotel」は通称レベル）',
        },
        {
          term: '島の銀行 ← Bank of America（1108 Kane Concourse, ベイ・ハーバー・アイランズ）',
          text: '同住所に実在の支店があり、運河に囲まれた立地。ゲーム内対応の裏取りは限られ、有力候補の段階です。',
        },
        {
          term: '島の警察署 ← Indian Creek Village 公安局（Public Safety Department／9080 Bay Drive）',
          text: '住所は実在（正式には「警察署」でなく「公安局」）。対応はコミュニティの指摘で、有力候補の段階です。',
        },
        {
          term: '水辺の島の街並み ← ベイ・ハーバー・アイランズ一帯',
          text: '運河・道路配置、低層コンドミニアム群の一致が広く指摘されています。ただし「Bay Harbor Club」など特定の1棟までの断定は候補の域です。',
        },
        {
          term: 'プライベートジェット施設 ← Signature Aviation（5700 NW 36th St、マイアミ国際空港の北側）',
          text: 'ゲーム内 Vice City International Airport（＝マイアミ国際空港）の格納庫と対応づけられており、住所も正確で有力です。',
          image: {
            src: '/images/news/gta6-extended-look-impressions/window-light-airport.webp',
            alt: '空港ラウンジから見える駐機中の小型ジェット',
            caption: 'Extended Look の映像より（実在施設との対応はコミュニティの照合）',
            credit: 'Rockstar Games（An Extended Look 映像より）',
          },
        },
        {
          term: '海沿いの段差状の建物 ← 1500 Ocean Drive（マイアミビーチ）',
          text: 'マイケル・グレイヴス設計。白い段状の外観と青緑（ティール）のアクセントが特徴で、建物の一致は有力です。',
        },
        {
          term: 'ジェイソン／ルシアのアパート ← Belmar Condominium（419 NE 19th St, エッジウォーター地区）',
          text: '2022年頃まではストリートビューに残っていましたが、その後取り壊されて現存しません。マッピング系コミュニティが過去のストリートビュー画像から位置を割り出し、複数メディアも報道しました。現存しないため過去画像とゲーム映像を並べて比較でき、今回の照合の中でも特に「研究感」のあるスポットです。',
        },
        {
          term: 'ベネチアン・コーズウェイの料金所 ← Venetian Causeway（1926年開通）',
          text: 'スペイン風の赤瓦屋根とアーチ状ゲート、跳ね橋を含む構成の再現がコミュニティで広く指摘されています。',
          image: {
            src: '/images/news/gta6-extended-look-impressions/venetian-causeway-toll-plaza.webp',
            alt: '赤瓦屋根とアーチ状のゲートが並ぶゲーム内の料金所',
            caption: 'Extended Look の映像より（実在施設との対応はコミュニティの照合）',
            credit: 'Rockstar Games（An Extended Look 映像より）',
          },
        },
      ],
    },
    {
      heading: 'トレーラー由来の一般的な照合（参考）',
      lead: 'トレーラー段階から指摘されている、より広いエリア単位の照合です。',
      items: [
        { text: 'サウスビーチ／オーシャンドライブ（アールデコ、ネオン、トレーラー1のビーチ・夜のドライブ）。' },
        {
          text: 'ウィンウッド（Wynwood Walls, 2516 NW 2nd Ave）→ ゲーム内ストックヤードに対応とされます。※壁画は既存作品の複製ではなく、Rockstarが実在アーティスト多数に描かせたオリジナルと見られます。',
        },
        { text: 'ブリッケル／ダウンタウンの高層ビル群。' },
        { text: 'エバーグレーズ → グラスリバーズ（ほぼ自明の対応）。' },
        { text: 'フロリダ・キーズ／セブンマイル・ブリッジ（トレーラー2の長い橋）。' },
        {
          text: 'キーラーゴのバー Caribbean Club — トレーラー2のバーのモデルとする指摘がありますが、主にSNS上の個人の指摘で、似ているという考察の域です。',
        },
      ],
    },
    {
      heading: '読み方の注意',
      items: [
        {
          text: 'ここで挙げた対応は、Rockstar公式のモデル認定ではありません。公式なのは「バイスシティ＝マイアミ／レオニダ＝フロリダ」という大枠だけです。',
        },
        {
          text: '住所は実在しますが、ゲーム内との対応はファンの照合であり、有力なものから「似ている」という段階まで確度に幅があります。',
        },
        { text: '発売後に実際のゲーム内で確認できれば、対応の確からしさもはっきりしていく見込みです。' },
      ],
    },
  ],
  sources: [
    'WikiGTAVI（ロケーション照合）',
    'GTAVice.net（住所付きランドマーク照合）',
    'Dexerto（実在ロケーションまとめ・Belmar）',
    'Miami New Times（GTA6のマイアミ名所マップ）',
    'The Miami Guide（実在ロケーション）',
    'ScreenRant（実在ロケーション）',
    'Hoodline（Belmar Condominium 取り壊し）',
    'Kotaku（Belmar アパート特定）',
    'Michael Graves Architecture（1500 Ocean Drive）',
    'Wikipedia（Venetian Causeway／Bay Harbor Islands）',
    'Shacknews（壁画は実在アーティストのオリジナル）',
  ],
};
