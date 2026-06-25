import { Server, Users, MessageSquare, Compass } from 'lucide-react';
import ArticleLayout from '@/components/ArticleLayout';

const TITLE = 'FiveMの導入方法｜GTA5でカスタムサーバーを遊ぶための手順を解説';

const BODY = `FiveMを始めるには、専用クライアントの導入が必要になる。仕組み上、FiveMはGTA5本体やGTAオンラインのファイルを書き換えないため、導入してもGTAオンライン側に影響は出ず、アンインストールも簡単だ。とはいえ初回はつまずきやすいポイントもある。GTA6 FEEDが、導入前に必要なものから手順、トラブル対処までを順を追って整理する。

![FiveM公式サイト](/images/FiveMhajimekata/FiveMofficial.png)

## 導入前に必要なもの

作業を始める前に、前提条件を確認しておきたい。必要なものは次のとおり。

- **動作環境**：Windows PCのみ。コンソール（PS5・Xboxなど）やMacでは利用できない。
- **正規版のGTA5（PC版）**：海賊版・改造版では動作せず、導入時の検証でも弾かれる。Steam、Epic Games Store、Rockstar Games Launcherのいずれで購入したものでもよい。
- **GTA5のエディション**：2026年時点では、FiveMが対応するのはLegacy Edition（レガシー版）のみ。Enhanced Edition（強化版）は現時点で非対応のため、Legacy Editionを用意する。Steamなどでは別項目として用意されているので、導入前に確認しておきたい。
- **ストレージの空き容量**：10GB程度以上が目安。読み込みの速さを考えるとSSDが望ましい。

![GTA5 Legacy Edition（Steamの例）](/images/FiveMhajimekata/GTA5Legacyedition.png)

## 導入の手順

前提が整ったら、次の流れで導入を進める。

**手順1：GTA5（Legacy Edition）を一度起動しておく。**
ストーリーモードを読み込んでから閉じれば十分だ。これにより、FiveMがゲーム本体（GTA5.exe）を検出しやすくなる。この一手間を省くと、後の検出でつまずくことがある。

**手順2：FiveM公式サイト（fivem.net）からクライアント（FiveM.exe）をダウンロードする。**
マルウェアや詐欺を避けるため、ダウンロードは必ず公式サイトからのみ行う。非公式サイトや「便利ツール」をうたう配布物には手を出さない。

![ダウンロードしたFiveM.exe](/images/FiveMhajimekata/FiveMexe.png)

**手順3：ダウンロードしたインストーラを実行する。**
権限による不具合を避けるため、管理者として実行するとよい。空のフォルダ内で実行するとそのフォルダに、そうでなければ標準で「%localappdata%\\FiveM」にインストールされる。利用規約が表示されたら同意して進める。

![FiveMのインストール](/images/FiveMhajimekata/install.png)

**手順4：GTA5の場所を指定する。**
多くの場合は自動で検出されるが、見つからない場合はファイル選択画面でGTA5.exeのあるフォルダを手動で指定する。このとき、ランチャーのexeではなく、ゲーム本体のGTA5.exe（Legacy版）を選ぶ点に注意する。FiveMがゲームデータの検証を一度行う。

**手順5：インストールが完了すると、デスクトップやスタートメニューにショートカットが作成される。**
FiveMを起動すると初回はファイルの更新が走るため、完了まで待つ。Cfx.reアカウントの連携を求められるが、これは任意でありスキップしてよい（連携するとお気に入り登録やサーバーへの評価ができる）。なお、GTA5本体の起動にはRockstarアカウントでのログインが必要になる。

![デスクトップに作成されたショートカット](/images/FiveMhajimekata/desktopicon.png)

**手順6：起動が済むとサーバーブラウザが表示される。**
ここから遊びたいサーバーを選んで接続する。サーバーによってはDiscord連携や審査が必要な場合もある。

![FiveMのサーバーブラウザ](/images/FiveMhajimekata/defaultgamen.png)

サーバーの探し方や選び方については、別の解説で詳しく触れている。

## アンチウイルスの除外設定

導入時につまずきやすいのが、アンチウイルスソフトによる検知である。

FiveMはMODを動作させる仕組み上、システムの深い部分に触れるため、Windows Defenderなどのアンチウイルスが誤検知（false positive）でブロックすることがある。これは多くの場合、実害のない誤検知である。

対策として、FiveMのインストールフォルダとFiveM.exeをアンチウイルスの除外（ホワイトリスト）に登録しておくとよい。インストール前に設定しておくと、ファイル破損などのトラブルも避けやすい。あわせて、Windowsファイアウォールでパブリック・プライベートの両ネットワークでFiveMの通信を許可しておくと、接続時のトラブルを減らせる。

## よくあるトラブルと対処

導入や起動でつまずいた場合、原因の多くは決まっている。代表的なものを挙げておく。

- **GTA5を検出できない場合**は、GTA5を一度起動してから再試行するか、手動でGTA5.exe（ランチャーexeではない）のあるフォルダを指定する。
- **起動時にクラッシュする場合**は、GTA5本体のファイル破損が原因のことが多い。Steam・Epic・Rockstarのランチャーでゲームファイルを検証し、グラフィックドライバを最新に更新してから再試行する。
- **カクつき・テクスチャ抜け・UIの不具合**は、キャッシュが原因のことが多い。「%localappdata%\\FiveM\\FiveM.app」内のキャッシュ関連フォルダを削除して再起動すると、自動で作り直される。
- **サーバーへの接続エラー**は、VPNやファイアウォールが通信を妨げている場合がある。ファイアウォールの許可設定を確認し、VPNを一時的に切って試すとよい。

## アンインストールは簡単

導入をためらう必要はない、という点も補足しておく。FiveMはGTA5本体のファイルを書き換えないため、アンインストールは手軽で、GTAオンライン側に影響を残さない。標準の場所にインストールした場合は「%localappdata%\\FiveM」フォルダを、空フォルダにポータブル導入した場合はそのフォルダを削除すれば済む。気軽に試せるのもFiveMの利点である。

## 導入できたら

導入が済めば、あとはサーバーを選んで街の住人になるだけだ。最初は審査の緩い初心者向けサーバーから始め、操作や雰囲気に慣れていくとよい。なお、シングルプレイ用のMOD（Menyoo、Script Hook V、.asiファイルなど）はFiveMと混在させると不具合の原因になるため、完全に分けて管理することを忘れないようにしたい。

## 免責事項

本記事は、FiveMの一般的な導入手順を初心者向けに整理したものである。FiveMはPC版GTA5（Legacy Edition）を前提とするコミュニティ製プラットフォームであり、正規に購入したGTA5が必要となる。GTA5 Enhanced Editionへの対応状況、クライアントの仕様、画面表示や手順の細部は、アップデートにより変更される可能性があるため、導入時はFiveM公式サイト（fivem.net）および公式ドキュメントの最新情報を確認されたい。ダウンロードは必ず公式サイトからのみ行い、非公式の配布物は利用しないこと。本サイトはGTA6の非公式ファンコミュニティであり、Rockstar Games / Take-Twoとは一切関係しない。`;

const TITLE_EN = 'How to Install FiveM | A Step-by-Step Guide to Playing Custom Servers on GTA5';

const BODY_EN = `To get started with FiveM, you need to install its dedicated client. By design, FiveM does not modify the files of GTA5 itself or GTA Online, so installing it has no effect on the GTA Online side, and uninstalling is easy. That said, there are points where you can stumble on your first try. GTA6 FEED walks you through everything in order, from what you need before installing, to the steps, to troubleshooting.

![The FiveM official site](/images/FiveMhajimekata/FiveMofficial.png)

## What You Need Before Installing

Before you begin, it is worth checking the prerequisites. Here is what you need.

- **Operating environment**: Windows PC only. It cannot be used on consoles (PS5, Xbox, and so on) or on Mac.
- **A legitimate copy of GTA5 (PC version)**: It will not run on pirated or modified copies, and these are also rejected by the verification during installation. A copy purchased through Steam, the Epic Games Store, or the Rockstar Games Launcher is all fine.
- **GTA5 edition**: As of 2026, FiveM only supports the Legacy Edition. The Enhanced Edition is currently unsupported, so prepare the Legacy Edition. On platforms like Steam it is offered as a separate item, so it is worth confirming before installing.
- **Free storage space**: A guideline is around 10GB or more. For faster loading, an SSD is preferable.

![GTA5 Legacy Edition (Steam example)](/images/FiveMhajimekata/GTA5Legacyedition.png)

## Installation Steps

Once the prerequisites are in place, proceed with the installation in the following flow.

**Step 1: Launch GTA5 (Legacy Edition) once.**
It is enough to load Story Mode and then close it. This makes it easier for FiveM to detect the game itself (GTA5.exe). Skipping this small step can cause you to stumble at the later detection.

**Step 2: Download the client (FiveM.exe) from the FiveM official site (fivem.net).**
To avoid malware and scams, always download only from the official site. Do not touch unofficial sites or anything billed as a handy tool.

![The downloaded FiveM.exe](/images/FiveMhajimekata/FiveMexe.png)

**Step 3: Run the downloaded installer.**
To avoid issues caused by permissions, it is a good idea to run it as administrator. If you run it inside an empty folder it installs into that folder; otherwise it installs by default into %localappdata%\\FiveM. When the terms of service are shown, agree and proceed.

![Installing FiveM](/images/FiveMhajimekata/install.png)

**Step 4: Specify the location of GTA5.**
In most cases it is detected automatically, but if it is not found, manually specify the folder containing GTA5.exe in the file selection screen. At this point, be careful to choose the game itself, GTA5.exe (Legacy Edition), not the launcher exe. FiveM performs a verification of the game data once.

**Step 5: When installation is complete, a shortcut is created on the desktop and in the Start menu.**
When you launch FiveM, a file update runs on the first time, so wait until it finishes. You will be asked to link a Cfx.re account, but this is optional and you may skip it (linking lets you bookmark and rate servers). Note that launching GTA5 itself requires logging in with a Rockstar account.

![The shortcut created on the desktop](/images/FiveMhajimekata/desktopicon.png)

**Step 6: Once it has launched, the server browser is displayed.**
From here, choose the server you want to play on and connect. Depending on the server, Discord linking or screening may be required.

![The FiveM server browser](/images/FiveMhajimekata/defaultgamen.png)

We cover how to find and choose servers in detail in a separate guide.

## Antivirus Exclusion Settings

A common stumbling point during installation is detection by antivirus software.

Because FiveM touches deep parts of the system in order to run MODs, antivirus software such as Windows Defender may block it as a false positive. In most cases this is a harmless false positive.

As a countermeasure, it is a good idea to register FiveM's installation folder and FiveM.exe in your antivirus exclusions (whitelist). Setting this up before installing also helps you avoid trouble such as file corruption. In addition, allowing FiveM's communication in the Windows Firewall on both public and private networks reduces connection trouble.

## Common Problems and Solutions

When you stumble during installation or launch, the cause is often one of a few. Here are the typical ones.

- **If GTA5 cannot be detected**, launch GTA5 once and try again, or manually specify the folder containing GTA5.exe (not the launcher exe).
- **If it crashes on launch**, the cause is often corruption of GTA5's own files. Verify the game files in the Steam, Epic, or Rockstar launcher, update your graphics driver to the latest version, and then try again.
- **Stuttering, missing textures, and UI glitches** are often caused by the cache. If you delete the cache-related folders inside %localappdata%\\FiveM\\FiveM.app and restart, they are automatically rebuilt.
- **Server connection errors** can occur when a VPN or firewall is interfering with communication. Check your firewall's allow settings, and try temporarily turning off your VPN.

## Uninstalling Is Easy

It is also worth adding that there is no need to hesitate about installing. Because FiveM does not modify GTA5's own files, uninstalling is simple and leaves no effect on the GTA Online side. If you installed it in the default location, delete the %localappdata%\\FiveM folder; if you did a portable install into an empty folder, delete that folder. Being easy to try out casually is another advantage of FiveM.

## Once You Are Set Up

Once installation is done, all that is left is to choose a server and become a resident of the city. At first, start with a beginner-friendly server that has lenient screening, and get used to the controls and the atmosphere. Note that single-player MODs (Menyoo, Script Hook V, .asi files, and so on) cause problems if mixed with FiveM, so do not forget to manage them completely separately.

## Disclaimer

This article organizes the general installation steps for FiveM in a beginner-friendly way. FiveM is a community-made platform premised on the PC version of GTA5 (Legacy Edition), and a legitimately purchased GTA5 is required. Because the support status for GTA5 Enhanced Edition, the client's specifications, and the details of the on-screen display and steps may change with updates, please check the latest information on the FiveM official site (fivem.net) and the official documentation when installing. Always download only from the official site, and do not use unofficial distributions. This site is an unofficial GTA6 fan community and has no relationship whatsoever with Rockstar Games / Take-Two.`;

export default function FivemInstallGuide() {
  return (
    <ArticleLayout
      seoTitle="FiveMの導入方法｜GTA5でカスタムサーバーを遊ぶ手順を解説｜GTA6 FEED"
      seoDesc="FiveMの導入方法を初心者向けに解説。必要なもの（Windows・正規GTA5 Legacy版）、公式サイトからの導入手順、アンチウイルス除外、よくあるトラブル対処、アンインストールまでを順を追って整理します。"
      title={TITLE}
      titleEn={TITLE_EN}
      icon="🛠️"
      body={BODY}
      bodyEn={BODY_EN}
      seoTitleEn="How to Install FiveM | A Step-by-Step Guide for GTA5 | GTA6 FEED"
      seoDescEn="How to install FiveM, explained for beginners. What you need (Windows, a legitimate GTA5 Legacy Edition), the steps from the official site, antivirus exclusions, common troubleshooting, and uninstalling."
      aiSummary={[
        'FiveMはGTA5本体のファイルを書き換えないため、GTAオンラインに影響せずアンインストールも簡単。必要なのはWindows PCと正規GTA5（Legacy版）。',
        '手順は「GTA5を一度起動→公式サイト(fivem.net)からFiveM.exeをDL→インストール→GTA5の場所を指定→起動→サーバーブラウザから接続」。ダウンロードは必ず公式から。',
        'アンチウイルスの誤検知は除外設定で回避。検出不可・クラッシュ・カクつき・接続エラーは原因別に対処できる。シングルプレイMODとは分けて管理を。',
      ]}
      aiSummaryEn={[
        'FiveM does not modify GTA5’s own files, so it has no effect on GTA Online and is easy to uninstall. All you need is a Windows PC and a legitimate GTA5 (Legacy Edition).',
        'The flow is: launch GTA5 once, download FiveM.exe from the official site (fivem.net), install, specify the GTA5 location, launch, and connect from the server browser. Always download from the official site.',
        'Antivirus false positives are avoided with exclusion settings. Detection failures, crashes, stuttering, and connection errors each have their own fixes. Keep single-player MODs managed separately.',
      ]}
    >
      <div className="flex flex-wrap gap-3 mb-12">
        <a
          href="/fivem-gtarp/server-guide"
          className="inline-flex items-center gap-2 px-4 h-10 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-sm rounded transition-colors"
        >
          <Compass size={14} /> サーバーの選び方ガイド
        </a>
        <a
          href="/fivem-gtarp/what-is-fivem"
          className="inline-flex items-center gap-2 px-4 h-10 bg-black hover:bg-zinc-800 text-white font-mono text-sm rounded transition-colors border border-white/20"
        >
          FiveMとは？
        </a>
        <a
          href="/servers"
          className="inline-flex items-center gap-2 px-4 h-10 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-sm rounded transition-colors"
        >
          <Server size={14} /> FiveMサーバー募集板
        </a>
        <a
          href="/board/gtarp"
          className="inline-flex items-center gap-2 px-4 h-10 bg-pink-600 hover:bg-pink-500 text-white font-mono text-sm rounded transition-colors"
        >
          <MessageSquare size={14} /> GTARP掲示板
        </a>
      </div>
    </ArticleLayout>
  );
}
