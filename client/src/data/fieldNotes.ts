// ============================================================================
//  体験記（Field Notes）データ。
//  GTA6 FEED 運営者自身の一次記録（サーバー開発日記・サーバー訪問記）を束ねる。
//  news.ts と同様、ここに1エントリ追加するだけで
//    - 一覧ページ（/fivem-gtarp/field-notes）
//    - 記事ページ（/fivem-gtarp/field-notes/<slug>）
//    - プリレンダ（entry-server.tsx / scripts/prerender-routes.ts）
//    - sitemap（scripts/generate-sitemap.mjs）
//  が自動で追従する。#2 以降・訪問記もここに足すだけでよい。
// ============================================================================

/** 体験記のサブカテゴリ。将来「訪問記(visit-note)」を追加予定。 */
export type FieldNoteCategory = 'dev-diary' | 'visit-note';

export interface FieldNote {
  /** URL スラッグ（/fivem-gtarp/field-notes/<slug>）。英数とハイフンのみ。 */
  slug: string;
  category: FieldNoteCategory;
  title: string;
  titleEn: string;
  /** YYYY-MM-DD */
  date: string;
  /** 一覧カード＆meta description に使う短い説明。 */
  excerpt: string;
  excerptEn: string;
  /** カードのサムネ兼・本文冒頭ヒーロー画像（本文Markdown先頭にも同じ画像を置く）。 */
  image: string;
  /** 記事見出し横の絵文字アイコン。 */
  icon: string;
  seoTitle: string;
  seoTitleEn: string;
  seoDesc: string;
  seoDescEn: string;
  /** 本文Markdown（冒頭にヒーロー画像を含む）。 */
  body: string;
  bodyEn: string;
}

/** サブカテゴリの表示ラベルとネオン色（一覧のフィルタチップ・カードのバッジで使用）。 */
export const FIELD_NOTE_CATEGORY_CONFIG: Record<
  FieldNoteCategory,
  { ja: string; en: string; color: string }
> = {
  'dev-diary': { ja: '開発日記', en: 'Dev Diary', color: '#fb923c' },
  'visit-note': { ja: '訪問記', en: 'Visit Notes', color: '#38bdf8' },
};

// ---------------------------------------------------------------------------
//  #1 サーバー開発日記
// ---------------------------------------------------------------------------
const devDiary1: FieldNote = {
  slug: 'server-dev-diary-1',
  category: 'dev-diary',
  title: '【FiveM開発日記 #1】英語もコードも分からない自分が、AIに教わってFiveMサーバーを起動させた',
  titleEn:
    'FiveM Dev Diary #1: With No English and No Coding, I Got a FiveM Server Running by Learning from AI',
  date: '2026-05-19',
  excerpt:
    '英語もコードも分からない運営者が、AIに教わってFiveMサーバーを起動するまでの一次記録。無料で建てられる理由と、次にやること（txAdmin・車追加・ZeroTier・MLO・QBCore）。',
  excerptEn:
    'A first-hand record of an operator who knows no English or code getting a FiveM server running with help from AI — why it’s free to build, and what comes next (txAdmin, add-on cars, ZeroTier, MLO, QBCore).',
  image: '/images/taikenki/serverkaihatu/1/spawn.png',
  icon: '📓',
  seoTitle: '【FiveM開発日記 #1】AIに教わってFiveMサーバーを起動させた｜GTA6 FEED',
  seoDesc:
    '英語もコードも分からない運営者が、AIに教わりながらローカルでFiveMサーバーを起動するまでの一次記録。無料で建てられる理由、起動後にやること（txAdmin・車追加・ZeroTier・MLO・QBCore）まで。GTA6 FEEDの体験記 開発日記#1。',
  seoTitleEn: 'FiveM Dev Diary #1: Getting a FiveM Server Running by Learning from AI | GTA6 FEED',
  seoDescEn:
    'A first-hand record of an operator who knows no English or code getting a FiveM server running locally with help from AI — why it’s free to build, and what comes next (txAdmin, add-on cars, ZeroTier, MLO, QBCore). GTA6 FEED Field Notes, Dev Diary #1.',
  body: `![チュマシュのAmmunation前に立つ自作キャラクター。左上に「IcyToad5630 joined.」の表示](/images/taikenki/serverkaihatu/1/spawn.png)

GTA6 FEEDではこれまで、GTA6のニュースや考察、そしてFiveM/GTARPのサーバー紹介や導入ガイドを書いてきた。今回から、少し毛色の違う連載を始める。自分自身でFiveMのサーバーをゼロから建てて、その過程をそのまま記録していく開発日記だ。

きっかけは単純で、FiveMのサーバーはローカル（自分のPC）で動かすだけならソフトは無料で作れると知ったからだ。正確に言えば、サーバー本体のソフトもtxAdminのような管理ツールも無料で、必要なのはGTA5本体と、公式サイトで取得できる無料のライセンスキーだけ。つまり、GTA5さえ持っていれば、追加の課金なしで「自分専用のサーバー」を立てられる。

## これまでのハードルと、それが下がった理由

正直に言うと、少し前まで「サーバーやMODの開発は自分には無理だ」と思っていた。英語のドキュメントを読み込めて、ある程度コードが書ける人のもの、というイメージがあったからだ。実際、FiveMの公式情報やコミュニティの情報は英語が中心で、設定ファイルを触るにもプログラミングの知識がいる場面が多い。

その壁が、AIのおかげでかなり下がった。分からないエラーやコマンドをそのままAIに投げれば、日本語で手順を噛み砕いて教えてくれる。英語の壁とコードの壁、この二つが同時に低くなったことで、「とりあえずやってみるか」と手を動かせるようになった。今回の起動作業も、実際にChatGPTに一つずつ聞きながら進めている。

## まずは起動できた ― ただし中身は空っぽ

そして、ChatGPTに教わりながら、無事にFiveMサーバーを起動できた。

![サーバーに接続した直後のマップ画面。ストロベリー付近にキャラクターがいる](/images/taikenki/serverkaihatu/1/map.png)

とはいえ、今の状態はまだ何もない、ただのサーバーだ。デフォルトのマップに自分のキャラが一人で立っているだけで、仕事もお金も、追加の車もマップも何もない。まずはこの「空っぽの状態」で何ができて何ができないのかを、いろいろ触って確かめてみるつもりだ。

一点、注意しておきたいことがある。画面上はオンラインのように見えるし、自分では問題なく接続できる。ただ、これは「他の人が入れる公開サーバー」とは別物だ。ローカルで動いているサーバーに外部から入ってもらうには、通常ポート開放という設定が必要になる。しかも家庭用の回線ではこのポートが塞がれていることが多く、そのままでは友達すら入れない場合がある。この問題をどう回避するかは、次のロードマップの③で触れる。

## これからやること（すべて無料でできる予定）

調べた限り、次のステップはどれも無料で進められるらしい。この開発日記では、これらを一つずつ試して記録していく。

① 管理者コマンドを使えるようにする（txAdmin）。無料の管理ツールで、サーバーの管理画面やコマンドを使えるようにする、最初の一歩になる。

② 車を追加する（Add-On Cars）。無料で配布されている追加車両が大量にある。まずは見た目から賑やかにしてみたい。

③ 友達を入れられるようにする（ZeroTier）。ポート開放をせずに、仮想的に同じネットワークへ入れてもらえる無料ツール。数人で遊ぶ分には無料枠で足りるらしい。……肝心の友達がいないのだが、まずは仕組みだけでも試してみる。

④ マップを追加する（MLO）。建物の内部などを追加できる無料配布のマップがかなり多い。世界そのものに手を入れていく段階だ。

⑤ ゲームとしての仕組みを入れる（QBCore）。無料のフレームワークで、「仕事・お金・車庫・警察・アイテム」といったGTARPでおなじみの要素を一気に導入できる。ここまで来ると、ようやく「サーバーらしいサーバー」になるはずだ。

## 本当の壁は、技術ではないのかもしれない

作り始めて、一つ考えるようになったことがある。技術的なハードルがAIでここまで下がるなら、サーバー運営で本当に難しいのは、むしろ技術以外の部分なのではないか、ということだ。

実際、サーバー運営で最大のネックになるのは、設定やコードよりも人間関係 ― コミュニティの運営やプレイヤー間の揉め事だと言われることが多い。技術で詰まる場面がAIで減った分、この「運営」の比重が相対的に大きくなる、という見方もできる。これが本当にそうなのかは、これから自分で建てて運営してみないと分からない。この日記を続けながら、確かめていきたい。

まずは次回、①のtxAdminから手を付けていく。同じように「自分でも建ててみたい」と思っている人の参考になれば嬉しい。

---

この記事はGTA6 FEED運営者が、自分のPCで実際にFiveMサーバーを構築した記録である。技術的な情報は2026年5月時点の公式ドキュメントおよび各ツールの提供内容を確認して記載しているが、仕様や無料枠の内容は今後変わる可能性がある。FiveMおよびGTAは、それぞれの権利者（Cfx.re / Rockstar Games）の商標であり、本サイトは各社と提携関係にない。`,
  bodyEn: `![My own character standing in front of the Chumash Ammunation, with "IcyToad5630 joined." shown at top-left](/images/taikenki/serverkaihatu/1/spawn.png)

At GTA6 FEED, we have so far written GTA6 news and analysis, along with FiveM/GTARP server introductions and setup guides. Starting this time, I am beginning a slightly different series: a dev diary in which I build a FiveM server from scratch myself and record the process exactly as it happens.

The trigger was simple. I learned that, as long as you only run a FiveM server locally (on your own PC), you can build one with free software. To be precise, both the server itself and management tools like txAdmin are free, and all you need is GTA5 itself plus a free license key you can obtain from the official site. In other words, as long as you own GTA5, you can stand up "your own private server" with no additional payment.

## The Hurdles So Far, and Why They Came Down

To be honest, until recently I thought "developing servers or mods is beyond me." I had the image that it was for people who could read through English documentation and write code to some degree. In fact, FiveM's official and community information is centered on English, and there are many situations where you need programming knowledge just to touch a config file.

That wall came down considerably thanks to AI. If you throw an error or command you don't understand straight at an AI, it breaks the steps down for you in your own language. With the English wall and the code wall both lowered at the same time, I became able to actually move my hands and think "well, let me just give it a try." I'm proceeding with this launch work too, asking ChatGPT one thing at a time.

## First, I Got It Running — But It's Empty Inside

And so, learning from ChatGPT, I successfully launched a FiveM server.

![The map screen right after connecting to the server, with a character near Strawberry](/images/taikenki/serverkaihatu/1/map.png)

That said, right now it is just a bare server with nothing in it. My character is standing alone on the default map — no jobs, no money, no extra cars or maps, nothing. First, I plan to poke around this "empty state" and confirm what can and cannot be done.

There is one thing I want to note. On screen it looks like it's online, and I can connect to it without any trouble. However, this is a different thing from "a public server that other people can join." To let someone from the outside into a server running locally, you normally need a setting called port forwarding. What's more, on home internet lines this port is often blocked, so as-is even friends may not be able to get in. How to work around this problem is something I'll touch on in item ③ of the roadmap below.

## What I'll Do From Here (All Planned to Be Free)

As far as I've looked into it, every one of the next steps can apparently be done for free. In this dev diary, I'll try each of them one at a time and record it.

① Enable admin commands (txAdmin). A free management tool; this is the first step to being able to use the server's admin panel and commands.

② Add cars (Add-On Cars). There is a huge amount of add-on vehicles distributed for free. First I want to liven things up starting with the looks.

③ Let friends in (ZeroTier). A free tool that lets people into a virtually shared network without opening ports. For playing with a few people, the free tier is apparently enough. …The catch is I don't have friends to invite, but for now I'll at least try the mechanism.

④ Add maps (MLO). There are quite a lot of freely distributed maps that let you add building interiors and the like. This is the stage of putting your hands on the world itself.

⑤ Add game systems (QBCore). A free framework that lets you introduce, all at once, the elements familiar from GTARP: jobs, money, garages, police, items. Once you get here, it should finally start to feel like "a real server."

## Maybe the Real Wall Isn't the Technology

Since I started building, one thing has begun to occur to me. If AI lowers the technical hurdle this much, then maybe what's truly hard about running a server is the non-technical part.

In fact, it's often said that the biggest bottleneck in running a server isn't the settings or code, but human relationships — running the community and disputes between players. You could also see it as: because AI reduces the moments where you get stuck on technology, the weight of this "operations" side grows relatively larger. Whether that's actually true is something I won't know until I build and run one myself. I'd like to keep this diary going and find out.

For now, next time, I'll start with ① txAdmin. I'd be happy if it serves as a reference for people who, like me, are thinking "I'd like to try building one myself."

---

This article is a record of the GTA6 FEED operator actually building a FiveM server on his own PC. The technical information is written after confirming the official documentation and each tool's offering as of May 2026, but the specifications and the contents of the free tiers may change going forward. FiveM and GTA are trademarks of their respective rights holders (Cfx.re / Rockstar Games), and this site is not affiliated with those companies.`,
};

// ---------------------------------------------------------------------------
//  #2 サーバー開発日記
// ---------------------------------------------------------------------------
const devDiary2: FieldNote = {
  slug: 'server-dev-diary-2',
  category: 'dev-diary',
  title:
    '【FiveM開発日記 #2】txAdminとvMenuを入れ、「毎回あらぬ場所に飛ばされる」問題をAIにスクリプトを書いてもらって直した',
  titleEn:
    'FiveM Dev Diary #2: I Added txAdmin and vMenu, and Fixed the “Thrown to a Random Place Every Time” Problem by Having AI Write the Scripts',
  date: '2026-05-26',
  excerpt:
    '開発日記#2。txAdminとvMenuを導入し、接続やリスポーンのたびにあらぬ場所へ飛ばされる問題を、AIに書いてもらったスクリプトで解決。MLOの停滞やQBCoreを見送った理由も。',
  excerptEn:
    'Dev Diary #2. After adding txAdmin and vMenu, I fixed the “thrown to a random place every time” problem with scripts written by AI — plus why MLO stalled and QBCore is on hold.',
  image: '/images/taikenki/serverkaihatu/2/image.png',
  icon: '📓',
  seoTitle: '【FiveM開発日記 #2】txAdmin・vMenu導入とAI自作スクリプトでスポーン固定｜GTA6 FEED',
  seoDesc:
    'FiveM開発日記#2。txAdminとvMenuを導入し、接続やリスポーンのたびにあらぬ場所へ飛ばされる問題を、Claude Codeに書いてもらったLuaスクリプトでスポーン・見た目・復活地点を固定して解決。MLOの詰まりやQBCoreを見送った理由も記録。',
  seoTitleEn:
    'FiveM Dev Diary #2: txAdmin, vMenu, and Fixing Random Spawns with AI-Written Scripts | GTA6 FEED',
  seoDescEn:
    'FiveM Dev Diary #2. After installing txAdmin and vMenu, I fixed being thrown to a random spot on every connect and respawn by having Claude Code write Lua scripts to lock spawn point, appearance, and respawn location — plus why MLO stalled and QBCore is on hold.',
  body: `![レジオンスクエアに固定スポーンした、見た目も固定済みの自作キャラクター](/images/taikenki/serverkaihatu/2/image.png)

前回（開発日記 #1）は、無料のツールだけでFiveMサーバーを起動したところまでを書いた。ただ、起動できたといっても中身は空っぽで、デフォルトのマップに自分のキャラが一人で立っているだけの状態だった。今回はそこに、少しずつ手を入れ始めた記録になる。

前回立てたロードマップのうち①のtxAdminを入れ、予定にはなかったvMenuも導入した。そして今回いちばん大きかったのは、AIに「手順を教えてもらう」段階から、「動くスクリプトそのものを書いてもらう」段階に進んだことだ。

## ① 管理ツール（txAdmin）を導入

まずは前回予告していたtxAdminを入れた。サーバーの起動・停止や設定、管理コマンドをブラウザの管理画面から扱えるようになる無料ツールで、これがサーバー管理の土台になる。ここは詰まらずに進んだ。

## vMenu を導入（予定外だが入れてよかった）

ロードマップには書いていなかったが、vMenuも入れた。フレームワークが不要な無料のスタンドアロンのメニューで、車両のスポーンや天候・時間の変更、プレイヤー管理、見た目のカスタマイズといった操作を、ゲーム内のメニューから直接呼び出せる。QBCoreのような大きな枠組みを入れなくても単体で動くので、空サーバーの段階でも「とりあえず何か触れる」状態を作れる。最初に入れておくと動作確認が一気に楽になった。

## AIにFiveMのスクリプトを書いてもらえるようになった

今回いちばんの変化がこれだ。VSCodeのClaude Codeが、FiveM用のLuaスクリプトを書いてくれるようになった。前回はChatGPTに導入手順を「教えてもらう」段階だったが、今回は動くスクリプトそのものを書いてもらう段階に進んだことになる。

![VSCode上でClaude CodeがFiveM用のLuaスクリプト（simple_respawn）を生成している画面](/images/taikenki/serverkaihatu/2/image3_masked.png)

書いてもらったのは、空サーバーの地味な不便を潰すための、次の3つのスクリプトだ。

一つ目は、スポーン位置の固定。デフォルトのままだと接続のたびにあちこち（自分の場合はよくマップ北の方）へ飛ばされていたのを、毎回レジオンスクエアに湧くよう固定してもらった。

二つ目は、キャラクターの見た目の固定。放っておくと毎回見た目が変わってしまうので、同じ見た目で入れるようにした。

三つ目は、死亡後のリスポーン固定。死ぬとランダムな場所に復活していたのを、決まった場所に復活するよう直した。

![AIに書いてもらった fixed_spawn・simple_character・simple_respawn などのリソースを resources フォルダに配置したところ（vMenu も導入済み）](/images/taikenki/serverkaihatu/2/image2.png)

どれも一つひとつは小さな修正だが、こういう「毎回地味に困る」ところが積み重なると、サーバーで過ごす体感はかなり変わる。空っぽだった場所が、少しずつ自分の居場所になってきた感覚がある。

## QBCoreはまだ見送る

じつは、こうした「位置や見た目の固定」は、QBCoreという定番のフレームワークを入れれば標準の機能としてまとめて用意されているらしい。それでも今回あえて単体の軽いスクリプトで済ませたのには理由がある。

QBCoreは導入の難易度が高く、入れた途端にサーバーが重くなるとも聞く。ChatGPTにも「もう少し慣れてから入れたほうがいい」と言われた。フレームワークはデータベースの用意や多数のリソースの管理が前提になるので、基礎がまだ固まっていない今の段階でいきなり乗せるのはリスクが大きい、という判断だ。今は必要な機能だけをスタンドアロンのスクリプトで足していき、土台に慣れてから改めてQBCoreの導入を検討することにした。

## MLOで詰まった（正直なところ、ここは停滞中）

前回のロードマップ④にあたるMLO（建物内部などを追加するマップ）にも手を出してみた。ただ、ここは今のところ止まっている。

まず、配布サイトからのダウンロードがなかなか怖い。出所のはっきりしない無料配布も多く、ウイルスにビクビクしながら何個か落としてみる、という状態だった。しかも、落としてみたMLOがFiveMにそのまま入れられる形式のものばかりではなく、追加してもうまく反映されないものがあった。

導入の基本的な流れ自体は分かってきた。resourceフォルダにMLOやスクリプトを追加し、txAdminのCFG Editorで有効化（ensure）する、という手順だ。ただ、MLOによっては依存関係や形式の都合でそのままでは動かないものもあるようで、「どれがそのまま使えて、どれが手間のかかる形式なのか」を見極めるところが次の課題になりそうだ。無料配布のMLOに手を出す人は、まず出所に注意してほしい、というのが今回の正直な実感だ。

## 今回のまとめ

txAdminとvMenuで土台を整え、AIに書いてもらったスクリプトで空サーバーの不便を少しずつ潰した。一方でMLOは形式の壁で停滞中、QBCoreは意図的に見送り、というのが2週目の現状だ。次回は、このMLOの詰まりを解くか、前回ロードマップ②の車両追加あたりに進みたい。

---

この記事はGTA6 FEED運営者が、自分のPCで実際にFiveMサーバーを構築している記録である。技術的な情報は2026年5月時点の公式ドキュメントおよび各ツールの提供内容を確認して記載しているが、仕様や難易度は環境によって異なり、今後変わる可能性がある。FiveMおよびGTAは、それぞれの権利者（Cfx.re / Rockstar Games）の商標であり、本サイトは各社と提携関係にない。`,
  bodyEn: `![My own character with a fixed appearance, fixed-spawned at Legion Square](/images/taikenki/serverkaihatu/2/image.png)

Last time (Dev Diary #1), I wrote up to the point of launching a FiveM server using only free tools. But even though it launched, the inside was empty — just my character standing alone on the default map. This time is a record of starting to work on it, little by little.

Of the roadmap I laid out last time, I installed ① txAdmin, and I also added vMenu, which wasn't in the plan. And the biggest thing this time was moving from the stage of having AI "teach me the steps" to the stage of having it "write the working scripts themselves."

## ① Installing the management tool (txAdmin)

First, I installed txAdmin as I'd previewed last time. It's a free tool that lets you handle starting/stopping the server, settings, and admin commands from a browser-based admin panel, and it becomes the foundation of server management. This part went without a hitch.

## Adding vMenu (not planned, but glad I did)

It wasn't written in the roadmap, but I also added vMenu. It's a free, framework-independent standalone menu that lets you call up operations like spawning vehicles, changing the weather and time, managing players, and customizing your appearance directly from an in-game menu. Since it works on its own without installing a big framework like QBCore, you can create an "at least I can touch something" state even at the empty-server stage. Installing it first made checking that things worked a lot easier.

## I became able to have AI write FiveM scripts for me

This is the biggest change this time. Claude Code in VSCode became able to write Lua scripts for FiveM. Last time I was at the stage of having ChatGPT "teach me" the installation steps, but this time I've moved to the stage of having it write the working scripts themselves.

![Claude Code in VSCode generating a Lua script (simple_respawn) for FiveM](/images/taikenki/serverkaihatu/2/image3_masked.png)

What I had it write were the following three scripts, meant to crush the small, mundane inconveniences of an empty server.

The first is locking the spawn location. By default I was thrown all over the place on every connect (in my case, often to the north of the map), so I had it fixed so that I always spawn at Legion Square.

The second is locking the character's appearance. Left alone, my appearance would change every time, so I made it so I join with the same look.

The third is locking the respawn after death. I was reviving at a random place when I died, so I fixed it to revive at a set location.

![The AI-written resources — fixed_spawn, simple_character, simple_respawn and more — placed in the resources folder (vMenu is installed too)](/images/taikenki/serverkaihatu/2/image2.png)

Each one is a small fix on its own, but when these "mildly annoying every time" things pile up, the feel of spending time on the server changes quite a bit. I have a sense that a place that was empty is gradually becoming my own spot.

## Holding off on QBCore for now

Actually, this kind of "locking position and appearance" is apparently provided as standard features, all bundled together, if you install the classic framework QBCore. Even so, there's a reason I deliberately made do with lightweight standalone scripts this time.

QBCore is high in installation difficulty, and I hear the server gets heavy the moment you put it in. ChatGPT also told me, "you should install it after you get a bit more used to things." A framework presupposes preparing a database and managing a large number of resources, so my judgment was that suddenly loading it at this stage, when the basics still aren't solid, carries too much risk. For now I'll add only the features I need with standalone scripts, and once I'm used to the foundation, I'll consider installing QBCore anew.

## I got stuck on MLO (honestly, this part is stalled)

I also tried my hand at MLO (maps that add building interiors and the like), which corresponds to ④ of last time's roadmap. However, this part is stalled for now.

First, downloading from distribution sites is pretty scary. There are many free distributions of unclear origin, and I was in a state of nervously downloading a few while worrying about viruses. On top of that, the MLOs I downloaded weren't all in a format that could be put straight into FiveM, and some didn't apply properly even after I added them.

I have come to understand the basic flow of installation itself: add the MLO or script to the resources folder, and enable it (ensure) in txAdmin's CFG Editor. However, it seems some MLOs won't run as-is due to dependencies or format issues, so figuring out "which ones are usable as-is and which are labor-intensive formats" looks like it'll be the next challenge. My honest takeaway this time is that anyone getting into free-distribution MLOs should first be careful about the source.

## Wrapping up this time

I set up the foundation with txAdmin and vMenu, and gradually crushed the inconveniences of the empty server with scripts written by AI. Meanwhile, MLO is stalled at the wall of formats, and QBCore is intentionally on hold — that's where things stand in week two. Next time, I'd like to either untangle this MLO snag or move on to something like the vehicle additions from ② of last time's roadmap.

---

This article is a record of the GTA6 FEED operator actually building a FiveM server on his own PC. The technical information is written after confirming the official documentation and each tool's offering as of May 2026, but the specifications and difficulty vary by environment and may change going forward. FiveM and GTA are trademarks of their respective rights holders (Cfx.re / Rockstar Games), and this site is not affiliated with those companies.`,
};

// ---------------------------------------------------------------------------
//  訪問記 #1 HeliosCity
// ---------------------------------------------------------------------------
const heliosCity: FieldNote = {
  slug: 'helios-city',
  category: 'visit-note',
  title:
    'HeliosCityとは？2026年4月開街・ピーク同接150人前後の日本語ライトRPサーバーを初訪問',
  titleEn:
    'What Is HeliosCity? A First Visit to a Japanese Light-RP Server (Opened April 2026, ~150 Peak Concurrent)',
  date: '2026-06-16',
  excerpt:
    '2026年4月開街の日本語ライトRPサーバー「HeliosCity」を初訪問。同接ピーク150人前後、ホワイトジョブ7種、犯罪の時間制、六法の特徴など初日に確認できた事実を記録。',
  excerptEn:
    'A first visit to HeliosCity, a Japanese light-RP server opened in April 2026 — peak ~150 concurrent, 7 white-collar jobs, time-limited crime, and its rulebook, recorded from day one.',
  image: '/images/taikenki/serverhoumon/HeliosCity/eyecatch.png',
  icon: '📍',
  seoTitle: 'HeliosCityとは？2026年4月開街の日本語ライトRPサーバーを初訪問｜GTA6 FEED',
  seoDesc:
    '2026年4月25日開街の日本語FiveMライトRPサーバー「HeliosCity」をGTA6 FEEDが初訪問。同接ピーク150人前後、接続方法、ホワイトジョブ7種、犯罪可能時間(19:15〜02:45)、強盗20種、六法の特徴、素材屋・リサセンなどを初日の観測として記録。',
  seoTitleEn:
    'What Is HeliosCity? First Visit to a Japanese Light-RP FiveM Server Opened in April 2026 | GTA6 FEED',
  seoDescEn:
    "GTA6 FEED's first visit to HeliosCity, a Japanese light-RP FiveM server opened on April 25, 2026 — peak ~150 concurrent, how to join, 7 white-collar jobs, the crime window (19:15–02:45), 20 heists, rulebook features, crafting facilities and more, recorded from day one.",
  body: `![HeliosCityの街を流すタクシー（Downtown Cab Co）。奥はメカニック「West Coast Garage」](/images/taikenki/serverhoumon/HeliosCity/eyecatch.png)

HeliosCityは、2026年4月25日に本オープンした日本語のFiveMロールプレイサーバーである。太陽（Helios）をモチーフに掲げ、過度な現実再現よりも雰囲気と気軽さを重視したライトRPを方針とする。GTA6 FEEDが初訪問し、初日に確認できた範囲の事実を記録する。以下、実際に観測・確認した確定情報と、初訪問では確認しきれなかった未確認項目を分けて記す。

## 基本情報

- コンセプト：太陽をモチーフにしたライトRP志向の日本語RPサーバー。運営は過度な現実再現ではなく、楽しさと雰囲気を重視するRPを掲げている
- 接続方法：公式Discordに参加し、ロール（役割）申請を行って参加する
- 同時接続数：156人（2026年6月16日 22時時点・観測値）。サーバー告知では、開街当初のピークが100人超、開街1か月後のピークが150人前後とされている
- 稼働時間：24時間オープン。再起動（街瞑想）は12:00／19:00／3:00の1日3回

![HeliosCityの全体マップ。カジノ・ガレージ・北署／南署・素材屋（月兎屋）・飲食店（料亭よひら）・ストレス軽減店（千葉たばこ店）などの施設マーカーが並ぶ](/images/taikenki/serverhoumon/HeliosCity/map.png)

## 街の雰囲気

初訪問時、街の各所に多数のプレイヤーがおり、複数の店舗で人の出入りが見られた。プレイヤーの服装・髪型のバリエーションは幅広く、キャラメイクの作り込みに個人差が出ていた。遅い時間帯でも飲食店が営業していた。

![夜、ドレス姿など思い思いの服装で集まるプレイヤーたち](/images/taikenki/serverhoumon/HeliosCity/nightlife.png)

マップのベースはGTA5のバニラ（ロスサントス）に近いが、メカニックや病院などの施設にはMLO（カスタム内装）が導入されている。

![深夜営業の飲食店「BAR Arcana」の深夜限定メニュー（23:00〜27:00）](/images/taikenki/serverhoumon/HeliosCity/cafe-menu.png)

## 経済・職業（ホワイトジョブ）

ジョブセンターから申請できるホワイトジョブとして、初訪問時に以下の7種を確認した。

- 清掃員（ゴミ収集）
- 記者
- ホットドッグ屋台
- 運送（トラック運転手）
- タクシー
- レッカー
- バス運転手

![ジョブセンターの申請画面。清掃員・記者・ホットドッグ屋台・運送・タクシー・レッカー・バス運転手の7職種が並ぶ](/images/taikenki/serverhoumon/HeliosCity/jobcenter.png)

このほか、募集制の職業として警察、EMS（救急）、個人医、メカニック、飲食店、ストレス回復店がサーバー告知に挙げられている。店舗系は、確認できた範囲でメカニックが4か所、飲食店が4店、ストレス回復店が5店だった。募集制の職業は募集のタイミングが限られるため、これらを目指す参加者はDiscordでの募集告知に注意する必要がある。

告知では釣り・ハンティング・高圧洗浄といった無人ジョブや、起業して自分の店を持つ仕組みにも触れられているが、これらの実態は初訪問では確認していない。

## 実際にタクシージョブを体験

ホワイトジョブのうち、タクシーを実際に試した。市役所でタクシージョブを受注し、カジノ近くのタクシー会社で車両を借りる流れになる。ジョブの開始はF1メニューからNPCミッションを受ける方式で、指定された乗客を運ぶことで報酬が発生する。メーターの単価は高めに設定されており、稼ぎやすい部類のジョブといえる。

![タクシージョブ中の画面。運賃メーターが表示され、乗客ミッションが進行している](/images/taikenki/serverhoumon/HeliosCity/taxi-job.png)

一方で、車両の借り受けには相応の費用がかかる。取材では開始直後に銀行残高が約200万円減っていた。ただし深夜帯の取材で見落とした可能性もあり、この金額は未確定とする。筆者はこの回、100万円ほど稼いだ時点で切り上げたため、収支は差し引きマイナスに終わった。単価の高さで稼ぎやすい一方、初期費用を上回る乗車数をこなさなければ黒字にはならない構造といえる。

なお六法上、タクシーを犯罪行為に使用することは禁止されている。

## 治安構造

![スマホの「会社」アプリ。Police・Ambulance・Mechanic・Taxi が稼働先として表示されている](/images/taikenki/serverhoumon/HeliosCity/phone-companies.png)

警察（LSPD）とEMSは、深夜3時の時点でも稼働していることを確認した。犯罪コンテンツには時間制限が設けられており、犯罪可能時間は19:15〜02:45とされている。小型犯罪については、警察が一定人数いる場合に可能となる。再起動（街瞑想）の前後15分間は、すべての犯罪行為が禁止されている。

この時間制は、犯罪の可否がプレイヤーの参加時間帯に左右されることを意味する。白市民（非犯罪ロール）を中心に遊ぶか、犯罪ロールで遊ぶかによって、活動しやすい時間帯が変わる構造になっている。

## 犯罪・ギャング

強盗コンテンツは20種類が用意されている。ギャングについては、シマ取り（縄張り）システムがギャング5個の結成時点で実装される予定とされており、初訪問の時点では未実装だった。したがって現状のギャング数は5未満である。ギャングへの具体的な加入方法・加入条件は初訪問では確認していない。

![犯罪コンテンツの一覧パネル。小型〜超大型の強盗が並び、上部にオンデューティのPD2人・EMS1人と同接32/200が表示されている](/images/taikenki/serverhoumon/HeliosCity/crime.png)

## クラフト・経済基盤

リサイクルセンター（リサセン）の存在は確認した。武器クラフトの仕組み、車パーツの製作やメカニックへの素材供給、素材の買い取り制度が実際に機能しているかどうかは、初訪問では確認できていない。街には素材屋と見られる施設があったが、その運用実態は未確認である。

![HELIOSブランドの商品が並ぶショップ（HELIOSサンド・コーヒー・キャンディ、無線機、IFAK、ダイビングギアなど）](/images/taikenki/serverhoumon/HeliosCity/shop.png)

設備が存在することと、それが経済として回っているかは別の話であり、後者は継続的にプレイしないと判断できない領域になる。

## 六法・ルールの特徴

![シティホール内の裁判所エリア。COURT CASES／CRIMINAL RECORDS／COURT ROOM の案内が見える](/images/taikenki/serverhoumon/HeliosCity/courthouse.png)

HeliosCityはライトRPを目的としたサーバーであり、過度な現実再現よりも楽しさと雰囲気を重視する方針を掲げている。六法（ルールブック）で定められている特徴的な規定として、以下が挙げられる。

- 犯罪開始前に必ず予告が必要
- 犯罪可能時間は19:15〜02:45
- 再起動（街瞑想）の前後15分間は犯罪行為が禁止
- 再起動の15分前までにすべての犯罪行為を終える

## キャラメイク・初心者案内

![RCORE系のキャラメイク画面。顔の遺伝や肌の色などを細かく調整できる](/images/taikenki/serverhoumon/HeliosCity/charactercreate.png)

参加後はキャラメイクを経て街に入る流れになっている。初心者案内は用意されているが、初訪問では未受講のため、その内容は未確認である。

## 状態マーカー

稼働中（2026年7月時点）

---

出典・参考

- HeliosCity 公式Discord・サーバー告知
- GTA6 FEEDによる初訪問時の観測（2026年6月）

本記事はGTA6 FEEDが独自に取材・記録したものであり、HeliosCity運営、Rockstar Games、Take-Two Interactiveのいずれとも関係はない。記載内容は初訪問時点の情報であり、サーバーの仕様・ルールは変更される可能性がある。`,
  bodyEn: `![A taxi (Downtown Cab Co) cruising through HeliosCity, with the "West Coast Garage" mechanic shop behind it](/images/taikenki/serverhoumon/HeliosCity/eyecatch.png)

HeliosCity is a Japanese-language FiveM roleplay server that had its full opening on April 25, 2026. Taking the sun (Helios) as its motif, it sets out a light-RP direction that prioritizes atmosphere and a casual feel over excessive real-life recreation. GTA6 FEED made a first visit and records the facts we could confirm within day one. Below, we separate the confirmed information we actually observed and verified from the items we could not fully confirm on a first visit.

## Basic Information

- Concept: a Japanese RP server with a light-RP bent themed on the sun. The operators state an RP that values fun and atmosphere rather than excessive real-life recreation
- How to join: join the official Discord and apply for a role to participate
- Concurrent players: 156 (observed at 22:00 on June 16, 2026). Per the server's announcements, the peak at launch was over 100, and the peak one month after opening was around 150
- Uptime: open 24 hours. Restarts ("city meditation") happen three times a day, at 12:00 / 19:00 / 3:00

![The full map of HeliosCity, dotted with facility markers — casino, garages, north/south police stations, the material shop (Getsutoya), a restaurant (Ryotei Yohira), and a stress-relief shop (Chiba Tobacco)](/images/taikenki/serverhoumon/HeliosCity/map.png)

## The Feel of the City

On the first visit, there were many players all over the city, and people were coming and going at several shops. The variety in players' clothing and hairstyles was broad, with individual differences showing in how carefully characters were made. Even late at night, restaurants were open.

![At night, players gathered in outfits of their own choosing, including in dresses](/images/taikenki/serverhoumon/HeliosCity/nightlife.png)

The map's base is close to vanilla GTA5 (Los Santos), but facilities like the mechanic and hospital have MLOs (custom interiors) installed.

![The late-night limited menu (23:00–27:00) of the restaurant "BAR Arcana," open into the small hours](/images/taikenki/serverhoumon/HeliosCity/cafe-menu.png)

## Economy & Jobs (White-Collar Jobs)

As white-collar jobs you can apply for from the Job Center, we confirmed the following seven on the first visit.

- Sanitation worker (garbage collection)
- Reporter
- Hot dog stand
- Delivery (truck driver)
- Taxi
- Tow truck
- Bus driver

![The Job Center application screen, listing the seven jobs: Garbage Collector, News Reporter, Hot Dog Stand, Trucker, Taxi, Tow Truck, and Bus Driver](/images/taikenki/serverhoumon/HeliosCity/jobcenter.png)

Beyond these, the server's announcements list application-based jobs such as police, EMS (emergency medical), private doctor, mechanic, restaurant, and stress-relief shop. As for storefront jobs, within what we could confirm there were 4 mechanic shops, 4 restaurants, and 5 stress-relief shops. Because application-based jobs have limited recruitment timing, participants aiming for these need to watch the recruitment announcements on Discord.

The announcements also touch on unattended jobs like fishing, hunting, and pressure washing, as well as a system for starting a business and owning your own shop, but we did not confirm how these actually work on a first visit.

## Actually Trying the Taxi Job

Of the white-collar jobs, I actually tried the taxi. The flow is to take on the taxi job at City Hall, then rent a vehicle at the taxi company near the casino. The job starts by taking an NPC mission from the F1 menu, and you earn a reward by transporting the designated passenger. The meter's per-unit rate is set on the high side, making it one of the easier jobs to earn from.

![The screen during the taxi job, with the fare meter displayed and a passenger mission in progress](/images/taikenki/serverhoumon/HeliosCity/taxi-job.png)

On the other hand, renting the vehicle costs a fair amount. During our visit, the bank balance dropped by about 2 million yen right after starting. However, since it was a late-night visit we may have overlooked something, so we treat this figure as unconfirmed. This time the writer wrapped up after earning about 1 million yen, so the balance ended in the negative. While the high per-unit rate makes it easy to earn, the structure is such that you won't turn a profit unless you complete more rides than the initial cost.

Note that, per the rulebook, using a taxi for criminal acts is prohibited.

## Public-Safety Structure

![The phone's "Companies" app, showing Police, Ambulance, Mechanic, and Taxi as workplaces](/images/taikenki/serverhoumon/HeliosCity/phone-companies.png)

We confirmed that the police (LSPD) and EMS were active even at 3 a.m. Crime content has a time restriction, with the crime-allowed window stated as 19:15–02:45. Minor crimes become possible when a certain number of police are present. For 15 minutes before and after a restart ("city meditation"), all criminal acts are prohibited.

This time system means whether crime is possible depends on the time slot a player joins. Depending on whether you mainly play as a white citizen (a non-crime role) or as a crime role, the hours in which you can be active differ.

## Crime & Gangs

There are 20 kinds of heist content. As for gangs, a turf-war (territory) system is said to be scheduled for implementation at the point when 5 gangs are formed, and it was not yet implemented at the time of our first visit. Therefore the current number of gangs is fewer than 5. We did not confirm the specific methods or conditions for joining a gang on a first visit.

![The crime-content list panel: heists ranging from small to super-large are listed, with 2 PD and 1 EMS on duty and 32/200 concurrent shown at the top](/images/taikenki/serverhoumon/HeliosCity/crime.png)

## Crafting & Economic Base

We confirmed the existence of a recycling center ("risasen"). Whether the weapon-crafting system, the production of car parts and supplying materials to mechanics, and a material buyback system actually function, we could not confirm on a first visit. There was a facility in town that appeared to be a material shop, but how it is actually operated is unconfirmed.

![A shop lined with HELIOS-branded goods (HELIOS sandwich, coffee, and candy, plus a radio, IFAK, diving gear, and more)](/images/taikenki/serverhoumon/HeliosCity/shop.png)

The existence of facilities and whether they turn as an economy are separate matters, and the latter is a domain you cannot judge without playing continuously.

## Rulebook Features

![The courthouse area inside City Hall, with signs for COURT CASES, CRIMINAL RECORDS, and COURT ROOM visible](/images/taikenki/serverhoumon/HeliosCity/courthouse.png)

HeliosCity is a server aimed at light RP, and it sets out a policy that values fun and atmosphere over excessive real-life recreation. Distinctive provisions defined in the rulebook include the following.

- A warning is always required before starting a crime
- The crime-allowed window is 19:15–02:45
- Criminal acts are prohibited for 15 minutes before and after a restart ("city meditation")
- All criminal acts must be finished by 15 minutes before a restart

## Character Creation & Beginner Guidance

![An RCORE-style character creation screen, where you can finely adjust facial genetics, skin color, and more](/images/taikenki/serverhoumon/HeliosCity/charactercreate.png)

After joining, the flow is to go through character creation and then enter the city. Beginner guidance is provided, but since we did not take it on the first visit, its contents are unconfirmed.

## Status Marker

Active (as of July 2026)

---

Sources & References

- HeliosCity official Discord and server announcements
- GTA6 FEED's observations during the first visit (June 2026)

This article was independently reported and recorded by GTA6 FEED and has no relationship with the HeliosCity operators, Rockstar Games, or Take-Two Interactive. The content is information as of the first visit, and the server's specifications and rules are subject to change.`,
};

/** 新しい順に並べる（配列の先頭が最新）。#3 以降はここに足す。 */
export const fieldNotes: FieldNote[] = [devDiary2, devDiary1, heliosCity];

/** slug から体験記を解決（SSR/CSR 共通）。 */
export function getFieldNoteBySlug(slug?: string): FieldNote | undefined {
  return slug ? fieldNotes.find((n) => n.slug === slug) : undefined;
}
