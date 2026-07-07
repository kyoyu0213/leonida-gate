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

/** 新しい順に並べる（配列の先頭が最新）。#3 以降はここに足す。 */
export const fieldNotes: FieldNote[] = [devDiary2, devDiary1];

/** slug から体験記を解決（SSR/CSR 共通）。 */
export function getFieldNoteBySlug(slug?: string): FieldNote | undefined {
  return slug ? fieldNotes.find((n) => n.slug === slug) : undefined;
}
