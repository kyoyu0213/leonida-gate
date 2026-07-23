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
//  #3 サーバー開発日記
// ---------------------------------------------------------------------------
const devDiary3: FieldNote = {
  slug: 'server-dev-diary-3',
  category: 'dev-diary',
  title:
    '【FiveM開発日記 #3】しばらく止まっていた開発を再開。まずは環境と自作リソースが無事に動くかを"現状確認"した',
  titleEn:
    'FiveM Dev Diary #3: Restarting Development After a Pause — First, a "Status Check" That the Environment and My Own Resources Still Work',
  date: '2026-06-13',
  excerpt:
    '開発日記#3。体調を崩して止めていたFiveMサーバー開発を再開。まずは開発環境（txAdmin・VS Code・Claude Code）と、#2までに作った自作リソース（simple_character・simple_respawn 等）が無事に動くかを現状確認し、DEVLOG.mdを新設した。',
  excerptEn:
    'Dev Diary #3. I restarted FiveM server development after a health-related pause. First I did a status check that the environment (txAdmin, VS Code, Claude Code) and the resources I built through #2 (simple_character, simple_respawn, etc.) still work, and I set up a new DEVLOG.md.',
  image: '/images/taikenki/serverkaihatu/3/hero.png',
  icon: '📓',
  seoTitle:
    '【FiveM開発日記 #3】止まっていた開発を再開し、環境と自作リソースを現状確認｜GTA6 FEED',
  seoDesc:
    'FiveM開発日記#3。体調不良で止まっていたサーバー開発を再開し、まずは開発環境（FiveMサーバー・txAdmin・VS Code・Claude Code）と、#2までに作った自作リソース（vMenu・fixed_spawn・simple_character・simple_respawn・route68house）が無事に残って動くかを現状確認。vMenuの保存済みキャラ警告への判断や、再開の保険としてDEVLOG.mdを新設した記録。',
  seoTitleEn:
    'FiveM Dev Diary #3: Restarting a Paused Build and Checking the Environment and My Own Resources | GTA6 FEED',
  seoDescEn:
    'FiveM Dev Diary #3. After a health-related pause, I restarted server development and did a status check that the environment (FiveM server, txAdmin, VS Code, Claude Code) and the resources I built through #2 (vMenu, fixed_spawn, simple_character, simple_respawn, route68house) survived and still work — plus my call on vMenu’s saved-character warning, and setting up a new DEVLOG.md as insurance for restarting.',
  body: `![夕暮れのダウンタウン（レジオンスクエア付近）に立つ、見た目を固定した自作キャラクター](/images/taikenki/serverkaihatu/3/hero.png)

前回の更新からしばらく間が空いてしまった。体調を崩していたこともあって、FiveMサーバーの開発は一時的にストップしていた。今日はようやく体調も戻ってきたので、久しぶりに開発を再開することにした。

とはいえ、しばらく触っていなかったので「そもそもちゃんと動くんだっけ？」という不安が正直あった。なので今回は新しい機能をガンガン作るというより、まずは開発環境と、これまでに作ったものが無事に残っていて動くかを確認するところからスタートした。

## 開発環境の確認

まずは土台が問題なく動くかどうか。順番に立ち上げていった。

- FiveMサーバーを起動
- txAdmin の起動を確認
- VS Code を起動
- Claude Code へ再ログイン
- 以前のプロジェクトがそのまま残っていることを確認

久しぶりでも、この辺りは特に詰まることなくすんなり立ち上がった。環境が壊れていたり、設定が飛んでいたりすると再開のハードルが一気に上がるので、ここが無事だったのは大きい。

## resources フォルダの確認

次に、これまで作成・導入してきたリソースがちゃんと残っているかを確認。resources フォルダを開くと、前回までに入れたものがそのまま残っていた。

- vMenu
- fixed_spawn
- simple_character
- simple_respawn
- route68house

#2 までで作ってきた自作リソースと、導入したメニュー系がひと通り揃っている。ここが残っていれば、続きから進められる。

## 動作確認

フォルダに残っているだけでは意味がないので、実際にサーバーへ接続して一通り動かしてみた。

### simple_character

![/charmenu で開いた simple_character の編集メニュー。Ped Model・Face・Hair・Torso などの項目と「SAVE & CLOSE」が並ぶ](/images/taikenki/serverkaihatu/3/charmenu.png)

- /charmenu が正常に開くことを確認
- キャラクター編集 → 保存 → 終了 まで問題なく動作

自作のキャラクター保存機能が、しばらく放置していてもきちんと動いてくれた。

### simple_respawn

![路上で死亡し、リスポーン待ちになった自作キャラクター](/images/taikenki/serverkaihatu/3/death.png)

- 死亡後、その場で復活することを確認
- リスポーン機能が正常に動作

こちらも問題なし。#2 で「毎回あらぬ場所に飛ばされる」問題を直したときの延長線上にある機能だが、狙いどおりの挙動を維持していた。

![復活直後の画面。左下にvMenu由来の「保存済みキャラクターが未設定」という警告と「IcyToad5630 died.」が表示されている](/images/taikenki/serverkaihatu/3/respawn.png)

なお、動作確認中に vMenu 側から「保存済みキャラクター」に関する警告が表示された。ただ、現在は vMenu のキャラクター保存ではなく自作の simple_character を使っているため、この警告は影響なしと判断した。機能がバッティングしているわけではなく、単に使っていない側が反応しているだけ、という理解でいる。

## 開発ログ（DEVLOG.md）を作成

再開にあたって、プロジェクトルートに DEVLOG.md を新しく作成した。

![VS Code の Claude Code に「DEVLOG.md を新規作成」と指示し、24行のDEVLOG.mdが生成された画面](/images/taikenki/serverkaihatu/3/devlog.png)

これまでは頭の中と、この開発日記だけで進捗を管理していたが、今回みたいに間が空くと「どこまでやったんだっけ」を思い出すのに時間がかかる。今後は開発内容や確認事項をその場でログに残しながら進めていくことにした。次に再開するときの自分を助けるための保険のようなものだ。

## 次回やること

- route68house の動作確認
- 自作リソースのコード整理
- 次に追加する機能の検討

## 今日の感想

今日は新しい機能を作った日というより、「開発を再開した日」だった。

しばらく触っていなかったぶん少し不安もあったが、環境は問題なく動作していたし、自作リソースもちゃんと生きていた。まずは土台がしっかり残っていることを確認できたので、次回からは安心して開発を進められそうだ。

止まっていたものを再び動かすのは、地味だけど大事な一歩。ここから、また少しずつ進めていく。

---

この記事はGTA6 FEED運営者が、自分のPCで実際にFiveMサーバーを構築している記録である。技術的な情報は2026年6月時点の環境と各ツールの提供内容を確認して記載しているが、仕様や挙動は環境によって異なり、今後変わる可能性がある。FiveMおよびGTAは、それぞれの権利者（Cfx.re / Rockstar Games）の商標であり、本サイトは各社と提携関係にない。`,
  bodyEn: `![My own character, with a fixed appearance, standing in downtown (near Legion Square) at dusk](/images/taikenki/serverkaihatu/3/hero.png)

Quite a bit of time has passed since my last update. Partly because I'd fallen ill, development on the FiveM server had temporarily come to a stop. Today my health has finally recovered, so I decided to restart development after a long break.

That said, since I hadn't touched it in a while, I honestly had the worry of "does it even still work properly?" So this time, rather than aggressively building new features, I started by confirming that the development environment and the things I'd made so far were still safely there and still worked.

## Checking the Development Environment

First, whether the foundation runs without issue. I started things up one at a time.

- Launch the FiveM server
- Confirm txAdmin starts up
- Launch VS Code
- Log back in to Claude Code
- Confirm my earlier project is still there as-is

Even after a while, this part came up smoothly without getting stuck anywhere. If the environment is broken or the settings have been wiped, the hurdle to restarting jumps all at once, so it was a big deal that this part was safe.

## Checking the resources Folder

Next, I checked that the resources I'd created and installed so far were still there. When I opened the resources folder, everything I'd put in up to last time was still there as-is.

- vMenu
- fixed_spawn
- simple_character
- simple_respawn
- route68house

The resources I'd built through #2 and the menu-type tools I'd installed were all present. As long as this part survives, I can continue from where I left off.

## Verifying It Works

Since just having them sit in the folder is meaningless, I actually connected to the server and ran through everything.

### simple_character

![The simple_character edit menu opened with /charmenu — items like Ped Model, Face, Hair, and Torso, with "SAVE & CLOSE" listed](/images/taikenki/serverkaihatu/3/charmenu.png)

- Confirmed /charmenu opens correctly
- Character edit → save → exit all worked without issue

My own character-saving feature worked properly even after being left alone for a while.

### simple_respawn

![My own character down on the road, waiting to respawn](/images/taikenki/serverkaihatu/3/death.png)

- Confirmed that after death, I revive on the spot
- The respawn feature works correctly

This one was fine too. It's a feature that's an extension of when I fixed the "thrown to a random place every time" problem in #2, and it maintained the intended behavior.

![The screen right after reviving. At the bottom-left, a vMenu warning that "no saved character is set" and "IcyToad5630 died." are shown](/images/taikenki/serverkaihatu/3/respawn.png)

By the way, during the verification a warning about "saved characters" appeared from the vMenu side. However, since I'm currently using my own simple_character rather than vMenu's character saving, I judged this warning to have no impact. My understanding is that it's not that the features are conflicting — it's simply that the side I'm not using is reacting.

## Creating a Development Log (DEVLOG.md)

As part of restarting, I newly created a DEVLOG.md in the project root.

![The Claude Code screen in VS Code after instructing it to "create a new DEVLOG.md," generating a 24-line DEVLOG.md](/images/taikenki/serverkaihatu/3/devlog.png)

Until now I'd managed progress only in my head and in this dev diary, but when a gap opens up like this time, it takes a while to remember "how far did I get?" From now on I decided to proceed while leaving a log of the development content and things I've checked, right on the spot. It's like insurance to help future me when I restart next time.

## What to Do Next Time

- Verify route68house works
- Tidy up the code of my own resources
- Consider the next feature to add

## Thoughts for Today

Today was less a day of building a new feature and more "the day I restarted development."

Since I hadn't touched it in a while there was a bit of anxiety, but the environment worked without issue, and my own resources were still alive and well. Now that I've confirmed the foundation is firmly intact, I should be able to proceed with development at ease from next time.

Getting something that had stopped moving again is a plain but important step. From here, I'll keep moving forward little by little.

---

This article is a record of the GTA6 FEED operator actually building a FiveM server on his own PC. The technical information is written after confirming the environment and each tool's offering as of June 2026, but the specifications and behavior vary by environment and may change going forward. FiveM and GTA are trademarks of their respective rights holders (Cfx.re / Rockstar Games), and this site is not affiliated with those companies.`,
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

// ---------------------------------------------------------------------------
//  訪問記 #2 Refloria Town
// ---------------------------------------------------------------------------
const refloriaTown: FieldNote = {
  slug: 'refloria-town',
  category: 'visit-note',
  title:
    'Refloria Townとは？同接216人・ギャング抗争とテリトリー制を備えた日本語RPサーバー',
  titleEn:
    'What Is Refloria Town? A Japanese RP Server with 216 Concurrent Players, Gang Wars, and a Territory System',
  date: '2026-07-13',
  excerpt:
    '日本語FiveMロールプレイサーバー「Refloria Town」をGTA6 FEEDが取材。同接216人、テリトリー制のギャング抗争、リサイクル・狩り・薬局・季節限定メニュー・遺伝式キャラメイクなど、観測できた事実を記録する。',
  excerptEn:
    'GTA6 FEED visits Refloria Town, a Japanese FiveM roleplay server — 216 concurrent players, territory-based gang wars, recycling, hunting, a pharmacy, seasonal menus, and genetics-based character creation, recorded as observed.',
  image: '/images/taikenki/serverhoumon/RefloriaTown/matinoyousu.png',
  icon: '📍',
  seoTitle:
    'Refloria Townとは？同接216人・テリトリー制ギャング抗争の日本語RPサーバー｜GTA6 FEED',
  seoDesc:
    '日本語FiveMロールプレイサーバー「Refloria Town」をGTA6 FEEDが取材。同接216人、多数のMLO、テリトリー（縄張り）制のギャング抗争、リサイクルセンター、狩り、リーフ薬局の価格表、七夕の季節限定メニュー、遺伝式キャラメイクなど、観測できた確定情報と未確認項目を分けて記録。',
  seoTitleEn:
    'What Is Refloria Town? A Japanese RP FiveM Server with 216 Concurrent, Gang Wars & Territories | GTA6 FEED',
  seoDescEn:
    "GTA6 FEED's report on Refloria Town, a Japanese FiveM roleplay server — 216 concurrent players, many MLOs, territory-based gang wars, a recycling center, hunting, the Leaf Pharmacy price list, Tanabata seasonal menus, and genetics-based character creation, separating what we confirmed from what we could not.",
  body: `![山の上、本来バインウッド看板がある位置に掲げられたRefloria Townのロゴ看板。右上には「指名手配終了」の通知が流れている](/images/taikenki/serverhoumon/RefloriaTown/matinoyousu.png)

Refloria Townは、日本語のFiveMロールプレイサーバーである。多数のMLO（カスタム内装）を導入した街づくりと、テリトリー（縄張り）制を軸にしたギャング抗争システムを備える。GTA6 FEEDが取材し、観測できた事実を記録する。以下、確認した確定情報と、確認できていない未確認項目を分けて記す。

## 基本情報

- 接続方法：公式Discordに参加し、ロール（役割）申請を行って参加する
- 同時接続数：216人（2026年7月3日 22時時点・観測値）
- サーバー再起動：1時／6時／12時／17時／21時の1日5回

## 街の雰囲気

街には多数のMLOが導入されており、建物の内装が作り込まれている。ベースはロスサントスだが、山上のバインウッド看板はRefloria Townのロゴに差し替えられている。

![桜並木の向こうに広がる街並み。「Auto Exotic」の大型施設が通り沿いに建つ](/images/taikenki/serverhoumon/RefloriaTown/dealer.png)

マップのランドマーク一覧には109件が登録されており、飲食店やメカニック、各種店舗が個別に登録されている。

一部のエリアはセーフゾーンに指定されており、該当エリアに入ると画面上に「あなたはセーフゾーンにいます」と表示される。

指名手配は街全体への通知として流れる仕組みになっており、取材中も指名手配の発生・終了通知が確認できた。警察車両が街を走行する場面も繰り返し見られ、犯罪行為の発生頻度が高い街である。

![高架の下に整備されたMLOのエリア。STOP標識のゲートや店舗が並ぶ](/images/taikenki/serverhoumon/RefloriaTown/mechanic.png)

食べ物や飲み物には賞味期限が設定されており、期限が切れると所持品から消滅する。

住人の挙動としては、接触事故が起きた際に相手が停車して謝罪するやり取りが見られた。また、質問に対して応答する住人が複数いた。

## 経済・職業

市役所（地図上506番地）内の職業センターで、以下の5職を確認した。

![市役所の内装。大理石の階段と、MAYOR OFFICE／MEETING ROOM／VOTING ROOM／OFFICESへの案内板が見える（506番地）](/images/taikenki/serverhoumon/RefloriaTown/siyakusyojob.png)

- ホットドッグ屋
- ゴミ収集作業員
- バスの運転手
- 農家
- タクシー

![職業センターの応募メニュー。ホットドッグ屋・ゴミ収集作業員・バスの運転手・農家・タクシーが並び、その場で応募できる](/images/taikenki/serverhoumon/RefloriaTown/siyakusyojob2.png)

いずれもその場で応募できる。市役所の館内表示にはMAYOR OFFICE（市長室）、MEETING ROOM、VOTING ROOM（投票室）、OFFICESの案内があるが、これらの運用実態は取材時点では確認していない。

このほか、マイニング、木こり、狩りといったジョブが存在する。

飲食店は多数あり、深夜2時の時点で13店舗が営業していた。飲食店以外のユニークジョブとして、キャバクラ、ガールズバー、ペットショップ、結婚式場を確認した。ペットショップにはシチュエーションボイスを販売する店舗も存在する。メカニックは5か所を確認した。

![ペットショップのシチュエーションボイス販売広告。「ペットショップのボイス」CV：とあるペットショップ店員、収録時間00:40](/images/taikenki/serverhoumon/RefloriaTown/boisuhanbai.png)

## 体力・食料・水分の管理

体力、食料、水分がそれぞれ数値で管理されており、飲食物や医薬品で回復する。回復量は品目ごとに設定されている。

薬局（リーフ薬局・577番地）では、以下の価格・回復量を確認した。

![リーフ薬局（Leaf Pharmacy）のメニュー。絆創膏¥13,000ほか、品目ごとの価格と回復量が並ぶ（577番地）](/images/taikenki/serverhoumon/RefloriaTown/yakkyokumenyu.png)

- 絆創膏：¥13,000（体力10%回復）
- 塗り薬：¥26,000（体力20%回復）
- 痛み止め：¥55,000（体力35%回復）
- 包帯：¥100,000（体力30%回復＋怪我完治）
- リーフinゼリー：¥6,000（食料35%回復）
- リーフD：¥6,000（水分35%回復）

飲食店には店舗ごとのオリジナルメニューが設定されている。和風の店舗（庵椿）では、椿印のお饅頭が¥60,000（体力40%回復）、天ぷらうどんが¥44,000（30%回復）、三色団子が¥32,000（25%回復）、抹茶が¥18,000（15%回復）といった価格設定になっていた。このほか海鮮丼、あらっ汁などが提供されている。

![和風店「庵椿」のおしながき。椿印のお饅頭40%、天ぷらうどん30%、三色団子25%、抹茶15%など、体力回復率つきで並ぶ](/images/taikenki/serverhoumon/RefloriaTown/insyokumenyu9.png)

季節に応じた限定メニューも用意されており、七夕の時期には七夕スイーツプレート（¥15,000・食料50%回復）と星空カクテル（¥15,000・水分50%回復）が提供されていた。

![七夕スペシャルメニュー。七夕スイーツプレート（食料50%・¥15,000）と星空カクテル（水分50%・¥15,000）](/images/taikenki/serverhoumon/RefloriaTown/insyokumenyu0.png)

## 治安構造

警察とEMS（救急）は、深夜帯でも稼働していることを確認した。

犯罪行為については、サーバー再起動の前後15分間はいかなる犯罪行為も禁止されている。再起動が1日5回設定されているため、この禁止時間は1日5回発生する。これ以外の時間帯における犯罪可能時間の制限は、取材時点では確認していない。

ギャング同士の抗争については、後述のとおり曜日と時間が指定されている。

## 犯罪・ギャング

ギャングは5つ確認した。それぞれのテリトリーはマップ上で色分けして表示され、ロスサントス市街地を中心に区画が分割されている。

![マップ上に色分け表示されたギャングのテリトリー。ロスサントス市街地を中心に赤・紫・黄・緑などの区画が分かれ、右側にランドマーク一覧（17/109）が表示されている](/images/taikenki/serverhoumon/RefloriaTown/gyanguiro.png)

### 設立条件

ギャングの設立には、BOSS・UNDERBOSSに加え、CAPO/MEMBER5人以上が必要となる。申請はDiscordの専用チャンネルで行い、構成員全員のDiscord名とゲーム内名を明記する。申請後、BOSSと運営の面談があり、希望するカラーや装備の相談もこの場で行われる。ギャング用衣装・傭兵衣装（カラーが明確なもの）は事前に用意する必要がある。BOSSが交代する場合は再度面談となる。

最大メンバー数は13人までだったが、2026年6月15日から15人までに拡大されている。

活動実態のないギャングに対しては、運営が活動状況の確認とログによる事実確認を行う。組織として機能していないと判断された場合は警告が出され、2回目の警告で解散となる。このほか、BOSSからの解散申請、メンバー数が設立条件を下回った場合、メンバーによる悪質なルール違反が確認された場合も解散対象となる。違反は1人であっても組織全体が解散対象となり得る。

### テリトリー

テリトリー範囲内では、NPCへの薬物販売や、壁に自ギャング名をスプレーする行為によって忠誠度を上げられる。また、テリトリー内の無人店舗などに対してみかじめ料の徴収が可能となっている。有人店舗は対象外である。

### 抗争

抗争日は火曜日・金曜日・日曜日の21時30分〜23時30分に設定されている。この時間内にギャング服を着用しているプレイヤーは抗争参加中と判断され、戦闘の対象となる。抗争に参加しないギャングは、Discordの「抗争不参加申請」への書き込みが必要となる。

抗争中の主な制限は以下のとおり。

- 死亡した場合、蘇生後10分間はギャング活動（戦闘・薬物販売など）が禁止される
- 逮捕された場合、PD解放後10分間はギャング活動が禁止される
- ギャング服を脱いだ場合も10分間はギャング活動が禁止される
- ギャング間の同盟行為は禁止されている
- 抗争で死亡したギャング同士のROB（強奪）は許可されるが、抗争外でのROBは禁止されている
- 抗争中にNPCを故意に殺害する行為は禁止されている
- 抗争で使用する車両の窓へのスモークカスタムは禁止されている

ギャング活動禁止時間中は、ギャング服を脱ぎ、ギャングと関係のないカラーの車両で行動することが求められる。

## クラフト・経済基盤

リサイクルセンター（リサセン）はパレト湾のグレート・オーシャン・ハイウェイ沿いにある。

リサセンはルーム制になっており、入室時にルームを選択する。ルームAは誰でも何人でも入れる常時開放の共有部屋で、ルームB以降は利用人数の上限が5人に設定されている。各ルームは公開とパスワード付きを選択でき、パスワードを設定すれば仲間内だけで作業できる。

![リサイクルルームの選択画面。ルームA（誰でも何人でも入れる共有部屋）からルームK（利用人数1/5・パスワード付き）までが並ぶ](/images/taikenki/serverhoumon/RefloriaTown/recyclecenter4.png)

作業の流れは、ルームに入り、心の目（インタラクト操作）で素材を回収し、これを運んで奥にいるNPCに渡すとリサイクルボックスと交換できる。このリサイクルボックスを使用すると、中身が排出される仕組みになっている。

![リサセンの倉庫内部。奥にNPCが立ち、右上に「リサイクル Lv1/30・XP86/300・作業+200」の進行表示がある](/images/taikenki/serverhoumon/RefloriaTown/recyclecenter.png)

![木箱を「検索中（59%）」で調べているところ。心の目で素材を回収する作業の様子](/images/taikenki/serverhoumon/RefloriaTown/recyclecenter2.png)

![奥のNPCの「素材交換」メニュー。1素材・10素材・50素材・100素材の交換が並ぶ](/images/taikenki/serverhoumon/RefloriaTown/recyclecenter3.png)

![所持品内のリサイクルボックス（200g 2x）。使用すると中身が排出される](/images/taikenki/serverhoumon/RefloriaTown/recyclebox.png)

リサイクルにはレベル制が導入されており、上限はレベル30。作業1回ごとに200XPが加算され、レベル1から2への到達には300XPが必要となっていた。

買い取り制度は機能しており、ゲーム内SNSで素材の買い取りを募集する住人も見られた。

武器クラフトの仕組み、車パーツ製作やメカニックへの素材供給については、取材時点では確認していない。

## 実際に狩りを体験

無人ジョブのうち、狩りを実際に行った。狩りを始めるには弓の購入が必要で、開始時点で初期費用が発生する。弓にはスコープが備わっており、これを覗いて動物を狙う。画面には「0/1」の進行カウンタが表示され、対象の狩猟状況が分かるようになっている。

![パレトの森の道路脇で弓を構えたところ。画面左に「0/1」の進行カウンタが表示されている](/images/taikenki/serverhoumon/RefloriaTown/kari.png)

![弓のスコープを覗き、森の中の動物を狙っている画面。距離目盛りと「0/1」カウンタが見える](/images/taikenki/serverhoumon/RefloriaTown/kari2.png)

仕留めた動物は食肉加工場に持ち込む。加工場はパレト湾（3013番地）にあり、NPCに渡すことで食肉に加工される。これを売却して収益とする流れになる。

![パレト湾（3013番地）の食肉加工場。搬入口の前にエプロン姿のNPCが立つ](/images/taikenki/serverhoumon/RefloriaTown/syokunikukakou.png)

初期費用を先に支払う構造のため、弓の代金を回収するまでは収支がマイナスから始まる。一方で、加工・売却まで到達した時点での単価は高く、狩りを継続するほど初期費用の比重は下がっていく。

## キャラメイク・初心者案内

スタート地点はレギオン（レギオンスクエア）で、同所にキャラメイクを行える場所がある。キャラメイクの結果が気に入らない場合、後から整形することも可能になっている。

キャラメイクは遺伝システムを採用しており、まず父と母それぞれの顔をIDから選択し、ブレンドスライダーでどちらの親にどれだけ似せるかを決める。肌の色も両親から継承する仕組みで、父・母それぞれのブレンド比率を調整できる。

![bincoのキャラメイク「遺伝」画面。父（ID:21）と母（ID:33）の顔を選び、ブレンドスライダーで似せ具合を調整する。左には遺伝・顔の特徴・髪型・肌の欠点などの項目が並ぶ](/images/taikenki/serverhoumon/RefloriaTown/kyarameiku.png)

調整項目は遺伝、顔の特徴、髪型、肌の欠点、ひげ、眉毛、老化、メイク、チーク、肌質、日焼け跡、口紅、ほくろ・そばかす、胸毛など多岐にわたる。上半身・下半身・アクセサリーの衣装も同じ画面で設定でき、「衣装として保存」も可能になっている。

初心者案内が用意されている。

## 状態マーカー

稼働中（2026年7月時点）

---

出典・参考

- Refloria Town 公式Discord・六法（ルールブック）
- GTA6 FEEDによる取材時の観測（2026年7月）

本記事はGTA6 FEEDが独自に取材・記録したものであり、Refloria Town運営、Rockstar Games、Take-Two Interactiveのいずれとも関係はない。記載内容は取材時点の情報であり、サーバーの仕様・ルールは変更される可能性がある。`,
  bodyEn: `![Refloria Town's logo sign raised on the mountaintop where the Vinewood sign would normally be. At the top right, a "wanted status ended" notification is showing](/images/taikenki/serverhoumon/RefloriaTown/matinoyousu.png)

Refloria Town is a Japanese-language FiveM roleplay server. It features city-building with many MLOs (custom interiors) installed, along with a gang-war system built around a territory (turf) mechanic. GTA6 FEED reported on it and records the facts we were able to observe. Below, we separate the confirmed information we verified from the items we could not confirm.

## Basic Information

- How to join: join the official Discord and apply for a role to participate
- Concurrent players: 216 (observed at 22:00 on July 3, 2026)
- Server restarts: five times a day, at 1:00 / 6:00 / 12:00 / 17:00 / 21:00

## The Feel of the City

Many MLOs are installed throughout the city, and building interiors are carefully crafted. The base is Los Santos, but the Vinewood sign on the mountain has been swapped for the Refloria Town logo.

![A cityscape spreading out beyond a row of cherry-blossom trees, with the large "Auto Exotic" facility standing along the street](/images/taikenki/serverhoumon/RefloriaTown/dealer.png)

The map's landmark list has 109 entries registered, with restaurants, mechanics, and various shops registered individually.

Some areas are designated as safe zones, and when you enter such an area, "You are in a safe zone" is displayed on screen.

Wanted status flows as a notification to the entire city, and during our visit we were able to confirm both the start and end notifications of wanted statuses. We repeatedly saw police vehicles driving through the city as well; this is a city with a high frequency of criminal activity.

![An MLO area laid out beneath an overpass, lined with a STOP-sign gate and shops](/images/taikenki/serverhoumon/RefloriaTown/mechanic.png)

Food and drinks have expiration dates set, and once they expire they vanish from your inventory.

As for resident behavior, when a fender-bender occurred we saw the other party stop their vehicle and apologize. There were also several residents who responded when spoken to.

## Economy & Jobs

At the Job Center inside City Hall (address 506 on the map), we confirmed the following five jobs.

![The interior of City Hall. A marble staircase, and a signboard pointing to MAYOR OFFICE / MEETING ROOM / VOTING ROOM / OFFICES (address 506)](/images/taikenki/serverhoumon/RefloriaTown/siyakusyojob.png)

- Hot dog vendor
- Garbage collector
- Bus driver
- Farmer
- Taxi

![The Job Center application menu, listing hot dog vendor, garbage collector, bus driver, farmer, and taxi — all of which you can apply for on the spot](/images/taikenki/serverhoumon/RefloriaTown/siyakusyojob2.png)

You can apply for any of them on the spot. City Hall's interior signage points to MAYOR OFFICE, MEETING ROOM, VOTING ROOM, and OFFICES, but how these are actually operated we did not confirm at the time of our visit.

Beyond these, there are jobs such as mining, lumberjacking, and hunting.

There are many restaurants; at 2 a.m., 13 shops were open. As unique jobs beyond restaurants, we confirmed a cabaret club, a girls' bar, a pet shop, and a wedding hall. The pet shop also includes a store selling situation voice recordings. We confirmed five mechanic shops.

![An ad for situation voice recordings sold at the pet shop: "Pet Shop Voice," CV: a certain pet shop clerk, running time 00:40](/images/taikenki/serverhoumon/RefloriaTown/boisuhanbai.png)

## Managing Health, Food & Hydration

Health, food, and hydration are each managed as numeric values, recovered via food, drink, and medicine. The recovery amount is set per item.

At the pharmacy (Leaf Pharmacy, address 577), we confirmed the following prices and recovery amounts.

![The Leaf Pharmacy menu. Bandage ¥13,000 and others, with the price and recovery amount listed per item (address 577)](/images/taikenki/serverhoumon/RefloriaTown/yakkyokumenyu.png)

- Adhesive bandage: ¥13,000 (10% health recovery)
- Ointment: ¥26,000 (20% health recovery)
- Painkiller: ¥55,000 (35% health recovery)
- Bandage: ¥100,000 (30% health recovery + fully heals injuries)
- Leaf-in Jelly: ¥6,000 (35% food recovery)
- Leaf D: ¥6,000 (35% hydration recovery)

Restaurants have original menus set per shop. At a Japanese-style shop (Antsubaki), prices were set like this: Tsubaki-brand manju at ¥60,000 (40% health recovery), tempura udon at ¥44,000 (30% recovery), tricolor dango at ¥32,000 (25% recovery), and matcha at ¥18,000 (15% recovery). Beyond these, seafood bowls and ara-jiru soup are served.

![The menu at the Japanese-style shop "Antsubaki." Tsubaki-brand manju 40%, tempura udon 30%, tricolor dango 25%, matcha 15%, and more, each with a health-recovery rate](/images/taikenki/serverhoumon/RefloriaTown/insyokumenyu9.png)

Seasonal limited menus are also prepared, and during the Tanabata season a Tanabata Sweets Plate (¥15,000, 50% food recovery) and a Starry Sky Cocktail (¥15,000, 50% hydration recovery) were served.

![The Tanabata special menu. Tanabata Sweets Plate (50% food, ¥15,000) and Starry Sky Cocktail (50% hydration, ¥15,000)](/images/taikenki/serverhoumon/RefloriaTown/insyokumenyu0.png)

## Public-Safety Structure

We confirmed that the police and EMS (emergency medical) were active even during late-night hours.

As for criminal acts, all criminal activity is prohibited for the 15 minutes before and after a server restart. Because restarts are set for five times a day, this prohibited window occurs five times a day. Any restriction on the crime-allowed hours outside of these times, we did not confirm at the time of our visit.

As for wars between gangs, the days and times are designated, as described below.

## Crime & Gangs

We confirmed five gangs. Each one's territory is displayed color-coded on the map, with the districts divided mainly around downtown Los Santos.

![Gang territories displayed color-coded on the map. Districts in red, purple, yellow, green, and more are divided mainly around downtown Los Santos, with a landmark list (17/109) shown on the right](/images/taikenki/serverhoumon/RefloriaTown/gyanguiro.png)

### Founding Conditions

To found a gang, in addition to a BOSS and UNDERBOSS, you need five or more CAPO/MEMBERs. Applications are made in a dedicated Discord channel, stating the Discord name and in-game name of every member. After applying, there is an interview between the BOSS and the operators, and consultation on desired colors and equipment also takes place here. Gang outfits and mercenary outfits (with clear colors) must be prepared in advance. If the BOSS changes, another interview is held.

The maximum number of members was up to 13, but from June 15, 2026 it was expanded to up to 15.

For gangs with no actual activity, the operators check activity status and verify facts via logs. If a gang is judged not to be functioning as an organization, a warning is issued, and a second warning results in disbandment. In addition, a disbandment application from the BOSS, the member count falling below the founding conditions, or a confirmed malicious rule violation by a member are all grounds for disbandment. Even if the violation is by a single person, the entire organization can become subject to disbandment.

### Territory

Within a territory, you can raise loyalty by selling drugs to NPCs or by spraying your own gang's name on walls. It is also possible to collect protection money from unmanned shops and the like within the territory. Player-run shops are excluded.

### Wars

War days are set for Tuesday, Friday, and Sunday, from 21:30 to 23:30. Players wearing gang clothing during these hours are judged to be participating in the war and become valid combat targets. Gangs not participating in a war are required to post in the "war non-participation application" on Discord.

The main restrictions during a war are as follows.

- If you die, gang activity (combat, drug sales, etc.) is prohibited for 10 minutes after revival
- If you are arrested, gang activity is prohibited for 10 minutes after release from the PD
- If you take off your gang clothing, gang activity is also prohibited for 10 minutes
- Alliances between gangs are prohibited
- ROB (robbery) between gangs killed in a war is permitted, but ROB outside of a war is prohibited
- Deliberately killing NPCs during a war is prohibited
- Smoke customization on the windows of vehicles used in a war is prohibited

During the gang-activity prohibition period, you are required to take off your gang clothing and move around in a vehicle whose color is unrelated to the gang.

## Crafting & Economic Base

The recycling center ("risasen") is along the Great Ocean Highway in Paleto Bay.

The recycling center uses a room system, and you select a room when entering. Room A is a permanently open shared room that anyone, in any number, can enter, while Room B and beyond have a cap of 5 users. Each room can be set to public or password-protected, and if you set a password, you can work only among your own group.

![The recycling-room selection screen. Rooms range from Room A (a shared room anyone in any number can enter) to Room K (1/5 users, password-protected)](/images/taikenki/serverhoumon/RefloriaTown/recyclecenter4.png)

The workflow is to enter a room, gather materials with the "mind's eye" (interact action), then carry them to the NPC at the back to exchange them for a recycle box. Using this recycle box then dispenses its contents.

![The interior of the recycling center's warehouse. An NPC stands at the back, and the top right shows the progress display "Recycle Lv1/30, XP86/300, work +200"](/images/taikenki/serverhoumon/RefloriaTown/recyclecenter.png)

![Examining a wooden crate at "searching (59%)." The scene of gathering materials with the mind's eye](/images/taikenki/serverhoumon/RefloriaTown/recyclecenter2.png)

![The "material exchange" menu of the NPC at the back, listing exchanges of 1, 10, 50, and 100 materials](/images/taikenki/serverhoumon/RefloriaTown/recyclecenter3.png)

![A recycle box (200g 2x) in the inventory. Using it dispenses the contents](/images/taikenki/serverhoumon/RefloriaTown/recyclebox.png)

Recycling has a level system, with a cap of level 30. Each work action adds 200 XP, and reaching level 2 from level 1 required 300 XP.

The buyback system functions, and we saw residents recruiting for material buybacks on the in-game SNS.

The weapon-crafting system, car-parts production, and supplying materials to mechanics, we did not confirm at the time of our visit.

## Actually Trying Hunting

Of the unattended jobs, I actually tried hunting. To start hunting you need to buy a bow, so an initial cost is incurred at the start. The bow has a scope, and you look through it to aim at animals. A "0/1" progress counter is shown on screen so you can see the status of your target hunt.

![Taking aim with a bow at the roadside in the Paleto Forest. A "0/1" progress counter is shown on the left of the screen](/images/taikenki/serverhoumon/RefloriaTown/kari.png)

![Looking through the bow's scope to aim at an animal in the forest. The distance scale and the "0/1" counter are visible](/images/taikenki/serverhoumon/RefloriaTown/kari2.png)

The animals you take down are brought to a meat-processing plant. The plant is in Paleto Bay (address 3013), and by handing them to the NPC they are processed into meat. The flow is then to sell this for profit.

![The meat-processing plant in Paleto Bay (address 3013). An NPC in an apron stands in front of the loading entrance](/images/taikenki/serverhoumon/RefloriaTown/syokunikukakou.png)

Because the structure has you pay the initial cost up front, your balance starts in the negative until you recoup the price of the bow. On the other hand, the per-unit price once you reach processing and selling is high, and the more you keep hunting, the smaller the weight of the initial cost becomes.

## Character Creation & Beginner Guidance

The starting point is Legion (Legion Square), and there is a spot there where you can do character creation. If you don't like the result of your character creation, you can also get cosmetic surgery afterward.

Character creation adopts a genetics system: first you select the faces of the father and mother each by ID, then use a blend slider to decide how much to resemble each parent. Skin color is also inherited from both parents, and you can adjust the blend ratio for the father and mother respectively.

![Binco's "genetics" character-creation screen. You select the father (ID:21) and mother (ID:33) faces and adjust the resemblance with a blend slider. On the left are items such as genetics, facial features, hairstyle, and skin imperfections](/images/taikenki/serverhoumon/RefloriaTown/kyarameiku.png)

The adjustable items span a wide range: genetics, facial features, hairstyle, skin imperfections, beard, eyebrows, aging, makeup, blush, skin texture, tan lines, lipstick, moles/freckles, chest hair, and more. Upper-body, lower-body, and accessory outfits can also be set on the same screen, and "save as outfit" is possible as well.

Beginner guidance is provided.

## Status Marker

Active (as of July 2026)

---

Sources & References

- Refloria Town official Discord and rulebook
- GTA6 FEED's observations during the visit (July 2026)

This article was independently reported and recorded by GTA6 FEED and has no relationship with the Refloria Town operators, Rockstar Games, or Take-Two Interactive. The content is information as of the time of the visit, and the server's specifications and rules are subject to change.`,
};

// ---------------------------------------------------------------------------
//  訪問記 #3 Lien City
// ---------------------------------------------------------------------------
const lienCity: FieldNote = {
  slug: 'lien-city',
  category: 'visit-note',
  title: 'Lien Cityとは？同接326人・初期資金1000万円の日本語RPサーバーを訪問',
  titleEn:
    'What Is Lien City? A Visit to a Japanese RP Server with 326 Concurrent Players and 10M Starting Funds',
  date: '2026-07-20',
  excerpt:
    '日本語FiveMロールプレイサーバー「Lien City」をGTA6 FEEDが取材。同接326人、ホワイトリスト制、初期資金1000万円と車両600万円の関係、石掘りの全工程と収支、死亡ペナルティなど観測できた事実を記録。',
  excerptEn:
    'GTA6 FEED visits Lien City, a Japanese FiveM roleplay server — 326 concurrent players, a whitelist system, 10M starting funds against a 6M car, the full stone-mining pipeline and its returns, and death penalties, recorded as observed.',
  image: '/images/taikenki/serverhoumon/Liencity/insyokuten.png',
  icon: '📍',
  seoTitle: 'Lien Cityとは？同接326人・初期資金1000万円の日本語RPサーバーを訪問｜GTA6 FEED',
  seoDesc:
    '日本語FiveMロールプレイサーバー「Lien City（リアンシティ）」をGTA6 FEEDが取材。ホワイトリスト制、同接326人、市役所ジョブ、初期資金1000万円と600万円の車両購入、iFakによる自己止血と市外死亡150万円のペナルティ、石掘り（採掘・石洗い・砂金採り・宝石加工）の全工程と5時間30分で1000万円という収支を記録。',
  seoTitleEn:
    'What Is Lien City? A Japanese RP FiveM Server with 326 Concurrent Players and 10M Starting Funds | GTA6 FEED',
  seoDescEn:
    "GTA6 FEED's report on Lien City, a Japanese FiveM roleplay server — a whitelist system, 326 concurrent players, city hall jobs, 10M starting funds against a 6M car purchase, self-treatment with an iFak and a 1.5M penalty for dying outside the city, plus the full stone-mining pipeline (mining, washing, gold panning, gem processing) yielding 10M in 5.5 hours.",
  body: `![夕暮れのLien City。バンブーの柱と2階テラスを備えた飲食店「Johnny's Bar」が通り沿いに建つ](/images/taikenki/serverhoumon/Liencity/insyokuten.png)

Lien City（リアンシティ）は、日本語のFiveMロールプレイサーバーである。ホワイトリスト制を採用し、カジュアルなGTARPを掲げる。GTA6 FEEDが取材し、観測できた事実を記録する。以下、確認した確定情報と、確認できていない未確認項目を分けて記す。

## 基本情報

- 接続方法：公式Discordでホワイトリスト申請を行って参加する
- 同時接続数：326人（2026年7月20日 22時時点・観測値）。ただし観測日は3連休かつ夏休み期間にあたる
- サーバー再起動：深夜2時と朝8時に再起動を確認。他の時間帯は未確認
- サーバー告知では、犯罪コンテンツ30種とホワイトジョブ多数が挙げられている

![Lien Cityの全体マップ。右側にアラモ湖アウトフィッターズ・各種釣具店／魚市場・本署・ガレージ・Bank・Barber・Clothing Store・Recycle Centerなどのランドマーク一覧（1/49）が並ぶ](/images/taikenki/serverhoumon/Liencity/map.png)

## 街の雰囲気

服飾の選択肢が多く、プレイヤーの服装にばらつきが見られた。

![服装のカスタマイズ画面。スカーフ・チェーン、ジャケット（15/2036）、シャツ（14/1044）、ボディアーマー、バッグ・パラシュート、腕・手、脚、靴、デカールなど部位ごとに多数のDrawableを選択できる](/images/taikenki/serverhoumon/Liencity/kyarameikugamen.png)

税金制度が導入されている。詳細な税率や徴収の仕組みは取材時点では確認していない。

## 経済・職業

市役所のジョブとして、ごみ収集、タクシー、ホットドッグを確認した。このほか窓清掃、狩猟、石掘り、木こりがMapで確認できた。

![市役所の求人センター。ゴミ収集員・タクシー運転手・ホットドッグ屋台の3職種が並び、それぞれ「この職に応募する」と表示されている](/images/taikenki/serverhoumon/Liencity/siyakusyojob.png)

飲食店は4店舗、たばこ屋を1店舗確認した。メカニックは3か所。車両ディーラーは普通車と高級車が分かれており、航空機ディーラーも存在する。

![夕暮れの車両ディーラー「Premium Deluxe Motorsport」の外観](/images/taikenki/serverhoumon/Liencity/dealer2.png)

![コンビニの商品一覧。ハンバーガー ¥100,000、飲料水 ¥100,000、無線機 ¥380、FITBIT ¥320、SKATEBOARD ¥50,000、ブームボックス ¥30,000、衣装バッグ、タバコが並ぶ](/images/taikenki/serverhoumon/Liencity/konbinidekaerumono.png)

## 初期資金と最初の動き

初心者案内はDiscordの専用チャンネルから申請する方式になっている。

参加直後にまず案内されるのが銀行口座の開設で、口座には初期資金として1000万円が入っている。この資金で普通車ディーラーから車両を購入する流れになる。

![銀行「OKOK BANKING」の設定画面。口座番号の変更（手数料¥200・口座番号は「OK」で始まる・最大10文字）と暗証番号の変更（手数料¥200・4文字・数字のみ）が並ぶ](/images/taikenki/serverhoumon/Liencity/ginkoukouza.png)

取材では、ディーラーに勧められた車両を600万円で購入した。

![普通車ディーラーの購入画面。SUV HABANERO 6,000,000¥ に対し「SUV Habanero を 6,000,000¥ で購入しますか？」の確認ダイアログが表示されている](/images/taikenki/serverhoumon/Liencity/dealer.png)

初期資金1000万円に対して車両が600万円という比率になるため、最初の車選びが以降の資金繰りを左右する構造になっている。

## 治安構造

警察は深夜1時30分頃、EMS（救急）は深夜3時30分頃に稼働していることを確認した。EMSのほかに個人医も存在する。

![救助要請の画面表示。「EMS 1名 / 個人医 3名」「[R]…… 個人医へ救助信号（長押し）」「EMSへ送信済み（再送 04分05秒）」と表示されている](/images/taikenki/serverhoumon/Liencity/EMSwoyobu.png)

取材中、車両で落下して負傷し、出血によりダウンする事態が発生した。ダウン時にはシステムメッセージが表示され、iFak（応急処置キット）を所持していれば自力で止血できる旨が示された。負傷には出血の概念があり、対応するアイテムを携行していれば自己処置が可能な仕様になっている。

死亡時にはペナルティとして費用が発生する。市外で死亡した場合、150万円が徴収された。初期資金が1000万円であることを踏まえると、序盤の1回の死亡が資金に与える影響は小さくない。

犯罪行為については、サーバー再起動の前後15分間が禁止時間として設定されている。これ以外の時間帯における制限は取材時点では確認していない。

## 犯罪・ギャング

ギャングの数、応募方法・加入条件については、取材時点では確認していない。

## クラフト・経済基盤

リサイクルセンター（リサセン）が存在する。武器クラフトの仕組みも存在するが、詳細な手順は未確認である。車パーツ製作やメカニックへの素材供給については確認していない。

買い取り制度は機能している。ただし取材中、現在は買い取り価格が低く抑えられているという話を住人から聞いた。これは伝聞であり、相場の実態は未確認である。

## 実際に石掘りを体験

住人から石掘りが収入源になるという話を聞き、実際に試した。取材時、街では石掘りに従事するプレイヤーが多数見られた。

![渓谷の川で作業する複数のプレイヤー。5017番地付近の砂金採りポイント](/images/taikenki/serverhoumon/Liencity/sakintori.png)

石掘りは複数の工程に分かれており、それぞれ場所が異なる。

- 石掘り：3054番地の下あたり
- 石洗い：5000番地の上、および7352番地の上
- 砂金採り：5017番地
- 宝石加工：9306番地

![夜の採石場（Davis Quartz、3054番地付近）。岩壁沿いに重機が停まっている](/images/taikenki/serverhoumon/Liencity/saisekijyo.png)

![坑内でドリルを使って採掘しているところ。画面下に「採掘中…」の進行バーが表示されている](/images/taikenki/serverhoumon/Liencity/mainingu.png)

![採掘の結果、「添加 2X STONE」として石を入手した表示](/images/taikenki/serverhoumon/Liencity/isigahoreta.png)

作業の特徴は、各工程がまとめて処理できる点にある。採取した石は一括で洗浄できる。砂金採りも宝石加工も同様にまとめて処理できる。

![水辺で「石を洗う（この水辺の範囲内）」を実行しているところ。画面下に「洗石中… x20」の進行バーが表示されている（7352番地付近）](/images/taikenki/serverhoumon/Liencity/isiarai.png)

![「一括処理の個数」ダイアログ。個数（最大20）のスライダーが20に設定されている](/images/taikenki/serverhoumon/Liencity/matometetoreru.png)

![川で砂金採りをする2人のプレイヤー。画面下に「砂金採り中… x20」の進行バーが表示されている（5017番地）](/images/taikenki/serverhoumon/Liencity/sakinori2.png)

なお、砂金採りを終えた時点でインベントリを確認すると石が残っており、所持重量を圧迫していた。このため別地点で再度洗浄する必要が生じた。

![インベントリの中身。UNCUT DIAMOND 44x、UNCUT EMERALD 25x、UNCUT SAPPHIRE 66x、UNCUT RUBY 79x、SILVER ORE 50x、GOLD ORE 41x、GOLD INGOT、EMERALD 28x、ガラス、ドリルビットなどが並ぶ](/images/taikenki/serverhoumon/Liencity/jewel.png)

工程を一巡させ、指輪の製作に至るまでに5時間30分を要した。

![「DANGER HIGH TEMPERATURE AREA」の看板が立つ溶鉱炉エリア。複数のプレイヤーが作業している（9306番地付近）](/images/taikenki/serverhoumon/Liencity/youkouro.png)

![宝石加工の工房。複数のプレイヤーが作業台に並び、画面下に「加工中 Emerald Ring (Silver) x20」の進行バーが表示されている](/images/taikenki/serverhoumon/Liencity/housekikakou.png)

完成した指輪を質屋に持ち込んだところ、買い取り対象となったのはダイヤモンドリングのみだった。ダイヤモンドリング以外の指輪は、加工に時間を要したものの売却先が見つからなかった。

![質屋の買い取り画面。「Diamond Ring 売却価格 $200000」のみが表示されている](/images/taikenki/serverhoumon/Liencity/sitiya.png)

ダイヤモンドリングは50個を売却し、1000万円となった。

![質屋のメニュー（アイテムを売る／アイテムを溶解）。画面右上の所持金が ¥10074975 と表示されている](/images/taikenki/serverhoumon/Liencity/sitiya2.png)

作業時間5時間30分に対する収入が1000万円という計算になるが、これは売却できなかった指輪の加工時間を含んだ数字である。ダイヤモンドリングに絞って加工した場合の効率は、取材では確認していない。

## 六法・ルールの特徴

六法（ルールブック）で確認できた規定として、サーバー再起動の前後15分間における犯罪行為の禁止がある。その他の規定については取材時点では確認していない。

## 状態マーカー

稼働中（2026年7月時点）

---

出典・参考

- Lien City 公式Discord・サーバー告知
- GTA6 FEEDによる取材時の観測（2026年7月）

本記事はGTA6 FEEDが独自に取材・記録したものであり、Lien City運営、Rockstar Games、Take-Two Interactiveのいずれとも関係はない。記載内容は取材時点の情報であり、サーバーの仕様・ルールは変更される可能性がある。`,
  bodyEn: `![Lien City at dusk. The restaurant "Johnny's Bar," with bamboo columns and a second-floor terrace, stands along the street](/images/taikenki/serverhoumon/Liencity/insyokuten.png)

Lien City is a Japanese-language FiveM roleplay server. It uses a whitelist system and sets out a casual GTARP direction. GTA6 FEED reported on it and records the facts we were able to observe. Below, we separate the confirmed information we verified from the items we could not confirm.

## Basic Information

- How to join: apply for the whitelist on the official Discord to participate
- Concurrent players: 326 (observed at 22:00 on July 20, 2026). Note that the observation day fell on a three-day weekend and within the summer holiday period
- Server restarts: we confirmed restarts at 2 a.m. and 8 a.m. Other time slots are unconfirmed
- The server's announcements list 30 kinds of crime content and numerous white-collar jobs

![The full map of Lien City. On the right is a landmark list (1/49) including Alamo Lake Outfitters, various tackle shops and fish markets, the main police station, garages, Bank, Barber, Clothing Store, and Recycle Center](/images/taikenki/serverhoumon/Liencity/map.png)

## The Feel of the City

There are many clothing options, and variation was visible in players' outfits.

![The clothing customization screen. Numerous drawables can be selected per body part — scarf/chain, jacket (15/2036), shirt (14/1044), body armor, bag/parachute, arms/hands, legs, shoes, and decals](/images/taikenki/serverhoumon/Liencity/kyarameikugamen.png)

A tax system is in place. The detailed tax rates and collection mechanism we did not confirm at the time of our visit.

## Economy & Jobs

As City Hall jobs, we confirmed garbage collection, taxi, and hot dog. Beyond these, window cleaning, hunting, stone mining, and lumberjacking could be confirmed on the map.

![The job center at City Hall. Three roles are listed — garbage collector, taxi driver, and hot dog stand — each showing "apply for this job"](/images/taikenki/serverhoumon/Liencity/siyakusyojob.png)

We confirmed 4 restaurants and 1 tobacco shop. There are 3 mechanics. The vehicle dealers are split between standard cars and luxury cars, and an aircraft dealer also exists.

![The exterior of the vehicle dealer "Premium Deluxe Motorsport" at dusk](/images/taikenki/serverhoumon/Liencity/dealer2.png)

![The convenience store's product list. Hamburger ¥100,000, drinking water ¥100,000, radio ¥380, FITBIT ¥320, SKATEBOARD ¥50,000, boombox ¥30,000, clothing bag, and cigarettes](/images/taikenki/serverhoumon/Liencity/konbinidekaerumono.png)

## Starting Funds and the First Moves

Beginner guidance is applied for from a dedicated channel on Discord.

The first thing you are guided through right after joining is opening a bank account, which comes with 10 million yen as starting funds. The flow is then to buy a vehicle from the standard car dealer with these funds.

![The settings screen of the bank "OKOK BANKING." Changing the account number (¥200 fee, account numbers start with "OK," max 10 characters) and changing the PIN (¥200 fee, 4 characters, digits only)](/images/taikenki/serverhoumon/Liencity/ginkoukouza.png)

During our visit, I bought the vehicle recommended by the dealer for 6 million yen.

![The purchase screen at the standard car dealer. Against the SUV HABANERO at 6,000,000¥, a confirmation dialog asks "Purchase the SUV Habanero for 6,000,000¥?"](/images/taikenki/serverhoumon/Liencity/dealer.png)

Because the ratio works out to a 6-million-yen vehicle against 10 million yen in starting funds, the structure is such that your first car choice governs your cash flow from then on.

## Public-Safety Structure

We confirmed that the police were active around 1:30 a.m. and EMS (emergency medical) around 3:30 a.m. Besides EMS, private doctors also exist.

![The rescue-request display. It shows "EMS: 1 / private doctors: 3," "[R]…… rescue signal to a private doctor (hold)," and "Sent to EMS (resend in 04:05)"](/images/taikenki/serverhoumon/Liencity/EMSwoyobu.png)

During our visit, I fell with a vehicle, was injured, and went down from bleeding. When downed, a system message appeared indicating that if you carry an iFak (first-aid kit) you can stop the bleeding yourself. Injuries have a bleeding concept, and the design allows self-treatment as long as you carry the corresponding item.

Dying incurs a cost as a penalty. When I died outside the city, 1.5 million yen was collected. Given that starting funds are 10 million yen, the impact of a single early death on your finances is not small.

As for criminal acts, the 15 minutes before and after a server restart are set as prohibited time. Any restriction outside these hours we did not confirm at the time of our visit.

## Crime & Gangs

The number of gangs, and the application methods and conditions for joining, we did not confirm at the time of our visit.

## Crafting & Economic Base

A recycling center ("risasen") exists. A weapon-crafting system also exists, but the detailed procedure is unconfirmed. Car-parts production and supplying materials to mechanics we did not confirm.

The buyback system functions. However, during our visit we heard from a resident that buyback prices are currently kept low. This is hearsay, and the actual state of the market is unconfirmed.

## Actually Trying Stone Mining

After hearing from a resident that stone mining is a source of income, I actually tried it. At the time of our visit, many players around the city were seen engaged in stone mining.

![Several players working in a canyon river. The gold-panning point near address 5017](/images/taikenki/serverhoumon/Liencity/sakintori.png)

Stone mining is divided into several stages, each in a different location.

- Stone mining: around below address 3054
- Stone washing: above address 5000, and above address 7352
- Gold panning: address 5017
- Gem processing: address 9306

![The quarry at night (Davis Quartz, near address 3054). Heavy machinery is parked along the rock face](/images/taikenki/serverhoumon/Liencity/saisekijyo.png)

![Mining with a drill inside the pit. A "mining…" progress bar is shown at the bottom of the screen](/images/taikenki/serverhoumon/Liencity/mainingu.png)

![The result of mining: a display showing stone obtained as "added 2X STONE"](/images/taikenki/serverhoumon/Liencity/isigahoreta.png)

The characteristic of the work is that each stage can be processed in bulk. Mined stones can be washed all at once. Gold panning and gem processing can likewise be processed in bulk.

![Executing "wash stones (within this waterside area)" at the water's edge. A "washing stones… x20" progress bar is shown at the bottom of the screen (near address 7352)](/images/taikenki/serverhoumon/Liencity/isiarai.png)

![The "bulk processing quantity" dialog. The quantity slider (max 20) is set to 20](/images/taikenki/serverhoumon/Liencity/matometetoreru.png)

![Two players panning for gold in the river. A "panning for gold… x20" progress bar is shown at the bottom of the screen (address 5017)](/images/taikenki/serverhoumon/Liencity/sakinori2.png)

Note that when I checked my inventory after finishing gold panning, stones remained and were weighing down my carry capacity. Because of this, I had to wash them again at a different location.

![The contents of the inventory. UNCUT DIAMOND 44x, UNCUT EMERALD 25x, UNCUT SAPPHIRE 66x, UNCUT RUBY 79x, SILVER ORE 50x, GOLD ORE 41x, GOLD INGOT, EMERALD 28x, glass, drill bits, and more](/images/taikenki/serverhoumon/Liencity/jewel.png)

Running the pipeline through one full cycle, it took 5 hours and 30 minutes to reach the production of rings.

![The smelting-furnace area with a "DANGER HIGH TEMPERATURE AREA" sign. Several players are at work (near address 9306)](/images/taikenki/serverhoumon/Liencity/youkouro.png)

![The gem-processing workshop. Several players line up at the workbenches, and a "processing Emerald Ring (Silver) x20" progress bar is shown at the bottom of the screen](/images/taikenki/serverhoumon/Liencity/housekikakou.png)

When I brought the finished rings to the pawn shop, the only ones eligible for buyback were diamond rings. Rings other than diamond rings, despite taking time to process, had no buyer to be found.

![The pawn shop's buyback screen. Only "Diamond Ring, sale price $200000" is displayed](/images/taikenki/serverhoumon/Liencity/sitiya.png)

I sold 50 diamond rings, which came to 10 million yen.

![The pawn shop menu (sell items / melt down items). The cash on hand at the top right shows ¥10074975](/images/taikenki/serverhoumon/Liencity/sitiya2.png)

This works out to 10 million yen of income for 5 hours and 30 minutes of work, but that figure includes the processing time for rings that could not be sold. The efficiency if you focused on diamond rings alone, we did not confirm during our visit.

## Rulebook Features

As a provision we could confirm in the rulebook, there is the prohibition of criminal acts for the 15 minutes before and after a server restart. Other provisions we did not confirm at the time of our visit.

## Status Marker

Active (as of July 2026)

---

Sources & References

- Lien City official Discord and server announcements
- GTA6 FEED's observations during the visit (July 2026)

This article was independently reported and recorded by GTA6 FEED and has no relationship with the Lien City operators, Rockstar Games, or Take-Two Interactive. The content is information as of the time of the visit, and the server's specifications and rules are subject to change.`,
};

/** 新しい順に並べる（配列の先頭が最新）。#3 以降はここに足す。 */
export const fieldNotes: FieldNote[] = [
  devDiary3,
  devDiary2,
  devDiary1,
  lienCity,
  refloriaTown,
  heliosCity,
];

/** slug から体験記を解決（SSR/CSR 共通）。 */
export function getFieldNoteBySlug(slug?: string): FieldNote | undefined {
  return slug ? fieldNotes.find((n) => n.slug === slug) : undefined;
}
