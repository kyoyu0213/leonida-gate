import { Server, Megaphone, Compass } from 'lucide-react';
import ArticleLayout from '@/components/ArticleLayout';

const TITLE =
  'FiveMサーバーの立て方──完全初心者がローカルテストサーバーを起動するまでの8ステップ';

// 本文は fivem-server-setup-basics.md の内容をそのまま使用（テキストは改変なし）。
// fivemservertatekata フォルダの画像を各手順に挿入している。
const BODY = `FiveMは、PC版の『グランド・セフト・オートV（GTA5）』を使って、自分専用のマルチプレイサーバーを構築できる改造フレームワークである。日本国内のGTAロールプレイ（GTARP）人気を支えているのもこのFiveMであり、「自分でもサーバーを立ててみたい」という入口に立つ人は年々増えている。

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

export default function FivemServerSetupArticle() {
  return (
    <ArticleLayout
      seoTitle="FiveMサーバーの立て方｜初心者が8ステップでローカルテストサーバーを起動｜GTA6 FEED"
      seoDesc="FiveMサーバーの立て方を完全初心者向けに解説。GTA5 LegacyとtxAdmin・サーバーアーティファクト・ライセンスキー（Cfx.re Portal）の取得から、ローカルテストサーバーの起動・接続までを8ステップで紹介します。"
      title={TITLE}
      icon="🛠️"
      body={BODY}
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
