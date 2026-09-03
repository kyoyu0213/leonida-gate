// ============================================================================
//  Leonida Gate - ニュース記事データ（ここだけ編集すればOK）
// ============================================================================
//
//  ▼ 記事を追加するには：
//     下の newsArticles 配列の先頭に、新しいオブジェクトを1つ足すだけです。
//     （一覧・詳細ページの両方に自動で反映されます）
//
//  ▼ 各項目の意味：
//     id              : 記事ごとの固有番号。重複しない数字を付けてください。
//     title           : 記事タイトル
//     description     : 一覧カードに出る短い説明（1〜2文）
//     fullContent     : 詳細ページの本文。空行（改行2つ）で段落が分かれます。
//     icon            : カードに出る絵文字（1文字）
//     category        : 'official'（公式発表） / 'leak'（リーク） / 'analysis'（考察）のいずれか
//     date            : 'YYYY-MM-DD' 形式の日付
//     source          : 出典の名前（例：'Rockstar Games Official'）
//     sourceUrl       : 出典リンク。リンクが無いときは '#' にすると「出典を見る」ボタンが消えます。
//     relatedArticles : 詳細ページ下部に出す関連記事の id を配列で（例：[2, 8, 10]）
//
//  ※ 色とステータス表示（ACTIVE等）は category から自動で決まります（下の CATEGORY_CONFIG）。
//     編集する必要はありません。
// ============================================================================

// ============================================================================
//  非表示にする記事ID（削除ではなく一時的に配信から外す）
// ----------------------------------------------------------------------------
//  ▼ これは何か
//     ここに id を入れた記事は、記事データ・本文・画像を残したまま、
//     サイト上のあらゆる経路から外れる：
//       - ビルド        … prerender-og が /news/<id> の静的HTMLを生成しない
//       - sitemap       … scripts/generate-sitemap.mjs が除外（EXCLUDE_IDS と連動）
//       - 一覧・トップ  … newsByDate から外れる（Home / NewsList）
//       - 記事ページ    … getArticleById が undefined を返す
//       - 関連記事      … 残す記事の relatedArticles からも自動で消える
//       - 検索          … Search が visibleNewsArticles を見る
//       - URL           … vercel.json が /news/<id> を /fivem-gtarp へ 302（一時）
//
//  ▼ なぜ非表示にしているか（2026-07-27）
//     AdSense の「有用性の低いコンテンツ」判定を3回受けたため、GTA6発売前の
//     リーク・考察系の記事を一時的に配信から外し、GTARP系（掲示板・体験記・
//     FiveMガイド）と検証済みの公式情報で審査を通す方針。
//
//  ▼ 元に戻すには（GTA6発売＝2026年11月以降を想定）
//     1. この配列から戻したい id を消す（配列を空にすれば全記事が復活）
//     2. scripts/generate-sitemap.mjs の EXCLUDE_IDS から同じ id を消す
//        （17・29 は別理由の除外なので残すこと）
//     3. vercel.json の「news 一時非表示」ブロックの 302 リダイレクトを消す
//     4. id18 の本文から削除した id6・id14 への誘導文を戻す場合は git 履歴を参照
//     ※ 1〜3 は必ずセットで行うこと。片方だけだと sitemap に載るのに 302 される、
//       といった不整合になる。
// ============================================================================
//     27 だけは理由が別：俳優の顔写真など第三者の権利物を扱っており、
//        キャスト candidates を推測する内容のため、権利面のリスクを避けて下げている。
//        戻す場合は画像・記述の見直しが前提（発売後に自動で戻す対象ではない）。
export const HIDDEN_NEWS_IDS: readonly number[] = [
  3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 20, 21, 22, 23, 24, 25, 27,
];

const HIDDEN_SET = new Set<number>(HIDDEN_NEWS_IDS);

/** その記事IDが非表示対象か。 */
export const isHiddenNewsId = (id: number | string): boolean => HIDDEN_SET.has(Number(id));

/**
 * 他の記事へ 301 で恒久統合した記事ID（vercel.json の redirects と対応）。
 *   17 → 19（GTA6の予約開始・エディション情報を id19 に一本化）
 * 一覧・関連記事・検索に出すと「クリックすると別記事へ飛ぶカード」になり、
 * 生HTMLに 301 を踏む内部リンクが残ってしまうため、表示経路からは外す。
 * 非表示（HIDDEN_NEWS_IDS）とは別概念：こちらは恒久統合なので発売後も戻さない。
 */
export const REDIRECTED_NEWS_IDS: readonly number[] = [17];

const REDIRECTED_SET = new Set<number>(REDIRECTED_NEWS_IDS);

/** その記事IDが他記事へ301統合済みか。 */
export const isRedirectedNewsId = (id: number | string): boolean => REDIRECTED_SET.has(Number(id));

/**
 * 本文は残したまま検索インデックスからだけ外す記事ID。
 *   29: 内容が薄く、検索から入っても得るものが無いと判断（本文は残す）
 * prerender-og.ts が <meta name="robots" content="noindex,follow"> を焼き、
 * generate-sitemap.mjs は sitemap から外す。どちらもこの配列を正とする。
 */
export const NOINDEX_NEWS_IDS: readonly number[] = [29];

const NOINDEX_SET = new Set<number>(NOINDEX_NEWS_IDS);

/** その記事IDが noindex 対象か。 */
export const isNoindexNewsId = (id: number | string): boolean => NOINDEX_SET.has(Number(id));

/**
 * その記事を「検索対象にするか」の単一判定。
 * ----------------------------------------------------------------------------
 * 除外理由はここまでに3種類ある：
 *   - 一時的に非表示（HIDDEN_NEWS_IDS）        … 発売後に戻す
 *   - 他記事へ301統合済み（REDIRECTED_NEWS_IDS）… 恒久
 *   - noindex 指定（NOINDEX_NEWS_IDS）          … URL・本文は残すが検索から外す
 * 消費者（sitemap・プリレンダ・一覧・関連記事・検索）は個別のフラグを見ず、
 * 必ずこの関数を通すこと。理由が増えてもここ1箇所を直せば全経路へ波及する。
 *
 * ※ node 実行のビルドスクリプト（.mjs）は TypeScript を import できないため、
 *   scripts/lib/news-visibility.mjs が同じ3つの配列を news.ts から読み取って
 *   同じ判定を再現する。判定を増やすときは両方を直すこと（不一致は
 *   scripts/check-route-tables.mjs が検出する）。
 */
export const isIndexableNewsId = (id: number | string): boolean =>
  !isHiddenNewsId(id) && !isRedirectedNewsId(id) && !isNoindexNewsId(id);

export type NewsCategory = "release" | "topic" | "update" | "speculation" | "event";

/**
 * 記事タイトル直下に出す「訂正・追記」ボックス。
 * ----------------------------------------------------------------------------
 * 公開後に事実関係が変わった記事へ付ける。本文を消さずに冒頭で断りを入れるための枠で、
 * 記事ページ（NewsDetail）がタイトル帯のすぐ下・本文より前に赤い枠として描画する。
 *   label : 見出し行（例: '2026年8月24日 追記・訂正'）。【】は表示側で付ける。
 *   body  : 段落の配列（1要素＝1段落）。
 * ...En は EN表示時に使い、無ければ日本語へフォールバックする。
 */
export interface ArticleCorrection {
  label: string;
  body: string[];
  labelEn?: string;
  bodyEn?: string[];
}

export interface NewsArticle {
  id: number;
  title: string;
  description: string;
  fullContent: string;
  icon: string;
  category: NewsCategory;
  date: string;
  source: string;
  sourceUrl: string;
  relatedArticles: number[];
  // 任意：YouTube動画ID（例: 'ooZ1n4Fh7Ks'）。指定すると記事冒頭に動画プレーヤーを埋め込む。
  youtubeId?: string;
  // 任意：アイキャッチ画像のパス（例: '/images/news/foo.webp'）。一覧カードのサムネに使う。
  image?: string;
  // 任意：記事トップの「AIによる3行まとめ」ボタンで開く要約（3行程度。あらかじめ用意）。
  aiSummary?: string[];
  // 任意：公開日時（時刻まで）。'YYYY-MM-DD HH:MM' か 'YYYY-MM-DDTHH:MM'。
  //   あれば日付表示が「2026年6月25日 14:30」のように時刻つきになる（無ければ date を年月日表示）。
  publishedAt?: string;
  // 任意：後から訂正・追記した日（'YYYY-MM-DD'）。公開日（date / publishedAt）は変えないこと。
  //   あると記事ページの日付表示が「公開：…／更新：…」の2段になり、
  //   プリレンダのJSON-LD dateModified もこの日付になる。
  updatedAt?: string;
  // 任意：記事冒頭に出す訂正・追記ボックス（ArticleCorrection を参照）。
  correction?: ArticleCorrection;
  // 任意：記事ページのh1だけに使う表示用タイトル。
  //   title はSEO（<title>・OGP・一覧カード・関連記事）に使い続け、
  //   displayTitle があれば記事ページの見出しだけこちらに差し替える。
  //   改行（\n）を入れるとその位置でそのまま改行される（h1 は white-space: pre-line）。
  displayTitle?: string;
  displayTitleEn?: string;
  // 任意：英語版（EN表示時に使う。空の項目は日本語にフォールバック）。
  titleEn?: string;
  descriptionEn?: string;
  fullContentEn?: string;
  aiSummaryEn?: string[];
}

const EN_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** 'YYYY-MM-DD[ HH:MM]' 形式の日付文字列を表示用に整形する。
 *  ja → 「2026年6月25日 14:30」 / en → 「Jun 25, 2026 14:30」 */
export function formatNewsDate(src: string, lang: 'ja' | 'en' = 'ja'): string {
  const m = src.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (!m) return src;
  const [, y, mo, d, hh, mi] = m;
  const base =
    lang === 'en'
      ? `${EN_MONTHS[Number(mo) - 1]} ${Number(d)}, ${y}`
      : `${y}年${Number(mo)}月${Number(d)}日`;
  return hh != null && mi != null ? `${base} ${hh}:${mi}` : base;
}

/** 記事の公開日時を整形する（publishedAt が無ければ年月日のみ）。 */
export function formatArticleDate(article: NewsArticle, lang: 'ja' | 'en' = 'ja'): string {
  return formatNewsDate(article.publishedAt || article.date, lang);
}

// カテゴリごとの表示設定。
//  label  : 表示名
//  vice   : VICE HUBデザインでの色（HEX）
//  color/status/filterIcon : 旧サイバーパンクデザインのページ用
export const CATEGORY_CONFIG: Record<
  NewsCategory,
  { label: string; vice: string; color: "primary" | "secondary" | "accent"; status: string; filterIcon: string }
> = {
  release: { label: "公式情報", vice: "#ff8a3d", color: "primary", status: "ACTIVE", filterIcon: "📢" },
  topic: { label: "話題", vice: "#ffd24a", color: "secondary", status: "TOPIC", filterIcon: "🔥" },
  update: { label: "アップデート", vice: "#22d3ee", color: "secondary", status: "UPDATE", filterIcon: "🔄" },
  speculation: { label: "考察・リーク", vice: "#ff2d95", color: "primary", status: "INTEL", filterIcon: "🔍" },
  event: { label: "イベント", vice: "#a78bfa", color: "accent", status: "EVENT", filterIcon: "🎉" },
};

// 一覧フィルタの選択肢（「すべて」＋各カテゴリ）
export const CATEGORIES: { id: NewsCategory | "all"; label: string; icon: string }[] = [
  { id: "all", label: "すべて", icon: "◆" },
  { id: "release", label: CATEGORY_CONFIG.release.label, icon: CATEGORY_CONFIG.release.filterIcon },
  { id: "topic", label: CATEGORY_CONFIG.topic.label, icon: CATEGORY_CONFIG.topic.filterIcon },
  { id: "update", label: CATEGORY_CONFIG.update.label, icon: CATEGORY_CONFIG.update.filterIcon },
  { id: "speculation", label: CATEGORY_CONFIG.speculation.label, icon: CATEGORY_CONFIG.speculation.filterIcon },
  { id: "event", label: CATEGORY_CONFIG.event.label, icon: CATEGORY_CONFIG.event.filterIcon },
];

// ----------------------------------------------------------------------------
//  記事本体（新しい記事ほど上に並べると、一覧でも上に表示されます）
// ----------------------------------------------------------------------------
export const newsArticles: NewsArticle[] = [
  {
    id: 59,
    title:
      'GTA6公式コラボDualSenseが正式発表。Vice City仕様の白・黒2モデル、11月19日発売へ',
    displayTitle:
      'GTA6公式コラボDualSenseが正式発表\nVice City仕様の白・黒2モデル、11月19日発売へ',
    description:
      '9月3日のState of Playで、Sony Interactive Entertainmentが『Grand Theft Auto VI』仕様の限定DualSenseコントローラー2種を正式発表した。ブラックとホワイトの2モデルで、色味が変化する仕上げとヤシの木モチーフのグリップを備える。発売は本編と同じ11月19日、価格は12,480円（税込）、予約開始は9月10日。',
    icon: '🎮',
    image: '/images/news/gta6-dualsense-limited-edition/eyecatch.webp',
    category: 'release',
    date: '2026-09-03',
    publishedAt: '2026-09-03 23:45',
    source: 'PlayStation Blog',
    sourceUrl:
      'https://blog.playstation.com/2026/09/03/first-look-at-the-grand-theft-auto-vi-limited-edition-dualsense-wireless-controllers/',
    relatedArticles: [19, 28, 51],
    aiSummary: [
      '9月3日のState of Playで、『Grand Theft Auto VI』仕様の限定DualSenseコントローラー2種が正式発表された。正式名称は「DualSense Wireless Controller – Grand Theft Auto VI Black Limited Edition」と同White Limited Editionで、いずれもVice Cityの空気感を落とし込んだデザインになっている。',
      '両モデルとも夕焼けとネオンを思わせる色味が変化する仕上げを採用し、グリップにはヤシの木モチーフの立体的なディテール、中央には『GTA VI』の公式ブランディングが入る。ホワイト版が“昼のVice City”、ブラック版が“夜のVice City”という位置づけだ。',
      '発売日は本編と同じ2026年11月19日、価格は12,480円（税込）、予約開始は9月10日10:00（現地時間）。ホワイト版はPlayStation Directと参加小売店、ブラック版はDirect対応地域ではDirect中心の展開となる見込みで、地域によって発売日や取り扱いが異なる場合があるとも明記されている。',
    ],
    fullContent: `# GTA6公式コラボDualSenseが正式発表。Vice City仕様の白・黒2モデル、11月19日発売へ

9月3日のState of Playで、Sony Interactive Entertainmentは『Grand Theft Auto VI』仕様の限定DualSenseコントローラー2種を正式発表した。公開されたのはブラックとホワイトの2モデルで、いずれもVice Cityの空気感を意識したデザインになっている。発売日は『GTA VI』本編と同じ11月19日で、予約受付は9月10日に始まる予定だ。

---

## Vice City仕様の限定DualSense、ブラックとホワイトの2モデル

9月3日に配信されたState of Playで、PlayStationは『Grand Theft Auto VI』とコラボした限定DualSenseコントローラーを初公開した。正式名称は「DualSense Wireless Controller – Grand Theft Auto VI Black Limited Edition」と「DualSense Wireless Controller – Grand Theft Auto VI White Limited Edition」の2種類。PlayStation Blogでは、どちらも『GTA VI』の舞台となるVice Cityの“見ただけでわかるスタイル”を落とし込んだデザインだと説明されている。

![ホワイト版のDualSense Wireless Controller – Grand Theft Auto VI White Limited Edition。夕焼け色の背景に浮かぶ本体は、上部が白、下部へ向かって青から紫へと色味が変化している](/images/news/gta6-dualsense-limited-edition/white-limited-edition-front.webp)

---

## 色味が変化する仕上げと、ヤシの木モチーフのグリップ

今回発表された2モデルは、単に色違いというだけではない。両モデルとも、Vice Cityの夕焼けとネオンを思わせる色味が変化する仕上げが採用されており、さらにグリップ部分にはヤシの木をモチーフにした立体的なディテールが入っている。中央には『GTA VI』の公式ブランディングもあしらわれており、ゲームの世界観をかなり強く意識した作りだ。ホワイト版は白い砂浜やパステル調の空など“昼のVice City”を、ブラック版はネオンが映える“夜のVice City”を表現したモデルとして紹介されている。

![ホワイト版のタッチパッド周辺の拡大。ヤシの木をあしらった『VI』のロゴが刻まれ、グリップ側はラメの入った紫のグラデーションになっている](/images/news/gta6-dualsense-limited-edition/white-touchpad-palm-detail.webp)

---

## 発売は11月19日、価格は12,480円（税込）

発売日は2026年11月19日で、価格は12,480円（税込）。予約開始は9月10日10:00（現地時間）と案内されている。PlayStation Blogによると、ホワイト版はPlayStation Directと参加小売店で展開され、ブラック版はPlayStation Direct対応地域ではDirect中心、それ以外の地域では一部小売店で販売される見込みだ。なお、ブログには地域によって発売日や取り扱いが異なる場合があるとも明記されているため、日本国内の販売店情報は今後の案内待ちになりそうだ。

---

## ハプティックフィードバックとアダプティブトリガーにも対応

今回の発表は、見た目だけのコラボにとどまらない。PlayStation Blogでは、『GTA VI』がDualSenseのハプティックフィードバックとアダプティブトリガーに対応し、JasonとLuciaの物語を“手の中で”感じられる体験を目指していると説明されている。実際、日本のPlayStation公式『GTA VI』ページでも、DualSenseの振動機能／トリガーエフェクト対応に加え、ハプティックフィードバック、アダプティブトリガー、内蔵スピーカー対応が案内されている。

![『Grand Theft Auto VI』のロゴと、通常モデルのDualSenseおよびPS5本体が並ぶ「PLAYS BEST ON PS5」のスライド](/images/news/gta6-dualsense-limited-edition/plays-best-on-ps5.webp)

---

## 現時点で発表されているのはコントローラー2種のみ

また、日本のPlayStation公式ページでは『グランド・セフト・オートVI』の発売日が2026年11月19日と明記されており、今回の限定DualSenseも本編発売日に合わせて投入される格好だ。少なくとも現時点の公式発表で案内されているのはコントローラー2種であり、同じ発表内ではPS5本体同梱版や本体カバーの詳細までは示されていない。まずはDualSenseから『GTA VI』コラボ展開が始まった、と見るのが自然だろう。

---

## 出典

→ [First look at the Grand Theft Auto VI Limited Edition DualSense wireless controllers（PlayStation Blog）](https://blog.playstation.com/2026/09/03/first-look-at-the-grand-theft-auto-vi-limited-edition-dualsense-wireless-controllers/)

→ [グランド・セフト・オートVI（PlayStation公式サイト）](https://www.playstation.com/ja-jp/games/grand-theft-auto-vi/)

---

> **注記：** 本記事は、2026年9月3日のState of Playで公開された内容とPlayStation Blogの発表、および日本のPlayStation公式サイトの掲載内容をもとにGTA6 FEEDが整理したものであり、Sony Interactive Entertainment／Rockstar Games／Take-Two Interactiveとは一切関係がない。掲載画像はState of Playおよび公式発表で公開された映像・素材にもとづく。価格・予約開始日時・販売経路は発表時点の情報であり、地域によって発売日や取り扱いが異なる場合があるとPlayStation Blog自身が明記している。日本国内での取り扱い小売店については、本記事執筆時点で個別の案内が出ていない。`,
  },
  {
    id: 58,
    title:
      'NoPixelとは？ 世界最大級のGTA RPサーバーがRockstarと組むまで――10年の歴史をわかりやすく解説',
    displayTitle:
      'NoPixelとは？ 世界最大級のGTA RPサーバーがRockstarと組むまで\n10年の歴史をわかりやすく解説',
    description:
      'NoPixelはゲームの名前ではない。GTA Vの世界で参加者が警察官・犯罪者・医者・市民を演じる、世界最大級のGTA RPコミュニティだ。2016年のArma 3時代からGTA V/FiveMへの移行、Twitchでの爆発、3.0・4.0、そして2026年9月のNoPixel V正式発表まで、約10年の歴史を年表つきで解説する。',
    icon: '📖',
    image: '/images/news/nopixel-history/eyecatch.webp',
    category: 'topic',
    date: '2026-09-02',
    publishedAt: '2026-09-02 19:00',
    source:
      'NoPixel公式／Rockstar Games Newswire／PC Gamer ほか',
    sourceUrl: 'https://www.nopixel.net/',
    relatedArticles: [57, 41, 55],
    aiSummary: [
      'NoPixelはゲームの名前ではなく、GTA Vの世界を舞台に参加者が警察官・犯罪者・医者・経営者・市民などを演じる、世界最大級のGTA RPコミュニティ／サーバーである。Rockstarが運営する通常のGTA Onlineとは別物で、独自の警察・司法・医療・経済・住宅・犯罪システムが作り込まれている。',
      '始まりはGTA Vではなくarma 3だった。NoPixelは2026年5月に10周年を迎えており、2016〜2017年の1.0時代はArma 3を舞台にしたRPプラットフォームだった。2017〜2020年の2.0でGTA V/FiveMへ移行し、2019年前後に人気ストリーマーの参加でTwitchを中心に世界的な注目を集め、2021年2月5日の3.0、2023年12月15日の4.0と大規模な世代交代を繰り返してきた。',
      '2023年8月にFiveM開発元のCfx.reがRockstar Games傘下となり、2025年にはNoPixelがRockstarとの協力でNoPixel Vを制作していることを公表。2026年9月1日、Rockstarが公式NewswireでNoPixel Vを正式発表し、9月8日からRockstar Games Launcher経由のクローズドβが始まる。ただしGTA6でFiveMが使えるか、NoPixel VがGTA6へ移行するかは未発表のままである。',
    ],
    fullContent: `# NoPixelとは？ 世界最大級のGTA RPサーバーがRockstarと組むまで――10年の歴史をわかりやすく解説

GTA6やFiveMのニュースを追っていると、最近「NoPixel（ノーピクセル）」という名前を目にする機会が急激に増えている。

2026年9月にはRockstar Games自身が「NoPixel V」を正式に紹介し、9月8日から始まるクローズドβを告知した。RockstarはNoPixelについて、GTA RPの限界を押し広げてきたコミュニティとして評価しており、NoPixel VはRockstar Games Launcherからアクセスできるようになる。

![NoPixel V ローンチトレーラー（NoPixel公式YouTube）](https://www.youtube.com/watch?v=fVCD9oKjtZs)

*※本記事に掲載している画像は、記事の内容をイメージしやすくするためにAIで生成したものです。実際のNoPixelのゲーム画面・UI・実在のサーバー画面ではありません。*

しかし、日本でGTA6の情報だけを追っている人なら、「そもそもNoPixelって何？」「新しいGTAのゲーム？」「FiveMとは違うの？」と思っても不思議ではない。

結論から言えば、NoPixelはゲームの名前ではない。GTA Vの世界を使い、参加者が警察官、犯罪者、医者、経営者、市民などになりきって生活する、世界的に有名なGTA RPコミュニティ／サーバーだ。

そして、その歴史はGTA6発売直前に突然始まったものでもない。

NoPixelは2026年に10周年を迎えた。初期のArma 3時代からGTA V、FiveM、Twitchでの爆発的な人気、NoPixel 3.0、4.0を経て、ついにRockstarと共同でNoPixel Vを作るところまで来たのである。

今回は、GTA RPを知らない人でも分かるように「NoPixelとは何なのか」から、その約10年間の歴史まで順番に整理していく。

---

## そもそも「GTA RP」とは何なのか

![警察官、女性警官、医師、フーディー姿の若者、飲食店の店員、私服の女性、ギャング風の男性、消防士が病院前に並んでいる。背景にはパトカーと消防車](/images/news/nopixel-history/rp-roles-lineup.webp)

NoPixelを理解するには、まずGTA RPを知っておく必要がある。

普通のGTAでは、プレイヤーは用意された主人公を操作してストーリーを進めたり、GTA Onlineでミッションやレース、強盗などを楽しんだりする。

RPは少し違う。

RPは「Roleplay（ロールプレイ）」の略で、プレイヤー自身が架空の人物を作り、その人物として街の中で生活する遊び方だ。

たとえば、あるプレイヤーは警察官として犯罪者を追い、別のプレイヤーは救急隊員として負傷者を助ける。車を修理するメカニックや飲食店の店員、会社経営者として働く人がいる一方で、ギャングを結成して犯罪に手を染める人もいる。

重要なのは、その多くをNPCではなく実際の人間が演じていることだ。

犯罪者が銀行を襲えば、プレイヤーの警察官が現場へ向かう。銃撃戦で誰かが倒れれば、救急隊員役のプレイヤーが駆けつける。その事件を記者役のプレイヤーが取材することさえある。

こうして、ゲーム会社が最初から用意したシナリオではない物語が毎日のように生まれていく。

NoPixelは、そんなGTA RPを世界的な配信コンテンツへ押し上げた代表的なコミュニティのひとつだ。

---

## NoPixelは「GTA Online」と何が違う？

ここは初心者が最も混乱しやすい。

NoPixelはRockstarが運営する通常の「GTA Online」のサーバーではない。

GTA VのPC版をベースに、カスタムマルチプレイ環境を利用して独自のシステムを大量に追加したRPサーバーとして発展してきた。

そのため、見た目はLos Santosでも、中で行われていることは通常のGTA Onlineとはかなり違う。

独自の警察・司法制度、医療、仕事、企業、経済、住宅、アイテム、スマートフォン、犯罪システムなどが作られ、プレイヤーたちはそのルールの中で生活する。

「GTA Vのオンラインモードを改造しただけ」と説明すると少し分かりにくい。

感覚としては、GTA Vという巨大な街を舞台セットとして使い、その上にコミュニティが別のオンライン社会を作ったものと考えると理解しやすい。

---

## NoPixelの始まり――GTAではなく「Arma 3」だった

現在では「NoPixel＝GTA RP」という印象が強いが、その始まりはGTA Vではなかった。

NoPixel自身が2026年5月に10周年を迎えたと発信しており、その歴史は2016年まで遡る。NoPixelの歴史をまとめた資料でも、2016〜2017年の1.0時代はArma 3を舞台にしたRPプラットフォームとして説明されている。

Armaシリーズには以前からロールプレイ系コミュニティが存在しており、NoPixelもそうした文化の中から成長していった。

つまりNoPixelは、「GTA VでRPが流行ったから作られたサーバー」ではない。

もともとRPコミュニティを作っていた人たちが、より大きな可能性を持つGTA Vへ舞台を移していったという順番なのである。

---

## GTA VとFiveMへ――NoPixel 2.0の時代

次の大きな転換点がGTA Vへの移行だった。

NoPixelの歴史では、2017〜2020年が「NoPixel 2.0」の時代として整理されており、FiveMを利用したGTA VベースのRP環境が本格的に発展していった。

ここで登場するのがFiveMだ。

FiveMは、GTA Vを利用して独自のマルチプレイサーバーを構築できるプラットフォームである。現在日本で遊ばれているGTA RPサーバーの多くも、このFiveMを利用している。

つまり、

- **GTA V** … ゲーム本体
- **FiveM** … 独自サーバーを作るための基盤
- **NoPixel** … その基盤上に作られた巨大RPコミュニティ

という関係だと考えると分かりやすい。

NoPixelはFiveMそのものではないし、FiveMをインストールすれば自動的にNoPixelになるわけでもない。

FiveMという「土地」の上に、NoPixelという巨大な「街」が作られているような関係だった。

---

## 2019年、NoPixelがTwitchで爆発する

![夜のネオン街を走るパトカーとスポーツカー、バイク。上空から警察のヘリコプターがサーチライトを当てている](/images/news/nopixel-history/police-pursuit-street.webp)

NoPixelの名前がGTAコミュニティの外にまで広がった大きな転換点が、2019年前後だった。

人気ストリーマーたちが次々とNoPixelへ参加し、その様子をTwitchで配信するようになる。

ここでGTA RPとライブ配信の相性の良さが一気に表面化した。

通常のゲーム配信では、一人の配信者がひとつのゲームをプレイする。

しかしGTA RPでは、同じ事件を何人もの配信者が別々の視点から体験している。

銀行強盗が起きたとする。

強盗側の配信を見れば「どうやって逃げるか」という犯罪ドラマになる。一方、警察側の配信へ移れば「どうやって犯人を捕まえるか」という刑事ドラマになり、偶然その場に居合わせた一般市民の配信では、まったく別の物語として事件を見ることができる。

しかも台本通りに進むとは限らない。

プレイヤー同士の判断によって、昨日まで敵だった人物が協力したり、仲間だった人物が裏切ったりする。

ひとつの街で、数十人、数百人の物語が同時進行する。

これがNoPixelを単なるGTAのMODサーバーではなく、「見るゲーム」としても巨大化させた理由のひとつだった。

---

## NoPixel 3.0――GTA RPが巨大配信コンテンツになる

2021年2月5日、NoPixelは大規模な刷新となるNoPixel 3.0へ移行した。NoPixelの歴史資料でも、この日を3.0のリブート日としている。

この時代は、現在のGTA RP人気を語る上で特に重要だ。

NoPixelには世界的な人気ストリーマーが多数参加し、GTA Vは発売から何年も経過したゲームとは思えないほどTwitchで再び大きな注目を集めた。

3.0では街の経済や職業、警察、犯罪、店舗などがさらに作り込まれ、「GTAで遊んでいる」というよりNoPixelという独自のオンライン世界へログインしている感覚が強くなっていった。

また、人気の高まりによって「NoPixelで遊びたい」という人も急増した。

---

## なぜNoPixelは誰でも入れないの？

NoPixelについて調べると、「Whitelist（ホワイトリスト）」という言葉を目にする。

これは参加を許可されたプレイヤーのリストだ。

RPサーバーでは、誰でも自由に参加できるようにすると、ロールプレイを無視して他人を攻撃したり、ゲーム世界を荒らしたりするプレイヤーが入ってくる可能性がある。

そのためNoPixelでは、参加者を一定の基準で管理する仕組みが重要になった。

さらに人気配信者が大量に参加するようになると、単純にサーバーへ入りたい人の数が収容人数を大きく上回る。

こうした背景からNoPixelは、「世界で最も有名なGTA RPサーバーのひとつ」であると同時に、簡単には入れないRPサーバーとしても知られるようになった。

その後は、より参加しやすい別のPublicサーバーも展開されている。

---

## NoPixelがすごいのは「有名配信者がいるから」だけではない

NoPixelが世界的に知られるようになった理由として、有名ストリーマーの存在は非常に大きい。

しかし、それだけで10年間続くコミュニティにはならない。

NoPixelの大きな特徴は、独自システムを作り続けてきた開発力にもある。

警察が使う端末、スマートフォン、銀行、店舗、車両、住宅、犯罪、クラフト、医療など、RPに必要な仕組みが継続的に開発されてきた。

こうした仕組みがあるからこそ、「警察官のふりをする」「店員のふりをする」だけではなく、ゲームシステムそのものが役割を支える。

そしてNoPixelで生まれたアイデアやシステムは、GTA RPコミュニティ全体にも大きな影響を与えてきた。

---

## NoPixel 4.0――2023年12月、大規模リセット

次の大きな転換点がNoPixel 4.0だ。

NoPixelの歴史資料では、4.0は2023年12月15日にスタートしたとされている。

大規模アップデートによって街のシステムやゲームプレイが刷新され、プレイヤーたちは新しい環境で再び物語を作り始めた。

NoPixelが特徴的なのは、一度完成した世界を永遠に維持するのではなく、数年単位で大規模な世代交代を行ってきたことだ。

1.0から2.0、3.0、4.0へ。

数字が変わるたびに単なるアップデートではなく、「次のNoPixel」と呼べるほど環境が作り直されてきた。

そして4.0の次に発表された名称は、5.0ではなかった。

NoPixel Vだった。

---

## その間に起きた「RockstarとFiveM」の歴史的変化

NoPixelの歴史を理解する上で、もうひとつ欠かせない出来事がある。

FiveMを開発するCfx.reが、2023年8月にRockstar Gamesへ加わったことだ。

それまでFiveMは、Rockstarのゲームを利用しながら外部コミュニティが発展させてきたカスタムマルチプレイ文化の中心にあった。

ところが、そのFiveMを作るチームそのものがRockstar側へ入った。

ここから、GTA RPを取り巻く状況は大きく変わり始める。

かつてRockstarの外側で成長していた文化と、Rockstar自身との距離が急速に縮まり始めたのである。

この時期にRAGE:MPやalt:Vといった他のカスタムマルチプレイ基盤がどうなったのかは、[RAGE:MPの10年の歴史と終了をまとめた記事](/news/55)で詳しく整理している。

---

## 2025年、NoPixelとRockstarが手を組む

そして2025年、さらに大きなニュースが発表された。

NoPixelは、次世代のGTA V Roleplay体験となる「**NoPixel V**」をRockstar Gamesとの協力によって制作していることを明らかにした。

この時点で、NoPixelは単に「FiveMで一番有名なRPサーバー」という存在から次の段階へ進み始めた。

長年Rockstarのゲームを土台に独自文化を作ってきたコミュニティが、今度はRockstar自身と協力して次のRP環境を作る。

2016年のArma 3時代を知る人からすれば、かなり大きな変化だろう。

---

## 2026年、Rockstar自身がNoPixel Vを正式発表

そして2026年9月1日。

Rockstar Gamesは公式Newswireで「**Introducing nopixel V**」を公開した。

RockstarはNoPixelについて、キャラクターへの没入、GTA Vマップへの改変、ストーリーテラーのコミュニティなどを通してGTA Roleplayの可能性を押し広げてきた存在として紹介している。

そしてNoPixel Vのクローズドβが9月8日から始まることを正式に発表した。

招待されたプレイヤーはRockstar Games Launcherからアクセスする。

さらにNoPixelとRockstarは開発段階から協力し、新しい機能や開発ツールの改良を進めてきたことも明らかになった。

これはNoPixelの約10年間を考えると、非常に象徴的な到達点だ。

2016年にRPコミュニティとして始まり、GTA Vへ移り、FiveM上で巨大化し、Twitchを通じて世界中から視聴されるようになり、そして10年後にはRockstar自身が公式サイトでその新世代を紹介するまでになった。

発表内容の詳細（1,000件の所有可能物件、Pixel Hotel & Casino、Cypress Flatsの再開発、GTA OnlineへのTwitch Drops連携など）は、[NoPixel V正式発表の記事](/news/57)でまとめている。

---

## NoPixelの10年を年表で見る

![「NoPixelの歴史 – 約10年の歩み」と題した年表の図版。2016年のArma 3から2026年のNoPixel V正式発表までを6つの節目で並べている](/images/news/nopixel-history/nopixel-history-timeline.webp)

| 年 | NoPixelの主な出来事 |
| --- | --- |
| 2016 | NoPixelの歴史がスタート。初期はArma 3を舞台にRPコミュニティを展開 |
| 2017〜 | GTA V / FiveMを利用したNoPixelへ本格移行 |
| 2017〜2020 | NoPixel 2.0時代。GTA RP環境を大幅に発展 |
| 2019前後 | 人気ストリーマーの参加でTwitchを中心に世界的な注目を集める |
| 2021年2月5日 | NoPixel 3.0スタート |
| 2021年〜 | GTA RPが巨大なライブ配信コンテンツとしてさらに成長 |
| 2023年8月 | FiveM開発元Cfx.reがRockstar Gamesへ |
| 2023年12月15日 | NoPixel 4.0スタート |
| 2025年 | Rockstarとの協力によるNoPixel Vを発表 |
| 2026年5月 | NoPixelが10周年 |
| 2026年9月1日 | Rockstar GamesがNoPixel Vを正式発表 |
| 2026年9月8日 | NoPixel Vクローズドβ開始予定 |

NoPixel自身の10周年告知と歴史資料を合わせると、約10年間でArma 3 → GTA V/FiveM → 世界的GTA RPコミュニティ → Rockstarとの共同プロジェクトへ変化してきたことが分かる。

---

## 日本のGTA RPとは何が違う？

日本からNoPixelを理解するときには、「海外版ストグラみたいなもの？」と考える人もいるだろう。

入口としては、それほど遠くない。

ひとつの街に多くの参加者が入り、それぞれキャラクターを演じながら、警察、救急、犯罪、店舗経営などを通して物語が生まれ、その様子を視聴者が複数の配信者から見るという構造には共通点がある。

ただし、NoPixelと日本の各RP企画は運営、ルール、参加方法、文化、システムが異なるため、「NoPixel＝海外版○○」と完全に同一視するのは正確ではない。

NoPixelはNoPixelとして、約10年かけて独自の文化を作ってきたコミュニティだ。

---

## なぜGTA6 FEEDでNoPixelを追うのか

そして、ここが現在NoPixelを知っておく最大の理由になる。

GTA6は2026年11月19日に発売予定だ。

一方、Rockstarはその直前となる9月にNoPixel Vを正式発表し、GTA RPを「クリエイターコミュニティが生み出した新しい遊び方」の代表例として取り上げている。

ただし、NoPixel VはGTA VのRPプロジェクトだ。

Rockstarは現時点で「NoPixel VをGTA6へ移行する」とも、「GTA6発売時からFiveMに対応する」とも発表していない。

ここを混同してはいけない。

それでも、GTA6発売直前のRockstarが世界最大級のGTA RPコミュニティと協力し、その新世代をRockstar Games Launcherから展開するという事実は、今後のGTAシリーズとRP文化の関係を考える上で非常に重要だ。

GTA6のロールプレイがどうなるのかという論点は、[GTA6のRP文化の現在地をまとめた記事](/news/18)でも扱っている。

---

## NoPixelは「有名なRPサーバー」からRockstarのパートナーへ

NoPixelの歴史を振り返ると、今回のNoPixel Vが突然現れたものではないことが分かる。

Arma 3から始まり、GTA Vへ移り、FiveMを使って独自の街を作り、配信文化と結びついて世界中へ広がった。

その間にGTA RPそのものも変わった。

一部のPCゲーマーが楽しむニッチな遊びだったRPが、何十万人もの視聴者が物語を追いかける巨大なライブコンテンツになり、最終的にはRockstar自身が公式Newswireで紹介するところまで来た。

だからNoPixel Vを理解するために必要なのは、「新しいカジノが追加された」「NPCが賢くなった」という機能だけではない。

なぜRockstarがNoPixelと組むことになったのか。

その答えの一部は、この10年間の歴史そのものにある。

NoPixelはGTA RPという遊び方を長年育て、配信文化として世界へ広げてきた。そして2026年、そのコミュニティはRockstar Gamesと一緒に「次のGTA V Roleplay」を作る段階まで到達した。

GTA6時代にNoPixelやFiveMが最終的にどのような形になるのかは、まだ分からない。

しかし、これからGTA6とGTA RPのニュースを追うのであれば、「NoPixel」という名前は覚えておいて損のない存在になった。

---

## 参考リンク

→ [NoPixel公式サイト](https://www.nopixel.net/)

→ [Introducing nopixel V（Rockstar Games Newswire）](https://www.rockstargames.com/newswire/article/17857581o753k1/introducing-nopixel-v)

→ [Rockstar touts new invite-only NoPixel V GTA roleplaying server as "the next evolution of the RP community"（PC Gamer）](https://www.pcgamer.com/games/grand-theft-auto/rockstar-touts-new-invite-only-nopixel-v-gta-roleplaying-server-as-the-next-evolution-of-the-rp-community/)

---

> **注記：** 本記事は、NoPixel公式の発信と歴史資料、Rockstar Games Newswireの発表、およびPC Gamerなどの報道をもとにGTA6 FEEDが整理したものであり、Rockstar Games／Take-Two InteractiveおよびNoPixel運営とは一切関係がない。バージョンごとの開始日（3.0＝2021年2月5日、4.0＝2023年12月15日）や10周年の時期はNoPixel側の公開情報にもとづく。GTA6でFiveMが利用できるか、NoPixel VがGTA6へ移行するかについては、現時点でRockstarからの発表がなく、本記事でも確定情報としては扱っていない。掲載画像はいずれも記事内容をイメージしやすくするためにAIで生成したもので、実際のゲーム画面・公式UI・実在のサーバー画面ではない。年表の図版に含まれるロゴ・パッケージ画像は各権利者に帰属し、解説目的で引用的に配置している。アイキャッチと年表の図版には日本語のテキストが含まれる。冒頭に埋め込んだ動画はNoPixel公式のYouTubeチャンネルで公開されているもので、著作権は権利者に帰属する。`,
    titleEn:
      'What Is NoPixel? How the World\'s Biggest GTA RP Server Ended Up Working With Rockstar — Ten Years of History Explained',
    displayTitleEn:
      'What Is NoPixel? How the World\'s Biggest GTA RP Server Ended Up Working With Rockstar\nTen Years of History Explained',
    descriptionEn:
      'NoPixel is not the name of a game. It is one of the largest GTA RP communities in the world, where players live in GTA V as police officers, criminals, doctors, and citizens. From its Arma 3 origins in 2016 through the move to GTA V/FiveM, the Twitch explosion, 3.0 and 4.0, and the formal NoPixel V announcement in September 2026 — ten years of history, with a timeline.',
    aiSummaryEn: [
      'NoPixel is not a game but one of the largest GTA RP communities and servers in the world, where participants use the world of GTA V to play police officers, criminals, doctors, business owners, and citizens. It is separate from the regular GTA Online that Rockstar operates, with its own police, justice, medical, economic, housing, and crime systems built out in depth.',
      'It began on Arma 3, not GTA V. NoPixel marked its tenth anniversary in May 2026; its 1.0 era of 2016–2017 was an RP platform set in Arma 3. The 2.0 era of 2017–2020 moved it to GTA V/FiveM, popular streamers drew worldwide attention on Twitch around 2019, and sweeping generational resets followed with 3.0 on February 5, 2021 and 4.0 on December 15, 2023.',
      'In August 2023 Cfx.re, FiveM\'s developer, joined Rockstar Games, and in 2025 NoPixel revealed it was building NoPixel V in collaboration with Rockstar. On September 1, 2026, Rockstar formally announced NoPixel V on its official Newswire, with a closed beta beginning September 8 via the Rockstar Games Launcher. Whether FiveM will work on GTA6, or NoPixel V will move there, remains unannounced.',
    ],
    fullContentEn: `# What Is NoPixel? How the World's Biggest GTA RP Server Ended Up Working With Rockstar — Ten Years of History Explained

If you follow GTA6 and FiveM news, the name "NoPixel" has been turning up far more often lately.

In September 2026, Rockstar Games itself formally introduced "NoPixel V" and announced a closed beta starting September 8. Rockstar credits NoPixel as a community that has pushed the boundaries of GTA RP, and NoPixel V will be accessible from the Rockstar Games Launcher.

![NoPixel V launch trailer, from the official NoPixel YouTube channel](https://www.youtube.com/watch?v=fVCD9oKjtZs)

*Note: the images in this article were generated with AI to help illustrate the topic. They are not actual NoPixel gameplay, official UI, or screenshots of any real server. Text in the key art and the timeline graphic is in Japanese.*

If you have only been following GTA6 coverage, though, it would be no surprise to wonder: what even is NoPixel? A new GTA game? Is it different from FiveM?

The short answer: NoPixel is not the name of a game. It is a world-famous GTA RP community and server, where participants use the world of GTA V to live as police officers, criminals, doctors, business owners, and ordinary citizens.

And its history did not begin suddenly on the eve of GTA6's release.

NoPixel turned ten in 2026. From its early Arma 3 days through GTA V, FiveM, explosive popularity on Twitch, NoPixel 3.0 and 4.0, it has arrived at building NoPixel V together with Rockstar.

Below is a walk through what NoPixel actually is and its roughly ten years of history, written so that it makes sense even if you have never touched GTA RP.

---

## First of All, What Is "GTA RP"?

![A police officer, a female officer, a doctor, a young person in a hoodie, a restaurant worker, a woman in plain clothes, a man dressed like a gang member, and a firefighter lined up in front of a hospital, with police cars and a fire engine behind them](/images/news/nopixel-history/rp-roles-lineup.webp)

To understand NoPixel, you first need to know GTA RP.

In ordinary GTA, you control a pre-written protagonist through a story, or you play missions, races, and heists in GTA Online.

RP works differently.

RP is short for "roleplay": each player creates a fictional person and lives in the city as that person.

One player chases criminals as a police officer while another saves the wounded as a paramedic. Some work as mechanics fixing cars, staff in restaurants, or business owners, while others form gangs and turn to crime.

The important part is that most of those roles are played by actual people, not NPCs.

When a criminal robs a bank, a player who is a police officer responds to the scene. If someone goes down in a shootout, a player playing a paramedic arrives. A player acting as a reporter may even cover the incident.

Out of this, stories nobody at a game company scripted are generated more or less daily.

NoPixel is one of the communities that pushed that kind of GTA RP into globally watched streaming content.

---

## How Is NoPixel Different From "GTA Online"?

This is where newcomers get most confused.

NoPixel is not a server on the regular "GTA Online" that Rockstar operates.

It grew as an RP server built on the PC version of GTA V, using a custom multiplayer environment to add a huge amount of bespoke systems.

So although it looks like Los Santos, what happens inside is quite different from standard GTA Online.

Its own police and justice system, medical services, jobs, businesses, economy, housing, items, smartphones, and crime systems have been built, and players live within those rules.

Calling it "a modded GTA Online mode" makes it harder to grasp, not easier.

It is easier to think of it as: GTA V's enormous city is used as a stage set, and on top of it a community has built a separate online society.

---

## NoPixel Started Not on GTA — but on Arma 3

The impression today is "NoPixel = GTA RP," but it did not start on GTA V.

NoPixel itself announced that it reached its tenth anniversary in May 2026, dating its history back to 2016. Histories of NoPixel likewise describe the 1.0 era of 2016–2017 as an RP platform set in Arma 3.

The Arma series had roleplay communities well before that, and NoPixel grew out of that culture.

In other words, NoPixel was not "a server built because RP got popular in GTA V."

The order was the reverse: people who were already running an RP community moved their stage to GTA V, which offered greater possibilities.

---

## On to GTA V and FiveM — the NoPixel 2.0 Era

The next major turning point was the move to GTA V.

In NoPixel's history, 2017–2020 is organized as the "NoPixel 2.0" era, when a GTA V-based RP environment running on FiveM developed in earnest.

Which brings in FiveM.

FiveM is a platform that lets you build your own multiplayer servers using GTA V. Most of the GTA RP servers played in Japan today also run on FiveM.

So the relationship works out like this:

- **GTA V** — the game itself
- **FiveM** — the foundation for building your own servers
- **NoPixel** — the enormous RP community built on that foundation

NoPixel is not FiveM itself, and installing FiveM does not automatically get you NoPixel.

It was more like a vast "city" called NoPixel built on top of "land" called FiveM.

---

## 2019: NoPixel Explodes on Twitch

![Police cars, a sports car, and a motorcycle racing through a neon-lit street at night, with a police helicopter shining a searchlight from above](/images/news/nopixel-history/police-pursuit-street.webp)

The big turning point that carried NoPixel's name beyond the GTA community came around 2019.

Popular streamers joined NoPixel one after another and began broadcasting it on Twitch.

That is when how well GTA RP suits live streaming became obvious all at once.

In ordinary game streaming, one streamer plays one game.

In GTA RP, many streamers experience the same incident from different points of view.

Say a bank robbery happens.

Watch the robbers' stream and it is a crime drama about how to get away. Switch to the police side and it becomes a procedural about catching the suspects. On the stream of a civilian who happened to be nearby, the same incident is an entirely different story.

And nothing necessarily goes to script.

Depending on what players decide, someone who was an enemy yesterday cooperates today, or an ally betrays you.

Dozens or hundreds of stories run simultaneously in one city.

That is one reason NoPixel grew beyond a GTA mod server into something huge as a game to watch.

---

## NoPixel 3.0 — GTA RP Becomes Massive Streaming Content

On February 5, 2021, NoPixel moved to NoPixel 3.0, a large-scale overhaul. NoPixel's history materials give that date as the 3.0 reboot.

This era matters especially for understanding GTA RP's popularity today.

Many globally popular streamers joined NoPixel, and GTA V drew enormous attention on Twitch again in a way that seemed improbable for a game years past release.

In 3.0 the city's economy, jobs, police, crime, and businesses were built out further, and it felt less like "playing GTA" and more like logging into a distinct online world called NoPixel.

As popularity grew, so did the number of people who wanted to play on it.

---

## Why Can't Anyone Just Join NoPixel?

Read about NoPixel and you will run into the word "whitelist."

That is the list of players permitted to join.

On an RP server, letting anyone in freely risks players who ignore roleplay to attack others or grief the game world.

So managing participants against a standard became important for NoPixel.

And once large numbers of popular streamers were involved, the number of people who wanted in simply exceeded capacity by a wide margin.

Against that background, NoPixel became known both as one of the most famous GTA RP servers in the world and as an RP server that is not easy to get into.

Separate Public servers that are easier to join have since been operated as well.

---

## What Makes NoPixel Impressive Is Not Just the Famous Streamers

The presence of well-known streamers is a very large part of why NoPixel became globally known.

But that alone does not sustain a community for ten years.

A major characteristic of NoPixel is the development capability behind its continuously built custom systems.

Police terminals, smartphones, banking, businesses, vehicles, housing, crime, crafting, medical care — the mechanisms RP needs have been developed continuously.

Because those exist, roles are not just "pretending to be a police officer" or "pretending to be a clerk" — the game systems themselves support the role.

And ideas and systems born on NoPixel have had a large influence on the wider GTA RP community.

---

## NoPixel 4.0 — the December 2023 Large-Scale Reset

The next major turning point was NoPixel 4.0.

NoPixel's history materials give December 15, 2023 as its start.

A large-scale update overhauled the city's systems and gameplay, and players began building stories again in a new environment.

What is distinctive about NoPixel is that rather than maintaining a finished world forever, it has carried out sweeping generational changes every few years.

From 1.0 to 2.0, 3.0, and 4.0.

Each time the number changed, the environment was rebuilt enough to be called "the next NoPixel" rather than merely updated.

And the name announced after 4.0 was not 5.0.

It was NoPixel V.

---

## Meanwhile: the Historic Shift Between Rockstar and FiveM

There is one more event you cannot skip in understanding NoPixel's history.

Cfx.re, the developer of FiveM, joined Rockstar Games in August 2023.

Until then FiveM sat at the center of a custom multiplayer culture that outside communities had developed while using Rockstar's games.

Then the team building FiveM itself moved inside Rockstar.

From there, the situation around GTA RP began to change substantially.

The distance between a culture that had grown outside Rockstar and Rockstar itself started closing rapidly.

What happened to the other custom multiplayer foundations of that period, RAGE:MP and alt:V, is covered in detail in [our article on RAGE:MP's ten-year history and shutdown](/en/news/55).

---

## 2025: NoPixel and Rockstar Join Forces

Then in 2025 came even bigger news.

NoPixel revealed that it was building "**NoPixel V**," a next-generation GTA V Roleplay experience, in collaboration with Rockstar Games.

At that point NoPixel began moving beyond being "the most famous RP server on FiveM."

A community that had spent years building its own culture on top of Rockstar's games would now build the next RP environment together with Rockstar itself.

For anyone who remembers the Arma 3 days of 2016, that is quite a change.

---

## 2026: Rockstar Itself Formally Announces NoPixel V

Then, on September 1, 2026.

Rockstar Games published "**Introducing nopixel V**" on its official Newswire.

Rockstar introduces NoPixel as a community that has expanded what GTA Roleplay can be through character immersion, modifications to the GTA V map, and its community of storytellers.

And it formally announced that NoPixel V's closed beta begins September 8.

Invited players access it from the Rockstar Games Launcher.

It also came to light that NoPixel and Rockstar have collaborated since the development stage, working on new features and improvements to development tools.

Set against NoPixel's roughly ten years, that is a highly symbolic destination.

It began as an RP community in 2016, moved to GTA V, grew enormous on FiveM, came to be watched worldwide through Twitch — and ten years later, Rockstar itself is introducing its new generation on its official site.

The specifics of that announcement — 1,000 ownable properties, the Pixel Hotel & Casino, the Cypress Flats redevelopment, the Twitch Drops tie-in with GTA Online — are covered in [our article on the NoPixel V announcement](/en/news/57).

---

## Ten Years of NoPixel, as a Timeline

![A graphic titled "NoPixel's history – roughly ten years" laying out six milestones from Arma 3 in 2016 to the formal NoPixel V announcement in 2026 (captions in Japanese)](/images/news/nopixel-history/nopixel-history-timeline.webp)

| Year | Major NoPixel events |
| --- | --- |
| 2016 | NoPixel's history begins; early on it runs an RP community set in Arma 3 |
| 2017 onward | Full move to a NoPixel built on GTA V / FiveM |
| 2017–2020 | The NoPixel 2.0 era; the GTA RP environment develops substantially |
| Around 2019 | Popular streamers join, drawing worldwide attention centered on Twitch |
| February 5, 2021 | NoPixel 3.0 launches |
| 2021 onward | GTA RP grows further as massive live streaming content |
| August 2023 | Cfx.re, FiveM's developer, joins Rockstar Games |
| December 15, 2023 | NoPixel 4.0 launches |
| 2025 | NoPixel V, made in collaboration with Rockstar, is announced |
| May 2026 | NoPixel turns ten |
| September 1, 2026 | Rockstar Games formally announces NoPixel V |
| September 8, 2026 | NoPixel V closed beta scheduled to begin |

Taken together with NoPixel's own tenth-anniversary post and its history materials, the arc over roughly ten years runs: Arma 3 → GTA V/FiveM → a global GTA RP community → a joint project with Rockstar.

---

## How Does It Differ From GTA RP in Japan?

Approaching NoPixel from Japan, some people will wonder whether it is "like an overseas version of Stogura."

As an entry point, that is not far off.

Many participants enter one city, each playing a character, and stories emerge through police work, emergency services, crime, and running businesses, while viewers watch it through several streamers at once. That structure has plenty in common.

That said, NoPixel and Japan's various RP projects differ in operation, rules, how you join, culture, and systems, so treating "NoPixel = the overseas version of X" as an exact equivalence is not accurate.

NoPixel is NoPixel: a community that has spent roughly ten years building a culture of its own.

---

## Why GTA6 FEED Follows NoPixel

And here is the main reason to know about NoPixel right now.

GTA6 is due out on November 19, 2026.

Just before that, in September, Rockstar formally announced NoPixel V and held up GTA RP as a leading example of "a new way to play created by the creator community."

But NoPixel V is a GTA V RP project.

Rockstar has not announced that NoPixel V will move to GTA6, nor that FiveM will be supported at GTA6's launch.

Those must not be conflated.

Even so, the fact that Rockstar — right before GTA6's release — is collaborating with one of the largest GTA RP communities in the world and delivering its new generation through the Rockstar Games Launcher matters a great deal for thinking about the relationship between the GTA series and RP culture going forward.

The question of what roleplay looks like in GTA6 is also covered in [our article on where GTA RP culture currently stands](/en/news/18).

---

## From "Famous RP Server" to Rockstar's Partner

Look back over NoPixel's history and it is clear that NoPixel V did not appear out of nowhere.

It started on Arma 3, moved to GTA V, built its own city using FiveM, tied itself to streaming culture, and spread worldwide.

Over that time GTA RP itself changed too.

What had been a niche pastime for some PC gamers became huge live content with hundreds of thousands of viewers following its stories — and eventually something Rockstar itself introduces on its official Newswire.

So understanding NoPixel V takes more than the feature list of "a new casino was added" or "the NPCs got smarter."

Why did Rockstar end up working with NoPixel?

Part of the answer lies in these ten years of history.

NoPixel spent years cultivating GTA RP as a way to play and spreading it worldwide as streaming culture. And in 2026, that community reached the point of building "the next GTA V Roleplay" together with Rockstar Games.

What final shape NoPixel and FiveM take in the GTA6 era is still unknown.

But if you are going to follow GTA6 and GTA RP news from here, "NoPixel" has become a name worth remembering.

---

## Sources

→ [NoPixel official site](https://www.nopixel.net/)

→ [Introducing nopixel V (Rockstar Games Newswire)](https://www.rockstargames.com/newswire/article/17857581o753k1/introducing-nopixel-v)

→ [Rockstar touts new invite-only NoPixel V GTA roleplaying server as "the next evolution of the RP community" (PC Gamer)](https://www.pcgamer.com/games/grand-theft-auto/rockstar-touts-new-invite-only-nopixel-v-gta-roleplaying-server-as-the-next-evolution-of-the-rp-community/)

---

> **Note:** This article was compiled by GTA6 FEED from NoPixel's own posts and history materials, Rockstar Games Newswire announcements, and reporting from outlets including PC Gamer. GTA6 FEED is not affiliated with Rockstar Games, Take-Two Interactive, or the NoPixel team. Version start dates (3.0 on February 5, 2021; 4.0 on December 15, 2023) and the tenth-anniversary timing come from NoPixel's public information. Nothing has been announced by Rockstar about FiveM being usable on GTA6 or NoPixel V moving to GTA6, and this article does not treat either as settled. All images were generated with AI to illustrate the article and are not actual gameplay, official UI, or real server screenshots. Logos and box art appearing in the timeline graphic belong to their respective rights holders and are placed for explanatory purposes. Text in the key art and the timeline graphic is in Japanese. The video embedded at the top is hosted on NoPixel's official YouTube channel and remains the property of its rights holders.`,
  },
  {
    id: 57,
    title:
      'NoPixel V正式発表――Rockstarと作る「次世代GTA RP」、1000物件・新カジノ・GTA Online連携まで判明',
    displayTitle:
      'NoPixel V正式発表\nRockstarと作る「次世代GTA RP」、1000物件・新カジノ・GTA Online連携まで判明',
    description:
      '2026年9月1日、Rockstar GamesがNewswireでNoPixel Vを正式に紹介した。9月8日開始のクローズドβ、Rockstar Games Launcherからのアクセス、刷新されたキャラクターカスタマイズ、Pixel Hotel & Casino、Cypress Flatsの6ブロック再開発、そして最大GTA$1,500,000のTwitch Drops。RAGE:MP終了の翌日に始まった「次世代GTA RP」を整理する。',
    icon: '📣',
    image: '/images/news/nopixel-v-official-reveal/eyecatch.webp',
    category: 'release',
    date: '2026-09-02',
    publishedAt: '2026-09-02 13:30',
    source:
      'Rockstar Games Newswire「Introducing nopixel V」／NoPixel公式／PC Gamer ほか',
    sourceUrl: 'https://www.rockstargames.com/newswire/article/17857581o753k1/introducing-nopixel-v',
    relatedArticles: [41, 55, 18],
    aiSummary: [
      '2026年9月1日、Rockstar GamesがNewswireでNoPixel Vを正式に取り上げた。9月8日からRockstar Games Launcher経由の招待制クローズドβが始まり、Rockstarは刷新されたキャラクターカスタマイズ、Pixel Hotel & Casino、Cypress Flatsの6ブロック再開発、より反応的な歩行者などを具体的に紹介している。',
      'NoPixel側はRockstarとの協力が今回のリリースの重要な要素だったと説明し、両チームが開発開始以来、新機能と開発ツールの改良に取り組んできたとしている。一方でPC Gamerが報じた「1,000件の所有可能物件」はRockstarのNewswireには記載がなく、公式発表の数字ではない。',
      '9月8日から30日まで、対象のNoPixel V Twitch配信を視聴すると最大GTA$1,500,000とBurger Shot TracksuitがGTA Onlineで受け取れる。ただしGTA6でFiveMが動く、NoPixel VがGTA6へ移行するといった発表はなく、GTA6のRP対応は現時点で未発表のままである。',
    ],
    fullContent: `# NoPixel V正式発表――Rockstarと作る「次世代GTA RP」、1000物件・新カジノ・GTA Online連携まで判明

NoPixel（ノーピクセル）は、2016年から約10年にわたって発展してきた世界最大級のRPコミュニティで、GTA V/FiveMを舞台に警察・犯罪者・市民などをプレイヤー自身が演じるGTA RPを世界的な配信文化へ押し上げた代表的な存在だ。

▶ [NoPixelとは？ Arma 3時代からRockstarと組むまでの10年の歴史を詳しく見る](/news/58)

GTA RPにとって、2026年9月1日はひとつの節目として記録される日になるかもしれない。

世界最大級のGTA RPコミュニティとして知られるNoPixelの次世代版「NoPixel V」が正式に姿を現した。トレーラーが公開されただけではない。Rockstar Games自身がNewswireでNoPixel Vを取り上げ、9月8日から始まるクローズドβ、Rockstar Games Launcherからのアクセス、刷新されたキャラクターカスタマイズ、新しい街区、より反応的なNPC、そしてGTA Onlineと連動するTwitch Dropsまで発表した。

![NoPixel V ローンチトレーラー（NoPixel公式YouTube）](https://www.youtube.com/watch?v=fVCD9oKjtZs)

*※本記事に掲載している画像は、記事の内容をイメージしやすくするためにAIで生成したものです。実際のNoPixel Vのゲーム画面・UI・実在のサーバー画面ではありません。*

ここまでなら、「Rockstar公認の有名RPサーバーが大型アップデートされる」というニュースにも見える。

しかし、今回の発表で重要なのはそこではない。

RockstarはNoPixel Vを「**GTAV Roleplay Communityの次の進化**」として紹介している。そしてNoPixel側も、Rockstarとの協力が今回のリリースを実現する重要な要素だったと説明している。

かつてRockstarの外側で発展してきたGTA RPが、いよいよRockstar自身のプラットフォームと深く結びつき始めた。

---

## NoPixel V、9月8日にクローズドβ開始

![夕暮れの大通り。ネオンが灯りはじめた街並みを、旧型のマッスルカーとスポーツカーが並んで走っている](/images/news/nopixel-v-official-reveal/sunset-strip-cruise.webp)

NoPixel Vのクローズドβは2026年9月8日にスタートする。

現時点では誰でも参加できる一般公開ではなく、招待されたプレイヤーが対象だ。参加者はRockstar Games Launcherを通じてNoPixel Vへアクセスする。Rockstarは9月8日以降、配信プラットフォームでNoPixelコミュニティによるプレイを視聴できるとしており、おなじみのキャラクターだけでなく、新しいキャラクターによる物語も始まるとしている。

ここは従来のNoPixelとの大きな違いのひとつだ。

NoPixelは長年、GTA Vをベースにしながら独自のシステムやルールを積み上げ、大規模なRPコミュニティへ成長してきた。しかしNoPixel Vでは、その入口にRockstar Games Launcherが登場する。

単にNoPixelのバージョン番号が「4」から「V」へ変わったという話ではない。

NoPixelという巨大RPコミュニティとRockstarの公式エコシステムとの距離が、目に見える形で縮まったのである。

クローズドβの日程や招待制、ホワイトリストのリセットについては、[NoPixel Vのクローズドβが9月8日に始まると報じられた段階の記事](/news/41)でも整理している。今回のNewswireは、そこで報じられていた内容をRockstar側から裏づける形になった。

---

## RockstarがNoPixel Vの「ゲーム内容」まで紹介

![キャラクター作成画面。左側に顔・髪型・衣装のプリセットが並び、中央の人物が鏡に映った自分の姿を確認している](/images/news/nopixel-v-official-reveal/character-customization.webp)

今回のNewswireでもうひとつ印象的なのは、RockstarがNoPixelの存在を紹介するだけで終わっていないことだ。

NoPixel Vで何が変わるのかについても、かなり具体的に説明している。

まず、キャラクターカスタマイズシステムが再構築される。Rockstarによれば、プレイヤーはキャラクターのバックストーリーに合わせて、これまで以上に個性的な人物を作れるようになる。

RPでは非常に重要な変更だ。

通常のGTA Onlineなら、自分のキャラクターを格好良くすること自体が目的になることも多い。しかしRPでは、外見そのものが物語の一部になる。

警察官なのか、ギャングなのか、会社員なのか、ホームレスなのか。あるいは街で誰もが知っている奇妙な人物なのか。見た目からその人物の人生を表現する必要があるからだ。

NoPixel Vでは、その部分がさらに強化されることになる。

---

## Los Santosそのものも作り直す

![夜のPIXEL HOTEL & CASINO。紫のネオンサインが灯るエントランスに車が停まり、着飾った客が集まっている](/images/news/nopixel-v-official-reveal/pixel-hotel-casino-entrance.webp)

変わるのはキャラクターだけではない。

Rockstarが公式に挙げた代表的な場所が、Pixel Hotel & Casinoだ。

![シャンデリアの下に広がるカジノフロア。ブラックジャックのテーブルでディーラーと客が向かい合い、奥にはスロットマシンが並ぶ](/images/news/nopixel-v-official-reveal/pixel-casino-interior.webp)

さらにCypress Flatsでは、6ブロック規模の再開発が行われる。

![雨に濡れた埠頭の道路。CYPRESS FLATSと落書きされた壁の脇を走るバイクを、複数のパトカーが追いかけている](/images/news/nopixel-v-official-reveal/cypress-flats-chase.webp)

これは単純に建物をひとつ追加する程度の変更ではない。既存のLos Santosを土台にしながら、RPの舞台として使いやすいよう街そのものを作り替えていく方向性が見えてくる。

Rockstarはそのほかにも、ビジュアルの刷新、合法・非合法双方での新しい稼ぎ方、そしてより賢く、プレイヤーの行動に反応する歩行者をNoPixel Vの特徴として挙げている。

![昼のダウンタウンを上空から見た風景。運河沿いに高層ビルと低層の住宅街が広がり、ヘリコプターが飛んでいる](/images/news/nopixel-v-official-reveal/los-santos-daytime.webp)

GTA RPでは、プレイヤー同士のロールプレイが主役になりやすい。その一方で、街を歩くNPCはどうしても「背景」になりがちだった。

そのNPCがより反応的になるのであれば、Los Santosを単なるRP用マップではなく、より生きた街として感じさせるための重要な変更になる可能性がある。

ただし、現段階ではNPCが具体的にどの程度賢くなるのか、どんな行動へ反応するのかといった詳細までは明らかになっていない。

---

## 「所有できる物件は1,000件」との情報も

![夕方の資材置き場に集まった男たち。テーブルの上には札束と拳銃が置かれ、椅子に座った人物と向かい合っている](/images/news/nopixel-v-official-reveal/criminal-meeting-yard.webp)

さらにPC Gamerは、NoPixel VによるGTA Vマップの改変について、1,000件の所有可能な物件が追加されると報じている。

これはRockstarのNewswire本文に記載されている数字ではないため、「Rockstarが1,000物件を公式発表した」とするのは正確ではない。

しかしNoPixel Vが目指している規模を考える上では興味深い数字だ。

RPにおける家や店舗は、単なるセーブポイントではない。

自宅として使う人もいれば、店を経営する人もいる。ギャングの拠点になったり、誰にも知られていない取引場所になったり、プレイヤー同士の物語が始まる舞台にもなる。

もし1,000件規模の所有可能物件が実際に運用されるなら、NoPixel Vは「新しいジョブを追加したNoPixel」ではなく、Los SantosそのものをRP向けに再設計するプロジェクトと考えた方が近い。

---

## RockstarとNoPixelは何を一緒に作ったのか

そして、今回もっとも注目しておきたい部分がある。

NoPixel側はRockstarとの関係について、今回のリリースを実現する上でRockstarとの協力が重要だったと説明している。

さらに両チームはNoPixel Vの開発開始以来、新しい能力の開発や開発ツールの改良に取り組んできたとしている。

これはかなり興味深い。

Rockstarが完成したNoPixel Vを後から「公認した」というだけではなく、開発段階から両者が協力していたことになるからだ。

ただし、この情報から「NoPixel Vの技術がGTA6に使われる」「GTA6でFiveMが動く」「GTA6 OnlineにRPモードが搭載される」といったところまで話を広げることはできない。

NoPixel Vは現在のところGTA VをベースとしたRP環境であり、RockstarはGTA6のオンライン展開とNoPixel Vを直接結びつける発表をしていない。PC Gamerも、GTA6発売が迫る一方で、RockstarはGTA6に関連するGTA Onlineの計画をまだ発表していないと指摘している。

ここは明確に分けて考える必要がある。

それでも、「RockstarとRP開発者が共同でツールや機能を改良している」という事実そのものは、今後のGTA RPを考える上で非常に大きい。

---

## NoPixel Vを見ると、GTA Onlineで150万GTA$がもらえる

![夜の湾岸を上空から見た風景。橋を渡る車列と観覧車の明かりが水面に映り、警察のヘリコプターが飛んでいる](/images/news/nopixel-v-official-reveal/night-city-helicopter.webp)

さらに今回、Rockstarは非常に象徴的な施策を用意した。

NoPixel Vを視聴すると、GTA Online側で報酬がもらえる。

9月8日から30日まで、対象となるNoPixel VのTwitch配信を視聴することで、最大GTA$1,500,000とBurger Shot TracksuitをGTA Onlineで獲得できるTwitch Dropsが実施される。

一見すると、よくある視聴キャンペーンにも見える。

しかしGTA RPの歴史を考えると意味は小さくない。

これまでNoPixelを見ている層と、GTA Onlineを普通に遊んでいる層は、同じGTAファンでありながら別々のコミュニティとして存在してきた。

今回Rockstarは、NoPixel Vを見る → Twitch Dropsを獲得する → GTA Onlineで報酬を受け取る、という公式の導線を作った。

つまりNoPixel Vを、RPをすでに知っている人だけのコンテンツとして扱っていない。

通常のGTA OnlineプレイヤーにもRPを見てもらおうとしている。

これはRockstarがGTA RPをどのような位置づけで見始めているのかを考える上で、非常に分かりやすい変化だ。

---

## 9月8日は「完成」ではなく始まり

そしてNoPixel Vは、9月8日に完成して終わるプロジェクトでもない。

Rockstarは今回の発表の最後で、今後のアップデートについても触れている。

予定されているのは、新しいPC向けゲーム内オーバーレイ、今後のイベント、そしてNoPixel Vへのアクセス拡大だ。

特に重要なのは最後の部分だろう。

現時点のNoPixel Vは招待制であり、誰でも参加できるサーバーではない。PC Gamerによれば、NoPixel側は今後さらに複数段階で招待を拡大すると説明する一方、既存のNoPixel PublicとNoPixel 4.0については「何も変わらない」としている。

つまり9月8日はゴールではなく、新しいNoPixelを徐々に広げていく最初のフェーズになる。

一般プレイヤーが最終的にどこまで参加できるのか、Publicや4.0とどう棲み分けるのかについては、今後の発表を待つ必要がある。

---

## RAGE:MPが終わった直後に、Rockstar×NoPixelが始まった

![夕暮れの大通りに立つPIXEL HOTEL & CASINOのネオンサイン。カジノへ向かって車が走っている](/images/news/nopixel-v-official-reveal/pixel-casino-street.webp)

今回の発表を単独で見るだけでも大きなニュースだが、GTA RP全体の歴史に置いてみると、さらに象徴的に見える。

2026年8月31日、RAGE Multiplayerは約10年にわたる歴史を終えた。

そして翌9月1日、RockstarはNoPixel Vを正式発表した。

もちろん、この2つが意図的に連動した日程だとする根拠はない。

それでも、時代の境目として見ると非常に興味深い。

GTA Vでは長い間、FiveM、RAGE:MP、alt:Vなど複数のカスタムマルチプレイ基盤が存在し、その上でユーザー自身が街を作り、仕事を作り、ルールを作り、RP文化を育ててきた。この10年の流れは[RAGE:MPの歴史と終了をまとめた記事](/news/55)で整理している。

しかし現在、その構図は大きく変わっている。

FiveMを開発するCfx.reはRockstar Games傘下となり、NoPixel VはRockstarとの共同開発を明言し、Rockstar Games Launcherからアクセスする。そしてRockstar自身がNewswireでRPコミュニティを紹介し、GTA Online側へ報酬まで用意するようになった。

GTA RPは、Rockstarの外側だけに存在する文化ではなくなりつつある。

---

## では、GTA6時代のRPはどうなるのか

当然、ここで気になるのがGTA6だ。

GTA6は2026年11月19日にPS5とXbox Series X|S向けに発売予定で、発売まで残された時間は少なくなっている。

しかし現時点でRockstarは、GTA6でFiveMが利用できるとも、NoPixel VがGTA6へ移行するとも、GTA6に公式RPモードが搭載されるとも発表していない。

したがって、NoPixel Vを「GTA6 RPのテスト」と断定することはできない。

一方で、2026年のRockstarがGTA RPをどれほど重要視しているのかについては、今回の発表からかなりはっきり見えてきた。

Rockstar Games LauncherからRPへ入る。

RockstarとRP開発者が一緒に開発ツールを改良する。

RP配信を見ることでGTA Onlineの報酬を受け取る。

そして将来的にはアクセスをさらに広げる。

数年前なら、どれも想像しにくかった光景だ。GTA6のロールプレイがどうなるのかという論点そのものは、[GTA6のRP文化の現在地をまとめた記事](/news/18)でも扱っている。

---

## 「次世代GTA RP」はもう始まっている

NoPixel Vで本当に注目すべきなのは、新しいカジノでも、1,000件の物件でもないのかもしれない。

それらを作っている環境そのものが変わったことだ。

かつてGTA RPは、Rockstarが作ったGTA Vの外側でコミュニティが独自に育てた遊びだった。

そこからFiveMが巨大化し、Cfx.reがRockstar傘下となり、今度は世界最大級のRPコミュニティであるNoPixelがRockstarと協力して次世代版を作るところまで来た。

9月8日に始まるのは、NoPixelの新しいシーズンだけではない。

GTA RPという文化が、コミュニティ主導で生まれた文化から、Rockstarとクリエイターが同じエコシステムの中で育てる文化へ変わっていく過程を、初めて大規模に見ることになるのかもしれない。

そしてそのわずか約2か月後には、GTA6が控えている。

NoPixel VがGTA6と直接つながるのかは、まだ誰にも分からない。

だからこそ、今回のNoPixel Vは「GTA6 RPの答え」ではない。

GTA6時代のRPがどこへ向かうのかを考える上で、これまでで最も重要なヒントのひとつなのである。

---

## 参考リンク

→ [Introducing nopixel V（Rockstar Games Newswire）](https://www.rockstargames.com/newswire/article/17857581o753k1/introducing-nopixel-v)

→ [NoPixel公式サイト](https://www.nopixel.net/)

→ [Rockstar touts new invite-only NoPixel V GTA roleplaying server as "the next evolution of the RP community"（PC Gamer）](https://www.pcgamer.com/games/grand-theft-auto/rockstar-touts-new-invite-only-nopixel-v-gta-roleplaying-server-as-the-next-evolution-of-the-rp-community/)

---

> **注記：** 本記事は、Rockstar Games NewswireのNoPixel V紹介記事、NoPixel公式の発表、およびPC Gamerなどの報道をもとにGTA6 FEEDが整理したものであり、Rockstar Games／Take-Two InteractiveおよびNoPixel運営とは一切関係がない。クローズドβの開始日、Rockstar Games Launcherからのアクセス、キャラクターカスタマイズの刷新、Pixel Hotel & Casino、Cypress Flatsの再開発、Twitch Drops（最大GTA$1,500,000とBurger Shot Tracksuit）はRockstarの発表にもとづく。1,000件の所有可能物件はPC Gamerの報道にもとづくもので、Rockstarが公式に発表した数字ではない。GTA6におけるFiveMの扱いや公式RPモードの有無については、現時点でRockstarからの発表がなく、本記事でも確定情報としては扱っていない。冒頭に埋め込んだ動画はNoPixel公式のYouTubeチャンネルで公開されているもので、著作権は権利者に帰属する。掲載画像はいずれも記事内容をイメージしやすくするためにAIで生成したもので、実際のゲーム画面・公式UI・実在のサーバー画面ではない。アイキャッチには日本語のテキストが含まれる。`,
    titleEn:
      'NoPixel V Officially Revealed — the "Next Evolution of GTA RP" Built With Rockstar: 1,000 Properties, a New Casino, and a GTA Online Tie-In',
    displayTitleEn:
      'NoPixel V Officially Revealed\nThe "Next Evolution of GTA RP" Built With Rockstar',
    descriptionEn:
      'On September 1, 2026, Rockstar Games formally introduced NoPixel V on Newswire: a closed beta starting September 8, access via the Rockstar Games Launcher, rebuilt character customization, the Pixel Hotel & Casino, a six-block Cypress Flats redevelopment, and Twitch Drops worth up to GTA$1,500,000. A look at the "next generation of GTA RP" that began the day after RAGE:MP shut down.',
    aiSummaryEn: [
      'On September 1, 2026, Rockstar Games covered NoPixel V on Newswire. An invite-only closed beta begins September 8 through the Rockstar Games Launcher, and Rockstar describes specifics: rebuilt character customization, the Pixel Hotel & Casino, a six-block Cypress Flats redevelopment, and more reactive pedestrians.',
      'NoPixel says collaboration with Rockstar was a key element in making the release possible, and that both teams have worked on new capabilities and improved development tools since development began. The "1,000 ownable properties" figure reported by PC Gamer does not appear in Rockstar\'s Newswire post and is not an official number.',
      'From September 8 to 30, watching eligible NoPixel V streams on Twitch earns up to GTA$1,500,000 and the Burger Shot Tracksuit in GTA Online. Nothing has been announced about FiveM running on GTA6 or NoPixel V moving to GTA6, and GTA6 RP support remains unannounced.',
    ],
    fullContentEn: `# NoPixel V Officially Revealed — the "Next Evolution of GTA RP" Built With Rockstar: 1,000 Properties, a New Casino, and a GTA Online Tie-In

NoPixel is one of the largest roleplay communities in the world, built up over roughly ten years since 2016. Using GTA V and FiveM as its stage, where players themselves take on the roles of police officers, criminals, and ordinary citizens, it is the community that pushed GTA RP into a global streaming culture.

▶ [What is NoPixel? A closer look at ten years of history, from the Arma 3 days to partnering with Rockstar](/en/news/58)

For GTA RP, September 1, 2026 may end up recorded as a turning point.

NoPixel V, the next-generation version of NoPixel — known as one of the largest GTA RP communities in the world — has formally been revealed. And not just with a trailer. Rockstar Games itself covered NoPixel V on Newswire, announcing a closed beta starting September 8, access through the Rockstar Games Launcher, a rebuilt character customization system, new districts, more reactive NPCs, and Twitch Drops that pay out in GTA Online.

![NoPixel V launch trailer, from the official NoPixel YouTube channel](https://www.youtube.com/watch?v=fVCD9oKjtZs)

*Note: the images in this article were generated with AI to help illustrate the topic. They are not actual NoPixel V gameplay, official UI, or screenshots of any real server. Captions on the key art are in Japanese.*

Stated that way, it could still read as "a well-known Rockstar-approved RP server is getting a big update."

But that is not what makes this announcement significant.

Rockstar introduces NoPixel V as "**the next evolution of the GTAV Roleplay Community**". NoPixel, for its part, says that collaboration with Rockstar was a key element in making this release possible.

GTA RP, a culture that grew up outside Rockstar, has begun to tie itself directly into Rockstar's own platform.

---

## NoPixel V Closed Beta Begins September 8

![A wide boulevard at dusk with neon starting to glow, an older muscle car and a sports car driving side by side](/images/news/nopixel-v-official-reveal/sunset-strip-cruise.webp)

The NoPixel V closed beta starts on September 8, 2026.

It is not a general public release — it is limited to invited players, who reach NoPixel V through the Rockstar Games Launcher. Rockstar says that from September 8 onward you will be able to watch the NoPixel community play on streaming platforms, with stories from new characters as well as the familiar ones.

That entry point is one of the biggest departures from NoPixel as it has existed until now.

For years NoPixel has built its own systems and rules on top of GTA V, growing into a large-scale RP community. With NoPixel V, the door into it is the Rockstar Games Launcher.

This is not simply NoPixel's version number moving from "4" to "V."

The distance between an enormous RP community and Rockstar's official ecosystem has visibly narrowed.

The beta dates, the invite-only access, and the whitelist reset were covered earlier in [our article from when NoPixel V's September 8 closed beta was first reported](/news/41). This Newswire post effectively confirms that reporting from Rockstar's side.

---

## Rockstar Describes NoPixel V's Actual Content

![A character creation screen with face, hair, and outfit presets down the left side, and the character checking their reflection in a mirror](/images/news/nopixel-v-official-reveal/character-customization.webp)

The other striking thing about this Newswire post is that Rockstar does not stop at acknowledging NoPixel exists.

It goes into considerable detail about what changes in NoPixel V.

First, the character customization system is being rebuilt. According to Rockstar, players will be able to create more distinctive characters that match their character's backstory than before.

For RP, that matters enormously.

In ordinary GTA Online, making your character look cool is often an end in itself. In RP, appearance is part of the story.

Police officer, gang member, office worker, someone living on the street — or the strange local figure everyone in the city knows. The look has to express that person's life.

NoPixel V is strengthening exactly that layer.

---

## Los Santos Itself Is Being Rebuilt

![The PIXEL HOTEL & CASINO at night, purple neon over the entrance, cars pulling up and dressed-up guests gathering](/images/news/nopixel-v-official-reveal/pixel-hotel-casino-entrance.webp)

Characters are not the only thing changing.

The flagship location Rockstar named is the Pixel Hotel & Casino.

![A casino floor beneath chandeliers, a dealer facing players at a blackjack table with rows of slot machines behind them](/images/news/nopixel-v-official-reveal/pixel-casino-interior.webp)

On top of that, Cypress Flats gets a six-block redevelopment.

![A rain-slicked dockside road, a motorcycle running past a wall tagged CYPRESS FLATS with several police cars in pursuit](/images/news/nopixel-v-official-reveal/cypress-flats-chase.webp)

This is not a matter of dropping in one new building. Using the existing Los Santos as a foundation, the city itself is being reworked to function better as a stage for roleplay.

Rockstar also lists a visual overhaul, new ways to earn money both legally and illegally, and smarter pedestrians who react to what players do.

![A daytime aerial view of downtown, high-rises and low residential blocks along a waterway, with a helicopter overhead](/images/news/nopixel-v-official-reveal/los-santos-daytime.webp)

In GTA RP, roleplay between players tends to be the main event. The NPCs walking the streets, meanwhile, have generally been scenery.

If those NPCs become more reactive, that could be an important change in making Los Santos feel like a living city rather than just a map to roleplay on.

At this stage, though, no details have been given about how much smarter the NPCs actually are, or what kinds of player behavior they respond to.

---

## Reports of "1,000 Ownable Properties"

![Men gathered in a supply yard in the late afternoon, cash and a pistol on a table, facing a seated figure](/images/news/nopixel-v-official-reveal/criminal-meeting-yard.webp)

PC Gamer reports that NoPixel V's changes to the GTA V map add 1,000 ownable properties.

That figure does not appear in the body of Rockstar's Newswire post, so it would not be accurate to say "Rockstar officially announced 1,000 properties."

It is an interesting number for gauging the scale NoPixel V is aiming at, though.

In RP, a house or a storefront is not just a save point.

Some people live in them. Some run businesses out of them. They become gang bases, or trade spots nobody else knows about, or the setting where a story between players begins.

If something on the order of 1,000 ownable properties really is in operation, NoPixel V is better understood not as "NoPixel with new jobs added" but as a project to redesign Los Santos itself for roleplay.

---

## What Did Rockstar and NoPixel Build Together?

And here is the part most worth watching.

On its relationship with Rockstar, NoPixel says that collaboration with Rockstar was important in making this release possible.

It adds that since NoPixel V's development began, both teams have worked on developing new capabilities and improving development tools.

That is quite interesting.

It means Rockstar did not merely bless a finished NoPixel V after the fact — the two sides were working together from the development stage.

That said, this does not stretch far enough to support claims like "NoPixel V's technology will be used in GTA6," "FiveM will run on GTA6," or "GTA6 Online will ship with an RP mode."

NoPixel V is, for now, an RP environment based on GTA V, and Rockstar has made no announcement connecting it directly to GTA6's online plans. PC Gamer likewise notes that with GTA6's release approaching, Rockstar has yet to announce any GTA Online plans related to GTA6.

These need to be kept clearly separate.

Even so, the plain fact that Rockstar and RP developers are jointly improving tools and features is a very large one for thinking about where GTA RP goes next.

---

## Watch NoPixel V, Get GTA$1.5 Million in GTA Online

![A night aerial view of the waterfront, a line of cars crossing a bridge, a Ferris wheel reflected in the water, a police helicopter in the air](/images/news/nopixel-v-official-reveal/night-city-helicopter.webp)

Rockstar has also set up something highly symbolic.

Watch NoPixel V, and you get rewarded on the GTA Online side.

From September 8 to 30, watching eligible NoPixel V streams on Twitch earns Twitch Drops worth up to GTA$1,500,000 plus the Burger Shot Tracksuit in GTA Online.

At a glance it looks like an ordinary watch-and-earn campaign.

Given the history of GTA RP, though, it is not a small thing.

Until now, the people watching NoPixel and the people simply playing GTA Online have existed as separate communities, even as fans of the same game.

What Rockstar has built here is an official path: watch NoPixel V → earn Twitch Drops → collect the reward in GTA Online.

In other words, NoPixel V is not being treated as content only for people who already know RP.

Rockstar is trying to get ordinary GTA Online players to watch RP too.

As a signal of how Rockstar has begun to position GTA RP, it is about as legible as it gets.

---

## September 8 Is a Beginning, Not a Finish Line

NoPixel V is also not a project that completes on September 8.

Rockstar closes the announcement by touching on future updates.

Planned are a new in-game overlay for PC, upcoming events, and expanded access to NoPixel V.

That last item is the important one.

As it stands, NoPixel V is invite-only, not a server anyone can join. According to PC Gamer, NoPixel says invitations will expand in several further stages, while for the existing NoPixel Public and NoPixel 4.0, "nothing changes."

So September 8 is not a finish line but the first phase of gradually widening the new NoPixel.

How far ordinary players will eventually be able to participate, and how V will coexist with Public and 4.0, will have to wait for further announcements.

---

## RAGE:MP Ended, and Rockstar × NoPixel Began the Next Day

![A boulevard at dusk with the PIXEL HOTEL & CASINO neon sign, cars heading toward the casino](/images/news/nopixel-v-official-reveal/pixel-casino-street.webp)

This would be major news on its own, but placed against the whole history of GTA RP it looks even more symbolic.

On August 31, 2026, RAGE Multiplayer ended roughly ten years of history.

The next day, September 1, Rockstar formally announced NoPixel V.

There is of course no basis for saying the two dates were deliberately coordinated.

As a seam between eras, though, it is striking.

For a long time GTA V hosted multiple custom multiplayer foundations — FiveM, RAGE:MP, alt:V — and on top of them users built their own cities, jobs, and rules, and grew an RP culture. That decade is laid out in [our article on RAGE:MP's history and shutdown](/news/55).

Today that picture has changed considerably.

Cfx.re, the developer of FiveM, is now part of Rockstar Games. NoPixel V states outright that it was co-developed with Rockstar and is accessed through the Rockstar Games Launcher. And Rockstar itself is introducing the RP community on Newswire and handing out rewards on the GTA Online side.

GTA RP is no longer a culture that exists only outside Rockstar.

---

## So What Happens to RP in the GTA6 Era?

Which naturally raises the question of GTA6.

GTA6 is due on November 19, 2026 for PS5 and Xbox Series X|S, and there is not much time left.

As of now, though, Rockstar has not announced that FiveM will be usable on GTA6, that NoPixel V will move to GTA6, or that GTA6 will ship with an official RP mode.

NoPixel V therefore cannot be declared "a test for GTA6 RP."

What has become quite clear from this announcement is how much weight Rockstar in 2026 places on GTA RP.

You enter RP from the Rockstar Games Launcher.

Rockstar and RP developers improve development tools together.

Watching RP streams earns you GTA Online rewards.

And access is set to widen further in the future.

A few years ago, none of that would have been easy to picture. The broader question of what roleplay looks like in GTA6 is covered in [our article on where GTA RP culture currently stands](/news/18).

---

## The "Next Generation of GTA RP" Has Already Started

The thing genuinely worth watching in NoPixel V may be neither the new casino nor the 1,000 properties.

It is that the environment in which they are being built has changed.

GTA RP was once a pastime the community grew on its own, outside the GTA V that Rockstar made.

From there FiveM became enormous, Cfx.re joined Rockstar, and now one of the largest RP communities in the world is building its next generation in collaboration with Rockstar.

What begins on September 8 is not just a new NoPixel season.

It may be the first large-scale look at GTA RP shifting from a culture born of community initiative into one that Rockstar and creators cultivate inside the same ecosystem.

And roughly two months after that, GTA6 arrives.

Whether NoPixel V connects directly to GTA6, nobody outside can say yet.

Which is exactly why NoPixel V is not "the answer" for GTA6 RP.

It is one of the most important hints so far about where RP is headed in the GTA6 era.

---

## Sources

→ [Introducing nopixel V (Rockstar Games Newswire)](https://www.rockstargames.com/newswire/article/17857581o753k1/introducing-nopixel-v)

→ [NoPixel official site](https://www.nopixel.net/)

→ [Rockstar touts new invite-only NoPixel V GTA roleplaying server as "the next evolution of the RP community" (PC Gamer)](https://www.pcgamer.com/games/grand-theft-auto/rockstar-touts-new-invite-only-nopixel-v-gta-roleplaying-server-as-the-next-evolution-of-the-rp-community/)

---

> **Note:** This article was compiled by GTA6 FEED from Rockstar Games Newswire's NoPixel V post, NoPixel's own announcement, and reporting from outlets including PC Gamer. GTA6 FEED is not affiliated with Rockstar Games, Take-Two Interactive, or the NoPixel team. The closed beta date, Rockstar Games Launcher access, the rebuilt character customization, the Pixel Hotel & Casino, the Cypress Flats redevelopment, and the Twitch Drops (up to GTA$1,500,000 plus the Burger Shot Tracksuit) come from Rockstar's announcement. The figure of 1,000 ownable properties comes from PC Gamer's reporting and is not a number Rockstar announced. Nothing has been announced by Rockstar regarding FiveM support or an official RP mode in GTA6, and this article does not treat either as settled. The video embedded at the top is hosted on NoPixel's official YouTube channel and remains the property of its rights holders. All images were generated with AI to illustrate the article and are not actual gameplay, official UI, or real server screenshots.`,
  },
  {
    id: 56,
    title:
      "GTA6公式サイトにスクリーンショット29枚追加――本当に「初公開」だった3枚と、画像から見える4つの変化",
    displayTitle:
      "GTA6公式サイトにスクリーンショット29枚追加\n本当に「初公開」だった3枚と、画像から見える4つの変化",
    description:
      "2026年8月31日、GTA6公式サイトのギャラリーへスクリーンショット29枚が追加された。その大半はExtended Look公開週にメディアへ配布済みの4K素材だが、海外では3枚が初公開とみられている。車内のJasonとLucia、銃を手に並ぶ2人、人物のいないVice City――29枚全体から見える4つの変化を整理する。",
    icon: "📸",
    image: "/images/news/gta6-official-screenshots-29/jason-and-lucia-01.webp",
    category: "topic",
    date: "2026-08-31",
    publishedAt: "2026-08-31 22:00",
    source: "Rockstar Games公式サイト GTA VIスクリーンショットギャラリー／HobbyConsolas ほか",
    sourceUrl: "https://www.rockstargames.com/VI/screenshots",
    relatedArticles: [54, 53, 52],
    aiSummary: [
      "2026年8月31日、Rockstar Games公式サイトのGTA6ギャラリーにスクリーンショット29枚が追加された。大半は8月27日の「An Extended Look」公開に合わせて海外メディアへ配布された4Kプレス素材で、公式サイトへ集約されたのが今回。「29枚すべてが新規公開」ではない点に注意が必要だ。",
      "一方、HobbyConsolasなど海外メディアは、この29枚のうち3枚がこれまで一般に確認されていなかったと報じている。車内でドリンクを手にするJasonとドアへ身を寄せるLucia、銃を持って並ぶ2人のローアングル、そして人物のいないVice Cityの湾岸建築という、いずれも派手さのない3枚だった。",
      "29枚全体からは、JasonとLuciaが現場を共有するペアとして設計されていること、2人の外見バリエーションが大きいこと、昼のVice Cityの情報密度が高いこと、そして「景色を見せる観光写真」より強盗・逃走・対峙といった行動の瞬間が多いことが読み取れる。ただし操作仕様の断定はできず、画像から言えることと推測は分けて扱う必要がある。",
    ],
    fullContent: `# GTA6公式サイトにスクリーンショット29枚追加――本当に「初公開」だった3枚と、画像から見える4つの変化

2026年8月31日、Rockstar Gamesの『Grand Theft Auto VI』公式サイトに、大量のスクリーンショットが追加された。

今回追加されたのは29枚。GTA6の新しい映像「Grand Theft Auto VI: An Extended Look」が公開された8月27日前後に海外メディアやクリエイター向けに提供されていた4K画像を中心に、公式ギャラリーへまとめて収録したものだ。

そのため、「GTA6の完全新規スクリーンショットが29枚公開された」と理解すると少し違う。

29枚の大部分はExtended Look公開週にIGNをはじめとする海外メディアなどですでに掲載されていた画像で、今回初めてRockstar公式サイトに集約されたもの。一方、海外メディアやコミュニティでは、この29枚の中に、それまで一般公開されていなかったとみられる3枚が含まれていることが指摘されている。

そして、この3枚がなかなか興味深い。

派手な爆発や巨大な新ロケーションではない。JasonとLuciaが車で過ごす何気ない時間、銃を手に並ぶ2人、そして人物すら登場しないVice Cityの建築物だ。

しかし29枚全体を眺めていくと、Rockstarが今回見せようとしているものが少しずつ見えてくる。

それは単なる「GTA6はこんなに綺麗です」というグラフィックの宣伝ではない。JasonとLuciaがどのように一緒に行動し、プレイヤーが2人をどう変え、巨大なVice Cityの中で何をするゲームなのか。

今回の記事では、新たに公式ギャラリーへ追加された29枚を整理しながら、特に注目したいポイントを見ていく。

---

## GTA6公式ギャラリーに29枚が追加

Rockstar Games公式サイトのGTA6スクリーンショットギャラリーには、今回の更新によって29枚が追加された。

ここでまず整理しておきたいのが、「公式サイトへの追加」と「世界初公開」は同じではないということだ。

今回追加された画像の多くは、8月27日のExtended Look公開に合わせてメディアへ提供されたプレス素材とみられる。映像から単純にフレームを切り出したものではなく、ゲーム内の場面を高解像度の静止画として撮影した公式素材だ。

つまり、すでに海外メディアの記事を追っていた人なら見覚えのある画像も多い。

一方で、海外メディアHobbyConsolasなどは、今回の公式サイト更新によってこれまで確認されていなかった3枚の画像が登場したと報じている。

まずは、その3枚から見ていこう。

---

## 初公開とされる1枚目――車内で過ごすJasonとLucia

![オープンカーの助手席側のドアに腕をのせて外を眺めるLuciaと、運転席でドリンクを手にしたJason。背景にはVice Cityの高層ビル群が広がる](/images/news/gta6-official-screenshots-29/jason-and-lucia-03.webp)

最初の1枚は、JasonとLuciaが車に乗っている場面だ。

Jasonは運転席に座り、ドリンクを手にしている。その隣ではLuciaがドア側へ身体を寄せ、外の景色を眺めている。

銃撃戦でもなければ、強盗でもない。

むしろ注目したいのは、犯罪とは関係のない2人の日常が切り取られていることだ。

これまでGTA6の宣伝では、JasonとLuciaは犯罪を共にするカップルとして描かれてきた。銀行や店舗を襲い、警察から逃げ、銃を持って行動する姿は何度も登場している。

しかしGTA6が長時間のオープンワールドゲームである以上、2人が一緒にいる時間のすべてが犯罪になるわけではない。

車で街を走る。食事をする。会話をする。目的地まで移動する。

今回の1枚は、犯罪と犯罪の**あいだにある時間**までJasonとLuciaの関係を描こうとしている可能性を感じさせる。

もちろん、静止画だけから車内会話システムなどの具体的な仕様を断定することはできない。

それでも、Rockstarがわざわざこの何気ない場面を公式スクリーンショットとして選んだこと自体は興味深い。

---

## 初公開とされる2枚目――銃を持って並ぶ2人

![蛍光灯の下、ローアングルで見上げるように捉えられたLuciaとJason。2人ともそれぞれ拳銃を手にしている](/images/news/gta6-official-screenshots-29/jason-and-lucia-07.webp)

もう1枚は、下からJasonとLuciaを見上げるようなローアングルの画像だ。

2人はそれぞれ銃を持ち、肩が触れる位置に並んで立っている。

こちらは先ほどとは対照的に、GTA6の「犯罪者としての2人」を強く押し出した構図になっている。

しかし、ここでも注目したいのは銃そのものではない。

2人の距離だ。

GTA6ではJasonとLuciaを単に2人の操作キャラクターとして並べるのではなく、2人の関係を物語の中心に置いていることが、これまでのトレーラーや公式紹介でも繰り返し示されてきた。

今回の画像でも、2人はそれぞれ独立して立っているのではなく、身体が触れるほど近い。

日常では車に並んで座り、犯罪の現場では武器を持って並ぶ。

今回追加された画像を続けて見ると、RockstarがGTA6を「Jasonの物語＋Luciaの物語」ではなく**ひとつづきの物語**として見せようとしていることが改めて伝わってくる。

---

## 初公開とされる3枚目――人物のいないVice City

![Vice Cityの湾岸に建つ、波打つような曲線を持つ2棟の高層タワー。手前の水面をボートが走り、上空をヘリコプターが飛んでいる](/images/news/gta6-official-screenshots-29/vice-city-10.webp)

3枚目はさらに変わっている。

JasonもLuciaもいない。

写っているのは、Vice Cityの海岸沿いに建つ特徴的な曲線を持った建築物と、その周辺の都市景観だ。

GTA6といえばネオン、高級車、ビーチ、ヤシの木という派手なイメージが先行しがちだが、今回Rockstarが人物のいない建築写真のような画像を公式ギャラリーへ加えたことは、Leonidaそのものもひとつの主役として扱っていることを感じさせる。

特に最近公開された画像では、夜のネオンだけではなく日中のVice Cityを見せる場面が増えている。

そして、今回追加された29枚全体を見ると、この「昼の街」がかなり重要だ。

---

## 29枚から見えてくる① JasonとLuciaは「現場で動くペア」

![ダートバイクの後部座席から拳銃を構えるLuciaと、それを運転するJason。背後にはパトカーが迫り、上空を警察のヘリコプターが追っている](/images/news/gta6-official-screenshots-29/jason-and-lucia-09.webp)

初公開とされる3枚以外にも、今回公式サイトへ追加された画像にはJasonとLuciaが一緒に行動している場面が数多く含まれている。

車やバイクへ同乗する場面、強盗、室内で誰かと対峙している場面など、その状況はさまざまだ。

ここから感じられるのは、2人が単にストーリー上の恋人として存在しているのではなく、実際のゲームプレイでも一緒に行動する「相棒」として設計されていることだ。

GTA5ではMichael、Franklin、Trevorという3人の主人公が、それぞれ別の生活や人間関係を持ちながら必要に応じて合流した。

GTA6は少し違う。

今回のスクリーンショットを見る限り、JasonとLuciaが同じ場所にいること自体がゲームの基本的な風景になっている。

Extended Lookで示されたキャラクター切り替えなどの情報と組み合わせて考えると、GTA6では「どちらを操作するか」だけでなく、操作していないもう一人がその場で何をするのかも重要になりそうだ。

ただし、静止画だけから自由なタイミングでの切り替えや、同乗時の運転・射撃交代といった具体的な操作仕様までは断定できない。

---

## 29枚から見えてくる② LuciaとJasonはかなり見た目が変わる

![チェックキャッシングの店先で、ダッフルバッグを肩にかけ拳銃を手にしたLucia。グレーのパーカーとレギンス姿](/images/news/gta6-official-screenshots-29/lucia-caminos-08.webp)

今回の画像群で、もうひとつ分かりやすいのが外見の変化だ。

同じLuciaでも、画像によって髪型や服装が大きく違う。アクセサリーやタトゥーが確認できる場面もあり、Jasonについても服装やスタイルの違いが見られる。

1枚だけなら「ストーリー進行によって衣装が変わっただけ」と考えることもできる。

しかし、これまで公開された映像やスクリーンショットまで並べてみると、同じキャラクターとは思えないほど印象が変わるケースもある。

![夕暮れの水上で、キャップをかぶり水上機の脇に立つJason。背後には警察のボートが見える](/images/news/gta6-official-screenshots-29/jason-duval-08.webp)

少なくとも、GTA5よりも主人公の外見を変えることを強く意識した作品であることは伝わってくる。

髪型、衣服、アクセサリー、タトゥー。

さらにDazedによるRockstarへの取材では、キャラクターの身体的な変化についても言及されている。

ただし注意したいのは、今回の29枚だけで「体重を自由に変更できる」「筋肉量を好きな数値にできる」といった具体的な仕様まで確認できるわけではないことだ。

スクリーンショットから確実に言えるのは、JasonとLuciaの見た目にはかなり大きなバリエーションが存在するというところまでだろう。

---

## 29枚から見えてくる③ 昼のVice Cityが想像以上に重要

GTA6のVice Cityと聞いて、多くの人が最初に想像するのは夜だろう。

![夕暮れのVice City。手前の高層ビルの奥に観覧車と湾岸のネオンが広がり、上空をヘリコプターが飛んでいる](/images/news/gta6-official-screenshots-29/vice-city-11.webp)

ピンクとブルーのネオン、クラブ、高級車、ヤシの木。そのイメージは初期のプロモーションでも強く押し出されてきた。

しかし今回のスクリーンショットでは、日中のVice Cityがかなり印象的だ。

ウォーターフロントの向こうに高層建築が並び、海にはボートが浮かび、上空にはヘリコプターが飛ぶ。道路、建物、水面、空という異なる空間に同時にオブジェクトが存在し、一枚の画像の中だけでもかなりの情報量がある。

これは「マップが広い」ことを証明する画像ではない。

むしろ見えてくるのは、都市の密度だ。

[先行プレビューではGTA6の世界がGTA5より大幅に大きいという比較](/news/52)も伝えられているが、巨大なマップを作るだけなら、それほど難しい話ではない。重要なのは、その空間をどれだけ意味のある場所で埋められるかだ。

今回の日中スクリーンショットは、Rockstarが「広いLeonida」だけでなく、近い距離にも大量の情報が存在するLeonidaを作ろうとしていることを強く印象づける。

---

## 29枚から見えてくる④ 「観光写真」よりゲームプレイの瞬間が多い

![宝飾店の店内で、ショーケースのガラスが砕け散るなか自動小銃を構えるJasonと、その奥で拳銃を天井へ向けるLucia](/images/news/gta6-official-screenshots-29/jason-and-lucia-04.webp)

そして今回の29枚で最も重要なのがここかもしれない。

これまでのGTA6スクリーンショットには、美しい景色やキャラクターを見せる「観光ポスター」のような画像も多かった。

今回のセットは少し違う。

強盗、誰かとの対峙、バイクでの逃走、警察のヘリコプター、車への同乗、室内での会合。

「この世界がどんな場所なのか」だけではなく、「この世界で何をするのか」が見える画像が多い。

たとえば、ダートバイクに2人で乗り、上空から警察ヘリに追われている場面。

これだけでも、GTA6らしいゲームプレイの構造が凝縮されている。

2人で犯罪を起こし、乗り物で逃げ、警察に追跡される。その途中でJasonとLuciaが異なる役割を担う。

![ガラス扉の向こう、薄暗い室内で複数の人物に囲まれるように向き合うJasonとLucia](/images/news/gta6-official-screenshots-29/jason-and-lucia-05.webp)

同じように、室内で相手を取り囲む場面も、単なる人物紹介ではなく「誰かから情報を聞き出しているのではないか」と想像させる構図になっている。

もちろん、それが自由操作できる尋問システムなのか、ミッション中の演出なのかは画像だけでは分からない。

だからこそ、スクリーンショットから見えるものと、そこから先の推測は分けて考える必要がある。

---

## 6月の63枚とは役割がまったく違う

GTA6では6月の予約開始時にも大量の画像が公開されている。

Ultimate EditionやVintage Vice City Packなどに関連した素材を含めると、こちらも非常に大きな画像セットだった。

しかし、今回の29枚とは目的が違う。

6月の画像群がエディションや特典、衣装、車両など**購入すると何が手に入るのか**を伝えるカタログ的な役割を持っていたのに対し、今回の29枚は**GTA6を遊ぶとどんな瞬間に出会うのか**を見せるものになっている。

JasonとLuciaが車に乗る。街を歩く。誰かと対峙する。犯罪を起こす。警察から逃げる。

その合間に、巨大なVice Cityの風景が広がっている。

![炎上する車の前を、それぞれアタッシュケースとダッフルバッグ、そしてライフルを手にして歩き去るLuciaとJasonの後ろ姿](/images/news/gta6-official-screenshots-29/jason-and-lucia-08.webp)

一枚ずつ見れば小さな情報だが、29枚をひとつのセットとして見ると、Rockstarが発売前のプロモーションを次の段階へ進めていることが分かる。

---

## なぜRockstarは今、29枚を公式サイトへ集めたのか

[Extended Look](/news/48)によって、GTA6について分かる情報量は一気に増えた。

映像では数秒で通り過ぎてしまう場面も、4Kのスクリーンショットなら止めて見ることができる。

髪型、タトゥー、NPC、看板、車、建築物、水面の反射、遠景の交通。

そうした細部は、動画を普通に再生しているだけでは見落としやすい。

今回の29枚を公式ギャラリーへ追加した意味は、単純な「新画像公開」というより、Extended Lookで見せたGTA6を高解像度の静止画として改めて観察できるようにしたことにあるのだろう。

そして、その中へ初公開とされる3枚も混ぜられた。

派手な新キャラクターでも、新しい都市でもない。

車で過ごすJasonとLucia、銃を手に並ぶ2人、Vice Cityの建築。

そこから見えてくるのは、発売が近づくにつれてRockstarの宣伝が「GTA6には何があります」から、「GTA6でどんな時間を過ごすのか」へ変わり始めていることだ。

---

## 今回の29枚は、4Kで見てほしい

![夕日を背に見つめ合うJasonとLucia。周囲の湿地には保安官のエアボートが集まり、上空にはヘリコプターが旋回している](/images/news/gta6-official-screenshots-29/jason-and-lucia-13.webp)

スマートフォンの小さな画像だけでは、今回のスクリーンショットの価値はかなり失われる。

特に日中のVice City、水面や車体の反射、JasonとLuciaの髪や衣服、背景にいるNPCや車両などは、公式サイトで高解像度画像を開いて初めて気づく部分が多い。

→ [GTA VI公式スクリーンショットギャラリー（Rockstar Games）](https://www.rockstargames.com/VI/screenshots)

今回の更新を「スクリーンショット29枚追加」で終わらせるのは、少しもったいない。

29枚を通して見えてくるのは、JasonとLuciaは常に現場を共有するペアであり、2人の外見は大きく変化し、Vice Cityは昼でも圧倒的な情報量を持ち、ゲームプレイは強盗や追跡といった行動する場面へ踏み込んできたということだ。

そして、その中で本当に初めて姿を見せたとされる3枚が、派手な爆発ではなく「2人の日常」「2人の距離」「Vice Cityそのもの」だったことも興味深い。

GTA6の発売が近づくにつれて、Rockstarが見せ始めているのはゲームの機能一覧ではない。

LeonidaでJasonとLuciaとして生きる時間そのものなのかもしれない。

---

> **注記：** 本記事に掲載したスクリーンショットは、Rockstar Gamesが公式サイトのGTA VIギャラリーで公開しているプレス素材にもとづく（表示用に幅1280pxへ縮小）。著作権はRockstar Games／Take-Two Interactiveに帰属する。29枚のうち3枚が初公開とされる点はHobbyConsolasなど海外メディアの報道にもとづくもので、Rockstarが「初公開」と明言したものではない。画像から読み取れる内容と、そこから先のゲーム仕様に関する推測は本文中で区別している。`,
    titleEn:
      "29 Screenshots Added to the Official GTA6 Site — the 3 That Really Were New, and 4 Shifts Visible in the Set",
    displayTitleEn:
      "29 Screenshots Added to the Official GTA6 Site\nThe 3 That Really Were New, and 4 Shifts Visible in the Set",
    descriptionEn:
      "On August 31, 2026, 29 screenshots were added to the official GTA6 gallery. Most were 4K press assets already distributed to media during Extended Look week, but three are reported overseas as previously unseen: Jason and Lucia in a car, the pair standing together armed, and a Vice City building with no one in it. Here is what the full set of 29 shows.",
    aiSummaryEn: [
      "On August 31, 2026, 29 screenshots were added to the GTA6 gallery on Rockstar Games' official site. Most are 4K press assets distributed to overseas media around the August 27 release of \"An Extended Look,\" now collected on the official site. It is not accurate to read this as 29 brand-new images.",
      "Outlets including HobbyConsolas report that three of the 29 had not been publicly seen before: Jason at the wheel with a drink while Lucia leans on the door watching the city go by, a low-angle shot of the pair standing armed side by side, and a stretch of Vice City waterfront architecture with no people in it at all.",
      "Across the full set, four things stand out: Jason and Lucia are designed as a pair who share the scene, their appearances vary widely, daytime Vice City is denser than expected, and the images favor moments of action — heists, chases, confrontations — over scenery. Specific control mechanics cannot be inferred from stills, so what the images show is kept separate from speculation.",
    ],
    fullContentEn: `# 29 Screenshots Added to the Official GTA6 Site — the 3 That Really Were New, and 4 Shifts Visible in the Set

On August 31, 2026, a large batch of screenshots was added to the official Grand Theft Auto VI site from Rockstar Games.

Twenty-nine of them. They are mainly the 4K images supplied to overseas media and creators around August 27, when GTA6's new footage "Grand Theft Auto VI: An Extended Look" was released, now collected into the official gallery.

So reading this as "29 completely new GTA6 screenshots have been released" is slightly off.

Most of the 29 had already run on IGN and other overseas outlets during Extended Look week; what is new is their collection on Rockstar's own site. Overseas media and the community, however, have pointed out that three images among the 29 appear not to have been publicly released before.

And those three are rather interesting.

No dramatic explosion, no enormous new location. An unremarkable stretch of time Jason and Lucia spend in a car, the two of them standing side by side holding guns, and a piece of Vice City architecture with no people in it at all.

Look across all 29, though, and what Rockstar is trying to show starts to come into focus.

It is not simply an advertisement for how good GTA6 looks. It is about how Jason and Lucia act together, how the player changes them, and what kind of game you are playing inside a vast Vice City.

Below, a look through the 29 newly added images and the points worth paying attention to.

---

## 29 Images Added to the Official GTA6 Gallery

This update added 29 images to the GTA6 screenshot gallery on Rockstar Games' official site.

The first thing to sort out: "added to the official site" is not the same as "revealed for the first time."

Most of what was added appears to be press material supplied to media alongside the August 27 release of Extended Look. These are not frames pulled from the video but official assets capturing in-game moments as high-resolution stills.

If you were following coverage from overseas outlets, in other words, plenty of these will look familiar.

At the same time, outlets including HobbyConsolas have reported that this official-site update brought three previously unconfirmed images to light.

Start with those three.

---

## The First Reportedly New Image — Jason and Lucia in a Car

![Lucia resting her arms on the passenger door watching the view go by, with Jason at the wheel holding a drink; Vice City's towers rise behind them](/images/news/gta6-official-screenshots-29/jason-and-lucia-03.webp)

The first is a scene of Jason and Lucia riding in a car.

Jason is in the driver's seat with a drink in his hand. Beside him, Lucia leans toward the door, watching the view outside.

No gunfight. No robbery.

What is worth noticing is that this captures a moment of the pair's ordinary life, with nothing criminal about it.

GTA6's promotion so far has drawn Jason and Lucia as a couple who commit crimes together. They have appeared again and again hitting banks and stores, running from police, moving with guns in hand.

But since GTA6 is a long open-world game, not every hour they spend together will be a crime.

Driving through the city. Eating. Talking. Getting from one place to another.

This image suggests Rockstar may be portraying their relationship in the **time between** crimes as well.

Of course, a still on its own cannot confirm a specific feature such as an in-car conversation system.

Even so, that Rockstar deliberately chose this unremarkable moment as an official screenshot is interesting in itself.

---

## The Second Reportedly New Image — Standing Side by Side, Armed

![A low-angle shot under a fluorescent light of Lucia and Jason standing together, each holding a pistol](/images/news/gta6-official-screenshots-29/jason-and-lucia-07.webp)

The second is a low-angle image looking up at Jason and Lucia.

Each is holding a gun, and they stand close enough for their shoulders to touch.

In contrast to the first, this composition pushes hard on the pair as criminals.

But here too, the guns are not the point.

The distance between them is.

Rockstar's trailers and official material have repeatedly shown that GTA6 does not simply place Jason and Lucia side by side as two playable characters but puts their relationship at the center of the story.

In this image as well, they are not standing independently; they are close enough to touch.

In daily life they sit side by side in a car; at the scene of a crime they stand side by side with weapons.

Looking at these newly added images in sequence, it comes across again that Rockstar is presenting GTA6 not as "Jason's story plus Lucia's story" but as **a single continuous one**.

---

## The Third Reportedly New Image — Vice City With No One In It

![Two high-rise towers with rippling curved balconies on the Vice City waterfront, boats cutting across the water in front and a helicopter overhead](/images/news/gta6-official-screenshots-29/vice-city-10.webp)

The third is stranger still.

Neither Jason nor Lucia is present.

What it shows is a distinctive curved building on the Vice City coastline and the cityscape around it.

GTA6 tends to lead with flashy imagery — neon, luxury cars, beaches, palm trees — so Rockstar adding what amounts to an architectural photograph with no people in it suggests that Leonida itself is being treated as one of the leads.

In recently released images in particular, there has been more of Vice City by day rather than only neon at night.

And across the 29 added this time, that "city by daylight" matters a great deal.

---

## What the 29 Show, Part 1 — Jason and Lucia Are a Pair Who Work the Scene

![Lucia aiming a pistol from the back of a dirt bike Jason is riding, a police cruiser closing in behind them and a police helicopter overhead](/images/news/gta6-official-screenshots-29/jason-and-lucia-09.webp)

Beyond the three reportedly new images, many of the additions show Jason and Lucia acting together.

Riding together in cars and on bikes, robberies, facing someone down indoors — the situations vary.

What comes through is that the two are not merely lovers within the story but are designed as partners who act together in actual gameplay.

In GTA5, Michael, Franklin and Trevor each had separate lives and relationships, converging when the story required it.

GTA6 is somewhat different.

Judging by these screenshots, Jason and Lucia being in the same place is the game's baseline scenery.

Combined with what Extended Look showed about character switching, what matters in GTA6 may be not only which one you control but what the one you are not controlling does on the spot.

That said, stills alone cannot confirm specific mechanics such as freely timed switching or trading driving and shooting duties while riding together.

---

## What the 29 Show, Part 2 — Lucia and Jason Change Appearance a Lot

![Lucia outside a check-cashing storefront with a duffel bag over her shoulder and a pistol in her hand, in a grey hoodie and leggings](/images/news/gta6-official-screenshots-29/lucia-caminos-08.webp)

Another thing this batch makes easy to see is how much their appearances change.

The same Lucia has markedly different hair and clothing from image to image. Accessories and tattoos are visible in some, and Jason too shows differences in clothing and style.

From a single image you could put it down to "the outfit changed as the story progressed."

Line these up against previously released footage and screenshots, though, and there are cases where the impression changes so much it is hard to believe it is the same character.

![Jason in a cap standing beside a seaplane on the water at dusk, a police boat visible behind him](/images/news/gta6-official-screenshots-29/jason-duval-08.webp)

At minimum, it comes across that this is a game far more conscious than GTA5 about changing how its protagonists look.

Hair, clothing, accessories, tattoos.

Dazed's interview with Rockstar also touched on physical changes to the characters.

What needs care, though, is that these 29 images alone do not confirm specific features such as "you can freely change body weight" or "you can set muscle mass to any value."

What can be said with confidence from the screenshots is only that Jason and Lucia have a considerable range of appearances.

---

## What the 29 Show, Part 3 — Daytime Vice City Matters More Than Expected

Ask most people to picture GTA6's Vice City and they will picture night.

![Vice City at dusk, a Ferris wheel and waterfront neon spreading out beyond the tower in the foreground, a helicopter in the sky](/images/news/gta6-official-screenshots-29/vice-city-11.webp)

Pink and blue neon, clubs, luxury cars, palm trees. Early promotion pushed that image hard.

In these screenshots, though, Vice City by day is strikingly effective.

High-rises line up beyond the waterfront, boats sit on the water, helicopters fly overhead. Objects occupy road, buildings, water and sky simultaneously, and a single image carries a considerable amount of information.

This is not an image proving "the map is big."

What it shows is density.

Previews have also reported [comparisons indicating GTA6's world is substantially larger than GTA5's](/en/news/52), but simply building an enormous map is not that hard. What matters is how much of that space you can fill with places that mean something.

These daytime screenshots make a strong case that Rockstar is building not just a wide Leonida but a Leonida with a great deal packed into short distances as well.

---

## What the 29 Show, Part 4 — More Gameplay Moments Than Postcards

![Inside a jewelry store, Jason raising an assault rifle as a display case shatters, with Lucia behind him pointing a pistol upward](/images/news/gta6-official-screenshots-29/jason-and-lucia-04.webp)

This may be the most important thing about the 29.

Earlier GTA6 screenshots included a lot of "tourism poster" images showing off beautiful scenery and characters.

This set is a little different.

Robbery, a standoff, a getaway on a bike, a police helicopter, riding along in a car, a meeting indoors.

Many of these images show not only what kind of place this world is but what you do in it.

Take the pair riding a dirt bike while a police helicopter closes in from above.

That alone compresses the structure of GTA6's gameplay.

The two commit a crime, escape by vehicle, and get pursued by police — with Jason and Lucia taking different roles along the way.

![Through a glass door, Jason and Lucia facing a group of people in a dim interior](/images/news/gta6-official-screenshots-29/jason-and-lucia-05.webp)

Likewise, the scene of someone being surrounded indoors is composed less as a character introduction than to make you wonder whether information is being extracted from someone.

Whether that is a freely controllable interrogation system or a scripted moment within a mission cannot be told from an image.

Which is exactly why what the screenshots show and what is inferred beyond them need to be kept separate.

---

## A Completely Different Purpose From June's 63

GTA6 also had a large batch of images released when pre-orders opened in June.

Counting material tied to the Ultimate Edition and the Vintage Vice City Pack, that was a very large set too.

Its purpose was different from this one.

June's images served as a catalog conveying **what you get if you buy**, covering editions, bonuses, outfits and vehicles; this set of 29 shows **what moments you encounter when you play**.

Jason and Lucia get in a car. Walk the streets. Face someone down. Commit a crime. Run from the police.

And in between all of it, the enormous landscape of Vice City.

![Lucia and Jason walking away from a burning car, one carrying an attaché case and a rifle, the other a duffel bag](/images/news/gta6-official-screenshots-29/jason-and-lucia-08.webp)

Each image is a small piece of information on its own, but taken as one set, the 29 show Rockstar moving its pre-launch promotion into a new phase.

---

## Why Collect the 29 on the Official Site Now?

[Extended Look](/en/news/48) sharply increased how much is known about GTA6.

A moment that passes in seconds on video can be stopped and studied in a 4K screenshot.

Hair, tattoos, NPCs, signage, cars, architecture, reflections on water, traffic in the distance.

Details like these are easy to miss just playing a video at normal speed.

The point of adding these 29 to the official gallery, then, is less "new images released" than making the GTA6 shown in Extended Look available to study again as high-resolution stills.

And mixed in among them, the three said to be new.

Not a flashy new character, not a new city.

Jason and Lucia in a car, the pair standing armed, a piece of Vice City architecture.

What that suggests is that as release approaches, Rockstar's promotion is beginning to shift from "here is what GTA6 has" to "here is the time you will spend in GTA6."

---

## These 29 Deserve to Be Seen in 4K

![Jason and Lucia facing each other against the setting sun, sheriff's airboats gathered in the surrounding wetland and a helicopter circling overhead](/images/news/gta6-official-screenshots-29/jason-and-lucia-13.webp)

Seen only as small images on a phone, much of the value of these screenshots is lost.

Daytime Vice City, reflections on water and car bodies, Jason and Lucia's hair and clothing, the NPCs and vehicles in the background — a lot of it only registers when you open the high-resolution version on the official site.

→ [GTA VI Official Screenshot Gallery (Rockstar Games)](https://www.rockstargames.com/VI/screenshots)

Leaving this update at "29 screenshots added" sells it a little short.

What the 29 show, taken together, is that Jason and Lucia constantly share the scene, that their appearances change substantially, that Vice City carries overwhelming detail even by day, and that the gameplay on display has moved toward moments of action — heists and pursuits.

And it is interesting that the three said to be genuinely new were not spectacular explosions but "the pair's ordinary life," "the distance between them," and "Vice City itself."

As GTA6's release approaches, what Rockstar has begun showing is not a feature list.

It may be the time you spend living in Leonida as Jason and Lucia.

---

> **Note:** The screenshots in this article are press materials published by Rockstar Games in the GTA VI gallery on its official site (scaled to 1280px wide for display). Copyright belongs to Rockstar Games / Take-Two Interactive. That three of the 29 are newly revealed is based on reporting from outlets including HobbyConsolas; Rockstar has not itself described them as first reveals. What can be read from the images and what is inferred about game features beyond them are distinguished in the text above.`,
  },
  {
    id: 55,
    title:
      "RAGE:MPとは何だったのか――10年続いたGTA RP基盤の歴史と終了、FiveMだけが残るまで",
    displayTitle:
      "RAGE:MPとは何だったのか\n10年続いたGTA RP基盤の歴史と終了、FiveMだけが残るまで",
    description:
      "2026年8月31日、GTA5のカスタムマルチプレイ基盤「RAGE Multiplayer（RAGE:MP）」がサポートを終了する。2016年の開発開始、GTA:Networkとの統合、1.0/1.1、Take-Twoの要請による終了まで約10年の歴史を年表で整理し、FiveMとの違い、alt:Vの終了、GTA RPがFiveMへ一本化されるまでの流れをまとめた。",
    icon: "🗄️",
    image: "/images/news/ragemp-history/eyecatch.webp",
    category: "topic",
    date: "2026-08-31",
    publishedAt: "2026-08-31 16:00",
    source:
      "RAGE Multiplayer公式Announcements／Cfx.re・Rockstar Games公式発表／Grand RP公式告知 ほか",
    sourceUrl: "https://rage.mp/",
    relatedArticles: [18, 54, 53],
    aiSummary: [
      "2026年8月31日、GTA5用のカスタムマルチプレイ基盤「RAGE Multiplayer（RAGE:MP）」がサポートを終了する。2026年5月、RAGE:MP運営はTake-Two Interactiveからの要請を受けて段階的終了を発表し、6月1日に公開サーバーリストを終了。8月31日以降はクライアントとサーバーツールの提供・サポートが終わり、バックエンドも恒久的に停止するとしている。",
      "RAGE:MPの開発開始は2016年5月2日。2017年にGTA:Networkと統合してC#環境を取り込み、2018年の0.3.7、2019年の1.0、2020年の1.1、2021年のmp.game v2とEAC対応を経て、長期運営のRPサーバーを支える開発基盤へ育った。GTA RPの入口はFiveMだけではなく、RAGE:MP、alt:V、GTA:Networkが並走する時代が長く続いていた。",
      "2023年8月にFiveMを開発するCfx.reがRockstar傘下へ入り、2026年にはalt:Vも終了。Rockstar／Take-TwoがPLA上でFiveMを唯一の認可プラットフォームと位置づけたことが、RAGE:MP終了の直接的な理由として説明されている。ただしGrand RPのように独自インフラへ移行したコミュニティもあり、「全サーバーがFiveMへ移った」わけではない。",
    ],
    fullContent: `# RAGE:MPとは何だったのか――10年続いたGTA RP基盤の歴史と終了、FiveMだけが残るまで

## 2026年8月31日、ひとつのGTA RP時代が終わる

2026年8月31日。『Grand Theft Auto V』を使ったカスタムマルチプレイの世界で、約10年にわたって使われてきたプラットフォーム「RAGE Multiplayer（RAGE:MP）」が、その歴史に幕を下ろす。

RAGE:MP運営チームは2026年5月、Take-Two Interactiveからの要請を受け、サービスを段階的に終了すると発表した。新規コミュニティサーバーの受付とサーバーツールの一般提供を停止し、6月1日には公開サーバーリストを終了。そして8月31日をサポート終了日とし、その後はゲームクライアントとサーバーツールの提供・サポートを終了し、バックエンドインフラも恒久的に停止するとしている。

最近GTA RPを知った人にとって、「GTA RP＝FiveM」というイメージは強いかもしれない。しかし、GTA Vの発売から現在に至るまでの歴史を見ると、FiveMだけがこの文化を作ってきたわけではない。

RAGE:MP、GTA:Network、alt:V、FiveM。GTA Vというひとつのゲームの上で、複数のカスタムマルチプレイ基盤が競争し、それぞれの開発者とサーバーコミュニティが独自の世界を作ってきた。

その中でもRAGE:MPは、約10年という長い時間を生き残った代表的なプラットフォームのひとつだった。

そして奇しくもGTA6発売を目前に控えた2026年、その時代は大きな転換点を迎えている。

---

## そもそもRAGE:MPとは何だったのか

![「RAGE:MPとは何だったのか」と題した図版。夜の街並みとサーバーラックのラインアートが並ぶ](/images/news/ragemp-history/what-is-ragemp.webp)

RAGE:MPは、GTA Vを利用して独自のマルチプレイサーバーを構築できるプラットフォームだ。

通常のGTA Onlineでは、プレイヤーはRockstar Gamesが用意したゲームルールやコンテンツの中で遊ぶ。一方、RAGE:MPのようなプラットフォームでは、サーバー運営者が独自のゲームモード、ルール、UI、経済、職業、キャラクターシステムなどを作ることができた。

つまり、同じGTA Vを使っていても、接続するサーバーによってまったく違うゲームになる。

警察官として犯罪者を追う。タクシー運転手として客を運ぶ。企業を経営する。犯罪組織を作る。独自の経済システムの中で生活する。

現在「GTA RP」と呼ばれている遊び方を成立させるための土台のひとつが、RAGE:MPだった。GTA RPそのものの遊び方については「[GTARPとは？](/fivem-gtarp/what-is-gtarp)」で解説している。

技術的にはC++を基盤としたスタンドアロンのクライアントとして開発され、サーバー側ではNode.js、クライアント側ではJavaScriptを利用できた。CEF（Chromium Embedded Framework）を使い、HTML/CSS/JavaScriptで独自UIを構築することもでき、後にはC#にも対応していった。

---

## RAGE:MPの歴史

| 年 | 主な出来事 |
| --- | --- |
| 2016年5月2日 | RAGE Multiplayerの開発開始 |
| 2017年 | 初期β時代。0.2など大型更新の開発が進む |
| 2017年7月 | GTA:Networkとの協力・統合を発表 |
| 2017〜18年 | JavaScript/C#など開発環境を拡充 |
| 2018年12月 | 0.3.7 Stable。クライアント側C#などを実装 |
| 2019年 | 1.0 Developer Previewへ |
| 2020年 | 1.1 Public Beta開始 |
| 2021年 | mp.game v2、EAC対応などを発表 |
| 2022年 | RockstarがRPサーバー向けポリシーを明確化 |
| 2023年 | RAGE:MPがRP Server Policyへの対応を強化 |
| 2023年8月 | FiveMを開発するCfx.reがRockstar Games傘下へ |
| 2024〜25年 | RAGE:MPも継続開発。新Server List、1.2、Enhanced対応など |
| 2026年5月 | Take-Twoの要請を受け終了を発表 |
| 2026年6月1日 | 公開サーバーリスト終了 |
| 2026年8月31日 | RAGE:MPサポート終了 |

ここから、この約10年間をもう少し詳しく見ていく。

---

## 2016年――RAGE Multiplayerの開発が始まる

![夜の街を見下ろす構図の中央に置かれたサーバーラック。GTA Vの街とサーバーがつながるイメージ](/images/news/ragemp-history/gtav-city-servers.webp)

RAGE:MPの出発点は2016年5月2日まで遡る。

これは後年のRAGE:MP自身の開発ブログでも明確に記録されている。2018年に公開された2周年の投稿では、2016年5月2日を「RAGE Multiplayerの開発が始まった日」と説明している。

当時のGTA V PC版は発売からまだ約1年。GTA Onlineはすでに巨大な人気を獲得していたものの、「GTA Vの世界を使って、自分たちのルールで遊びたい」というPCコミュニティの需要も膨らんでいた。

RAGE:MPが目指したのは、そのための独立したマルチプレイ環境だった。

現在から振り返れば、これは後に巨大化するGTA RP文化の土台作りが進んでいた時期でもある。

---

## 2017年――まだ荒削りだった初期RAGE:MP

2017年初頭の公式フォーラムを見ると、現在の成熟したGTA RP環境とはまったく違う光景が残っている。

クライアントが起動しない、ゲームが突然終了する、GTA Vのアップデートに対応できない――そうした問題についてユーザーと開発者がやり取りしていた。

たとえば2017年3月には、起動時の問題について開発者が「0.2ですでに修正した」と回答しながら、その0.2自体はまだ公開されていないというやり取りも残っている。

0.2ではクライアント側スクリプトAPIの拡張、セキュリティ改善、ランチャー改良、新しいMaster Serverなどが計画された。初期にはDDoS攻撃による問題も発生しており、現在では当たり前に見える「サーバー一覧から選んで接続する」という体験自体を安定させるための試行錯誤が続いていた。

この時点では、後に世界中で巨大なRPサーバーを支えるプラットフォームになることを想像していたユーザーは、それほど多くなかったかもしれない。

---

## 2017年7月――GTA:Networkとの統合

RAGE:MPの歴史を語るうえで重要なのが、GTA:Networkだ。

GTA:Networkもまた、GTA V上で独自マルチプレイ環境を作るために開発されていたプロジェクトだった。

2017年7月、RAGE MultiplayerとGTA:Networkは協力・統合を発表する。両チームをまとめ、GTA V向け代替マルチプレイ環境の開発を強化することが目的だった。

この統合は技術面にも影響した。

RAGE:MPはもともとNode.js／JavaScriptを中心とした開発環境を持っていたが、GTA:Networkとの協力によってC#との橋渡しが進む。2017年11月には「Bridge 2.0」と呼ばれるC# API Bridgeが紹介され、GTA:Networkのサーバー環境をRAGE:MP側で再構築し、既存リソースを移行しやすくする取り組みが進められた。

これは単なる名称変更やコミュニティ統合ではない。

異なるGTAマルチプレイ開発文化が、RAGE:MPへ流れ込んだ瞬間でもあった。

---

## 2018年――RPサーバーを作るための「開発基盤」へ

![雨の街を望む窓辺のデスクに並んだデュアルモニター。片方に街のマップ、もう片方にサーバースクリプトのコードが表示されている](/images/news/ragemp-history/developer-desk.webp)

RAGE:MPはその後、単純にGTA Vへ複数人を接続するだけのMODから、複雑なゲームモードを作るための開発プラットフォームへ進化していく。

2018年11月には0.3.7のPublic Testingが始まり、クライアント側C#スクリプトなどが導入された。同年12月10日には0.3.7がStableへ移行している。

サーバー開発者が自由にコードを書き、独自のUIを作り、キャラクターや経済、車両、職業などの仕組みを組み合わせる。

こうした技術的な自由度は、RPサーバーと非常に相性がよかった。

「GTA Vで遊ぶ」のではなく、GTA Vを素材にして別のオンラインゲームを作る。

RAGE:MPは、そのための土台になっていった。

---

## 2019〜2021年――1.0、そして1.1へ

![サーバーラックが並ぶ暗いデータセンターの中央に、街のネットワークを映したホログラム画面が浮かんでいる](/images/news/ragemp-history/server-infrastructure.webp)

2019年11月には「RAGE Multiplayer 1.0 Developer Preview #1」が登場し、2020年2月には1.1.0 DP#1がPublic Betaへ進んだ。

1.1では、事前テストだけでも1.0から約200件のバグ修正が行われたと開発チームが説明しており、同期NPCなどの新機能も追加されている。

さらに2021年7月には「mp.game v2」が発表された。

JavaScriptからGTA Vのネイティブ機能を呼び出す部分が刷新され、開発チームのベンチマークではNative Callが平均約2倍高速化したと説明されたほか、Easy Anti-Cheat（EAC）のランチャー統合も進められた。

この頃には、RAGE:MPはもはや実験的な小規模MODではない。

長期間運営されるオンラインコミュニティを支えるため、パフォーマンス、同期、セキュリティ、API、アンチチートまで整備するプラットフォームへ変化していた。

---

## RAGE:MPは「RP専用」だったわけではない

ここは歴史を振り返る際に重要なポイントだ。

RAGE:MP自体は「GTA RP専用ソフト」ではない。

サーバー運営者が独自ゲームモードを作れる汎用的なカスタムマルチプレイ基盤であり、RPはその代表的な利用方法のひとつだった。

ただし、GTA Vのオープンワールドと自由なサーバースクリプティングの組み合わせはRPとの相性が非常によく、結果として多くのRoleplayコミュニティがRAGE:MP上に作られた。

公式フォーラムにも、2010年から別のGTA RPコミュニティを運営していたDreamWorldが、RAGE:MPの登場によってGTA V上で安定したRP環境を構築できるようになったと説明する2019年の投稿が残っている。

つまりRAGE:MPは、GTA VからRP文化を生み出したというより、以前のGTAシリーズから続いていたRP文化をGTA Vへ移すための橋のひとつだったと見る方が実態に近い。

---

## FiveMとの競争――GTA RPには複数の「入口」があった

![暗いグリッド上に、無数のサーバーアイコンが街のかたちに敷き詰められている図。中央に高層ビル群が光る](/images/news/ragemp-history/community-servers.webp)

現在ではFiveMの知名度が圧倒的だが、GTA Vのカスタムマルチプレイ史では複数のプラットフォームが存在した。

FiveM、RAGE:MP、alt:V、そして初期のGTA:Network。

それぞれ技術構成やAPI、同期、サーバー運営方法、コミュニティが異なり、開発者は「どの基盤で自分たちのサーバーを作るか」を選択していた。

これは現在のGTA RPしか知らない人には、少し想像しづらい状況かもしれない。

「GTA RPをするならFiveM」ではなく、「どのGTAマルチプレイ基盤を使うか」から選ぶ時代が存在したのである。FiveM側の歩みについては「[FiveMの歴史とは？](/fivem-gtarp/history)」で2014年からの年表を整理している。

---

## 2022〜2023年――RockstarがRPサーバーのルールを明確化する

この状況が大きく変わり始めるのが2022年だ。

Rockstar GamesはGTA OnlineのコミュニティRPサーバーに対する方針を明確化し、RAGE:MP側もその影響を受ける。

2023年5月、RAGE:MP運営は「RP Server Policy: Long-Term Eco-System Integration」を公開。現実世界のブランドを使用した車両や衣服などを削除するようサーバー運営者へ求め、RockstarのRP Server Policyをプラットフォーム全体で適用していく方針を示した。

これはRAGE:MPが即座に終了するという話ではなかった。

むしろこの段階では、Rockstarのルールの中でRAGE:MPを長期的に存続させようとしていたことが読み取れる。

しかし、そのわずか数か月後、GTAカスタムマルチプレイの勢力図そのものを変える出来事が起きる。

---

## 2023年8月――RockstarがFiveMのCfx.reを迎え入れる

2023年8月11日。

FiveMとRedMを開発するCfx.reが、Rockstar Gamesの一員になったことを発表した。

Cfx.reは発表の中で、Rockstarの支援を受けながらFiveMプラットフォームとクリエイターコミュニティを発展させていくと説明した。

ここはGTA RP史における巨大な転換点だ。

かつてGTA Vの非公式マルチプレイMODとして始まったFiveMが、GTAを作るRockstar Gamesの傘下に入った。

その一方で、RAGE:MPやalt:Vは独立したプラットフォームとして残った。

この時点ではまだ複数の選択肢が共存していたが、FiveMだけがRockstarと直接結び付いた存在になったことで、それまでの競争環境は根本から変化していく。

---

## それでもRAGE:MPの開発は終わらなかった

FiveMがRockstar傘下に入ったからといって、RAGE:MPがすぐに消えたわけではない。

公式Announcementsを見ると、2024年にも新しいServer List、Rockstar Editor対応、Voice Chat改善、Entity GraphicsやBlips API、1.2のEarly Teaseなどの更新が続いている。

さらに2025年にはゲーム最適化などの更新が行われ、9月には「**RAGE Multiplayer for GTAV Enhanced - Now Globally Available**」も発表された。

つまりRAGE:MPは、FiveMがRockstar傘下になった後も開発を続けていた。

だからこそ、2026年の終了発表はコミュニティにとって大きな意味を持った。

---

## 2026年――alt:V、そしてRAGE:MPへ

2026年には、GTA Vカスタムマルチプレイを取り巻く環境が一気に変化した。

競合プラットフォームだったalt:Vも段階的な終了プロセスに入り、現在の公式サイトには明確に「**alt:V has been shut down**」と表示されている。

そして5月25日、RAGE:MP運営から決定的な発表が出る。

タイトルは、「Long-Term Eco-System Integration, Pt. II: Final Outreach / C&D」だった。

---

## Take-Twoからの要請――RAGE:MP終了へ

![暗い画面の中央に、同心円のレーダーに囲まれた小さなサーバーと街のアイコンだけが残っている図](/images/news/ragemp-history/shutdown-signal.webp)

RAGE:MPチームは発表の中で、Rockstar GamesとTake-Two Interactiveから、GTA VのマルチプレイMODについてFiveMがPlatform License Agreement上の唯一の認可されたプラットフォームであることを明確にされたと説明している。

そしてTake-Twoからの要請に従い、RAGE:MPを段階的に終了すると発表した。

終了は一夜にして行われるのではなく、サーバー運営者がFiveMへ移行するための猶予期間が設けられた。

まず新しいCommunity Serverの受付を即時停止し、RAGE:MP Server Toolkitの一般提供も終了。既存サーバー運営者についてはServer Managerから必要なビルドへアクセスできるようにした。

そして2026年6月1日に公開サーバーリストを終了。最終期限として設定されたのが、2026年8月31日だった。

この日までに残るコミュニティサーバーは移行することが求められ、その後はRAGE:MPのゲームクライアントとサーバーツールが提供・サポートされなくなり、バックエンドインフラも恒久的に停止するとされた。

---

## 「FiveMへ移行してください」――かつてのライバルが唯一の移行先に

RAGE:MP終了発表で象徴的なのは、単に「サービスを終了します」で終わっていないことだ。

運営チームは既存サーバーへFiveMへの移行を求めた。さらに移行時の技術的な疑問については、Cfxチームが支援すると説明されている。

2010年代なら、FiveMとRAGE:MPは同じGTA Vカスタムマルチプレイ市場で競争する存在だった。

2026年には、そのRAGE:MP自身がユーザーへFiveMへの移行を案内している。

約10年間の歴史を考えると、非常に象徴的な結末だ。FiveMそのものの仕組みについては「[FiveMとは？](/fivem-gtarp/what-is-fivem)」、FiveMとGTA RPの関係の違いは「[FiveMとGTARPの違い](/fivem-gtarp/fivem-vs-gtarp)」で整理している。

---

## すべてのRAGE:MPサーバーがFiveMへ行ったわけではない

![雨の降る夜の交差点。信号と車のライトが濡れた路面に反射している](/images/news/ragemp-history/rp-city-street.webp)

ただし、「RAGE:MP終了＝全サーバーがFiveMへ移った」と理解するのも正確ではない。

大規模コミュニティの中には独自の道を選んだ例もある。

たとえばGrand RPは2026年7月、RAGE:MPを完全に離れ、独自インフラと独自ランチャーへ移行すると発表した。プレイヤーの進行状況やコンテンツを維持しながら、RAGE:MP経由ではなく独自ランチャーから接続する方式へ切り替えるとしている。

RAGE:MPという基盤は消えても、その上で長年育ったコミュニティやゲームシステムまで同時に消えるとは限らない。

ここも、プラットフォームとRPサーバーそのものを分けて考える必要がある。

---

## なぜRAGE:MPは終わることになったのか

RAGE:MP公式発表から確認できる直接的な理由は明快だ。

Take-Twoから終了を求められ、Rockstar／Take-Two側からFiveMがGTA Vの認可されたマルチプレイMOD基盤であるとの立場を示されたためである。

現在のRockstarのCreator Platform License Agreementにも、FiveMとRedMがRockstarの「Creator Services」として明記されている。

ただし、その先については慎重に見る必要がある。

「GTA6のRPをFiveMだけにするためRAGE:MPを潰した」「GTA6発売時からFiveMが対応する」といった説明は、現時点で公式に確認された事実ではない。

GTA6とFiveMの将来的な関係について、Rockstarがすべてを明らかにしたわけではないからだ。

---

## RAGE:MPの終了は「FiveMの勝利」だけでは説明できない

![モニターに映ったGTA Vの街のマップと、そこに散らばるプレイヤーのアイコン](/images/news/ragemp-history/server-player-map.webp)

表面的には、FiveMとの競争にRAGE:MPが敗れたようにも見える。

しかし約10年の歴史を追うと、もう少し複雑だ。

2016年当時、GTA V上のカスタムマルチプレイは、ゲームメーカーが正式に用意した遊びではなかった。外部の開発者たちがクライアント、サーバー、同期、スクリプトAPI、UI、アンチチートなどを自分たちで作り、GTA Vを別のオンラインゲームへ変えていった。

RAGE:MPもFiveMも、その流れから生まれている。

ところが2023年にCfx.reがRockstar Gamesへ加わり、2026年にはFiveMがRockstarのCreator ServicesとしてPLAに組み込まれた。

つまりこの10年間に起きた本当の変化は、「非公式コミュニティがGTA Vの外側に作っていたカスタムマルチプレイ文化が、Rockstar自身のエコシステムへ取り込まれていった」ことなのかもしれない。

RAGE:MPの終了は、その転換を象徴する出来事だ。

---

## そしてGTA6時代へ

RAGE:MPが終了する2026年は、偶然にもGTAシリーズそのものが巨大な世代交代を迎える年でもある。

GTA6の発売が近づく一方で、FiveMはRockstar傘下のプラットフォームとして存在し、GTA RPはGTA V発売当初には想像できなかったほど巨大な文化になった。日本でも配信を入口にRPが広がっており、その流れは「[日本のGTARP配信者サーバー史](/fivem-gtarp/streamer-server-history)」で年表にまとめている。

だからこそ、RAGE:MPの歴史を残しておく意味がある。

数年後、GTA6のRPサーバーが当たり前になった世界で「GTA RPはどこから始まったのか」「FiveM以外にもあったのか」と検索する人は必ず出てくる。

そのとき、2010年代から2020年代前半のGTA RPをFiveMだけで説明してしまえば、歴史の一部が抜け落ちる。

GTA:Networkがあり、RAGE:MPがあり、alt:Vがあり、FiveMがあった。それぞれの開発者が異なる方法でGTA Vをオンライン世界へ作り替え、無数のサーバー運営者とプレイヤーがその上にコミュニティを築いた。

そして2026年8月31日、その選択肢のひとつだったRAGE:MPが役目を終える。

RAGE:MPチームが最後の発表に残した言葉には、この10年間をよく表している一節がある。

> RAGE:MPを形作ったのは、コードベース以上にコミュニティだった。

プラットフォームは消えても、そこで生まれたGTA RPの文化まで消えるわけではない。

その歴史はFiveMへ移ったサーバーにも、独自プラットフォームへ進んだコミュニティにも、そしてこれから始まるGTA6時代のRPにも続いていく。

---

> **注記：** 本記事はRAGE Multiplayer公式サイトのAnnouncements・開発ブログ・フォーラム、Cfx.reおよびRockstar Gamesの公式発表、Grand RPの公式告知など、公開情報をもとにGTA6 FEEDが整理したものであり、Rockstar Games／Take-Two Interactiveおよび各プラットフォーム運営とは一切関係がない。バージョン番号や日付は各公式発表の記載にもとづく。GTA6におけるロールプレイ対応やFiveMの扱いについては、現時点でRockstarからの正式発表がなく、本記事でも確定情報としては扱っていない。掲載画像はいずれも記事内容をイメージしやすくするためにAIで生成したもので、実際のゲーム画面・公式UI・実在のサーバー画面ではない。アイキャッチと一部の図版には日本語のテキストが含まれる。`,
    titleEn:
      "What RAGE:MP Was — Ten Years of a GTA RP Platform, Its Shutdown, and How FiveM Came to Be the Only One Left",
    displayTitleEn:
      "What RAGE:MP Was\nTen Years of a GTA RP Platform, Its Shutdown, and How FiveM Came to Be the Only One Left",
    descriptionEn:
      "On August 31, 2026, RAGE Multiplayer (RAGE:MP) — a custom multiplayer platform for GTA V — reaches end of support. A timeline of its roughly ten years, from development starting in 2016 through the GTA:Network merger, 1.0/1.1, and the shutdown demanded by Take-Two, plus how it differed from FiveM, the end of alt:V, and how GTA RP consolidated onto FiveM.",
    aiSummaryEn: [
      "On August 31, 2026, RAGE Multiplayer (RAGE:MP), a custom multiplayer platform for GTA V, reaches end of support. In May 2026 its team announced a phased shutdown at the request of Take-Two Interactive, closed the public server list on June 1, and said that after August 31 the game client and server tools would no longer be provided or supported and the backend infrastructure would be permanently shut down.",
      "Development began on May 2, 2016. After merging with GTA:Network in 2017 and absorbing its C# environment, RAGE:MP moved through 0.3.7 in 2018, 1.0 in 2019, 1.1 in 2020, and mp.game v2 with EAC integration in 2021, growing into a development platform capable of supporting long-running RP servers. FiveM was never the only entrance to GTA RP: RAGE:MP, alt:V and GTA:Network ran alongside it for years.",
      "Cfx.re, which develops FiveM, joined Rockstar in August 2023, and alt:V shut down in 2026. RAGE:MP's team cited Rockstar/Take-Two identifying FiveM as the only authorized platform under their Platform License Agreement as the direct reason for the shutdown. Not every community moved to FiveM, though — Grand RP, for one, moved to its own infrastructure and launcher.",
    ],
    fullContentEn: `# What RAGE:MP Was — Ten Years of a GTA RP Platform, Its Shutdown, and How FiveM Came to Be the Only One Left

## August 31, 2026: One Era of GTA RP Ends

August 31, 2026. In the world of custom multiplayer built on Grand Theft Auto V, RAGE Multiplayer (RAGE:MP) — a platform used for roughly ten years — closes its history.

In May 2026, the RAGE:MP team announced a phased shutdown at the request of Take-Two Interactive. New community server applications and general access to the server toolkit stopped; the public server list closed on June 1. August 31 was set as the end-of-support date, after which the game client and server tools would no longer be provided or supported and the backend infrastructure would be permanently shut down.

For anyone who came to GTA RP recently, "GTA RP means FiveM" may be a strong impression. Look at the history from GTA V's release to now, though, and FiveM was not the only thing that built this culture.

RAGE:MP, GTA:Network, alt:V, FiveM. On top of a single game, several custom multiplayer platforms competed, each with its own developers and server communities building their own worlds.

Among them, RAGE:MP was one of the representative platforms that survived a full decade.

And in 2026, with GTA6 close at hand, that era has reached a major turning point.

---

## What RAGE:MP Actually Was

![A graphic titled "What was RAGE:MP" showing a night skyline beside a line-art server rack (caption in Japanese)](/images/news/ragemp-history/what-is-ragemp.webp)

RAGE:MP was a platform that let you build your own multiplayer servers using GTA V.

In ordinary GTA Online, players play inside the rules and content Rockstar Games provides. On a platform like RAGE:MP, a server operator could build their own game modes, rules, UI, economy, jobs and character systems.

Which means that even on the same GTA V, the server you connect to makes it an entirely different game.

Chase criminals as a police officer. Carry passengers as a taxi driver. Run a company. Build a criminal organization. Live inside a custom economy.

RAGE:MP was one of the foundations that made possible what is now called GTA RP. For how GTA RP is actually played, see "[What Is GTARP?](/en/fivem-gtarp/what-is-gtarp)."

Technically it was developed as a standalone client built on C++, with Node.js available on the server side and JavaScript on the client side. Using CEF (Chromium Embedded Framework), developers could build custom UI in HTML/CSS/JavaScript, and C# support followed later.

---

## A RAGE:MP Timeline

| Year | Main Events |
| --- | --- |
| May 2, 2016 | Development of RAGE Multiplayer begins |
| 2017 | Early beta era; work proceeds on major updates such as 0.2 |
| July 2017 | Cooperation and merger with GTA:Network announced |
| 2017–18 | Development environment expanded with JavaScript/C# and more |
| December 2018 | 0.3.7 Stable, implementing client-side C# among other things |
| 2019 | On to 1.0 Developer Preview |
| 2020 | 1.1 Public Beta begins |
| 2021 | mp.game v2 and EAC support announced |
| 2022 | Rockstar clarifies its policy for RP servers |
| 2023 | RAGE:MP strengthens compliance with the RP Server Policy |
| August 2023 | Cfx.re, developer of FiveM, joins Rockstar Games |
| 2024–25 | RAGE:MP keeps developing: a new Server List, 1.2, Enhanced support |
| May 2026 | Shutdown announced at Take-Two's request |
| June 1, 2026 | Public server list closes |
| August 31, 2026 | RAGE:MP end of support |

From here, a closer look at those ten years.

---

## 2016 — Development of RAGE Multiplayer Begins

![A server rack placed at the center of a shot looking down over a city at night, evoking GTA V's streets connected to servers](/images/news/ragemp-history/gtav-city-servers.webp)

RAGE:MP's starting point goes back to May 2, 2016.

RAGE:MP's own development blog records this clearly in later years. A second-anniversary post published in 2018 describes May 2, 2016 as "the day development of RAGE Multiplayer began."

The PC version of GTA V was then only about a year old. GTA Online had already become enormously popular, but demand was also swelling in the PC community to "use the world of GTA V and play by our own rules."

What RAGE:MP set out to build was an independent multiplayer environment for exactly that.

Looking back from now, this was also the period when the groundwork was being laid for a GTA RP culture that would later grow vast.

---

## 2017 — The Rough Early Days of RAGE:MP

The official forums from early 2017 preserve a scene completely unlike today's mature GTA RP environment.

The client would not launch, the game would suddenly quit, it could not keep up with GTA V updates — users and developers went back and forth over problems like these.

In March 2017, for instance, there is an exchange where a developer answers a launch problem by saying it was "already fixed in 0.2," while 0.2 itself had not yet been released.

Version 0.2 was planned to bring an expanded client-side scripting API, security improvements, launcher refinements and a new Master Server. Early on there were also problems caused by DDoS attacks, and the trial and error continued simply to stabilize what now looks obvious: picking a server from a list and connecting to it.

At that point, not many users would have imagined this becoming the platform behind enormous RP servers worldwide.

---

## July 2017 — The Merger With GTA:Network

GTA:Network matters to any account of RAGE:MP's history.

It was another project being developed to create an independent multiplayer environment on top of GTA V.

In July 2017, RAGE Multiplayer and GTA:Network announced cooperation and a merger, with the aim of bringing both teams together and strengthening development of an alternative multiplayer environment for GTA V.

The merger had technical consequences as well.

RAGE:MP had a development environment centered on Node.js and JavaScript, but cooperation with GTA:Network advanced a bridge to C#. In November 2017 a C# API Bridge called "Bridge 2.0" was introduced, with work to rebuild GTA:Network's server environment on the RAGE:MP side and make existing resources easier to migrate.

This was not merely a rename or a community merger.

It was the moment a different GTA multiplayer development culture flowed into RAGE:MP.

---

## 2018 — Becoming a Development Platform for Building RP Servers

![Dual monitors on a desk by a rain-streaked window, one showing a city map and the other server script code](/images/news/ragemp-history/developer-desk.webp)

RAGE:MP then evolved from a MOD that simply connected several people to GTA V into a development platform for building complex game modes.

Public testing of 0.3.7 started in November 2018, introducing client-side C# scripting among other things. On December 10 that year, 0.3.7 moved to Stable.

Server developers could write code freely, build their own UI, and combine systems for characters, economies, vehicles and jobs.

That degree of technical freedom suited RP servers extremely well.

Not "playing GTA V," but using GTA V as raw material to build a different online game.

RAGE:MP became a foundation for exactly that.

---

## 2019–2021 — To 1.0, Then 1.1

![A hologram screen showing a city's network floating in the middle of a dark data center lined with server racks](/images/news/ragemp-history/server-infrastructure.webp)

November 2019 brought "RAGE Multiplayer 1.0 Developer Preview #1," and in February 2020, 1.1.0 DP#1 advanced to Public Beta.

For 1.1, the development team said around 200 bugs had been fixed since 1.0 in pre-testing alone, along with new features such as synced NPCs.

Then, in July 2021, "mp.game v2" was announced.

The layer that calls GTA V's native functions from JavaScript was overhauled — the team's benchmarks described native calls as roughly twice as fast on average — and launcher integration with Easy Anti-Cheat (EAC) also moved forward.

By this point RAGE:MP was no longer a small experimental MOD.

It had become a platform maintaining performance, synchronization, security, APIs and anti-cheat in order to support online communities running for years.

---

## RAGE:MP Was Never "RP-Only"

This is an important point when looking back at the history.

RAGE:MP itself was not "GTA RP software."

It was a general-purpose custom multiplayer foundation on which server operators could build their own game modes, and RP was one representative use of it.

That said, the combination of GTA V's open world and free server scripting suited RP so well that a great many roleplay communities ended up built on RAGE:MP.

The official forums still hold a 2019 post from DreamWorld, which had run a different GTA RP community since 2010, explaining that the arrival of RAGE:MP let them build a stable RP environment on GTA V.

So rather than saying RAGE:MP produced RP culture out of GTA V, it is closer to the truth to see it as one of the bridges that carried an RP culture continuing from earlier GTA titles over to GTA V.

---

## Competing With FiveM — GTA RP Had Several Front Doors

![Countless server icons laid out in the shape of a city on a dark grid, with a cluster of towers glowing at the center](/images/news/ragemp-history/community-servers.webp)

FiveM's name recognition is overwhelming today, but the history of GTA V custom multiplayer had several platforms.

FiveM, RAGE:MP, alt:V, and, early on, GTA:Network.

Each differed in technical makeup, APIs, synchronization, how servers were run and community, and developers chose which foundation to build their server on.

For anyone who only knows GTA RP as it is now, that situation may be hard to picture.

It was not "FiveM if you want to do GTA RP" — there was an era when you chose which GTA multiplayer foundation to use in the first place. FiveM's own path is laid out from 2014 onward in "[What Is the History of FiveM?](/en/fivem-gtarp/history)."

---

## 2022–2023 — Rockstar Clarifies the Rules for RP Servers

This began to change substantially in 2022.

Rockstar Games clarified its policy toward community RP servers on GTA Online, and RAGE:MP felt the effects.

In May 2023 the RAGE:MP team published "RP Server Policy: Long-Term Eco-System Integration," asking server operators to remove vehicles and clothing using real-world brands and setting out a policy of applying Rockstar's RP Server Policy across the platform.

This was not a matter of RAGE:MP shutting down immediately.

If anything, at that stage you can read an intent to keep RAGE:MP alive long term within Rockstar's rules.

Just a few months later, however, came an event that changed the map of GTA custom multiplayer itself.

---

## August 2023 — Rockstar Brings FiveM's Cfx.re In-House

August 11, 2023.

Cfx.re, developer of FiveM and RedM, announced it had become part of Rockstar Games.

In its announcement, Cfx.re said it would develop the FiveM platform and its creator community with Rockstar's support.

This is an enormous turning point in GTA RP history.

FiveM, which had begun as an unofficial multiplayer MOD for GTA V, came under Rockstar Games, the company that makes GTA.

RAGE:MP and alt:V, meanwhile, remained independent platforms.

Multiple options still coexisted at that point, but with FiveM alone directly tied to Rockstar, the competitive landscape began to change at its root.

---

## Even So, RAGE:MP Kept Developing

FiveM coming under Rockstar did not make RAGE:MP disappear.

The official announcements show updates continuing through 2024: a new Server List, Rockstar Editor support, voice chat improvements, Entity Graphics and a Blips API, an early tease of 1.2.

Updates such as game optimization followed in 2025, and in September that year came "**RAGE Multiplayer for GTAV Enhanced - Now Globally Available**."

RAGE:MP, in other words, kept developing after FiveM joined Rockstar.

Which is exactly why the 2026 shutdown announcement meant so much to the community.

---

## 2026 — alt:V, Then RAGE:MP

In 2026 the environment around GTA V custom multiplayer changed all at once.

alt:V, a competing platform, entered its own phased shutdown; its official site now states plainly that "**alt:V has been shut down**."

Then, on May 25, a decisive announcement came from the RAGE:MP team.

Its title: "Long-Term Eco-System Integration, Pt. II: Final Outreach / C&D."

---

## Take-Two's Request — RAGE:MP Shuts Down

![On a dark screen, only a small server-and-city icon remains, ringed by concentric radar circles](/images/news/ragemp-history/shutdown-signal.webp)

In the announcement, the RAGE:MP team explained that Rockstar Games and Take-Two Interactive had made clear that, for GTA V multiplayer MODs, FiveM is the only authorized platform under their Platform License Agreement.

Complying with Take-Two's request, they announced a phased shutdown of RAGE:MP.

It would not happen overnight: a grace period was set so server operators could migrate to FiveM.

New community server applications stopped immediately and general distribution of the RAGE:MP Server Toolkit ended, while existing server operators retained access to the builds they needed through the Server Manager.

The public server list then closed on June 1, 2026. The final deadline was set at August 31, 2026.

Remaining community servers were asked to migrate by that date, after which RAGE:MP's game client and server tools would no longer be provided or supported and the backend infrastructure would be permanently shut down.

---

## "Please Move to FiveM" — A Former Rival as the Only Destination

What is symbolic about the RAGE:MP announcement is that it does not stop at "we are shutting down."

The team asked existing servers to migrate to FiveM, and said the Cfx team would help with technical questions during the move.

In the 2010s, FiveM and RAGE:MP were competitors in the same GTA V custom multiplayer market.

In 2026, RAGE:MP itself is directing its users to FiveM.

Given ten years of history, it is a strikingly symbolic ending. For FiveM's own mechanics, see "[What Is FiveM?](/en/fivem-gtarp/what-is-fivem)"; for how FiveM and GTA RP differ, see "[The Difference Between FiveM and GTARP](/en/fivem-gtarp/fivem-vs-gtarp)."

---

## Not Every RAGE:MP Server Went to FiveM

![A rainy intersection at night, traffic signals and headlights reflecting off the wet road](/images/news/ragemp-history/rp-city-street.webp)

It would be inaccurate, though, to read "RAGE:MP shuts down" as "every server moved to FiveM."

Some large communities chose their own path.

Grand RP, for example, announced in July 2026 that it was leaving RAGE:MP entirely for its own infrastructure and its own launcher, switching to connections through that launcher rather than through RAGE:MP while preserving player progress and content.

A platform can disappear without the communities and game systems grown on it over years disappearing with it.

Here too, the platform and the RP servers themselves need to be considered separately.

---

## Why Did RAGE:MP Have to End?

The direct reason confirmable from RAGE:MP's official announcement is plain.

Take-Two asked them to shut down, and Rockstar/Take-Two took the position that FiveM is the authorized multiplayer MOD platform for GTA V.

Rockstar's current Creator Platform License Agreement also names FiveM and RedM as Rockstar "Creator Services."

Beyond that, however, care is needed.

Claims like "RAGE:MP was killed so that GTA6 RP would run only on FiveM" or "FiveM will support GTA6 at launch" are not facts confirmed officially at this point.

Rockstar has not revealed everything about the future relationship between GTA6 and FiveM.

---

## "FiveM Won" Does Not Fully Explain RAGE:MP's Shutdown

![A monitor showing a map of GTA V's city with player icons scattered across it](/images/news/ragemp-history/server-player-map.webp)

On the surface it can look as though RAGE:MP simply lost its competition with FiveM.

Follow ten years of history, though, and it is more complicated.

Back in 2016, custom multiplayer on GTA V was not a form of play the publisher officially provided. Outside developers built the client, the server, synchronization, scripting APIs, UI and anti-cheat themselves, turning GTA V into a different online game.

Both RAGE:MP and FiveM came out of that current.

Then, in 2023, Cfx.re joined Rockstar Games, and in 2026 FiveM was written into the PLA as one of Rockstar's Creator Services.

The real change across these ten years, then, may be that "a custom multiplayer culture unofficial communities had built outside GTA V was gradually absorbed into Rockstar's own ecosystem."

RAGE:MP's shutdown is the event that symbolizes that shift.

---

## And On Into the GTA6 Era

2026, the year RAGE:MP ends, also happens to be the year the GTA series itself goes through an enormous generational change.

As GTA6's release approaches, FiveM exists as a platform under Rockstar, and GTA RP has become a culture far larger than anyone could have imagined when GTA V launched. In Japan, streaming became the entrance to RP; that history is laid out as a timeline in "[A History of Japanese GTARP Streamer Servers](/en/fivem-gtarp/streamer-server-history)."

Which is exactly why there is a point in preserving RAGE:MP's history.

A few years from now, in a world where GTA6 RP servers are taken for granted, people will search for "where did GTA RP begin" and "was there anything besides FiveM."

Explain GTA RP from the 2010s to the early 2020s with FiveM alone and a piece of the history goes missing.

There was GTA:Network, there was RAGE:MP, there was alt:V, and there was FiveM. Each set of developers rebuilt GTA V into an online world in a different way, and countless server operators and players built communities on top of them.

And on August 31, 2026, RAGE:MP — one of those options — completes its role.

The RAGE:MP team's final announcement contains a line that captures those ten years well.

> More than a codebase, it was the community that made RAGE:MP what it was.

The platform disappears; the GTA RP culture born on it does not.

That history carries on in the servers that moved to FiveM, in the communities that went to their own platforms, and in the RP of the GTA6 era now beginning.

---

> **Note:** This article was compiled by GTA6 FEED from publicly available information including RAGE Multiplayer's official announcements, development blog and forums, official announcements from Cfx.re and Rockstar Games, and Grand RP's official notices; it has no relationship whatsoever with Rockstar Games, Take-Two Interactive or the operators of these platforms. Version numbers and dates follow the wording of each official announcement. Rockstar has made no formal announcement about roleplay support in GTA6 or FiveM's role there, and this article does not treat that as confirmed. All images were generated with AI to illustrate the article and are not actual game footage, official UI, or screens from real servers. The eyecatch and some graphics carry Japanese text.`,
  },
  {
    id: 54,
    title:
      "GTA6の「車泥棒」が本格化？ TGGが明かした車両盗難・ドライブスルー・NPCの細かすぎる新仕様",
    displayTitle:
      "GTA6の「車泥棒」が本格化？\nTGGが明かした車両盗難・ドライブスルー・NPCの細かすぎる新仕様",
    description:
      "Rockstar Northで約3時間『GTA VI』を見たTGGから追加情報が出ている。窓割り・Slim Jim・Key Clonerと段階が分かれた車両盗難、スマホで盗む前に価値とセキュリティを確認できるスキャンアプリ、Burger Shotのドライブスルー、そして犬のフン袋を拾ってNPCへ投げられるという細かすぎるインタラクション。Rob Nelson氏の説明と合わせて整理する。",
    icon: "🚗",
    image: "/images/news/gta6-car-theft-drive-thru/eyecatch.webp",
    category: "topic",
    date: "2026-08-30",
    publishedAt: "2026-08-30 18:30",
    updatedAt: "2026-09-01",
    source:
      "TGG（The Gaming Gorilla）／IGN Rob Nelson氏インタビュー／ファミ通 Rob Nelson氏独占インタビュー／Esquire Australia ほか",
    sourceUrl: "https://x.com/TGGonYT",
    relatedArticles: [53, 50, 51],
    aiSummary: [
      "『GTA VI』では車両盗難が段階制になり、古い車は窓を割るかSlim Jimで開けられる一方、現代的な高級車にはKey Clonerが必要になる。Rob Nelson氏はIGNとファミ通の取材で、プレイヤーの進行状況や所持している道具によって盗める車が変わると説明している。アラームやGPSトラッカーを積んだ車もあり、盗んだ後の逃走まで含めてひとつの犯罪ゲームプレイになっている。",
      "ジェイソンとルシアのスマートフォンには車両スキャンアプリがあり、ロック状態・アラーム・トラッカーの有無・必要な道具・売却価格・自分の車として登録する費用まで、盗む前に確認できるという。一方で走行中の車は従来どおり運転手を引きずり出して奪えるため、「盗めるか」ではなく「どれだけ静かに、効率よく盗むか」が問われる設計になっている。",
      "Rockstar Northで約3時間ゲームを見たTGGからは、Burger Shotの店内利用とドライブスルー、犬のフン袋を落とさせて拾いNPCへ投げられるインタラクションも報告されている。ドライブスルーは現時点でTGGの証言が主な情報源であり、Rockstarが正式発表した仕様とは分けて扱う必要がある。",
    ],
    fullContent: `# GTA6の「車泥棒」が本格化？ TGGが明かした車両盗難・ドライブスルー・NPCの細かすぎる新仕様

8月27日に『Grand Theft Auto VI: An Extended Look』が公開されて以降、Rockstar Northで発売前の『GTA VI』を見た海外クリエイターたちから、公式映像だけでは分からなかった情報が次々と出始めている。

中でも情報量が多いのが、Rockstar Northへ招待され、約3時間にわたってゲームプレイを見たGTA系YouTuberのTGGだ。

[先日の記事](/news/53)では、TGGを含むRockstar North招待クリエイターの証言をまとめて紹介したが、その後も追加情報が出ている。Burger Shotのドライブスルー、車種によって変わる盗難方法、スマートフォンを使った車両スキャン、さらには犬のフンが入った袋を拾ってNPCへ投げられるという、いかにもRockstarらしい細かなインタラクションまで明らかになってきた。

今回は、TGGの追加証言とRockstar North共同スタジオ責任者Rob Nelson氏の説明を中心に、『GTA VI』のオープンワールドがどこまで変わろうとしているのかを整理する。

*※TGGがRockstar Northで見聞きした内容と、Rockstar開発者がメディアへ直接説明した内容を含みます。TGGのみが伝えている内容については、その旨が分かるように記載しています。本記事に掲載している画像は、内容をイメージしやすくするためにAIで生成したもので、実際のゲーム画面ではありません。*

---

## 「Grand Theft Auto」が本当にゲームになる――車を盗むだけでも簡単ではない

今回明らかになった情報の中でも、とくにゲームプレイへの影響が大きそうなのが車両盗難システムだ。

これまでのGTAシリーズでは、欲しい車を見つけたらドアへ近づき、そのまま乗り込んで盗むという流れが基本だった。ところが『GTA VI』では、駐車されている車を盗むこと自体にいくつもの段階が設けられている。

Rockstar NorthのRob Nelson氏はIGNの取材で、これまでのGTAではボタンを押せばどんな車でも自動的にホットワイヤーして盗めたため、ゲームプレイとして活用できる余地を残していたと説明している。そこで今回は車両に段階を設け、プレイヤーの進行状況や所持している道具によって盗める車が変わる仕組みにしたという。

古い車などでは窓を割って強引に侵入するほか、「Slim Jim」と呼ばれる鍵開け用の工具を使用して、比較的静かにドアを開けることもできる。Extended Lookでも、このSlim Jimを使って車へ侵入する場面が確認されている。

一方、現代的な高級車になると話は変わる。電子的なセキュリティを突破するための「Key Cloner（キークローナー）」が必要になる車両があり、ゲーム序盤では必要な道具を持っていないため、そもそも盗めない駐車車両も存在する。

この仕組みについては日本のファミ通によるRob Nelson氏への独占インタビューでも説明されており、ゲームを進めて新しい道具を手に入れることで、よりセキュリティの高い車を狙えるようになることが確認されている。

つまり『GTA VI』では、シリーズタイトルそのものでもある「Grand Theft Auto＝自動車重窃盗」が、単なる移動手段の入手方法ではなく、ひとつの犯罪ゲームプレイとして本格的に作り直されている。

---

## 高級車を見つけても、すぐ盗めるとは限らない

この変更によって、Leonidaで高級車を見つけたときの意味も変わってくる。

従来なら「いい車を見つけたから盗む」で終わっていたが、『GTA VI』ではまず、その車を自分が盗めるのかを判断する必要がある。

![夜のLeonidaの大通りを逃走する赤いマッスルカー。後方からパトカーが追い、上空にはヘリコプターが飛んでいる](/images/news/gta6-car-theft-drive-thru/stolen-car-police-chase.webp)

高級車ほど高度なセキュリティを搭載している可能性が高く、アラームだけでなくGPSトラッカーまで装備されている場合がある。うまくドアを開けてエンジンを始動できたとしても、トラッカーから位置情報が送信されれば警察に居場所を把握される可能性がある。

ファミ通の取材では、盗難車に搭載された高性能トラッカーから信号が送られ、警察が位置を把握するケースについてもRob Nelson氏が説明している。

そのため「盗めた＝成功」ではない。盗難そのものに成功した後も、警察に捕まらず車を運び、売却するのか、自分の車として登録するのかまで考える必要がある。

車を盗むというGTAシリーズでは当たり前だった行動に、「どの車を狙うのか」「どの方法で侵入するのか」「盗んだ後にどうするのか」という判断が追加されている。

---

## スマホで車をスキャン。盗む前に“査定”できる

そこで重要になるのが、ジェイソンやルシアが持っているスマートフォンだ。

ゲーム内には車両をスキャンできるアプリが存在し、対象となる車を調べることで、盗む前にさまざまな情報を確認できる。

![路上に駐車されたSUVのドアを工具でこじ開けようとする男と、その車のロック状態・アラーム・トラッカー・必要な道具・売却価格・登録費用を表示したスマートフォンのアプリ画面](/images/news/gta6-car-theft-drive-thru/vehicle-scan-app.webp)

報告されている情報には、その車がロックされているか、アラームが搭載されているか、トラッカーが付いているか、盗むためにどの道具が必要なのかといった項目が含まれている。

さらに、その車を盗品として売却した場合にどれくらいの価値があるのか、自分の所有車として登録する場合にどれくらい費用がかかるのかまで確認できるという。

高級車だからといって必ずしも盗む価値があるとは限らない。高度なセキュリティを突破して警察に追われるリスクを負った結果、思ったほど利益が出ない可能性もある。

逆に、セキュリティが弱く、トラッカーもなく、売却価格が高い車を見つければ格好のターゲットになる。

車を見つけ、スキャンし、リスクと利益を確認してから盗む。この流れを見るだけでも、『GTA VI』では犯罪そのものにかなりゲーム的な判断が追加されていることが分かる。

---

## ただし従来の「カージャック」は健在

ここまで聞くと、「GTAなのに車を気軽に奪えなくなるのか」と思うかもしれない。

そこについては心配なさそうだ。

Rob Nelson氏によれば、道路を走っている車については、これまでのGTAと同じように運転手を引きずり出して奪うことができる。急いで逃走車が必要になった場合に、毎回Slim Jimを使ってミニゲームをする必要があるわけではない。

ただし、強引なカージャックには当然リスクがある。車を奪われたNPCが警察へ通報する可能性があり、盗んだ車にトラッカーが搭載されていれば、その後の逃走にも影響する。

『GTA VI』では「車を盗めるかどうか」ではなく、「どれだけ静かに、効率よく盗むか」が重要になっているようだ。

これは、すでに明らかになっている[犯罪プロファイル](/news/53)とも相性がいい。必要以上に暴力を使わず犯罪を成功させるプレイと、目についた車を強引に奪って逃げるプレイの両方を成立させ、その選択をプレイヤーへ委ねる設計になっていると考えられる。

---

## 盗んだ後の運転も別物に？ GTA6の車両挙動はゼロから再構築

車を探し、スマートフォンでスキャンし、必要な道具を使って盗み、警察を振り切り、売却するか自分の車として登録する。ここまで整理してきた一連の流れの中心にあるのは、結局のところ車を運転している時間そのものだ。そしてTGGによれば、その運転部分もまた作り直されているという。

TGGはRockstar Northで、共同スタジオ責任者のRob Nelson氏へ『GTA VI』のドライビングについて直接質問している。内容は「GTA IVのような重量感のある挙動になるのか」というもので、GTA IVの車の重さや慣性を好んできたプレイヤーにとっては長年の関心事だった。

Rob Nelson氏の回答としてTGGが伝えているところによると、GTA IVの重量感やフィーリングの良かった部分は残しつつ、当時うまくいっていなかった部分は取り除き、GTA Vの操作しやすさも含めて各作品の良い部分を組み合わせているという。『GTA VI』の車両挙動は現行世代のハードへ向けてゼロから再構築されており、タイヤ、サスペンション、ステアリング、路面や地形ごとの反応といった車を構成する各要素を、従来作よりも細かく制御できるように開発が進められている。

ここで注意しておきたいのは、これが「GTA IVの挙動がそのまま復活する」という話ではないことだ。Rob Nelson氏の説明はあくまで、GTA IVの重量感とGTA Vの扱いやすさという、これまで両立の難しかった長所を組み合わせる方向性を示したものになる。

また、TGGが参加したのはRockstar側がゲームを操作するハンズオフプレビューであり、TGG自身がコントローラーを握って運転したわけではない。そのため実際の操作感について、本人も断定的な説明はしていない。Extended Lookの映像を見て「車に重量感がありそうだ」と感じた人は多いが、それは映像から受けた印象であって、Rockstarが確定情報として発表した挙動ではない。

どの車をどう盗むかだけではなく、盗んだ車をどう走らせるかまで含めて、『GTA VI』では車まわりの体験そのものが組み直されているようだ。

---

## 燃料、積載量、ガレージ――GTA6では車がただの移動手段ではなくなる

運転そのものが作り直されているのと並行して、TGGがRockstar Northで得た情報としては、車を手に入れた後の部分についても複数の報告が出ている。走らせるだけでなく、燃料を管理し、何をどれだけ積み、どこへ置いておくのか。車まわりのシステムがかなり広い範囲へ伸びている。

まず報告されているのが燃料システムだ。TGGによれば『GTA VI』にはガソリン車の燃料とEVの充電という概念があり、ガソリンスタンドで実際に給油できる。給油時には車を降りてノズルを使い、満タンまでは約10秒程度、専用のアニメーションと画面上のカウント表示も用意されているという。ただし燃費がどの程度なのか、どのくらいの頻度で給油が必要になるのか、燃料が尽きたときに何が起きるのかといった部分は現時点で分かっていない。確認できるのは「燃料という概念が存在し、給油・充電のシステムがあるとTGGが報告している」というところまでだ。

この話は、開発途中では食料品店での買い物を必須の要素にする案もあったものの、Rockstarが「やりすぎ」と判断して強制要素から外したという以前の報道ともつながる。生活実感を上げる仕組みを積み上げつつ、それがゲームのテンポを損なわない範囲に収める調整が続いているのだろう。給油についても、現時点の報告だけで「常に燃料を気にしながら移動するゲーム」と決めつけるのは早い。

TGG由来の情報としてもうひとつ興味深いのが、車種によって運べる荷物の量が違うという点だ。バイクは積める量が少なく、一般的な車はそれより多く、大型車やバンでは複数のダッフルバッグを運べる可能性があるとされている。これが製品版でも同様なら、逃走車の選択が「一番速い車を選べば正解」ではなくなる。速度を取るのか、盗品の積載量を取るのか。犯罪計画そのものに車種選びが関わってくるかもしれないが、これはあくまでRockstar Northプレビュー由来の情報にもとづく見立てであり、最終仕様として確認されたものではない。

保管についても報告がある。Leonida各地で車両保管用のガレージを購入できるという説明で、ここは従来作のように隠れ家を次々と買い集める話とは分けて考えたい。ジェイソンとルシアは物語上、逃亡生活を送るキャラクターであり、住宅を増やしていくよりも「盗んだ車を置いておく場所」を持つシステムになっているという整理だ。購入できるガレージの数、価格、1か所に何台入るのかといった部分は現時点では分かっていない。

さらにTGGは、シリーズおなじみのPay 'n' Sprayの復活や車両改造ショップの存在、店舗によって得意な改造内容が異なる可能性、Nitrousに関する要素、衝突時のクラッシュカメラなども伝えている。ひとつひとつは細かい話だが、盗んだ後に色を変え、手を入れ、性能を上げるところまで車両ゲームプレイが伸びていることを示す材料ではある。

こうして並べてみると、『GTA VI』の車は単なる移動手段ではなくなりつつある。狙う車をスマートフォンで調べ、必要な道具を用意して盗み、燃料を確認し、作り直された挙動で走らせて警察を振り切り、積める量を考えて盗品を運び、ガレージへ置き、改造するか売却するか自分の車として登録するかを決める。ここまでが一本のミッションとして確認されたわけではなく、現時点で報告されている車両関連システムを並べたときに見えてくる遊び方の可能性にすぎない。それでも、シリーズタイトルの「Grand Theft Auto」がこれほど字義どおりの意味を持った作品は、これまでなかったはずだ。

---

## Burger Shotが本当に使える。しかもドライブスルー対応？

TGGからは、犯罪とはまったく違う方向の追加情報も出ている。

GTAシリーズではおなじみのファストフードチェーン「Burger Shot」が、『GTA VI』では実際に利用できるという。

![Burger Shotのドライブスルー窓口で、車に乗ったまま店員から紙袋を受け取る男性。窓の横には新商品のポスターが貼られている](/images/news/gta6-car-theft-drive-thru/burger-shot-drive-thru.webp)

TGGが追加配信で説明した内容として報じられているところによると、プレイヤーはBurger Shotの店内へ入り、食事を購入できる。さらに興味深いのが、車に乗ったままドライブスルーを利用して注文することもできるという点だ。

ここについては現時点でRockstarが単独で正式発表した機能ではなく、Rockstar Northでゲームを見たTGGの証言をもとにした情報として扱う必要がある。

それでも事実であれば、GTA Vからの大きな変化になる。

GTA VにもBurger ShotやCluckin' Bellといったファストフード店は存在したが、多くは街を構成する背景であり、プレイヤーが通常の飲食店として自由に利用することはできなかった。

『GTA VI』では店内へ入れるだけでなく、車社会であるLeonidaらしくドライブスルーまでゲームシステムとして機能することになる。

派手な銃撃戦や強盗とは正反対の要素だが、こうした何気ない日常行動こそ、オープンワールドを「背景」ではなく「生活できる場所」に感じさせる部分でもある。

---

## 犬のフン袋まで拾える。冗談みたいだが意味は大きい

そして今回、海外でかなり話題になったのが「犬のフン」だ。

TGGがRockstar NorthでRob Nelson氏から説明された例として紹介したところによると、Leonidaでは犬を散歩させているNPCが存在し、その犬が路上で排泄すると飼い主が袋を使って処理する。

![ビーチ沿いの遊歩道で、犬を連れたNPCと、その足元に落ちた袋を拾おうと手を伸ばすアロハシャツの男](/images/news/gta6-car-theft-drive-thru/dog-poop-bag-npc.webp)

ここまではNPCの日常アニメーションとして珍しくない。

『GTA VI』がおかしいのは、その先だ。

袋を持っているNPCに干渉して落とさせれば、プレイヤーがその袋を拾うことができ、さらに別のNPCへ投げることまでできるという。この話はTGGだけでなく、Rockstar Northでゲームを見たEsquire Australia側の取材内容でも報告されている。

いかにもGTAらしいくだらない小ネタだが、ゲームシステムとして考えると意外に重要な話でもある。

NPCが犬を散歩する。犬が排泄する。飼い主がそれを拾う。プレイヤーが飼い主へ干渉する。持っていた物が地面へ落ちる。そしてプレイヤーがそれを拾って別の行動に使う。

あらかじめ決められた一本の演出ではなく、NPCの日常行動とプレイヤーの行動が途中からつながっている。

Rockstar NorthのRob Nelson氏は別のインタビューでも、『Red Dead Redemption 2』で導入したNPCインタラクションを『GTA VI』ではさらに進化させていると説明している。Greet、Taunt、Defuse、Provokeといった会話や反応だけではなく、周囲で起きている出来事そのものへ介入できる世界を目指しているようだ。

---

## 「NPCが多い」だけではないLeonida

Extended Lookでは、ビーチ、繁華街、道路、店舗など、いたるところに大量のNPCが登場していた。そのため映像公開直後は「GTA Vより街の人口密度が大幅に上がった」という部分に注目が集まった。

しかし、Rockstar Northでゲームを見たクリエイターやメディアの証言を追っていくと、Rockstarが力を入れているのは単純なNPCの数だけではなさそうだ。

NPCは会話し、スマートフォンを使い、犬を散歩させ、プレイヤーの行動を目撃し、場合によっては警察へ通報する。武器を持って歩けば周囲の人間が警戒し、犯罪を目撃した人物がプレイヤーの服装や車両について警察へ情報を伝えることもある。

プレイヤー側もNPCへ挨拶したり、挑発したり、事態を鎮めようとしたりできる。

つまりLeonidaでは、大量のNPCを配置して「人がたくさんいる街」を作るだけではなく、その一人ひとりをゲームシステムの一部として動かそうとしている。

犬のフン袋を投げられるという話だけを切り取れば笑い話で終わる。しかし、その仕組みを支えているシステムまで考えると、『GTA VI』のオープンワールドが目指している方向が少し見えてくる。

---

## GTA Vから変わるのは「マップの広さ」だけではない

『GTA VI』については、これまで[マップの広さ](/news/52)、グラフィック、NPCの数といった分かりやすい進化が注目されてきた。

しかし今回出てきた情報を見ると、Rockstarが力を入れているのは「できることの密度」なのかもしれない。

Burger Shotを見つけたら、本当に入れる。車に乗っていれば、そのままドライブスルーを利用できる。欲しい車を見つけたら、スマートフォンで価値やセキュリティを調べられる。高級車なら専用の道具を用意して盗む。NPCが何かを落とせば、それをプレイヤーが拾って使える場合もある。

どれも単体では小さな要素だ。

しかし、こうした小さなシステムがLeonida全体でつながれば、プレイヤーが予定していなかった出来事が次々と起こるオープンワールドになる。

Rockstarが『Red Dead Redemption 2』で追求した「世界の中で生活している感覚」を、現代の巨大都市へ持ち込み、さらにGTAらしい犯罪やブラックユーモアと組み合わせようとしているようにも見える。

---

## まだTGGから追加情報が出てくる可能性も

今回紹介した内容の一部は、Rockstar NorthのRob Nelson氏がIGNやファミ通などへ直接説明したことで複数の情報源から確認できる。一方、Burger Shotのドライブスルーのように、現時点ではTGGのRockstar North訪問時の証言が主な情報源になっているものもある。

そのため、すべてを同じ確度の「Rockstar公式発表」として扱うべきではない。

ただ、今回興味深いのは、Extended Look公開から数日が経ってもRockstar Northを訪れた人物から新しい話が出続けていることだ。

約3時間にわたってゲームを見たTGGをはじめ、El Rubius、Davy Jones、Mike ShowShaなど、[Rockstar Northへ招待された海外クリエイター](/news/53)たちは、公式映像には収録されなかったゲームプレイを目撃している。

さらにIGN、ファミ通、Esquire Australiaなど、Rockstarから直接説明を受けたメディア側にも、まだ掘り起こされていない細かな情報が残っている可能性がある。

GTA6 FEEDでは引き続き、Rockstar Northで『GTA VI』を見たクリエイターやメディアの動画、配信、記事を追い、新しい情報が確認できれば紹介していく。

Extended Lookで見えたのは、Leonidaのほんの一部だったのかもしれない。

今回明らかになってきた「車を盗む」という基本行動ひとつを見ても、『GTA VI』が従来のシリーズからどれだけ多くの部分を作り直そうとしているのか、その輪郭が少しずつ見え始めている。

---

## 更新履歴

**2026年8月30日：初版公開**

段階制になった車両盗難、スマートフォンの車両スキャンアプリ、Burger Shotの店内利用とドライブスルー、犬のフン袋のインタラクションなど、TGGの追加証言とRob Nelson氏の説明をまとめた。

**2026年8月31日：TGGとRob Nelson氏のやり取りをもとに、GTA6の車両挙動・ドライビングシステムが現行世代向けに再構築されていることを追記**

**2026年9月1日：TGGの追加情報をもとに、燃料・EV充電、車両ごとの積載量、購入可能なガレージ、Pay 'n' Sprayなど車両関連システムについて追記**

---

> **注記：** 本記事のうち車両盗難システム、GPSトラッカー、カージャック、NPCの多様性に関する部分は、Rockstar NorthのRob Nelson氏がIGN・ファミ通などのメディアへ直接説明した内容にもとづく。Burger Shotの店内利用およびドライブスルーについては、現時点ではRockstar Northで『GTA VI』を見たTGGの証言が主な情報源であり、Rockstar Gamesが正式発表した仕様ではない。犬のフン袋のインタラクションはTGGとEsquire Australiaの双方が伝えている。燃料・EV充電、車種ごとの積載量、購入できるガレージ、Pay 'n' Sprayや車両改造、Nitrousに関する内容も、現時点ではTGGがRockstar Northで得た情報としての報告であり、Rockstarが個別に正式発表した仕様ではない。日本語部分は編集部訳・要約を含む。掲載画像はいずれも記事内容をイメージしやすくするためにAIで生成したもので、実際のゲーム画面・公式UIではない。`,
    titleEn:
      "Grand Theft Auto, Literally: TGG on GTA VI's Layered Car Theft, Drive-Thrus and Absurdly Detailed NPCs",
    displayTitleEn:
      "Grand Theft Auto, Literally\nTGG on GTA VI's Layered Car Theft, Drive-Thrus and Absurdly Detailed NPCs",
    descriptionEn:
      "More is coming out of TGG, who watched roughly three hours of GTA VI at Rockstar North. Car theft is now tiered — smashed windows, a Slim Jim, a Key Cloner — a phone app lets you appraise a car's security and resale value before you take it, Burger Shot has a working drive-thru, and you can pick up a dropped bag of dog waste and throw it at an NPC. Set alongside what Rob Nelson told the press.",
    aiSummaryEn: [
      "Car theft in GTA VI is tiered: older cars can be broken into through a window or opened quietly with a Slim Jim, while modern high-end vehicles require a Key Cloner. Rob Nelson told IGN and Famitsu that which cars you can steal depends on your progress and the tools you carry. Alarms and GPS trackers mean the getaway is part of the crime, not an afterthought.",
      "Jason and Lucia's phone includes a vehicle scanning app that reports lock state, alarm, tracker, the tool required, resale value and the cost of registering the car as your own — all before you touch it. Cars in traffic can still be jacked the old way, so the question becomes not whether you can steal a car but how quietly and efficiently you do it.",
      "TGG, who saw about three hours of the game at Rockstar North, also reports that Burger Shot can be entered and ordered from by drive-thru, and that a bag of dog waste dropped by an NPC can be picked up and thrown at someone else. The drive-thru rests mainly on TGG's account and should not be treated as an official Rockstar announcement.",
    ],
    fullContentEn: `# Grand Theft Auto, Literally: TGG on GTA VI's Layered Car Theft, Drive-Thrus and Absurdly Detailed NPCs

Since "Grand Theft Auto VI: An Extended Look" went out on August 27, the overseas creators who saw pre-launch GTA VI at Rockstar North have been steadily putting out things the official footage never showed.

The most detailed of them is TGG, the GTA-focused YouTuber who was invited to Rockstar North and watched roughly three hours of gameplay.

[A previous article](/en/news/53) collected the accounts of the Rockstar North invitees, TGG among them — and more has come out since. A Burger Shot drive-thru, break-in methods that change with the car, a phone app for scanning vehicles, and, in a very Rockstar touch, the ability to pick up a bag of dog waste and throw it at an NPC.

Below, TGG's additional testimony alongside explanations from Rob Nelson, co-studio head at Rockstar North, and what they suggest about how far GTA VI's open world is changing.

*Note: this article contains both what TGG saw and heard at Rockstar North and what Rockstar developers explained directly to the press. Anything reported only by TGG is identified as such. All images here were generated with AI to illustrate the article and are not actual game footage.*

---

## Grand Theft Auto Becomes an Actual Game Mechanic — Stealing a Car Is No Longer Simple

Of everything to come out this time, the vehicle theft system looks likely to have the biggest effect on how the game plays.

In previous GTA games the loop was simple: spot the car you want, walk up to the door, get in, drive off. In GTA VI, stealing a parked car has been broken into several stages.

Rob Nelson told IGN that in past GTA titles a button press would automatically hotwire any car, which left gameplay potential on the table. So this time vehicles are tiered, and which ones you can steal depends on your progress and the tools you are carrying.

Older cars can be forced open by smashing a window, or opened relatively quietly with a lock tool known as a "Slim Jim." Extended Look itself includes a moment of a Slim Jim being used to get into a car.

Modern luxury cars are a different matter. Some require a "Key Cloner" to defeat their electronic security, and early in the game, without the necessary tools, there will simply be parked cars you cannot steal at all.

Famitsu's exclusive interview with Rob Nelson in Japan describes the same system, confirming that acquiring new tools as you progress opens up more heavily secured vehicles.

In other words, "Grand Theft Auto" — the series' own name, and a real term for felony car theft — has been rebuilt in GTA VI as a piece of criminal gameplay in its own right, rather than just a way to obtain transport.

---

## Finding a Luxury Car Does Not Mean You Can Take It

That change also alters what it means to spot an expensive car in Leonida.

Previously the thought ended at "nice car, take it." In GTA VI you first have to judge whether you can steal it at all.

![A red muscle car speeding away down a Leonida boulevard at night, a police cruiser in pursuit behind it and a helicopter overhead](/images/news/gta6-car-theft-drive-thru/stolen-car-police-chase.webp)

The more expensive the car, the more likely it carries advanced security — not just an alarm but a GPS tracker. Even if you get the door open and the engine started, a tracker transmitting your position can put the police onto you.

In the Famitsu interview, Rob Nelson also described cases where a high-end tracker in a stolen car sends a signal and the police work out where you are.

So a successful break-in is not the same as a successful theft. After taking the car you still have to move it without being caught, and decide whether to sell it or register it as your own.

Stealing a car — the most ordinary action in the series — now carries decisions: which car to target, how to get into it, and what to do with it afterward.

---

## Scan a Car With Your Phone and Appraise It Before You Steal It

This is where Jason and Lucia's phone becomes important.

The game includes an app that scans vehicles, letting you check a range of information about a car before stealing it.

![A man prying at the door of an SUV parked on a street, beside a phone app screen listing that car's lock level, alarm, tracker, required tool, resale value and registration cost](/images/news/gta6-car-theft-drive-thru/vehicle-scan-app.webp)

Reported fields include whether the car is locked, whether it has an alarm, whether it carries a tracker, and which tool you need to take it.

Beyond that, it reportedly shows how much the car is worth if sold on as stolen goods, and how much it would cost to register as a vehicle you own.

An expensive car is not automatically worth stealing. You may beat sophisticated security and take on a police chase only to clear less than you expected.

Conversely, a car with weak security, no tracker and a high resale value makes an ideal target.

Find a car, scan it, weigh risk against reward, then steal it. Even that sequence alone shows how much game-level decision-making GTA VI has added to the crime itself.

---

## The Old-Fashioned Carjack Is Still There

At this point you might wonder whether a GTA game has made it hard to just grab a car.

That does not appear to be a concern.

According to Rob Nelson, cars driving on the road can be taken the way they always have been: pull the driver out and go. If you urgently need a getaway car, you are not obliged to play a Slim Jim minigame every time.

A forced carjacking carries its own risk, of course. The NPC whose car you took may call the police, and if the stolen car has a tracker, that will shape the escape that follows.

The question in GTA VI seems to be less whether you can steal a car than how quietly and efficiently you do it.

That fits neatly with the [criminal profile](/en/news/53) already described. The design appears to support both playing a crime through without more violence than necessary and simply grabbing whatever car is nearby and running — and to leave that choice to the player.

---

## Driving the Car You Stole Has Been Rebuilt From Scratch Too

Find a car, scan it with your phone, take it with the right tool, shake off the police, then sell it or register it as your own. At the center of that entire loop is the time you actually spend driving — and according to TGG, that part has been rebuilt as well.

At Rockstar North, TGG put a question about GTA VI's driving directly to co-studio head Rob Nelson: would the handling carry the weight of GTA IV? For players who liked the heft and inertia of GTA IV's cars, it has been a long-standing question.

As TGG relays the answer, the team has kept what felt good about GTA IV's sense of weight while stripping out what did not work at the time, combining the strengths of each game — GTA V's ease of control included. GTA VI's vehicle handling has been rebuilt from the ground up for current-generation hardware, with tires, suspension, steering and how a car responds to different road surfaces and terrain all built to be controlled in finer detail than in previous titles.

Worth being clear about: this is not a statement that GTA IV's handling returns as it was. What Nelson described is a direction — combining GTA IV's weight with GTA V's manageability, two qualities the series has struggled to deliver at once.

TGG also attended a hands-off preview, with Rockstar operating the game; he never held a controller himself, and he has not made definitive claims about how it feels to drive. Plenty of people came away from Extended Look thinking the cars look weighty, but that is an impression taken from footage rather than handling Rockstar has confirmed.

Not just which car you steal and how, then, but how the stolen car drives — the whole experience around vehicles appears to have been reassembled for GTA VI.

---

## Fuel, Cargo Capacity, Garages — a Car in GTA VI Is No Longer Just Transport

Alongside driving itself being rebuilt, TGG has reported several things from Rockstar North about what happens after you have the car. Not just driving it, but managing its fuel, deciding what and how much you can carry in it, and where you keep it. The systems around vehicles reach a good deal further than before.

The first of them is fuel. According to TGG, GTA VI has both petrol for combustion cars and charging for EVs, and you can actually refuel at a gas station. Doing so means getting out of the car and using the nozzle; filling the tank takes around ten seconds, with a dedicated animation and an on-screen count. How efficient cars are, how often you would need to refuel, and what happens when you run dry are all unknown at this point. What can be stated is only that a concept of fuel exists and that TGG reports a working refuel/charge system.

This connects with earlier reporting that during development there was a proposal to make grocery shopping mandatory, which Rockstar judged to be going too far and removed as a requirement. Systems that add a sense of daily life keep being layered in, while being tuned to stay within what does not damage the game's pace. It is too early to take the current reports on refueling and conclude this is a game where you constantly watch a fuel gauge.

Another interesting item from TGG is that how much you can carry differs by vehicle. Bikes hold little, ordinary cars more, and larger vehicles and vans may be able to carry several duffel bags. If that holds in the finished game, picking a getaway vehicle stops being a matter of "take the fastest car." Speed, or capacity for what you are stealing? Vehicle choice may become part of planning the crime itself — though this is a reading based on information from the Rockstar North preview, not a confirmed final specification.

Storage has been reported on too: garages for keeping vehicles can be bought around Leonida. This is worth separating from buying up safehouses one after another as in previous games. Jason and Lucia are characters living on the run in the story, and the explanation given is that the system is built around having somewhere to keep stolen cars rather than accumulating homes. How many garages can be bought, what they cost, and how many cars fit in one are not known at this point.

TGG has also mentioned the return of the series staple Pay 'n' Spray, vehicle modification shops, the possibility that different shops specialize in different work, something involving nitrous, and a crash camera on collisions. Individually these are small details, but together they show vehicle gameplay extending into changing the color, working on the car and improving its performance after the theft.

Lined up like that, a car in GTA VI is becoming something other than transport. Look up the car you want on your phone, bring the right tools and take it, check the fuel, drive it on rebuilt handling and lose the police, weigh what it can carry against what you are hauling, put it in a garage, then decide whether to modify it, sell it, or register it as your own. None of this has been confirmed as a single mission; it is only the shape of play that emerges when the vehicle systems reported so far are placed side by side. Even so, there has probably never been an entry in which the series title "Grand Theft Auto" was this literal.

---

## Burger Shot Actually Works — With a Drive-Thru?

TGG has also brought out information pointing in an entirely different direction from crime.

Burger Shot, the fast food chain familiar from across the series, can reportedly be used for real in GTA VI.

![A man in his car at a Burger Shot drive-thru window taking a paper bag from the employee, a poster for a new item on the glass beside him](/images/news/gta6-car-theft-drive-thru/burger-shot-drive-thru.webp)

According to reports of what TGG described in a follow-up stream, players can go inside a Burger Shot and buy food. More interesting still, you can also order from a drive-thru while remaining in your car.

This is not something Rockstar has announced on its own, and needs to be treated as information resting on the account of TGG, who saw the game at Rockstar North.

If it holds, though, it is a significant change from GTA V.

GTA V had Burger Shot and Cluckin' Bell too, but most were set dressing rather than restaurants a player could actually use.

In GTA VI you would be able not only to walk inside but to use a drive-thru as a working game system — fitting for Leonida, a place built around cars.

It is the opposite of a spectacular shootout or heist, but these unremarkable everyday actions are exactly what make an open world feel like a place you can live in rather than a backdrop.

---

## You Can Even Pick Up a Bag of Dog Waste. It Sounds Like a Joke; It Is Not a Small One

And then there is the thing that got the most attention overseas: dog waste.

According to what TGG relayed as an example Rob Nelson gave him at Rockstar North, Leonida has NPCs out walking dogs, and when a dog relieves itself in the street the owner bags it up.

![On a beachfront promenade, a man in an aloha shirt reaches for a bag on the ground beside an NPC walking a dog](/images/news/gta6-car-theft-drive-thru/dog-poop-bag-npc.webp)

So far, nothing unusual as NPC ambient animation.

What is strange about GTA VI is what comes next.

Interfere with the NPC holding the bag so that they drop it, and the player can pick it up — and then throw it at another NPC. This has been reported not only by TGG but in coverage from Esquire Australia, who also saw the game at Rockstar North.

It is exactly the kind of stupid GTA gag you would expect, but as a piece of game system design it matters more than it sounds.

An NPC walks a dog. The dog relieves itself. The owner picks it up. The player interferes with the owner. What they were holding falls to the ground. And the player picks that up and uses it for something else.

This is not one predetermined set piece; NPC routine and player action join up partway through.

Rob Nelson has said in other interviews that the NPC interactions introduced in Red Dead Redemption 2 have been pushed further in GTA VI. Beyond dialogue and reactions like Greet, Taunt, Defuse and Provoke, the goal seems to be a world where you can intervene in the events happening around you.

---

## Leonida Is Not Just "a Lot of NPCs"

Extended Look showed crowds everywhere — beaches, nightlife districts, roads, storefronts. Immediately after it went out, much of the attention went to how much denser the city felt than GTA V.

But following the accounts of the creators and press who saw the game at Rockstar North, raw NPC count does not appear to be the only thing Rockstar has invested in.

NPCs talk, use phones, walk dogs, witness what the player does, and in some cases call the police. Walk around armed and people nearby react warily; a witness to a crime may describe your clothes or your vehicle to the police.

The player, in turn, can greet NPCs, provoke them, or try to defuse a situation.

Leonida, then, is not just a matter of placing enough NPCs to make a crowded city — it is an attempt to run each of them as part of the game's systems.

Taken on its own, "you can throw a bag of dog waste" is a punchline. Consider the systems underneath it and you start to see where GTA VI's open world is heading.

---

## What Changed From GTA V Is Not Only the Size of the Map

The obvious upgrades — [map size](/en/news/52), graphics, NPC counts — have driven most of the GTA VI conversation so far.

Looking at what has come out this time, though, what Rockstar has really invested in may be the density of things you can do.

Find a Burger Shot and you can actually go in. Stay in your car and you can use the drive-thru. Spot a car you want and you can look up its value and its security on your phone. For a luxury car, bring the right tool. If an NPC drops something, you may be able to pick it up and use it.

None of these is large on its own.

But wire enough of these small systems together across Leonida and you get an open world where things you did not plan for keep happening.

It looks like an attempt to take the "living inside a world" quality Rockstar chased in Red Dead Redemption 2 into a modern metropolis, and combine it with the crime and black humor that belong to GTA.

---

## There May Be More to Come From TGG

Parts of what is covered here can be confirmed from multiple sources, because Rob Nelson explained them directly to IGN, Famitsu and others. Other parts — the Burger Shot drive-thru among them — currently rest mainly on TGG's account of his Rockstar North visit.

So none of it should be treated as carrying the same weight as an official Rockstar announcement.

What is interesting is that days after Extended Look, new material is still emerging from the people who went to Rockstar North.

TGG, who watched about three hours, along with El Rubius, Davy Jones and Mike ShowSha — [the overseas creators invited to Rockstar North](/en/news/53) — all saw gameplay that never made the official footage.

And on the press side, IGN, Famitsu and Esquire Australia, all briefed directly by Rockstar, may still have details that have not been dug out.

GTA6 FEED will keep following the videos, streams and articles of the creators and outlets who saw GTA VI at Rockstar North, and will cover new information as it is confirmed.

What Extended Look showed may have been only a small part of Leonida.

Even in a single basic action — stealing a car — you can start to make out how much of the series GTA VI is rebuilding.

---

## Update Log

**August 30, 2026: first published**

Collected TGG's additional testimony and Rob Nelson's explanations, covering tiered vehicle theft, the phone's vehicle scanning app, entering Burger Shot and its drive-thru, and the dog waste bag interaction.

**August 31, 2026: added, from the exchange between TGG and Rob Nelson, that GTA VI's vehicle handling and driving system have been rebuilt for the current console generation**

**September 1, 2026: added, from further information from TGG, the vehicle systems around fuel and EV charging, per-vehicle cargo capacity, purchasable garages, and Pay 'n' Spray**

---

> **Note:** The portions of this article covering the vehicle theft system, GPS trackers, carjacking and NPC variety are based on what Rob Nelson of Rockstar North explained directly to outlets including IGN and Famitsu. Entering Burger Shot and using its drive-thru currently rests mainly on the account of TGG, who saw GTA VI at Rockstar North, and is not a specification announced by Rockstar Games. The dog waste bag interaction is reported by both TGG and Esquire Australia. Fuel and EV charging, per-vehicle cargo capacity, purchasable garages, Pay 'n' Spray and vehicle modification, and the nitrous item are likewise reported at this point as information TGG obtained at Rockstar North, not specifications Rockstar has individually announced. Japanese-language passages are summarized or paraphrased by the editorial team. All images were generated with AI to illustrate the article and are not actual game footage or official UI.`,
  },
  {
    id: 53,
    title:
      "Rockstar Northに招待されたGTA6海外クリエイターまとめ｜TGG・El Rubius・Davy Jonesらが見た「発売前のGTA VI」",
    displayTitle:
      "Rockstar Northに招待されたGTA6海外クリエイターまとめ\nTGG・El Rubius・Davy Jonesらが見た「発売前のGTA VI」",
    description:
      "Rockstar Gamesが2026年7月、スコットランド・エディンバラのRockstar Northへ招待した海外クリエイターたち。TGG、El Rubius、Davy Jones、Mike ShowShaが「An Extended Look」には収録されなかったゲームプレイを見て、Rob Nelson氏から直接説明を受けている。犯罪プロファイル、一人称視点、フレームレート、NPC表現――彼らの証言を1本にまとめ、新情報が出るたびに追記していく。",
    icon: "🗣️",
    image: "/images/news/gta6-official/vice-city-03.webp",
    category: "topic",
    date: "2026-08-29",
    publishedAt: "2026-08-29 18:00",
    source:
      "TGG・El Rubius・Davy Jones・Mike ShowSha 各公式チャンネル／ファミ通 Rob Nelson氏独占インタビュー ほか",
    sourceUrl: "https://x.com/TGGonYT/status/2092582849111113810",
    relatedArticles: [47, 50, 51],
    aiSummary: [
      "2026年7月、Rockstar Gamesはスコットランド・エディンバラのRockstar Northへ世界各国のクリエイターを招待し、『GTA VI』のハンズオフ形式の先行プレビューを行っていた。現時点で参加を公表しているのはTGG（オーストラリア）、El Rubius（スペイン）、Davy Jones（ブラジル）、Mike ShowSha（イタリア）の4人で、Extended Lookには収録されなかったゲームプレイを長時間見ている。",
      "TGGは約3時間のゲームプレイを見たとして、行動の質を追跡する「犯罪プロファイル」の仕組みを説明。Davy JonesはRob Nelson氏への直接質問から、専用の一人称モードは発売時に用意されないこと、現在の開発ビルドが30fpsで動作していることを伝えている。El RubiusはLeonidaのNPC表現の細かさに驚いたと語った。",
      "ただしいずれもRockstarが操作するハンズオフプレビューであり、公式発表とクリエイターの証言、そこからの推測は分けて扱う必要がある。GTA6 FEEDでは今後も招待クリエイターの動画・SNS・インタビューを確認し、新情報が出た場合はこの記事へ追記していく。",
    ],
    fullContent: `# Rockstar Northに招待されたGTA6海外クリエイターまとめ｜TGG・El Rubius・Davy Jonesらが見た「発売前のGTA VI」

2026年8月27日に公開された『Grand Theft Auto VI: An Extended Look』によって、ジェイソンとルシアの物語、Leonidaの街並み、銃撃戦、警察とのチェイス、アクティビティなど、これまで断片的にしか見えていなかった『GTA VI』の姿が一気に明らかになった。

しかし、今回の情報公開で注目すべきなのはExtended Lookだけではない。その約1か月前、Rockstar Gamesは世界各国の一部クリエイターをスコットランド・エディンバラのRockstar Northへ招待していた。

そこで行われていたのが、Rockstar側が実際に『GTA VI』を操作し、それを招待者が見る「ハンズオフ形式」の先行プレビューだ。参加者自身が自由にコントローラーを握ったわけではないものの、Extended Lookには収録されていないゲームプレイを長時間見る機会が与えられ、Rockstar Northの開発責任者で共同代表でもあるRob Nelson氏らへ直接質問したクリエイターもいる。

つまり、彼らが公開している動画やSNSには、公式映像を見ているだけでは分からない情報が含まれている。

GTA6 FEEDでは今後、Rockstar Northに招待されたクリエイターの動画、SNS、インタビューなどを継続的に確認し、新しい情報が公開された場合はこの記事へ追記していく。新たな招待クリエイターが判明した場合も追加する予定だ。

なお、Rockstar Northへの招待そのものが判明した経緯は「[RockstarがGTA6を海外クリエイターに先行公開していたことが判明](/news/47)」で扱っている。

**※この記事は随時更新します。クリエイターから新しい証言が公開された場合、内容を追記します。**

---

## 現在確認できているRockstar North招待クリエイター

2026年8月29日時点で、Rockstar Northで行われた『GTA VI』の先行プレビューへの参加を公表している主要クリエイターとして確認できるのは、TGG、El Rubius、Davy Jones、Mike ShowShaの4人だ。

### TGG（The Gaming Gorilla）／オーストラリア

GTAシリーズを長年扱ってきたYouTuber。Rockstar North訪問後、Extended Look公開に合わせて「I Saw 3 Hours of GTA 6 at Rockstar North - First Impressions」と題した動画を公開し、約3時間に及ぶ『GTA VI』のゲームプレイを見たことを明らかにしている。

現在出ているクリエイター証言の中でも情報量が多く、犯罪プロファイルをはじめ、Extended Lookだけでは分からなかったゲームシステムについて詳しく語っている。

### El Rubius／スペイン

スペイン語圏を代表する巨大クリエイターのひとり。Rockstar Northを訪問し、約2時間にわたってゲームを見たとされている。

Rockstarスタッフがゲームを操作するハンズオフ形式ではあったものの、El Rubius側から「これをやってほしい」と行動をリクエストできる場面もあったという。そのため、用意された映像を一方的に鑑賞しただけではなく、ある程度その場でゲーム世界を確認できるプレビューだったことが分かる。

### Davy Jones／ブラジル

GameplayrjやFlow Gamesで知られるブラジルのゲームクリエイター。本人によれば、今回Rockstar Northへ招待されたブラジル人クリエイターは自身のみだったという。

Davy Jonesの情報で特に重要なのが、Rob Nelson氏へ直接質問する機会を得ていたことだ。一人称視点や現在のゲームのパフォーマンスなど、発売前の『GTA VI』についてかなり具体的な話が出ている。

### Mike ShowSha／イタリア

イタリアのゲームクリエイター。2026年7月にRockstar Northを訪問していたことを公表し、Extended Look公開後には『GTA VI』について語るコンテンツを展開している。

現時点では、この4人が主要な招待クリエイターとして確認されている。ただし、これがRockstarから招待された人物の全員とは限らない。今後、新たにRockstar North訪問を明かすクリエイターやメディア関係者が現れた場合も確認していく。

---

## TGGが見た約3時間の『GTA VI』

現在公開されているクリエイター情報の中でも、とくに情報量が多いのがTGGだ。Rockstar Northで約3時間にわたって『GTA VI』のゲームプレイを見たとしており、その中からExtended Lookでは十分に説明されなかったシステムも明らかになっている。

そのひとつが「Criminal Profile（犯罪プロファイル）」だ。

![犯罪プロファイルの仕組みを整理した図版。評価が上がる行動として「必要以上に人を殺さない」「効率よく強盗を成功させる」「素早く逃走する」「プロの犯罪者として振る舞う」、下がる行動として「無関係な市民の殺害」「動物の殺害」「倒れた相手への過剰な攻撃」「無意味な暴力の繰り返し」を挙げ、ジェイソンとルシアそれぞれのプロファイル表示を並べた図](/images/news/gta6-rockstar-north-creators/criminal-profile-explainer.webp)

*図版は本記事の内容を整理するために編集部が作成したもので、実際のゲーム内UIではない。*

Extended Lookを見た段階では、『Red Dead Redemption 2』の名誉システムに近いものではないかと考えた人も多いかもしれない。しかし、Rockstar側から説明された内容によると少し性質が違う。単純にプレイヤーを「善人か悪人か」で評価するのではなく、どのような犯罪者として行動しているのかを記録する仕組みになっているという。

たとえば店を強盗するとき、必要以上に人を殺さず、目的を達成して素早く逃走するような行動は「プロの犯罪者」に近い。一方で、無関係な市民を殺害したり、倒れた相手へ必要以上に攻撃を加えたり、無意味な暴力を繰り返したりすると犯罪プロファイルに影響する。

TGGによれば、このプロファイルはRDR2の名誉ゲージのように常時HUDへ表示されるものではなく、ジェイソンとルシアそれぞれのステータスとしてメニューから確認する仕組みになっているという。

日本のファミ通がRockstar NorthでRob Nelson氏に行った独占インタビューでも、このシステムの存在について説明されている。Nelson氏によれば、GTAシリーズで初めてプレイヤーの一部の行動を追跡するシステムを導入しており、RDR2の名誉システムと共通する部分を持ちながらも、GTAで「善人として振る舞う」ことを求めるものではないという。

つまり犯罪プロファイルそのものは単なるクリエイター発の噂ではなく、Rockstar開発者からも説明されているシステムだ。

さらにTGGの証言では、犯罪プロファイルを極端に悪化させるとアイコンが壊れ、そのプレイでは元の状態へ戻せなくなる可能性があるという。この部分については細かな条件などがまだ分かっていないため、今後さらに確認する必要がある。

手配システムや車両盗難など、犯罪プロファイル以外のシステム面については「[Extended Lookだけでは分からないGTA6の新情報まとめ](/news/50)」で整理している。

---

## Davy JonesがRob Nelsonに聞いた「一人称視点」

Davy Jonesからは、GTA Vプレイヤーにとってかなり気になる情報が出ている。それが『GTA VI』の一人称視点だ。

![Rockstar Northのロゴが掲げられた部屋で、テーブルにGTA6のスクリーンショットを並べながら身振りを交えて話すRob Nelson氏と、それを聞く取材者](/images/news/gta6-rockstar-north-creators/rob-nelson-rockstar-north.webp)

*画像: 内容を分かりやすく伝えるためのAI生成イメージ画像。実際のGTA6のゲーム画面・公式素材ではない。*

Davy JonesがRockstar NorthでRob Nelson氏へ直接質問した内容として伝えられているところによると、『GTA VI』は三人称視点を中心として設計されており、GTA VのPS4／Xbox One以降のバージョンに搭載されたような、ゲーム全体を一人称でプレイできる専用モードは発売時には用意されないという。

ただし、これは「一人称表示がゲームから完全になくなる」という意味ではない。特定の武器で照準を覗く場合など、一部のゲームプレイでは一人称表示が使用される。

GTA Vでは後から一人称モードが追加されたが、『GTA VI』ではジェイソンやルシアの身体、アニメーション、周囲とのインタラクションなども含めて三人称視点での体験を重視している可能性がある。将来的なアップデートなどで完全な一人称モードが追加されるかについては、現時点では分からない。

---

## PS5 Proでも60fpsとは限らない？

Davy JonesとRob Nelson氏のやり取りからは、もうひとつ注目されている話がある。『GTA VI』のフレームレートだ。

現在のコンソール向け開発ビルドについて、Rob Nelson氏から30fpsで動作しているという説明があったとDavy Jonesは伝えている。現時点では60fpsモードが確認されているわけではない。

ただし、ここはかなり慎重に見る必要がある。現在確認されている開発ビルドが30fpsで動いていることと、発売される製品版が30fps固定になることは同じではない。

『GTA VI』は現在も開発と最適化が続いており、Rockstar Gamesから最終的なパフォーマンスモードについて正式発表が行われたわけではない。そのためGTA6 FEEDでは、現時点では「現在確認されている開発ビルドは30fps」「製品版の最終仕様は未確定」として扱う。

この30fps報道をめぐる議論そのものは「[PS5 Proでも30fps？](/news/51)」でCPUボトルネックの観点も含めて検証している。

---

## El Rubiusが驚いた「LeonidaのNPC」

El Rubiusの証言から見えてくるのは、ゲームシステムそのものというより、RockstarがLeonidaという世界をどこまで細かく作り込んでいるのかという部分だ。

先行プレビューでは街を移動するNPCについて、かなり細かな表現を見ることができたという。とくに海外で話題になったのが、街中に裸体の男性NPCが登場したというEl Rubiusの証言だ。単に裸体のキャラクターモデルが用意されているだけではなく、身体の細かな部分までアニメーションしていたと語られている。

Rockstarらしいジョークのようにも聞こえるが、ここで注目したいのはNPCそのものの作り込みだ。『GTA VI』ではNPCの身体にも、過去作以上のバリエーションが与えられている可能性がある。

![Vice Cityのビーチを埋め尽くす人々。ライフガードタワーの周りを歩く人、砂浜に寝そべる人、その奥に高層ビル群が並ぶ公式スクリーンショット](/images/news/gta6-official/vice-city-05.webp)

これは日本のファミ通によるRob Nelson氏へのインタビューともつながる。Nelson氏によれば、『GTA VI』では歩行者の多様性にも力を入れており、今回は身長や体格の違いまで本格的に考慮しているという。過去作では身長のバリエーションが非常に限られていたのに対し、今回はキャラクターの身長や体型がかなり豊富になっている。

Extended Lookに登場した大量のNPCが単純に「人数が多い」だけではなく、それぞれ違う人間として見える背景には、こうした技術的な作り込みもありそうだ。

---

## 「現金を持ち歩く」ことにも意味がある

クリエイターの証言と合わせて確認しておきたいのが、Rockstar Northで行われたメディア向け説明だ。ファミ通のRob Nelson氏への独占インタビューでは、『GTA VI』には手持ちの現金とは別に銀行口座が存在することも明らかになっている。

しかも現金を大量に持ち歩くことにはリスクがある。「Wasted」や「Busted」になった場合や、警察・市民によって倒された場合などに持っている現金を失う可能性があるため、安全な場所へ預けることが重要になるという。

一見すると小さな変更だが、犯罪プロファイルなど今回明らかになってきたシステムと組み合わせると、『GTA VI』が目指している犯罪体験の方向性が見えてくる。強盗で現金を手に入れて終わりではなく、その場から逃走して警察を振り切り、手に入れた金を失わず安全な状態にするところまでが犯罪ゲームプレイの一連の流れとして強く意識されている可能性がある。

---

## ジェイソンとルシアの関係もプレイヤー次第

今回のRockstar North取材では、ジェイソンとルシアの関係についても興味深い情報が出ている。

![GTA VIの公式キーアート。クラシックカーのボンネットへ腰かけたルシアと、その隣に立つジェイソン](/images/news/gta6-official/jason-and-lucia-key-art-01.webp)

ふたりは単純に「最初から最後まで固定された恋人同士」として描かれるわけではないようだ。ファミ通の取材では、プレイヤーの行動によってふたりの関係性にも変化が生まれ、恋人として進む場合もあれば、犯罪をともに行うパートナーのような関係になる可能性も示されている。

犯罪プロファイルと同様、プレイヤーがゲームの中でどのように行動するのかが、ゲーム世界だけではなくキャラクター同士の関係にも影響していく。『GTA VI』では従来以上にプレイヤーの選択や行動をゲーム側が記録し、それを別のシステムへ反映する設計が取り入れられているのかもしれない。

---

## なぜRockstarは海外クリエイターを招待したのか

今回の動きそのものも興味深い。Rockstar Gamesといえば発売前の情報管理が非常に厳しい会社として知られているが、今回は従来のゲームメディアだけではなく、TGG、El Rubius、Davy Jones、Mike ShowShaといった各国のクリエイターをRockstar Northへ招待した。

しかも招待された人物は英語圏だけに偏っていない。オーストラリア、スペイン、ブラジル、イタリアと、それぞれ異なる言語圏でGTAやゲームコンテンツを発信してきた人物が選ばれている。

さらに彼らがRockstar Northを訪問していた事実は、Extended Look公開が近づくまで伏せられていた。これは『GTA VI』のマーケティングが、Rockstar自身が映像やスクリーンショットを公開するだけの段階から、実際にゲームを見た第三者がその体験を世界へ伝える段階へ移り始めたことを示す動きとも考えられる。

とくにGTAを何年も追い続けてきたクリエイターの場合、一般的なメディアとは質問するポイントも違う。Davy Jonesが一人称視点についてRob Nelson氏へ直接尋ねたように、シリーズを遊んできたユーザーだからこそ気になる部分から、新しい情報が出てくる可能性もある。

---

## 「公式情報」と「クリエイターの証言」は分けて考えたい

今回の情報を見るうえで注意しておきたいのは、TGGたちはRockstar Northへ正式に招待され、実際の『GTA VI』を見ている一方、自分たちで自由にゲームをプレイしたわけではないということだ。今回行われたのは、Rockstar側がゲームを操作するハンズオフプレビューだった。

そのためGTA6 FEEDでは、今後も情報の出どころを明確に分けて扱う。

【**確認された情報**】

Rockstar Gamesの公式発表、Extended Lookで実際に確認できる内容、Rob Nelson氏をはじめとするRockstar開発者が明言した内容。

【**クリエイターの証言**】

TGG、El Rubius、Davy Jones、Mike ShowShaなど、Rockstar Northで実際にゲームを見た人物が自身の動画、配信、SNSなどで説明した内容。

【**推測・未確認情報**】

クリエイターの感想からコミュニティが推測している仕様、リーク情報、その他の未確認情報。

Rockstar Northへ実際に招待された人物の発言は通常の噂よりはるかに重要だが、それでも本人の記憶や表現を介した情報である以上、Rockstarが正式に発表した仕様とは分けて考える必要がある。

---

## Extended Lookが終わっても、情報公開は終わっていない

8月27日のExtended Lookは巨大な情報公開だった。しかし、Rockstar Northに招待されたクリエイターたちの証言を追っていくと、公式映像の外側にもまだ大量の情報が存在することが分かってきた。

TGGが見た約3時間のゲームプレイ、El Rubiusが目撃したLeonidaのNPC、Davy JonesがRob Nelson氏へ直接聞いたゲーム仕様、そしてMike ShowShaが持ち帰った情報。さらに、今後新たにRockstar Northへの招待を公表する人物が現れる可能性もある。

クリエイターたちは一度にすべてを話すとは限らない。後日の動画やライブ配信、SNSで追加のエピソードが語られたり、視聴者からの質問をきっかけにRockstar Northで聞いた話が新たに出てきたりする可能性もある。

GTA6 FEEDでは今後も、TGG、El Rubius、Davy Jones、Mike ShowShaを中心に、Rockstar Northへ招待された海外クリエイターの動画、SNS、インタビューを継続的に確認していく。また、新しい参加者が判明した場合はその人物も追跡対象へ追加し、新しい証言やゲーム情報が確認できればこの記事を更新する。

Extended Lookに映っていたものだけが、現在分かっている『GTA VI』のすべてではない。

**Rockstar Northで発売前の『GTA VI』を実際に見た人たちは、ほかに何を知っているのか。発売まで、その証言をここに集めていく。**

---

## 更新履歴

**2026年8月29日：初版公開**

Rockstar North招待クリエイターとしてTGG、El Rubius、Davy Jones、Mike ShowShaを掲載。犯罪プロファイル、一人称視点、現在の開発ビルドにおけるフレームレート、NPC表現、現金と銀行口座、ジェイソンとルシアの関係性など、現在までに確認できている情報をまとめた。

**※今後、新しいクリエイターの参加や新たな証言が確認できた場合、随時更新します。**

---

> **注記：** 本記事に掲載したクリエイターの発言は、Rockstar Northで行われたハンズオフ形式の先行プレビューに参加した各人が自身の動画・配信・SNSで公開した内容にもとづくもので、Rockstar GamesがNewswire等で正式発表した仕様ではない。Rob Nelson氏の発言はファミ通による独占インタビューほかの報道にもとづく。日本語部分は編集部訳・要約を含む。アイキャッチ・NPC・キーアートの画像はRockstar Games提供の公式素材。Rob Nelson氏の取材風景の画像はAIで生成したイメージ画像、犯罪プロファイルの図版は本記事の内容を整理するために編集部が作成したもので、この2点は実際のゲーム画面・公式UIではない。`,
    titleEn:
      "Every Creator Rockstar Invited to Rockstar North — What TGG, El Rubius and Davy Jones Saw of GTA VI Before Launch",
    displayTitleEn:
      "Every Creator Rockstar Invited to Rockstar North\nWhat TGG, El Rubius and Davy Jones Saw of GTA VI Before Launch",
    descriptionEn:
      "In July 2026 Rockstar Games flew a handful of creators to Rockstar North in Edinburgh. TGG, El Rubius, Davy Jones and Mike ShowSha watched gameplay that never made it into \"An Extended Look\" and were briefed directly by Rob Nelson. Criminal profiles, first-person view, frame rate, NPC variety — their accounts, collected in one place and updated as new ones appear.",
    aiSummaryEn: [
      "In July 2026 Rockstar Games invited creators from several countries to Rockstar North in Edinburgh for a hands-off preview of GTA VI. Four have gone public so far: TGG (Australia), El Rubius (Spain), Davy Jones (Brazil) and Mike ShowSha (Italy), all of whom watched extended gameplay that was not included in \"An Extended Look.\"",
      "TGG, who says he saw roughly three hours, described a \"Criminal Profile\" system that tracks the character of your actions rather than good versus evil. Davy Jones, from questions put directly to Rob Nelson, reports that no dedicated full first-person mode will ship at launch and that the current console build runs at 30fps. El Rubius spoke about how finely Leonida's NPCs are rendered.",
      "All of it came from a preview Rockstar itself controlled, so official announcements, creator testimony and inference from it need to stay separated. GTA6 FEED will keep checking the invited creators' videos, social posts and interviews, and will add new information to this article as it appears.",
    ],
    fullContentEn: `# Every Creator Rockstar Invited to Rockstar North — What TGG, El Rubius and Davy Jones Saw of GTA VI Before Launch

"Grand Theft Auto VI: An Extended Look," released on August 27, 2026, laid out at once what had only been visible in fragments: Jason and Lucia's story, the streets of Leonida, gunfights, police chases and activities.

But Extended Look was not the only thing worth watching in this wave of information. About a month earlier, Rockstar Games had invited a handful of creators from around the world to Rockstar North in Edinburgh, Scotland.

What happened there was a hands-off preview: Rockstar operated GTA VI while the invited creators watched. None of them freely held a controller, but they were given hours with gameplay not included in Extended Look, and some were able to put questions directly to Rob Nelson, Rockstar North's head of development and co-studio head, among others.

Which means the videos and social posts they have published contain information you cannot get from the official footage alone.

GTA6 FEED will keep monitoring the videos, social posts and interviews of the creators invited to Rockstar North, and will add new information to this article as it is published — including any further invited creators who come to light.

How the Rockstar North invitations came to light in the first place is covered in "[Rockstar Showed GTA6 to Overseas Creators Ahead of Launch](/en/news/47)."

**Note: this article is updated on an ongoing basis. New accounts published by the creators will be added here.**

---

## The Rockstar North Invitees Confirmed So Far

As of August 29, 2026, four major creators have publicly confirmed taking part in the GTA VI preview held at Rockstar North: TGG, El Rubius, Davy Jones and Mike ShowSha.

### TGG (The Gaming Gorilla) / Australia

A YouTuber who has covered the GTA series for years. After visiting Rockstar North, he released a video timed to Extended Look titled "I Saw 3 Hours of GTA 6 at Rockstar North - First Impressions," revealing that he watched roughly three hours of GTA VI gameplay.

His account carries the most detail of any creator testimony out so far, going into the criminal profile and other game systems that Extended Look alone did not explain.

### El Rubius / Spain

One of the largest creators in the Spanish-speaking world. He visited Rockstar North and is said to have watched the game for about two hours.

Although it was a hands-off format with Rockstar staff at the controls, there were reportedly moments where El Rubius could request specific actions — "try doing this." So rather than passively viewing a prepared reel, he was able to check the game world on the spot to some degree.

### Davy Jones / Brazil

A Brazilian gaming creator known for Gameplayrj and Flow Games. By his own account, he was the only Brazilian creator invited to Rockstar North this time.

What matters most in his information is that he had the chance to question Rob Nelson directly. Fairly specific details about pre-launch GTA VI — the first-person view, current performance — have come out of that.

### Mike ShowSha / Italy

An Italian gaming creator. He confirmed visiting Rockstar North in July 2026 and has been publishing content discussing GTA VI since Extended Look went live.

These four are the main invited creators confirmed at this point. That does not necessarily mean they are everyone Rockstar invited, and GTA6 FEED will keep watching for other creators or press who reveal a Rockstar North visit.

---

## The Three Hours of GTA VI TGG Saw

Of the creator information published so far, TGG's carries the most detail. He says he watched roughly three hours of GTA VI gameplay at Rockstar North, and systems Extended Look did not adequately explain have emerged from it.

One of them is the "Criminal Profile."

![A graphic explaining how the Criminal Profile works, listing actions that improve it — not killing more people than necessary, pulling off robberies efficiently, escaping quickly, behaving like a professional — against actions that damage it: killing uninvolved civilians, killing animals, excessive attacks on downed opponents and repeated pointless violence, beside separate profile readouts for Jason and Lucia](/images/news/gta6-rockstar-north-creators/criminal-profile-explainer.webp)

*This graphic was produced by the editorial team to organize the article's contents and is not actual in-game UI. Captions in the graphic are in Japanese.*

Plenty of people who watched Extended Look may have assumed it was something close to the honor system in *Red Dead Redemption 2*. Per what Rockstar explained, though, its character is a little different. Rather than simply rating the player as good or evil, it records what kind of criminal you are behaving as.

Rob a store, for instance, and killing no more people than necessary, achieving the goal and escaping quickly reads as closer to a "professional criminal." Conversely, killing uninvolved civilians, attacking downed opponents beyond what is necessary, or repeating pointless violence affects the criminal profile.

Per TGG, this profile is not permanently shown on the HUD the way RDR2's honor gauge was; it exists as a status for Jason and Lucia individually, checked from a menu.

Japanese outlet Famitsu's exclusive interview with Rob Nelson at Rockstar North also describes the system. Per Nelson, the series is tracking some player behavior for the first time, and while it shares ground with RDR2's honor system, it does not ask players to behave as good people in GTA.

So the criminal profile is not merely a rumor originating with a creator — it is a system Rockstar's developers have described too.

TGG further says that degrading the criminal profile to an extreme breaks the icon, and that the original state may be unrecoverable for that playthrough. The precise conditions there are still unknown, so this needs further confirmation.

For systems beyond the criminal profile — the wanted system, vehicle theft and more — see "[Everything Extended Look Did Not Tell You About GTA6](/en/news/50)."

---

## What Davy Jones Asked Rob Nelson About First-Person View

Davy Jones surfaced something GTA V players in particular will want to know about: GTA VI's first-person view.

![Rob Nelson gesturing as he speaks in a room under a Rockstar North sign, GTA6 screenshots laid out on the table in front of him, with an interviewer listening](/images/news/gta6-rockstar-north-creators/rob-nelson-rockstar-north.webp)

*Image: an AI-generated illustration made to help convey the story. It is not GTA6 footage or official Rockstar material.*

According to what has been relayed of Davy Jones's direct question to Rob Nelson at Rockstar North, GTA VI is designed around a third-person camera, and a dedicated mode letting you play the entire game in first person — as in GTA V's PS4/Xbox One and later versions — will not be available at launch.

That does not mean first-person display disappears from the game entirely. Parts of gameplay, such as aiming down sights with certain weapons, do use it.

GTA V had its first-person mode added after the fact; GTA VI may be prioritizing the third-person experience, including Jason and Lucia's bodies, their animation and how they interact with their surroundings. Whether a full first-person mode might arrive in a later update is unknown at this point.

---

## 60fps Is Not Guaranteed, Even on PS5 Pro

The exchange between Davy Jones and Rob Nelson produced one more talking point: GTA VI's frame rate.

Davy Jones reports that Rob Nelson described the current console development build as running at 30fps. No 60fps mode has been confirmed as of now.

This needs to be read carefully, though. The current development build running at 30fps and the shipping game being locked to 30fps are not the same statement.

GTA VI is still in development and optimization, and Rockstar Games has made no formal announcement about final performance modes. So for now GTA6 FEED treats this as "the currently confirmed development build is 30fps" and "the shipping specification is undetermined."

The debate around that 30fps report, including the CPU-bottleneck angle, is examined in "[30fps Even on PS5 Pro?](/en/news/51)."

---

## The Leonida NPCs That Surprised El Rubius

What comes through in El Rubius's account is less about game systems than about how finely Rockstar has built out the world of Leonida.

The preview reportedly showed remarkably detailed work in the NPCs moving through the city. The account that drew the most attention abroad was El Rubius's description of a nude male NPC on the street — not merely a nude character model placed in the world, but one animated down to fine details of the body.

It sounds like exactly the sort of joke Rockstar is known for, but what is worth noting here is the craft in the NPCs themselves. GTA VI may be giving NPC bodies more variation than any previous entry.

![Official screenshot of a Vice City beach packed with people — some walking past a lifeguard tower, others lying on the sand, with high-rises beyond](/images/news/gta6-official/vice-city-05.webp)

This connects to Famitsu's interview with Rob Nelson. Per Nelson, GTA VI puts real effort into pedestrian diversity, and this time seriously accounts for differences in height and build. Where previous entries had very limited height variation, character heights and body types are now considerably varied.

Technical work like that is likely part of why the crowds of NPCs in Extended Look read not simply as "a lot of people" but as individually distinct human beings.

---

## Carrying Cash Around Now Means Something

Alongside the creators' accounts, the press briefings held at Rockstar North are worth noting. Famitsu's exclusive interview with Rob Nelson also revealed that GTA VI has a bank account separate from the cash you carry.

And carrying large amounts of cash carries risk. If you go "Wasted" or "Busted," or are taken down by police or civilians, you may lose the cash on hand — which makes depositing it somewhere safe important.

It looks like a small change at first glance, but combined with the criminal profile and the other systems now coming to light, it points to the direction GTA VI is taking with criminal play. Getting the cash from a robbery may not be the end of it: escaping the scene, losing the police, and getting the money somewhere safe without losing it may all be strongly designed as one continuous arc of criminal gameplay.

---

## Jason and Lucia's Relationship Is Up to the Player Too

The Rockstar North coverage also produced interesting information about Jason and Lucia's relationship.

![Official GTA VI key art: Lucia sitting on the hood of a classic car with Jason standing beside her](/images/news/gta6-official/jason-and-lucia-key-art-01.webp)

The two do not appear to be depicted simply as a couple fixed in place from beginning to end. Famitsu's reporting indicates that player behavior produces change in their relationship as well: it may progress romantically, or become something closer to partners committing crimes together.

As with the criminal profile, how the player behaves inside the game affects not only the game world but the relationships between characters. GTA VI may be adopting a design that records player choices and actions more than before, and feeds them into other systems.

---

## Why Did Rockstar Invite Overseas Creators?

The move itself is interesting. Rockstar Games is known as a company with exceptionally tight control over pre-launch information, yet this time it invited not only traditional games media but creators from several countries — TGG, El Rubius, Davy Jones, Mike ShowSha — to Rockstar North.

And the people invited were not weighted toward the English-speaking world. Australia, Spain, Brazil, Italy — people who have covered GTA and gaming content across different language communities were chosen.

The fact of their Rockstar North visits was also kept quiet until Extended Look's release drew near. You could read this as GTA VI's marketing beginning to move from a stage where Rockstar simply publishes footage and screenshots to one where third parties who actually saw the game carry that experience to the world.

Creators who have followed GTA for years in particular ask about different things than general media do. Just as Davy Jones asked Rob Nelson directly about the first-person view, new information may keep surfacing from exactly the places that matter to people who have played the series.

---

## Keep "Official Information" and "Creator Testimony" Separate

The thing to keep in mind with all of this is that while TGG and the others were formally invited to Rockstar North and did see the actual GTA VI, they did not freely play it themselves. What took place was a hands-off preview with Rockstar at the controls.

So GTA6 FEED will continue to keep the provenance of information clearly separated.

【**Confirmed information**】

Official Rockstar Games announcements, what can actually be seen in Extended Look, and what Rockstar developers including Rob Nelson stated explicitly.

【**Creator testimony**】

What people who actually watched the game at Rockstar North — TGG, El Rubius, Davy Jones, Mike ShowSha and others — described in their own videos, streams and social posts.

【**Inference and unconfirmed information**】

Specifications the community is inferring from creators' impressions, leaks, and other unconfirmed material.

Statements from people actually invited to Rockstar North carry far more weight than ordinary rumor, but since the information still passes through their memory and phrasing, it needs to be kept separate from specifications Rockstar has formally announced.

---

## Extended Look Is Over. The Disclosure Is Not.

The August 27 Extended Look was an enormous release of information. But following the accounts of the creators invited to Rockstar North makes clear that a great deal more exists outside the official footage.

The three hours of gameplay TGG watched, the Leonida NPCs El Rubius witnessed, the specifications Davy Jones asked Rob Nelson about directly, and what Mike ShowSha brought back — plus the possibility that more people will reveal a Rockstar North invitation.

Creators do not necessarily say everything at once. Additional episodes may come out in later videos, live streams or social posts, or a viewer's question may prompt something new from what they heard at Rockstar North.

GTA6 FEED will keep checking the videos, social posts and interviews of the overseas creators invited to Rockstar North, centered on TGG, El Rubius, Davy Jones and Mike ShowSha. New participants will be added to that list as they come to light, and this article will be updated whenever new testimony or game information is confirmed.

What appeared in Extended Look is not all that is currently known about GTA VI.

**What else do the people who saw pre-launch GTA VI at Rockstar North know? Between now and launch, their accounts will be collected here.**

---

## Update Log

**August 29, 2026: first published**

Published with TGG, El Rubius, Davy Jones and Mike ShowSha as the Rockstar North invitees, covering what has been confirmed so far: the criminal profile, first-person view, the frame rate of the current development build, NPC rendering, cash and bank accounts, and the Jason–Lucia relationship.

**This article will be updated as new creators or new accounts are confirmed.**

---

> **Note:** The creator statements collected here come from what each participant in the hands-off preview at Rockstar North published on their own videos, streams and social accounts; they are not specifications formally announced by Rockstar Games via Newswire or elsewhere. Rob Nelson's remarks are based on Famitsu's exclusive interview and other reporting. Japanese-language passages are summarized or paraphrased by the editorial team. The eyecatch, the NPC crowd shot and the key art are official Rockstar Games material. The image of the Rob Nelson interview is an AI-generated illustration, and the criminal profile graphic was produced by the editorial team to organize this article's contents and carries Japanese captions; neither of those two is GTA6 footage nor official UI.`,
  },
  {
    id: 52,
    title:
      "GTA6のマップはGTA5の約2倍――Vice CityだけでLos Santosの2倍、Rockstar Northで明かされた「Leonida」の巨大さ",
    displayTitle:
      "GTA6のマップはGTA5の約2倍\nVice CityだけでLos Santosの2倍、Rockstar Northで明かされた「Leonida」の巨大さ",
    description:
      "Rockstar Northを訪問したクリエイターTGGが、GTA6のワールド全体はGTA5のおよそ2倍、Red Dead Redemption 2のおよそ3倍という説明を受けたと伝えた。Vice City単体でもLos Santosの約2倍、アクセス可能な建物は数百規模。ファンが長年作り続けてきた予想マップとの違いも含めて整理する。",
    icon: "🗺️",
    image: "/images/news/gta6-official/mount-kalaga-04.webp",
    category: "topic",
    date: "2026-08-29",
    publishedAt: "2026-08-29 13:00",
    source: "TGG（Rockstar North先行プレビュー）ほか報道",
    sourceUrl: "https://x.com/TGGonYT/status/2092582849111113810",
    relatedArticles: [50, 51, 49],
    aiSummary: [
      "Rockstar Northに招待された海外GTAクリエイターのTGGが、開発責任者Rob Nelsonらから説明を受けながら約3時間GTA6を見たと報告し、マップ規模についても具体的な比較値を伝えた。GTA6のワールド全体はGTA5のおよそ2倍、Red Dead Redemption 2のおよそ3倍になるという。",
      "さらにVice City単体でもLos Santosのおよそ2倍、Vice Cityと周辺エリアを含めるとLos Santosとその周辺のおよそ11倍という数字も伝えられている。アクセス可能なインテリアは数百規模に達するとされ、マップ面積だけでなくプレイヤーが実際に利用できる空間も大幅に増える可能性がある。",
      "ただしこれらはRockstarがNewswireで正式発表した面積データではなく、先行プレビューを通じてクリエイターが伝えた情報だ。正確な平方キロメートル数も完全な公式マップも未公開のため、「2倍」「11倍」から地図面積を逆算することはできない。ファンが作ってきた予想マップも引き続き非公式情報として扱う必要がある。",
    ],
    fullContent: `# GTA6のマップはGTA5の約2倍――Vice CityだけでLos Santosの2倍、Rockstar Northで明かされた「Leonida」の巨大さ

「GTA6のマップはどれくらい広いのか」。これは『Grand Theft Auto VI』が正式発表される以前から、ファンの間で繰り返し議論されてきたテーマのひとつだ。

海外ではトレーラーに映った道路標識や建物、海岸線、高速道路などを手掛かりにLeonidaの地形を推測するマッピングプロジェクトが進められ、さまざまな「GTA6予想マップ」が作られてきた。しかし、そこには常にひとつの大きな問題があった。Rockstar Games自身が、GTA6のマップがどれほど大きいのかを具体的な数字で説明してこなかったことだ。

その状況が、「Grand Theft Auto VI: An Extended Look」の公開に合わせて大きく変わった。

Rockstar Northに招待された海外GTAクリエイターのTGGは、開発責任者Rob Nelsonらから説明を受けながら約3時間にわたってGTA6を見たと報告。その中でマップの規模についても質問し、GTA6のワールド全体はGTA5のおよそ2倍、Red Dead Redemption 2のおよそ3倍になるとの説明を受けたという。

さらにTGGからは、Vice City単体でもLos Santosのおよそ2倍になるという、かなりインパクトのある情報も伝えられている。

ただし、これらはRockstar公式サイトで発表された面積データではない。Rockstar Northで行われた先行プレビューを通じてTGGが伝えた情報であるため、本記事でも「公式発表済みのスペック」と「クリエイターを通じて伝えられた情報」を区別しながら見ていく。

---

## GTA6のマップは「GTA5の約2倍」

TGGによれば、Rockstar Northで「An Extended Look」を事前に視聴したほか、Rob Nelsonによる約2時間半の追加ゲームプレイを見る機会があり、その中でLeonidaの規模についても説明を受けたという。

そこで示された比較では、GTA6全体がおよそGTA5の2倍、RDR2の3倍。さらに都市単体で比較すると、Vice CityはLos Santosのおよそ2倍になるとされている。

![GTA6のマップはGTA5の約2倍と示した図。GTA6全体はGTA5の約2倍・RDR2の約3倍、Vice CityはLos Santosの約2倍、Vice City＋周辺郊外はLos Santos＋周辺の約11倍という比較表と、Vice City・Grassrivers・Leonida Keys・Port Gellhorn・Ambrosia・Mount Kalagaを書き込んだLeonidaの地図](/images/news/gta6-map-size-comparison/scale-comparison-chart.webp)

*図版は本記事の内容を整理するために編集部が作成したもので、数値はTGGがRockstar Northで説明を受けたとして公開した内容にもとづく。地図の形状はイメージであり、Rockstarの公式マップではない。*

| 比較 | 先行プレビューで伝えられた規模 |
| --- | --- |
| GTA6全体 vs GTA5全体 | 約2倍 |
| GTA6全体 vs RDR2 | 約3倍 |
| Vice City vs Los Santos | 約2倍 |
| Vice City＋周辺 vs Los Santos＋周辺 | 約11倍との説明 |
| アクセス可能な建物 | 数百規模との情報 |
| 正確な面積 | 未公表 |

ここで注意したいのは、「GTA5の2倍」という数字だけを見て、GTA5のマップをそのまま縦横に拡大したような世界を想像するのは少し違うということだ。

GTA6の舞台となるLeonidaには巨大都市Vice Cityだけでなく、湿地帯や島々、地方都市、工業地帯、山岳地域など、性格の異なる複数のエリアが存在する。今回示された数字は、それらを含めた世界全体の規模を表している。

---

## Vice CityだけでもLos Santosの約2倍

GTA5をプレイしたことがある人にとっては、ゲーム全体の「2倍」より、こちらの比較の方がイメージしやすいかもしれない。

GTA5のLos Santosは、ダウンタウン、高級住宅街、ビーチ、空港、港湾地域、郊外などを抱える巨大都市だった。GTA Onlineを長く遊んでいるプレイヤーであれば、十年以上走り回ってきた馴染み深い街でもある。

今回の情報では、Vice CityだけでそのLos Santosのおよそ2倍になるという。

![「Vice CityだけでLos Santosの約2倍」と題した図。夕暮れのVice Cityを空から見た風景で、湾を渡る高速道路と高層ビル群、上空を飛ぶヘリコプターが写っている](/images/news/gta6-map-size-comparison/vice-city-scale.webp)

さらにTGGから伝えられた情報には、Vice Cityとその周辺エリアを含めた規模について、Los Santosとその周辺部のおよそ11倍という数字も登場している。

ただし、この「11倍」は特に慎重に扱う必要がある。Rockstarは比較対象となる「周辺エリア」の境界や計測方法、平方キロメートル単位の面積を公表していない。そのため、「Vice Cityの市街地面積がLos Santosの11倍」という意味で受け取るのは適切ではない。

現時点で重要なのは正確な平方キロメートル数よりも、Vice Cityとその周辺を含む都市圏がGTA5より大幅に拡張されているという点だろう。

---

## これまでの「GTA6マップ」は、ほとんどがファンの推測だった

今回の情報が注目される理由は、単純に「2倍」という数字が大きいからだけではない。

GTA6では公式マップが公開されるはるか前から、世界中のファンがLeonidaの地図を作り続けてきた。トレーラーに一瞬映った道路標識や建物、遠くに見える高層ビル、高速道路、海岸線などを照合し、それぞれの場所がどこに位置するのかを推測する大規模なマッピング活動が行われている。

![GTA5（左）とGTA6（右）のマップを並べた、ファン制作の比較画像。GTA6側にはVice PointやPort Gellhornなど推測による地名が書き込まれている](/images/news/GAT25qlaMAAXcS5.webp)

*画像はコミュニティで出回っているファン制作の比較図であり、Rockstarが公開した公式マップではない。地名・地形・面積比のいずれも確定した情報ではない。*

特にGTAシリーズの場合、現実の都市や地域をモデルに架空の世界が作られるため、現実のフロリダ州南部との比較も重要な手掛かりになってきた。

こうして作られた予想マップは非常に精密になっているものの、当然ながらRockstarが公開した公式地図ではない。同様に、これまでネット上で見かけた「GTA6はGTA5の○倍」という数字についても、ファンによる座標分析や推測から算出されたものが少なくなかった。

今回大きく違うのは、Rockstar Northを実際に訪問したクリエイターが、開発側から説明を受けた内容として具体的な比較値を伝えていることだ。

もちろんRockstar自身がNewswireなどで正式発表した数字ではないため一定の留保は必要だが、これまでのコミュニティによる推測とは情報の性質が異なる。

---

## RDR2の「約3倍」もかなり大きな数字

GTA5との比較以上に、Rockstar作品を遊んできた人にとって衝撃的なのがRed Dead Redemption 2との比較かもしれない。

TGGが伝えた内容によれば、GTA6の世界はRDR2のおよそ3倍の規模になるという。

RDR2の世界は決して小さくない。雪に覆われた山岳地帯から森林、平原、湿地帯、町、Saint Denisのような都市まで、性格のまったく異なる地域が広大な土地の中につながっている。馬で移動することを前提としているため、ひとつの地域から別の地域へ向かうだけでも相応の時間が必要だった。

一方、GTA6では自動車やバイク、高速道路、ボートなど、RDR2より圧倒的に速い移動手段が存在する。高速で移動できるゲームでありながら、それでも世界の広さを感じさせるためには相応のスケールが必要になる。

その意味では、「RDR2の3倍」という数字は単なる面積比較以上に、RockstarがLeonidaをどのような世界として設計しているのかを考える手掛かりになる。

---

## Leonidaは「Vice Cityだけのマップ」ではない

GTA6という名前を聞いて、多くの人が最初に思い浮かべるのはVice Cityだろう。ネオン、高層ホテル、ビーチ、ナイトライフといった街のイメージは、これまで公開されたトレーラーやスクリーンショットでも前面に押し出されてきた。

しかし、GTA6の舞台であるLeonidaはVice Cityだけで構成されているわけではない。

![「Leonidaは多彩なエリアで構成される広大な世界」と題した図。Vice City（大都市・ビーチ）、Grassrivers（湿地帯）、Leonida Keys（島々・リゾート）、Port Gellhorn（港町・観光地）、Ambrosia（工業地帯・田園）、Mount Kalaga（山岳・自然）の6地域を縦に並べている](/images/news/gta6-map-size-comparison/leonida-regions.webp)

Rockstarがこれまでに紹介している地域には、Vice Cityのほか、広大な湿地帯Grassrivers、島々が連なるLeonida Keys、かつて栄えた海岸沿いの街Port Gellhorn、工業地域と田園地帯が混在するAmbrosia、そしてLeonida北部の自然が広がるMount Kalaga National Parkなどがある。

つまりGTA5でいう「Los Santos＋Blaine County」という構造が、GTA6ではさらに細かく分かれ、それぞれ異なる文化や景観を持った地域として作られていると考えられる。

Vice Cityの中心部で高級車を走らせていたプレイヤーが、高速道路を抜けて湿地帯へ向かい、そのまま島々へ移動する。あるいは都市を離れ、まったく違う景観の地方都市や自然地域まで足を延ばす。そうした環境の変化そのものが、Leonidaを探索する楽しさになりそうだ。

---

## 「広さ」だけではなく、数百規模とされる建物にも注目

オープンワールドゲームでは、マップが大きければ面白くなるとは限らない。何もない土地を増やせば数字上の面積はいくらでも大きくできるため、プレイヤーにとって重要なのは、むしろその広い世界に何が存在するのかだ。

そこで注目したいのが、今回の先行プレビューから伝えられているアクセス可能なインテリアが数百規模に達するという情報だ。

GTA5では街そのものは巨大だったものの、自由に入れる建物は限られていた。外から見ると店舗やホテル、マンションが無数に並んでいても、その多くは背景として存在する建物だった。

GTA6で数百規模の建物にアクセスできるのであれば、単純なマップ面積だけでなく、プレイヤーが実際に利用できる空間そのものが大幅に増える可能性がある。

「An Extended Look」でも、街を移動するだけではなく、さまざまな店や施設、レジャー、犯罪などを通してLeonidaと関わる様子が描かれている。巨大なマップと大量のインテリアが組み合わされるのであれば、GTA6の進化は「遠くまで行けるようになった」ことより、どこへ行っても何かを見つけられる世界になったことに表れるのかもしれない。

---

## GTA6は「広さ」と「密度」を両立できるのか

ここが、今回のマップ情報で最も気になる部分だ。

GTA5が発売された2013年から13年が経ち、その間にオープンワールドゲームの規模は大きく拡大した。現在では、GTA5より広いマップを持つゲームそのものは珍しくない。そのため、2026年のRockstarが単純な面積競争だけを狙っているとは考えにくい。

今回の情報で本当に注目したいのは、GTA5の約2倍とされる世界の中に巨大なVice Cityがあり、その外側に性格の異なる複数の地域が広がり、さらに数百規模とされるアクセス可能な建物まで存在するという組み合わせだ。

単に土地が広くなるだけではなく、建物へ入り、店や施設に立ち寄り、車を盗み、犯罪を起こして警察から逃げ、そのまま都市を離れて別の地域へ向かう。さらに海や湿地帯へ出れば、都市部とはまったく違った遊びが始まる。こうした異なる体験がロード画面で切り離されるのではなく、一つの巨大なLeonidaの中で連続して起こることに意味がある。

こうした犯罪や警察まわりのシステムがどう作り直されているかは「[Extended Lookだけでは分からないGTA6新情報まとめ](/news/50)」で整理している。

![「警察システムも進化」と題した図。ネオン街をパトカーとヘリコプターが追跡する場面の下に、顔を認識・服装を記録・使用している車・同行者の有無というアイコンと、最大6つ星の手配度が並んでいる](/images/news/gta6-map-size-comparison/police-system-evolved.webp)

もし先行プレビューで伝えられた規模と密度が実際のゲームでも両立しているのであれば、Rockstarが目指しているのは単なる「シリーズ最大のマップ」ではないのだろう。Leonidaというひとつの州を、プレイヤーが長時間そこで過ごしたくなる世界として成立させようとしている可能性がある。

---

## ファンが作ってきた予想マップは、どこまで当たっているのか

今回具体的な規模が伝えられたことで、もうひとつ気になってくるのが、これまで世界中のファンが作ってきた予想マップの精度だ。

現時点でもRockstarはLeonida全体を俯瞰できる完全な公式マップを公開していない。そのため、Vice Cityが正確にどこまで広がっているのか、Leonida Keysの先にどこまで行けるのか、北側のMount Kalaga周辺がどれほどの規模なのかといった部分には、まだ多くの謎が残っている。

だからこそ、公式マップが公開されたときには面白い「答え合わせ」が待っている。

何年にもわたってコミュニティが映像の断片から組み立ててきたLeonidaと、Rockstarが実際に作ったLeonidaはどれほど一致しているのか。道路一本、建物ひとつまで驚くほど正確に特定されていた場所もあれば、地図全体の形そのものが予想を裏切る場所もあるかもしれない。

GTA6のマップをめぐる考察は、今回の「GTA5の約2倍」という情報で終わったわけではない。むしろ、ようやく比較するための具体的な材料がひとつ増えた段階だ。

---

## 現時点で分かっているGTA6マップ情報まとめ

今回のRockstar North先行プレビューを通じて伝えられている情報を整理すると、GTA6全体はGTA5のおよそ2倍、RDR2のおよそ3倍。Vice City単体ではLos Santosのおよそ2倍とされ、Vice Cityと周辺エリアについてはLos Santosとその周辺のおよそ11倍という比較も伝えられている。

一方で、正確な平方キロメートル数や完全な公式マップは依然として公開されていない。「2倍」「3倍」「11倍」という数字だけを使って正確な地図面積を逆算することはできず、コミュニティで作られている予想マップについても引き続き非公式情報として見る必要がある。

また、今回の数字はRockstar公式サイトに掲載されたマップ仕様ではなく、TGGがRockstar NorthでRob Nelsonらから説明を受けた内容として公開したものだ。この点は、今後この数字が広く拡散されるほど重要になってくるだろう。

それでも、GTA6のマップについて長年続いてきた「いったいどれほど大きいのか」という疑問に、これまでより具体的な答えが見えてきたことは間違いない。

GTA5の約2倍という巨大な世界に、Vice City、湿地帯、島々、地方都市、工業地域、山岳地帯が広がり、さらに数百規模とされるアクセス可能な建物が存在する。そのすべてが十分な密度を保ったまま一つにつながっているのであれば、GTA6で本当に驚くことになるのは、マップを初めて見た瞬間ではないのかもしれない。

発売後、何十時間遊んでも「まだ行ったことのない場所」が残っている。

Leonidaの本当の巨大さを実感するのは、そんな瞬間なのかもしれない。

---

> **注記：** 本記事のマップ規模に関する数値は、Rockstar Northの先行プレビューに参加したTGGが公開した内容にもとづくもので、Rockstar GamesがNewswire等で正式発表した面積データではない。日本語部分は編集部訳・要約を含む。正確な平方キロメートル数および公式マップは本記事執筆時点で未公開であり、掲載したGTA5との比較画像はコミュニティで出回っているファン制作の非公式なものである。また、本文中の図版は本記事の内容を整理するために編集部が作成したもので、実際のGTA6のゲーム画面・公式マップではない。アイキャッチはRockstar Games提供の公式スクリーンショットである。`,
    titleEn:
      "GTA6's Map Is Roughly Twice GTA5's — Vice City Alone Doubles Los Santos, and the Scale of Leonida Revealed at Rockstar North",
    displayTitleEn:
      "GTA6's Map Is Roughly Twice GTA5's\nVice City Alone Doubles Los Santos, and the Scale of Leonida",
    descriptionEn:
      "TGG, who visited Rockstar North, reports being told that GTA6's world is roughly twice the size of GTA5's and about three times Red Dead Redemption 2's. Vice City alone is said to be about double Los Santos, with hundreds of accessible interiors. Here is how that squares with the fan-built maps the community has spent years assembling.",
    aiSummaryEn: [
      "GTA creator TGG, invited to Rockstar North, reports watching around three hours of GTA6 with explanations from development lead Rob Nelson and others, including specific figures on map scale: GTA6's world is roughly twice the size of GTA5's and about three times Red Dead Redemption 2's.",
      "Vice City alone is said to be roughly double Los Santos, and Vice City plus its surrounding area was described as about eleven times Los Santos and its surroundings. Accessible interiors reportedly number in the hundreds, meaning the usable space grows substantially, not just the raw area.",
      "These are not area figures Rockstar published on its Newswire — they came through a creator relaying a hands-off preview. No exact square-kilometer count and no complete official map exist yet, so you cannot back-calculate an area from \"2x\" or \"11x,\" and the community's speculative maps remain unofficial.",
    ],
    fullContentEn: `# GTA6's Map Is Roughly Twice GTA5's — Vice City Alone Doubles Los Santos, and the Scale of Leonida Revealed at Rockstar North

"How big is GTA6's map, actually?" This has been one of the most persistently debated questions among fans since before *Grand Theft Auto VI* was even formally announced.

Mapping projects abroad have pieced together Leonida's geography from road signs, buildings, coastlines and highways glimpsed in trailers, producing all sorts of "predicted GTA6 maps." But there was always one big problem: Rockstar Games itself had never explained how large GTA6's map is in concrete numbers.

That changed substantially alongside the release of "Grand Theft Auto VI: An Extended Look."

TGG, a GTA creator invited to Rockstar North, reports watching around three hours of GTA6 with explanations from development lead Rob Nelson and others. Map scale was among the things he asked about, and he says he was told GTA6's world overall is roughly twice the size of GTA5's, and about three times that of Red Dead Redemption 2.

TGG also relayed a genuinely striking figure: Vice City on its own is said to be about twice the size of Los Santos.

None of this, however, is area data published on Rockstar's official site. It is information TGG passed on from a hands-off preview held at Rockstar North, so this article keeps "officially announced specifications" and "information relayed through a creator" clearly separated throughout.

---

## GTA6's Map Is "About Twice GTA5's"

According to TGG, in addition to seeing "An Extended Look" early at Rockstar North, he had the chance to watch roughly two and a half hours of additional gameplay run by Rob Nelson, during which Leonida's scale was explained.

The comparisons given: GTA6 overall is roughly twice GTA5, and three times RDR2. Comparing cities alone, Vice City is around double Los Santos.

![A chart headlined "GTA6's map is about twice GTA5's," comparing GTA6 to GTA5 (~2x) and RDR2 (~3x), Vice City to Los Santos (~2x) and Vice City plus its outskirts to Los Santos plus its surroundings (~11x), beside a map of Leonida labeled with Vice City, Grassrivers, Leonida Keys, Port Gellhorn, Ambrosia and Mount Kalaga](/images/news/gta6-map-size-comparison/scale-comparison-chart.webp)

*This graphic was produced by the editorial team to organize the article's contents; the figures come from what TGG published as having been explained to him at Rockstar North. The map shape is illustrative and is not Rockstar's official map. Captions in the graphics are in Japanese.*

| Comparison | Scale relayed from the preview |
| --- | --- |
| GTA6 overall vs GTA5 overall | ~2x |
| GTA6 overall vs RDR2 | ~3x |
| Vice City vs Los Santos | ~2x |
| Vice City + surroundings vs Los Santos + surroundings | described as ~11x |
| Accessible buildings | reportedly in the hundreds |
| Exact area | not disclosed |

Worth noting: taking "twice GTA5" at face value and picturing GTA5's map simply scaled up in both directions would be somewhat off.

Leonida, GTA6's setting, contains not only the enormous Vice City but wetlands, island chains, regional towns, industrial zones and mountainous areas — multiple regions with distinct characters. The figures given describe the scale of that entire world.

---

## Vice City Alone Is About Twice Los Santos

For anyone who has played GTA5, this comparison may land harder than the "2x" for the whole game.

GTA5's Los Santos was a huge city holding a downtown, wealthy residential districts, beaches, an airport, port areas and suburbs. For anyone who has played GTA Online for years, it is a city they have been driving around for over a decade.

Per this information, Vice City alone is roughly twice that Los Santos.

![A graphic headlined "Vice City alone is about twice Los Santos," showing Vice City from the air at dusk with a causeway crossing the bay, high-rise towers and a helicopter overhead](/images/news/gta6-map-size-comparison/vice-city-scale.webp)

TGG also relayed a figure for Vice City including its surrounding area: about eleven times Los Santos and its surroundings.

That "11x" needs particular care, though. Rockstar has not published the boundaries of the "surrounding area" being compared, the measurement method, or any figure in square kilometers. Reading it as "Vice City's urban area is eleven times Los Santos" would not be appropriate.

What matters right now is less the exact square-kilometer count than the fact that the metropolitan area encompassing Vice City and its surroundings has been expanded substantially over GTA5.

---

## Until Now, "GTA6 Maps" Were Almost Entirely Fan Guesswork

This information draws attention not simply because "2x" is a big number.

Long before any official map existed, fans worldwide have been building maps of Leonida. Large-scale mapping efforts cross-reference road signs and buildings glimpsed for an instant in trailers, towers visible in the distance, highways and coastlines, to guess where each location sits.

![A fan-made comparison image placing GTA5's map (left) beside GTA6's (right), with speculative place names such as Vice Point and Port Gellhorn written across the GTA6 side](/images/news/GAT25qlaMAAXcS5.webp)

*This image is a fan-made comparison circulating in the community, not an official map released by Rockstar. None of the place names, terrain or area ratios in it are confirmed.*

With the GTA series in particular, fictional worlds are modeled on real cities and regions, so comparisons with real-world South Florida have been an important clue as well.

The resulting predicted maps have become remarkably precise — but they are, of course, not official maps published by Rockstar. Likewise, plenty of the "GTA6 is N times GTA5" figures floating around online were derived from fan coordinate analysis and inference.

What is substantially different this time is that a creator who actually visited Rockstar North is relaying specific comparison figures as something explained by the development side.

Rockstar itself has not announced these numbers on Newswire, so some reservation is warranted — but the nature of the information differs from the community's prior guesswork.

---

## "About 3x RDR2" Is a Large Number Too

For anyone who has played Rockstar's games, the comparison with Red Dead Redemption 2 may land even harder than the GTA5 one.

Per what TGG relayed, GTA6's world is roughly three times the scale of RDR2's.

RDR2's world is hardly small. Snow-covered mountains, forests, plains, wetlands, towns and a city like Saint Denis — regions of completely different character connected across a vast stretch of land. Because it assumes travel on horseback, simply getting from one region to another took real time.

GTA6, meanwhile, has cars, motorcycles, highways and boats — travel overwhelmingly faster than RDR2's. Making a world still feel vast in a game where you move that quickly requires a corresponding scale.

In that sense, "three times RDR2" is more than an area comparison; it is a clue about what kind of world Rockstar is designing Leonida to be.

---

## Leonida Is Not "a Vice City Map"

Say GTA6 and most people picture Vice City first. Neon, high-rise hotels, beaches, nightlife — that image of the city has been front and center in every trailer and screenshot released so far.

But Leonida, GTA6's setting, is not composed of Vice City alone.

![A graphic headlined "Leonida is a vast world made up of varied regions," showing six vertical panels: Vice City (metropolis and beach), Grassrivers (wetlands), Leonida Keys (islands and resorts), Port Gellhorn (port town and tourism), Ambrosia (industry and farmland) and Mount Kalaga (mountains and nature)](/images/news/gta6-map-size-comparison/leonida-regions.webp)

The regions Rockstar has introduced so far include, alongside Vice City, the vast wetlands of Grassrivers, the island chain of the Leonida Keys, the once-thriving coastal town of Port Gellhorn, Ambrosia with its mix of industrial and agricultural land, and Mount Kalaga National Park in northern Leonida.

In other words, the "Los Santos + Blaine County" structure of GTA5 appears to be subdivided much further in GTA6, into regions each built with its own culture and landscape.

A player driving a supercar through central Vice City takes the highway out to the wetlands, then continues on to the islands. Or leaves the city entirely for a regional town or a stretch of nature that looks nothing like it. That shift in environment looks like it will be a large part of the pleasure of exploring Leonida.

---

## Not Just Size — Watch the "Hundreds" of Buildings

In open-world games, a bigger map does not automatically mean a better one. Empty land can inflate the area figure indefinitely, so what matters to the player is what exists inside that space.

Which makes one detail from the preview worth attention: accessible interiors reportedly number in the hundreds.

GTA5's city was enormous, but the buildings you could freely enter were limited. From outside, stores, hotels and apartment blocks stretched everywhere — most of them existing as backdrop.

If GTA6 lets you access hundreds of buildings, then it is not only the map area that grows but the space the player can actually use.

"An Extended Look" too shows Jason and Lucia engaging with Leonida through stores, venues, leisure and crime rather than merely traveling through it. If a huge map is paired with a large volume of interiors, GTA6's leap may show less in "you can go farther" than in "wherever you go, there is something to find."

---

## Can GTA6 Deliver Both Size and Density?

This is the part of the map news that matters most.

Thirteen years have passed since GTA5 launched in 2013, and open-world scale has expanded enormously in that time. Games with maps larger than GTA5's are no longer unusual. It is hard to imagine Rockstar in 2026 chasing raw area alone.

What is worth watching in this information is the combination: an enormous Vice City inside a world roughly twice GTA5's, multiple distinct regions spreading out beyond it, and hundreds of accessible buildings on top of that.

Not just more land, but entering buildings, stopping into stores and venues, stealing a car, committing a crime and fleeing the police, then leaving the city for another region entirely. Head out to sea or into the wetlands and a completely different kind of play begins. What matters is that these different experiences are not separated by loading screens but occur continuously inside one enormous Leonida.

How the crime and police systems underpinning that have been rebuilt is covered in "[Everything Extended Look Did Not Tell You About GTA6](/en/news/50)."

![A graphic headlined "The police system has evolved too," showing a police pursuit through a neon street above icons for facial recognition, clothing recorded, vehicle used and whether you have company, alongside a six-star wanted meter](/images/news/gta6-map-size-comparison/police-system-evolved.webp)

If the scale and density relayed from the preview genuinely coexist in the shipping game, then what Rockstar is aiming for is not simply "the biggest map in the series." It may be making the single state of Leonida hold together as a world players want to spend a long time inside.

---

## How Close Did the Fan Maps Get?

Now that concrete scale figures have arrived, another question surfaces: how accurate are the predicted maps fans have been building?

Rockstar still has not released a complete official map showing all of Leonida from above. So plenty of mysteries remain — exactly how far Vice City extends, how far past the Leonida Keys you can go, how large the Mount Kalaga area to the north is.

Which is exactly why an interesting reckoning awaits when the official map does arrive.

How closely does the Leonida the community assembled from fragments of footage over years match the one Rockstar actually built? There may be places pinned down with startling precision, right down to a single road or building — and places where the shape of the map itself defies every prediction.

Speculation about GTA6's map did not end with this "roughly twice GTA5" figure. If anything, we have finally gained one concrete piece of material to compare against.

---

## What We Know About the GTA6 Map Right Now

Summarizing what has been relayed through the Rockstar North preview: GTA6 overall is roughly twice GTA5 and about three times RDR2. Vice City alone is said to be about double Los Santos, and Vice City with its surrounding area was compared at around eleven times Los Santos and its surroundings.

At the same time, no exact square-kilometer figure and no complete official map have been released. You cannot back-calculate a real map area from "2x," "3x" and "11x" alone, and the predicted maps circulating in the community still need to be treated as unofficial.

It also bears repeating that these figures are not map specifications posted on Rockstar's official site; they are what TGG published as having been explained to him by Rob Nelson and others at Rockstar North. That distinction only becomes more important the more widely the numbers spread.

Even so, there is no question that the long-running "just how big is it?" question about GTA6's map now has a more concrete answer than it did.

Inside a world roughly twice the size of GTA5's sit Vice City, wetlands, islands, regional towns, industrial areas and mountains — plus hundreds of accessible buildings. If all of it connects as one world while holding sufficient density, then the moment GTA6 truly surprises people may not be the first time they see the map.

Dozens of hours after launch, there are still places you have never been.

That may be the moment Leonida's real size lands.

---

> **Note:** The map scale figures in this article come from what TGG, a participant in the Rockstar North preview, published; they are not area data officially announced by Rockstar Games via Newswire or elsewhere. Japanese-language passages are summarized or paraphrased by the editorial team. No exact square-kilometer figure and no official map had been released as of writing, and the GTA5 comparison image shown here is an unofficial fan creation circulating in the community. The in-article graphics were produced by the editorial team to organize this article's contents and carry Japanese captions; they are not GTA6 footage or an official Rockstar map. The eyecatch is an official Rockstar Games screenshot.`,
  },
  {
    id: 51,
    title:
      "GTA6、PS5 Proでも30fps？Rockstar先行プレビューで判明した“現在の動作”と60fpsの可能性",
    displayTitle:
      "GTA6、PS5 Proでも30fps？\nRockstar先行プレビューで判明した“現在の動作”と60fpsの可能性",
    description:
      "Rockstar Northを訪問したブラジルのクリエイターDavy Jonesが、現地で見たGTA6が30fpsで動作していたと明かした。PS5 Proでも同様だったと報じられているが、Rob Nelson氏は60fpsに対応しないとは答えていない。「PS5 Pro Enhanced」の意味、CPUがボトルネックになる理由、40fpsという選択肢まで整理する。",
    icon: "🎮",
    image: "/images/news/gta6-official-screenshots-29/vice-city-10.webp",
    category: "topic",
    date: "2026-08-28",
    publishedAt: "2026-08-28 23:30",
    source: "Davy Jones／Flow Games・Push Square ほか報道",
    sourceUrl: "https://www.pushsquare.com/news/2026/08/gta-6-targeting-30fps-on-ps5-undecided-on-performance-mode",
    relatedArticles: [50, 49, 48],
    aiSummary: [
      "Rockstar Northを訪問したブラジルのクリエイターDavy Jonesが、現地で見たGTA6が30fpsで動作していたと明かした。デモにはフレームレートカウンターも表示されていたと報じられ、ブラジルのFlow Gamesは開発責任者Rob Nelson氏の説明として、現在の開発段階ではPS5 Proを含むコンソール版が30fpsで動作しているとしている。",
      "ただしNelson氏は「60fpsには対応しない」と答えたわけではなく、最終的な技術仕様については技術チームへの確認が必要という趣旨の回答だった。つまり「PS5 Proでも30fps確定」ではなく、「現在のGTA6は30fpsをターゲットとしており、60fpsについてRockstarはまだ約束していない」という段階になる。",
      "PlayStation StoreにはGTA6が「PS5 Pro Enhanced」と明記されているが、この表示は60fpsを保証するものではない。PS5 ProはGPUとPSSR・レイトレーシングが強化された一方でCPUの世代交代は小幅で、大量のNPCや新しい警察システムを動かすGTA6ではCPUがボトルネックになりやすい。解像度を下げてもCPU負荷は下がらないため、60fpsは自明ではない。",
    ],
    fullContent: `# GTA6、PS5 Proでも30fps？Rockstar先行プレビューで判明した“現在の動作”と60fpsの可能性

「PS5 Proなら、さすがにGTA6を60fpsで遊べるのではないか」。

『Grand Theft Auto VI』の発売を待つプレイヤーの間では、以前からそんな期待があった。通常のPS5より高いグラフィック性能を持つPS5 Proは、PlayStation StoreでもGTA6の対応機能として正式に「PS5 Pro Enhanced」と表示されている。最高のコンソール環境でGTA6を遊びたい人にとって、PS5 Proは有力な選択肢に見える。

ところが8月27日、Rockstar Northを訪問していたブラジルのクリエイターDavy Jonesから、少し気になる情報が出てきた。

彼がRockstar Northで実際に見たGTA6は30fpsで動作していたという。さらにDavy Jonesは、その場でRockstar Northの開発責任者Rob Nelson氏へ「30fpsなのか、60fpsなのか」「PS5 Proではどうなるのか」と直接質問している。

その回答によって見えてきたのは、「PS5 Proでも30fps確定」という単純な話ではない。

しかし同時に、現段階のRockstarがGTA6を30fpsを前提とした状態で動かしていることを示す、これまででもっとも具体的な情報でもある。

---

## Rockstar Northで見せられたGTA6は30fpsだった

今回の情報源となったDavy Jonesは、TGGやEl Rubiusらと同じく、7月にスコットランド・エディンバラのRockstar Northへ招待されていたクリエイターのひとりだ。

Extended Look公開後、彼は現地で見たGTA6について次々と情報を明かしている。そのなかでフレームレートについても質問しており、ブラジルのFlow Gamesは、Rob Nelson氏の説明として現在の開発段階ではコンソール版が30fpsで動作していると報じた。Flow GamesはPS5 Proについても同様に30fpsだったとしている。

Davy Jonesが見たデモではフレームレートカウンターも表示されており、30fpsで動いていることを直接確認できたと報じられている。

これは、今回公開された「Grand Theft Auto VI: An Extended Look」の内容とも大きく矛盾しない。

Rockstar自身がExtended Lookについて、すべてPlayStation 5上で撮影されたゲーム内映像だと明記している。PS5 Proではなく通常のPS5で、今回披露された密度の世界が実際に動いているわけだ。

ただし、ここから「発売版は全機種30fps固定」と結論づけるのはまだ早い。

---

## Rob Nelson氏は「発売版も30fps」と断言していない

Davy Jonesはさらに踏み込んで、60fpsの可能性やPS5 ProについてNelson氏へ質問している。

ここでNelson氏は、「60fpsには対応しない」と答えたわけではなかった。

正確な技術的回答をするにはRockstarの技術チームに確認する必要があるという趣旨の回答をしており、解像度やレイトレーシングを含む最終的な技術仕様についても、この場では明言していない。

つまり、現時点で整理できる状況はこうだ。

Rockstar Northで披露された現在のGTA6は30fpsで動いている。PS5 Proを含め、現在確認されているコンソール環境について60fpsモードは発表されていない。一方でRockstarは、発売時にも必ず30fpsしか選べないとは正式発表していない。

この「現在の開発状況」と「製品版の確定仕様」が海外の見出しでは混ざり始めている。

「GTA6はPS5 Proでも30fps確定」という表現は、現時点では少し強すぎる。

より正確に言えば、

> 現在のGTA6はPS5 Proを含むコンソールで30fpsをターゲットとしており、60fpsモードについてRockstarはまだ約束していない

という段階だ。

---

## では「PS5 Pro Enhanced」とは何なのか

ここで当然出てくるのが、「だったらPS5 Pro Enhancedって何なの？」という疑問だろう。

GTA6の日本版PlayStation Storeには、スタンダード・エディション、アルティメット・エディションともに「**PS5 Pro Enhanced**」と明記されている。これは噂ではなく、PlayStation公式ストアで確認できる情報だ。

![PS5本体と大型テレビが置かれたリビングのイメージ。テレビにはGTA6らしい夜のVice Cityが映り、机の上にはコントローラーとパフォーマンス解析のグラフを表示したノートPCが並んでいる](/images/news/gta6-ps5pro-30fps/ps5pro-console-analysis.webp)

*画像: 内容を分かりやすく伝えるためのAI生成イメージ画像。実際のGTA6のゲーム画面・公式素材ではない。*

ただし、「PS5 Pro Enhanced」という表示は60fpsを保証するものではない。

PS5 Proでは、GPU性能の向上に加えて、AIを利用したアップスケーリング技術PSSR、レイトレーシング性能の強化などが用意されている。SonyもPS5 Proについて、高解像度化、高フレームレート、レイトレーシングなどをタイトルごとに活用できるハードウェアとして説明している。

ゲームによってはPS5の30fps相当の画質を60fpsで実現するためにProの性能を使う。一方で、フレームレートはそのままに、より高い解像度や高品質な反射、影、描画距離などへ性能を振り分けることもできる。

つまりGTA6がPS5 Pro Enhancedだからといって、

> 通常PS5＝30fps、PS5 Pro＝60fps

になるとは限らない。

たとえば30fpsを維持したまま、通常PS5より高い内部解像度、より高品質なレイトレーシング、安定したPSSR、遠景や反射表現の強化などがPS5 Pro版の特徴になる可能性もある。

現時点では、Rockstarがその中身を発表していないだけだ。

---

## なぜPS5 Proでも60fpsが簡単ではないのか

では、通常PS5より高性能なPS5 Proでも、なぜGTA6の60fpsがこれほど疑問視されるのだろうか。

ここで重要になるのが、ゲーム機の性能を単純に「グラフィックが何倍速いか」だけでは判断できないという点だ。

GTA6で画面に映っているのは、美しい建物や車だけではない。

![夜のVice Cityを上空から捉えた公式スクリーンショット。観覧車やネオンに照らされた建物が密集し、その間を道路が走っている](/images/news/gta6-official/vice-city-08.webp)

街を歩く大量のNPC、それぞれの反応、交通システム、警察の捜査、車両や物体の物理演算、店や施設、天候、時間帯、遠くを走る車、プレイヤーの行動を認識する周囲の人々――今回のExtended Lookと先行プレビューからは、GTA6が非常に多くのシステムを同時に動かしていることが分かってきた。

特に今回明らかになった新しい警察システムは象徴的だ。

誰が犯罪を目撃したのか、どの服装を見られたのか、どの車を使ったのかといった情報をゲーム側が扱う。NPCも以前のように単純に逃げるだけではなく、状況によって抵抗する。車ひとつ盗む場合でもセキュリティや追跡装置が存在する。

こうした世界の「裏側の計算」を主に担当するのがCPUだ。

PS5 Proは通常PS5からGPU側が大きく強化された一方、CPUについてはそれほど劇的な世代交代をしていない。この点についてDigital FoundryはPS5 Proの登場以前から、GTAのような複雑なシミュレーションを行うゲームではCPUがボトルネックになる可能性を指摘し、通常PS5で30fpsを前提とするゲームをPS5 Proだけで60fpsへ倍増させるのは難しいとの見方を示していた。

2026年に入ってGTA6の詳細がさらに明らかになった後も、Digital Foundryは同様に60fpsには慎重な見方を示している。

そして今回、Rockstar Northの実機デモが30fpsだったことで、その分析に初めて開発現場側からの具体的な情報が重なったことになる。

---

## 「解像度を下げれば60fps」は必ずしも通用しない

ゲームではよく、「4Kをやめて1080pにすれば60fpsにできるのでは」と考えられる。

GPUが限界になっているゲームなら、それは有効な方法だ。描画するピクセル数を減らせばGPUの仕事が軽くなり、フレームレートを上げられる可能性がある。

しかしCPUが先に限界へ達している場合は事情が違う。

画面を1080pにしても、NPCは半分の速度で考えてくれるわけではない。交通量も、物理演算も、警察AIも、世界のシミュレーションも動き続ける。

30fpsから60fpsへ上げるためには、それらの処理もより短い時間の中で完了させなければならない。

だからこそ、PS5 Proの強力なGPUやPSSRがあれば必ず60fpsになる、とは言い切れないのである。

むしろPS5 Proでは、CPU側で維持できるフレームレートの範囲内で、余ったGPU性能を画質へ振り分けるという使い方も十分に考えられる。

---

## 30fpsならGTA6は「ダメ」なのか

ここも分けて考える必要がある。

60fpsに慣れている人にとって、30fpsと60fpsの違いはかなり分かりやすい。カメラを素早く動かしたとき、銃撃戦で照準を合わせるとき、高速で車を運転するときなどは、60fpsの方が映像だけでなく操作の反応も滑らかに感じやすい。

だから「できれば60fpsで遊びたい」と考えること自体は当然だ。

一方、Rockstarはこれまで新作オープンワールドの発売時に、世界の密度や映像表現を優先して30fpsを選んできた歴史もある。

『Grand Theft Auto V』も当初のコンソール版は30fpsをターゲットとしており、『Red Dead Redemption 2』もコンソールでは長く30fpsを前提としていた。GTA VがPS5やXbox Series X|Sで60fpsに対応したのは、世代をまたいだ後のことだ。

GTA6も同じ思想を選んだとして、不思議ではない。

今回のExtended Lookを見れば、Rockstarがどこへハードウェア性能を使っているのかもある程度想像できる。

大量の人間が存在し、車が走り、店舗があり、建物の内部まで作り込まれ、水やガラスには複雑な反射があり、それらが巨大なLeonidaの中で同時に動いている。

Rockstarにとって30fpsは「60fpsを実現できなかった結果」というより、何を画面に存在させるかを優先した結果として選ばれる可能性のある設計判断なのかもしれない。

実際、Davy Jonesが伝えたNelson氏の言葉も、30fpsを謝罪するようなものではなく、現在画面上で動かしている大量の要素を踏まえて30fpsでの出来に自信を持っているようなニュアンスだったと報じられている。

---

## それでもPS5 Proユーザーが気になるのは当然

一方で、PS5 Proを所有しているユーザーからすれば「通常PS5と同じ30fpsなら、何が違うのか」と思うのも自然だろう。

その答えはまだRockstarから示されていない。

PlayStation StoreにはPS5 Pro Enhancedと書かれている以上、何らかのPro向け強化が存在することは確認できる。しかし、それが高解像度なのか、レイトレーシングなのか、PSSRなのか、より安定した30fpsなのか、あるいは別のグラフィックモードが存在するのかは不明だ。

ここは今後Rockstarから発表される技術仕様で、かなり重要なポイントになる。

特にGTA6のためにPS5 Proを購入しようと考えている場合、現段階で「PS5 Proなら60fps」と期待して本体を選ぶのは避けた方がいい。

PS5 Pro版が存在し、Enhanced対応することは確定。60fpsは未確定。

このふたつは分けて考える必要がある。

---

## 60fps以外に「40fps」という可能性もある

もし60fpsが技術的に難しかった場合、もうひとつ考えられるのが40fpsモードだ。

これはRockstarが発表した情報ではなく、Digital Foundryなど技術系メディアが可能性として挙げているものなので、現時点では完全に推測の範囲になる。

近年のコンソールゲームでは、120Hz対応テレビを利用している場合、30fpsと60fpsの中間となる40fpsを選べる作品も増えている。

60fpsほどではないものの30fpsよりかなり滑らかに感じられ、同時に高品質なグラフィックも維持しやすい。

PS5 Pro Enhancedという立場を考えれば、

通常PS5では30fps、PS5 Proではより高品質な30fpsや40fpsモードを用意する、といった構成も技術的な選択肢としては考えられる。

ただし繰り返しになるが、GTA6に40fpsモードが存在するという情報はRockstarから一切出ていない。

現時点では「そういう落としどころもあり得る」という技術的な予想に過ぎない。

---

## 現時点で分かっていること、まだ分からないこと

今回の情報を追っていくと、「GTA6はPS5 Proでも30fps」というニュースには、事実と推測がかなり混ざっていることが分かる。

確実に言えるのは、Rockstar Northで披露された現在のコンソール版GTA6が30fpsで動作していたこと。そしてDavy JonesがPS5 Proと60fpsについて直接質問したものの、Nelson氏は最終的な技術仕様については技術チームへの確認が必要だと答えたことだ。

また、GTA6がPS5 Pro Enhanced対応であることもPlayStation Storeで正式に確認できる。

一方で、PS5 Proに60fpsモードが存在するのか、通常PS5にパフォーマンスモードがあるのか、40fpsモードがあるのか、各機種の解像度はいくつなのか、どのようなレイトレーシングが使われるのかについては、まだ正式発表されていない。

したがって現時点では、

> PS5 Proでも30fpsしか出ないことが確定した

ではなく、

> 現在のGTA6はPS5 Proを含め30fpsで動いており、60fpsについてRockstarはまだ約束していない

と理解するのがもっとも正確だ。

---

## 30fpsという数字の向こうに、Rockstarが何を優先しているのかを見る

今回の話は、「30と60、どちらの数字が大きいか」だけで終わらせると、GTA6について重要な部分を見落としてしまう。

Extended LookとRockstar Northの先行プレビューから明らかになったのは、GTA6が非常に多くのシステムを同時に成立させようとしていることだ。

![夜のアパートで市街地図を挟んで話し合う男女のイメージ。机には札束とスマートフォン、手前にはゲームコントローラーが置かれ、窓の外には湾岸の夜景と渋滞した道路が見えている](/images/news/gta6-ps5pro-30fps/jason-lucia-map-controller.webp)

*画像: 内容を分かりやすく伝えるためのAI生成イメージ画像。実際のGTA6のゲーム画面・公式素材ではない。*

街を歩くNPCはプレイヤーを認識し、犯罪を目撃すれば通報する。警察は目撃情報をもとに犯人を探し、車両や服装まで捜査に利用する。盗む車によって必要な道具も違い、ジェイソンとルシアはプレイヤーが操作していない間もそれぞれの生活を続ける。

こうしたシステムの詳細は「[Extended Lookだけでは分からないGTA6新情報まとめ](/news/50)」で整理している。

そのうえで巨大なVice CityとLeonidaを描き、今回見せたグラフィックを通常のPS5上で動かしている。

もしRockstarがその世界を維持するために30fpsを選んでいるのであれば、GTA6にとって重要なのは「PS5 Proなのに30fpsしか出ない」という話ではなく、Rockstarがフレームレートと引き換えに何を動かしているのかなのかもしれない。

もちろん、発売までまだ時間はある。

最適化によって新しいモードが追加される可能性もあれば、PS5 Pro専用の仕様が後から詳しく発表される可能性もある。反対に、最終的に30fpsのみで発売される可能性も残っている。

GTA6の発売日は2026年11月19日。

フレームレートについて初めて具体的な情報が出てきた今、次に待たれるのは噂や分析ではなく、Rockstar自身によるPS5、PS5 Pro、Xbox Series X|Sそれぞれの正式な技術仕様だ。

GTA6 FEEDでは、PS5 Pro Enhancedの詳細や60fps・グラフィックモードについて新たな公式情報、またはRockstar Northを訪れたクリエイターから追加の証言が出た場合も引き続き追っていく。

---

> **注記：** 本記事はDavy Jonesの発言をもとにしたFlow Games、Push Squareなど各メディアの報道と、公開されている公式情報をまとめたもので、発言の日本語部分は編集部訳・要約を含む。正確な文言は各原文を参照してほしい。フレームレートに関する記述は2026年8月時点の開発中ビルドについてのものであり、製品版の仕様はRockstarから正式発表されていない。40fpsモードの可能性は技術系メディアによる推測であり、Rockstarの発表ではない。また、本記事の画像のうちAI生成のイメージ画像には、その旨を各画像のキャプションに記載している。それ以外はRockstar Games提供の公式素材である。`,
    titleEn:
      "GTA6 at 30fps Even on PS5 Pro? What the Rockstar Previews Showed About Current Performance — and the Odds of 60fps",
    displayTitleEn:
      "GTA6 at 30fps Even on PS5 Pro?\nWhat the Previews Showed, and the Odds of 60fps",
    descriptionEn:
      "Brazilian creator Davy Jones, who visited Rockstar North, revealed that the GTA6 he was shown ran at 30fps — reportedly including on PS5 Pro. But Rob Nelson never said 60fps was off the table. Here is what \"PS5 Pro Enhanced\" actually guarantees, why the CPU is the bottleneck, and where a 40fps mode might fit.",
    aiSummaryEn: [
      "Brazilian creator Davy Jones, one of the creators invited to Rockstar North in July, revealed that the GTA6 build he was shown ran at 30fps, with a frame rate counter visible on screen. Brazilian outlet Flow Games reported, citing development lead Rob Nelson, that current console builds run at 30fps — PS5 Pro included.",
      "Nelson did not, however, say 60fps was ruled out; he indicated that a precise technical answer would require checking with Rockstar's technical team, and did not commit on resolution or ray tracing either. So this is not \"30fps confirmed on PS5 Pro\" — it is \"GTA6 currently targets 30fps, and Rockstar has not promised 60fps.\"",
      "The PlayStation Store does list GTA6 as PS5 Pro Enhanced, but that label guarantees no particular frame rate. PS5 Pro's gains are concentrated in the GPU, PSSR and ray tracing, while its CPU is only modestly improved — and GTA6's crowds, traffic and new police investigation system lean on the CPU. Dropping resolution does not lighten that load, so 60fps is far from automatic.",
    ],
    fullContentEn: `# GTA6 at 30fps Even on PS5 Pro? What the Rockstar Previews Showed About Current Performance — and the Odds of 60fps

"Surely on a PS5 Pro you'll be able to play GTA6 at 60fps."

That hope has been circulating among players waiting on *Grand Theft Auto VI* for a while. The PS5 Pro, with graphics performance above the base PS5, is officially listed on the PlayStation Store as "PS5 Pro Enhanced" for GTA6. For anyone who wants the best console experience the game can offer, the Pro looks like the obvious pick.

Then on August 27, something worth noting came from Brazilian creator Davy Jones, who had visited Rockstar North.

The GTA6 he actually saw at Rockstar North was running at 30fps. Jones also asked Rockstar North development lead Rob Nelson directly, on the spot: is it 30 or 60fps, and what about PS5 Pro?

What the answer reveals is not the simple story of "30fps confirmed, even on PS5 Pro."

But it is also the most concrete indication yet that Rockstar is currently running GTA6 on the assumption of 30fps.

---

## The GTA6 Shown at Rockstar North Was Running at 30fps

Davy Jones, the source here, was — like TGG and El Rubius — one of the creators invited to Rockstar North in Edinburgh, Scotland in July.

Since Extended Look went live, he has been steadily sharing what he saw on site. Frame rate was among the things he asked about, and Brazilian outlet Flow Games reported, citing Rob Nelson's explanation, that console builds run at 30fps at the current stage of development. Flow Games states the same applied to PS5 Pro.

The demo Jones saw reportedly had a frame rate counter on screen, letting him confirm the 30fps directly.

None of this greatly contradicts "Grand Theft Auto VI: An Extended Look" itself.

Rockstar explicitly states that Extended Look is in-game footage captured entirely on PlayStation 5. That density of world is genuinely running on a base PS5, not a Pro.

Still, it is too early to conclude that "the shipping game is locked to 30fps on every platform."

---

## Rob Nelson Did Not Say the Shipping Game Is 30fps

Jones pushed further, asking Nelson about the possibility of 60fps and about PS5 Pro specifically.

Nelson did not answer that 60fps was not happening.

He indicated that giving a precise technical answer would require checking with Rockstar's technical team, and he did not commit on final technical specifications — resolution and ray tracing included.

So here is what can actually be established right now.

The GTA6 shown at Rockstar North currently runs at 30fps. No 60fps mode has been announced for any confirmed console configuration, PS5 Pro included. At the same time, Rockstar has not officially stated that 30fps will be the only option at launch.

"Current state of development" and "confirmed shipping specification" are starting to blur together in headlines abroad.

"GTA6 confirmed at 30fps even on PS5 Pro" is a little too strong for where we are.

More precisely:

> GTA6 currently targets 30fps on consoles including PS5 Pro, and Rockstar has not yet promised a 60fps mode.

That is the actual stage we are at.

---

## So What Is "PS5 Pro Enhanced"?

The natural follow-up: then what does PS5 Pro Enhanced even mean?

GTA6's PlayStation Store listing marks both the Standard and Ultimate editions as "**PS5 Pro Enhanced**." That is not a rumor — it is visible on the official store.

![A living room with a PS5 and a large TV, GTA6-style night Vice City on screen, a controller and a laptop showing performance analysis graphs on the desk](/images/news/gta6-ps5pro-30fps/ps5pro-console-analysis.webp)

*Image: an AI-generated illustration made to help convey the story. It is not GTA6 footage or official Rockstar material.*

But the "PS5 Pro Enhanced" label does not guarantee 60fps.

The PS5 Pro offers a stronger GPU, the AI upscaling technology PSSR, and improved ray tracing performance. Sony itself describes the Pro as hardware that titles can use for higher resolution, higher frame rates or ray tracing, on a per-game basis.

Some games spend Pro performance on hitting 60fps at roughly base-PS5 image quality. Others keep the frame rate where it is and put the headroom into higher resolution, better reflections, shadows or draw distance instead.

So GTA6 being PS5 Pro Enhanced does not necessarily mean:

> base PS5 = 30fps, PS5 Pro = 60fps

It is entirely possible that the Pro version holds 30fps while offering a higher internal resolution, better ray tracing, more stable PSSR, and improved distant detail and reflections.

Right now, Rockstar simply has not said which it is.

---

## Why 60fps Is Not Easy Even on PS5 Pro

So why is GTA6 at 60fps doubted even on hardware more powerful than a base PS5?

The key point is that a console's capability cannot be judged purely by "how many times faster the graphics are."

What is on screen in GTA6 is not just handsome buildings and cars.

![Official screenshot of Vice City from the air at night — a Ferris wheel and neon-lit buildings packed together with roads running between them](/images/news/gta6-official/vice-city-08.webp)

Crowds of NPCs walking the streets and each of their reactions, the traffic system, police investigation, physics for vehicles and objects, stores and venues, weather, time of day, cars driving in the distance, bystanders registering what the player does — Extended Look and the previews have made clear that GTA6 is running a great many systems at once.

The newly revealed police system is the emblematic case.

The game now tracks who witnessed the crime, what clothing was seen, which car was used. NPCs no longer simply flee; depending on the situation they fight back. Even stealing a single car involves security and tracking devices.

The "behind the scenes math" of a world like that falls mainly to the CPU.

The PS5 Pro substantially strengthened the GPU side over the base PS5, but its CPU did not get a dramatic generational jump. On this point, Digital Foundry had noted even before the Pro launched that CPU could be the bottleneck in games running complex simulations like GTA, and took the view that doubling a base-PS5 30fps game to 60fps on Pro hardware alone would be difficult.

After more GTA6 detail emerged through 2026, Digital Foundry has remained similarly cautious about 60fps.

And now, with the Rockstar North demo running at 30fps, that analysis has concrete information from the development side layered on top of it for the first time.

---

## "Just Lower the Resolution for 60fps" Does Not Always Work

A common assumption: drop from 4K to 1080p and you can hit 60fps.

For a GPU-limited game, that is a valid approach. Fewer pixels to draw means less GPU work and a real chance at a higher frame rate.

When the CPU hits its ceiling first, though, the situation is different.

Rendering at 1080p does not make NPCs think at half speed. Traffic, physics, police AI and the world simulation all keep running.

To go from 30fps to 60fps, all of that has to finish inside a shorter window too.

Which is why a powerful GPU and PSSR on PS5 Pro cannot be assumed to deliver 60fps.

If anything, the Pro may end up holding whatever frame rate the CPU can sustain and spending the leftover GPU budget on image quality.

---

## Does 30fps Make GTA6 "Bad"?

This needs separating out too.

For anyone used to 60fps, the difference between 30 and 60 is quite legible. Whipping the camera around, lining up a shot in a firefight, driving fast — 60fps tends to feel smoother not just visually but in how the controls respond.

So wanting 60fps if at all possible is entirely reasonable.

On the other hand, Rockstar has a history of choosing 30fps at launch for new open worlds, prioritizing world density and visual presentation.

*Grand Theft Auto V* targeted 30fps on its original console release, and *Red Dead Redemption 2* ran on a 30fps assumption on consoles for a long time. GTA V only got 60fps on PS5 and Xbox Series X|S a generation later.

It would not be strange for GTA6 to make the same call.

Watch Extended Look and you can guess reasonably well where Rockstar is spending its hardware budget.

Large numbers of people exist, cars drive, storefronts operate, building interiors are built out, water and glass carry complex reflections — and all of it runs simultaneously inside an enormous Leonida.

For Rockstar, 30fps may be less "the result of failing to reach 60" than a design decision that follows from prioritizing what gets to exist on screen.

Indeed, the Nelson comments Jones relayed reportedly carried less an apologetic tone about 30fps than confidence in how the game holds up at 30 given everything it is running.

---

## PS5 Pro Owners Are Still Right to Wonder

That said, if you own a PS5 Pro, asking "what do I actually get, if it's the same 30fps as a base PS5?" is a fair question.

Rockstar has not answered it.

Since the PlayStation Store says PS5 Pro Enhanced, some form of Pro-specific improvement clearly exists. Whether that is higher resolution, ray tracing, PSSR, a more stable 30fps, or a separate graphics mode entirely is unknown.

This is going to be an important point in whatever technical specifications Rockstar publishes next.

In particular, if you are considering buying a PS5 Pro for GTA6, do not pick the hardware on the expectation of 60fps at this stage.

A PS5 Pro version exists and is Enhanced: confirmed. 60fps: not confirmed.

Those two need to stay separate.

---

## Beyond 60fps, There Is Also a "40fps" Possibility

If 60fps proves technically difficult, the other option worth considering is a 40fps mode.

This is not something Rockstar announced — it is a possibility raised by technical outlets like Digital Foundry, so at this point it is purely speculative.

Recent console games increasingly offer 40fps, halfway between 30 and 60, for players on 120Hz-capable televisions.

It is not 60fps, but it feels considerably smoother than 30 while remaining easier to pair with high-end graphics.

Given the PS5 Pro Enhanced label, a configuration where the base PS5 runs 30fps and the Pro offers a higher-quality 30fps or a 40fps mode is at least technically on the table.

To repeat, though: no information about a 40fps mode in GTA6 has come from Rockstar.

For now it is only a technical guess at where things might land.

---

## What We Know, and What We Do Not

Follow this story through and it becomes clear that the "GTA6 is 30fps even on PS5 Pro" news mixes fact and speculation fairly heavily.

What can be said with confidence: the console build of GTA6 shown at Rockstar North was running at 30fps, and although Davy Jones asked directly about PS5 Pro and 60fps, Nelson answered that final technical specifications would require checking with the technical team.

It is also officially verifiable on the PlayStation Store that GTA6 is PS5 Pro Enhanced.

What has not been officially announced: whether a 60fps mode exists on PS5 Pro, whether the base PS5 has a performance mode, whether there is a 40fps mode, what resolution each platform runs at, or what form of ray tracing is used.

So at this point, the accurate reading is not:

> It has been confirmed that PS5 Pro can only manage 30fps

but rather:

> GTA6 currently runs at 30fps including on PS5 Pro, and Rockstar has not yet promised 60fps.

---

## Looking Past the Number at What Rockstar Is Prioritizing

If this story ends at "which number is bigger, 30 or 60," it misses something important about GTA6.

What Extended Look and the Rockstar North previews made clear is that GTA6 is trying to hold a great many systems together at once.

![Two people talking over a city map in a night apartment, cash and a phone on the table, a game controller in the foreground, a waterfront skyline and busy road outside the window](/images/news/gta6-ps5pro-30fps/jason-lucia-map-controller.webp)

*Image: an AI-generated illustration made to help convey the story. It is not GTA6 footage or official Rockstar material.*

NPCs walking the street register the player and call the police if they witness a crime. The police hunt the suspect based on those reports, using the vehicle and clothing in the investigation. Different cars need different tools to steal. Jason and Lucia keep living their own lives while you are playing the other one.

The details of those systems are laid out in "[Everything Extended Look Did Not Tell You About GTA6](/en/news/50)."

On top of all that, it renders an enormous Vice City and Leonida — and runs the graphics shown here on a base PS5.

If Rockstar is choosing 30fps in order to sustain that world, then the important question for GTA6 may not be "why only 30fps on a PS5 Pro" but what Rockstar is running in exchange for the frame rate.

There is, of course, still time before release.

Optimization could add new modes; PS5 Pro-specific specifications could be detailed later. Conversely, shipping at 30fps only remains a real possibility.

GTA6 releases on November 19, 2026.

Now that concrete information about frame rate has appeared for the first time, what is needed next is not rumor or analysis but official technical specifications from Rockstar for PS5, PS5 Pro and Xbox Series X|S.

GTA6 FEED will keep following this — new official information on PS5 Pro Enhanced details, 60fps and graphics modes, as well as any further testimony from creators who visited Rockstar North.

---

> **Note:** This article draws on reporting from Flow Games, Push Square and other outlets based on Davy Jones' comments, along with publicly available official information; quoted passages are summarized or paraphrased rather than reproduced in full, so refer to the originals for exact wording. Statements about frame rate concern a build in development as of August 2026; the shipping specification has not been officially announced by Rockstar. The 40fps possibility is speculation by technical outlets, not a Rockstar announcement. Images that are AI-generated illustrations are labeled as such in their captions; the rest are official Rockstar Games material.`,
  },
  {
    id: 50,
    title:
      "Extended Lookだけでは分からないGTA6新情報まとめ――警察、車両盗難、ジェイソンとルシアの関係まで",
    displayTitle:
      "Extended Lookだけでは分からないGTA6新情報まとめ\n警察、車両盗難、ジェイソンとルシアの関係まで",
    description:
      "Rockstar Northで行われた先行プレビューから、Extended Lookを何度見返しても分からない情報が一気に出てきた。目撃と通報で変わる手配システム、プレイヤーがどんな犯罪者かを見る「犯罪プロファイル」、電子キーとGPSトラッカーが絡む車両盗難、プレイヤーが選べるジェイソンとルシアの関係性まで、判明した内容を整理する。",
    icon: "🚔",
    image: "/images/news/gta6-official/vice-city-01.webp",
    category: "topic",
    date: "2026-08-28",
    publishedAt: "2026-08-28 22:00",
    source: "ファミ通ほかRockstar North先行プレビュー各誌／Rockstar Games「An Extended Look」",
    sourceUrl: "https://www.rockstargames.com/VI",
    relatedArticles: [49, 48, 47],
    aiSummary: [
      "2026年8月28日に公開された「Grand Theft Auto VI: An Extended Look」に加え、7月にRockstar Northで行われた先行プレビューの内容が解禁され、映像だけでは分からないシステム情報が一気に出てきた。日本からはファミ通が現地取材を行い、Rob Nelson氏へのインタビューを実施している。",
      "手配システムは「犯罪をしたら星が付く」から、目撃されたか・通報されたかを軸にした捜査へ変わる。マスクや服装、使用した車といった「警察が把握している情報」から自分を切り離す駆け引きが加わる。さらにプレイヤーがどのような犯罪者として振る舞うかを記録する「犯罪プロファイル」も導入され、NPCが必ずしも怯えず抵抗してくる場面もある。",
      "車両盗難は電子キーやGPSトラッカーへの対処が必要になり、キークローナーのような専用装備も登場する。大型武器は車両に保管する方式へ変わり、ジェイソンとルシアの関係はプレイヤーの行動で変化する。Vice CityはLos Santosの約2倍という話も出ているが、比較対象で意味が変わるため単純化は避けたい。",
    ],
    fullContent: `# Extended Lookだけでは分からないGTA6新情報まとめ――警察、車両盗難、ジェイソンとルシアの関係まで

2026年8月28日、日本時間午前4時。Netflixで『Grand Theft Auto VI: An Extended Look』が公開された。

約26分という長さもさることながら、そこで映し出されたVice CityとLeonidaの姿は、これまでのトレーラーとは明らかに情報量が違っていた。ジェイソンとルシアが街を歩き、車を走らせ、銃撃戦を行い、店や施設に立ち寄る。Rockstar Gamesが「シリーズ史上最大かつもっとも没入感のある進化」と表現するGTA6が、ようやく「実際に遊ぶゲーム」として見え始めた。

ところが今回、本当に重要だったのはExtended Lookだけではない。

Rockstarはその約1か月前となる7月、スコットランド・エディンバラにあるRockstar Northへ世界各国のメディアやクリエイターを招待していた。そこで参加者たちは、実際に自分で操作するハンズオンではないものの、Rockstar側が動かすGTA6を見ながら、映像だけでは判断できないゲームシステムについて説明を受けていた。

日本からはファミ通も現地を訪れ、Head of Development兼Co-Studio HeadのRob Nelson氏へ取材を実施。海外ではTGG、El Rubius、Davy Jones、Mike ShowShaといったクリエイターも訪問を明らかにしている。

その結果、Extended Lookの公開後には、公式映像を何度見返しても分からない情報が一気に出てきた。

海外では映像と各種プレビューを細かく分解し、「150以上の新情報」と整理するメディアまで現れている。ただ、重要なのは数ではない。今回明らかになった内容を追っていくと、GTA6が単純に「GTA Vを巨大にして、グラフィックを綺麗にしたゲーム」ではないことが見えてくる。

Rockstarは、犯罪そのものの遊び方をかなり根本から作り直している。

---

## 警察から逃げるゲームが「星を消す」だけではなくなる

GTAシリーズで犯罪を起こせば、手配度を示す星が付き、警察から逃げる。これはシリーズを象徴する仕組みのひとつだ。

しかしGTA6では、「犯罪をしたから自動的に警察が知っている」というゲーム的な処理から、より現実的な捜査へ近づけようとしている。

Rockstarの説明によれば、重要になるのは犯罪そのものよりも、誰かに見られたか、そして通報されたかだ。

![店内で銃を突きつけ、居合わせた人々に両手を上げさせているジェイソンとルシアの公式スクリーンショット](/images/news/gta6-official-screenshots-29/jason-and-lucia-05.webp)

たとえば店を襲うとしても、銃を持ったまま正面入口へ向かい、その姿を通行人に見られれば、強盗を始める前から警察へ通報される可能性がある。一方、裏から侵入し、監視カメラなどのセキュリティへ対処して、誰にも気づかれずに金を奪えば、そのまま逃げられることもあるという。

さらに面白いのが、その後の警察の捜査だ。

マスクを着けて犯罪を行ったなら、警察が把握しているのは「マスクを着けた犯人」という情報になる。逃走中にマスクを外せば、見つかりにくくなる可能性がある。ただし、服装や使用した車まで知られていれば、それだけでは十分ではない。車を乗り換えたり、服装を変えたり、警察が把握している情報から自分を切り離していく必要がある。

これまでのGTAでは、警察から十分に距離を取って星が点滅するのを待つことが逃走の基本だった。GTA6ではそこに、「**警察は今、自分について何を知っているのか**」という駆け引きが加わる。

追跡から逃れることそのものが、小さなステルスゲームのようになっているわけだ。

---

## GTA6はプレイヤーを「どんな犯罪者なのか」まで見ている

この警察システムと深く関わってくるのが、新たに明かされた「犯罪プロファイル」という考え方だ。

『Red Dead Redemption 2』には、主人公の行動によって善悪が評価される名誉システムがあった。しかしGTAで「犯罪をしたら悪人」と判定してしまえば、ゲームそのものが成立しない。

そこでGTA6が見るのは、犯罪をしたかどうかではなく、どのような犯罪者として振る舞っているかだという。

目的を達成するために必要最低限の暴力だけを使い、その場から素早く立ち去るのか。それとも、邪魔する人間を次々と殺し、警察とも正面から撃ち合うのか。同じ強盗をしていても、プレイヤーの行動はまったく違う。

GTA6ではその違いをゲーム側が記録し、世界の反応にも反映していく。

ここで重要なのは、「暴れる遊び方ができなくなる」という話ではないことだ。Rockstarはプレイヤーに正しい遊び方を押し付けるつもりはないとしている。従来通り、大暴れすることもできる。ただ、その行動に対して世界が以前より強く反応するようになる。

その変化はNPCにも表れている。

これまでなら、プレイヤーが銃を向けて車を奪おうとすれば、多くのNPCは逃げ出した。しかしLeonidaでは、相手が必ずしも怯えてくれるとは限らない。武器を持っている市民なら、その場で抵抗してくる可能性もある。

つまりGTA6では、プレイヤーだけが圧倒的に強い存在ではない。

街を構成する人々が、プレイヤーの行動へ返事をする。

Rockstarが作ろうとしている「生きた世界」というものが、こうした細かなシステムからも見えてくる。

---

## タイトルにもなっている「車を盗む」という行為が大幅に進化

さらに興味深いのが車両盗難だ。

Grand Theft Autoというタイトルでありながら、これまでのシリーズでは車を盗む行為そのものは非常にシンプルだった。道路を走っている車を止め、ドライバーを引きずり出し、そのまま走り去る。それだけで高級車まで手に入る。

GTA6では、この当たり前が変わる。

![夜の路地で高級車の運転席ドアに電子機器を差し込む人物のイメージ。足元には工具ケースが開かれ、壁際では仲間が見張りに立ち、頭上には監視カメラがある](/images/news/gta6-preview-roundup/keycloner-luxury-car.webp)

*画像: 内容を分かりやすく伝えるためのAI生成イメージ画像。実際のGTA6のゲーム画面・公式素材ではない。*

古い車であれば従来に近い方法で比較的簡単に盗める一方、新しい車や高級車では電子キーへの対処が必要になる場合があり、「キークローナー」のような専用装備も登場するという。

それだけではない。高級車には警報装置やGPSトラッカーが搭載されていることもあり、盗難そのものに成功しても、安心して走り去れるとは限らない。

盗むための道具を準備し、セキュリティを突破し、追跡装置へ対処し、警察に見つからないよう運び、最終的に盗品商へ持ち込む。

ここまでくると、「車を盗む」というひとつの行為自体が、小さなミッションになっている。

RockstarはGTA6で新しい派手な要素を増やしているだけではない。これまでシリーズで何気なくやっていた行動をひとつずつ掘り下げ、それ自体をゲームとして成立させようとしているように見える。

武器の扱いも同様だ。

従来シリーズのように、ロケットランチャーからライフルまで大量の武器を見えないポケットへ入れて持ち歩く方式ではなく、大型武器は車両などに保管する必要がある。必要な武器をトランクから取り出して犯罪へ向かう、といった準備が発生する。

さらに銃をむき出しのまま街を歩けば、周囲のNPCもそれを認識する。

「犯罪が始まった瞬間だけ世界が反応する」のではなく、その前段階からプレイヤーの行動を世界が見ているのである。

---

## ジェイソンとルシアは、物語上の恋人だからずっと恋人とは限らない

今回の先行プレビューで、もうひとつ大きく印象が変わったのがジェイソンとルシアの関係だ。

これまで公開されてきたトレーラーだけを見ると、ふたりは恋人同士として物語を進める主人公に見える。しかし実際には、プレイヤーの行動によってふたりの関係性を変化させられることが明らかになっている。

![夕暮れの水辺で抱き合うジェイソンとルシアの公式スクリーンショット。奥にはヘリコプターとボートが見える](/images/news/gta6-official-screenshots-29/jason-and-lucia-13.webp)

関係を深めれば、手をつないだりキスをしたりと、より恋人らしい関係になっていく。一方、恋愛部分へあまり踏み込みたくないプレイヤーであれば、犯罪のパートナーに近い関係のまま進めることもできるという。

これは単なる恋愛ミニゲームではない。

ふたりの関係にはゲーム内のステータスが存在し、その深さによって一緒にできることにも変化が生まれる。

しかも、操作していない側の主人公がゲーム世界から消えているわけでもない。ジェイソンとルシアはそれぞれに日常を持ち、プレイヤーが別の主人公を操作している間も、自分の生活を続けている。

ミッションによっては操作キャラクターが固定されるが、状況によってはふたりの役割を選ぶこともできる。逃走時にジェイソンへ運転を任せてルシアで銃撃するのか、それとも逆にするのか。主人公がふたりいることを、ストーリーだけではなくゲームプレイへ落とし込もうとしている。

GTA Vでも3人の主人公を切り替えるシステムは大きな特徴だった。

GTA6ではそこからさらに一歩進み、「ふたりが同じ世界で同時に生きている」こと自体をシステムにしようとしている。

---

## ジム、食事、スマホ、銀行――「生活」がゲームになっていく

こうした変更を見ていくと、今回発表されたジムや食事の要素も単なる懐古要素ではないことが分かる。

![明るいジムでトレーニング器具に座り、グローブを着けたルシアの公式スクリーンショット](/images/news/gta6-official-screenshots-29/lucia-caminos-09.webp)

『GTA: San Andreas』を思い出させるように、GTA6では運動によって身体能力や体型が変化し、食生活によって体重にも影響が出る。街に存在するジムは背景ではなく、多くの器具を実際に使うことができる。

スマートフォンも同じだ。

GTA Vでは画面上のUIとして表示されていたスマホが、GTA6ではキャラクターが実際に手に持つ物として扱われる。そこからSNSを見たり、銀行を利用したり、車両を管理したりする。

現金と銀行口座も明確に分けられる。

大量の現金を持ち歩いている状態で警察に捕まったり、誰かに倒されたりすれば、その金を失う可能性がある。そのため犯罪で得た金を銀行へ預けることにも意味が生まれる。

ひとつひとつを見ると小さなシステムだ。

しかし、それらをまとめて見るとRockstarの狙いが見えてくる。

GTA6は、目的地へ向かってミッションを開始し、クリアしたら次のミッションへ進むだけのゲームではない。犯罪の準備をし、車を選び、武器を取り出し、街で人々の目を気にしながら行動し、稼いだ金を持ち帰り、その合間に食事をしたりジムへ行ったりする。

その「間の時間」までゲームにしようとしている。

---

## 「Vice CityはLos Santosの約2倍」という情報も出てきた

世界そのものの規模についても、先行プレビューから非常に気になる数字が出てきている。

ブラジルのクリエイターDavy JonesはRockstar Northを訪問した際、Rob Nelson氏へGTA6のマップ規模について質問したと説明している。その内容をもとにした海外報道では、Vice CityだけでもGTA VのLos Santosのおよそ2倍の規模があり、その周囲に広がる市街化された地域についても大幅に広くなっているとされる。

ただし、この数字には注意が必要だ。

Rockstarが公式Newswireで「GTA6のマップはGTA Vの何倍」と発表したわけではなく、比較対象によっても数字の意味は変わる。Vice Cityという都市だけの面積なのか、その周辺地域まで含めるのか。都市化された土地を比較するのか、マップ全体を比較するのかで印象はまったく違う。

そのため、現段階で「GTA6はGTA Vの○倍の広さ」と単純化するのは避けた方がいい。

ただ、ひとつ確かなのは、Vice Cityが巨大な都市として存在し、その外側にもKeys、湿地帯、郊外、別の街や集落などが広がるということだ。

Extended Lookで見えた都市の密度を考えると、GTA6の規模を単純な平方キロメートルだけで評価することにも、あまり意味がないのかもしれない。

---

## 「約80時間」という数字も、この世界を見れば少し意味が変わってくる

今回の情報解禁では、Rob Nelson氏が2026年2月にGTA6を通してプレイした際、約80時間かかったという発言も大きな話題になった。

ただし、これは「メインストーリーが80時間」と発表されたわけではない。

Nelson氏のプレイにはストーリーだけではなく、物語に影響を与える一部の任意目標も含まれていた。

GTA6 FEEDではこの「80時間」について「[「GTA6は80時間？」Rockstar開発者の発言が判明](/news/49)」で詳しく整理したが、今回明らかになった大量のシステムを見ると、なぜ一度のプレイにこれほど時間がかかる可能性があるのかも理解しやすくなってくる。

街へ出ればNPCがいる。

車ひとつ盗むにもやり方がある。

ジェイソンとルシアにはふたりの生活があり、関係性も変化する。

ジムへ行くこともできれば、海へ出ることもできる。犯罪で稼いだ金をどう扱うかまで考える必要がある。

「80時間」という数字だけを見れば非常に長いゲームに思える。

しかしRockstarが目指しているのは、80時間分のミッションを詰め込むことではないのだろう。

プレイヤーが目的地へ向かう途中で、何度も寄り道したくなる世界を作ること。

今回のプレビューから見えてきたのは、むしろそちらだ。

---

## Extended Lookで見えたのは、GTA6の表面だったのかもしれない

約26分のExtended Lookは、間違いなくGTA6についてこれまででもっとも多くのことを見せた公式映像だった。

それでも、今回Rockstar Northから出てきた情報を追っていくと、映像で確認できたものはゲームの一部分にすぎなかったようにも思えてくる。

* 犯罪をどう目撃されたのか
* 警察が自分について何を知っているのか
* NPCがこちらをどう見ているのか
* どんな車をどう盗むのか
* ジェイソンとルシアをどんな関係にするのか
* どんな身体を作り、どんな生活をし、どんな犯罪者になるのか

どれも映像だけでは伝わりにくいものばかりだ。

そして、これらをひとつにつなげて考えると、RockstarがGTA6で目指しているものも少しずつ見えてくる。

GTA Vより広い街を作ることでも、NPCの数を増やすことでも、グラフィックをさらにリアルにすることでもない。

プレイヤーが行ったことに世界が反応し、その反応を受けて次の行動を考える。その積み重ねによって「Leonidaで生活している」と感じられるゲームを作ること。

『Red Dead Redemption 2』でRockstarが追求した「世界の中で生きる感覚」を、現代の犯罪都市へ持ち込んだものがGTA6なのかもしれない。

Extended Look公開によってGTA6の情報不足は一気に解消されたように見える。

しかし実際には、ここからが始まりだ。

Rockstar Northへ招待されたメディアやクリエイターからは現在も追加情報が出始めている。GTA6 FEEDでは今後もそれらを追いながら、公式映像で確認できた事実、Rockstar開発者が直接説明した内容、クリエイター自身の感想や推測を分け、日本語で整理していく。

---

> **注記：** 本記事はRockstar Northで行われた先行プレビューをもとにしたファミ通ほか各メディアの報道と、公式映像「Grand Theft Auto VI: An Extended Look」の内容をまとめたもので、発言の日本語部分は編集部訳・要約を含む。正確な文言は各原文を参照してほしい。プレビューはハンズオン（試遊）ではなくハンズオフ形式であり、記載したシステムの詳細は製品版で変更される可能性がある。また、本記事の画像のうちAI生成のイメージ画像には、その旨を各画像のキャプションに記載している。それ以外はRockstar Games提供の公式素材である。`,
    titleEn:
      "Everything Extended Look Did Not Tell You About GTA6 — Police, Car Theft, and the Jason–Lucia Relationship",
    displayTitleEn:
      "Everything Extended Look Did Not Tell You About GTA6\nPolice, Car Theft, and the Jason–Lucia Relationship",
    descriptionEn:
      "The Rockstar North previews surfaced a wave of detail no amount of rewatching Extended Look would reveal: a wanted system built on being seen and reported rather than on committing the crime, a \"criminal profile\" that tracks what kind of criminal you are, car theft that now involves electronic keys and GPS trackers, and a Jason–Lucia relationship the player gets to shape.",
    aiSummaryEn: [
      "Alongside \"Grand Theft Auto VI: An Extended Look\" on August 28, 2026, coverage from the July previews at Rockstar North went live, surfacing system detail the video alone could not convey. Japanese outlet Famitsu visited the studio and interviewed Head of Development and Co-Studio Head Rob Nelson.",
      "The wanted system moves from \"commit a crime, get stars\" toward an investigation built on whether you were seen and reported. Masks, clothing and the car you used become information the police hold, and shedding that information is part of escaping. A \"criminal profile\" also tracks how you behave as a criminal, and NPCs do not always flee — armed civilians may fight back.",
      "Car theft now involves electronic keys, alarms and GPS trackers, with dedicated gear like a key cloner. Heavy weapons must be stored in vehicles rather than carried invisibly. Jason and Lucia's relationship shifts based on player behavior. Vice City is said to be roughly twice the size of Los Santos, though the comparison depends heavily on what is being measured.",
    ],
    fullContentEn: `# Everything Extended Look Did Not Tell You About GTA6 — Police, Car Theft, and the Jason–Lucia Relationship

August 28, 2026, 4:00 a.m. Japan time. "Grand Theft Auto VI: An Extended Look" went live on Netflix.

Its roughly 26-minute runtime was notable enough, but the Vice City and Leonida it showed carried a clearly different volume of information than any trailer before it. Jason and Lucia walk the streets, drive, shoot their way out of rooms, stop into stores and venues. GTA6 — which Rockstar Games describes as the largest and most immersive evolution in the series' history — finally started to look like a game you actually play.

But Extended Look was not the important part this time.

Roughly a month earlier, in July, Rockstar had invited media and creators from around the world to Rockstar North in Edinburgh, Scotland. Attendees did not get hands-on time; instead they watched Rockstar staff play GTA6 while being walked through systems that footage alone cannot convey.

From Japan, Famitsu visited the studio and interviewed Head of Development and Co-Studio Head Rob Nelson. Abroad, creators including TGG, El Rubius, Davy Jones and Mike ShowSha have confirmed visits of their own.

The result: once Extended Look was out, a wave of information arrived that no amount of rewatching the official video would surface.

Some outlets have broken the video and the previews down into lists of "150+ new details." The count is not the point. Follow what actually came out and one thing becomes clear — GTA6 is not simply "GTA V made bigger with better graphics."

Rockstar has rebuilt how crime itself plays, close to the foundations.

---

## Escaping the Police Is No Longer Just About Clearing Stars

Commit a crime in a GTA game and you get stars, and then you run from the police. It is one of the series' signature systems.

In GTA6, though, Rockstar is moving away from the gamey shorthand of "you committed a crime, therefore the police know" and toward something closer to an actual investigation.

Per Rockstar's explanation, what matters is less the crime itself than whether you were seen — and whether someone called it in.

![Official screenshot of Jason and Lucia holding up a store at gunpoint, the people inside with their hands raised](/images/news/gta6-official-screenshots-29/jason-and-lucia-05.webp)

Rob a store by walking up to the front entrance with a gun out, and a passerby who sees you may report it before the robbery even starts. Go in the back instead, deal with security like the cameras, and take the money without anyone noticing, and you may simply be able to leave.

What happens afterward is the more interesting part.

Commit the crime wearing a mask, and what the police have is "a suspect in a mask." Take the mask off while fleeing and you may become harder to find. But if they also know your clothing and the car you used, that alone is not enough. You need to switch vehicles, change clothes — peel yourself away from the information the police are holding.

In past GTA games, escaping mostly meant putting enough distance between yourself and the police and waiting for the stars to blink out. GTA6 adds a second question: "**what do the police actually know about me right now?**"

Getting away turns into something closer to a small stealth game.

---

## GTA6 Is Watching What Kind of Criminal You Are

Closely tied to that police system is a newly revealed concept: the "criminal profile."

*Red Dead Redemption 2* had an honor system that judged the protagonist's actions as good or bad. But a GTA game cannot function if committing crimes marks you as a villain — that is the whole premise.

So what GTA6 looks at is not whether you committed a crime, but what kind of criminal you behave like.

Do you use the minimum violence required to get what you came for and leave quickly? Or do you kill everyone in your way and trade fire with the police head-on? The same robbery can look completely different depending on the player.

GTA6 records that difference and reflects it in how the world responds.

Importantly, this is not a story about losing the ability to cause chaos. Rockstar has said it has no intention of pushing a "correct" way to play. You can still go loud, same as ever. It is just that the world now reacts more strongly to what you do.

That shift shows up in NPCs too.

Previously, pointing a gun at someone to take their car sent most NPCs running. In Leonida, the person on the other end will not necessarily be frightened. An armed civilian may fight back on the spot.

In other words, the player is no longer the only overwhelmingly powerful thing in GTA6.

The people who make up the city answer back.

The "living world" Rockstar is trying to build shows through in details like these.

---

## Stealing Cars — the Thing in the Title — Has Been Significantly Deepened

Car theft is the other genuinely interesting change.

For a series called Grand Theft Auto, actually stealing a car has always been remarkably simple. Stop a car on the road, drag the driver out, drive away. That was enough to land you a supercar.

GTA6 changes that baseline.

![Someone crouched at the driver's door of a luxury car in a night alley, inserting an electronic device, a tool case open at their feet, a lookout against the wall and a security camera overhead](/images/news/gta6-preview-roundup/keycloner-luxury-car.webp)

*Image: an AI-generated illustration made to help convey the story. It is not GTA6 footage or official Rockstar material.*

Older cars can still be taken relatively easily by something close to the old method, but newer and higher-end vehicles may require dealing with electronic keys, and dedicated gear such as a "key cloner" comes into play.

That is not all. Luxury cars can carry alarms and GPS trackers, so pulling off the theft does not guarantee you can drive away in peace.

Prepare the tools, defeat the security, deal with the tracker, move the car without being spotted by police, and finally get it to a fence.

At that point, "stealing a car" has become a small mission in its own right.

Rockstar is not simply adding flashy new features to GTA6. It looks more like the studio is taking actions the series treated as throwaway, digging into each one, and making it stand on its own as gameplay.

Weapons work the same way.

Rather than the traditional approach of carrying everything from a rocket launcher to a rifle in invisible pockets, heavy weapons need to be stored in vehicles. Pulling the weapon you need out of the trunk before heading into a job becomes part of the preparation.

And walk the streets with a gun out in the open, and nearby NPCs will register it.

The world is not only reacting the instant a crime begins — it is watching what you do in the run-up.

---

## Jason and Lucia Are Lovers in the Story, but Not Necessarily Lovers Throughout

The other thing this round of previews substantially changed is the impression of Jason and Lucia's relationship.

Going by the trailers alone, they look like a couple carrying the story together. In practice, it has now been confirmed that the player's actions can shift the relationship between them.

![Official screenshot of Jason and Lucia embracing by the water at sunset, with a helicopter and boats behind them](/images/news/gta6-official-screenshots-29/jason-and-lucia-13.webp)

Deepen it and they become more openly a couple — holding hands, kissing. A player who would rather not lean into the romance can keep things closer to a partnership in crime.

This is not a romance minigame.

Their relationship has an in-game status, and how deep it runs changes what the two can do together.

Nor does the protagonist you are not controlling simply vanish from the world. Jason and Lucia each have their own daily lives, and they keep living them while you are playing as the other one.

Some missions lock you to a specific character, but in certain situations you choose their roles. During an escape, do you leave the driving to Jason and shoot as Lucia, or the reverse? Having two protagonists is being pushed down into gameplay rather than staying a story device.

Switching between three protagonists was already a defining feature of GTA V.

GTA6 goes a step further and turns "these two are alive in the same world at the same time" into a system.

---

## Gyms, Food, Phones, Banks — Daily Life Becomes Gameplay

Seen against those changes, the gym and food elements revealed this time are clearly not just nostalgia callbacks.

![Official screenshot of Lucia sitting at a gym machine in workout gloves, daylight streaming in](/images/news/gta6-official-screenshots-29/lucia-caminos-09.webp)

In a way that recalls *GTA: San Andreas*, exercise changes your physical ability and your build, and diet affects your weight. The gyms in the city are not set dressing — you can actually use many of the machines.

The phone is the same story.

What was a screen-space UI in GTA V is now an object the character physically holds. From it you browse social media, use your bank, manage vehicles.

Cash and bank accounts are also clearly separated.

Get arrested or taken down while carrying a large amount of cash and you can lose it. That gives depositing your criminal earnings actual meaning.

Individually, these are small systems.

Put them together, though, and Rockstar's intent comes into view.

GTA6 is not a game about heading to a marker, starting a mission, clearing it and moving to the next one. You prepare for a job, pick a car, pull out a weapon, move through the city aware of who is watching, bring the money home — and eat and hit the gym in between.

It is trying to turn that in-between time into the game too.

---

## "Vice City Is About Twice the Size of Los Santos" Also Surfaced

On the scale of the world itself, a very tempting number came out of the previews.

Brazilian creator Davy Jones has said he asked Rob Nelson about GTA6's map scale during his Rockstar North visit. Coverage built on that reports that Vice City alone is roughly twice the size of GTA V's Los Santos, and that the urbanized area surrounding it is substantially larger as well.

That number needs care, though.

Rockstar has not announced on its official Newswire that "GTA6's map is N times GTA V's," and the meaning shifts entirely with what is being compared. The city of Vice City alone, or its surrounding region? Urbanized land, or the whole map? Each framing produces a different impression.

So at this stage, flattening it to "GTA6 is N times the size of GTA V" is best avoided.

What is certain is that Vice City exists as an enormous city, and that beyond it lie the Keys, wetlands, suburbs, and other towns and settlements.

Given the density of the city visible in Extended Look, judging GTA6's scale by square kilometers alone may not mean much anyway.

---

## The "About 80 Hours" Figure Reads Differently Once You See This World

This wave of coverage also made a lot of noise out of Rob Nelson's remark that playing GTA6 through in February 2026 took him roughly 80 hours.

But that was not an announcement that "the main story is 80 hours."

Nelson's playthrough included not only the story but some optional objectives that carry narrative consequences.

GTA6 FEED covered that figure in detail in "[\"Is GTA6 80 Hours?\" What a Rockstar Developer Actually Said](/en/news/49)" — and looking at the volume of systems revealed this time, it becomes much easier to see why a single playthrough could run that long.

Go out into the city and there are NPCs.

Even stealing one car has a method to it.

Jason and Lucia each have a life, and their relationship changes.

You can go to the gym, or head out to sea. You have to think about what to do with the money you make.

Taken purely as a number, 80 hours sounds like a very long game.

But what Rockstar is going for probably is not cramming in 80 hours of missions.

It is building a world where the player keeps wanting to take detours on the way to wherever they were going.

That is what this round of previews actually showed.

---

## What Extended Look Showed May Have Been the Surface

Those 26 minutes were, without question, the official video that has shown the most about GTA6 to date.

Even so, following what came out of Rockstar North afterward, what the footage confirmed starts to look like one slice of the game.

* How your crime was witnessed
* What the police know about you
* How NPCs see you
* Which cars you steal, and how
* What kind of relationship you build between Jason and Lucia
* What body you build, what life you live, what kind of criminal you become

None of these come across easily in footage.

String them together and what Rockstar is aiming for with GTA6 comes gradually into focus.

It is not building a bigger city than GTA V, or raising the NPC count, or pushing the graphics further.

It is making a game where the world responds to what you did, and you decide your next move based on that response — until the accumulation of it feels like living in Leonida.

The sense of "being alive inside a world" that Rockstar chased in *Red Dead Redemption 2*, carried into a modern crime city. That may be what GTA6 is.

Extended Look looks like it resolved GTA6's information drought in one go.

In reality, this is where it starts.

Media and creators invited to Rockstar North are still publishing additional detail. GTA6 FEED will keep following it — separating what the official footage confirms, what Rockstar developers explained directly, and what creators themselves felt or guessed.

---

> **Note:** This article draws on coverage from Famitsu and other outlets based on the previews held at Rockstar North, along with the contents of the official video "Grand Theft Auto VI: An Extended Look"; quoted passages are summarized or paraphrased rather than reproduced in full, so refer to the originals for exact wording. The previews were hands-off rather than hands-on, and the system details described here may change in the shipping game. Images that are AI-generated illustrations are labeled as such in their captions; the rest are official Rockstar Games material.`,
  },
  {
    id: 49,
    title:
      "「GTA6は80時間？」Rockstar開発者の発言が判明――実際は“メインストーリー80時間”ではない",
    displayTitle:
      "「GTA6は80時間？」Rockstar開発者の発言が判明\n実際は“メインストーリー80時間”ではない",
    description:
      "Rockstar North共同スタジオ責任者Rob Nelson氏が、自身のGTA6プレイに約80時間かかったことを明らかにした。海外では「GTA6のストーリーは80時間」という見出しが広がっているが、実際の発言は2026年2月に行った1回のプレイ時間であり、メインストーリーに加えて物語に影響する一部の任意目標も含まれていた。元の発言まで確認して整理する。",
    icon: "⏳",
    image: "/images/news/gta6-official/vice-city-02.webp",
    category: "topic",
    date: "2026-08-28",
    publishedAt: "2026-08-28 20:00",
    source: "The New York Times 取材（GameSpot・GamesRadar+ ほか報道）",
    sourceUrl: "https://www.gamespot.com/articles/gta-6-playthrough-can-last-roughly-80-hours/",
    relatedArticles: [48, 47, 46],
    aiSummary: [
      "Rockstar North共同スタジオ責任者のRob Nelson氏が、自身でGTA6を通してプレイした際に約80時間かかったことを明らかにした。The New York Timesの取材内容を報じた海外メディアによると、これは2026年2月に行った最後のプレイで、メインストーリーだけでなく「物語上の影響を持つ一部の任意目標（optional goals with narrative ramifications）」も含まれていた。",
      "つまりRockstarが「GTA6のメインストーリーは80時間です」と発表したわけではない。公式なクリア時間でも、平均クリア時間でもなく、開発者1人による1回のプレイ例にすぎない。発売は11月19日で調整も続いているため、製品版の固定された数字として扱うのは早い。",
      "むしろ重要なのは、任意コンテンツの一部が物語と結びつく可能性が示されたこと。The New York Timesの取材ではマップ全体が『Red Dead Redemption 2』のプレイ可能エリアの約3倍とも説明されており、寄り道を積極的に行うプレイヤーであれば80時間を大きく超える可能性がある。",
    ],
    fullContent: `# 「GTA6は80時間？」Rockstar開発者の発言が判明――実際は“メインストーリー80時間”ではない

『Grand Theft Auto VI』のゲームボリュームについて、発売前としてはかなり具体的な数字が出てきた。

Rockstar Northの共同スタジオ責任者Rob Nelson氏が、自身でGTA6をプレイした際、ひと通り遊び終えるまでに約80時間かかったことを明らかにした。

この数字を受け、海外では早くも「GTA6のストーリーは80時間」「GTA6クリアには80時間必要」といった見出しが広がっている。

ただし、ここには重要な注意点がある。

Rockstarが「GTA6のメインストーリーは80時間です」と発表したわけではない。

実際の発言を追っていくと、今回の80時間という数字は、Rob Nelson氏個人が2026年2月に行った1回のプレイ時間であり、そこにはメインストーリーだけでなく、物語に影響を与える一部の任意目標も含まれていたことが分かる。

---

## Rockstar North責任者のプレイは「約80時間」

今回の情報は、8月27日の「Grand Theft Auto VI: An Extended Look」公開に合わせて解禁されたRockstar Northへの取材から明らかになった。

![薄暗いスタジオでインタビューに答える開発者のイメージ。背後のモニターにLeonidaの街並みが映り、机には資料が広げられている](/images/news/gta6-80-hours-playtime/rob-nelson-interview.webp)

*画像: 内容を分かりやすく伝えるためのAI生成イメージ画像。実際のGTA6のゲーム画面・公式素材ではない。*

The New York Timesの取材内容を報じた複数の海外メディアによると、Rob Nelson氏が最後にGTA6を通してプレイしたのは2026年2月。

その際のプレイ時間について、Nelson氏は「**おそらく約80時間だった**」と説明している。

そして、そのプレイにはメインストーリーだけでなく、**物語上の影響を持つ一部の任意目標**（optional goals with narrative ramifications）も含まれていたという。

ここが今回もっとも重要な部分だ。

「80時間」という数字そのものはRockstar側の人物から出ているが、それはゲームの公式クリア時間でもなければ、メインストーリーだけを一直線に進めた場合の時間でもない。

より正確に表現するなら、

> Rockstar Northの責任者がメインストーリーと一部の重要な任意コンテンツを遊んだところ、約80時間かかった

という情報になる。

---

## 「メインストーリー80時間確定」ではない

発売前のゲームでは、「プレイ時間○○時間」という数字が非常に広まりやすい。

今回もすでに一部の記事やSNSでは「GTA6は80時間のゲーム」といった形で情報が拡散している。

しかし、現時点ではRockstarから、

* 「メインストーリーだけで80時間」
* 「平均クリア時間が80時間」
* 「すべてのプレイヤーが80時間程度になる」

といった発表は一切行われていない。

Nelson氏のプレイスタイルも一般ユーザーと同じとは限らない。

開発者としてゲームの構造やミッションを熟知しているため通常より速く進んだ可能性もあれば、逆に世界の細部を確認しながらプレイしていた可能性もある。

さらに、今回語られているのは2026年2月時点のプレイだ。発売は11月19日に予定されており、その後もゲームの調整は続いている。したがって、80時間という数字を製品版の固定されたクリア時間として扱うのは早い。

---

## 本当に注目したいのは「80時間」より“物語に影響する寄り道”

むしろ今回の発言で興味深いのは、プレイ時間そのものではないかもしれない。

Nelson氏の約80時間には、「**物語に影響を与える任意目標**」が含まれていたとされている。

つまりGTA6では、一部のサイドコンテンツが単なる金稼ぎや収集要素ではなく、本編の物語と何らかの形で結びつく可能性がある。

![Leonida Keysの沖に集まったボートとジェットスキー、デッキでくつろぐ人々を捉えた公式スクリーンショット](/images/news/gta6-official/leonida-keys-05.webp)

これは「サイドミッションをクリアするとエンディングが変わる」と確定したという意味ではない。

“narrative ramifications”という表現から確認できるのは、あくまで任意で行う一部の行動が、ストーリーやキャラクターなどに何らかの影響を持つというところまでだ。

複数の海外メディアも、この点を今回の80時間発言と合わせて取り上げている。

Extended Lookや先行プレビューでは、GTA6が単純にミッションを次々クリアしていくゲームではなく、Leonidaの日常そのものにプレイヤーを滞在させようとしていることも見えてきた。

街を歩き、人と交流し、運動をしたり、店に立ち寄ったり、犯罪を起こしたりする。

Nelson氏自身も、プレイヤーにはゲームを急いで攻略するのではなく、この世界の中で時間を過ごしてほしいという趣旨の考えを語っている。

そう考えると、GTA6のボリュームを「何時間でエンディングまで行けるか」だけで測ること自体が、Rockstarの狙いとは少し違うのかもしれない。

---

## 80時間より長くなるプレイヤーも当然出てきそう

もちろん、今回の発言からGTA6がかなり大規模な作品になる可能性は十分に読み取れる。

Nelson氏の約80時間にはメインストーリーと一部の任意目標しか含まれておらず、ゲーム内に存在するすべてのサイドコンテンツを消化したという説明ではない。

そのため、寄り道を積極的に行うプレイヤーであれば、80時間を大きく超える可能性もある。

![Grassriversの湿地帯を捉えた公式スクリーンショット。水路と木々の向こう、遠くにVice Cityの高層ビル群がかすんで見える](/images/news/gta6-official-screenshots-29/grassrivers-05.webp)

実際、Rockstarは今回のプレビューでGTA6のオープンワールドについても大規模な拡張を明らかにしており、The New York Timesの取材では、ゲーム全体のマップが『Red Dead Redemption 2』のプレイ可能エリアのおよそ3倍になるとも説明されている。

Extended Lookで確認できた大量のアクティビティや、各地で発生する出来事まで考えれば、「ストーリーを終えるまでの時間」と「GTA6を遊び尽くすまでの時間」はかなり違うものになりそうだ。

---

## なぜ「GTA6は80時間」という情報が広まったのか

今回少しややこしいのは、「80時間」という数字自体が間違っているわけではないことだ。

Rockstar North共同スタジオ責任者が実際に約80時間プレイした。

ここまでは事実。

しかし、

> 開発者の1回のプレイが約80時間だった

という情報が、

> GTA6のストーリーは80時間

へ変換されて拡散している。

海外メディアの中でも表現にはかなり差があり、「約80時間のプレイスルー」と慎重に報じているところがある一方、「80時間のストーリー」と強く表現する記事も出ている。

発売前のGTA6はひとつの数字だけでも大きなニュースになるため、今後も似たケースは増えていくだろう。

その意味でも、元の発言まで確認しておく必要がある。

---

## 現時点で分かっていることを整理

今回の「80時間」情報について、現時点で確認できる範囲を整理するとこうなる。

* Rob Nelson氏は2026年2月にGTA6を通してプレイした
* そのプレイ時間は約80時間だった
* メインストーリーを含んでいた
* 一部の任意目標もプレイしていた
* その任意目標の中には物語に影響するものがある
* Rockstarは「メインストーリーだけで80時間」とは発表していない
* 一般プレイヤーの平均クリア時間もまだ分からない

したがって現段階では、「GTA6は80時間」と断定するより、「ひとつのプレイ例として約80時間が確認された」と考えるのがもっとも正確だろう。

---

## GTA6は「クリアするゲーム」から、さらに「生活する世界」へ？

Extended Lookと今回の先行プレビューを見ていると、RockstarがGTA6で目指しているものも少しずつ見えてきた。

巨大なマップを用意するだけではなく、その中に大量のNPC、店舗、アクティビティ、ランダムな出来事、ジェイソンとルシアの関係性などを詰め込み、プレイヤーが目的もなく街を歩いている時間そのものをゲームにしようとしている。

![マリーナを背にしたジェイソンとルシアの公式スクリーンショット。奥には高層ビル群とヘリコプターが見える](/images/news/gta6-official-screenshots-29/jason-and-lucia-01.webp)

そう考えると、Rob Nelson氏の「約80時間」は、GTA6の長さを示すひとつの目安ではあっても、ゲーム全体のボリュームを表す数字ではない。

* メインストーリーだけを追うプレイヤー
* Leonidaを隅々まで探索するプレイヤー
* ジェイソンとルシアの関係を深めるプレイヤー
* サイドストーリーや犯罪、アクティビティに何十時間も費やすプレイヤー

同じGTA6でも、プレイ時間にはかなり大きな差が生まれる可能性がある。

現時点で言えるのはひとつ。

「GTA6のメインストーリーが80時間」と確定したわけではない。

しかし、Rockstar Northの責任者自身が、一部の寄り道を含めて約80時間を費やしたという事実は、GTA6がこれまで以上に長くプレイヤーをLeonidaへ留めるゲームになることを期待させるには十分な情報だ。

GTA6 FEEDでは今後もRockstar Northで行われた先行プレビューや海外クリエイター・メディアから公開される情報を追い、数字だけが一人歩きしているものについては元発言まで確認しながら整理していく。

---

> **注記：** 本記事はThe New York TimesがRockstar Northへの取材をもとに報じた内容と、それを扱ったGameSpot、GamesRadar+などの海外メディアの報道をもとにまとめたもので、発言の日本語部分は編集部訳・要約を含む。正確な文言は原文を参照してほしい。また、本記事の画像のうちAI生成のイメージ画像には、その旨を各画像のキャプションに記載している。それ以外はRockstar Games提供の公式素材である。`,
    titleEn:
      "\"Is GTA6 80 Hours?\" What a Rockstar Developer Actually Said — It Is Not an 80-Hour Main Story",
    displayTitleEn:
      "\"Is GTA6 80 Hours?\" What a Rockstar Developer Actually Said\nIt Is Not an 80-Hour Main Story",
    descriptionEn:
      "Rockstar North co-studio head Rob Nelson revealed that his own playthrough of GTA6 took roughly 80 hours. Headlines calling it an \"80-hour story\" are already spreading, but what he actually described was a single playthrough in February 2026 that covered the main story plus some optional goals with narrative ramifications. Here is what the original quote does and does not say.",
    aiSummaryEn: [
      "Rockstar North co-studio head Rob Nelson revealed that playing GTA6 through took him roughly 80 hours. Per outlets reporting on The New York Times' interview, that was his last playthrough, in February 2026, and it covered the main story plus \"some optional goals with narrative ramifications.\"",
      "So Rockstar did not announce that GTA6's main story is 80 hours long. It is neither an official completion time nor an average — it is one developer's single playthrough. With release set for November 19 and tuning still ongoing, it is too early to treat the number as fixed for the shipping game.",
      "The more interesting part may be the hint that some optional content ties into the story. The New York Times interview also states the overall map is about three times the playable area of Red Dead Redemption 2, so players who chase side content could go well past 80 hours.",
    ],
    fullContentEn: `# "Is GTA6 80 Hours?" What a Rockstar Developer Actually Said — It Is Not an 80-Hour Main Story

A surprisingly concrete number about how much game *Grand Theft Auto VI* contains has arrived, and it arrived before release.

Rob Nelson, co-studio head at Rockstar North, revealed that when he played GTA6 himself, getting through it took roughly 80 hours.

Off the back of that, headlines like "GTA6's story is 80 hours" and "GTA6 takes 80 hours to beat" are already spreading.

There is an important caveat, though.

Rockstar did not announce that "GTA6's main story is 80 hours long."

Follow the actual quote and it becomes clear: the 80-hour figure is one playthrough Rob Nelson personally did in February 2026, and it included not only the main story but also some optional objectives that carry story consequences.

---

## The Rockstar North Head's Playthrough Was "About 80 Hours"

The information came out of interviews with Rockstar North that lifted alongside the August 27 release of "Grand Theft Auto VI: An Extended Look."

![A developer answering questions in a dim studio, city footage of Leonida on the monitors behind him and reference material spread across the desk](/images/news/gta6-80-hours-playtime/rob-nelson-interview.webp)

*Image: an AI-generated illustration made to help convey the story. It is not GTA6 footage or official Rockstar material.*

According to several outlets reporting on The New York Times' interview, the last time Nelson played GTA6 through was February 2026.

Asked how long that took, he said it was "**probably about 80 hours**."

And that playthrough covered not just the main story but also **some optional goals with narrative ramifications**.

That is the most important part of this.

The number "80 hours" does come from someone at Rockstar — but it is not an official completion time, and it is not how long the main story takes if you drive straight down it.

Stated more precisely, what we have is:

> The head of Rockstar North played the main story plus some significant optional content, and it took him roughly 80 hours.

---

## This Is Not "Main Story Confirmed at 80 Hours"

With an unreleased game, a "playtime: XX hours" number travels extremely easily.

Sure enough, some articles and social posts have already reshaped this into "GTA6 is an 80-hour game."

But as of now, Rockstar has made no statement that:

* the main story alone is 80 hours
* the average completion time is 80 hours
* every player will land somewhere around 80 hours

Nelson's play style is not necessarily the same as a regular player's, either.

As a developer who knows the game's structure and missions inside out, he may have moved faster than usual — or he may have played slowly, checking details of the world as he went.

On top of that, what he described is a playthrough as of February 2026. Release is scheduled for November 19, and tuning has continued since. Treating 80 hours as a fixed completion time for the shipping game is premature.

---

## The Real Story Is Not "80 Hours" but Detours That Affect the Narrative

The interesting part of this quote may not be the playtime at all.

Nelson's roughly 80 hours are said to have included "**optional goals with narrative ramifications**."

In other words, some of GTA6's side content may not be purely about money or collectibles — it may connect to the main story in some form.

![Official screenshot of boats and jet skis gathered off Leonida Keys, with people hanging out on deck](/images/news/gta6-official/leonida-keys-05.webp)

This does not mean it is confirmed that "clearing side missions changes the ending."

All that phrase — *narrative ramifications* — establishes is that some optional actions carry some kind of influence over the story, the characters, or something along those lines.

Several outlets have picked up on this alongside the 80-hour line.

Extended Look and the early previews have also made it clear that GTA6 is not a game about clearing missions back to back; it wants to keep the player living inside Leonida's daily life.

Walking the streets, talking to people, working out, stopping by a store, committing a crime.

Nelson himself has expressed the view that he would rather players spend time in this world than rush to finish it.

Seen that way, measuring GTA6's volume purely by "how many hours to the credits" may be slightly beside the point Rockstar is aiming at.

---

## Plenty of Players Will Obviously Go Past 80 Hours

The quote does, of course, tell us GTA6 is likely to be a very large game.

Nelson's roughly 80 hours covered the main story and some optional objectives — it was not a claim that he cleared every piece of side content in the game.

So a player who actively takes detours could go well beyond 80 hours.

![Official screenshot of the Grassrivers wetlands, with Vice City's skyline hazy on the horizon beyond the waterways](/images/news/gta6-official-screenshots-29/grassrivers-05.webp)

Rockstar did in fact reveal a major expansion in scale for GTA6's open world in this round of previews: per The New York Times' interview, the overall map is around three times the playable area of *Red Dead Redemption 2*.

Factor in the sheer number of activities visible in Extended Look and the events that fire off across the map, and "time to finish the story" and "time to exhaust GTA6" look like very different numbers.

---

## Why "GTA6 Is 80 Hours" Spread

What makes this slightly awkward is that the number itself is not wrong.

The co-studio head of Rockstar North really did play for about 80 hours.

That much is fact.

But the information that

> a developer's single playthrough took about 80 hours

has been converted into

> GTA6's story is 80 hours

on its way around the internet.

Even among outlets, the framing varies a lot: some carefully report "a roughly 80-hour playthrough," while others go hard on "an 80-hour story."

Because a single number about pre-release GTA6 is enough to make big news, cases like this will keep piling up.

Which is exactly why it is worth going back to the original quote.

---

## What We Actually Know Right Now

Laying out what can be confirmed about this "80 hours" at this point:

* Rob Nelson played GTA6 through in February 2026
* That playthrough took roughly 80 hours
* It included the main story
* It also included some optional objectives
* Some of those optional objectives affect the narrative
* Rockstar has not stated that the main story alone is 80 hours
* The average completion time for regular players is still unknown

So rather than declaring "GTA6 is 80 hours," the most accurate reading at this stage is "one example playthrough came in at around 80 hours."

---

## From a Game You Finish to a World You Live In?

Watching Extended Look and this round of previews, what Rockstar is going for with GTA6 has started to come into focus.

It is not just about handing you an enormous map. It is about packing that map with NPCs, storefronts, activities, random events and the relationship between Jason and Lucia — and turning the time you spend walking around with no objective at all into the game itself.

![Official screenshot of Jason and Lucia with a marina behind them, high-rises and a helicopter in the distance](/images/news/gta6-official-screenshots-29/jason-and-lucia-01.webp)

From that angle, Rob Nelson's "about 80 hours" is one useful yardstick for GTA6's length, but not a figure that describes the game's total volume.

* Players who only follow the main story
* Players who explore every corner of Leonida
* Players who deepen the relationship between Jason and Lucia
* Players who sink dozens of hours into side stories, crime and activities

The same GTA6 could produce wildly different playtimes.

One thing can be said right now.

It has not been confirmed that "GTA6's main story is 80 hours."

But the fact that the head of Rockstar North himself spent roughly 80 hours, detours included, is more than enough to expect GTA6 to hold players inside Leonida longer than anything before it.

GTA6 FEED will keep following the Rockstar North previews and whatever creators and outlets abroad publish next — and when a number starts walking around on its own, we will keep going back to the original quote.

---

> **Note:** This article is based on what The New York Times reported from its interviews with Rockstar North, plus coverage of that reporting by outlets including GameSpot and GamesRadar+; quoted passages are summarized or paraphrased rather than reproduced in full, so refer to the originals for exact wording. Images that are AI-generated illustrations are labeled as such in their captions; the rest are official Rockstar Games material.`,
  },
  {
    id: 48,
    title:
      "「GTA VI: An Extended Look」を見た ― ジェイとルー、そして光の話",
    displayTitle:
      "「GTA VI: An Extended Look」を見た\nジェイとルー、そして光の話",
    description:
      "公開された「Grand Theft Auto VI: An Extended Look」を通しで見た記録。全編PS5撮影という光の説得力、ダイジェスト構成、ジェイとルーという呼び名から見える距離、ルシアの7種類の髪型、画面右上のアイコン、SLIM JIMとSMASH WINDOWの選択肢、そして「手をつなぐ」ボタンまで、気づいたことをそのまま書き出した。",
    icon: "🌃",
    image: "/images/news/gta6-extended-look-impressions/eyecatch.webp",
    category: "topic",
    date: "2026-08-28",
    publishedAt: "2026-08-28 12:00",
    source: "Rockstar Games「Grand Theft Auto VI: An Extended Look」",
    sourceUrl: "https://www.rockstargames.com/VI",
    relatedArticles: [47, 46, 39],
    aiSummary: [
      "「Grand Theft Auto VI: An Extended Look」を通しで見た感想。まず驚いたのは光の表現で、窓から差す光、水面の反射、濡れた路面に伸びるネオンが「きれい」ではなく「本物っぽい」領域に入っていた。映像の最後には全編PS5で撮影されたというテロップが出る。",
      "構成は一本のストーリーではなく複数エピソードのダイジェスト。銃撃戦のあとに家、テレビCM、ドライブという「間」を挟む編集で、ミッションの羅列ではなく生活として見えてくる。ルシアはJasonを「ジェイ」、Jasonはルシアを「ルー」、ドレクアンは二人を「ジェイ」「ルーニー」と呼んでいた。",
      "ゲームプレイ側では、手配度は星6つ、左上にHPと用途不明の青いメーター、右上に4つのアイコン。車のドア前では△のSLIM JIMと〇のSMASH WINDOWを選べ、インタラクションには「急かす」と「手をつなぐ」があった。ミニゲームらしきものは水泳・スカイダイビング・筋トレ・釣りなど多数確認できた。",
    ],
    fullContent: `# 「GTA VI: An Extended Look」を見た ― ジェイとルー、そして光の話

> **お断り：** この記事は、公式に公開された映像「Grand Theft Auto VI: An Extended Look」の内容に触れています。登場人物、場面、ゲームプレイの詳細を具体的に書いていますので、何も知らない状態で発売日を迎えたい方はご注意ください。

## 見終わってまず思ったこと

映像が終わって最初に頭に浮かんだのは、ストーリーの筋でもキャラクターの名前でもなく、「光」だった。

![空港のラウンジ。ガラス窓の外に駐機した小型ジェットが見え、窓から差し込んだ光が壁と床に硬い影を落としている](/images/news/gta6-extended-look-impressions/window-light-airport.webp)

*本記事に掲載している画像はすべて「Grand Theft Auto VI: An Extended Look」本編からのスクリーンショットである。*

反射の仕方、差し込み方が、とにかくリアルなのだ。窓から入ってくる光、水面に跳ね返る光、夜のネオンが濡れた路面に伸びる光。景色を切り取ったワンカットだけを見せられたら、実写映像だと言われて信じてしまいそうなショットが何度もあった。ゲームの映像を見て「きれいだ」と思うことはこれまでにも何度もあったけれど、今回感じたのは「きれい」ではなく「本物っぽい」という方向の驚きで、この二つはたぶん似ているようで別物だ。

そして最後、すべてが終わったあとに出たテロップ。全編がPS5で撮影された映像である、と。あれを見た瞬間に、それまで頭のどこかにあった「まあプロモーション用に作り込んだ映像だろう」という保険が外れた。日本語字幕付きで最初から最後まで通して見られたのもありがたかった。

以下、見ながら取ったメモをもとに、気づいたことを書いていく。

---

## 物語は一本の線ではなく、ダイジェストだった

見る前は、トレーラーの延長線上でストーリーが一本つながって語られるものを想像していた。実際は違った。いろんなエピソードのダイジェスト、という感触に近い。

始まりはブービーのお使いだ。Jasonがレイモンドという人物のところへブツを回収しに行き、その最中にエルネストから「警察が踏み込んでくる」という電話が入る。そして実際に踏み込まれ、そのまま銃撃戦のプレイシーンへとつながっていく。ここで早くも、ムービーとプレイの境目がほとんど意識されない作りになっていることが分かる。

![暗いオフィスでアサルトライフルを構え、白い作業着の敵と撃ち合う場面。画面右上に残弾数「28 48」とライフルのアイコンが出ている](/images/news/gta6-extended-look-impressions/office-shootout.webp)

面白いのは、その後の流れだ。銃撃戦が終わると、ルシアとJasonの家のシーンになる。そこにCMが挟まり、車でのドライブシーンがあって、それからブライアン夫妻とのレストランのシーンへと移っていく。

つまり、エピソードとエピソードの間が、ぶつ切りの場面転換で繋がれているわけではない。銃撃戦の緊張のあとに、家があり、テレビのCMがあり、車で流す時間がある。この「間」の置き方を見ていて、これはストーリーやミッションをダイジェストで見せているのだな、と腑に落ちた。事件と事件のあいだにある日常を、ちゃんと挟んでくる編集なのだ。

その後も、ラウルに呼ばれて逃走の手助けをさせられ、強盗をやり、護衛の任務のような場面があり、人質に紛れている場面がある。時系列を追って一つの事件を見せるのではなく、複数のエピソードのおいしいところを、生活の断片で繋ぎながら並べていく構成だった。

おかげで「この二人がどういう順番で何をするのか」はほとんど分からないままなのだけれど、逆に「この街ではこれだけ多様なことが起きる」という幅の広さは、一本道のダイジェストより遥かによく伝わってきたと思う。そして家とCMとドライブが挟まるおかげで、その多様さが「ミッションのリスト」ではなく「一人の人間の生活」として見えてくる。

だから、この映像を「物語の予告」として見ると肩透かしを食らう。「世界と手触りの見本市」として見ると、情報量が多すぎて処理が追いつかない。私は完全に後者だった。

---

## ジェイとルー ― 呼び名から見える距離

今回いちばん印象に残ったのは、実は派手なアクションではなく、二人の呼び合い方だった。

ルシアはJasonのことを「ジェイ」と呼んでいた。Jasonはルシアのことを「ルー」と呼んでいた。

Jason、Luciaというフルネームではなく、短く縮めた愛称で呼び合っている。これだけで、二人の間にある距離の近さが伝わってくる。しかも一度きりの言い間違いのような扱いではなく、自然に定着した呼び方として何度も出てくる。

さらに面白いのが、ドレクアンも二人を「ジェイ」と「ルーニー」と呼んでいた点だ。ドレクアンから見てもこの二人は「JasonとLucia」ではなく愛称で呼ぶ相手であり、しかも「ルー」ではなく「ルーニー」という、ひとひねり入った呼び方をしている。呼び名が人によって微妙に違う、というのは、その人物が複数の人間関係の中に置かれている証拠だ。こういう細部で世界の厚みを出してくるのは、素直にうまいと思った。

---

## ルシアという人物 ― 髪型が語るもの

ルシアについて、映像を見ながら思わずメモを取り続けてしまったのが髪型だ。ストレートからウェーブまで、本当にさまざまなバリエーションが出てくる。数えられただけでも以下の通り。

* コーンロウ
* お団子
* ハーフアップっぽい髪型
* ポニーテール
* おさげ髪
* 白いボブ
* 黒いサラサラのボブ

七種類である。しかも「白いボブ」と「黒いサラサラのボブ」が別々に出てくるあたり、色まで変えている。

これがプレイヤーによるカスタマイズの幅を示しているのか、それとも物語の中で時間が経過していることを示しているのか、映像だけでは判断がつかなかった。ただ、コーンロウとポニーテールと白いボブが同じ人物として並んでいるのを見ていると、それなりに長い時間の話をしようとしているのではないか、という気はしてくる。ここは完全に私の推測でしかないけれど。

そしてもうひとつ、ルシアで痺れたシーンがある。人質に紛れながら、スマホでJasonに犯人の状況を伝える場面だ。自分は動けない、でも情報だけは外に出せる。あの状況で頭が回るというキャラクター性が、説明台詞を一切使わずに一つの行動だけで示されている。あそこはかなり熱かった。

![青いネオンに照らされた室内で、うつむいてスマートフォンを操作するルシア。画面左に「After Czr, he's in saferoom, 10 guys, auto weps, explosives, sound military...」というメッセージが表示されている](/images/news/gta6-extended-look-impressions/lucia-phone-message.webp)

もうひとつ、これも彼女の性格が出ていたと思うのが、ルシアが運転しながらJasonが後部座席に移動して銃で応戦するシーン。運転と射撃を二人で分担するという、二人組ならではの絵。ここは後述するUIの話ともつながってくる。

---

## 周りの人間たち

ブライアンは、夫妻でレストランに現れる。昔はずいぶんお盛んだったらしい、という話が出てくる、いわば「引退した先輩」的な立ち位置に見えた。

![高層階のテラスで向かい合う男二人。手前は黒シャツにサングラスの主人公、奥はサングラスと葉柄のシャツ姿で葉巻を持った年配の男。背後にLeonidaの街並みが広がる](/images/news/gta6-extended-look-impressions/rooftop-conversation.webp)

そのブライアンがJasonに「辞め時が肝心だ」と語るシーンがある。文脈からして、これは人生訓というより、強盗という商売について「引き際を見失うなよ」と諭している場面だと受け取った。

正直に書くと、あのやり取りを聞いた瞬間、ボニー＆クライドのような結末になるのではという予感が一瞬よぎった。引き際を説く先輩が序盤に出てくる物語で、その忠告どおりに引ける主人公を私はあまり見たことがない。もちろん何の根拠もない直感なので、外れてくれてもまったく構わないのだけれど。

ラウルはスペイン語で話していた。そして、ルシアのことを「求めている人材だ」というような言い方をしていた。この言い回しが引っかかっている。求めている、ということは、彼の側に何かの仕事があり、そこにルシアを引き入れたいということだ。とすると、ラウルの方が雇い主で、二人とは雇う・雇われるの関係にあるのかもしれない。逃走の手助けを「させられていた」感じも、これと符合する。

そして、公式サイトのキャラクター紹介には見当たらなかった名前が、映像の中には何人か出てくる。ここは分かった範囲だけ書いておく。

**レイモンド**は、冒頭のブービーのお使いでJasonが訪ねていった相手だ。ブツを回収する先の人物、ということになる。

**エルネスト**は、そこに警察が踏み込んでくると電話で知らせてきた人物。顔よりも先に声で登場する役どころで、この二人がいきなり冒頭に出てくるあたり、Jasonの生活圏の中にはこういう相手が普通にいるのだと分かる。

**アンドレス・デ・レオン**は金持ちの男性で、彼を護衛する任務のようなシーンがあった。人物像ははっきり描かれないのだけれど、佇まいや扱われ方からして、大きな企業のCEOあたりではないかという印象を受けた。金持ちを護衛する側に回る仕事がある、というのは、これまでの「奪う側」一辺倒とは少し毛色が違って見えて面白い。

そして**ティーナ**という美しい女性。彼女がアンドレス・デ・レオンとの引き合わせをしてくれる。つまり、上流の人間と繋いでくれる立場の人物だ。街の底の方にいる二人が、なぜ企業のトップらしき男の護衛に関わることになるのか。その接続点にティーナがいる、という構図だけは見えた。

---

## 車に乗っているだけで楽しそう

映像を見ていて、いちばん「これは自分でやりたい」と思ったのがドライブだった。

まず、車に乗り込んだときにちゃんと車体が沈む。人ひとりぶんの重さが、サスペンションを通して車の姿勢に反映される。言われなければ気づかないかもしれない、けれど気づいてしまうと他が気になって仕方なくなる類のディテールだ。

そして走り出してからの映像が、本当に車に乗っているときの感覚に近い。景色の流れ方、車体の揺れ方。極端な話、これはドライブするだけで楽しめてしまうのではないかと思った。目的地に向かうための移動手段ではなく、走ること自体が目的になりうる乗り心地に見えた。

![青空の下、橋を渡る赤いオープンカーを後方から見た画面。左右に水面と対岸の街並みが広がり、画面左下にミニマップと「1.55 mi」の表示がある](/images/news/gta6-extended-look-impressions/bridge-drive-daylight.webp)

もちろん、穏やかな運転ばかりではない。カーチェイスのシーンもかなりリアルだった。レース要素も、車のレースからモトクロスまで確認できた。

そして印象的だったのが、強盗のあと、逃走に使った車を火炎瓶で燃やすシーン。火の回り方、そして炎に炙られて塗装が剥げていく様子が、ぞっとするほどリアルだった。あそこは物理演算というより質感の表現の勝利だと思う。

もうひとつ、笑ってしまったのが、盗んだ車のトランクに配信者が入っていて、ライブ配信をしながら逃走しているシーン。奪った車に人が積まれていた、というだけでも面白いのに、その人が配信中というのがいかにも今っぽい。この手のブラックユーモアが健在なのは嬉しかった。

---

## 暴力の手触り ― 強盗とガラスの話

強盗シーンは総じてリアルだった。そして強盗バッグは健在。あの見慣れたバッグが出てきた瞬間は、ちょっと嬉しくなった。

武器はピストル、ショットガン、アサルトライフル、そしてサブマシンガンらしきものが確認できた。

![立体駐車場で炎上する車と、それを見つめるパーカー姿のルシア。画面右上には星6つの手配度と3つのアイコンが並んでいる](/images/news/gta6-extended-look-impressions/burning-car-garage.webp)

映像の途中で、割れたガラスの表現のためにエンジニアが3年をかけたという話が出てくる。3年という数字だけ聞くと「そこにそんなに」と思ってしまうのだが、実際にガラスが割れるシーンを見ると納得する。割れ方、飛び散り方、ひびの入り方が、明らかに「ガラスが割れる映像」として自然だった。3年かけたと言われたあとにその成果を見せる、という映像の構成も含めて、うまい見せ方だったと思う。

あと、中指を立てているシーンもあった。こういうところは変わらないな、と安心した。

---

## UIと操作 ― 実際どう遊ぶのか

映像レポートとしては地味な部分だけれど、個人的にはここがいちばん食い入るように見てしまった。ゲームプレイの映像から読み取れた画面情報を整理しておく。

### 画面レイアウト

左下にミニマップ。手配度が上がると、赤と青で点滅表示になる。パトカーの回転灯を思わせる演出で、視線を落とさなくても状況が変わったことが分かる作りだと思う。

左上にHPらしきメーター。その下に青いメーターがもう一本。この青が何なのかは映像からは判断できなかった。

右上に手配度などの情報。手配度は星6つまで確認できた。その下に4つのアイコンが並んでいて、二人組らしきマーク、ハンガー、人らしきマーク、車のマーク、という並びだった。さらにその下に、装備している武器のアイコンと、弾の装填数が表示されていた。

星の下のあの4アイコンが何を意味するのかは、正直まったく分からない。ただ、ハンガー（＝服）と車のマークが手配度のすぐ下に並んでいるという配置は、なんとなく意味ありげに見えた。

![昼の大通りで車越しにパトカーへ発砲する場面。画面右上に星4つの手配度、その下に4つのアイコン、さらに残弾数「37 250」とライフルのアイコンが縦に並んでいる](/images/news/gta6-extended-look-impressions/hud-wanted-icons.webp)

### エイム

エイムのレティクルは、武器によって丸く表示されたりと、いくつかパターンがありそうだった。武器ごとに見え方が変わるということは、精度や拡散の違いが視覚的に示されているのだと思う。

![暗いオフィスでアサルトライフルを構えた画面。中央に丸いレティクルが表示され、左上にはHPらしきメーターと青いメーターが並ぶ](/images/news/gta6-extended-look-impressions/hud-aim-reticle.webp)

### ボタンプロンプト

ここがいちばん情報量が多かった。確認できたものを並べる。

* **L1**：死体から武器を漁る
* **△**：ノックする
* **△**：バッグを回収する
* **〇連打**：ルシアが敵に押さえつけられている状態から逃れる（いわゆるQTE、クイックタイムイベント）

![解体途中の室内。床に置かれた赤いバッグに「△ BAG」のプロンプトが重ねて表示されている。右上はピストルのアイコンと残弾数「17 80」で、中央のレティクルは丸ではなく短い線](/images/news/gta6-extended-look-impressions/prompt-bag-pickup.webp)

![地面に押さえつけられた人物を上から見下ろした画面。〇ボタンと△ボタンのプロンプトが2つ表示されている](/images/news/gta6-extended-look-impressions/prompt-qte-struggle.webp)

そして、車のドアの前で表示されていた選択肢が特に面白かった。

* **△ SLIM JIM**（車の解錠用工具、スリムジム）
* **〇 SMASH WINDOW**（窓ガラスを叩き割る）

同じ「車に乗る」という行為に、静かに開ける方法と、手っ取り早く割る方法の二つが用意されている。そしてRでこじ開けていた。急いでいるときは窓を割ればいい、でも人目があるなら工具を使う ― という判断をプレイヤーに委ねる設計に見えて、これは相当良い。

そしてもうひとつ、私が「おっ」と声を出したのがこれだ。

* インタラクションプロンプト：**急かす**
* インタラクションプロンプト：**手をつなぐ**

手をつなぐ、である。銃を撃ち、車を燃やし、人質に紛れる同じゲームの中に、手をつなぐためのボタンがある。この落差こそが今回の映像でいちばん象徴的だったかもしれない。ジェイとルーの関係性を、システムのレベルで表現しようとしているように見えた。

---

## 遊びの幅 ― たぶん、めちゃくちゃ広い

映像の端々に、明らかにミニゲームやアクティビティらしきものが映り込んでいた。断定はできないけれど、以下は実装されているのではないかと思っている。

* 水泳
* バスケットボール
* スカイダイビング
* 筋トレ（L2とR2を押してバーベルを上げるらしい表示が見えた）
* スキューバダイビング
* 水上バイク
* カヌー
* 釣り
* 射撃場のような場所

![ジムのベンチプレスでバーベルを持ち上げる女性。バーに「L2」と「R2」のボタン表示が重ねられている](/images/news/gta6-extended-look-impressions/gym-bench-press.webp)

筋トレのボタン表示まで見えてしまったので、これはかなり確度が高いと思っている。水泳・スキューバ・水上バイク・カヌー・釣りと、水絡みだけで5つある。舞台の性格を考えれば当然かもしれないけれど、水中と水上がここまで充実しているのは期待していい。

VRゴーグルらしきものも出てきた。ゲームの中でゴーグルをかけて何をするのか、想像するとちょっと楽しい。

動物は犬、イルカ、カモメが確認できた。イルカが出てくるということは、やはり水中には相応のものが用意されているのだろう。

街の要素としては、ストリップバーやクラブのシーンがあり、モノレールが確認できた。逃走の途中でメカニック（整備工場）に立ち寄るシーンもあった。追われている最中に車をどうにかしに行く、というのは、前述のHUDにあった車のアイコンとつながる話かもしれない。

---

## 広告と街の解像度

この作品の楽しみのひとつが街に貼られた広告やCMなのだけれど、今回もしっかりあった。

プレイリーサンドイッチボックスミール、たったの30000キロカロリーというCM。「たったの」で30000である。この一言だけで、この世界の何もかもが分かる気がする。

![「THE PRAIRIE SANDWICH BOX MEAL」の広告。左に「ONLY 30,000 CALORIES」の文字、右には大量のハムを挟んだサンドイッチとフライドポテト、ルートビアのジョッキが並ぶ](/images/news/gta6-extended-look-impressions/prairie-sandwich-ad.webp)

アングスティパンのCMもあった。薬のCMだろうか。名前の響きだけで既におかしい。

あと、街には日本人っぽいNPCもいた。群衆に混じっているだけなのだけれど、いろんな人がいる街として作られているのだな、と感じた瞬間だった。

---

## まとめ ― 見終えて残ったもの

情報量が多すぎて、一度見ただけでは処理しきれなかったというのが正直なところだ。だから今回のメモも、髪型を数えたり、画面右上のアイコンを数えたり、われながら妙な方向に細かくなっている。

それでも、見終わったあとに残った感触ははっきりしている。

ひとつは、映像の説得力。光と、ガラスと、火と、沈むサスペンション。3年かけたガラスの話が象徴的だけれど、目立たない部分の作り込みが、全体の「本物っぽさ」を支えている。それが全編PS5で撮影されたものだというのだから恐れ入る。

もうひとつは、ジェイとルーの関係。呼び名の縮め方、運転と射撃の分担、人質に紛れながらのスマホ、そして「手をつなぐ」ボタン。この二人をどう見せたいのかが、映像とシステムの両方から一貫して伝わってきた。

そして最後に、ブライアンの「辞め時が肝心だ」という言葉が、どうにも耳に残っている。あれが単なる先輩の小言で終わるのか、それとも物語全体の伏線なのか。ボニー＆クライドのような結末を思い浮かべてしまった自分の勘が外れることを、今のところは願っている。

---

> **注記：** 本記事は「Grand Theft Auto VI: An Extended Look」を視聴しながら取ったメモをもとにした個人的な視聴記録であり、Rockstar Gamesの公式発表ではない。人物名の表記や台詞は日本語字幕にもとづく編集部の書き起こし・要約を含み、UIやミニゲームに関する記述には筆者の推測が含まれる。また、本記事に掲載している画像はすべて「Grand Theft Auto VI: An Extended Look」本編からのスクリーンショットであり、著作権はRockstar Gamesに帰属する。`,
    titleEn:
      "Watching \"GTA VI: An Extended Look\" — Jay, Lou, and the Light",
    displayTitleEn:
      "Watching \"GTA VI: An Extended Look\"\nJay, Lou, and the Light",
    descriptionEn:
      "A running record of watching \"Grand Theft Auto VI: An Extended Look\" end to end. The persuasive power of its light — all of it captured on PS5 — the digest-style edit, the closeness you can hear in \"Jay\" and \"Lou,\" Lucia's seven hairstyles, the icons in the top-right corner, the SLIM JIM / SMASH WINDOW choice, and a button whose only job is to hold hands.",
    aiSummaryEn: [
      "Impressions from watching \"Grand Theft Auto VI: An Extended Look\" straight through. The first thing that landed was the light — sun through a window, reflections off water, neon stretching down a wet street — which crosses from \"pretty\" into \"this looks real.\" A card at the very end states the whole thing was captured on PS5.",
      "It is not one continuous story but a digest of several episodes, and the edit deliberately places a house, a TV commercial and a drive between the shootouts, so the variety reads as one person's life rather than a mission list. Lucia calls Jason \"Jay,\" Jason calls Lucia \"Lou,\" and Dre'Quan calls them \"Jay\" and \"Loonie.\"",
      "On the gameplay side: the wanted level goes to six stars, the top-left has a health bar plus a second blue meter of unknown purpose, and four icons sit in the top-right. At a car door the game offers Triangle for SLIM JIM and Circle for SMASH WINDOW, and the interaction prompts include \"hurry up\" and \"hold hands.\" Swimming, skydiving, weight training and fishing all appear to be in.",
    ],
    fullContentEn: `# Watching "GTA VI: An Extended Look" — Jay, Lou, and the Light

> **Heads up:** This article discusses the contents of the officially released "Grand Theft Auto VI: An Extended Look," including specific characters, scenes and gameplay details. If you would rather reach release day knowing nothing, stop here.

## The First Thing I Thought When It Ended

When the video finished, the first thing in my head was not the plot or a character's name. It was the light.

![An airport lounge, a small jet parked outside the glass, light through the windows throwing hard shadows across the wall and floor](/images/news/gta6-extended-look-impressions/window-light-airport.webp)

*Every image in this article is a screenshot from "Grand Theft Auto VI: An Extended Look."*

The way it reflects, the way it falls into a room — it is simply real. Light coming through a window, light bouncing off water, neon at night stretching across a wet road. There were several shots where, if you handed me a single frame and told me it was live-action footage, I would have believed you. I have thought "that's beautiful" about game footage plenty of times before. What I felt this time was not "beautiful" but "that looks real," and those two reactions are less alike than they seem.

Then, after everything was over, the card at the end: all of this was captured on PS5. The moment I saw that, the little insurance policy I had been holding in the back of my head — *well, it's a promo reel, they polished it* — came off. Being able to watch the whole thing start to finish with Japanese subtitles was welcome, too.

What follows is written from the notes I took while watching.

---

## It Is Not One Storyline. It Is a Digest.

Going in, I expected something in the same vein as the trailers, telling one continuous story. It was not that. It felt much closer to a digest of a lot of different episodes.

It opens with an errand for Boobie. Jason goes to a man named Raymond to pick up a package, and midway through, a call comes in from Ernesto: the police are coming in. They do come in, and it flows straight into a playable shootout. Right there, in the opening minutes, you can see that the seam between cutscene and gameplay is barely perceptible.

![Trading fire with an enemy in white coveralls in a dark office, the ammo count "28 48" and a rifle icon in the top-right corner](/images/news/gta6-extended-look-impressions/office-shootout.webp)

What is interesting is what comes next. When the shootout ends, we cut to Lucia and Jason's house. A commercial plays. There is a driving scene. Then we move to a restaurant scene with Brian and his wife.

In other words, the episodes are not welded together by abrupt scene changes. After the tension of a shootout there is a home, a TV ad, and time spent cruising in a car. Watching how that breathing room is placed, it clicked for me: this is a digest of story and missions, and the edit is deliberately keeping the ordinary life that sits between the incidents.

From there Raul calls them in and has them help with an escape, there is a robbery, there is something that looks like a protection job, and there is a scene where Lucia is hiding among hostages. Rather than following one incident through time, the video lines up the best parts of several episodes and stitches them together with fragments of daily life.

The result is that I still have almost no idea what these two do or in what order — but the sheer range of "look how many different things happen in this city" came across far better than a single-thread digest would have managed. And because the house, the commercial and the drive are sitting in between, that range reads as one person's life rather than a list of missions.

So if you watch this as a story trailer, you will come away underwhelmed. If you watch it as a showcase of a world and how it feels to touch, there is more information than you can process. I was firmly in the second camp.

---

## Jay and Lou — the Distance You Can Hear in a Nickname

The thing that stuck with me most was not the big action. It was how the two of them address each other.

Lucia calls Jason **"Jay."** Jason calls Lucia **"Lou."**

Not the full Jason and Lucia, but clipped, familiar nicknames. That alone tells you how close they are. And it is not treated as a one-off slip — it recurs, settled and natural.

What makes it better is that Dre'Quan calls them **"Jay" and "Loonie."** From where he stands these two are not "Jason and Lucia" either, they are people you call by a nickname — and his version of Lucia's is not "Lou" but "Loonie," with a twist on it. A name that shifts slightly depending on who is saying it is evidence of a person who exists inside more than one relationship. Building the thickness of a world out of details like that is, frankly, very well done.

---

## Lucia — What the Hairstyles Say

The thing I could not stop taking notes about was Lucia's hair. Straight to wavy, the variations really do keep coming. Here is what I managed to count.

* Cornrows
* A bun
* Something like a half-up
* A ponytail
* Braided pigtails
* A white bob
* A sleek black bob

Seven. And the fact that "white bob" and "sleek black bob" show up separately means the color is changing too.

Whether that indicates the breadth of player customization or the passage of time within the story, I could not tell from the video alone. Still, watching cornrows and a ponytail and a white bob line up as the same person does leave you suspecting this is a story that covers a fair stretch of time. That is pure speculation on my part.

There is one more Lucia scene that got to me: hidden among the hostages, using her phone to tell Jason what the robbers are doing. She cannot move, but she can still get information out. Her ability to keep thinking in that situation is conveyed with a single action and not one line of expository dialogue. That part was genuinely thrilling.

![Lucia bent over her phone in a room lit blue, a message on screen reading "After Czr, he's in saferoom, 10 guys, auto weps, explosives, sound military..."](/images/news/gta6-extended-look-impressions/lucia-phone-message.webp)

The other moment I think shows her character is the one where Lucia drives while Jason moves to the back seat and returns fire — the two of them splitting driving and shooting between them, a shot only a duo could produce. That connects to the UI section further down.

---

## The People Around Them

Brian turns up at a restaurant with his wife. There is talk of how busy he used to be back in the day — he reads as the retired veteran of the group.

![Two men facing each other on a high terrace: the protagonist in a black shirt and sunglasses, and an older man in sunglasses and a leaf-print shirt holding a cigar, with Leonida spread out behind them](/images/news/gta6-extended-look-impressions/rooftop-conversation.webp)

There is a scene where Brian tells Jason **"knowing when to quit is what matters."** From the context, I took that less as life advice and more as a lecture about the robbery business: don't lose sight of your exit.

Honestly, the moment I heard that exchange, a flash of *this is going to end like Bonnie and Clyde* went through my head. In stories where a veteran shows up early to preach about getting out, I have rarely seen a protagonist who actually takes the advice. There is no basis for that hunch whatsoever, and I would be perfectly happy to be wrong.

Raul speaks Spanish. And he describes Lucia in terms of being someone he wants — the kind of talent he is looking for. That phrasing is nagging at me. Wanting her means there is work on his side and he wants to pull her into it. Which would make Raul the employer and the two of them the hired hands. The sense that they were *made* to help with the escape fits that reading.

There are also several names in the video that I could not find in the official site's character section. Here is what I could make out.

**Raymond** is the man Jason goes to see during Boobie's errand at the start — the person the package is being collected from.

**Ernesto** is the one who calls to warn that the police are moving in. He arrives as a voice before a face, and the fact that both of these men appear right at the opening tells you people like this are simply part of Jason's world.

**Andres de Leon** is a wealthy man, and there is what looks like a job protecting him. His character is never spelled out, but from his bearing and how he is treated, I got the impression of a CEO of a large company. That there is work to be had guarding the rich, rather than only robbing them, looks like a change of flavor from the series' usual one-way street, and an interesting one.

And then there is **Tina**, a beautiful woman who arranges the introduction to Andres de Leon — the person who connects them upward. Why two people near the bottom of the city end up involved in protecting what looks like a corporate boss, I do not know. But I can at least see that Tina is the junction.

---

## Just Being in a Car Looks Fun

The thing that most made me want to do it myself was the driving.

First: when you get into a car, the body actually settles. One person's weight registers in the car's posture through the suspension. It is the kind of detail you might never notice unless someone pointed it out — and then can never stop noticing.

And once you are moving, the footage really does feel like being in a car. The way the scenery flows past, the way the body sways. To put it bluntly, I think you could enjoy this game just by driving. It looks like a ride where driving is the point, not a means of getting to a destination.

![A red convertible seen from behind as it crosses a bridge under a clear sky, water on both sides, with the minimap and a "1.55 mi" readout in the bottom-left corner](/images/news/gta6-extended-look-impressions/bridge-drive-daylight.webp)

Not all of it is calm, of course. The car chases were quite realistic too. Racing is in there as well, from car races to motocross.

The scene that stayed with me was the one after a robbery, torching the getaway car with a Molotov. The way the fire spreads and the way the paint blisters off under the flames were unsettlingly real. That one strikes me as a victory of material rendering more than physics.

The other one that made me laugh: a stolen car with a streamer in the trunk, live-streaming while they make their getaway. A person in the back of a car you just took is funny enough on its own; the fact that they are mid-broadcast is very of-the-moment. I was glad to see this brand of black humor is alive and well.

---

## The Texture of Violence — Robberies and Glass

The robbery scenes were realistic across the board. And the heist bag lives on. Seeing that familiar bag show up made me a little happy.

For weapons I could identify a pistol, a shotgun, an assault rifle, and something that looked like a submachine gun.

![A car burning in a parking garage as Lucia, in a hoodie, watches it, with a six-star wanted meter and three icons in the top-right corner](/images/news/gta6-extended-look-impressions/burning-car-garage.webp)

Partway through, the video mentions that an engineer spent three years on the way broken glass behaves. Hearing "three years" in isolation makes you think *on that?* — and then you watch glass actually break and you get it. How it fractures, how it scatters, how the cracks run: it plainly reads as footage of glass breaking. Telling you it took three years and then showing you the result was a smart bit of structuring in its own right.

There was also a scene with a middle finger. Reassuring to know some things do not change.

---

## UI and Controls — How Do You Actually Play It?

This is the unglamorous part of a footage report, but personally it is where I stared hardest. Here is the on-screen information I could read out of the gameplay segments.

### Screen layout

Minimap at the bottom left. When your wanted level rises it flashes red and blue — an effect that evokes a patrol car's light bar, so you register the change without having to look down.

Top left, what appears to be a health bar. A second, blue meter sits below it. I could not tell from the footage what the blue one is.

Top right, the wanted level and related information. The wanted level goes up to six stars. Below that, four icons in a row: something like a pair of figures, a clothes hanger, something like a person, and a car. Below those again, the icon of the equipped weapon and the loaded round count.

What those four icons under the stars mean, I honestly have no idea. But a hanger (clothing) and a car sitting directly under the wanted level did look suggestive.

![Firing at police cars from a vehicle on a daytime boulevard, with a four-star wanted meter, four icons beneath it, and the ammo count "37 250" with a rifle icon stacked in the top-right corner](/images/news/gta6-extended-look-impressions/hud-wanted-icons.webp)

### Aiming

The aiming reticle seems to have several patterns, appearing circular with some weapons. If it changes per weapon, presumably it is showing differences in accuracy and spread visually.

![Aiming an assault rifle in a dark office, a circular reticle at the center of the screen and a health bar with a second blue meter in the top-left](/images/news/gta6-extended-look-impressions/hud-aim-reticle.webp)

### Button prompts

This is where the information density was highest. Here is what I could confirm.

* **L1**: loot a weapon from a body
* **Triangle**: knock
* **Triangle**: pick up the bag
* **Mash Circle**: break free when Lucia is being pinned by an enemy (a QTE, in other words)

![A red bag on the floor of a gutted interior with a "Triangle — BAG" prompt over it; a pistol icon and the ammo count "17 80" in the top-right, and a reticle of short dashes rather than a circle](/images/news/gta6-extended-look-impressions/prompt-bag-pickup.webp)

![Looking down at someone pinned to the ground, with a Circle prompt and a Triangle prompt both on screen](/images/news/gta6-extended-look-impressions/prompt-qte-struggle.webp)

And the options displayed at a car door were especially interesting.

* **Triangle — SLIM JIM** (the tool for popping a car lock)
* **Circle — SMASH WINDOW**

The same act of "getting into a car" is offered two ways: open it quietly, or take the fast route and break it. And they were levering it open with R. Smash the window when you are in a hurry, use the tool when there are eyes on you — a design that hands that judgment to the player. That is very good.

And then there is the one that made me say "oh" out loud.

* Interaction prompt: **hurry up**
* Interaction prompt: **hold hands**

Hold hands. In the same game where you shoot people, burn cars and hide among hostages, there is a button for holding hands. That gap may be the single most symbolic thing in the whole video. It looks like an attempt to express Jay and Lou's relationship at the level of the systems.

---

## The Range of Things to Do — Probably Enormous

Around the edges of the footage there were clearly things that look like minigames and activities. I cannot state any of this as fact, but I suspect the following are in.

* Swimming
* Basketball
* Skydiving
* Weight training (a prompt appeared that seems to be press L2 and R2 to lift the barbell)
* Scuba diving
* Jet skis
* Canoeing
* Fishing
* Somewhere that looks like a shooting range

![A woman pressing a barbell on a gym bench, with "L2" and "R2" button prompts overlaid on the bar](/images/news/gta6-extended-look-impressions/gym-bench-press.webp)

Since I could actually see the button prompt for the weight training, I rate that one as fairly certain. Swimming, scuba, jet skis, canoeing and fishing make five water-related activities on their own. Given the setting that may be obvious, but the amount on and under the water looks worth being optimistic about.

Something that looks like a VR headset also appears. Imagining what you put a headset on to do inside the game is its own small pleasure.

For animals I could confirm dogs, dolphins and seagulls. If dolphins are in, there is presumably something worth finding underwater.

For city features there were strip club and nightclub scenes, and a monorail. There was also a scene stopping at a mechanic mid-escape. Going to do something about your car while you are being chased may tie back to that car icon in the HUD.

---

## Advertising and the Resolution of the City

One of the pleasures of this series is the advertising plastered around the city, and it is here in force.

A commercial for the Prairie Sandwich Box Meal: only 30,000 calories. *Only.* That single word tells you everything about this world.

![An advertisement reading "THE PRAIRIE SANDWICH BOX MEAL" with "ONLY 30,000 CALORIES" on the left, and a sandwich stacked with sliced meat, a carton of fries and a mug of root beer on the right](/images/news/gta6-extended-look-impressions/prairie-sandwich-ad.webp)

There was an ad for something called Angstipan, too. A pharmaceutical ad, presumably. The name alone is already funny.

There were also NPCs in the city who looked Japanese. They are just part of the crowd, but it was the moment I felt this city is being built as a place where all kinds of people live.

---

## Closing — What Was Left When It Ended

Honestly, there was too much information to process in one viewing. Which is why these notes went in such a strange direction: counting hairstyles, counting icons in the top-right corner.

Even so, what stayed with me afterward is clear.

One is how persuasive the footage is. The light, the glass, the fire, the settling suspension. The three-year glass story is the symbolic one, but it is the work in the unnoticeable places that holds up the whole sense of realness. And all of it was captured on PS5, which is genuinely something.

The other is Jay and Lou. The clipped nicknames, splitting driving and shooting, the phone while hidden among hostages, and the "hold hands" button. What they want these two to be came through consistently, from both the footage and the systems.

And finally, Brian's "knowing when to quit is what matters" will not leave my ear. Whether that turns out to be a veteran's grumbling or a setup for the whole story, I do not know. For now, I am hoping the instinct that made me picture a Bonnie-and-Clyde ending turns out to be wrong.

---

> **Note:** This article is a personal viewing record based on notes taken while watching "Grand Theft Auto VI: An Extended Look." It is not an official Rockstar Games announcement. Character names and lines are our own transcription and summary from the Japanese subtitles, and the descriptions of UI and minigames include the writer's own speculation. All images in this article are screenshots from "Grand Theft Auto VI: An Extended Look," copyright Rockstar Games.`,
  },
  {
    id: 47,
    title:
      "RockstarがGTA6を海外クリエイターに先行公開していたことが判明――TGG、El Rubiusらが情報解禁を予告",
    displayTitle:
      "RockstarがGTA6を海外クリエイターに先行公開していたことが判明\nTGG、El Rubiusらが情報解禁を予告",
    description:
      "Rockstar Gamesが2026年7月、世界各国の一部クリエイターをスコットランドのRockstar Northへ秘密裏に招待し、『Grand Theft Auto VI』を先行披露していたことが明らかになった。オーストラリアのTGG、スペインのEl Rubius、ブラジルのDavy Jones、イタリアのMike ShowShaらが訪問を公表し、Extended Look公開後の情報解禁を予告している。",
    icon: "🎥",
    image: "/images/news/gta6-creators-rockstar-north/eyecatch.webp",
    category: "topic",
    date: "2026-08-27",
    publishedAt: "2026-08-27 22:00",
    source: "TGG・El Rubius 公式X／Mike ShowSha 公式Instagram ほか",
    sourceUrl: "https://x.com/TGGonYT/status/2092582849111113810",
    relatedArticles: [39, 46, 45],
    aiSummary: [
      "Rockstar Gamesが2026年7月、世界各国の一部クリエイターをスコットランド・エディンバラのRockstar Northへ秘密裏に招待し、『Grand Theft Auto VI』を事前に披露していたことが明らかになった。現在までに訪問を公表しているのは、オーストラリアのTGG、スペインのEl Rubius、ブラジルのDavy Jones、イタリアのMike ShowShaら。",
      "TGGは「Rockstar NorthでGTA6の独占情報を得た」と説明し、Extended Look公開後にすべて話すと予告。El Rubiusは「未公開画像」とゲームの詳細を含む独占動画を公開するとしている。ただし今回のプレビューはハンズオン（試遊）ではなく、用意された映像を見せられるハンズオフ形式だったと報じられている。",
      "8月26日のDazed独占取材、27日のNetflix「An Extended Look」、そして各国クリエイターの情報解禁が同じタイミングに重なる。Extended Lookは日本時間8月28日午前4時にNetflix、午前10時ごろにYouTube・公式サイトで公開予定で、日本では28日早朝から海外発のGTA6情報が一気に増える可能性がある。",
    ],
    fullContent: `# RockstarがGTA6を海外クリエイターに先行公開していたことが判明――TGG、El Rubiusらが情報解禁を予告

GTA6の「Grand Theft Auto VI: An Extended Look」公開を目前にして、Rockstar Gamesがその裏でもうひとつの情報解禁を準備していたことが明らかになった。

2026年7月、Rockstarは世界各国の一部クリエイターを、スコットランド・エディンバラにあるRockstar Northへ秘密裏に招待。そこで『Grand Theft Auto VI』を事前に披露していたという。

現在までに訪問を明らかにしているのは、オーストラリアのTGG、スペインのEl Rubius、ブラジルのDavy Jones、イタリアのMike ShowShaら。

しかも彼らは、単に8月27日のExtended Lookを一足先に見ただけではないようだ。少なくとも一部のクリエイターは、Rockstar NorthでGTA6に関する説明を受け、一般にはまだ公開されていない情報や画像についても知る機会を得ていたと明かしている。

Extended Lookの公開後、その情報がそれぞれのYouTubeチャンネルなどで解禁される。

つまり今回のGTA6情報解禁は、Netflixで一本の映像が公開されて終わるものではない可能性が高い。

---

## TGG「Rockstar NorthでGTA6の独占情報を知った」

今回の訪問を公表したクリエイターのなかでも、大きな注目を集めたのがオーストラリアのGTA系YouTuber、TGG（The Gaming Gorilla）だ。

200万人を超える登録者を持つTGGは、自身のXで「先月Rockstar Northに招待された」と公表。エディンバラのスタジオ滞在中に、GTA6について独占的な情報を得たと明かした。

そしてExtended Lookが公開され次第、その内容をすべて話すと予告している。Rockstar Games公式Xもこの投稿にゴリラとハートの絵文字で返信しており、TGGの発表に公式側が公の場で反応した形となった。

![](https://x.com/TGGonYT/status/2092582849111113810)

TGGの発言で重要なのは、「Extended Lookについて動画を出す」とだけ言っているわけではない点だ。

本人は明確に、Rockstar NorthでGTA6について情報を得たと説明している。

そのため、公開される動画にはExtended Lookを見れば誰でも分かる内容だけでなく、現地でRockstarから説明された補足情報が含まれる可能性がある。

---

## El Rubiusは「未公開画像」を含む独占動画を予告

さらに踏み込んだ予告をしているのが、スペイン語圏を代表する大型クリエイター、El Rubius（@Rubiu5）だ。

El Rubiusも自身のXでRockstar Northを訪問したことを明らかにし、「明日、秘密が終わる」と投稿した。

続けて、自身のチャンネルでGTA6の独占動画を公開すると予告。その動画には「未公開画像」とゲームの詳細が含まれるとしている。

Rockstar Northへの訪問を「夢」と表現し、Rockstar Gamesに招待への感謝も伝えた。Rockstar公式アカウントもEl Rubiusの投稿に反応している。

![](https://x.com/Rubiu5/status/2092643887441436699)

この「未公開画像」という言葉は特に気になるところだ。

それがExtended Look本編に登場する映像の静止画なのか、それともクリエイター向けに用意された別のスクリーンショットなのかは、現時点では分からない。

ただし、少なくともEl Rubius自身は通常のリアクション動画ではなく「独占動画」として予告している。

Extended Look公開後は、公式映像だけでなく彼の動画についても確認する必要がありそうだ。

---

## ブラジルからDavy Jones、イタリアからMike ShowShaもRockstar Northへ

今回Rockstar Northへ招待されたのは、TGGとEl Rubiusだけではない。

ブラジルからは「Gameplayrj」や「Flow Games」で知られるDavy Jonesが訪問を公表している。

Flow Gamesも8月26日、Davy JonesがRockstarからの招待を受け、スコットランド・エディンバラのRockstar Northを訪問したことを記事で明らかにした。

同メディアは訪問理由について当初詳細を明かせないとしていたが、Davy Jones本人もRockstarを訪れたことを動画で告知している。GTA BOOMによれば、Davy Jonesはブラジルから招待されたクリエイターとして参加していたという。

![Davy JonesがRockstar North訪問を告知したYouTube動画](https://www.youtube.com/watch?v=asZaamVJs-I)

さらにイタリアでは、ゲーム系クリエイターのMike ShowShaが7月のRockstar North訪問をInstagramで公表。今後GTA6に関するコンテンツを公開する予定であることを明らかにしている。

![](https://www.instagram.com/reel/DcgKRwIImIT/)

現時点で公に確認されている主なクリエイターは次の4人だ。

* TGG / The Gaming Gorilla（オーストラリア）
* El Rubius（スペイン）
* Davy Jones / Gameplayrj・Flow Games（ブラジル）
* Mike ShowSha（イタリア）

この顔ぶれを見ると、Rockstarがひとつの地域に集中して招待したのではなく、オーストラリア、スペイン語圏、ブラジル、イタリアと、異なる市場から影響力のあるクリエイターを選んでいることが分かる。

また、GTA BOOMは「今後さらに別のクリエイターが名乗り出る可能性がある」としている。エンバーゴの解禁に合わせ、これまで訪問自体を明らかにできなかった人物が新たに出てくる可能性もありそうだ。

---

## ただし「GTA6を実際に遊んだ」わけではない

ここで注意しておきたいのが、今回の先行プレビューの形式だ。

現時点の報道では、クリエイター自身がコントローラーを持ってGTA6をプレイする「ハンズオン」ではなく、Rockstar側が用意したゲームプレイや映像を見せてもらう**ハンズオフ形式**だったとされている。

Forbesも、参加者が自由にLeonidaを探索したり、ストーリーミッションを操作したりしたわけではなく、ゲームプレイや映像を見せられる形式だったと報じている。

そのため、今後公開されるクリエイター動画についても、

「実際にGTA6を遊んでみた感想」

というより、

「Rockstar Northで実際に見たGTA6はどんなゲームだったのか」

「開発側からどのような説明を受けたのか」

「Extended Lookには含まれていない情報はあったのか」

といった内容が中心になると考えた方がよさそうだ。

それでも、Rockstarの外部にいる人物からGTA6についてまとまった情報が出てくるという意味では、これまでとは大きく状況が変わる。

---

## Rockstarはなぜ世界のYouTuberを招待したのか

今回の動きでもうひとつ興味深いのが、Rockstarが「誰にGTA6を見せたのか」という点だ。

Rockstar Gamesはこれまで、発売前の情報を非常に厳格に管理することで知られてきた。

新しいトレーラーを一本公開しただけで数か月にわたって考察が続くほど情報量を絞り、ゲームの全貌を早い段階から大量に公開するようなマーケティングはほとんど行わない。

今回もその基本姿勢自体は変わっていない。

招待者は限定され、プレビューはハンズオフ形式。情報公開にはエンバーゴが設定され、Extended Lookと同じタイミングに合わせて解禁される。

しかし一方で、これまで以上にクリエイターをマーケティングの中心へ組み込んでいるようにも見える。

GTAシリーズは現在、YouTubeやTwitchをはじめとする配信文化と極めて強く結びついている。

GTA Onlineはもちろん、FiveMやGTA RPによって、GTA Vは発売から長い年月が経った現在でも大量の動画やライブ配信が生まれ続けている。

GTA6の発売後も同じように長期的なコミュニティが形成されることを考えれば、Rockstarが世界各地域の大型クリエイターとの関係を作り始めていることには大きな意味がある。

今回の招待が一度限りのプロモーションなのか、それともGTA6発売後も続く新しいクリエイター戦略の始まりなのかは注目したい。

---

## Extended Lookだけではない――Rockstarが仕込んだ「情報解禁日」

ここ数日の動きを並べると、8月27日が単なるトレーラー公開日ではないことも見えてくる。

8月26日には英国カルチャー誌『Dazed』がRockstar Gamesへの独占取材を公開し、GTA6の開発や世界作りについて大規模な特集を掲載した。

そして翌27日には、Netflixで「Grand Theft Auto VI: An Extended Look」を公開。

さらにその公開に合わせ、1か月前からRockstar Northへ招待されていた世界各国のクリエイターたちも情報を解禁する。

これらが偶然同じ時期に重なったとは考えにくい。

Rockstarは公式映像だけでGTA6を紹介するのではなく、Netflix、海外メディア、そして各国のクリエイターを組み合わせ、複数方向から情報が広がる状態を作っていたと見ることができる。

Extended Lookを見たユーザーがそのままYouTubeへ移動すれば、今度はTGGやEl RubiusらがRockstar Northで聞いた追加情報を見ることになる。

そしてSNSでは、それぞれの動画から新情報が切り抜かれ、世界中で考察が始まる。

8月27日は一本の映像が公開される日ではなく、RockstarがGTA6の情報量を一段階引き上げる日に設定されていたのかもしれない。

---

## 日本では8月28日早朝から大量の情報が出る可能性

「Grand Theft Auto VI: An Extended Look」は、米国東部時間8月27日午後3時からNetflixで公開される。

日本時間では**8月28日午前4時**だ。

その6時間後にはRockstar Games公式YouTubeチャンネルやGTA6公式サイトでも公開される予定で、日本時間では**午前10時ごろ**となる。

今回クリエイター側の情報もExtended Look公開後に解禁されるとされているため、日本では28日早朝から海外発のGTA6情報が一気に増える可能性がある。

Extended Look本編だけを見て終わりではない。

TGGが語る「独占情報」、El Rubiusが予告した「未公開画像」、そしてDavy JonesやMike ShowShaを含め、Rockstar Northを訪れたクリエイターたちが何を見て、何を聞いたのか。

その内容次第では、Extended Lookそのものと同じくらい重要な情報が、YouTube側から出てくる可能性もある。

GTA6 FEEDではExtended Look本編に加え、Rockstar Northへ招待された海外クリエイターによる動画や投稿についても確認し、新たに判明したゲーム内容を整理していく。

いよいよGTA6の情報は、Rockstarの公式アカウントだけを追っていればいい段階から変わろうとしている。

---

> **注記：** 本記事は各クリエイター本人のX・Instagram投稿に加え、GTA BOOM、Forbes、Flow Gamesの報道をもとにまとめたもので、投稿内容の日本語部分は編集部訳・要約を含む。正確な文言は埋め込んだ原投稿を参照してほしい。`,
    titleEn:
      "Rockstar Showed GTA6 to Creators From Around the World Ahead of Time — TGG and El Rubius Tease Their Reveals",
    displayTitleEn:
      "Rockstar Showed GTA6 to Creators From Around the World Ahead of Time\nTGG and El Rubius Tease Their Reveals",
    descriptionEn:
      "In July 2026, Rockstar Games quietly flew a handful of creators from around the world to Rockstar North in Edinburgh, Scotland, and showed them Grand Theft Auto VI early. Australia's TGG, Spain's El Rubius, Brazil's Davy Jones and Italy's Mike ShowSha have all confirmed the visit and teased reveals timed to the Extended Look.",
    aiSummaryEn: [
      "In July 2026, Rockstar Games quietly invited a handful of creators from around the world to Rockstar North in Edinburgh, Scotland, and showed them Grand Theft Auto VI ahead of release. Those who have gone public so far are Australia's TGG, Spain's El Rubius, Brazil's Davy Jones and Italy's Mike ShowSha.",
      "TGG says he learned exclusive GTA6 information at Rockstar North and will tell all once the Extended Look is out; El Rubius has promised an exclusive video containing unreleased images and details about the game. The preview was reportedly hands-off, though — creators were shown gameplay and footage rather than playing it themselves.",
      "Dazed's exclusive interview on August 26, Netflix's Extended Look on August 27, and the creators' embargoed reveals all land together. The Extended Look hits Netflix at 4:00 a.m. JST on August 28 and YouTube and the official site around 10:00 a.m., so a wave of GTA6 information is likely to arrive in Japan through that morning.",
    ],
    fullContentEn: `# Rockstar Showed GTA6 to Creators From Around the World Ahead of Time — TGG and El Rubius Tease Their Reveals

With "Grand Theft Auto VI: An Extended Look" about to go live, it has emerged that Rockstar Games was quietly preparing a second reveal behind it.

In July 2026, Rockstar secretly invited a handful of creators from around the world to Rockstar North in Edinburgh, Scotland, and showed them *Grand Theft Auto VI* ahead of time.

Those who have confirmed the visit so far include Australia's TGG, Spain's El Rubius, Brazil's Davy Jones and Italy's Mike ShowSha.

And they did not simply get an early look at the August 27 Extended Look. At least some of the creators say they were walked through GTA6 at Rockstar North and given access to information and images that have not been made public.

Once the Extended Look is out, that material gets unlocked on their respective YouTube channels and elsewhere.

In other words, this round of GTA6 information very likely does not end when a single video goes up on Netflix.

---

## TGG: "I Learned Exclusive GTA6 Information at Rockstar North"

Among the creators who have gone public, the one drawing the most attention is Australian GTA YouTuber TGG (The Gaming Gorilla).

With more than two million subscribers, TGG announced on his own X account that he had been invited to Rockstar North last month, and said that during his stay at the Edinburgh studio he was given exclusive information about GTA6.

He has promised to talk through all of it as soon as the Extended Look goes live. Rockstar Games' official X account replied to the post with gorilla and heart emoji — a public acknowledgment from the company itself.

![](https://x.com/TGGonYT/status/2092582849111113810)

The important part of TGG's post is that he is not merely saying he will put out a video about the Extended Look.

He states clearly that he learned things about GTA6 at Rockstar North.

That means his video may contain not only what anyone can work out from watching the Extended Look, but supplementary information Rockstar explained to him on site.

---

## El Rubius Teases an Exclusive Video With "Unreleased Images"

Going a step further is El Rubius (@Rubiu5), one of the biggest creators in the Spanish-speaking world.

He too revealed on X that he had visited Rockstar North, posting that "tomorrow, the secret ends."

He followed up by announcing an exclusive GTA6 video for his own channel — one he says will include unreleased images and details about the game.

He described the visit to Rockstar North as a dream and thanked Rockstar Games for the invitation. Rockstar's official account responded to his post as well.

![](https://x.com/Rubiu5/status/2092643887441436699)

That phrase — "unreleased images" — is the part worth watching.

Whether those are stills from footage that appears in the Extended Look itself, or separate screenshots prepared for creators, is not clear at this point.

What is clear is that El Rubius is billing this as an exclusive video rather than an ordinary reaction video.

Once the Extended Look is out, his channel looks worth checking alongside the official footage.

---

## Davy Jones From Brazil and Mike ShowSha From Italy Also Visited Rockstar North

TGG and El Rubius were not the only creators invited to Rockstar North.

From Brazil, Davy Jones — known for "Gameplayrj" and "Flow Games" — has confirmed the visit.

Flow Games also published a piece on August 26 stating that Davy Jones had accepted an invitation from Rockstar and visited Rockstar North in Edinburgh, Scotland.

The outlet initially said it could not disclose the reason for the trip, but Davy Jones himself announced the visit in a video. According to GTA BOOM, he attended as the creator invited from Brazil.

![Davy Jones' YouTube video announcing his visit to Rockstar North](https://www.youtube.com/watch?v=asZaamVJs-I)

In Italy, meanwhile, gaming creator Mike ShowSha revealed his own July visit to Rockstar North on Instagram, saying he plans to publish GTA6 content going forward.

![](https://www.instagram.com/reel/DcgKRwIImIT/)

The four creators publicly confirmed so far are:

* TGG / The Gaming Gorilla (Australia)
* El Rubius (Spain)
* Davy Jones / Gameplayrj and Flow Games (Brazil)
* Mike ShowSha (Italy)

Looking at that lineup, Rockstar clearly did not concentrate the invitations in one region. It picked influential creators across Australia, the Spanish-speaking world, Brazil and Italy — different markets, deliberately.

GTA BOOM also notes that more creators may still come forward. As the embargo lifts, people who could not previously acknowledge the visit at all may begin to surface.

---

## But They Did Not Actually Play GTA6

One thing worth being careful about is the format of this preview.

Reporting so far indicates it was not a hands-on session with creators holding a controller, but a **hands-off** presentation in which Rockstar showed them gameplay and footage it had prepared.

Forbes likewise reported that attendees did not freely explore Leonida or play through story missions; they were shown gameplay and footage.

So the creator videos to come are probably less about

"here's what GTA6 felt like to play"

and more about

"here's what the GTA6 I actually saw at Rockstar North was like,"

"here's what the developers explained,"

and "here's what wasn't in the Extended Look."

Even so, having substantial GTA6 information come from people outside Rockstar is a meaningful change from where things have stood until now.

---

## Why Did Rockstar Invite YouTubers From Around the World?

The other interesting angle here is *who* Rockstar chose to show GTA6 to.

Rockstar Games has long been known for controlling pre-release information extremely tightly.

It releases so little that a single new trailer sustains months of analysis, and it almost never runs marketing that dumps the full shape of a game early.

That basic posture has not changed here.

The invite list was limited, the preview was hands-off, and the information was placed under embargo timed to release alongside the Extended Look.

At the same time, though, the company appears to be building creators into the center of its marketing more than ever before.

The GTA series is now bound extremely tightly to streaming culture on YouTube, Twitch and elsewhere.

Beyond GTA Online, FiveM and GTA RP keep generating an enormous volume of videos and live streams from GTA V years after release.

If a similar long-term community forms after GTA6 launches, Rockstar starting to build relationships with major creators across regions carries real weight.

Whether this was a one-off promotion or the beginning of a creator strategy that continues past launch is worth watching.

---

## Not Just the Extended Look — the "Reveal Day" Rockstar Built

Line up the past few days and it becomes clear that August 27 is not simply a trailer release date.

On August 26, UK culture magazine *Dazed* published an exclusive interview with Rockstar Games, a large feature on GTA6's development and world-building.

The next day, August 27, "Grand Theft Auto VI: An Extended Look" arrives on Netflix.

And timed to that release, the creators invited to Rockstar North a month earlier lift their embargoes too.

It is hard to read all of this landing in the same window as coincidence.

Rather than introducing GTA6 through official footage alone, Rockstar appears to have engineered a state in which information spreads from several directions at once — Netflix, international press, and creators in individual countries.

A viewer who finishes the Extended Look and moves straight to YouTube runs into the additional information TGG, El Rubius and others were given at Rockstar North.

From there, social media clips the new details out of each video and the analysis starts worldwide.

August 27 may have been set not as the day one video goes out, but as the day Rockstar raises the total volume of GTA6 information a full step.

---

## Expect a Flood of Information in Japan From Early on August 28

"Grand Theft Auto VI: An Extended Look" goes live on Netflix at 3:00 p.m. Eastern on August 27.

In Japan that is **4:00 a.m. on August 28**.

Six hours later it is due on the official Rockstar Games YouTube channel and the GTA6 site — around **10:00 a.m.** Japan time.

Because the creator material is also said to unlock after the Extended Look, GTA6 information from abroad could surge in Japan from the early hours of the 28th.

Watching the Extended Look is not where it ends.

The "exclusive information" TGG describes, the "unreleased images" El Rubius has promised, and whatever Davy Jones, Mike ShowSha and the rest saw and heard at Rockstar North are all still to come.

Depending on what is in them, information as significant as the Extended Look itself may arrive from the YouTube side.

GTA6 FEED will be covering the Extended Look itself along with the videos and posts from the creators invited to Rockstar North, and will lay out whatever new details emerge.

The stage where following Rockstar's official accounts was enough to keep up with GTA6 is, at last, coming to an end.

---

> **Note:** This article draws on the creators' own posts on X and Instagram along with reporting from GTA BOOM, Forbes and Flow Games; quoted passages are summarized or paraphrased. Refer to the embedded original posts for exact wording.`,
  },
  {
    id: 46,
    title:
      "GTA6、Dazed独占インタビューで大量の新情報。「銃を持てば街が反応」体型変化・ゲーム内SNS・NPCの進化も明らかに",
    displayTitle:
      "GTA6、Dazed独占インタビューで大量の新情報\n「銃を持てば街が反応」体型変化・ゲーム内SNS・NPCの進化も明らかに",
    description:
      "英国カルチャー誌「Dazed」が2026年8月26日、Rockstar Gamesの開発チームへの独占取材記事を公開した。街中で銃を持てばLeonidaが反応すること、JasonとLuciaを同じ車内で切り替えられること、実際に機能するゲーム内SNS、食事や運動で変化する体型システムなど、これまで公開されていなかったGTA6のシステムが一気に明らかになっている。",
    icon: "🎤",
    image: "/images/news/gta6-official/vice-city-07.webp",
    category: "topic",
    date: "2026-08-27",
    publishedAt: "2026-08-27 04:30",
    source: "Dazed（Rockstar開発チーム独占インタビュー）",
    sourceUrl: "https://x.com/Dazed/status/2092643360100008295",
    relatedArticles: [45, 39, 42],
    aiSummary: [
      "英国カルチャー誌Dazedが2026年8月26日、Rockstar Northの開発責任者Rob Nelson氏らGTA6制作の中核スタッフへの独占取材記事を公開した。GTA6は「grounded and reactive（地に足がつき、反応する）」世界を目指しており、街中でライフルを持って歩けば街が反応するという。",
      "JasonとLuciaは一緒にも別々にも行動でき、同じ車に乗っている状態で運転席と助手席の操作を切り替えられる。ゲーム内には実際に機能するSNSフィードが存在し、食事で体重が、運動で筋肉が変化する身体変化システムも復活・拡張されている。",
      "Rockstarは10年以上Miamiを調査し、現在は現地に専属リサーチチームを置く。元犯罪者や警察関係者にも取材し、NPCは「シリーズ史上最も多様で詳細」に。開発チームの規模は『Red Dead Redemption 2』当時から2倍以上に拡大している。",
    ],
    fullContent: `# GTA6、Dazed独占インタビューで大量の新情報。「銃を持てば街が反応」体型変化・ゲーム内SNS・NPCの進化も明らかに

『Grand Theft Auto VI（GTA6）』について、これまで見えていなかったゲームシステムや開発の舞台裏が一気に明らかになった。

英国カルチャー誌「Dazed」は2026年8月26日、Rockstar Gamesの開発チームを独占取材した大型特集「GTAVI: An exclusive deep dive into the video game of the decade」を公開した。

![](https://x.com/Dazed/status/2092643360100008295)

記事にはRockstar Northの開発責任者Rob Nelson氏をはじめ、ナラティブ、キャラクター、UIなどGTA6制作の中核を担うスタッフが登場。これまでトレーラーや公式サイトだけでは分からなかった、Leonidaの世界がどのようにプレイヤーへ反応するのか、JasonとLuciaをどのように操作できるのか、さらには主人公の身体変化やNPC制作の規模まで語られている。

DazedのGTA6特集は同誌2026年秋号にも掲載され、雑誌は9月10日から世界で発売される予定だ。オンライン版はすでに公開されている。

---

## GTA6の世界は「より現実的にプレイヤーへ反応する」

今回のインタビューで、まず大きく取り上げられているのがGTA6のオープンワールドそのものだ。

Dazedによれば、GTA6はシリーズらしい武器やスーパーカー、自由度を残しながらも、これまで以上に「grounded and reactive（地に足がつき、反応する）」世界を目指しているという。

象徴的なのが、街中で銃を持った場合の反応だ。

![薄暗い室内でライフルと拳銃を手にしたジェイソンとルシアの公式スクリーンショット](/images/news/gta6-official-screenshots-29/jason-and-lucia-12.webp)

記事では、ライフルを持ったまま通りを歩けば、街が何らかの反応を示すと説明されている。

過去のGTAでは、武装した主人公が市街地を歩き回っても、プレイヤーが実際に発砲したり犯罪行為を起こしたりするまで、周囲の反応は限定的な場合もあった。

しかしGTA6では、単に「犯罪を起こしたかどうか」だけではなく、プレイヤーの行動や状態そのものを世界が読み取り、それに応じてNPCや周囲の環境が反応する方向へ進化しているようだ。

Rob Nelson氏は、Rockstarが過去作品を批判的に振り返り、当時は時間、リソース、技術的な制約などで実現できなかったものを見直しながら、システムを発展させていると説明している。

---

## JasonとLuciaは「二人で行動」も「別々に行動」も可能

GTA6の主人公Jason DuvalとLucia Caminosについても、新たなプレイスタイルが具体的に語られた。

Dazedは、プレイヤーが二人をカップルとして一緒に行動させることも、それぞれ別々に行動して自由に遊ぶこともできると伝えている。

さらに興味深いのが、二人が同じ車に乗っている場面だ。

![オープンカーを走らせるジェイソンと、助手席で拳銃を手にしたルシアの公式スクリーンショット](/images/news/gta6-official-screenshots-29/jason-and-lucia-11.webp)

たとえば仕事へ向かう途中、Jasonとして高速道路を運転している状態から、助手席に座るLuciaへ操作を切り替え、ゲーム内スマートフォンを見ることができるという。

その後カーチェイスが始まれば、運転するキャラクターと助手席から追手を攻撃するキャラクターを状況に合わせて切り替えることも可能だと説明されている。

単に「二人の主人公を切り替えられる」というGTA5の発展形ではなく、二人が同じ状況の中に存在したまま操作対象を切り替えるシステムが、GTA6ではより深くゲームプレイへ組み込まれている可能性がある。

---

## GTA6には「実際に動くSNSフィード」が存在

トレーラー公開時から大きな注目を集めていたゲーム内SNSについても、今回かなり重要な情報が出ている。

Dazedは明確に、GTA6には実際に機能するソーシャルメディアのフィードが存在すると伝えている。

![ビーチで掲げられたスマートフォンに、ライブ配信とコメント欄のような画面が表示されているイメージ](/images/news/gta6-dazed-interview/in-game-social-feed.webp)

*画像: 内容を分かりやすく伝えるためのAI生成イメージ画像。実際のGTA6のゲーム画面・公式素材ではない。*

これまで公開された映像では、TikTokやInstagram Liveを思わせる縦型動画、ライブ配信、コメント欄のようなUIが何度も登場していた。

そのためSNSがGTA6における現代アメリカ風刺の中心的な要素になることは以前から予想されていたが、今回の取材によって、それが単なるストーリー演出ではなく、プレイヤーがゲーム内で実際に触れるシステムであることがより明確になった。

また、ゲーム内の女性ラップデュオ「Real Dimez」の活動についても、SNS上で拡散されるバイラル投稿を通してその軌跡を追えるという。

SNSが単なる雰囲気作りではなく、Leonidaで起きる出来事や人物を知るための情報源として機能する可能性もありそうだ。

---

## 食べれば太る、運動すれば筋肉がつく――身体変化システムが復活

シリーズファンにとって特に興味深いのが、主人公の身体変化だろう。

DazedによるとGTA6では、過去のRockstar作品で採用されてきた身体変化システムが復活し、さらに拡張されている。

![ジムでダンベルを持ち上げる男性と女性、画面右上に筋肉・体脂肪・スタミナのステータス表示があるイメージ](/images/news/gta6-dazed-interview/body-change-gym.webp)

*画像: 内容を分かりやすく伝えるためのAI生成イメージ画像。実際のGTA6のゲーム画面・公式素材ではない。*

食事はJasonとLuciaの体重に影響し、運動をすれば筋肉が目に見えて発達する。

さらに、長期間自宅へ戻らず警察から逃げ続けたり、何日にもわたって遊び歩いたりすると、その生活が二人の外見にも現れるという。

これは『Red Dead Redemption 2』で見られた、Arthur Morganの体重、髪、ひげ、傷などがプレイヤーの生活によって変化する仕組みを、現代を舞台とするGTA6向けにさらに発展させたものと考えられる。

つまり同じJasonやLuciaでも、プレイヤーがどのような生活を送るかによって見た目が変わっていくことになる。

---

## Rockstarは10年以上Miamiを調査。犯罪者や警察関係者にも取材

GTA6の舞台Leonidaを作るため、Rockstarが行った調査の規模も明らかになっている。

![壁画の並ぶVice Cityの大通りを走るクラシックカーとバイクを捉えた公式スクリーンショット](/images/news/gta6-official/vice-city-09.webp)

Vice CityのモデルとなるMiamiとその周辺には、過去10年以上にわたって複数のRockstarスタッフが訪れており、現在はMiamiに専属のリサーチチームまで存在するという。

そして調査対象は街並みだけではない。

Rockstarのキャラクター部門でシニア・アートディレクターを務めるJamie-Lee Lloyd氏によれば、開発チームは元犯罪者、警察関係者、クラブプロモーター、銃器関係者など、地域を知るさまざまな人物から話を聞いてきたという。

単に「Floridaの変な人物」を集めて風刺するのではなく、実際に現地の人々と交流し、その地域特有の文化や考え方を理解したうえでGTAの世界へ落とし込むことが狙いだ。

ゲームライターのMichael Wiafe氏も、既存のFlorida像やミームをそのまま再現するだけではなく、プレイヤー自身がLeonidaを探索して発見できる世界を作る必要があると説明している。

---

## GTA6のNPCは「シリーズ史上最も多様で詳細」

その現地調査の成果が特に現れているのが、Leonidaで暮らすNPCたちだ。

![Leonida Keysの通りを行き交う人々の公式スクリーンショット。自転車、バス、屋台に集まる人々が同じ画面に収まり、路上にはイグアナがいる](/images/news/gta6-official/leonida-keys-02.webp)

Vice CityのLittle CubaからMount Kalaga National Parkの自然地帯まで、地域によって服装、体格、年齢、ファッション、身体的特徴などが大きく異なるキャラクターが登場するという。

Rockstarはこの膨大な人口を制作するため、新しいツールと制作パイプラインを開発した。

Lloyd氏はGTA6について、「これまで作った中で最も詳細で多様なキャラクター人口」を構築できるようになったと説明している。

さらに驚くべきことに、現在のRockstarにはLos Angelesの拠点に、ゲーム内の歩行者・NPC制作をほぼ専門的に担当する部門まで存在するという。

---

## GTA6開発チームはRDR2時代から「2倍以上」に

こうした世界を作るため、Rockstarそのものの制作規模も大きく変わっている。

![夕暮れのLeonidaの街並みを高所から見下ろしたイメージ。高速道路、ヘリコプター、海沿いの高層ビル群が広がる](/images/news/gta6-dazed-interview/leonida-skyline.webp)

*画像: 内容を分かりやすく伝えるためのAI生成イメージ画像。実際のGTA6のゲーム画面・公式素材ではない。*

Dazedによれば、GTA6を制作するRockstarのチーム規模は、『Red Dead Redemption 2』発売時と比較して2倍以上に拡大した。

NPCだけではない。

Vice Cityの壁画制作には50人以上の実在するストリートアーティストが参加。

さらに、車両のハンドリングを担当するチームには実際のレーシングドライバーが所属しているという。

ファッションについても、Miamiを拠点とするスタイリストJillian Carr氏が2023年からRockstarと協力し、Vice Cityの「ファッション・エコシステム」を構築している。

街を構成するブランドについても、一度きりのパロディとして作るのではなく、そのブランドを好む人、その店を利用する人、その商品が存在する地域まで含め、Leonidaの文化の一部として成立するよう設計しているという。

---

## 「13年待ったGTA」の中身が、ようやく見え始めた

これまでGTA6について語られる時、その中心にあったのは巨大なマップ、グラフィック、車両、ストーリーといった目に見えやすい部分だった。

しかし今回のDazed独占取材から見えてくるGTA6は、少し違う。

武器を持って歩けば周囲が反応する。

![夜のネオン街で、パトカーの前に立つ警官と人々を捉えた公式スクリーンショット](/images/news/gta6-official/vice-city-06.webp)

JasonとLuciaは同じ車の中でもシームレスに操作を切り替えられる。

スマートフォンを開けばLeonidaで動いているSNSがあり、食事や運動、日々の生活は主人公の身体へ残っていく。

![夜のネオンに照らされた車内で、ハンドルを握るルシアの公式スクリーンショット](/images/news/gta6-official-screenshots-29/lucia-caminos-10.webp)

そして、その街を歩く名もないNPC一人を作るためにも、Rockstarは専用の技術、現地調査、専門スタッフを投入している。

Rob Nelson氏はDazedに対し、GTA6にかかる外部からの期待は前例のないものだと認めながらも、それ以上に開発チーム自身が自分たちへプレッシャーをかけていると語っている。

13年間という長い時間を経て作られた次のGrand Theft Autoが、単に「GTA5を巨大にしたゲーム」ではなく、プレイヤーの行動に反応し続ける世界を作ろうとしていることが、今回のインタビューから少しずつ見え始めた。

そしてタイミングも意味深だ。

Rockstarがゲームプレイ映像の流出について声明を発表し、「GTA6はほぼ完成」と明かした直後。そして「Extended Look」の公開を目前に控えたタイミングで、今度は開発チーム自身の言葉によってGTA6の内部が語られ始めた。

発売日は2026年11月19日。

これまで慎重に隠されてきたGTA6の全貌が、いよいよ本格的に明らかになる段階へ入ったのかもしれない。

---

> **注記：** 本記事はDazedの独占取材記事「GTAVI: An exclusive deep dive into the video game of the decade」（2026年8月26日公開）の内容をもとにまとめたもので、引用部分は編集部訳・要約を含む。正確な文言は原文を参照してほしい。また、本記事の画像のうちAI生成のイメージ画像には、その旨を各画像のキャプションに記載している。それ以外はRockstar Games提供の公式素材である。`,
    titleEn:
      "Dazed's Exclusive GTA6 Deep Dive Lands a Flood of New Detail: a City That Reacts to a Drawn Gun, Body Changes, a Working In-Game Social Feed, and Smarter NPCs",
    displayTitleEn:
      "Dazed's Exclusive GTA6 Deep Dive Lands a Flood of New Detail\nA City That Reacts to a Drawn Gun, Body Changes, a Working Social Feed, and Smarter NPCs",
    descriptionEn:
      "On August 26, 2026, UK culture magazine Dazed published an exclusive deep dive built on interviews with the Rockstar Games team behind GTA6. Walking Leonida with a rifle makes the city react, Jason and Lucia can be swapped inside the same car, the in-game social feed actually works, and eating and training visibly change the protagonists' bodies.",
    aiSummaryEn: [
      "UK culture magazine Dazed published an exclusive deep dive on August 26, 2026, built on interviews with Rockstar North art director Rob Nelson and other core GTA6 staff. The game is aiming for a more grounded and reactive world: walk down a street carrying a rifle and the city responds.",
      "Jason and Lucia can be played together or separately, and control can switch between driver and passenger while both sit in the same car. GTA6 has a social media feed that genuinely functions, and the body-change system returns and expands — food affects weight, training visibly builds muscle.",
      "Rockstar has researched Miami for over a decade and now keeps a dedicated research team there, speaking with former criminals, police, club promoters and firearms people. NPCs are described as the most detailed and diverse population the studio has built, and the team is more than twice the size it was for Red Dead Redemption 2.",
    ],
    fullContentEn: `# Dazed's Exclusive GTA6 Deep Dive Lands a Flood of New Detail: a City That Reacts to a Drawn Gun, Body Changes, a Working In-Game Social Feed, and Smarter NPCs

A large amount of previously unseen detail about *Grand Theft Auto VI* — both its systems and the work behind them — has arrived at once.

On August 26, 2026, UK culture magazine Dazed published a major feature titled "GTAVI: An exclusive deep dive into the video game of the decade," built on exclusive interviews with the development team at Rockstar Games.

![](https://x.com/Dazed/status/2092643360100008295)

The piece features Rockstar North art director Rob Nelson alongside staff working across narrative, characters and UI. It covers things trailers and the official site never made clear: how the world of Leonida responds to the player, how Jason and Lucia can be controlled, and how far the studio has gone on protagonist body changes and NPC production.

Dazed's GTA6 feature also runs in the magazine's Autumn 2026 issue, which goes on sale worldwide from September 10. The online version is already live.

---

## A World That Reacts to the Player More Realistically

The first thing the interview takes up at length is the open world itself.

According to Dazed, GTA6 keeps the weapons, supercars and freedom the series is known for while aiming for a more **grounded and reactive** world than any previous entry.

The clearest example is what happens when you carry a gun in public.

![Official screenshot of Jason and Lucia holding a rifle and a pistol in a dimly lit interior](/images/news/gta6-official-screenshots-29/jason-and-lucia-12.webp)

The article explains that walking down a street while holding a rifle will get some kind of reaction out of the city.

In earlier GTA games, an armed protagonist could often wander an urban area with only limited response until the player actually fired a shot or committed a crime.

In GTA6, the world appears to read not just whether a crime has been committed, but the player's behavior and state itself, with NPCs and the surrounding environment responding accordingly.

Nelson explains that Rockstar looks back critically at its past games, revisiting what could not be done at the time because of schedule, resources or technical limits, and builds its systems forward from there.

---

## Jason and Lucia Can Work Together — or Separately

Dazed also gets specific about new ways to play as the protagonists, Jason Duval and Lucia Caminos.

Players can move through the world with the two of them together as a couple, or send them off separately and play freely with each.

The most interesting case is when both are in the same car.

![Official screenshot of Jason driving a convertible with Lucia in the passenger seat holding a pistol](/images/news/gta6-official-screenshots-29/jason-and-lucia-11.webp)

On the way to a job, for example, you can be driving down the highway as Jason, then switch control to Lucia in the passenger seat and look at the in-game phone.

If a car chase starts from there, the article says you can keep switching as the situation demands — between the character driving and the character firing back at pursuers from the passenger seat.

That is not simply GTA5's protagonist switching made bigger. Swapping control while both characters remain inside the same unfolding situation looks like a system built far more deeply into GTA6's moment-to-moment play.

---

## GTA6 Has a Social Feed That Actually Works

Some genuinely important information also came out about the in-game social media that has drawn attention since the trailers.

Dazed states plainly that GTA6 contains a functioning social media feed.

![A phone held up at the beach showing what looks like a live stream with a comment column](/images/news/gta6-dazed-interview/in-game-social-feed.webp)

*Image: an AI-generated illustration made to help convey the story. It is not GTA6 footage or official Rockstar material.*

Footage released so far has repeatedly shown vertical video, live streams and comment-style UI reminiscent of TikTok and Instagram Live.

Social media was already expected to sit at the center of GTA6's satire of modern America, but this feature makes it clearer that it is not merely story dressing — it is a system players will actually interact with in-game.

The rise of in-game female rap duo Real Dimez, for instance, can be followed through viral posts spreading across that feed.

Social media may therefore work less as atmosphere and more as a source of information about the people and events of Leonida.

---

## Eat and Gain Weight, Train and Gain Muscle: Body Changes Return

For long-time series fans, the protagonists' physical changes may be the most interesting piece.

According to Dazed, the body-change system used in past Rockstar games returns in GTA6 — and goes further.

![A man lifting a dumbbell in a gym with a woman beside him, and a muscle, body-fat and stamina status readout in the corner](/images/news/gta6-dazed-interview/body-change-gym.webp)

*Image: an AI-generated illustration made to help convey the story. It is not GTA6 footage or official Rockstar material.*

Food affects Jason's and Lucia's weight, and training builds visible muscle.

Beyond that, staying away from home for long stretches while running from the police, or partying for days on end, shows up in how the two of them look.

It reads as an extension, built for GTA6's contemporary setting, of what *Red Dead Redemption 2* did with Arthur Morgan — where weight, hair, beard and scars all shifted with how the player lived.

In other words, the same Jason and the same Lucia will look different depending on the life a given player gives them.

---

## Over a Decade of Miami Research — Including Former Criminals and Police

The scale of the research behind Leonida is also laid out.

![Official screenshot of a classic car and motorcycles on a Vice City street lined with murals](/images/news/gta6-official/vice-city-09.webp)

Rockstar staff have been visiting Miami and its surroundings — the model for Vice City — for more than ten years, and the studio now keeps a dedicated research team based in the city.

And the research is not limited to the streetscape.

Jamie-Lee Lloyd, senior art director in Rockstar's character department, says the team has spoken with former criminals, police, club promoters, firearms people and others who know the area.

The goal is not to round up "weird Florida characters" for easy satire, but to meet people there, understand the culture and mindset specific to the region, and then translate that into the world of GTA.

Games writer Michael Wiafe likewise explains that the aim was not to reproduce existing Florida imagery and memes, but to build a world players discover for themselves by exploring Leonida.

---

## The Most Detailed and Diverse NPC Population in the Series

That fieldwork shows up most clearly in the people who live in Leonida.

![Official screenshot of a busy Leonida Keys street — cyclists, a bus, people around food stalls, and an iguana on the roadside](/images/news/gta6-official/leonida-keys-02.webp)

From Vice City's Little Cuba to the wilderness of Mount Kalaga National Park, characters differ sharply by region in clothing, build, age, fashion and physical features.

To produce a population that large, Rockstar developed new tools and a new production pipeline.

Lloyd says this let the studio build what he describes as the most detailed and diverse character population it has ever made.

More striking still: Rockstar's Los Angeles office now has a department working more or less exclusively on the game's pedestrians and NPCs.

---

## The GTA6 Team Is More Than Twice the Size It Was for RDR2

Building a world like this has changed the scale of Rockstar itself.

![A high vantage over Leonida at dusk: highways, a helicopter, and towers along the water](/images/news/gta6-dazed-interview/leonida-skyline.webp)

*Image: an AI-generated illustration made to help convey the story. It is not GTA6 footage or official Rockstar material.*

According to Dazed, the Rockstar team working on GTA6 is more than twice the size it was when *Red Dead Redemption 2* shipped.

And it is not only NPCs.

More than 50 real street artists worked on Vice City's murals.

The team handling vehicle handling includes actual racing drivers.

On fashion, Miami-based stylist Jillian Carr has been working with Rockstar since 2023 to build out Vice City's "fashion ecosystem."

Even the brands that make up the city are designed not as one-off parodies but as parts of Leonida's culture — who likes the brand, who shops at the store, which neighborhoods the product exists in.

---

## After 13 Years, We Are Finally Seeing What Is Inside

When GTA6 has been discussed until now, the conversation has centered on the visible things: the size of the map, the graphics, the vehicles, the story.

The GTA6 that emerges from Dazed's exclusive is a little different.

Walk around armed and the people around you react.

![Official screenshot of police officers and a crowd in front of a patrol car on a neon-lit street at night](/images/news/gta6-official/vice-city-06.webp)

Jason and Lucia can be swapped seamlessly even inside the same car.

Open the phone and there is a social network running in Leonida, while meals, workouts and daily life leave their marks on the protagonists' bodies.

![Official screenshot of Lucia at the wheel, the car interior lit by neon at night](/images/news/gta6-official-screenshots-29/lucia-caminos-10.webp)

And to build even one nameless NPC walking those streets, Rockstar is pouring in dedicated technology, field research and specialist staff.

Nelson told Dazed that the external expectation around GTA6 is unprecedented — but that the development team puts even more pressure on itself than that.

What this interview begins to show is that the next Grand Theft Auto, made across 13 years, is not simply "GTA5 but enormous." It is an attempt to build a world that keeps reacting to what the player does.

The timing carries weight, too.

It comes right after Rockstar issued a statement about the leaked gameplay footage and revealed that GTA6 is nearly finished — and just before the Extended Look goes live. Now the inside of the game is being described in the development team's own words.

The release date is November 19, 2026.

GTA6, kept carefully hidden for so long, may have entered the stage where the whole picture finally starts to come into view.

---

> **Note:** This article summarizes Dazed's exclusive feature "GTAVI: An exclusive deep dive into the video game of the decade" (published August 26, 2026); quoted passages are summarized or paraphrased rather than reproduced in full, so refer to the original for exact wording. Images that are AI-generated illustrations are labeled as such in their captions; the rest are official Rockstar Games material.`,
  },
  {
    id: 45,
    title:
      "RockstarがGTA6リークに異例の声明。「ほぼ完成」と明言、明日“Extended Look”公開へ",
    displayTitle:
      "RockstarがGTA6リークに異例の声明\n「ほぼ完成」と明言、明日“Extended Look”公開へ",
    description:
      "Rockstar Gamesが、この1週間に起きたGTA6のゲームプレイ映像流出について公式声明を発表した。「チームにとって胸が張り裂けるような出来事だった」としながら、開発状況を「nearly there!（もうほぼ完成している）」と表現。さらに明日、GTA6の「Extended Look」を公開することを正式に予告した。",
    icon: "📢",
    image: "/images/news/gta6-official/jason-and-lucia-key-art-02.webp",
    category: "release",
    date: "2026-08-26",
    publishedAt: "2026-08-26 23:00",
    source: "Rockstar Games 公式X",
    sourceUrl: "https://x.com/RockstarGames/status/2092574304571433078",
    relatedArticles: [39, 44, 43],
    aiSummary: [
      "Rockstar Gamesが、この1週間に広がったGTA6のゲームプレイ映像流出について公式声明を発表した。映像がこのような形で流出したことを「チームにとって胸が張り裂けるような出来事だった」と表現し、「長い間待ってくれた皆さんに、このような形でゲームを見てほしかったわけではない」と説明している。",
      "声明の中でRockstarは、ゲームの完成について「getting the game finished (nearly there!)」と記した。すべての開発作業が完了したという発表ではないが、Rockstar自身がGTA6を「もうほぼそこまで来ている」と表現し、発売に向けた最終段階にあることをファンへ直接伝えた形になる。",
      "あわせてRockstarは「明日、Extended Lookを皆さんに見てもらえるのをとても楽しみにしている」とコメントし、8月27日の「An Extended Look」公開を正式に予告した。流出したネタバレには詳しく触れず、「もう少しだけ待って、11月19日に自分自身でゲームを体験してほしい」と呼びかけている。",
    ],
    fullContent: `# RockstarがGTA6リークに異例の声明。「ほぼ完成」と明言、明日“Extended Look”公開へ

Rockstar Gamesが、『Grand Theft Auto VI（GTA6）』を巡ってこの1週間に起きたゲームプレイ映像の流出について、公式声明を発表した。

![](https://x.com/RockstarGames/status/2092574304571433078)

声明の中でRockstarは、開発中のGTA6の映像が意図しない形で公開されたことについて「チームにとって胸が張り裂けるような出来事だった」と率直な心境を明かしている。

しかし今回の声明で注目すべきなのは、リークへの反応だけではない。

RockstarはGTA6について「nearly there!（もうほぼ完成している）」と表現し、さらに**明日、GTA6の「Extended Look」を公開する**ことを正式に予告した。

リークによって予定外の形でゲームの一部が世に出てしまった直後、Rockstar自身がファンに向けて語った言葉は、発売まで残された期間がいよいよ最終段階に入っていることを強く感じさせる内容となっている。

---

## 「このような形でGTA6を見てほしくなかった」

Rockstarは声明の冒頭で、この1週間の出来事について多くのファンが公式からの説明を待っていたことを認識しているとしたうえで、ゲームプレイ映像の流出について触れた。

同社は今回の出来事を、

> GTA VIのゲームプレイ映像がこのような形で流出してしまったことは、私たちのチームにとって胸が張り裂けるような出来事だった

という趣旨の言葉で表現している。

そして、「長い間待ってくれた皆さんに、このような形でゲームを見てほしかったわけではない」と説明した。

GTA6は世界でも最も注目を集めるゲームのひとつであり、Rockstarはこれまで、新しい映像やスクリーンショットを非常に慎重なタイミングで公開してきた。

それだけに、発売を目前に控えた段階でゲームプレイ映像が意図しない形で広がったことは、開発チームにとって相当大きな出来事だったことが今回の声明から読み取れる。

---

## GTA6は「nearly there!」――Rockstarが“ほぼ完成”と表現

今回の声明の中でも特に注目したいのが、GTA6の現在の開発状況について触れた部分だ。

Rockstarは、ゲームの完成や新しい情報、公式ゲームプレイ映像などをファンに届けるまでに時間がかかっていることを謝罪。

その中で、

**「getting the game finished (nearly there!)」**

と記している。

直訳すれば、「ゲームを完成させること（もうほぼそこまで来ています！）」という意味になる。

もちろん、これは「すべての開発作業が完了した」「すでにマスターアップした」という発表ではない。

発売前のゲームには最終調整やバグ修正、最適化など多くの作業が残されるため、この一文だけから具体的な開発進捗率を判断することはできない。

それでも、Rockstar自身がGTA6を「nearly there」と表現した意味は大きい。

少なくとも現在のGTA6が、発売に向けた最終段階へ進んでいることをファンに直接伝えるメッセージと受け取ることができる。

---

## 明日「Extended Look」を公開すると正式発表

そして、今回の声明でもうひとつ大きな情報が明らかになった。

Rockstarは、

**「We are very excited for everyone to see the extended look tomorrow.」**

とコメント。

**明日、GTA6の「Extended Look」を公開することを正式に明らかにした。**

![夜の街とヤシの木を背景に、スマートフォンの画面に告知カードのような表示が浮かび上がっているイメージ](/images/news/gta6-rockstar-statement/extended-look-teaser.webp)

*画像: 内容を分かりやすく伝えるためのAI生成イメージ画像。実際のGTA6のゲーム画面や流出素材ではない。*

これまで予告されていた8月27日の公開を前に、Rockstar自身が改めてその存在を明言した形だ。

「Extended Look」が具体的にどのような形式になるのかについて、今回の声明では詳しい説明はされていない。

ただしRockstarは、準備に想定以上の時間がかかったとしながらも、

**「皆さんの期待を上回る必要がある」**

と強調している。

さらに、

**「皆さんが期待し、それに値するレベルのものを届ける決意がある」**

とも述べた。

単なる短い告知映像ではなく、Rockstar側も明日の公開を非常に重要なものとして位置づけていることがうかがえる。

---

## リークの詳細には触れず「自分自身で体験してほしい」

一方でRockstarは、今回流出した内容によって、本来意図していたゲーム体験の一部が損なわれてしまう可能性についても言及している。

声明では、

「一部のネタバレによって、意図していたゲーム体験が影響を受ける可能性があることは残念だ」

としたうえで、ファンに対して、

**「もう少しだけ待って、11月19日に自分自身でゲームを体験してほしい」**

と呼びかけた。

![夜のリビングで大型テレビにネオンに彩られた海沿いの街並みが映り、手前のテーブルにゲームコントローラーが置かれているイメージ](/images/news/gta6-rockstar-statement/november-19-living-room.webp)

*画像: 内容を分かりやすく伝えるためのAI生成イメージ画像。実際のGTA6のゲーム画面や流出素材ではない。*

GTA6 FEEDでは、今回流出した映像に含まれる具体的なネタバレについては本記事では扱わない。

重要なのは、その内容そのものよりも、Rockstarが今回の流出を正式に認識し、初めて公の場で直接言及したことだろう。

---

## リークへの声明が、そのまま“明日”へのメッセージになった

今回のRockstarの声明は、単なるリークへの抗議文ではなかった。

意図しない形で映像が公開されたことへの落胆を示す一方で、GTA6が「ほぼ完成」に近づいていることを伝え、明日のExtended Look、そして11月19日の発売へとファンの視線を戻そうとしている。

特に印象的なのは、声明の最後にコミュニティへの感謝を長く記していることだ。

Rockstarは、この1週間に寄せられたファンからの応援メッセージについて、

**「皆さんの言葉は、想像以上にこのチームにとって大きな意味を持っている」**

とコメント。

さらに、

**「結局のところ、私たちは皆さんのためにこのゲームを作っている」**

と結んでいる。

長い沈黙を続けることも多いRockstarが、リークという予期せぬ出来事のあとにここまで感情を込めた声明を発表したこと自体、異例と言っていい。

そして、その声明の翌日に待っているのが「Extended Look」だ。

リークによって予定とは違う形でGTA6の一部を目にしてしまった人もいる。しかしRockstarが本来見せようとしていたGTA6がどのようなものなのかは、まだ分からない。

**その答えの一部が、8月27日に正式に明らかになる。**

---

> **注記：** 本記事に掲載したRockstarの声明の日本語は、公式Xの投稿（本文中に埋め込み）をもとにした編集部訳であり、意訳を含む。正確な文言は原文を参照してほしい。また、本記事の画像のうちAI生成のイメージ画像には、その旨を各画像のキャプションに記載している。アイキャッチはRockstar Games提供の公式アートワークである。`,
    titleEn:
      "Rockstar Breaks Silence on the GTA6 Leak: the Game Is \"Nearly There,\" and the Extended Look Arrives Tomorrow",
    displayTitleEn:
      "Rockstar Breaks Silence on the GTA6 Leak\nThe Game Is \"Nearly There,\" and the Extended Look Arrives Tomorrow",
    descriptionEn:
      "Rockstar Games has issued an official statement on the GTA6 gameplay footage that leaked over the past week. Calling it \"heartbreaking for our team,\" the studio also described the game itself as \"nearly there!\" and confirmed that the Extended Look is coming tomorrow.",
    aiSummaryEn: [
      "Rockstar Games has published an official statement about the GTA6 gameplay footage that spread over the past week, saying it would be an understatement to call the leak heartbreaking for the team, and that this is obviously not how it intended players to see the game after all this time.",
      "In the same statement Rockstar wrote of \"getting the game finished (nearly there!)\" — not an announcement that development is complete, but a direct signal from the studio that GTA6 has reached the final stretch before release.",
      "Rockstar also said it is \"very excited for everyone to see the extended look tomorrow,\" formally confirming the August 27 premiere of An Extended Look. It did not address the leaked spoilers in detail, asking instead that everyone wait a bit longer and experience the game for themselves on November 19.",
    ],
    fullContentEn: `# Rockstar Breaks Silence on the GTA6 Leak: the Game Is "Nearly There," and the Extended Look Arrives Tomorrow

Rockstar Games has issued an official statement about the gameplay footage from *Grand Theft Auto VI* that leaked over the past week.

![](https://x.com/RockstarGames/status/2092574304571433078)

In it, the studio speaks plainly about how it feels to have footage of a game still in development surface in a way nobody planned: seeing it happen, Rockstar says, has been heartbreaking for the team.

But the reaction to the leak is not the only thing worth noting here.

Rockstar described GTA6 itself as **"nearly there!"** — and formally confirmed that **the Extended Look is coming tomorrow**.

Coming directly after part of the game reached the public on a schedule Rockstar never chose, the statement leaves a strong impression that the time remaining before release has entered its final stage.

---

## "This Is Not How We Intended for You to See the Game"

Rockstar opens by acknowledging that many fans had been waiting to hear from the company about the events of the past week, before turning to the leaked gameplay footage.

The studio puts it roughly this way:

> Having videos of Grand Theft Auto VI gameplay leak in this way has been heartbreaking for our team

And it adds that this is obviously not how it intended everyone to see the game after such a long wait.

GTA6 is one of the most closely watched games in the world, and Rockstar has always released new footage and screenshots on very carefully chosen timing.

That is exactly why the statement reads the way it does: with launch this close, gameplay footage spreading in an unintended form was clearly a significant event for the development team.

---

## "Nearly There!" — Rockstar's Own Words on How Close GTA6 Is

The passage that deserves the most attention is the one touching on where development currently stands.

Rockstar apologizes for how long everything has taken — finishing the game, sharing more details, showing official gameplay, giving the community what it wants to know.

And in the middle of that list comes the phrase:

**"getting the game finished (nearly there!)"**

It is not an announcement that all development work is done, or that the game has gone gold.

A game this close to release still has final tuning, bug fixing and optimization ahead of it, and no specific completion percentage can be read out of a single line.

Even so, the fact that Rockstar itself chose the words **"nearly there"** matters.

At minimum, it is a message delivered straight to fans that GTA6 has moved into the final stage before launch.

---

## The Extended Look Is Officially Confirmed for Tomorrow

The statement also carried one more significant piece of information.

Rockstar wrote:

**"We are very excited for everyone to see the extended look tomorrow."**

**That formally confirms the Extended Look arrives tomorrow.**

![A smartphone standing against a neon-lit night skyline and palm trees, its screen showing what looks like an announcement card](/images/news/gta6-rockstar-statement/extended-look-teaser.webp)

*Image: an AI-generated illustration made to help convey the story. It is not GTA6 footage or leaked material.*

The August 27 premiere had already been announced, and Rockstar has now restated it in its own words.

The statement gives no further detail about what form the Extended Look will take.

It does say, however, that getting it ready took longer than the studio wanted, because Rockstar knows it needs to **exceed your expectations**.

It goes on to say that the company is **determined to deliver at the level you expect and deserve**.

That framing suggests tomorrow is not a short teaser drop: Rockstar clearly regards it as a major moment.

---

## No Detail on the Leak — "Experience the Game for Yourselves"

Rockstar also acknowledges that what leaked may damage part of the experience it had designed.

Calling it unfortunate that the intended game experience may now be affected by some spoilers, the studio asks fans to

**wait a bit longer and experience the game for themselves on November 19**.

![A large TV in a dark living room showing a neon-lit coastal city at dusk, with a game controller on the table in the foreground](/images/news/gta6-rockstar-statement/november-19-living-room.webp)

*Image: an AI-generated illustration made to help convey the story. It is not GTA6 footage or leaked material.*

GTA6 FEED will not cover the specific spoilers contained in the leaked footage in this article.

What matters more than their content is that Rockstar has now formally acknowledged the leak and addressed it directly in public for the first time.

---

## A Statement About the Leak That Became a Message About Tomorrow

Rockstar's statement is not simply a protest against a leak.

It expresses disappointment at footage going out in an unintended form, tells fans that GTA6 is close to finished, and steers attention back toward tomorrow's Extended Look and the November 19 release.

The most striking part is how much space the closing gives to thanking the community.

On the messages of support that arrived over the past week, Rockstar says:

**your words have meant more to this team than you can imagine**

And it closes with the line:

**ultimately, we are making this game for you**

For a studio that often stays silent for long stretches, releasing a statement this openly emotional after an unplanned event like a leak is, in itself, unusual.

And what waits the day after that statement is the Extended Look.

Some people have already seen part of GTA6 in a form nobody intended. What the GTA6 that Rockstar meant to show actually looks like is still unknown.

**Part of that answer arrives officially on August 27.**

---

> **Note:** Quotations from Rockstar's statement are drawn from the official post on X embedded above; longer passages are summarized rather than reproduced in full. Images that are AI-generated illustrations are labeled as such in their captions; the eyecatch is official Rockstar Games artwork.`,
  },
  {
    id: 44,
    // 8月24日の訂正にあわせてタイトルも差し替えた（URL・canonical・公開日は据え置き）。
    // 既読の読者が一覧やSNSでタイトルだけ見ても訂正が入ったと分かるようにするため。
    title:
      "【追記・訂正】Cyberleek「捕まればGTA6を公開」は偽情報か――デッドマン・スイッチ騒動、その後判明したこと",
    displayTitle:
      "【追記・訂正】Cyberleek「捕まればGTA6を公開」は偽情報か\nデッドマン・スイッチ騒動、その後判明したこと",
    description:
      "【8月24日訂正】Take-TwoがMicrosoftとDiscordへ召喚状を出した直後、「Cyberleekが捕まればGTA6のデータが自動で公開される」といういわゆるデッドマン・スイッチの主張が広まった。しかしその後、発端となった投稿はCyberleek本人によるものではなく、第三者による偽情報だった可能性が高いことが判明した。当時どのような情報が出回り、その後何が分かったのかを記録として残す。",
    icon: "⏱️",
    image: "/images/news/gta6-official/port-gellhorn-01.webp",
    category: "topic",
    date: "2026-08-23",
    publishedAt: "2026-08-23 14:00",
    // 8月24日、デッドマン・スイッチの発端となった投稿が第三者の偽情報だった可能性が高いと
    // 判明したため、本文冒頭・該当箇所・末尾注記を訂正した（公開日は変えない）。
    updatedAt: "2026-08-24",
    correction: {
      label: "2026年8月24日 追記・訂正",
      body: [
        "本記事で取り上げた「Cyberleekが、拘束された場合にGTA6のビルドを自動公開する“デッドマン・スイッチ”を用意した」とする情報について、その後、この主張の発端となった投稿がCyberleek本人によるものではなく、第三者によって作られた偽情報だった可能性が高いことが判明しました。",
        "この情報を報じていた海外メディアでも訂正・撤回の動きが出ています。したがって現時点では、Cyberleekが「完全なGTA6ビルドを保有している」「拘束された場合に自動公開する仕組みを用意している」と確認できる根拠はありません。",
        "一方、GTA6の未公開映像とされる素材が流出していることや、Take-TwoがMicrosoftおよびDiscordから関連情報を取得するための法的手続きを進めていることとは別の話です。リーク事件そのものが偽物だったという意味ではありません。",
        "GTA6 FEEDでは当初から「完全ビルドの保有およびデッドマン・スイッチの存在は独立確認されていないCyberleek側の主張」として掲載していましたが、今回、その「Cyberleek側の主張」という出所自体に問題があったことが分かったため、訂正・追記します。",
      ],
      labelEn: "Correction and update — August 24, 2026",
      bodyEn: [
        "Regarding the report covered in this article — that Cyberleek had set up a “dead man's switch” to publish a GTA6 build automatically if its members were detained — it has since emerged that the post behind the claim was very likely not from Cyberleek at all, but disinformation created by a third party.",
        "Outlets that carried the story have begun issuing corrections and retractions. As of now, there is no basis for saying that Cyberleek holds a complete GTA6 build, or that it has set up any mechanism to publish data automatically if detained.",
        "That is separate from the fact that material said to be unreleased GTA6 footage has leaked, and that Take-Two is pursuing legal process to obtain related information from Microsoft and Discord. It does not mean the leak itself was fake.",
        "GTA6 FEED presented the full build and the dead man's switch from the outset as unverified claims attributed to Cyberleek. Because the problem turned out to lie with that attribution itself, we are issuing this correction.",
      ],
    },
    source: "GTA6 FEED 編集部",
    sourceUrl: "#",
    relatedArticles: [43, 42, 41],
    aiSummary: [
      "【8月24日訂正】8月23日時点では、「Cyberleekが、自分たちが捕まった場合に保有するGTA6のデータを自動公開する仕組み（デッドマン・スイッチ）を用意した」と主張している、と報じられていた。しかしその後、この主張の発端となった投稿はCyberleek本人のものではなく、第三者が作成した偽情報だった可能性が高いことが判明した。",
      "この話が広まったのは、Take-TwoがMicrosoftとDiscordに対してGTA6リーク関連の利用者記録を求めるDMCA召喚状の手続きを始めた直後だった。記録の提出期限は9月4日とされ、Take-Twoの狙いは動画の削除ではなく流出させた人物の特定へ移っている――この部分は現在も変わっていない。",
      "現時点で、CyberleekがGTA6の完全なビルドを保有していることも、デッドマン・スイッチが実在することも確認されていない。ネット上で出回る「113GBのGTA6完全版」とされるファイルも本物とは確認されておらず、マルウェアの可能性がある。8月27日には「An Extended Look」が控えている。",
    ],
    fullContent: `# 【追記・訂正】Cyberleek「捕まればGTA6を公開」は偽情報か――デッドマン・スイッチ騒動、その後判明したこと

GTA6のリーク事件が、さらにややこしい展開になってきた。

~~8月18日からGTA6の未公開ゲームプレイとされる映像を公開している「Cyberleek」が、新たに「自分たちが捕まった場合、持っているGTA6のデータが自動的に公開される仕組みを用意した」と主張している。~~

**【8月24日訂正】** その後、この「デッドマン・スイッチ」に関する投稿はCyberleek本人によるものではなく、第三者による偽情報だった可能性が高いことが判明した。現時点でCyberleek本人がこの主張を行ったと確認できる根拠はない。

以下は、8月23日時点でどのような情報が出回っていたのかと、その後何が判明したのかの記録である。

当時は、

**「俺たちを捕まえたら、GTA6をネットにばらまくぞ」**

という趣旨の発言がCyberleek側のものとして広まり、大きく報じられていた。

![暗い部屋で複数のモニターに向かうフードの人物。中央の画面には壁の弾痕で描かれた「LEEK」の文字、右の画面には「UPLOADING... 73%」の表示、机には赤く光る「CYBERLEEK」のサインが置かれている](/images/news/gta6-cyberleek-dead-man-switch/cyberleek-uploading.webp)

*画像: 内容を分かりやすく伝えるためのAI生成イメージ画像。実際の流出素材・法廷資料ではない。*

ただし、ここで一番大事なことがある。

当時から、Cyberleekが本当にGTA6の完全版を持っているのかは確認されていなかった。本当に自動公開する仕組みを作っているのかも確認されていなかった。

そして8月24日、**その「Cyberleek本人がそう言っている」という前提自体が崩れた**。デッドマン・スイッチの発端となった投稿が本人のものではなく、第三者による偽情報だった可能性が高いと報じられたためである。

それでもこの話が一気に広まったのは、Take-TwoがちょうどCyberleekの正体を突き止めようと動き始めた直後に出てきた主張だったからだ。

---

## まず、何が起きているのか

今回の事件を一度整理しておこう。

8月18日ごろから、GTA6の未公開ゲームプレイとされる映像がネット上に出始めた。流出を主張しているのがCyberleekだ。

その後も映像は増え、Jasonがゲーム内の壁に銃弾で「LEEK」と読める文字を作っている映像まで登場した。このため、Cyberleek側は昔の動画を持っているだけではなく、**実際にGTA6の開発版を操作できる環境へアクセスしているのではないか**と疑われるようになった。

ここまでは比較的分かりやすい。

問題は、その後だ。

Take-TwoがCyberleekの身元を調べ始めた。

---

## Take-Twoは「誰が漏らしたのか」を調べ始めた

Take-Twoは8月20日、MicrosoftとDiscordに対して、GTA6リークに関係するアカウントの情報を開示するよう求める法的手続きを始めた。

![連邦地方裁判所の書式に「SUBPOENA」と大きく記された書類の束と木槌。背景にMicrosoftとDiscordの看板が並ぶイメージ](/images/news/gta6-cyberleek-dead-man-switch/subpoena-microsoft-discord.webp)

*画像: 内容を分かりやすく伝えるためのAI生成イメージ画像。実際の流出素材・法廷資料ではない。*

欲しがっているのは、たとえばメールアドレス、IPアドレス、電話番号、端末情報、関連アカウントなどだ。

要するに、

**「Cyberleekという名前の裏にいる、本当の人間を探したい」**

ということだ。

Microsoftが対象になっているのは、Xboxだけが理由ではない。MicrosoftはOneDriveやGitHubなどのサービスも持っており、今回のリークに関係するデータやアカウントが使われた可能性がある。

Discordも同じだ。Cyberleekや関係者がDiscordを使っていたのであれば、そのアカウント情報や接続記録が身元特定の手掛かりになる。

Take-Twoはもう、ネットに出た動画だけを消そうとしているわけではない。

**動画を出した人間そのものを探し始めている。**

---

## そこで「捕まえたら全部出す」という主張が広まった（※後に偽情報の可能性）

Take-Twoが追跡を始めた直後、Cyberleek側の新しい主張として次のような話が広まった。

**【8月24日訂正】** この主張の発端となった投稿は、その後Cyberleek本人によるものではなく、第三者が作成した偽情報だった可能性が高いと報じられている。以下は当時報じられていた内容であり、事実として確認されたものではない。

当時の報道によれば、GTA6のデータはすでに複数の場所へコピーしてあり、一定時間ごとに本人が「公開しない」という操作を続けている、とされていた。

もし本人が捕まったり、パソコンを押収されたりして、その操作ができなくなればどうなるのか。

その説明では、**GTA6のデータが自動で公開される**とされていた。

![「DEAD MAN SWITCH」と題した図解。フードの人物から24時間の時計、サーバー、クラウドストレージやDiscordなど複数の保存先へ矢印が伸び、右端に「AUTO RELEASE」と開いた南京錠が並ぶ。左下には「IF WE ARE ARRESTED, THE FULL GTA6 BUILD WILL BE RELEASED.」の一文](/images/news/gta6-cyberleek-dead-man-switch/dead-man-switch.webp)

*図: 当時Cyberleek側の主張として報じられていた仕組みを分かりやすく示すためのAI生成イメージ図。この主張自体が第三者による偽情報だった可能性が高いことが後に判明しており、実在が確認された構成ではない。*

こうした仕組みは一般に「デッドマン・スイッチ」と呼ばれる。

名前だけ聞くと難しそうだが、考え方は単純だ。

たとえば24時間ごとにボタンを押さないと、予約しておいたメールが勝手に送られる仕組みを想像すればいい。

普段は本人が毎日「まだ送るな」と止める。しかし本人が突然操作できなくなると、止める人がいなくなり、そのまま送信される。

当時は、Cyberleekがそれと同じような仕組みをGTA6のデータに設定した、と報じられていた。

---

## ただし、本当にそんな仕組みがあるのかは分からない

ここはかなり重要だ。

「完全なGTA6ビルドを持っている」とされる点についても、**その証拠はない。**

ゲームを操作しているように見える映像が出ているため、何らかのGTA6開発版へアクセスしている可能性はある。

ただ、それだけでは「GTA6全部を持っている」とは言えない。

開発中のゲームでは、特定の地域や機能だけを動かせるテスト用ビルドが存在することもある。Cyberleekが持っているものがそうした限定版なのか、本当にゲーム全体なのかは分からない。

同じように、「デッドマン・スイッチを作った」という話も確認できていない。それどころか8月24日には、この話の発端となった投稿自体がCyberleek本人のものではなかった可能性が高いと報じられた。

だから現時点では、

**GTA6を操作できる環境を持っている可能性はある。**

**しかし、完全版を持っている証拠はない。**

**自動公開システムが存在する証拠もなく、そもそもCyberleek本人がそう発言したという確認も取れていない。**

この3つを分けて考える必要がある。

---

## 「Take-Twoを脅している」と受け止められた理由（当時の見方）

ここから先は、デッドマン・スイッチの主張が本人のものだと考えられていた8月23日時点での見方である。前述のとおり、その出所自体が偽情報だった可能性が高いことが後に判明している。

Take-Twoは現在も、MicrosoftやDiscordから情報を集めてCyberleekの正体を探している。

![ノートパソコンに向かうフードの人物と、その隣に積まれた資料の束と木槌。背景にはサーバーラック、捜査ボード、ネオンに染まる海辺の街並みが広がるイメージ](/images/news/gta6-cyberleek-dead-man-switch/standoff-gavel.webp)

*画像: 内容を分かりやすく伝えるためのAI生成イメージ画像。実際の流出素材・法廷資料ではない。*

そこへ、

**「俺たちを捕まえたら、もっと大きな被害が出るぞ」**

という状況を作ろうとしているように見える主張が現れた――というのが、当時の受け止め方だった。

もし本当に完全なGTA6がネットへ公開されれば、RockstarとTake-Twoにとっては当然大きな問題になる。

ただし、だからといってTake-Twoが簡単に追跡をやめるとは考えにくい。

ここで「ゲームを公開すると言われたので捜査をやめます」となれば、今後ほかのゲーム会社でも同じ方法が使えることになってしまう。

未公開データを盗む。

会社が追ってきたら「捕まえたら全部公開する」と言う。

それで追跡を止められるなら、企業側にとって非常に危険な前例になる。

そのため、仮にこの主張が本物だったとしても、Take-Twoが法的手続きをそのまま止める可能性は低い。まして発端が偽情報だった可能性が高いとなれば、なおさらである。

---

## Cyberleekを捕まえるだけでは終わらない可能性もある

一方、当時報じられていた内容が仮に本当なら、Take-Two側にも難しい問題が残る、とも指摘されていた。

仮にCyberleek本人を特定できても、GTA6のデータがすでに複数の場所へコピーされていたらどうなるのか。

本人のパソコンだけ押収しても終わらない可能性がある。

別のクラウドストレージにコピーされているかもしれない。別の人物が持っているかもしれない。別の国にあるサーバーへ保存されている可能性もある。

つまりTake-Twoが本当に知りたいのは、

**「Cyberleekは誰なのか」**

だけではない。

**「GTA6のデータはどこから漏れ、今どこにあるのか」**

まで突き止めなければならない。

今回MicrosoftのOneDriveなどに関する情報まで求めていると報じられているのも、そのためと考えると分かりやすい。

---

## 「113GBのGTA6完全版」には注意

この騒動に便乗して、別の問題も起きている。

ネット上では現在、

「GTA6 FULL BUILD」

「GTA6 LEAKED BUILD」

「113GB」

などと書かれたファイルが出回っている。

しかし、**一般ユーザーがダウンロードして遊べる本物のGTA6完全版が公開されたという事実は確認されていない。**

つまり、「Cyberleekが完全版を持っていると報じられた」という話と、「ネットに落ちているGTA6という名前のファイル」は完全に別物だ。しかも前者については、その発言の出所自体が偽情報だった可能性が高いことが分かっている。

偽物にGTA6という名前を付けることは簡単にできる。100GB以上のダミーデータを入れて、本物っぽいサイズに見せることもできる。

さらに危険なのは、マルウェアだ。

「発売前のGTA6を遊べる」と思わせれば、世界中から大量の人がダウンロードする可能性がある。そのため、今回のリーク事件は悪意のあるファイルを配る側にとって非常に利用しやすい。

少なくとも現時点では、怪しいGTA6ビルドをダウンロードする理由はない。

---

## 最初は「ゲーマーの権利」を訴えていた

Cyberleekは、最初から単なるリーカーを名乗っていたわけではない。

彼らは「ゲーマーの権利のために戦う」と主張し、デジタル予約販売や物理ディスク、DLC、ゲームの所有権などを問題にしていた。

こうしたテーマ自体は、以前からゲーム業界で議論されている。

たとえばゲームをダウンロード版で購入した場合、本当に自分がゲームを「所有」していると言えるのか。サービスが終了しても遊べるべきではないのか。シングルプレイゲームなのに、オンライン接続を要求する必要があるのか。

こうした疑問を持つプレイヤーはCyberleek以外にも大勢いる。

ただし、

**「俺たちを追えばGTA6を公開する」**

という主張がCyberleekのものとして広まったことで、話はかなり変わってしまった。

一般論として、ゲーム業界への問題提起と、未発売ゲームを交渉材料として使うことは同じではない。

ただし今回に限っては、その「交渉材料として使う」という発言自体が第三者による偽情報だった可能性が高い。他人の名前を騙った投稿ひとつで、その主張の中身まで世界中に報じられてしまう――今回の件は、その危うさも示している。

---

## 8月27日の直前に起きている

そしてRockstarにとって最も嫌なのが、この事件のタイミングだ。

8月27日には、GTA6の「An Extended Look」が公開される予定になっている。

![夕暮れの街並みを背景に「Grand Theft Auto VI」の巨大な広告看板が立ち、濡れた路面にスポーツカーが停まっているイメージ](/images/news/gta6-cyberleek-dead-man-switch/gta6-billboard.webp)

*画像: 内容を分かりやすく伝えるためのAI生成イメージ画像。実際の流出素材・法廷資料ではない。*

Rockstarが正式にGTA6を詳しく紹介する大きなイベントだ。

ところが、その直前にCyberleekが現れた。

ゲームプレイとされる映像が公開され、Take-Twoが身元特定へ動き、さらに「捕まればGTA6を自動公開する」という（後に偽情報の可能性が高いと分かる）主張までが飛び交った。

本来なら8月27日は、

**「Rockstarが新しいGTA6を見せる日」**

になるはずだった。

しかし今は、

**「その前にCyberleekが何か出すのか」**

という別の注目まで集まってしまっている。

Rockstarにとってリークが厄介なのは、秘密を知られることだけではない。

自分たちが「この日に、この映像を、こう見せる」と決めていた予定を壊されることにもある。

---

## 結局、今どこまで本当なのか

今回のニュースは情報が多いので、最後に整理しておこう。

**確認されていること**は、CyberleekがGTA6の未公開映像とされるものを複数公開していること、Take-TwoがMicrosoftとDiscordから関連情報を得るための法的手続きを進めていることだ。

一方、**確認されていないこと**は、CyberleekがGTA6の完全版を持っているという話と、捕まった場合に自動公開される「デッドマン・スイッチ」が本当に存在するという話だ。さらに8月24日には、そのデッドマン・スイッチの発端となった投稿自体がCyberleek本人のものではなく、第三者による偽情報だった可能性が高いことが判明した。

つまり今の状況は、

**Take-Twoは本当にCyberleekを追っている。**

**「追えば全部出す」という発言は、本人のものだと確認できていない。**

**完全なビルドを持っているかどうかも、依然として分からない。**

これだけ覚えておけば、今回の事件の大筋は理解できる。

8月27日にはRockstarの「An Extended Look」が控えている。そして9月4日には、MicrosoftとDiscordに求められている情報提供の期限がやってくる。

「Cyberleekの言葉」とされたものが本物の脅しなのか、Take-Twoの追跡を止めるためのブラフなのか――今回はそれ以前に、その言葉が本人のものだったのかどうかから疑わしくなった。リーク事件そのものは続いているが、周辺で流れる情報の扱いには、これまで以上に注意が必要だ。

ただ、8月18日に始まった一本のリーク映像が、わずか数日でここまで大きな事件になったことだけは確かだ。

GTA6発売まで約3か月。本編とはまったく別の場所で、RockstarとCyberleekの攻防が続いている。

---

> **注記【8月24日更新】：** 本記事は8月23日時点で報じられていた情報をもとに、デッドマン・スイッチについて「Cyberleek側の未確認の主張」として掲載した。その後、この情報の発端となった投稿自体がCyberleek本人によるものではなく、第三者による偽情報だった可能性が高いことが判明したため、8月24日に記事冒頭および該当箇所を訂正した。
>
> 現時点でCyberleekがGTA6の完全なビルドを保有していることや、拘束時にデータを自動公開する仕組みを用意していることを裏付ける信頼できる情報は確認できていない。ネット上で「GTA6完全版」「GTA6流出ビルド」などとして配布されているファイルについても、本物であることは確認されていない。本記事に掲載している画像はすべてAIで生成したイメージ画像であり、実際の流出素材・法廷資料ではない。`,
    titleEn:
      "[Correction] Cyberleek's \"Release GTA6 If Arrested\" Was Likely Disinformation — What Emerged After the Dead Man's Switch Story",
    displayTitleEn:
      "[Correction] Cyberleek's \"Release GTA6 If Arrested\" Was Likely Disinformation\nWhat Emerged After the Dead Man's Switch Story",
    descriptionEn:
      "[Correction, August 24] Right after Take-Two moved for subpoenas against Microsoft and Discord, a claim spread that Cyberleek's GTA6 data would publish itself automatically if the group were arrested — a dead man's switch. The post behind that claim has since been reported as very likely not Cyberleek's at all, but a third party's fabrication. This article is kept as a record of what was reported at the time and what emerged afterwards.",
    aiSummaryEn: [
      "[Correction, August 24] As of August 23 it was reported that Cyberleek, which has been publishing footage said to be unreleased GTA6 gameplay since August 18, had set up a mechanism to release its GTA6 data automatically if its members were arrested — a so-called dead man's switch. The post behind that claim has since been reported as very likely not Cyberleek's, but a third party's fabrication.",
      "The story spread immediately after Take-Two began DMCA subpoena proceedings seeking GTA6 leak-related user records from Microsoft and Discord. The production deadline is reported as September 4, and Take-Two's aim has shifted from taking videos down to identifying whoever put them out — that part is unchanged.",
      "Nothing confirms that Cyberleek holds a complete GTA6 build, or that any dead man's switch exists. Files circulating online as a 113GB full GTA6 build have likewise not been verified as genuine and may carry malware. An Extended Look is scheduled for August 27.",
    ],
    fullContentEn: `# [Correction] Cyberleek's "Release GTA6 If Arrested" Was Likely Disinformation — What Emerged After the Dead Man's Switch Story

The GTA6 leak affair has taken another complicated turn.

~~"Cyberleek," which has been publishing footage said to be unreleased GTA6 gameplay since August 18, now claims to have set up a mechanism that automatically releases the GTA6 data it holds if its members are arrested.~~

**[Correction, August 24]** The post that started this "dead man's switch" story has since been reported as very likely not Cyberleek's at all, but disinformation created by a third party. There is no basis at present for saying that Cyberleek itself made the claim.

What follows is a record of what was circulating as of August 23, and of what emerged afterwards.

At the time, the line going around as Cyberleek's was:

**"Come after us and GTA6 goes out on the internet."**

![A hooded figure at a desk of monitors in a dark room; the central screen shows "LEEK" spelled out in bullet holes on a wall, another reads "UPLOADING... 73%," and a red-lit "CYBERLEEK" sign sits on the desk](/images/news/gta6-cyberleek-dead-man-switch/cyberleek-uploading.webp)

*Image: an AI-generated illustration made to help convey the story. It is not leaked material or a real court filing.*

There is one thing that matters most here, though.

Even at the time, it was not confirmed that Cyberleek actually held a complete build of GTA6, nor that any automatic-release mechanism had really been built.

Then, on August 24, **the premise that "Cyberleek says so" collapsed too**: the post behind the dead man's switch was reported as very likely a third party's fabrication rather than anything from the group.

The reason the story spread as far as it did was its timing — it surfaced right after Take-Two started moving to uncover who Cyberleek is.

---

## First, What Is Actually Happening

Let us lay the affair out once.

Around August 18, footage said to be unreleased GTA6 gameplay began appearing online. Cyberleek is the party claiming responsibility for the leak.

More footage followed, including a clip in which Jason shoots a wall so that the bullet holes spell out something readable as "LEEK." That raised the suspicion that Cyberleek does not merely hold old recordings but **has access to an environment where a development build of GTA6 can actually be played**.

Up to that point, the story is relatively easy to follow.

The complication came next.

Take-Two started looking into who Cyberleek is.

---

## Take-Two Started Asking Who Leaked It

On August 20, Take-Two initiated legal proceedings to require Microsoft and Discord to disclose information about accounts connected to the GTA6 leak.

![A stack of federal court documents headed "SUBPOENA" beside a gavel, with Microsoft and Discord signage in the background](/images/news/gta6-cyberleek-dead-man-switch/subpoena-microsoft-discord.webp)

*Image: an AI-generated illustration made to help convey the story. It is not leaked material or a real court filing.*

What it wants includes email addresses, IP addresses, phone numbers, device information and linked accounts.

In short:

**"We want to find the actual human being behind the name Cyberleek."**

Microsoft is a target for more than just Xbox. Microsoft also runs OneDrive, GitHub and other services, any of which may have held data or accounts connected to the leak.

The same goes for Discord. If Cyberleek or people around it used Discord, the account details and connection records are a lead toward identification.

Take-Two is no longer only trying to delete videos that reached the internet.

**It has started looking for the people who put those videos out.**

---

## Then "Catch Us and It All Goes Out" Spread (Later Likely Disinformation)

Right after Take-Two began its pursuit, a new claim spread under Cyberleek's name.

**[Correction, August 24]** The post behind this claim has since been reported as very likely disinformation produced by a third party rather than anything from Cyberleek. What follows is what was reported at the time; none of it is confirmed fact.

As reported then, the GTA6 data had already been copied to several locations, and at regular intervals someone performed an action that amounted to telling the system not to publish.

So what happens if that person is arrested, or the computers are seized, and the action can no longer be performed?

By that account, **the GTA6 data publishes automatically**.

![A diagram titled "DEAD MAN SWITCH": arrows run from a hooded figure through a 24-hour clock and a server out to cloud storage, Discord and other destinations, ending at "AUTO RELEASE" and an open padlock. A panel reads "IF WE ARE ARRESTED, THE FULL GTA6 BUILD WILL BE RELEASED."](/images/news/gta6-cyberleek-dead-man-switch/dead-man-switch.webp)

*Diagram: an AI-generated illustration of the mechanism reported at the time as Cyberleek's claim. That claim itself has since been reported as very likely third-party disinformation, and nothing shown here is verified to exist.*

Arrangements like this are generally called a "dead man's switch."

The name sounds ominous, but the idea is simple.

Imagine a system where, unless you press a button every 24 hours, a pre-written email sends itself.

Day to day, the person keeps saying "not yet." The moment they can no longer do so, there is nobody left to stop it, and the message goes out.

At the time, Cyberleek was reported to have set up something of that kind for the GTA6 data.

---

## But There Is No Way to Know Whether Any of It Exists

This part matters a great deal.

As for the claim of a complete GTA6 build: **there is no evidence for it.**

Because footage exists that appears to show the game being played, there is a possibility of access to some development build of GTA6.

That alone, though, does not amount to holding all of GTA6.

Games in development often have test builds that run only a particular region or a particular feature. Whether what Cyberleek has is that kind of limited build or the whole game is unknown.

The dead man's switch is equally unverified — and on August 24 the post that started that story was reported as very likely not Cyberleek's at all.

So these three statements have to be kept apart:

**There may well be access to an environment where GTA6 can be played.**

**There is no evidence of a complete build.**

**There is no evidence that an automatic-release system exists, and no confirmation that Cyberleek ever said there was one.**

---

## Why It Was Read as a Threat to Take-Two (The View at the Time)

What follows is how things were read on August 23, while the dead man's switch was still taken to be Cyberleek's own statement. As noted above, the source of that statement has since been reported as very likely disinformation.

Take-Two is still gathering information from Microsoft and Discord to work out who Cyberleek is.

![A hooded figure at a laptop beside a stack of case files and a gavel, with server racks, an investigation board and a neon-lit coastal city in the background](/images/news/gta6-cyberleek-dead-man-switch/standoff-gavel.webp)

*Image: an AI-generated illustration made to help convey the story. It is not leaked material or a real court filing.*

Against that, a claim appeared that looked designed to manufacture a situation reading:

**"Catch us and the damage gets much bigger."**

If a complete GTA6 really did go public, it would obviously be a serious problem for Rockstar and Take-Two.

Even so, it is hard to imagine Take-Two simply calling off the pursuit.

If "we were told the game would be released, so we stopped investigating" became the outcome, the same method would be available against every other games company from here on.

Steal unreleased data.

When the company comes after you, say you will publish all of it if caught.

If that were enough to stop a pursuit, it would set an extremely dangerous precedent for the industry.

For that reason, even if the claims had been genuine, Take-Two would have been unlikely to halt the legal process over them — all the more so now that the source looks like a fabrication.

---

## Catching Cyberleek May Not End It Either

On the other side, commentators noted that if what was reported at the time were true, Take-Two would be left with a hard problem of its own.

Suppose Cyberleek is identified. What then, if the GTA6 data has already been copied to several places?

Seizing one person's computer may not be the end of it.

It may sit in another cloud storage account. Another person may hold it. It may be stored on a server in another country.

What Take-Two really needs to know, then, is not only:

**"Who is Cyberleek?"**

It also has to establish:

**"Where did the GTA6 data leak from, and where is it now?"**

Reading it that way makes sense of the reports that the requests extend to information about Microsoft's OneDrive.

---

## Be Careful With the 113GB Full GTA6 Build

A separate problem has grown up alongside the affair.

Files are currently circulating online labeled things like:

"GTA6 FULL BUILD"

"GTA6 LEAKED BUILD"

"113GB"

But **there is no confirmed instance of a genuine, playable complete GTA6 being released for ordinary users to download.**

The reported claim that Cyberleek has a full build and the files sitting on the internet with GTA6 in the name are two entirely different things — and the source of that claim now looks like a fabrication in any case.

Naming a fake file GTA6 is trivial. So is padding it with over 100GB of dummy data to make the size look convincing.

The greater danger is malware.

If people believe they can play GTA6 before release, enormous numbers of them worldwide may download it. That makes this leak extremely convenient for anyone distributing malicious files.

At least for now, there is no reason to download a suspicious GTA6 build.

---

## It Started as a Campaign for Gamer Rights

Cyberleek did not present itself as a simple leaker from the outset.

The group claimed to be fighting for gamer rights, raising digital pre-orders, physical discs, DLC and game ownership as issues.

Those themes themselves have been debated in the games industry for years.

If you buy a game as a download, can you really be said to own it? Should it not remain playable after the service ends? Does a single-player game need to require an online connection?

Plenty of players besides Cyberleek hold those questions.

But once the line

**"Come after us and we release GTA6"**

spread under Cyberleek's name, the conversation changed considerably.

As a general matter, raising problems with the games industry and using an unreleased game as a bargaining chip are not the same act.

In this instance, though, that bargaining-chip statement itself now looks like a third party's fabrication. A single post written in someone else's name was reported around the world as their position — which is a warning in its own right.

---

## It Is Happening Right Before August 27

And the timing is the part Rockstar will like least.

GTA6's "An Extended Look" is scheduled for August 27.

![A huge "Grand Theft Auto VI" billboard above a city skyline at dusk, with a sports car parked on the wet road below](/images/news/gta6-cyberleek-dead-man-switch/gta6-billboard.webp)

*Image: an AI-generated illustration made to help convey the story. It is not leaked material or a real court filing.*

It is the big event at which Rockstar formally shows GTA6 in detail.

Instead, right before it, Cyberleek appeared.

Footage said to be gameplay was published, Take-Two moved toward identification, and then a claim that GTA6 would publish itself automatically if the group were caught — later reported as very likely disinformation — spread on top of it all.

August 27 was supposed to be:

**"The day Rockstar shows the new GTA6."**

What it now also carries is:

**"Will Cyberleek put something out before then?"**

For Rockstar, the trouble with a leak is not only that secrets get out.

It is that the plan — this footage, on this day, presented this way — gets broken.

---

## So How Much of This Is Actually True?

There is a lot to hold in mind here, so a final summary.

**What is confirmed** is that Cyberleek has published several pieces of footage said to be unreleased GTA6 material, and that Take-Two is pursuing legal proceedings to obtain related information from Microsoft and Discord.

**What is not confirmed** is that Cyberleek holds a complete build of GTA6, or that a dead man's switch really exists to publish it automatically if the group is arrested. On August 24, moreover, the post behind that dead man's switch was reported as very likely a third party's fabrication rather than Cyberleek's own words.

The state of play, then:

**Take-Two really is pursuing Cyberleek.**

**The "come after us and it all goes out" line is not confirmed to be Cyberleek's.**

**Whether anyone in the group holds a complete build remains unknown.**

Hold on to that much and the shape of the affair is clear.

August 27 brings Rockstar's An Extended Look. September 4 brings the deadline for the information requested from Microsoft and Discord.

Whether those "words of Cyberleek's" were a real threat or a bluff meant to stop Take-Two's pursuit is now a second-order question: what fell into doubt first is whether they were Cyberleek's words at all.

What is certain is that a single leaked video on August 18 grew into an affair of this size in a matter of days.

Roughly three months to launch. In a place entirely apart from the game itself, the standoff between Rockstar and Cyberleek continues.

---

> **Note [updated August 24]:** This article was published on the basis of what was being reported as of August 23, presenting the dead man's switch as an unverified claim attributed to Cyberleek. It has since emerged that the post behind that claim was very likely not from Cyberleek but disinformation created by a third party, so the opening and the relevant passages were corrected on August 24.
>
> No reliable information currently confirms that Cyberleek holds a complete build of GTA6, or that it has set up any mechanism to publish data automatically if detained. Files distributed online as a full GTA6 build or a leaked GTA6 build have likewise not been confirmed as genuine. Every image in this article is an AI-generated illustration and is not leaked material or a real court filing.`,
  },
  {
    id: 43,
    title:
      "Take-Twoが反撃開始――MicrosoftとDiscordに召喚状、GTA6リーカー追跡が法廷へ",
    displayTitle:
      "Take-Twoが反撃開始\nMicrosoftとDiscordに召喚状、GTA6リーカー追跡が法廷へ",
    description:
      "8月20日、Take-Twoが米連邦地裁へDMCA召喚状を申請したと報じられた。対象はCyberleek本人ではなく、記録を保有するMicrosoftとDiscord。求められているのはアカウント情報、メールアドレス、IPアドレス、デバイス情報、そしてOneDriveに保存された関連データまで。GTA6リークは「動画を消す」段階から「流した人物を特定する」段階へ入った。",
    icon: "⚖️",
    image: "/images/news/gta6-official/ambrosia-02.webp",
    category: "topic",
    date: "2026-08-22",
    publishedAt: "2026-08-22 16:00",
    source: "GTA6 FEED 編集部",
    sourceUrl: "#",
    relatedArticles: [44, 42, 41],
    aiSummary: [
      "8月20日、Take-Two Interactiveが米ニューヨーク南部地区連邦地方裁判所へ、GTA6リークに関する記録をMicrosoftとDiscordから取得するためのDMCA召喚状を申請したと報じられた。要求されているのはアカウント情報、メールアドレス、IPアドレス、電話番号、リンク済みサービス、デバイス情報、さらにOneDriveに保存されたGTA・Rockstar・Cyberleek関連データまで含まれる。",
      "召喚状には「CYBERLEEK」「CINEMATICROCKSTAR」「Surfer24k」といった複数のハンドルネームに加え、特定のDiscordサーバーで2026年6月1日以降に活動したアカウントの記録も対象に挙がっていると報じられている。DarkViperAUのコミュニティに関連するとされるサーバー名の記載も話題になったが、記載されたことは運営者や参加者の関与を意味しない。",
      "記録の提出期限は9月4日とされる。ただしこれは逮捕状でも判決でもなく、著作権侵害を行ったとされる人物を特定するための身元開示手続きだ。その手前の8月27日には「An Extended Look」の公開が控えており、Rockstarは表でマーケティングを続けながら、裏でTake-Twoが流出元を追う状況になっている。",
    ],
    fullContent: `# Take-Twoが反撃開始――MicrosoftとDiscordに召喚状、GTA6リーカー追跡が法廷へ

8月18日以降、GTA6の未公開ゲームプレイとされる映像がインターネット上に断続的に流出している。流出を主張する「Cyberleek」は「ゲーマーの権利」を掲げ、デジタル予約販売や物理ディスクをめぐってゲーム業界への要求を突きつけ、その後も新たな映像を公開してきた。さらに一部の映像からは、単に録画済みの動画を所持しているだけではなく、何らかのプレイ可能なGTA6ビルドへアクセスしているのではないかという疑惑まで浮上している。

Rockstar Gamesは表向き、この騒動について大きな声明を出していない。しかし、その裏側では親会社Take-Two Interactiveがすでに動き始めていた。

8月20日、Take-Twoは米ニューヨーク南部地区連邦地方裁判所に対し、GTA6リークに関連する記録をMicrosoftとDiscordから取得するためのDMCA召喚状を申請したと報じられた。要求されているのは単なる投稿削除ではなく、アカウント情報、メールアドレス、IPアドレス、電話番号、関連サービス、デバイス情報、さらに場合によってはOneDriveに保存されたGTA、Rockstar、Cyberleek関連データまで含まれる。

つまりTake-Twoは、流出した映像を消すだけの段階から、その映像を流した人物を特定する段階へ進んだことになる。

![「GTA 6 INVESTIGATION」と書かれたマグカップの横に、Leonidaの地図とVice City・Port Gellhorn・Grassrivers・Ambrosiaといった地名のメモをピンで留めた机のイメージ](/images/news/gta6-leak-subpoena/leak-material-board.webp)

*画像: 内容を分かりやすく伝えるためのAI生成イメージ画像。実際の法廷資料・流出素材・企業の内部資料ではない。*

---

## Take-Twoが裁判所へ向かった理由

Take-Twoが求めているのは、MicrosoftとDiscordが保有している利用者記録だ。今回利用されたと報じられているのは、米デジタルミレニアム著作権法、いわゆるDMCAのSection 512(h)に基づく手続きで、著作権者がオンラインサービス事業者に対して、著作権侵害を行った人物を特定するための情報開示を求める際に使われる。

![連邦地方裁判所の書式に「SUBPOENA」「PURSUANT TO 17 U.S.C. § 512(h)」と記された書類と、MicrosoftとDiscordのロゴ、木槌を並べたイメージ](/images/news/gta6-leak-subpoena/dmca-subpoena.webp)

*画像: 内容を分かりやすく伝えるためのAI生成イメージ画像。実際の法廷資料・流出素材・企業の内部資料ではない。*

ここで重要なのは、Take-TwoがCyberleek本人を相手取って損害賠償請求を起こしたわけではないことだ。現段階はその前にあたる身元特定のフェーズであり、Take-Two側はリークに関与した人物を割り出し、自社が保有するGTA6関連の著作物を保護するために情報を集めようとしている。

対象となる著作物には、ゲーム映像や画像だけでなく、アートワーク、台詞、そのほかGTA6に含まれるクリエイティブ要素も含まれていると報じられている。数日前までTake-Twoが行っていたのは、ネット上に出回った映像に対する削除対応だったが、現在はその背後にいる人物まで追跡しようとしている。

---

## なぜMicrosoftが対象になったのか

Discordが対象になる理由は比較的分かりやすい。Cyberleekやリーク関連のコミュニティがDiscord上で活動していたのであれば、アカウントの登録情報やログイン履歴は身元特定の有力な手掛かりになる。

![オフィスビルの前に並ぶMicrosoftとDiscordの看板のイメージ](/images/news/gta6-leak-subpoena/microsoft-discord.webp)

*画像: 内容を分かりやすく伝えるためのAI生成イメージ画像。実際の法廷資料・流出素材・企業の内部資料ではない。*

一方で、今回もう一社の対象になったMicrosoftについては、「Xboxを運営しているから」という単純な理由ではない。法廷資料を確認した海外メディアの報道によると、Take-TwoはCyberleekという名称に関係するMicrosoft側の内部記録に加え、登録メールアドレス、IPアドレス、電話番号、リンク済みアカウント、デバイス情報などを求めている。

さらに注目されているのがOneDriveだ。リークに関係するGTA、Rockstar、Cyberleek関連のコンテンツがMicrosoftのクラウドストレージに保存されていた可能性を想定し、関連アカウントの記録も情報開示の対象に含まれていると報じられている。

また、今回のリーク素材の保存やリンク共有に使われた可能性があるGitHubなど、Microsoft傘下のサービスも調査上の接点として挙げられている。つまりMicrosoftは単なるゲームプラットフォーム企業としてではなく、Cyberleekが利用した可能性のある複数のオンラインサービスを保有する企業として調査の対象になっている。

---

## Discordには複数アカウントの情報開示を要求

Discord側に対する要求もかなり具体的だ。報道によれば、召喚状には「CYBERLEEK」「CINEMATICROCKSTAR」「Surfer24k」など複数のハンドルネームが記載されており、Take-Twoはそれらのアカウントに関する識別情報を求めている。

![「GTA 6 LEAK INVESTIGATION」と書かれた資料袋の横に、Discordログ・Microsoft記録・OneDriveデータ・IPアドレス・デバイス情報・メールアカウントを列挙したメモと「CYBERLEEK Who are you?」の付箋を並べたイメージ](/images/news/gta6-leak-subpoena/evidence-board.webp)

*画像: 内容を分かりやすく伝えるためのAI生成イメージ画像。実際の法廷資料・流出素材・企業の内部資料ではない。*

さらに、特定のDiscordサーバーについては2026年6月1日以降に参加または通信していたアカウントの記録まで対象に含まれていると報じられている。要求される情報にはアカウントID、登録メールアドレス、登録時や最終ログイン時のIPアドレス、電話番号、リンク済みサービス、デバイス情報などが含まれる。

この範囲を見る限り、Take-Twoは「Cyberleek」という一つの匿名アカウントだけを追っているのではなく、その人物が利用した可能性のある経路を横断的にたどろうとしている。匿名アカウントそのものが偽名でも、複数のサービスで使われたIPアドレスや登録情報、リンク済みアカウントが結びつけば、その背後にいる人物へ近づける可能性がある。

---

## GTAコミュニティまで調査対象に含まれた

今回の召喚状では、GTAシリーズの動画で知られるDarkViperAUのコミュニティに関連するとされるDiscordサーバーの名前も記載されていると報じられ、GTAファンの間で話題になった。

ただし、この点は慎重に扱う必要がある。召喚状にサーバー名が記載されていることは、そのサーバーの運営者やDarkViperAU本人、そこに参加していたユーザーがリークに関与したことを意味しない。Take-Twoが知りたいのは、Cyberleek本人やリーク素材がそこを経由したのか、あるいは関係する人物がそこに痕跡を残しているのかという点だ。

大規模なDiscordコミュニティには数千、数万人規模のユーザーが出入りすることも珍しくない。したがって、特定のコミュニティ名が法的文書に現れたことと、そのコミュニティ自体に責任があることは明確に分けて考える必要がある。

今回の調査で興味深いのは、GTA6のリーク事件がRockstarやTake-Twoの内部問題にとどまらず、GTAを取り巻く一般のオンラインコミュニティにまで調査範囲を広げ始めた点にある。

---

## MicrosoftもRockstarへの協力姿勢を示す

Microsoft側も今回の問題について、Take-TwoおよびRockstar Gamesと協力していることを示している。Xbox CTOのScott Van Vliet氏は、Microsoftが両社と緊密に連携し、クリエイティブ作品や知的財産を保護するための取り組みを支援しているという趣旨の発言をしたと報じられている。

現時点でMicrosoftが具体的にどの情報をTake-Twoへ提供したのかは明らかになっていない。召喚状の要求すべてがそのまま認められ、すべての記録が提供されるとも限らない。

それでも今回のリーク調査が、Rockstar社内だけで完結する問題ではなくなったことは明らかだ。Take-Two、Rockstar、Microsoft、Discord、そして米連邦裁判所という複数の組織が関わる事件へ発展している。

8月18日にSNSへ出回り始めた数本のゲーム映像は、わずか数日で大企業の法務部門と裁判所を巻き込む案件へ変わった。

---

## 一つの節目になる「9月4日」

今回の法的手続きで注目されているのが9月4日という日付だ。報道によれば、MicrosoftとDiscordに対して要求された記録の提出期限として設定されている。

![連邦地方裁判所の法廷を背景に、木槌と天秤の横へ「SUBPOENA」と書かれた分厚い書類の束を置いたイメージ](/images/news/gta6-leak-subpoena/subpoena-sealed.webp)

*画像: 内容を分かりやすく伝えるためのAI生成イメージ画像。実際の法廷資料・流出素材・企業の内部資料ではない。*

もちろん、9月4日にCyberleekの実名が公表されるという意味ではない。提供されたデータが一般公開される保証もなく、Take-Twoが受け取った情報を分析し、複数サービスの記録を照合する作業も必要になる。

ただ、メールアドレスやIPアドレス、電話番号、デバイス情報、リンクされたアカウントなどが複数のサービスで一致すれば、匿名アカウントの背後にいる人物を特定するための手掛かりになる。インターネット上では「Cyberleek」という名前を使っていても、その人物が利用するすべてのサービスで完全な匿名性を維持できているとは限らない。

その意味で9月4日は、今回の事件における一つの節目になる可能性がある。

---

## 「召喚状」はCyberleekへの逮捕状ではない

今回の報道を受け、SNSでは「Take-TwoがCyberleekに召喚状を出した」「リーカー逮捕へ」といった強い表現も見られる。しかし、現時点で起きていることはそれとは異なる。

今回の召喚状の主な対象は、Cyberleek本人ではなく、情報を保有しているMicrosoftとDiscordだ。Take-Twoは両社から利用者記録を得ることで、著作権侵害を行ったとされる人物を特定しようとしている。

したがって、この召喚状は逮捕状でもなければ、Cyberleekの刑事責任や民事責任を確定する判決でもない。今いるのは、リークが発生し、削除対応が行われ、その次に証拠や記録を集めて身元を調べる段階だ。

仮に人物が特定されたとしても、Take-Twoがその後どのような法的手段を取るのかはまだ分からない。民事訴訟へ進む可能性もあれば、事実関係の確認だけでさらに時間を要する可能性もある。

---

## 2022年のリークとは違う不気味さ

Rockstarにとって、GTA6の情報流出そのものは今回が初めてではない。2022年には約90本の開発途中映像がインターネットへ流出し、当時まだ正式発表前だったGTA6の姿が大規模に露出する事件が起きた。

今回のCyberleek事件は、現時点で流出量だけを比較すれば2022年と同じ規模とは言えない。ただし、今回は別の意味でRockstarにとって厄介な状況になっている。

一部の流出映像では、Jasonが壁へ弾痕を残して「LEEK」と読める文字を作る場面があると報じられている。これが真正な映像であれば、Cyberleek側が単なる保存済み動画を入手しただけではなく、何らかの形でゲームを操作できる環境へアクセスしている可能性が出てくる。

![壁に弾痕で「LEEK」と描かれた前で、拳銃を構えたキャラクターが立つゲーム画面風のイメージ。画面右上には手配度の星と所持金が表示されている](/images/news/gta6-leak-subpoena/leek-bullet-holes.webp)

*画像: 報道されている「弾痕でLEEKと書かれた場面」を分かりやすく示すためのAI生成イメージ画像。実際の流出映像ではない。*

もちろん、Cyberleek本人がゲームビルドを所有しているのか、別の人物が操作して映像だけを提供しているのか、それとも別の経路なのかは確認されていない。それでもTake-Twoにとって重要なのは、すでに公開された映像の本数よりも、その背後にいる人物がまだどれだけの未公開データへアクセスできるのかという点だろう。

現在公開されている数本の動画を消して終わる問題なのか、それとも流出経路そのものを止めなければ追加素材が出続けるのか。その違いは大きい。

---

## 8月27日の「An Extended Look」は予定通り進むのか

そして今回の事件は、Rockstarにとって非常に厄介なタイミングで起きている。8月27日にはGTA6の「An Extended Look」が公開される予定で、本来なら発売に向けたマーケティングがさらに大きく動き始める節目になるはずだった。

![Leonida Keysの海岸線を上空から捉えた公式スクリーンショット。海の上を水上機が飛び、島と橋、点在するボートが見える](/images/news/gta6-official/leonida-keys-01.webp)

ところが、その直前にCyberleekが現れた。ゲームプレイとされる映像が流出し、Leonida全体マップとされる画像が拡散し、その後も新たな映像が出続けた。さらにプレイ可能なビルドへのアクセス疑惑まで浮上し、Take-Twoは連邦裁判所を通じてMicrosoftとDiscordへ利用者情報を求める段階に入っている。

それでもRockstarは、少なくとも表向きには大きく予定を変更していない。リーク事件について詳細な声明を出さず、8月27日の公式公開へ向けたマーケティングを続けている。一方、その裏側ではTake-Twoの法務チームが流出元の特定を進めている。

表ではGTA6を予定通り見せる準備を続け、裏ではGTA6を勝手に見せた人物を追う。現在のRockstarとTake-Twoは、その二つを同時に進めていることになる。

---

## Cyberleekの「Wanted Level」は確実に上がった

GTAシリーズでは、犯罪を重ねるほどWanted Levelが上昇し、追跡する警察の規模も大きくなる。今回の状況をゲームそのものと同一視することはできないが、事件の進み方にはどこか皮肉な共通点がある。

![暗い部屋で複数のモニターに囲まれ、GTA6の画面と「LEAK LOADING...」の表示を前にしたフードの人物のイメージ](/images/news/gta6-leak-subpoena/cyberleek-monitors.webp)

*画像: 内容を分かりやすく伝えるためのAI生成イメージ画像。実際の法廷資料・流出素材・企業の内部資料ではない。*

最初は数本の映像がSNSへ流出しただけだった。その後、追加のゲームプレイが投稿され、著作権上の削除対応が行われてもCyberleek側の活動は止まらなかった。そして現在、Take-TwoはMicrosoftとDiscordが保有する利用者記録を裁判所経由で求めている。

つまりTake-Twoが追っている対象は、もはやネット上に存在するGTA6の動画だけではない。メールアドレス、IPアドレス、クラウドストレージ、Discordアカウント、関連サービスなどをたどり、その画面の向こう側にいる人物を特定しようとしている。

GTAらしく表現するなら、Cyberleekの「Wanted Level」が上がったと言っていいだろう。ただし、ここから先はゲームのように警察車両から逃げ切れば終わりという話ではない。オンラインサービスに残された記録と企業の法務部門、そして裁判所を相手にする現実の追跡になる。

9月4日までにMicrosoftとDiscordからどのような情報が提供されるのか。その前に迎える8月27日、Rockstarは予定通り「An Extended Look」を公開するのか。そしてCyberleek側は、それまでにさらに新たな素材を出してくるのか。

発売まで約3か月。GTA6本編のマーケティングとは別の場所で、もう一つの追跡劇が進んでいる。

---

> **注記：** 本記事は2026年8月22日時点の公開情報に基づく。Take-Twoが行ったと報じられているのは、MicrosoftおよびDiscordから情報を取得するためのDMCAに基づく召喚状手続きであり、Cyberleek本人に対する逮捕状や有罪判決ではない。また、召喚状に記載されたアカウント、Discordサーバー、コミュニティの存在は、その運営者や参加者がGTA6のリークに関与したことを意味しない。Cyberleekとされる人物・グループの正体や具体的な流出経路についても、現時点では公式に確定していない。本記事の画像のうちAI生成のイメージ画像には、その旨を各画像のキャプションに記載している。アイキャッチとLeonida上空の画像はRockstar Games提供の公式スクリーンショットである。`,
    titleEn:
      "Take-Two Strikes Back — Subpoenas to Microsoft and Discord Take the GTA6 Leaker Hunt to Court",
    displayTitleEn:
      "Take-Two Strikes Back\nSubpoenas to Microsoft and Discord Take the GTA6 Leaker Hunt to Court",
    descriptionEn:
      "On August 20, Take-Two was reported to have applied to a US federal court for DMCA subpoenas. The targets are not Cyberleek but Microsoft and Discord, the companies holding the records. What is sought includes account details, email addresses, IP addresses, device information — and even related data stored in OneDrive. The GTA6 leak has moved from taking videos down to identifying who put them up.",
    aiSummaryEn: [
      "On August 20, Take-Two Interactive was reported to have applied to the US District Court for the Southern District of New York for DMCA subpoenas to obtain records relating to the GTA6 leak from Microsoft and Discord. What is sought includes account details, email addresses, IP addresses, phone numbers, linked services, device information, and even GTA-, Rockstar- and Cyberleek-related data stored in OneDrive.",
      "The subpoenas are reported to list several handles — \"CYBERLEEK,\" \"CINEMATICROCKSTAR\" and \"Surfer24k\" — along with records of accounts active in certain Discord servers since June 1, 2026. The appearance of a server name tied to the community of GTA creator DarkViperAU drew attention, but being named in a subpoena does not mean the server's operators or members were involved in the leak.",
      "The deadline for producing the records is reported as September 4. This is not an arrest warrant or a judgment, however: it is the identification stage, aimed at naming the party said to have infringed copyright. Ahead of that date sits August 27 and \"An Extended Look\" — leaving Rockstar to continue its marketing in public while Take-Two chases the source in private.",
    ],
    fullContentEn: `# Take-Two Strikes Back — Subpoenas to Microsoft and Discord Take the GTA6 Leaker Hunt to Court

Since August 18, footage said to be unreleased GTA6 gameplay has been leaking onto the internet in bursts. "Cyberleek," the party claiming the leaks, raised the banner of "gamer rights," pressed demands on the games industry over digital pre-orders and physical discs, and has kept publishing new footage since. Some of that footage has even raised the suspicion that whoever is behind it does not merely possess pre-recorded video, but has access to some playable build of GTA6.

Rockstar Games has issued no major public statement about the affair. Behind the scenes, though, parent company Take-Two Interactive had already begun to move.

On August 20, Take-Two was reported to have applied to the US District Court for the Southern District of New York for DMCA subpoenas to obtain records relating to the GTA6 leak from Microsoft and Discord. What is sought is not a simple takedown but account details, email addresses, IP addresses, phone numbers, linked services, device information — and, in some cases, GTA-, Rockstar- and Cyberleek-related data stored in OneDrive.

In other words, Take-Two has moved past the stage of deleting the leaked videos and on to the stage of identifying the person who put them out.

![A desk with a map of Leonida pinned with notes reading Vice City, Port Gellhorn, Grassrivers and Ambrosia, beside a mug labeled "GTA 6 INVESTIGATION"](/images/news/gta6-leak-subpoena/leak-material-board.webp)

*Image: an AI-generated illustration made to help convey the story. It is not a real court filing, leaked material, or an internal corporate document.*

---

## Why Take-Two Went to Court

What Take-Two wants are the user records held by Microsoft and Discord. The mechanism reported to have been used is the one under Section 512(h) of the US Digital Millennium Copyright Act — the DMCA — which a copyright holder uses to ask an online service provider to disclose information identifying an alleged infringer.

![A court document reading "SUBPOENA" and "PURSUANT TO 17 U.S.C. § 512(h)" beside the Microsoft and Discord logos and a gavel](/images/news/gta6-leak-subpoena/dmca-subpoena.webp)

*Image: an AI-generated illustration made to help convey the story. It is not a real court filing, leaked material, or an internal corporate document.*

The important point here is that Take-Two has not filed a damages claim against Cyberleek. This is the stage that comes before that: identification. Take-Two is gathering information to work out who was involved in the leak and to protect the GTA6-related copyrighted works it owns.

Those works are reported to include not only gameplay footage and images but artwork, dialogue, and other creative elements contained in GTA6. Until a few days ago, what Take-Two was doing was issuing takedowns against footage circulating online. Now it is trying to trace the person behind it.

---

## Why Microsoft Became a Target

Discord is the easier of the two to explain. If Cyberleek and the communities around the leak were active on Discord, then account registration details and login history are a strong lead toward identification.

![Microsoft and Discord signage standing in front of an office building](/images/news/gta6-leak-subpoena/microsoft-discord.webp)

*Image: an AI-generated illustration made to help convey the story. It is not a real court filing, leaked material, or an internal corporate document.*

Microsoft, the other target, is not on the list for the simple reason that it runs Xbox. According to outlets that have reviewed the filings, Take-Two is seeking Microsoft's internal records associated with the name Cyberleek, along with registered email addresses, IP addresses, phone numbers, linked accounts and device information.

OneDrive has drawn particular attention. On the assumption that GTA-, Rockstar- and Cyberleek-related content connected to the leak may have been stored in Microsoft's cloud storage, records for the associated accounts are reported to fall within the scope of disclosure as well.

GitHub and other Microsoft-owned services that may have been used to store the leaked material or share links to it have also been raised as points of contact for the investigation. Microsoft, then, is a target not as a games platform company but as the owner of several online services Cyberleek may have used.

---

## Discord Asked to Disclose Multiple Accounts

The demands made of Discord are quite specific. According to reporting, the subpoena names several handles — including "CYBERLEEK," "CINEMATICROCKSTAR" and "Surfer24k" — and Take-Two is seeking identifying information for those accounts.

![An evidence folder labeled "GTA 6 LEAK INVESTIGATION" beside a note listing Discord logs, Microsoft records, OneDrive data, IP addresses, device info and email accounts, and a sticky note reading "CYBERLEEK Who are you?"](/images/news/gta6-leak-subpoena/evidence-board.webp)

*Image: an AI-generated illustration made to help convey the story. It is not a real court filing, leaked material, or an internal corporate document.*

For certain Discord servers, the scope is reported to extend to records of accounts that joined or communicated there on or after June 1, 2026. The information sought includes account IDs, registered email addresses, IP addresses at registration and last login, phone numbers, linked services and device information.

Judged by that scope, Take-Two is not chasing a single anonymous account called "Cyberleek." It is trying to trace, across services, every route that person may have used. Even if the anonymous account itself is a pseudonym, tying together IP addresses, registration details and linked accounts used across multiple services could bring it closer to whoever is behind them.

---

## The GTA Community Falls Within the Scope Too

The subpoena is reported to name a Discord server said to be associated with the community of DarkViperAU, known for videos on the GTA series — a detail that became a talking point among GTA fans.

This point needs to be handled carefully, though. A server name appearing in a subpoena does not mean the server's operators, DarkViperAU personally, or the users in it were involved in the leak. What Take-Two wants to know is whether Cyberleek or the leaked material passed through there, or whether anyone connected to it left traces there.

It is hardly unusual for a large Discord community to have thousands or tens of thousands of users passing through. A community's name appearing in a legal document and that community bearing responsibility are two things that must be kept clearly separate.

What is notable about this investigation is that the GTA6 leak has stopped being an internal matter for Rockstar and Take-Two, and has begun to widen into the ordinary online communities around GTA.

---

## Microsoft Signals Its Cooperation With Rockstar

Microsoft, for its part, has signaled that it is cooperating with Take-Two and Rockstar Games on the matter. Xbox CTO Scott Van Vliet is reported to have said, in substance, that Microsoft is working closely with both companies and supporting efforts to protect creative work and intellectual property.

Exactly what information Microsoft has provided to Take-Two is not known at this point. Nor is it certain that every demand in the subpoena will be granted as written and every record handed over.

Even so, it is clear that this leak investigation is no longer something that ends inside Rockstar. It has grown into a matter involving several organizations at once: Take-Two, Rockstar, Microsoft, Discord and a US federal court.

A handful of gameplay videos that began circulating on social media on August 18 turned, in a matter of days, into a case pulling in corporate legal departments and the courts.

---

## September 4 as a Turning Point

One date stands out in these proceedings: September 4. According to reporting, it is the deadline set for producing the records demanded from Microsoft and Discord.

![A thick stack of documents marked "SUBPOENA" set beside a gavel and scales, with a federal courtroom behind](/images/news/gta6-leak-subpoena/subpoena-sealed.webp)

*Image: an AI-generated illustration made to help convey the story. It is not a real court filing, leaked material, or an internal corporate document.*

That does not mean Cyberleek's real name will be published on September 4, of course. There is no guarantee the data provided will be made public, and Take-Two will need to analyze what it receives and cross-reference records across several services.

Still, if email addresses, IP addresses, phone numbers, device information and linked accounts line up across multiple services, that becomes a lead toward identifying the person behind the anonymous account. Using the name "Cyberleek" online is one thing; maintaining perfect anonymity across every service that person uses is another.

In that sense, September 4 could well be a turning point in this affair.

---

## A Subpoena Is Not an Arrest Warrant for Cyberleek

In the wake of this reporting, social media has produced some strong phrasings: "Take-Two has subpoenaed Cyberleek," "the leaker is going to be arrested." What is actually happening is something different.

The principal targets of these subpoenas are not Cyberleek but Microsoft and Discord, the parties holding the information. By obtaining user records from those two companies, Take-Two is trying to identify the party said to have infringed its copyright.

This subpoena is therefore neither an arrest warrant nor a judgment establishing criminal or civil liability for Cyberleek. Where things stand is this: a leak happened, takedowns followed, and now evidence and records are being gathered to establish identity.

Even if a person is identified, what legal steps Take-Two takes afterward remains unknown. It could proceed to a civil suit; it could also spend considerably longer simply establishing the facts.

---

## An Unease the 2022 Leak Did Not Have

This is not the first time GTA6 information has escaped Rockstar. In 2022, around 90 in-development videos leaked onto the internet, exposing GTA6 — then still unannounced — on a massive scale.

Measured purely by volume, the Cyberleek affair does not currently match 2022. In another sense, though, this one puts Rockstar in a more awkward position.

In some of the leaked footage, Jason is reported to shoot a wall so that the bullet holes spell out "LEEK." If that footage is genuine, it raises the possibility that Cyberleek did not merely obtain saved video, but has access in some form to an environment where the game can be played.

![A character aiming a pistol in front of a wall where bullet holes spell "LEEK," with a wanted-level star display and cash counter in the corner](/images/news/gta6-leak-subpoena/leek-bullet-holes.webp)

*Image: an AI-generated illustration made to convey the reported "LEEK spelled in bullet holes" scene. It is not the leaked footage itself.*

Whether Cyberleek personally holds a game build, whether someone else is playing and merely supplying footage, or whether it came by some other route, none of this has been confirmed. What matters to Take-Two, though, is probably not the number of videos already published but how much unreleased data the person behind them can still reach.

Is this a problem that ends once the handful of videos now online are deleted, or will more material keep appearing unless the route itself is closed? That difference is a large one.

---

## Will "An Extended Look" Go Ahead on August 27?

This affair has also landed at an extremely awkward moment for Rockstar. GTA6's "An Extended Look" is scheduled for August 27 — a milestone at which the marketing run-up to launch was supposed to shift into a higher gear.

![Official screenshot of the Leonida Keys coastline from the air — a seaplane over the water, with islands, a causeway and scattered boats below](/images/news/gta6-official/leonida-keys-01.webp)

Instead, right before it, Cyberleek appeared. Footage said to be gameplay leaked, an image said to be a full map of Leonida spread, and new videos kept coming. Suspicion of access to a playable build followed, and Take-Two has now entered the stage of seeking user information from Microsoft and Discord through a federal court.

Rockstar, at least outwardly, has not significantly changed its plans. It has issued no detailed statement about the leak and is continuing the marketing push toward the official August 27 reveal. Behind that, Take-Two's legal team is working to identify the source.

Out front, preparations to show GTA6 on schedule. Behind, a hunt for whoever showed GTA6 without permission. Rockstar and Take-Two are currently running both at once.

---

## Cyberleek's Wanted Level Has Certainly Gone Up

In the GTA series, the more crimes you commit, the higher your wanted level climbs and the larger the police response becomes. The situation cannot be equated with the game itself, but there is something ironic in how the affair has escalated.

![A hooded figure in a dark room surrounded by monitors showing GTA6 and a "LEAK LOADING..." display](/images/news/gta6-leak-subpoena/cyberleek-monitors.webp)

*Image: an AI-generated illustration made to help convey the story. It is not a real court filing, leaked material, or an internal corporate document.*

At first it was just a few videos leaking onto social media. Then more gameplay was posted, and copyright takedowns did not stop Cyberleek from continuing. Now Take-Two is seeking, through the courts, the user records held by Microsoft and Discord.

What Take-Two is pursuing, in other words, is no longer just GTA6 videos sitting on the internet. It is following email addresses, IP addresses, cloud storage, Discord accounts and linked services toward the person on the other side of the screen.

To put it in GTA terms, Cyberleek's wanted level has gone up. From here, though, this is not a chase that ends by losing the police cars. It is a real-world pursuit against the records left on online services, corporate legal departments, and a court.

What will Microsoft and Discord hand over by September 4? Before that, on August 27, will Rockstar publish "An Extended Look" as planned? And will Cyberleek put out more material in the meantime?

Roughly three months to launch. Somewhere apart from GTA6's own marketing, a second chase is under way.

---

> **Note:** This article is based on public information as of August 22, 2026. What Take-Two is reported to have done is initiate DMCA subpoena proceedings to obtain information from Microsoft and Discord; it is not an arrest warrant or a guilty verdict against Cyberleek. The appearance of an account, Discord server or community in a subpoena does not mean its operators or members were involved in the GTA6 leak. The identity of the person or group said to be Cyberleek, and the specific route the material took, have not been officially established at this point. Images that are AI-generated illustrations are labeled as such in their captions; the eyecatch and the aerial shot of Leonida are official Rockstar Games screenshots.`,
  },
  {
    id: 42,
    title:
      "GTA6はなぜ狙われたのか――「ディスクを返せ」と叫ぶCyberleek、発売3か月前に起きた異様なリーク事件",
    displayTitle:
      "GTA6はなぜ狙われたのか\n「ディスクを返せ」と叫ぶCyberleek、発売3か月前に起きた異様なリーク事件",
    description:
      "8月18日、GTA6の未公開映像とされる動画がインターネットに現れた。発売まで約3か月、「An Extended Look」公開まで約1週間という異様なタイミング。流出を主張するCyberleekが掲げたのは「ゲーマーの権利」と「デジタル予約販売をやめてディスクを出せ」という要求だった。そしてGTA6のパッケージ版には、そもそもディスクが入っていない。",
    icon: "💿",
    image: "/images/news/gta6-official/leonida-keys-03.webp",
    category: "topic",
    date: "2026-08-19",
    publishedAt: "2026-08-19 23:30",
    source: "GTA6 FEED 編集部",
    sourceUrl: "#",
    relatedArticles: [43, 39, 38],
    aiSummary: [
      "8月18日、GTA6の未公開映像とされるゲームプレイ素材とLeonidaの全体マップとされる画像がインターネットに現れた。11月19日の発売まで約3か月、Rockstarが「An Extended Look」を公開する8月27日まで約1週間という異様なタイミングだった。RockstarもTake-Twoも、流出物の真正性を公式には認めていない。",
      "流出を主張する「Cyberleek」は今回の行動をゲーム業界への抗議と位置付け、デジタル予約販売の廃止と物理メディアの提供を要求していると報じられている。一方でGTA6のパッケージ版は、箱の中身がダウンロードコードのみでディスクは含まれない「Code in Box」方式であり、11月12日から出荷される。",
      "ただしCyberleekは集めた注目を暗号資産・ミームコインへ誘導しているとの報道もあり、消費者運動としてそのまま受け取る理由はない。流出素材から指摘されているゲーム仕様は開発途中のものである可能性があり、製品版への搭載を意味しない。8月27日の公式映像が最初の答え合わせになる。",
    ],
    fullContent: `# GTA6はなぜ狙われたのか――「ディスクを返せ」と叫ぶCyberleek、発売3か月前に起きた異様なリーク事件

8月18日、インターネットにGTA6の未公開映像とされる動画が現れた。ゲームプレイ、HUD、そしてLeonida全体を描いたとされるマップ。11月19日の発売まで約3か月、しかもRockstar Gamesが「An Extended Look」を公開する8月27日まであとわずかという、Rockstarにとっては最悪に近いタイミングで起きた新たなリークだった。

しかし今回の事件には、2022年に発生した大規模流出とは違う奇妙さがある。流出を主張する「Cyberleek」は、単に発売前のゲームを盗み見せたかったわけではないという。彼らが掲げたのは「ゲーマーの権利」であり、要求のひとつは非常に分かりやすかった。

**デジタル予約販売をやめろ。物理ディスクを出せ。**

そして、その標的になったGTA6にはちょうど奇妙な商品が用意されている。店頭で買える「パッケージ版」は存在する。しかし、その箱を開けてもゲームディスクは入っていない。封入されているのはダウンロードコードだ。

今回のGTA6リークを追っていくと、単なる「発売前のゲームが漏れた」というニュースとは少し違う景色が見えてくる。ゲームを「所有する」とは、いま何を意味するのか。その議論のど真ん中に、世界で最も注目されているゲームが引きずり込まれた。

*本記事に掲載している画像は、内容を分かりやすく伝えるためにAIで生成したイメージ画像であり、今回流出したとされる映像・画像そのものではない。*

---

## 8月18日、GTA6の未公開映像がネットに現れる

今回出回ったのは、GTA6のものとされる複数のゲームプレイ素材と、Leonidaの全体マップとされる画像だ。海外のゲームメディアも相次いで流出を報じ、SNSでは映像やスクリーンショットが急速に拡散した。

![ボートの上でくつろぐジェイソンとルシアの公式スクリーンショット。奥にはVice Cityの高層ビル群が広がる](/images/news/gta6-official-screenshots-29/jason-and-lucia-03.webp)

最初に確認しておきたいのは、**Rockstar GamesもTake-Two Interactiveも、流出した内容について「本物である」と公式には認めていない**という点だ。そのため、本記事でもリークから判明したとされるゲーム仕様については確定情報として扱わない。

それでも今回の流出が大きく報じられている理由のひとつが、その後の削除対応にある。流出した動画に対して著作権上の削除対応が行われていると複数の海外メディアが伝えているからだ。

もちろん、動画が削除されたからといってCyberleek名義で公開された情報のすべてが本物になるわけではない。ただ、少なくとも何らかのRockstar所有素材が含まれている可能性を考えるうえでは、無視できない状況証拠になる。

そして今回の事件をさらに奇妙なものにしたのは、流出させた側がそこで黙らなかったことだった。

---

## Cyberleekは「ゲーマーの権利」を掲げた

流出を主張しているのは「Cyberleek」と呼ばれる人物、あるいはグループだ。海外メディアの報道によれば、Cyberleek側は今回の行動を単なるリークではなく、ゲーム業界に対する抗議として位置付けている。

![「GTA 6 LEAK」「CYBERLEEK FIGHTING FOR GAMER RIGHTS」の文字と、「NO DIGITAL PRE-ORDERS. BRING BACK PHYSICAL DISCS」という要求を並べたイメージ](/images/news/gta6-cyberleek-leak/cyberleek-demands.webp)

*画像: Cyberleekの主張を分かりやすく示すためのAI生成イメージ画像。実際の投稿や流出画像ではない。*

彼らが問題視しているのは、デジタル予約販売や物理メディアの縮小、ゲームの所有権、ディスクに収録されているコンテンツとDLCの扱いなどだ。いずれも近年のゲーム業界でたびたび議論になってきたテーマである。

Cyberleek側の主張を大まかに整理すれば、「ゲーム会社が消費者より企業側に有利なデジタル販売へ進みすぎている」というものになる。そして、その問題を世界中へ訴えるための標的として選ばれたのがGTA6だった。

---

## 「発売前に金が欲しいなら、ディスクを作れ」

Cyberleek側の主張で特に注目されたのが、デジタル予約販売への反発だ。デジタル商品は予約した瞬間にゲームそのものを受け取れるわけではなく、ユーザーは発売日まで遊べない商品に先にお金を払うことになる。

Cyberleek側はこの仕組みを問題視し、ゲーム会社が発売前に収益を得たいのであれば物理メディアを提供するべきだという趣旨の主張をしていると報じられている。

その主張の是非はともかく、GTA6を相手にこれを言い始めたことで話は妙な方向につながった。なぜならGTA6には、確かに「パッケージ版」が存在するからだ。

ただし、普通のパッケージ版ではない。

---

## GTA6の箱を開けても、ディスクは入っていない

Rockstar Gamesは6月25日にGTA6の予約受付を開始した。Standard EditionとUltimate Editionが用意され、PS5とXbox Series X|S向けに11月19日に発売される。そしてStandard Editionには「Physical Version」も存在する。

ここだけ読めば、従来のゲームソフトと同じように思える。しかしRockstarの公式情報では、Physical Versionにはダウンロードコードが封入され、ゲームディスクは箱に含まれない形式になっている。

つまり店へ行ってGTA6を買うことはできる。箱を棚に置くこともできるし、パッケージを手元に残すこともできる。しかし、その中にGTA6のゲームディスクはない。コードを入力し、ゲーム本体をインターネットからダウンロードする、いわゆる「Code in Box」だ。

![開いたゲームパッケージの中にディスクがなく、「DOWNLOAD CODE / NO DISC INCLUDED」と書かれたカードだけが入っているイメージ](/images/news/gta6-cyberleek-leak/no-disc-package.webp)

*画像: Code in Box方式を説明するためのAI生成イメージ画像。実際の製品写真ではない。*

パッケージ版は発売日の11月19日より前の11月12日から出荷・店頭受け取りが始まる予定で、コードを受け取ったユーザーはゲームを事前にダウンロードできる。

**物理的な箱はある。しかしゲームそのものはデジタルだ。**

Cyberleekが「ディスクを出せ」と主張する相手として、GTA6はあまりにも象徴的なタイトルだった。

---

## GTA6は「デジタル化するゲーム業界」の象徴になってしまった

もちろん、これはRockstarだけの話ではない。ゲーム業界全体が長い時間をかけてデジタル販売へ移行してきた。

ダウンロード販売なら在庫を抱える必要がなく、ディスクの製造や物流も減らせる。ユーザー側にも、店舗へ行く必要がない、ディスクを入れ替えなくていい、発売直後から遊べるといったメリットがある。巨大化した現代のゲームでは、発売日前にデータをダウンロードしておけるプリロードとの相性もいい。

一方、それでも物理メディアを求めるユーザーは存在する。棚に並べられること、中古として売買できる場合があること、サービスやアカウントの状態とは別に「自分がゲームを持っている」という感覚が得られること。そこには利便性とは別の価値がある。

そして議論の根底にあるのが、「買ったゲームは本当に自分のものなのか」という問いだ。Cyberleekは、その不満が最も大きく注目される場所としてGTA6を選んだように見える。

---

## ただしCyberleekを「消費者の味方」と呼ぶには問題がある

ここで話を単純な善悪にすることはできない。Cyberleekが掲げる「ゲームの所有権」や「物理メディア」というテーマそのものは以前からゲーム業界で議論されてきたが、それと**未公開のゲームデータを流出させる行為が正当化されるかどうかは別の問題**だからだ。

さらに今回、話を複雑にしている要素がある。CyberleekはGTA6リークによって集めた注目を、暗号資産・ミームコインへ誘導しているとの報道も出ている。

「ゲーマーの権利のために戦う」と主張する一方、世界最大級のゲームをリークして集めた膨大な注目が投機的な商品へ流されている。そうなれば当然、**本当にこれは消費者運動なのか**という疑問が生まれる。

少なくとも現時点で、Cyberleek側の主張をそのまま「ゲーマーを守る活動」と受け取る理由はない。彼らが掲げているテーマと、実際に取っている手段は分けて考える必要がある。

---

## それでもGTA6が標的になった理由は分かりやすい

なぜGTA6だったのか。本当の理由はCyberleek側にしか分からないが、「注目を集める」という効果だけを考えれば非常に分かりやすい。

GTA6は普通の大型ゲームではない。Rockstarが何かを公開するたびに世界中のゲームメディアが記事を書き、Trailer 2の数秒の映像から街の看板や車、建物まで分析される。予約開始後にはTake-TwoのStrauss Zelnick CEOが、その反応を「前例がない」と表現するほどの規模になった。

そんなゲームの未公開映像を流せば、世界中が見る。そして映像と一緒にCyberleekという名前も、彼らが掲げた要求も拡散される。

ゲーム業界に何かを訴えたい人間にとって、GTA6以上の拡声器はほとんど存在しない。

今回利用されたのはゲームの未公開データだけではない。**GTA6が持つ世界中の「注目」そのものだった。**

---

## では、実際に何が漏れたのか

多くの人が最も気になっているのはこちらだろう。今回出回ったとされる素材からは、GTA6のゲームシステムについてさまざまな分析が行われている。

報道やコミュニティの分析では、バスケットボールらしきゲームプレイ、6段階に見える手配度、Focusと表示されたステータス、スタミナ、車両燃料、車両コンディション、アイテムや武器の保管、Karmaあるいは評判に関連する可能性のある要素などが指摘されている。

![屋外のバスケットボールコートでプレイするキャラクターと、画面隅に手配度の星・所持金・LEVEL表示・FOCUS・スタミナ・体力のゲージが並ぶHUDのイメージ](/images/news/gta6-cyberleek-leak/basketball-gameplay.webp)

*画像: 報道で指摘されているバスケットボールやHUD要素を分かりやすく示すためのAI生成イメージ画像。実際の流出画像ではない。*

さらにLeonida全体を描いたとされるマップも拡散し、複数のCountyが記載されているとの分析が出ている。その中には、これまで広く知られていなかった地名も含まれているという。

![州全体を色分けし、複数のCountyの名前を並べた地図のイメージ。Leonidaという架空の州を表したAI生成画像](/images/news/gta6-cyberleek-leak/leonida-map.webp)

*画像: AI生成によるイメージ画像。実際に流出したとされるマップではなく、地名・地形も本物ではない。*

ただし、ここには大きな注意点がある。**リーク映像に実際に映っているものと、そこからファンが推測したゲーム仕様は同じではない。** 開発途中のビルドだった場合、その機能が11月19日の製品版に残っている保証もない。

「燃料システムらしき表示がある」と「GTA6では給油が必須になる」では意味がまったく違う。今回のリークを見る際には、最後までこの線を引いておく必要がある。

![夜の街でパトカーに追われる車と、画面隅に手配度の星・所持金・FOCUSゲージ・燃料計が並ぶHUDのイメージ](/images/news/gta6-cyberleek-leak/gameplay-hud.webp)

*画像: 報道で指摘されているHUD要素を分かりやすく示すためのAI生成イメージ画像。実際の流出画像ではない。*

---

## 2022年のリークとは違う怖さがある

GTA6とリークという言葉を聞いて、2022年の大規模流出を思い出す人は多いだろう。あの事件では大量の開発映像がインターネットへ流出し、まだ完成から遠いGTA6の姿が世界中へ晒された。

今回、現時点で確認されている規模は2022年ほどではない。そのため「GTA6史上最大のリーク」と呼ぶのは適切ではない。

しかし今回には、2022年とは別の怖さがある。**発売まで約3か月しかなく、Rockstarが「Grand Theft Auto VI: An Extended Look」を公開する8月27日が目前に迫っている**からだ。

Rockstarが長い時間をかけて準備してきた「次にGTA6を見せる日」。そのわずか約1週間前に、未公開素材とされるものがインターネットへ放り込まれた。さらにCyberleek側は、要求が受け入れられなければ追加情報を公開するという趣旨の主張までしていると報じられている。

本当に追加データを持っているのか、それが真正なGTA6のデータなのか、どれほどの量なのかは分からない。その状態のまま、8月27日へのカウントダウンだけが進んでいる。

---

## Rockstarにとって「見せる順番」もゲームの一部だった

Rockstar Gamesは、情報公開を極端なほどコントロールする会社として知られている。Trailer 1、Trailer 2、スクリーンショット、キャラクター紹介、予約開始、そしてAn Extended Look。GTA6では、それぞれの情報を公開するタイミングそのものが巨大なイベントになってきた。

重要なのは、何を見せるかだけではない。**いつ見せるか。** そこまで含めてマーケティングが設計されている。

だからこそ、リークが壊すのは秘密だけではない。Rockstarが長い時間をかけて組み立ててきた「見せる順番」そのものを壊してしまう。

本来8月27日に初めて見せる予定だったものが今回の流出物に含まれているのかは分からない。しかしRockstar側からすれば、ユーザーが初めてGTA6の新しい要素を見る場所とタイミングを自分たちで選べなくなること自体が問題になる。発売直前期のリークは、その意味で2022年とは違った重さを持つ。

---

## そして8月27日が来る

皮肉なことに、Cyberleekがどれだけ情報を流したとしても、GTA6について最も信頼できる情報源は変わらない。Rockstar Games自身だ。

8月27日には「An Extended Look」が予定されている。そこで今回リークされたとされるシステムの一部が正式に登場する可能性もあれば、まったく登場しない可能性もある。

そこで初めて「あのUIは現在も存在するのか」「指摘されていたゲームシステムは本当に実装されているのか」「Leonidaはどこまで広いのか」といった疑問の一部に、公式の答えが出るかもしれない。

リークを見るか、8月27日まで待つか。その選択はプレイヤー自身にある。

---

## 箱はある。でもディスクはない

今回の事件を追っていて、最後に残るのはやはりこの奇妙な事実だ。GTA6にはパッケージ版があり、11月12日から店頭で受け取れる。箱もあるし、ジャケットもある。しかし、その中にゲームディスクは入っていない。入っているのはゲームをダウンロードするためのコードだ。

それはデジタル時代のゲーム販売として合理的な形なのかもしれない。一方で、それを「物理版」と呼ぶことに違和感を持つ人がいるのも不思議ではない。

Cyberleekが使った手段を支持する必要はない。未公開データを流出させることと、ゲーム業界の販売方法について議論することも別問題だ。それでも今回の事件がここまで注目された背景には、もともとプレイヤー側に存在していた「ゲームを所有するとは何なのか」という不安がある。

そして2026年、その問いを最も巨大な形で突きつけるゲームがGTA6だった。

11月19日、世界中でGTA6が起動する。しかしその日、多くのプレイヤーの手元にあるのはディスクではない。データへアクセスするための権利だ。

GTA6を狙ったリーク事件は、発売前の秘密をいくつか暴いただけで終わるのか。それともゲーム業界が進めてきた「所有からアクセスへ」という変化まで巻き込んだ議論になるのか。その答えはまだ出ていない。

ただ一つ確かなのは、8月27日にRockstarが用意していた舞台へ向かう道筋が、予定していたものとは少し違うものになってしまったことだ。

---

> **注記：** 本記事は2026年8月19日時点の情報に基づく。Rockstar GamesおよびTake-Two Interactiveは、今回流出したとされるゲームプレイ映像やマップの真正性を公式には確認していない。Cyberleekの主張・要求については海外メディアによる報道に基づく。また流出素材から指摘されているゲームシステムについては、開発途中の仕様や第三者による分析が含まれる可能性があり、GTA6製品版への搭載を意味するものではない。Rockstar Gamesが公式に確認している情報と、リーク・第三者による分析については本文中で区別している。`,
    titleEn:
      "Why Was GTA6 the Target? — Cyberleek Demands \"Give Us the Disc\" in a Strange Leak Three Months Before Launch",
    displayTitleEn:
      "Why Was GTA6 the Target?\nCyberleek Demands \"Give Us the Disc\" in a Strange Leak Three Months Before Launch",
    descriptionEn:
      "On August 18, videos said to be unreleased GTA6 footage appeared online. The timing is strange: roughly three months from launch, and about a week before \"An Extended Look.\" Cyberleek, the party claiming the leak, raised the banner of \"gamer rights\" and demanded an end to digital pre-orders and the return of physical discs. And GTA6's package edition, as it happens, contains no disc at all.",
    aiSummaryEn: [
      "On August 18, gameplay material said to be unreleased GTA6 footage — along with an image said to be a full map of Leonida — appeared online. The timing was strange: roughly three months from the November 19 launch, and about a week before Rockstar's \"An Extended Look\" on August 27. Neither Rockstar nor Take-Two has officially confirmed the material as genuine.",
      "Cyberleek, the party claiming the leak, frames the act as a protest against the games industry, and is reported to demand an end to digital pre-orders and the provision of physical media. GTA6's package edition, meanwhile, is a \"code in box\" product — a download code and no disc — shipping from November 12.",
      "That said, Cyberleek is also reported to be funneling the attention it gathered toward cryptocurrency and meme coins, so there is no reason to take the campaign at face value as consumer activism. Game features inferred from the leaked material may come from an in-development build and do not mean they will ship. August 27's official video will be the first real check.",
    ],
    fullContentEn: `# Why Was GTA6 the Target? — Cyberleek Demands "Give Us the Disc" in a Strange Leak Three Months Before Launch

On August 18, videos said to be unreleased GTA6 footage appeared on the internet. Gameplay, a HUD, and an image said to be a map of all of Leonida. With roughly three months to go until the November 19 launch — and barely any time at all until August 27, when Rockstar Games publishes "An Extended Look" — it was a new leak landing at close to the worst possible moment for Rockstar.

But there is a strangeness to this incident that the massive breach of 2022 did not have. Cyberleek, the party claiming the leak, says it did not simply want to show off a stolen pre-release game. What it raised was a banner reading "gamer rights," and one of its demands could hardly be plainer.

**End digital pre-orders. Put out physical discs.**

And the GTA6 it targeted has, as it happens, a rather strange product on offer. A "package edition" you can buy in a store does exist. Open the box, though, and there is no game disc inside. What is sealed in there is a download code.

Follow this GTA6 leak and the view that opens up is a little different from a story about a game leaking before launch. What does it mean, now, to *own* a game? Right into the middle of that argument, the most closely watched game in the world has been dragged.

---

## August 18: Unreleased GTA6 Footage Appears Online

What went around this time is several pieces of gameplay material said to be from GTA6, plus an image said to be a full map of Leonida. Games outlets outside Japan reported the leak one after another, and the footage and screenshots spread rapidly on social media.

![Official screenshot of Jason and Lucia relaxing on a boat, with the Vice City skyline behind them](/images/news/gta6-official-screenshots-29/jason-and-lucia-03.webp)

The first thing to establish is that **neither Rockstar Games nor Take-Two Interactive has officially acknowledged the leaked material as genuine**. Accordingly, this article does not treat any game specification said to be revealed by the leak as settled fact.

One reason the leak has still been reported so widely is what followed: the takedowns. Multiple outlets have reported that copyright takedowns are being issued against the leaked videos.

Of course, a video being taken down does not make everything published under the Cyberleek name genuine. But as circumstantial evidence for the possibility that some Rockstar-owned material is in there, it is hard to ignore.

And what made the incident stranger still is that the leaking side did not go quiet at that point.

---

## Cyberleek Raised the Banner of "Gamer Rights"

The party claiming the leak is a person, or a group, calling itself "Cyberleek." According to reporting from outlets outside Japan, Cyberleek frames the act not as a mere leak but as a protest against the games industry.

![A hooded figure at a bank of monitors beside the words "GTA 6 LEAK," "CYBERLEEK FIGHTING FOR GAMER RIGHTS," and the demand "NO DIGITAL PRE-ORDERS. BRING BACK PHYSICAL DISCS"](/images/news/gta6-cyberleek-leak/cyberleek-demands.webp)

*Image: an AI-generated illustration made to convey Cyberleek's claims. Not an actual post or a leaked image.*

What it objects to includes digital pre-orders, the shrinking of physical media, game ownership, and how on-disc content and DLC are handled. All of these have been debated repeatedly in the industry in recent years.

Broadly summarized, Cyberleek's claim is that **"game companies have pushed too far into digital sales that favor the corporation over the consumer."** And the target chosen to put that problem in front of the whole world was GTA6.

---

## "If You Want Money Before Launch, Make a Disc"

The part of Cyberleek's argument that drew the most attention is its objection to digital pre-orders. With a digital product, pre-ordering does not hand you the game itself at that moment; users pay up front for something they cannot play until release day.

Cyberleek is reported to take issue with that arrangement, arguing in substance that if game companies want revenue before launch, they should provide physical media.

Whatever the merits of the argument, aiming it at GTA6 sent the story somewhere odd. Because GTA6 does, in fact, have a "package edition."

Just not a normal one.

---

## Open the GTA6 Box and There Is No Disc

Rockstar Games opened GTA6 pre-orders on June 25. A Standard Edition and an Ultimate Edition are on offer, releasing November 19 for PS5 and Xbox Series X|S. And the Standard Edition also comes in a "Physical Version."

Read only that far and it sounds like a conventional boxed game. But per Rockstar's official information, the Physical Version contains a download code, in a format where the game disc is not included in the box.

So you can go to a store and buy GTA6. You can put the box on a shelf, and you can keep the package on hand. But there is no GTA6 game disc inside it. You enter the code and download the game itself over the internet — the so-called "code in box."

![An opened game case with no disc inside — only a card reading "DOWNLOAD CODE / NO DISC INCLUDED"](/images/news/gta6-cyberleek-leak/no-disc-package.webp)

*Image: an AI-generated illustration explaining the code-in-box format. Not a photo of the actual product.*

The package edition is scheduled to ship and become collectible in stores from November 12, ahead of the November 19 launch day, and users who receive the code can download the game in advance.

**The physical box exists. The game itself is digital.**

As a target for Cyberleek's demand of "give us discs," GTA6 was an all too symbolic title.

---

## GTA6 Became the Symbol of a Digitizing Industry

This is not only about Rockstar, of course. The industry as a whole has spent years shifting toward digital sales.

Digital distribution means no inventory to hold, and less disc manufacturing and logistics. There are upsides for users too: no trip to a store, no swapping discs, playable the moment it launches. With modern games as large as they have become, it also pairs well with preloading, where the data can be downloaded before release day.

On the other side, users who want physical media still exist. Being able to line it up on a shelf, being able in some cases to buy and sell it used, and getting the feeling that *you own the game* separately from the state of any service or account. There is a value there apart from convenience.

And underneath the debate lies the question: **is the game you bought really yours?** Cyberleek appears to have chosen GTA6 as the place where that grievance would draw the most attention.

---

## But Calling Cyberleek "on the Consumer's Side" Has Problems

This cannot be flattened into simple good and evil. The themes Cyberleek raises — game ownership, physical media — have been debated in the industry for a long time, but **whether that justifies leaking unreleased game data is a separate question**.

And there is a further element complicating things this time. Cyberleek has also been reported to be funneling the attention gathered by the GTA6 leak toward cryptocurrency and meme coins.

While claiming to "fight for gamer rights," the enormous attention gathered by leaking one of the biggest games in the world is being channeled into speculative products. When that happens, the question naturally follows: **is this really a consumer movement?**

At least at this point, there is no reason to accept Cyberleek's claims at face value as an effort to protect gamers. The themes it raises and the methods it actually uses need to be considered separately.

---

## Still, Why GTA6 Was Targeted Is Easy to See

Why GTA6? Only Cyberleek knows the real reason, but considered purely for its effect — drawing attention — it is extremely easy to see.

GTA6 is not a normal big game. Every time Rockstar publishes anything, games media worldwide write about it, and everything from a few seconds of Trailer 2 to street signs, cars and buildings gets analyzed. After pre-orders opened, the response reached a scale that Take-Two CEO Strauss Zelnick described in terms of it being unprecedented.

Leak unreleased footage of a game like that, and the whole world looks. And alongside the footage, the name Cyberleek and the demands it raised spread too.

For anyone who wants to make a point to the games industry, there is hardly a bigger megaphone than GTA6.

What was put to use this time is not only unreleased game data. **It was the world's attention on GTA6 itself.**

---

## So What Actually Leaked?

This is what most people are most curious about. From the material said to be circulating, all sorts of analysis of GTA6's game systems has been produced.

Reporting and community analysis have pointed to what looks like basketball gameplay, a wanted level that appears to have six stages, a status labeled Focus, stamina, vehicle fuel, vehicle condition, storage for items and weapons, and elements possibly related to Karma or reputation.

![A character playing on an outdoor basketball court, with wanted stars, cash, a LEVEL readout, FOCUS, stamina and health gauges around the edges of the screen](/images/news/gta6-cyberleek-leak/basketball-gameplay.webp)

*Image: an AI-generated illustration made to show the basketball gameplay and HUD elements described in reporting. Not a leaked image.*

An image said to be a map of all of Leonida also spread, with analysis holding that several Counties are listed on it. Among them, reportedly, are place names not previously widely known.

![A map dividing a state into color-coded regions with several County names listed — an AI-generated image depicting a fictional state called Leonida](/images/news/gta6-cyberleek-leak/leonida-map.webp)

*Image: an AI-generated illustration. Not the leaked map, and the place names and terrain are not genuine.*

There is a large caveat here, though. **What actually appears in leaked footage and the game specifications fans infer from it are not the same thing.** If the material came from an in-development build, there is no guarantee those features survive into the November 19 retail version.

"There appears to be something like a fuel readout" and "GTA6 will require refueling" mean entirely different things. That line needs to be held all the way through when looking at this leak.

![A car pursued by a police car on a night street, with wanted stars, cash, a FOCUS gauge and a fuel meter arranged around the edges of the screen](/images/news/gta6-cyberleek-leak/gameplay-hud.webp)

*Image: an AI-generated illustration made to show the HUD elements described in reporting. Not a leaked image.*

---

## A Different Kind of Dread Than 2022

Say "GTA6" and "leak" and many people will think of the mass breach in 2022. In that incident a huge volume of development footage spilled onto the internet, exposing a GTA6 still far from finished to the entire world.

The scale confirmed so far this time is not on 2022's level. Calling it "the biggest GTA6 leak ever" would therefore not be appropriate.

But this time carries a dread that 2022 did not — because **there are only about three months until launch, and August 27, when Rockstar publishes "Grand Theft Auto VI: An Extended Look," is right around the corner.**

The day Rockstar has spent a long time preparing to show GTA6 next. Roughly a week before it, material said to be unreleased was thrown onto the internet. And Cyberleek is reported to have claimed, in substance, that more information will be published if its demands are not met.

Whether it actually has more data, whether that data is genuine GTA6 material, and how much of it there is are all unknown. And in that state, the countdown to August 27 keeps running.

---

## For Rockstar, the Order of Reveals Was Part of the Game Too

Rockstar Games is known as a company that controls the release of information to an extreme degree. Trailer 1, Trailer 2, screenshots, character introductions, pre-orders opening, and then An Extended Look. With GTA6, the timing of each reveal has itself become an enormous event.

What matters is not only what gets shown. **It is when it gets shown.** The marketing is designed down to that level.

Which is exactly why what a leak breaks is not only the secret. It breaks **the order of reveals itself**, assembled by Rockstar over a long stretch of time.

Whether anything originally meant to be shown for the first time on August 27 is in this leak is unknown. But from Rockstar's side, losing the ability to choose where and when users first see new GTA6 material is itself the problem. In that sense, a leak this close to launch carries a different weight than 2022's.

---

## And Then August 27 Arrives

Ironically, no matter how much Cyberleek puts out, the most reliable source on GTA6 does not change. It is Rockstar Games itself.

"An Extended Look" is scheduled for August 27. Some of the systems said to have leaked may officially appear there — or they may not appear at all.

Only then might official answers arrive for some of the questions: "Does that UI still exist?" "Are the game systems people pointed to actually implemented?" "How large is Leonida?"

Watch the leak, or wait until August 27. That choice belongs to each player.

---

## There Is a Box. But No Disc.

Following this incident, what remains at the end is that strange fact. GTA6 has a package edition, and you can pick it up in stores from November 12. There is a box, and there is cover art. But there is no game disc inside it. What is inside is a code for downloading the game.

That may well be a rational shape for selling games in the digital era. At the same time, it is no mystery that some people find calling it a "physical edition" hard to accept.

You do not have to endorse the methods Cyberleek used. And leaking unreleased data is a separate matter from debating how the games industry sells its products. Even so, behind how much attention this incident drew is an unease that already existed among players: what does it mean to own a game?

And in 2026, the game putting that question in its largest possible form is GTA6.

On November 19, GTA6 boots up around the world. But on that day, what most players hold is not a disc. It is the right to access data.

Will the leak aimed at GTA6 end as nothing more than a few pre-launch secrets exposed? Or will it become a debate that pulls in the shift the industry has been driving — from ownership to access? That answer is not in yet.

The one certain thing is that the path toward the stage Rockstar had prepared for August 27 has become a little different from the one it planned.

---

> **Note:** This article is based on information as of August 19, 2026. Neither Rockstar Games nor Take-Two Interactive has officially confirmed the authenticity of the gameplay footage or map said to have leaked. Cyberleek's claims and demands are based on reporting by outlets outside Japan. Game systems described from the leaked material may include in-development specifications or third-party analysis, and do not mean those features will ship in the retail version of GTA6. Throughout the article, information officially confirmed by Rockstar Games is distinguished from the leak and from third-party analysis.`,
  },
  {
    id: 41,
    title:
      "GTA RPがRockstar公式ランチャーに入る日 NoPixel Vクローズドβ9月8日、FiveMはどこへ行くのか",
    displayTitle:
      "GTA RPがRockstar公式ランチャーに入る日\nNoPixel Vクローズドβ9月8日、FiveMはどこへ行くのか",
    description:
      "GTA RPを遊ぶには、まずFiveMを自分で入れる。その手順の外側に、9月8日、Rockstar Games Launcherという入口が現れる。GTA RP最大手NoPixelの新環境「NoPixel V」が公式ランチャー上でクローズドβを開始すると報じられた。ただし招待制で、ホワイトリストはリセットされる。何が変わるのか、そして何がまだ分かっていないのかを見ていく。",
    icon: "🕹️",
    image: "/images/news/nopixel-v-rockstar-launcher/eyecatch.webp",
    category: "topic",
    date: "2026-08-16",
    publishedAt: "2026-08-16 15:30",
    source: "GTA6 FEED 編集部",
    sourceUrl: "https://nopixel.net/",
    relatedArticles: [18, 30, 40],
    aiSummary: [
      "GTA RP最大手NoPixelの新環境「NoPixel V」が、2026年9月8日にRockstar Games Launcher上でクローズドβを開始すると報じられた。9月1日にはローンチトレーラーが控える。これまで必須だった「FiveMを別途入れる」という一段の外側に、公式ランチャーという入口が現れることになる。",
      "ただし誰でも入れるわけではない。始まるのは招待制のクローズドβで、第1陣は約450人規模。ホワイトリストはリセットされ、4.0のホワイトリストはVの参加権にはならない。一方でNoPixel 4.0とPublicは継続するため、招待されなかった人が行き場を失うわけではない。",
      "技術面では、Koilが説明したという「フルリビルド」の中身が読めない。RockstarINTELはFiveMベースとし、GTA BOOMは新しい自社フレームワークと報じており、基盤の説明が食い違っている。日程・人数・フルリビルドはいずれもKoilの告知を各メディアが報じた内容で、Rockstar Gamesの公式発表ではない。",
    ],
    fullContent: `# GTA RPがRockstar公式ランチャーに入る日 NoPixel Vクローズドβ9月8日、FiveMはどこへ行くのか

GTA RPを遊ぶには、まずFiveMを自分で入れる。ここ数年、それは当たり前の手順だった。

その手順の外側に、9月8日、Rockstar Games Launcherという入口が現れる。GTA RP最大手NoPixelの新環境「NoPixel V」が、公式ランチャー上でクローズドβを開始すると報じられた。

明らかになっているのは次の内容である。

- **9月1日**：ローンチトレーラー公開。英国夏時間17時（日本時間9月2日午前1時）、NoPixel公式サイトにて。
- **9月8日**：Rockstar Games Launcher上でクローズドβ開始。
- 参加は招待制。第1陣はクリエイターと既存プレイヤーを中心に約450人規模とされる。
- 招待はフェーズを分けて拡大。第1フェーズの発送はすでにほぼ完了しているという。
- ホワイトリストはリセット。NoPixel 4.0の権利はVに自動では引き継がれない。
- NoPixel 4.0とPublicは継続。V開始後も稼働・サポートされる。
- NoPixel創設者Koilは、ここに至るまでにNoPixelの「**フルリビルド**」を行ったと説明している。

ただし、誰でも入れるわけではない。本記事は2026年8月16日時点の情報にもとづく。

---

## 「FiveMを入れる」という一段が消える

これまでNoPixelで遊ぼうと思ったら、順番はこうだった。GTA Vを買う。FiveMを別途ダウンロードして入れる。FiveMを起動する。サーバー一覧からNoPixelに繋ぐ。

慣れた人には何でもない手順だが、この「別途入れる」の一段が、実際にはかなり効いていた。非公式のMODプラットフォームを自分でインストールする時点で、遊ぶ人は「PCゲームのMODに慣れている層」にほぼ絞られる。配信で見て面白そうだと思った人が、その日のうちに始められる遊びではなかった。

NoPixel VはRockstar Games Launcherで配信される。GTA Vを起動するのと同じ場所に、RPサーバーが並ぶということだ。GTA RPが「外部のMODでやる遊び」から「公式のランチャーから入れる遊び」へ動き始める。今回のニュースで一番大きいのは、たぶんここである。

---

## で、自分は入れるのか

結論から言うと、9月8日の時点ではほとんどの人は入れない。

始まるのはクローズドβで、入口は招待だけだ。NoPixel公式サイトのCreator Rosterにも「アクセスは制限されており、招待制のみ（Access is limited, available by invitation only.）」とはっきり書かれている。公式ランチャーに並ぶことと、誰でもダウンロードできることは別の話だ。

報道によれば、最初に招待されるのは約450人規模のクリエイターと既存プレイヤー。この数字はサーバーの最大同時接続数ではなく、あくまで第1陣の人数として伝えられている。招待はフェーズを分けて広げていく方針で、第1フェーズの発送はすでにほぼ終わっているという。Koilは、まだ招待が届いていない人も対象外になったわけではない、という趣旨の説明をしている。

そしてここが既存プレイヤーには重い話になる。NoPixel Vではホワイトリストがリセットされる。Koilはこれを「本当の意味でのリセットと仕切り直し」と表現したと報じられている。つまり、NoPixel 4.0のホワイトリストを持っていることが、そのままVの参加権にはならない。何年も遊んできた人も、Vに入るには改めて招待される必要がある。

---

## NoPixel 4.0は終わらない

では、招待されなかった人は行き場を失うのか。ここは安心していい。

NoPixel 4.0とNoPixel Publicは、V開始後も稼働とサポートを続けると報じられている。9月8日以降しばらくは、NoPixel V（クローズドβ）と4.0とPublicが並走する形になる。βの人数を段階的に増やしていくうえでも、既存サーバーを残すのは理にかなっている。

ひとつ宙に浮いているのが、4.0で運用されていた有料の優先枠だ。これがVに引き継がれるのかどうかについて、GamesRadar+も「Koilは触れていない」として不明としている。

---

## Koilが言った「フルリビルド」が読めない

今回、技術的にいちばん引っかかるのがこの言葉だ。

Koilは、ここに至るまでにNoPixelの「フルリビルド（full rebuild）」を行った、と説明したと報じられている。4.0を作り替えた、ではなく、作り直した、である。

問題は、その中身が外から読めないことだ。報道が割れている。RockstarINTELはNoPixel Vを「FiveMベース」と書いている。一方でGTA BOOMは、Vが動くのはコミュニティのFiveMではなく新しい自社フレームワークだと報じられている、と書いている。同じ対象について、基盤の説明が真っ向から食い違っている状態だ。

FiveMの上でNoPixel側を全部作り直したのか。中身はFiveM系のままで、ユーザーからそれが見えなくなっただけなのか。それともRockstarとの協業で、まったく別の層が用意されたのか。どれなのかは、まだ誰も外からは言えない。

はっきりさせる材料は9月1日に出てくる。トレーラーで「FiveMを別途入れる必要があるか」と「Cfx.re／FiveMの名前が画面に出るか」の2点が見えれば、フルリビルドが何を指していたのかはかなり絞れる。

---

## なぜRockstarはここまでやるのか

念のため確認しておくと、NoPixel Vは「Rockstarが運営するRPサーバー」ではない。公式サイトの表現は「Rockstar Gamesとの協業で生まれたGTA RPの次の進化」であり、運営はあくまでNoPixel側だ。それでも、Rockstarがここまで踏み込んでいるのは事実である。

この動きは今年始まったものではない。

- **2023年8月**：RockstarがFiveM／RedMを開発するCfx.reチームを買収
- **2025年9月**：Rockstarとの協業によるNoPixel Vを発表。展開先として「Rockstar Games Launcherおよび他のPCプラットフォーム」を明記
- **2026年2月**：GTA V向けの非公式マルチプレイヤーalt:Vが、Take-Twoの要請を受けて終了を発表
- **2026年6月**：Rockstar Games Launcherの内部データにNoPixel V関連のアセットが見つかったとの指摘
- **2026年9月1日**：ローンチトレーラー公開予定
- **2026年9月8日**：招待制クローズドβ開始予定

非公式の実装は整理され、買収して自社に取り込んだFiveMと、その上に育った最大のコミュニティは公式ランチャー側へ引き寄せられていく。3年かけて進んできた線の、いまのところの先端が9月8日ということになる。

なお、2025年の発表にあった「other PC platforms（他のPCプラットフォーム）」が何を指すのかは、いまだに明かされていない。Steam版やEpic版のGTA Vなのか、FiveMも含む言い方なのか。ここも9月1日の見どころのひとつだ。

---

## GTA6の話をしないわけにはいかない

ここからは編集部の見立てである。

まず前提として、RockstarもNoPixelも「NoPixel VはGTA6のRPの実験だ」とは一言も言っていない。NoPixel V自体はGTA VのRPだ。だから「NoPixel V＝GTA6のRP」ではない。

そのうえで、GTA6の発売（11月19日）の2か月前にこれが始まる、という並びは無視しづらい。

これまでのGTA Onlineは、Rockstarがコンテンツを作り、プレイヤーがそれを遊ぶ構造だった。対してFiveM圏では、コミュニティがサーバーを立て、開発者がスクリプトを書き、プレイヤーがルールと世界観を育て、配信者がそこで物語を生む。コンテンツを供給しているのが運営ではなく参加者側、という構造がすでに何年も回っている。NoPixelはその象徴だ。

Cfx.reの買収、NoPixelとの協業、公式ランチャーへの接続。この3つを並べると、Rockstarがそのエコシステムを自社のプラットフォームの内側へ持ってこようとしている、という読み方は十分に成り立つ。もし「公式ランチャーを開く→RPコンテンツがある→コミュニティのサーバーに入る」という導線が本当に機能するなら、届く相手はFiveMを知っている層だけではなくなる。

その先にGTA6があるのかどうかは、まだ何も発表されていない。

---

## 9月1日、最初の答え合わせ

現時点で分かっていないことは多い。FiveMクライアントが要るのかどうか。一般ユーザー向けの応募がいつ始まるのか。オープンβと正式サービスの時期。同時接続の上限。課金や優先キューの扱い。Vのゲームシステムそのもの。

その最初の答え合わせが、9月1日午後5時（英国夏時間／日本時間9月2日午前1時）のローンチトレーラーになる。ランチャー上でNoPixel Vがどう見えるのか、FiveMの名前が出るのか出ないのか、Rockstarがこれを何と呼ぶのか。派手な街並みや車より、そういう細部のほうが今回は重要かもしれない。

そしてその1週間後、9月8日にクローズドβが始まる。

---

注記：本記事は2026年8月16日時点の情報にもとづく。NoPixel公式サイトの記載を除き、9月1日・9月8日の日程、招待人数、ホワイトリストのリセット、「フルリビルド」などはNoPixel創設者Koilの告知を各メディア（RockstarINTEL・GamesRadar+・PCGamesN・GTA BOOM）が報じた内容であり、Rockstar Gamesの公式発表ではない。NoPixel Vの技術基盤については報道が一致しておらず、本記事では断定していない。日本時間は英国夏時間（UTC+1）を基準に換算した目安である。新しい公式情報が出次第、内容を更新する。`,
    titleEn:
      "The Day GTA RP Arrives on Rockstar's Official Launcher — NoPixel V Closed Beta on September 8, and Where FiveM Goes From Here",
    displayTitleEn:
      "The Day GTA RP Arrives on Rockstar's Official Launcher\nNoPixel V Closed Beta on September 8, and Where FiveM Goes From Here",
    descriptionEn:
      "To play GTA RP, you first install FiveM yourself. On September 8, a doorway appears outside that procedure: the Rockstar Games Launcher. NoPixel V, the new environment from the biggest name in GTA RP, is reported to begin a closed beta on the official launcher. Access is invitation-only, though, and the whitelist is being reset. We look at what changes — and at what is still unknown.",
    aiSummaryEn: [
      "NoPixel V, the new environment from the biggest name in GTA RP, is reported to begin a closed beta on the Rockstar Games Launcher on September 8, 2026, with a launch trailer due on September 1. A doorway is appearing outside the step that has until now been mandatory: installing FiveM separately.",
      "Not that anyone can walk in. What begins is an invitation-only closed beta, with roughly 450 people in the first wave. The whitelist is being reset, so a 4.0 whitelist does not grant access to V. NoPixel 4.0 and Public continue running, however, so those left uninvited are not left without anywhere to play.",
      "On the technical side, what Koil's reported \"full rebuild\" actually means cannot be read from outside. RockstarINTEL calls it FiveM-based while GTA BOOM reports a new in-house framework — two accounts of the foundation that contradict each other. The dates, the headcount, and the full rebuild all come from Koil's announcement as reported by various outlets, not from an official Rockstar Games announcement.",
    ],
    fullContentEn: `# The Day GTA RP Arrives on Rockstar's Official Launcher — NoPixel V Closed Beta on September 8, and Where FiveM Goes From Here

To play GTA RP, you first install FiveM yourself. For the past several years, that has simply been the procedure.

On September 8, a doorway appears outside that procedure: the Rockstar Games Launcher. NoPixel V, the new environment from NoPixel — the biggest name in GTA RP — is reported to begin a closed beta on the official launcher.

Here is what has been made clear so far.

- **September 1**: Launch trailer goes up. 5:00 p.m. British Summer Time (September 2, 1:00 a.m. Japan time), on the official NoPixel site.
- **September 8**: Closed beta begins on the Rockstar Games Launcher.
- Access is invitation-only. The first wave is put at roughly 450 people, centered on creators and existing players.
- Invitations widen in phases. The first phase's sends are said to be essentially complete already.
- The whitelist is reset. NoPixel 4.0 privileges do not carry over to V automatically.
- NoPixel 4.0 and Public continue, running and supported after V starts.
- NoPixel founder Koil has explained that getting here involved a "**full rebuild**" of NoPixel.

Not that anyone can walk in. This article is based on information as of August 16, 2026.

---

## The Step Where You "Install FiveM" Disappears

Until now, playing on NoPixel went like this. Buy GTA V. Download and install FiveM separately. Launch FiveM. Connect to NoPixel from the server list.

For anyone used to it, that is nothing. But in practice, the "install it separately" step mattered a great deal. The moment you have to install an unofficial mod platform yourself, the audience narrows to roughly "people comfortable with PC game mods." Someone who saw a stream and thought it looked fun could not simply start that same day.

NoPixel V will be distributed through the Rockstar Games Launcher. That means RP servers sitting in the same place you launch GTA V from. GTA RP starts moving from "something you do on an external mod" to "something you enter from the official launcher." That, more than anything, is probably the big part of this news.

---

## So, Can You Get In?

To put it plainly: as of September 8, most people cannot.

What begins is a closed beta, and the only way in is an invitation. The Creator Roster on NoPixel's official site spells it out: "Access is limited, available by invitation only." Sitting on the official launcher and being downloadable by anyone are two different things.

According to reporting, the first invitations go to roughly 450 creators and existing players. That figure is not the server's maximum concurrent player count — it is described as the size of the first wave. Invitations are meant to widen in phases, and the first phase's sends are said to be essentially complete. Koil has explained, in substance, that people who have not yet received an invite have not been ruled out.

And here is the part that lands hard on existing players. NoPixel V resets the whitelist. Koil is reported to have described it as a true reset and a fresh start. In other words, holding a NoPixel 4.0 whitelist does not by itself grant access to V. Even someone who has played for years needs a fresh invitation to get in.

---

## NoPixel 4.0 Isn't Going Away

So does that leave the uninvited with nowhere to go? On that count, you can relax.

NoPixel 4.0 and NoPixel Public are reported to keep running and supported after V starts. For a while after September 8, NoPixel V (closed beta), 4.0, and Public will run side by side. Keeping the existing servers also makes sense if the beta's headcount is going to be raised in stages.

One thing left hanging is the paid priority queue that ran on 4.0. On whether it carries over to V, GamesRadar+ treats the matter as unknown, noting that Koil did not address it.

---

## Koil Said "Full Rebuild," and No One Can Read It

Technically, this is the phrase that snags the most.

Koil is reported to have explained that getting here involved a "full rebuild" of NoPixel. Not that 4.0 was reworked — that it was rebuilt.

The trouble is that what that means cannot be read from the outside. The reporting is split. RockstarINTEL describes NoPixel V as "FiveM-based." GTA BOOM, meanwhile, writes that V is reported to run on a new in-house framework rather than the community's FiveM. Two accounts of the same thing's foundation, pointing in opposite directions.

Was everything on the NoPixel side rebuilt on top of FiveM? Are the internals still FiveM-family, with that fact simply made invisible to users? Or has an entirely different layer been prepared through the collaboration with Rockstar? Which of these it is, nobody outside can yet say.

The material that settles it arrives on September 1. If the trailer answers two things — whether FiveM has to be installed separately, and whether the Cfx.re/FiveM name appears on screen — what "full rebuild" referred to narrows considerably.

---

## Why Is Rockstar Going This Far?

For the record, NoPixel V is not "an RP server operated by Rockstar." The official site's wording is "the next evolution of GTA RP created in collaboration with Rockstar Games," and operation remains on NoPixel's side. Even so, it is a fact that Rockstar has stepped in this far.

This movement did not start this year.

- **August 2023**: Rockstar acquires the Cfx.re team, developers of FiveM and RedM
- **September 2025**: NoPixel V, produced in collaboration with Rockstar, is announced, explicitly naming "the Rockstar Games Launcher and other PC platforms" as its destinations
- **February 2026**: alt:V, an unofficial multiplayer client for GTA V, announces its shutdown at Take-Two's request
- **June 2026**: Assets related to NoPixel V are reported found in the Rockstar Games Launcher's internal data
- **September 1, 2026**: Launch trailer scheduled
- **September 8, 2026**: Invitation-only closed beta scheduled to begin

The unofficial implementations get cleared away, while FiveM — acquired and brought in-house — and the largest community grown on top of it are drawn toward the official launcher. September 8 is, for now, the leading edge of a line that has been advancing for three years.

Incidentally, what "other PC platforms" from the 2025 announcement refers to still has not been disclosed. The Steam or Epic versions of GTA V? A phrasing that includes FiveM? That, too, is one of the things to watch for on September 1.

---

## We Can't Avoid Talking About GTA6

From here on, this is the editorial team's reading.

To start with, neither Rockstar nor NoPixel has said a word about NoPixel V being an experiment for GTA6 RP. NoPixel V is itself GTA V roleplay. So NoPixel V does not equal GTA6 RP.

With that said, the sequencing — this starting two months before GTA6's release on November 19 — is hard to ignore.

GTA Online has been built around Rockstar making content and players playing it. In the FiveM sphere, by contrast, communities stand up servers, developers write scripts, players grow the rules and the setting, and streamers generate stories inside it. A structure where the content is supplied by the participants rather than the operator has been turning for years already. NoPixel is its emblem.

The Cfx.re acquisition, the NoPixel collaboration, the connection to the official launcher. Line those three up and the reading holds up well: that Rockstar is trying to bring that ecosystem inside its own platform. If a route of "open the official launcher → RP content is there → join a community server" genuinely works, the people it reaches are no longer only those who already know FiveM.

Whether GTA6 lies beyond that, nothing has been announced.

---

## September 1: The First Answers

Plenty remains unknown. Whether a FiveM client is required. When applications for general users begin. The timing of an open beta and full service. The concurrency cap. How payments and priority queues are handled. V's game systems themselves.

The first answers come with the launch trailer on September 1 at 5:00 p.m. British Summer Time (September 2, 1:00 a.m. Japan time). How NoPixel V appears within the launcher, whether the FiveM name shows up or not, what Rockstar calls this. This time, those details may matter more than the flashy streets and cars.

And a week later, on September 8, the closed beta begins.

---

Note: This article is based on information as of August 16, 2026. Apart from what is written on the official NoPixel site, the September 1 and September 8 dates, the invite numbers, the whitelist reset, and the "full rebuild" all come from NoPixel founder Koil's announcement as reported by various outlets (RockstarINTEL, GamesRadar+, PCGamesN, GTA BOOM), and are not official Rockstar Games announcements. Reporting does not agree on NoPixel V's technical foundation, and this article does not assert a conclusion. Japan times are approximate, converted from British Summer Time (UTC+1). We will update this article as new official information emerges.`,
  },
  {
    id: 40,
    title:
      "GTA6新映像はなぜNetflix先行公開なのか？『サイバーパンク』成功例から見るゲームIPの新時代",
    displayTitle:
      "GTA6新映像はなぜNetflix先行公開なのか？\n『サイバーパンク』成功例から見るゲームIPの新時代",
    description:
      "GTA6の新映像「An Extended Look」は、8月27日にNetflixで先行公開され、その6時間後にYouTubeと公式サイトでも公開されると報じられている。なぜYouTubeではなくNetflixが先なのか。Netflixアニメ『Cyberpunk: Edgerunners』が『Cyberpunk 2077』の再注目につながった事例を手がかりに、ゲームIPが一般エンタメ層へ広がる流れを整理した。",
    icon: "📺",
    image: "/images/news/gta6-netflix-cyberpunk/eyecatch.webp",
    category: "topic",
    date: "2026-08-11",
    publishedAt: "2026-08-11 15:30",
    source: "GTA6 FEED 編集部",
    sourceUrl: "https://www.rockstargames.com/newswire",
    relatedArticles: [39, 38, 19],
    aiSummary: [
      "GTA6の新映像「Grand Theft Auto VI: An Extended Look」は、米東部時間8月27日15時にNetflixで先行公開され、その6時間後に公式YouTubeとGTA6公式サイトでも公開される予定だと報じられている。新作ゲームの映像がまずNetflixで見られるという、かなり異例の公開形式になる。",
      "背景には、ゲームIPをコアなゲームファンだけでなく、映画・ドラマ・アニメを見る一般エンタメ層へ広げる狙いがあると見られる。参考になるのがNetflixアニメ『Cyberpunk: Edgerunners』で、配信後に『Cyberpunk 2077』は1週間にわたり毎日100万人以上のプレイヤーを記録したと報じられている。",
      "ただし誤解しないようにしたいのは、これはGTA6本編がNetflixで遊べるという話ではないこと。映像の具体的な内容や尺もRockstarは正式に明かしておらず、8月27日当日まで確定していない。",
    ],
    fullContent: `# GTA6新映像はなぜNetflix先行公開なのか？『サイバーパンク』成功例から見るゲームIPの新時代

Rockstar Gamesが発表した「Grand Theft Auto VI: An Extended Look」は、単なる新トレーラー以上の意味を持っているかもしれない。

この映像は、米東部時間8月27日15時にNetflixで先行公開され、その6時間後となる同日21時にRockstar公式YouTubeとGTA6公式サイトでも公開される予定だと報じられている。つまり、GTA6の新映像がまずNetflixで見られるという、かなり異例の公開形式になる。

なぜRockstarは、世界中のファンが待っているGTA6の新映像を、YouTubeではなくNetflixで先行公開するのか。

その背景には、ゲームIPをゲームファンだけでなく、映画・ドラマ・アニメを見る一般エンタメ層へ広げていく流れがある。

本記事は2026年8月11日時点の情報にもとづく。

---

## GTA6は「ゲームの新作」から「世界的エンタメイベント」へ

GTA6は、すでにゲーム業界の枠を超えた存在になっている。

普通のゲームトレーラーであれば、YouTubeで同時公開するだけでも十分に話題になる。だが今回は、Netflixで先行公開し、その後YouTubeと公式サイトで一般公開する形が取られる。

これは、GTA6の新映像を単なる「予告編」ではなく、映画やドラマのプレミア配信に近いエンタメイベントとして見せようとしているとも考えられる。

The Vergeによると、Netflix側はGTA6への期待とファンダムを「前例がない」と表現し、Netflix会員に先に届けられることを歓迎している。

つまり今回の提携は、GTA6を日頃からゲーム情報を追っているコアファンだけでなく、「GTAは知っているけど、公式YouTubeまでは追っていない」一般層にも届ける狙いがあると見られる。

---

## 参考になるのが『Cyberpunk: Edgerunners』の成功例

この流れを考える上で、非常に分かりやすい例がある。

それが、Netflixアニメ『Cyberpunk: Edgerunners』だ。

『Cyberpunk: Edgerunners』は、Netflix、CD PROJEKT RED、TRIGGERによるアニメ作品として発表された。Netflix公式によると、同作は『Cyberpunk 2077』と同じ世界を舞台にした全10話のスタンドアロン作品で、CD PROJEKT REDが制作に参加し、TRIGGERがアニメーションを担当している。

このアニメは、単なる外伝作品にとどまらなかった。

配信後、『Cyberpunk 2077』は大きく再注目され、GameSpotは、EdgerunnersアップデートとNetflixアニメ公開後に『Cyberpunk 2077』が1週間にわたり毎日100万人以上のプレイヤーを記録したと報じている。

GameDeveloperも、CD PROJEKT REDの発表として、同期間に『Cyberpunk 2077』が1日あたり100万人のプレイヤーを集め、その中には新規プレイヤーと復帰プレイヤーの両方が含まれていたと伝えている。

もちろん、『Cyberpunk 2077』の再評価はアニメだけの効果ではない。アップデート、セール、ゲーム本編の改善など、複数の要素が重なっていた。

それでも『Cyberpunk: Edgerunners』が、ゲームをプレイしていなかった層にナイトシティの世界観を届け、結果的に本編への関心を大きく押し上げたことは間違いない。

---

## GTA6×Netflixも「ゲームを知らない層」への入口になる

今回のGTA6とNetflixの組み合わせも、この文脈で見るとかなり意味がある。

『Cyberpunk: Edgerunners』は、アニメという形でゲームの世界観を一般エンタメ層に届けた。一方、GTA6の「An Extended Look」は、アニメ化ではなく新映像の先行公開だ。

しかし狙いとしては近い。

つまり、GTA6をゲームファンだけの話題にせず、Netflixを見るような一般層にも「これは世界的なエンタメ作品なのだ」と印象づけることができる。

GTA6はすでに知名度の高いタイトルだが、Netflixで先行公開されることで、ゲームに詳しくない人にも「GTA6の新映像がNetflixで配信されるほど大きな出来事なんだ」と伝わる。

これは、ゲームIPを映画・ドラマ・アニメと同じ土俵に乗せるマーケティングだと言える。

---

## Netflix側にも大きなメリットがある

Netflixにとっても、GTA6との提携は大きな意味を持つ。

GTA6の新映像は、普通にYouTubeで公開しても世界中で再生される。それを6時間だけでもNetflixで先行公開できるなら、Netflixは「ゲーム業界最大級の瞬間」に関わることができる。

これはNetflixが、映画やドラマだけでなく、ゲームやインタラクティブコンテンツを含めた総合エンタメプラットフォームであることを示す動きとも言える。

実際、NetflixとRockstarは過去にもGTAトリロジーのモバイル版配信で提携しており、今回のGTA6先行公開も、突然の一回限りの動きではなく、Netflixがゲーム領域で存在感を高めていく流れの延長線上にある。

---

## ただし、GTA6がNetflixで遊べるわけではない

ここは誤解しないようにしたい。

今回発表されているのは、GTA6の新映像がNetflixで先行公開されるということだ。

GTA6本編がNetflixで遊べるわけではない。また、現時点でRockstarは「An Extended Look」の具体的な内容や尺を正式には明かしていない。Windows Centralも、今回何が見られるのかはまだ秘密だと整理している。

そのため、ゲームプレイ映像になるのか、世界観紹介になるのか、どれくらいの長さになるのかは、まだ確定していない。

---

## まとめ：GTA6は"見るゲームIP"としても広がり始めている

『Cyberpunk: Edgerunners』の成功は、ゲームIPがNetflixを通じて一般エンタメ層へ広がり、ゲーム本編の再評価やプレイヤー復帰につながる可能性を示した。

今回のGTA6新映像のNetflix先行公開も、それに近い流れの中で見ることができる。

GTA6は、ただゲームファンに向けて新情報を出すだけではなく、Netflixという巨大な配信プラットフォームを使って、ゲームを普段追っていない層にも届く形でマーケティングを始めている。

8月27日の「Grand Theft Auto VI: An Extended Look」は、GTA6の中身を知るための重要映像であると同時に、ゲームIPが映画・ドラマ・アニメと並ぶ巨大エンタメとして扱われる時代を象徴する出来事になるかもしれない。

---

注記:本記事は2026年8月11日時点の情報にもとづく考察である。公開日時は告知時点のもので、変更される可能性がある。『Cyberpunk 2077』のプレイヤー数についてはGameSpot・GameDeveloperの報道、Netflix側のコメントについてはThe Vergeの報道を参照した。映像の具体的な内容は公開後に確認・更新する。`,
    titleEn:
      "Why Is GTA6's New Video Premiering on Netflix First? What Cyberpunk: Edgerunners' Success Tells Us About a New Era for Game IP",
    displayTitleEn:
      "Why Is GTA6's New Video Premiering on Netflix First?\nWhat Cyberpunk: Edgerunners' Success Tells Us About a New Era for Game IP",
    descriptionEn:
      "GTA6's new video \"An Extended Look\" is reported to premiere on Netflix on August 27, with YouTube and the official site following six hours later. Why Netflix first rather than YouTube? Using the Netflix anime Cyberpunk: Edgerunners — which helped bring Cyberpunk 2077 back into the spotlight — as a reference point, we look at how game IP is reaching a general entertainment audience.",
    aiSummaryEn: [
      "GTA6's new video, \"Grand Theft Auto VI: An Extended Look,\" is reported to premiere on Netflix at 3 p.m. ET on August 27, with the official YouTube channel and the GTA6 site following six hours later. Having a new game video appear on Netflix first is a highly unusual release format.",
      "Behind it appears to be an intent to extend game IP beyond core gaming fans to the general entertainment audience that watches films, dramas, and anime. The Netflix anime Cyberpunk: Edgerunners is the reference case: after it aired, Cyberpunk 2077 was reported to have drawn more than a million players every day for a week.",
      "One thing not to misread, though: this does not mean GTA6 itself will be playable on Netflix. Rockstar has not officially revealed what the video contains or how long it runs, so none of that is settled until August 27.",
    ],
    fullContentEn: `# Why Is GTA6's New Video Premiering on Netflix First? What Cyberpunk: Edgerunners' Success Tells Us About a New Era for Game IP

"Grand Theft Auto VI: An Extended Look," announced by Rockstar Games, may carry more meaning than just another trailer.

The video is reported to premiere on Netflix at 3 p.m. Eastern Time on August 27, with Rockstar's official YouTube channel and the GTA6 official site following six hours later, at 9 p.m. the same day. In other words, the new GTA6 video will be seen on Netflix first — a highly unusual release format.

Why would Rockstar premiere a GTA6 video that fans around the world are waiting for on Netflix rather than YouTube?

Behind it is a broader movement to extend game IP beyond gaming fans to the general entertainment audience that watches films, dramas, and anime.

This article is based on information as of August 11, 2026.

---

## GTA6 Has Gone From "A New Game" to "A Global Entertainment Event"

GTA6 has already become something bigger than the games industry.

For an ordinary game trailer, a simultaneous YouTube release would be more than enough to generate buzz. This time, though, the video premieres on Netflix and only afterward goes out to the general public on YouTube and the official site.

That suggests an effort to present the new GTA6 video not as a mere "preview," but as an entertainment event closer to the premiere of a film or a drama.

According to The Verge, Netflix has described the anticipation and fandom around GTA6 as unprecedented, and welcomes the chance to deliver it to Netflix members first.

The partnership, then, appears aimed at reaching not only the core fans who follow gaming news daily, but also the wider audience who "know GTA but don't follow the official YouTube channel."

---

## Cyberpunk: Edgerunners Is the Reference Case

There is a very clear example to consider alongside this.

That example is the Netflix anime *Cyberpunk: Edgerunners*.

*Cyberpunk: Edgerunners* was announced as an anime production by Netflix, CD PROJEKT RED, and TRIGGER. According to Netflix, it is a standalone 10-episode work set in the same world as *Cyberpunk 2077*, with CD PROJEKT RED involved in its production and TRIGGER handling the animation.

The anime did not stay a mere side story.

After it aired, *Cyberpunk 2077* drew renewed attention on a large scale. GameSpot reported that, following the Edgerunners update and the release of the Netflix anime, *Cyberpunk 2077* recorded more than a million players every day for a week.

GameDeveloper likewise reported, citing CD PROJEKT RED's announcement, that over that period *Cyberpunk 2077* drew a million players a day, including both new and returning players.

Of course, the reappraisal of *Cyberpunk 2077* was not the anime's effect alone. Updates, sales, and improvements to the game itself all overlapped.

Even so, there is no question that *Cyberpunk: Edgerunners* delivered the world of Night City to people who had not played the game, and in doing so substantially raised interest in the game itself.

---

## GTA6 × Netflix Is Also an Entry Point for People Who Don't Follow Games

Seen in that context, this GTA6-and-Netflix combination carries real significance.

*Cyberpunk: Edgerunners* delivered a game's world to a general entertainment audience in the form of an anime. GTA6's "An Extended Look," by contrast, is not an anime adaptation but an early release of a new video.

The intent, however, is similar.

That is: rather than keeping GTA6 a topic among gaming fans alone, it can impress on the kind of general audience that watches Netflix that "this is a global entertainment work."

GTA6 is already a highly recognizable title, but premiering on Netflix conveys, even to people who don't follow games closely, that "a new GTA6 video is a big enough event to be distributed on Netflix."

This is marketing that puts game IP on the same footing as films, dramas, and anime.

---

## There Are Big Upsides for Netflix Too

For Netflix, the partnership with GTA6 carries considerable weight.

A new GTA6 video would be watched worldwide even if it simply went up on YouTube. If Netflix can premiere it — even by only six hours — it gets to be part of one of the biggest moments in the games industry.

It can also be read as a move showing that Netflix is a comprehensive entertainment platform covering games and interactive content, not just films and dramas.

In fact, Netflix and Rockstar have partnered before on distributing the mobile versions of the GTA trilogy, so this early GTA6 premiere is not a sudden one-off but an extension of Netflix steadily building its presence in the games space.

---

## That Said, GTA6 Will Not Be Playable on Netflix

This is the point not to misread.

What has been announced is that the new GTA6 video will premiere early on Netflix.

GTA6 itself will not be playable on Netflix. And as of now, Rockstar has not officially revealed what "An Extended Look" contains or how long it runs. Windows Central has likewise noted that what we will actually see remains a secret.

Whether it turns out to be gameplay footage or an introduction to the world, and how long it runs, is therefore still unsettled.

---

## Summary: GTA6 Is Starting to Spread as an IP People Watch, Too

The success of *Cyberpunk: Edgerunners* showed that game IP can reach a general entertainment audience through Netflix, and that this can lead to a reappraisal of the game itself and the return of players.

The Netflix premiere of this new GTA6 video can be seen as part of a similar movement.

GTA6 is not simply putting out new information for gaming fans; it has begun marketing itself through Netflix, an enormous distribution platform, in a form that reaches people who don't normally follow games.

"Grand Theft Auto VI: An Extended Look" on August 27 is an important video for understanding what GTA6 actually is — and it may also come to symbolize an era in which game IP is treated as a giant entertainment property standing alongside film, drama, and anime.

---

Note: This article is an analysis based on information as of August 11, 2026. The premiere date and time are as announced and are subject to change. Player figures for *Cyberpunk 2077* draw on reporting by GameSpot and GameDeveloper, and Netflix's comments on reporting by The Verge. The specific contents of the video will be confirmed and updated after it goes live.`,
  },
  {
    id: 39,
    title:
      "【公式発表】GTA6の新映像「An Extended Look」8月27日にNetflixで独占先行公開——YouTube・公式サイトは6時間後",
    displayTitle:
      "【公式発表】GTA6の新映像「An Extended Look」8月27日にNetflixで独占先行公開\nYouTube・公式サイトは6時間後",
    description:
      "Rockstarが8月6日、GTA6の新映像「An Extended Look」を8月27日にNetflixで独占先行公開すると発表。Netflixとのこの種の提携はシリーズ初となる。公開は米東部時間8月27日午後3時(日本時間28日午前4時)にNetflixで始まり、6時間後に公式YouTubeとGTA6公式サイトでも配信される。発売日は11月19日で変更なし。",
    icon: "🎬",
    image: "/images/news/netflix-extended-look/eyecatch.webp",
    category: "release",
    date: "2026-08-07",
    publishedAt: "2026-08-07 02:30",
    source: "GTA6 FEED 編集部",
    sourceUrl: "https://www.rockstargames.com/newswire",
    relatedArticles: [40, 33, 38],
    aiSummary: [
      "Rockstarは2026年8月6日、GTA6の新映像「Grand Theft Auto VI: An Extended Look」を8月27日にNetflixで独占先行公開すると発表した。Netflixとこの種の提携を結ぶのはシリーズ初となる。",
      "公開はまずNetflixで米東部時間8月27日午後3時(日本時間28日午前4時)に始まり、その6時間後に公式YouTubeチャンネルとGTA6公式サイトでも配信される。Netflix会員は一般公開より6時間早く見られるが、未加入でも同日中に視聴できる。",
      "発売日は2026年11月19日で変更はない。ファンの間では「トレーラー3」に相当する新映像と受け止められているが、Rockstar自身は「トレーラー」ではなく「An Extended Look」という名称を用いている。映像の具体的な内容は公開当日に判明する。",
    ],
    fullContent: `# 【公式発表】GTA6の新映像「An Extended Look」8月27日にNetflixで独占先行公開——YouTube・公式サイトは6時間後

Rockstar Gamesは2026年8月6日、グランド・セフト・オートVI(GTA6)の新たな映像「Grand Theft Auto VI: An Extended Look」を、8月27日にNetflixで独占先行公開すると発表した。Netflixとこの種の提携を結ぶのはシリーズ初となる。公開はまずNetflixで米東部時間の8月27日午後3時に始まり、その6時間後に公式YouTubeチャンネルとGTA6公式サイトでも配信される。発売日は2026年11月19日で変更はない。

本記事は2026年8月7日時点の情報にもとづく。

---

## いつ・どこで見られるか

公開のスケジュールは配信先によって時間が異なる。日本時間(JST)に換算すると次のようになる。

- Netflix(独占先行):8月27日 午後3時(米東部時間)＝日本時間8月28日 午前4時。視聴先は netflix.com/VI。
- 公式YouTubeチャンネル・GTA6公式サイト:8月27日 午後9時(米東部時間)＝日本時間8月28日 午前10時。

つまりNetflixの会員は、YouTubeや公式サイトでの一般公開より6時間早く映像を見られることになる。Netflixに加入していない場合でも、同日中に公式YouTubeなどで視聴が可能である。

---

## 「An Extended Look」とは

今回公開されるのは、GTA6の内容をこれまでより詳しく紹介する新映像とされる。Rockstarはこの映像を「An Extended Look(拡張された特別映像)」と名付けており、これまでに公開されたトレーラーに続く、ゲームのより踏み込んだ内容を示すものと位置づけられている。

注目すべきは、これがNetflixとの初の提携によって届けられる点である。Netflixでノンフィクションシリーズを統括するブランドン・リーグ氏は、GTA6をめぐる期待と熱狂は前例のないものだとしたうえで、その物語の次章をNetflixの会員に先行して届けられることを歓迎するとコメントしている。同社はこの提携を、あらゆる媒体の意欲的な作品を大きな観客に届けるという自社の方向性を反映したものと説明している。

なお、この映像はファンの間で「第3弾トレーラー」に相当する新映像と受け止められているが、Rockstar自身は「トレーラー」ではなく「An Extended Look」という名称を用いている点は区別しておきたい。

---

## 背景と現状

GTA6は、前作GTA5の発売から13年を経ての新作にあたる。Netflixが独自番組の制作に本格的に乗り出したのもGTA5と同じ時期であり、両者の提携は、媒体を越えたコンテンツ展開の一例として紹介されている。

GTA6の予約購入は、すでに6月25日に開始されている。発売は2026年11月19日で、対象プラットフォームはPlayStation 5とXbox Series X|S。PC版については現時点で発売時期が発表されていない。

公式のあらすじは、不利な状況に置かれてきたジェイソンとルシアが、ある「簡単な仕事」の失敗をきっかけに、レオニダ州全体に広がる犯罪の陰謀に巻き込まれ、生き延びるために互いに頼り合うことになる、という筋書きを示している。「An Extended Look」では、この物語や舞台となるバイスシティの姿が、これまでより詳しく描かれると見られる。

---

## まとめ

Rockstarが公式に明らかにしたのは、「GTA6の新映像『An Extended Look』を8月27日にNetflixで独占先行公開すること」「同日、6時間後に公式YouTubeとGTA6サイトでも公開すること」「発売日は11月19日で変わらないこと」である。

Netflixとの初の提携という形式そのものが今回の特徴であり、シリーズの映像公開が単なるトレーラー配信を超えたイベントとして扱われつつあることを示している。映像の具体的な中身は公開当日に判明する。公開後、内容が明らかになり次第あらためて整理する。

---

注記:本記事は2026年8月7日時点のRockstar GamesおよびNetflixの公式発表にもとづく。公開日時は告知時点のもので、変更される可能性がある。日本時間は米東部夏時間(UTC−4)を基準に換算した目安である。映像の具体的な内容は公開後に確認・更新する。`,
    titleEn:
      "Official: GTA6's New Video \"An Extended Look\" Premieres Exclusively on Netflix on August 27 — YouTube and the Official Site Six Hours Later",
    displayTitleEn:
      "Official: GTA6's New Video \"An Extended Look\" Premieres Exclusively on Netflix on August 27\nYouTube and the Official Site Six Hours Later",
    descriptionEn:
      "On August 6, Rockstar announced that a new GTA6 video, \"An Extended Look,\" will premiere exclusively on Netflix on August 27. It is the series' first partnership of this kind with Netflix. It goes live on Netflix at 3 p.m. ET on August 27, with the official YouTube channel and the GTA6 site following six hours later. The release date remains November 19.",
    aiSummaryEn: [
      "On August 6, 2026, Rockstar announced that a new GTA6 video, \"Grand Theft Auto VI: An Extended Look,\" will premiere exclusively on Netflix on August 27. It is the first partnership of this kind between the series and Netflix.",
      "It goes live first on Netflix at 3 p.m. ET on August 27, with the official YouTube channel and the GTA6 site following six hours later. Netflix members see it six hours ahead of the general release, but non-subscribers can still watch it the same day.",
      "The release date remains November 19, 2026. Fans have received it as the equivalent of a \"third trailer,\" but Rockstar itself uses the name \"An Extended Look\" rather than \"trailer.\" What the video actually contains will be known on the day it goes live.",
    ],
    fullContentEn: `# Official: GTA6's New Video "An Extended Look" Premieres Exclusively on Netflix on August 27 — YouTube and the Official Site Six Hours Later

On August 6, 2026, Rockstar Games announced that a new *Grand Theft Auto VI (GTA6)* video, "Grand Theft Auto VI: An Extended Look," will premiere exclusively on Netflix on August 27. It is the series' first partnership of this kind with Netflix. It goes live first on Netflix at 3 p.m. Eastern Time on August 27, and six hours after that it will also be distributed on the official YouTube channel and the GTA6 official site. The release date remains November 19, 2026, unchanged.

This article is based on information as of August 7, 2026.

---

## When and Where You Can Watch

The schedule differs depending on where you watch.

- Netflix (exclusive early premiere): August 27 at 3 p.m. ET. Watch at netflix.com/VI.
- Official YouTube channel and the GTA6 official site: August 27 at 9 p.m. ET.

In other words, Netflix members get to see the video six hours ahead of the general release on YouTube and the official site. Even without a Netflix subscription, you can watch it the same day on the official YouTube channel and elsewhere.

---

## What "An Extended Look" Is

What's being released is described as a new video that introduces the contents of GTA6 in more detail than before. Rockstar has named it "An Extended Look," positioning it as a follow-up to the trailers released so far that goes deeper into the game itself.

What stands out is that it is being delivered through a first-ever partnership with Netflix. Brandon Riegg, who oversees nonfiction series at Netflix, commented that the anticipation and excitement around GTA6 is unprecedented, and that the company welcomes the chance to bring the next chapter of its story to Netflix members first. Netflix has described the partnership as reflecting its direction of bringing ambitious work in every medium to a large audience.

It's worth noting that while fans have received this as the equivalent of a "third trailer," Rockstar itself uses the name "An Extended Look" rather than "trailer" — a distinction worth keeping in mind.

---

## Background and Current Status

GTA6 arrives 13 years after the release of its predecessor, GTA5. Netflix began producing its own original programming in earnest around the same period as GTA5, and the partnership between the two has been presented as an example of content reaching across media.

Pre-orders for GTA6 opened on June 25. The release date is November 19, 2026, on PlayStation 5 and Xbox Series X|S. No release window has been announced for the PC version at this point.

The official synopsis describes Jason and Lucia, who have long been dealt a bad hand, getting pulled into a criminal conspiracy spreading across the state of Leonida after one "easy score" goes wrong, leaving them to rely on each other to survive. "An Extended Look" is expected to show this story and the setting of Vice City in more detail than before.

---

## Summary

What Rockstar has officially revealed is this: the new GTA6 video "An Extended Look" premieres exclusively on Netflix on August 27; the same day, six hours later, it also goes live on the official YouTube channel and the GTA6 site; and the release date remains November 19.

The format itself — a first-ever partnership with Netflix — is what characterizes this announcement, and it shows that video releases for the series are increasingly being treated as events rather than simple trailer drops. What the video actually contains will be known on the day. We will revisit it once the contents are clear.

---

Note: This article is based on official announcements from Rockstar Games and Netflix as of August 7, 2026. The premiere date and time are as announced and are subject to change. Japan times are approximate conversions based on U.S. Eastern Daylight Time (UTC−4). The specific contents of the video will be confirmed and updated after it goes live.`,
  },
  {
    id: 38,
    title:
      "GTA6のパッケージ版、国内でも予約開始——中身はディスクではなくDLコード、通常版9,800円",
    displayTitle:
      "GTA6のパッケージ版、国内でも予約開始\n中身はディスクではなくDLコード、通常版9,800円",
    description:
      "『GTA6』のパッケージ版が7月24日から国内でも予約開始。ただし箱の中身はダウンロードコードのみで、ディスクは同梱されない「コードインボックス」仕様。通常版9,800円(税込)、配送は11月12日、プレイ開始は11月19日。ディスク版が後から出る見込みはなく、内容と購入前に押さえておきたい点をまとめた。",
    icon: "📦",
    image: "/images/news/package-preorder/eyecatch.webp",
    category: "release",
    date: "2026-07-24",
    publishedAt: "2026-07-24 16:00",
    source: "GTA6 FEED 編集部",
    sourceUrl: "https://www.amazon.co.jp/dp/B0H9XJ3V8K",
    relatedArticles: [37, 19, 28],
    aiSummary: [
      "『GTA6』のパッケージ版が7月24日から国内でも予約受付を開始した。ただし箱に入っているのはダウンロードコードのみで、ディスクは同梱されない「コードインボックス」仕様。価格は通常版9,800円・アルティメット版12,280円(いずれも税込)で、デジタル版と同額となる。配送は11月12日、プレイ開始は11月19日。",
      "重要なのは、待ってもディスク版は出ないという点。The Hollywood Reporterの報道で、GTA6のディスク生産計画は発売時にも以降にも存在しないことが判明している。パッケージとして手元に残したいなら、今回のコードインボックス版が唯一の選択肢になる。",
      "コードは日本のPlayStationアカウント専用で、発売日から170日で失効する。中古売却や貸与はできない。物として持つこだわりがなければデジタル版と中身は同じ。予約は公式・正規店に限り、便乗詐欺に注意したい。",
    ],
    fullContent: `# GTA6のパッケージ版、国内でも予約開始——中身はディスクではなくDLコード、通常版9,800円

『グランド・セフト・オートVI(GTA6)』のパッケージ版について、7月24日から国内でも予約の受付が始まった。ただし箱の中に入っているのはダウンロードコードだけで、ディスクは同梱されない「コードインボックス」仕様となる。価格は通常版が9,800円(税込)。GTA6 FEEDが、内容と購入前に押さえておきたい点をまとめた。

本記事は2026年7月24日時点の情報にもとづく。

---

## 予約の概要

国内で予約が始まったパッケージ版の要点は次のとおり。

- 仕様:コードインボックス。箱にはダウンロードコードのみが封入され、ディスクは入っていない。
- 価格:通常版9,800円(税込)、アルティメット・エディション12,280円(税込)。デジタル版と同額となる。
- 配送日:2026年11月12日。プレイ開始日は11月19日。
- 対応機種:PS5、Xbox Series X|S。CERO区分はZ(18才以上のみ対象)で、18歳未満は購入できない。
- 取扱店:Amazon.co.jp、ヨドバシ.com、セブンネットショッピング、楽天市場の各ショップなどで受付が始まっている。

![ヨドバシ.comのGTA6(PS5・コードインボックス版)商品ページ。価格9,800円(税込)、ゴールドポイント980ポイント(10%還元)、配送日2026年11月12日〜／プレイ開始日11月19日、返品不可と表示されている](/images/news/package-preorder/yodobashi.webp)

*ヨドバシ.comの商品ページ。9,800円(税込)・ゴールドポイント10%還元で、発売日にお届け(返品不可)と案内されている*

主な予約ページは次のとおり。

- Amazon.co.jp(PS5版 コードインボックス):https://www.amazon.co.jp/dp/B0H9XJ3V8K
- ヨドバシ.com:https://www.yodobashi.com/product/100000001010003749/

どちらも価格は9,800円(税込)、送料無料で共通している。違いはポイント還元で、記事執筆時点ではヨドバシ.comがゴールドポイント10%還元(980ポイント相当)、Amazonが1%(98ポイント)となっている。Amazonは「予約商品の価格保証」の対象で、配送予定日は11月12日、ヨドバシ.comは発売日の到着を案内している(返品不可)。実質的な負担や届く日で選ぶなら、この差は確認しておきたい。

![Amazon.co.jpのGTA6(PS5・コードインボックス版)商品ページ。価格9,800円(税込)、ポイント98pt(1%)、無料配送11月12日木曜日にお届け、「予約商品の価格保証」対象と表示されている](/images/news/package-preorder/amazon.webp)

*Amazon.co.jpの商品ページ。9,800円(税込)・ポイント1%で、無料配送は11月12日、「予約商品の価格保証」の対象*

コードは11月12日開始のプリロードに対応しており、事前にダウンロードを済ませておける。つまり、手元に届く物としてはコードの入った箱だが、遊び始めるまでの流れはデジタル版とほぼ変わらない。

なお、デジタル版はすでにPlayStation StoreとMicrosoft Storeで予約できる。

---

## ディスク版を待つ、という選択肢はない

購入を迷っている人にとって、ここが最も重要な判断材料になる。

一時期、「12月に本物のディスク入り版が出るのではないか」という情報が広まったが、その後The Hollywood Reporterの報道により否定された。同紙の情報筋によれば、GTA6のディスクを生産する計画は発売時にも以降にも存在しない。つまり、待っていればディスク版が出る、という前提で予約を見送っても、その版が登場する見込みは現時点でない。

したがって、パッケージという形で手元に置きたい場合、選べるのは今回のコードインボックス版になる。

---

## 買う前に知っておきたいこと

コードインボックスは、従来のパッケージ版と同じ感覚で扱えない部分がある。

- 中古として売ったり、友人に貸したりはできない。コードは一度アカウントに登録すると、そのアカウントに紐づくためだ。
- 封入されるコードは、日本で登録されたPlayStationアカウントを持つ人だけが使用できる。海外アカウントで遊ぶつもりの場合は注意したい。
- コードには有効期限がある。PS5版の商品情報によれば、発行日である発売日(2026年11月19日)から170日後に失効する。買ったまま何年も寝かせておく、という扱いはできない。
- 実質的にはデジタル版と同じものを、箱という形で受け取る買い方になる。棚に並べたい、贈り物にしたい、店頭のポイントやセールを使いたい、といった動機がなければ、デジタル版で予約しても得られる体験は変わらない。
- 一方で、店舗独自の特典やポイント還元、値引きが付く場合があり、価格や在庫は店ごとに異なる。予約前に各店の表示を確認しておきたい。

なお、エディションを問わず11月20日までに予約・購入すると、特典の「ヴィンテージ・バイスシティパック」が付与される。パッケージ版では初回購入分の封入特典として扱われ、数量に限りがあるとされている。

---

## 予約は正規のルートで

GTA6の予約開始以降、その人気に便乗した詐欺が世界的に増えている。セキュリティ企業のカスペルスキーは、公式サイトや大手ストアそっくりに作られた偽の予約ページが多言語で確認されていると警告している。日本語話者も例外ではない。

予約は、Rockstar公式サイト、PlayStation Store、Microsoft(Xbox)ストア、そして本記事で挙げたAmazon.co.jpやヨドバシ.comといった正規の販売店を使うのが安全だ。検索結果や交流サイトのリンクから飛ぶ場合は、URLの綴りが正規のものと一致しているかを確認したい。前金や暗号資産での支払いを求めるサイト、「今だけ」「残りわずか」と急かすページには応じないほうがよい。

---

## まとめ

国内でもパッケージ版の予約が始まったが、中身はディスクではなくダウンロードコードで、通常版の価格はデジタル版と同じ9,800円。配送は11月12日、遊べるのは11月19日からとなる。ディスク版が後から出る見込みはないため、箱という形で残したい人は今回のコードインボックス版が唯一の選択肢になる。逆に、物として持つことにこだわりがなければ、デジタル版で予約しても中身は変わらない。選ぶ際は、店舗ごとのポイント還元と到着日、そしてコードが日本のPlayStationアカウント専用で、発売日から170日という有効期限がある点を押さえておきたい。`,
    titleEn:
      "GTA6 Physical Edition Now Up for Pre-Order in Japan — Inside Is a Download Code, Not a Disc; Standard Edition ¥9,800",
    displayTitleEn:
      "GTA6 Physical Edition Now Up for Pre-Order in Japan\nInside Is a Download Code, Not a Disc; Standard Edition ¥9,800",
    descriptionEn:
      "The physical edition of GTA6 opened for pre-order in Japan on July 24. But the box contains only a download code — no disc — in a “code-in-a-box” format. The standard edition is ¥9,800 (incl. tax), shipping on November 12, playable from November 19. There is no disc version coming later, so here's what's inside and what to check before you buy.",
    aiSummaryEn: [
      "The physical edition of GTA6 opened for pre-order in Japan on July 24. But the box holds only a download code — no disc — in a \"code-in-a-box\" format. The standard edition is ¥9,800 and the Ultimate Edition ¥12,280 (both incl. tax), the same as the digital versions. Shipping is November 12, and play begins November 19.",
      "The key point: waiting will not get you a disc version. The Hollywood Reporter has reported that there is no plan to produce GTA6 discs at launch or afterward. If you want it as a physical package, this code-in-a-box edition is the only option.",
      "The code is only usable with a Japan-registered PlayStation account and expires 170 days after release day. It cannot be resold used or lent out. If you don't care about owning a physical object, the digital version has the same contents. Pre-order only through official and legitimate stores, and beware of scams riding on the hype.",
    ],
    fullContentEn: `# GTA6 Physical Edition Now Up for Pre-Order in Japan — Inside Is a Download Code, Not a Disc; Standard Edition ¥9,800

Pre-orders for the physical edition of *Grand Theft Auto VI (GTA6)* opened in Japan on July 24. However, all that's inside the box is a download code — no disc is included, in a "code-in-a-box" format. The standard edition is priced at ¥9,800 (incl. tax). GTA6 FEED has summarized what's inside and the points worth knowing before you buy.

This article is based on information as of July 24, 2026.

---

## Pre-Order Overview

Here are the key points of the physical edition now on pre-order in Japan.

- Format: code-in-a-box. The box contains only a download code; no disc is included.
- Price: standard edition ¥9,800 (incl. tax), Ultimate Edition ¥12,280 (incl. tax). The same as the digital versions.
- Shipping date: November 12, 2026. Play start date: November 19.
- Platforms: PS5 and Xbox Series X|S. The CERO rating is Z (18 and over only), so those under 18 cannot buy it.
- Retailers: pre-orders have opened at Amazon.co.jp, Yodobashi.com, Seven Net Shopping, Rakuten Ichiba shops, and others.

![The Yodobashi.com product page for GTA6 (PS5, code-in-a-box edition). It shows the price of ¥9,800 (incl. tax), 980 Gold Points (10% back), shipping from November 12, 2026, a play start date of November 19, and "no returns"](/images/news/package-preorder/yodobashi.webp)

*The Yodobashi.com product page. At ¥9,800 (incl. tax) with 10% Gold Point rewards, it lists delivery on release day (no returns)*

The main pre-order pages are as follows.

- Amazon.co.jp (PS5, code-in-a-box): https://www.amazon.co.jp/dp/B0H9XJ3V8K
- Yodobashi.com: https://www.yodobashi.com/product/100000001010003749/

Both are ¥9,800 (incl. tax) with free shipping. The difference is in reward points: at the time of writing, Yodobashi.com offers 10% Gold Points (worth 980 points) and Amazon 1% (98 points). Amazon's listing is covered by its "pre-order price guarantee," with an estimated delivery of November 12, while Yodobashi.com states delivery on release day (no returns). If you're choosing by your real out-of-pocket cost or by when it arrives, this difference is worth checking.

![The Amazon.co.jp product page for GTA6 (PS5, code-in-a-box edition). It shows the price of ¥9,800 (incl. tax), 98 points (1%), free delivery on Thursday, November 12, and that it is covered by the "pre-order price guarantee"](/images/news/package-preorder/amazon.webp)

*The Amazon.co.jp product page. At ¥9,800 (incl. tax) with 1% points, free delivery is November 12, and it is covered by the "pre-order price guarantee"*

The code supports the preload that begins on November 12, so you can finish downloading in advance. In other words, while the physical item you receive is a box with a code inside, the flow up to actually starting to play is essentially the same as the digital version.

Note that the digital version is already available for pre-order on the PlayStation Store and the Microsoft Store.

---

## There Is No "Wait for a Disc Version" Option

For anyone on the fence about buying, this is the single most important factor in the decision.

For a while, word spread that "a real disc-included version might come out in December," but this was later denied by reporting from The Hollywood Reporter. According to the paper's sources, there is no plan to produce GTA6 discs, either at launch or afterward. In other words, even if you hold off on pre-ordering on the assumption that a disc version will appear if you wait, there is currently no prospect of such a version being released.

Therefore, if you want it in hand as a physical package, the option available to you is this code-in-a-box edition.

---

## What to Know Before You Buy

There are aspects in which code-in-a-box cannot be handled the same way as a traditional physical edition.

- You cannot sell it used or lend it to a friend. That's because once the code is registered to an account, it becomes tied to that account.
- The enclosed code can only be used by someone with a PlayStation account registered in Japan. Take care if you intend to play on an overseas account.
- The code has an expiration date. According to the PS5 version's product information, it expires 170 days after the issue date, which is the release day (November 19, 2026). You can't buy it and leave it sitting for years.
- In practice, this is a way of receiving the same thing as the digital version, in the form of a box. Unless you have a motive like wanting to line it up on a shelf, give it as a gift, or use in-store points or sales, pre-ordering the digital version gets you the same experience.
- On the other hand, stores may attach their own bonuses, point rewards, or discounts, and price and stock differ by store. It's worth checking each store's listing before you pre-order.

Note that, regardless of edition, if you pre-order or purchase by November 20, you receive the "Vintage Vice City Pack" bonus. For the physical edition, it is treated as an enclosed bonus for the initial print run, and is said to be limited in quantity.

---

## Pre-Order Through Legitimate Channels

Since GTA6 pre-orders opened, scams riding on the game's popularity have increased worldwide. Security firm Kaspersky has warned that fake pre-order pages built to look just like the official site or major stores have been confirmed in multiple languages. Japanese speakers are no exception.

The safe approach is to pre-order through legitimate sellers: the official Rockstar site, the PlayStation Store, the Microsoft (Xbox) store, and retailers like the Amazon.co.jp and Yodobashi.com listed in this article. If you arrive via a link from search results or social media, check that the spelling of the URL matches the legitimate one. It's best not to engage with sites that demand upfront payment or cryptocurrency, or pages that rush you with "today only" or "almost sold out."

---

## Summary

Pre-orders for the physical edition have opened in Japan too, but the contents are a download code rather than a disc, and the standard edition's price is the same ¥9,800 as the digital version. Shipping is November 12, and it becomes playable from November 19. Since there is no prospect of a disc version coming out later, this code-in-a-box edition is the only choice for those who want to keep it in physical form. Conversely, if you don't care about owning a physical object, the contents are the same even if you pre-order the digital version. When choosing, keep in mind the per-store point rewards and arrival dates, and the fact that the code is exclusive to a Japanese PlayStation account and has a 170-day expiration from release day.`,
  },
  {
    id: 37,
    title:
      "GTA6の予約詐欺・偽ベータに注意——公式そっくりの偽サイトが世界で拡散、カスペルスキーが警告",
    displayTitle:
      "GTA6の予約詐欺・偽ベータに注意\n公式そっくりの偽サイトが世界で拡散、カスペルスキーが警告",
    description:
      "GTA6の予約開始(6月25日)以降、その人気に便乗したサイバー詐欺が世界で急増している。公式そっくりの偽予約サイトや、「ベータ版」を装うマルウェア配布が、個人情報やカード情報、アカウントを狙う。詐欺サイトは多言語で作られており、日本のユーザーも標的になりうる。手口と対策を整理した。",
    icon: "⚠️",
    image: "/images/news/sagisaito/eyecatch.webp",
    category: "topic",
    date: "2026-07-10",
    publishedAt: "2026-07-10 22:30",
    source: "GTA6 FEED 編集部",
    sourceUrl: "https://www.kaspersky.com/",
    relatedArticles: [19, 28, 35],
    aiSummary: [
      "GTA6の予約が始まった6月25日以降、その人気に便乗したサイバー詐欺が世界で急増している。セキュリティ企業カスペルスキーが警告を発しており、偽ページは多言語で作られているため、日本語話者も標的になりうる。",
      "主な手口は三つ。Rockstar公式や正規小売そっくりの偽予約サイトでカード情報や金銭をだまし取るもの、「ベータ版」「早期アクセス」「リーク版」を装ってマルウェアを配布するもの、そしてゲーム名に似せたトークンで暗号資産を狙うものだ。「残りわずか」などと焦らせるのが共通の特徴。",
      "最も確実な見分け方は「GTA6に公開ベータや早期アクセスは存在しない」という事実。Rockstarが公表しているのは11月19日発売と6月25日予約開始だけで、それらをうたう時点で詐欺である。予約は公式サイト(rockstargames.com)と正規ストアに限り、URLを確認し、支払い情報を安易に入力しないこと。",
    ],
    fullContent: `# GTA6の予約詐欺・偽ベータに注意——公式そっくりの偽サイトが世界で拡散、カスペルスキーが警告

GTA6の予約開始(6月25日)以降、その人気に便乗したサイバー詐欺が世界で急増している。セキュリティ企業のカスペルスキーが警告を発しており、公式そっくりの偽予約サイトや、「ベータ版」を装うマルウェア配布などが、個人情報やカード情報、アカウントを狙っている。詐欺サイトは多言語で作られており、日本のユーザーが標的になる可能性も十分にある。GTA6 FEEDが、手口と対策を整理した。

本記事は2026年7月10日時点の情報にもとづく。

なお、本記事に添えた画像は、公式さながらの見た目を模倣した偽の予約サイトの例である（画像提供：カスペルスキー）。一見して本物と区別するのは難しい。

---

## いま何が起きているのか

カスペルスキーによれば、GTA6の予約が始まった直後から、サイバー犯罪者がこの熱狂を餌にした「幅広い詐欺の手口」を展開し始めているという。同社のOlga Altukhovaは、こうした詐欺は期待が高まる時期を狙って周到に仕掛けられ、興奮によって利用者の警戒心が下がり、偽の緊急感が生まれやすいことを突いてくる、と指摘している。

![公式サイトそっくりに作られた偽の予約ページの例。トレーラーや宣伝用アートまで流用し、「Pre-order Now」ボタンで登録フォームへ誘導する](/images/news/sagisaito/rd7uUoPxLGWds5RBKSztLW-678-80.png.webp)

*公式サイトそっくりに作られた偽の予約ページの例。「Pre-order Now」ボタンで登録フォームへ誘導する（画像提供：カスペルスキー）*

確認された偽ページは複数の言語で作られており、世界中の利用者を無差別に狙っていることがうかがえる。英語圏だけの問題ではなく、日本語話者も対象に含まれうるという前提で身構えておきたい。

---

## 主な手口

報告されている詐欺は、大きく三つに分けられる。

1. 偽の予約サイト。最も多いのがこの手口だ。Rockstar公式やPlayStation Store、正規の小売店そっくりのデザインで作られ、本物のトレーラーや宣伝用アートまで流用している。「今すぐ予約」ボタンから登録フォームへ誘導し、氏名・メール・住所・電話番号・支払い情報などを入力させる。だがゲームが届くことはなく、カード情報を抜かれたり、架空の予約で金銭をだまし取られたりする。偽の星5レビューや年齢レーティング、予約価格の表示を並べて、本物らしく見せかける例も確認されている。

2. 偽のベータ版・リーク配布。「GTA6ベータ版」「早期アクセス」「リーク版」などと称してダウンロードを促す手口だ。SNSや動画プラットフォームで「安全にダウンロードする方法」と題した動画を拡散し、コメント欄で「これは本物だ」と装って信用させる。ダウンロードしたファイルを実行するとマルウェアに感染し、データの窃取、アカウントの乗っ取り、ブラウザに保存したパスワードや暗号資産ウォレット情報の流出、さらには端末の遠隔操作にまでつながる恐れがある。「GTA 6 Beta」といった偽のAndroidアプリ(APK)も出回っている。

![公式サイトの見た目を模倣し、ダウンロードを促す偽サイトの例](/images/news/sagisaito/8NL5KtvjaVfMUtFMHrA2KW-678-80.png.webp)

*公式サイトの見た目を模倣し、ダウンロードを促す偽サイトの例（画像提供：カスペルスキー）*

3. 暗号資産をめぐる詐欺。ゲームのタイトルに似せた名前のトークンを、ロゴやビジュアルごと模倣したサイトで宣伝する手口だ。こうした素性の怪しいページに関わると、暗号資産を失う結果になりうる。

これらの偽サイトやファイルの多くはAIを使って本物らしく作り込まれており、「残りわずか」「今日まで」といった文言で焦りを煽るのが共通の特徴だ。

---

## 最重要:GTA6の公開ベータは存在しない

詐欺を見抜くうえで、最も確実な物差しがこれだ。Rockstarは、GTA6の公開ベータテスト、早期アクセス、PC版のベータ、モバイル版やAPKを一切発表していない。公式ページに載っているのは、2026年11月19日発売(PS5・Xbox Series X|S)と、6月25日からの予約開始という情報だけである。

したがって、「今すぐプレイできる」「ベータキーを配布」「早期アクセス権を販売」といった触れ込みは、その時点で100%詐欺と考えてよい。存在しないものを配っている、と言っている時点で偽物だ。

---

## 安全に予約し、発売を待つための対策

カスペルスキーなどが繰り返し推奨している対策をまとめる。

- 公式ルートだけを使う。Rockstar公式サイト(rockstargames.com)、PlayStation Store、Microsoft(Xbox)ストア、Amazonなどの正規の小売に限る。
- URLと表記を必ず確認する。「rockstar-games.com」のような、公式に似せた紛らわしいドメインに注意する。公式は「rockstargames.com」だ。組織名や綴りの微妙な違いは、偽物を見破る手がかりになる。
- 支払いはプリペイドカードやゲーム専用の決済サービスを使う。本物のクレジットカードや銀行口座の情報を、見慣れないサイトに直接入力しない。
- 非公式サイトや動画リンクからのダウンロードは絶対に避ける。
- 二段階認証(多要素認証)を有効にし、明細を定期的に確認する。信頼できるセキュリティソフトを導入しておく。
- 少しでも怪しいと感じたら、すぐに離脱し、個人情報を入力しない。

---

## まとめ

GTA6の予約人気に便乗した詐欺——公式そっくりの偽予約サイト、偽のベータ配布によるマルウェア、暗号資産を狙う偽トークン——が世界規模で広がっており、カスペルスキーをはじめとするセキュリティ各社が警告している。多言語対応のため、日本のユーザーも例外ではない。

覚えておくべき原則はシンプルだ。GTA6に公開ベータや早期アクセスは存在しないので、それらをうたう時点で詐欺である。予約は公式サイトと正規ストアだけで行い、URLを確認し、支払い情報は安易に入力しない。発売を心待ちにする気持ちにつけ込むのが相手の狙いだけに、急かしてくる誘いほど、一歩引いて疑うことが自分を守る一番の方法になる。`,
    titleEn:
      "Beware GTA6 Pre-Order Scams and Fake Betas — Convincing Counterfeit Sites Spread Worldwide, Kaspersky Warns",
    displayTitleEn:
      "Beware GTA6 Pre-Order Scams and Fake Betas\nConvincing Counterfeit Sites Spread Worldwide, Kaspersky Warns",
    descriptionEn:
      "Since GTA6 pre-orders opened on June 25, cyber scams riding on the hype have surged worldwide. Fake pre-order sites that look just like the official one, and malware disguised as a “beta,” are after personal data, card details, and accounts. The scam sites are built in multiple languages, so Japanese users are targets too. Here are the tactics and how to protect yourself.",
    aiSummaryEn: [
      "Since GTA6 pre-orders opened on June 25, cyber scams exploiting the hype have surged worldwide. Security firm Kaspersky has issued a warning, and because the fake pages are built in multiple languages, Japanese speakers can be targeted too.",
      "There are three main tactics: fake pre-order sites mimicking Rockstar’s official site or legitimate retailers to steal card details and money; malware distributed under the guise of a “beta,” “early access,” or “leaked build”; and crypto scams using tokens named after the game. A shared trait is manufactured urgency — “only a few left,” “today only.”",
      "The surest test is this: there is no public beta or early access for GTA6. All Rockstar has announced is a November 19 release and June 25 pre-orders, so anything claiming otherwise is a scam. Pre-order only through the official site (rockstargames.com) and legitimate stores, check the URL, and never casually enter payment details.",
    ],
    fullContentEn: `# Beware GTA6 Pre-Order Scams and Fake Betas — Convincing Counterfeit Sites Spread Worldwide, Kaspersky Warns

Since GTA6 pre-orders opened on June 25, cyber scams riding on the game’s popularity have surged around the world. Security firm Kaspersky has issued a warning: fake pre-order sites that look just like the official one, and malware distributed under the guise of a “beta,” are going after personal information, card details, and accounts. The scam sites are built in multiple languages, so there is a real chance Japanese users will be targeted. GTA6 FEED has summarized the tactics and the countermeasures.

This article is based on information as of July 10, 2026.

The images accompanying this article are examples of fake pre-order sites that imitate the look of the official one (images courtesy of Kaspersky). At a glance, they’re hard to tell apart from the real thing.

---

## What’s Happening Right Now

According to Kaspersky, cybercriminals began rolling out “a wide range of scam tactics” feeding on the frenzy immediately after GTA6 pre-orders opened. The company’s Olga Altukhova notes that these scams are carefully timed to periods of peak anticipation, exploiting the way excitement lowers users’ guard and makes a false sense of urgency easy to create.

![An example of a fake pre-order page built to look just like the official site. It even reuses the real trailers and promotional art, funneling visitors from a “Pre-order Now” button into a registration form](/images/news/sagisaito/rd7uUoPxLGWds5RBKSztLW-678-80.png.webp)

*An example of a fake pre-order page built to look just like the official site. A “Pre-order Now” button funnels visitors into a registration form (image courtesy of Kaspersky)*

The fake pages identified so far exist in several languages, suggesting they target users worldwide indiscriminately. This isn’t only an English-speaking problem — it’s safest to assume Japanese speakers are among the targets as well.

---

## The Main Tactics

The scams reported so far fall into three broad categories.

1. Fake pre-order sites. This is the most common tactic. They’re designed to look just like Rockstar’s official site, the PlayStation Store, or legitimate retailers, and they even reuse the real trailers and promotional art. A “Pre-order Now” button leads to a registration form asking for your name, email, address, phone number, payment information, and more. But no game ever arrives — your card details get stolen, or you’re defrauded of money for a pre-order that never existed. Some examples pile on fake five-star reviews, age ratings, and pre-order pricing to look authentic.

2. Fake betas and leaked builds. These push downloads billed as a “GTA6 beta,” “early access,” or a “leaked build.” Videos titled “how to download it safely” spread on social media and video platforms, with comment sections seeded with “this one’s real” to build trust. Running the downloaded file infects your machine with malware, which can lead to data theft, account takeover, the leaking of browser-saved passwords and crypto wallet information, and even remote control of your device. Fake Android apps (APKs) named things like “GTA 6 Beta” are circulating too.

![An example of a fake site pushing a download, imitating the look of the official site](/images/news/sagisaito/8NL5KtvjaVfMUtFMHrA2KW-678-80.png.webp)

*An example of a fake site pushing a download, imitating the look of the official site (image courtesy of Kaspersky)*

3. Crypto scams. These promote tokens named to resemble the game’s title, advertised on sites that copy its logos and visuals. Engaging with pages of such dubious provenance can leave you out of pocket in crypto.

Many of these fake sites and files are crafted with AI to look convincing, and a shared trait is stoking urgency with lines like “only a few left” or “today only.”

---

## Most Important: There Is No Public GTA6 Beta

This is the single most reliable yardstick for spotting a scam. Rockstar has announced no public beta test for GTA6 — no early access, no PC beta, no mobile version or APK. All the official pages say is that it launches November 19, 2026 (PS5, Xbox Series X|S), with pre-orders opening June 25.

So any pitch along the lines of “play it right now,” “beta keys available,” or “buy early access” is, on that basis alone, 100% a scam. The moment someone claims to be handing out something that doesn’t exist, it’s fake.

---

## How to Pre-Order Safely and Wait for Launch

Here are the countermeasures Kaspersky and others repeatedly recommend.

- Use official routes only. Stick to Rockstar’s official site (rockstargames.com), the PlayStation Store, the Microsoft (Xbox) store, and legitimate retailers such as Amazon.
- Always check the URL and the wording. Watch out for confusingly similar domains like “rockstar-games.com.” The official one is “rockstargames.com.” Subtle differences in organization names and spelling are your clue to spotting a fake.
- Pay with a prepaid card or a gaming-specific payment service. Don’t enter real credit card or bank account details directly into an unfamiliar site.
- Never download from unofficial sites or video links.
- Enable two-factor (multi-factor) authentication, check your statements regularly, and install reputable security software.
- If anything feels even slightly off, leave immediately and don’t enter any personal information.

---

## In Summary

Scams riding on GTA6’s pre-order hype — fake pre-order sites that look just like the official one, malware distributed as a fake beta, and counterfeit tokens targeting crypto holders — are spreading globally, and Kaspersky along with other security firms are sounding the alarm. Because they’re built for multiple languages, Japanese users are no exception.

The principle to remember is simple. There is no public beta or early access for GTA6, so the moment something claims otherwise, it’s a scam. Pre-order only through the official site and legitimate stores, check the URL, and don’t enter payment information casually. Precisely because the scammers prey on your eagerness for launch day, the best way to protect yourself is to step back and get suspicious the moment an offer starts rushing you.`,
  },
  {
    id: 36,
    title:
      "GTA Online、新たな強盗「The Kortz Center Heist」を7月14日配信——約6年ぶりの大仕事、美術館から名画を奪え",
    displayTitle:
      "GTA Online、新たな強盗「The Kortz Center Heist」を7月14日配信\n約6年ぶりの大仕事、美術館から名画を奪え",
    description:
      "Rockstarが、GTA Onlineの新強盗「The Kortz Center Heist」を7月14日に配信すると発表。舞台は美術館Kortz Center。完全新規の大型強盗はCayo Perico以来およそ6年ぶりで、GTA6発売前・最後級の大型アップデートとみられる。内容と準備の要点をまとめた。",
    icon: "🖼️",
    image: "/images/news/gta_online_kortz_center_heist_article/ff97a2a5a3c452c1049a75eae778870674ff0e48.webp",
    category: "update",
    date: "2026-07-10",
    publishedAt: "2026-07-10 12:00",
    source: "GTA6 FEED 編集部",
    sourceUrl: "https://www.rockstargames.com/newswire",
    relatedArticles: [31, 35, 33],
    aiSummary: [
      "Rockstarは、GTA Onlineの新しい強盗「The Kortz Center Heist」を7月14日に全機種で配信する。舞台はロスサントスの美術館Kortz Centerで、名画を盗み出す多段階の強盗。完全新規の大型強盗としてはCayo Perico以来およそ6年ぶりで、11月19日のGTA6発売を前にした最後級の大型アップデートとみられている。",
      "主催にはマンション物件と新規のArt Studio拡張が必要。贋作師が本物とすり替える偽物を作り、盗んだ絵は故買屋に売るか自宅に飾れる。盗める絵画は毎週3枚が入れ替わる。新車Grotti Veleno GTはGTA+会員が7月14日から無料入手できる。",
      "配信に先立ち無料の準備イベント「Fine Art Collector Program」が7月13日まで実施中で、ログイン＋強盗1回クリアで最大GTA$150万と装甲リムジンがもらえる。ただし強盗本編の報酬額は配信まで未確定である。",
    ],
    fullContent: `# GTA Online、新たな強盗「The Kortz Center Heist」を7月14日配信——約6年ぶりの大仕事、美術館から名画を奪え

Rockstarは、GTA Onlineの新しい強盗(heist)ミッション「The Kortz Center Heist」を7月14日に配信すると公式に発表した。舞台はロスサントスの美術館Kortz Center。完全新規の大型強盗としてはCayo Perico以来、およそ6年ぶりで、11月19日のGTA6発売を前にした最後級の大型アップデートになるとみられている。GTA6 FEEDが、内容と準備の要点をまとめた。

本記事は2026年7月10日時点の情報にもとづく。

---

## どんな強盗か

配信は7月14日、対応は全機種(PS5・PS4・Xbox Series X|S・Xbox One・PC)。狙うのは、Pacific Bluffsの丘に建つ美術館Kortz Centerだ。2013年からマップに存在しながら中に入れなかった名所で、GTA5のストーリー終盤で緊迫した対峙が起きた場所でもある。そこに眠る名画を盗み出す、多段階の強盗となる。

![美術館Kortz Centerから戦利品を持って逃走する強盗団。追跡するヘリと警察をかわして逃げ切る](/images/news/gta_online_kortz_center_heist_article/d581acb2e605beda510e700ef6c119be7ecf611e.webp)

流れは、施設を下見し、侵入の方法を選び、潜入し、戦利品を持って逃げる、というもの。これはCayo PericoやDiamond Casinoの強盗と同じ構造で、いずれもGTA Onlineで最も繰り返し遊ばれてきた人気コンテンツだ。ソロでも、最大4人のクルーでも挑める。仲間が多いほど多くの戦利品を持ち出しやすくなる一方、ソロは難度が上がるが一人当たりの取り分は大きくなる(このあたりもCayo Pericoと同様だ)。

---

## ホストに必要なもの:マンションとArt Studio

リーダーとしてこの強盗を主催するには、マンション物件と、新たに追加されるArt Studio拡張が必要になる。

![Art Studioに住み込む贋作師。盗んだ本物とすり替えるための偽物(フォージェリ)を制作する](/images/news/gta_online_kortz_center_heist_article/5470eec937bfb5e7b080614e461fe2a61f477f15.webp)

Art Studioには贋作師が住み込み、盗んだ本物とすり替えるための偽物(フォージェリ)を制作する。ここは計画の拠点も兼ね、準備を進めるほど装備や技術がストックされ、フィナーレではその中からロードアウトを組める。強盗中は、Rafが偵察や重要な情報を共有する連絡役となり、マンションのAIアシスタントも役に立つ。

盗み出した主目標の絵画は、故買屋Mr. Faberの顧客に売って現金化するか、あるいは自分のマンションに飾って所有するかを選べる。さらに、盗める絵画は毎週3枚が新たに入れ替わり、繰り返し遊ぶ動機になる。

![盗める絵画の一例。盗んだ本物は故買屋に売って現金化するか、自分のマンションに飾って所有できる](/images/news/gta_online_kortz_center_heist_article/96fff8386339452798cf2776ae88bf1193450e1e.webp)

---

## 新車とその他の追加

アップデートでは新しい車両も追加される。目玉のGrotti Veleno GTは、GTA+会員なら7月14日からVinewood Car Clubのショールームで無料で受け取れる。一般販売はその1週間後で、会員は先行して入手できる形だ。このほかにも新しいスーパーカーや、Drift、Hao's Special Worksに対応した車両が加わる。あわせて、Rockstar Mission Creatorのアップデートなども予定されている。

![目玉の新車Grotti Veleno GT。GTA+会員は7月14日から無料で入手でき、一般販売は1週間後](/images/news/gta_online_kortz_center_heist_article/ad240b86477e5c2cd18b4864778e45a1c3bbdd26.webp)

---

## 準備:Fine Art Collector Program(7月13日まで)

配信に先立ち、無料の準備イベント「Fine Art Collector Program」が7月13日まで実施されている。受け取れる主な報酬は次のとおり。

- GTA Onlineに7月13日までにログインしてプレイする:GTA$50万と、装甲仕様のリムジンBenefactor Turreted Limo(屋根にマシンガンを備える)。
- 期間中にいずれかの強盗を1回クリアする:追加でGTA$100万と、NOOSE Special Forcesスーツ。これで合計最大GTA$150万になる。
- マンション所有者が7月13日までにプレイする:上位の「Elitist」資格が得られ、Annihilator Stealthヘリの無料入手、Art Studio拡張のGTA$100万割引、Kortz Centerの彫像、そして高額な絵画を盗む機会が付く。
- GTA+会員:Prix Luxury Real EstateのマンションがGTA$200万割引。

上の2段階の報酬は条件達成から72時間以内に付与され、「Elitist」分は強盗の配信後に受け取れる。

---

## 報酬(ペイアウト)はまだ未確定

一点、注意しておきたい。強盗本編で得られる報酬額は、7月14日の配信まで公式に明らかになっていない。Cayo Pericoやカジノの強盗と同じ多段階の構造であることから、おおむねそれらと同程度(1回あたりおよそGTA$100万〜数百万規模)と予想されているが、これはあくまで推測だ。配信前に出回る具体的な金額は、いずれも見込みの数字として受け止めておきたい。

---

## 位置づけと、今やっておくべきこと

この強盗が注目されるのは、その規模と時期だ。完全新規の大型強盗としては、2020年12月のCayo Perico以来およそ6年ぶりで、この間のGTA Onlineは車両の小出しや事業の調整が中心だった。GTA6の発売(11月19日)が近づくなか、これはオンラインの最後を飾る大型更新の一つになるとみられ、「有終の美」と受け止める声も多い。プレスリリースの見出し「The Next Big Score」が、GTA5終盤の強盗「The Big Score」を想起させる点も話題になっている。

実際的な備えとしては、まず準備イベントをこなしておくのがよい。ログインと強盗1回クリアで最大GTA$150万と装甲リムジンが実質タダで手に入るので、7月13日までに済ませておいて損はない。一方、自分で強盗を主催したい場合はマンションとArt Studioが必須になるが、これは相応の出費であり、しかも本編の報酬額はまだ確定していない。頻繁に回すつもりなら投資する価値は高いが、たまに遊ぶ程度なら、配信後に実際の稼ぎが判明してから購入を判断するのが堅実だ。

この強盗に向けた準備プログラム「Fine Art Collector」については、予告時の記事「[GTAオンライン最新アップデート解説 「Fine Art Collector」開始](/news/16)」で詳しく解説している。`,
    titleEn:
      "GTA Online’s New Heist “The Kortz Center Heist” Arrives July 14 — the First Big Job in ~6 Years: Steal Masterpieces from a Museum",
    displayTitleEn:
      "GTA Online’s New “Kortz Center Heist” Arrives July 14\nThe First Big Job in ~6 Years: Steal Masterpieces from a Museum",
    descriptionEn:
      "Rockstar has announced that GTA Online’s new heist, “The Kortz Center Heist,” arrives July 14, set in the Kortz Center museum. The first all-new major heist since Cayo Perico — roughly six years — it looks to be one of the last big updates before GTA6’s launch. Here’s what it is and how to prepare.",
    aiSummaryEn: [
      "Rockstar is releasing GTA Online’s new heist, “The Kortz Center Heist,” on July 14 across all platforms. Set in Los Santos’ Kortz Center museum, it’s a multi-stage heist to steal masterpiece paintings. As the first all-new major heist since Cayo Perico — about six years — it looks to be one of the last big updates before GTA6’s November 19 launch.",
      "Hosting requires a mansion property and the new Art Studio expansion. A forger makes fakes to swap for the originals; stolen paintings can be sold to a fence or hung in your mansion. The available paintings rotate three each week. The new Grotti Veleno GT is free for GTA+ members from July 14.",
      "Ahead of launch, a free prep event, the “Fine Art Collector Program,” runs through July 13 — logging in plus clearing one heist nets up to GTA$1.5M and an armored limo. However, the heist’s actual payout stays unconfirmed until launch.",
    ],
    fullContentEn: `# GTA Online’s New Heist “The Kortz Center Heist” Arrives July 14 — the First Big Job in ~6 Years: Steal Masterpieces from a Museum

Rockstar has officially announced that GTA Online’s new heist mission, “The Kortz Center Heist,” will be released on July 14. The setting is the Kortz Center, a museum in Los Santos. As the first all-new major heist since Cayo Perico — roughly six years — it’s seen as one of the last big updates before GTA6’s November 19 launch. GTA6 FEED has summarized what it is and the key points for preparing.

This article is based on information as of July 10, 2026.

---

## What Kind of Heist Is It

It releases July 14 on all platforms (PS5, PS4, Xbox Series X|S, Xbox One, PC). The target is the Kortz Center, a museum perched on the hills of Pacific Bluffs. It’s a landmark that has existed on the map since 2013 but was never enterable, and it’s also where a tense standoff took place near the end of GTA5’s story. This is a multi-stage heist to steal the masterpieces held inside.

![The crew flees the Kortz Center museum with the loot, shaking off pursuing helicopters and police](/images/news/gta_online_kortz_center_heist_article/d581acb2e605beda510e700ef6c119be7ecf611e.webp)

The flow is: scope out the facility, choose your method of entry, infiltrate, and escape with the loot. This is the same structure as the Cayo Perico and Diamond Casino heists — both among the most-replayed, most-popular content in GTA Online. You can take it on solo or with a crew of up to four. The more teammates, the easier it is to carry out more loot; solo is harder but the per-person cut is larger (this, too, mirrors Cayo Perico).

---

## What the Host Needs: a Mansion and an Art Studio

To host this heist as the leader, you’ll need a mansion property and the newly added Art Studio expansion.

![The forger who lives in the Art Studio, making the fakes (forgeries) used to swap out the stolen originals](/images/news/gta_online_kortz_center_heist_article/5470eec937bfb5e7b080614e461fe2a61f477f15.webp)

A forger lives in the Art Studio, producing the fakes (forgeries) used to swap for the stolen originals. It doubles as your planning hub: the more prep you do, the more equipment and skills are stocked, and at the finale you assemble your loadout from them. During the heist, Raf acts as your contact, sharing recon and key intel, and the mansion’s AI assistant also helps.

The primary target painting you steal can be cashed out by selling it to the fence Mr. Faber’s clients, or you can keep it and hang it in your own mansion. On top of that, the paintings available to steal rotate — three new ones each week — giving you a reason to replay.

![An example of a stealable painting. Stolen originals can be sold to a fence for cash or kept and displayed in your mansion](/images/news/gta_online_kortz_center_heist_article/96fff8386339452798cf2776ae88bf1193450e1e.webp)

---

## The New Car and Other Additions

The update also adds new vehicles. The headliner, the Grotti Veleno GT, can be claimed for free at the Vinewood Car Club showroom from July 14 if you’re a GTA+ member. General sale is a week later, so members get it early. Beyond that, new supercars and vehicles compatible with Drift and Hao’s Special Works are added, along with a planned update to the Rockstar Mission Creator and more.

![The headline new car, the Grotti Veleno GT. GTA+ members can claim it free from July 14, with general sale a week later](/images/news/gta_online_kortz_center_heist_article/ad240b86477e5c2cd18b4864778e45a1c3bbdd26.webp)

---

## Prep: the Fine Art Collector Program (Through July 13)

Ahead of the release, a free prep event, the “Fine Art Collector Program,” is running through July 13. The main rewards you can earn are as follows.

- Log in and play GTA Online by July 13: GTA$500K and the armored limousine Benefactor Turreted Limo (fitted with a roof-mounted machine gun).
- Clear any one heist during the period: an additional GTA$1M and the NOOSE Special Forces outfit. That brings the total to up to GTA$1.5M.
- Mansion owners who play by July 13: earn the higher “Elitist” status, which grants a free Annihilator Stealth helicopter, a GTA$1M discount on the Art Studio expansion, a Kortz Center statue, and the chance to steal high-value paintings.
- GTA+ members: a GTA$2M discount on a Prix Luxury Real Estate mansion.

The two-tier rewards above are granted within 72 hours of meeting the conditions, and the “Elitist” portion can be claimed after the heist launches.

---

## Payouts Are Still Unconfirmed

One caveat worth noting. The payout you earn from the heist proper has not been officially revealed and won’t be until the July 14 launch. Because it shares the same multi-stage structure as the Cayo Perico and casino heists, it’s expected to be roughly on par with those (around GTA$1M to several million per run), but that’s pure speculation. Any specific figures circulating before launch should be treated as estimates.

---

## Where It Sits, and What to Do Now

What draws attention to this heist is its scale and its timing. As the first all-new major heist since Cayo Perico in December 2020 — about six years — the intervening GTA Online has mostly been drip-fed vehicles and business tweaks. With GTA6’s launch (November 19) approaching, this looks to be one of the last big updates capping off the online mode, and many take it as a fitting finale. The press-release headline “The Next Big Score,” evoking GTA5’s endgame heist “The Big Score,” has also become a talking point.

As for practical prep, first knock out the prep event. Logging in and clearing one heist nets up to GTA$1.5M and an armored limo essentially for free, so there’s no downside to getting it done by July 13. On the other hand, if you want to host the heist yourself, a mansion and Art Studio are required — a considerable outlay, and the heist’s payout is still unconfirmed. If you plan to run it often, it’s well worth the investment; if you only play occasionally, the safe move is to hold off and decide after launch, once the actual earnings are known.

The preparation program leading up to this heist, Fine Art Collector, was covered in detail when it was first announced, in "[GTA Online Latest Update Explained: Fine Art Collector Begins](/en/news/16)".`,
  },
  {
    id: 35,
    title:
      "GTA6の公式画像に「もっと無駄なものを買え」——Ultimate Edition宣伝カットの隠しメッセージが話題",
    // 記事ページのh1だけ、意味の切れ目で改行した表示用タイトルを使う（SEOの title は上のまま）
    displayTitle:
      "GTA6公式画像の“隠しメッセージ”が話題\n「もっと無駄なものを買え」は\nUltimate Edition宣伝カットへの皮肉？",
    displayTitleEn:
      "A “Hidden Message” in an Official GTA6 Image\nIs “Buy More Useless Shit”\na Jab at the Ultimate Edition Promo Shot?",
    description:
      "Ultimate Editionを紹介するRockstar公式スクリーンショットに、「Buy more useless shit(もっと無駄なものを買え)」と書かれた小さなステッカーが写り込んでいるとファンが発見。100ドルの上位版を売る当のRockstarによる自虐に見える、と海外コミュニティで拡散している。",
    icon: "🏷️",
    image: "/images/news/ULTIMATE_EDITION_STOCK_305_04.webp",
    category: "topic",
    date: "2026-07-08",
    publishedAt: "2026-07-08 21:10",
    source: "GTA6 FEED 編集部",
    sourceUrl: "#",
    relatedArticles: [34, 19, 33],
    aiSummary: [
      "Rockstar公式サイトでUltimate Editionの特典を紹介するスクリーンショット(限定服屋Stock 305・ルシア)のカウンターに、「Buy more useless shit(もっと無駄なものを買え)」と書かれたバーコード風ステッカーが写り込んでいるとファンが発見し、SNSで拡散した。",
      "約100ドルのUltimate Editionは、追加が主に車両・武器・衣装・限定店舗といった見た目や利便性の特典であることから、「高い上位版を売るRockstar自身が、それを買う行為を茶化している」という自虐的でメタな構図として受け取られている。",
      "ただし意図的なイースターエッグか、単なる環境装飾の偶然かは不明で、Rockstarはコメントしていない。皮肉にもTom Hendersonのアンケートでは8割超がUltimate Editionを購入予定と報じられている。",
    ],
    fullContent: `# GTA6の公式画像に「もっと無駄なものを買え」——Ultimate Edition宣伝カットの隠しメッセージが話題

GTA6の公式プロモ画像に、皮肉の効いた一文が仕込まれていた。Ultimate Editionを紹介する公式スクリーンショットの1枚に、「Buy more useless shit(もっと無駄なものを買え)」と書かれた小さなステッカーが写り込んでいるのをファンが発見し、海外コミュニティで大きく拡散している。100ドルの上位版を売っている当のRockstarが、まるで自分自身を茶化しているように見える、というわけだ。GTA6 FEEDがまとめた。

本記事は2026年7月6日時点の情報にもとづく。

---

## 何が見つかったのか

問題の一枚は、Rockstar公式サイトでUltimate Editionの特典を紹介するために公開されたスクリーンショットだ。舞台はUltimate Edition限定の服屋Stock 305で、女性キャラクター(ルシア)がカウンターにもたれて立っている。そのカウンターに貼られたバーコード風のステッカーに、小さな文字で「Buy more useless shit」と書かれている。ぱっと見では気づきにくいが、拡大するとはっきり読める。

![カウンター左下のバーコード風ステッカーに「BUY MORE USELESS SHIT」の文字が読める](/images/news/HMeWeMxXkAA58wI.webp)

*画像: Rockstar Games公式サイトのUltimate Edition紹介スクリーンショットより（赤丸は加筆）*

![ステッカーを拡大したところ。バーコードの下に「BUY MORE USELESS SHIT」とはっきり書かれている](/images/news/ULTIMATE_EDITION_STOCK_305_04up.webp)

重要なのは、これがファンの加工ではなく、Rockstarのサイトにそのまま載っている本物のプロモ画像に含まれている点だ。ファンアカウントのGTA 6 Countdownなどが投稿したことをきっかけに、SNSで一気に広まった。

![発見を広めたファンアカウント「GTA 6 Countdown」の投稿。34万件超の表示を集めた](/images/news/buy-more-useless-shit-post.webp)

*画像: X（旧Twitter）のファンアカウント「GTA 6 Countdown」（@GTAVI_Countdown）の投稿より*

---

## なぜ刺さるのか

このステッカーが話題になったのは、Ultimate Editionという商品の性格と重なって見えるからだ。

Ultimate Edition(約100ドル)は、Standard Edition(約80ドル)より20ドル高いが、追加されるのは主に車両・武器・衣装・限定店舗といった、見た目や利便性の特典で、ゲームの根幹を変えるものではない。さらに、物理版すらディスクを同梱せずダウンロードコードのみという方針も重なっている。そこへ「もっと無駄なものを買え」というメッセージだ。高い上位版を売っているRockstar自身が、それを買う行為を自ら茶化しているように読める——という自虐的でメタな構図が、多くの人に刺さった。

GTAシリーズはもともと、アメリカの消費社会や広告、ブランド信仰を徹底的に風刺してきた作品だ。店の看板やスローガンで皮肉を効かせる手口は過去作でも定番で、今回のメッセージは、その矛先を「自分たちの商売」に向けたメタ版だと受け取られている。

---

## 意図的なのかどうかは、まだ分からない

ただし、一点だけ注意が要る。このステッカーが狙って仕込まれたイースターエッグなのか、それとも単なる環境装飾が偶然スクリーンショットに写り込んだだけなのかは、現時点では分かっていない。複数のメディアもこの点は不明だとしており、Rockstarはコメントしていない。

もっとも、同社のこれまでの作風からすれば、意図的な仕込みであってもまったく不思議はない、という見方が大勢だ。断定はできないが、「またRockstarがやった」と受け止める空気が強い。

---

## コミュニティの反応

反応は割れている。

- 「上位版を買う人をバカにしている。コミュニティをディスってるだろ」
- 「最高にRockstarらしい。これぞGTAのユーモアだ」
- 「プレイヤー個人ではなく、消費社会そのものを風刺しているだけだろう」
- 「いっそ商品ページに直接この一文を貼ってくれたら、その正直さは尊敬した」

皮肉なオチもある。これだけ自虐ネタが笑われている一方で、Tom Hendersonが実施したとされるアンケートでは、8割を超える人がUltimate Editionを購入する予定だと報じられている。「無駄なものを買え」とからかわれても、結局は買う——という構図まで含めて、Rockstarらしい一幕になっている。

---

## まとめ

第3弾トレーラーもまだ公開されず、公式素材が乏しいなかで、ファンは一つひとつの画像を1ピクセル単位で精査している。そうした時期だけに、こうした小さな仕込みは大きく跳ねやすい。折しもディスクなしのパッケージ版をめぐる不満とも重なり、上位版商法そのものへの議論に火をつける格好にもなった。

事実としては、Rockstarの公式Ultimate Edition画像に「Buy more useless shit」というステッカーが写っている、という一点だ。それが自虐的な消費社会の風刺として広く受け取られたのは間違いないが、意図的な仕込みかどうかはRockstarが明かしておらず未確認である。GTAらしいイースターエッグとしてニヤリとする層と、高額版の商法への皮肉と見る層に分かれたまま、発売後にあらためて掘り起こされそうな小ネタだ。`,
    titleEn:
      "“Buy More Useless Shit” Hidden in an Official GTA6 Image — the Sticker in Rockstar's Ultimate Edition Promo Shot",
    descriptionEn:
      "Fans spotted a tiny sticker reading “Buy more useless shit” in an official Rockstar screenshot promoting the Ultimate Edition. With Rockstar itself selling the $100 tier, it reads as self-deprecation — and it's spreading fast across the community.",
    aiSummaryEn: [
      "Fans discovered that an official Rockstar screenshot promoting the Ultimate Edition — set in the exclusive clothing store Stock 305, with Lucia leaning on the counter — includes a barcode-style sticker reading “Buy more useless shit.” The find spread rapidly on social media.",
      "Because the roughly $100 Ultimate Edition mostly adds cosmetic and convenience perks (vehicles, weapons, outfits, an exclusive store), the message reads as a self-deprecating, meta jab: Rockstar itself poking fun at the act of buying its own premium tier.",
      "Whether it's a deliberate easter egg or incidental set dressing is unknown, and Rockstar hasn't commented. Ironically, a poll reportedly run by Tom Henderson found over 80% still plan to buy the Ultimate Edition.",
    ],
    fullContentEn: `# “Buy More Useless Shit” Hidden in an Official GTA6 Image — the Sticker in Rockstar's Ultimate Edition Promo Shot

A rather pointed line was tucked into an official GTA6 promo image. Fans discovered that one of the official screenshots promoting the Ultimate Edition contains a small sticker reading “Buy more useless shit,” and the find has spread widely across the overseas community. The joke being: Rockstar, the very company selling the $100 premium tier, appears to be poking fun at itself. GTA6 FEED has summarized it.

This article is based on information as of July 6, 2026.

---

## What Was Found

The image in question is a screenshot published on Rockstar's official site to showcase the Ultimate Edition's bonuses. The setting is Stock 305, the Ultimate Edition-exclusive clothing store, where the female protagonist (Lucia) stands leaning against a counter. On that counter is a barcode-style sticker, and in tiny lettering it reads: “Buy more useless shit.” It's hard to catch at a glance, but zoom in and it's clearly legible.

![On the sticker at the lower-left of the counter, the words “BUY MORE USELESS SHIT” are legible](/images/news/HMeWeMxXkAA58wI.webp)

*Image: from the official Ultimate Edition screenshot on the Rockstar Games site (red circle added)*

![A close-up of the sticker: below the barcode, “BUY MORE USELESS SHIT” is clearly written](/images/news/ULTIMATE_EDITION_STOCK_305_04up.webp)

What matters is that this isn't a fan edit — it's in the genuine promo image as posted on Rockstar's own site. Posts from fan accounts such as GTA 6 Countdown set it off, and it swept across social media.

![The post from fan account “GTA 6 Countdown” that spread the discovery, drawing over 340,000 views](/images/news/buy-more-useless-shit-post.webp)

*Image: from a post by the fan account “GTA 6 Countdown” (@GTAVI_Countdown) on X (formerly Twitter)*

---

## Why It Lands

The sticker took off because it seems to overlap with the very nature of the Ultimate Edition as a product.

The Ultimate Edition (about $100) costs $20 more than the Standard Edition (about $80), but what it adds is mainly cosmetic and convenience perks — vehicles, weapons, outfits, an exclusive store — nothing that changes the core of the game. On top of that, even the physical edition ships without a disc, containing only a download code. And into that lands the message “Buy more useless shit.” It reads as though Rockstar, the one selling the pricier tier, is itself mocking the act of buying it — a self-deprecating, meta framing that landed with a lot of people.

The GTA series has always been a thorough satire of American consumer culture, advertising, and brand worship. Slipping irony into store signage and slogans is a staple of past entries; this time, the message is being read as a meta version that turns that barrel on “their own business.”

---

## Whether It's Deliberate Is Still Unknown

One caveat, though. Whether the sticker is an easter egg placed on purpose, or merely environmental set dressing that happened to land in a screenshot, is not known at this point. Multiple outlets have flagged that this is unclear, and Rockstar has not commented.

That said, given the studio's track record, most feel it would be no surprise at all if it were deliberate. Nothing can be asserted, but the prevailing mood is “Rockstar's done it again.”

---

## Community Reaction

Reactions are split.

- “They're mocking people who buy the premium edition. That's dissing the community.”
- “Peak Rockstar. This is exactly GTA's humor.”
- “They're satirizing consumer culture itself, not individual players.”
- “Honestly, if they'd slapped that line straight on the store page, I'd respect the honesty.”

There's an ironic punchline, too. While everyone laughs at the self-own, a poll reportedly conducted by Tom Henderson found that over 80% of respondents plan to buy the Ultimate Edition. Told to “buy more useless shit,” people buy it anyway — and that framing, too, makes for a very Rockstar moment.

---

## Summary

With the third trailer still unreleased and official material scarce, fans are scrutinizing every image pixel by pixel. In exactly such a stretch, a small planted detail like this bounces high. Coinciding as it does with frustration over the disc-less physical edition, it has also served to light a fire under the debate about premium-edition business practices themselves.

As a matter of fact, all we have is this: a sticker reading “Buy more useless shit” appears in Rockstar's official Ultimate Edition image. There's no doubt it was widely received as a self-deprecating satire of consumer culture — but whether it was planted deliberately remains unconfirmed, with Rockstar staying silent. Split between those who grin at it as a very GTA easter egg and those who read it as a jab at premium-edition monetization, it's the kind of trivia likely to be dug up all over again after release.`,
  },
  {
    id: 34,
    title:
      "「GTA6が待ちきれない」——25歳のAI起業家が、AIだけで“自作GTA6”を作り始めた",
    description:
      "GTA6の発売を待ちきれず、25歳のAI起業家Ziwen XuがAIエージェント(主にClaude)を回す「vibe coding」でGTA6風ゲーム「GT-Caliber」を6月10日から開発中。目標は本物(11月19日発売)より先に出すこと。無謀だが、その過程が「AIの現在地」を映す公開実験として話題だ。",
    icon: "🤖",
    image: "/images/news/Ziwen.webp",
    category: "topic",
    date: "2026-07-06",
    publishedAt: "2026-07-06 18:46",
    source: "GTA6 FEED 編集部",
    sourceUrl: "#",
    relatedArticles: [33, 32, 30],
    aiSummary: [
      "GTA6の発売を待ちきれず、25歳のAI起業家Ziwen XuがAIエージェント(主にClaude)を回す「vibe coding」で、GTA6風のオープンワールド犯罪ゲーム「GT-Caliber」を6月10日から開発している。掲げた目標は、本物のGTA6(11月19日発売)より先にリリースすることだ。",
      "9日ほどで、青い箱が跳ねるだけの状態から、NPCや車が走りSNS入りスマホまで動く街へと急速に進化。一方で舞台をマイアミではなくロサンゼルス風に生成してしまうなどのつまずきもあり、AIの「速さ」と「文化的に正確な世界＝創造的ビジョンの不在」が同時に浮き彫りになっている。",
      "多くの観測者は、価値は「競合」ではなく「実験」にあると見る。皮肉にも、この件はTake-TwoのZelnick CEOの「AIは道具として有用でも大作を生む創造的ビジョンは持たない」という主張を裏づける例とも受け取られている。Rockstarとは無関係の、個人によるファン制作の公開実験だ。",
    ],
    fullContent: `# 「GTA6が待ちきれない」——25歳のAI起業家が、AIだけで“自作GTA6”を作り始めた

GTA6の発売を待ちきれず、自分で作り始めた人物がいる。25歳のAI起業家Ziwen Xuが、AIエージェント(主にClaude)を回す「vibe coding」で、GTA6風のオープンワールド犯罪ゲーム「GT-Caliber」を6月10日から開発している。掲げた目標は、本物のGTA6(11月19日発売)より先にリリースすること。無謀ではあるが、その開発過程が「AIの現在地」を映す公開実験として話題になっている。GTA6 FEEDが概要をまとめた。

本記事は2026年7月4日時点の情報にもとづく。

---

## 何をやっているのか

Ziwen Xuは、AIエージェントのスタートアップHyperecho(企業のAI活用を支援する)の創業者だ。6月10日、「GTA6を作り始めた。まだ打っていて実感が湧かない」という趣旨の投稿とともにプロジェクトを開始し、この開発のためにClaudeの上位プラン(Claude Max 20x)へ課金したと明かした。

![](https://x.com/ziwenxu_/status/2073147150201155804)

開発手法は、AIエージェントをループのように連続稼働させ、コードの生成・テスト・修正を任せる「vibe coding」と呼ばれるやり方だ。ほぼ毎日Xで進捗を公開し、コードはGitHubで一般公開、AIが作業する様子をライブ配信することもある。あわせて、モデリング・作曲・レベルデザインなどができる人間の協力者も募集している。すべてをAIに丸投げしているわけではない。

きっかけは、AI投資家のMatt Shumerが投げかけた挑戦だった。Shumerは「モデルをループさせて、初期トレーラー以上の品質と規模を持つGTA6級のオープンワールドを作れないか」という趣旨の投稿をしており、Xuはこれを再投稿したうえで自ら着手した。目標について本人は「野心的で、たぶん愚か。それでもやる」と書いている。

---

## 進捗:9日ほどで「青い箱」から街へ

進み方は速く、そして混沌としている。

初日の映像は、青い箱のようなキャラクターが平面の上を跳ね回るだけのものだった。2日目には人型のキャラクターが街を走り、3日目にはNPCが歩き、車が道路を走り、射撃や、Instagram風のSNSが入ったスマートフォンまで登場した。7日目には道路のある一帯の街並みが現れ、本人が「初めてGTAらしく見えた」と語る段階に至った。現在は、運転、NPC、射撃、電話(マップ・連絡先・財布つき)、イントロ画面とオリジナルBGM、天候の変化などが実装されている。道路や歩道の細部は、AIだけでは詰め切れず手作業で調整しているという。

![](https://x.com/ziwenxu_/status/2073870048481997126)

開発エンジンは当初、無料のGodotで始めたが、7日目にUnreal Engineへ移行した。この間、エンジン選定は二転三転したと報じられている。

---

## つまずきと“事件”

面白がられているのは、完成度そのものより、その過程で起きるトラブルだ。

最も象徴的なのが、舞台の取り違えだ。GTA6のVice Cityのモデルはマイアミ(フロリダ)だが、AIエージェントはあるとき、ロサンゼルス風の高層ビル群を生成してしまった。この一件は各所で「AIは汎用的な箱(サンドボックス)なら速く作れるが、GTAをGTAたらしめている固有で意図的な、文化的に正確な世界までは作れない」ことの好例として引かれた。

コストの問題も生々しい。Xuは、Claudeの週間利用枠(20倍プラン)を1日で33%消費し、「時計が動き始めた」と書いている。AIを回し続ける開発は、利用枠との戦いでもある。なお、この進捗投稿が盛り上がったのは、ちょうどRockstarがGTA6の予約開始(6月25日)を発表した時期と重なったことも大きい。

---

## 評価:AIの「速さ」と「ビジョンの不在」

このプロジェクトをどう見るべきか。結論から言えば、数日でサンドボックスを立ち上げてしまう速さは、エージェント型のAI開発の到達点として素直に驚くべきものだ。一方で、本物のGTA6に匹敵する・先に出すという目標が現実に達成されるとは、ほとんどの観測者が見ていない。価値は「競合」ではなく「実験」にある、というのが妥当な評価だ。

鍵になるのが、先のロサンゼルス取り違えだ。AIは機能や見た目の断片を高速で量産できるが、「何を作るのか」という創造的なビジョン——どの街を、どんなラジオ局を、どんなジョークやキャラクターを置くか——は、依然として人間の領域にある。速い、しかしビジョンがない。これが多くのメディアの共通した見立てだ。

皮肉なことに、この実験はTake-TwoのZelnick CEOの主張を裏づける材料とも受け取られている。Zelnickは、AIは開発の道具としては有用でも、GTAのような10億ドル規模の大作を生み出す創造的ビジョンは持たない、と繰り返し述べてきた。Rockstar自身、GTA6の開発ではAIの活用を避けたと報じられている。11月19日に、13年をかけて手作業で作り込まれたGTA6が出れば、その対比はかえって際立つことになる。

反応も割れている。

- 「数日でここまで動くのか。AIの可能性を感じる」
- 「本気すぎて逆に応援したくなる」
- 「面白いけど、まだGTA6には程遠い」
- 「結局はバズ狙いのエンゲージメント目的では」

なお、GTAに似せた作品は、素材を直接流用していなくても、トーンや街の型といったトレードドレスの面で、将来的に権利者の視線を集めやすいという指摘もある。この点は、AI時代のファン制作物が今後直面しうる論点でもある。

---

## まとめ

- 何をしているか:25歳のAI起業家Ziwen Xuが、AI(主にClaude)を回してGTA6風ゲーム「GT-Caliber」を制作。目標は本物より先に出すことだが、GTA6に匹敵するとの見方は大勢ではない。
- なぜ注目されるか:AIエージェント開発の「速さ」と「創造的ビジョンの不在」を、毎日の公開更新としてリアルタイムに見せているから。

このプロジェクトは、Rockstarと無関係の個人によるファン制作の実験である。GTA6そのものの情報ではないが、発売を待つ間に「AIはどこまでゲームを作れるのか」を考えさせる、いまならではの話題だと言える。

---

## 免責事項

本記事は、Ziwen Xu 本人のX(旧Twitter)投稿および海外メディアの報道をもとに、GTA6 FEEDが内容を整理してまとめたものである。「GT-Caliber」は Rockstar Games・Take-Two Interactive とは一切関係のない、個人によるファン制作プロジェクトであり、GTA6 の公式な開発・発表とは無関係である。開発状況や実装内容、目標は2026年7月4日時点の情報にもとづき、今後変わりうる。最新の状況は本人のX等の一次情報を確認されたい。`,
    titleEn:
      "“I Can't Wait for GTA6” — a 25-Year-Old AI Entrepreneur Starts Building His Own GTA6, With AI Alone",
    descriptionEn:
      "Unable to wait for GTA6, 25-year-old AI entrepreneur Ziwen Xu has been building a GTA6-style open-world crime game, “GT-Caliber,” since June 10 via “vibe coding” — running AI agents (mainly Claude). The goal: release before the real GTA6 (Nov 19). Reckless, but the process has become a public experiment mirroring where AI stands today.",
    aiSummaryEn: [
      "Unable to wait for GTA6, 25-year-old AI entrepreneur Ziwen Xu has been building a GTA6-style open-world crime game, “GT-Caliber,” since June 10 through “vibe coding” — running AI agents (mainly Claude). His stated goal: to release before the real GTA6 (out November 19).",
      "In about nine days it went from a bouncing blue box to a city with walking NPCs, driving cars, and a smartphone with an Instagram-like social feed. But there were stumbles too — the AI once generated an LA-style skyline instead of Miami — laying bare both AI's speed and its absence of a culturally accurate world, i.e. creative vision.",
      "Most observers see the value as an “experiment,” not a “competitor.” Ironically, the episode is also read as backing Take-Two CEO Zelnick's claim that AI is useful as a tool but lacks the creative vision to produce a blockbuster. It's a solo fan-made public experiment, unaffiliated with Rockstar.",
    ],
    fullContentEn: `# “I Can't Wait for GTA6” — a 25-Year-Old AI Entrepreneur Starts Building His Own GTA6, With AI Alone

Unable to wait for GTA6's release, one person started building it himself. Ziwen Xu, a 25-year-old AI entrepreneur, has been developing a GTA6-style open-world crime game, “GT-Caliber,” since June 10 through “vibe coding” — running AI agents (mainly Claude). His stated goal: to release before the real GTA6 (out November 19). It's reckless, but the development process has become a talking point as a public experiment mirroring where AI stands today. GTA6 FEED has summarized the overview.

This article is based on information as of July 4, 2026.

---

## What Is He Doing

Ziwen Xu is the founder of Hyperecho, an AI-agent startup (which helps companies adopt AI). On June 10, he kicked off the project with a post to the effect of “I've started making GTA6. I'm still typing and it hasn't sunk in yet,” and revealed he'd paid for Claude's higher-tier plan (Claude Max 20x) for this development.

![](https://x.com/ziwenxu_/status/2073147150201155804)

His development method is what's called “vibe coding” — running AI agents continuously in a loop and letting them handle generating, testing, and fixing code. He posts progress on X almost daily, publishes the code openly on GitHub, and sometimes livestreams the AI at work. He is also recruiting human collaborators who can do modeling, composing, level design, and so on. It's not that he's dumping everything on the AI.

The trigger was a challenge thrown down by AI investor Matt Shumer. Shumer had posted, in essence, “Can you loop a model and build a GTA6-class open world with quality and scale beyond the initial trailer?” — and Xu reposted it and then set to work himself. Of the goal, he wrote: “Ambitious, and probably foolish. I'll do it anyway.”

---

## Progress: From a “Blue Box” to a City in About Nine Days

The pace is fast — and chaotic.

Day one's footage was just a blue-box-like character bouncing around on a flat plane. By day two a humanoid character was running through a city; by day three NPCs were walking, cars were driving on roads, and there was even shooting and a smartphone with an Instagram-like social feed. By day seven, a stretch of cityscape with roads appeared, reaching the stage where he said it “looked like GTA for the first time.” Currently implemented are driving, NPCs, shooting, a phone (with map, contacts, and wallet), an intro screen with original BGM, weather changes, and more. The fine details of roads and sidewalks, he says, can't be nailed by AI alone and are being adjusted by hand.

![](https://x.com/ziwenxu_/status/2073870048481997126)

The development engine initially started with the free Godot, but on day seven he moved to Unreal Engine. During this period, the engine choice reportedly flip-flopped several times.

---

## Stumbles and “Incidents”

What people find amusing isn't the level of completion so much as the trouble that happens along the way.

The most emblematic is the mix-up over the setting. GTA6's Vice City is modeled on Miami (Florida), but at one point the AI agent generated an LA-style cluster of skyscrapers. This episode was cited all over as a prime example of how “AI can quickly build a generic box (sandbox), but it can't build the specific, deliberate, culturally accurate world that makes GTA GTA.”

The cost issue is vivid too. Xu wrote that he burned through 33% of Claude's weekly quota (on the 20x plan) in a single day — “the clock has started ticking.” Development that keeps running AI is also a battle against your usage quota. It's worth noting that this progress-posting took off largely because it coincided with the timing of Rockstar announcing GTA6 pre-orders (June 25).

---

## Assessment: AI's “Speed” and “Absence of Vision”

How should we view this project? Bluntly put, the speed of spinning up a sandbox in a few days is genuinely astonishing as a milestone for agentic AI development. On the other hand, almost no observer believes the goal of matching — or beating to market — the real GTA6 will actually be achieved. The fair assessment is that the value lies in the “experiment,” not the “competition.”

The key is that LA mix-up from earlier. AI can mass-produce fragments of features and looks at high speed, but the creative vision of “what to make” — which city, which radio stations, which jokes and characters to place — still belongs to the human domain. Fast, but no vision. That's the shared read across much of the media.

Ironically, this experiment is also taken as material backing Take-Two CEO Zelnick's argument. Zelnick has repeatedly said that while AI is useful as a development tool, it doesn't have the creative vision to produce a billion-dollar blockbuster like GTA. Rockstar itself reportedly avoided using AI in developing GTA6. If GTA6 — hand-crafted over 13 years — arrives on November 19, the contrast will only stand out more.

Reactions are split, too.

- “It runs this well in just a few days? I feel AI's potential.”
- “He's so serious about it that it makes you want to root for him.”
- “Interesting, but still a long way from GTA6.”
- “In the end, isn't this just engagement-baiting for buzz?”

It's also been pointed out that works made to resemble GTA — even without directly reusing assets — can, in terms of trade dress like tone and the mold of the city, more easily draw the rights holder's gaze down the line. This is a point that fan-made works in the AI era may face going forward.

---

## Summary

- What he's doing: 25-year-old AI entrepreneur Ziwen Xu is making a GTA6-style game, “GT-Caliber,” by running AI (mainly Claude). The goal is to release before the real thing, but the view that it rivals GTA6 is not the majority.
- Why it's drawing attention: because it shows, in real time as daily public updates, both the “speed” of AI-agent development and the “absence of creative vision.”

This project is a fan-made experiment by an individual unaffiliated with Rockstar. It isn't information about GTA6 itself, but while waiting for release it's a very of-the-moment topic that makes you consider “how far can AI build a game?”

---

## Disclaimer

This article was compiled and organized by GTA6 FEED based on Ziwen Xu's own posts on X (formerly Twitter) and reporting from overseas media. “GT-Caliber” is a fan-made project by an individual with no relation whatsoever to Rockstar Games or Take-Two Interactive, and is unrelated to the official development or announcements of GTA6. The development status, implemented content, and goals are based on information as of July 4, 2026, and are subject to change. For the latest status, please check primary sources such as the creator's own X account.`,
  },
  {
    id: 33,
    title:
      "GTA6のトレーラー3はいつ来るのか——最有力は「7月中旬、World Cup決勝の前後」",
    description:
      "予約は始まったのに第3弾トレーラーはまだ来ていない。公式発表はないが、Take-TwoのCEO発言と過去のパターンから、7月中旬〜下旬、FIFA World Cup決勝(7月19日)の前後が最有力の窓とみられる。ただし時期は推測で、Rockstarは予告なく映像を落とす会社だ。根拠と留意点を整理した。",
    icon: "🎬",
    image: "/images/news/toreira3haitukurunoka/Vice_City_01.332891cf.webp",
    category: "speculation",
    date: "2026-07-05",
    publishedAt: "2026-07-05 15:08",
    source: "GTA6 FEED 編集部",
    sourceUrl: "#",
    relatedArticles: [32, 30, 1],
    aiSummary: [
      "予約は始まったのに第3弾トレーラーはまだ来ていない。公式発表はないが、Take-TwoのZelnick CEOの「マーケティングを夏に開始・SNS中心」という発言と過去のパターンから、7月中旬〜下旬、FIFA World Cup決勝(7月19日)の前後が最有力の窓とみられる。ただし時期はあくまで推測だ。",
      "6月24〜25日に価格・エディション・予約開始・60枚超の新スクリーンショットが一気に公開されたが、映像トレーラーは伴わなかった。発売日は11月19日で変更なし。別候補として7月21日や、決算前後にあたる7月28日・8月4日も挙がる。",
      "内容は、第1弾・第2弾がシネマティック中心だったことから、第3弾は運転・ミッション・銃撃など実際のゲームプレイを見せる番との見方が強い。ただしRockstarは予告なく動く会社で、予約開始日(6月25日)にもトレーラーは来ず、日付の予想は何度も外れている。確実な情報は公式チャンネルで確認したい。",
    ],
    fullContent: `# GTA6のトレーラー3はいつ来るのか——最有力は「7月中旬、World Cup決勝の前後」

予約は始まったのに、第3弾トレーラーはまだ来ていない。GTA6の次の大きな映像はいつ公開されるのか。公式の発表はないものの、Take-TwoのCEO発言と過去のパターンから、7月中旬から下旬、FIFA World Cup決勝(7月19日)の前後が最有力の窓とみられている。ただし時期はあくまで推測であり、Rockstarは予告なく映像を落とす会社だ。GTA6 FEEDが、根拠と留意点を整理した。

本記事は2026年7月4日時点の情報にもとづく。

---

## まず確定していること

トレーラー3そのものはRockstarから告知されていないが、時期を読むうえで手がかりになる公式発言はある。

Take-TwoのZelnick CEOは、GTA6のマーケティングを「夏に」開始すると述べ、その時期を6月下旬から7月上旬と補足していた。あわせて、今回の宣伝は「オーディエンスと注目が今どこにあるか」を反映したソーシャルメディア中心の戦略になるとし、前作GTA Vと同じやり方はしないとも語っている。価格の発表・予約・マーケティングは同じ流れで来るとされ、実際に6月24〜25日には価格とエディション、予約開始、60枚を超える新スクリーンショットが一気に公開された。

ただし、そのタイミングで映像トレーラーは出なかった。7月上旬の現時点でも、第3弾トレーラーは未発表のままだ。なお発売日は2026年11月19日(PS5・Xbox Series X|S)で変わっていない。

![6月24〜25日に公開された新スクリーンショットの一つ(GTA6のULTIMATE EDITIONイメージより)。映像トレーラーは伴わなかった](/images/news/toreira3haitukurunoka/ULTIMATE_EDITION_ELECTRIC_FANG_03.webp)

---

## 最有力の時期:7月中旬〜下旬

ここからは推測になる。現時点で最も有力視されているのは、7月中旬、FIFA World Cup決勝(7月19日)の前後という窓だ。

World Cupは6月11日から7月19日まで開催され、この期間は世界の注目とSNS上の活動が一年でも最高潮に達する。Rockstarが自社チャンネルで独立してトレーラーを落とし、そのSNSの交通量に乗せて拡散を最大化する——というのが、Zelnickの「注目のある場所で仕掛ける」というソーシャル中心の方針と噛み合う、という読みだ。テレビ広告として決勝に差し込む可能性も指摘されるが、まず自社チャンネルでコア層に届け、その後にマス向けの露出を重ねる、という現代的な流れが想定されている。

別の候補日も挙がっている。決勝翌週の火曜にあたる7月21日、あるいは8月の決算発表前後にあたる7月28日や8月4日などだ。Rockstarはこれまで、決算のタイミングに合わせてGTA6の情報を出す傾向があった。また、GTA Onlineの夏の大型アップデート(7月14日頃と噂される)とは別の週になる公算が大きい。Rockstarは自社製品同士の注目を食い合わせないよう、大型アップデートとGTA6の情報発信を同じ週にぶつけない傾向があるためだ。

もっとも、正直な留保も必要だ。Rockstarは予告ゼロで、どの火曜に落としてもおかしくない。予想を裏切るのがこのスタジオのスタイルであり、実際、多くのファンが期待した予約開始日(6月25日)にもトレーラーは来なかった。日付の予想はこれまで何度も外れている。

![GTA6のULTIMATE EDITIONイメージより。トレーラー3の時期はCEO発言と過去の傾向にもとづく予想で、Rockstarは予告なく動く](/images/news/toreira3haitukurunoka/ULTIMATE_EDITION_SAFEHOUSE_VEHICLES_02.webp)

---

## 何を見せるのか——今度こそゲームプレイか

内容についても推測が飛び交っている。第1弾・第2弾はシネマティック(演出映像)が中心で、予約開始時にもスクリーンショットは出たが、動く映像は出なかった。ここまで来ると、第3弾は実際のゲームプレイ——運転、ミッション、銃撃、そして街が実際に動く様子——を見せる番だ、というのがおおむね一致した見方だ。

小売ページ由来の未確認リークで語られてきた要素(ゲーム内のSNS機能、SNS経由の秘密ミッション、NPCの高度なAIなど)が、もし本物であれば、次のトレーラーで裏づけられるかもしれない。ただしこれらはあくまで未確認の情報で、GTA6 FEEDでは別途詳しく整理している。GTA Onlineとの連携や、オンラインモードがどうなるのかも注目点だが、いずれも公式には発表されていない。

![GTA6のULTIMATE EDITIONイメージより。第3弾では運転やミッションなど、実際のゲームプレイが見られると期待されている](/images/news/toreira3haitukurunoka/ULTIMATE_EDITION_VAPID_GANADO_RETRO_BUILD_01.webp)

---

## まとめ:信頼度の整理

確定している事実:

- Take-TwoのZelnick CEOは、マーケティングを夏(6月下旬〜7月上旬)に始めると発言し、ソーシャルメディア中心の戦略を強調していた。
- 6月24〜25日に価格・予約・スクリーンショットが公開されたが、映像トレーラーは伴わなかった。第3弾トレーラーは現時点で未発表。
- 発売日は11月19日で変更なし。

推測:

- 第3弾トレーラーは7月中旬〜下旬、World Cup決勝(7月19日)の前後が最有力の窓。内容はゲームプレイ中心になるとの見方が強い。ただし時期・内容とも公式には確認されていない。

ファンの反応も期待にあふれている。

- 「スクショはもう十分。そろそろゲームプレイを見せてほしい」
- 「World Cup決勝に合わせて仕掛けてくるはずだ」
- 「どうせ誰も予想しない火曜に抜き打ちで来る」

注意点として、トレーラー3の時期・内容はRockstarから何も発表されておらず、ここで示したのはCEO発言と過去の傾向にもとづく予想である。これまでも日付の予想は当たっておらず(予約開始時にトレーラーは来なかった)、Rockstarは予告なく動く。確実な情報は、Rockstarの公式チャンネルとNewswireで確認するのが望ましい。

![GTA6のULTIMATE EDITIONイメージより。確実な情報はRockstarの公式チャンネルとNewswireで確認したい](/images/news/toreira3haitukurunoka/ULTIMATE_EDITION_HAWK_AND_LITTLE_MORGAN_REVOLVERS_02.webp)

---

## 免責事項

本記事は、Take-Two/Rockstar Games の公式発言および発表、海外メディアの報道やコミュニティの分析をもとに、GTA6 FEEDが内容を整理してまとめたものである。トレーラー3の公開時期や内容に関する記述の多くは、CEO発言と過去の傾向にもとづく分析・推測であり、Rockstarが公表した確定情報ではない。日付や内容は予告なく変わりうる。最新かつ正確な情報は、必ず Rockstar Games の公式チャンネルおよび Newswire を確認されたい。

なお、これまでに公開された第1弾・第2弾トレーラーの内容と、第3弾の「6月25日説」がどこから出たのかは「[GTA6のトレーラーを総ざらい](/news/1)」で振り返っている。`,
    titleEn:
      "When Will GTA6's Trailer 3 Arrive? The Frontrunner: “Mid-July, Around the World Cup Final”",
    descriptionEn:
      "Pre-orders are open, but Trailer 3 still hasn't dropped. There's no official announcement, yet Take-Two's CEO comments and past patterns point to mid-to-late July — around the FIFA World Cup Final (July 19) — as the most likely window. But the timing is speculation, and Rockstar drops footage without warning. Here's the reasoning and the caveats.",
    aiSummaryEn: [
      "Pre-orders are open, but Trailer 3 still hasn't arrived. There's no official announcement, yet Take-Two CEO Zelnick's comments — that marketing would start “in the summer” and be social-media-centric — plus past patterns point to mid-to-late July, around the FIFA World Cup Final (July 19), as the most likely window. But the timing is purely speculation.",
      "On June 24–25, pricing, editions, pre-orders, and 60-plus new screenshots all dropped at once — but with no video trailer. The release date remains November 19. Other candidate dates floated include July 21, and July 28 / August 4 around the earnings report.",
      "As for content, since Trailers 1 and 2 were cinematic-heavy, the strong view is that Trailer 3 is the turn to show actual gameplay — driving, missions, gunfights. But Rockstar moves without warning: no trailer came on pre-order day (June 25), and date predictions have missed many times. Confirm via official channels.",
    ],
    fullContentEn: `# When Will GTA6's Trailer 3 Arrive? The Frontrunner: “Mid-July, Around the World Cup Final”

Pre-orders have opened, yet the third trailer still hasn't come. When will GTA6's next major footage be released? There's no official announcement, but based on Take-Two's CEO comments and past patterns, mid-to-late July — around the FIFA World Cup Final (July 19) — is seen as the most likely window. That said, the timing is strictly speculation, and Rockstar is a studio that drops footage without warning. GTA6 FEED has organized the reasoning and the caveats.

This article is based on information as of July 4, 2026.

---

## First, What's Confirmed

Trailer 3 itself hasn't been announced by Rockstar, but there are official statements that serve as clues for reading the timing.

Take-Two CEO Zelnick said GTA6's marketing would begin “in the summer,” adding that this would be around late June to early July. He also said this campaign would be a social-media-centric strategy reflecting “where the audience and attention are right now,” and that they wouldn't do it the same way as with the previous game, GTA V. Pricing announcements, pre-orders, and marketing were said to come in the same flow — and indeed, on June 24–25, pricing and editions, the start of pre-orders, and over 60 new screenshots all dropped at once.

However, no video trailer came at that timing. Even now in early July, Trailer 3 remains unannounced. Note that the release date is unchanged at November 19, 2026 (PS5 and Xbox Series X|S).

![One of the new screenshots released on June 24–25 (from GTA6's ULTIMATE EDITION imagery). No video trailer accompanied it](/images/news/toreira3haitukurunoka/ULTIMATE_EDITION_ELECTRIC_FANG_03.webp)

---

## The Most Likely Timing: Mid-to-Late July

From here on it's speculation. Right now, the most heavily favored window is mid-July, around the FIFA World Cup Final (July 19).

The World Cup runs from June 11 to July 19, and during this period global attention and social-media activity reach their yearly peak. Rockstar dropping a trailer independently on its own channels and riding that social-media traffic to maximize reach — that reading fits Zelnick's social-centric approach of “striking where the attention is.” There's also speculation it could be slotted into the final as a TV ad, but the assumed modern flow is to first reach the core audience via its own channels, then layer on mass-market exposure afterward.

Other candidate dates have been raised too. July 21, the Tuesday of the week after the final; or July 28 and August 4, around the August earnings report. Rockstar has historically tended to release GTA6 information timed to earnings. It's also likely to be a different week from GTA Online's big summer update (rumored around July 14). Rockstar tends not to pit a major update and GTA6 news in the same week, so as not to have its own products cannibalize each other's attention.

Still, an honest reservation is needed. Rockstar gives zero warning, and it wouldn't be surprising on any given Tuesday. Defying expectations is this studio's style — and indeed, no trailer came even on the pre-order start date (June 25) that many fans had hoped for. Date predictions have missed many times before.

![From GTA6's ULTIMATE EDITION imagery. Trailer 3's timing is a projection based on CEO comments and past tendencies, and Rockstar moves without warning](/images/news/toreira3haitukurunoka/ULTIMATE_EDITION_SAFEHOUSE_VEHICLES_02.webp)

---

## What Will It Show — Gameplay at Last?

Speculation is flying about the content, too. Trailers 1 and 2 were cinematic-centric, and while screenshots came out at pre-order time, no moving footage did. At this point, the roughly consensus view is that Trailer 3 is the turn to show actual gameplay — driving, missions, gunfights, and the city actually in motion.

Elements that have been discussed in unconfirmed leaks originating from retailer pages (in-game social-media features, secret missions via social media, advanced NPC AI, and so on), if real, might be substantiated in the next trailer. However, these are strictly unconfirmed, and GTA6 FEED covers them in detail separately. Ties to GTA Online and what the online mode will look like are also points of interest, but none of it has been officially announced.

![From GTA6's ULTIMATE EDITION imagery. Trailer 3 is expected to show actual gameplay such as driving and missions](/images/news/toreira3haitukurunoka/ULTIMATE_EDITION_VAPID_GANADO_RETRO_BUILD_01.webp)

---

## Summary: Sorting by Confidence

Confirmed facts:

- Take-Two CEO Zelnick said marketing would begin in the summer (late June to early July), emphasizing a social-media-centric strategy.
- On June 24–25, pricing, pre-orders, and screenshots were released, but no video trailer accompanied them. Trailer 3 is unannounced as of now.
- The release date is unchanged at November 19.

Speculation:

- Trailer 3's most likely window is mid-to-late July, around the World Cup Final (July 19). The strong view is that the content will be gameplay-centric. However, neither the timing nor the content has been officially confirmed.

Fan reactions are full of anticipation, too.

- “Enough with the screenshots. Time to show us gameplay.”
- “They're sure to strike in sync with the World Cup Final.”
- “It'll drop out of the blue on a Tuesday no one predicts.”

As a caveat, nothing about Trailer 3's timing or content has been announced by Rockstar; what's presented here is a projection based on CEO comments and past tendencies. Date predictions haven't panned out before (no trailer came at pre-order start), and Rockstar moves without warning. For reliable information, it's best to check Rockstar's official channels and the Newswire.

![From GTA6's ULTIMATE EDITION imagery. For reliable information, check Rockstar's official channels and the Newswire](/images/news/toreira3haitukurunoka/ULTIMATE_EDITION_HAWK_AND_LITTLE_MORGAN_REVOLVERS_02.webp)

---

## Disclaimer

This article was compiled and organized by GTA6 FEED based on official statements and announcements from Take-Two/Rockstar Games, as well as reporting from overseas media and community analysis. Much of what is written about Trailer 3's release timing and content is analysis and speculation based on CEO comments and past tendencies, not confirmed information disclosed by Rockstar. Dates and content are subject to change without notice. For the latest and most accurate information, please always check Rockstar Games' official channels and the Newswire.

For a recap of what the first two trailers showed and where the "June 25" theory for Trailer 3 came from, see "[A Complete Rundown of the GTA6 Trailers](/en/news/1)".`,
  },
  {
    id: 32,
    title:
      "GTA6はPS5 Proでも30fps止まりか——Digital Foundryが「60fpsは厳しい」と分析、その根拠と反論",
    description:
      "PS5 ProならGTA6を60fpsで——との期待に、Digital Foundryが慎重論。ボトルネックはGPUではなくCPUにあり、最上位機でも30fps、よくて40fpsが濃厚だと分析する。ただし公式情報ではなく専門家の推測だ。根拠・反論・確定情報を切り分けて整理した。",
    icon: "🎮",
    image: "/images/news/60fps/ULTIMATE_EDITION_02.webp",
    category: "speculation",
    date: "2026-07-04",
    publishedAt: "2026-07-04 10:00",
    source: "GTA6 FEED 編集部",
    sourceUrl: "#",
    relatedArticles: [30, 26, 28],
    aiSummary: [
      "PS5 Proを買えばGTA6を60fpsで——という期待に、技術分析メディアのDigital Foundryが慎重論。ボトルネックはGPU(描画)ではなくCPU(処理)にあり、密なシミュレーションを支えるためPS5 Proでも30fps、よくて40fpsが濃厚だと分析する。ただしこれは公式情報ではなく専門家の推測だ。",
      "確定していることはごくわずか。Rockstarはフレームレート目標を未公表で、PlayStation側の表記も「PS5 Pro Enhanced」等にとどまる。過去作(GTA IV/V、RDR2)はいずれもコンソールで30fps発売、GTA5は数年後に60fpsモードを追加した経緯がある。",
      "反論材料として小売(Media Markt)のFAQに「Quality/Performance(60fps)」の2モード記載というリークもあるが、DFは定型文の可能性が高く決定的でないと懐疑的。現実的な備えは「発売時30fps(PS5 Proでよくて40fps)」を前提に、最終仕様はRockstarの公式発表で確認することだ。",
    ],
    fullContent: `# GTA6はPS5 Proでも30fps止まりか——Digital Foundryが「60fpsは厳しい」と分析、その根拠と反論

PS5 Proを買えばGTA6を60fpsで遊べる——そんな期待に、技術分析メディアが冷や水を浴びせている。Digital Foundry(DF)は、GTA6は60fpsの実現が難しく、最上位機のPS5 Proでも30fps、よくて40fpsが濃厚だと分析した。ただしこれは公式情報ではなく、あくまで専門家の分析と推測だ。Rockstarはフレームレートについて何も明言していない。GTA6 FEEDが、その根拠と反論、そして確定情報を切り分けて整理した。

本記事は2026年7月4日時点の情報にもとづく。

---

## まず確定していること

フレームレートに関して、公式に分かっていることはごくわずかだ。

- Rockstarは、GTA6のフレームレート目標を一切公表していない。「PS5で最高のプレイ体験を」といった趣旨の表現にとどまる。
- PlayStation側の表記も「PS5 Pro Enhanced」対応と、DualSenseの触覚フィードバック、3Dオーディオ対応が挙げられているのみで、解像度やfpsといった具体的な強化内容は明示されていない。
- 過去作の実績として、GTA IV、GTA V、RDR2はいずれもコンソールで30fpsで発売された。GTA5については、数年後にPS5とXbox Series X|S向けに60fpsモードが追加された経緯がある。

つまり、現時点でGTA6のフレームレートは公式には何も決まっておらず、以下は専門家の分析にもとづく予想である。

![GTA6のULTIMATE EDITIONイメージより。フレームレートの仕様は、未発売の現時点でRockstarから公式には示されていない](/images/news/60fps/ULTIMATE_EDITION_GROTTI_CHEETAH_01.webp)

---

## Digital Foundryの分析:「60fpsは厳しい」

DFのWilliam Juddは、最近のトレーラーや予約時のスクリーンショット、Rockstarの過去作の傾向から、GTA6が60fpsに達するのは難しいと見ている。DFは2024年の時点でも同種の指摘をしており(当時はRichard Leadbetterが同様のCPUボトルネック論を述べていた)、一貫した見方だ。

要点は、ボトルネックがGPU(描画性能)ではなくCPU(処理性能)にあるという指摘だ。GTA6の密なシミュレーション——NPCの挙動、交通、物理演算、レイトレーシング、ストリーミング、アニメーションといった世界の処理——は、60fpsを狙うならおよそ半分の時間ですべてを更新し続けなければならず、CPUに極めて重い負荷がかかる。Juddは、GTA6の世界はDragon's Dogma 2やBaldur's Gate 3といった重量級のRPGよりも「一段上の難しさ」だとし、さらに陸・海・空を高速で移動でき、車両ごとに計算負荷の高い物理演算が必要になる点を挙げて、この種の負荷は従来からコンソールを30fpsに縛ってきた、と説明する。

問題は、PS5 Proでもこの事情が大きく変わらない点だ。PS5 ProはGPUの強化、レイトレーシングの高速化、PSSRによるアップスケーリングに優れる一方、CPU性能はベースのPS5からわずかしか向上していない。フレームレートの上限がCPUに縛られている以上、GPUの強化だけでは60fpsの壁は越えにくい。このためDFは、PS5 Proでも60fpsより、30fpsか40fpsのモードで出る可能性の方が高いと見る。妥協点として現実的なのは、120Hzディスプレイ向けの40fpsモードだ。フレーム時間で見ると25ミリ秒と、30fps(33.3ミリ秒)と60fps(16.7ミリ秒)のちょうど中間にあたり、なめらかさの底上げになる。

ただしDF自身、これは現時点での推測であり外れる可能性もあると断っている。もし外れれば、GTA6はRockstarとして初めて、発売時からコンソールで60fpsを狙うオープンワールド作品になる、とも述べている。

![陸・海・空を高速で移動でき、車両ごとに重い物理演算が必要になる——こうした負荷が従来からコンソールを30fpsに縛ってきた、とDFは説明する](/images/news/60fps/ULTIMATE_EDITION_SQUALO_03.webp)

---

## 反論・別の見方

一方で、60fpsへの期待をつなぐ材料もある。

ポーランドの小売店(Media Markt)のFAQなどが漏れた際、PS5やXbox Series X向けに「Qualityモード(高画質・30fps)」と「Performanceモード(高フレームレート・60fps)」の2択があると記載されていた。これが本当なら60fpsモードの存在が期待できる。

だがDFはこの種の小売リークに懐疑的だ。多くのPS5作品がこうした二つのモードを定型的に掲載しており、決定的な証拠にはならないという。文面が定型文やAIによる要約である可能性もあり、仮に「Performance」があっても、それが40fpsモードだったり、画質を少し抑えて30fpsを安定させるモードを指すだけだったりする可能性もある、というのがDFの見方だ。

また、GTA5のように発売後のパッチで60fpsが追加される前例はある。ただしRockstarは発売初週の完成度を重視する傾向があり、発売時点は30fpsを覚悟しておくのが現実的だ。

![GTA6のULTIMATE EDITIONイメージより。小売のFAQに現れた「Performance/60fps」の記載は、DFによれば決定的な証拠とは言えない](/images/news/60fps/ULTIMATE_EDITION_ONE_EYED_WILLIE_03.webp)

---

## 現状のコンセンサス

専門家とコミュニティの見方をまとめると、おおむね次のようになる。

- ベースのPS5、Xbox Series X:30fps中心とみられる。
- PS5 Pro:30fpsが濃厚。運が良ければ40fpsのオプション。
- Xbox Series S:さらに厳しく、30fps固定になるとの見方。
- 60fps:発売時は望み薄。将来のパッチで追加される余地は残る。

ファンの反応も割れている。

- 「60fps目当てでPS5 Proを買ったのに、意味が薄れる」
- 「GTAは画質と世界の作り込みが命だから、30fpsでも構わない」

---

## まとめ:信頼度の整理

確定している事実:

- Rockstarはフレームレート目標を公表していない。PlayStation側の表記も「PS5 Pro Enhanced」等にとどまり、具体的な強化内容は非公表。
- GTA IV・V・RDR2はいずれもコンソールで30fps発売。GTA5は数年後に60fpsモードを追加した。

分析・推測(Digital Foundry):

- CPUがボトルネックとなり、60fpsは難しい。PS5 Proでも30fpsか40fpsが濃厚。DF自身、外れる可能性もあると留保している。

リーク(未確認):

- 小売のFAQに「Quality/Performance」の2モード記載。ただしDFは決定的でないと懐疑的。

注意点として、GTA6は本記事執筆時点で未発売であり、フレームレートはRockstarの公式発表があるまで確定しない。ここで示したのは技術分析にもとづく予想であり、発売直前まで状況は変わりうる。過去には60fps対応をうたうリークも流れており、この話題は何度も揺れてきた。現実的な備えとしては「発売時は30fps(PS5 Proでよくて40fps)」を前提に置きつつ、最終的な仕様はRockstarの公式発表で確認するのが望ましい。

---

## 免責事項

本記事は、Digital Foundryによる技術分析、Rockstar Games および PlayStation の公式表記、海外メディアの報道やリーク情報をもとに、GTA6 FEEDが内容を整理してまとめたものである。フレームレートに関する記述の多くは専門家の分析・推測であり、Rockstarが公表した確定情報ではない。GTA6は本記事執筆時点で未発売であり、対応フレームレートや各モードの仕様は、Rockstarの公式発表があるまで確定しない。最新かつ正確な情報は、必ず Rockstar Games の公式発表を確認されたい。`,
    titleEn:
      "Will GTA6 Be Stuck at 30fps Even on PS5 Pro? Digital Foundry Analyzes Why “60fps Is a Tall Order” — the Reasoning and the Counterarguments",
    descriptionEn:
      "Hoping a PS5 Pro will run GTA6 at 60fps? Digital Foundry urges caution. The bottleneck is the CPU, not the GPU, so even the top-end console is most likely 30fps — 40fps at best. But this is expert speculation, not official info. Here's the reasoning, the counterarguments, and what's actually confirmed.",
    aiSummaryEn: [
      "Hoping a PS5 Pro will let you play GTA6 at 60fps? The tech-analysis outlet Digital Foundry urges caution. The bottleneck is the CPU (processing), not the GPU (rendering), and to sustain GTA6's dense simulation even a PS5 Pro is most likely 30fps — 40fps at best. This is expert speculation, not official information.",
      "Very little is confirmed. Rockstar has not disclosed a frame-rate target, and PlayStation's listing only mentions “PS5 Pro Enhanced.” Past titles (GTA IV/V, RDR2) all shipped at 30fps on consoles, and GTA5 only added a 60fps mode years later.",
      "As a counterpoint, a leaked retailer (Media Markt) FAQ listed two modes — “Quality” and “Performance (60fps)” — but DF is skeptical, calling it likely boilerplate and not decisive. The realistic stance: assume 30fps at launch (40fps at best on PS5 Pro) and wait for Rockstar's official specs.",
    ],
    fullContentEn: `# Will GTA6 Be Stuck at 30fps Even on PS5 Pro? Digital Foundry Analyzes Why “60fps Is a Tall Order” — the Reasoning and the Counterarguments

Buy a PS5 Pro and you'll play GTA6 at 60fps — a tech-analysis outlet is pouring cold water on that hope. Digital Foundry (DF) has argued that 60fps will be hard for GTA6 to achieve, and that even the top-end PS5 Pro is most likely 30fps — 40fps at best. But this is not official information; it is strictly expert analysis and speculation. Rockstar has said nothing definitive about frame rate. GTA6 FEED has separated out the reasoning, the counterarguments, and what's actually confirmed.

This article is based on information as of July 4, 2026.

---

## First, What's Confirmed

When it comes to frame rate, what's officially known is very little.

- Rockstar has not disclosed any frame-rate target for GTA6. Its statements go no further than sentiments like “the best play experience on PS5.”
- PlayStation's own listing only cites “PS5 Pro Enhanced” support, DualSense haptic feedback, and 3D audio — with no specifics such as resolution or fps for what the enhancements actually are.
- As for past titles, GTA IV, GTA V, and RDR2 all launched at 30fps on consoles. In GTA5's case, a 60fps mode was added years later for PS5 and Xbox Series X|S.

In other words, nothing about GTA6's frame rate is officially decided at this point, and what follows is a projection based on expert analysis.

![From GTA6's ULTIMATE EDITION imagery. As of now, pre-release, Rockstar has not officially stated the frame-rate specs](/images/news/60fps/ULTIMATE_EDITION_GROTTI_CHEETAH_01.webp)

---

## Digital Foundry's Analysis: “60fps Is a Tall Order”

DF's William Judd, drawing on recent trailers, pre-order screenshots, and the tendencies of Rockstar's past titles, sees 60fps as hard for GTA6 to reach. DF made similar points back in 2024 (at the time Richard Leadbetter laid out the same CPU-bottleneck argument), so it's a consistent view.

The crux is the claim that the bottleneck lies in the CPU (processing performance), not the GPU (rendering performance). GTA6's dense simulation — the world's processing of NPC behavior, traffic, physics, ray tracing, streaming, animation, and more — must, to target 60fps, keep updating all of it in roughly half the time, placing an extremely heavy load on the CPU. Judd calls GTA6's world “a notch harder” than heavyweight RPGs like Dragon's Dogma 2 or Baldur's Gate 3, and adds that you can move at high speed across land, sea, and air, with computationally demanding physics required per vehicle — the kind of load that has traditionally chained consoles to 30fps.

The problem is that this situation doesn't change much even on PS5 Pro. While the PS5 Pro excels at a stronger GPU, faster ray tracing, and PSSR upscaling, its CPU performance is only marginally improved over the base PS5. As long as the frame-rate ceiling is bound by the CPU, a GPU boost alone won't easily clear the 60fps wall. For this reason, DF sees it as more likely that even PS5 Pro ships with a 30fps or 40fps mode rather than 60fps. The realistic compromise is a 40fps mode for 120Hz displays. In frame-time terms that's 25 milliseconds — right between 30fps (33.3 ms) and 60fps (16.7 ms) — offering a boost to smoothness.

That said, DF itself cautions that this is speculation for now and could be wrong. If it is wrong, DF adds, GTA6 would become the first Rockstar open-world game to target 60fps on consoles right from launch.

![You can move at high speed across land, sea, and air, with heavy per-vehicle physics required — this kind of load, DF explains, has traditionally chained consoles to 30fps](/images/news/60fps/ULTIMATE_EDITION_SQUALO_03.webp)

---

## Counterarguments and Other Views

On the other hand, there's material that keeps 60fps hopes alive.

When a Polish retailer's (Media Markt) FAQ and the like leaked, it stated there were two options for PS5 and Xbox Series X: a “Quality mode (high image quality, 30fps)” and a “Performance mode (high frame rate, 60fps).” If true, this raises hopes for a 60fps mode.

But DF is skeptical of this sort of retail leak. Many PS5 titles list these two modes as a matter of routine, so it's not decisive evidence. The text could be boilerplate or an AI-generated summary, and even if a “Performance” mode exists, DF's view is that it might turn out to be a 40fps mode, or merely a mode that slightly lowers image quality to stabilize 30fps.

There is also precedent, as with GTA5, for 60fps being added via a post-launch patch. However, Rockstar tends to prioritize launch-week polish, so it's realistic to brace for 30fps at release.

![From GTA6's ULTIMATE EDITION imagery. The “Performance/60fps” listing that appeared in the retailer FAQ is, per DF, not decisive evidence](/images/news/60fps/ULTIMATE_EDITION_ONE_EYED_WILLIE_03.webp)

---

## The Current Consensus

Summing up the views of experts and the community, it roughly comes to this.

- Base PS5, Xbox Series X: Likely centered on 30fps.
- PS5 Pro: 30fps is the strong bet. A 40fps option if you're lucky.
- Xbox Series S: Even tougher; expected to be locked to 30fps.
- 60fps: Slim hopes at launch. Room remains for it to be added in a future patch.

Fan reactions are split, too.

- “I bought a PS5 Pro for the 60fps, and now that's looking pointless.”
- “GTA lives and dies on image quality and the craft of its world, so I'm fine with 30fps.”

---

## Summary: Sorting by Confidence

Confirmed facts:

- Rockstar has not disclosed a frame-rate target. PlayStation's listing goes no further than “PS5 Pro Enhanced” and the like, with the specific enhancements undisclosed.
- GTA IV, V, and RDR2 all launched at 30fps on consoles. GTA5 added a 60fps mode years later.

Analysis and speculation (Digital Foundry):

- The CPU is the bottleneck, making 60fps difficult. Even PS5 Pro is likely 30fps or 40fps. DF itself reserves that it could be wrong.

Leaks (unverified):

- A retailer FAQ lists two modes, “Quality/Performance.” But DF is skeptical, calling it non-decisive.

As a caveat, GTA6 is unreleased at the time of writing, and its frame rate won't be settled until Rockstar makes an official announcement. What's presented here is a projection based on technical analysis, and the situation can change right up until launch. Leaks touting 60fps support have circulated before, and this topic has swung back and forth many times. As a realistic preparation, it's best to work on the assumption of “30fps at launch (40fps at best on PS5 Pro)” while confirming the final specs via Rockstar's official announcement.

---

## Disclaimer

This article was compiled and organized by GTA6 FEED based on Digital Foundry's technical analysis, official listings from Rockstar Games and PlayStation, and reporting and leaks from overseas media. Much of what is written about frame rate is expert analysis and speculation, not confirmed information disclosed by Rockstar. GTA6 is unreleased at the time of writing, and the supported frame rates and the specs of each mode will not be settled until Rockstar makes an official announcement. For the latest and most accurate information, please always check Rockstar Games' official announcements.`,
  },
  {
    id: 31,
    title:
      "GTA Online、独立記念日イベント開始——Lago Zancudoバンカーが無料、「過去最大」のセールも",
    description:
      "GTA Onlineで独立記念日イベントが7月2日に開幕。通常100万GTA$超のLago Zancudoバンカーが無料でもらえるほか、Rockstarが「過去最大」と称する大規模セールも実施中。多くは7月13日まで。内容と押さえどころをまとめた。",
    icon: "🎆",
    image: "/images/news/IndependenceDay/GTAO.webp",
    category: "event",
    date: "2026-07-03",
    publishedAt: "2026-07-03 09:00",
    source: "GTA6 FEED 編集部",
    sourceUrl: "#",
    relatedArticles: [29, 30, 28],
    aiSummary: [
      "GTA Onlineで独立記念日(Independence Day)イベントが7月2日に開幕。目玉は通常100万GTA$を超えるLago Zancudoバンカーの無料配布で、Maze Bank Foreclosuresから7月13日まで取得できる。バンカー改造・アップグレードも40%オフ。",
      "報酬アップも手厚く、バンカー売却ミッションは2倍、スタントレースは3倍。花火ランチャーやマスケット、独立記念日バケットハットなども無料で、ウィークリーチャレンジ達成でGTA$10万＋限定衣装ももらえる。",
      "セールはRockstarが「過去最大」と称する規模で、航空機・特殊車両・プロパティなどが大幅値引き。GTA+会員は無料Ocelot Strombergやマンション200万GTA$割引などの追加特典も。未所持なら無料バンカーは取り逃さず受け取りたい。",
    ],
    fullContent: `# GTA Online、独立記念日イベント開始——Lago Zancudoバンカーが無料、「過去最大」のセールも

GTA Onlineで、独立記念日(Independence Day)を記念したイベントが7月2日に始まった。目玉は、通常100万GTA$を超えるLago Zancudoバンカーの無料配布と、Rockstarが「過去最大」と称する大規模セールだ。無料バンカーやセールの多くは7月13日まで続く。GTA6 FEEDが内容と押さえどころをまとめた。

本記事は2026年7月2日時点の情報にもとづく。

---

## 無料でもらえるもの

今回のイベントは、無料で受け取れるアイテムが特に手厚い。

- Lago Zancudoバンカー:Maze Bank Foreclosuresから無料で取得できる(7月13日まで)。通常は100万GTA$を超える物件で、一度受け取れば恒久的に自分の資産になる。あわせて、バンカーの改造・アップグレードが40%オフになる。
- ハイエンドガレージも無料で入手できる。
- 花火ランチャー(Gun Van)とマスケット(Ammu-Nation)が無料。ログインすると独立記念日仕様のバケットハットも受け取れる。
- Business Battlesでは、ビールハット各種やStatue of Happiness Tシャツといった期間限定のコスメティックが手に入る。

![Gun Vanで無料になる花火ランチャー。独立記念日らしく夜空を彩れる](/images/news/IndependenceDay/hanabirancya.webp)

---

## 報酬アップとボーナス

資金稼ぎの機会も多い。今月後半に控えるThe Kortz Center Heistに向けて、GTA$を貯めるのに向いた週になっている。

- バンカー売却ミッションの報酬が2倍(GTA$・RP)。バンカーやガンランニング関連のミッションにもボーナスが付く。
- スタントレースの報酬が3倍(トリプル)。Running Back(Remix)なども登場する。
- ウィークリーチャレンジは、7月2日〜8日はバンカーリサーチミッションを3回完了でGTA$10万とBlue Jock Cranley Jumpsuit。9日〜13日はレースに2回勝利で同じ報酬が得られる。

![報酬3倍となるスタントレース。トリプルのGTA$・RPボーナスで一気に稼げる](/images/news/IndependenceDay/stuntlace.webp)

---

## 独立記念日仕様のCommunity Series

あわせて、独立記念日にあわせた特別版のCommunity Seriesも実施されている。ラリーレース、西部劇風の早撃ち(クイックドロー)対決、マスケット銃のデスマッチなど、コミュニティが手がけたミッション・モードが対象で、これらをプレイするとGTA$とRPが2倍になる。こちらも期間は7月13日まで。無料バンカーやセールと同じ期間に走っているため、資金稼ぎのついでに普段と違うモードで遊ぶ動機にもなる。

![独立記念日仕様のCommunity Series。ラリーレースやクイックドロー対決などコミュニティ製モードでGTA$・RPが2倍になる](/images/news/IndependenceDay/HMQoKVnXcAAOE4P.webp)

*画像: Rockstar Games の公式プロモーション画像より*

---

## 「過去最大」のセール

セール規模も大きい。航空機、特殊車両・武装車両、プロパティなど広範囲が大幅に値引きされている。独立記念日の衣類・リバリー・パラシュートの煙・フェイスペイントなどは40%オフ、星条旗をあしらったSovereignバイクとLiberatorモンスタートラックは50%オフとなっている。公式の告知画像でも、数十万から数百万GTA$規模の割引が並ぶ、目玉の車両・航空機がいくつも示されている。

GTA+会員には、さらに追加の特典がある。限定の独立記念日衣類、無料のOcelot Stromberg、Chameleon Paints、そしてMansion(豪邸)の200万GTA$割引などが用意されている。

![「過去最大」とうたわれるセール。航空機や特殊車両など広範囲が大幅値引きされている](/images/news/IndependenceDay/GTAO2.webp)

---

## 無料バンカーは取っておくべきか

結論から言えば、まだバンカーを持っていないなら、この無料のLago Zancudoは受け取っておくのがよい。通常100万GTA$超の物件がタダになるだけでなく、ガンランニング、放置中も進む受動収入、Mk II武器のリサーチといった、GTA Onlineでも屈指の長期ビジネスの土台になるからだ。単なる無料の建物というより、収益の仕組みそのものが一つ増えると考えたほうが近い。

ただし一点だけ補足すると、すでにChumashやFarmhouseのバンカーを持っている場合は、無理に乗り換える必要はない。この2か所は配送ルートが短く、売却ミッションの効率で有利とされる。Lago Zancudoは立地の関係で一部の売却に時間がかかるため、優先度で言えば中位だ。とはいえ「無料でもらえる100万超の物件」であることは変わらないので、未所持なら取り逃さないよう、期限の7月13日までに受け取っておきたい。

![ガンランニング関連ミッションもボーナス対象。バンカーは受動収入やMk II武器のリサーチなど、長期ビジネスの土台になる](/images/news/IndependenceDay/bankerbonus.webp)

---

## 補足:今月のGTA Online

このイベントは、7月中に配信予定の新アップデートThe Kortz Center Heistへ向けた流れの一部でもある。並行して、7月13日まで続くFine Art Collector Program(ログインでGTA$50万や無料車両などが得られる)も進行中だ。

GTA6の予約が大きな話題となる一方で、GTA Onlineは毎週の更新を続けている。独立記念日の今週は、無料の物件やアイテム、報酬アップが重なる、この数週間でも特に得の多い内容になっている。

---

## 免責事項

本記事は、Rockstar Games の公式告知および Rockstar Newswire、海外メディアの報道をもとに、GTA6 FEEDが内容を整理してまとめたものである。無料配布アイテム、報酬倍率、セール内容、期間などは2026年7月2日時点の情報にもとづく。GTA Online のイベント内容や割引率、対象アイテム、期間は Rockstar により予告なく変更される場合がある。ゲーム内価格やボーナスの適用条件はプラットフォームやタイミングによって異なることがある。最新かつ正確な情報は、必ずゲーム内表示および Rockstar Games の公式発表を確認されたい。`,
    titleEn:
      "GTA Online Independence Day Event Begins — A Free Lago Zancudo Bunker and Rockstar's “Biggest Ever” Sale",
    descriptionEn:
      "GTA Online's Independence Day event kicked off on July 2. A Lago Zancudo Bunker normally worth over GTA$1M is free, alongside a large-scale sale Rockstar calls its “biggest ever.” Most of it runs through July 13. Here's what's on offer and what to prioritize.",
    aiSummaryEn: [
      "GTA Online's Independence Day event began on July 2. The headline is a free Lago Zancudo Bunker — normally over GTA$1M — claimable from Maze Bank Foreclosures through July 13, plus 40% off bunker modifications and upgrades.",
      "Reward boosts are generous too: Bunker Sell Missions pay double, Stunt Races pay triple. A firework launcher, a musket, and an Independence Day bucket hat are free, and completing weekly challenges grants GTA$100K plus limited-time cosmetics.",
      "The sale is what Rockstar calls its “biggest ever,” with heavy discounts on aircraft, special/weaponized vehicles, and properties. GTA+ members get extras like a free Ocelot Stromberg and GTA$2M off a Mansion. If you don't own a bunker yet, don't miss the free one.",
    ],
    fullContentEn: `# GTA Online Independence Day Event Begins — A Free Lago Zancudo Bunker and Rockstar's “Biggest Ever” Sale

In GTA Online, an event commemorating Independence Day began on July 2. The highlights are a free Lago Zancudo Bunker — a property normally worth over GTA$1M — and a large-scale sale that Rockstar calls its “biggest ever.” Much of the free content and the sale run through July 13. GTA6 FEED has summarized what's on offer and what to keep an eye on.

This article is based on information as of July 2, 2026.

---

## What You Can Get for Free

This event is especially generous with items you can receive for free.

- Lago Zancudo Bunker: You can claim it for free from Maze Bank Foreclosures (through July 13). Normally a property worth over GTA$1M, once claimed it becomes a permanent asset of yours. On top of that, bunker modifications and upgrades are 40% off.
- A high-end garage is also available for free.
- A firework launcher (Gun Van) and a musket (Ammu-Nation) are free. Log in and you'll also receive an Independence Day–themed bucket hat.
- In Business Battles, you can obtain limited-time cosmetics such as various beer hats and a Statue of Happiness T-shirt.

![The firework launcher, free from the Gun Van. Light up the night sky in true Independence Day fashion](/images/news/IndependenceDay/hanabirancya.webp)

---

## Reward Boosts and Bonuses

There are also plenty of money-making opportunities. It's a good week to stockpile GTA$ ahead of The Kortz Center Heist coming later this month.

- Bunker Sell Missions pay double rewards (GTA$ and RP). Bonuses also apply to bunker and gunrunning-related missions.
- Stunt Races pay triple rewards. Modes such as Running Back (Remix) are featured.
- For weekly challenges: from July 2–8, complete three Bunker Research missions for GTA$100K and the Blue Jock Cranley Jumpsuit. From the 9th–13th, win two races for the same reward.

![Stunt Races, paying triple rewards. Triple GTA$ and RP bonuses let you earn fast](/images/news/IndependenceDay/stuntlace.webp)

---

## An Independence Day Community Series

A special Independence Day–themed Community Series is also running. It features community-made missions and modes — rally races, Western-style quick-draw duels, musket deathmatches, and more — and playing these earns double GTA$ and RP. This too runs through July 13. Since it overlaps with the free bunker and the sale, it's also a reason to enjoy some out-of-the-ordinary modes while you're earning cash.

![The Independence Day Community Series. Community-made modes like rally races and quick-draw duels earn double GTA$ and RP](/images/news/IndependenceDay/HMQoKVnXcAAOE4P.webp)

*Image: from official Rockstar Games promotional artwork*

---

## The “Biggest Ever” Sale

The scale of the sale is large too. A wide range — aircraft, special and weaponized vehicles, properties, and more — is heavily discounted. Independence Day clothing, liveries, parachute smoke, and face paint are 40% off, while the Stars-and-Stripes Sovereign bike and the Liberator monster truck are 50% off. The official promotional image also shows numerous headline vehicles and aircraft with discounts ranging from hundreds of thousands to millions of GTA$.

GTA+ members get further perks. Exclusive Independence Day clothing, a free Ocelot Stromberg, Chameleon Paints, and GTA$2M off a Mansion are among the offerings.

![The sale billed as the “biggest ever.” A wide range including aircraft and special vehicles is heavily discounted](/images/news/IndependenceDay/GTAO2.webp)

---

## Should You Grab the Free Bunker?

To get straight to the point: if you don't own a bunker yet, you should claim this free Lago Zancudo. Not only does a property normally worth over GTA$1M become free, but it also serves as the foundation for one of GTA Online's premier long-term businesses — gunrunning, passive income that accrues even while idle, and Mk II weapon research. Rather than just a free building, it's closer to gaining an entire revenue-generating system.

One caveat, though: if you already own the Chumash or Farmhouse bunker, there's no need to force a switch. These two have short delivery routes and are considered advantageous for sell-mission efficiency. Because of its location, Lago Zancudo takes longer for some sell missions, so in terms of priority it sits in the middle. That said, it remains “a GTA$1M-plus property you can get for free,” so if you don't own one, make sure to claim it before the July 13 deadline.

![Gunrunning-related missions are also eligible for bonuses. A bunker forms the foundation of long-term businesses like passive income and Mk II weapon research](/images/news/IndependenceDay/bankerbonus.webp)

---

## A Note: GTA Online This Month

This event is also part of the lead-up to The Kortz Center Heist, a new update scheduled to release during July. Running in parallel is the Fine Art Collector Program (log in to receive GTA$500K, a free vehicle, and more), which continues through July 13.

While GTA6 pre-orders are a big topic, GTA Online keeps up its weekly updates. This Independence Day week — with free properties and items and reward boosts all stacking together — is one of the most rewarding stretches in recent weeks.

---

## Disclaimer

This article is a summary organized by GTA6 FEED based on Rockstar Games' official announcements, the Rockstar Newswire, and overseas media reporting. Free giveaway items, reward multipliers, sale contents, and periods are based on information as of July 2, 2026. GTA Online event contents, discount rates, eligible items, and periods may be changed by Rockstar without notice. In-game prices and bonus eligibility conditions may vary by platform and timing. For the latest and most accurate information, always check the in-game display and Rockstar Games' official announcements.`,
  },
  {
    id: 30,
    title:
      "GTA6のPC版はいつ来るのか——発表されない理由と、過去作から読む現実的な時期",
    description:
      "2026年6月25日に予約が始まったGTA6だが、対象はPS5とXbox Series X|Sのみ。PC版はストアページも要件も時期も未発表だ。発表されない理由と、過去作から読む現実的な発売時期を、確認できる事実と考察に分けて整理する。",
    icon: "🖥️",
    image: "/images/news/ULTIMATE_EDITION_01.webp",
    category: "topic",
    date: "2026-07-01",
    publishedAt: "2026-07-01 18:00",
    source: "GTA6 FEED 編集部",
    sourceUrl: "#",
    relatedArticles: [29, 28, 34],
    aiSummary: [
      "2026年6月25日にGTA6の予約が始まったが、対象はPS5とXbox Series X|Sのみ。PC版はストアページ・システム要件・発売時期のいずれも未発表で、「出ない」のではなく「まだ何も発表されていない」状態だ。",
      "Rockstarはコンソール先行が一貫方針で、過去作のPC版はGTA4が約8か月、GTA5が約18か月、RDR2が約13か月遅れて登場した。前例に従えば、GTA6のPC版は2027年後半〜2028年ごろが現実的とみられている。",
      "「2027年2月」という早期説はリーカーDetectiveSeeds発で根拠が弱く懐疑的。CEO発言からPC軽視ではなく、海賊版・チート対策や二段構えの商業戦略でタイミングを計っているとの読みが有力だ。",
    ],
    fullContent: `# GTA6のPC版はいつ来るのか——発表されない理由と、過去作から読む現実的な時期

2026年6月25日、GTA6の予約注文が始まった。しかし対象は PS5 と Xbox Series X|S だけだった。PC版については、ストアページもシステム要件も発売時期も、いっさい発表されていない。

11月19日の発売が近づき、予約まで始まったこのタイミングで、PC版だけが沈黙を保っている。その沈黙が、かえって多くのプレイヤーの関心を集めている。GTA6は PC で遊べるのか、遊べるとしたらいつなのか。ここでは、確認できる事実と、そこから読み取れる見通しを分けて整理する。

## 確認できる事実——PC版は「発表されていない」

まず押さえておきたいのは、PC版が「出ない」と決まったわけではなく、「まだ何も発表されていない」という状態である。この二つは似ているようで違う。

現時点で Rockstar が公式に認めているのは、GTA6が2026年11月19日に PS5 と Xbox Series X|S 向けに発売される、という一点だけである。6月25日に始まった予約注文も、この2機種が対象だった。PC版については、対応の有無、発売時期、システム要件、配信プラットフォームのいずれについても、公式の言及がない。

Take-Two の CEO ストラウス・ゼルニック（Strauss Zelnick）は、2026年5月の Bloomberg のインタビューで、PC版が同時発売されない理由に触れている。海外メディアによれば、ゼルニックは「Rockstar は常にコンソールから始める」とし、コアとなる消費者にまず最善の体験を届けることが重視される、という趣旨を語っている。これは Rockstar が長年とってきた方針と一致している。

## なぜ後回しなのか——Rockstar の一貫したパターン

Rockstar がコンソールを先行させ、PC版を後から出すのは、今回に限った話ではない。過去作を見れば、明確なパターンがある。

過去作の待機期間を並べると、この傾向がよく分かる。GTA4 は2008年4月のコンソール版から約8か月後の同年12月に PC版が出た。GTA5 は2013年9月のコンソール版に対し、PC版は2015年4月で、その差はおよそ18か月。Red Dead Redemption 2 は2018年10月のコンソール版から約13か月後の2019年11月に PC版が登場した。HD 時代以降は「コンソールで先行し、1年前後から1年半ほど遅れて PC版を出す」というのが基本線になっている。

この前例に従うなら、GTA6の PC版も発売から1年以上遅れる可能性が高い。海外メディアの多くは、現実的な時期として2027年後半から2028年を挙げている。

## ここに矛盾がある

ここからはGTA6 FEEDによる考察である。

「コンソールがコアだから PC は後回し」という説明は、一見筋が通っている。だが、これには見過ごせない矛盾がある。

同じゼルニックが、別の場面では PC の重要性を認めているのだ。海外メディアの報道によれば、ゼルニックは大型タイトルの発売において PC が売上の45〜50%を占めうると述べたことがある。また、2026年2月には、PC がますます重要な市場になっており、その傾向は続くだろうという趣旨の発言もしている。

つまり、Rockstar 自身が PC を無視できない市場だと理解している。それでも PC版を同時に出さないのだとすれば、「PC がコアではないから」という説明だけでは足りない。理由は別のところにあると考えるのが自然だ。

有力とされる見方はいくつかある。ひとつは、海賊版やチート対策である。PC は MOD やチートが作られやすい環境であり、発売直後の最も売上が伸びる時期を、対策の整いにくい PC に開放したくない、という判断があってもおかしくない。もうひとつは、商業戦略としての二段構えである。まずコンソールで販売と話題を集中させ、コミュニティが育ったころに PC版を投入すれば、コンソールですでに遊んだ層の買い直しも含めて、二度目の販売の波を作れる。GTA5 が PC版と MOD 文化によってコンソールの寿命をはるかに超えて遊ばれ続けたことを踏まえれば、この二段構えには合理性がある。

言い換えれば、PC版の遅れは「PC が軽視されているから」ではなく、「PC の価値を最大化するタイミングを計っているから」という読み方ができる。

![ヴァイスシティの街並みを背にしたルシアとジェイソン。こうした風景を最高の解像度とフレームレートで味わえるPC版が来るのは、まだ先になりそうだ](/images/news/ULTIMATE_EDITION_02.webp)

## どのプラットフォームで来るのか

配信プラットフォームについても、公式発表はまだない。ここも推測の域を出ないが、候補として挙げられているのは Steam、Epic Games Store、そして Rockstar 自身の Rockstar Games Launcher である。

GTA5 が Steam で長く強い売上を維持してきたことを考えれば、Steam が有力な選択肢であることは間違いない。一方で、Rockstar は自社ランチャーを持っており、一定期間はそこでの独占配信を挟む可能性も指摘されている。過去作では、ウルトラワイド対応、フレームレート上限の解放、DLSS や FSR への対応、そして MOD 対応といった PC ならではの要素が用意されてきた。PC版がいつ出るにせよ、単なる移植ではなく、技術的な見どころのある版になることは期待できる。

## 「2027年2月」という噂の真偽

具体的な時期として、一部で「2027年2月」という説が出回っている。これは押さえておくべきだが、扱いには注意が必要な情報である。

この噂の出所は、X（旧Twitter）のリーカー DetectiveSeeds である。海外メディアの報道によれば、この人物は元Rockstar社員90人ほどに LinkedIn で接触し、返答した3人が、Take-Two の会計年度末（2027年3月）より前、具体的には2027年2月を目標にしている、と示唆したという。会計年度内に PC版を出したいという事情と重ねて、この時期が挙げられている。

ただし、この説は懐疑的に受け止められている。理由は二つある。ひとつは、コンソール発売からわずか3か月後という時期が、過去作の18か月・13か月という実績とかけ離れており、Rockstar がこれまで一度もやったことのない速さになる点。もうひとつは、情報源である DetectiveSeeds が過去に別タイトルの発売時期を繰り返し外しており、リーカーとしての信頼性が高くないと見られている点である。本人も「確定ではない」と注記している。

まとめると、2027年2月説は「そうなれば嬉しいが、根拠は弱い」という位置づけになる。業界の一般的な見立ては、これより遅い2027年後半から2028年である。

## PC版を待つ価値はあるのか

ここで、PC版を待つ側の視点にも触れておきたい。コンソールを買うか、PC版を待つか。この判断は、多くのプレイヤーにとって現実的な悩みである。

過去作を振り返ると、Rockstar の PC版は「待った甲斐があった」と評価されることが多い。GTA5 の PC版は、コンソールから1年半以上遅れて登場したが、高い解像度、上限のないフレームレート、そして MOD 対応によって、シリーズで最も長く遊ばれる版になった。今でも「GTA5 を本気で遊ぶなら PC版」という声は根強い。Red Dead Redemption 2 の PC版も、美しいビジュアルと MOD の拡張性で高く評価されている。

ただし、いい面ばかりではない。RDR2 の PC版は、発売直後にクラッシュなどの技術的な不具合が相次ぎ、安定するまで時間がかかった。PC版は「最終的には最良の版になるが、出た瞬間が最良とは限らない」という点は、覚えておいてよい。

待つことのデメリットもはっきりしている。コンソールで先に遊んだ層にとっては、PC版を買い直すと二重の出費になる。友人とコンソールで同時に遊びたい場合、PC版を待つ意味は薄れる。過去には、発売初期の PC版でチート対策が追いつかず、オンラインで不快な思いをしたという声もあった。

整理すると、ビジュアルや MOD を重視し、いちばん完成された版でじっくり遊びたいなら、PC版を待つ価値は十分にある。一方で、発売直後の熱量の中でストーリーを早く体験したい、友人とコンソールで一緒に遊びたい、という人にとっては、待たずにコンソールで始める選択も理にかなっている。

## まとめ

現時点で確実に言えるのは、GTA6が2026年11月19日に PS5 と Xbox Series X|S で発売され、PC版については何も発表されていない、という点である。過去作のパターンに従うなら、PC版は発売から1年以上遅れ、2027年後半から2028年ごろになる可能性が高い。「2027年2月」という早期説も出回っているが、根拠は弱く、あくまで噂の域を出ない。いずれにせよ、公式に約束された時期ではない。

Rockstar が PC を軽視しているわけではないことは、CEO 自身の発言からも読み取れる。PC版が来るかどうかを問う段階は、おそらくもう過ぎている。問いは「いつ来るのか」に移っており、その答えだけが、まだ Rockstar の沈黙の向こうにある。

---

## 免責事項

本記事は、Rockstar Games および Take-Two Interactive の公式発表、CEO ストラウス・ゼルニックのインタビュー報道、海外メディアの記事をもとに、GTA6 FEEDが独自に整理・考察したものである。

GTA6が2026年11月19日に PS5・Xbox Series X|S で発売されること、予約が6月25日に始まったこと、PC版が未発表であることは、確認できる事実である。過去作（GTA4・GTA5・Red Dead Redemption 2）のコンソール版と PC版の発売間隔も、確認できる事実である。PC版の発売時期（2027〜2028年）、配信プラットフォーム、後回しの理由に関する記述は、過去作の前例と海外メディアの分析にもとづく予想および考察であり、Rockstar による公式発表ではない。「2027年2月」という時期は、リーカー DetectiveSeeds による未確認の主張であり、懐疑的に受け止められている。過去作 PC版の評価やプレイヤーの反応は、コミュニティの一般的な論調をまとめたものである。GTA6は未発売タイトルであり、内容は今後の公式発表によって変わる可能性がある。最新情報は Rockstar Games の公式発表を確認されたい。`,
    titleEn:
      "When Will GTA6's PC Version Arrive? — Why It's Unannounced, and a Realistic Timing Read from Past Games",
    descriptionEn:
      "Pre-orders for GTA6 opened on June 25, 2026, but only for PS5 and Xbox Series X|S. The PC version has no store page, no requirements, and no date. We separate the confirmable facts from analysis to read why it's unannounced and a realistic release window from past games.",
    aiSummaryEn: [
      "GTA6 pre-orders opened on June 25, 2026, but only for PS5 and Xbox Series X|S. The PC version has no store page, system requirements, or release date announced — it's not that it “won't come,” but that “nothing has been announced yet.”",
      "Rockstar consistently leads with consoles: past PC versions arrived about 8 months later for GTA4, about 18 months for GTA5, and about 13 months for RDR2. Following precedent, a GTA6 PC version is realistically seen around late 2027 to 2028.",
      "The early “February 2027” claim comes from leaker DetectiveSeeds and rests on weak grounds, drawing skepticism. From the CEO's own remarks, the read is not that PC is neglected but that the timing is being managed for piracy/cheat mitigation and a two-stage commercial strategy.",
    ],
    fullContentEn: `# When Will GTA6's PC Version Arrive? — Why It's Unannounced, and a Realistic Timing Read from Past Games

On June 25, 2026, pre-orders for GTA6 opened. But they were only for PS5 and Xbox Series X|S. As for the PC version — the store page, the system requirements, the release window — nothing at all has been announced.

With the November 19 launch approaching and pre-orders even underway, the PC version alone keeps its silence. That silence is, if anything, drawing a great deal of player interest. Can GTA6 be played on PC, and if so, when? Here we organize the confirmable facts separately from the outlook that can be read from them.

## Confirmable Facts — The PC Version Is “Unannounced”

The first thing to grasp is that it has not been decided that the PC version “won't come,” but rather that “nothing has been announced yet.” These two look alike but differ.

At this point, what Rockstar officially acknowledges is a single thing: that GTA6 launches on November 19, 2026 for PS5 and Xbox Series X|S. The pre-orders that began on June 25 were also for these two platforms. Regarding the PC version, there is no official mention of whether it's supported, its release window, its system requirements, or its distribution platform.

Take-Two CEO Strauss Zelnick touched on the reason the PC version isn't launching simultaneously in a Bloomberg interview in May 2026. According to overseas media, Zelnick said “Rockstar always starts with consoles,” conveying that delivering the best experience first to the core consumer is prioritized. This aligns with the policy Rockstar has taken for many years.

## Why Is It Pushed Back? — Rockstar's Consistent Pattern

Rockstar leading with consoles and releasing the PC version later is not unique to this time. Looking at past games, there is a clear pattern.

Lining up the waiting periods of past titles makes this tendency clear. GTA4's PC version came in December 2008, about 8 months after the April 2008 console version. For GTA5, against the September 2013 console version, the PC version was April 2015 — a gap of roughly 18 months. Red Dead Redemption 2's PC version appeared in November 2019, about 13 months after the October 2018 console version. Since the HD era, “lead on console, then release the PC version around a year to a year and a half later” has been the baseline.

Following this precedent, GTA6's PC version too is likely to lag more than a year behind launch. Much of the overseas media cites late 2027 to 2028 as a realistic window.

## Here Is a Contradiction

From here on is analysis by GTA6 FEED.

The explanation that “consoles are core, so PC is pushed back” seems, at a glance, to make sense. But there is a contradiction here that can't be overlooked.

The same Zelnick, in another context, acknowledges the importance of PC. According to overseas media reports, Zelnick has stated that for major title launches, PC can account for 45–50% of sales. He also, in February 2026, conveyed that PC is becoming an increasingly important market and that the trend will continue.

In other words, Rockstar itself understands that PC is a market it can't ignore. If it still doesn't release the PC version simultaneously, then “because PC isn't core” alone is not enough of an explanation. It's natural to think the reason lies elsewhere.

There are a few views considered likely. One is piracy and cheat countermeasures. PC is an environment where MODs and cheats are easily made, and it wouldn't be strange if there were a judgment not to open up the period right after launch — when sales grow the most — to PC, where countermeasures are harder to have in place. Another is a two-stage commercial strategy. First concentrate sales and buzz on console, and then, once the community has grown, deploy the PC version, creating a second wave of sales — including re-purchases by those who already played on console. Given that GTA5, through its PC version and MOD culture, kept being played far beyond the console's lifespan, this two-stage approach has its rationale.

Put differently, the PC version's delay can be read not as “because PC is treated lightly,” but as “because they're timing it to maximize PC's value.”

![Lucia and Jason against the Vice City skyline. A PC version that lets you savor scenes like this at the highest resolution and frame rate looks to be still some way off](/images/news/ULTIMATE_EDITION_02.webp)

## On Which Platform Will It Come

There is no official announcement about the distribution platform either. This too is no more than speculation, but the candidates raised are Steam, the Epic Games Store, and Rockstar's own Rockstar Games Launcher.

Given that GTA5 has maintained long, strong sales on Steam, there's no doubt Steam is a strong option. On the other hand, Rockstar has its own launcher, and it's been pointed out that it may insert a period of exclusive distribution there. In past titles, PC-specific elements have been prepared — ultrawide support, unlocked frame-rate caps, DLSS and FSR support, and MOD support. Whenever the PC version comes, it can be expected to be a version with technical highlights, not a mere port.

## The Truth of the “February 2027” Rumor

As a concrete window, a “February 2027” claim is circulating in some places. This is worth noting, but it's information that needs to be handled with caution.

The source of this rumor is the X (formerly Twitter) leaker DetectiveSeeds. According to overseas media reports, this person contacted about 90 former Rockstar employees on LinkedIn, and the three who replied suggested that the target is before Take-Two's fiscal year-end (March 2027) — specifically, February 2027. This window is cited in overlap with the circumstance of wanting to release the PC version within the fiscal year.

However, this claim is received with skepticism, for two reasons. One is that a window of just 3 months after the console launch is far removed from the 18-month and 13-month track records of past titles, and would be a speed Rockstar has never done before. The other is that the source, DetectiveSeeds, has repeatedly missed the release timing of other titles in the past and is seen as not highly reliable as a leaker. The person themselves notes it's “not confirmed.”

To sum up, the February 2027 theory sits at “it'd be nice if so, but the grounds are weak.” The general industry read is later than that — late 2027 to 2028.

## Is It Worth Waiting for the PC Version?

Here, let's also touch on the perspective of those waiting for the PC version. Buy a console, or wait for the PC version? For many players, this is a real dilemma.

Looking back at past titles, Rockstar's PC versions are often rated as “worth the wait.” GTA5's PC version appeared more than a year and a half after console, but with high resolution, an uncapped frame rate, and MOD support, it became the version played the longest in the series. Even now, the voice that “if you're playing GTA5 seriously, it's the PC version” remains strong. Red Dead Redemption 2's PC version is also highly rated for its beautiful visuals and MOD extensibility.

That said, it's not all upside. RDR2's PC version had a string of technical issues such as crashes right after launch, and took time to stabilize. It's worth remembering that a PC version “becomes the best version in the end, but the moment it launches isn't necessarily the best.”

The downsides of waiting are also clear. For those who played first on console, re-buying the PC version means a double expense. If you want to play with friends on console at the same time, the point of waiting for the PC version diminishes. In the past, there were also voices that cheat countermeasures couldn't keep up in the early PC version, making for an unpleasant time online.

Organizing this: if you value visuals and MODs and want to play the most complete version thoroughly, waiting for the PC version is well worth it. On the other hand, for someone who wants to experience the story early amid the launch-day heat, or to play together with friends on console, the choice to start on console without waiting also makes sense.

## Summary

What can be said with certainty at this point is that GTA6 launches on November 19, 2026 for PS5 and Xbox Series X|S, and that nothing has been announced about the PC version. If we follow the pattern of past titles, the PC version is likely to lag more than a year behind launch, arriving around late 2027 to 2028. An early “February 2027” theory is also circulating, but its grounds are weak and it's no more than a rumor. In any case, it's not an officially promised window.

That Rockstar isn't treating PC lightly can be read from the CEO's own remarks. The stage of asking whether a PC version will come has probably already passed. The question has shifted to “when will it come,” and only that answer still lies beyond Rockstar's silence.

---

## Disclaimer

This article is an independent organization and analysis by GTA6 FEED based on official announcements by Rockstar Games and Take-Two Interactive, reporting on CEO Strauss Zelnick's interviews, and overseas media articles.

That GTA6 launches on November 19, 2026 for PS5 and Xbox Series X|S, that pre-orders began on June 25, and that the PC version is unannounced, are confirmable facts. The intervals between the console and PC versions of past titles (GTA4, GTA5, Red Dead Redemption 2) are also confirmable facts. Descriptions regarding the PC version's release window (2027–2028), distribution platform, and the reason for the delay are predictions and analysis based on the precedent of past titles and overseas media analysis, and are not official announcements by Rockstar. The “February 2027” window is an unconfirmed claim by leaker DetectiveSeeds and is received with skepticism. Evaluations of past PC versions and player reactions are a summary of the general tone of the community. GTA6 is an unreleased title, and its contents may change with future official announcements. For the latest information, please check Rockstar Games' official announcements.`,
  },
  {
    id: 29,
    title:
      "GTA Online、Discord連携で「Rockstar Varsity Crewneck」を無料配布——7月1日まで、Discord特典は今回が最後",
    description:
      "RockstarアカウントとDiscordを連携すると、バーガンディ色の「Rockstar Varsity Crewneck」をGTA Onlineで無料で受け取れる。受け取りは7月1日まで。RockstarはこれをもってDiscord連携特典の配布を終了すると案内しており、最後の機会となる。",
    icon: "👕",
    image: "/images/news/17e36ec78dc74d11dca7bc7a7c15294b510ee1843e92ed0477e8c59aaa538151.webp",
    category: "event",
    date: "2026-07-01",
    publishedAt: "2026-07-01 10:00",
    source: "Rockstar Games 公式Discord",
    sourceUrl: "https://discord.gg/rockstargames",
    relatedArticles: [28, 26, 31],
    aiSummary: [
      "GTA Onlineで、RockstarアカウントとDiscordを連携すると、バーガンディ色の「Rockstar Varsity Crewneck」を無料で受け取れる。期間は6月11日〜7月1日で、本記事公開時点では締め切り当日にあたる。",
      "受け取りは公式Rockstar Games Discordの「#discord-rewards」チャンネルで「/claim」を実行し、Reward→RockstarCrewneckを選ぶ。報酬は最大72時間以内にワードローブのTops→Special Tops→Unlocksへ追加される。",
      "対象は1プレイヤー1回のみで、オンラインチュートリアル完了済みのキャラが必要。RockstarはこれをもってDiscord連携特典の配布を終了すると案内しており、これが最後の機会。報酬を装ったDMや非公式サイトのフィッシングには注意したい。",
    ],
    fullContent: `# GTA Online、Discord連携で「Rockstar Varsity Crewneck」を無料配布——7月1日まで、Discord特典は今回が最後

GTA Onlineで、RockstarアカウントとDiscordを連携することで、バーガンディ色の「Rockstar Varsity Crewneck(ロックスター・バーシティ・クルーネック)」を無料で受け取れるキャンペーンが実施されている。受け取り期間は6月11日から7月1日まで。あわせてRockstarは、今回をもってDiscord連携特典の配布を終了することを明らかにしている。GTA6 FEEDが入手手順と注意点を整理した。

本記事は2026年7月1日時点の情報にもとづく。受け取り期限が本日にあたるため、まだ手に入れていない場合は早めの対応が望ましい。

---

## 配布されるアイテム

今回もらえるのは、Rockstar Gamesのロゴが入ったバーシティ風のクルーネック(トレーナー)のバーガンディ(臙脂)色版だ。同じデザインの黒色版は、2025年11月のDLC前のミッション報酬として配布されており、今回はその色違いにあたる。Discord連携を通じてのみ入手できる、GTA Online向けの無料アイテムである。

Rockstarはこの配布について、Discord連携特典としては今回が最後だと案内している。アカウント連携によるこの種の報酬を受け取れるのは、当面これが区切りになる。

---

## 入手手順

受け取りは、Rockstarの公式Discordサーバーから行う。手順は次のとおり。

1. RockstarアカウントとDiscordアカウントを連携する(連携方法はRockstarサポートの案内ページに従う)。
2. 公式の[Rockstar Games Discordサーバー](https://discord.gg/rockstargames)に参加する。
3. サーバー内の「#discord-rewards」チャンネルを開く。
4. メッセージ欄に「/claim」と入力して送信し、表示されるメニューから「Reward(報酬)」→「RockstarCrewneck」を選んで送信する。
5. GTA Onlineをプレイする。報酬は72時間以内に、ワードローブの「Tops(トップス)」→「Special Tops」→「Unlocks」に追加される。

---

## 注意点

スムーズに受け取るために、いくつか押さえておきたい点がある。

- GTA Onlineのオンラインチュートリアルを完了したキャラクターが必要となる。連携するRockstarアカウントとDiscordアカウントが正しい組み合わせかどうかも、事前に確認しておきたい。
- 受け取りは対象プレイヤーにつき1回のみ。
- 報酬は claim 後すぐにワードローブへ反映されるとは限らない。多数のプレイヤーが同時に受け取るため、配布は段階的に行われる。最大72時間ほどかかる場合があるので、数時間おきに確認するとよい。
- 受け取り期限は7月1日。本記事公開時点では締め切り当日にあたるため、未取得の場合は残り時間がごく短いとみておきたい。

安全面の注意として、受け取りは必ず公式のRockstar Games Discordサーバーから行うこと。報酬をうたってリンクのクリックやアカウント情報の入力を求めるダイレクトメッセージや、非公式のサイト・サーバーには応じないようにしたい。アカウント連携を装ったフィッシングには注意が必要だ。

---

## 補足:今週のGTA Online

このクルーネック配布は、6月25日から始まった今週のGTA Onlineの更新の一部だ。同じ期間には、7月13日まで続くFine Art Collector Program(ログインでGTA$50万や無料車両などが受け取れる)、Acid Lab関連ミッションの報酬2倍、FIB Filesの報酬アップなども実施されている。

GTA6の予約開始が大きな話題となるなか、GTA Onlineは引き続き毎週の更新を重ねている。そうしたタイミングで、これまで続いてきたDiscord連携特典が一区切りを迎える形となった。受け取れるうちに、最後の機会を逃さないようにしたい。`,
    titleEn:
      "GTA Online Gives Away the Rockstar Varsity Crewneck via Discord Link — Through July 1, and This Is the Last Discord Reward",
    descriptionEn:
      "By linking your Rockstar account with Discord, you can claim the burgundy Rockstar Varsity Crewneck for free in GTA Online. The claim window runs through July 1, and Rockstar says this will be the final Discord-linking reward — making it the last chance.",
    aiSummaryEn: [
      "In GTA Online, linking your Rockstar account with Discord lets you claim the burgundy Rockstar Varsity Crewneck for free. The window runs June 11–July 1, and as of this article's publication it is the final day.",
      "To claim, go to the #discord-rewards channel in the official Rockstar Games Discord, run \"/claim,\" and choose Reward → RockstarCrewneck. The item is added to your wardrobe under Tops → Special Tops → Unlocks within up to 72 hours.",
      "It is limited to one claim per player and requires a character who has finished the online tutorial. Rockstar says this is the last Discord-linking reward, so it's the final chance. Beware of phishing DMs and unofficial sites posing as the reward.",
    ],
    fullContentEn: `# GTA Online Gives Away the Rockstar Varsity Crewneck via Discord Link — Through July 1, and This Is the Last Discord Reward

In GTA Online, a campaign is underway that lets you claim the burgundy Rockstar Varsity Crewneck for free by linking your Rockstar account with Discord. The claim window runs from June 11 to July 1. Rockstar has also made clear that this will be the final Discord-linking reward. GTA6 FEED has organized the claim steps and things to watch for.

This article is based on information as of July 1, 2026. Because the claim deadline falls today, anyone who hasn't claimed it yet should act sooner rather than later.

---

## The Item Being Given Away

What you get this time is the burgundy version of a varsity-style crewneck (sweatshirt) bearing the Rockstar Games logo. A black version of the same design was handed out as a pre-DLC mission reward in November 2025, and this is its color variant. It's a free GTA Online item obtainable only through Discord linking.

Rockstar has noted that, as a Discord-linking reward, this is the last one. For the time being, this marks the end of receiving this kind of reward via account linking.

---

## How to Claim

You claim it from Rockstar's official Discord server. The steps are as follows.

1. Link your Rockstar account with your Discord account (follow Rockstar Support's instructions for how to link).
2. Join the official [Rockstar Games Discord server](https://discord.gg/rockstargames).
3. Open the "#discord-rewards" channel in the server.
4. Type "/claim" in the message box and send it, then from the menu that appears choose "Reward" → "RockstarCrewneck" and send.
5. Play GTA Online. The reward is added within 72 hours to your wardrobe under "Tops" → "Special Tops" → "Unlocks."

---

## Things to Watch For

To claim smoothly, there are a few points worth keeping in mind.

- You need a character who has completed the GTA Online tutorial. It's also worth confirming in advance that the Rockstar account and Discord account you're linking are the correct pair.
- Claiming is limited to once per eligible player.
- The reward won't necessarily appear in your wardrobe right after you claim. Because many players claim at once, distribution is staggered. It can take up to about 72 hours, so check back every few hours.
- The claim deadline is July 1. As of this article's publication it is the final day, so if you haven't claimed it, assume there's very little time left.

As a safety note, always claim from the official Rockstar Games Discord server. Don't respond to direct messages that promise rewards while asking you to click links or enter account information, nor to unofficial sites or servers. Be wary of phishing disguised as account linking.

---

## Note: GTA Online This Week

This crewneck giveaway is part of this week's GTA Online update, which began on June 25. During the same period, the Fine Art Collector Program (running through July 13, with logins granting GTA$500K, a free vehicle, and more), double rewards on Acid Lab missions, and boosted FIB Files payouts are also running.

With GTA6 pre-orders making big waves, GTA Online continues to roll out weekly updates. At this juncture, the long-running Discord-linking rewards have reached a stopping point. Don't miss this last chance while you still can.`,
  },
  {
    id: 28,
    title:
      "GTA6にコレクターズエディションは出るのか——公式未発表のいま、リークと過去作から読む",
    description:
      "予約が始まったGTA6だが、用意されているのはStandardとUltimateの2種類だけ。フィギュアやグッズを詰めたコレクターズエディション(CE)は未発表だ。根拠になっているリークと過去作の前例を、確定情報・リーク・推測に分けて整理する。",
    icon: "📦",
    image: "/images/news/collectorsedition/GTAVSpecialEditionofficial.webp",
    category: "topic",
    date: "2026-06-30",
    publishedAt: "2026-06-30 22:00",
    source: "GTA6 FEED 編集部",
    sourceUrl: "#",
    relatedArticles: [26, 19, 32],
    aiSummary: [
      "GTA6で現在用意されているのはStandard(79.99ドル)とUltimate(99.99ドル)の2種類のみで、コレクターズエディション(CE)はRockstarから一切発表されていない。「いずれ後から出る」という見方の根拠はリークと過去作の前例だ。",
      "CEの存在を示唆するのはFNAC(ポルトガル)のSKUリーク(最上位€199.99)、YouTuber Ricfazeresの「CEは存在する」という証言、最大6エディション説など。いずれも公式未確認で、プレースホルダの可能性も指摘されている。",
      "GTA6のディスクは発売時も以降も予定がなく、仮にCEが出てもコード＋物理グッズの形になる見込み。過去作(GTA IV/V、RDR2)では豪華版が後発で登場した実績があり、価格は200〜300ドル前後と予想されるが、中身の確定情報はない。",
    ],
    fullContent: `# GTA6にコレクターズエディションは出るのか——公式未発表のいま、リークと過去作から読む

予約が始まったGTA6だが、現在用意されているのはStandard EditionとUltimate Editionの2種類だけで、フィギュアやグッズを詰めたコレクターズエディション(CE)は見当たらない。ファンの間では「いずれ後から出る」という見方が主流だが、Rockstarからの公式発表は一切ない。根拠になっているのはリークと、過去作の前例だ。GTA6 FEEDが、確定情報・リーク・推測に分けて整理した。

本記事は2026年6月30日時点の情報にもとづく。

---

## 確定:現時点でCEは発表されていない

まず事実から。Rockstarが公式に発表しているエディションは、Standard(79.99ドル)とUltimate(99.99ドル)の2種類のみで、コレクターズエディションは存在しない。公式サイトにもストアにも、CEの記載はない。

さらに前提として押さえておきたいのが、物理ディスクの扱いだ。The Hollywood Reporterの報道によれば、GTA6のディスクを生産する計画は発売時にも以降にもない。したがって、仮にCEが後から登場するとしても、その中身はディスクではなく「ダウンロードコード＋物理グッズ」になる公算が大きい。

なお、Take-TwoのZelnick CEOが5月のCNBCのインタビューで、GTA6には「大きな物理要素(big physical component)」があると述べたことが、豪華なCEへの期待を後押しした。ただしこの発言は、当時はディスク版やCEを示唆するものと受け取られたものの、その後「物理版＝コード・イン・ボックスのパッケージ」を指していたことが明らかになっている。経営者の発言を額面以上に読み込むのは禁物だ、という教訓でもある。

---

## リーク・噂:CEの存在を示唆する情報(未確認)

ここからは未確認の情報になる。CEがいずれ出るという見方を支えているのが、主に次の三つだ。

FNAC(ポルトガル)のSKUリーク。予約開始前、ポルトガルのFNACのサイトに、RS1〜RS5という社内コードらしき複数のSKUが一時的に掲載された。価格は€89.99、€99.99、€109.99、€119.99、€199.99などが並び、最上位の€199.99がCEではないかと解釈されて広く報じられた。これらの掲載には発売日として2026年11月19日が正しく入っていた点が、プレースホルダにしては精度が高いとして一定の重みをもって受け止められた。ただしリストはすでに削除され、FNACもRockstarも真偽にコメントしておらず、小売リークに定評のあるbillbil_kunはプレースホルダの可能性を指摘している。最初に見つけたのはResetEraのユーザーやポルトガルのコミュニティだ。

Ricfazeresの証言。ポルトガルで実績のあるYouTuberのRicfazeresが、情報筋から得たとして、CEはまだ発表されていないが存在し、価格は€199.99だと動画の中で触れた。具体的な中身には踏み込まず、動画の終盤でさらりと言及して次の話題に移ったため、再生数稼ぎの煽りとは異なる出し方だと受け止められている。OpenCriticなどのメディアも「信頼できる情報源」として取り上げた。ただし、これも裏付けのない一人の証言である点は変わらない。

複数エディション説。リーカーのDetectiveSeedsは、GTA6に最大6種類の購入オプションがあるとし、その中にデジタル/物理のStandard、早期アクセスとGTA Online向け通貨が付くプレミアムなデジタル版、そして物理グッズ(アートブック、マップ、スティールブックなど)を含むCEが含まれると述べている。

これらはいずれも未確認の情報であり、確定したものは一つもない。

---

## 推測:出るとしたら、いつ・いくら・何が入るのか

確定情報をもとにした予想として、よく語られるのが次の点だ。あくまで推測である。

時期。Rockstarは過去、CEを標準版より遅れて発表することが多かった。RDR2のCEも、標準版・上位版より数カ月あとに予約が始まった経緯がある。このため、GTA6でも夏に本格化するマーケティングの中で、あるいは発売前後のタイミングでCEが発表される、というシナリオが有力視されている。

価格。$200〜300、あるいは€199.99〜229.99前後という数字がよく挙がる。近年のAAAタイトルのCEは、フィギュアや大型アートブック付きの最上位版が250ドルを超える例も珍しくなく、GTA6のCEがこの帯に入ること自体は不自然ではない。ただし、ディスクが入らない方針である以上、「2万円台後半を払っても、遊べるディスクは入っていない」という値ごろ感の問題は残る。

内容。予想として挙がるのは、スティールブック、アートブック、Vice Cityのマップ、ルシアとジェイソンのフィギュア、ネオンや80年代をモチーフにしたグッズ、Rockstar恒例のロックボックス的なアイテム、そして追加車両などのデジタル特典だ。ただし、中身に関する具体的なリークはまだほとんどなく、確定情報はゼロに等しい。

---

## 過去のGTA・Rockstar作品ではどうだったか(確定事実)

CEが出るという見方の最大の根拠は、Rockstarがこれまで繰り返し豪華版を出してきた実績だ。いずれも公式発表に基づく事実である。

![GTA IV Special Edition(2008年)。アートブック、サウンドトラックCD、鍵付きのロックボックスなどを同梱した豪華版](/images/news/collectorsedition/GTAIVSpecialEdition.webp)

- GTA IV Special Edition(2008年):2008年当時で約90ドル(英国で約70ポンド)。アートブック、サウンドトラックCD、鍵付きのロックボックス、Rockstarのキーチェーン、限定ダッフルバッグなどを同梱。

![GTA V Special Edition。限定アートのスティールブックやブループリントマップ、ゲーム内特典を含む](/images/news/collectorsedition/GTAVSpecialEdition.webp)

- GTA V Special Edition(79.99ドル):マイケル・トレバー・フランクリンの限定アートを使ったスティールブック、ロスサントスとブレイン群のブループリントマップ、ゲーム内特典(特殊能力ゲージが25%速く溜まるブースト、スタント飛行、追加の衣装・タトゥー・武器など)。
- GTA V Collector's Edition(149.99ドル):Special Editionの全内容に加え、鍵付きのセキュリティバッグ(お金袋)、New EraのGTA Vスナップバックキャップ、Collector's限定の車両(Hotknife、Carbon RSなど)と専用ガレージ。

![RDR2 Collector's Box(2018年)。ゲーム本体を含まない、世界観に沿った金属製の箱とグッズのセット](/images/news/collectorsedition/RDR2CollectorsBox.webp)

- RDR2 Collector's Box(2018年):ゲーム本体を含まない、世界観に沿った金属製の箱とグッズ(チャレンジコイン、バンダナ、トレジャーマップ、ピンバッジ、トランプなど)。

共通するのは、スティールブックやテーマに沿った物理グッズに、ゲーム内のデジタル特典を組み合わせる構成で、CEは後発で登場することが多かった点だ。これらは発売時に売り切れ、後に中古価格が高騰しやすい傾向もある。GTA6でも同様のパターンが想定される、というのがファンやメディアの読みになっている。

---

## まとめ:信頼度の整理

確定している事実:

- 現時点で発表されているのはStandard(79.99ドル)とUltimate(99.99ドル)のみで、CEは未発表。
- GTA6のディスクは発売時も以降も予定がなく、仮にCEが出てもコード＋グッズの形になる見込み。
- Zelnickの「大きな物理要素」発言は、コード・イン・ボックスのパッケージを指していたことが判明済み。
- Rockstarは過去作でSpecial/Collector's Editionを繰り返し出してきた(GTA IV、GTA V、RDR2)。

未確認のリーク・噂:

- FNACのSKUリーク(最上位€199.99がCEか)、Ricfazeresの「CEは存在する」という証言、最大6エディション説。いずれも公式未確認。

推測:

- CEは後発で発表される可能性が高い。価格は200〜300ドル前後、内容はスティールブックやグッズ＋デジタル特典という予想だが、中身の確定情報はない。

コミュニティの声も、期待と冷めた見方が混在している。

- 「スティールブックだけでいいから、中間の特別版を出してほしい」
- 「2万円台でディスクも入っていないなら、グッズにそこまで払えるか微妙だ」

注意点として、GTA6は本記事執筆時点で未発売で、CEは公式に発表されていない。FNACのようなリストはプレースホルダの可能性があり、「信頼できる情報源」であっても外れることはある。CEを名目に予約や前金を求める非公式サイトの詐欺にも注意したい。発表があるとしても、過去の例では夏以降のマーケティングや発売前後になるとみられる。確実な情報は、Rockstarの公式発表で確認するのが望ましい。`,
    titleEn:
      "Will GTA6 Get a Collector's Edition? — With Nothing Official Yet, Reading the Leaks and Past Releases",
    descriptionEn:
      "Pre-orders for GTA6 have opened, but only the Standard and Ultimate editions exist — a Collector's Edition (CE) packed with figures and merch is unannounced. We organize the leaks and past precedents into confirmed facts, leaks, and speculation.",
    aiSummaryEn: [
      "For GTA6, only the Standard ($79.99) and Ultimate ($99.99) editions currently exist, and no Collector's Edition (CE) has been announced by Rockstar at all. The basis for the “it'll come later” view is leaks and the precedent of past games.",
      "Pointing to a CE are the FNAC (Portugal) SKU leak (top tier €199.99), YouTuber Ricfazeres's testimony that “the CE exists,” and a theory of up to six editions. All are officially unconfirmed, and the possibility of placeholders has been noted.",
      "GTA6 discs are not planned at launch or after, so even if a CE appears it will likely be a code-plus-merch package. Past games (GTA IV/V, RDR2) have a track record of deluxe editions arriving later; prices are guessed at $200–300, but there's no confirmed info on contents.",
    ],
    fullContentEn: `# Will GTA6 Get a Collector's Edition? — With Nothing Official Yet, Reading the Leaks and Past Releases

Pre-orders for GTA6 have opened, but right now only two editions are available — Standard and Ultimate — and a Collector's Edition (CE) packed with figures and merch is nowhere to be seen. Among fans, the dominant view is that “it'll come later,” but there is no official announcement from Rockstar whatsoever. What it rests on is leaks and the precedent of past games. GTA6 FEED has organized this into confirmed facts, leaks, and speculation.

This article is based on information as of June 30, 2026.

---

## Confirmed: No CE Has Been Announced at This Point

First, the facts. The editions Rockstar has officially announced are only two — Standard ($79.99) and Ultimate ($99.99) — and a Collector's Edition does not exist. Neither the official site nor the store mentions a CE.

Another premise worth grasping is the handling of physical discs. According to a report by The Hollywood Reporter, there is no plan to produce GTA6 discs at launch or afterward. Therefore, even if a CE were to appear later, its contents would most likely be a “download code plus physical merch” rather than a disc.

Incidentally, Take-Two CEO Zelnick saying in a CNBC interview in May that GTA6 has a “big physical component” fueled expectations for a lavish CE. However, while that remark was taken at the time to hint at a disc version or a CE, it later became clear it referred to a “physical version = code-in-a-box package.” It is also a lesson that reading more than face value into an executive's remarks is unwise.

---

## Leaks / Rumors: Information Suggesting a CE Exists (Unconfirmed)

From here on is unconfirmed information. Supporting the view that a CE will eventually appear are mainly the following three.

The FNAC (Portugal) SKU leak. Before pre-orders opened, multiple SKUs that looked like internal codes — RS1 through RS5 — were temporarily listed on Portugal's FNAC site. Prices such as €89.99, €99.99, €109.99, €119.99, and €199.99 lined up, and the top €199.99 was interpreted as possibly being the CE and widely reported. The fact that these listings correctly carried November 19, 2026 as the release date was taken with a certain weight, as being unusually accurate for a placeholder. However, the list has already been removed, neither FNAC nor Rockstar has commented on its veracity, and billbil_kun, well-regarded for retail leaks, has pointed out the possibility of a placeholder. It was first spotted by ResetEra users and the Portuguese community.

Ricfazeres's testimony. Ricfazeres, a YouTuber with a track record in Portugal, mentioned in a video — citing sources — that the CE has not been announced yet but does exist, and that the price is €199.99. He did not get into specific contents, and since he mentioned it casually near the end of the video and moved on to the next topic, it was taken as a delivery different from view-baiting hype. Outlets such as OpenCritic also picked it up as coming from a “reliable source.” Still, this remains the unbacked testimony of a single person.

The multiple-editions theory. The leaker DetectiveSeeds says GTA6 has up to six purchase options, including digital/physical Standard, a premium digital version with early access and GTA Online currency, and a CE containing physical merch (an art book, a map, a steelbook, etc.).

All of these are unconfirmed, and not one of them is settled.

---

## Speculation: If It Comes, When, How Much, and What's Inside

As predictions based on confirmed information, the following points are often discussed. These are speculation only.

Timing. In the past, Rockstar often announced CEs later than the standard edition. RDR2's CE also had pre-orders begin several months after the standard and higher-tier editions. For this reason, the leading scenario is that for GTA6 too, a CE will be announced amid the marketing that ramps up in summer, or around the time of release.

Price. Figures like $200–300, or around €199.99–229.99, often come up. Among recent AAA titles, it is not unusual for top-tier CEs with figures and large art books to exceed $250, so a GTA6 CE landing in this band is not unnatural in itself. However, given the no-disc policy, the value-for-money issue remains: “you pay a high price and there's still no playable disc inside.”

Contents. Predicted items include a steelbook, an art book, a map of Vice City, figures of Lucia and Jason, neon- and 80s-themed merch, a Rockstar-staple lockbox-type item, and digital bonuses such as extra vehicles. However, there are still almost no concrete leaks about the contents, and confirmed information is essentially zero.

---

## How Past GTA / Rockstar Titles Did It (Confirmed Facts)

The biggest basis for the view that a CE will come is Rockstar's track record of repeatedly releasing deluxe editions. All of these are facts based on official announcements.

![GTA IV Special Edition (2008). A deluxe edition bundling an art book, a soundtrack CD, a lockable lockbox, and more](/images/news/collectorsedition/GTAIVSpecialEdition.webp)

- GTA IV Special Edition (2008): around $90 at the time (about £70 in the UK). Bundled an art book, a soundtrack CD, a lockable lockbox, a Rockstar keychain, a limited duffel bag, and more.

![GTA V Special Edition. Includes a limited-art steelbook, a blueprint map, and in-game bonuses](/images/news/collectorsedition/GTAVSpecialEdition.webp)

- GTA V Special Edition ($79.99): a steelbook using limited art of Michael, Trevor, and Franklin; a blueprint map of Los Santos and Blaine County; in-game bonuses (a boost that fills the special-ability meter 25% faster, stunt flying, additional outfits, tattoos, and weapons, etc.).
- GTA V Collector's Edition ($149.99): everything in the Special Edition plus a lockable security bag (money bag), a New Era GTA V snapback cap, Collector's-exclusive vehicles (Hotknife, Carbon RS, etc.) and a dedicated garage.

![RDR2 Collector's Box (2018). A set of a metal box and merch fitting the world, not including the game itself](/images/news/collectorsedition/RDR2CollectorsBox.webp)

- RDR2 Collector's Box (2018): not including the base game, a metal box and merch fitting the world (a challenge coin, a bandana, a treasure map, a pin badge, playing cards, etc.).

What they share is a structure combining a steelbook and theme-appropriate physical merch with in-game digital bonuses, and CEs often appeared later. These also tend to sell out at launch and have their secondhand prices spike afterward. The fan and media read is that a similar pattern can be expected for GTA6.

---

## Summary: Sorting by Reliability

Confirmed facts:

- At present, only Standard ($79.99) and Ultimate ($99.99) are announced; no CE.
- GTA6 discs are not planned at launch or after, so even if a CE comes it will likely take a code-plus-merch form.
- Zelnick's “big physical component” remark has been found to refer to a code-in-a-box package.
- Rockstar has repeatedly released Special/Collector's Editions in past titles (GTA IV, GTA V, RDR2).

Unconfirmed leaks / rumors:

- The FNAC SKU leak (is the top €199.99 the CE?), Ricfazeres's testimony that “the CE exists,” and the up-to-six-editions theory. All officially unconfirmed.

Speculation:

- A CE is likely to be announced later. Price guessed around $200–300, contents predicted to be a steelbook and merch plus digital bonuses — but there's no confirmed info on the contents.

Community voices, too, mix expectation and cooled-off views.

- “Even just a steelbook is fine — I wish they'd put out a mid-tier special edition.”
- “If it's in the ¥20,000s and doesn't even include a disc, it's questionable whether I can pay that much for merch.”

As a caveat, GTA6 is unreleased at the time of writing, and a CE has not been officially announced. Lists like FNAC's may be placeholders, and even a “reliable source” can be wrong. Beware also of scams on unofficial sites that demand pre-orders or deposits in the name of a CE. Even if there is an announcement, based on past examples it is expected to come during the summer-onward marketing or around release. For reliable information, it is best to confirm via Rockstar's official announcement.`,
  },
  {
    id: 27,
    title:
      "GTA6のルシアとジェイソンは誰が演じているのか——ファンが推す候補と、Rockstarが明かさない理由",
    description:
      "ルシア役にManni L. Perez、ジェイソン役にDylan Rourke——ファンの間では本命のように語られているが、Rockstarはキャストを一切公表しておらず、いずれも未確認の推測にとどまる。何が事実で何が憶測なのかを切り分けて整理する。",
    icon: "🎭",
    image: "/images/news/lusiahadarenanoka/luciaeyecatch.webp",
    category: "topic",
    date: "2026-06-29",
    publishedAt: "2026-06-29 23:45",
    source: "GTA6 FEED 編集部",
    sourceUrl: "#",
    relatedArticles: [26, 28, 30],
    aiSummary: [
      "GTA6の主人公ルシアとジェイソンの「中の人」について、ファンの間ではルシア役にManni L. Perez、ジェイソン役にDylan Rourkeという名前が本命のように語られている。だがRockstarはキャストを一切公表していない。",
      "Manni L. PerezはGTA OnlineのDiamond Casinoでディーラー役を演じた事実があり、声や容姿の類似とあわせて有力視される。一方ジェイソン側の推測はルシアほど固まっておらず、過去にはTroy Baker説も浮上して本人に否定された。",
      "主要メディアも「広く噂されている」という慎重な表現にとどめており、独立した裏付けはない。GTA6は未発売で、配役はRockstarの公式発表があるまで確定しない。",
    ],
    fullContent: `# GTA6のルシアとジェイソンは誰が演じているのか——ファンが推す候補と、Rockstarが明かさない理由

GTA6の二人の主人公、ルシアとジェイソンの「中の人」は誰なのか。ファンの間では、ルシア役にManni L. Perez、ジェイソン役にDylan Rourkeという名前がほぼ本命のように語られている。だがRockstarはキャストを一切公表しておらず、これらはいずれも未確認の推測にとどまる。GTA6 FEEDが、何が事実で何が憶測なのかを切り分けて整理した。

本記事は2026年6月27日時点の情報にもとづく。

---

## 大前提:Rockstarはキャストを公表していない

まず押さえるべきは、Rockstarが声優・モーションキャプチャー俳優を誰一人として公式に発表していないという点だ。公式サイトのキャラクター紹介でも、声優の欄はすべて「TBA(未定・後日発表)」のままになっている。

これはRockstarの一貫した方針で、GTA5やRDR2でも、キャストは発売間際、あるいは発売後まで明かされなかった。秘匿の理由としては、発売前のリーク防止、発売後にプレイヤーが配役を「発見」する楽しみの演出に加えて、開発期間中に俳優が嫌がらせの標的になるのを防ぐ目的もあるとされる。つまり、現時点でキャストについて「確定」していることは何もない、というのが出発点になる。

---

## ルシア役の候補:Manni L. Perez(最有力視されるが未確認)

ファンの間で最も多く名前が挙がるのが、アメリカの俳優Manni L. Perezだ。Law & Order: SVU、Jessica Jones、Blindspotなどに出演してきたラテン系の俳優で、近年はボイスアクトやモーションキャプチャーの仕事への移行を公言している。

ルシア役として名前が広まった主なきっかけは、トレーラーに登場するルシアと、声や容姿が似ているという比較だった。

![トレーラーのルシアとManni L. Perezを並べた比較。声や容姿が似ているという指摘が、配役の噂が広まる主なきっかけになった](/images/news/lusiahadarenanoka/luciahikaku1.webp)

これに加えて、検証できる状況証拠として挙げられるのが、Rockstarとの過去の接点だ。Manni L. PerezはGTA OnlineのDiamond Casino関連のアップデートで、カジノのディーラー役の一人として声を担当している。この事実が判明したことで、ルシア役ではないかという見方が一段と強まった。また、インタビューでGTAについて問われた際、本人がNDA(秘密保持契約)を理由に明言を避けたとされる場面も、噂を後押しする材料として語られている。

![ファンが根拠として挙げる容姿の比較。ただし似ているという印象は、配役を証明するものではない](/images/news/lusiahadarenanoka/lucihikaku2.webp)

ただし、これらはいずれも決定的な証拠ではない。声や容姿が似ていることも、過去にRockstar作品に関わったことも、ルシア役であることを証明するものではない。Rockstarも本人も、公式にこの配役を認めていない。

---

## ジェイソン役の候補:Dylan Rourke(ルシアほど固まっていない)

ジェイソン役については、Dylan Rourkeという俳優の名前が最もよく挙がる。きっかけは、ゲーム系クリエイターのLegacyKillaDXが2024年に「ジェイソンはDylan Rourke」と主張したことで、トレーラーの声との類似や、モーションキャプチャーの経験があることが根拠とされている。

![トレーラーのジェイソンと、ファンが候補として挙げる俳優を並べた比較画像](/images/news/lusiahadarenanoka/Jason.webp)

もっとも、ジェイソン側の推測はルシアほど一点に集中しておらず、確度はより低いとみられている。実際、当初はTroy Bakerの声ではないかという説が広まったが、本人が「自分ではない」と否定した経緯がある(別の著名声優Roger Craig Smithも関与を否定している)。ジェイソン役の候補は、これまでにも二転三転してきた。

![ジェイソンの容姿比較。声や見た目の類似が根拠とされるが、候補はこれまでにも二転三転してきた](/images/news/lusiahadarenanoka/jasonhikaku1.webp)

![ファンが挙げるジェイソンの比較画像。ルシアほど一点に絞り込まれておらず、確度は低いとみられている](/images/news/lusiahadarenanoka/jasonhikaku2.webp)

---

## なぜ「ほぼ確定」とは言えないのか

これだけ名前が広まっていても、確定情報として扱うべきではない理由がいくつかある。

IGNやGameSpotといった主要メディアも、この件を報じる際には「広く噂されている」「コミュニティで推測されている」といった慎重な表現を用いている。本人やRockstar、あるいは信頼できる第三者による独立した裏付けは、現時点で取れていない。

また、ファンが根拠として挙げる状況証拠の一部は、対象となる俳優のSNS上の振る舞いを読み解いたものだ。相手は実在の一般の俳優であり、こうした詮索が過度になれば、本人にとっては迷惑にもなりうる。Rockstarがキャストを秘匿する理由の一つが、まさに開発中の俳優を嫌がらせから守ることにある点も踏まえ、未確認の推測を断定として広めるのは避けたい。仮に発売後、配役がまったくの別人だと判明すれば、長年の盛り上がりは、SNSやLinkedIn発の配役の噂をどこまで信じてよいかという教訓として残ることになる。

---

## まとめ:信頼度の整理

確定している事実:

- Rockstarはキャストを一切公表していない(公式の声優欄は全員「TBA」)。
- Manni L. PerezとDylan Rourkeはいずれも実在の俳優で、Manni L. Perezが過去にGTA Onlineでディーラー役を演じたことは事実。

噂・推測(未確認):

- ルシア役=Manni L. Perez、ジェイソン役=Dylan Rourke。声や容姿の類似、本人のボイス・モーションキャプチャーへの転向公言、過去のRockstar作品への関与などが根拠とされるが、決定的な証拠はない。

注意点として、GTA6は本記事執筆時点で未発売であり、キャストはRockstarの公式発表(過去の例では発売前後)があるまで確定しない。声や見た目が似ているという理由で実在の人物を配役と断定したり、本人のSNSを詮索したりする情報の扱いには注意したい。続報は、Rockstarの公式発表で確認するのが望ましい。`,
    titleEn:
      "Who Plays Lucia and Jason in GTA6? — The Fan-Favorite Candidates, and Why Rockstar Won't Say",
    descriptionEn:
      "Manni L. Perez for Lucia, Dylan Rourke for Jason — fans talk about them as near-certainties, yet Rockstar has revealed no cast at all, leaving both as unconfirmed speculation. We separate what is fact from what is conjecture.",
    aiSummaryEn: [
      "Regarding who voices GTA6's protagonists Lucia and Jason, fans talk about Manni L. Perez for Lucia and Dylan Rourke for Jason as if they were near-certainties. But Rockstar has not disclosed any cast at all.",
      "Manni L. Perez did voice a dealer in GTA Online's Diamond Casino, and combined with vocal and physical resemblance she is seen as a strong candidate. The Jason guess is less settled than Lucia's; a Troy Baker theory once spread but he denied it.",
      "Major outlets stick to cautious wording like \"widely rumored,\" and there is no independent corroboration. GTA6 is unreleased, and the casting won't be confirmed until Rockstar's official announcement.",
    ],
    fullContentEn: `# Who Plays Lucia and Jason in GTA6? — The Fan-Favorite Candidates, and Why Rockstar Won't Say

Who are the people behind GTA6's two protagonists, Lucia and Jason? Among fans, the names Manni L. Perez for Lucia and Dylan Rourke for Jason are talked about almost as front-runners. But Rockstar has not disclosed any cast at all, and these all remain unconfirmed speculation. GTA6 FEED has organized this by separating what is fact from what is conjecture.

This article is based on information as of June 27, 2026.

---

## The Premise: Rockstar Has Not Disclosed the Cast

The first thing to grasp is that Rockstar has not officially announced a single voice or motion-capture actor. On the official site's character introductions, the voice-actor field for everyone remains "TBA (to be announced)."

This is a consistent Rockstar policy; for GTA5 and RDR2 as well, the cast was not revealed until just before release, or even after it. The reasons cited for the secrecy include preventing pre-release leaks, preserving the fun of players "discovering" the casting after launch, and also protecting actors from becoming targets of harassment during development. In short, the starting point is that nothing about the cast is "confirmed" at this time.

---

## Candidate for Lucia: Manni L. Perez (Seen as the Strongest, but Unconfirmed)

The name raised most often among fans is the American actor Manni L. Perez. A Latina actor who has appeared in Law & Order: SVU, Jessica Jones, and Blindspot, she has in recent years publicly stated she is moving into voice-acting and motion-capture work.

The main trigger for her name spreading as Lucia was a comparison noting that her voice and appearance resemble the Lucia who appears in the trailers.

![A comparison placing the trailer's Lucia next to Manni L. Perez. The claim that the voice and appearance resemble each other was the main trigger for the casting rumor spreading](/images/news/lusiahadarenanoka/luciahikaku1.webp)

In addition, the verifiable circumstantial evidence cited is a past connection with Rockstar. Manni L. Perez voiced one of the casino dealers in a GTA Online update related to the Diamond Casino. Once this fact came to light, the view that she might be Lucia grew even stronger. There is also a scene, often cited as fuel for the rumor, in which she reportedly avoided commenting when asked about GTA in an interview, citing an NDA (non-disclosure agreement).

![An appearance comparison cited by fans as evidence. But an impression of resemblance does not prove the casting](/images/news/lusiahadarenanoka/lucihikaku2.webp)

However, none of this is decisive evidence. Neither a resemblance in voice and appearance nor past involvement in a Rockstar title proves she is Lucia. Neither Rockstar nor the actor herself has officially confirmed this casting.

---

## Candidate for Jason: Dylan Rourke (Less Settled Than Lucia)

For Jason, the actor whose name comes up most is Dylan Rourke. The trigger was the gaming creator LegacyKillaDX claiming in 2024 that "Jason is Dylan Rourke," with the resemblance to the trailer's voice and his motion-capture experience cited as grounds.

![A comparison image placing the trailer's Jason next to the actor fans raise as a candidate](/images/news/lusiahadarenanoka/Jason.webp)

That said, the guess on the Jason side is not concentrated on a single point the way Lucia's is, and is seen as lower in confidence. In fact, a theory that it was Troy Baker's voice spread early on, but he denied it, saying "it's not me" (another well-known voice actor, Roger Craig Smith, has also denied involvement). The candidates for Jason have shifted back and forth several times.

![An appearance comparison for Jason. Vocal and visual resemblance are cited as grounds, but the candidates have shifted back and forth](/images/news/lusiahadarenanoka/jasonhikaku1.webp)

![A Jason comparison image raised by fans. It is not narrowed to a single point the way Lucia's is, and is seen as lower in confidence](/images/news/lusiahadarenanoka/jasonhikaku2.webp)

---

## Why It Can't Be Called "Nearly Confirmed"

Even with the names this widespread, there are several reasons it should not be treated as confirmed information.

Major outlets like IGN and GameSpot, when reporting on this, use cautious wording such as "widely rumored" and "speculated by the community." Independent corroboration by the actors themselves, by Rockstar, or by a reliable third party has not been obtained at this time.

Also, part of the circumstantial evidence fans cite is read out of the actors' behavior on social media. These are real, ordinary actors, and if such prying becomes excessive it can become a nuisance to them. Given that one of the reasons Rockstar keeps the cast secret is precisely to protect actors in development from harassment, we want to avoid spreading unconfirmed speculation as if it were certainty. If, after release, the casting turns out to be someone else entirely, years of excitement will remain as a lesson in how far one should trust casting rumors originating from social media and LinkedIn.

---

## Summary: Sorting by Reliability

Confirmed facts:

- Rockstar has not disclosed the cast at all (the official voice-actor field is "TBA" for everyone).
- Manni L. Perez and Dylan Rourke are both real actors, and it is a fact that Manni L. Perez previously voiced a dealer in GTA Online.

Rumor / speculation (unconfirmed):

- Lucia = Manni L. Perez, Jason = Dylan Rourke. The grounds cited are vocal and physical resemblance, their public statements about shifting into voice and motion-capture work, and past involvement in Rockstar titles — but there is no decisive evidence.

As a caveat, GTA6 is unreleased at the time of writing, and the cast will not be confirmed until Rockstar's official announcement (around release, based on past examples). Be careful with information that declares a real person to be cast simply because the voice or look resembles a character, or that pries into the actors' social media. For follow-ups, it is best to confirm via Rockstar's official announcement.`,
  },
  {
    id: 26,
    title:
      "GTA6に「グラフィック劣化」論争が再燃——ジェイソンの家の比較画像は本当にダウングレードなのか",
    description:
      "6月24日の価格発表とともに公開された新スクリーンショットを、トレーラー2と見比べて「画質が落ちた」という声がSNSで拡大。中心はジェイソンのセーフハウスの比較だ。何が事実で、何が主観・推測かを切り分けて整理する。",
    icon: "🖼️",
    image: "/images/news/graphicdowngrade/eyecatch.webp",
    category: "topic",
    date: "2026-06-28",
    publishedAt: "2026-06-28 03:33",
    source: "GTA6 FEED 編集部",
    sourceUrl: "#",
    relatedArticles: [32, 30, 34],
    aiSummary: [
      "6月24日に多数の新スクリーンショットが公開され、トレーラー2との比較で「劣化したのでは」という声がSNSで拡大。中心はジェイソンのセーフハウス周辺の比較で、草木・フェンス・色味・影の違いが指摘されている。",
      "一方で「劣化と断じるのは早い」という反論も同程度に多い。最大の理由は撮影条件(時間帯・天候・アングル・ポーズ)の違いで、演出されたトレーラーと通常のゲーム内画像を直接並べれば差が出るのは当然という見方が強い。",
      "GTA6は未発売で、確定しているのは「比較論争が起きていること」と「過去にGTA5でアップデート1.08による実際の劣化が起き修正された事例」のみ。今回が劣化かどうかは発売後の実機を見るまで判断できない。",
    ],
    fullContent: `# GTA6に「グラフィック劣化」論争が再燃——ジェイソンの家の比較画像は本当にダウングレードなのか

6月24日、価格発表とともに大量の新スクリーンショットが公開されると、昨年のトレーラー2と見比べて「画質が落ちたのではないか」という声がSNSで一気に広がった。中心になっているのは、ジェイソンのセーフハウス周辺の比較だ。

ただし、現時点で言えるのは「比較論争が起きている」ところまでで、本当に劣化したのかどうかは、発売前である以上まだ判断できない。GTA6 FEEDが、何が事実で、何が主観的な印象で、何が推測なのかを切り分けて整理した。

本記事は2026年6月27日時点の情報にもとづく。

---

## 何が起きているか(議論が起きていること自体は事実)

6月24日、Rockstarは予約開始と価格の発表にあわせて、アルティメット・エディションの紹介などで多数の新スクリーンショットを公開した。ファンはこれを、1年以上前に公開されたトレーラー2の同じ場所(ジェイソンの海辺のセーフハウス)と並べて比較し始めた。Kotakuが最初に取り上げ、その後TheGamerや各国のメディアが追随して、Reddit・X・GTAフォーラムを中心に比較画像が拡散している。

![SNSで広く拡散した比較画像。2025年のトレーラー2(上)と2026年6月の新スクリーンショット(下)を並べたもの](/images/news/graphicdowngrade/GOLDEN.webp)

---

## 指摘されている点(主観的な比較)

劣化を疑う側が挙げているのは、おおむね次のような点だ。

- ジェイソンの家の周辺で、草木の密度やディテールが減ったように見える。家の前のフェンスが金網から木製に変わり、水たまりが減り、全体に黄色いフィルターがかかったような色味になっている。
- 影の表現が単純になり、車体の下にできる遮蔽影が粗く見える。
- ジェイソンの髪や髭の質感、建物や水面の反射が、トレーラー時より落ちたように見える。

![ジェイソンの顔のクローズアップ比較。髪や髭の質感が落ちたのではないか、という指摘も挙がっている](/images/news/graphicdowngrade/Jason.webp)

こうした比較画像とともに、「明らかに劣化している」「Rockstarはまたこれをやるのか」といった声がSNSで広がっている。

![ジェイソンの家周辺の比較。フェンスや草木、色味の違いが指摘されている(左:トレーラー/右:新スクリーンショット)](/images/news/graphicdowngrade/grass.webp)

---

## 擁護・反論(こちらも多い)

一方で、これを「劣化」と断じるのは早いという声も同じくらい多い。

最も多い指摘は、撮影条件の違いだ。トレーラーの該当シーンと新スクリーンショットでは、時間帯・天候・カメラアングル・キャラのポーズが異なる。トレーラーは作品を最高に見せるために作り込まれた映像で、夕方のやわらかい光などドラマチックな条件が選ばれやすい。対して新スクリーンショットは、別の時間帯や角度で撮られた通常のゲーム内画像だ。演出された映像と通常の一枚を直接並べれば、差が出るのはむしろ当然だという見方である。

![6月24日に公開された新スクリーンショットの一枚。通常のゲーム内画像は、最良の条件で作り込まれたトレーラー映像とは撮影条件そのものが異なる](/images/news/graphicdowngrade/ULTIMATE_EDITION_VICE_CITY_STYLE_03.webp)

数年にわたる開発のなかで細部が足し引きされるのも普通のことだ、という指摘もある。Kotakuの書き手は、新しいスクリーンショットのなかには最初のトレーラーより良く見えるものもあると述べ、大規模な劣化は起きていないと結論づけている。フェンスや植生の変化についても、季節を反映するメカニクスや、レオニダの乾季、物語の進行に伴う拠点の変化といった、劣化以外の理由を挙げる声もある。

さらに、こうした論争自体が、否定的な比較投稿ほど反応を集めやすいというSNSの仕組みによって増幅されている面も指摘される。一部のYouTuberが「公式が劣化させた」と断定的に煽る動画を出していることも、火種を広げている。

コミュニティの声も割れている。

- 「照明が違うだけだ。昼と夕方を並べて劣化と言うのは無理がある」
- 「アングルもポーズも違う。髭で劣化を語るのはさすがにこじつけだ」
- 「いや、光の条件を差し引いても影や色は明らかに落ちて見える」

---

## 技術的に考えられる要因(推測)

なぜ印象が変わって見えるのか、技術的な背景としていくつかの可能性が語られている。ただし、いずれも外部からの推測であり、特定の技術が削られたと確認できる材料はない点は強調しておきたい。

![草木のセルフシャドウやグローバルイルミネーションの欠如を指摘するReddit上の議論](/images/news/graphicdowngrade/reddit.webp)

*画像: Redditより*

挙げられるのは、照明やグローバルイルミネーションの条件の違い、ブルームや被写界深度、色調補正といったポストプロセスの差、遠景や背景の描き込み(LOD)の設定の違い、そして静止画では柔らかく見えやすいテンポラルアップスケーリングの影響などだ。コンソールで安定したフレームレートを保つために描画の一部を最適化した可能性も指摘されるが、これも確認はできていない。要するに、見え方を左右する変数が多すぎて、スクリーンショット一枚から「劣化」と断定するのは難しい。

---

## 過去のGTAではどうだったか

この「トレーラー対実機」論争は、GTAシリーズではおなじみの光景でもある。

GTA5(2011〜2013年)でも、早期のトレーラーが映画的だったことから、発売後に「トレーラーほど綺麗ではない」「照明が違う」という不満が出た。だが最終的には「ゲーム自体は十分に綺麗だ」という評価に落ち着き、Rockstarのトレーラーは最良の条件で見せる特別な映像だ、という理解が広まった。

一方で、「本物のダウングレード」が起きた例も実際にある。2015年3月、GTA5のタイトルアップデート1.08(オンラインに強盗を追加した更新)が配信されると、PS4・Xbox One版で視差遮蔽マッピング(POM)が失われ、異方性フィルタリングの低下、車のダメージ表現の簡略化、ポップインの増加といった劣化が起きた。これはDigital Foundryなどがゲームプレイ映像で詳細に検証し、Rockstarも不具合を認めて調査を表明し、続くアップデート(1.09、1.10)で順次修正された。これは発売後の実機で測定できた確定事例であり、今回のような「発売前のスクリーンショット比較」とは性質が異なる。

つまり過去を振り返ると、発売前の比較論争はおおむね杞憂に終わってきた一方、実際の劣化は発売後に実機で初めて確認され、しかも修正されてきた、という二つのパターンがあったことになる。

---

## まとめ:信頼度の整理

確定している事実:

- 6月24日に新スクリーンショットが公開され、トレーラー2との比較論争が起きていること。
- 過去にGTA5で、アップデート1.08による実際のグラフィック低下が起き、Rockstarがそれを認めて修正した事例があること。

主観・未確定:

- 今回のスクリーンショットが「劣化」かどうか。現状は、照明・時間帯・アングルの違いで説明できるという見方が強い。

推測:

- グローバルイルミネーション、LOD、アップスケーリングなどの技術的要因。いずれも断定できる材料はない。

![最終的なグラフィックの評価ができるのは、実際にゲームが動く11月19日の発売以降になる](/images/news/graphicdowngrade/Jason_Duval_02.webp)

注意点として、GTA6は本記事執筆時点で未発売であり、グラフィックの最終的な品質は実際にゲームが動くところを見るまで判断できない。スクリーンショット一枚を切り取って「ダウングレード確定」と断じる情報や、再生数を狙って劣化を煽る動画には注意したい。最終的な評価ができるのは、11月19日の発売以降になる。`,
    titleEn:
      "The “Graphics Downgrade” Debate Reignites for GTA6 — Is the Comparison of Jason's House Really a Downgrade?",
    descriptionEn:
      "New screenshots released alongside the June 24 price announcement were compared against Trailer 2, and cries of “the image quality dropped” spread on social media. At the center is the comparison of Jason's safehouse. We separate what's fact from what's subjective impression and speculation.",
    aiSummaryEn: [
      "On June 24, many new screenshots were released, and compared against Trailer 2, voices saying “hasn't it been downgraded?” spread on social media. The center is the comparison around Jason's safehouse, pointing to differences in foliage, fences, color tone, and shadows.",
      "At the same time, rebuttals that “it's too early to call it a downgrade” are just as numerous. The biggest reason is the difference in shooting conditions (time of day, weather, angle, pose); the strong view is that a gap is only natural when you place a staged trailer directly next to an ordinary in-game image.",
      "GTA6 is unreleased, and the only confirmed facts are that “a comparison debate is happening” and that “there was a real downgrade from update 1.08 in GTA5 in the past, which was fixed.” Whether this case is a downgrade can't be judged until the released game is seen running.",
    ],
    fullContentEn: `# The “Graphics Downgrade” Debate Reignites for GTA6 — Is the Comparison of Jason's House Really a Downgrade?

On June 24, when a large batch of new screenshots was released alongside the price announcement, voices saying “hasn't the image quality dropped?” spread rapidly on social media as people compared them with last year's Trailer 2. At the center is the comparison around Jason's safehouse.

That said, what can be stated at this point only goes as far as “a comparison debate is happening”; whether it has actually been downgraded cannot yet be judged, as the game is unreleased. GTA6 FEED has organized this by separating what is fact, what is subjective impression, and what is speculation.

This article is based on information as of June 27, 2026.

---

## What Is Happening (That a Debate Is Occurring Is Itself a Fact)

On June 24, alongside the start of pre-orders and the price announcement, Rockstar released many new screenshots, including for the Ultimate Edition. Fans began lining these up against the same location from Trailer 2, released over a year earlier (Jason's seaside safehouse), and comparing them. Kotaku picked it up first, after which TheGamer and outlets in various countries followed, and comparison images are spreading mainly across Reddit, X, and GTA forums.

![A comparison image that spread widely on social media, placing Trailer 2 from 2025 (top) next to a new screenshot from June 2026 (bottom)](/images/news/graphicdowngrade/GOLDEN.webp)

---

## The Points Being Raised (Subjective Comparisons)

What the side suspecting a downgrade raises is broadly the following points.

- Around Jason's house, the density and detail of grass and trees appear reduced. The fence in front of the house has changed from chain-link to wood, puddles have decreased, and the overall color tone looks as though a yellow filter has been applied.
- Shadow rendering has become simpler, and the occlusion shadows under car bodies look coarse.
- The texture of Jason's hair and beard, and the reflections on buildings and water surfaces, look diminished compared to the trailer.

![A close-up comparison of Jason's face. There are also claims that the texture of his hair and beard may have dropped](/images/news/graphicdowngrade/Jason.webp)

Alongside these comparison images, voices such as “it's clearly degraded” and “is Rockstar doing this again?” are spreading on social media.

![A comparison around Jason's house. Differences in the fence, foliage, and color tone are being pointed out (left: trailer / right: new screenshot)](/images/news/graphicdowngrade/grass.webp)

---

## Defenses and Counterarguments (These Are Many Too)

On the other hand, voices saying it's too early to declare this a “downgrade” are just as numerous.

The most common point is the difference in shooting conditions. Between the relevant scene in the trailer and the new screenshots, the time of day, weather, camera angle, and character poses differ. A trailer is footage crafted to show the work at its best, and dramatic conditions—such as the soft light of evening—are readily chosen. The new screenshots, by contrast, are ordinary in-game images shot at a different time of day or angle. The view is that when you place staged footage directly next to an ordinary single shot, a gap appearing is, if anything, only to be expected.

![One of the new screenshots released on June 24. An ordinary in-game image differs in its very shooting conditions from trailer footage crafted under the best conditions](/images/news/graphicdowngrade/ULTIMATE_EDITION_VICE_CITY_STYLE_03.webp)

There's also the point that adding and subtracting details over years of development is perfectly normal. The Kotaku writer states that some of the new screenshots look better than the first trailer, concluding that no large-scale downgrade has occurred. Regarding the changes to the fence and vegetation as well, some cite reasons other than a downgrade, such as mechanics that reflect the seasons, Leonida's dry season, and changes to the base as the story progresses.

Furthermore, it's pointed out that the debate itself is amplified by the mechanics of social media, where more negative comparison posts tend to gather more engagement. The fact that some YouTubers have put out videos asserting categorically that “the official side downgraded it” is also spreading the kindling.

The community's voices are split too.

- “The lighting is just different. Lining up daytime and evening and calling it a downgrade is a stretch.”
- “The angle and pose are different too. Talking about a downgrade based on the beard is really far-fetched.”
- “No, even setting aside the lighting conditions, the shadows and colors clearly look worse.”

---

## Technically Conceivable Factors (Speculation)

As to why the impression looks changed, several possibilities are discussed as technical background. However, we want to emphasize that all of these are speculation from outside, and there is no material confirming that any specific technology has been cut.

![A discussion on Reddit pointing to the lack of self-shadowing on foliage and degraded global illumination](/images/news/graphicdowngrade/reddit.webp)

*Image: via Reddit*

What gets cited includes differences in lighting and global illumination conditions; differences in post-processing such as bloom, depth of field, and color grading; differences in the settings for distant and background detail (LOD); and the influence of temporal upscaling, which tends to look soft in still images. The possibility that part of the rendering was optimized to maintain a stable frame rate on consoles is also raised, but this too cannot be confirmed. In short, there are too many variables that sway how things look to declare a “downgrade” from a single screenshot.

---

## How Was It in Past GTA Games

This “trailer vs. actual hardware” debate is also a familiar sight in the GTA series.

With GTA5 (2011–2013) too, because the early trailers were cinematic, complaints arose after release that “it's not as pretty as the trailer” and “the lighting is different.” But in the end the evaluation settled on “the game itself is plenty pretty,” and the understanding spread that Rockstar's trailers are special footage shown under the best conditions.

On the other hand, there are actual examples where a “real downgrade” occurred. In March 2015, when GTA5's title update 1.08 (the update that added heists to online) was distributed, on the PS4 and Xbox One versions parallax occlusion mapping (POM) was lost, and degradations occurred such as reduced anisotropic filtering, simplified car damage rendering, and increased pop-in. Digital Foundry and others verified this in detail with gameplay footage, Rockstar also acknowledged the issue and stated it would investigate, and it was progressively fixed in the following updates (1.09, 1.10). This is a confirmed case that could be measured on actual hardware after release, and it is different in nature from a “pre-release screenshot comparison” like this time.

In other words, looking back at the past, there have been two patterns: pre-release comparison debates have largely ended up being needless worry, while actual downgrades were first confirmed on real hardware after release—and were, moreover, fixed.

---

## Summary: Sorting Out the Confidence Levels

Confirmed facts:

- That new screenshots were released on June 24, and a comparison debate with Trailer 2 is occurring.
- That in the past with GTA5, an actual graphics drop occurred due to update 1.08, and Rockstar acknowledged and fixed it.

Subjective / unconfirmed:

- Whether this time's screenshots are a “downgrade.” At present, the strong view is that it can be explained by differences in lighting, time of day, and angle.

Speculation:

- Technical factors such as global illumination, LOD, and upscaling. There is no material to declare any of them definitively.

![A final verdict on the graphics will only be possible after the November 19 release, once the game is actually running](/images/news/graphicdowngrade/Jason_Duval_02.webp)

As a caveat, GTA6 is unreleased at the time of writing, and the final quality of the graphics cannot be judged until you see the game actually running. We should be wary of information that cuts out a single screenshot and declares a “confirmed downgrade,” and of videos that fan the flames of a downgrade to chase view counts. A final evaluation will only be possible after the November 19 release.`,
  },
  {
    id: 25,
    title:
      "GTA6の物理版にディスクが入っていない——12月に“本物のディスク版”が出るという情報は本当か",
    description:
      "GTA6の物理版は発売時、箱の中身がダウンロードコードのみの「コード・イン・ボックス」。さらに「12月に本物のディスク版が出る」というインサイダー情報も広がる。確定情報とリークを切り分けて整理する。",
    icon: "💿",
    image: "/images/news/Jason_Lucia_03_With_Logos_landscape.webp",
    category: "speculation",
    date: "2026-06-27",
    publishedAt: "2026-06-27 14:45",
    source: "GTA6 FEED 編集部",
    sourceUrl: "#",
    relatedArticles: [24, 23, 22],
    aiSummary: [
      "発売時（11月19日）の物理版はディスク非同梱の「コード・イン・ボックス」形式だとRockstarが正式に確認。理由はリーク対策とプレロード対応で、一部小売は取り扱いを見送り、コミュニティの不満も大きい。",
      "「12月に本物のディスク版が出る」という情報はポーランドのPPE.plがインサイダーGraczdari発として報道。発売時ディスクなしを最初に当てた実績はあるが、単独・匿名でRockstar未確認の噂にとどまる。",
      "ディスク版とオンライン開始を結びつける情報は現時点でなし。GTA6は未発売で、確定しているのは「発売時はコードのみ」という点だけ。続報は公式発表での確認が望ましい。",
    ],
    fullContent: `# GTA6の物理版にディスクが入っていない——12月に“本物のディスク版”が出るという情報は本当か

「パッケージを買ったのに、箱の中身はダウンロードコードだけ」。GTA6の物理版をめぐって、この仕様への不満がコミュニティで噴き出している。一方で、「発売の少しあと、12月に本物のディスク入り版が出る」という情報も広がり始めた。発信元は、発売時のディスクなしをいち早く当てたインサイダーだ。

ただし、確定しているのは「発売時はコードのみ」というところまでで、12月のディスク版はあくまで未確認の情報にとどまる。GTA6 FEEDが、確定情報とリークを切り分けて整理した。

本記事は2026年6月27日時点の情報にもとづく。

---

> **【2026年6月28日 追記・訂正】**
>
> 本記事で「実績のあるインサイダー発の、信ぴょう性のある噂」として紹介した、2026年12月に本物のディスク入り物理版が発売されるという情報について、その後の報道を受けて訂正する。
>
> The Hollywood Reporter（THR）は、拡散したRockstar Supportのメール自体は本物（実在のRockstar従業員から送られたもの）だと確認したうえで、その内容が物理ディスク版を指すものではないと報じた。THRの情報筋によれば、メールにある「physical copy（物理コピー）」とは、すでに公式発表されているコード・イン・ボックス形式のパッケージ版のことであり、「the following months（今後数カ月）」も、11月19日の発売後ではなく、6月24日の価格・予約発表後の数カ月（発売までの期間）を指すという。さらに同じ情報筋は、GTA6のディスクを生産する計画は発売時にも以降にも一切なく、12月のディスク版という話も事実ではないとしている。
>
> したがって、本記事が紹介した「12月にディスク版が出る」という噂は、サポート返信の不適切な表現と、「物理版＝ディスク」という期待による誤解に基づくものであり、現時点では誤りと判断するのが妥当だ。Rockstarがこれまでにディスク版を発表した事実はなく、発売時もその後も、ディスクを同梱した物理版は予定されていない。店頭に並ぶパッケージ版の中身がダウンロードコードのみである、という当初からの事実は変わらない。
>
> なお、これはRockstarの公式声明ではなく、THRおよびそれを報じたIGNなどの取材に基づくものである。今後Rockstarから新たな公式発表があれば状況は変わりうるが、本追記時点での正確な理解は「あのメールはディスク版の話ではない」というものだ。

---

## 確定:発売時の物理版は「箱の中にコードだけ」

2026年11月19日の発売にあわせて並ぶ物理版は、ディスクを同梱しない「コード・イン・ボックス」形式であることが、Rockstarから正式に確認されている。店頭に並ぶのは通常のパッケージだが、中に入っているのはダウンロードコードであり、ゲーム本体は結局ダウンロードして遊ぶことになる。

この形式を採る理由として挙げられているのが、発売前の大規模リーク対策だ。物理ディスクは製造・輸送・店頭の各段階で発売前に出回りやすく、過去には発売前に内容が流出・配信される事例が繰り返されてきた。ディスクを最初から作らなければ、その窓口をふさげる。あわせて、11月12日からのプレロードを成立させる狙いもあるとされる。

これに対し、コミュニティの反応は厳しい。「物理版なのにディスクがないなら、ただの箱だ」「所有している感覚がない」「貸し借りも中古売却もできない」といった声が並ぶ。実際に一部の小売店は、ディスクのないパッケージの取り扱いを見送る姿勢を示している。

![発売時の物理版がディスク非同梱（コード・イン・ボックス）であることは、Rockstar側の案内で確認できる](/images/news/rockstarFAQ.webp)

---

## リーク:12月に“本物のディスク版”が出る?(未確認)

※【2026年6月28日 追記】以下に紹介する「12月ディスク版」の情報は、その後のThe Hollywood Reporterの報道により否定された。詳細は本記事冒頭の追記を参照。

ここからは未確認の情報だ。ポーランドのゲームメディアPPE.plが、インサイダーのGraczdariの話として、GTA6の本物のディスク入り物理版が2026年12月にPS5・Xbox Series X向けで発売される、と報じている。

主張の中身はこうだ。発売時のコード・イン・ボックス版は初回生産分だけの“一発限り”で、それが売り切れると、入れ替わるようにディスク入りの通常版が登場する。タイミングはホリデー商戦の前で、ディスク版であればアカウントへのコード紐付けなしでインストールできる、とされる。実際、コード版はすでに売り切れ始めているとも伝えられており、もしこの話のとおりなら、いったん店頭から姿を消したあとにディスク版が出てくる流れになる。

この情報がある程度の重みをもって受け止められているのは、発信元の実績による。Graczdariは2026年3月頃、「GTA6は発売時にディスクが付かない」と最初に報じた人物だ。当時はTake-Twoが後発の物理版について否定し、信じる人は少なかったが、その後コード・イン・ボックス形式が公式に確認され、結果的に予測が当たった形になった。ヨーロッパの物理ゲーム流通に携わる立場とされ、過去にも複数のタイトルの物理版発売時期を的中させているという。

ただし、留保も多い。これは単独・匿名の情報源によるもので、文面はポーランド語からの機械翻訳を経ている。Rockstarはこの12月のディスク版について何も認めておらず、そもそもTake-Twoは以前、発売後の物理版の計画自体を否定していた。加えて、Rockstarのサポートが問い合わせに対し「物理版は後日入手可能」と返信した例も伝えられているが、これはサポート側が質問を取り違えた可能性も指摘されており、公式なロードマップの表明とは言いがたい。VGCやGematsu、Vice、Kotaku、RockstarINTELなど複数のメディアが取り上げて広がってはいるものの、現時点では「実績のあるインサイダー発の、信ぴょう性のある噂」という位置づけが妥当だ。

![物理版のディスクをめぐる議論は収まらず、「12月にディスク版が出る」という未確認情報にも注目が集まっている](/images/news/dischoudou.webp)

コミュニティの受け止めも分かれている。

- 「13年待ったんだから、ディスク版をあと1カ月待つくらい平気だ」
- 「コードだけの箱は買わない。ディスク版が出るまで待つ」
- 「結局、デジタルで一度、ディスクでもう一度買わせる二重取りでは」

---

## オンラインとの関係(現時点ではつながらない)

「ディスク版が出る12月に、オンライン(GTA Online相当)も始まるのではないか」とも考えられるため、その線も調べた。結論として、両者を結びつけるリークや公式のヒントは現時点で見当たらない。

GTA6は発売時点ではシングルプレイヤー体験のみで、オンラインは含まれない。その追加時期について、Rockstarは一切発表しておらず、インサイダーやアナリストの間でも数カ月後から2027年以降までと見方が割れている。今回のPPE.plの情報はあくまで物理ディスクの流通に関するもので、オンラインの開始時期とは別の話として扱われている。ゲーム内ファイルから将来のオンライン要素を示唆する痕跡が見つかったという報告はあるが、こちらも時期は不明だ。

---

## まとめ:信頼度の整理

確定している事実(公式):

- 発売時(11月19日)の物理版はディスクなしのコード・イン・ボックス形式。理由はリーク対策とプレロード対応。
- この仕様にファンの不満が集まり、一部小売は取り扱いを見送っている。

未確認のリーク(PPE.pl・Graczdari、Rockstar未確認):

（※2026年6月28日追記:この噂はその後の報道により否定された。冒頭の追記を参照）

- 12月にディスク入りの物理版が出る。コード版は初回分のみで、売り切れ後にディスク版へ移行。ディスク版はアカウント紐付けなしでインストール可能。

推測・注意:

- 「物理版は後日入手可能」というサポート返信は、内容が曖昧で公式の確約ではない。
- ディスク版とオンライン開始を結びつける情報は現時点でなく、オンラインの時期は依然として不明。

注意点として、GTA6は本記事執筆時点で未発売である。12月のディスク版は実績のあるインサイダー発の情報ではあるが、Rockstarの公式発表ではない。未確認の情報を確定したかのように扱わず、続報は公式発表で確認するのが望ましい。ディスク版を待つかどうかを今すぐ判断する必要がある場面では、現時点で確定しているのは「発売時はコードのみ」という点だけだという前提で考えるのが安全だ。`,
    titleEn:
      "GTA6's Physical Edition Has No Disc Inside — Is the Talk of a “Real Disc Version” in December True?",
    descriptionEn:
      "At launch, GTA6's physical edition is a “code-in-box” with nothing but a download code inside. On top of that, insider talk that “a real disc version will arrive in December” is spreading. We separate the confirmed facts from the leaks.",
    aiSummaryEn: [
      "Rockstar has officially confirmed that the physical edition at launch (November 19) is a disc-less “code-in-box” format. The reasons are leak countermeasures and preload support; some retailers are declining to carry it, and community dissatisfaction is high.",
      "The claim that “a real disc version will arrive in December” was reported by Poland's PPE.pl, citing the insider Graczdari. The source has a track record—being first to correctly call the no-disc launch—but it remains a single, anonymous rumor unconfirmed by Rockstar.",
      "There is currently no information connecting the disc version to the start of online. GTA6 is unreleased, and the only confirmed fact is that “at launch it's code-only.” Verifying follow-up news through official announcements is advisable.",
    ],
    fullContentEn: `# GTA6's Physical Edition Has No Disc Inside — Is the Talk of a “Real Disc Version” in December True?

“I bought the package, but all that's in the box is a download code.” Frustration over this specification has erupted in the community surrounding GTA6's physical edition. At the same time, talk that “a little after launch, in December, a real version with a disc inside will be released” has begun to spread. The source is an insider who was early to correctly call the no-disc situation at launch.

That said, what is confirmed only goes as far as “at launch it's code-only”; the December disc version remains nothing more than unverified information. GTA6 FEED has organized this by separating the confirmed facts from the leaks.

This article is based on information as of June 27, 2026.

---

> **[Update / Correction — June 28, 2026]**
>
> Regarding the information this article presented as “a credible rumor originating from an insider with a track record”—that a real disc-included physical edition would be released in December 2026—we are issuing a correction in light of subsequent reporting.
>
> The Hollywood Reporter (THR) confirmed that the widely circulated Rockstar Support email is itself genuine (sent by an actual Rockstar employee), but reported that its contents do not refer to a physical disc edition. According to THR's sources, the “physical copy” mentioned in the email refers to the already officially announced code-in-box package edition, and “the following months” refers not to the period after the November 19 launch, but to the months following the June 24 price and pre-order announcement (the run-up to release). The same sources further state that there is no plan whatsoever to produce GTA6 discs, either at launch or afterward, and that the talk of a December disc version is not true.
>
> Therefore, the rumor this article presented—that “a disc version will come out in December”—is based on the support reply's poor wording and on the misunderstanding fueled by the expectation that “physical edition = disc,” and it is reasonable to judge it incorrect at this time. Rockstar has never announced a disc version, and no disc-included physical edition is planned either at launch or afterward. The original fact—that the package edition on store shelves contains only a download code—remains unchanged.
>
> Note that this is not an official Rockstar statement, but is based on reporting by THR and outlets such as IGN that relayed it. The situation could change if Rockstar makes a new official announcement, but the accurate understanding as of this update is that “that email was not about a disc version.”

---

## Confirmed: The Physical Edition at Launch Is “Just a Code in the Box”

It has been officially confirmed by Rockstar that the physical edition lining up for the November 19, 2026 launch will be a “code-in-box” format that does not include a disc. What sits on store shelves is an ordinary package, but what's inside is a download code, and you end up downloading the game itself to play after all.

The reason cited for adopting this format is countermeasures against large-scale leaks before release. Physical discs are prone to circulating before release at each stage of manufacturing, shipping, and retail, and in the past there have been repeated cases of contents leaking or being streamed before launch. If no disc is made in the first place, that avenue can be shut off. It is also said to serve the aim of enabling the preload starting November 12.

In response, the community's reaction is harsh. Voices line up such as “if it's a physical edition with no disc, it's just a box,” “there's no sense of ownership,” and “you can't lend, borrow, or resell it secondhand.” In fact, some retailers have indicated a stance of declining to handle the disc-less package.

![That the launch physical edition ships without a disc (code-in-box) can be confirmed from Rockstar's own notices](/images/news/rockstarFAQ.webp)

---

## Leak: A “Real Disc Version” in December? (Unverified)

* [Update — June 28, 2026] The “December disc version” information presented below was subsequently denied following reporting by The Hollywood Reporter. See the update at the top of this article for details.

From here on is unverified information. The Polish gaming outlet PPE.pl, citing the insider Graczdari, reports that a real disc-included physical edition of GTA6 will be released in December 2026 for PS5 and Xbox Series X.

The substance of the claim is as follows. The code-in-box version at launch is a “one-and-done” of only the initial production run, and once it sells out, an ordinary disc-included version appears in its place. The timing is before the holiday shopping season, and a disc version, it's said, can be installed without tying a code to an account. In fact, it's also reported that the code version has already begun selling out, and if this account is accurate, the flow would be that the disc version emerges after it has once disappeared from store shelves.

The reason this information is being received with a certain weight is due to the track record of its source. Graczdari is the person who, around March 2026, first reported that “GTA6 will not come with a disc at launch.” At the time, Take-Two denied a later physical edition and few believed it, but the code-in-box format was subsequently officially confirmed, and the prediction ended up being correct. The source is said to be in a position involved in physical game distribution in Europe, and to have accurately called the physical-edition release timing of multiple titles in the past.

However, there are also many reservations. This comes from a single, anonymous source, and the text has gone through machine translation from Polish. Rockstar has acknowledged nothing about this December disc version, and Take-Two had in the first place previously denied the very plan for a post-launch physical edition. In addition, there's a reported example of Rockstar support replying to an inquiry that “the physical edition will be available at a later date,” but it has also been pointed out that support may have misread the question, and it can hardly be called an official roadmap statement. Although multiple outlets such as VGC, Gematsu, Vice, Kotaku, and RockstarINTEL have picked it up and it has spread, at present the appropriate positioning is “a credible rumor originating from an insider with a track record.”

![The debate over the physical edition's disc shows no sign of settling, and the unverified talk of a “December disc version” is drawing attention too](/images/news/dischoudou.webp)

The community's reception is also divided.

- “I waited 13 years, so waiting one more month for a disc version is no problem.”
- “I won't buy a box with just a code. I'll wait until the disc version comes out.”
- “In the end, isn't this double-dipping—making us buy once digitally and once again on disc?”

---

## The Relationship with Online (No Connection at This Point)

Because one might think that “online (the GTA Online equivalent) may also start in December when the disc version comes out,” we looked into that line too. Our conclusion is that no leak or official hint connecting the two can be found at present.

GTA6 will be a single-player experience only at launch, with online not included. Rockstar has announced nothing about when it will be added, and even among insiders and analysts, views are split, ranging from a few months later to 2027 or beyond. This PPE.pl information concerns only physical disc distribution and is treated as a separate matter from the timing of the online launch. There are reports that traces suggesting future online elements have been found in in-game files, but the timing for these is unknown as well.

---

## Summary: Sorting Out the Confidence Levels

Confirmed facts (official):

- The physical edition at launch (November 19) is a disc-less code-in-box format. The reasons are leak countermeasures and preload support.
- Fan dissatisfaction has gathered over this specification, and some retailers are declining to carry it.

Unverified leak (PPE.pl / Graczdari, unconfirmed by Rockstar):

(* Update June 28, 2026: This rumor was subsequently denied by later reporting. See the update at the top.)

- A disc-included physical edition will come out in December. The code version is only the initial run, transitioning to the disc version after it sells out. The disc version can be installed without account linking.

Speculation / caveats:

- The “physical edition available at a later date” support reply is vague in content and not an official commitment.
- There is no information at present connecting the disc version to the start of online, and the timing of online remains unknown.

As a note of caution, GTA6 is unreleased as of the time of writing. The December disc version is information originating from an insider with a track record, but it is not an official Rockstar announcement. It is advisable not to treat unverified information as if it were confirmed, and to verify follow-up news through official announcements. In situations where you must decide right now whether to wait for the disc version, it is safest to think on the premise that the only thing confirmed at present is the single point that “at launch it's code-only.”`,
  },
  {
    id: 24,
    title: "予約だけで10億ドル、発売60日で8,500万本、GTA6は本当に「史上最大の発売」になるのか",
    description:
      "予約だけで10億ドル、発売60日で8,500万本、初年度数十億ドル――GTA6の販売予測は桁が大きい。だがその多くはアナリストの推計で、各社の見立ては2倍以上開く。何が公式の確定値で、何が予測かを切り分けて整理する。",
    icon: "📈",
    image: "/images/news/sijyousaidainohatubai.webp",
    category: "speculation",
    date: "2026-06-26",
    publishedAt: "2026-06-26 16:40",
    source: "GTA6 FEED 編集部",
    sourceUrl: "https://www.take2games.com/ir",
    relatedArticles: [23, 22, 21],
    aiSummary: [
      "GTA6の販売をめぐっては「予約だけで10億ドル」「発売60日で8,500万本」など桁の大きな予測が飛び交う。だがその大半はアナリスト・調査会社の推計で、Rockstarやその親会社Take-Twoが約束した数字ではない。前提次第で各社の見立ては2倍以上開く。",
      "公式の確定値はGTA6単体ではなくTake-Two全社の2027会計年度ネットブッキング見通し（80億〜82億ドル、複数タイトル込み）。比較の土台となるGTA5の実績（初日約8.16億ドル・1,121万本、3日で10億ドル、ギネス6冠）はギネス記録・開示として確認できる事実。",
      "予測は価格・対象期間・課金の織り込み方で大きくぶれ、発売直後は記録的でも長期ではGTA5を下回るとの異論もある。GTA6は本記事執筆時点で未発売。販売規模はいずれも予測であり、確定実績のように扱う断定には注意したい。",
    ],
    titleEn:
      "Will GTA6 Really Be the “Biggest Launch in History”? Reading the Bullish Sales Forecasts Apart from the Official Figures",
    descriptionEn:
      "A billion dollars from pre-orders alone, 85 million units in 60 days, billions in first-year revenue—the GTA6 sales forecasts are huge. But most are analyst estimates, and the firms' views diverge by more than 2x. We sort out what is an official confirmed figure and what is mere forecast.",
    aiSummaryEn: [
      "Around GTA6's sales, big-figure forecasts fly about—\"a billion dollars from pre-orders alone,\" \"85 million units in 60 days.\" But most are estimates by analysts and research firms, not figures promised by Rockstar or its parent Take-Two. Depending on assumptions, the firms' views diverge by more than 2x.",
      "The official confirmed figure is not for GTA6 alone but Take-Two's company-wide FY2027 net bookings outlook ($8.0–8.2 billion, multiple titles included). The GTA5 results that form the basis for comparison (day-one ~$816M / 11.21M units, $1B in three days, six Guinness records) are facts confirmable as Guinness records and disclosures.",
      "Forecasts swing widely with price, target period, and how recurring spending is factored in, and some argue that while the launch will be record-breaking, GTA6 may fall short of GTA5 long-term. GTA6 is unreleased as of writing; all sales figures are forecasts, so beware of treating them as confirmed results.",
    ],
    fullContentEn: `# Will GTA6 Really Be the “Biggest Launch in History”? Reading the Bullish Sales Forecasts Apart from the Official Figures

A billion dollars from pre-orders alone, 85 million units in 60 days from launch, first-year revenue on the scale of several billion dollars—big-figure forecasts are flying around regarding GTA6's sales. Given that even GTA5 was one of the biggest hits in history, the view that this will surpass it carries a certain persuasiveness.

However, most of these figures are forecasts by analysts and research firms, not numbers promised by Rockstar or its parent company Take-Two. Forecasts swing greatly depending on how the assumptions are set, and in reality the firms' estimates diverge by more than 2x. GTA6 FEED has sorted out what is an officially confirmed figure and what is merely a forecast.

This article is based on information as of June 26, 2026.

## What Is Official Is Not GTA6 Alone, but Take-Two's Company-Wide Outlook

At this point, the most important official figure for considering GTA6's commercial scale is the net bookings (effectively, a sales outlook) for fiscal year 2027 (April 2026–March 2027) presented by Take-Two: $8.0–8.2 billion. Take-Two CEO Zelnick positions this year as one of record performance, and clearly states that the main driver is the November 19 launch of GTA6.

However, this $8.0–8.2 billion is a company-wide, full-year figure including multiple titles; it is not GTA6's sales alone. It must be noted that Take-Two is not officially putting out an individual figure for how much GTA6 will sell.

## The Basis for Comparison: The Records GTA5 Set (Confirmed)

In gauging the validity of the forecasts, the track record of the previous title, GTA5, is a solid point of comparison. These are facts confirmable as Guinness records and Take-Two disclosures.

![The three protagonists of GTA5. The game became one of the biggest hits in entertainment history](/images/news/530668.webp)

- GTA5 generated about $815.7 million in revenue on its launch day in 2013, selling 11.21 million units. This was the highest sales in history for an entertainment product over 24 hours at the time, reached $1 billion in three days, and set six Guinness World Records.
- GTA5's cumulative sales have reached about 230 million units, and the GTA series as a whole has sold over 470 million units (Take-Two's FY2026 disclosure).
- On the promotional side as well, the first trailer drew over 93 million views in 24 hours on YouTube, setting a record for the most-viewed non-music video, and the second trailer recorded over 475 million views cross-platform in 24 hours.

The bullish forecasts for GTA6 all rest on the premise of "surpassing these records."

## Analyst Forecasts (= Estimates; They Vary Widely by Firm)

The figures cited from here on are all forecasts by named research firms and analysts, not confirmed values. Because the timing of release and the assumptions differ, the estimates diverge greatly.

Pre-order / launch-day scale:

- Tom Henderson of Insider Gaming has said it could reach the scale of a billion dollars in just the first hour from when pre-orders open. In unit terms, that corresponds to 12–14 million pre-orders in one hour.
- DFC Intelligence initially saw over a billion dollars from pre-orders alone, but in its latest estimate after the price was confirmed (standard edition $79.99), it estimates launch-day sales centered on pre-orders at about 25 million units.
- The investment bank Piper Sandler presents a bullish forecast of 46 million units on launch day, amounting to about $3 billion in revenue. However, note that this 46 million units stands out as exceptionally high even among the firms' forecasts and is a bullish estimate based on a proprietary model.
- The investment firm Konvoy presents a view of 10 million pre-orders (about $800 million), plus 15 million units on launch day and 85 million units in 60 days from launch. However, note that Konvoy's series of estimates was issued as of 2025 and does not assume the later-confirmed launch date (November 19).

First-year / medium-to-long-term scale:

- DFC Intelligence forecasts 40 million units and about $3.2 billion in total revenue in the first year (this is double GTA5's first-year revenue).
- Konvoy, including GTA+ subscriptions and in-game spending, puts out the most bullish figure of $7.6 billion in total revenue in 60 days from launch.
- Piper Sandler expects over 35 million units in FY2027.
- Visible Alpha estimates $5 billion by 2030.

The reason the figures diverge this much is that the assumed price, the target period (launch day, 60 days, or one year), and how far recurring spending such as GTA+ is factored in all differ by firm. For example, Konvoy's $7.6 billion is a figure for "60 days" and including spending, while DFC's $3.2 billion is a "12-month" figure; they cannot be compared simply.

## The Grounds for Bullishness

Behind this concentration of expectations are several concrete factors.

The long waiting period of 13 years since GTA5's release, the large installed base of current-generation consoles in the PS5 and Xbox Series X|S, the recent rise in prices, and the fact that it has become easier to design live-service-style revenue from launch day onward can all be cited. Furthermore, the fact that the trailers are being viewed at record levels, and the moves by competitors to shift the timing of their own titles to avoid GTA6's launch week, also show how the market views the weight of this title. The research firm Ampere Analysis estimates that the two launch delays caused the industry as a whole to lose about $2.7 billion in sales that would otherwise have been earned in the fall of 2025.

![Jason and Lucia, the protagonists of GTA6. Expectations are concentrated on whether it will surpass GTA5's records](/images/news/Jason_and_Lucia_01_With_Logos_landscape.webp)

## Cautious Views and Counterarguments (Balance)

On the other hand, there are views that are not uniformly bullish. To maintain the article's reliability, these counterarguments are worth noting too.

As mentioned earlier, after the price was confirmed, DFC Intelligence revised its launch-day sales forecast downward to about 25 million units. This is still a huge figure, but it has been adjusted from the initial spirited estimate to a more realistic level.

As a more pointed counterargument, Joost van Dreunen of NYU Stern School of Business (a former research-firm CEO) sees the launch as strong (38 million units / over $3 billion in the first year) while viewing the possibility that, long-term, GTA6 may fall below GTA5. As a reason, he cites that the rapid growth of the game market that continued from 2013, when GTA5 launched (global spending expanded about threefold), is unlikely to be repeated going forward. However, he expects per-person spending to instead rise, projecting a form that efficiently monetizes a smaller scale.

And as the most important premise, Rockstar and Take-Two have not officially disclosed concrete figures for pre-order counts or sales. The phrasing of "reliably breaking GTA5's records" is an expectation, not a guaranteed fact.

## Summary: Sorting Out the Confidence Levels

Confirmed facts (official / track record):

- Take-Two's FY2027 net bookings guidance is $8.0–8.2 billion (but this is company-wide, full-year, and includes multiple titles; it is not GTA6 alone).
- GTA5 had a day-one of about $816 million / 11.21 million units, $1 billion in three days, and six Guinness records. Cumulative about 230 million units, series cumulative over 470 million units.
- The price is $79.99 for the standard edition / $99.99 for the ultimate edition (confirmed June 25).

Forecasts / estimates (various analyst firms; vary greatly by timing and assumptions):

- Pre-order / launch day: a billion dollars in one hour (Henderson), about 25 million units on launch day (DFC) to 46 million units (Piper Sandler).
- First-year / medium-to-long-term: 40 million units / $3.2 billion in the first year (DFC), $7.6 billion in 60 days (Konvoy), $5 billion by 2030 (Visible Alpha), and so on.

Cautions / counterarguments:

- Official figures for pre-order counts and sales are undisclosed, and these are all projected values expected to vary depending on assumptions.
- There is also a view that, while the launch will be record-breaking, it may fall below GTA5 long-term.

As a caution, GTA6 is unreleased as of the writing of this article, and the sales scales cited here are all forecasts. Beware of information that treats forecasts as if they were confirmed results, and of assertions like "X hundred million units guaranteed." The actual figures will become clear through Take-Two's earnings disclosures after launch and the like. For the latest and accurate information, it is best to confirm via Take-Two's official announcements.

---

## Disclaimer

This article is an independent compilation and analysis by GTA6 FEED, based on Take-Two's official disclosures, Guinness World Records, and forecasts by overseas research firms and analysts. The figures from analysts and research firms are forecasts, not confirmed values, and may vary greatly depending on the assumptions. Take-Two has not officially disclosed an individual sales figure for GTA6. GTA6 is an unreleased title, and the sales scales cited here are all forecasts. For the latest information, please confirm via the official announcements from Take-Two and Rockstar Games.`,
    fullContent: `# GTA6は本当に「史上最大の発売」になるのか――強気な販売予測を、公式の数字と切り分けて読む

予約だけで10億ドル、発売60日で8,500万本、初年度の収益は数十億ドル規模――GTA6の販売をめぐっては、桁の大きな予測が飛び交っている。GTA5ですら過去最大級のヒットだったことを踏まえれば、それを超えるという見方には一定の説得力がある。

ただし、これらの数字のほとんどはアナリストや調査会社による予測であり、Rockstarやその親会社Take-Twoが約束した数字ではない。予測は前提の置き方で大きくぶれ、実際には各社の見立てが2倍以上開いている。GTA6 FEEDが、何が公式に確定した数字で、何が予測にすぎないのかを切り分けて整理した。

本記事は2026年6月26日時点の情報にもとづく。

## 公式に出ているのはGTA6単体ではなく、Take-Two全社の見通し

現時点で、GTA6の商業規模を考えるうえで最も重要な公式数字は、Take-Twoが示した2027会計年度（2026年4月〜2027年3月）のネットブッキング（実質的な売上見通し）で、80億〜82億ドルとされている。Take-TwoのZelnick CEOは、この年を記録的な業績の年と位置づけ、その主因が11月19日のGTA6発売だと明言している。

ただし、この80億〜82億ドルは全社・通期・複数タイトルを含む数字であり、GTA6単体の売上ではない。GTA6がどれだけ売れるかという個別の数字を、Take-Twoが公式に出しているわけではない点には注意が必要だ。

## 比較の土台:GTA5が打ち立てた記録（確定）

予測の妥当性を測るうえで、前作GTA5の実績は確かな比較対象になる。これらはギネス記録やTake-Twoの開示として確認できる事実である。

![GTA5の3人の主人公。同作はエンタメ史上最大級のヒットとなった](/images/news/530668.webp)

- GTA5は2013年の発売初日に約8億1,570万ドルの収益を上げ、1,121万本を販売した。これは当時のエンターテインメント製品として24時間で史上最高の売上で、3日で10億ドルに到達し、6つのギネス世界記録を打ち立てた。
- GTA5の累計販売は約2億3,000万本に達しており、GTAシリーズ全体では4億7,000万本超を売り上げている（Take-Twoの2026会計年度開示）。
- 宣伝面でも、第1弾トレーラーはYouTubeで24時間に9,300万回超を集めて非音楽動画の最多視聴記録を更新し、第2弾トレーラーはクロスプラットフォームで24時間に4億7,500万回超を記録している。

GTA6の強気な予測は、いずれも「この記録を超える」という前提の上に成り立っている。

## アナリストの予測（＝推測。各社で大きく割れる）

ここから挙げる数字は、いずれも名前のわかる調査会社・アナリストによる予測であり、確定値ではない。発表時点や前提条件が異なるため、見立ては大きく分かれている。

予約・発売日の規模:

- Insider GamingのTom Hendersonは、予約開始から最初の1時間だけで10億ドル規模に達しうると述べている。本数にすると1時間で1,200万〜1,400万本の予約に相当する。
- DFC Intelligenceは当初、予約だけで10億ドル超と見ていたが、価格確定（通常版79.99ドル）後の最新の見立てでは、予約を中心とする発売初日の販売を約2,500万本と推計している。
- 投資銀行Piper Sandlerは、発売初日に4,600万本、収益にして約30億ドルという強気の予測を示している。ただしこの4,600万本は各社の予測のなかでも突出して高く、独自モデルに基づく強気な見立てである点には注意がいる。
- 投資会社Konvoyは、予約1,000万本（約8億ドル）に加え、発売日に1,500万本、発売60日で8,500万本という見方を示す。ただしKonvoyの一連の試算は2025年時点に出されたもので、その後に確定した発売日（11月19日）を前提にしたものではない点には留意したい。

初年度・中長期の規模:

- DFC Intelligenceは初年度4,000万本・総収益約32億ドルと予測（これはGTA5の初年度収益の倍にあたる）。
- KonvoyはGTA+課金やゲーム内課金も含め、発売60日で総収益76億ドルという最も強気な数字を出している。
- Piper Sandlerは2027会計年度に3,500万本以上を見込む。
- Visible Alphaは2030年までに50億ドルと推計している。

これだけ数字が割れるのは、想定する価格、対象とする期間（発売日か、60日か、1年か）、そしてGTA+などの継続課金をどこまで織り込むかが各社で違うためだ。たとえばKonvoyの76億ドルは「60日間」かつ課金込みの数字で、DFCの32億ドルは「12カ月」の数字であり、単純には比較できない。

## 強気の根拠

これだけの期待が集まる背景には、いくつかの具体的な要因がある。

GTA5の発売から13年という長い待機期間、PS5とXbox Series X|Sという現行機の普及台数の大きさ、近年の価格上昇、そして発売初日からライブサービス的な収益を設計しやすくなっている点が挙げられる。さらに、トレーラーが記録的に視聴されている事実や、競合各社がGTA6の発売週を避けて自社タイトルの時期をずらしている動きも、市場がこの作品の重さをどう見ているかを示している。調査会社Ampere Analysisは、二度の発売延期によって、本来2025年秋に得られたはずの売上が業界全体で約27億ドル失われたと試算している。

![GTA6の主人公ジェイソンとルシア。GTA5の記録を超えられるかに期待が集まる](/images/news/Jason_and_Lucia_01_With_Logos_landscape.webp)

## 慎重論・異論（バランス）

一方で、強気一辺倒ではない見方もある。記事の信頼度を保つうえで、こうした異論も押さえておきたい。

前述のとおり、DFC Intelligenceは価格が確定したあと、発売初日の販売予測を約2,500万本へと下方修正している。これは依然として巨大な数字だが、当初の威勢のよい見立てから現実的な水準へ調整された形だ。

より踏み込んだ異論として、NYUスターン経営大学院のJoost van Dreunen（調査会社の元CEO）は、発売直後は好調（初年度3,800万本・30億ドル超）としつつも、長期的にはGTA6がGTA5を下回る可能性があると見ている。理由として、GTA5が発売された2013年から続いたゲーム市場の急成長（世界の消費額が約3倍に拡大した）は今後繰り返されないだろうという点を挙げる。ただし、一人当たりの課金額はむしろ高くなると予想しており、より小さな規模を効率的に収益化する形になるとの見立てだ。

そして最も重要な前提として、予約数や売上の具体的な数字をRockstar・Take-Twoは公式に開示していない。「GTA5の記録を確実に更新する」という言い回しは期待であって、保証された事実ではない。

## まとめ:信頼度の整理

確定している事実（公式・実績）:

- Take-Twoの2027会計年度ネットブッキング・ガイダンスは80億〜82億ドル（ただし全社・通期・複数タイトル込み。GTA6単体ではない）。
- GTA5は初日約8.16億ドル・1,121万本、3日で10億ドル、ギネス6冠。累計約2億3,000万本、シリーズ累計4億7,000万本超。
- 価格は通常版79.99ドル／アルティメット99.99ドル（6月25日確定）。

予測・推計（アナリスト各社、時点・前提により大きく異なる）:

- 予約・発売日:1時間で10億ドル（Henderson）、発売日約2,500万本（DFC）〜4,600万本（Piper Sandler）。
- 初年度・中長期:初年度4,000万本・32億ドル（DFC）、60日で76億ドル（Konvoy）、2030年までに50億ドル（Visible Alpha）など。

注意・異論:

- 予約数・売上の公式な数字は未開示で、これらはいずれも前提次第で変動する見込み値である。
- 発売直後は記録的でも、長期的にはGTA5を下回るとの見方もある。

注意点として、GTA6は本記事執筆時点で未発売であり、ここに挙げた販売規模はいずれも予測である。予測を確定した実績のように扱う情報や、「○億本突破確定」といった断定には注意したい。実際の数字は、発売後のTake-Twoの決算開示などを通じて明らかになる。最新かつ正確な情報は、Take-Twoの公式発表で確認することが望ましい。

---

## 免責事項

本記事は、Take-Twoの公式開示、ギネス世界記録、海外の調査会社・アナリストによる予測をもとに、GTA6 FEEDが独自に整理・考察したものである。アナリストや調査会社の数字は予測であって確定値ではなく、前提次第で大きく変動しうる。Take-TwoはGTA6単体の販売数字を公式に開示していない。GTA6は未発売タイトルであり、ここに挙げた販売規模はいずれも予測である。最新情報はTake-Two および Rockstar Games の公式発表を確認されたい。`,
  },
  {
    id: 23,
    title: "GTA6小売ページに“未公開情報”――Amazon Brazil・KaBuMの記述は本物か、AI生成の宣伝文か",
    description:
      "6月25日の予約開始に合わせ、ブラジルのAmazon・KaBuMのGTA6商品ページに、他地域では確認できない踏み込んだゲームプレイ記述が掲載され話題に。何が公式情報で、何が小売ページ由来の未確認情報なのかを切り分けて整理する。",
    icon: "🛒",
    image: "/images/news/AmazonBrazilryuusyutu.webp",
    category: "speculation",
    date: "2026-06-26",
    publishedAt: "2026-06-26 14:20",
    source: "GTA6 FEED 編集部",
    sourceUrl: "https://www.rockstargames.com/VI",
    relatedArticles: [22, 21, 20],
    aiSummary: [
      "6月25日の予約開始に合わせ、ブラジルのAmazonと小売KaBuMのGTA6商品ページに、他地域の公式ページにはない踏み込んだゲームプレイ記述（主人公のリアルタイム切替、SNS経由の秘密ミッション、PS5 Pro強化など）が掲載され話題に。Rockstar/Take-Twoは未コメント。",
      "ただし内容の多くは既知情報の焼き直しで、英訳するとAI生成の宣伝文のように読めるとの指摘も。新しい部分として注目されるのはゲーム内SNSの具体仕様（秘密ミッションの発見）と、KaBuMの「生成AI不使用」明記。いずれもRockstar未確認のリーク。",
      "同時期に出回る「Leonida Map Leaked」画像はファン作成の概念図で、今回のリークとも公式とも無関係。公式マップは未公開。GTA6は2026年11月19日発売予定で、本記事執筆時点では未発売。確定情報は公式発表で確認したい。",
    ],
    titleEn:
      "“Unrevealed Info” on GTA6 Retail Pages: Are the Amazon Brazil and KaBuM Descriptions Real, or AI-Generated Marketing Copy?",
    descriptionEn:
      "Coinciding with the June 25 pre-order opening, the GTA6 product pages on Brazil's Amazon and the retailer KaBuM carry detailed gameplay descriptions not found on official pages in other regions. We sort out what is official information and what is unconfirmed info originating from the retail pages.",
    aiSummaryEn: [
      "Coinciding with the June 25 pre-order opening, the GTA6 product pages on Brazil's Amazon and the retailer KaBuM carried detailed gameplay descriptions (real-time protagonist switching, secret missions via in-game social media, PS5 Pro enhancements) not found on official pages elsewhere. Rockstar/Take-Two have not commented.",
      "However, much of the content is a rehash of known info, and some note that translated into English it reads like AI-generated marketing copy. The parts drawing attention as new are the specifics of in-game social media (discovering secret missions) and KaBuM's explicit note of no generative AI. All are leaks unconfirmed by Rockstar.",
      "The “Leonida Map Leaked” image circulating at the same time is a fan-made concept and is unrelated to this leak or to official info. No official map has been released. GTA6 is scheduled for November 19, 2026, and is unreleased as of writing. Confirm definitive info via official announcements.",
    ],
    fullContentEn: `# “Unrevealed Info” on GTA6 Retail Pages: Are the Amazon Brazil and KaBuM Descriptions Real, or AI-Generated Marketing Copy?

Coinciding with the June 25 pre-order opening, the GTA6 product pages on Brazil's Amazon and the major retailer KaBuM are said to carry gameplay descriptions that cannot be confirmed on official pages in other regions, and this has drawn attention within the community.

There you find content that goes further than official announcements: real-time switching between Jason and Lucia, secret missions through in-game social media, NPC daily routines, technical enhancements for the PS5 Pro, and more.

That said, it is risky to take this at face value as “new information now confirmed.” The text contains a lot of rehashed known information, and there are pointers that, translated into English, it reads like AI-generated marketing copy. At GTA6 FEED, we sort out, for these descriptions, what is official information and what is unconfirmed info originating from the retail pages.

This article is based on information as of June 26, 2026. We note up front that the following retail-page descriptions are not official announcements by Rockstar, but unconfirmed information.

## What Happened

On June 25, users discovered that Amazon Brazil's GTA6 pre-order page contained more detailed gameplay descriptions that differed from the official explanatory text Rockstar distributes to each retailer. The page of another Brazilian retailer, KaBuM, had even more detailed descriptions.

What should be noted is that this page itself differs from a mere social-media-post-style leak; it has at least been confirmed as a normal product listing on Amazon Brazil. Even so, that does not guarantee that the content of the posted text is correct. It is more accurate to view it as a state in which “a legitimate page carries text different from the officially distributed version,” and Rockstar and its parent company Take-Two have not commented on the matter.

Assessments of its reliability are split. While some accounts dealing with GTA-related information suggest the text may have been provided to the retailers by Rockstar's side, they also indicate that the possibility of a third party having edited it cannot be ruled out. In addition, because translated into English the text feels strongly promotional and gives the impression of generative AI, and because most of the content is already known, there are multiple voices saying it should be handled cautiously. No similar descriptions have been confirmed on the Amazon US page.

## The Described Content (Unconfirmed Leak)

We organize the gameplay elements both pages describe. None of them are officially confirmed.

- Protagonists: Jason and Lucia can be switched in real time during heists and the like. There are “duo” missions where the two cooperate to progress.
- Map: The largest and most densely packed open world in Rockstar's history. In addition to Vice City, you can explore various parts of the state of Leonida, including beaches, swamps, and small towns.
- NPCs and World: Each NPC has its own daily routine, and random events occur. There are many shops and facilities you can enter, described as a “living world.” KaBuM describes “advanced AI and unprecedented urban density.”
- In-Game Social Media: Using the in-game smartphone, you can watch viral videos and follow Vice City influencers to grasp what's happening in the world. Furthermore, it is said you can discover secret side missions via social media.
- Graphics and Weather: Advanced lighting, natural animation, and high-detail environmental rendering. Dynamic weather where storms and the passage of time affect physics and gameplay.
- PS5 Pro (KaBuM): Advanced ray tracing and improved global illumination, realistic reflections on cars and water surfaces. On the PS5 Pro, higher frame rates and resolution, and more stable operation, are said to be expected.

KaBuM also states that no generative AI is used in the game.

![Jason and Lucia, the two protagonists. Real-time switching during heists is one of the “unconfirmed” descriptions](/images/news/Jason_and_Lucia_Motel_landscape.webp)

## Separating the Already-Known from the New

What to be careful about with this leak is that much of the reported content was known beforehand and is not something “newly uncovered.” However, even within that “beforehand,” there is a mix of things officially confirmable and things that had merely been inferred from patents and the like.

Things confirmed or suggested in the official trailers and Rockstar's published materials, or previously inferred from past patents and the like:

- The two-protagonist structure of Jason and Lucia (officially confirmed)
- The setting of the state of Leonida and Vice City, and the existence of beaches and swamps (confirmable from official materials)
- That the weather changes, that the city has many lively NPCs, and that in-game social media exists (the existence of each is confirmable in the trailers)
- Mechanisms such as weather affecting gameplay, NPCs having their own daily routines, and auto-generated interiors (inferred from past Rockstar patents and job postings; not confirmed to be implemented in the product)

It must be noted that patents and job postings can serve as grounds for a technical direction, but do not mean implementation is confirmed. In fact, several outlets assess that “the usefulness of the translated descriptions is exaggerated, and most is known information.”

![The Leonida Keys area. The existence of waterside terrain like beaches and swamps is confirmable from official materials](/images/news/Leonida_Keys_01.webp)

On the other hand, things not officially confirmed and that can be called the detailed expressions unique to these retail pages this time:

- The clear description of switching protagonists in real time during heists, and the mechanism of duo missions
- The element of discovering secret side missions via social media
- The explanation that NPCs' daily routines are driven by “advanced AI”
- The concrete enhancement content of the PS5 Pro (ray tracing, global illumination, frame rate and resolution). On the PlayStation side, it is shown that GTA6 supports “PS5 Pro Enhanced,” but the concrete enhancement content is not stated on the official page.
- The declaration of not using generative AI in the game

Several outlets cite the concrete specifications of in-game social media (such as the discovery of secret missions) as the most noteworthy new part among these descriptions.

Another interesting point is that KaBuM clearly states that “no generative AI is used in the game.” In recent game development, whether generative AI is used at all tends to become a point of contention, so deliberately touching on its non-use is eye-catching. However, whether this single line is truly based on retail-facing materials from Rockstar, or an explanation added by the page's creator, is unclear, and this too requires future confirmation.

## A Note on the Spreading “Leak Map”

Around the same time, a map image of the state of Leonida billed as the “Leonida Map Leaked” is circulating widely on social media. However, this is unrelated to this Amazon/KaBuM leak (which is, after all, a text product description); it is merely a conceptual diagram created and imagined by fans. No official map of GTA6 has been released at this point.

Care should be taken not to mistake this kind of map image for part of this retail-page leak or for official information. The direction of terrain modeled on Florida is inferred from various sources, but the concrete shape of the map and place names are not confirmed.

![The “Leonida Map Leaked” image spreading on social media. It is a fan-made concept, unrelated to the leak or official info](/images/news/leakmap.webp)

## Community Reactions

Overlapping with the excitement of the pre-order opening, a movement to parse these descriptions word by word is heating up in the community.

Voices placing expectations:

- “Finally, new information. Every single word seems to have meaning.”
- “If real-time switching during heists is real, that's amazing.”

Cautious voices:

- “Translated into English the text reads like it's AI-generated, so believing it as is would be risky.”
- “Read carefully, it's mostly stuff we've known for a while.”

Overall, the temperature is one of doubting the certainty while analyzing the content in detail.

## Summary: Sorting Out the Confidence Levels

Confirmable facts (official trailers and published materials):

- The two protagonists (Jason / Lucia), and the setting of the state of Leonida and Vice City. Weather changes, lively NPCs, and in-game social media can all have their existence confirmed in the trailers.
- The release is November 19, 2026, on PS5 and Xbox Series X|S. GTA6 is said to support “PS5 Pro Enhanced,” but the concrete enhancement content is officially undisclosed.

Unconfirmed leaks (originating from the retail pages, unconfirmed by Rockstar):

- Real-time protagonist switching during heists, the mechanism of duo missions, secret missions via social media, NPC routines driven by “advanced AI,” the concrete enhancement content of the PS5 Pro, and the declaration of not using generative AI.

Speculation and cautions:

- Weather affecting gameplay, NPCs having their own daily routines, auto-generated interiors, and the like are inferred from past patents and job postings, and are not confirmed implementations.
- The spreading “Leonida Map Leaked” image is a fan-made conceptual diagram, unrelated to this leak or to official information. No official map has been released.
- Regarding the descriptions themselves, there are voices pointing out the possibility of generative AI or placeholder text, and Rockstar has not commented.

As a caution, GTA6 is unreleased as of the writing of this article. Care is needed regarding information that treats retail-page descriptions, leaks of unknown origin, and fan-made map images as if they were definitive. These descriptions, too, are at a stage where they should ultimately be confirmed by official trailers or Rockstar's announcements. Along with this, continue to beware of scams on unofficial sites that demand pre-order proxies or down payments, and it is best to confirm the latest information through Rockstar Games' official announcements.

---

## Disclaimer

This article is an independent compilation and analysis by GTA6 FEED, based on the GTA6 product-page descriptions reported on Amazon Brazil and KaBuM, official trailers, Rockstar's official announcements, and overseas media. The retail-page descriptions are not official announcements by Rockstar but unconfirmed information. The spreading “Leonida Map Leaked” image is a fan-made conceptual diagram and is unrelated to this leak or to official information. GTA6 is an unreleased title, and its contents may change with future official announcements. For the latest information, please confirm via the official announcements from Rockstar Games.`,
    fullContent: `# GTA6小売ページに“未公開情報”――Amazon Brazil・KaBuMの記述は本物か、AI生成の宣伝文か

6月25日の予約開始に合わせて、ブラジルのAmazonと大手小売KaBuMのGTA6商品ページに、他地域の公式ページでは確認できないゲームプレイ説明が掲載されているとして、コミュニティで注目を集めている。

そこには、ジェイソンとルシアのリアルタイム切替、ゲーム内SNSを通じた秘密ミッション、NPCの日常ルーチン、PS5 Pro向けの技術的強化など、公式発表より踏み込んだ内容が並ぶ。

ただし、これをそのまま「新情報が確定した」と見るのは危うい。文面には既知情報の焼き直しも多く、英訳するとAI生成の宣伝文のように読めるという指摘もある。GTA6 FEEDでは、今回の記述について、何が公式情報で、何が小売ページ由来の未確認情報なのかを切り分けて整理する。

本記事は2026年6月26日時点の情報にもとづく。以下の小売ページ由来の記述はRockstarの公式発表ではなく、未確認情報である点を最初に断っておく。

## 何が起きたか

6月25日、Amazon BrazilのGTA6予約ページに、Rockstarが各小売へ配布した公式説明文とは異なる、踏み込んだゲームプレイ記述が含まれているのをユーザーが発見した。もう一つのブラジルの小売KaBuMのページには、さらに詳細な記述があった。

注意したいのは、このページ自体は単なるSNS投稿型のリークとは異なり、少なくともAmazon Brazil上の通常の商品リスティングとして確認されている点だ。とはいえ、それは掲載された文面の内容が正しいことまでを保証するものではない。「正規ページに、公式配布版とは別の文面が載っている」状態にあると見るのが正確で、Rockstarおよび親会社Take-Twoはこの件にコメントしていない。

信頼性の評価は割れている。GTA関連の情報を扱う一部のアカウントは、この文面がRockstar側から小売に提供されたものではないかと指摘する一方、第三者が編集した可能性を否定しきれないとの見方も示している。加えて、文面を英訳すると宣伝臭が強く生成AIのような印象を受けること、内容の大半がすでに判明済みであることから、慎重に扱うべきだとする声も複数ある。Amazon USのページには同様の記述は確認されていない。

## 記述された内容（未確認リーク）

両ページが述べるゲームプレイ要素を整理する。いずれも公式に確認されたものではない。

- 主人公: ジェイソンとルシアを強盗（ヒスト）などの最中にリアルタイムで切り替え可能。二人が協力して進める「デュオ」ミッションがある。
- マップ: Rockstar史上最大・最も高密度のオープンワールド。Vice Cityに加え、ビーチ、沼地、小さな町など、レオニダ州の各地を探索できる。
- NPC・世界: 各NPCが独自の日常ルーチンを持ち、ランダムイベントが発生する。入れる店舗・施設が多く、「生きた世界」と表現される。KaBuMは「高度なAIと前例のない都市密度」と記す。
- ゲーム内SNS: ゲーム内スマートフォンでバイラル動画を視聴し、Vice Cityのインフルエンサーをフォローして世界の出来事を把握できる。さらに、SNS経由で秘密のサイドミッションを発見できるとされる。
- グラフィック・天候: 先進的なライティング、自然なアニメーション、高精細な環境描写。嵐や時間変化が物理演算とゲームプレイに影響する動的な天候。
- PS5 Pro（KaBuM）: 高度なレイトレーシングとグローバルイルミネーションの改善、車や水面のリアルな反射。PS5 Proではより高いフレームレートと解像度、より安定した動作が見込めるとされる。

KaBuMはあわせて、ゲーム内に生成AIは使われていないとも記している。

![二人の主人公ジェイソンとルシア。強盗中のリアルタイム切替は「未確認」の記述のひとつ](/images/news/Jason_and_Lucia_Motel_landscape.webp)

## 既出と新規の切り分け

このリークで注意すべきは、報じられた内容の多くが以前から知られていたもので、「新たに発覚した」ものではない点だ。ただし、その「以前から」の中身にも、公式に確認できるものと、特許などから推測されていたにすぎないものが混在する。

公式トレーラーやRockstarの公開素材で確認・示唆されていたもの、または過去の特許などから以前から推測されていたもの:

- ジェイソンとルシアの二人主人公という構成（公式に確認済み）
- レオニダ州とVice Cityという舞台、ビーチや沼地の存在（公式素材で確認できる）
- 天候が変化すること、街に生き生きとしたNPCが多数いること、ゲーム内SNSが存在すること（いずれもトレーラーで存在自体は確認できる）
- 天候がゲームプレイに影響する、NPCが固有の日課を持つ、内装を自動生成するといった仕組み（過去のRockstarの特許や求人情報から推測されてきたもので、製品への搭載が確定したわけではない）

特許や求人情報は技術的な方向性の根拠にはなっても、実装の確定を意味しない点には注意が必要だ。実際、複数のメディアは「英訳された記述の有用性は誇張されており、既知の情報が大半だ」と評価している。

![レオニダ・キーズ周辺。ビーチや沼地といった水辺の地形の存在は公式素材で確認できる](/images/news/Leonida_Keys_01.webp)

一方、公式には確認されておらず、今回の小売ページ特有の踏み込んだ表現といえるもの:

- 強盗中にリアルタイムで主人公を切り替えるという明確な記述、デュオミッションの仕組み
- SNS経由で秘密のサイドミッションを発見できるという要素
- NPCの日課が「高度なAI」によって駆動されるという説明
- PS5 Proの具体的な強化内容（レイトレーシング、グローバルイルミネーション、フレームレート・解像度）。PlayStation側ではGTA6が「PS5 Pro Enhanced」対応であることは示されているが、具体的な強化内容は公式ページ上で明示されていない。
- ゲーム内に生成AIを使わないという表明

複数のメディアが、今回の記述のなかで最も注目に値する新しい部分として、ゲーム内SNSの具体的な仕様（秘密ミッションの発見など）を挙げている。

もう一つ興味深いのは、KaBuMが「ゲーム内に生成AIは使われていない」と明記している点だ。近年のゲーム開発では生成AIを使っているかどうか自体が論点になりやすく、わざわざその不使用に触れているのは目を引く。ただし、この一文が本当にRockstar由来の小売向け資料に基づくのか、ページ作成側が付け足した説明なのかは判然とせず、ここも今後の確認を要する。

## 拡散している「リークマップ」への注意

同じ時期に、「Leonida Map Leaked」と銘打たれたレオニダ州の地図画像がSNSで広く出回っている。ただし、これは今回のAmazon・KaBuMのリーク（あくまでテキストの商品説明）とは無関係であり、ファンが作成・想像した概念図にすぎない。GTA6の公式マップは現時点で一切公開されていない。

この種の地図画像を、今回の小売ページリークの一部や公式情報と取り違えないよう注意したい。フロリダをモチーフにした地形という方向性は各種情報から推測されているが、具体的な地図の形状や地名は確定していない。

![SNSで出回る「Leonida Map Leaked」画像。ファン作成の概念図で、リークとも公式とも無関係](/images/news/leakmap.webp)

## コミュニティの反応

予約開始の高揚と重なり、コミュニティではこの記述を一語ずつ読み解く動きが過熱している。

期待を寄せる声:

- 「ついに新しい情報だ。一語一句に意味がありそう」
- 「強盗中のリアルタイム切替が本当なら最高だ」

慎重に見る声:

- 「英訳するとAI生成っぽい文章で、そのまま信じるのは危うい」
- 「よく読むと、ほとんど前から知っている内容だ」

全体としては、確度を疑いつつも内容を細かく分析する、という温度感になっている。

## まとめ：信頼度の整理

確認できている事実（公式トレーラー・公開素材）:

- 二人主人公（ジェイソン／ルシア）、レオニダ州・Vice Cityという舞台。天候の変化・生き生きとしたNPC・ゲーム内SNSは、いずれも存在自体がトレーラーで確認できる。
- 発売は2026年11月19日、PS5・Xbox Series X|S。GTA6は「PS5 Pro Enhanced」対応とされるが、具体的な強化内容は公式に非公表。

未確認のリーク（小売ページ由来、Rockstar未確認）:

- 強盗中のリアルタイム主人公切替、デュオミッションの仕組み、SNS経由の秘密ミッション、NPCの「高度なAI」による日課、PS5 Proの具体的強化内容、生成AI不使用の表明。

推測・注意:

- 天候のゲームプレイへの影響、NPCの固有の日課、内装の自動生成などは、過去の特許・求人情報からの推測であり、実装確定ではない。
- 拡散中の「Leonida Map Leaked」画像はファン作成の概念図であり、今回のリークとも公式情報とも無関係。公式マップは未公開。
- 記述自体について、AI生成やプレースホルダの可能性を指摘する声もあり、Rockstarは未コメント。

注意点として、GTA6は本記事執筆時点で未発売である。小売ページの記述や出所不明のリーク、ファン作成の地図画像を確定情報のように扱う情報には注意が必要だ。今回の記述も、最終的には公式トレーラーやRockstarの発表によって確認されるべき段階にある。あわせて、予約代行や前金を求める非公式サイトの詐欺にも引き続き注意し、最新情報はRockstar Games公式の発表で確認することが望ましい。

---

## 免責事項

本記事は、Amazon Brazil・KaBuMで報じられたGTA6商品ページの記述、公式トレーラー、Rockstarの公式発表、海外メディアをもとに、GTA6 FEEDが独自に整理・考察したものである。小売ページの記述はRockstarの公式発表ではなく、未確認情報である。拡散している「Leonida Map Leaked」画像はファン作成の概念図であり、今回のリークとも公式情報とも無関係である。GTA6は未発売タイトルであり、内容は今後の公式発表によって変わる可能性がある。最新情報はRockstar Games の公式発表を確認されたい。`,
  },
  {
    id: 22,
    title: "GTA6カバーアートのヘリコプター――約25年続く「左上の伝統」と、選ばれた機体の意味",
    description:
      "2026年6月18日公開のGTA6カバーアート。左上のヘリは約25年続くGTAの伝統で、唯一の例外はChinatown Wars。今回の機体を「Sea Sparrow」とみる見立てと舞台レオニダとの関係を、事実・同定・考察に分けて整理する。",
    icon: "🚁",
    image: "/images/news/helicopter/helicoptereyecatch.webp",
    category: "speculation",
    date: "2026-06-26",
    publishedAt: "2026-06-26 11:05",
    source: "GTA6 FEED 編集部",
    sourceUrl: "https://www.rockstargames.com/VI",
    relatedArticles: [21, 20, 19],
    aiSummary: [
      "2026年6月18日にRockstarがカバーアートを公開（予約は6/25開始）。ファンが最初に確認したのは左上のヘリ＝GTA3以降ほぼ全作で守られる約25年の伝統で、唯一の例外はChinatown Wars。",
      "左上の機体は武装ヘリ「Sea Sparrow」とする見立てが有力（公式言明ではなく外観からの推定）。Vice City初出の水陸両用機で、トレーラー1・2にも登場とみられる。",
      "水辺の多いレオニダに水陸両用機は舞台に合う選択だが、ゲームプレイへの反映は未確定。事実・同定・考察を分けて受け止めたい。GTA6は2026年11月19日発売予定。",
    ],
    titleEn:
      "The Helicopter in the GTA6 Cover Art: The Roughly 25-Year-Old Top-Left Tradition and the Meaning of the Chosen Aircraft",
    descriptionEn:
      "The GTA6 cover art revealed on June 18, 2026. The helicopter in the top left is a roughly 25-year-old GTA tradition, with the sole exception being Chinatown Wars. We sort out the view that this aircraft is the Sea Sparrow and its connection to the setting of Leonida, separating fact, identification, and analysis.",
    aiSummaryEn: [
      "On June 18, 2026, Rockstar revealed the cover art (pre-orders started on June 25). The first thing fans checked was the helicopter in the top left, a roughly 25-year tradition upheld in almost every title since GTA3, with the sole exception being Chinatown Wars.",
      "The leading view is that the aircraft in the top left is the armed Sea Sparrow helicopter (not an official statement, but an estimate based on appearance). It is an amphibious aircraft that debuted in Vice City and is also believed to appear in Trailers 1 and 2.",
      "An amphibious aircraft is a fitting choice for the water-rich Leonida, but how it is reflected in gameplay is undetermined. Fact, identification, and analysis should be taken separately. GTA6 is scheduled for release on November 19, 2026.",
    ],
    fullContentEn: `# The Helicopter in the GTA6 Cover Art: The Roughly 25-Year-Old Top-Left Tradition and the Meaning of the Chosen Aircraft

On June 18, 2026, Rockstar Games revealed the official cover art for GTA6. At the same time, it announced that pre-orders would begin on June 25. As of the June 18 reveal, there was no new trailer and no price announcement, but the cover art itself became a major topic among fans.

What longtime GTA fans turned their attention to first was not the protagonist Jason, not his partner Lucia, and not Vice City in the background. It was whether there was a helicopter in the top left of the cover. To get straight to the point: there was. This is a hidden tradition of the GTA series that has continued for roughly 25 years.

## The Confirmable Facts: The Top-Left Helicopter, Continuing for 25 Years

This placement of the helicopter has been kept almost consistently in the cover art of the major titles of the 3D and HD eras since GTA3 (2001). GTA3, Vice City, San Andreas, GTA4, GTA5, and now GTA6. All of them adopt a collage (mosaic) style design, with multiple panels arranged around the central logo, and a helicopter placed in the top left.

Rockstar has never officially explained this placement. Even so, because it has been repeated in title after title, it has become a kind of ritual among fans: when the cover of a new game comes out, the first thing you do is check the top left.

The one major known exception is GTA Chinatown Wars (2009, Nintendo DS / PSP). Even though it adopts the same collage-style design, there is no helicopter in the top left. There is a theory that it was because you could not pilot a helicopter in Chinatown Wars, but GTA3 likewise does not let you pilot a helicopter and yet has a helicopter drawn on its cover, so this explanation does not hold up. Exactly why only Chinatown Wars broke from the pattern is not clear (this tradition and exception have also been covered by outlets such as Kotaku).

At the center of the GTA6 cover, the protagonists Jason and Lucia are placed, with a brightly colored Vice City reminiscent of Florida spreading out in the background. An alligator is drawn beneath the logo, symbolizing the wetlands of the state of Leonida, where the game is set. These are facts within the range that can be directly confirmed from the cover image.

![The official GTA6 cover art, with a helicopter placed in the top left](/images/news/Official_Cover_Art_landscape.webp)

## What Is This Helicopter: The Sea Sparrow View

From here, we need to handle the confirmable facts separately from the identification made by media and fans.

Several overseas outlets (such as Beebom and TechWiser) and GTA-related databases lean strongly toward viewing the helicopter in the top left as the Sea Sparrow. This is the identification that what is drawn on the cover is an armed Sea Sparrow. However, note that this is not something Rockstar has officially stated as the aircraft's name; it is strictly an estimate based on appearance. In fact, some sources have a different view, calling it a police helicopter, so the identification is not entirely in agreement. At this point, the Sea Sparrow view stands as the leading one.

![The helicopter placed in the top left of the cover (believed to be the Sea Sparrow)](/images/news/helicopter/helicopter.webp)

So what is the Sea Sparrow? Because it is an aircraft that actually exists in past games, it can be explained as fact. According to databases such as [Grand Theft Wiki](https://www.grandtheftwiki.com/Sea_Sparrow), the Sea Sparrow is an amphibious helicopter that first appeared in GTA Vice City (2002), serving as an improved version of the standard Sparrow. Instead of landing skids, it is equipped with pontoons (floats), allowing it to land on water. It carries a machine gun on its underside. It later appeared in San Andreas and Vice City Stories as well, becoming an aircraft familiar to the series.

Note that this Sea Sparrow did not make its first appearance in the GTA6 cover. Within what can be confirmed, an aircraft believed to be a Sea Sparrow flying over Vice Beach can also be seen in Trailer 1 (around 0:22) and Trailer 2 (around 0:38).

## Analysis: Why This Aircraft Is Fitting

From here on is analysis by GTA6 FEED.

If the helicopter in the top left is indeed a Sea Sparrow, then that choice takes on a meaning beyond simply following tradition. The setting of GTA6 is Leonida, modeled on Florida, where waterside areas such as coastlines and wetlands occupy a large share. Placing an amphibious aircraft there can be called a choice suited to the setting. The top left of past covers has held helicopters matched to each game's atmosphere, and it appears that this policy has been carried over this time as well.

Among fans, there is talk of an expectation that the Sea Sparrow's ability to land on water, combined with a water-rich map, might lead to some form of gameplay. However, this is nothing more than speculation. While it is a fact from past games that the Sea Sparrow itself can land on water, nothing has been officially shown about how that function will be handled in GTA6, or whether there will be customization elements. Voices saying there will be more water-based action or that it might be customizable do not, at this point, go beyond wishful thinking.

What can be read from the single helicopter drawn in the cover art is, at most, that Rockstar likely chose an aircraft to match the setting. Anything beyond that, regarding gameplay, is best treated as speculation.

## Why Fans Get Excited Over This

The reason this helicopter hunt gets exciting lies less in the aircraft's performance itself and more in a fan-participation culture. Each time the cover of a new game is revealed, fans around the world check the top left all at once and confirm with each other that it is there again this time. The consistency upheld over 25 years leads to a sense of reassurance that this is properly GTA.

Thirteen years passed between GTA5 and GTA6. With such a long gap, there was a possibility that Rockstar would overhaul the cover design and abandon the old style. But when the lid was lifted, there was a helicopter in the top left. The very fact that the tradition was kept holds great meaning for longtime fans.

## Summary

What can be said for certain is that the GTA6 cover art was revealed on June 18, 2026, and that a helicopter is placed in the top left. This is a tradition that has been kept in almost every title since GTA3, with the sole exception being Chinatown Wars.

The view that this helicopter is a Sea Sparrow is the leading one, but it is not an official statement by Rockstar; it is an identification based on appearance. That the Sea Sparrow is an amphibious aircraft is a fact from past games, but how that characteristic will be reflected in GTA6's gameplay has not been decided at all. The range that can be read from the cover art and the speculation that extends from it should be taken separately.

---

## Disclaimer

This article is an independent compilation and analysis by GTA6 FEED, based on the published GTA6 cover art, trailers, Rockstar's official announcements, overseas media, and GTA-related databases. The view that the helicopter in the top left is a Sea Sparrow is not an official announcement but an estimate based on appearance. While facts such as the Sea Sparrow being an amphibious aircraft hold true in past games, descriptions concerning gameplay, including how that characteristic will be handled in GTA6, contain speculation. GTA6 is an unreleased title, and its contents may change with future official announcements. For the latest information, please check the official announcements from Rockstar Games.`,
    fullContent: `# GTA6カバーアートのヘリコプター――約25年続く「左上の伝統」と、選ばれた機体の意味

2026年6月18日、Rockstar Games が GTA6 の公式カバーアートを公開した。あわせて、予約注文が6月25日に開始されることも告知された。6月18日の発表時点では、新しいトレーラーも価格の発表もなかったが、ファンの間ではカバーアートそのものが大きな話題になった。

長年のGTAファンが真っ先に目を向けたのは、主人公のジェイソン（Jason）でも、相棒のルシア（Lucia）でも、背景のヴァイスシティ（Vice City）でもなかった。カバーの左上に、ヘリコプターがいるかどうかだった。結論から言えば、いた。これは約25年続く、GTAシリーズの隠れた伝統である。

## 確認できる事実――25年続く「左上のヘリ」

このヘリコプターの配置は、GTA3（2001年）以降の3D／HD時代の主要タイトルのカバーアートで、ほぼ一貫して守られてきた。GTA3、Vice City、San Andreas、GTA4、GTA5、そして今回のGTA6。いずれもコラージュ（モザイク）式のデザインを採用しており、中央のロゴを囲むように複数のコマが並び、その左上にヘリが配置されている。

Rockstar がこの配置を公式に説明したことは一度もない。それでも作品ごとに繰り返されてきたため、ファンの間では「新作のカバーが出たら、まず左上を確認する」という一種の儀式になっている。

唯一の大きな例外として知られているのが、GTA Chinatown Wars（2009年、ニンテンドーDS／PSP）である。同作も同じコラージュ式デザインを採用しているにもかかわらず、左上にヘリがない。「Chinatown Wars ではヘリを操縦できなかったから」という説もあるが、GTA3も同様にヘリを操縦できないままカバーにはヘリが描かれているため、この説明には無理がある。なぜ Chinatown Wars だけ外れたのかは、はっきりしていない（この伝統と例外については Kotaku なども取り上げている）。

GTA6のカバー中央には主人公のジェイソン（Jason）とルシア（Lucia）が配置され、背景にはフロリダを思わせる明るい色調のヴァイスシティ（Vice City）が広がっている。ロゴ下にはワニが描かれており、舞台となる州レオニダ（Leonida）の湿地帯を象徴している。これらはカバー画像から直接確認できる範囲の事実である。

![GTA6の公式カバーアート。左上にヘリコプターが配置されている](/images/news/Official_Cover_Art_landscape.webp)

## 今回のヘリは何か――「Sea Sparrow」という見立て

ここからは、確認できる事実と、メディアやファンによる同定とを分けて扱う必要がある。

複数の海外メディア（Beebom や TechWiser など）や GTA 系のデータベースでは、左上のヘリを「Sea Sparrow（シースパロー）」と見る向きが強い。カバーに描かれているのは武装した Sea Sparrow である、という同定である。ただし、これは Rockstar が機体名を公式に明言したものではなく、あくまで外観からの推定である点には注意が必要だ。実際、一部の情報源は「警察ヘリ」と異なる見立てをしており、同定は完全には一致していない。現時点では Sea Sparrow 説が有力、という位置づけになる。

![カバー左上に配置されたヘリコプター（Sea Sparrowとみられる）](/images/news/helicopter/helicopter.webp)

その Sea Sparrow とは何か。これは過去作で実在する機体なので、事実として説明できる。[Grand Theft Wiki](https://www.grandtheftwiki.com/Sea_Sparrow) などのデータベースによれば、Sea Sparrow は GTA Vice City（2002年）に初登場した水陸両用ヘリコプターで、通常の Sparrow の改良版にあたる。着陸用のスキッドの代わりにポンツーン（フロート）を備えており、水上に着陸できる。機体の下部には機銃を搭載している。その後 San Andreas や Vice City Stories にも登場し、シリーズに馴染みのある機体となった。

なお、この Sea Sparrow は GTA6 のカバーで初めて姿を見せたわけではない。確認できる範囲では、トレーラー1（0:22付近）とトレーラー2（0:38付近）でも、ヴァイスビーチ上空を飛ぶ Sea Sparrow とみられる機体が映っている。

## 考察――なぜこの機体が「ふさわしい」のか

ここからはGTA6 FEEDによる考察である。

仮に左上のヘリが Sea Sparrow だとすると、その選択は単なる伝統の踏襲以上の意味を帯びる。GTA6 の舞台はフロリダをモデルにしたレオニダであり、海岸線や湿地帯といった水辺が大きな比重を占める。そこに水陸両用機を据えるのは、舞台に合った選択と言える。歴代カバーの左上には作品の雰囲気に合ったヘリが置かれてきたが、今回もその方針が踏襲されているとみられる。

水上に着陸できるという Sea Sparrow の特性が、水辺の多いマップと結びついて何らかの遊びにつながるのではないか、という期待がファンの間で語られている。ただし、これは推測にすぎない。Sea Sparrow という機体自体が水上着陸できるのは過去作からの事実だが、GTA6 でその機能がどう扱われるか、あるいはカスタマイズ要素があるかどうかは、公式には何も示されていない。「水上アクションが増える」「カスタム可能では」といった声は、現時点では願望の域を出ない。

カバーアートに描かれた一機のヘリから読み取れるのは、せいぜい「Rockstar が舞台に合わせた機体を選んだ可能性が高い」という程度である。そこから先のゲームプレイへの言及は、すべて推測として扱うのが妥当だ。

## なぜファンはこれで盛り上がるのか

このヘリ探しが盛り上がる理由は、機体の性能そのものよりも、ファン参加型の文化にある。新作のカバーが公開されるたびに、世界中のファンが一斉に左上を確認し、「今回もあった」と確認し合う。25年にわたって守られてきた一貫性が、「これはちゃんと GTA だ」という安心感につながっている。

GTA5 から GTA6 までは13年が空いた。これだけ間が空けば、Rockstar がカバーのデザインを刷新し、古い様式を捨てる可能性もあった。しかし、ふたを開けてみれば左上にはヘリがあった。伝統が守られていたこと自体が、長年のファンにとっては大きな意味を持っている。

## まとめ

確実に言えるのは、GTA6 のカバーアートが2026年6月18日に公開され、左上にヘリコプターが配置されている、という点である。これは GTA3 以降ほぼ全作で守られてきた伝統であり、唯一の例外は Chinatown Wars だった。

そのヘリが Sea Sparrow であるという見立ては有力だが、Rockstar の公式言明ではなく、外観からの同定である。Sea Sparrow が水陸両用機であることは過去作からの事実だが、その特性が GTA6 のゲームプレイにどう反映されるかは、まだ何も決まっていない。カバーアートから読み取れる範囲と、そこから広がる推測とは、切り分けて受け止めたい。

---

## 免責事項

本記事は、公開済みの GTA6 カバーアート、トレーラー、Rockstar の公式発表、海外メディア、GTA 関連データベースをもとに、GTA6 FEEDが独自に整理・考察したものである。左上のヘリを Sea Sparrow とする見立ては公式発表ではなく、外観からの推定である。Sea Sparrow が水陸両用機であることなどは過去作における事実だが、その特性が GTA6 でどう扱われるかを含め、ゲームプレイに関する記述は推測を含む。GTA6は未発売タイトルであり、内容は今後の公式発表によって変わる可能性がある。最新情報は Rockstar Games の公式発表を確認されたい。`,
  },
  {
    id: 21,
    title: "GTA6の天候は本当に「怖い」のか――確認された描写、リークされた構想、そして「カット説」",
    description:
      "舞台レオニダのモデル・フロリダはハリケーン多発地帯。トレーラーで確認できる天候描写、「動的天候システム」のリーク、そして「極端気象カット説」まで、事実・リーク・考察を分けて整理する。",
    icon: "🌀",
    image: "/images/news/hurricane.webp",
    category: "speculation",
    date: "2026-06-26",
    publishedAt: "2026-06-26 10:30",
    source: "GTA6 FEED 編集部",
    sourceUrl: "https://www.rockstargames.com/VI",
    relatedArticles: [20, 12, 15],
    aiSummary: [
      "舞台レオニダのモデル・フロリダはハリケーン多発地帯。トレーラーでは冠水した湿地グラスリバーズや雨に濡れた街、「Hurricane Roxy」表示が確認できる（解釈は割れる）。",
      "「動的天候システム」搭載説は求人票やリーク画像が根拠の推測。一方でハリケーン等の極端気象は「当初計画→カット」とするリークもあり、両説が並存している。",
      "確定はトレーラーの描写まで。天候が「演出」か「システム」かは未確定で、GTARPで天候が共有されれば災害RPの土台にも。GTA6は2026年11月19日発売予定。",
    ],
    titleEn:
      "Is GTA6's Weather Really Scary? Confirmed Depictions, Leaked Concepts, and the Cut Theory",
    descriptionEn:
      "Florida, the model for the setting of Leonida, is a hurricane-prone region. From the weather depictions confirmable in the trailers, to the leak of a dynamic weather system, to the theory that extreme weather was cut, we sort out fact, leak, and analysis.",
    aiSummaryEn: [
      "Florida, the model for the setting of Leonida, is a hurricane-prone region. In the trailers you can confirm the flooded Grassrivers wetlands, a rain-soaked city, and a Hurricane Roxy display (interpretations are divided).",
      "The theory that a dynamic weather system is included is speculation based on job listings and leaked images. On the other hand, there is also a leak claiming that extreme weather such as hurricanes was initially planned and then cut, so the two theories coexist.",
      "What is confirmed extends only to the depictions in the trailers. Whether the weather is staging or a system is undetermined, and if weather is shared in GTA RP it could also become a foundation for disaster RP. GTA6 is scheduled for release on November 19, 2026.",
    ],
    fullContentEn: `# Is GTA6's Weather Really Scary? Confirmed Depictions, Leaked Concepts, and the Cut Theory

Florida is one of the parts of America most frequently struck by hurricanes. Every year from June to November the hurricane season arrives, and each time one approaches, residents are forced to decide whether to evacuate. The fictional state of Leonida, the setting of GTA6, is modeled on that Florida. A stormy sky and a flooded city are inseparable from the story of this land.

So how far does GTA6 bring reality into its weather? Online, talk such as a hurricane is coming or the city will be submerged flies around, but much of it is not an official announcement but a leak or speculation. Here, we sort out the confirmable facts, the unverified leaks, and the analysis separately.

## This Far Can Be Confirmed: The Weather the Trailers Showed

First, let us confirm the range actually shown in the official trailers.

Trailer 1 (released December 2023) features a wetland area called Grassrivers, modeled on the Everglades. This perpetually flooded region is shown with residents traveling by fan boat (airboat), and creatures such as flamingos and alligators can also be confirmed. The depiction of traveling by boat across flooded land shows that Florida's natural environment has been dropped directly into the map's terrain.

![The flooded Grassrivers wetlands (modeled on the Everglades)](/images/news/Grassrivers_04.webp)

Trailer 2 (released May 2025) offers a more direct clue. In a bar scene, a Hurricane Roxy display can be confirmed in front of the bell on the counter. When GTA6 FEED examined analyses by overseas media, there were both a view that reads this as a hint of a storm (hurricane) and a view that it refers to Roxy, a character expected to appear later, so interpretations are divided. Note that since Roxy is also the name of a person expected to appear in the game, it does not necessarily mean a hurricane in the meteorological sense.

In addition, the night scene in Trailer 2 depicts the texture of a rain-soaked city, such as light reflecting off wet road surfaces. While these are material showing that the weather depiction has evolved from GTA5, they are strictly within the range of visual presentation, and nothing is shown about how they affect gameplay.

What can be said at this stage extends only to the point that Leonida is a land reflecting Florida's climate, and that rain and flooded terrain are depicted as part of the world.

## From Here On Are Leaks: The Rumors Around a Dynamic Weather System

From here on, we enter the realm of leaks and speculation that have not been officially confirmed.

There is a persistent theory in the community that GTA6 might include a dynamic weather system that affects gameplay in real time. The grounds cited for this are mainly fragments like the following.

One is what is said to be a Rockstar job listing. In a posting for a Senior Environmental Systems Programmer, experience with dynamic weather simulation and real-time environmental interaction was sought, as pointed out by community investigation. Another is a statement to the effect, made in a developer interview, of immersive environmental storytelling where weather affects both the world and the player's decisions.

Furthermore, there is information that a screenshot of a mission screen said to have leaked included warning displays such as severe thunderstorms and heatwave conditions. If these are true, the possibility emerges that weather functions not merely as a backdrop but as a condition of missions.

However, all of these are not primary sources but speculation based on the wording of job listings and leaked images. Even if such wording existed in a job posting, that is not proof it was implemented in GTA6.

## An Easily Overlooked Point: The Theory That Extreme Weather Was Cut

Here, we also need to introduce a leak that is the exact opposite of the tone that anticipates hurricanes. Ignoring it would skew the discussion in one direction.

Rockstar Universe, a source said to be knowledgeable about GTA6, claims that extreme weather such as hurricanes and tornadoes was initially planned but was later cut. Whether this was due to technical constraints or some other reason is said to be unknown. The overseas outlet ComicBook has also reported this claim.

There is also a development-side rationale pointed out for the view that it was cut. If hurricanes and tornadoes occur randomly in an open world, there may be surprise at first, but as they repeat, they could end up hindering the freedom of play. For example, if you suddenly become unable to move because of a flood while fleeing from the police, it could become simply unreasonable rather than tense. For that reason, there is also an analysis that extreme weather can be used effectively precisely in specific, staged scenes.

In other words, at this point the leak that a dynamic weather system will be included and the leak that extreme weather was cut coexist. Which is correct will not be settled until Rockstar itself shows us.

## Analysis: The Boundary Between Staging and System

From here on is analysis by GTA6 FEED.

If weather were to function as a full-fledged system, its significance would be great. Rain makes road surfaces slippery, robs you of visibility, flooding blocks roads, and NPCs begin to evacuate. When such elements combine, weather changes from something to look at into something to deal with. The previous game, Red Dead Redemption 2, heightened immersion by weaving weather such as fog, wind, rain, and snow into the world, so there is a foundation for Rockstar to advance further along that line.

On the other hand, what the aforementioned cut theory suggests is the possibility that Rockstar is cautious about the balance between realism and playability. Implementing realistic hurricanes and shaping them into a form players can enjoy are separate problems. Using flooding and torrential rain as staging that occurs only in specific missions or story climaxes, rather than as a random event that always occurs, is less likely to break down as an experience.

As long as Leonida is modeled on Florida, incorporating the feel of storms into the world is itself natural. The question is the depth of it. Will it be beautifully depicted as a backdrop, or will it go as far as a system that changes the conditions of play? What is visible in the trailers extends only to the former, while the latter remains at the stage of leaks and wishful thinking.

## The Impact on GTA RP: If Weather Were Shared

Considered from the perspective of roleplay (RP), the imagination expands even further. This too is not a confirmed fact but strictly a matter of possibility.

If the same weather were shared across an entire server, and on a stormy night every player were placed in the same situation, a natural disaster itself could become an RP scenario. Developments such as evacuation, rescue, and post-disaster chaos could occur naturally as a consequence of the weather system, rather than as an operator-run event. In the GTA5 RP environment, scenes where weather influenced the experience were limited, so if this were realized, it could become a foundation for a new way to play.

However, this is a story that only holds up once the premise that weather affects gameplay is established. We want to emphasize again that the premise itself does not yet go beyond the realm of a leak.

## Summary

What can be said for certain at this point extends only to the fact that Leonida is a land reflecting Florida's climate, and that flooded wetlands and a rain-soaked city are depicted in the trailers. As for a dynamic weather system or extreme weather, both leaks that support it and leaks that deny it exist, and it is not settled.

GTA6 is scheduled for release on November 19, 2026, for PS5 and Xbox Series X|S (at the time Trailer 2 was released it was given as May 26, 2026, but it was subsequently delayed). After release, when the rain begins to fall, how far that sky will move the world is what we want to watch.

---

## Disclaimer

This article is an independent compilation and analysis by GTA6 FEED, based on the published trailers, overseas media reports, and leak information from the community.

- The content described as depictions in the trailers is fact within the range that can be confirmed in the official footage.
- The job listings, the screenshot said to have leaked, and the extreme weather cut theory by Rockstar Universe are all unverified leaks and speculation, not official announcements by Rockstar Games. There is no guarantee they will be reflected in the final product.
- The boundary between staging and system and the impact on GTA RP are analysis by GTA6 FEED, not confirmed information.
- GTA6 is an unreleased title, and the content of this article may change with future official announcements.

For the latest information, please check the official announcements from Rockstar Games.`,
    fullContent: `# GTA6の天候は本当に「怖い」のか――確認された描写、リークされた構想、そして「カット説」

フロリダ州は、アメリカでもっともハリケーンに襲われる土地のひとつである。毎年6月から11月にかけてハリケーンシーズンが訪れ、住民は接近のたびに避難の判断を迫られる。GTA6の舞台となる架空の州レオニダ（Leonida）は、そのフロリダをモデルにしている。荒れる空と冠水する街は、この土地の物語と切り離せない。

では、GTA6の天候はどこまで「現実」を持ち込んでくるのか。ネット上では「ハリケーンが来る」「街が水没する」といった話が飛び交っているが、その多くは公式発表ではなく、リークや推測である。ここでは、確認できる事実、未確認のリーク、そして考察を分けて整理する。

## ここまでは確認できる――トレーラーが見せた天候

まず、公式トレーラーで実際に映っている範囲を確認しておきたい。

トレーラー1（2023年12月公開）には、エバーグレーズをモデルにした湿地帯「グラスリバーズ（Grassrivers）」が登場している。恒常的に冠水したこの地域を、住人がファンボート（エアボート）で移動する様子が映され、フラミンゴやワニといった生き物も確認できる。冠水した土地を船で行くという描写は、フロリダの自然環境がそのままマップの地形に落とし込まれていることを示している。

![冠水した湿地帯「グラスリバーズ」（エバーグレーズがモデル）](/images/news/Grassrivers_04.webp)

トレーラー2（2025年5月公開）では、より直接的な手がかりがある。バーのシーンで、カウンターのベルの前に「Hurricane Roxy」という表示が確認できる。GTA6 FEEDが海外メディアの分析を調査したところ、これを「嵐（ハリケーン）の暗示」と読む見方と、「Roxy という今後登場するキャラクターを指している」とする見方の両方があり、解釈は割れている。なお Roxy はゲーム内に登場が見込まれる人物名でもあるため、必ずしも気象としてのハリケーンを意味するとは限らない。

加えてトレーラー2の夜のシーンでは、濡れた路面に光が反射する描写など、雨に濡れた街の質感が描かれている。これらは「天候表現がGTA5から進化している」ことを示す材料ではあるが、あくまで映像表現の範囲であり、ゲームプレイにどう影響するかまでは映っていない。

この段階で言えるのは、レオニダがフロリダの気候風土を反映した土地であり、雨や冠水した地形が世界観の一部として描かれている、という点までである。

## ここからはリーク――「動的天候システム」をめぐる噂

ここから先は、公式に確認されていないリークと推測の領域に入る。

GTA6には「リアルタイムでゲームプレイに影響する動的天候システム」が搭載されるのではないか、という説がコミュニティで根強い。その根拠として挙げられているのは、主に次のような断片である。

ひとつは、Rockstar の求人情報とされるものだ。「Senior Environmental Systems Programmer（上級環境システムプログラマー）」の募集で、「動的な天候シミュレーションとリアルタイムの環境インタラクション」の経験が求められていた、とコミュニティの調査で指摘されている。もうひとつは、開発者インタビューでの「天候が世界とプレイヤーの判断の両方に影響する、没入感のある環境的ストーリーテリング」という趣旨の発言である。

さらに、リークされたとされるミッション画面のスクリーンショットには、「激しい雷雨（severe thunderstorms）」「熱波（heatwave conditions）」といった警告表示が含まれていた、という情報もある。これらが事実なら、天候は単なる背景ではなく、ミッションの条件として機能する可能性が出てくる。

ただし、これらはいずれも一次情報ではなく、求人票の文言やリーク画像をもとにした推測である。求人にそうした文言があったとしても、それがGTA6に実装されたことの証明にはならない。

## 見落とされがちな論点――「極端気象はカットされた」という説

ここで、ハリケーンを期待する論調とは正反対のリークも紹介しておく必要がある。これを無視すると、話が一方向に偏ってしまう。

GTA6に詳しいとされる情報源 Rockstar Universe は、ハリケーンや竜巻といった「極端気象（extreme weather）」が当初は計画されていたものの、後にカットされたと主張している。技術的な制約によるものか、別の理由かは不明とされる。海外メディア ComicBook もこの主張を報じている。

カットされたとする見方には、開発上の合理性も指摘されている。ハリケーンや竜巻がオープンワールドにランダムに発生すると、最初は驚きがあっても、繰り返されるうちにプレイの自由を阻害しかねない。たとえば警察から逃走している最中に突然洪水で動けなくなれば、緊張感どころか単なる理不尽になりうる。そのため「極端気象は、特定の演出されたシーンでこそ効果的に使える」という分析もある。

つまり現時点では、「動的天候システムは搭載される」というリークと、「極端気象はカットされた」というリークが並存している。どちらが正しいかは、Rockstar 自身が示すまで確定しない。

## 考察――「演出」と「システム」の境界線

ここからはGTA6 FEEDによる考察である。

仮に天候が本格的なシステムとして機能するなら、その意味は大きい。雨で路面が滑り、視界が奪われ、冠水で道がふさがれ、NPCが避難を始める。こうした要素が組み合わさると、天候は「眺めるもの」から「対処するもの」へと変わる。前作 Red Dead Redemption 2 は、霧・風・雨・雪といった天候を世界に織り込むことで没入感を高めており、Rockstar がその延長線上をさらに進める下地はある。

一方で、前述の「カット説」が示すのは、Rockstar が realism（リアルさ）と遊びやすさのバランスに慎重だという可能性である。リアルなハリケーンを実装することと、それをプレイヤーが楽しめる形に落とし込むことは別の問題だ。冠水や豪雨を「常時発生するランダムイベント」ではなく、「特定のミッションや物語の山場でだけ起きる演出」として使うほうが、体験としては破綻しにくい。

レオニダがフロリダをモデルにしている以上、嵐の気配を世界観に取り込むこと自体は自然だ。問題はその深さである。背景として美しく描くのか、それともプレイの条件を変えるシステムにまで踏み込むのか。トレーラーで見えているのは前者までで、後者はまだリークと願望の段階にとどまっている。

## GTARPへの影響――もし天候が共有されるなら

ロールプレイ（RP）の視点で考えると、想像はさらに広がる。これも確認された事実ではなく、あくまで可能性の話である。

仮にサーバー全体で同じ天候が共有され、嵐が来る夜にプレイヤー全員が同じ状況に置かれるとしたら、自然災害そのものがRPのシナリオになりうる。避難、救助、災害後の混乱といった展開が、運営側のイベントとしてではなく天候システムの帰結として自然発生する可能性がある。GTA5の RP 環境では天候が体験を左右する場面は限られていたため、もしこれが実現すれば新しい遊び方の土台になる。

ただし、これは天候がゲームプレイに影響するという前提が成立して初めて成り立つ話だ。その前提自体がまだリークの域を出ていない点は、改めて強調しておきたい。

## まとめ

現時点で確実に言えるのは、レオニダがフロリダの気候を反映した土地であり、冠水した湿地や雨に濡れた街がトレーラーで描かれている、という点までである。動的天候システムや極端気象については、それを支持するリークと否定するリークが両方存在し、確定していない。

GTA6は2026年11月19日に PS5・Xbox Series X|S 向けに発売が予定されている（トレーラー2公開時点では2026年5月26日とされていたが、その後延期された）。発売後、雨が降り始めたとき、その空がどこまで世界を動かすのか――そこに注目したい。

---

## 免責事項

本記事は、公開済みのトレーラー、海外メディアの報道、およびコミュニティによるリーク情報をもとに、GTA6 FEEDが独自に整理・考察したものである。

- トレーラーの描写として記載した内容は、公式映像で確認できる範囲の事実である。
- 求人情報、リークされたとされるスクリーンショット、Rockstar Universe による「極端気象カット説」などは、いずれも未確認のリーク・推測であり、Rockstar Games による公式発表ではない。最終製品に反映される保証はない。
- 「演出とシステムの境界」「GTARPへの影響」などは、GTA6 FEEDによる考察であり、確定情報ではない。
- GTA6は未発売タイトルであり、本記事の内容は今後の公式発表によって変わる可能性がある。

最新情報は Rockstar Games の公式発表を確認されたい。`,
  },
  {
    id: 20,
    title: "GTA6が予約開始——確定した事実と、飛び交うリーク・憶測を切り分ける",
    description:
      "6月25日0時に予約開始＆価格公開。SNSの反応や各社の売上予測、6/15のゲームプレイ流出疑惑まで、確定情報とリーク・憶測を信頼度ごとに整理する。",
    icon: "🛒",
    image: "/images/news/sinjitutokonton.webp",
    category: "speculation",
    date: "2026-06-25",
    source: "GTA6 FEED 編集部",
    sourceUrl: "https://www.rockstargames.com/VI",
    relatedArticles: [19, 18, 17],
    aiSummary: [
      "6月25日0時に予約開始。日本版は通常9,800円／アルティメット12,280円、海外79.99／99.99ドル、発売は11月19日。",
      "公式前の価格リークは正確・不正確が混在、6/15のゲームプレイ流出疑惑はほぼ偽物との見方が有力。",
      "予約1時間で10億ドル等の売上規模は各社の予測値。第3弾トレーラーやオンラインの時期は未確定。",
    ],
    titleEn: "GTA6 Pre-Orders Are Live: Separating Confirmed Facts From the Swirl of Leaks and Speculation",
    descriptionEn:
      "Pre-orders opened and prices went live at midnight on June 25. We sort the confirmed facts from leaks and speculation by reliability, covering social reactions, analyst sales forecasts, and the June 15 gameplay leak controversy.",
    aiSummaryEn: [
      "Pre-orders opened at midnight on June 25. The Japanese version is 9,800 yen for Standard and 12,280 yen for Ultimate; overseas it is 79.99 / 99.99 dollars, with a November 19 release.",
      "Pre-launch price leaks were a mix of accurate and inaccurate figures, and the June 15 gameplay leak is widely viewed as almost certainly fake.",
      "Sales figures like 1 billion dollars in the first hour of pre-orders are analyst forecasts. The third trailer and the timing of online are still unconfirmed.",
    ],
    fullContentEn: `# GTA6 Pre-Orders Are Live: Separating Confirmed Facts From the Swirl of Leaks and Speculation

At midnight on June 25, 2026 (local time), pre-orders for Grand Theft Auto VI (GTA6) opened worldwide. Regional prices were revealed at the same time, and social media is overflowing with pre-order reports and debate. Yet in the middle of such a frenzy, it is easy for officially confirmed information to get mixed up with unverified leaks and wishful speculation. GTA6 FEED has sorted the activity around the pre-order launch by level of reliability.

This article is based on information as of June 25, 2026.

---

## Confirmed Facts: Pre-Orders Open and Pricing

Pre-orders began at midnight on June 25 (local time) on the PlayStation Store, the Microsoft Store, and elsewhere. The Japanese version is priced at 9,800 yen for the standard edition and 12,280 yen for the Ultimate Edition (both tax included), while overseas pricing is 79.99 dollars / 99.99 dollars. Release is set for November 19, 2026, for PS5 and Xbox Series X|S, with no PC version announced yet.

Details such as the breakdown of editions, pre-order bonuses, and physical edition specifications are [covered separately on GTA6 FEED](/news/19), so this article focuses on the reaction to the pre-order launch itself and on verifying the leaks and speculation circulating around it.

---

## Reactions: How Social Media and the Market Received It

Right after pre-orders opened, related posts surged on X (formerly Twitter), Reddit, YouTube, Instagram, and elsewhere, and reports of completed pre-orders poured in one after another. In the Japanese-speaking community as well, pre-order reports and videos explaining the contents of the Ultimate Edition are spreading. Plenty of people say they pre-ordered first even though they do not own a PS5 yet, or that they bought the Ultimate Edition without hesitation.

The fans' reactions are tinged with the elation of a long wait finally ending. Comments like the following are lining up.

- I went ahead and pre-ordered. Take my money.
- Ten years of waiting was worth it.
- That settles what I am doing this summer.
- This is my first time pre-ordering digitally, but for GTA6 I will make an exception.

On the other hand, there is also a fair amount of level-headed criticism and dissatisfaction.

- It is steep to charge 80 to 100 dollars when there is not even gameplay footage out yet.
- It is a shame the package does not include a disc.
- The contents of the Ultimate Edition lean toward cosmetics, which feels underwhelming.

Even so, the overall mood is one of grumbling and then pre-ordering anyway, and the enthusiasm itself has not faded.

Attention is high on the market side too. However, note that all of the sales figures cited below are forecasts and estimates by analysts and industry insiders, not confirmed numbers.

- Take-Two has indicated net bookings of 8.0 to 8.2 billion dollars for fiscal year 2027 in its official guidance, positioning GTA6 as the main driver (this is the company's official outlook).
- Insider Tom Henderson has said that the first hour of pre-orders alone could reach a scale of about 1 billion dollars (the equivalent of 12 to 14 million units, not 120,000 to 140,000 units).
- Research firm DFC Intelligence forecasts 40 million units and 3.2 billion dollars in total revenue in the first year, with over 1 billion dollars from pre-orders alone.
- Investment bank Piper Sandler projects 45 to 46 million units on launch day, while Konvoy projects 85 million units within 60 days of release.

For reference, the previous game GTA5 has sold over 200 million units worldwide (per Rockstar's official figure; recent reports put it at roughly 230 million units), and cumulative GTA series sales are said to exceed 470 million units (Take-Two). The view that GTA6 will break these records is strong, but it remains a forecast.

---

## Leaks and Rumors Around the Pre-Order Launch (Mind the Reliability)

Before and after pre-orders opened, several pieces of unverified information spread. They need to be handled separately from the facts.

### Price Leaks

Before the official announcement, prices for various countries leaked from European and other retail listings, becoming a major topic. Some figures ended up close to the official prices (79.99 dollars for the standard edition / 99.99 dollars for the Ultimate Edition), while off-the-mark numbers such as 90 dollars for the standard edition and 199 euros for a collector's edition were also mixed in. In the end, prices were confirmed by the official announcement, and the leaked figures were a blend of accurate and inaccurate ones.

### The Gameplay Leak Controversy

On June 15, 2026, a small YouTube channel with around 50 subscribers streamed something titled GTA6 Walkthrough Gameplay, and Take-Two immediately issued a copyright takedown. The speed of the removal fueled speculation that it might be genuine footage, but the stream had only a few views and almost no one was able to confirm its contents. GTA6 mapping enthusiasts pointed out that it was likely a reuse of the large 2022 leak footage (which automatically triggers copyright detection when posted), and noted that the account in question had previously posted fake leaks. Several outlets have also rated it as almost certainly fake, and the mere fact that something was taken down is not proof that the footage is real.

As a general caution, many of the GTA6 leaks circulating in 2025 and 2026 are AI-generated footage, GTA5 mod footage, reused 2022 leak clips, or fabricated images. It is best not to take at face value any information whose source cannot be traced.

---

## Analysis (Speculation)

From here on are interpretations by fans and observers based on the confirmed information, and they do not go beyond speculation.

- Based on the contents of the Ultimate Edition, some analyses suggest that many of the vehicles and weapons may only be usable in the late stages of the game, and that dedicated missions and elements such as raiding gang hideouts and recovering classic cars may be prepared. These are guesses in line with the official descriptions, but the actual conditions of use need to be confirmed after release.
- Regarding online features, Rockstar is putting the single-player experience front and center this time, and the timing and form of GTA6's online mode have not been announced. Be careful not to confuse the GTA+ pre-order bonus, which is strictly for the current (GTA5-generation) GTA Online.
- A third trailer has not been officially announced. Take-Two CEO Zelnick has said marketing will ramp up in the summer, and information is expected to keep being unveiled up to launch, but the specific timing has not been confirmed.

---

## Summary: Sorting by Reliability

Confirmed facts:

- Pre-orders opened at midnight on June 25 (local time). The Japanese version is 9,800 yen for the standard edition / 12,280 yen for Ultimate (tax included), and overseas it is 79.99 dollars / 99.99 dollars.
- Release on November 19 (PS5 / Xbox Series X|S), with no PC version announced.
- Take-Two's official guidance is FY2027 net bookings of 8.0 to 8.2 billion dollars.

Unverified and rumored (mind the reliability):

- Pre-launch price leaks (a mix of accurate and off-the-mark figures).
- The June 15 gameplay leak controversy (widely viewed as almost certainly fake).

Speculation and forecasts:

- Sales forecasts by various analysts (1 billion dollars in the first hour of pre-orders, 40 million units and 3.2 billion dollars in the first year, and so on).
- Fan analysis of the Ultimate Edition contents, the timing and form of online, and the release timing of the third trailer.

As a note of caution, GTA6 is unreleased as of the writing of this article. Be wary of videos and articles that pretend to have played the game and make definitive claims about its contents, of leaks of unknown origin, and of scams on unofficial sites that offer pre-order proxy services or demand advance payments. Place pre-orders through official digital stores or authorized retailers, and check the latest information on the official Rockstar Games site (rockstargames.com/VI) and on each store's listings.`,
    fullContent: `# GTA6が予約開始——確定した事実と、飛び交うリーク・憶測を切り分ける

2026年6月25日午前0時(現地時間)、『グランド・セフト・オートVI(GTA6)』の予約受付が世界で始まった。同時に各地域の価格が公開され、SNSは予約報告と議論であふれている。ただし、こうした祭りのなかでは、公式に確定した情報と、未確認のリークや願望まじりの憶測が混ざりやすい。GTA6 FEEDが、予約開始前後の動きを信頼度ごとに整理した。

本記事は2026年6月25日時点の情報にもとづく。

---

## 確定した事実:予約開始と価格

予約は6月25日午前0時(現地時間)、PlayStation StoreやMicrosoft Storeなどで開始された。日本版は通常版9,800円、アルティメット・エディション12,280円(いずれも税込)、海外は79.99ドル/99.99ドル。発売は2026年11月19日でPS5とXbox Series X|S向け、PC版は未発表となっている。

エディションの内訳や予約特典、物理版の仕様といった詳細は[GTA6 FEEDで別途整理している](/news/19)ため、本記事では予約開始という出来事への反応と、その周辺で流れたリーク・憶測の検証に焦点を絞る。

---

## 反応:SNSと市場の受け止め

予約開始直後から、X(旧Twitter)やReddit、YouTube、Instagramなどでは関連投稿が急増し、予約完了の報告が相次いだ。日本語圏でも予約報告や、アルティメット・エディションの内容を解説する動画が広がっている。PS5本体をまだ持っていないのに先に予約した、アルティメットを迷わず購入した、といった声も少なくない。

ファンの反応には、長い待機を経た高揚がにじむ。次のような声が並ぶ。

- 「とりあえず予約した。Take my money だ」
- 「10年待った甲斐があった」
- 「これで今年の夏が決まった」
- 「初めてデジタルで予約したけど、GTA6のためなら……」

一方で、冷静な指摘や不満も一定数ある。

- 「まだゲームプレイ映像も出ていないのに80〜100ドルは高い」
- 「パッケージにディスクが入っていないのは残念」
- 「アルティメットの中身がコスメ寄りで微妙」

もっとも、全体の空気は「文句を言いながらも結局は予約する」というもので、熱量そのものは衰えていない。

市場の側でも注目度は高い。ただし、ここから先に挙げる売上規模の数字は、いずれもアナリストや業界関係者による予測・推計であり、確定値ではない点に注意が必要だ。

- Take-Twoは2027会計年度のネットブッキングを80億〜82億ドルと公式ガイダンスで示しており、GTA6をその主要な牽引役と位置づけている(これは会社の公式見通し)。
- インサイダーのTom Hendersonは、予約開始から最初の1時間だけで10億ドル規模(12〜14万本ではなく1,200万〜1,400万本相当)に達しうると述べている。
- 調査会社DFC Intelligenceは初年度4,000万本・総収益32億ドル、うち予約だけで10億ドル超と予測。
- 投資銀行Piper Sandlerは発売日に4,500万〜4,600万本、Konvoyは発売60日で8,500万本という見方を示している。

参考までに、前作GTA5は全世界で2億本以上を売り上げており(Rockstar公式表記、近年の報道では約2億3,000万本)、GTAシリーズ累計は4億7,000万本超(Take-Two)とされる。GTA6がこれらの記録を更新するという見方は強いが、あくまで予測である。

---

## 予約前後のリーク・噂(信頼度に注意)

予約開始の前後では、いくつかの未確認情報が拡散した。事実と切り分けて扱う必要がある。

### 価格リーク

公式発表前に、ヨーロッパなどの小売リストを発端に各国の価格が流出し、大きな話題となった。結果的に公式価格(通常版79.99ドル/アルティメット99.99ドル)に近い数字もあった一方、「通常版90ドル」「コレクターズ版199ユーロ」といった外れの数字も混在していた。最終的には公式発表によって価格が確定した形であり、リーク段階の数字には正確なものと不正確なものが入り混じっていた。

### ゲームプレイ流出疑惑

2026年6月15日、登録者数が50人程度の小規模なYouTubeチャンネルが「GTA6 Walkthrough Gameplay」と題した配信を行い、Take-Twoが即座に著作権削除を行った。削除の速さから「本物の映像ではないか」という憶測が広がったが、この配信は再生数が数回にとどまり、内容を確認できた人はほとんどいない。GTA6のマッピング有志は、2022年の大規模流出映像(投稿すると自動で著作権検知される)の使い回しの可能性を指摘し、当該アカウントが過去に偽のリークを投稿していた点にも触れている。複数のメディアも「ほぼ偽物」と評価しており、削除されたという事実そのものは映像が本物である証明にはならない。

一般的な注意として、2025〜2026年に出回るGTA6「リーク」の多くは、AI生成映像、GTA5のMOD映像、2022年流出クリップの再利用、あるいは捏造された画像である。出所をたどれない情報は鵜呑みにしないことが望ましい。

---

## 考察(推測)

ここからは、確定情報をもとにしたファンや観測筋の解釈であり、推測の域を出ない。

- アルティメット・エディションの内容から、「終盤のステージでしか使えない車両・武器が多いのではないか」「ギャング拠点の襲撃やクラシックカーの回収など、専用の依頼・要素が用意されるのではないか」という分析が出ている。公式の説明文に沿った推測ではあるが、実際の使用条件は発売後に確認する必要がある。
- オンライン要素について、Rockstarは今回シングルプレイヤー体験を前面に出しており、GTA6のオンラインモードの時期や形態は発表されていない。予約特典のGTA+はあくまで現行(GTA5世代)のGTA Online向けである点を取り違えないようにしたい。
- 第3弾トレーラーは公式に告知されていない。Take-TwoのZelnick CEOは夏にマーケティングを本格化させると述べており、発売まで情報解禁が続くとみられるが、具体的な公開時期は確定していない。

---

## まとめ:信頼度の整理

確定している事実:

- 予約開始6月25日0時(現地時間)。日本版は通常版9,800円/アルティメット12,280円(税込)、海外は79.99ドル/99.99ドル。
- 発売11月19日(PS5/Xbox Series X|S)、PC版は未発表。
- Take-Twoの公式ガイダンスはFY2027ネットブッキング80億〜82億ドル。

未確認・噂(信頼度に注意):

- 公式前の価格リーク(正確な数字と外れた数字が混在)。
- 6月15日のゲームプレイ流出疑惑(ほぼ偽物との見方が有力)。

推測・予測:

- 各社アナリストによる売上予測(予約1時間で10億ドル、初年度4,000万本・32億ドルなど)。
- アルティメット内容に関するファン考察、オンラインの時期・形態、第3弾トレーラーの公開時期。

注意点として、GTA6は本記事執筆時点で未発売である。プレイ済みを装ってゲーム内容を断定する映像・記事や、出所不明のリーク、予約代行・前金を求める非公式サイトの詐欺には注意が必要だ。予約は公式のデジタルストアや正規小売を通じて行い、最新の情報はRockstar Games公式サイト(rockstargames.com/VI)および各ストアの表示で確認することが望ましい。`,
  },
  {
    id: 19,
    title:
      "GTA6のエディションと予約特典まとめ——6月25日0時予約開始、Standard 79.99ドル／Ultimate 99.99ドルで公式確定",
    description:
      "Rockstarが6/24に公式発表。GTA6はStandard 79.99ドル／Ultimate 99.99ドル、予約開始は6/25。全員特典「Vintage Vice City Pack」やUltimate限定コンテンツ、注意点まで整理する。",
    icon: "💰",
    image: "/images/news/edition/ultimateedition.webp",
    category: "release",
    date: "2026-06-24",
    source: "GTA6 FEED 編集部",
    sourceUrl: "https://www.rockstargames.com/VI",
    relatedArticles: [17, 18, 1],
    aiSummary: [
      "予約は6月25日0時開始、発売は11月19日（PS5／Xbox）。価格はStandard 79.99ドル／Ultimate 99.99ドルで公式確定。",
      "全予約者にVintage Vice City Pack、デジタル予約はGTA+1か月無料（物理版は対象外）。Ultimate特典は章進行で順次解放。",
      "日本円の正式価格やコレクターズ版は未発表。ストア表記はオフライン対応・1人用で、発売直後はシングルプレイヤー中心とみられる。",
    ],
    titleEn:
      "GTA6 Editions and Pre-Order Bonuses Explained: Pre-Orders Open at Midnight on June 25, Officially Confirmed at $79.99 for Standard and $99.99 for Ultimate",
    descriptionEn:
      "Rockstar made the official announcement on June 24. GTA6 is priced at $79.99 for Standard and $99.99 for Ultimate, with pre-orders opening June 25. We break down the Vintage Vice City Pack available to everyone, the Ultimate-exclusive content, and the key points to watch out for.",
    aiSummaryEn: [
      "Pre-orders open at midnight on June 25, with release on November 19 (PS5/Xbox). Pricing is officially confirmed at $79.99 for Standard and $99.99 for Ultimate.",
      "Every pre-order gets the Vintage Vice City Pack, and digital pre-orders include one free month of GTA+ (physical editions are excluded). Ultimate bonuses unlock progressively as the story advances.",
      "The official yen price and any collector's edition remain unannounced. Store listings note offline support and single-player, suggesting the launch will be focused on single-player.",
    ],
    fullContentEn: `# GTA6 Editions and Pre-Order Bonuses Explained: Pre-Orders Open at Midnight on June 25, Officially Confirmed at $79.99 for Standard and $99.99 for Ultimate

On June 24, 2026, Rockstar Games officially announced the edition lineup, pricing, and pre-order bonuses for Grand Theft Auto VI (GTA6) on its official website and via Newswire. With pre-orders set to open the next day on June 25, the pricing and edition details that had until now been swirling around in leaks and rumors finally arrived as confirmed information. GTA6 FEED has organized the key points based on the official announcement.

This article is based on information as of June 24, 2026. All pricing and bonuses are confirmed information based on Rockstar's official announcement, but some unannounced items such as the yen price are distinguished in the notes at the end.

![Announcement from the official Rockstar Games X account (@RockstarGames)](/images/news/edition/kousikix.webp)

---

## Basic Information

- **Release date**: November 19, 2026. Supported platforms are PS5 and Xbox Series X|S. Rockstar is presenting it as a single-player experience.
- **Pre-order start**: June 25, 2026, from midnight local time. Accepted through digital stores such as the PlayStation Store, Microsoft Store, and Rockstar Games Store, as well as some retailers.
- **Preload**: From November 12. This is one week before release, and downloads can begin on the same day for both digital and physical editions.

---

## Pre-Orders Confirmed Live on the PlayStation Store (SONY)

At midnight on June 25, 2026, when pre-orders went live, the GTA6 pre-order page appeared on the PlayStation Store (SONY store), and GTA6 FEED confirmed that it was actually possible to place an order. Both the Standard Edition and Ultimate Edition are listed, and the pre-order bonus descriptions can also be seen.

Pre-orders can be placed from each store's official page.

- PlayStation: [PS Store Grand Theft Auto VI](https://www.playstation.com/ja-jp/games/grand-theft-auto-vi/)
- Xbox: [Microsoft Store Grand Theft Auto VI](https://www.xbox.com/en-US/games/store/grand-theft-auto-vi/9nl3wwnzlzzn)

Another detail worth noting is the product information listed in the stores. Both stores describe GTA6 as supporting offline play and having a player count of one (single-player). Reading that listing at face value, at least in the immediate post-launch phase online multiplayer would not be included, and it is highly likely the game will first be delivered as a single-player experience. This also aligns with Rockstar putting single-player front and center in this announcement.

That said, this is only GTA6 FEED's speculation based on the store listings and Rockstar's announcement. There has been no official statement from Rockstar regarding whether an online mode exists or when it might be implemented. We will need to wait for further news, including the possibility that a system equivalent to GTA Online could be added later.

![GTA6 pre-order page on the PlayStation Store (SONY)](/images/news/edition/sonystore-yoyaku-01.webp)

![GTA6 pre-order page on the PlayStation Store (SONY)](/images/news/edition/sonystore-yoyaku-02.webp)

---

## Pricing and Editions

There are two editions, with the higher-tier Ultimate Edition being the top of the line. No additional editions such as a collector's edition have been announced.

- **Standard Edition**: $79.99
- **Ultimate Edition**: $99.99

As supplementary information on pricing, the following points have been officially confirmed.

- The physical edition does not include a disc; instead, a download code is enclosed inside the box. No disc version will be offered. The physical edition is also available from November 12 and supports preload.
- Standard Edition owners can also purchase an upgrade to the Ultimate Edition later, and it can be added at any time, including after release. Even if you do not choose the higher tier right now, you can unlock the content afterward.

![Ultimate Edition details](/images/news/edition/ultimateeditionsyousai.webp)

---

## The Vintage Vice City Pack Available to Everyone as a Pre-Order Bonus

Regardless of edition, everyone who pre-orders or purchases by November 20, 2026 will receive the Vintage Vice City Pack, which evokes 1980s Vice City (for physical editions, while stocks last). The main contents are as follows.

- **Vehicle and garage**: The classic Vapid Stanier sedan (1955 model) and the Shore Court private garage near Ocean Beach
- **Appearance**: Period-style costumes and hairstyles for Jason and Lucia
- **Weapon patterns**: A tropical palm-tree pattern symbolizing Tommy Vercetti (applicable to many guns)

![Jason and Lucia](/images/news/edition/Jason＆rusia.webp)

In addition, if you pre-order the digital edition on the PlayStation Store or Microsoft Store, you also get one free month of GTA+. This is a benefit usable in the current GTA Online (GTA5 generation), and it includes a GTA$500,000 deposit and access to the game library. Note that the physical edition (code enclosed) is excluded from this free GTA+ benefit.

---

## Ultimate Edition Additional Content

The Ultimate Edition bonuses are not all granted at once; instead, they are scattered throughout Jason and Lucia's overall story and unlock progressively as the chapters advance. We have organized the officially released content by category.

### Vehicles and Watercraft

- **Grotti Cheetah (1995 model)** ... a classic Grotti sports car
- **Vapid Dominator Buggy (1967 model) and the Paradise Garage** ... the Watson Bay garage comes with a weapon locker and stolen-goods storage space
- **Shitzu Squalo** ... a watercraft moored at Washington Beach
- **Jason's safehouse vehicles** ... the military-style Dinka Enduro motorcycle and the Crest Kayak

![Grotti Cheetah (1995 model)](/images/news/edition/gurottexiti-ta-.webp)

![Vapid Dominator Buggy (1967 model)](/images/news/edition/vapiddodomine-ta5.webp)

![Shitzu Squalo](/images/news/edition/sittusukuaro.webp)

![Jason's safehouse vehicles](/images/news/edition/jeisonnokakureganonorimono.webp)

### Weapons

- **Hawk & Little Morgan Revolver** ... a Vice City-style His & Hers pair
- **Dedicated custom pistols** ... variations with special engravings on Jason's Girardi ES9 and Lucia's Klauke K17

![Hawk & Little Morgan Revolver](/images/news/edition/ho-kuandoritorumo-ganriboruba.webp)

![Variations of the dedicated custom pistols](/images/news/edition/senyoubarie-syon.webp)

### Appearance and Apparel

- **Vice City-style costumes and tattoos**
- **Good Time Goods** ... apparel themed around the popular TV show character Macca the Gator

![Vice City-style appearance](/images/news/edition/baisusitexisutairu.webp)

### Tuning and Shops

- **Gunard Retro Build** ... a dedicated tuning kit
- **Ride Out Custom (Vice City)** ... interior, rim, and large-diameter wheel customization
- **One-Eyed Willie (Lake Leonida)** ... hand-painted customization for off-road vehicles

![Gunard Retro Build](/images/news/edition/hana-doretorobirudo.webp)

![Ride Out Custom](/images/news/edition/raidoautokasutamu.webp)

### Stores and Facilities

- **Sara's Unisex Salon** ... a salon for hair, makeup, and nails
- **Stock 305** ... a streetwear clothing store
- **Electric Fang Tattoo** ... a tattoo shop with a lineup of more than 50 special tattoos

![Sara's Unisex Salon](/images/news/edition/sarazuyunisekkususaron.webp)

![Stock 305](/images/news/edition/sutokku305.webp)

![Electric Fang Tattoo](/images/news/edition/erekutorikkufangutatoxu.webp)

### Hideouts and Special Jobs

- **PTT Youngin$ contraband warehouse** ... raid the gang hideout on the South Side to obtain special items and contraband
- **Classic car collection** ... a special job from the mechanic Wyman. Restore abandoned classic cars and unfinished vehicles, including four Ultimate-exclusive cars

---

## What Has Not Been Announced and Points to Watch

This announcement went into detail, including pricing, but some items remain unconfirmed and there are points where you should be wary of misinformation.

- The yen price was not specified in this official announcement. What is confirmed is the US dollar pricing of $79.99 / $99.99, and the rough yen figures from a simple currency conversion (roughly 12,000 to 16,000 yen) are merely a reference value. You will need to check each store's listing for the official domestic price.
- Just before pre-orders opened, pricing information such as $90 for the standard edition, $100, and 199 euros for a collector's edition circulated, originating from European retail listings, but these were retail placeholders or rumors. With this official Rockstar announcement, $79.99 for the standard edition and $99.99 for the higher tier have been confirmed as the official prices. It is best not to take old leaked prices at face value.
- Be careful of scams on unofficial sites that ask for pre-order proxy services or deposits (advance payments). It is considered safe to pre-order through official digital stores or authorized retailers.
- Rockstar's announcement this time puts the single-player experience front and center, with no mention of a GTA6 online mode. Be careful not to confuse the aforementioned GTA+ benefit, which is strictly for the current (GTA5-generation) GTA Online.

---

## Summary: Sorting by Reliability

**Confirmed facts (Rockstar official announcement):**

- Release date November 19, 2026 (PS5/Xbox Series X|S), pre-orders open midnight June 25 (local time), preload November 12.
- Standard $79.99 / Ultimate $99.99. The physical edition includes a code with no disc. Ultimate can be purchased as an upgrade later.
- Everyone who pre-orders or purchases by November 20 gets the Vintage Vice City Pack. Digital pre-orders also get one free month of GTA+ (physical editions excluded).
- Ultimate Edition additional content (vehicles, weapons, appearance, stores, special jobs, and more) unlocks as the chapters progress.

**Unconfirmed and unannounced:**

- The official yen price.
- Additional editions such as a collector's edition (none announced at this point; Ultimate is the top tier).

**Points to watch:**

- The high-price information that circulated just beforehand was retail placeholders and rumors; the official price is correct.
- Be wary of scams on unofficial sites asking for pre-order proxies or advance payments, and pre-order through official stores or authorized retailers.

Right after pre-orders open, stock status and domestic price updates are expected to continue. For the latest and most accurate information, it is best to check the official Rockstar Games website (rockstargames.com/VI) and each store's listing directly.`,
    fullContent: `# GTA6のエディションと予約特典まとめ——6月25日0時予約開始、Standard 79.99ドル／Ultimate 99.99ドルで公式確定

Rockstar Gamesは2026年6月24日、『グランド・セフト・オートVI(GTA6)』のエディション構成・価格・予約特典を公式サイトとNewswireで正式に発表した。6月25日の予約開始を翌日に控え、これまでリークと噂が飛び交っていた価格やエディション内容が、ようやく確定情報として出そろった。GTA6 FEEDが、公式発表をもとに要点を整理した。

本記事は2026年6月24日時点の情報にもとづく。価格・特典はすべてRockstarの公式発表に基づく確定情報だが、日本円価格など一部未発表の項目は末尾の注意点で区別する。

![Rockstar Games 公式X(@RockstarGames)による発表](/images/news/edition/kousikix.webp)

---

## 基本情報

- **発売日**: 2026年11月19日。対応機種はPS5とXbox Series X|S。Rockstarはシングルプレイヤー体験として案内している。
- **予約開始**: 2026年6月25日、現地時間の深夜0時から。PlayStation Store、Microsoft Store、Rockstar Games Storeなどのデジタルストアと一部小売で受付。
- **プレロード**: 11月12日から。発売の1週間前にあたり、デジタル版・物理版いずれも同日からダウンロードを開始できる。

---

## PlayStation Store(SONY)で予約開始を確認

予約解禁にあたる2026年6月25日0時、PlayStation Store(SONYストア)でGTA6の予約ページが公開され、実際に予約できる状態になっていることをGTA6 FEEDが確認した。Standard Edition・Ultimate Editionの両方が掲載され、予約特典の表記も確認できる。

予約は各ストアの公式ページから行える。

- PlayStation: [PS Store「グランド・セフト・オートVI」](https://www.playstation.com/ja-jp/games/grand-theft-auto-vi/)
- Xbox: [Microsoft Store「Grand Theft Auto VI」](https://www.xbox.com/en-US/games/store/grand-theft-auto-vi/9nl3wwnzlzzn)

あわせて注目したいのが、ストアの製品情報の記載だ。両ストアとも、GTA6を「オフラインプレイ対応」「プレイヤー数1人(シングルプレイヤー)」としている。この表記をそのまま読むなら、少なくとも発売直後の段階ではオンラインマルチプレイは含まれず、まずはシングルプレイヤー体験として届けられる可能性が高い。Rockstarが今回の案内でシングルプレイヤーを前面に出していることとも符合する。

ただし、これはあくまでストア表記とRockstarのアナウンスからのGTA6 FEEDの推測である。オンラインモードの有無や実装時期について、Rockstarからの正式な発表はまだない。GTA Onlineに相当する仕組みが後から追加される可能性も含め、続報を待つ必要がある。

![PlayStation Store(SONY)のGTA6予約ページ](/images/news/edition/sonystore-yoyaku-01.webp)

![PlayStation Store(SONY)のGTA6予約ページ](/images/news/edition/sonystore-yoyaku-02.webp)

---

## 価格とエディション

エディションは2種類で、上位版のUltimate Editionが最上位となる。コレクターズエディションなどの追加エディションは発表されていない。

- **Standard Edition(通常版)**: 79.99ドル
- **Ultimate Edition(アルティメット・エディション)**: 99.99ドル

価格に関する補足として、次の点が公式に確認されている。

- 物理版はディスクを同梱せず、箱の中にダウンロードコードを封入する形式となる。ディスク版は用意されない。物理版も11月12日から入手でき、プレロードに対応する。
- Standard EditionのオーナーがあとからUltimate Editionへアップグレードする購入も可能で、発売後を含めていつでも追加できる。今すぐ上位版を選ばなくても、後から内容を解放できる。

![Ultimate Editionの詳細](/images/news/edition/ultimateeditionsyousai.webp)

---

## 全員が受け取れる予約特典「Vintage Vice City Pack」

エディションを問わず、2026年11月20日までに予約または購入した全員に、80年代のバイスシティを想起させる「Vintage Vice City Pack」が付与される(物理版は在庫がある間)。主な内容は次のとおり。

- **乗り物とガレージ**: クラシックセダンのヴァピッド スタニアー(55年式)と、オーシャンビーチ近くのショア・コート個人ガレージ
- **外見**: ジェイソンとルシア向けの当時を思わせるコスチュームと髪型
- **武器パターン**: トミー・ベルセッティを象徴するヤシの木柄のトロピカルパターン(多くの銃に適用可能)

![ジェイソンとルシア](/images/news/edition/Jason＆rusia.webp)

加えて、PlayStation StoreまたはMicrosoft Storeでデジタル版を予約した場合は、GTA+の1か月無料も付く。これは現行のGTA Online(GTA5世代)で使える特典で、GTA$50万のデポジットやゲームライブラリの利用などが含まれる。物理版(コード同梱)はこのGTA+無料特典の対象外とされている点に注意が必要だ。

---

## Ultimate Editionの追加コンテンツ

Ultimate Editionの特典は、一度にまとめて付与されるのではなく、ジェイソンとルシアの物語全体に散りばめられ、章の進行に応じて順次アンロックされる構成になっている。公式が公開した内容をカテゴリ別に整理する。

### 乗り物・水上の乗り物

- **グロッティ チーター(95年式)** … グロッティ往年のスポーツカー
- **ヴァピッド ドミネーターバギー(67年式)とパラダイス・ガレージ** … ワトソンベイのガレージに武器ロッカーと盗品保管スペースを併設
- **シッツ スクアーロ** … ワシントンビーチ停泊の水上艇
- **ジェイソンのセーフハウス車両** … ミリタリー調バイクのディンカ エンデューロと、クレスト カヤック

![グロッティ チーター(95年式)](/images/news/edition/gurottexiti-ta-.webp)

![ヴァピッド ドミネーターバギー(67年式)](/images/news/edition/vapiddodomine-ta5.webp)

![シッツ スクアーロ](/images/news/edition/sittusukuaro.webp)

![ジェイソンのセーフハウス車両](/images/news/edition/jeisonnokakureganonorimono.webp)

### 武器

- **ホーク・アンド・リトル モーガンリボルバー** … 男女ペア仕様(His & Hers)のバイスシティスタイル
- **専用カスタムピストル** … ジェイソンのジラルディ ES9、ルシアのクローゼ K17に専用彫刻を施したバリエーション

![ホーク・アンド・リトル モーガンリボルバー](/images/news/edition/ho-kuandoritorumo-ganriboruba.webp)

![専用カスタムピストルのバリエーション](/images/news/edition/senyoubarie-syon.webp)

### 外見・アパレル

- **バイスシティスタイルのコスチュームとタトゥー**
- **グッドタイムグッズ** … 人気テレビ番組キャラクター「マッカ・ザ・ゲーター」モチーフのアパレル

![バイスシティスタイルの外見](/images/news/edition/baisusitexisutairu.webp)

### チューニング・ショップ

- **ガナードレトロビルド** … 専用チューニングキット
- **ライドアウト・カスタム(バイスシティ)** … 内装・リム・大径ホイールのカスタム
- **ワンアイド・ウィリー(レオナイダ湖)** … オフロード車向けの手塗りカスタム

![ガナードレトロビルド](/images/news/edition/hana-doretorobirudo.webp)

![ライドアウト・カスタム](/images/news/edition/raidoautokasutamu.webp)

### 店舗・施設

- **サラズ・ユニセックスサロン** … ヘア・メイク・ネイルのサロン
- **ストック305** … ストリートウェアの衣料品店
- **エレクトリック・ファングタトゥー** … 特別タトゥーを50種類以上揃えるタトゥーショップ

![サラズ・ユニセックスサロン](/images/news/edition/sarazuyunisekkususaron.webp)

![ストック305](/images/news/edition/sutokku305.webp)

![エレクトリック・ファングタトゥー](/images/news/edition/erekutorikkufangutatoxu.webp)

### 拠点・特別依頼

- **PTT Youngin$の違法物品倉庫** … サウスサイドのギャング拠点を襲撃し、特別アイテムや禁制品を入手
- **クラシックカー・コレクション** … 整備士ワイマンの特別依頼。放置されたクラシックカーや未完成車を再生する。Ultimate限定の4台を含む

---

## 発表されていないこと・注意点

今回の発表は価格を含めて踏み込んだ内容だが、未確定の項目や、誤情報に注意すべき点も残っている。

- 日本円価格は、今回の公式発表で明示されていない。確定しているのは米ドル建ての79.99ドル／99.99ドルであり、為替を単純換算した日本円の目安額(おおむね1万2千円台〜1万6千円台)はあくまで参考値にすぎない。正式な国内価格は各ストアの表示を確認する必要がある。
- 予約開始の直前には、ヨーロッパの小売リストを発端に「通常版90ドル」「100ドル」「コレクターズ版199ユーロ」といった価格情報が出回ったが、これらは小売のプレースホルダや噂であり、今回のRockstar公式発表によって通常版79.99ドル・上位版99.99ドルが正式な価格として確定した。古いリーク価格を鵜呑みにしないことが望ましい。
- 予約代行やデポジット(前金)を求める非公式サイトの詐欺に注意が必要だ。予約は公式のデジタルストアや正規小売を通じて行うのが安全とされる。
- Rockstarの今回の案内はシングルプレイヤー体験を前面に出しており、GTA6のオンラインモードへの言及はない。前述のGTA+特典は、あくまで現行(GTA5世代)のGTA Online向けである点を取り違えないようにしたい。

---

## まとめ:信頼度の整理

**確定している事実(Rockstar公式発表):**

- 発売日2026年11月19日(PS5／Xbox Series X|S)、予約開始6月25日0時(現地時間)、プレロード11月12日。
- Standard 79.99ドル／Ultimate 99.99ドル。物理版はディスクなしのコード同梱。Ultimateは後日アップグレード購入可。
- 全予約・11月20日までの購入者にVintage Vice City Pack。デジタル予約はGTA+1か月無料も(物理版は対象外)。
- Ultimate Editionの追加コンテンツ(乗り物・武器・外見・店舗・特別依頼など)は章進行でアンロック。

**未確定・未発表:**

- 日本円の正式価格。
- コレクターズエディション等の追加エディション(現時点で発表なし、Ultimateが最上位)。

**注意点:**

- 直前に出回った高額の価格情報は小売のプレースホルダ・噂であり、公式価格が正。
- 予約代行・前金を求める非公式サイトの詐欺に注意し、予約は公式ストア・正規小売で行う。

予約開始直後は在庫状況や国内価格の更新が続くとみられる。最新かつ正確な情報は、Rockstar Games公式サイト(rockstargames.com/VI)および各ストアの表示を直接確認することが望ましい。`,
  },
  {
    id: 18,
    title:
      "GTA6のロールプレイはどうなるのか——公式化・一本化が進むRP文化の現在地と行方",
    description:
      "GTA6でRPはどうなるのか。NoPixelの公式提携、FiveMの一本化、Project ROMEの噂まで、確定情報・リーク・推測を信頼度ごとに切り分けて整理する。",
    icon: "🎭",
    image: "/images/news/GTA6RPhadounarunoka.webp",
    category: "speculation",
    date: "2026-06-24",
    source: "GTA6 FEED 編集部",
    sourceUrl: "#",
    relatedArticles: [19, 1, 33],
    aiSummary: [
      "ロールプレイ文化はGTA6時代も続く見込みだが、土台が現行のFiveMのままか、公式新基盤（噂のROME）へ移るかは未確定。",
      "確定：NoPixelがRockstarと公式提携、FiveMはRockstar傘下で過去最大規模、競合のalt:V／RAGE:MPは終了へ（FiveMへ一本化）。",
      "GTA6はコンソール先行・PC版は後発のため、従来型のFiveM RPは当面遊べず、GTA6本体での公式RP対応も未確約。",
    ],
    titleEn:
      "What Happens to Roleplay in GTA6 — The Current State and Future of an RP Culture Moving Toward Officialization and Consolidation",
    descriptionEn:
      "What happens to RP in GTA6? From NoPixel's official partnership and the consolidation around FiveM to the Project ROME rumors, we sort the confirmed facts, leaks, and speculation by reliability.",
    aiSummaryEn: [
      "Roleplay culture looks set to continue into the GTA6 era, but whether its foundation stays on the current FiveM or shifts to a new official platform (the rumored ROME) is undecided.",
      "Confirmed: NoPixel has officially partnered with Rockstar, FiveM is at its largest scale ever under Rockstar, and rivals alt:V and RAGE:MP are shutting down (consolidating onto FiveM).",
      "Because GTA6 launches on consoles first with the PC version coming later, traditional FiveM RP will not be playable for the time being, and official RP support within GTA6 itself is not guaranteed.",
    ],
    fullContentEn: `# What Happens to Roleplay in GTA6 — The Current State and Future of an RP Culture Moving Toward Officialization and Consolidation

Living out everyday life in the world of GTA5 as a police officer, a medical worker, or just an ordinary citizen who is no one in particular — so-called roleplay (RP) has, over time, become firmly established as another way to play GTA. And with GTA6 set to arrive on November 19, 2026, expectations are rising that this kind of RP play will expand even further.

That said, the material behind these expectations is a mix of confirmed facts that Rockstar Games has officially acknowledged, unverified information that remains at the leak or rumor stage, and speculation tinged with wishful thinking. GTA6 FEED has sorted out the current state of RP culture and the seismic shifts heading into the GTA6 era, separating them by level of reliability.

This article is based on information as of June 24, 2026.

---

## What Is GTA RP in the First Place

GTA RP is a way of playing built on top of GTA5's multiplayer by third-party platforms and servers run by enthusiasts. Players act out a single character, fully embodying their respective roles — police officer, paramedic, mechanic, business owner, criminal, and so on — and continue living life in the city. In contrast to GTA's inherently chaotic play, it is characterized by obeying traffic rules, holding down a job, and forming a society with other players.

Its iconic example is NoPixel, known as the largest RP server in the English-speaking world. Many prominent streamers take part, and the drama and incidents they generate have been widely watched through streaming. GTA RP is also a field that grew while being strongly tied to streaming culture.

The appeal of RP lies in a different direction from GTA's original play of churning through prepared missions one after another. Under rules closer to a strict economy and a life simulation where actions have consequences, players settle into the city as the role they have chosen. They can spend their days immersed in flashy incidents, or they can choose a quiet, ordinary life — that breadth of range, and the tangible sense of being able to choose your own story, is said to be why GTA RP has earned its own distinct popularity.

---

## The Confirmed Facts: The RP Ecosystem Is Simultaneously Becoming Official, Consolidated, and Monetized

Ahead of GTA6's release, the environment surrounding RP has shifted dramatically over the past year or two. The following are all confirmed facts based on official announcements or statements by the parties involved.

### NoPixel Has Officially Partnered With Rockstar

On September 23, 2025, NoPixel announced its next-generation version, NoPixel V, and revealed that it is being developed through direct collaboration with Rockstar Games. While NoPixel V is built on FiveM, it will be possible to launch it directly as a title from platforms such as the Rockstar Games Launcher, without separately installing the external FiveM client app as before. This is the first official partnership of its kind, in which an RP server is incorporated as an official title into Rockstar's own launcher. Rockstar, too, expressed its support for the NoPixel team through its official account.

What stands out is that this initiative was described as the next evolution of the GTA V roleplay experience. Rockstar, which once tried to remove FiveM as something illegal, has reversed its stance to become a side that officially backs RP. For streamers and server operators long placed in the legal gray zone of mods, gaining an official backing that lets them work without fearing sudden takedowns carries significant meaning.

For a while after the announcement there was no notable follow-up, but on June 22, 2026, leaker Tez2 (@TexFunz2) confirmed that NoPixel V had been added as a single title in the backend of the Rockstar Games Launcher. Logo and background art assets were also found, taken as a sign that a release is near. However, neither Rockstar nor NoPixel has issued any official follow-up, and the release date, price, and access method (whether free, subscription, or invite-only) all remain undetermined.

### FiveM Is Under Rockstar and Has Reached Its Largest Scale Ever

The foundation on which NoPixel and many other RP servers have run is FiveM. cfx.re, the developer of FiveM, was acquired by Rockstar (parent company Take-Two) in August 2023, and FiveM is now officially owned by Rockstar.

That same FiveM was registered on Steam in December 2025, and on March 15, 2026, it set a new all-time record of 202,756 concurrent players. This figure is for Steam users only, so the actual scale is thought to be even larger. Several years after the acquisition, FiveM has an unprecedented presence as the center of GTA V multiplayer modding.

### Rival Platforms Are Shutting Down One After Another

Meanwhile, options other than FiveM are rapidly disappearing. Historically, GTA V multiplayer modding had three main foundations — FiveM, alt:V, and RAGE:MP — but the latter two have both decided to shut down after receiving cease-and-desist requests from Take-Two.

- alt:V received a cease-and-desist in 2026 and, after a phased shutdown, is expected to fully close on July 6.
- RAGE:MP also received a cease-and-desist and announced that it would close its public server list on June 1 and end all functionality on August 31.

As grounds for this, the operators of both platforms have issued statements to the effect that Rockstar and Take-Two have made it clear that FiveM is the only platform permitted for GTA V multiplayer modding. As a result, the view is being voiced in various places that from September 2026 onward, GTA V multiplayer modding will be FiveM-only. It is a trend in which the broad base that has supported RP converges onto a single, officially managed foundation.

### The Official Store Cfx Marketplace, Which Consolidates Mod Transactions, Has Begun Operating

On January 12, 2026, Rockstar launched the official mod store [Cfx Marketplace](https://marketplace.cfx.re/) for FiveM and RedM. However, this is not a story of mod sales on FiveM being officialized for the first time. On FiveM, the payment partner Tebex had long been treated as the de facto official monetization channel, and under Rockstar's Creator Platform terms, server charges have been premised on going through Tebex. Transactions of paid scripts and MLOs (custom interiors) were also widely conducted through Tebex and various community channels. Earning revenue from mods was, in itself, already within an officially sanctioned framework.

What is new this time is that such dispersed transactions have been consolidated into a single primary store operated by Cfx itself. Cfx Marketplace is positioned as an official UGC marketplace under the Rockstar brand, equipped with review, escrow payment, and creator verification (the payments themselves continue to be handled by Tebex). High-priced items also line its shelves, such as a theme park mod at 129.99 dollars and creator packs up to 389.99 dollars. In terms of roles, against Tebex, which handles charges from servers to players, Cfx Marketplace serves the distinct role of asset sales from creators to server operators. It is a move in which Rockstar consolidates and strengthens the monetization of RP-oriented creative work more directly under its own management, and it is two sides of the same coin as the criticism of excessive monetization discussed later.

### Integration With the Streaming Platform Twitch Is Also Advancing

RP and streaming culture are inseparable, and there is movement on the streaming side as well. Mike Minton, Twitch's Chief Monetization Officer, acknowledged in a 2025 interview that Twitch is working directly with Rockstar and Take-Two ahead of GTA6's release. Minton positioned GTA5 as having been revived by RP and showed a stance of staying involved with GTA6 over the long term. In fact, Rockstar has repeatedly carried out measures to back RP, such as offering prize money to RP streamers and distributing in-game rewards through Twitch Drops. However, even Minton has avoided stating clearly whether an official Twitch-linked RP server will be prepared.

In addition, Rockstar has posted job openings related to its Creator Platform, and the names of foundations such as FiveM and RedM are explicitly written in those job duties. This can be called confirmed material showing that work is underway to build a structure for seriously cultivating RP and UGC (user-generated content) as products.

---

## Unverified Leaks and Rumors: Project ROME

From here on is not confirmed fact but information at the leak or rumor stage.

Toward GTA6, the rumor that Rockstar is preparing an official modding and multiplayer foundation called Project ROME (Rockstar Online Modding Engine) has repeatedly surfaced since around February 2025. According to leaks, this is an official toolset that succeeds FiveM, allowing players to create their own game modes, servers, and custom experiences within GTA6, and is said to aim to transform GTA from a game into a platform. Creative and monetization systems like those of Fortnite and Roblox are often cited as comparisons.

However, Project ROME has not been officially confirmed by Rockstar in any way. There is no press release, no Newswire post, and no trailer; the basis remains an accumulation of circumstantial evidence such as datamining finds, testimony from former insiders, and job listings. Even if it exists, the crucial points — whether it will support consoles, whether it will extend to single-player, and whether you can earn revenue from your creations — are all unknown. It is an indispensable topic when discussing GTA6 RP, but at this point it is reasonable to treat it as a rumor.

To begin with, Rockstar has revealed almost nothing about GTA6's online mode itself. The features, name, and start timing of GTA6 Online are all unannounced, and there is no guarantee that official RP features or first-party RP servers will be prepared. Because the phrase the future of GTA RP used in the NoPixel partnership announcement was not limited to GTA V, some expect it to be groundwork for official RP support in GTA6 Online, but this too does not go beyond speculation based on interpreting the wording. What is confirmed extends only as far as the fact that the official side is backing GTA5-era RP, and it has not been decided that this will be carried over to GTA6 as is.

---

## A Critical Perspective: The Argument That Officialization Comes at a Cost

While there are voices welcoming officialization, strong criticism has also emerged from those directly involved.

Disquse, who identifies as a former lead developer of FiveM, published a lengthy statement in early 2026 that was reported by multiple gaming outlets. The core of the argument is that the continued support and improved relationship with the modding community that Rockstar promised at the time of acquisition were not delivered, and that the promises were lies. According to the statement, by mid-2024 the original cfx.re team had been pushed out, after which FiveM came to suffer from bugs, cheating, and abuse, and monetization was prioritized over fundamental fixes.

Regarding the closures of alt:V and RAGE:MP as well, concerns are voiced about the independent foundations that supported creative freedom disappearing and a state without competition emerging. The point is that if no competitors exist, there is little external pressure compelling FiveM to respond quickly to pricing or community requests. These are, to be sure, the assessments of involved parties and commentators rather than Rockstar's official position, but they are worth keeping in mind as a perspective that officialization does not necessarily equal pure progress.

---

## The Biggest Obstacle: GTA6 Launches on Consoles First, and Traditional RP Was a PC Thing

When considering whether such RP can be enjoyed in GTA6, there is a decisive premise that is easily overlooked: the form of release.

GTA6 launches first on November 19, 2026, for PS5 and Xbox Series X|S, while the PC version is only described as coming later, with no timing announced. On the other hand, GTA RP so far has effectively been a PC-only activity. RP servers including NoPixel run on FiveM, and FiveM is premised on owning GTA5 on PC. Consoles have no client-modding mechanism like FiveM.

Layering these two together reveals an important conclusion. Even when GTA6 releases, traditional FiveM-style RP will not be viable until the PC version is out. And while the PC version is, judging from the precedent of past titles, expected around 2027 to 2028, Rockstar has guaranteed nothing. In other words, if players who start GTA6 on consoles are to enjoy RP-style play from right after release, there is effectively only one path — the case where Rockstar incorporates official RP features into GTA6 Online itself.

This is where the aforementioned Project ROME rumors, the NoPixel partnership, and the chain of groundwork such as Cfx Marketplace take on meaning. There is a view in the community and parts of the media that connects these to read it as official RP being loaded onto GTA6 Online from the start, or early on. Given Rockstar's moves so far, it is a coherent line of speculation. But, as repeated, Rockstar itself has not guaranteed any RP support for GTA6 Online. The console-first release format remains the most realistic constraint that greatly influences when and by what means RP will become playable.

---

## Will GTA6 Itself Support Immersive Life Play

Beyond just the RP foundation, how far GTA6 itself supports an immersive life is also a point directly tied to whether RP-style play is possible. Here too, it is necessary to separate the facts visible in trailers from leaks and speculation.

What can be confirmed from official trailers and Rockstar materials:

- A large number of unique NPCs appear on the beach, behaving organically, such as applying sunscreen and recording videos. The crowd density appears to greatly exceed that of GTA5.
- Depictions can be seen of NPCs recording the player's actions on their smartphones.
- An in-game social media interface resembling TikTok or Reels appears, with staging in which events happening in the city flow in real time.
- Weather changes such as storms and rainfall are expressed in the footage.
- Character switching between the two protagonists, Jason and Lucia, is shown.

On the other hand, things that remain at the leak or speculation stage and have not been officially confirmed by Rockstar:

- Specific figures such as being able to enter 40% (or 70%) of buildings. These are leaks and rumors whose numbers also vary, and Rockstar has not officially stated a major expansion of enterable buildings.
- A memory function in which NPCs remember the player's actions and reflect them in later behavior.
- A mechanism in which weather steps into and affects gameplay, such as hurricanes blocking roads or police response changing.
- A technical implementation that auto-generates interiors to make a large number of buildings enterable.

In other words, the overall direction of a more living city can be read from the trailers, but the core part valued in RP — how many buildings you can enter and complete your life inside them — is at this point not confirmed information but in the realm of leak-driven expectations.

---

## Will RP Culture Be Ported to GTA6 (Speculation)

Taking all the above into account, it becomes clear that the outlook of being able to enjoy RP in GTA6 as expected rests on a number of undetermined factors. Finally, let us organize, as speculation, what can and cannot be said at this point.

There is material that bolsters expectations. The largest RP operation, NoPixel, has secured an official partnership; the foundation FiveM has reached its largest scale ever under Rockstar; and rumors of an official creative foundation like Project ROME never cease. It can also be read from trailers that GTA6 itself is aiming for a denser city. If these mesh together, there is a possibility that RP-style play will bloom greatly within an official framework.

But there is no guarantee anywhere. Project ROME is unannounced, and even if it exists its nature is unknown. There are concerns from those involved that, if independent foundations are weeded out in the course of officialization and excessive monetization or restrictions are imposed, there is no guarantee that the free culture FiveM nurtured will be ported to GTA6 as is. The proportion of enterable buildings and the precision of NPCs in GTA6 are still no more than leak-stage expectations. And above all, GTA6 is unreleased, and not a single person has experienced just how far RP-style play actually goes.

It is a fact that demand for RP-style play genuinely exists and that there are signs of Rockstar trying to absorb it. But whether that takes shape as a product remains a question to be verified after release.

---

## Summary: Organizing by Reliability, and Points of Caution

Let us once again organize the information covered in this article by level of reliability.

### Confirmed Facts

- GTA6 is scheduled to release on November 19, 2026, for PS5 and Xbox Series X|S (the PC version comes later, with no timing announced).
- On September 23, 2025, NoPixel announced NoPixel V through an official partnership with Rockstar. While built on FiveM, it will take a form in which it can be launched directly from platforms such as the Rockstar Games Launcher without separately installing the external FiveM client app.
- On June 22, 2026, NoPixel V was confirmed to be registered as a title in the backend of the Rockstar Games Launcher (taken as a sign that release is near, but the release date, price, and access method are unannounced).
- cfx.re, FiveM's developer, was acquired by Rockstar (Take-Two) in August 2023.
- FiveM was registered on Steam in December 2025 and recorded over 200,000 concurrent players on March 15, 2026.
- alt:V and RAGE:MP, having received cease-and-desist requests from Take-Two, are scheduled to end around July 6 and August 31, 2026, respectively. From September 2026 onward, FiveM is expected to become the only foundation for GTA V multiplayer modding.
- On January 12, 2026, Rockstar launched the official mod store Cfx Marketplace for FiveM and RedM (paid mods up to about 390 dollars).
- Twitch is working with Rockstar and Take-Two ahead of GTA6's release, and Rockstar has previously backed RP by offering prize money to RP streamers and distributing rewards through Twitch Drops.

### Unverified Leaks and Rumors (Officially Unconfirmed)

- The existence and content of the official modding foundation Project ROME.
- Whether GTA6 Online will support RP or have official RP servers, and its features, name, and start timing.
- The proportion of enterable buildings in GTA6 itself, an NPC memory function, weather's influence on gameplay, and auto-generation of interiors.
- RP support on consoles (traditional FiveM is PC-only, and the means of RP on consoles depends on an official implementation).

### Speculation and Assessment

- Whether RP culture will be smoothly ported to GTA6.
- The assessment of whether officialization is a step forward or backward for RP culture (there is conflict even among those involved).

As a point of caution, GTA6 is unreleased at the time of writing. Caution is needed toward articles that assert RP can be enjoyed in GTA6 as one wishes, and toward information that pretends to have already played and discusses the details of RP features. In particular, given that GTA6 releases on consoles first and that traditional RP was a PC-only activity, information that talks as if traditional RP can be played from right after release is highly likely to diverge from reality. Since verification on actual hardware is not possible, what can be said with certainty at this point extends only as far as that demand for RP-style play exists and that Rockstar is showing moves to absorb it. In following the future of RP culture, an attitude that separates Rockstar's official announcements from leaks and speculation is indispensable.

---

*Note: This article is based on public information, various media reports, and statements by involved parties as of June 24, 2026. Project ROME, RP support in GTA6 Online, the proportion of enterable buildings, and the like are unconfirmed at the time of writing and need to be treated separately from confirmed information. We will update the content as soon as there are new official announcements.*

For a look at how this RP culture actually plays out on a live server, see our visit note "[What Is Refloria Town? A Japanese RP Server with 216 Concurrent Players, Gang Wars, and a Territory System](/en/fivem-gtarp/field-notes/visit-note/refloria-town)", a concrete example with gang wars and a territory system.`,
    fullContent: `# GTA6のロールプレイはどうなるのか——公式化・一本化が進むRP文化の現在地と行方

GTA5の世界で警官や医療スタッフ、あるいは何者でもないただの一般市民として日常を過ごす——いわゆるロールプレイ(RP)は、いつしかGTAという作品のもう一つの遊び方として定着した。そして2026年11月19日に控えるGTA6でも、このRP的な遊びがさらに広がるのではないかという期待が高まっている。

ただし、その期待を支える材料には、Rockstar Gamesが正式に認めた確定事項と、リークや噂にとどまる未確認情報、そして願望まじりの推測が混在している。GTA6 FEEDは、RP文化の現在地と、GTA6時代に向けた地殻変動を、信頼度ごとに切り分けて整理した。

本記事は2026年6月24日時点の情報にもとづく。

---

## そもそもGTA RPとは何か

GTA RPは、GTA5のマルチプレイを土台に、サードパーティ製のプラットフォームと有志のサーバーが作り上げた遊び方だ。プレイヤーは一つのキャラクターを演じ、警官・救急隊員・整備士・経営者・犯罪者など、それぞれの「役」になりきって街での生活を続ける。混沌としたGTA本来の遊びとは対照的に、交通ルールを守り、職に就き、他のプレイヤーと社会を形成していく点が特徴とされる。

その象徴的存在が、英語圏で最大規模のRPサーバーとして知られるNoPixelである。著名な配信者が多数参加し、彼らが生み出すドラマや事件が配信を通じて広く視聴されてきた。GTA RPは、配信文化と強く結びつきながら成長した分野でもある。

RPの魅力は、用意されたミッションを次々にこなすGTA本来の遊びとは別の方向にある。厳密な経済や、行動に結果が伴う生活シミュレーションに近いルールのもとで、プレイヤーは自分の選んだ役柄として街に腰を据える。派手な事件に明け暮れることもできれば、淡々とした日常を選ぶこともできる——その振れ幅の広さと、自分で物語を選べる手応えこそが、GTA RPが独自の人気を獲得してきた理由とされる。

---

## 確定している事実：RPエコシステムは「公式化」「一本化」「収益化」が同時に進んでいる

GTA6発売を前に、RPを取り巻く環境はこの1〜2年で大きく動いた。以下はいずれも公式発表や当事者の声明にもとづく確定事項である。

### NoPixelがRockstarと公式提携した

2025年9月23日、NoPixelは次世代版「NoPixel V」を発表し、これがRockstar Gamesとの直接協業によって開発されていることを明らかにした。NoPixel VはFiveMを基盤としつつ、従来のように外部アプリのFiveMクライアントを別途インストールしなくても、Rockstar Games Launcherなどのプラットフォームから直接タイトルとして起動できるようになる。RPサーバーがRockstar自身のランチャーに正式タイトルとして組み込まれる、この種としては初の公式提携である。Rockstar側も公式アカウントでNoPixelチームへの支援を表明した。

注目すべきは、この取り組みが「GTA Vロールプレイ体験の次なる進化」と表現された点だ。かつてFiveMを違法な存在として排除しようとしていたRockstarが、RPを公式に後押しする側へと立場を反転させたことになる。長年、MODの法的グレーゾーンに置かれてきた配信者やサーバー運営者にとって、突然のテイクダウンに怯えずに活動できる「公式の後ろ盾」が得られる意味は大きい。

発表後しばらく目立った続報はなかったが、2026年6月22日、リーカーのTez2(@TexFunz2)が、Rockstar Games LauncherのバックエンドにNoPixel Vが一つのタイトルとして追加されているのを確認した。ロゴや背景アートのアセットも見つかっており、公開が近いことを示す兆候と受け止められている。ただしRockstar・NoPixelとも公式の続報は出しておらず、公開日・価格・アクセス方式(無料か、サブスクか、招待制か)はいずれも未確定のままである。

### FiveMはRockstarの傘下にあり、過去最高の規模に達している

NoPixelをはじめ多くのRPサーバーが動作してきた基盤がFiveMだ。FiveMを開発したcfx.reは、2023年8月にRockstar(親会社Take-Two)が買収しており、FiveMは現在Rockstarの公式所有物となっている。

そのFiveMは2025年12月にSteamへ登録され、2026年3月15日には同時接続202,756人という過去最高記録を更新した。これはSteam経由のユーザーのみの数字であり、実際の規模はさらに大きいとみられる。買収から数年を経て、FiveMはGTA Vマルチプレイ改造の中心としてかつてない存在感を持っている。

### 競合プラットフォームは相次いで閉鎖へ

その一方で、FiveM以外の選択肢は急速に姿を消しつつある。GTA Vのマルチプレイ改造は歴史的にFiveM・alt:V・RAGE:MPの三つが主要基盤だったが、後者二つはいずれもTake-Twoからの停止要請(cease-and-desist)を受けて閉鎖が決まった。

- alt:Vは2026年に停止要請を受け、段階的な閉鎖を経て7月6日に完全終了する見込みとされる。
- RAGE:MPも停止要請を受け、6月1日に公開サーバー一覧を閉鎖、8月31日に全機能を終了するとアナウンスした。

これらの根拠として、両プラットフォームの運営は「RockstarとTake-Twoが、FiveMをGTA Vマルチプレイ改造で唯一認められたプラットフォームだと明確にした」という趣旨の声明を出している。結果として、2026年9月以降、GTA Vのマルチプレイ改造はFiveM一択になるという見立てが各所で語られている。RPを支えてきた裾野が、公式に管理された単一の基盤へと収束していく流れだ。

### MOD取引を集約する公式ストア「Cfx Marketplace」が稼働を始めた

2026年1月12日、RockstarはFiveM・RedM向けの公式MODストア「[Cfx Marketplace](https://marketplace.cfx.re/)」を立ち上げた。ただし、これはFiveMのMOD販売が初めて公式化されたという話ではない。FiveMでは以前から決済パートナーのTebexが事実上の公式収益化窓口とされ、RockstarのCreator Platform規約上、サーバーの課金はTebex経由が前提とされてきた。有料スクリプトやMLO(カスタム内装)の取引も、Tebexやコミュニティの各所で広く行われていた。MODで収益を得ること自体は、すでに公認の枠組みのなかにあった。

今回新しいのは、そうして分散していた取引を、Cfx自身が運営する単一の一次ストアに集約した点だ。Cfx MarketplaceはRockstarブランドの公式UGCマーケットと位置づけられ、審査・エスクロー決済・クリエイター認証を備える(決済自体は引き続きTebexが担う)。テーマパークのMODが129.99ドル、クリエイターパックは最大389.99ドルといった高額商品も並ぶ。役割の上では、サーバーからプレイヤーへの課金を担うTebexに対し、Cfx Marketplaceはクリエイターからサーバー運営者へのアセット販売という棲み分けになる。RP向け創作の収益化を、Rockstarがより直接の管理下へと集約・強化する動きであり、後述する「過度な収益化」への批判とも表裏一体の出来事だ。

### 配信プラットフォームTwitchとも連携が進んでいる

RPと配信文化は不可分の関係にあるが、その配信側でも動きがある。TwitchのChief Monetization Officerであるマイク・ミントンは2025年の取材で、TwitchがGTA6の発売に向けてRockstar・Take-Twoと直接連携していることを認めている。ミントンはGTA5がRPによって息を吹き返したと位置づけ、GTA6でも長期的に関わっていく姿勢を示した。実際にRockstarは、RP配信者への賞金提供やTwitch Dropsによるゲーム内報酬の配布など、RPを後押しする施策を繰り返してきた。ただし、公式のTwitch連携RPサーバーが用意されるかどうかについては、ミントン自身も明言を避けている。

加えて、Rockstarは「Creator Platform」関連の人材募集を出しており、その職務にFiveMやRedMといった基盤の名が明記されている。これはRPやUGC(ユーザー生成コンテンツ)を製品として本格的に育てる体制づくりが進んでいることを示す確定材料といえる。

---

## 未確認リーク・噂：Project ROME

ここからは確定事項ではなく、リークや噂の段階にある情報である。

GTA6に向けて、Rockstarが「Project ROME(Rockstar Online Modding Engine)」と呼ばれる公式の改造・マルチプレイ基盤を準備しているという噂が、2025年2月頃から繰り返し浮上している。リークによれば、これはFiveMの後継にあたる公式ツール群で、プレイヤーが独自のゲームモードやサーバー、カスタム体験をGTA6内で制作できるようにし、GTAを「ゲーム」から「プラットフォーム」へと変えることを狙うものだとされる。FortniteやRobloxのような創作・収益化の仕組みが引き合いに出されることも多い。

ただし、Project ROMEはRockstarから一切公式に確認されていない。プレスリリースもNewswireの投稿もトレーラーも存在せず、根拠はデータマイニングの発見や元関係者の証言、求人情報といった状況証拠の積み重ねにとどまる。実在するとしても、コンソールに対応するのか、シングルプレイにも及ぶのか、創作物で収益を得られるのかといった肝心な点はいずれも不明だ。GTA6のRPを語るうえで欠かせない話題ではあるが、現時点では「噂」として扱うのが妥当である。

そもそもRockstarは、GTA6のオンラインモードそのものについてほとんど何も明らかにしていない。GTA6 Onlineの機能、名称、開始時期はいずれも未発表で、公式のRP機能や一次提供のRPサーバーが用意されるかどうかも確約されていない。NoPixel提携の発表で使われた「GTA RPの未来」という言い回しが「GTA V」に限定されていなかったことから、GTA6 Onlineでの公式RP対応への布石ではないかと期待する向きもあるが、これも文言の解釈にもとづく推測の域を出ない。確定しているのはGTA5時代のRPを公式が後押ししているという事実までで、それがそのままGTA6に持ち込まれると決まったわけではない。

---

## 批判的視点：公式化には代償があるという指摘

公式化を歓迎する声がある一方で、当事者側からは強い批判も出ている。

FiveMの元リード開発者を名乗るDisquseは、2026年初頭に長文の声明を公表し、複数のゲームメディアに報じられた。その主張の核心は、Rockstarが買収時に約束した継続的な支援やモッディングコミュニティとの関係改善が果たされず、「約束は嘘だった」というものだ。声明によれば、2024年半ばまでにcfx.reの当初のチームは押し出され、その後FiveMは不具合や不正、悪用に悩まされるようになり、根本的な修正よりも収益化が優先されたという。

alt:VやRAGE:MPの閉鎖についても、創作の自由を支えてきた独立基盤が消え、競争のない状態が生まれることへの懸念が語られている。競合が存在しなければ、FiveMが料金やコミュニティの要望に迅速に応える外圧も働きにくい、という指摘である。これらはあくまで関係者や論者の評価であり、Rockstar側の公式見解ではないが、「公式化=純粋な前進」とは限らないという視点として押さえておきたい。

---

## 最大の障壁：GTA6はコンソール先行で、従来のRPはPCの遊びだった

GTA6でこうしたRPが楽しめるかを考えるうえで、見落とされがちだが決定的な前提がある。それは発売形態だ。

GTA6は2026年11月19日にPS5・Xbox Series X|S向けに先行発売され、PC版は「後発」とされるのみで時期は未発表である。一方、これまでのGTA RPは事実上PC専用の遊びだった。NoPixelをはじめとするRPサーバーはFiveM上で動作し、そのFiveMはPCでGTA5を所有していることが前提だからだ。コンソールにはFiveMのようなクライアント改造の仕組みが存在しない。

この二つを重ねると、重要な帰結が見えてくる。GTA6が発売されても、従来型のFiveMスタイルのRPは、PC版が出るまで成立しない。そしてPC版は、過去作の前例から2027〜2028年頃と予想されるものの、Rockstarは何も確約していない。つまり、コンソールでGTA6を始めるプレイヤーが発売直後からRP的な遊びを楽しめるとすれば、その道は実質的に一つしかない——Rockstarが公式のRP機能をGTA6 Onlineそのものに組み込む場合だ。

ここで前述のProject ROMEの噂や、NoPixel提携、Cfx Marketplaceといった一連の布石が意味を持ってくる。これらをつなげて「GTA6 Onlineには最初から、あるいは早期に公式RPが載るのではないか」と読む見方がコミュニティや一部メディアにはある。Rockstarのこれまでの動きを踏まえれば筋の通った推測ではある。しかし繰り返すように、Rockstar自身はGTA6 OnlineのRP対応を一切確約していない。コンソール先行という発売形態は、RPが遊べるようになる時期とその手段を大きく左右する、最も現実的な制約として残っている。

---

## GTA6本体は没入的な生活プレイを支えるのか

RPの基盤だけでなく、GTA6本体がどこまで没入的な生活を支えるのかも、RP的な遊びの可否に直結する論点だ。ここでも、トレーラーで確認できる事実と、リーク・推測を切り分ける必要がある。

公式トレーラーやRockstarの素材から確認できるもの:

- ビーチに大量の固有NPCが登場し、日焼け止めを塗る、動画を撮影するなど、有機的に振る舞う様子が示されている。群衆の密度はGTA5を大きく上回って見える。
- NPCがスマートフォンでプレイヤーの行動を撮影するような描写が見られる。
- TikTokやリールに似たゲーム内のSNSインターフェースが登場し、街で起きた出来事がリアルタイムに流れる演出が示されている。
- 嵐や降雨といった天候の変化が映像で表現されている。
- ジェイソンとルシアの二人主人公によるキャラクター切り替えが示されている。

一方、リークや推測にとどまり、Rockstarが公式に確認していないもの:

- 「建物の40%(あるいは70%)に入れる」といった具体的な数値。これらは数値もばらつくリーク・噂であり、Rockstarは入れる建物の大幅拡張を公式に明言していない。
- NPCがプレイヤーの行動を記憶し、後の行動に反映するといった「記憶」機能。
- ハリケーンが道路を塞ぐ、警察の対応が変わるなど、天候がゲーム性に踏み込んで影響するという仕組み。
- 内装を自動生成して大量の建物を入室可能にするという技術的な実装。

つまり、「街がより生きている」方向性そのものはトレーラーから読み取れるが、RPで重視される「どれだけ多くの建物に入り、その中で生活を完結できるか」という核心部分は、現時点では確定情報ではなくリーク期待値の領域にある。

---

## RP文化はGTA6に「移植」されるのか(推測)

以上を踏まえると、GTA6でRPが期待どおりに楽しめるという見通しは、いくつもの未確定要素の上に成り立っていることが分かる。最後に、現時点で言えることと言えないことを推測として整理する。

期待を後押しする材料はある。RPの最大手NoPixelが公式提携にこぎつけ、基盤のFiveMはRockstar傘下で過去最大規模に達し、Project ROMEのような公式創作基盤の噂も絶えない。GTA6本体も、より密度の高い街を志向していることはトレーラーから読み取れる。これらが噛み合えば、RP的な遊びが公式の枠組みの中で大きく花開く可能性はある。

しかし保証はどこにもない。Project ROMEは未発表で、実在しても性格は不明だ。公式化の過程で独立基盤が淘汰され、過度な収益化や制限が課されれば、FiveMが育てた自由な文化がそのままGTA6へ移植される保証はない、という当事者からの懸念もある。GTA6で入れる建物の割合やNPCの精度は、まだリーク段階の期待値にすぎない。そして何より、GTA6は未発売であり、実際にどこまでRP的な遊びができるかを体験した者は誰一人いない。

RP的な遊びへの需要が確かに存在し、Rockstarがそれを取り込もうとする兆候があること自体は事実だ。だが、それが製品として形になるかどうかは、発売後に検証されるべき問いとして残されている。

---

## まとめ：信頼度の整理と注意点

本記事で扱った情報を、信頼度ごとに改めて整理する。

### 確定している事実

- GTA6は2026年11月19日にPS5・Xbox Series X|S向けに発売予定(PC版は後発で時期未発表)。
- NoPixelは2025年9月23日、Rockstarとの公式提携による「NoPixel V」を発表した。FiveMを基盤としつつ、外部アプリのFiveMクライアントを別途入れずにRockstar Games Launcherなどから直接起動できる形になる。
- 2026年6月22日、Rockstar Games LauncherのバックエンドにNoPixel Vがタイトルとして登録されているのが確認された(公開が近い兆候とされるが、公開日・価格・アクセス方式は未発表)。
- FiveMの開発元cfx.reは2023年8月にRockstar(Take-Two)が買収済み。
- FiveMは2025年12月にSteam登録、2026年3月15日に同時接続20万人超を記録した。
- alt:VとRAGE:MPはTake-Twoの停止要請を受け、それぞれ2026年7月6日・8月31日頃に終了予定。2026年9月以降はFiveMがGTA Vマルチ改造の唯一の基盤になる見込み。
- Rockstarは2026年1月12日、FiveM・RedM向け公式MODストア「Cfx Marketplace」を開始した(有料MODは最大約390ドル)。
- TwitchはGTA6発売に向けてRockstar・Take-Twoと連携しており、RockstarはこれまでもRP配信者への賞金提供やTwitch Dropsによる報酬配布でRPを後押ししてきた。

### 未確認のリーク・噂(公式未確認)

- 公式改造基盤「Project ROME」の存在と内容。
- GTA6 OnlineのRP対応・公式RPサーバーの有無、機能・名称・開始時期。
- GTA6本体の入れる建物の割合、NPCの記憶機能、天候のゲーム性への影響、内装の自動生成。
- コンソール版でのRP対応(従来のFiveMはPC専用であり、コンソールでのRP手段は公式実装に依存する)。

### 推測・評価

- RP文化がGTA6に円滑に移植されるかどうか。
- 公式化がRP文化にとって前進か後退かという評価(当事者間でも対立がある)。

注意点として、GTA6は本記事執筆時点で未発売である。GTA6でRPが思いどおりに楽しめると断定する記事や、プレイ済みを装ってRP機能の詳細を語る情報には注意が必要だ。とりわけ、GTA6がコンソール先行で発売される点と、従来のRPがPC専用の遊びだった点を踏まえると、発売直後から従来型RPが遊べるかのように語る情報は実態と食い違う可能性が高い。実機での検証ができない以上、現時点で確実に言えるのは「RP的な遊びへの需要が存在し、Rockstarがそれを取り込む動きを見せている」というところまでである。RP文化の今後を追ううえでは、Rockstarの公式発表と、リーク・推測を切り分けて受け止める姿勢が欠かせない。

---

*注記：本記事は2026年6月24日時点の公開情報・各メディア報道・当事者の声明等にもとづく。Project ROME、GTA6 OnlineのRP対応、入れる建物の割合などは本記事執筆時点で未確認であり、確定情報とは切り分けて扱う必要がある。新たな公式発表があり次第、内容を更新する。*

こうしたRP文化が実際のサーバーでどう機能しているかは、日本語FiveM RPサーバーの訪問記「[Refloria Townとは？同接216人・ギャング抗争とテリトリー制を備えた日本語RPサーバー](/fivem-gtarp/field-notes/visit-note/refloria-town)」で、ギャング抗争やテリトリー制の実例として見ることができる。`,
  },
  {
    id: 17,
    title: "【公式発表】GTA6の予約購入は6月25日開始 Rockstarがカバーアートとあらすじも公開",
    description:
      "Rockstarが6/18に発表：GTA6の予約購入は6月25日開始。初の公式カバーアートとあらすじも公開。発売日は11月19日で変更なし。確定情報と未発表事項を整理する。",
    icon: "📢",
    image: "/images/news/Official_Cover_Art_landscape.webp",
    category: "release",
    date: "2026-06-18",
    source: "Rockstar Games Newswire",
    sourceUrl: "https://www.rockstargames.com/newswire",
    relatedArticles: [19, 2, 1],
    aiSummary: [
      "Rockstarが6/18に発表：GTA6の予約は6月25日開始、発売は11月19日（PS5／Xbox）で変更なし。",
      "初の公式カバーアートと物語のあらすじも公開された。",
      "価格・エディション・予約特典・PC版時期は当時未発表（6/25に判明）。確定した価格情報は最新記事を参照。",
    ],
    titleEn:
      "[Official Announcement] GTA6 Pre-Orders Start on June 25, with Rockstar Also Unveiling the Cover Art and Story Synopsis",
    descriptionEn:
      "Rockstar announced on June 18 that GTA6 pre-orders will begin on June 25. The first official cover art and story synopsis were also revealed. The release date remains November 19, unchanged. We organize the confirmed information and what has yet to be announced.",
    aiSummaryEn: [
      "Rockstar announced on June 18 that GTA6 pre-orders begin on June 25, with release on November 19 (PS5/Xbox) unchanged.",
      "The first official cover art and the story synopsis were also revealed.",
      "Pricing, editions, pre-order bonuses, and the PC release timing were unannounced at the time (revealed on June 25). For confirmed pricing information, see the latest article.",
    ],
    fullContentEn: `# [Official Announcement] GTA6 Pre-Orders Start on June 25, with Rockstar Also Unveiling the Cover Art and Story Synopsis

On June 18, 2026, Rockstar Games officially announced that pre-orders for Grand Theft Auto VI (GTA6) would begin on June 25. Alongside this, the first official cover art and the story synopsis were revealed. The release date remains November 19, 2026, unchanged. This article organizes what this official announcement made clear and what has yet to be announced. This article is based on information as of June 23, 2026.

*[Update] Pricing and editions were officially announced on June 24, 2026. For the confirmed pricing ($79.99 for Standard / $99.99 for Ultimate), pre-order bonuses, and details on each edition, please see "[GTA6 Editions and Pre-Order Bonuses Explained](/news/19)".*

---

## What Was Officially Announced

The items Rockstar officially made clear in this announcement are as follows.

- The pre-order start date is June 25, 2026. Orders will be accepted at digital stores and some retailers.
- Even now, before pre-orders begin, adding GTA6 to your wishlist on the PlayStation Store or Microsoft Store will let you receive a notification when pre-orders start.
- The first official cover art was released as a 30-second video across social media. It is also offered as downloadable artwork.
- The supported platforms are PlayStation 5 and Xbox Series X|S. The official GTA6 page also clearly states "Pre-order on June 25".
- The release date was reaffirmed as November 19, 2026, with no delay announced.

The cover art centers on the protagonists Jason Duval and Lucia Caminos, with Florida-evoking motifs such as flamingos and alligators, sports cars, helicopters, motorcycles, and boats arranged in the series' signature pop-art style based on purple and orange.

The official synopsis released alongside it presents a storyline in which Jason and Lucia, who have been dealt a tough hand, get caught up in a criminal conspiracy spreading across the entire state of Leonida after one "easy job" goes wrong, and come to rely on each other to survive. The official pre-order page also featured a new screenshot overlooking the streets of Vice City.

---

## What Has Not Yet Been Announced

What is especially important for an official-announcement category is what this announcement "did not touch on". The following are all unannounced at this point and are not confirmed information.

- Pricing: The price for each edition, including the standard edition, has not been announced. Pricing is expected to become clear on June 25, when pre-orders begin.
- Edition lineup: The existence and contents of higher-tier editions beyond the standard edition, or any collector's edition, have not been indicated.
- Pre-order bonuses: Whether there are early pre-order bonuses or bundles has not been made clear.
- PC version: This round of pre-orders is for consoles, and the PC release timing has not been announced. Take-Two has long maintained a console-first approach, with the PC version coming later at an undetermined time.
- Specific retailers: Only "some retailers" is stated, and which stores will handle pre-orders has not been specified.

These details are seen as highly likely to become clear in line with the June 25 pre-order launch.

---

## Supplement: Observations from Various Media and Analysts

From here on, this is not the official announcement but observations and predictions by various media and analysts. We want to handle it separately from official information.

Regarding pricing, analysts have pointed out the possibility that the standard edition could reach $100 given the scale of development, but this is merely a prediction, and Rockstar has stated nothing.

As for the third trailer, because Take-Two CEO Strauss Zelnick had stated to the effect that it would be released "after pre-orders begin", there is a view that it will be released in line with the June 25 pre-order launch. However, there has been no confirmed notice from Rockstar, and it remains unconfirmed at this point.

Regarding the certainty of the release date, in light of how Rockstar announced its two past delays roughly half a year before the then-target dates, and given that no delay has been announced even now with less than half a year remaining until November 19, many take this pre-order launch as a sign that the release date will not move. This too is not an official statement but an industry interpretation.

---

## Summary

What Rockstar officially confirmed this time comes down to three points: that GTA6 pre-orders begin on June 25 for PS5 and Xbox Series X|S, that the first cover art and the story synopsis were revealed, and that the release date remains November 19, 2026.

On the other hand, information that many players want to know, such as pricing, editions, pre-order bonuses, and the PC release timing, was not included in this announcement and is expected to become clear at the June 25 pre-order launch. We should continue to be cautious of information that treats pricing or editions as "already confirmed". We will update this article as soon as the official moves on June 25 become clear.

---

*Note: This article is based on Rockstar Games' official announcement (Newswire and official page) as of June 23, 2026. Pricing, editions, the third trailer, and the PC release timing were unannounced at the time of writing, and the observational portions in the body include unconfirmed predictions by various media and analysts. We will update the content as soon as official follow-up news is released.*`,
    fullContent: `# 【公式発表】GTA6の予約購入は6月25日開始 Rockstarがカバーアートとあらすじも公開

Rockstar Gamesは2026年6月18日、グランド・セフト・オートVI（GTA6）の予約購入を6月25日に開始すると正式に発表した。あわせて初の公式カバーアートと物語のあらすじが公開されている。発売日は2026年11月19日で変更はない。本記事は、この公式発表で何が明らかになり、何がまだ発表されていないのかを整理する。本記事は2026年6月23日時点の情報にもとづく。

※【更新】価格とエディションは2026年6月24日に正式発表されました。確定した価格(Standard 79.99／Ultimate 99.99ドル)・予約特典・各エディションの詳細は「[GTA6のエディションと予約特典まとめ](/news/19)」をご覧ください。

---

## 公式に発表された内容

今回の発表でRockstarが公式に明らかにした事項は次の通りである。

- 予約開始日は2026年6月25日。デジタルストアおよび一部の小売店で受け付ける。
- 予約開始前の現時点でも、PlayStation StoreまたはMicrosoft StoreでGTA6をウィッシュリストに登録しておくと、予約が始まった際に通知を受け取れる。
- 初の公式カバーアートを30秒の動画として各SNSで公開。ダウンロード用のアートワークとしても提供されている。
- 対象プラットフォームはPlayStation 5とXbox Series X|S。公式のGTA6ページにも「Pre-order on June 25」と予約日が明記されている。
- 発売日は2026年11月19日であらためて示され、延期は告知されていない。

カバーアートには、主人公のジェイソン・デュバルとルシア・カミノスを中心に、フラミンゴやワニといったフロリダを思わせるモチーフ、スポーツカー、ヘリコプター、バイク、ボートなどが、シリーズ恒例の紫とオレンジを基調としたポップアート調で配置されている。

あわせて公開された公式のあらすじは、不利な状況に置かれてきたジェイソンとルシアが、ある「簡単な仕事」の失敗をきっかけに、レオニダ州全体に広がる犯罪の陰謀に巻き込まれ、生き延びるために互いに頼り合うことになる、という筋書きを示している。また公式の予約ページには、バイスシティの市街を一望する新たなスクリーンショットも掲載された。

---

## まだ発表されていないこと

公式発表カテゴリとして特に重要なのは、今回の発表で「触れられなかった」点である。以下はいずれも現時点で未発表であり、確定情報ではない。

- 価格：標準版を含むエディションごとの価格は発表されていない。価格は予約が始まる6月25日に判明する見込みとされている。
- エディション構成：標準版以外の上位版やコレクターズ版の有無・内容は示されていない。
- 予約特典：早期予約の特典やバンドルの有無は明らかにされていない。
- PC版：今回の予約はコンソール向けであり、PC版の発売時期は発表されていない。Take-Twoはかねてよりコンソール先行で、PC版は時期未定の後発になるとしている。
- 具体的な販売店：「一部の小売店」とされるのみで、どの店舗が予約を扱うかは明示されていない。

これらの詳細は、6月25日の予約開始にあわせて判明する可能性が高いと見られる。

---

## 補足：各メディア・アナリストの観測

ここからは公式発表ではなく、各メディアやアナリストによる観測・予想である。公式情報と切り分けて扱いたい。

価格については、開発規模の大きさから標準版が100ドルに達する可能性をアナリストが指摘しているが、これはあくまで予想であり、Rockstarは何も明言していない。

トレーラー第3弾については、Take-Twoのストラウス・ゼルニックCEOが「予約開始後に公開する」との趣旨を述べていたことから、6月25日の予約開始にあわせて公開されるとの見方がある。ただしRockstarからの確定告知はなく、現時点では未確定である。

発売日の確度については、Rockstarが過去2回の延期をいずれも当時の目標日のおよそ半年前に告知してきた経緯を踏まえ、すでに11月19日まで半年を切った現在まで延期の告知がないことから、今回の予約開始は発売日が動かないサインと受け止める向きが多い。これも公式の言明ではなく、業界の解釈である。

---

## まとめ

今回Rockstarが公式に確定させたのは、「GTA6の予約購入が6月25日にPS5・Xbox Series X|S向けに始まること」「初のカバーアートと物語のあらすじを公開したこと」「発売日は2026年11月19日で変わらないこと」の三点である。

一方で、価格・エディション・予約特典・PC版の時期といった、多くのプレイヤーが知りたい情報は今回の発表には含まれておらず、6月25日の予約開始時に明らかになる見込みである。価格やエディションを「すでに確定済み」とする情報には引き続き注意したい。6月25日の正式な動きが判明し次第、本記事の内容を更新する。

---

*注記：本記事は2026年6月23日時点のRockstar Games公式発表（Newswire・公式ページ）にもとづく。価格・エディション・トレーラー第3弾・PC版の時期などは本記事執筆時点で未発表であり、本文中の観測部分は各メディアおよびアナリストによる未確認の予想を含む。公式の続報が出次第、内容を更新する。*`,
  },
  {
    id: 16,
    title:
      "GTAオンライン最新アップデート解説 「Fine Art Collector」開始、最大GTA$150万と新ハイスト「The Kortz Center Heist」",
    description:
      "期間限定の報酬プログラム「Fine Art Collector」が6/18開始。プレイするだけで最大GTA$150万＋無料車両。7月の新ハイスト「The Kortz Center Heist」への準備イベント。",
    icon: "🎨",
    image: "/images/news/kortzcenterheist.webp",
    category: "update",
    date: "2026-06-18",
    source: "Rockstar Games Newswire",
    sourceUrl: "https://www.rockstargames.com/newswire",
    relatedArticles: [36, 31, 2],
    aiSummary: [
      "期間限定の報酬プログラム「Fine Art Collector」が6月18日から7月13日まで開催されている。",
      "達成条件で3ティアに分かれ、現金は合計で最大GTA$150万、無料車両や衣装も入手できる。",
      "7月配信予定の新ハイスト「The Kortz Center Heist」への準備イベントで、配信日は公式未確定。",
    ],
    titleEn:
      "GTA Online Latest Update Explained: Fine Art Collector Begins, Up to GTA$1,500,000 and the New Heist The Kortz Center Heist",
    descriptionEn:
      "The limited-time reward program Fine Art Collector started on June 18. Just by playing, you can earn up to GTA$1,500,000 plus a free vehicle. It is a lead-up event for July's new heist, The Kortz Center Heist.",
    aiSummaryEn: [
      "The limited-time reward program Fine Art Collector is running from June 18 to July 13.",
      "It is split into three tiers by achievement requirements, with cash totaling up to GTA$1,500,000, plus free vehicles and outfits.",
      "It is a lead-up event for the new heist The Kortz Center Heist, scheduled for July, with the release date not officially confirmed.",
    ],
    fullContentEn: `# GTA Online Latest Update Explained: Fine Art Collector Program Begins, Up to GTA$1,500,000 and the New Heist The Kortz Center Heist

In GTA Online, the limited-time reward program Fine Art Collector has begun. It is a lead-up event for the new heist The Kortz Center Heist scheduled for July, and simply by meeting conditions such as logging in or completing existing heists, you can earn rewards including up to GTA$1,500,000 in cash and free vehicles. The event runs from June 18 to July 13, 2026. This article organizes the key points of the program.

---

## The Key Points First

- Event name: Fine Art Collector program
- Period: June 18 to July 13, 2026
- Purpose: Preparation for the new heist The Kortz Center Heist, scheduled for July
- Rewards: Split into three tiers, with cash totaling up to GTA$1,500,000 plus free vehicles, outfits, and more
- For the most part, you can receive some of the rewards just by playing GTA Online

---

## The Three Tiers and Rewards

This program is divided into three stages based on achievement requirements. The lower tiers have easier conditions, while the higher ones require more preparation.

### Tier 1: Enthusiast

- Condition: Play GTA Online during the period from June 18 to July 13
- Reward: GTA$500,000 plus the free vehicle Benefactor Turreted Limo (a turreted limousine/sedan)
- This limo is armored, seats up to five, and mounts a minigun on the roof. It can be requested for free through Pegasus from the Interaction Menu
- Delivery: Within 72 hours of meeting the condition

This is the most accessible tier, effectively achievable just by logging in and playing.

### Tier 2: Patron

- Condition: Complete any heist in GTA Online during the period from June 18 to July 13
- Reward: NOOSE outfit plus GTA$1,000,000
- Delivery: Within 72 hours of meeting the condition

Combining Tier 1 and Tier 2 yields GTA$1,500,000 in cash alone. This is the breakdown of the up to GTA$1,500,000 figure.

### Tier 3: Elitist

- Condition: Own a mansion, and on top of that, play during the period from June 18 to July 13
- Reward (granted together when the new heist launches): the following four items
- A GTA$1,000,000 discount on the cost of the Art Studio expansion required to start the new heist
- The free helicopter Annihilator Stealth (from Warstock)
- One Sculpture to decorate the mansion
- The right to unlock a special Painting

- Delivery: Unlike the other two tiers, the rewards are granted in July at the time The Kortz Center Heist launches

This tier is positioned for players who want to host the new heist, and it requires owning a mansion.

---

## What Is the New Heist The Kortz Center Heist?

The main event that this program is preparing for is the new heist The Kortz Center Heist, scheduled for July.

The setting is the Kortz Center, an art facility in Pacific Bluffs, Los Santos. It is described as a multi-stage robbery mission targeting a cultural facility frequented by many collectors and celebrities. To plan and start this heist as a leader, you must own a mansion and build the Art Studio expansion. The Elitist tier discount goes toward this expansion cost.

Regarding the release timing, Rockstar has only announced July. Various outlets predict that Tuesday, July 14, immediately after the program's end date of July 13, is the strongest candidate, but this is purely speculation, and the official date will have to wait for an official announcement. Note that several outlets see this robbery as the first new heist in about two years, and likely the last major update to current GTA Online before the November 2026 release of GTA6. This too is observation rather than an official statement.

---

## Concurrent This Week's Bonuses

In parallel with the Fine Art Collector program, the usual weekly bonuses are also running. The main ones are as follows.

- The Diamond Casino Heist finale pays double (through June 24). Furthermore, taking the Daily Vault in the finale grants GTA$100,000 plus 10,000 RP
- Owners of the PS4/Xbox One version of GTA5 can upgrade to the PS5/Xbox Series X|S version at no additional cost. Save data for both Story Mode and GTA Online can be carried over
- Buying a Shark Card (Great White/Whale/Megalodon) grants a 40% GTA$ bonus. Linking your Rockstar account and GTA Online character is required, and it runs through July 22
- Linking your Rockstar account with Discord, joining the official server, and playing by July 1 grants the outfit Burgundy Rockstar Varsity Crewneck

If you are considering buying a mansion ahead of the new heist, discounts on luxury real estate are available for GTA+ members, and the Shark Card bonus above is also a way to prepare funds.

---

## Tips and Notes for Claiming Rewards

- Enthusiast and Patron rewards are granted within 72 hours of meeting the conditions. There is no need to panic if they do not appear right away
- Only the Elitist rewards arrive not immediately but all together when the new heist launches in July
- For all tiers, the eligible period runs through July 13. Once the deadline passes you can no longer meet the conditions, so if you want to at least claim the cash and free vehicle, it is a good idea to play once within the period
- The double-payout Casino Heist runs only through June 24, a short window, so these few days are the prime opportunity if you want to earn efficiently

---

## Summary

The Fine Art Collector program is a lead-up event for July's new heist The Kortz Center Heist, and its content is reward-focused, letting you earn cash and free vehicles just by playing. Achieving Enthusiast and Patron yields GTA$1,500,000 in cash, and mansion owners can additionally receive benefits such as the Art Studio expansion discount.

The period runs through July 13. Since the exact release date of the main new heist has only been announced as July, we will organize it again once confirmed information is available.

---

*Note: This article is based on Rockstar Games' official announcement (Newswire) as of June 2026. Points such as the specific release date of the new heist and whether it will be the last major update include observations from various outlets and have not been officially confirmed.*

*[Update] The new heist previewed here, The Kortz Center Heist, was released on July 14, 2026. For what shipped and how to prepare, see "[GTA Online's New Heist: The Kortz Center Heist Arrives July 14](/en/news/36)".*`,
    fullContent: `# GTAオンライン最新アップデート解説 「Fine Art Collector」プログラム開始、最大GTA$150万と新ハイスト「The Kortz Center Heist」

GTAオンラインで、期間限定の報酬プログラム「Fine Art Collector（ファインアート・コレクター）」が始まった。7月に予定される新ハイスト「The Kortz Center Heist（コルツ・センター強盗）」に向けた準備イベントで、ログインや既存ハイストのクリアといった条件を満たすだけで、最大でGTA$1,500,000の現金や無料車両などの報酬が手に入る。開催期間は2026年6月18日から7月13日まで。本記事はこのプログラムの要点を整理する。

---

## まず要点だけ

- イベント名：Fine Art Collector プログラム
- 期間：2026年6月18日〜7月13日
- 目的：7月配信予定の新ハイスト「The Kortz Center Heist」への準備
- 報酬：3つのティア（段階）に分かれ、合計で最大GTA$1,500,000の現金＋無料車両＋衣装など
- 基本的にはGTAオンラインをプレイするだけで一部の報酬が受け取れる

---

## 3つのティアと報酬

このプログラムは達成条件によって3段階に分かれている。下のティアほど条件が簡単で、上に行くほど準備が必要になる。

### ティア1：Enthusiast（エンスージアスト）

- 条件：6月18日〜7月13日の期間中にGTAオンラインをプレイする
- 報酬：GTA$500,000 ＋ 無料車両「Benefactor Turreted Limo（タレット付きリムジン／セダン）」
- このリムジンは装甲を備え、5人まで乗車でき、ルーフにミニガンを搭載する。ペガサスを通じてインタラクションメニューから無料で配車できる
- 受け取り：条件達成から72時間以内

実質的にログインしてプレイするだけで達成できる、最も手軽なティアである。

### ティア2：Patron（パトロン）

- 条件：6月18日〜7月13日の期間中に、GTAオンラインのいずれかのハイストをクリアする
- 報酬：NOOSEアウトフィット（衣装）＋ GTA$1,000,000
- 受け取り：条件達成から72時間以内

ティア1とティア2を合わせると、現金だけでGTA$1,500,000になる。これが「最大GTA$150万」の内訳である。

### ティア3：Elitist（エリーティスト）

- 条件：マンションを所有していること。そのうえで6月18日〜7月13日の期間中にプレイする
- 報酬（新ハイスト配信時にまとめて付与）：以下の4点
- ・新ハイスト開始に必要な「アートスタジオ」増築の費用がGTA$1,000,000割引
- ・無料ヘリ「Annihilator Stealth」（Warstockより）
- ・マンションを飾るための彫刻（Sculpture）1点
- ・特別な絵画（Painting）を解放できる権利
- 受け取り：ほかの2ティアと異なり、報酬は7月に「The Kortz Center Heist」が配信されたタイミングで付与される

このティアは新ハイストをホスト（主催）したいプレイヤー向けの位置づけで、マンション所有が前提になる。

---

## 新ハイスト「The Kortz Center Heist」とは

このプログラムが準備イベントとなっている本編が、7月配信予定の新ハイスト「The Kortz Center Heist」である。

舞台は、ロスサントスのパシフィック・ブラフスにある美術施設「コルツ・センター」。多くの収集家やセレブが集う文化施設を標的にした多段階の強盗ミッションとされる。このハイストをリーダーとして計画・開始するには、マンションを所有したうえで「アートスタジオ」の増築が必要になる。Elitistティアの割引は、この増築費用に充てられる。

配信時期についてRockstarは「7月」とのみ告知している。プログラムの終了日（7月13日）の直後にあたる7月14日（火）が有力と各メディアは予想しているが、これはあくまで推測であり、正式な日付は公式発表を待つ必要がある。なお複数のメディアは、この強盗が約2年ぶりの新規ハイストであり、2026年11月のGTA6発売前における現行GTAオンラインの最後の大型アップデートになる可能性が高いと見ている。これも公式の言及ではなく観測である点に留意したい。

---

## 同時開催の「今週のボーナス」

Fine Art Collectorプログラムと並行して、通常の週替わりボーナスも実施されている。主なものは次の通り。

- ダイヤモンドカジノ強盗のフィナーレが配当2倍（6月24日まで）。さらにフィナーレで「デイリー・ボールト」を奪うとGTA$100,000＋10,000RPが得られる
- PS4・Xbox One版GTA5の所有者は、PS5・Xbox Series X|S版へ追加費用なしでアップグレード可能。ストーリーモードとGTAオンライン両方のセーブデータを引き継げる
- シャークカード（Great White／Whale／Megalodon）の購入でGTA$が40%ボーナス。RockstarアカウントとGTAオンラインのキャラクターの連携が条件で、7月22日まで
- RockstarアカウントをDiscordと連携し、公式サーバーに参加して7月1日までにプレイすると、衣装「Burgundy Rockstar Varsity Crewneck」がもらえる

新ハイストに向けてマンション購入を考えている場合、GTA+メンバー向けに高級不動産の割引が用意されているほか、上記のシャークカードボーナスも資金準備の手段になる。

---

## 受け取りのコツと注意点

- EnthusiastとPatronの報酬は、条件達成から72時間以内に付与される。すぐ反映されなくても慌てる必要はない
- Elitistの報酬だけは即時ではなく、7月の新ハイスト配信時にまとめて届く
- いずれのティアも対象期間は7月13日まで。期限を過ぎると条件を満たせないため、現金や無料車両だけでも受け取っておくなら、期間内に一度プレイしておくとよい
- 「配当2倍」のカジノ強盗は6月24日までと期間が短いため、効率よく稼ぐならこの数日が狙い目になる

---

## まとめ

Fine Art Collectorプログラムは、7月の新ハイスト「The Kortz Center Heist」に向けた準備イベントであり、プレイするだけで現金や無料車両が手に入る報酬中心の内容になっている。EnthusiastとPatronを達成すれば現金GTA$1,500,000、マンション所有者はさらにアートスタジオ増築の割引などを受けられる。

期間は7月13日まで。新ハイスト本編の正確な配信日は7月としか公表されていないため、確定情報が出次第あらためて整理する。

---

*注記：本記事は2026年6月時点のRockstar Games公式発表（Newswire）にもとづく。新ハイストの具体的な配信日や、最後の大型アップデートになるかといった点は各メディアの観測を含み、公式に確定したものではない。*

※【続報】ここで予告した新ハイスト「The Kortz Center Heist」は、2026年7月14日に配信されました。配信された内容と準備のポイントは「[GTA Online、新たな強盗「The Kortz Center Heist」を7月14日配信](/news/36)」で解説しています。`,
  },
  {
    id: 15,
    title: "GTA6のNPCは「背景」を卒業するのか？",
    description:
      "街の住人は本当に進化するのか。特許・リーク・RDR2の系譜から、GTA6のNPCがどこまで賢くなりうるかを整理する。",
    icon: "🧠",
    image: "/images/news/npchahaikeiwosotugyousuruka.webp",
    category: "speculation",
    date: "2026-06-22",
    source: "各リーカー／海外メディア報道",
    sourceUrl: "#",
    relatedArticles: [12, 14, 4],
    aiSummary: [
      "GTA5のNPCは動く背景に近かったが、GTA6では大きく進化する可能性が注目されている。",
      "Take-Twoの仮想ナビ特許は公式の足跡だが、リーク段階のNPC対話システムは未確認情報である。",
      "進化の正体はリアルタイムAIより膨大な状況別データの作り込みとみる整理が妥当とされる。",
    ],
    titleEn: "Will GTA6's NPCs Graduate From Being the Background?",
    descriptionEn:
      "Will the city's residents really evolve? From patents, leaks, and the RDR2 lineage, we sort out just how smart GTA6's NPCs could become.",
    aiSummaryEn: [
      "GTA5's NPCs were close to a moving backdrop, but in GTA6 the possibility of a major evolution is drawing attention.",
      "Take-Two's virtual navigation patent is an official footprint, but the leaked NPC dialogue system is unverified information.",
      "It is considered reasonable to read the evolution as the crafting of vast situation-specific data rather than real-time AI.",
    ],
    fullContentEn: `# Will GTA6's NPCs Graduate From Being the Background? Reading It Through Patents, Leaks, and the RDR2 Lineage

With its release on November 19, 2026, drawing near, Grand Theft Auto VI (GTA6) has, alongside its graphics and the size of its map, recently been quietly drawing attention for the craftsmanship of its NPCs (non-player characters, i.e., the residents). Quite a few people who watched the trailers felt that the people in the city somehow seem different from before. That intuition has several pieces of backing — patents, leaks, and the accumulation of the previous title, Red Dead Redemption 2 (RDR2). Separating confirmed facts from unverified leaks, we sort out just how far GTA6's NPCs could evolve.

---

## GTA5's NPCs Were a Moving Background

First, let us confirm the starting point. To put it frankly, GTA5's NPCs were close to a moving background. They walk on the sidewalks, sit on benches, and if you talk to them they give a fixed reaction and that is it. The next day they are standing in the same spot as if nothing had happened. No matter how elaborate the world was, only the residents felt somehow artificial.

This is not a problem limited to GTA5; it is also a challenge that the open-world genre has carried for many years. Even if you build a vast map, if the people living there have no substance, you end up feeling as though you are walking through an elaborate stage set. How GTA6 clears this wall is the highlight this time.

---

## Officially Confirmable Clues: Take-Two's Patent

In trying to forecast the evolution of NPCs, one of the few official footprints is the patent.

In October 2020, Take-Two (Rockstar's parent company) filed a patent concerning virtual navigation in a game environment (granted as US patent US11684855B2). The inventors include Rockstar's AI lead Simon Parr and technical director David Hynd.

This patent positions conventional NPC navigation (a method that traces nodes — segments of a pre-prepared route) as unsatisfactory, and its content aims to realize a more natural virtual world unbound by hardware or software constraints. It envisions behavior such as NPCs moving while judging traffic volume, road conditions, and weather in real time.

However, what should be noted is that the existence of a patent is proof that the technology was researched, not a guarantee that it will definitely be implemented in GTA6. Neither Rockstar nor Take-Two has officially explained the relationship between this patent and GTA6. Still, since the inventors are core developers at Rockstar North, it is natural to view it as research and development with the next title in mind.

---

## The Leaks About an NPC Dialogue System That Erupted From March Onward

From here we enter the realm of unverified leaks. In the spring of 2026, concrete leaks about NPCs surfaced one after another. Many of the sources are Reddit posts, said to be testimony from people who claim to have been involved in development, but in every case Rockstar has not commented on the content.

What multiple leaks describe in common is that GTA6's NPC dialogue system is on a scale that is a different thing from GTA5. To organize the key points:

- It is said that a vast amount of recorded dialogue is prepared even just for the background characters. Rather than shuffling limited lines as in GTA5, it is described as a mechanism in which lines are selected according to the situation.
- The lines change with context. Did the NPC witness the player's crime, does the other party recognize the player, is it a first meeting or a reunion, what is the weather and time of day — under such conditions, what they say and the tone are said to change.
- NPCs continue conversations with each other. Rather than one person muttering a single line and walking off, there are said to be scenes where multiple NPCs hold up an exchange of conversation.
- A mechanism called dialogue decay. It is described as a design that draws from a large number of variations so that even if the player lingers in the same place for a long time, it is hard to feel the same lines repeating.
- There is also testimony that voice actors recorded large amounts of lines with the same intent in multiple tones, such as neutral, panicked, and whispered. It is also reported that someone described this as work closer to building a database than to ordinary voice recording.

To repeat, all of this is unverified information. That said, given that Rockstar North is said to be pouring an enormous sum into this project (in some reports a cumulative total exceeding 2 billion dollars), the claim itself that it is allocating budget to immersion has a certain persuasiveness.

---

## Driving, Police, Crowds — A Direction in Which the Whole City Reacts

The evolution of NPCs does not stop at conversation. Leaks and the leaked footage from 2022 hint at a direction in which the world itself becomes reactive.

Around driving, more natural behavior has been reported, such as NPC vehicles changing lanes according to the flow of traffic and road conditions, slowing down in residential areas, and shifting lanes just before a highway exit. This is content that also matches the aforementioned virtual navigation patent.

Regarding the reactions of police and crowds, behaviors have been pointed out from the leaked footage, such as surrounding pedestrians panicking and reporting it when you draw a gun in a public place, and the player automatically hiding a gun in a crowd. There are also rumors of a reworked wanted level and a police AI whose response speed changes according to the severity of the crime, but these are based on the old 2022 leak, and whether they are in the final version as is remains unknown.

Among these, what became a topic in the community was the rumor that NPCs who hear gunshots spread it on social media. It is an idea that tries to bring real-world behavior into the game, a very GTA-like satire, but this too is not a story with confirmation.

---

## RDR2 as the Setup

Indispensable to understanding the image of GTA6's NPCs is the existence of the previous title, RDR2.

In RDR2, Rockstar built from scratch an interaction system in which NPCs react according to context. The protagonist Arthur can greet, antagonize, or tip his hat to strangers, and they remember past exchanges. Shopkeepers, sheriffs, travelers passing by — each had the feel of living there. RDR2 stepped one pace into a level that GTA5 did not reach.

GTA6 is seen as trying to realize this philosophy with the processing power of current-generation hardware (PS5 / Xbox Series X|S), and moreover at the population density of a city. A former Rockstar audio designer has speculated that GTA6 may inherit and develop RDR2's system (though they themselves disclaim having any inside information).

However, between RDR2, set in rural towns, and Vice City, where people and cars are densely packed, the technical difficulty is on a completely different level. The number of NPCs, the speed of exchanges, the chaos that a work like GTA invites — all of these become high hurdles in making this mechanism work.

---

## What NPCs That Remember Would Bring

If NPCs were to remember the player's actions, the game experience itself would change.

Someone you treated roughly might be frightened the next time you meet. A resident you were kind to might lend you a hand somewhere. If you rampage too much in a certain area, the air of that whole district might change. In a world where NPCs remember you, weight is born in the player's behavior itself. This is not merely an advance in technology but also a change that questions your way of being as a player.

In RDR2, the townspeople changed their attitude according to the player's reputation (honor) and referred to past events. If a more meticulous memory is implemented in GTA6 as an extension of that, the ways to play in the sandbox will expand greatly.

---

## Between Expectation and Composure

Finally, let us put a check on excessive expectations.

Some experts point out that fully adopting generative AI for NPCs is unrealistic both technically and in terms of cost. Considering GTA6's development period, the view is that it is difficult to load cutting-edge AI as is. In fact, many of the leaks introduced so far are stories in the direction of crafting a vast number of patterns in advance, which is different in nature from a story of AI generating lines on the spot. The reason NPCs look alive is, more than the gift of real-time AI, largely due to the crafting of vast situation-specific data — that is the reasonable read at this point.

Rockstar is a company that has not spoken of technical keywords itself and has shown things through the actual product rather than words. That is precisely why, taking it all together — the official footprint of the patent, the track record of RDR2, and the precision of behavior confirmable in the trailers — there is ample possibility that an evolution that can be called another dimension from GTA5 is occurring. Many parts are not confirmed, but we want to wait with expectation for the moment when the city's residents graduate from the background.

---

*Note: Among the content of this article, the parts concerning the NPC dialogue system, AI behavior, the reactions of police and crowds, and the inheritance from RDR2 contain much speculation based on unverified leaks and leaked footage. These are not official announcements by Rockstar Games or Take-Two Interactive. The existence of Take-Two's patent (US11684855B2) and the main game's release date (November 19, 2026 / PS5 and Xbox Series X|S) are based on confirmable facts.*`,
    fullContent: `# GTA6のNPCは「背景」を卒業するのか？ 特許・リーク・RDR2の系譜から読み解く

2026年11月19日の発売が迫る『Grand Theft Auto VI（GTA6）』。グラフィックやマップの広さと並んで、近ごろ静かに注目を集めているのがNPC（ノンプレイヤーキャラクター＝住人）の作り込みだ。トレーラーを見て「街の人が、なんだか今までと違う」と感じた人は少なくない。その直感には、特許やリーク、そして前作レッド・デッド・リデンプション2（RDR2）の積み重ねという、いくつもの裏づけがある。確定情報と未確認のリークを切り分けながら、GTA6のNPCがどこまで進化しうるのかを整理する。

---

## GTA5のNPCは「動く背景」だった

まず出発点を確認しておきたい。GTA5のNPCは、率直に言えば「動く背景」に近い存在だった。歩道を歩き、ベンチに座り、話しかければ決まった反応を返して終わる。翌日には何事もなかったように同じ場所に立っている。世界がどれだけ精巧でも、住人だけがどこか作り物めいていた。

これはGTA5に限った話ではなく、オープンワールドというジャンルが長年抱えてきた課題でもある。広大なマップを作っても、そこに暮らす人々に手応えがなければ、結局は精巧な舞台セットを歩いているような感覚になってしまう。GTA6がこの壁をどう越えるのかが、今回の見どころだ。

---

## 公式に確認できる手がかり：Take-Twoの特許

NPCの進化を占ううえで、数少ない「公式の足跡」と言えるのが特許だ。

Take-Two（Rockstarの親会社）は2020年10月、ゲーム環境における仮想ナビゲーションに関する特許を申請している（米国特許US11684855B2として成立）。発明者にはRockstarのAIリードであるSimon Parr氏と、テクニカルディレクターのDavid Hynd氏が名を連ねる。

この特許は、従来型のNPCナビゲーション（あらかじめ用意された経路の節＝ノードをたどる方式）を物足りないものと位置づけ、ハードやソフトの制約に縛られない、より自然な仮想世界の実現を狙う内容になっている。NPCが交通量や道路状況、天候などをリアルタイムで判断して動く、といった挙動が想定されている。

ただし注意したいのは、特許の存在は「その技術を研究した」ことの証明であって、「GTA6に必ず実装される」ことの保証ではない、という点だ。RockstarもTake-Twoも、この特許とGTA6の関係を公式には説明していない。とはいえ発明者がRockstar Northのコア開発者である以上、次回作を見据えた研究開発と見るのは自然だろう。

---

## 3月以降に噴き出した「NPC対話システム」のリーク

ここからは未確認のリーク領域に入る。2026年春、NPCに関する具体的なリークが立て続けに表面化した。発信源の多くはReddit投稿で、開発に関わったと称する人物の証言とされるが、いずれもRockstarは内容にコメントしていない。

複数のリークが共通して語っているのは、GTA6のNPC対話システムが、GTA5とは別物の規模になっているという点だ。要点を整理すると次のようになる。

- 背景キャラクターのぶんだけでも、膨大な量の収録セリフが用意されているとされる。GTA5のように限られたセリフをシャッフルするのではなく、状況に応じてセリフが選ばれる仕組みだという。
- セリフは文脈で変化する。プレイヤーの犯罪を目撃したか、相手がプレイヤーを認識しているか、初対面か再会か、天候や時間帯はどうか——こうした条件で話す内容やトーンが変わるとされる。
- NPC同士が会話を続ける。ひとりが一言つぶやいて去るのではなく、複数のNPCが会話のやり取りを成立させる場面があるという。
- 「ダイアログ・ディケイ（dialogue decay）」と呼ばれる仕組み。プレイヤーが同じ場所に長くとどまっても、同じセリフの繰り返しを感じにくいよう、多数のバリエーションから引き出す設計とされる。
- 声優は、同じ趣旨のセリフを中立・パニック・ささやきといった複数のトーンで大量に録音したという証言もある。これは通常のボイス収録というより「データベースを作る」作業に近い、という趣旨の発言も伝えられている。

繰り返すが、これらはすべて未確認情報だ。ただ、Rockstar Northがこのプロジェクトに巨額（一部報道では累計20億ドル超）を投じているとされることを踏まえると、没入感に予算を割いているという話自体には一定の説得力がある。

---

## 運転・警察・群衆——「街全体が反応する」方向性

NPCの進化は会話だけにとどまらない。リークや2022年の流出映像からは、世界そのものが反応的になる方向性がうかがえる。

運転まわりでは、NPC車両が交通の流れや道路状況に応じて車線変更したり、住宅街では速度を落としたり、高速の出口手前で車線を移したりといった、より自然な挙動が報告されている。前述の「仮想ナビゲーション」特許とも符合する内容だ。

警察や群衆の反応についても、公共の場で銃を抜くと周囲の歩行者がパニックになり通報する、プレイヤーが人混みで自動的に銃を隠す、といった挙動が流出映像から指摘されている。手配度（wanted level）の見直しや、犯罪の重さに応じて反応速度が変わる警察AIといった噂もあるが、これらは2022年の古い流出に基づくもので、最終版にそのまま入っているかは不明だ。

なかでもコミュニティで話題になったのが「銃声を聞いたNPCがSNSで拡散する」という噂だ。現実社会の振る舞いをゲーム内に持ち込もうとする発想で、いかにもGTAらしい風刺だが、これも確証のある話ではない。

---

## RDR2という「前振り」

GTA6のNPC像を理解するうえで欠かせないのが、前作RDR2の存在だ。

RDR2でRockstarは、NPCが文脈に応じて反応するインタラクションシステムを一から作り込んだ。主人公アーサーは見知らぬ人に挨拶したり、絡んだり、帽子を傾けたりでき、相手は過去のやり取りを覚えている。店主、保安官、すれ違う旅人——それぞれが「そこに暮らしている」感触を持っていた。GTA5が届かなかった水準に、RDR2は一歩踏み込んでいた。

GTA6は、この思想を現世代ハード（PS5／Xbox Series X|S）の処理能力で、しかも都市の人口密度で実現しようとしていると見られている。元Rockstarのオーディオデザイナーが、GTA6はRDR2のシステムを引き継いで発展させる可能性があると推測している（本人も内部情報はないと断っている）。

ただし、田舎町を舞台にしたRDR2と、人とクルマが密集するヴァイスシティでは、技術的な難易度がまるで違う。NPCの数、やり取りの速さ、GTAという作品が招き寄せる混沌——どれもが、この仕組みを成立させるうえでの高いハードルになる。

---

## 「記憶するNPC」がもたらすもの

仮にNPCがプレイヤーの行動を覚えているとしたら、ゲーム体験そのものが変わる。

乱暴に扱った相手が、次に会ったとき怯えるかもしれない。親切にした住人が、どこかで力を貸してくれるかもしれない。ある地域で暴れすぎれば、その一帯の空気が変わるかもしれない。NPCが自分を「覚えている」世界では、プレイヤーの振る舞いそのものに重みが生まれる。これは単なる技術の進歩ではなく、プレイヤーとしての「在り方」を問う変化でもある。

RDR2では、町の人々がプレイヤーの評判（オナー）に応じて態度を変え、過去の出来事に言及した。その延長線上に、より緻密な「記憶」がGTA6で実装されるなら、サンドボックスの遊び方は大きく広がる。

---

## 期待と、冷静さのあいだで

最後に、過度な期待には釘を刺しておきたい。

一部の専門家は、生成AIをNPCに全面採用するのは技術的にもコスト的にも現実的ではないと指摘している。GTA6の開発期間を考えれば、最先端のAIをそのまま載せるのは難しい、という見方だ。実際、ここまで紹介したリークの多くは「事前に膨大なパターンを作り込む」方向の話であって、その場でAIがセリフを生成するという話とは性質が異なる。NPCが「生きている」ように見えるのは、リアルタイムAIの賜物というより、膨大な状況別データの作り込みによる部分が大きい、という整理が現時点では妥当だろう。

Rockstarは技術的なキーワードを自ら語らず、言葉より実物で見せてきた会社だ。だからこそ、特許という公式の足跡、RDR2という実績、そしてトレーラーで確認できる挙動の精度——これらを総合すれば、GTA5から「別次元」と呼べる進化が起きている可能性は十分にある。確定していない部分も多いが、街の住人が背景を卒業する瞬間を、期待して待ちたい。

---

*※本記事のうち、NPCの対話システム、AI挙動、警察・群衆の反応、RDR2からの継承に関する内容には、未確認のリーク情報や流出映像に基づく推測が多く含まれます。Rockstar GamesおよびTake-Two Interactiveによる公式発表ではありません。Take-Twoの特許（US11684855B2）の存在や、本編発売日（2026年11月19日／PS5・Xbox Series X|S）などは確認できる事実に基づいています。*`,
  },
  {
    id: 14,
    title: "GTA6のオンラインはいつ始まる？",
    description:
      "13年続いたGTA Onlineの後継はいつ来るのか。発売後ロールアウト説と、新基盤「Project ROME」の噂を整理する。",
    icon: "🌐",
    image: "/images/news/on-linehaituhajimaruka.webp",
    category: "speculation",
    date: "2026-06-21",
    source: "各リーカー／海外メディア報道",
    sourceUrl: "#",
    relatedArticles: [13, 2, 19],
    aiSummary: [
      "GTA6のオンラインは公式未発表だが、ほぼ確実に用意されると業界では見られている。",
      "過去作の例から開始は発売と同時でなく、11月下旬から12月中旬が有力との推測がある。",
      "旧作の資産は引き継がれない新世界の見込みで、新基盤Project ROMEは噂段階にとどまる。",
    ],
    titleEn:
      "When Does GTA6 Online Begin? Sorting Out the Post-Launch Rollout Theory and the Project ROME Rumors",
    descriptionEn:
      "When will the successor to the 13-year-long GTA Online arrive? We sort out the post-launch rollout theory and the rumors of a new platform, Project ROME.",
    aiSummaryEn: [
      "GTA6's online mode has not been officially announced, but the industry sees it as almost certain to be prepared.",
      "Based on the precedent of past titles, there is speculation that it will not launch at the same time as the game, with late November to mid-December seen as most likely.",
      "It is expected to be a new world that does not carry over assets from older titles, while the new platform Project ROME remains at the rumor stage.",
    ],
    fullContentEn: `# When Does GTA6 Online Begin? Sorting Out the Post-Launch Rollout Theory and the Project ROME Rumors

Grand Theft Auto VI (GTA6), whose release on November 19, 2026, is now confirmed. While attention is focused on the main story, what many players care about is the question of when the online mode will become playable. As the successor to the massive live service that was GTA Online, which ran for 13 years, expectations are high. To get straight to the point, the online mode is seen as almost certain to be prepared, but it is likely to start not at the same time as the game's release, but several weeks to about a month later. We sort out what is known at this point, from past patterns and the latest leaks to the rumors of a new platform called Project ROME.

---

## The Premise to Keep in Mind First: The Online Mode Has Not Yet Been Officially Announced

It may come as a surprise, but neither Rockstar nor Take-Two Interactive has officially announced GTA6's online mode. As things stand, not even the fact that it is in development has been officially acknowledged.

Even so, the reason the industry view is nearly unanimous that online is coming is that the very business model of the GTA series is built on the premise of online play. Take-Two's earnings outlook also strongly factors in the growth of a live service centered on GTA6. In other words, the point of debate is not whether it exists, but when and in what form it will arrive.

---

## The Past Pattern: The Main Game First, Online Later

The most useful reference for predicting the timing is the track record of Rockstar's past titles.

- GTA5: The main game was released on September 17, 2013, and GTA Online began about two weeks later (October 1).
- Red Dead Redemption 2: The main game came on October 26, 2018, and Red Dead Online started as a beta 32 days later (November 27).

Both share the point of a staged rollout of main game release, then online a few weeks later. Moreover, as can be seen from the fact that Red Dead Online was treated as a beta for a long time, starting early does not necessarily mean a complete experience is offered from day one.

Given this precedent, there is a strong chance that GTA6 will likewise follow the flow of online starting some time after release.

---

## So, When Will It Begin

Putting together multiple overseas outlets and leaks, the current assessment is as follows.

- An online launch at the same time as the release date (November 19) is hardly expected at all.
- The online launch is most likely within one month of the main game's release. Specifically, many take the view that it will be somewhere in late November to mid-December 2026.
- However, no official date has been confirmed at all. This is purely speculation from past patterns and leaks.

Considering the prime selling season of the Christmas shopping period, the strategy of launching online before year-end to maintain momentum makes sense. That said, this remains an area where nothing can be stated definitively until an official announcement is made.

---

## The 13-Year-Long GTA Online Will Soon Reach a Turning Point

Rockstar has teased a major update to the current GTA Online in the summer of 2026. Many outlets and fans see this as likely to be the last update before GTA6's release, but Rockstar itself has not stated that this is the final one, nor that it will continue support after release.

The December 2025 A Safehouse in the Hills update (which drew attention for the purchase of a Los Santos mansion and the return of GTA5 protagonist Michael) was seen as the last, but following the delay of the main game's release, one more major update is coming in the summer. There is a strong chance it will be the de facto final chapter of a live service that has lasted more than 13 years.

One thing to be careful about, however, is that this does not mean a complete shutdown of the servers. Take-Two has shown a stance of continuing support for older titles as long as the community is active, and for the time being there is a possibility that the old GTA Online and the new GTA6 online will coexist in parallel.

---

## GTA6 Online Is Expected to Be a Separate Thing, Not a Continuation

This is an important point for GTA Online enthusiasts.

The current assessment predicts that GTA6's online will not be an extension of the old GTA Online, but a new world that starts from scratch. Assets built up over many years, such as characters, owned properties, funds, and vehicles, are not expected to carry over to GTA6 online as they are. The longer you have played, the more you may want to brace yourself mentally.

In return, GTA6 online differs from older titles in its very design philosophy. Multiple leaks report that rather than being bolted on after the main game's release as with GTA5, it is built in from the start as a foundation integrated with the main game. This is expected to allow the worlds of the main game and online to be integrated more seamlessly.

---

## The Biggest Point of Interest: Project ROME and the Future of RP and UGC

In discussing GTA6 online, the rumored project called Project ROME is drawing the most attention right now.

The origin traces back to August 2023, when Rockstar acquired Cfx.re, the developer of FiveM and RedM (GTA's unofficial multiplayer and roleplay platforms). Since this acquisition, talk has been whispered in the industry that a project with the codename ROME is underway within the company. ROME is said to stand for Rockstar Online Modding Engine, and is rumored to be a first-party (official Rockstar) mod and multiplayer platform arriving alongside GTA6.

Organizing the rumored contents, the general direction is roughly as follows.

- Official modding tools and visual scripting supporting JavaScript, TypeScript, Lua, and the like
- Persistent servers (user-hosted and Rockstar-hosted) that run roleplay, minigames, competitive modes, and so on
- Monetization for creators, and a pipeline connecting Rockstar and community content

If this is true, it would be a major turning point at which Rockstar officially incorporates GTA's RP (roleplay) culture, which has developed in the unofficial sphere until now. GTA5's RP was realized through years of updates and the accumulation of community ingenuity, but for GTA6 one can also see it as starting out already equipped with 13 years' worth of evolution as official features from the outset.

However, there is a shadow to this trend as well. After the acquisition, almost all of the original members of Cfx.re, which developed FiveM and RedM, are reported to have left, and a former lead developer has issued a critical statement to the effect that the promises made at the time of the acquisition were not kept. Furthermore, alt:V, which was an independent multiplayer platform, is closing in July 2026 at Take-Two's request, and the move by Rockstar to consolidate around an official platform is also coming to the surface. Take-Two positions UGC (user-generated content) as a promising opportunity, and is reported to intend to grow GTA6 into a large-scale creator platform like Fortnite or Roblox.

It should also be emphasized that there has been no official announcement from Rockstar about Project ROME either, and that it is speculation assembled from job listings, leaks, and circumstantial evidence.

---

## Summary: There Is a Chance It Starts Early, but as a Separate World

Sorting out the situation surrounding GTA6's online, it comes down to this.

- The main game releases on November 19, 2026 (PS5 and Xbox Series X|S).
- The online mode has not been officially announced, but is seen as almost certain to be prepared.
- The start will not be at the same time as the release, but several weeks to about a month later (late November to mid-December) is most likely.
- A major summer 2026 update to the current GTA Online has already been officially announced. There is a strong view that this will be the de facto turning point, but whether it is the last one and whether support will continue after release remain unannounced by Rockstar. There is a strong chance it will not lead to an immediate server shutdown.
- GTA6 online is expected to be a new world that does not carry over assets from older titles, with Project ROME, centered on RP and UGC, being the biggest point of interest.

If you approach this the same way as with GTA5 and assume online is a long way off, you may be able to dive into the new world sooner than you think. However, there is a strong chance that it will not be a continuation of the GTA Online you have grown familiar with, but a separate thing rebuilt from its design philosophy. While receiving unconfirmed information as unconfirmed, we want to wait for the official announcement.

---

*Note: Among the contents of this article, the timing of the online mode's launch, Project ROME, and matters related to RP and UGC include speculation based on unconfirmed leaks and circumstantial evidence. They are not official announcements by Rockstar Games or Take-Two Interactive. Confirmed facts such as the main game's release date (November 19, 2026 / PS5 and Xbox Series X|S) and the acquisition of Cfx.re are based on official information.*

Beyond just the launch timing, the bigger picture — including RP culture and Project ROME — is covered in "[What Happens to Roleplay in GTA6](/en/news/18)".

For a sense of what today's FiveM RP servers are actually like, see our first-hand visit note "[What Is HeliosCity? A First Visit to a Japanese Light-RP Server (Opened April 2026, ~150 Peak Concurrent)](/en/fivem-gtarp/field-notes/visit-note/helios-city)".`,
    fullContent: `# GTA6のオンラインはいつ始まる？ 発売後ロールアウト説と「Project ROME」の噂を整理

2026年11月19日の発売が確定した『Grand Theft Auto VI（GTA6）』。本編のストーリーに注目が集まる一方で、多くのプレイヤーが気にしているのが「オンラインはいつ遊べるようになるのか」という点だ。13年続いた『GTA Online』という巨大なライブサービスの後継だけに、期待は大きい。結論から言えば、オンラインモードはほぼ確実に用意されると見られているが、発売と同時ではなく、数週間〜1か月ほど遅れて始まる可能性が高い。過去のパターン、最新のリーク、そして「Project ROME」と呼ばれる新プラットフォームの噂まで、現時点でわかっていることを整理する。

---

## まず押さえたい前提：オンラインモードはまだ「正式発表」されていない

意外に思われるかもしれないが、RockstarもTake-Two Interactiveも、GTA6のオンラインモードについて正式には発表していない。開発中であることすら公式には認められていないのが現状だ。

それでも業界の見方が「オンラインは来る」でほぼ一致しているのは、GTAというシリーズのビジネスモデルそのものがオンラインを前提に成り立っているからだ。Take-Twoの業績見通しも、GTA6を軸にしたライブサービスの成長を強く織り込んでいる。つまり「あるかどうか」ではなく「いつ・どんな形で来るか」が論点になっている。

---

## 過去のパターン：本編が先、オンラインは後

タイミングを占ううえで最も参考になるのが、Rockstarの過去作の実績だ。

- GTA5：本編が2013年9月17日に発売され、GTA Onlineはその約2週間後（10月1日）に開始された。
- レッド・デッド・リデンプション2：本編が2018年10月26日、Red Dead Onlineはその32日後（11月27日）にベータとして始まった。

どちらも「本編発売 → 数週間後にオンライン」という段階的なロールアウトだった点が共通している。しかもRed Dead Onlineは長らくベータ扱いだったことからもわかるように、早めに始まったからといって、初日から完成された体験が提供されるとは限らない。

この前例を踏まえると、GTA6でも同じく「発売後しばらくしてオンライン開始」という流れが踏襲される公算が大きい。

---

## では、いつ始まるのか

複数の海外メディアやリーク情報を総合すると、現時点での見立ては次のようになる。

- 発売日（11月19日）と同時のオンライン開始は、ほぼ期待されていない。
- オンラインの開始は本編発売から1か月以内が有力。具体的には2026年11月下旬〜12月中旬のどこか、という見方が多い。
- ただし公式な日付は一切確定していない。あくまで過去パターンとリークからの推測だ。

クリスマス商戦という書き入れ時を考えれば、年末までにオンラインを立ち上げて勢いを維持する、という戦略は理にかなっている。とはいえ、ここは公式発表が出るまで断定はできない領域だ。

---

## 13年続いた「GTA Online」は、まもなく区切りを迎える

Rockstarは現行GTA Onlineに2026年夏の大型アップデートを予告している。これがGTA6発売前の最後のアップデートになるのではないか、と多くのメディアやファンが見ているが、Rockstar自身は「これが最後」とも「発売後もサポートを続ける」とも明言していない。

2025年12月の「A Safehouse in the Hills」アップデート（ロスサントスの豪邸購入や、GTA5主人公マイケルの復活が話題になった）が最後と見られていたが、本編の発売延期を受けて、もう一度だけ夏に大型アップデートが入る形だ。13年以上続いたライブサービスの、事実上の最終章になる可能性が高い。

ただし注意したいのは、これがサーバーの完全停止を意味するわけではないという点だ。Take-Twoは、コミュニティが活発なうちは旧作のサポートを続ける姿勢を示しており、当面は旧GTA Onlineと新しいGTA6オンラインが並行して存在する可能性もある。

---

## GTA6オンラインは「続き」ではなく「別物」になる見込み

ここはGTA Online愛好家にとって重要なポイントだ。

現時点の見立てでは、GTA6のオンラインは旧GTA Onlineの延長ではなく、ゼロから始まる新しい世界になると予想されている。これまで何年もかけて積み上げてきたキャラクター、所有物件、資金、車両といった資産は、そのままGTA6オンラインへ引き継がれない見込みだ。長年プレイしてきた人ほど、心の準備をしておいたほうがいいかもしれない。

その代わり、GTA6オンラインは設計思想からして旧作と異なる。GTA5のように本編発売後に「後付け」されたのではなく、最初から本編と一体の基盤として作り込まれていると複数のリークが伝えている。これにより、本編とオンラインの世界がよりシームレスに統合されることが期待されている。

---

## 最大の注目点：「Project ROME」とRP・UGCの行方

GTA6オンラインを語るうえで、いま最も注目を集めているのが「Project ROME」と呼ばれる噂のプロジェクトだ。

発端は2023年8月、RockstarがFiveM／RedM（GTAの非公式マルチプレイヤー／ロールプレイ基盤）の開発元であるCfx.reを買収したことにさかのぼる。この買収以降、社内で「ROME」というコードネームのプロジェクトが進んでいるという話が業界で囁かれるようになった。ROMEは「Rockstar Online Modding Engine」の略とされ、GTA6と共に登場するファーストパーティ（Rockstar公式）のMod・マルチプレイヤープラットフォームだと噂されている。

噂されている中身を整理すると、おおむね次のような方向性だ。

- JavaScript・TypeScript・Luaなどに対応した公式のModディングツール、ビジュアルスクリプティング
- ロールプレイやミニゲーム、競技モードなどを動かす永続サーバー（ユーザーhost型／Rockstar host型）
- クリエイターによる収益化と、Rockstarおよびコミュニティのコンテンツをつなぐパイプライン

これが事実なら、これまで非公式の領域で発展してきたGTAのRP（ロールプレイ）文化を、Rockstarが公式に取り込む大きな転換点になる。GTA5のRPは長年のアップデートとコミュニティの工夫の積み重ねで実現したものだが、GTA6では「13年分の進化」を最初から公式機能として備えた状態でスタートする、という見方もできる。

ただし、この流れには影もある。買収後、FiveM／RedMを開発していたCfx.reの初期メンバーはほぼ全員が離脱したと報じられており、元リード開発者が「買収時の約束は守られなかった」という趣旨の批判的な声明を出している。さらに、独立系のマルチプレイヤー基盤だったalt:Vが、Take-Twoの要請を受けて2026年7月に閉鎖されるなど、Rockstarが公式プラットフォームへ一本化を進める動きも表面化している。Take-TwoはUGC（ユーザー生成コンテンツ）を有望な機会と位置づけており、GTA6をFortniteやRobloxのような大規模クリエイタープラットフォームに育てたい意向だと伝えられている。

なお、Project ROMEについてもRockstarからの公式発表はなく、求人情報やリーク、状況証拠から組み立てられた推測である点は強調しておきたい。

---

## まとめ：早く始まる可能性はあるが、別の世界として

GTA6のオンラインをめぐる状況を整理すると、こうなる。

- 本編発売は2026年11月19日（PS5／Xbox Series X|S）。
- オンラインモードは公式未発表だが、ほぼ確実に用意されると見られている。
- 開始は発売と同時ではなく、数週間〜1か月後（11月下旬〜12月中旬）が有力。
- 現行GTA Onlineには2026年夏の大型アップデートが公式に告知済み。これが事実上の区切りになるとの見方が強いが、「最後」かどうかや発売後のサポートはRockstar未発表。ただちにサーバー停止とはならない可能性が高い。
- GTA6オンラインは旧作の資産を引き継がない「新しい世界」になる見込みで、RPやUGCを軸にした「Project ROME」が最大の注目点。

GTA5と同じ感覚で「オンラインはずっと先」と構えていると、思ったより早く新しい世界に飛び込めるかもしれない。ただしそれは、これまで慣れ親しんだGTA Onlineの続きではなく、設計思想から作り直された別物になる公算が大きい。確定していない情報は確定していないものとして受け取りつつ、公式発表を待ちたい。

---

*※本記事のうち、オンラインモードの開始時期、Project ROME、RP・UGC関連の内容は未確認のリーク情報や状況証拠に基づく推測を含みます。Rockstar GamesおよびTake-Two Interactiveによる公式発表ではありません。本編発売日（2026年11月19日／PS5・Xbox Series X|S）や、Cfx.re買収などの確定事実は公式情報に基づいています。*

オンラインの開始時期だけでなく、RP文化やProject ROMEを含めた全体像は「[GTA6のロールプレイはどうなるのか](/news/18)」で総合的に解説している。

なお、現行のFiveM RPサーバーがどんな遊びになっているかは、ライトめの日本語RPサーバーを実際に訪ねた訪問記「[HeliosCityとは？2026年4月開街・ピーク同接150人前後の日本語ライトRPサーバーを初訪問](/fivem-gtarp/field-notes/visit-note/helios-city)」で具体例として見られる。`,
  },
  {
    id: 13,
    title: "GTA6 Switch2版は出るのか？",
    description:
      "発売はPS5／Xbox Series X|SのみのGTA6。Switch2版は出るのか——複数リーカーの発信源と「発売時は対象外」説を整理する。",
    icon: "🎮",
    image: "/images/news/switch2haderunoka.webp",
    category: "speculation",
    date: "2026-06-20",
    source: "各リーカー／海外メディア報道",
    sourceUrl: "#",
    relatedArticles: [2, 19, 4],
    aiSummary: [
      "GTA6のSwitch2版はRockstar・Take-Twoとも公式に一切発表していない。",
      "複数リーカーは開発やテストの可能性を語るが、見方は割れ確証はない。",
      "11月19日の発売時に並ぶ可能性は極めて低く、来るなら2027年以降の単体版が現実的とされる。",
    ],
    titleEn: "Will There Be a Nintendo Switch 2 Version of GTA6?",
    descriptionEn:
      "GTA6 launches only on PS5 and Xbox Series X|S. Will a Switch 2 version arrive? We sort out the sources behind the multiple leakers and the theory that it will not be included at launch.",
    aiSummaryEn: [
      "Neither Rockstar nor Take-Two has officially announced a Switch 2 version of GTA6 at all.",
      "Several leakers talk about the possibility of development or testing, but opinions are split and there is no solid proof.",
      "The chances of it arriving alongside the November 19 launch are extremely low, and if it comes, a standalone version in 2027 or later is considered the realistic scenario.",
    ],
    fullContentEn: `# Will There Be a Nintendo Switch 2 Version of GTA6? Sorting Out the Leak Sources and the Not at Launch Theory

With its release locked in for November 19, 2026 and pre-orders about to begin, Grand Theft Auto VI (GTA6) is launching only on PS5 and Xbox Series X|S, and even the PC version is expected to be significantly delayed. Amid all this, a question keeps smoldering among Switch 2 users: can GTA6 be played on Switch 2 as well? While several leakers claim that development itself is underway, the industry consensus is converging on the view that it will not arrive at launch, at the very least. We sort out who is saying what, and which scenarios are realistically possible.

---

## First, the Premise to Keep in Mind: No Official Announcement Exists

The first thing to confirm is that neither Rockstar nor Take-Two Interactive has said a single word officially about a Switch 2 version. The only platforms officially named are PS5 and Xbox Series X|S; everything else is nothing more than unverified information from leakers and industry insiders.

That said, baseless speculation and information from multiple proven leakers carry different weight. Here we break things down by source, sorting out what is being said and how far.

---

## Sorting Out the Leak Sources

The Switch 2 version talk has spread mainly through the intertwined statements of four people.

- NateTheHate: Regarded as a highly reliable figure who has correctly called many leaks in the past. In November 2025, he said that Rockstar has been testing for a while whether GTA6 can run on Switch 2. Importantly, he also cautioned that testing does not guarantee a release and that he himself does not know what the current status is.
- Nash Weedle: A figure who specializes in Nintendo-related leaks. In November 2025, he confirmed development of a Switch 2 version. However, opinions about his reliability are divided.
- Kiwi Talkz: In January 2026, he relayed that an Indian source claimed it would launch simultaneously with PS5 and others. However, he himself does not believe this and has publicly stated that he bet a meal on there being no simultaneous launch.
- Rhys Riley: A skeptic. He has spoken with multiple Rockstar developers, but says none of them brought up a Switch 2 version. On the other hand, he also said he had heard from more than eight people about a Switch 2 version of Red Dead Redemption 2.

To summarize, while there is some agreement on the point that testing was likely carried out, views are clearly split among the individuals on whether it will be released as a product and, if so, when.

---

## Nash Weedle's Claims, Which Shifted With the May 2026 Follow-Up

Here, when GTA6 FEED looked into it further, even newer developments could be confirmed entering May 2026.

- Development of the Switch 2 version is proceeding in parallel with the main platforms such as PS5 and Xbox.
- A source told him it might make it in time for launch, but he himself is skeptical of that.
- The Switch 2 version will likely not appear in the next trailer. Because Rockstar will prioritize technical showpieces, the read is that the Switch 2 version, which lags in performance, will not be put at the forefront of marketing.

Overseas media reports also lean toward the prevailing view that, because development requires individual optimization for Nintendo's architecture, it will not be included in the Switch 2 launch lineup, and 2027 at the earliest. The assumption is that the RAGE engine would be optimized for Switch 2 and that upscaling technology would bridge the performance gap.

In other words, the picture of development apparently being underway, but not at launch and arriving later even if it does, became even clearer from May onward.

---

## The Distance Between Take-Two and Nintendo Is Indeed Narrowing

Beyond the leaks, there are also positive signs in the official side's posture.

Take-Two's CEO has long made positive remarks about Nintendo platforms. The gist is that while the Nintendo market was once seen as aimed at younger audiences, the current Switch and Switch 2 can capture a broad range of users. And the company has shown its stance not only in words but in actions.

- In 2021, it released Grand Theft Auto: The Trilogy - The Definitive Edition for the current Switch. It bundled remasters of three titles, GTA III, Vice City, and San Andreas, into one package, enhancing the graphics while optimizing for Switch.
- The Switch 2 is significantly improved in performance compared to the Switch, supporting rendering of up to 4K/60fps when docked, as well as Nvidia's DLSS upscaling.

In fact, CD Projekt Red brought Cyberpunk 2077 in as a Switch 2 launch title. The emergence of a real example of a heavyweight open world running has become one factor supporting expectations for a Switch 2 version.

---

## Why Not at Launch Has Nonetheless Become Nearly Settled

On the other hand, the industry tone since entering 2026 is largely in agreement on the direction that it will not come at the November 19 timing, at the very least. There are three main reasons.

The first is the sheer performance gap. The Switch 2 is said to have about 9GB of memory usable for games, with GPU performance roughly one quarter that of the PS5. Running the latest-generation RAGE engine that GTA6 assumes as is would require considerable compromise and engineering.

The second is the overcrowded development schedule. The point is that finishing a third platform version, whose marketing has not even started, in parallel during the most important period just before launch is realistically untenable.

The third is the historical pattern. Excluding remasters, no mainline home-console GTA has appeared on a Nintendo machine. GTA5 did not come to the current Switch, and Red Dead Redemption 2 was the same. The view is that there is little basis to think this flow would suddenly change with GTA6.

Several overseas outlets have also reported, almost conclusively as of June, that the Switch 2 version will not be included in the launch lineup.

---

## If It Were to Happen, in What Form

Even if a Switch 2 version were to come out, several scenarios are conceivable. Listed in order of likelihood, they are as follows.

- A standalone release one to two years later: Considered the most realistic route. Optimization for the latest hardware is prioritized, and improvements gained in that process are carried over to the Switch 2 version. The prevailing industry view is 2027 or later.
- Offered as a cloud gaming version: A method in which the game's processing is done on the server side and only the video is sent to the Switch 2. However, open worlds live and die on response speed and connection stability, and considering input lag, many voices say it would be harsh as a play experience.
- A simultaneous release with the PS5 and Xbox versions: The most ideal, but the least likely at this point. Only a source of questionable reliability claimed this, and multiple leakers have clearly denied it.

Whichever route it takes, the calm assessment at this point is that it will be difficult for Switch 2 users to get exactly the same experience as the PS5 version, at the same time.

---

## The Near-Term Schedule and Discerning Information

In parallel with the Switch 2 version talk, information around the main release is steadily firming up.

- The release date is confirmed for November 19. Take-Two's CEO has repeatedly stated this clearly, and it is built into the company's earnings outlook. It is hard to imagine a company carrying a commitment of this scale easily missing the date.
- Pre-orders are scheduled to begin on June 25.
- The third trailer is also expected to be released over the summer (late June to July).
- The final update for GTA Online is said to be in July, marking a turning point for a live service that has continued for 13 years.

Note that as the release nears, information of uncertain veracity is also increasing on social media. In June 2026, there was an incident in which a certain post about the Switch 2 version went viral, only for it to later turn out to be satire (a joke post) that many people had believed. The bigger the expectations around a topic, the easier it is for the line between confirmed information and rumor to blur. The habit of checking the source and the date pays off in situations like this.

---

## Summary: Not a Dream, Not Despair, but a Matter of Possibility

Sorting out the situation surrounding a Switch 2 version of GTA6, it comes down to this.

- There are multiple leaks, and it is highly likely that development and testing are being carried out.
- Take-Two is positive about the Nintendo market, and the Switch 2's performance is on a different level from previous machines.
- However, no official announcement exists, and the chances of a Switch 2 version lining up at the November 19 launch are extremely low.
- Even if it is realized, a standalone release in 2027 or later, or a cloud version, is considered the realistic form.

The fact that testing is being carried out shows that, at the very least, the development side is exploring the possibility. The conditions are gradually coming together, but excessive expectations at an uncertain stage only make the disappointment greater if you are let down. Receive unconfirmed information as unconfirmed, and wait for an official announcement — that is probably the smart way to deal with this kind of leak.
`,
    fullContent: `# GTA6のSwitch2版は出るのか？ リークの発信源と「発売時は対象外」説を整理

2026年11月19日の発売が確定し、プレオーダー開始も目前に迫った『Grand Theft Auto VI（GTA6）』。発売プラットフォームはPS5とXbox Series X|Sのみで、PC版すら大幅に遅れると見られている。そんな中、Switch2ユーザーの間でくすぶり続けているのが「GTA6はSwitch2でも遊べるのか」という問いだ。複数のリーカーが「開発自体は進んでいる」と主張する一方、業界の論調は「少なくとも発売時には来ない」でほぼ固まりつつある。誰が何を言っているのか、そして現実的にどのシナリオがありうるのかを整理する。

---

## まず押さえたい前提：公式発表は存在しない

最初に確認しておきたいのは、RockstarもTake-Two Interactiveも、Switch2版について公式には一言も発表していないということだ。公式に名前が挙がっているのはPS5とXbox Series X|Sのみで、それ以外はすべてリーカーや業界関係者による未確認情報にすぎない。

ただし、根拠のない憶測と、実績あるリーカー複数による情報では重みが違う。ここではその発信源ごとに、何がどこまで語られているのかを切り分けていく。

---

## リークの発信源を整理する

Switch2版の話は、主に4人の人物の発言が絡み合って広がってきた。

- NateTheHate（ネイトザヘイト）：過去に多くのリークを的中させてきた、信頼性の高い人物とされる。2025年11月、「Rockstarが以前からGTA6をSwitch2上で動かせるかテストしている」と述べた。同時に「テストはリリースを保証しない」「今どうなっているかは自分も知らない」と釘を刺している点が重要だ。
- Nash Weedle（ナッシュ・ウィードル）：Nintendo関連のリークを専門とする人物。2025年11月にSwitch2版の開発を「confirm（断言）」した。ただし信頼性については評価が分かれる。
- Kiwi Talkz（キウイトークス）：2026年1月、インドの情報筋が「PS5などと同時発売される」と主張していると紹介。しかし本人はこれを信じておらず、「同時発売はない」方に食事を賭けたと公言している。
- Rhys Riley（リース・ライリー）：懐疑派。複数のRockstar開発者と話したが、Switch2版の話を持ち出した者はいなかったとしている。一方で、レッド・デッド・リデンプション2のSwitch2版については8人以上から聞いた、とも述べている。

整理すると、「テストは行われた可能性が高い」という点ではある程度一致しているが、「製品として発売されるか」「いつか」については各人の見方がはっきり割れている、というのが実情だ。

---

## 2026年5月の続報で動いた、Nash Weedleの主張

ここで、GTA6 FEEDが追って調査したところ、2026年5月に入ってさらに新しい動きが確認できた。

- Switch2版の開発は、PS5やXboxといった主要プラットフォームと並行して進められている。
- 情報筋からは「発売時に間に合うかもしれない」とも言われたが、本人はそれに懐疑的。
- 次のトレーラーにSwitch2版が映ることはないだろう。Rockstarは技術的な見せ場を優先するため、性能で見劣りするSwitch2版はマーケティングの前面に出さない、という読みだ。

海外メディアの報道でも、開発はNintendoのアーキテクチャ向けの個別最適化を要するため、Switch2本体のローンチラインナップには含まれず、早くても2027年というのが大方の見立てになっている。RAGEエンジンをSwitch2向けに最適化し、アップスケーリング技術で性能差を埋める形が想定されている。

つまり「開発はしているらしい。ただし発売時ではなく、来るとしても後」という構図が、5月以降さらに鮮明になったと言える。

---

## Take-TwoとNintendoの距離は、確かに縮まっている

リークだけでなく、公式側の姿勢にも前向きな兆候はある。

Take-TwoのCEOは以前から、Nintendoプラットフォームに対して前向きな発言を重ねてきた。かつては若年層向けとされたNintendo市場も、現行のSwitchとSwitch2であれば幅広い層を取り込める、という趣旨だ。そして同社は言葉だけでなく、行動でも姿勢を示してきた。

- 2021年、現行Switch向けに『グランド・セフト・オート：トリロジー：決定版』を発売。GTA III、バイスシティ、サンアンドレアスのリマスター3作を1本にまとめ、グラフィックを強化しつつSwitchに最適化した。
- Switch2はSwitchに比べて大幅に性能が向上しており、ドック時には最大4K/60fpsの描画、NvidiaのDLSSアップスケーリングにも対応する。

実際、CD Projekt Redは『サイバーパンク2077』をSwitch2のローンチタイトルとして送り込んでいる。重量級のオープンワールドが動く実例が出てきたことが、Switch2版への期待を支える一因になっている。

---

## それでも「発売時はない」がほぼ固まった理由

一方で、2026年に入ってからの業界の論調は「少なくとも11月19日のタイミングでは来ない」という方向でほぼ一致している。理由は大きく3つだ。

ひとつは、純粋な性能差。Switch2はゲーム用に使えるメモリが約9GB、GPU性能はPS5のおよそ4分の1とされる。GTA6が前提とする最新世代機向けのRAGEエンジンをそのまま動かすには、相当な妥協と作り込みが必要になる。

ふたつめは、開発スケジュールの過密さ。発売直前のもっとも重要な時期に、まだマーケティングも始まっていない第3のプラットフォーム版を同時並行で仕上げる、というのは現実的に無理がある、という指摘だ。

みっつめは、歴史的なパターン。リマスターを除けば、Nintendo機に出た据置系の本編GTAは存在しない。GTA5は現行Switchに来なかったし、レッド・デッド・リデンプション2も同様だった。この流れがGTA6で急に変わると考える根拠は薄い、という見方である。

複数の海外メディアも、6月の時点で「Switch2版は発売ラインナップに含まれない」とほぼ断定的に報じている。

---

## 実現するとしたら、どの形か

仮にSwitch2版が世に出るとしても、いくつかのシナリオが考えられる。可能性が高いとされる順に並べると、次のようになる。

- 1〜2年遅れての単体リリース：もっとも現実的とされるルート。最新ハードへの最適化を優先し、その過程で得た改善をSwitch2版に転用していく。業界では2027年以降という見方が大勢だ。
- クラウドゲーミング版としての提供：ゲームの処理をサーバー側で行い、映像だけをSwitch2に飛ばす方式。ただしオープンワールドは応答速度や接続の安定が命であり、操作の遅延を考えるとプレイ体験としては厳しいという声が強い。
- PS5・Xbox版との同時リリース：最も理想的だが、現時点では最も可能性が低い。これを主張したのは信頼度に疑問のある情報筋のみで、複数のリーカーがはっきり否定している。

どのルートをたどるにせよ、Switch2ユーザーがPS5版とまったく同じ体験を、同じタイミングで得るのは難しい、というのが現時点での冷静な見立てだ。

---

## 直近のスケジュールと、情報の見極め

Switch2版の話と並行して、本体の発売まわりの情報は着々と固まってきている。

- 発売日は11月19日で確定。Take-TwoのCEOが繰り返し明言しており、会社の業績見通しにも組み込まれている。この規模の公約を抱えた企業が、簡単に期日を外すとは考えにくい。
- プレオーダーは6月25日開始予定。
- 第3トレーラーも夏（6月下旬〜7月）に公開される見込み。
- GTA Onlineの最終アップデートは7月とされ、13年続いたライブサービスが区切りを迎える。

なお、発売が近づくにつれてSNS上では真偽不明の情報も増えている。2026年6月には、Switch2版に関するある投稿が拡散したものの、後にそれが風刺（ネタ投稿）だったと判明し、多くの人が信じ込んでいた、という一件もあった。期待が大きいテーマほど、確定情報と噂の線引きが甘くなりやすい。発信源と日付を確かめる習慣が、こういう局面では効いてくる。

---

## まとめ：夢でも絶望でもなく、可能性の話として

GTA6のSwitch2版をめぐる状況を整理すると、こうなる。

- リーク情報は複数あり、開発・テストが行われている可能性は高い。
- Take-TwoはNintendo市場に前向きで、Switch2の性能も従来機とは別次元にある。
- しかし公式発表は存在せず、11月19日の発売時にSwitch2版が並ぶ可能性は極めて低い。
- 実現するとしても、2027年以降の単体リリース、あるいはクラウド版という形が現実的とされる。

テストが行われているという事実は、少なくとも開発側が可能性を模索していることを示している。条件は少しずつ整いつつあるが、不確かな段階での過剰な期待は、裏切られたときの失望を大きくするだけだ。確定していない情報は確定していないものとして受け取り、公式発表を待つ——それが、この手のリークとの賢い付き合い方だろう。

---

*※本記事のうち、リーカーの発言・開発状況・発売時期に関する内容は未確認のリーク情報を含みます。Rockstar GamesおよびTake-Two Interactiveによる公式発表ではありません。発売日（2026年11月19日／PS5・Xbox Series X|S）など、確定情報については公式発表に基づいています。*`,
  },
  {
    id: 1,
    title: "GTA6のトレーラーを総ざらい——第2弾の中身と、第3弾「6月25日説」の現在地",
    description:
      "第1弾・第2弾トレーラーの中身を総整理。プレオーダー開始（6月25日）に合わせた第3弾トレーラー公開説の現在地まで見ていく。",
    icon: "🎬",
    image: "/images/news/trailersouzarai.webp",
    category: "release",
    date: "2026-06-18",
    source: "Rockstar Games Official",
    sourceUrl: "https://www.rockstargames.com",
    relatedArticles: [33, 2, 19],
    youtubeId: "ooZ1n4Fh7Ks",
    aiSummary: [
      "GTA6のトレーラーは現時点で2本、第1弾が2023年12月、第2弾が2025年5月6日に公開された。",
      "第2弾では主人公ジェイソンとルシア、レオニダ州の陰謀、9人のキャラクターや多様な世界観が示された。",
      "予約開始は6月25日で確定だが、同日の第3弾トレーラー公開は推測でRockstar未発表である。",
    ],
    titleEn:
      "A Complete Rundown of the GTA6 Trailers — What Was in Trailer 2, and Where the Trailer 3 June 25 Theory Stands",
    descriptionEn:
      "A full rundown of what was in Trailer 1 and Trailer 2, leading up to where the theory of a Trailer 3 release timed to the start of preorders (June 25) currently stands.",
    aiSummaryEn: [
      "There are two GTA6 trailers so far: Trailer 1 released in December 2023 and Trailer 2 released on May 6, 2025.",
      "Trailer 2 showed protagonists Jason and Lucia, the conspiracy spanning the state of Leonida, nine characters, and a richly varied world.",
      "The June 25 start of preorders is confirmed, but a Trailer 3 release on the same day is speculation and has not been announced by Rockstar.",
    ],
    fullContentEn: `# A Complete Rundown of the GTA6 Trailers — What Was in Trailer 2, and Where the Trailer 3 June 25 Theory Stands

The buzz around Grand Theft Auto VI (GTA6) is heating up once again. The spark was Rockstar's announcement that preorders will begin on June 25, 2026. Based on past patterns in the series, the view that the long-awaited Trailer 3 might be released to coincide with that day has rapidly gained traction. Here, we revisit and organize what was revealed in the previously released Trailer 1 and Trailer 2, and then look at what we can expect from Trailer 3.

---

## First, the Timeline: There Have Been Two Trailers So Far

Since this often gets confused, let us first make the facts clear. As of now, two GTA6 trailers have been released.

- Trailer 1: Released in December 2023, timed to Rockstar's 25th anniversary. It showed the world the return to Vice City and the existence of two protagonists. In its first 24 hours after release it racked up record-breaking view counts, leaving a historic number for a non-music YouTube video.
- Trailer 2: Released on May 6, 2025. It was a so-called surprise release, coming just a few days after the announcement of a delay. The roughly three-minute stretch of new footage greatly deepened the outline of the story and the relationship between the two protagonists.

In other words, Trailer 2 is not a recent event but something from over a year ago. The lengthening gap from then until Trailer 3 is what feeds fans' current craving.

---

## What Could Be Seen in Trailer 2

Trailer 2 was not merely a showcase of footage; it laid out the direction of GTA6 as a work in fairly concrete terms. Let us organize the key points.

### The Two Protagonists — Jason and Lucia

At the center of the story are Jason Duval and Lucia Caminos. The trailer gets moving from a scene in which Jason, after going about his daily life, goes to pick up Lucia as she is released from prison. From there, the neon-soaked chaos of Vice City unfolds all at once, with the two repeating robberies, shootouts, and getaways.

What deserves special mention is Lucia's presence. She is said to be the first full-fledged female protagonist placed at the center of a solo story in the series' main line (the numbered titles). It has been officially revealed that her father trained her to fight from a young age, and that her actions to protect her family ultimately landed her in a prison in the state of Leonida. Jason, on the other hand, is depicted as a man who failed at a fresh start in the military and returned to the underworld as a drug courier.

Rockstar is presenting the relationship between these two as a crime-and-romance story likened to Bonnie and Clyde. Whereas GTA5 used three protagonists to separately depict satire, tragedy, and chaos, GTA6 narrows its focus to two people who share a destiny, seeking to make emotional tension the axis of the story.

### How the Story Begins

According to the official description, Jason and Lucia get caught up in a conspiracy that spreads across the entire state of Leonida after a job that was supposed to be easy goes wrong. To survive, they are forced to rely on each other more than ever before — that is the broad outline of the plot.

### A Cast of Distinctive Supporting Characters

To coincide with the release of Trailer 2, Rockstar revealed information on nine characters, including the two protagonists. They line up as figures from differing backgrounds: Boobie Ike, a legendary figure of Vice City; Dre'Quan Priest, aiming for success in the music business; Real Dimez, a music duo cloaked in social media and local fame; Raul Bautista, a professional bank robber; and Brian Heder, a smuggler in the Leonida Keys. The fact that the supporting cast is designed not as mere window dressing but as a network in which multiple stories intertwine is what sets GTA6 apart from previous GTA games.

### The World and Its Details

The setting is Vice City, modeled on Miami, and the fictional state of Leonida, modeled on Florida. After Trailer 2's release, numerous screenshots were also published, showing the individuality of each region: the touristy Leonida Keys, the nature-rich Mount Kalaga National Park, Port Gellhorn lined with cheap motels and strip clubs, the rural and industrial areas of Ambrosia that are home to a biker gang, and the wetland Grassrivers.

Among fans, small details were eagerly discussed as well, such as an alligator in a parking lot, an NPC livestreaming a robbery, and license plates reading VC-86 that allude to the original version (the 1986 Vice City). It is worth noting that everything released so far is trailer or engine footage as cinematic works, and actual playing footage (raw gameplay) has not yet been officially shown.

---

## Trailer 3 Is Widely Expected to Release on June 25

This is where the topic drawing the most attention right now comes in.

Rockstar officially announced that GTA6 preorders will begin on June 25, 2026. In step with this, the view in the community that Trailer 3 might be released on the same day has rapidly spread.

There are several grounds for this. First, the previous Trailer 2 was released on May 6, 2025, and over 400 days have already passed. The point is that it is hard to imagine reaching a major milestone like preorders with only a trailer from over a year ago. In fact, looking back at Rockstar's past marketing, with Red Dead Redemption 2 the flow was to put out a gameplay trailer about two months before release, after three cinematic trailers. The role division of Trailer 1 presenting the world and Trailer 2 introducing the story is the same for GTA6, so Trailer 3 is seen as likely to be a full-fledged story trailer.

However, as of now Rockstar has not officially announced a release date for Trailer 3. The June 25 release is purely speculation from circumstantial evidence, and the possibility remains that only preorders begin first while the trailer comes on a different day. Precisely because this is a topic where expectations are running hot, this distinction is worth keeping in mind.

---

## What Can Be Expected From Trailer 3

Given the role division of the previous two trailers, the following elements are expected from Trailer 3.

- A more in-depth presentation of the story (the main plot) centered on Jason and Lucia
- More gameplay-oriented footage, such as the mechanics of the heists that have so far been shown only in fragments
- An announcement of the various preorder editions and pricing (in addition to a standard edition, there are also rumors of a collector's edition)

GTA6 is scheduled to release on November 19, 2026, for PS5 and Xbox Series X|S. A PC version has not been officially announced, and going by the series' custom it is highly likely to come later. With less than half a year to go until release, Trailer 3 looks set to draw some of the series' greatest attention as the starting signal for the countdown to launch.

---

## Summary

- There are two GTA6 trailers so far. Trailer 1 was released in December 2023, and Trailer 2 on May 6, 2025.
- Trailer 2 showed the relationship between protagonists Jason and Lucia, a conspiracy set in the state of Leonida, nine distinctive characters, and a world that differs from region to region.
- Preorders have been officially announced to begin on June 25, 2026. There is a strong observation that Trailer 3 will be released to coincide with this, but the release date has not been announced by Rockstar.
- Trailer 3 is expected to be a full-fledged story trailer, and it looks set to be the one that signals the full launch of marketing toward release (November 19, 2026).

GTA6's marketing, after a long silence, has finally begun to move. What will happen on June 25 — the answer will be revealed before long.

---

*Note: Within this article, the descriptions of the Trailer 3 release timing, the various preorder editions and pricing, and the contents of Trailer 3 include speculation based on circumstantial evidence and community observation. They are not official announcements by Rockstar Games. The release dates and contents of Trailer 1 and Trailer 2, the preorder start date (June 25, 2026), and the main game's release date (November 19, 2026 / PS5 and Xbox Series X|S) are confirmed information based on official announcements.*

For the latest predictions on when Trailer 3 will actually arrive, see "[When Will GTA6's Trailer 3 Arrive?](/en/news/33)".`,
    fullContent: `# GTA6のトレーラーを総ざらい——第2弾の中身と、第3弾「6月25日説」の現在地

『Grand Theft Auto VI（GTA6）』をめぐる話題が、ふたたび熱を帯びている。きっかけは、Rockstarが2026年6月25日からプレオーダー（予約購入）を開始すると発表したことだ。シリーズの過去のパターンから、この日に合わせて待望の第3弾トレーラーが公開されるのではないか、という観測が一気に強まっている。ここでは、これまでに公開された第1弾・第2弾トレーラーで何が判明したのかをあらためて整理したうえで、第3弾に何を期待できるのかを見ていく。

---

## まず時系列の整理：トレーラーはこれまで2本

混同されがちなので、最初に事実関係をはっきりさせておきたい。GTA6のトレーラーは、現時点で2本公開されている。

- 第1弾トレーラー：2023年12月、Rockstarの25周年に合わせて公開。ヴァイスシティへの回帰と、ふたりの主人公の存在を世界に示した。公開後の最初の24時間で記録的な再生数を叩き出し、音楽以外のYouTube動画として歴史的な数字を残した。
- 第2弾トレーラー：2025年5月6日に公開。発売延期の発表から数日後の、いわゆる不意打ちのリリースだった。約3分間の新規映像で、物語の輪郭と主人公ふたりの関係性が大きく掘り下げられた。

つまり第2弾は「最近の出来事」ではなく、すでに1年以上前のものだ。そこから第3弾までの空白が長引いていることが、いまのファンの渇望につながっている。

---

## 第2弾トレーラーで何が見えたか

第2弾は、単なる映像のお披露目にとどまらず、GTA6という作品の方向性をかなり具体的に示すものだった。要点を整理する。

### 主人公ふたり——ジェイソンとルシア

物語の中心にいるのは、ジェイソン・デュバルとルシア・カミノスのふたりだ。トレーラーは、ジェイソンが日常を送ったのち、刑務所から出所してきたルシアを迎えに行く場面から動き出す。そこから先は、ふたりが強盗・銃撃・逃走を繰り返す、ネオンに染まったヴァイスシティの混沌が一気に展開する。

特筆すべきは、ルシアの存在だ。彼女はシリーズのメインライン（ナンバリング作品）の単独ストーリーで中心に据えられる、初の本格的な女性主人公とされる。父から幼い頃に戦い方を仕込まれ、家族を守るための行動の果てにレオニダ州の刑務所に収監された、という背景が公式に明かされている。一方のジェイソンは、軍隊での再起に失敗し、麻薬の運び屋として裏社会に戻ってきた人物として描かれる。

このふたりの関係を、Rockstarは「ボニーとクライド」になぞらえる犯罪×恋愛の物語として打ち出している。GTA5が3人の主人公で風刺・悲劇・混沌を描き分けたのに対し、GTA6は運命を共有するふたりに焦点を絞り、感情的な緊張を物語の軸に据えようとしている。

### 物語の発端

公式の説明によれば、ジェイソンとルシアは「簡単なはずだった仕事」がうまくいかなかったことをきっかけに、レオニダ州全体に広がる陰謀に巻き込まれていく。生き延びるために、これまで以上に互いを頼らざるを得なくなる——というのが大枠の筋立てだ。

### 個性豊かな脇役たち

第2弾の公開に合わせて、Rockstarは主人公2人を含む9人のキャラクター情報を公開した。ヴァイスシティの伝説的人物ブービー・アイク、音楽業界での成功を狙うドレクァン・プリースト、SNSと地元の名声をまとう音楽デュオのリアル・ダイメズ、プロのバンク強盗ラウル・バウティスタ、レオニダ・キーズの密輸業者ブライアン・ヘダーなど、背景の異なる人物が並ぶ。脇役が単なる賑やかしではなく、複数の物語が絡み合うネットワークとして設計されている点が、これまでのGTAと一線を画している。

### 世界観とディテール

舞台は、マイアミをモデルにしたヴァイスシティと、フロリダをモデルにした架空の州レオニダだ。第2弾公開後にはあわせて多数のスクリーンショットも公開され、観光地然としたレオニダ・キーズ、自然豊かなマウント・カラガ国立公園、安宿やストリップクラブが並ぶポート・ゲルホーン、バイカーギャングの根城があるアンブロシアの田舎・工業地帯、湿地のグラスリバーズなど、地域ごとの個性が示された。

ファンの間では、駐車場のワニ、強盗をライブ配信するNPC、「VC-86」とオリジナル版（1986年のヴァイスシティ）を示唆するナンバープレートなど、細部の小ネタも盛んに考察された。なお現時点で公開されているのは、いずれも映像作品としてのトレーラーやエンジン映像であり、実際のプレイ画面（ローgameplay）はまだ公式には披露されていない点には注意が必要だ。

---

## 第3弾トレーラーは「6月25日」公開が有力視されている

ここからが、いま最も注目を集めている話題だ。

Rockstarは、GTA6のプレオーダーを2026年6月25日に開始すると公式に発表した。これに合わせて、コミュニティでは第3弾トレーラーが同日に公開されるのではないか、という見方が急速に広がっている。

根拠はいくつかある。まず、前回の第2弾トレーラーの公開が2025年5月6日であり、すでに400日以上が経過している。プレオーダーという大きな節目を、1年以上前のトレーラーだけで迎えるのは考えにくい、という指摘だ。実際、過去のRockstarのマーケティングを振り返ると、レッド・デッド・リデンプション2では3本のシネマティックトレーラーを経たのち、発売の2か月ほど前にゲームプレイトレーラーを投入する流れだった。第1弾が世界観の提示、第2弾が物語の導入、という役割分担はGTA6でも同じであり、第3弾は本格的な物語トレーラーになるのではないか、と見られている。

ただし、現時点でRockstarは第3弾トレーラーの公開日を正式には発表していない。「6月25日公開」はあくまで状況証拠からの推測であり、プレオーダーだけが先行して始まり、トレーラーは別日になる可能性も残る。期待が過熱しているテーマだけに、この線引きは押さえておきたい。

---

## 第3弾に何を期待できるか

過去2本の役割分担を踏まえると、第3弾トレーラーでは次のような要素が期待されている。

- ジェイソンとルシアを軸にした、より踏み込んだ物語（メインプロット）の提示
- これまで断片的だった強盗（ハイスト）の仕組みなど、ゲームプレイ寄りの映像
- プレオーダーの各エディションや価格の発表（標準版に加え、コレクターズエディションの噂もある）

GTA6は2026年11月19日に、PS5とXbox Series X|S向けに発売予定だ。PC版は正式発表されておらず、シリーズの慣例からすると後発になる公算が大きい。発売まで半年を切ったいま、第3弾トレーラーは「発売へのカウントダウンの号砲」として、シリーズ屈指の注目を集めることになりそうだ。

---

## まとめ

- GTA6のトレーラーは現時点で2本。第1弾が2023年12月、第2弾が2025年5月6日に公開された。
- 第2弾では、主人公ジェイソンとルシアの関係、レオニダ州を舞台にした陰謀、個性的な9人のキャラクター、地域ごとに異なる世界観が示された。
- プレオーダーは2026年6月25日開始が公式発表済み。これに合わせて第3弾トレーラーが公開されるとの観測が強いが、公開日はRockstar未発表。
- 第3弾は本格的な物語トレーラーになると期待されており、発売（2026年11月19日）に向けたマーケティングの本格始動を告げる一本になりそうだ。

長い沈黙が続いたGTA6のマーケティングが、いよいよ動き出した。6月25日に何が起きるのか——その答えは、もうすぐ明らかになる。

---

*※本記事のうち、第3弾トレーラーの公開時期、プレオーダーの各エディションや価格、第3弾の内容に関する記述は、状況証拠やコミュニティの観測に基づく推測を含みます。Rockstar Gamesによる正式発表ではありません。トレーラー1・2の公開日と内容、プレオーダー開始日（2026年6月25日）、本編発売日（2026年11月19日／PS5・Xbox Series X|S）は、公式発表に基づく確定情報です。*

なお、第3弾トレーラーがいつ来るのかについての最新の時期予想は「[GTA6のトレーラー3はいつ来るのか](/news/33)」で継続的に整理している。`,
  },
  {
    id: 2,
    title: "GTA6の発売日は2026年11月19日で確定——二度の延期を経て、いま「動かない」と言える理由",
    description:
      "発売日は2026年11月19日（PS5／Xbox Series X|S）で確定。二度の延期の経緯と、プレオーダー開始で日付の確度が高まった理由を整理する。",
    icon: "📅",
    image: "/images/news/hatubaibikakutei.webp",
    category: "release",
    date: "2026-06-19",
    source: "Rockstar Games Official",
    sourceUrl: "https://www.rockstargames.com",
    relatedArticles: [33, 1, 19],
    aiSummary: [
      "GTA6の発売日は2026年11月19日で確定、対応はPS5とXbox Series X|S。",
      "二度の延期を経たが、6月25日の予約開始と業績見通しへの組み込みで日付の確度は最も高い。",
      "価格は当記事時点で未発表、PC版とオンラインは本編より後になる公算が大きい。",
    ],
    titleEn:
      "GTA6's Release Date Is Locked In for November 19, 2026 — After Two Delays, Why We Can Now Say It Will Not Move",
    descriptionEn:
      "The release date is confirmed for November 19, 2026 (PS5 / Xbox Series X|S). We lay out the history of the two delays and why the start of preorders has raised confidence in the date.",
    aiSummaryEn: [
      "GTA6's release date is confirmed for November 19, 2026, on PS5 and Xbox Series X|S.",
      "It went through two delays, but with preorders opening on June 25 and the date built into earnings guidance, confidence in it is at its highest ever.",
      "The price is unannounced as of this article, and the PC version and online mode are likely to come after the main game.",
    ],
    fullContentEn: `# GTA6's Release Date Is Locked In for November 19, 2026 — After Two Delays, Why We Can Now Say It Will Not Move

The release date for Grand Theft Auto VI (GTA6) is confirmed for November 19, 2026. In the past, time frames such as fall 2025 and May 2026 were mentioned, but each was delayed before settling on the current date. Then, in June 2026, the start date for preorders was finally announced officially, and the grounds for saying that this November 19 date will not move any longer have come together. We lay out the history surrounding the release date and sort out what is confirmed and what is not.

---

## What Is Confirmed

First, let us nail down the facts that Rockstar has officially acknowledged.

- The release date is November 19, 2026 (a Thursday).
- The supported platforms are PlayStation 5 and Xbox Series X|S.
- Preorders open on June 25, 2026.
- The official cover art (the package image) was revealed at the same time.

These are all based on Rockstar's official announcements and are not speculation. As for the PC version, at this point not only the release date but its very release has not been officially announced.

---

## From Fall 2025 to November 19 — The History of the Delays

Originally this title was said to be coming out earlier. There were two delays before the release date settled into its current form.

- In December 2023, when the first trailer was revealed, the plan was 2025.
- After that, the time frame was made more specific to fall 2025.
- The first delay pushed the release to May 26, 2026.
- The second delay, on November 6, 2025, set it to the current November 19, 2026.

When announcing the second delay, Rockstar apologized for extending an already long wait and explained that it needed additional time to bring the game to a level of completion that lives up to expectations. Notably, immediately after this second delay was announced, parent company Take-Two's stock price reacted by temporarily dropping sharply. That is a sign of just how much market attention this title commands.

---

## Why We Can Say It Will Not Move This Time

Given the repeated delays, it is only natural that some people brace themselves and think it might slip again. Even so, this time the date is seen as firm. There are two main reasons.

One is that the very start of preorders serves as strong evidence. Digital stores such as the PlayStation Store and the Xbox Store have an operational constraint whereby preorders cannot open until the release is within 12 months. The fact that preorders go live on June 25 means the stores are operating on the premise of the November 19 date. Conversely, pushing back to 2027 from here has effectively become difficult unless preorders are pulled down once.

The other is that Take-Two has built this date into its earnings guidance. The company expects record-level net bookings of 8.0 to 8.2 billion dollars in fiscal year 2027, and it has named GTA6's November 19 release as the driving force behind that. CEO Strauss Zelnick has also repeatedly stated a November release at the May earnings call and in various interviews. When a publicly traded company ties a record earnings forecast to a specific date, it is natural to view that as having a corresponding degree of confidence in it.

That said, there is no absolute in game development. In some prediction markets, there are still moves that price in a slight chance of another delay. Nevertheless, every official signal points to as planned.

---

## The Price Has Not Been Officially Announced Yet

While the release date is firm, there is no official announcement on the price at this point.

In a March 2026 interview, Take-Two's CEO referred to a level of 70 dollars or 80 dollars, and the prevailing view is that the standard edition will land somewhere around there. In addition, there has been talk of the possibility of a higher-tier edition (rumored to be around 100 dollars) bundling GTA Online-related perks. However, these are industry observations and not confirmed.

What to watch out for are the prices shown early at some retailers (figures such as 99 euros in Europe and 69 to 86 pounds in the UK). These are likely placeholders (provisional values), and the official price is expected to be revealed when preorders open on June 25. Note that Take-Two has indicated a policy of not introducing in-game advertising, and has also hinted that it will not be greedy with its pricing.

---

## The PC Version and Online Come Later

At launch, only PS5 and Xbox Series X|S are supported, and the PC version is not bundled. Rockstar has taken a console-first, PC-later approach with past titles as well; with GTA5, the PC version appeared about 18 months after the console version. Following this convention, many expect GTA6's PC version to land somewhere in late 2027 to 2028.

As for the online mode, a launch simultaneous with the main game is not expected either. In past patterns, online started a few weeks to about a month after the main game's release, and GTA6 is likewise expected to see a similar phased rollout.

---

## Summary

- GTA6's release date is confirmed for November 19, 2026 (PS5 / Xbox Series X|S). Fall 2025 and May 2026 are both old plans from before the delays.
- It went through two delays, but with the June 25 start of preorders and its inclusion in Take-Two's earnings guidance, confidence in the date is the highest it has ever been.
- The price is unannounced. There are views that the standard edition will be around 70 to 80 dollars and the higher tier around 100 dollars, but confirmation comes on June 25.
- The PC version and online mode are likely to come after the main game.

GTA6, which has kept fans waiting for so long, has finally reached a solid landing point. The next big milestone will be June 25, when preorders and pricing are revealed.

---

*Note: Within this article, the descriptions concerning the price outlook (such as 70 to 80 dollars for the standard edition), the contents of the higher-tier edition, the timing of the PC version and online, and the possibility of another delay include industry observations and community predictions. They are not official announcements by Rockstar Games. The release date (November 19, 2026 / PS5 and Xbox Series X|S), the preorder start date (June 25, 2026), and the history of the past delays are confirmed information based on official announcements.*`,
    fullContent: `# GTA6の発売日は2026年11月19日で確定——二度の延期を経て、いま「動かない」と言える理由

『Grand Theft Auto VI（GTA6）』の発売日は、2026年11月19日で確定している。過去には「2025年秋」「2026年5月」といった時期が語られたこともあったが、いずれも延期され、現在の日付に落ち着いた。そして2026年6月、ついにプレオーダー（予約購入）の開始日が公式発表され、この11月19日という日付が「もう動かない」と言える根拠がそろってきた。発売日をめぐるこれまでの経緯と、いま確定していること・していないことを整理する。

---

## 確定していること

まず、Rockstarが公式に認めている事実を押さえておく。

- 発売日は2026年11月19日（木曜日）。
- 対応プラットフォームはPlayStation 5とXbox Series X|S。
- プレオーダーは2026年6月25日に開始。
- 同時に公式のカバーアート（パッケージ画像）も公開された。

これらはすべてRockstarの公式発表に基づくもので、推測ではない。PC版については、現時点で発売日はおろか発売そのものが正式発表されていない。

---

## 「2025年秋」から「11月19日」へ——延期の経緯

元々この作品は、もっと早い時期に出るとされていた。発売日が今の形に落ち着くまでには、二度の延期があった。

- 2023年12月、第1弾トレーラー公開時の予定は「2025年」だった。
- その後、時期は「2025年秋」へと具体化された。
- 一度目の延期で、発売は2026年5月26日へ。
- 2025年11月6日の二度目の延期で、現在の2026年11月19日に決まった。

二度目の延期を発表した際、Rockstarは長い待機をさらに延ばすことを詫びたうえで、期待に応える完成度に仕上げるために追加の時間が必要だと説明している。なお、この二度目の延期発表の直後には、親会社Take-Twoの株価が一時的に大きく下落するという反応もあった。それだけ市場の注目度が高いタイトルだということでもある。

---

## なぜ「今度こそ動かない」と言えるのか

延期を繰り返してきた以上、「また延びるのでは」と身構える人がいるのも当然だ。それでも、今回ばかりは日付が固いと見られている。理由は大きく2つある。

ひとつは、プレオーダーが始まること自体が強い証拠になっている点だ。PlayStation StoreやXbox Storeといったデジタルストアには、発売まで12か月以内にならないとプレオーダーを開始できないという運用上の制約がある。6月25日にプレオーダーが解禁されるということは、ストア側が11月19日という日付を前提に動いていることを意味する。逆に言えば、ここから2027年へ延期するのは、いったん予約受付を取り下げない限り事実上難しい状況になった。

もうひとつは、Take-Twoが業績見通しにこの日付を組み込んでいる点だ。同社は2027会計年度に過去最高水準となる80億〜82億ドルの純予約を見込んでおり、その原動力としてGTA6の11月19日発売を名指ししている。CEOのStrauss Zelnick氏も、5月の決算発表の場や各種インタビューで11月の発売を繰り返し明言している。上場企業が記録的な業績予想を特定の日付に結びつける以上、その日付に相応の確信があると見るのが自然だ。

もっとも、ゲーム開発に「絶対」はない。一部の予測市場では、いまなお再延期の可能性をわずかに織り込む動きも残っている。とはいえ、公式のシグナルはいずれも「予定通り」を指している。

---

## 価格はまだ正式発表されていない

発売日が固まる一方で、価格については現時点で公式発表がない。

Take-TwoのCEOは2026年3月のインタビューで「70ドルか80ドル」という水準に言及しており、標準版はこのあたりに収まるとの見方が有力だ。加えて、GTA Online関連の特典を同梱した上位エディション（100ドル前後と噂される）が用意される可能性も語られている。ただし、これらはあくまで業界の観測であって確定ではない。

注意したいのは、一部の小売店で先行して表示された価格（欧州での99ユーロ、英国での69〜86ポンドといった数字）だ。これらはプレースホルダー（仮の値）の可能性が高く、正式な価格はプレオーダー開始の6月25日に明らかになる見込みだ。なおTake-Twoは、ゲーム内広告を導入しない方針を示しており、価格設定についても強欲にはならないと示唆している。

---

## PC版とオンラインは「後から」

発売時点での対応はPS5とXbox Series X|Sのみで、PC版は同梱されない。Rockstarは過去作でもコンソール先行・PC後発という展開を取っており、GTA5ではコンソール版から約18か月遅れてPC版が登場した。この慣例に従えば、GTA6のPC版は2027年後半〜2028年あたりになるという見方が多い。

オンラインモードについても、本編発売と同時の開始は期待されていない。過去のパターンでは本編発売から数週間〜1か月ほど遅れてオンラインが始まっており、GTA6でも同様の段階的なロールアウトになると見られている。

---

## まとめ

- GTA6の発売日は2026年11月19日で確定（PS5／Xbox Series X|S）。「2025年秋」「2026年5月」は、いずれも延期前の古い予定。
- 二度の延期を経たが、6月25日のプレオーダー開始と、Take-Twoの業績見通しへの組み込みにより、日付の確度はこれまでで最も高い。
- 価格は未発表。標準版は70〜80ドル前後、上位版は100ドル前後との見方があるが、確定は6月25日。
- PC版とオンラインモードは、本編発売より後になる公算が大きい。

長く待たされてきたGTA6が、ようやく確かな着地点を得た。次の大きな節目は、プレオーダーと価格が明らかになる6月25日になる。

---

*※本記事のうち、価格の見通し（標準版70〜80ドル等）、上位エディションの内容、PC版・オンラインの時期、再延期の可能性に関する記述は、業界の観測やコミュニティの予測を含みます。Rockstar Gamesによる正式発表ではありません。発売日（2026年11月19日／PS5・Xbox Series X|S）、プレオーダー開始日（2026年6月25日）、過去の延期の経緯は、公式発表に基づく確定情報です。*`,
  },
  {
    id: 3,
    title: "GTA6の主人公は2人——ジェイソンとルシア、その「もう公式」な部分と「まだ噂」の部分",
    description:
      "主人公はジェイソンとルシアの2人。Rockstarが公式に明かした確定情報と、いまだ噂の域を出ない部分を切り分けて整理する。",
    icon: "🕵️",
    image: "/images/news/syujinkouhahutarijeisontorusia.webp",
    category: "speculation",
    date: "2026-06-08",
    source: "Rockstar Games Official ／ 各種報道",
    sourceUrl: "#",
    relatedArticles: [1, 4, 9],
    aiSummary: [
      "GTA6の主人公はジェイソンとルシアの2人で、恋愛関係にある犯罪者カップルとして描かれる。",
      "ルシアはメインライン初の本格的な女性主人公で、これは公式に確定した情報である。",
      "2人を切り替える操作や固有能力などの詳細は未確認で、プレイ済みを装う断定記事には注意したい。",
    ],
    titleEn:
      "GTA6 Has Two Protagonists — Jason and Lucia, the Already Official Parts and the Still a Rumor Parts",
    descriptionEn:
      "The protagonists are two people, Jason and Lucia. We sort out the confirmed facts Rockstar has officially revealed from the parts that still do not go beyond rumor.",
    aiSummaryEn: [
      "GTA6's protagonists are two people, Jason and Lucia, portrayed as a criminal couple in a romantic relationship.",
      "Lucia is the first full-fledged female protagonist in the mainline series, and this is officially confirmed information.",
      "Details such as how the two are switched and their unique abilities are unconfirmed, so be wary of articles that assert things as if the writer had already played the game.",
    ],
    fullContentEn: `# GTA6 Has Two Protagonists — Jason and Lucia, the Already Official Parts and the Still a Rumor Parts

GTA6 supposedly has multiple protagonists, and you can switch between them — talk like this was once common, but the situation has now changed. That is because Rockstar has already officially announced two protagonists and revealed their names and backgrounds: Jason Duval and Lucia Caminos. In this article, we organize the picture of GTA6's protagonists while clearly separating the parts Rockstar has presented as confirmed information from the parts that still do not go beyond rumor and leaks.

---

## What Is Confirmed: The Protagonists Are Two People, Jason and Lucia

First, let us cover the facts Rockstar has officially revealed.

GTA6's protagonists are two people, Jason Duval and Lucia Caminos. Whereas GTA5 had three protagonists (Michael, Franklin, and Trevor), GTA6 is narrowed down to two. And the two are not mere partners but are portrayed as a criminal couple in a romantic relationship. Rockstar has likened this relationship to Bonnie and Clyde, and for the first time in the series, it has built the entire story of a numbered title on top of a romance-and-crime partnership.

According to the official story description, the two get caught up in a conspiracy spreading across the whole state of Leonida after a job that should have been simple goes wrong, and they are forced to rely on each other in order to survive. Whereas GTA5's three were separate lives that intersected, the biggest difference is that Jason and Lucia are structured to experience a single story from two perspectives.

---

## Lucia Caminos — A Female Protagonist for the Series' History

Lucia is the first full-fledged female protagonist placed at the center of a solo story in mainline GTA. Female characters existed in the past as well, in the first game, GTA2, and GTA Online, but they were all either silent, optional, or avatars for multiplayer. Lucia is the first woman to stand at the center of a single-player story, and that fact alone carries great significance in the series' history.

The background of Lucia visible from the official character description is roughly as follows. As a child, she was taught how to fight by her father. After acting to protect her family, she ends up incarcerated in a Leonida state prison. Blessed with some luck, she gets out, and from here on she is determined to play it smart. The good, honest life her mother had dreamed of since the Liberty City days — she is trying to seize it with her own hands rather than leave it a half-baked fantasy. That is how her motivation is portrayed. In the trailer, she is shown in prison clothes, at a boxing gym, on a motorcycle, in a nightclub, and clutching wads of cash in the passenger seat of a car — suggesting a figure who moves back and forth between the bottom of society and the glamorous world.

---

## Jason Duval — A Man Who Seeks Peace but Cannot Reach It

The other protagonist, Jason, is portrayed as a man who wishes for an easy life that always slips through his fingers.

According to the official description, Jason grew up surrounded by scammers and lowlifes, and joined the army to escape a rough adolescence. But that did not work out either, and now he works as a local drug courier. Even so, he is trying something to change his life. About his meeting with Lucia, Rockstar writes suggestively that it could be the best thing or the worst thing to ever happen to him. It is also revealed that he works under a smuggler named Brian Heder in the Leonida Keys and is allowed to live in one of his properties.

Placing the two side by side reveals a contrast between Lucia's calculated ambition and Jason's tendency to be swept along. This difference in temperature looks set to become the engine that drives the story.

---

## Does Character Switching Exist

From here on, the line between confirmed information and rumor becomes important.

In GTA5, the system of switching between the three protagonists at the press of a button became established as the series' modern idiom. It is widely expected that in GTA6 as well, the two protagonists can be switched. Indeed, judging from the trailers and the story structure, that is a natural expectation.

What we should note, however, is that at this point Rockstar has not officially stated whether the two can be freely switched during exploration or missions. What the official side has shown extends only to the fact that the two are central figures and that they rely on each other after a job goes wrong; the mechanics on the control side are unconfirmed. Online there are articles that assertively describe the switching method or seamless switching, but those are unconfirmed conjecture.

---

## Be Wary of As If Already Played Details Circulating Online

Around the protagonists, a great deal of seemingly concrete gameplay information is circulating. For example, talk of each character's unique slow-motion ability, a hidden meter that gauges the relationship between the two, a lineup system in which the wanted status changes depending on the NPCs who witnessed you, and banter in specific missions.

These are interesting as reading material, but at this point none of them have been officially confirmed. GTA6 has not been released yet, and articles that describe details as if the writer had played the product are highly likely to be conjecture or fakes disguised as firsthand experience. We want to emphasize that they should not be treated as reliable information. What can be said for certain extends only this far: that the two protagonists each have different backgrounds (Jason, an army washout, and Lucia, who has fought since childhood), and that Rockstar has placed the relationship between the two at the core of the story.

---

## Why Is Two Talked About So Much

From three to two. At first glance this choice may look like a reduction in scale, but it is rather understood as an aim to raise the story's density.

GTA5's Michael, Franklin, and Trevor were a triangle of separate motivations and lives that intersected. A player could even spend many hours focused on a single protagonist while barely engaging with the other two. By contrast, Jason and Lucia are a pair who share a fate, and you cannot follow only one of them. Love, crime, and a shared craving to escape the circumstances they were born into bind the two together. Just as the previous title RDR2 generated narrative strength through deep emotional investment in its protagonist Arthur Morgan, GTA6 is trying to achieve that with two people — that is where many views converge.

---

## Summary

- GTA6's protagonists are two people, Jason Duval and Lucia Caminos. This is officially confirmed information and no longer a leak.
- Lucia is the first full-fledged female protagonist in mainline GTA. She is imprisoned for protecting her family, and after release she aims for an honest life.
- Jason is a man who failed to make a fresh start in the army and lives as a drug courier. His meeting with Lucia becomes a turning point.
- Details such as whether the two can be switched, each character's unique abilities, and hidden systems are all unconfirmed rumors. Be wary of articles that assert things as if the writer had already played the game.
- The change from three to two is seen not as a reduction in scale but as a choice to heighten the story's density.

That GTA6's story is built around a bond between two people, different from past entries in the series, is no longer in doubt. The remaining mechanics on the control side and the gameplay details should become clear in future trailers and at release (November 19, 2026).

---

*Note: Within this article, the gameplay details such as the specifications of character switching, each protagonist's unique abilities, the relationship meter, and the witness system include unconfirmed rumors and speculation. They are not an official announcement by Rockstar Games. That the protagonists are Jason Duval and Lucia Caminos, the framework of the two characters' backgrounds and relationship, and the main game's release date (November 19, 2026 / PS5 and Xbox Series X|S) are confirmed information based on Rockstar's official announcements.*`,
    fullContent: `# GTA6の主人公は2人——ジェイソンとルシア、その「もう公式」な部分と「まだ噂」の部分

「GTA6の主人公は複数いて、切り替えられるらしい」——かつてはこんなふうに語られていた話も、いまでは様相が変わっている。Rockstarがすでに2人の主人公を公式に発表し、名前も経歴も明かしているからだ。ジェイソン・デュバルとルシア・カミノス。この記事では、Rockstarが確定情報として示している部分と、いまだ噂やリークの域を出ない部分をはっきり切り分けながら、GTA6の主人公像を整理する。

---

## 確定していること：主人公はジェイソンとルシアの2人

まず、Rockstarが公式に明かしている事実から押さえる。

GTA6の主人公は、ジェイソン・デュバルとルシア・カミノスの2人だ。GTA5が3人（マイケル・フランクリン・トレバー）の主人公を擁したのに対し、GTA6は2人に絞られた。そして2人は単なる相棒ではなく、恋愛関係にある犯罪者カップルとして描かれる。Rockstarはこの関係を「ボニーとクライド」になぞらえており、シリーズで初めて、ナンバリング作品の物語全体を恋愛×犯罪のパートナーシップの上に組み立てている。

公式のストーリー説明によれば、2人は「簡単なはずだった仕事」がうまくいかなかったことをきっかけに、レオニダ州全体に広がる陰謀へと巻き込まれ、生き延びるために互いを頼らざるを得なくなる。GTA5の3人が「交差する別々の人生」だったのに対し、ジェイソンとルシアは「ひとつの物語を2つの視点から体験する」構造になっている点が、最大の違いだ。

---

## ルシア・カミノス——シリーズ史に残る女性主人公

ルシアは、メインラインのGTAで初めて、単独ストーリーの中心に据えられる本格的な女性主人公だ。過去にも初代やGTA2、GTA Onlineに女性キャラクターは存在したが、いずれも無口だったり、任意選択だったり、マルチプレイ用のアバターだったりした。シングルプレイの物語の中心に立つ女性は、ルシアが初めてであり、それだけでもシリーズ史において大きな意味を持つ。

公式のキャラクター説明から見えるルシアの背景は、おおよそ次のようなものだ。彼女は幼い頃、父から戦い方を仕込まれた。家族を守るための行動の果てに、レオニダ州の刑務所に収監される。幸運に恵まれて出所した彼女は、ここから先は賢く立ち回ろうと決めている。母がリバティーシティ時代から夢見てきた「まっとうな良い暮らし」を、半端な空想ではなく自らの手で掴み取ろうとしている——というのが、彼女の動機として描かれている。トレーラーでは、刑務所の囚人服姿、ボクシングジム、バイク、ナイトクラブ、車の助手席で札束を抱える姿などが映し出され、社会の底辺から華やかな世界までを行き来する人物像がうかがえる。

---

## ジェイソン・デュバル——平穏を求めて、なれない男

もう一人の主人公ジェイソンは、「楽な暮らし」を望みながら、それがいつも手をすり抜けていく男として描かれる。

公式説明によれば、ジェイソンは詐欺師や悪党に囲まれて育ち、荒れた十代から抜け出すために軍隊に入った。だがそれもうまくいかず、いまは地元の麻薬の運び屋として働いている。それでも、彼は人生を変える何かを試そうとしている。ルシアとの出会いについて、Rockstarは「彼にとって最良の出来事にも、最悪の出来事にもなりうる」と思わせぶりに記している。レオニダ・キーズの密輸業者ブライアン・ヘダーのもとで働き、その物件のひとつに住まわせてもらっている、という設定も明かされている。

ふたりを並べると、ルシアの計算された野心と、ジェイソンの流されがちな危うさという対比が見えてくる。この温度差が、物語を動かすエンジンになりそうだ。

---

## キャラクター切り替えは「ある」のか

ここから先は、確定情報と噂の線引きが重要になる。

GTA5では、3人の主人公をボタンひとつで切り替えるシステムが、シリーズの「現代的な語法」として定着した。GTA6でも、2人の主人公を切り替えられるのではないかと広く予想されている。実際、トレーラーやストーリー構造からして、自然な期待ではある。

ただし注意したいのは、Rockstarは現時点で、探索中やミッション中に2人を自由に切り替えられるかどうかを公式には明言していないという点だ。公式が示しているのは「2人が中心人物であること」「仕事の失敗後に互いを頼ること」までで、操作面の仕組みは確認されていない。ネット上には、切り替えの操作方法やシームレスな切り替えを断定的に語る記事も見られるが、それらは未確認の推測だ。

---

## ネットに出回る「プレイ済みのような」詳細には注意

主人公まわりでは、いかにも具体的な「ゲームプレイ情報」が数多く出回っている。たとえば、各キャラクター固有のスローモー能力、2人の関係を測る隠しメーター、目撃したNPCによって手配状況が変わる「面通し」システム、特定ミッションでの掛け合い——といった話だ。

これらは読み物としては面白いが、現時点ではいずれも公式に確認されていない。GTA6はまだ発売されておらず、製品をプレイしたかのように細部を語る記事は、体験談を装った推測やフェイクである可能性が高い。確かな情報として扱うべきではない、という点は強調しておきたい。確実に言えるのは、2人の主人公がそれぞれ異なる経歴（軍隊上がりのジェイソン、幼少から戦ってきたルシア）を持つこと、そしてRockstarが2人の関係性を物語の核に据えていること、ここまでだ。

---

## なぜ「2人」がこれほど語られるのか

3人から2人へ。一見すると規模の縮小にも見えるこの選択は、むしろ物語の密度を上げる狙いだと受け止められている。

GTA5のマイケル・フランクリン・トレバーは、別々の動機と人生が交差する「三角形」だった。プレイヤーは一人の主人公に集中して、残り二人とほとんど関わらずに何時間も遊ぶことすらできた。対してジェイソンとルシアは、運命を共有する一組であり、どちらか一方だけを追うことができない。愛と犯罪、そして生まれ落ちた境遇から抜け出したいという共通の渇望が、2人を結びつけている。前作RDR2が、主人公アーサー・モーガンへの深い感情移入によって物語の強度を生んだように、GTA6はそれを「2人」で実現しようとしている——というのが、多くの見方の一致するところだ。

---

## まとめ

- GTA6の主人公はジェイソン・デュバルとルシア・カミノスの2人。これは公式に確定した情報で、もはやリークではない。
- ルシアはメインラインGTA初の本格的な女性主人公。家族を守るために投獄され、出所後にまっとうな暮らしを目指す。
- ジェイソンは軍隊での再起に失敗し、麻薬の運び屋として生きる男。ルシアとの出会いが転機になる。
- 2人を切り替えられるかどうか、各キャラの固有能力や隠しシステムといった詳細は、いずれも未確認の噂。プレイ済みを装った断定記事には注意したい。
- 3人から2人への変更は、規模の縮小ではなく、物語の密度を高めるための選択と見られている。

GTA6の物語が、これまでのシリーズと違う「2人の絆」を軸に据えていることは、もはや疑いようがない。残る操作面の仕組みやゲームプレイの詳細は、今後のトレーラーや発売（2026年11月19日）で明らかになっていくはずだ。

---

*※本記事のうち、キャラクター切り替えの仕様、各主人公固有の能力、関係性メーターや目撃システムなどのゲームプレイ詳細は、未確認の噂・推測を含みます。Rockstar Gamesによる公式発表ではありません。主人公がジェイソン・デュバルとルシア・カミノスであること、2人の経歴や関係性の枠組み、本編発売日（2026年11月19日／PS5・Xbox Series X|S）は、Rockstarの公式発表に基づく確定情報です。*`,
  },
  {
    id: 4,
    title: "GTA6 マップサイズがGTA5の2倍以上",
    description:
      "リーク情報によると、GTA6のマップはGTA5より大幅に拡大され、複数の都市エリアが含まれる予定。",
    icon: "🗺️",
    image: "/images/news/mapsizegagta5nonibai.webp",
    category: "speculation",
    date: "2026-06-05",
    source: "Gaming Industry Insiders",
    sourceUrl: "#",
    relatedArticles: [1, 5, 12],
    aiSummary: [
      "GTA6のマップはGTA5の2から2.5倍が最有力とされるが、面積の公式数字は一切発表されていない。",
      "数字はすべてトレーラー分析やリークによるコミュニティの推定で、諸説あり幅が大きい。",
      "都市・湿地・島・山などを含む多様さが特徴で、建物侵入率の高さもリーク段階の期待値である。",
    ],
    titleEn: "GTA6 Map Size Over Twice That of GTA5",
    descriptionEn:
      "According to leaks, GTA6's map will be significantly larger than GTA5's and is set to include multiple urban areas.",
    aiSummaryEn: [
      "Roughly 2 to 2.5 times the size of GTA5 is considered the leading estimate for GTA6's map, but no official figure for the area has been released at all.",
      "The numbers are all community estimates based on trailer analysis and leaks, with many theories and a wide range.",
      "Its hallmark is diversity, including a city, wetlands, islands, and mountains, and the high rate of enterable buildings is also a leak-stage expectation.",
    ],
    fullContentEn: `# How Many Times Bigger Is GTA6's Map Than GTA5's? The Truth Behind the Over Twice the Size Leak and the Community's Reaction

With its release confirmed for November 19, 2026, Grand Theft Auto VI (GTA6) is finally taking on a sense of reality. One of the topics fans are most fervent about is the size of the map that serves as the game's stage. From multiple leaks and community analyses, it is said to be over twice the size of GTA5, but what is the reality? We organize what is known at this point — the range of figures circulating, their basis, and the real voices of fans on social media and Reddit.

![A leaked image circulating as a comparison of the map sizes of GTA5 (left) and GTA6 (right)](/images/news/GAT25qlaMAAXcS5.webp)

A widely circulated comparison image in the community, said to place the maps of GTA5 (left, Los Santos) and GTA6 (right, Leonida / Vice City) side by side. Note that it is, after all, an unofficial fan-made or leaked image and does not guarantee an accurate scale.

---

## Is Over Twice True? Sorting Out the Figures Being Thrown Around

The first thing to grasp is that Rockstar Games has not officially released the exact area of the map at all. The figures currently circulating are all estimates by the fan community based on trailer analysis and leaked footage.

On that basis, lining up the multipliers spoken of in various places, you can see there is quite a range.

- About 1.5 to 2 times: the most conservative view. A figure carefully estimated only from Rockstar's official trailers and screenshots.
- About 2 times: the median value adopted by many media outlets and mapping sites. In terms of area, it is calculated at around 125 km² for GTA6 against roughly 75 to 80 km² for GTA5.
- About 2.5 times: a figure prominently reported by overseas media such as CBR. This too is based on an area of around 125 km².
- About 2.5 to 3 times: a bullish estimate claimed by some fans who have thoroughly analyzed the trailers.
- About 3.5 times: a leak originating from a person called Sonarys. However, this was later denied by other Reddit users as fake or old information.

In other words, the expression over twice itself is roughly correct as a direction, but the accurate understanding of the current situation is 2 to 2.5 times is the leading estimate, though there are many theories. In some places the phrasing 70% bigger than GTA5 is also used, and the expression varies by source.

---

## The Most Intuitive Comparison Is Map Crossing Time

The square-kilometer figures are hard to grasp, but the comparison of the time to drive from end to end, calculated by the community, is easy to understand.

- GTA5: about 3 minutes 30 seconds to drive across the map
- GTA6: likewise, about 6 minutes 10 seconds

In simple travel time, almost twice. Cruising along vast highways, or crossing islands modeled on the Florida Keys by plane — a sense of scale in which travel itself becomes an experience is anticipated.

---

## Why Can We Know This Much Detail When It Is Not Released

Many people probably wonder, why can crossing time even be worked out when there is no official announcement? The answer is the fans' collective mapping project, which could even be called an obsession.

A representative example is the volunteer interactive map called State of Leonida. On Discord, more than 16,000 members cooperate, reconstructing the map through detective work such as the following.

- Analyzing every frame of official trailers 1 and 2 in 4K (trailer 1 alone has 2,276 frames)
- Verifying development footage leaked in 2022 to 2024
- Matching satellite imagery of real Miami and the Florida Keys against in-game locations
- Estimating terrain types by analyzing background sounds

The leaked 2022 footage is said to have had RAGE engine coordinate data embedded in it, which reportedly enabled accurate distance calculations on the map. In some quarters it is said to have reached 95 to 98% accuracy compared to the final version, and it has become a talking point that even store names and building positions match the trailer screenshots to an uncanny degree.

One overseas outlet described this community's work as half a detective's hobby, half therapy to ease the anxiety until release. With no playable build available, the very act of assembling a world from fragments has become a pleasure for fans.

---

## It Is Not Just Big. Diversity Is the Biggest Evolution

The reason GTA6's map draws attention is not mere area but the variety of its terrain. Whereas GTA5 had a configuration of Los Santos (one city) plus desert plus mountains plus a small town, GTA6's stage spreads across the entire fictional state of Leonida, modeled on Florida.

The regions whose names Rockstar has revealed in official trailers and screenshots number six at this point. These are not leaks but officially confirmed locations.

- Vice City: the central city modeled on Miami. Art deco hotels, neon-lit nightlife, canals and beaches. Said to be the most intricately crafted city in the series' history.
- Leonida Keys: tropical islands reminiscent of the Florida Keys. Protagonist Jason's starting apartment is here.
- Grassrivers: an Everglades-like wetland.
- Port Gellhorn: an industrial port town.
- Ambrosia: a rural, countryside area.
- Mount Kalaga National Park: a mountainous region with terrain that has elevation changes.

With a configuration in which city, wetlands, islands, mountains, an industrial zone, and countryside coexist in a single state, it is praised as the most geographically diverse map in the series' history. Furthermore, leaks say that about 70% of buildings are enterable, and that you can enter over 700 establishments such as nightclubs, hotels, restaurants, pawn shops, gun stores, and supermarkets. In GTA5, against the vast map there were only about 40 enterable buildings, and there was a complaint that the world feels empty, so this point is anticipated as a major evolution.

---

## A Small Firestorm Over Official Reporting

Here is something worth touching on: the debate over the source of information.

In April 2026, when the overseas outlet CBR ran an article with the headline that GTA6's map had been officially confirmed as 2.5 times the size of GTA5, the comment section grew heated. Readers fired off criticism such as, relying on leaks and official information are not the same, and there is no official statement by a Rockstar developer saying it is 2.5 times, so why write this as official?

This is also an important lesson when reading articles. The figure 2.5 times is, after all, a community mapping estimate and not something Rockstar has stated. Headlines online are sometimes assertive, but the current situation is that everything remains in the realm of estimates — we want to keep this premise in mind.

---

## The Community's Reaction: Fervor, and Calm Requests

Fans' reactions to the map's enormity broadly divide into two temperatures.

### The Fervent Camp

Toward the latest trailer's draw distance, praise poured in. On Reddit, voices lined up such as, this is what you get with a billion dollars of development cost, a new benchmark, and on top of that it was captured on a PS5, not even a PS5 Pro. From a technical viewpoint, some users speculated that Rockstar may have independently implemented dynamic polygon control like UE5's Nanite, running smoothly while maintaining a dense environment.

There were also many comments of pure anticipation, such as, unbelievable; when we land in Vice City, this game is going to overwhelm us.

### The Calm Camp Making Requests

On the other hand, the view that bigger is not necessarily better is also persistent.

In the game industry it has long been pointed out that if a map is too big, open-world fatigue occurs — a phenomenon where players are worn down by the monotony of travel and the pressure of exploration. A former designer has also sounded the alarm that without excellent fast travel and navigation, a huge map can backfire.

On Reddit too, opinions seeking substance over area stand out. One user posted, I want the same atmosphere as Red Dead Redemption 2; just walking around town and watching the NPCs go about their lives is fun, that is the ideal, and gathered support from over 100 people. Down-to-earth expectations such as, the map does not need to be needlessly big; I would be satisfied if it is a bit larger than GTA5, with lots of enterable buildings and each region having its own character, won broad support.

There were also requests beyond the city, such as, Vice City itself is dense and good, but how interesting the suburban areas outside it become is the key. By Rockstar choosing marketing that sells a state rather than sells a city, the most memorable missions may, rather, happen outside the city — such hopes and anxieties are mixed together.

---

## Summary: How It Feels Matters More Than Numbers

Organizing what is known at this point, it is as follows.

- GTA6's map is, as the leading estimate, 2 to 2.5 times the size of GTA5 (there are many theories, ranging from a 1.5x theory to a 3.5x theory).
- However, no official figure for the area has been released by Rockstar at all. Everything is a community estimate.
- Crossing time is about 3 minutes 30 seconds (GTA5) to about 6 minutes 10 seconds (GTA6), almost twice.
- It is the most diverse map in the series' history, including a city, wetlands, islands, mountains, a port town, and countryside.
- There is also a leak that about 70% of buildings are enterable, with anticipation gathering around an evolution in density rather than size.
- The community is fervent while also holding a calm perspective on the harms of being too big.

The full picture of the final map will become clear at the release on November 19, 2026, or in the next trailer that may be revealed before then. Until then, a time of expanding our imagination, relying on the volunteer mapping project and fragments of official information, looks set to continue.

---

*Note: The figures concerning area and multipliers in this article are community estimates based on trailer analysis and leaked footage. Please note that they are not an official announcement by Rockstar Games. The release date, stage (the state of Leonida / Vice City), and the six officially confirmed regions are based on Rockstar's official information.*`,
    fullContent: `# GTA6のマップはGTA5の何倍？「2倍以上」リークの真相とコミュニティの反応まとめ

2026年11月19日の発売が確定し、いよいよ現実味を帯びてきた『Grand Theft Auto VI（GTA6）』。ファンが最も熱狂しているトピックのひとつが、ゲームの舞台となる「マップの広さ」だ。複数のリークやコミュニティ分析から「GTA5の2倍以上になる」と言われているが、実際のところはどうなのか。出回っている数字の幅、その根拠、そしてSNSやRedditでのリアルなファンの声まで、現時点でわかっていることを整理する。

![GTA5（左）とGTA6（右）のマップサイズ比較として出回っているリーク画像](/images/news/GAT25qlaMAAXcS5.webp)

GTA5（左・ロスサントス）とGTA6（右・Leonida／Vice City）のマップを並べたとされる、コミュニティで広く出回っている比較画像。あくまで非公式のファン制作・リーク画像であり、正確な縮尺を保証するものではない点に注意。

---

## 「2倍以上」は本当か？ 飛び交う数字を整理する

まず押さえておきたいのは、Rockstar Games（ロックスター）はマップの正確な面積を公式には一切発表していないということだ。現在出回っている数字は、すべてトレーラー分析やリーク映像をもとにしたファン・コミュニティの推定値である。

そのうえで、各所で語られている倍率を並べると、かなり幅があることがわかる。

- 約1.5〜2倍：もっとも保守的な見方。Rockstarの公式トレーラーと screenshot のみから慎重に推定した数字。
- 約2倍：多くのメディアやマッピング系サイトが採用する中央値。面積にすると、GTA5の約75〜80km²に対してGTA6は約125km²前後と試算されている。
- 約2.5倍：海外メディアCBRなどが大きく報じた数字。これも面積125km²前後がベース。
- 約2.5〜3倍：トレーラーを徹底分析した一部のファンが主張する強気の見立て。
- 約3.5倍：「Sonarys」という人物発のリーク。ただしこれは後に他のRedditユーザーから「偽物・古い情報」として否定されている。

つまり「2倍以上」という表現自体は方向性として概ね合っているが、正確には「2〜2.5倍が最有力、ただし諸説あり」というのが現状の正しい理解だ。一部では「GTA5より70%大きい」という言い回しも使われており、表現はソースによってまちまちである。

---

## いちばん直感的な比較は「マップの横断時間」

平方キロメートルの数字はピンと来づらいが、コミュニティが算出した「端から端まで車で走り抜ける時間」の比較はわかりやすい。

- GTA5：車でマップを縦断するのに約3分30秒
- GTA6：同じく約6分10秒

単純な所要時間でほぼ2倍。広大な高速道路をクルージングしたり、フロリダ・キーズを模した島々を飛行機で横断したりと、「移動そのものが体験になる」スケール感が期待されている。

---

## なぜ未発売なのに、ここまで細かくわかるのか

「公式発表がないのに、なぜ横断時間まで割り出せるのか？」と疑問に思う人も多いだろう。その答えが、執念とも言えるファンの集団マッピング・プロジェクトだ。

代表的なのが「State of Leonida」という有志のインタラクティブマップ。Discord上では1万6000人を超えるメンバーが協力し、以下のような“探偵作業”でマップを再構築している。

- 公式トレーラー1・2の全フレームを4Kで解析（トレーラー1だけで2,276フレーム）
- 2022〜2024年に流出した開発映像の検証
- 実在のマイアミ／フロリダ・キーズの衛星画像と、ゲーム内ロケーションの照合
- 背景音の分析による地形タイプの推定

流出した2022年の映像にはRAGEエンジンの座標データが埋め込まれていたとされ、これがマップ上の正確な距離計算を可能にしたという。一部では「最終版の95〜98%の精度に達している」とも言われており、店名やビルの位置までトレーラーのスクリーンショットと不気味なほど一致しているのが話題になっている。

ある海外メディアは、このコミュニティの作業を「半分は探偵の趣味、半分は“発売までの不安を紛らわせるセラピー”」と表現していた。プレイできるビルドがない中で、断片から世界を組み立てていく行為そのものが、ファンの楽しみになっている。

---

## 広いだけじゃない。「多様性」こそ最大の進化

GTA6のマップが注目される理由は、単なる面積ではなく地形の多彩さにある。GTA5が「ロスサントス（1都市）＋砂漠＋山＋小さな町」という構成だったのに対し、GTA6の舞台はフロリダをモデルにした架空の州「Leonida（レオニダ）」全体に広がる。

Rockstarが公式トレーラーとスクリーンショットで名前を明かした地域は、現時点で6つ。これらはリークではなく公式に確認済みのロケーションだ。

- Vice City（バイスシティ）：マイアミがモデルの中心都市。アールデコ調のホテル、ネオン輝くナイトライフ、運河とビーチ。シリーズ史上最も作り込まれた都市とされる。
- Leonida Keys（レオニダ・キーズ）：フロリダ・キーズを思わせる熱帯の島々。主人公ジェイソンの初期アパートがある。
- Grassrivers（グラスリバーズ）：エバーグレーズ的な湿地帯。
- Port Gellhorn（ポート・ゲルホーン）：工業的な港町。
- Ambrosia（アンブロシア）：農村・田舎エリア。
- Mount Kalaga National Park（マウント・カラガ国立公園）：山岳地帯で、高低差のある地形。

都市・湿地・島・山・工業地帯・田舎が一つの州に同居する構成で、「シリーズ史上もっとも地理的に多様なマップ」と評されている。さらにリーク情報では、建物の約70%が侵入可能で、ナイトクラブ・ホテル・レストラン・質屋・銃砲店・スーパーなど700以上の店舗に入れるとも言われている。GTA5では広大なマップに対して入れる建物が約40棟しかなく「世界が空っぽに感じる」という不満があっただけに、この点は大きな進化として期待されている。

---

## 「公式」報道をめぐる小さな炎上

ここで触れておきたいのが、情報の“出どころ”をめぐる議論だ。

2026年4月、海外メディアCBRが「GTA6のマップは公式にGTA5の2.5倍と確認された」という見出しの記事を出したところ、コメント欄が荒れた。読者からは「リークに頼ることと、公式情報は同じではない」「Rockstarの開発者が2.5倍だと述べた公式声明など存在しない。なぜこれを“公式”と書くのか」といった批判が相次いだのだ。

これは記事を読むうえで重要な教訓でもある。「2.5倍」という数字は、あくまでコミュニティのマッピング推定であって、Rockstarが明言したものではない。ネット上の見出しは時に断定的だが、現状はすべて“推定”の域を出ていない——この前提は忘れないでおきたい。

---

## コミュニティの反応：熱狂と、冷静な注文

マップの巨大さに対するファンの反応は、大きく分けて二つの温度感がある。

### 熱狂派

最新トレーラーの描画距離（draw distance）に対しては、賞賛が殺到した。Redditでは「これが10億ドルの開発費で得られるものだ。新しいベンチマークだ」「しかもPS5で撮影されたもので、PS5 Proですらない」といった声が並んだ。技術的な視点から、UE5のNanite的な動的ポリゴン制御をRockstarが独自実装し、密度の高い環境を保ちながら滑らかに動作させているのでは、と考察するユーザーもいた。

「信じられない。バイスシティに降り立ったとき、このゲームは僕らを圧倒するはずだ」といった、純粋な期待のコメントも多い。

### 冷静派・注文をつける層

一方で、「大きければいい」というわけではない、という声も根強い。

ゲーム業界では以前から、マップが大きすぎると「オープンワールド疲れ（open-world fatigue）」——移動の単調さや、探索のプレッシャーでプレイヤーが消耗する現象——が起きると指摘されてきた。元デザイナーからも、優れたファストトラベルやナビゲーションがないと巨大マップは逆効果になりうる、という警鐘が鳴らされている。

Redditでも、「面積より中身」を求める意見が目立つ。あるユーザーは「『レッド・デッド・リデンプション2』と同じ空気感がほしい。ただ町を歩いてNPCの生活を眺めているだけで楽しい、あれが理想」と投稿し、100人以上の賛同を集めた。「マップは無闇に大きくなくていい。GTA5より少し広くて、入れる建物がたくさんあって、地域ごとに個性があればそれで満足」という、地に足のついた期待が多くの支持を得ている。

また「バイスシティ自体は密度が高くて良いが、それ以外の郊外エリアがどれだけ面白くなるかが鍵」という、都市以外への注文も見られる。Rockstarが「都市を売る」のではなく「州を売る」マーケティングを選んだことで、むしろ最も記憶に残るミッションは都市の外で起きるかもしれない——そんな期待と不安が入り混じっている。

---

## まとめ：数字より「どう感じるか」

現時点でわかっていることを整理すると、以下のようになる。

- GTA6のマップは、GTA5の2〜2.5倍が最有力（諸説あり、1.5倍説から3.5倍説まで存在）
- ただし面積の公式数字はRockstarから一切発表されていない。すべてコミュニティ推定。
- 横断時間は約3分30秒（GTA5）→約6分10秒（GTA6）でほぼ2倍
- 都市・湿地・島・山・港町・田舎を含む、シリーズ史上もっとも多様なマップ
- 建物の約70%が侵入可能というリークもあり、「広さ」より「密度」の進化に期待が集まる
- コミュニティは熱狂しつつも、「大きすぎる弊害」への冷静な視点も持っている

最終的なマップの全貌は、2026年11月19日の発売、あるいはその前に公開されるかもしれない次のトレーラーで明らかになる。それまでは、有志のマッピングプロジェクトと公式の断片情報を頼りに、想像を膨らませる時間が続きそうだ。

---

*※本記事の面積・倍率に関する数値は、トレーラー分析やリーク映像をもとにしたコミュニティの推定値です。Rockstar Gamesによる公式発表ではない点にご注意ください。発売日・舞台（Leonida州／Vice City）・公式確認済みの6地域については、Rockstarの公式情報に基づいています。*`,
  },
  {
    id: 5,
    title: "GTA6のグラフィックスはどこまで進化したのか——トレーラー分析で読み解く「RAGE 9」の正体",
    description:
      "光・反射・群衆の密度——トレーラーを技術分析し、エンジン「RAGE 9」が何によってどこまで進化したのかを考察する。",
    icon: "✨",
    image: "/images/news/graphichadokomadesinkasitanoka.webp",
    category: "speculation",
    date: "2026-06-12",
    source: "トレーラー技術分析に基づく考察",
    sourceUrl: "#",
    relatedArticles: [1, 9, 11],
    aiSummary: [
      "GTA6のトレーラーはPS5実機キャプチャで、映像は実プレイに近いとされる。",
      "エンジンはRAGE 9で、レイトレーシングによる光や反射の表現が最大の進化点と評価されている。",
      "解像度やフレームレートは公式未公表で、ベース機は4Kアップスケールの30fpsが現実的との見方が強い。",
    ],
    titleEn:
      "How Far Have GTA6's Graphics Evolved — Decoding the True Nature of RAGE 9 Through Trailer Analysis",
    descriptionEn:
      "Light, reflections, and crowd density — through a technical analysis of the trailers, we examine what drives the RAGE 9 engine and just how far it has evolved.",
    aiSummaryEn: [
      "GTA6's trailers were captured on actual PS5 hardware, and the footage is said to be close to actual gameplay.",
      "The engine is RAGE 9, and its expression of light and reflections through ray tracing is rated as the biggest leap forward.",
      "Resolution and frame rate have not been officially announced, and many believe a 30fps experience upscaled to 4K is the realistic outcome on base consoles.",
    ],
    fullContentEn: `# How Far Have GTA6's Graphics Evolved — Decoding the True Nature of RAGE 9 Through Trailer Analysis

When many people first saw the trailer for Grand Theft Auto VI (GTA6), they gasped, wondering whether this was really in-game footage. The reflection of light, the texture of skin, the density of crowds — every element pushes the bar of open-world games up a notch. In this article, we technically analyze the released trailers and screenshots to examine what has driven GTA6's graphics and how far they have evolved, sorting out what is confirmed fact from what, for now, remains speculation.

---

## First, an Essential Premise: The Trailers Are Equivalent to Actual Hardware and Actual Gameplay

Before discussing the technology, there is an important fact that serves as the foundation. Rockstar has stated that the second trailer released in May 2025 was captured on actual PlayStation 5 hardware, and that it is composed roughly half of gameplay and half of cutscenes.

What this means is that the footage seen in the trailer is not a pre-rendered movie but is close to the screen you actually play on. Rockstar has a track record of keeping cutscene and actual-gameplay quality nearly identical in past titles. In RDR2 as well, the level of detail in the cutscenes was reproduced directly in actual gameplay. That is precisely why analyzing the trailer footage carries a certain meaning as a way to estimate the product's real capabilities.

There is a caveat, however. The experts who perform technical analysis cautiously note that, at this stage, the trailer shots are nearly all there is, and they cannot assert how far the quality will be maintained during actual ordinary gameplay. We should keep this premise in mind.

---

## The Engine Is RAGE 9 — An Evolution Along the Same Line as RDR2

What powers GTA6 is the latest version of Rockstar's proprietary RAGE (Rockstar Advanced Game Engine), the so-called ninth generation. This lies within the lineage of the engine that has supported GTA5 and RDR2, and is said to have evolved significantly over more than a decade.

In frame-by-frame comparisons of GTA5 and GTA6 made by fans, the engine's progress is clearly visible. Many analyses conclude that not only have resolution and textures improved, but the fundamental aspects — environmental density, the handling of light, and physical expression — have reached a wholly different level.

---

## The Biggest Leap Forward: Expression of Light Through Ray Tracing

What experts rate most highly in their trailer analysis is the expression of light and reflections through ray tracing.

The team at Digital Foundry, which analyzes video technology, points out that GTA6's trailer uses full-fledged ray-traced global illumination (RTGI, a method that physically calculates the indirect bouncing of light), in which direct light, indirect light, and natural light richly mix together. They say the presence of indirect diffuse light can be felt in nearly every shot, and that this is especially pronounced in how the characters appear.

Ray-traced reflections have also been confirmed. What earns particularly high praise is the reflections on transparent and smooth objects such as sunglasses, mirrors, and car windshields. Experts have expressed the view, in essence, that such expression cannot be achieved without ray tracing. On the other hand, conventional screen-space reflections (SSR) appear to be used in combination for reflections on rough surfaces, and some point out that noise still remains in things like the rendering of water surfaces. In other words, GTA6 is highly likely to be built as a hybrid that switches between ray tracing and conventional methods depending on the situation.

The environment of the state of Leonida, modeled on Florida, is a stage that is like a showcase for this expression of light. Neon reflected on rain-soaked roads, the glare of glass-walled high-rises, sunlight passing through tropical trees — all of these are subjects in which ray tracing shines, and the world itself becomes a showcase for the technology.

---

## Resolution and Frame Rate: The Reality Surrounding 4K and 30fps

The expectation of 4K and 60fps on next-generation hardware is often discussed, but this is a part we should view calmly.

In the estimation of technical analysis, a stable, cinematic 30fps is considered the realistic target on the base PS5 and Xbox Series X. The rendering is expected to use a dynamic resolution of roughly 1152p to 1440p internally, then upscale from there to 4K. In other words, achieving native 4K at 60fps directly on the base consoles is difficult, and there is strong skepticism toward the inclusion of a 60fps mode.

On the more powerful PS5 Pro, however, the situation changes. With a hardware upscaling technology called PSSR (PlayStation Spectral Super Resolution), it can reconstruct a sharp 4K image from a low base resolution, and this is expected to be the best experience at launch. Furthermore, on the less powerful Xbox Series S, a corresponding compromise is said to be unavoidable, and even the same game looks set to offer a range of experiences depending on the hardware.

It should be emphasized that Rockstar has not, at this point, released any formal technical specifications such as resolution or frame-rate modes. The figures cited here are, to the end, analyses and conjecture by experts and the community.

---

## It Is Not Light Alone That Makes the Graphics Look Impressive

GTA6's visual persuasiveness is born not from ray tracing on its own but from the accumulation of multiple elements. Organizing the elements that can be read from the trailer, the picture is as follows.

- Crowd density. The streets of Vice City show an NPC density that exceeds GTA5 and RDR2. Moreover, the crowds react dynamically to the player's actions, flinching at weapons, fleeing from explosions, and filming with smartphones.
- Weather system. It is said to reproduce Florida's extreme climate, from clear skies to torrential rain and hurricanes. Weather is also said to affect NPC behavior and driving physics, and is expected to be the most advanced weather expression in Rockstar's history.
- Water rendering. Given the land's vast waterways, it needs to depict ocean waves, canal reflections, the murkiness of wetlands, and the transparent water of the Keys each differently. This water simulation is also a highlight in the trailer.
- Diverse ecosystems (biomes). Tropical vegetation, wetlands, highland forests, beachside palms — it depicts environments that differ by region, and this raises the richness of the world.

The very fact that these coexist at such high density tells of the engine's powerful processing capability.

---

## Summary

- GTA6's trailers were captured on actual PS5 hardware, with gameplay and cutscenes split roughly half and half. The footage is thought to be close to actual gameplay.
- The engine is RAGE 9. It is an evolved version carrying on RDR2's lineage, and its light, density, and physics have reached another dimension.
- The biggest leap is light and reflections through ray tracing. Reflections on transparent objects earn especially high praise, while it appears to be a hybrid configuration used in combination with conventional methods.
- Resolution and frame rate are unannounced. There is a strong view that a 30fps experience upscaled to 4K is realistic on base consoles, with skepticism toward 60fps. The PS5 Pro looks set to offer the best experience.
- The footage's persuasiveness is also supported by the accumulation of elements such as crowd density, weather, water, and vegetation.

Even from the released trailers alone, one can sense that GTA6's graphics are at a generation-defining level. The remaining formal specifications for resolution and frame rate should, by Rockstar's custom, be shown as the release (November 19, 2026) draws near. Just how far this footage will be reproduced in actual ordinary gameplay — the moment of truth for that answer is now less than half a year away.

---

*Note: Within this article, the descriptions concerning the specific implementation of ray tracing, the outlook for resolution and frame rate, and performance differences by hardware are based on third-party technical analysis such as Digital Foundry, and on conjecture from trailers and screenshots. They are not an official announcement of technical specifications by Rockstar Games. The facts that the second trailer was captured on actual PS5 hardware, that it is composed half of gameplay and half of cutscenes, and the main game's release date (November 19, 2026 / PS5 and Xbox Series X|S) are confirmed information based on Rockstar's official announcements.*`,

    fullContent: `# GTA6のグラフィックスはどこまで進化したのか——トレーラー分析で読み解く「RAGE 9」の正体

『Grand Theft Auto VI（GTA6）』のトレーラーを初めて見たとき、多くの人が「これが本当にゲーム画面なのか」と息をのんだ。光の反射、肌の質感、群衆の密度——どれもが、これまでのオープンワールドの水準を一段押し上げている。この記事では、公開済みのトレーラーやスクリーンショットを技術的に分析し、GTA6のグラフィックスが何によって、どこまで進化したのかを考察する。確定している事実と、現時点では推測にとどまる部分を切り分けながら見ていく。

---

## まず押さえたい前提：トレーラーは「実機・実プレイ」相当

技術を語る前に、土台となる重要な事実がある。Rockstarは、2025年5月公開の第2弾トレーラーについて、PlayStation 5の実機でキャプチャしたものであり、ゲームプレイとカットシーンが半々の構成だと明言している。

これが何を意味するかというと、トレーラーで見えている映像は「事前レンダリングのムービー」ではなく、実際にプレイする画面に近いということだ。Rockstarには、過去作でカットシーンと実プレイのクオリティをほぼ同一に保ってきた実績がある。RDR2でも、カットシーンの作り込みがそのまま実際のゲームプレイで再現されていた。だからこそ、トレーラーの映像分析が「製品の実力の推測」として一定の意味を持つ。

ただし注意点もある。技術分析を行う専門家も、現状はトレーラーのショットがほぼすべてであり、実際の通常プレイ中にどこまで品質が保たれるかは断言できない、と慎重に留保している。この前提は忘れずにおきたい。

---

## エンジンは「RAGE 9」——RDR2の延長線上にある進化

GTA6を動かしているのは、Rockstar独自のRAGE（Rockstar Advanced Game Engine）の最新版、いわゆる第9世代だ。これはGTA5やRDR2を支えてきたエンジンの系譜にあり、10年以上かけて大きく進化したものとされる。

ファンによるGTA5とGTA6のフレーム単位の比較では、エンジンの進歩がはっきり見て取れる。単に解像度やテクスチャが向上しただけでなく、環境の密度、光の扱い、物理表現といった根幹部分が別物の水準に達している、という分析が多い。

---

## 最大の進化点：レイトレーシングによる光の表現

トレーラー分析で専門家がもっとも高く評価しているのが、レイトレーシング（光線追跡）による光と反射の表現だ。

映像技術を分析するDigital Foundryのチームは、GTA6のトレーラーについて、直接光・間接光・自然光が豊かに混ざり合う、本格的なレイトレース・グローバルイルミネーション（RTGI＝光の間接的な回り込みを物理的に計算する手法）が使われていると指摘している。ほぼすべてのショットで間接的な拡散光の存在が感じられ、特にキャラクターの見え方にそれが顕著だという。

反射についても、レイトレースド・リフレクションが確認されている。とりわけ評価が高いのが、サングラス、鏡、車のフロントガラスといった透明・滑らかな物体への映り込みだ。専門家は、こうした表現はレイトレーシングなしには成立しない、という趣旨の見解を示している。一方で、ざらついた表面の反射には従来型のスクリーンスペース反射（SSR）が併用されているとみられ、水面の表現などにはまだノイズが残るという指摘もある。つまりGTA6は、レイトレーシングと従来手法を状況に応じて使い分ける「ハイブリッド」な作りになっている可能性が高い。

フロリダをモデルにしたレオニダ州の環境は、この光の表現の見本市のような舞台だ。雨に濡れた路面に映るネオン、ガラス張りの高層ビルの照り返し、熱帯の木々を透過する陽光——いずれもレイトレーシングが映える題材であり、世界観そのものが技術のショーケースになっている。

---

## 解像度とフレームレート：4Kと「30fps」をめぐる現実

「次世代機で4K・60fps」という期待はよく語られるが、ここは冷静に見ておきたい部分だ。

技術分析の見立てでは、ベースのPS5とXbox Series Xでは、安定したシネマティックな30fpsが現実的な目標とされている。描画は内部的には1152p〜1440p程度の動的解像度でレンダリングし、そこから4Kへアップスケールする方式が想定されている。つまり「ネイティブ4K・60fps」をベース機でそのまま実現するのは難しく、60fpsモードの搭載には懐疑的な見方が強い。

一方、より高性能なPS5 Proでは事情が変わる。PSSR（PlayStation Spectral Super Resolution）というハードウェアのアップスケーリング技術により、低い基準解像度から鮮明な4Kへ再構成でき、ローンチ時点ではこれが最良の体験になるとみられている。さらに性能差のあるXbox Series Sでは、相応の妥協が避けられないとされ、同じゲームでもハードによって体験に幅が出ることになりそうだ。

なお、Rockstarは現時点で、解像度やフレームレートのモードといった正式な技術仕様を一切公表していない。ここで挙げた数字は、あくまで専門家やコミュニティによる分析・推測である点は強調しておきたい。

---

## グラフィックスを「すごく見せる」のは光だけではない

GTA6の映像的な説得力は、レイトレーシング単体ではなく、複数の要素の積み重ねによって生まれている。トレーラーから読み取れる要素を整理すると、次のようになる。

- 群衆の密度。ヴァイスシティの街頭は、GTA5やRDR2を上回るNPC密度を見せている。しかも群衆はプレイヤーの行動に動的に反応し、武器に怯えたり、爆発から逃げたり、スマホで撮影したりする。
- 天候システム。晴天から豪雨、ハリケーンまで、フロリダの極端な気候を再現するとされる。天候はNPCの行動や運転の物理にも影響するとされ、Rockstar史上もっとも高度な天候表現になると見られている。
- 水の表現。広大な水路を抱える土地柄、海の波、運河の反射、湿地の濁り、キーズの透明な水を、それぞれ描き分ける必要がある。トレーラーではこの水のシミュレーションも見どころになっている。
- 多様な生態系（バイオーム）。熱帯の植生、湿地、高地の森、ビーチのヤシ——地域ごとに異なる環境を描き分けており、これが世界の豊かさを底上げしている。

これらが密度高く同居していること自体が、エンジンの処理能力の高さを物語っている。

---

## まとめ

- GTA6のトレーラーはPS5実機でキャプチャされ、ゲームプレイとカットシーンが半々。映像は実プレイに近いと考えられる。
- エンジンは「RAGE 9」。RDR2の系譜を継ぐ進化版で、光・密度・物理が別次元に達している。
- 最大の進化はレイトレーシングによる光と反射。透明物への映り込みが特に高く評価される一方、従来手法との併用というハイブリッド構成とみられる。
- 解像度・フレームレートは未公表。ベース機は4Kアップスケールの30fpsが現実的との見方が強く、60fpsには懐疑的。PS5 Proが最良の体験になりそう。
- 映像の説得力は、群衆密度・天候・水・植生といった要素の積み重ねによっても支えられている。

公開済みのトレーラーだけでも、GTA6のグラフィックスが「世代を画する」水準にあることはうかがえる。残る解像度やフレームレートの正式な仕様は、Rockstarの慣例からすると発売（2026年11月19日）が近づいた段階で示されるはずだ。実際の通常プレイでこの映像がどこまで再現されるのか——その答え合わせは、もう半年を切っている。

---

*※本記事のうち、レイトレーシングの具体的な実装、解像度・フレームレートの見通し、ハード別の性能差に関する記述は、Digital Foundryなど第三者の技術分析や、トレーラー・スクリーンショットからの推測に基づきます。Rockstar Gamesによる正式な技術仕様の発表ではありません。第2弾トレーラーがPS5実機でキャプチャされたこと、ゲームプレイとカットシーンが半々であること、本編発売日（2026年11月19日／PS5・Xbox Series X|S）は、Rockstarの公式発表に基づく確定情報です。*`,
  },
  {
    id: 6,
    title: "GTA6の新オンラインは何が変わる？ 「GTA Online 13年の宿題」から読むマルチプレイヤーの行方",
    description:
      "壊れた経済、チート、初心者の参入障壁——GTA Online 13年の課題から、新オンラインの仕組みがどう変わりうるかを考察する。",
    icon: "👥",
    image: "/images/news/on-linehananigakawarunoka.webp",
    category: "speculation",
    date: "2026-06-09",
    source: "ゲームデザインの観点からの考察",
    sourceUrl: "#",
    relatedArticles: [14, 2, 1],
    aiSummary: [
      "GTA6のオンラインは仕様未発表で、本記事はGTA Onlineの実績などからの考察である。",
      "最大の焦点はインフレや課金で崩れた経済の作り直しと、チート対策の現代化にある。",
      "初心者の参入障壁や課金とのバランス、RPやUGCといったコミュニティ機能の進化も課題とされる。",
    ],
    titleEn:
      "What Changes in GTA6's New Online? Reading the Future of Multiplayer From 13 Years of GTA Online Homework",
    descriptionEn:
      "A broken economy, cheating, the barrier to entry for newcomers — from 13 years of GTA Online's challenges, we examine how the new online's mechanics could change.",
    aiSummaryEn: [
      "GTA6's online is unannounced in its specifications, and this article is an examination based on things like GTA Online's track record.",
      "The biggest focus is rebuilding the economy that collapsed from inflation and monetization, and modernizing anti-cheat measures.",
      "The barrier to entry for newcomers, the balance with monetization, and the evolution of community features like RP and UGC are also seen as challenges.",
    ],
    fullContentEn: `# What Changes in GTA6's New Online? Reading the Future of Multiplayer From 13 Years of GTA Online Homework

When it comes to Grand Theft Auto VI (GTA6), the conversation tends to be dominated by the question of when the online mode will start. But just as important is the question of how the content will change. The previous title's GTA Online was a monument that lasted 13 years, but over that long history it also came to carry structural challenges such as economic collapse, cheating, and newcomers being left behind. How will GTA6's new online tackle this homework? We examine it from a game-design perspective while separating confirmed information from speculation.

Note: The overall picture, such as the new online's start timing and Project ROME, is covered in the separate article When Does GTA6's Online Start? This article focuses on and digs into the content and mechanics.

---

## Premise: The New Online's Specifications Have Not Yet Been Officially Announced

To say it up front, Rockstar has not yet even officially announced that GTA6 has an online mode. No developer commentary or official explanation of mechanics has come out at all regarding the details of the economy system or game modes.

The content covered in this article is centered on speculation assembled by the community and specialist media from trailers, Take-Two's statements to investors, the 2022 leaked materials, and 13 years of GTA Online's track record. Please read it strictly as an examination of how it might change.

---

## Homework 1: How to Rebuild the Broken Economy

Unavoidable when discussing GTA Online is the economy that collapsed from inflation (soaring prices).

In GTA Online, players earned money through missions, heists, and owned businesses, and spent it on cars, properties, weapons, and modifications. But as the years passed, new cars and properties were added with each update, and their prices kept climbing. While new cars and luxury properties reached tens of millions of GTA$, rewards were raised to match, and as a result the value of money itself was lost. It is a textbook case of power creep, in which updates constantly raise the bar, and it exposed the limits of GTA Online, which was not designed for long-term operation in the first place.

What accelerated this distortion is said to be the Shark Card, a paid item that lets you buy in-game currency with real money. Furthermore, a vicious cycle also occurred in which players who generated money through glitches (bugs) or duplication injected vast amounts of funds, and Rockstar raised prices to balance the books. New players were forced into an eternal game of catch-up, never able to overtake those ahead of them.

What is most anticipated for GTA6's new online is this rebuilding of the economy. In the community, ideas are discussed such as an MMO-like structure in which you belong to a faction (organization or gang), hold roles and goals, and fight over turf, resources, and market share, as well as player-driven markets, crafting, and production chains. But steering this is extremely difficult. They want to avoid a grind that forces endless busywork, yet if progression is too light, there is no sense of challenge. On top of that, they need to reconcile, within the same world, a satisfying single-player economy with a scarcity-based online economy where monetization works. How this tightrope is designed will be the biggest thing to watch.

---

## Homework 2: The Never-Ending War With Cheating

Another deep-rooted challenge is the spread of cheating (illicit activity).

In GTA Online, things like god mode, money hacks, various exploits, and DDoS attacks ran rampant, and players' trust was greatly damaged especially in the PC version. Rockstar advanced countermeasures such as introducing the anti-cheat BattlEye in 2024, but cheats that slip past it have also been reported, and the cat-and-mouse game continues.

GTA6's new online is called on to have not just a new engine but modern-standard security design. Server-side verification of important data, real-time monitoring of suspicious behavior, robust anti-cheat — without these, it will end up repeating the same problems. From a technical viewpoint, there are also persistent voices saying it should adopt dedicated servers rather than the P2P (peer-to-peer) connections GTA Online used. Going to dedicated servers is expected to be effective on both fronts of anti-cheat and connection stability.

---

## Homework 3: The Barrier to Entry for Newcomers, and Solo-Friendly Playability

The economy's distortion was itself also a barrier to entry for new players. Faced with cars and properties costing tens of millions, players who had just started could not catch up without spending an enormous amount of time. This created GTA Online's hard to get into nature.

In addition, there were many missions premised on multiple participants, and there were scenes that were hard to play for solo players. That said, in its later years GTA Online gradually increased content that could be progressed with a small group or solo. Following this trend, there is a view that GTA6's new online may make a design playable comfortably even alone its core. The abundance of loading screens has also been a long-standing complaint, and improvement here is hoped for too.

GTA6 will surely have a huge influx of new players on launch day. That is precisely why how to create a gentle entrance that does not make people give up in the first few hours will determine long-term success or failure.

---

## Homework 4: The Balance With Monetization, and Community Features

Unavoidable is the balance with monetization.

While the Shark Card brought enormous revenue to GTA Online, it is also seen as a factor that slowed the game's progression and distorted the economy. Take-Two positions GTA6 as a giant project that will rewrite the company's performance, and it needs to design online as a long-term revenue base. In other words, the question is how to reconcile a fair and fun economy with a structure where monetization works.

For reference, Take-Two has indicated a policy of not introducing in-game advertising. At the very least, it will not head in a direction that ruins the world's atmosphere with ads.

On the community-features side, in addition to the aforementioned faction concept, there are rumors of a move to officially incorporate roleplay (RP) and user-generated content (UGC). This was covered in detail in a separate article as Project ROME, but in that the new online could become a foundation where players create the world rather than just a playground, the evolution of community features is also deeply tied to the economy and mode design.

---

## Summary

- GTA6's online mode is unannounced in its specifications. The content of this article is centered on speculation from GTA Online's track record, trailers, and leaked materials.
- The biggest focus is rebuilding the economy. The question is how to prevent the collapse caused by inflation, Shark Cards, and duplication with a sustainable design.
- Anti-cheat measures require modern-standard security. There are strong voices hoping for a shift from P2P to dedicated servers.
- Improving the barrier to entry for newcomers and solo-friendly playability, and shortening loading, are also long-standing homework.
- The balance with monetization, and the evolution of community features such as factions, RP, and UGC, will also shape the direction of the new online.

GTA Online's 13 years were at once a history of success and a precious teaching material for learning from failure. How GTA6's new online will answer that homework — the full picture of the mechanics should gradually become clear after release (November 19, 2026). While anticipating it, we want to watch over it, keeping our distance from the undetermined parts as speculation.

---

*Note: Within this article, the descriptions concerning the new online's economy system, game modes, anti-cheat measures, and community features include examination based on GTA Online's track record, trailers and leaked materials, and the community's predictions. They are not an official announcement by Rockstar Games. That Take-Two has indicated a policy of not introducing in-game advertising, and the main game's release date (November 19, 2026 / PS5 and Xbox Series X|S), are confirmed information based on official announcements.*

Beyond online alone, the bigger picture — including the officialization and consolidation of RP culture — is covered in "[What Happens to Roleplay in GTA6](/en/news/18)".`,
    fullContent: `# GTA6の新オンラインは何が変わる？ 「GTA Online 13年の宿題」から読むマルチプレイヤーの行方

『Grand Theft Auto VI（GTA6）』のオンラインモードは、いつ始まるのかという話題ばかりが先行しがちだ。だが、それと同じくらい重要なのが「中身がどう変わるのか」という問いである。前作のGTA Onlineは13年続いた金字塔だが、その長い歴史のなかで、経済の崩壊やチート、初心者の置いてけぼりといった構造的な課題も抱え込んできた。GTA6の新しいオンラインは、この「宿題」をどう片づけてくるのか。確定情報と推測を切り分けながら、ゲームデザインの観点から考察する。

※新オンラインの開始時期やProject ROMEといった全体像については、別記事「GTA6のオンラインはいつ始まる？」で扱っている。本記事は「中身・仕組み」に絞って掘り下げる。

---

## 前提：新オンラインの仕様は、まだ公式発表されていない

最初に断っておくと、Rockstarはまだ、GTA6のオンラインモードの存在すら正式には発表していない。経済システムやゲームモードの詳細について、開発者の解説や公式の仕組み紹介は一切出ていない。

本記事で扱う内容は、トレーラー、Take-Twoの投資家向け発言、2022年の流出資料、そして13年分のGTA Onlineの実績から、コミュニティや専門メディアが組み立てた推測が中心だ。あくまで「こう変わるのではないか」という考察として読んでほしい。

---

## 宿題その1：壊れた経済をどう作り直すか

GTA Onlineを語るうえで避けて通れないのが、インフレ（物価高騰）で崩壊した経済だ。

GTA Onlineでは、プレイヤーはミッションや強盗（ハイスト）、所有ビジネスでお金を稼ぎ、車・物件・武器・改造に費やした。しかし年月が経つにつれ、アップデートのたびに新しい車や物件が追加され、その価格はどんどん吊り上がっていった。新車や高級物件が数千万GTA$に達する一方、報酬もそれに合わせて引き上げられ、結果としてお金の価値そのものが失われていった。アップデートで常に上を更新し続ける「パワークリープ」の典型であり、もともと長期運用を前提に設計されていなかったGTA Onlineの限界が露呈した形だ。

この歪みを加速させたのが、リアルマネーでゲーム内通貨を買える課金アイテム「シャークカード」だと指摘されている。さらに、グリッチ（バグ）や複製でお金を生み出すプレイヤーが大量の資金を注入し、Rockstarが価格を引き上げて帳尻を合わせる——という悪循環も起きた。新規プレイヤーは、いつまでも先行者に追いつけない「永遠の後追い」を強いられた。

GTA6の新オンラインに最も期待されているのが、この経済の作り直しだ。コミュニティでは、ファクション（組織・ギャング）に所属して役割や目標を持ち、縄張りや資源、市場シェアを奪い合うMMO的な構造や、プレイヤー主導の市場・クラフト・生産チェーンといったアイデアが語られている。ただし、その舵取りは極めて難しい。延々と作業を強いる「グラインド」は避けたいが、進行が軽すぎても張り合いがなくなる。しかも、満足感のあるシングルプレイの経済と、課金が成立する希少性ベースのオンライン経済を、同じ世界の中で両立させる必要がある。この綱渡りをどう設計するかが、最大の見どころになる。

---

## 宿題その2：チートとの終わらない戦い

もうひとつの根深い課題が、チート（不正行為）の蔓延だ。

GTA Onlineでは、無敵化やマネーハック、各種エクスプロイト、DDoS攻撃などが横行し、とりわけPC版でプレイヤーの信頼が大きく損なわれてきた。Rockstarは2024年にアンチチート「BattlEye」を導入するなど対策を進めたが、それを掻い潜るチートも報告されており、いたちごっこが続いている。

GTA6の新オンラインには、新しいエンジンだけでなく、現代水準のセキュリティ設計が求められている。サーバー側での重要データの検証、不審な挙動のリアルタイム監視、堅牢なアンチチート——これらが伴わなければ、同じ問題を繰り返すことになる。技術的な観点からは、GTA Onlineが採用していたP2P（ピアツーピア）接続ではなく、専用サーバー（デディケイテッドサーバー）を採用すべきだという声も根強い。専用サーバー化は、チート対策と接続の安定の両面で効果が期待される。

---

## 宿題その3：初心者の参入障壁と、ソロ向けの遊びやすさ

経済の歪みは、そのまま新規プレイヤーの参入障壁にもなっていた。何千万もする車や物件を前に、始めたばかりのプレイヤーは膨大な時間を費やさないと追いつけない。これがGTA Onlineの「入りにくさ」を生んでいた。

加えて、複数人の参加を前提とするミッションが多く、ソロプレイヤーには遊びにくい場面もあった。もっとも、後年のGTA Onlineは少人数・ソロでも進められるコンテンツを徐々に増やしてきた経緯がある。この流れを汲んで、GTA6の新オンラインでは、一人でも快適に遊べる設計が核になるのではないか、という見方がある。ローディング画面の多さも長年の不満点であり、ここの改善も望まれている。

GTA6は発売初日に膨大な新規プレイヤーが流入することが確実だ。だからこそ、最初の数時間で挫折させない「優しい入り口」をどう作るかが、長期的な成否を分ける。

---

## 宿題その4：課金とのバランス、そしてコミュニティ機能

避けて通れないのが、収益化（マネタイズ）とのバランスだ。

シャークカードはGTA Onlineに莫大な収益をもたらした一方で、ゲームの進行を鈍らせ、経済を歪める一因にもなったと見られている。Take-TwoはGTA6を会社の業績を塗り替える巨大プロジェクトと位置づけており、オンラインを長期的な収益基盤として設計する必要がある。つまり「公平で楽しい経済」と「課金が成立する仕組み」を、いかに両立させるかが問われる。

なお、Take-Twoはゲーム内広告を導入しない方針を示している。少なくとも、広告で世界観を損なう方向には進まないということだ。

コミュニティ機能の面では、前述のファクション構想に加えて、ロールプレイ（RP）やユーザー生成コンテンツ（UGC）を公式に取り込む動きが噂されている。これは「Project ROME」として別記事で詳しく扱ったが、新オンラインが単なる遊び場ではなく、プレイヤーが世界を作る基盤になりうる、という点で、コミュニティ機能の進化は経済やモード設計とも深く結びついている。

---

## まとめ

- GTA6のオンラインモードは仕様未発表。本記事の内容は、GTA Onlineの実績やトレーラー、流出資料からの推測が中心。
- 最大の焦点は経済の作り直し。インフレ・シャークカード・複製による崩壊を、いかに持続可能な設計で防ぐかが問われる。
- チート対策には現代水準のセキュリティが必須。P2Pから専用サーバーへの移行を望む声が強い。
- 初心者の参入障壁とソロ向けの遊びやすさの改善、ローディングの短縮も長年の宿題。
- 課金とのバランス、ファクションやRP・UGCといったコミュニティ機能の進化も、新オンラインの方向性を左右する。

GTA Onlineの13年は、成功の歴史であると同時に、貴重な「失敗から学ぶ教材」でもあった。GTA6の新オンラインが、その宿題にどう答えを出すのか。仕組みの全貌は、発売（2026年11月19日）以降に少しずつ明らかになっていくはずだ。期待しつつも、確定していない部分は推測として距離を取りながら見守りたい。

---

*※本記事のうち、新オンラインの経済システム、ゲームモード、チート対策、コミュニティ機能に関する記述は、GTA Onlineの実績やトレーラー・流出資料、コミュニティの予測に基づく考察を含みます。Rockstar Gamesによる公式発表ではありません。Take-Twoがゲーム内広告を導入しない方針を示していること、本編発売日（2026年11月19日／PS5・Xbox Series X|S）は、公式発表に基づく確定情報です。*

オンライン単体にとどまらず、RP文化の公式化・一本化まで含めた全体像は「[GTA6のロールプレイはどうなるのか](/news/18)」で総合的に解説している。`,
  },
  {
    id: 7,
    title: "GTA6の「犯罪」はどう進化する？ 流出映像が示した強盗システムの正体と、注意したい誇張リーク",
    description:
      "2022年流出映像が示した「動的な強盗」と手配度の作り直し。確定情報と誇張リークを切り分けて犯罪システムを考察する。",
    icon: "🚔",
    image: "/images/news/hanzaihadousinkasuru.webp",
    category: "speculation",
    date: "2026-06-07",
    source: "流出映像・コミュニティ分析に基づく考察",
    sourceUrl: "#",
    relatedArticles: [3, 6, 12],
    aiSummary: [
      "GTA6の犯罪システムの詳細は公式未発表で、具体像は主に2022年流出映像の分析に基づく。",
      "流出映像は人質が逃げたり抵抗したりする動的な強盗や、通報で警察が動く手配度を示唆した。",
      "複数の解法は一定の説得力があるが、物語を大きく分岐させる道徳的ジレンマは裏づけが薄い。",
    ],
    titleEn:
      "How Will GTA6's Crime Evolve? The True Nature of the Heist System Shown by Leaked Footage, and Exaggerated Leaks to Watch Out For",
    descriptionEn:
      "The dynamic heists and the rebuilt wanted level shown by the 2022 leaked footage. We examine the crime system while separating confirmed information from exaggerated leaks.",
    aiSummaryEn: [
      "The details of GTA6's crime system are officially unannounced, and the concrete picture is mainly based on analysis of the 2022 leaked footage.",
      "The leaked footage suggested dynamic heists in which hostages flee or resist, and a wanted level where police move once a call is made.",
      "Multiple solutions carry a certain persuasiveness, but the moral dilemmas that would greatly branch the story have thin backing.",
    ],
    fullContentEn: `# How Will GTA6's Crime Evolve? The True Nature of the Heist System Shown by Leaked Footage, and Exaggerated Leaks to Watch Out For

Surrounding Grand Theft Auto VI (GTA6), what fans are placing particular hope on is the overhaul of the crime (heist) system. Provocative talk is also flying around, such as there are multiple solutions and you are pressed to make moral choices. However, much of this information derives from early development footage that leaked in 2022 and from subsequent analysis, and the reality is that confirmed information, unconfirmed leaks, and exaggerated conjecture are all mixed together. In this article, we examine how GTA6's crime system looks set to evolve while separating what is certain and to what degree.

---

## First, the Premise: The Details of the Crime System Are Officially Unannounced

To say it up front, Rockstar has not officially announced the details of the heist system or mission structure. The world and some behaviors have been shown in trailers and screenshots, but Rockstar has not explained the game-system mechanics such as missions have multiple solutions or choices change the story.

The concrete picture of the crime system being discussed now is mainly based on the early development gameplay footage that leaked in September 2022 and on the analysis the community and overseas media subsequently performed. The leaked footage is, after all, a work in progress during development, and there is no guarantee it is reflected as-is in the final product — please read on with this premise in mind.

---

## The Dynamic Heists Shown by the Leaked Footage

In GTA5, most big jobs like bank robberies in the heists were limited to tightly crafted story missions. The heists that players could freely plan and carry out were only a small portion.

What the 2022 leaked footage showed was that this could greatly change. The footage depicted a scene in which the female protagonist (said to be Lucia) and her partner Jason raid a diner. Organizing the elements that could be read from this, it is as follows.

- When the protagonist points a gun at a clerk and demands money, the clerk complies and places the money on the counter.
- The partner Jason watches over the customers in the store, and the player appears to be handling that role manually through button operation.
- The customers in the store (hostages) appear to each be assigned a different behavior label, suggesting that some may obediently comply while others may flee or resist.

In other words, the estimate is that rather than a repetition of a fixed raid, dynamic heists in which the development changes according to the situation on the spot may be properly introduced for the first time in the series. This is drawing attention as the biggest evolution from GTA5.

---

## The Rebuilding of the Police (Wanted Level) System

Closely tied to the overhaul of the crime system is the rebuilding of the wanted level — that is, the police's reaction.

In GTA5, if you committed a crime within an officer's line of sight, a wanted level was attached instantly and the police rushed over right away. However, the reproduction of the process by which NPCs actually report you could not be called very realistic. From the leaked footage and leaks, it is pointed out that in GTA6 this mechanism may become more natural and dynamic.

For example, behavior such as the police not moving until someone actually reports you, and the countdown beginning only once you are reported. If this is true, then tactics such as not letting the clerk pick up the phone, or quickly subduing hostages, will determine the success or failure of your escape. The tension will increase by an order of magnitude.

It is also reported that the leaked footage had elements suggesting a new way of thinking about the wanted level, such as on-screen displays implying that the player can surrender to the police, and that the police will not respond lethally unless the player resorts to lethal means first.

---

## How True Are Multiple Solutions and Moral Dilemmas

The points multiple solutions and morally complex choices, which were also in the original article's title, are themes of great fan anticipation. Here we especially want to separate things carefully.

It is true that a dynamic heist system results in a breadth of approaches. Whether you tie up and silence the hostages, threaten them by force, or escape quickly — if the development changes by judgment on the spot, that can be called multiple solutions in a broad sense. Taking into account that the previous title RDR2 had a mechanism (the honor system) in which the reaction changed based on how you treated others, the speculation that GTA6 brings that philosophy into the context of crime carries a certain persuasiveness.

However, the more far-reaching claims that the player's choices greatly branch the entire story or that heavy moral dilemmas are placed at the center have no solid backing at this point. Rockstar's past works have been better at crafted linear stories than at branching with choices. If you expect too much of a dramatic branching system, there is a possibility you will be let down by the gap with reality. It is level-headed to grasp freedom of approach and branching of the story as separate things.

---

## Be Wary of As If Already Played Details Circulating

Around the crime system, seemingly concrete information overflows online. Talk such as unique skill trees, a detection ability resembling RDR2's Dead Eye, a mechanism to cash out stolen goods at pawn shops and black markets, and a wanted level that links nationwide.

These are interesting as reading material, but at this point none of them have been officially confirmed. GTA6 has not been released yet, and articles that assert details as if the writer had played the product are highly likely to be conjecture or fakes disguised as firsthand experience. They should not be treated as reliable information. What can be said for certain extends only this far: that the 2022 leaked footage showed the direction of dynamic heists and more natural police reactions, and that it was from early in development.

---

## Summary

- The details of GTA6's crime (heist) system are officially unannounced. The concrete picture being discussed is mainly based on the early development footage leaked in 2022 and its analysis.
- What the leaked footage showed is dynamic heists in which the development changes according to the situation. Behavior in which hostages flee or resist was suggested.
- The wanted level system may also be rebuilt. Elements such as police moving only once a report is made, and being able to surrender, have been reported.
- Multiple solutions carries a certain persuasiveness as a result of the dynamic system, but moral dilemmas that greatly branch the story have thin backing. Over-expecting is forbidden.
- Detailed assertions such as skill trees and detection abilities are unconfirmed. Be wary of articles that pretend to have already played.

The direction that GTA6's crime system looks set to be far freer and more tense than GTA5's can be glimpsed from the leaked footage. But for its concrete mechanics to be officially revealed, we will need to wait for future trailers and the release (November 19, 2026). The more provocative the headline, the more we want to receive the information while checking its source and certainty.

---

*Note: Within this article, the descriptions concerning the heist system, the behavior of the wanted level, and mission solutions and branching include speculation based on the early development footage that leaked in 2022 and on analysis by the community and media. This is information from during development and may differ from the specifications of the final product. It is not an official announcement by Rockstar Games. The main game's release date (November 19, 2026 / PS5 and Xbox Series X|S) is confirmed information based on official announcements.*`,
    fullContent: `# GTA6の「犯罪」はどう進化する？ 流出映像が示した強盗システムの正体と、注意したい誇張リーク

『Grand Theft Auto VI（GTA6）』をめぐって、ファンが特に期待を寄せているのが「犯罪（強盗）システム」の刷新だ。「複数の解法がある」「道徳的な選択を迫られる」といった刺激的な話も飛び交っている。ただ、こうした情報の多くは2022年に流出した開発初期の映像や、その後の分析に由来するもので、確定情報と未確認のリーク、そして誇張された憶測が入り混じっているのが実情だ。この記事では、何がどこまで確からしいのかを切り分けながら、GTA6の犯罪システムがどう進化しそうかを考察する。

---

## まず前提：「犯罪システム」の詳細は公式未発表

最初に断っておくと、Rockstarは強盗システムやミッション構造の詳細を公式には発表していない。トレーラーやスクリーンショットで世界観や一部の挙動は示されているが、「ミッションに複数の解法がある」「選択がストーリーを変える」といったゲームシステムの仕組みを、Rockstarが説明したわけではない。

いま語られている犯罪システムの具体像は、主に2022年9月に流出した開発初期のゲームプレイ映像と、その後にコミュニティや海外メディアが行った分析に基づく。流出映像はあくまで開発途中のものであり、最終製品にそのまま反映されている保証はない——この前提を踏まえて読み進めてほしい。

---

## 流出映像が示した「動的な強盗」

GTA5の強盗（ハイスト）は、銀行強盗のような大きな仕事のほとんどが、きっちり作り込まれたストーリーミッションに限られていた。プレイヤーが自由に計画して実行できる強盗は、ごく一部に過ぎなかった。

2022年の流出映像が示したのは、これが大きく変わる可能性だった。映像には、女性主人公（ルシアとされる）と相棒のジェイソンが、ダイナー（食堂）を襲う場面が映っていた。ここから読み取れた要素を整理すると、次のようになる。

- 主人公が店員に銃を向けて金を要求すると、店員が応じてカウンターに金を置く。
- 相棒のジェイソンが店内の客を見張り、プレイヤーがボタン操作で手動でその役割を担っているように見える。
- 店内の客（人質）には、それぞれ異なる行動の「ラベル」が割り振られているように見え、おとなしく従う者もいれば、逃げ出したり抵抗したりする者もいる可能性が示唆された。

つまり、決まりきった襲撃の繰り返しではなく、その場の状況に応じて展開が変わる「動的な強盗」が、シリーズで初めて本格的に導入されるのではないか、という見立てだ。これがGTA5からの最大の進化点として注目されている。

---

## 警察（手配度）システムの作り直し

犯罪システムの刷新と密接に関わるのが、手配度（Wanted Level）、つまり警察の反応の作り直しだ。

GTA5では、警官の視界内で犯罪を犯すと即座に手配度がつき、警察がすぐに駆けつけた。しかし、NPCが実際に通報するプロセスの再現は、あまりリアルとは言えなかった。流出映像やリークからは、GTA6ではこの仕組みがより自然で動的になる可能性が指摘されている。

たとえば、誰かが実際に通報するまで警察は動かず、通報されて初めてカウントダウンが始まる——といった挙動だ。これが事実なら、店員に電話を取らせない、人質を素早く制圧する、といった立ち回りが、逃走の成否を左右することになる。緊張感は格段に増すだろう。

また流出映像には、プレイヤーが警察に投降できることを示すような画面表示や、プレイヤーが先に致死的な手段を取らない限り、警察も致死的な対応をしてこない、という新しい手配度の考え方を示唆する要素もあったと報告されている。

---

## 「複数の解法」「道徳的ジレンマ」はどこまで本当か

元記事のタイトルにもあった「複数の解法」「道徳的に複雑な選択」という点は、ファンの期待が大きいテーマだ。ここは特に慎重に切り分けたい。

確かに、動的な強盗システムは、結果として「やり方の幅」を生む。人質を縛って黙らせるのか、力ずくで脅すのか、素早く逃げるのか——その場の判断で展開が変わるなら、それは広い意味での「複数の解法」と言える。前作RDR2が、相手への接し方（名誉システム）によって反応が変わる仕組みを持っていたことを踏まえると、GTA6がその思想を犯罪の文脈に持ち込む、という推測には一定の説得力がある。

ただし、「プレイヤーの選択がストーリー全体を大きく分岐させる」「重い道徳的ジレンマがメインに据えられる」といった踏み込んだ主張は、現時点で確たる裏づけがない。Rockstarの過去作は、選択肢のある分岐よりも、作り込まれた一本道の物語を得意としてきた。劇的な分岐システムを期待しすぎると、実際とのギャップに肩透かしを食う可能性がある。「やり方の自由度」と「物語の分岐」は別物として捉えておくのが冷静だ。

---

## 出回る「プレイ済みのような」詳細には注意

犯罪システムまわりでは、いかにも具体的な情報がネットに溢れている。固有のスキルツリー、RDR2の「デッドアイ」に似た索敵能力、盗品を質屋や闇市で現金化する仕組み、全国規模で連動する手配度——といった話だ。

これらは読み物としては面白いが、現時点ではいずれも公式に確認されていない。GTA6はまだ発売されておらず、製品をプレイしたかのように細部を断定する記事は、体験談を装った推測やフェイクである可能性が高い。確かな情報として扱うべきではない。確実に言えるのは、2022年の流出映像が「動的な強盗」と「より自然な警察の反応」の方向性を示したこと、そしてそれが開発初期のものである、という点までだ。

---

## まとめ

- GTA6の犯罪（強盗）システムの詳細は公式未発表。語られている具体像は、主に2022年流出の開発初期映像とその分析に基づく。
- 流出映像が示したのは、状況に応じて展開が変わる「動的な強盗」。人質が逃げたり抵抗したりする挙動が示唆された。
- 手配度システムも作り直される可能性。通報があって初めて警察が動く、投降できる、といった要素が報告されている。
- 「複数の解法」は動的システムの結果として一定の説得力があるが、「物語が大きく分岐する道徳的ジレンマ」は裏づけが薄い。期待のしすぎは禁物。
- スキルツリーや索敵能力などの細かな断定情報は未確認。プレイ済みを装う記事には注意したい。

GTA6の犯罪システムが、GTA5よりはるかに自由で緊張感のあるものになりそうだ、という方向性は、流出映像からもうかがえる。だが、その具体的な仕組みが公式に明らかになるのは、今後のトレーラーや発売（2026年11月19日）を待つ必要がある。刺激的な見出しの情報ほど、出どころと確度を確かめながら受け取りたい。

---

*※本記事のうち、強盗システム、手配度の挙動、ミッションの解法や分岐に関する記述は、2022年に流出した開発初期映像や、コミュニティ・メディアによる分析に基づく推測を含みます。これらは開発途中の情報であり、最終製品の仕様とは異なる可能性があります。Rockstar Gamesによる公式発表ではありません。本編発売日（2026年11月19日／PS5・Xbox Series X|S）は、公式発表に基づく確定情報です。*`,
  },
  {
    id: 8,
    title: "GTA6の声優はいつわかる？ Rockstarが名前を伏せる理由と過去作のパターン",
    description:
      "主人公2人を演じる声優は公式未発表。Rockstarが名前を伏せる理由と、過去作から読み解く「答え合わせ」のタイミングを考察する。",
    icon: "🎙️",
    image: "/images/news/seiyuhaituwakaru.webp",
    category: "speculation",
    date: "2026-06-14",
    source: "過去作の傾向に基づく考察",
    sourceUrl: "#",
    relatedArticles: [3, 1, 2],
    aiSummary: [
      "GTA6の主人公2人を演じる声優は、現時点でRockstarから公式発表されていない。",
      "Rockstarが伏せるのはネタバレ防止とマーケティング集中のための一貫した方針による。",
      "過去作では発売直前に判明しており、確実な答えは発売時のエンドクレジットで出る。",
    ],
    titleEn:
      "When Will We Know GTA6's Voice Cast? Why Rockstar Keeps the Names Hidden, and the Pattern From Past Titles",
    descriptionEn:
      "The voice actors playing the two protagonists have not been officially announced. We examine why Rockstar keeps the names hidden and, drawing on past titles, when the answer is likely to be revealed.",
    aiSummaryEn: [
      "The voice actors playing GTA6's two protagonists have not been officially announced by Rockstar at this point.",
      "Rockstar keeps them hidden as part of a consistent policy aimed at preventing spoilers and concentrating its marketing.",
      "In past titles the names came out just before release, and the definitive answer comes from the end credits at launch.",
    ],
    fullContentEn: `# When Will We Know GTA6's Voice Cast? Why Rockstar Keeps the Names Hidden, and the Pattern From Past Titles

With the release of Grand Theft Auto VI (GTA6) approaching on November 19, 2026, there is a question that keeps simmering among fans: just who is playing the protagonists, Jason and Lucia? Articles naming voice actors have been circulating online, but to put the conclusion first, Rockstar has not officially announced the voice actors or cast at this point. So why are they kept hidden? And when will they be revealed? We read the timing of the answer from the pattern of past titles.

---

## The Current Situation: No One Has Been Officially Announced as a Voice Actor

First, let us make the facts clear. Rockstar has officially revealed that GTA6's two protagonists are Jason Duval and Lucia Caminos. On the other hand, it has not disclosed at all, at this point, the names of the voice actors and motion-capture performers playing those two.

Information seen online such as Lucia is played by so-and-so or Jason is played by so-and-so is all based on fan analysis and speculation, drawn from things like the content of casting calls or comparisons of voices. None of it has been acknowledged by Rockstar or by the performers themselves. It should be kept in mind from the outset that this should not be treated as reliable information.

---

## Why Does Rockstar Keep the Voice Actors Hidden

Rockstar not revealing its cast until just before release is not a whim but a consistent policy. The reasons can be broadly organized into two.

One is thorough measures against information leaks. Rockstar is known for not telling even the actors it hires the details of which work they are appearing in. In fact, in recent years one veteran voice actor, while revealing that they had been cast in a new Rockstar title, was not even told which game their voice was for, and described the production process as secrecy itself. If it were known in advance who is playing what role, that would become a clue for guessing the story's characters and developments. Restricting cast information is also a breakwater against story spoilers.

The other is control of marketing. Rockstar is a company that thoroughly practices showing the real thing rather than telling it in words. Rather than releasing a cast list bit by bit, it takes a strategy of showing the world itself through trailers and screenshots, concentrating attention on a single point. The names of the voice actors are kept in reserve, within that larger flow, until the most effective timing.

---

## The Pattern From Past Titles: Names Come Out Just Before Release

So when will they be revealed? The most useful reference is the flow of announcements for the previous title, GTA5.

GTA5 was released on September 17, 2013. But the names of the actors who played the three protagonists (Michael, Franklin, and Trevor) — Ned Luke, Shawn Fonteno, and Steven Ogg — became widely known only when the release was fairly close at hand. Until then, their presence had barely surfaced publicly.

What is distinctive is that the actors Rockstar hired were not especially well known at the time. The first game and GTA2 had no dedicated voice actor credits; GTA III was the first to use film actors, and Vice City even used big names like Ray Liotta. From San Andreas onward, however, the company shifted toward a policy of holding back on hiring big-name actors, especially for leading roles. Hiring near-unknown but skilled performers is meant to give the characters a sense of real existence, and at the same time it has the advantage of making appearances harder to leak.

Taking this pattern into account, it is highly likely that the actors playing GTA6's protagonists will also be revealed as the release (November 19, 2026) draws near, through Rockstar's official character introductions or through the credits after launch.

---

## When Is the Answer Revealed — Three Milestones

Organizing the specific milestones where voice actor information is likely to surface, they are as follows.

- The timing when a third trailer or additional character introduction footage is released. If footage that delves into the core of the story comes out, performer information may be shown alongside it. However, Rockstar often does not put actor names front and center in its footage, so this is not certain.
- Media exposure just before release. As the release draws near, it is customary for the actors themselves to appear in interviews and at events and begin talking about their roles. For GTA5 too, the actors started stepping into the spotlight around the time of release.
- The end credits at launch. Ultimately, the most certain official answer comes from the credits of the game itself. This is where the entire cast is formally confirmed.

In other words, a realistic estimate is: at the earliest, a little before release, and for certain, at release itself. It is wise to keep one's distance from any names that come out before then, treating them strictly as unconfirmed speculation.

---

## A Separate Interest: Will the GTA5 Cast Return

Surrounding the voice actors, there is another topic fans are watching: whether the actors who played GTA5's protagonists might return to GTA6 in some form.

In fact, Ned Luke, who played Michael in GTA5, and Shawn Fonteno, who played Franklin, have been asked at past events about appearing in GTA6. While hinting at hopes for a return, they have responded to the effect that even if they had been cast, they could not reveal it due to an NDA (non-disclosure agreement). This too is an episode that speaks to Rockstar's thorough information management. Because GTA6 is said to depict an era after GTA5, voices hoping for the return of the old cast are persistent, but there is no confirmed information at this point.

---

## Summary

- GTA6's voice actors and cast have not been officially announced by Rockstar at this point. The names circulating are nothing more than fan speculation.
- Rockstar keeps them hidden as part of a consistent policy, both to prevent information leaks including spoilers and to concentrate its marketing on a single point.
- In the past title (GTA5), the actor names became widely known just before release. Hiring near-unknown but skilled performers serves both to prevent leaks and to create a sense of real existence.
- The official answer comes, at the earliest, with media exposure just before release, and for certain, with the end credits at launch.
- The return of the GTA5 cast is also a topic, but with the wall of the NDA, there is no confirmed information.

The answer to the question of who the voice actors are will be revealed at the timing Rockstar chooses, heading toward the release (November 19, 2026). Until then, while carefully keeping our distance from information that asserts names as fact, we want to quietly await the day of the answer.

---

*This article is an examination based on Rockstar Games' announcement tendencies in past titles and on publicly available information. Rockstar has made no official announcement regarding GTA6's voice actors or cast, and this article does not treat any specific person's name as confirmed information either. That the protagonists are Jason Duval and Lucia Caminos, and the main game's release date (November 19, 2026 / PS5 and Xbox Series X|S), are confirmed facts based on Rockstar's official announcements.*`,
    fullContent: `# GTA6の声優はいつわかる？ Rockstarが名前を伏せる理由と過去作のパターン

『Grand Theft Auto VI（GTA6）』の発売が2026年11月19日に迫るなか、ファンの間でくすぶり続けている疑問がある。「主人公ジェイソンとルシアを演じているのは、いったい誰なのか」だ。ネット上には声優の名前を挙げる記事も出回っているが、結論から言えば、現時点でRockstarは声優・出演者を公式に発表していない。では、なぜ伏せるのか。そして、いつ明らかになるのか。過去作のパターンから、その「答え合わせのタイミング」を読み解く。

---

## 現状：声優は「公式には」誰も発表されていない

まず事実関係をはっきりさせておきたい。Rockstarは、GTA6の主人公2人がジェイソン・デュバルとルシア・カミノスであることは公式に明かしている。一方で、その2人を演じる声優・モーションキャプチャー俳優の名前は、現時点で一切公表していない。

ネットで見かける「ルシア役は◯◯」「ジェイソン役は◯◯」といった情報は、いずれもキャスティングコールの内容や声の比較といった、ファンによる分析・推測に基づくものだ。Rockstarやその俳優本人が認めたものではない。確かな情報として扱うべきではない、という点はあらかじめ押さえておきたい。

---

## なぜRockstarは声優を伏せるのか

Rockstarが出演者を発売直前まで明かさないのは、気まぐれではなく、一貫した方針だ。理由は大きく2つに整理できる。

ひとつは、徹底した情報漏洩（リーク）対策だ。Rockstarは、起用した俳優にすら、自分がどの作品に出ているのかを詳しく伝えないことで知られる。実際、近年あるベテラン声優は、Rockstarの新作に起用されたと明かしつつ、自分の声がどのゲームのためのものかすら知らされておらず、その制作プロセスを「秘密主義そのもの」と評した。誰が何の役を演じているかが事前に分かれば、それは物語の登場人物や展開を推測する手がかりになる。出演者情報を絞ることは、ストーリーのネタバレを防ぐ防波堤でもある。

もうひとつは、マーケティングのコントロールだ。Rockstarは「言葉で語るより、実物で見せる」ことを徹底する会社だ。キャストリストを小出しにするより、トレーラーやスクリーンショットで世界観そのものを見せ、注目を一点に集める戦略を取る。声優の名前は、その大きな流れのなかで、最も効果的なタイミングまで温存される。

---

## 過去作のパターン：名前が出るのは「発売の直前」

では、いつ明らかになるのか。最も参考になるのが、前作GTA5での発表の流れだ。

GTA5は2013年9月17日に発売された。だが、3人の主人公（マイケル、フランクリン、トレバー）を演じた俳優——ネッド・ルーク、ショーン・フォンテーノ、スティーヴン・オッグ——の名前が広く知られるようになったのは、発売がかなり間近に迫ってからだった。それまで彼らの存在は、ほとんど表に出ていなかった。

特徴的なのは、Rockstarが起用したのが当時さほど知名度の高くない俳優たちだった点だ。初代やGTA2には専属の声優クレジットがなく、GTA IIIで初めて映画俳優を起用、バイスシティではレイ・リオッタのような大物も使った。しかしサンアンドレアス以降、特に主役級では大物俳優の起用を抑える方針へと転換していった。無名に近い実力派を起用するのは、キャラクターに「実在感」を持たせるためであり、同時に、出演がリークされにくいという利点もある。

このパターンを踏まえると、GTA6の主人公を演じる俳優も、発売（2026年11月19日）が近づいた段階で、Rockstar公式のキャラクター紹介や、発売後のクレジットを通じて明らかになる可能性が高い。

---

## 「答え合わせ」はいつか——3つの節目

具体的に、声優情報が表に出てきそうな節目を整理すると、次のようになる。

- 第3弾トレーラーや、追加のキャラクター紹介映像が公開されるタイミング。物語の核心に踏み込む映像が出れば、それに合わせて演者情報が示される可能性がある。ただしRockstarは映像で俳優名を前面に出さないことも多く、確実ではない。
- 発売直前のメディア露出。発売が目前に迫ると、俳優本人がインタビューやイベントに登場し、役を語り始めるのが通例だ。GTA5でも、発売前後から俳優たちが表舞台に立つようになった。
- 発売時のエンドクレジット。最終的に、最も確実な「公式の答え」が出るのは、ゲームそのもののクレジットだ。ここで全キャストが正式に判明する。

つまり、最短でも発売の少し前、確実なところでは発売そのもの、というのが現実的な見立てになる。それまでに流れてくる名前は、あくまで未確認の推測として距離を置いて受け取るのが賢明だ。

---

## GTA5キャストは再登場するのか、という別の関心

声優をめぐっては、もうひとつファンが気にしている話題がある。GTA5の主人公を演じた俳優たちが、GTA6に何らかの形で再登場するのではないか、というものだ。

実際、GTA5でマイケルを演じたネッド・ルークとフランクリン役のショーン・フォンテーノは、過去のイベントでGTA6への出演について問われたことがある。彼らは復帰への期待をにじませつつも、仮に起用されていたとしても、NDA（秘密保持契約）によってそれを明かすことはできない、という趣旨の応答をしている。これもまた、Rockstarの徹底した情報管理を物語るエピソードだ。GTA6はGTA5の後の時代を描くとされるため、旧キャストの登場を期待する声は根強いが、現時点で確定した情報はない。

---

## まとめ

- GTA6の声優・出演者は、現時点でRockstarから公式発表されていない。出回っている名前はファンの推測にすぎない。
- Rockstarが伏せるのは、ネタバレを含む情報漏洩を防ぐためと、マーケティングを一点に集中させるための、一貫した方針による。
- 過去作（GTA5）では、俳優名が広く知られたのは発売直前だった。無名に近い実力派の起用も、リーク防止と実在感の演出を兼ねている。
- 公式の「答え合わせ」が出るのは、早くて発売直前のメディア露出、確実なのは発売時のエンドクレジット。
- GTA5キャストの再登場も話題だが、NDAの壁もあり、確定情報はない。

声優が誰なのかという問いの答えは、発売（2026年11月19日）に向けて、Rockstarが選んだタイミングで明らかになる。それまでは、名前を断定する情報とは慎重に距離を取りながら、静かに「答え合わせ」の日を待ちたい。

---

*※本記事は、Rockstar Gamesの過去作における発表傾向や公開情報に基づく考察です。GTA6の声優・出演者についてRockstarは公式発表をしておらず、本記事も特定の人物名を確定情報として扱っていません。主人公がジェイソン・デュバルとルシア・カミノスであること、本編発売日（2026年11月19日／PS5・Xbox Series X|S）は、Rockstarの公式発表に基づく確定情報です。*`,
  },
  {
    id: 9,
    title: "GTA6のキャラクターはどこまで作り込まれる？ 服・アクセサリー、そして「筋トレでムキムキ」の噂",
    description:
      "肌・髪・服の実在感、現代的アクセサリー、そして体型変化システム復活の噂。確定と推測を分けてキャラの作り込みを考察する。",
    icon: "🎨",
    image: "/images/news/characterhadokomadetukurikomarerunoka.webp",
    category: "speculation",
    date: "2026-06-11",
    source: "トレーラー分析・過去作の実績に基づく考察",
    sourceUrl: "#",
    relatedArticles: [5, 3, 1],
    aiSummary: [
      "GTA6のキャラクターカスタマイズの全容は公式未発表で、確定要素はトレーラー由来である。",
      "肌・髪・表情のリアルさや服の物理、豊富な衣装バリエーションがトレーラーで確認できる。",
      "筋トレで体型が変わるシステムの復活が噂されるが、これは未確認の推測にとどまる。",
    ],
    titleEn:
      "How Detailed Will GTA6's Characters Be? Clothing, Accessories, and the Rumor of Getting Buff From Working Out",
    descriptionEn:
      "The realism of skin, hair, and clothing, modern accessories, and the rumored return of a physique-change system. We sort the confirmed facts from the speculation as we examine how detailed the characters are.",
    aiSummaryEn: [
      "The full scope of GTA6's character customization has not been officially announced, and the confirmed elements come from the trailers.",
      "The realism of skin, hair, and facial expressions, cloth physics, and a rich variety of outfits can all be seen in the trailers.",
      "A system in which working out changes your physique is rumored to return, but this remains unconfirmed speculation.",
    ],
    fullContentEn: `# How Detailed Will GTA6's Characters Be? Clothing, Accessories, and the Rumor of Getting Buff From Working Out

Many people who watched the trailers for Grand Theft Auto VI (GTA6) must have felt that the characters look strikingly realistic. The texture of the skin, the movement of the hair, the wrinkles in the clothing — the level of detail is on another level compared to the previous title, GTA5. On top of that, rumors about customization are heating up among fans, such as the freedom of dressing up and accessories, and the idea that working out changes the character. This article examines how detailed GTA6's characters are likely to be, while separating the facts that can be confirmed in the trailers from unverified leaks and rumors.

Note: Topics about technology such as map size and ray tracing are covered in separate articles. This piece focuses solely on the appearance and customization of the characters.

---

## First, the Premise: The Full Scope of Customization Has Not Been Officially Announced

Let us start by making clear that Rockstar has not officially detailed the mechanics of character customization. There are elements that can be read from the trailers and screenshots, but the full scope of the system (how freely things can be changed) has not been revealed.

The content covered here is based on analysis of the trailers, the early development footage leaked in 2022, and the track record of past titles and fan speculation. We will go through it while clearly separating confirmed information from speculation.

---

## The Evolution Visible in the Trailers: The Realism of Skin, Hair, and Clothing

First, let us start with the evolution that can be read relatively clearly from the trailers and screenshots.

The models of GTA6's protagonists Jason and Lucia have clearly become more realistic compared to GTA5's relatively flat models. Even fine changes in expression during tense scenes (micro-expressions) have been crafted in, and the texture of the skin and hair has risen a notch as well. As for the hair, it has been confirmed to sway dynamically in response to the character's movement and the environment, making it a more advanced expression than in past GTA titles.

The way clothing is rendered is also a highlight. It is not merely that there are many types; the physics behavior stands out. Clothing naturally forms wrinkles in line with the body's movement, and fine touches such as rolled-up sleeves or a cap brim turned backward can be seen. In the trailers and screenshots, Jason and Lucia appear in different outfits in nearly every cut, and the variation of those combinations gives the impression of surpassing past GTA protagonists. According to one fan's tally, the second trailer alone confirmed around 29 outfits for Jason and around 26 for Lucia. This suggests a system that lets you freely combine a large number of clothing items (mix and match).

---

## Modern Accessories, and Jason's Tattoos

It is not just clothing — modern realism also resides in the accessories.

As an element that GTA5 lacked, characters have been confirmed wearing wireless earbuds or a smartwatch while relaxing or exercising. It is a detail unique to a work set in the present day. Moreover, these accessories are said to be given physics behavior, crafted so that the worn items look like a natural part of the outfit. There are also observations that the same physics applies to the accessories of NPCs, not just the protagonists.

In addition, multiple tattoos have been confirmed on Jason's body, and these are believed to be tied to his background in the military. His appearance also takes on the role of conveying the character's backstory.

As with past titles (GTA Online and RDR2), there is also hope for a system that lets you save multiple custom outfits and switch between them depending on the situation, but at this point this does not go beyond speculation.

---

## The Main Rumor: Will the Physique-Change System Where Working Out Makes You Buff Return?

In the area of customization, what fans are most excited about right now is the character's physique-change system.

The origin traces back to 2004's GTA San Andreas. In that game, not only protagonist CJ's hairstyle and clothing but his very physique changed depending on how much he exercised and what he ate. Going to the gym built muscle, while eating only fast food made him fat — that was the system. This level of in-depth physique crafting was no longer seen in the GTA titles that followed.

The rumor that this San Andreas-style physique change will return in GTA6 is persistent. In fan analyses compiling leaks, patents, and leaked information, there are claims that, in addition to Jason and Lucia's degree of tan and their hairstyles, you can change the physique from slim to buff. In fact, when comparing the leaked footage and the trailers, there are observations that Jason, who was slim in the early leaks, looks more muscular in the trailers, and this has drawn attention as circumstantial evidence of a physique-change system.

That said, it is worth viewing this calmly. The physique-change system where working out makes you buff is not something Rockstar has officially acknowledged at this point; it is strictly at the rumor and speculation stage. The fact that there is a precedent in San Andreas, and that GTA6 is realism-oriented overall, leads people to call it likely, but it is not confirmed information. Similarly, many fine details are circulating, such as hair and beards growing (a mechanic that existed in RDR2), being able to change your nails, and sweating, but these too are unconfirmed. It would be wise to keep your hopes up while avoiding firm assertions.

---

## Beware of Articles That Assert as if They Had Already Played It

Character customization is a field where fan demand is especially strong (there have long been many voices asking for more clothing and accessories). For that very reason, the internet is flooded with specific information that stokes expectations.

Such talk includes: that sweating makes you easier for NPCs to spot, that your muscle condition affects combat efficiency, that you can layer a necklace inside or outside a T-shirt, and that nail salons exist. While such descriptions are fun to read, none of them have been officially confirmed. GTA6 has not been released yet, and articles that assert details as if they had played the product are likely to be speculation disguised as firsthand experience. What is certain extends only as far as the abundance and physics behavior of the clothing and accessories visible in the trailers, and the fact that the same kinds of mechanics existed in past titles (San Andreas and RDR2).

---

## Summary

- The full scope of GTA6's character customization has not been officially announced. The confirmed elements come from the trailers; everything else is speculation.
- The evolution that can be confirmed is the realism of skin, hair, and facial expressions, cloth physics (wrinkles, rolled-up sleeves), and a rich variety of clothing (around 29 outfits for Jason and around 26 for Lucia in Trailer 2).
- Modern accessories such as earbuds and smartwatches appear, and they are given physics behavior. Jason's tattoos are tied to his backstory.
- The physique-change system where working out makes you buff is rumored as a revival of San Andreas, but it is unconfirmed. Hair and beard growth, nails, and sweat are likewise at the rumor stage.
- Because it is a field with strong expectations, there are many articles making firm assertions. Be wary of information that pretends to be from someone who has already played.

The direction in which GTA6's characters look set to evolve greatly from past titles, in both the detail of their appearance and the freedom of customization, can be amply glimpsed from the trailers. Whether an in-depth system like physique change will truly return should become clear in future trailers or at release (November 19, 2026). The more exciting a rumor is, the more we want to receive it while checking its source and reliability.

---

*Note: Among the descriptions in this article, those concerning the physique-change system, hair and beard growth, fine details such as nails and sweat, and outfit saving include speculation based on the track record of past titles, the footage leaked in 2022, and community analysis. They are not official announcements by Rockstar Games. The variation and physics behavior of clothing and accessories that can be confirmed in the trailers, and the main release date (November 19, 2026 / PS5, Xbox Series X|S), are based on official materials and official announcements.*`,
    fullContent: `# GTA6のキャラクターはどこまで作り込まれる？ 服・アクセサリー、そして「筋トレでムキムキ」の噂

『Grand Theft Auto VI（GTA6）』のトレーラーを見て、登場人物の見た目が「やけにリアルだ」と感じた人は多いはずだ。肌の質感、髪の動き、服のしわ——細部の作り込みが、前作GTA5とは段違いになっている。さらにファンの間では、着せ替えやアクセサリーの自由度、そして「筋トレをするとキャラが変化する」といったカスタマイズの噂も盛り上がっている。この記事では、トレーラーで確認できる事実と、未確認のリーク・噂を切り分けながら、GTA6のキャラクターがどこまで作り込まれそうかを考察する。

※マップの広さやレイトレーシングといった技術の話は別記事で扱っている。本記事は「キャラクターの見た目とカスタマイズ」に絞る。

---

## まず前提：カスタマイズの全容は公式未発表

最初に断っておくと、Rockstarはキャラクターカスタマイズの仕組みを公式には詳しく発表していない。トレーラーやスクリーンショットから読み取れる要素はあるが、システムとしての全容（どこまで自由に変えられるのか）は明かされていない。

ここで扱う内容は、トレーラーの分析と、2022年に流出した開発初期映像、そして過去作の実績やファンの考察に基づく。確定情報と推測をはっきり分けながら見ていく。

---

## トレーラーで見える進化：肌・髪・服の「実在感」

まず、トレーラーやスクリーンショットから比較的はっきり読み取れる進化から。

GTA6の主人公ジェイソンとルシアのモデルは、GTA5の比較的「のっぺり」したモデルと比べ、明確にリアルさが増している。緊張した場面での細かな表情の変化（マイクロ表情）まで作り込まれており、肌や髪の質感も一段上がっている。髪については、キャラクターの動きや環境に合わせて動的に揺れる様子が確認されており、過去のGTAより踏み込んだ表現になっている。

服の表現も見どころだ。単に種類が多いだけでなく、物理挙動が際立っている。服は体の動きに合わせて自然にしわを作り、袖をまくったり、キャップのつばを後ろに回したりといった細かな着こなしも見られる。トレーラーやスクリーンショットでは、ジェイソンとルシアがほぼ毎カット違う服装で登場しており、その組み合わせのバリエーションは、過去のGTA主人公を上回る印象だ。あるファンの集計では、第2弾トレーラーだけでジェイソンは約29通り、ルシアは約26通りの服装が確認されたという。これは、多数の服アイテムを自由に組み合わせられる（ミックス&マッチ）仕組みを示唆している。

---

## 現代的なアクセサリーと、ジェイソンのタトゥー

服だけでなく、アクセサリー類にも現代的なリアリティが宿っている。

GTA5にはなかった要素として、くつろいだり運動したりする際のワイヤレスイヤホンや、スマートウォッチを身につけた姿が確認されている。現代を舞台にした作品ならではのディテールだ。しかも、こうしたアクセサリーには物理的な挙動が与えられているとされ、装着物が衣装の自然な一部として見えるよう作り込まれている。主人公だけでなくNPCのアクセサリーにも同様の物理が働いているという指摘もある。

また、ジェイソンの体には複数のタトゥーが確認されており、これは彼の軍隊時代の経歴と結びついていると見られている。見た目が、キャラクターの背景設定を語る役割も担っている形だ。

過去作（GTA OnlineやRDR2）と同様に、複数のカスタム衣装を保存しておき、場面に応じて切り替えられる仕組みも期待されているが、これは現時点では推測の域を出ない。

---

## 噂の本命：「筋トレでムキムキ」体型変化システムは復活するか

カスタマイズまわりで、いまファンが最も盛り上がっているのが、キャラクターの体型変化システムだ。

元ネタは2004年の『GTA サンアンドレアス』にさかのぼる。同作では、主人公CJの髪型や服だけでなく、運動量や食事の内容によって体型そのものが変化した。ジムに通えば筋肉がつき、ファストフードばかり食べれば太る——というシステムだ。これほど踏み込んだ体型の作り込みは、その後のGTAでは見られなくなっていた。

GTA6では、このサンアンドレアス的な体型変化が復活するのではないか、という噂が根強い。リークやパテント（特許）、流出情報をまとめたファンの考察では、ジェイソンとルシアの日焼け具合・髪型に加えて、痩せ型からムキムキまで体型を変えられる、という主張が語られている。実際、流出映像やトレーラーを比較すると、初期のリークでは痩せ型だったジェイソンが、トレーラーではより筋肉質に見える、という指摘もあり、これが体型変化システムの傍証として注目されている。

ただし、ここは冷静に見ておきたい。「筋トレでムキムキになる」体型変化システムは、現時点でRockstarが公式に認めたものではなく、あくまで噂・推測の段階だ。サンアンドレアスに前例があること、GTA6が全体にリアル志向であることから「ありそう」と語られてはいるが、確定情報ではない。同様に、髪やヒゲが伸びる（RDR2にあった仕組み）、ネイルを変えられる、汗をかく、といった細部の話も多く出回っているが、これらも未確認だ。期待しつつ、断定は避けておくのが賢明だろう。

---

## 「プレイ済みのような」断定記事には注意

キャラクターカスタマイズは、ファンの要望が特に強い分野だ（「もっと服やアクセサリーを増やしてほしい」という声は以前から多い）。それだけに、期待を煽る具体的な「情報」もネットに溢れている。

汗をかくとNPCに見つかりやすくなる、筋肉の状態が戦闘効率に影響する、ネックレスをTシャツの内側・外側に重ねられる、ネイルサロンが存在する——といった話だ。こうした記述は読み物としては楽しいが、いずれも公式に確認されたものではない。GTA6はまだ発売されておらず、製品をプレイしたかのように細部を断定する記事は、体験談を装った推測である可能性が高い。確実なのは、トレーラーで見える服やアクセサリーの豊富さ・物理挙動、そして過去作（サンアンドレアスやRDR2）に同種の仕組みがあった、という事実までだ。

---

## まとめ

- GTA6のキャラクターカスタマイズの全容は公式未発表。確定要素はトレーラー由来、それ以外は推測。
- 確認できる進化は、肌・髪・表情のリアルさ、服の物理（しわ・袖まくり）、豊富な服のバリエーション（トレーラー2でジェイソン約29・ルシア約26通り）。
- イヤホンやスマートウォッチなど現代的アクセサリーが登場し、物理挙動も与えられている。ジェイソンのタトゥーは経歴と結びつく。
- 「筋トレでムキムキ」になる体型変化システムは、サンアンドレアスの復活として噂されるが未確認。髪・ヒゲ伸び、ネイル、汗なども同様に噂段階。
- 期待の強い分野ゆえに断定記事も多い。プレイ済みを装う情報には注意したい。

GTA6のキャラクターが、見た目の作り込みもカスタマイズの自由度も、過去作から大きく進化しそうだという方向性は、トレーラーからも十分にうかがえる。体型変化のような踏み込んだシステムが本当に復活するのかは、今後のトレーラーや発売（2026年11月19日）で明らかになるはずだ。刺激的な噂ほど、出どころと確度を確かめながら受け取りたい。

---

*※本記事のうち、体型変化システム、髪・ヒゲの成長、ネイルや汗などの細部、衣装保存などに関する記述は、過去作の実績・2022年流出映像・コミュニティの考察に基づく推測を含みます。Rockstar Gamesによる公式発表ではありません。トレーラーで確認できる服・アクセサリーのバリエーションや物理挙動、本編発売日（2026年11月19日／PS5・Xbox Series X|S）は、公式素材・公式発表に基づきます。*`,
  },
  {
    id: 11,
    title: "GTA6のPC版システム要件「リーク」は本物か？出回る推定スペックの実態と注意点",
    description:
      "RTX 4070以上、RAM 32GB——出回る推定スペックは本物のリークなのか。PC版未発表という前提から実態と注意点を整理する。",
    icon: "💻",
    image: "/images/news/pcbansystemyoukenleakhahonmonoka.webp",
    category: "speculation",
    date: "2026-06-22",
    source: "ハードウェア解析筋の予測に基づく考察",
    sourceUrl: "#",
    relatedArticles: [5, 2, 12],
    aiSummary: [
      "GTA6のPC版は2026年6月時点で公式未発表で、システム要件の公式スペック表も存在しない。",
      "出回る要件はコンソール性能や過去作から逆算した予測にすぎず、情報源で数字がばらつく。",
      "PC版の登場は早くて2027年後半とされ、今このゲームのためにPCを新調するのは時期尚早である。",
    ],
    titleEn:
      "Are the GTA6 PC System Requirement Leaks Real? The Truth About the Circulating Estimated Specs and What to Watch For",
    descriptionEn:
      "RTX 4070 or higher, 32GB of RAM — are the circulating estimated specs genuine leaks? Starting from the premise that no PC version has been announced, we sort out the facts and the caveats.",
    aiSummaryEn: [
      "As of June 2026, the PC version of GTA6 has not been officially announced, and no official system requirement spec sheet exists.",
      "The circulating requirements are merely predictions reverse-engineered from console performance and past titles, and the numbers vary by source.",
      "The PC version is said to arrive in late 2027 at the earliest, so it is premature to upgrade your PC for this game right now.",
    ],
    fullContentEn: `# Are the GTA6 PC System Requirement Leaks Real? The Truth About the Circulating Estimated Specs and What to Watch For

Information claiming that the GTA6 PC version system requirements have been leaked spreads regularly. Many people have probably seen a table lined with specific figures such as RTX 4070 or higher, equivalent to a Core i7-12700, and 32GB of RAM.

However, when GTA6 FEED checked information from various sources, these are not, strictly speaking, leaks. As of June 2026, the PC version of GTA6 has not even been officially announced, and naturally no official system requirement spec sheet exists either. The true nature of the circulating numbers is predictions by the community and hardware analysts, reverse-engineered from the console hardware configuration and past Rockstar titles. This article clearly separates the confirmed facts from the parts that are merely speculation.

This article is based on information as of June 22, 2026.

---

## The Major Premise: The PC Version of GTA6 Has Not Yet Been Announced (Confirmed Fact)

Let us start with the most important fact.

- Rockstar Games has officially announced GTA6 only for the PlayStation 5 and Xbox Series X|S. The release date is November 19, 2026.
- The existence of a PC version, the timing of a PC version, and the system requirements of a PC version — none of these have been officially announced.
- With the past title (GTA V), the PC version appeared about 18 months after the console release. Based on this precedent, there is a prediction that the GTA6 PC version will likewise come 12 to 18 months after the console release, that is, around late 2027 to 2028. However, this too is merely speculation based on precedent, and Rockstar has guaranteed nothing.

In other words, as long as the PC version itself is unannounced, a genuine system requirement leak for the PC version cannot exist in principle. The notion of Rockstar leaking the official operating requirements for something whose release and timing are not even decided simply does not hold together.

---

## What the Estimated Specs Called Leaks Actually Contain

The estimated values actually circulating are roughly as follows. These are merely one example of the observed numbers and are not official.

**Recommended specs (one example of an estimate):**

- GPU: NVIDIA RTX 4070 or higher
- CPU: Equivalent to Intel Core i7-12700 or higher
- RAM: 32GB
- Storage: 150GB or more of SSD

**Minimum specs (one example of an estimate):**

- GPU: Equivalent to NVIDIA RTX 3070
- CPU: Equivalent to Intel Core i7-10700
- RAM: 16GB
- Storage: 150GB or more of SSD

What should be noted here is that these numbers vary considerably depending on the source. For example, some prediction sites estimate the minimum GPU as equivalent to an older GTX 1660 or RTX 2060, while others put the minimum CPU at the Core i5 generation. RAM also ranges from 12GB to 16GB. The very fact that different sources put out different numbers while labeling them minimum and recommended shows that these are not a finalized spec sheet but each source's own prediction. About all they have in common is the broad estimate that an SSD of around 150GB will be required, and that too is calculated from the storage size of past titles.

---

## Why the Estimates Resemble Each Other to Some Degree

Although the numbers have a range, there is a reason why each prediction agrees in the direction that a high-performance PC will be required. The points GTA6 FEED has sorted out are as follows.

First, the performance of the consoles that serve as the development baseline is known. The PS5 and Xbox Series X are built on AMD's Zen 2 generation CPU and RDNA 2 generation GPU. Because the PC version is expected to be optimized with this performance as the baseline, analysts predict the requirements by reverse-engineering from PC parts of equivalent or higher performance. This is why each prediction tends to converge on a similar landing point.

Second, the characteristics of the new-generation engine said to power GTA6 (the latest version of RAGE) are expected to put a load on specific components. The load factors inferred from the trailers and past titles are as follows.

- High-density crowd and vehicle simulation: large numbers of NPCs and vehicles, each with individual behavior, exist on screen at the same time. This mainly hits the CPU as load.
- Real-time global illumination: the representation of light reflecting off wet road surfaces and car bodies consumes a great deal of GPU.
- Complex water and physics simulation: the ocean representation of the bay area is thought to be heavy to process.
- Asset streaming: because the world is loaded sequentially as you move, a fast SSD becomes effectively mandatory. An HDD is predicted to be unable to keep up with the loading.

Third, there is precedent. The PC version of Red Dead Redemption 2 is known for placing a heavy load even on the high-end PCs of its time. Rockstar tends to push the limits of performance, and many expect the same to be true of GTA6.

These are all reasonable speculation, but the fact that they are speculation does not change.

---

## Be Especially Careful With Leaked Images

Regarding system requirements, images such as a photographed leaked specifications screen sometimes circulate as well. Such images call for particular caution.

To begin with, as long as Rockstar has not announced a PC version, there is no premise for PC requirements to be properly leaked from the inside. In addition, it has been pointed out that this kind of image is often posted from anonymous accounts with only a handful of followers, and fabricating the image itself is not technically difficult. On overseas forums as well, there are voices saying that the reliability of the source is low and the authenticity is unknown.

Articles and pages with headlines like GTA6 system requirements leak proliferate in great numbers, aiming to ride a wave of high attention. The more an item lists specific model numbers in a definitive manner, the safer it is — unless the source is official — to keep your distance and read it as speculation rather than taking it at face value.

---

## Should You Replace Your PC for This Game Right Now

The practical conclusion is clear. At this point, it is premature to build or replace a PC for the sake of GTA6.

There are two reasons. One is that no official system requirements exist yet, so there is no settled standard on which to base your choice. The other is that the PC version is said to arrive in late 2027 at the earliest. By that time, the price situation for GPUs and RAM will have changed, and newer-generation parts will likely have joined the options. Even if you assemble expensive parts now, they could end up overpriced and outdated by the time of release.

A PC that can comfortably run recent AAA titles at medium settings (an 8-core class CPU, a GPU with 8GB or more of VRAM, 16GB or more of RAM, and an SSD) will still serve as a certain rough guide by the time the PC version arrives. That said, the prudent course is to make your final decision after Rockstar releases an official spec sheet.

---

## Summary: Separating the Confirmed From the Unconfirmed

What is confirmed at this point is the single fact that GTA6 will be released for the PS5 and Xbox Series X|S on November 19, 2026. The existence, release timing, and system requirements of a PC version have none of them been officially announced.

The PC requirements that the public calls leaks are in reality predictions assembled from console performance, the characteristics of the engine, and the tendencies of past titles, and the numbers differ depending on the source. They are reasonable estimates, but they are not confirmed information.

GTA6 is an unreleased title, and the PC version in particular is at a stage before any announcement. We should continue to be wary of information that declares the system requirements to be confirmed. As soon as an official spec sheet is released, we will update the contents of this article.

---

> Note: This article is based on information as of June 22, 2026. Confirmed matters follow Rockstar Games' official announcements. The PC version of GTA6 is officially unannounced as of the time of writing, and all system requirements in the text are unconfirmed estimates by third parties. The content will be updated after an official announcement.`,
    fullContent: `# GTA6のPC版システム要件「リーク」は本物か？出回る推定スペックの実態と注意点

「GTA6のPC版システム要件がリークされた」という情報が定期的に拡散している。RTX 4070以上、Core i7-12700相当、RAM 32GB——といった具体的な数字が並ぶ表を見たことがある人も多いだろう。

しかしGTA6 FEEDが各所の情報を確認したところ、これらは厳密には「リーク」ではない。2026年6月時点でPC版GTA6は公式に発表すらされておらず、当然ながらシステム要件の公式スペック表も存在しない。出回っている数字の正体は、コンソールのハードウェア構成や過去のRockstar作品から逆算したコミュニティ・ハードウェア解析筋の「予測」である。本記事は、確定している事実と、推測にすぎない部分をはっきり切り分けて整理する。

本記事は2026年6月22日時点の情報にもとづく。

---

## 大前提：PC版GTA6はまだ発表されていない（確定事実）

最も重要な事実から確認する。

- Rockstar GamesはGTA6をPlayStation 5とXbox Series X|S向けにのみ正式発表している。発売日は2026年11月19日。
- PC版の存在、PC版の発売時期、PC版のシステム要件——これらはいずれも公式に発表されていない。
- 過去作（GTA V）ではコンソール発売の約18か月後にPC版が登場した。この前例から、GTA6のPC版もコンソール発売の12〜18か月後、すなわち2027年後半から2028年頃になるとの予想がある。ただしこれもあくまで前例にもとづく推測で、Rockstarは何も確約していない。

つまり、PC版そのものが未発表である以上、「PC版の本物のシステム要件リーク」は原理的に存在し得ない。発売も時期も決まっていないものの正式な動作環境を、Rockstarが先に外部へ漏らすという構図は成立しないからだ。

---

## 「リーク」とされる推定スペックの中身

実際に出回っている推定値は、おおむね次のような内容である。これはあくまで観測されている数字の一例であり、公式のものではない。

**推奨スペック（推定の一例）:**

- GPU: NVIDIA RTX 4070以上
- CPU: Intel Core i7-12700 相当以上
- RAM: 32GB
- ストレージ: 150GB以上のSSD

**最小スペック（推定の一例）:**

- GPU: NVIDIA RTX 3070相当
- CPU: Intel Core i7-10700相当
- RAM: 16GB
- ストレージ: 150GB以上のSSD

ここで注意したいのは、こうした数字は情報源によってかなりばらつくという点だ。たとえば最小GPUを古いGTX 1660やRTX 2060相当と見積もる予測サイトもあれば、最小CPUをCore i5世代とするものもある。RAMも12GBから16GBまで幅がある。各所が「最小」「推奨」と銘打ちながら別々の数字を出している時点で、これらが確定したスペック表ではなく、それぞれの予測にすぎないことが分かる。共通しているのは「150GB前後のSSDが必要になる」という大枠の見立て程度で、これも過去作の容量からの推算である。

---

## なぜ推定値はある程度似通うのか

数字に幅があるとはいえ、各予測が「高性能PCが必要になる」という方向で一致しているのには理由がある。GTA6 FEEDが整理したポイントは次の通り。

第一に、開発の基準となるコンソールの性能が分かっている。PS5とXbox Series Xは、AMDのZen 2世代CPUとRDNA 2世代GPUを土台にしている。PC版はこの性能を基準に最適化されると見られるため、解析筋は同等以上のPCパーツから逆算して要件を予測している。各予測が似た着地点に収束しやすいのはこのためだ。

第二に、GTA6が搭載するとされる新世代エンジン（RAGEの最新版）の特徴が、特定の部品に負荷をかけると予想されている。トレーラーや過去作から推測される負荷要因は次のようなものだ。

- 高密度な群衆・車両シミュレーション：画面内に大量のNPCや車両、個別の挙動が同時に存在する。これは主にCPUへの負荷として効いてくる。
- リアルタイムのグローバルイルミネーション：濡れた路面や車体に反射する光の表現は、GPUを大きく消費する。
- 複雑な水面・物理演算：ベイエリアの海洋表現は処理が重いと見られている。
- アセットストリーミング：移動に合わせて世界を逐次読み込む方式のため、高速なSSDが事実上必須になる。HDDでは読み込みが追いつかないと予想される。

第三に、前例がある。レッド・デッド・リデンプション2のPC版は、登場当時のハイエンドPCにも厳しい負荷をかけたことで知られる。Rockstarは性能の限界を攻める傾向があり、GTA6でも同様になると見る向きが多い。

これらはいずれも「妥当な推測」ではあるが、推測である点は変わらない。

---

## 「リーク画像」には特に注意

システム要件をめぐっては、画面撮影された「リークされた仕様画面」のような画像も出回ることがある。こうした画像には特に注意が必要だ。

そもそもRockstarがPC版を発表していない以上、内部からPC要件が正規に漏れる前提が存在しない。加えて、この種の画像はフォロワーが数人しかいないような匿名アカウントから投稿されるケースが指摘されており、画像自体の捏造も技術的に難しくない。海外のフォーラムでも、出所の信頼性が低く真偽不明とする声が見られる。

「GTA6 システム要件 リーク」といった見出しの記事やページは、注目度の高さを狙って数多く乱立している。具体的な型番を断定的に並べているものほど、出所が公式でない限りは鵜呑みにせず、推測として距離を置いて読むのが安全だ。

---

## 今、このゲームのためにPCを買い替えるべきか

実用面での結論は明確だ。現時点でGTA6のためにPCを新調・買い替えするのは時期尚早である。

理由は二つある。一つは、公式のシステム要件がまだ存在せず、何を基準に選べばよいか確定していないこと。もう一つは、PC版の登場が早くても2027年後半とされる点だ。その頃にはGPUやRAMの価格状況も変わり、より新しい世代のパーツが選択肢に加わっている可能性が高い。今のうちに高価なパーツを揃えても、発売時には割高・型落ちになりかねない。

近年のAAAタイトルを中設定で快適に動かせるPC（8コア級のCPU、8GB以上のVRAMを備えたGPU、16GB以上のRAM、SSD）であれば、PC版が出る頃にも一定の目安にはなる。ただし最終判断は、Rockstarが公式のスペック表を公開してからにするのが堅実だ。

---

## まとめ：確定と未確定の切り分け

現時点で確定しているのは、「GTA6はPS5・Xbox Series X|S向けに2026年11月19日に発売される」という一点である。PC版の存在・発売時期・システム要件は、いずれも公式に発表されていない。

世間で「リーク」と呼ばれているPC要件は、実際にはコンソール性能やエンジンの特徴、過去作の傾向から組み立てられた予測であり、情報源によって数字も異なる。妥当な見立てではあるものの、確定情報ではない。

GTA6は未発売のタイトルであり、しかもPC版に至っては発表前の段階にある。システム要件を「確定済み」と断定する情報には引き続き注意したい。公式のスペック表が公開され次第、本記事の内容を更新する。

---

> 注記：本記事は2026年6月22日時点の情報にもとづく。確定事項はRockstar Gamesの公式発表に準拠する。PC版GTA6は本記事執筆時点で公式未発表であり、本文中のシステム要件はすべて第三者による未確認の推定値である。公式発表後に内容を更新する。`,
  },
  {
    id: 12,
    title: "GTA6のゲームプレイ機能はどう進化するか——トレーラーと過去作からの考察",
    description:
      "NPCの賢さ、ミッションの自由度、新しい移動手段、戦闘の深さ。トレーラー・流出映像・過去作の三層から進化の方向性を考察する。",
    icon: "🤖",
    image: "/images/news/gameplayhadousinkasurunoka.webp",
    category: "speculation",
    date: "2026-06-22",
    source: "トレーラー・流出映像・過去作の傾向に基づく考察",
    sourceUrl: "#",
    relatedArticles: [15, 7, 3],
    aiSummary: [
      "GTA6のゲームプレイ進化は、トレーラー・2022年流出映像・過去作の三層の手がかりからの考察である。",
      "確定はデュアル主人公制までで、自由度や戦闘の深化などは推測の段階にとどまる。",
      "Rockstarは実機ゲームプレイトレーラーを未公開で、流出由来の機能は最終版で変わりうる。",
    ],
    titleEn:
      "How Will GTA6's Gameplay Features Evolve — An Analysis Based on the Trailers and Past Titles",
    descriptionEn:
      "The smartness of NPCs, mission freedom, new means of travel, and the depth of combat. We examine the direction of this evolution across three layers: the trailers, leaked footage, and past titles.",
    aiSummaryEn: [
      "GTA6's gameplay evolution is an analysis drawn from three layers of clues: the trailers, the 2022 leaked footage, and past titles.",
      "What is confirmed extends only as far as the dual-protagonist system, while greater freedom and deeper combat remain at the speculation stage.",
      "Rockstar has not released a live gameplay trailer, and leak-derived features could change in the final version.",
    ],
    fullContentEn: `# How Will GTA6's Gameplay Features Evolve — An Analysis Based on the Trailers and Past Titles

Just how far GTA6's gameplay will evolve is a point that has drawn interest even before release. The smartness of NPCs, mission freedom, new means of travel, the depth of combat — all of these are elements expected of a sequel, but simply saying it will vaguely get better reveals nothing about the substance.

So GTA6 FEED has organized the direction of the gameplay features using three clues: the elements actually shown in the released trailers, the footage of the early development build that leaked in 2022, and the tendencies of past titles (especially Red Dead Redemption 2). We note up front that this article is strictly an analysis based on the material available at this point and is not confirmed information. This article is based on information as of June 22, 2026.

---

## Premise: Distinguishing the Reliability of the Clues

What matters when reading gameplay predictions is that the level of certainty differs completely depending on the source. We want to distinguish the following three layers.

- The official trailers (two): the most reliable material, but their content centers on in-engine cutscenes and is not live gameplay footage with a HUD. In other words, while you can read the level of detail in the world, the feel of the controls and the specifics of the systems are not confirmed. Rockstar has not yet released an official gameplay trailer.
- The footage of the early development build that leaked in 2022: it is real, but it is strictly an early-stage build. Some elements were actually removed in the final version (such as the prone action discussed later), and the specifications shown here will not necessarily carry over as-is into the retail version.
- Community analysis and inferences from past titles: these are examinations and fan observations based on a single scene from a trailer, and their certainty is the lowest.

Below, we organize each feature while indicating which layer of evidence it is based on.

---

## NPCs and the Detail of the World (Evolution of Behavior)

The element with the most evidence is the detail of the NPCs and the environment.

In the official trailers, NPCs were not mere background but showed behaviors such as applying sunscreen, arguing, dancing, and filming one another with smartphones. The depiction of wildlife is also rich, and you can confirm sharks, alligators, flamingos, pelicans, dogs, and others behaving in response to the environment. Furthermore, fan analysis has pointed out that traffic-related behavior may be more complex than in the previous title, such as NPC drivers using the oncoming lane to overtake (this is based on trailer analysis, so its certainty is lower).

What to be careful about here is that this evolution of AI does not refer to the generative AI or machine-learning AI that have been talked about in recent years. It is reasonable to take it as meaning that the systems controlling NPC behavior, traffic, and crowd movement, along with the detail of the animation, are deepening. It can be thought of as a direction that builds a denser city on top of the meticulous world depiction shown in RDR2.

---

## Mission Design and Freedom of Play

As for mission freedom, little was shown directly in the trailers, so inference from the structure is the main approach.

What is relatively certain is the design built around two protagonists (Jason Duval and Lucia Caminos). The dual protagonists are officially confirmed and are portrayed as a Bonnie-and-Clyde-style criminal duo. Leaked footage and analysis point to the existence of a selection scheme — solo Jason, solo Lucia, and simultaneous control of both — and there is a possibility that seamless switching during missions will be more integrated than GTA V's approach of going back and forth between separate stories.

On the other hand, a high degree of freedom such as being able to clear a single mission in multiple ways is speculation that expects an expansion of the approach shown in RDR2, and is not confirmed at this point. It is reasonable as a direction, but we want to avoid confusing it with confirmed information.

---

## Means of Travel and Movement Around the Map

As for new means of travel, the setting itself serves as a clue.

GTA6 is set in the state of Leonida, modeled on Florida, which includes the islands of the bay area (the Leonida Keys) and a wetland reminiscent of the Everglades (the Grass Rivers). Airboats and boats running through the wetlands have been confirmed in the trailers, and water travel is expected to take up a far greater share than in past titles. In addition, fans have pointed out the existence of a railway system similar to Miami's Metrorail (observation-based).

The view that water-based means of travel will be expanded in addition to the conventional cars, motorcycles, and helicopters is consistent with the setting. Given a vast map as the premise, it can be said that a diversification of the means of travel between regions is a natural direction.

---

## Interaction and Stealth

As for interaction with the environment and NPCs, the 2022 leaked footage is the main basis. The elements that can be read from it include the following, but all are derived from the early build and their implementation in the final version is not guaranteed.

- The action of restraining NPCs with zip ties
- The action of using a hostage as a shield
- The action of carrying a corpse and looting its possessions
- Stealth via crouching (however, the prone action that was in the leaked footage is said to have been removed in the final build)
- Switching grips so a weapon can be held in either the left or right hand

These elements indicate a direction that broadens the range of what a player can do with respect to the world. But to repeat, footage of the early build is a work in progress, and there is always a possibility it will be changed or removed in the retail version.

---

## Combat System

Combat too centers on inference from the leaked footage and the tendencies of past titles.

Leaked footage and various analyses point to elements such as reactions when hit that change according to the type of weapon, more elaborate close-quarters combat, and deeper weapon customization than GTA V. It is also reported that there is situational behavior, such as surrounding NPCs reacting when you walk with a weapon drawn, and weapons being automatically holstered in crowds. There is also a view that the cap on the wanted level will be raised.

If these are true, then beyond simple shootouts, the range of situational maneuvering will broaden. The prediction that tactical depth will increase is itself reasonable, but it is not a confirmed specification at this point.

---

## Summary: The Scope of This Analysis and Points to Note

What is confirmed at this point is that GTA6 will be released on November 19, 2026 for PS5 and Xbox Series X|S, and that it adopts a dual-protagonist system with Jason and Lucia.

The evolution of the gameplay features raised in this article is merely an analysis from three layers of clues: the detail of the world shown in the trailers, the 2022 leaked footage of the early development build, and the tendencies of past titles. Although the trailers strongly indicate a direction, Rockstar has not yet released a live gameplay trailer, and the feel of the controls and the specifics of the systems are still officially withheld. Leak-derived features must be read on the premise that they could change in the final version.

These details are likely to come to light in the third trailer (its release on or after June 25 is considered likely, but it is not officially confirmed) and in the gameplay trailer expected to be released going forward. We will update the content of this article as soon as new official information appears.

---

> Note: This article is an analysis based on information as of June 22, 2026. Confirmed matters conform to the official announcements of Rockstar Games. The descriptions of gameplay features in the body include unverified speculation based on the official trailers, the 2022 leaked footage, and the tendencies of past titles, and do not guarantee implementation in the retail version. We will update the content as soon as official gameplay information is released.`,
    fullContent: `# GTA6のゲームプレイ機能はどう進化するか——トレーラーと過去作からの考察

GTA6のゲームプレイがどこまで進化するのか、という点は発売前から関心を集めている。NPCの賢さ、ミッションの自由度、新しい移動手段、戦闘の深さ——いずれも続編に期待される要素だが、漠然と「良くなる」と語るだけでは中身が見えない。

そこでGTA6 FEEDでは、公開済みのトレーラーで実際に示された要素、2022年に流出した開発初期ビルドの映像、そして過去作（特にレッド・デッド・リデンプション2）の傾向という三つの手がかりから、ゲームプレイ機能の方向性を整理した。本記事はあくまで現時点の材料にもとづく考察であり、確定情報ではない点を最初に断っておく。本記事は2026年6月22日時点の情報にもとづく。

---

## 前提：手がかりの「確からしさ」を区別する

ゲームプレイの予想を読むうえで重要なのは、情報源によって確度がまったく異なることだ。以下の三層を区別したい。

- 公式トレーラー（2本）：最も信頼できる材料だが、内容はイン・エンジンのカットシーン中心で、HUDのある実機ゲームプレイ映像ではない。つまり「世界の作り込み」は読み取れても、操作感やシステムの詳細までは確定しない。Rockstarは公式のゲームプレイトレーラーをまだ公開していない。
- 2022年に流出した開発初期ビルドの映像：実在するが、あくまで初期段階のもの。実際に最終版で削除された要素（後述する伏せ動作など）もあり、ここに映っていた仕様がそのまま製品版になるとは限らない。
- コミュニティの解析・過去作からの推測：トレーラーの一場面を根拠にした考察やファンの観察で、確度は最も低い。

以下では、各機能がどの層の根拠にもとづくのかを示しながら整理する。

---

## NPCと世界の作り込み（挙動の進化）

最も多くの根拠があるのが、NPCや環境の作り込みである。

公式トレーラーでは、NPCが単なる背景ではなく、日焼け止めを塗る、口論する、踊る、スマートフォンで互いを撮影するといった行動を見せていた。野生動物の表現も豊富で、サメ・ワニ・フラミンゴ・ペリカン・犬などが環境に反応して振る舞う様子が確認できる。さらにファンの解析では、対向車線を使って追い越すNPCドライバーなど、交通まわりの挙動が前作より複雑になっている可能性が指摘されている（こちらはトレーラー解析ベースのため確度は下がる）。

ここで注意したいのは、こうした「AIの進化」が、近年話題の生成AIや機械学習AIを指すわけではないという点だ。NPCの行動や交通、群衆の挙動を制御するシステムとアニメーションの作り込みが深まる、という意味合いで捉えるのが妥当である。RDR2で見せた緻密な世界表現を土台に、より密度の高い都市を構築する方向と考えられる。

---

## ミッション設計とプレイの自由度

ミッションの自由度については、トレーラーで直接示された部分は少なく、構造からの推測が中心になる。

確度が比較的高いのは、二人の主人公（ジェイソン・デュバルとルシア・カミノス）を軸にした設計だ。デュアル主人公は公式に確定しており、ボニーとクライド型の犯罪コンビとして描かれる。流出映像や解析では、ソロのジェイソン、ソロのルシア、両者の同時操作という選択方式の存在が指摘されており、ミッション中のシームレスな切り替えが、GTA Vの「別々の物語を行き来する」方式より一体的になる可能性がある。

一方、「一つのミッションを複数の方法でクリアできる」といった自由度の高さは、RDR2で見せたアプローチの拡張を期待する推測であり、現時点で確定したものではない。方向性として妥当だが、確定情報と混同しないようにしたい。

---

## 移動手段とマップの移動

新しい移動手段については、舞台設定そのものが手がかりになる。

GTA6の舞台はフロリダ州をモデルにしたレオニダ州で、ベイエリアの島々（レオニダ・キーズ）や、エバーグレーズを思わせる湿地帯（グラスリバーズ）が含まれる。トレーラーでは湿地を走るエアボートやボートが確認されており、水上移動が従来作以上に大きな比重を占めると見られる。加えて、マイアミのメトロレールに似た鉄道システムの存在もファンによって指摘されている（観察ベース）。

従来の車・バイク・ヘリコプターに加え、水辺の移動手段が拡充されるという見立ては、舞台設定と整合的だ。広大なマップを前提にすると、地域間の移動手段が多様化するのは自然な方向と言える。

---

## インタラクションとステルス

環境やNPCとの相互作用については、2022年の流出映像が主な根拠になる。ここから読み取れる要素には次のようなものがあるが、いずれも初期ビルド由来であり最終版での実装は保証されない。

- 結束バンドでNPCを拘束する動作
- 人質を盾として利用する動作
- 死体を運ぶ・所持品を奪う動作
- しゃがみによるステルス（ただし、流出映像にあった「伏せ」の動作は最終ビルドでは削除されたとされる）
- 武器を左右どちらの手でも構えられる持ち替え

こうした要素は、プレイヤーが世界に対してできることの幅を広げる方向を示している。ただし繰り返しになるが、初期ビルドの映像は開発途中のものであり、製品版で変更・削除される可能性が常にある。

---

## 戦闘システム

戦闘まわりも、流出映像と過去作の傾向からの推測が中心となる。

流出映像や各所の解析では、被弾時に武器の種類に応じて変化するリアクション、より作り込まれた近接戦闘、GTA Vより深い武器カスタマイズといった要素が指摘されている。また、武器を抜いて歩くと周囲のNPCが反応し、人混みでは自動的に武器をしまうといった、状況に応じた挙動も伝えられている。指名手配レベルの上限が引き上げられるとの見方もある。

これらが事実なら、単純な撃ち合いだけでなく、状況に応じた立ち回りの幅が広がることになる。戦術的な深みが増すという予想自体は妥当だが、現時点では確定した仕様ではない。

---

## まとめ：考察の射程と注意点

現時点で確定しているのは、GTA6が2026年11月19日にPS5・Xbox Series X|S向けに発売されること、そしてジェイソンとルシアによるデュアル主人公制を採ることである。

本記事で挙げたゲームプレイ機能の進化は、トレーラーで示された世界の作り込み、2022年の開発初期ビルドの流出映像、過去作の傾向という三層の手がかりからの考察にすぎない。トレーラーは方向性を強く示すものの、Rockstarは実機のゲームプレイトレーラーをまだ公開しておらず、操作感やシステムの詳細は依然として公式には伏せられている。流出由来の機能は最終版で変わりうる前提で読む必要がある。

これらの詳細は、第3弾トレーラー（6月25日以降の公開が有力視されているが公式未確定）や、今後公開が見込まれるゲームプレイトレーラーで判明していくと考えられる。新たな公式情報が出次第、本記事の内容を更新する。

---

> 注記：本記事は2026年6月22日時点の情報にもとづく考察である。確定事項はRockstar Gamesの公式発表に準拠する。本文中のゲームプレイ機能に関する記述は、公式トレーラー・2022年の流出映像・過去作の傾向にもとづく未確認の推測を含み、製品版での実装を保証するものではない。公式のゲームプレイ情報が公開され次第、内容を更新する。`,
  },
];

// 日付の新しい順（一覧・トップの表示用）。同日は id の大きい方を先に。
/**
 * 公開中の記事だけを集めたもの（HIDDEN_NEWS_IDS を除外）。
 * 一覧・トップ・検索・関連記事など、利用者に見せる経路はすべてこちらを使う。
 * newsArticles（全件）は prerender-og と管理画面だけが参照する。
 */
export const visibleNewsArticles: NewsArticle[] = newsArticles.filter(
  (a) => !isHiddenNewsId(a.id) && !isRedirectedNewsId(a.id),
);

export const newsByDate: NewsArticle[] = [...visibleNewsArticles].sort(
  (a, b) => b.date.localeCompare(a.date) || b.id - a.id
);

/**
 * 検索インデックス対象の記事（sitemap・一覧の JSON-LD ItemList が使う）。
 * visibleNewsArticles との違いは noindex 記事（NOINDEX_NEWS_IDS）を含まないこと：
 * noindex は「サイト内には出すが検索には出さない」なので、サイト内の一覧
 * （visibleNewsArticles）には残り、検索向けの列挙（ここ）からは外れる。
 */
export const indexableNewsArticles: NewsArticle[] = newsByDate.filter((a) =>
  isIndexableNewsId(a.id),
);

// id から記事を引くヘルパー（詳細ページで使用）。
// 非表示記事は undefined を返す＝記事ページが出ず、残す記事の relatedArticles からも
// 自動的に落ちる（NewsDetail 側が .filter(Boolean) している）。
export const getArticleById = (id: number | string): NewsArticle | undefined =>
  visibleNewsArticles.find((a) => a.id === Number(id));

/**
 * 非表示記事も含めて id から引く（管理画面専用）。
 * 非表示記事に付いたコメントの通報も管理画面から処理できるようにするため、
 * 表示用の getArticleById とは別に用意している。公開ページでは使わないこと。
 */
export const getAnyArticleById = (id: number | string): NewsArticle | undefined =>
  newsArticles.find((a) => a.id === Number(id));
