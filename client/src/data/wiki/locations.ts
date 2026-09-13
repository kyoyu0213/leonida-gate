import type { WikiPage } from './types';

export const LOCATIONS: WikiPage = {
  slug: 'locations',
  updated: '2026-09-13',
  intro: 'このページは地域→スポットの順に整理しています。各地域の地理的な概観は「マップ」を参照してください。',
  infobox: {
    rows: [
      { label: '対象', value: 'レオニダ州の名前付きスポット' },
      { label: '地域', value: 'Vice City／Keys／Grassrivers／Port Gellhorn／Ambrosia／Mount Kalaga【公式】' },
      { label: 'ランドマーク例', value: 'VC国際空港・Sahara Arena・Starlet Motel【公式】' },
      { label: '注記', value: '噂の地区・呼称は【考察】' },
    ],
  },
  sections: [
    {
      heading: 'このページの読み方',
      items: [
        {
          text: 'トレーラーに「映った」建造物と、「名称が確認された」ものを区別しています。噂の地区名・店名は【考察】です。',
        },
        {
          text: '複数のまとめサイトが、噂由来の名称を "Confirmed" と誤って表記している点に注意してください。',
        },
        {
          text: '【取材】実際に足を踏み入れて探索できる屋内（インテリア）はGTA5から大幅に増えるとされ、Rob Nelson氏は入れる建物の数を「膨大」と表現しています。ジムの更衣室・セーフハウス・店舗・ホテル・宝飾店など多様な屋内が確認されていますが、すべての建物に入れるわけではありません。【考察】「数百」「700以上」「約7割が入れる」といった具体的な数字はリークやファンの推定で、公式に裏づけられた数値ではありません。',
        },
      ],
    },
    {
      heading: 'バイスシティ（マイアミがモデル）',
      items: [
        {
          term: '地区（確認済み）',
          text: '【公式】Ocean Beach / Ocean Drive / Vice Beach / Downtown / Southside / Little Cuba（Little Havana）/ Viceport（VC Port）。',
        },
        {
          term: '地区（噂・主に2022年リーク由来）',
          text: '【考察】Little Haiti / Leaf Links / Rockridge / Starfish Island / Venetian Islands / South Beach / Washington Beach 等。',
        },
        {
          term: 'ランドマーク',
          text: 'Vice City International Airport【公式】／Vice City Port【公式】／Sahara Arena【公式】（マイアミのアリーナ風）／大型の放送塔（建造物は映像で確認【公式】。ただし「South Tower」という名称はファン呼称【考察】）／「Monument of Leonida」（名称はファン呼称【考察】）／Malibu Club・Vercetti Estate（原作からの再登場は噂【考察】）。',
        },
        {
          term: '店舗・ビジネス（トレーラー等で確認）',
          text: '【公式】Rideout Customs（カスタム）/ Sara\'s Unisex Salon / PTT YOUNGIN$（闇物資）/ Jack of Hearts（ストリップクラブ）/ Sinfrontera National Bank（強盗シーン）/ Only Raw Records / Ammu-Nation / Sandeep Plaza / Effluvia（ルーフトップバー）/ Zeke\'s Gadgets / Lombank / Diamond Dawgs（宝飾）/ Ocean View Hotel / Hoodwinks Liquor Bar ほか。',
        },
      ],
    },
    {
      heading: 'レオニダ・キーズ（フロリダ・キーズがモデル）',
      items: [
        { term: 'セーフハウス', text: '【公式】ジェイソン＆ルシアの初期セーフハウス（トレーラー2の住居）。' },
        {
          term: '店舗',
          text: '【公式】Stock 305（衣料）/ Electric Fang Tattoo / The Rusty Anchor（レストラン）/ One-Eyed Willie\'s（改造ショップ）/ Brian\'s Boat Works & Marina（密輸拠点）。',
        },
        {
          term: 'エリア名',
          text: 'Key Lento / Airward Key 等は要検証【考察】。Watson Bay は【公式】。',
        },
      ],
    },
    {
      heading: 'グラスリバーズ（湿地）',
      items: [
        { text: '【公式】ソーグラス湿原・マングローブ・エアボート・ワニ・ヘリによる追跡。' },
        { term: 'Paradise Garage', text: '【公式】Watson Bay 近辺のガレージ（Ultimate Edition の特典）。' },
      ],
    },
    {
      heading: 'ポート・ゲルホーン（湾岸の工業港町）',
      items: [
        { term: 'Starlet Motel', text: '【公式】トレーラー1の拠点。' },
        { term: 'Delights Cabaret', text: '【公式】キャバレー。' },
        { term: '港湾', text: '【公式】貨物ターミナル・倉庫街・埠頭のクレーン。' },
      ],
    },
    {
      heading: 'アンブロシア（内陸・田園）',
      items: [
        { term: 'Allied Crystal', text: '【公式】製糖工場。' },
        { term: 'Lake Leonida', text: '【考察】内陸の湖。名称はリーク・解析由来で、Rockstarの公式素材では確認されていません（「マップ」ページと同じ扱い）。' },
        { term: '沿道の施設', text: '保安官事務所・ハイウェイ沿いのダイナー等【公式/考察】。' },
      ],
    },
    {
      heading: 'マウント・カラガ国立公園（森林高地）',
      items: [
        { text: '【公式】山岳森林・渓谷・狩猟トレイル。' },
        { term: 'Leonida Penitentiary', text: '【公式】刑務所（トレーラー2）。' },
      ],
    },
    {
      heading: 'セーフハウス／拠点まとめ',
      items: [
        { term: '住居', text: 'キーズの初期セーフハウス【公式】／Starlet Motel【公式】。' },
        {
          term: 'ガレージ',
          text: '【取材】購入可能（Paradise Garage、Shore Court Garage 等＝特典系）。',
        },
        { term: '解放条件', text: '【取材】住居系はストーリー進行で解放される仕様と報道されています。' },
      ],
    },
  ],
  sources: [
    'GTABase（map / properties）',
    'Beebom',
    'Gfinity（store guide）',
    'GTA Intel（locations）',
    'RED Reactions（Trailer 2 breakdown）',
    'Cyberleek',
    'GTAVISpot',
    'ExploreGTA6',
    'Notebookcheck（tower）',
    'techtroduce（入れる建物・"数百"は未検証）',
  ],
};
