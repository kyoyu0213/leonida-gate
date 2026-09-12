import type { WikiPage } from './types';

export const VEHICLES: WikiPage = {
  slug: 'vehicles',
  updated: '2026-09-13',
  intro: 'GTA6の車両は架空メーカー名（パロディ）で登場します。現実の元ネタ車種はRockstarが公表していないため、すべて【考察】として扱います。また「トレーラーに映った」ことと「車名が確定した」ことを区別しています。',
  infobox: {
    rows: [
      { label: '確認台数', value: '約272台（ファン集計・2026年9月時点）【取材】【考察】' },
      { label: '内訳', value: '新規90台超＋過去作から復帰【取材】' },
      { label: 'メーカー', value: '架空（パロディ）【公式】' },
      { label: 'カスタム', value: 'Rideout Customs【公式】（改造内容は未公開【考察】）' },
      { label: '参考', value: 'GTA5は発売時252台' },
    ],
  },
  sections: [
    {
      heading: '総数について',
      items: [
        {
          text: '【取材/考察】ファンの集計（GTA Base、2026年9月時点）では、公式素材から約272台（うち90台超が新規）が確認されています。集計サイトによって146〜294台と幅があります。',
        },
        {
          text: '公式の総数発表やデータマインはまだ存在しません。参考までに、GTA5は発売時点で252台でした。',
        },
      ],
    },
    {
      heading: '乗用車',
      lead: '車名が確定しているものは【公式】、現実の元ネタは【考察】です。',
      items: [
        {
          term: 'スポーツ／スーパー',
          text: 'Pfister Comet S2 Cabrio（ポルシェ911）／Grotti Cheetah Classic（テスタロッサ）／Bravado Banshee（バイパー）／Invetero Coquette（コルベット）ほか。',
        },
        {
          term: 'セダン／日常',
          text: 'Vapid Stanier／Obey Tailgater（アウディ系）／Karin Intruder（日産系・諸説あり）／Declasse Tulip M-100（70年代のマリブ/シェベル）。',
        },
        {
          term: 'マッスル／クラシック',
          text: 'Vapid Creado（ジェイソン所有）／Bravado Gauntlet 系（チャレンジャー）／Albany Buccaneer Custom（ローライダー）／Karin Futo（AE86）。',
        },
        {
          term: 'SUV／ピックアップ／オフロード',
          text: 'Enus Jubilee（カリナン系）／Vapid Sandking XL／Landstalker XL（ナビゲーター）／Nagasaki Outlaw（UTV）／モンスタートラック（Thrillbilly Mud Club）。',
        },
      ],
      note: '※括弧内の元ネタは、いずれも「〜がモデルとされる【考察】」の意味です。集計サイト間で食い違いがあるため、断定はしていません。',
    },
    {
      heading: 'バイク',
      items: [
        {
          text: 'Principe Alvino V1【公式】／Nagasaki Sanchez【公式】／Dinka・Pegassi 系【考察】。二輪とATVで10台以上との集計があります【取材】。',
        },
      ],
    },
    {
      heading: 'ボート・水上',
      items: [
        {
          text: 'Shitzu Squalo【公式】／Speedophile Seashark【公式/考察】／Nagasaki Dinghy【公式/考察】／警察艇【公式】。',
        },
        {
          text: 'ヨット・高速艇・フェリー・エアボート・カヤック等【公式映像＋考察】。ボートとジェットスキーで12台前後とされます【取材】。',
        },
      ],
    },
    {
      heading: '航空機',
      items: [
        {
          text: 'ヘリ約6機（警察ヘリを含む）・固定翼機約6機【取材】。トレーラーにはヘリの飛行シーンがあります【公式】。水上機の存在も示唆されています【考察】。',
        },
      ],
    },
    {
      heading: 'その他の車両',
      items: [
        { term: '自転車', text: '【公式】' },
        {
          term: '公共交通',
          text: '空港シャトルバス Brute Shuttle【公式】、トラム／電車【公式映像＋考察】。',
        },
        { term: '緊急車両', text: '覆面パトカー・SUVパトカー等、計11台前後【取材】。' },
        { term: 'レッカー', text: '【公式/考察】' },
      ],
    },
    {
      heading: 'カスタム',
      items: [
        {
          text: '【公式】Rideout Customs はショップの存在が確認されています（公式スクリーンショットに作業場）。',
        },
        {
          text: '【考察】ただし改造メニュー・価格・ハイドロ／ドンク／エンジンスワップ等の中身は未公開です。トレーラーには既にカスタム車が登場しており、Benny\'s 相当の深いカスタムが示唆されています。',
        },
      ],
    },
  ],
  sources: [
    'GTA Base（vehicles / boats）',
    'GTA BOOM',
    'GamesRadar',
    'DriveSpark',
    'Retrogems',
    'GTA6-news（Rideout）',
    'Kotaku（272台の集計）',
    'Gamerant',
  ],
};
