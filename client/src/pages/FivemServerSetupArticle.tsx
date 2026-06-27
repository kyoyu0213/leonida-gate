import { Server, Megaphone, Compass } from 'lucide-react';
import ArticleLayout from '@/components/ArticleLayout';

const TITLE =
  'FiveMサーバーの立て方──完全初心者がローカルテストサーバーを起動するまでの8ステップ';

// 本文は fivem-server-setup-basics.md の内容をそのまま使用（テキストは改変なし）。
// fivemservertatekata フォルダの画像を各手順に挿入している。
const BODY = `![FiveMサーバーの立て方](/images/fivemservertatekata/eyecatch.png)

FiveMは、PC版の『グランド・セフト・オートV（GTA5）』を使って、自分専用のマルチプレイサーバーを構築できる改造フレームワークである。日本国内のGTAロールプレイ（GTARP）人気を支えているのもこのFiveMであり、「自分でもサーバーを立ててみたい」という入口に立つ人は年々増えている。

ただし、サーバー構築は最初の一歩でつまずきやすい。本記事は、完全な初心者が「自分だけが入れるローカルテストサーバー」を起動し、実際に接続するところまでを8ステップで解説する。いきなり公開サーバーやESX/QBCoreのような大型フレームワークを目指すのではなく、まず最小構成で動かすことを目標とする。これが遠回りに見えて、結局いちばん理解が早い。

---

## 最初に必ず確認すること──GTA5の「Edition」を間違えると動かない

2026年現在、PC版GTA5には二つのEditionが存在する。ここを取り違えると、何時間かけてもFiveMが起動しないという事故が起きる。最初に押さえておきたい最重要ポイントである。

- GTA5 Legacy（旧来の版）
- GTA5 Enhanced（2025年に配信された強化版）

確定事実として、本記事執筆時点（2026年6月）のFiveMはLegacy Editionのみに対応しており、Enhanced Editionでは動作しない。FiveMをインストールする際は、Legacy側の \`GTA5.exe\` を指定する必要がある。

入手方法には注意点がある。Steamでは現在、Legacy単体は新規販売されておらず、Enhanced版を購入するとLegacy版も同梱される形になっている。つまり「Enhancedを買い、その中に含まれるLegacyをインストールして使う」という手順になる。Epic Games版でも同様に、ライブラリ内でLegacyを選んでインストールする。

なお、流動的な情報として補足しておく。Cfx.re（FiveMの開発元）は2026年3月18日に、Enhanced対応を開発中であり、コミュニティ向けの早期アクセスを今後数か月のうちに提供する予定だと公式に発表した。Legacyのサポートは今後も継続され、アップグレードは強制ではなく、LegacyとEnhancedのクライアントは同一サーバーで混在しない方針とされている。ただしこれはあくまで開発中の話であり、本記事の時点では「サーバーを立てるならLegacy」が正しい前提である。Enhanced対応の動向は今後の続報を待ちたい。

---

## 必要なものの一覧

ローカルテストサーバーを立てるために、最低限そろえておくものは次のとおり。

- GTA5 Legacy（PC版／Steam・Epicどちらでも可）
- FiveMクライアント（プレイ用。[fivem.net](https://fivem.net/) からインストール）
- FiveMサーバーアーティファクト（サーバー本体。後述）
- Cfx.reアカウント（フォーラムアカウント。キー取得とtxAdmin認証に使う）
- ライセンスキー（無料。後述）

このうち「サーバーアーティファクト」と「ライセンスキー」が初心者の二大関門になる。本記事では、その両方を最も詰まりにくい手順でたどる。

---

## サーバーの全体像をざっくり理解する

細かい仕組みを完璧に理解する必要はないが、構成要素のイメージだけ持っておくと、後の作業で迷わない。FiveMサーバーは大きく次の要素で動いている。

- FXServer（サーバー本体。サーバーを起動するアプリ本体にあたる）
- server-data（設定ファイルやリソース。サーバーの中身）
- txAdmin（FXServerに同梱されているWeb管理パネル。ブラウザからサーバーを操作できる）
- データベース（MySQL/MariaDB。最小構成のテストサーバーでは不要）

最初の段階では「ゲームサーバーを起動するアプリと、その設定一式」くらいの理解で十分である。データベースが必要になるのは、後でESXやQBCoreといった生活系フレームワークを導入する段階になってからだ。

---

## 立て方の方針──手動よりtxAdminを使う

サーバーの立て方には、\`server.cfg\` を手書きで編集していく「手動方式」と、Web管理パネルのtxAdminに任せる「txAdmin方式」がある。

![txAdmin（Web管理パネル）](/images/fivemservertatekata/txa-logo.png)

確定事実として、現在のFiveMサーバーアーティファクトにはtxAdminが標準で同梱されており、Cfx.re公式もtxAdmin経由のセットアップを案内している。txAdminには「レシピ（Recipe）」という仕組みがあり、初回セットアップ時に基本構成のテンプレートを選ぶだけで、必要なファイル一式（server-data）を自動でダウンロード・配置してくれる。手動方式で初心者が最も詰まりやすい「server-dataを別途入手して正しい場所に置く」工程を、まるごと省略できるのが大きい。

本記事ではtxAdmin方式を主軸に解説する。手動方式は仕組みの理解には役立つが、最初の一台を動かす目的なら遠回りになる。

---

## STEP1：サーバーアーティファクトをダウンロードする

サーバー本体（FXServer）を入手する。公式の配布先は次のページである。

- [runtime.fivem.net](https://runtime.fivem.net/)

ここから、推奨ビルド（recommended と記載されているもの）のWindows版アーティファクトをダウンロードする。最新版が常に安定とは限らないため、初回は推奨ビルドを選ぶのが無難だ。

![サーバーアーティファクトの配布ページ](/images/fivemservertatekata/artifactdownloadpage.png)

---

## STEP2：サーバー用フォルダを作って解凍する

わかりやすい場所にサーバー用のフォルダを用意する。例として以下のような構成にする。

\`\`\`
C:\\FXServer\\server
\`\`\`

ダウンロードしたアーティファクトを解凍し、その中身を \`C:\\FXServer\\server\` に入れる。\`FXServer.exe\` がこのフォルダ内にある状態になればよい。なお、server-dataフォルダは後ほどtxAdminのレシピが自動で用意するため、この段階で手動作成する必要はない。

![解凍したフォルダ内の FXServer.exe](/images/fivemservertatekata/FXServerexe.png)

---

## STEP3：ライセンスキーを取得する

FiveMサーバーはライセンスキー（サーバー登録キー）がないと起動しない。キーは無料で取得できる。

ここで一点、注意が必要だ。古い解説記事の多くは、キー発行サイト「Keymaster（keymaster.fivem.net）」で「New Server」を押す手順を案内している。しかし現在、Keymasterの新規キー登録機能は非推奨（Deprecated）となっており、キーの新規発行はCfx.re Portalへ移管されている。Keymaster上で「New server」を開くと、Portalを使うよう促す案内が表示される状態になっている。

![Keymaster（新規キー登録は非推奨）](/images/fivemservertatekata/keymaster.png)

そのため、キーの取得は次のPortalから行う。

- [portal.cfx.re](https://portal.cfx.re/)

![Cfx.re Portal のトップ](/images/fivemservertatekata/Portaltop.png)

手順は次のとおり。

1. Cfx.reアカウントでサインインする（アカウントがなければ先に作成する）
2. サーバー登録キー（Server Registration Keys）の項目へ進む
3. 新規作成（create）を選ぶ
4. サーバーの表示名（display name）を入力し、Generateを押す

![サーバー登録キーの発行（Generate）](/images/fivemservertatekata/GenerateServerRegistrationKey.png)

発行されたキーは \`cfxk_\` から始まる長い文字列になる。これはパスワードに準じる機密情報なので、SNSや公開リポジトリに貼らないこと。キーの漏えいが疑われる場合は、Portal上でそのキーを再生成（regenerate）できる。再生成後は、サーバー設定のキーも新しいものへ必ず更新する。

なお、既存キーの管理や閲覧はKeymaster側でも引き続き可能だが、新規発行はPortalを使うのが現行の正しい手順である。

---

## STEP4：FXServerを起動してtxAdminを開く

\`C:\\FXServer\\server\` フォルダ内の \`FXServer.exe\` をダブルクリックで起動する。黒いコンソール画面が立ち上がり、txAdminが起動する。コンソールには、ブラウザで開くためのリンクが表示される。通常は次のアドレスになる。

\`\`\`
localhost:40120
\`\`\`

ブラウザでこのアドレスを開く。コンソールにPIN（暗証番号）が表示されている場合は、それを認証画面に入力する。

![FXServer のコンソール画面](/images/fivemservertatekata/fxserver3.png)

---

## STEP5：Cfx.reアカウントを連携し、マスターアカウントを作る

txAdminの初回起動時は、セットアップウィザードが表示される。まずCfx.reアカウントとの連携を求められるので、画面の指示に従って認証する。これがtxAdminの管理者を識別する仕組みになる。

続けて、ログイン失敗時のバックアップ用パスワードを設定する。ここで作るマスターアカウントは最上位の権限を持つため、自分以外には共有しないのが鉄則である。スタッフを増やすときは、後から権限を絞った管理者アカウントを別途追加する。

---

## STEP6：レシピを選んでデプロイする

ウィザードでサーバー名を入力したあと、デプロイ方法（Deployment Type）を選ぶ。最初の一台なら、用意済みのテンプレートを使う「Popular Recipes」が最も簡単である。

最初のテストサーバーには、CFX Default や FiveM Basic といった基本レシピを選ぶ。ESXやQBCoreのレシピも選べるが、これらはデータベース設定や大量のリソースを伴うため、最小構成で動作確認を済ませてからにしたほうがよい。最初から生活系フレームワークを丸ごと入れると、ほぼ確実に動かなくなる。

レシピを選ぶと、txAdminが必要なファイル一式を自動でダウンロードし、server-dataを構築する。

---

## STEP7：ライセンスキーを入れてサーバーを起動する

ウィザードの途中で、STEP3で取得したライセンスキー（\`cfxk_\` で始まる文字列）の入力を求められる。前後に余計なスペースや引用符が入らないよう、キーだけを正確に貼り付ける。ここでのコピーミスは「ライセンスキーが指定されていない」系のエラーに直結する。

入力が終わったら、サーバーを起動（Save & Start Server）する。txAdminのダッシュボードでサーバーがオンラインになれば成功だ。

---

## STEP8：FiveMクライアントから接続する

最後に、実際にゲーム側から自分のサーバーへ入る。FiveMクライアントを起動し、\`F8\` キーを押してコンソールを開く。そこに次のコマンドを入力する。

\`\`\`
connect localhost
\`\`\`

![FiveM クライアントの F8 コンソール](/images/fivemservertatekata/FiveMf8console.png)

\`connect 127.0.0.1\` でもよい。ロード画面を経てゲーム内に入れれば、ローカルテストサーバーの起動は完了である。ここまでたどり着けば、FiveMサーバー構築の基礎は一通り体験できたことになる。

---

## よくある初心者エラーと対処

- 起動するがFiveMで入れない／GTAが落ちる：GTA5 EnhancedにFiveMを入れていないか確認する。FiveMはLegacy側の \`GTA5.exe\` を指定する必要がある
- 「ライセンスキーが指定されていない」系のエラー：キーのコピーミス、または余計なスペース・引用符の混入。\`cfxk_\` の文字列だけを正確に貼り直す
- キーが認証されない：キー文字列が正確か、同じキーを別のサーバーで同時に使っていないかを確認する。漏えいが疑われる場合はPortalでキーを再生成する
- 友人が入れない：ローカル接続では自分しか入れない。他者を入れるには、ゲーム用ポート（通常30120／TCP・UDP両方）の開放やポート転送が必要になる
- txAdminの画面が開かない：\`localhost:40120\` のポートが他のソフトと競合していないか、ファイアウォールでブロックされていないかを確認する

---

## 次のステップ

ローカルテストサーバーが動いたら、次は少しずつ機能を足していく段階に入る。おすすめの順序は次のとおり。

1. 管理メニューの導入（vMenuなど、プレイヤー向けの管理メニュー）
2. スポーン地点の固定（ログイン時に任意の座標へ出るようにする）
3. 車両やエモートの追加
4. マップ（MLO）の追加
5. ESX・QBCoreなどフレームワークの導入
6. VPSへの移行（友人や一般プレイヤーが常時入れる公開サーバー化）

近年は、AIコーディング支援を使って、フレームワークに依存しない軽量な独自リソース（standalone resource）を自作する流れも一般的になってきた。\`fxmanifest.lua\` とクライアント／サーバースクリプトの構造さえ理解すれば、スポーン制御や復活処理といった小さな機能は自分で組めるようになる。最初から巨大なフレームワークに飛び込むより、軽量サーバーで小さな自作リソースを動かすほうが、構造の理解は早く進む。

公開サーバーとして形になってきたら、プレイヤーを募る段階に進む。GTA6 FEEDのFiveM/GTARPカテゴリには[サーバー募集板](/servers)があり、完成したサーバーの宣伝に活用できる。まずは安定して動く一台を作り上げることが、その第一歩になる。

---

## 情報の信頼性と出典について

本記事の手順は、Cfx.re公式ドキュメントおよび各種ホスティング事業者の最新ガイド（2026年時点）を参照し、独自に検証したうえで構成している。記載した手順は確定情報だが、FiveMのバージョン更新により、画面表示や推奨ビルドの細部は変わる可能性がある。とくにEnhanced対応に関する記述は開発中の流動的な情報であり、今後変更されうる点に留意されたい。

主な参照元：

- Cfx.re Docs「Setting up a server using txAdmin」（docs.fivem.net）
- Cfx.re Portal／サーバー登録キーの発行（portal.cfx.re）
- Cfx.re公式サポート「How to create a server registration key for your FiveM/RedM server」（support.cfx.re）
- FiveMサーバーアーティファクト配布ページ（runtime.fivem.net）
- Cfx.re開発アップデート（GTA V Enhanced対応に関する2026年3月18日の発表）

本記事はファンによる解説であり、Rockstar Games、Take-Two Interactive、Cfx.reのいずれとも一切関係がない。`;

const TITLE_EN =
  'How to Set Up a FiveM Server: 8 Steps for a Complete Beginner to Launch a Local Test Server';

const BODY_EN = `![How to set up a FiveM server](/images/fivemservertatekata/eyecatch.png)

FiveM is a modding framework that lets you build your own multiplayer server using the PC version of "Grand Theft Auto V (GTA5)." It is FiveM that underpins the popularity of GTA roleplay (GTARP) in Japan, and the number of people standing at the entrance thinking "I want to try running a server myself" grows year by year.

That said, building a server is easy to stumble on at the very first step. This article explains, in eight steps, how a complete beginner can launch "a local test server that only you can join" and actually connect to it. Rather than aiming straight for a public server or a large framework like ESX/QBCore, the goal is to first get it running with a minimal setup. This looks like a detour, but in the end it is the fastest way to understand.

---

## What to Check First — Pick the Wrong GTA5 "Edition" and It Won't Work

As of 2026, there are two Editions of the PC version of GTA5. Mix these up and you can spend hours and FiveM still won't launch. This is the single most important point to nail down first.

- GTA5 Legacy (the older version)
- GTA5 Enhanced (the enhanced version distributed in 2025)

As a confirmed fact, the FiveM available at the time of writing (June 2026) supports only the Legacy Edition and does not work on the Enhanced Edition. When you install FiveM, you need to point it at the Legacy-side \`GTA5.exe\`.

There is a catch in how you obtain it. On Steam, Legacy is no longer sold on its own; buying the Enhanced version comes with the Legacy version bundled in. In other words, the procedure is "buy Enhanced, then install and use the Legacy included within it." On the Epic Games version as well, you select and install Legacy from within your library.

As a side note, here is some fluid information. Cfx.re (the developer of FiveM) officially announced on March 18, 2026 that Enhanced support is in development and that early access for the community is planned to be provided within the next few months. Support for Legacy will continue, upgrading is not mandatory, and the policy is that Legacy and Enhanced clients will not mix on the same server. However, this is all still in development; as of this article, "if you are setting up a server, use Legacy" is the correct premise. Let us wait for further news on Enhanced support.

---

## A List of What You Need

To set up a local test server, the bare minimum you should have ready is as follows.

- GTA5 Legacy (PC version / either Steam or Epic is fine)
- The FiveM client (for playing; install from [fivem.net](https://fivem.net/))
- The FiveM server artifact (the server itself; covered later)
- A Cfx.re account (the forum account; used for getting a key and for txAdmin authentication)
- A license key (free; covered later)

Of these, "the server artifact" and "the license key" are the two big hurdles for beginners. In this article, we walk through both of them via the procedure that is least likely to trip you up.

---

## Grasp the Big Picture of a Server, Roughly

You do not need to understand the fine mechanics perfectly, but holding just an image of the components keeps you from getting lost in later work. A FiveM server runs on, broadly, the following elements.

- FXServer (the server itself; this is the app that launches the server)
- server-data (config files and resources; the contents of the server)
- txAdmin (the web management panel bundled with FXServer; lets you operate the server from a browser)
- A database (MySQL/MariaDB; not needed for a minimal test server)

At the first stage, an understanding of "the app that launches the game server, plus its set of settings" is enough. A database becomes necessary only later, when you reach the stage of introducing a life-sim framework like ESX or QBCore.

---

## The Approach — Use txAdmin Rather Than Doing It by Hand

There are two ways to set up a server: the "manual method" of hand-editing \`server.cfg\`, and the "txAdmin method" of leaving it to the web management panel, txAdmin.

![txAdmin (web management panel)](/images/fivemservertatekata/txa-logo.png)

As a confirmed fact, the current FiveM server artifact comes with txAdmin bundled as standard, and Cfx.re officially recommends setup via txAdmin. txAdmin has a mechanism called a "Recipe": at first-time setup, you simply choose a template for a basic configuration, and it automatically downloads and places the whole set of necessary files (server-data) for you. The big win is that it lets you skip entirely the step where beginners get stuck most in the manual method — "obtaining server-data separately and placing it in the right location."

This article explains the txAdmin method as its main axis. The manual method is useful for understanding the mechanics, but it is a detour if your goal is to get your first server running.

---

## STEP1: Download the Server Artifact

Obtain the server itself (FXServer). The official distribution page is the following.

- [runtime.fivem.net](https://runtime.fivem.net/)

From here, download the Windows version of the recommended build (the one marked "recommended"). The latest version is not always the most stable, so choosing the recommended build for your first time is the safe bet.

![The server artifact distribution page](/images/fivemservertatekata/artifactdownloadpage.png)

---

## STEP2: Create a Server Folder and Extract Into It

Prepare a server folder in an easy-to-find location. As an example, use a structure like the following.

\`\`\`
C:\\FXServer\\server
\`\`\`

Extract the downloaded artifact and put its contents into \`C:\\FXServer\\server\`. You are fine once \`FXServer.exe\` is inside this folder. Note that the server-data folder will be prepared automatically later by txAdmin's recipe, so there is no need to create it by hand at this stage.

![FXServer.exe inside the extracted folder](/images/fivemservertatekata/FXServerexe.png)

---

## STEP3: Get a License Key

A FiveM server will not start without a license key (server registration key). The key can be obtained for free.

One point here requires caution. Many old explanatory articles guide you to press "New Server" on the key-issuing site "Keymaster (keymaster.fivem.net)." However, the new-key registration feature on Keymaster is now deprecated, and issuing new keys has been moved to the Cfx.re Portal. If you open "New server" on Keymaster, you get a notice prompting you to use the Portal.

![Keymaster (new key registration is deprecated)](/images/fivemservertatekata/keymaster.png)

For that reason, get the key from the following Portal.

- [portal.cfx.re](https://portal.cfx.re/)

![The top of the Cfx.re Portal](/images/fivemservertatekata/Portaltop.png)

The procedure is as follows.

1. Sign in with your Cfx.re account (if you do not have an account, create one first)
2. Go to the Server Registration Keys section
3. Choose create (new)
4. Enter the server's display name and press Generate

![Issuing a server registration key (Generate)](/images/fivemservertatekata/GenerateServerRegistrationKey.png)

The issued key is a long string beginning with \`cfxk_\`. This is confidential information on par with a password, so do not paste it on social media or public repositories. If you suspect the key has leaked, you can regenerate that key on the Portal. After regenerating, be sure to update the key in your server settings to the new one as well.

Note that managing and viewing existing keys is still possible on the Keymaster side, but using the Portal for new issuance is the current correct procedure.

---

## STEP4: Launch FXServer and Open txAdmin

Double-click \`FXServer.exe\` inside the \`C:\\FXServer\\server\` folder to launch it. A black console screen starts up, and txAdmin launches. The console shows a link for opening it in a browser. It is usually the following address.

\`\`\`
localhost:40120
\`\`\`

Open this address in a browser. If a PIN (passcode) is shown in the console, enter it on the authentication screen.

![The FXServer console screen](/images/fivemservertatekata/fxserver3.png)

---

## STEP5: Link Your Cfx.re Account and Create a Master Account

On txAdmin's first launch, a setup wizard appears. First you are asked to link your Cfx.re account, so authenticate by following the on-screen instructions. This is the mechanism by which txAdmin identifies its administrator.

Next, set a backup password for when login fails. The master account you create here holds the highest level of authority, so the iron rule is not to share it with anyone but yourself. When you add staff, separately add administrator accounts with restricted permissions later.

---

## STEP6: Choose a Recipe and Deploy

After entering the server name in the wizard, choose the Deployment Type. For your first server, the easiest option is "Popular Recipes," which uses ready-made templates.

For your first test server, choose a basic recipe like CFX Default or FiveM Basic. You can also choose ESX or QBCore recipes, but these come with database setup and a large number of resources, so it is better to finish confirming operation with a minimal setup first. If you load an entire life-sim framework from the start, it will almost certainly stop working.

When you choose a recipe, txAdmin automatically downloads the whole set of necessary files and builds the server-data.

---

## STEP7: Enter the License Key and Start the Server

Partway through the wizard, you are asked to enter the license key you obtained in STEP3 (the string beginning with \`cfxk_\`). Paste only the key, accurately, with no stray spaces or quotation marks before or after it. A copy mistake here leads directly to "license key not specified"–type errors.

Once you are done entering it, start the server (Save & Start Server). If the server goes online in txAdmin's dashboard, you have succeeded.

---

## STEP8: Connect from the FiveM Client

Finally, actually enter your own server from the game side. Launch the FiveM client, press the \`F8\` key to open the console, and enter the following command there.

\`\`\`
connect localhost
\`\`\`

![The FiveM client's F8 console](/images/fivemservertatekata/FiveMf8console.png)

\`connect 127.0.0.1\` also works. If you get into the game after the loading screen, launching the local test server is complete. Once you make it this far, you will have experienced the basics of FiveM server building from end to end.

---

## Common Beginner Errors and Fixes

- It launches but you cannot get in via FiveM / GTA crashes: Check whether you put FiveM into GTA5 Enhanced. FiveM needs you to point it at the Legacy-side \`GTA5.exe\`
- "License key not specified"–type errors: A copy mistake with the key, or stray spaces / quotation marks mixed in. Re-paste just the \`cfxk_\` string, accurately
- The key is not authenticated: Check that the key string is correct and that you are not using the same key on another server at the same time. If you suspect a leak, regenerate the key on the Portal
- A friend cannot get in: With a local connection, only you can get in. To let others in, you need to open the game port (usually 30120 / both TCP and UDP) or set up port forwarding
- The txAdmin screen will not open: Check whether the \`localhost:40120\` port conflicts with other software, or whether it is blocked by a firewall

---

## Next Steps

Once the local test server is running, you enter the stage of adding features little by little. The recommended order is as follows.

1. Introduce an admin menu (a player-facing admin menu such as vMenu)
2. Fix the spawn point (make it so you appear at arbitrary coordinates on login)
3. Add vehicles and emotes
4. Add maps (MLO)
5. Introduce a framework such as ESX or QBCore
6. Migrate to a VPS (turning it into a public server that friends and general players can join at any time)

In recent years, it has also become common to use AI coding assistance to create your own lightweight standalone resources that do not depend on a framework. Once you understand the structure of \`fxmanifest.lua\` and the client/server scripts, you can write small features like spawn control and respawn handling yourself. Rather than diving into a huge framework from the start, running small self-made resources on a lightweight server actually advances your understanding of the structure faster.

Once it takes shape as a public server, you move on to the stage of recruiting players. GTA6 FEED's FiveM/GTARP category has a [server recruitment board](/servers) you can use to advertise your finished server. Building one server that runs stably is the first step toward that.

---

## On the Reliability of the Information and Sources

The procedures in this article are composed by referring to Cfx.re's official documentation and the latest guides from various hosting providers (as of 2026), and by verifying them independently. The procedures described are confirmed information, but with FiveM version updates, the on-screen display and the details of the recommended build may change. In particular, the descriptions regarding Enhanced support are fluid, in-development information, so please be mindful that they may change going forward.

Main references:

- Cfx.re Docs "Setting up a server using txAdmin" (docs.fivem.net)
- Cfx.re Portal / issuing a server registration key (portal.cfx.re)
- Cfx.re official support "How to create a server registration key for your FiveM/RedM server" (support.cfx.re)
- The FiveM server artifact distribution page (runtime.fivem.net)
- Cfx.re development update (the March 18, 2026 announcement regarding GTA V Enhanced support)

This article is a fan explanation and has no relationship whatsoever with Rockstar Games, Take-Two Interactive, or Cfx.re.`;

export default function FivemServerSetupArticle() {
  return (
    <ArticleLayout
      seoTitle="FiveMサーバーの立て方｜初心者が8ステップでローカルテストサーバーを起動｜GTA6 FEED"
      seoDesc="FiveMサーバーの立て方を完全初心者向けに解説。GTA5 LegacyとtxAdmin・サーバーアーティファクト・ライセンスキー（Cfx.re Portal）の取得から、ローカルテストサーバーの起動・接続までを8ステップで紹介します。"
      seoTitleEn="How to Set Up a FiveM Server | 8 Steps for Beginners to Launch a Local Test Server | GTA6 FEED"
      seoDescEn="A beginner-friendly guide to setting up a FiveM server. From GTA5 Legacy and txAdmin to the server artifact and license key (Cfx.re Portal), through launching and connecting to a local test server — explained in 8 steps."
      title={TITLE}
      titleEn={TITLE_EN}
      icon="🛠️"
      date="2026-06-27"
      body={BODY}
      bodyEn={BODY_EN}
    >
      <div className="flex flex-wrap gap-3 mb-12">
        <a
          href="/servers"
          className="inline-flex items-center gap-2 px-4 h-10 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-sm rounded transition-colors"
        >
          <Megaphone size={14} /> FiveMサーバー募集板
        </a>
        <a
          href="/fivem-gtarp/server-guide"
          className="inline-flex items-center gap-2 px-4 h-10 bg-black hover:bg-zinc-800 text-white font-mono text-sm rounded transition-colors border border-white/20"
        >
          <Compass size={14} /> サーバーの選び方
        </a>
        <a
          href="/fivem-gtarp/how-to-install"
          className="inline-flex items-center gap-2 px-4 h-10 bg-black hover:bg-zinc-800 text-white font-mono text-sm rounded transition-colors border border-white/20"
        >
          <Server size={14} /> FiveMの導入方法
        </a>
      </div>
    </ArticleLayout>
  );
}
