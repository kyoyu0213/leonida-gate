import { HelpCircle, Server, MessageSquare } from 'lucide-react';
import ArticleLayout from '@/components/ArticleLayout';
import LocalLink from '@/components/LocalLink';
import { useT } from '@/lib/i18n';

const TITLE = 'FiveMコマンド辞典｜GTARPでよく使うチャットコマンド一覧';

const BODY = `GTARPでは、チャット欄に「/（スラッシュ）」から始まるコマンドを入力することで、職業の確認、救助要請、車の操作、所持金の表示など、さまざまな操作ができる。この記事では、GTA6 FEEDが、初心者がよく使うコマンドを用途ごとに整理した。

なお、ここで紹介するコマンドは、サーバーやバージョン、導入されているスクリプトによって名称や挙動が異なる、あるいは存在しない場合がある。実際に使えるコマンドは、参加しているサーバーのDiscordや案内で確認してほしい。

## 基本・キャラクター系

- **/me** — 自分のキャラクターの状況や行動を、文字で表示する。
- **/job** — 現在の職業を表示する。
- **/name** — ネームタグの初心者マークや、配信中マークの表示・非表示を切り替える。
- **/reloadskin** — スキン（見た目）を再読み込みする。サーバーによっては /refreshskin の場合もある。
- **/closeinv** — インベントリ画面が消えずに残ってしまったときに、強制的に閉じる。

## RPチャットコマンド（/me・/do・/ooc）

ロールプレイ中に、声に出していない行動や周囲の状況を文字で伝えるためのコマンド。FiveM本体の機能ではなく、サーバーが導入しているチャットスクリプトが提供するものなので、使えるコマンドや表示のされ方はサーバーによって異なる。

- **/me [文]** — 自分のキャラクターの行動や状態を、地の文として周囲に表示する。例：/me ポケットから鍵を取り出す
- **/do [文]** — その場の状況や、自分では断定できない事実・結果を描写する。/me が「自分がする行動」、/do が「その結果や周囲の状況」という使い分けが一般的。例：/do 手が震えている
- **/ooc [文]** — Out Of Character の略で、キャラクターとしてではなく中の人としての発言。ロールプレイの進行を止めてしまうため、サーバーによっては使用が制限され、Discordの専用チャンネルへ誘導されることがある。
- **/looc [文]** — ローカルOOC。近くにいるプレイヤーにだけ届くOOC発言として運用されることが多い。/b が同じ用途に割り当てられているサーバーもある。
- **/twt [文]** — SNS（ツイッター風）の全体投稿。/tweet、/twitter など名称はさまざま。

コマンド名・文字数制限・声が届く範囲はサーバーの実装しだいなので、参加サーバーのルールやヘルプで確認してほしい。とくに /ooc の扱いはサーバーごとの方針差が大きい。

## 救助・通報系

- **/help** — NPCのドクターを呼ぶ。
- **/911** — 警察・救急隊にレポート（通報）する。
- **/911p** — 警察にレポートする。サーバーによっては /311 など、番号が異なる場合がある。
- **/escort** — ダウンしているプレイヤーを護送する。
- **/carry** — 人を担ぐ。担がれた側も /carry を使うと解除できる。

## 他のプレイヤーを車に乗せる・エスコート

ダウンした人や拘束した相手を掴んで運び、車に乗せるまでの操作についてまとめる。

**重要：この項目で挙げるコマンドとキーは、FiveM本体の機能ではない。** サーバーが導入しているフレームワーク（ESX、QBCoreなど）やスクリプトが提供するもので、コマンド名・操作キー・そもそも使えるかどうかはサーバーごとに異なる。ここに書くのはあくまで代表的な実装例であり、そのまま自分の入っているサーバーで動くとは限らない。必ず参加サーバーのヘルプ（F1メニューや案内ページ）、ルール文書、Discordで確認してほしい。

### 掴んでから車に乗せるまでの流れ

1. 相手がその操作の対象になる状態か確認する。多くの実装では、ダウンしている、手錠などで拘束されている、本人が同意している、といった条件が必要になる。
2. 相手のすぐ近くに立って **/escort** を実行する。相手を掴んだ状態になる。
3. 掴んだまま車のそばまで歩く。この状態では走れない、自分は車に乗れない、といった制限がかかる実装が多い。
4. 車のそばで **/putincar** を実行し、相手を車内の空いている席に乗せる。
5. 降ろすときは **/takeout** を使う。掴んだ状態を解除するだけなら、もう一度 /escort を実行する形が多い。

### この場面で使われる代表的なコマンド

- **/escort** — 相手を掴んで連行する。もう一度実行して解除する作りが多い。
- **/putincar** — 掴んでいる相手を、近くの車の空いている席に乗せる。/putinvehicle、/pic といった名前のこともある。
- **/takeout** — 車内の相手を降ろす。/out、/removefromcar といった名前のこともある。
- **/carry** — 人を担ぐ。担がれた側も /carry を使うと解除できる。担いだまま車に乗せられるかは実装しだい。
- **/cuff** — 手錠をかける。/handcuff などの名前のこともあり、警察職に限定されていることが多い。

### 「エスコート キー」について

エスコートに決まった標準キーは存在しない。サーバーによっては、コマンドではなくキー割り当てやホイールメニュー（ラジアルメニュー）から操作する作りになっていて、その呼び出しキーもサーバーの設定しだいになる。まずは参加サーバーのヘルプやキー一覧を確認するのが確実。

なお、そのサーバーがコマンドとして公開している機能であれば、後述するF8コンソールの bind を使って好きなキーに割り当てられる。

\`\`\`
bind keyboard F9 "escort"
\`\`\`

このように設定すると、F9キーで escort を実行できるようになる。うまく動かない場合は、そのサーバーがコマンドとして公開しておらず、メニュー専用になっている可能性が高い。

## 車・乗り物系

- **/givekeys** — 車の鍵を他のプレイヤーに渡す。
- **/engine** — エンジンのオン・オフを切り替える。
- **/flipvehicle** — ひっくり返った車を元に戻す。
- **/seat 0** — 運転席に移動する。F1メニューにある場合が多いが、ない場合はこのコマンドで移動できる。

## お金・施設系

- **/cash** — 手持ちの現金を表示する。
- **/bank** — 銀行口座の残高を表示する。
- **/tv** — テレビの近くで使うと、テレビのメニューにアクセスできる。
- **/dice 1～3** — サイコロを投げる。

## クロスヘア（照準）設定

クロスヘアは、コンソール（F8キー）に設定コマンドを貼り付けることで表示・変更できる。ただし、サーバーによってはクロスヘアの使用自体が禁止されている場合があるため、必ず各サーバーのルールを確認すること。禁止されている場合は、左Altキー（心の目）でエイムを合わせる。

設定したいクロスヘアのコマンドをコピーし、F8コンソールに貼り付けて実行する。

**ドットクロスヘア：**

\`\`\`
cl_customcrosshair 2;cl_crosshairstyle 2;cl_crosshairsize -2;cl_crosshair_drawoutline 2;cl_crosshairthickness 1;cl_crosshair_outlinethickness 0.4;cl_crosshairdot 0;cl_crosshairgap -1;cl_crosshaircolor 0
\`\`\`

**十字クロスヘア：**

\`\`\`
cl_customcrosshair 1;cl_crosshairstyle 3;cl_crosshairsize 3.5;cl_crosshair_drawoutline 1;cl_crosshairthickness 1;cl_crosshair_outlinethickness 0.4;cl_crosshairdot 0;cl_crosshairgap -10;cl_crosshaircolor 0
\`\`\`

**大きめ十字クロスヘア：**

\`\`\`
cl_customcrosshair 1;cl_crosshairstyle 3;cl_crosshairsize 3.5;cl_crosshair_drawoutline 1;cl_crosshairthickness 1;cl_crosshair_outlinethickness 0.4;cl_crosshairdot 0;cl_crosshairgap -15;cl_crosshaircolor 0
\`\`\`

色の変更は、コマンド末尾の「cl_crosshaircolor 0」の数字を書き換える。0が赤、1が緑、2が黄、3が紫がかった青、4がシアン（青緑）。

クロスヘアを非表示にするには、次を実行する。

\`\`\`
cl_customCrosshair false
\`\`\`

## F8コンソールコマンド一覧

チャット欄の「/」コマンドがサーバー側のスクリプトの機能なのに対して、ここで扱うのはFiveMクライアント本体の機能なので、どのサーバーにいても基本的に同じように使える。以下はFiveM公式ドキュメント（[docs.fivem.net](https://docs.fivem.net/docs/client-manual/console-commands/)）に記載のあるコマンドをまとめたもの。

### F8コンソールの開き方

ゲーム中に**F8キー**を押すと、クライアントコンソールが開く。もう一度F8を押すと閉じる。コマンドは入力欄に打ち込んでEnterで実行し、コピーしてきたコマンドはCtrl+Vで貼り付けられる。ゲーム外から使いたい場合は、VConsole2のような外部ツールを導入する方法もある。

なお、ここに挙げるのはFiveM標準のコマンドで、これとは別に、サーバーが導入しているリソース（スクリプト）が独自のコマンドを追加している場合もある。

### 接続・切断・終了

- **connect <アドレス>** — 指定したIPアドレスとポート、またはURLでサーバーに接続する。例：connect 127.0.0.1:30120、connect cfx.re/join/y4lg95
- **disconnect** — 接続中のサーバーから切断し、メインメニューに戻る。
- **quit** — クライアントを即座に終了する。
- **quit [理由]** — 終了理由をサーバーに伝えたうえで、即座に終了する。例：quit afk

### FPS・通信状況の表示

- **cl_drawfps <true|false>** — 画面隅にFPS（1秒あたりの描画フレーム数）カウンターを表示する。例：cl_drawfps true
- **cl_drawperf <true|false>** — 画面隅にパフォーマンス情報を表示する。FPS、Ping（サーバーとの往復応答時間・ミリ秒）、PL（パケットロス率）、CPU使用率、GPU使用率、GPU温度が並ぶ。動作が重い・ラグいときに、原因が自分のPC側なのか回線側なのかを切り分けやすくなる。

後述の netgraph や resmon はさらに詳しい情報を出せるが、そちらは開発者モードが必要になる。プレイ中にFPSやPingを確認したいだけなら、この cl_drawperf で足りる。

### 音量・ボイスチャット

- **profile_sfxVolume <0-10+>** — 効果音の音量を設定する。100%が10にあたり、上限はなく、下限は0。
- **profile_musicVolume <0-10+>** — シングルプレイ時の音楽の音量を設定する。
- **profile_musicVolumeInMp <0-10+>** — サーバーに接続しているとき（ネットワークゲーム時）の音楽の音量を設定する。
- **voice_enableNoiseSuppression <true|false>** — ボイスチャットのノイズ抑制を切り替える。周囲の環境音を減らせる。初期値は true。
- **voice_inBitrate <16000-128000>** — 送信するボイスデータのビットレートを設定する。上げると音質は良くなるが、回線の使用量も増える。初期値は 48000。

### カメラ・描画まわりの調整

- **cam_disableCameraShake <true|false>** — 爆発などによるカメラの揺れを無効にする。初期値は false。
- **cam_enableHandbrakeCamera <true|false>** — 車の追従カメラで、ハンドブレーキ時にカメラが振られる演出を切り替える。初期値は true。
- **cam_vehicleFirstPersonFOV <-1〜130>** — 車の一人称視点のFOV（視野角）を設定する。初期値は -1。
- **str_maxVehicleTextureRes <数値>** — 車両テクスチャの最大解像度を制限する。画質と引き換えに、物理メモリ不足を起こしにくくできる。初期値は 1024。
- **nui_useInProcessGpu <true|false>** — UI描画（CEF）でin-process GPUを使う。互換性が上がることがある一方、NUIの性能は下がる。変更後は再起動が必要。初期値は false。

### キーバインド関連のコンソール操作

コマンドではないが、F8コンソールからキー割り当ても設定できる。

- **bind keyboard "キー" "内容"** — 指定したキーに、指定した内容（エモートやコマンドなど）を割り当てる。
- **unbind keyboard "キー"** — 割り当てを解除する。設定を更新したいときは、いったんこれで解除してから割り当て直す。
- **quit** — ゲームを終了する。続けてもう一度実行すると即座に終了する。
- **bind**（引数なし） — 現在設定されている割り当てを一覧表示する。
- **rbind <リソース> <mapper> <キー> <内容>** — bind と同じだが、指定したリソースが動いているサーバーでのみ実行される。

ひとつのキーに複数のコマンドをまとめて割り当てることもできる。

\`\`\`
bind keyboard F9 "say hi; wait 250; say bye"
\`\`\`

解除は次のように、割り当てたキーを指定して行う。

\`\`\`
unbind keyboard F9
\`\`\`

### 開発者モードが必要なコマンド（netgraph・resmon など）

次に挙げるコマンドは開発者モードでないと実行できず、そのまま入力しても「Access denied for command resmon」「Command strdbg is disabled in production mode」のようなエラーになる。開発者モードは、FiveMクライアントを **+set moo 31337** の起動引数付きで起動する（ショートカットのリンク先に書き足す）か、BetaやLatestといった非本番のアップデートチャンネルで動かすと有効になる。ただし非本番チャンネルは不安定なことがあり、ゲームが起動しなくなる場合もあるため、常用のPCで安易に切り替えないほうがよい。

- **netgraph <true|false>** — 通信状況をリアルタイムのグラフで表示する。Ping（往復応答時間）、1秒あたりの受信・送信パケット数とバイト数などが並ぶ。
- **resmon <true|false>** — リソースモニターを開く。リソース（スクリプト）ごとのCPU使用量とメモリ使用量を一覧できるので、動作が重いときにどのスクリプトが原因かの見当をつけられる。
- **strmem <true|false>** — ストリーミングアセットごとのメモリ使用量と、全体の概要を表示する。
- **strdbg <true|false>** — GTAのストリーマーが現在なにを読み込んでいるかを表示する。建物や道路が読み込まれないときの調査に使う。
- **cmdlist** — クライアントに登録されているコマンドと、set系で設定された変数を一覧表示する。
- **net_statsFile <ファイル名>** — Ping、送受信のパケット数・バイト数などの通信メトリクスをCSV形式でファイルに記録する。例：net_statsFile metrics.csv
- **neteventlog <true|false>** — ネットワークイベントの送受信を表示する。方向（Server -> Client など）、イベント名、データのサイズがわかる。

## 免責事項

本記事はGTA6 FEEDが各種公開情報や実際の操作をもとに整理した解説記事であり、Rockstar GamesおよびTake-Two Interactive、ならびに各サーバーの運営とは一切関係がない。ここで紹介したコマンドや設定は、サーバーやバージョン、導入スクリプトによって異なる場合があり、時間の経過とともに変化することもある。最新かつ正確な情報は、参加する各サーバーの公式情報を確認されたい。`;

const TITLE_EN = 'FiveM Command Dictionary | A List of Chat Commands Commonly Used in GTARP';

const BODY_EN = `In GTARP, by entering commands starting with "/" (slash) into the chat field, you can do various things such as checking your job, requesting rescue, operating vehicles, and displaying your cash. In this article, GTA6 FEED has organized the commands beginners frequently use, by purpose.

Note that the commands introduced here may differ in name and behavior, or not exist at all, depending on the server, the version, and the scripts that have been installed. Please check which commands you can actually use via the Discord or guidance of the server you are on.

## Basics / Character

- **/me** — Displays your character's situation or actions in text.
- **/job** — Displays your current job.
- **/name** — Toggles the display of the beginner mark or the live-streaming mark on your name tag.
- **/reloadskin** — Reloads your skin (appearance). On some servers it may be /refreshskin.
- **/closeinv** — Forcibly closes the inventory screen when it gets stuck and will not disappear.

## RP Chat Commands (/me, /do, /ooc)

These are commands for conveying, in text, actions you are not saying out loud and the situation around you during roleplay. They are not a feature of FiveM itself but are provided by the chat script the server has installed, so which ones you can use and how they are displayed differ by server.

- **/me [text]** — Displays your character's action or state to those around you as narration. Example: /me takes a key out of his pocket
- **/do [text]** — Describes the situation on the spot, or a fact or result you cannot determine yourself. The usual division is that /me is "the action you take" and /do is "its result or the surrounding situation." Example: /do his hands are shaking
- **/ooc [text]** — Short for Out Of Character: a remark made as the player, not as the character. Because it interrupts the flow of roleplay, some servers restrict its use and direct you to a dedicated Discord channel instead.
- **/looc [text]** — Local OOC. It is often operated as an OOC remark that only reaches nearby players. On some servers /b is assigned to the same purpose.
- **/twt [text]** — A server-wide post in the style of social media (Twitter-like). Names vary, such as /tweet or /twitter.

Command names, character limits, and how far your voice reaches all depend on the server's implementation, so please check the rules and help of the server you are on. The handling of /ooc in particular varies a great deal in policy from server to server.

## Rescue / Reporting

- **/help** — Calls an NPC doctor.
- **/911** — Reports to the police/EMS.
- **/911p** — Reports to the police. On some servers the number differs, such as /311.
- **/escort** — Escorts a downed player.
- **/carry** — Carries a person. The carried person can also use /carry to release it.

## Putting Another Player in a Car / Escorting

This section covers the operations for grabbing a downed or restrained person, carrying them, and putting them into a car.

**Important: the commands and keys listed in this section are not a feature of FiveM itself.** They are provided by the framework the server has installed (ESX, QBCore, and so on) or by its scripts, so command names, keys, and whether they are available at all differ by server. What is written here is only a representative implementation example, and it will not necessarily work as-is on the server you are on. Be sure to check the help of the server you are on (the F1 menu or its guidance pages), its rules documents, and its Discord.

### The flow from grabbing to putting someone in a car

1. Check that the other person is in a state that can be targeted. In many implementations, conditions are required, such as being downed, being restrained with handcuffs, or having consented.
2. Stand right next to the person and run **/escort**. You will now be holding onto them.
3. Walk to the car while still holding them. In many implementations restrictions apply in this state, such as being unable to run or unable to get into a vehicle yourself.
4. Next to the car, run **/putincar** to place the person into a free seat in the vehicle.
5. To get them out, use **/takeout**. To simply release your hold, running /escort once more is the common design.

### Representative commands used in this situation

- **/escort** — Grabs and escorts the other person. It is often designed to be run again to release.
- **/putincar** — Puts the person you are holding into a free seat of a nearby car. It may also be named /putinvehicle or /pic.
- **/takeout** — Takes the person inside the vehicle out. It may also be named /out or /removefromcar.
- **/carry** — Carries a person. The carried person can also use /carry to release it. Whether you can put someone into a car while carrying them depends on the implementation.
- **/cuff** — Applies handcuffs. It may also be named /handcuff, and it is often restricted to police jobs.

### About the "escort key"

There is no fixed standard key for escorting. Some servers are built so that you operate it from a key assignment or a wheel (radial) menu rather than a command, and in that case the key that opens it also depends on the server's settings. The surest approach is to first check the help or key list of the server you are on.

That said, if the server exposes the feature as a command, you can assign it to any key you like using the F8 console's bind, described below.

\`\`\`
bind keyboard F9 "escort"
\`\`\`

Setting it like this lets you run escort with the F9 key. If it does not work, the server most likely does not expose it as a command and has made it menu-only.

## Vehicles

- **/givekeys** — Hands the car keys to another player.
- **/engine** — Toggles the engine on/off.
- **/flipvehicle** — Returns a flipped car to its normal position.
- **/seat 0** — Moves to the driver's seat. It is often in the F1 menu, but if not, you can move with this command.

## Money / Facilities

- **/cash** — Displays your cash on hand.
- **/bank** — Displays your bank account balance.
- **/tv** — Used near a TV, it lets you access the TV menu.
- **/dice 1-3** — Rolls dice.

## Crosshair (Aim) Settings

A crosshair can be displayed and changed by pasting a setting command into the console (F8 key). However, because some servers prohibit the use of a crosshair itself, be sure to check each server's rules. If it is prohibited, line up your aim with the left Alt key (the "Mind's Eye").

Copy the command for the crosshair you want to set, paste it into the F8 console, and run it.

**Dot crosshair:**

\`\`\`
cl_customcrosshair 2;cl_crosshairstyle 2;cl_crosshairsize -2;cl_crosshair_drawoutline 2;cl_crosshairthickness 1;cl_crosshair_outlinethickness 0.4;cl_crosshairdot 0;cl_crosshairgap -1;cl_crosshaircolor 0
\`\`\`

**Cross crosshair:**

\`\`\`
cl_customcrosshair 1;cl_crosshairstyle 3;cl_crosshairsize 3.5;cl_crosshair_drawoutline 1;cl_crosshairthickness 1;cl_crosshair_outlinethickness 0.4;cl_crosshairdot 0;cl_crosshairgap -10;cl_crosshaircolor 0
\`\`\`

**Larger cross crosshair:**

\`\`\`
cl_customcrosshair 1;cl_crosshairstyle 3;cl_crosshairsize 3.5;cl_crosshair_drawoutline 1;cl_crosshairthickness 1;cl_crosshair_outlinethickness 0.4;cl_crosshairdot 0;cl_crosshairgap -15;cl_crosshaircolor 0
\`\`\`

To change the color, rewrite the number in "cl_crosshaircolor 0" at the end of the command. 0 is red, 1 is green, 2 is yellow, 3 is a purplish blue, and 4 is cyan (blue-green).

To hide the crosshair, run the following.

\`\`\`
cl_customCrosshair false
\`\`\`

## List of F8 Console Commands

Whereas the "/" commands in the chat field are features of server-side scripts, what is covered here are features of the FiveM client itself, so they basically work the same way whichever server you are on. The following collects the commands documented in the official FiveM documentation ([docs.fivem.net](https://docs.fivem.net/docs/client-manual/console-commands/)).

### How to open the F8 console

Pressing the **F8 key** during the game opens the client console. Pressing F8 again closes it. You run a command by typing it into the input field and pressing Enter, and you can paste a copied command with Ctrl+V. If you want to use it from outside the game, there is also the option of installing an external tool such as VConsole2.

Note that what is listed here are FiveM's standard commands; separately from these, the resources (scripts) installed on a server may add their own commands.

### Connecting, disconnecting, quitting

- **connect <address>** — Connects to a server using a given IP address and port, or a URL. Examples: connect 127.0.0.1:30120, connect cfx.re/join/y4lg95
- **disconnect** — Disconnects you from the server you are connected to and returns you to the main menu.
- **quit** — Forces the client to close immediately.
- **quit [reason]** — Forces the client to close immediately, specifying a quit reason to the server. Example: quit afk

### Displaying FPS and network status

- **cl_drawfps <true|false>** — Displays a frames-per-second counter in the corner of the screen. Example: cl_drawfps true
- **cl_drawperf <true|false>** — Displays performance metrics in the corner of the screen: FPS, Ping (the round trip time to the server, in milliseconds), PL (packet loss rate), CPU usage, GPU usage, and GPU temperature. When the game runs badly or lags, this makes it easier to tell whether the cause is on your PC's side or your connection's side.

The netgraph and resmon commands described below can show even more detail, but those require developer mode. If you only want to check your FPS and ping while playing, cl_drawperf is enough.

### Volume and voice chat

- **profile_sfxVolume <0-10+>** — Sets the SFX volume. 100% volume maps to 10; there is no upper limit, and the lower limit is 0.
- **profile_musicVolume <0-10+>** — Sets the music volume for single-player modes.
- **profile_musicVolumeInMp <0-10+>** — Sets the music volume when connected to a network game (a server).
- **voice_enableNoiseSuppression <true|false>** — Toggles noise suppression for voice chat, reducing background noise. Default: true.
- **voice_inBitrate <16000-128000>** — Sets the bitrate at which voice data is encoded. Higher bitrates give better quality but also use more bandwidth. Default: 48000.

### Adjusting the camera and rendering

- **cam_disableCameraShake <true|false>** — Disables camera shake effects, such as from explosions. Default: false.
- **cam_enableHandbrakeCamera <true|false>** — Toggles the handbrake camera swing effect in the follow vehicle camera. Default: true.
- **cam_vehicleFirstPersonFOV <-1 to 130>** — Sets the first person FOV (field of view) of the vehicle. Default: -1.
- **str_maxVehicleTextureRes <int>** — Limits the maximum resolution of vehicle textures. At the cost of visual quality, this makes running out of physical memory less likely. Default: 1024.
- **nui_useInProcessGpu <true|false>** — Uses in-process GPU for CEF (UI rendering). This might improve compatibility, but reduces NUI performance. Requires a restart when changed. Default: false.

### Console Operations Related to Keybinds

Although not commands, you can also set key assignments from the F8 console.

- **bind keyboard "key" "content"** — Assigns the specified content (an emote, a command, etc.) to the specified key.
- **unbind keyboard "key"** — Releases the assignment. When you want to update a setting, release it once with this, then reassign.
- **quit** — Quits the game. Running it once more after that quits instantly.
- **bind** (with no arguments) — Lists all currently configured bindings.
- **rbind <resource> <mapper> <input> <command>** — The same as bind, but it only runs if the specified resource is in use on the server.

You can also assign several commands at once to a single key.

\`\`\`
bind keyboard F9 "say hi; wait 250; say bye"
\`\`\`

You release a binding by specifying the key you assigned, like this.

\`\`\`
unbind keyboard F9
\`\`\`

### Commands that require developer mode (netgraph, resmon, and others)

The commands listed below cannot be run unless the client is in developer mode; entering them as-is produces an error such as "Access denied for command resmon" or "Command strdbg is disabled in production mode." Developer mode is enabled by launching the FiveM client with the **+set moo 31337** startup argument (adding it to the target of your shortcut), or by running the client on a non-production update channel such as Beta or Latest. Note, however, that non-production channels can be unstable and may even leave the game unable to launch, so it is better not to switch over casually on the PC you normally play on.

- **netgraph <true|false>** — Shows real-time metrics about network usage as a graph, listing things like ping (round trip time) and the number of packets and bytes received and sent per second.
- **resmon <true|false>** — Opens the resource monitor. It gives an overview of CPU and memory usage for each resource (script), so when the game runs badly you can get an idea of which script is responsible.
- **strmem <true|false>** — Shows a listing of streaming memory used by specific streaming assets, as well as a global overview.
- **strdbg <true|false>** — Shows what is currently being loaded in the GTA streamer. Useful for investigating when buildings and roads do not load.
- **cmdlist** — Lists all the commands registered on the client, as well as the variables that have been set with the set family of commands.
- **net_statsFile <file_name>** — Records network metrics such as ping and the number of packets and bytes sent and received to a file in CSV format. Example: net_statsFile metrics.csv
- **neteventlog <true|false>** — Displays incoming and outgoing network event traffic, showing the direction (e.g. Server -> Client), the event name, and the size of the data sent.

## Disclaimer

This article is an explanatory piece organized by GTA6 FEED based on various publicly available information and actual operation, and it has no relationship whatsoever with Rockstar Games or Take-Two Interactive, or with the operators of the various servers. The commands and settings introduced here may differ depending on the server, the version, and the installed scripts, and may change over time. For the latest and accurate information, please check the official information of each server you join.`;

export default function FivemCommandsArticle() {
  const t = useT();
  return (
    <ArticleLayout
      seoTitle="FiveMコマンド辞典｜GTARPでよく使うチャットコマンド一覧｜GTA6 FEED"
      seoDesc="GTARPでよく使う「/」から始まるチャットコマンドと、F8コンソールコマンド一覧を用途ごとに解説。/me・/do・/ooc・/911 などのRP系、他のプレイヤーを車に乗せる/escort・/putincar、クロスヘア（照準）設定、connect・cl_drawperf・netgraph・resmon・bind まで初心者向けにまとめました。"
      title={TITLE}
      titleEn={TITLE_EN}
      icon="⌨️"
      date="2026-06-27"
      body={BODY}
      bodyEn={BODY_EN}
      seoTitleEn="FiveM Command Dictionary | Chat Commands Commonly Used in GTARP | GTA6 FEED"
      seoDescEn="A purpose-by-purpose guide to the '/' chat commands used in GTARP plus a full list of F8 console commands. From RP commands like /me, /do, /ooc, and /911, to escorting and putting players in cars (/escort, /putincar), crosshair settings, and connect, cl_drawperf, netgraph, resmon, and bind."
      aiSummary={[
        'GTARPのチャットコマンド（/から始まる）を用途別に整理。/me（行動表示）・/job（職業）・/911（通報）・/escort（護送）など基本から、車・お金・施設系まで。',
        'クロスヘア（照準）はF8コンソールに設定コマンドを貼って表示・変更できる。ドット／十字などの設定例と、色の変更（cl_crosshaircolor の数字）・非表示（cl_customCrosshair false）も掲載。ただしサーバーによっては使用禁止。',
        'F8コンソールのキーバインド（bind keyboard / unbind keyboard）や即終了（quit）も解説。コマンドはサーバー・バージョン・スクリプトで名称や有無が異なるため各サーバーで確認を。',
        'F8コンソールコマンド一覧を掲載。開き方（F8キー）、connect / disconnect / quit、FPS・Ping表示（cl_drawfps / cl_drawperf）、音量・ボイス（profile_sfxVolume / voice_inBitrate）、bind / rbind に加え、開発者モード（+set moo 31337 など）が必要な netgraph・resmon・strdbg も解説。出典はFiveM公式ドキュメント。',
        '他のプレイヤーを車に乗せる操作（/escort で掴む→/putincar で乗せる→/takeout で降ろす）と「エスコート キー」についても解説。ただしこの領域はESX・QBCoreなどサーバーの実装しだいで、コマンド名もキーも異なるため、参加サーバーのヘルプやDiscordで要確認。',
        'RPチャットコマンドは /me（自分の行動）・/do（状況や結果）・/ooc（中の人としての発言）・/looc・/twt を使い分ける。/ooc の扱いはサーバーごとの方針差が大きい。',
      ]}
      aiSummaryEn={[
        'GTARP chat commands (starting with /) organized by purpose: from basics like /me (show actions), /job, /911 (report), and /escort, to vehicle, money, and facility commands.',
        'A crosshair can be displayed/changed by pasting setting commands into the F8 console. It includes dot/cross examples, color changes (the number in cl_crosshaircolor), and hiding it (cl_customCrosshair false) — but some servers prohibit its use.',
        'It also covers F8 console keybinds (bind keyboard / unbind keyboard) and instant quit (quit). Commands differ in name and availability by server, version, and script, so confirm with each server.',
        'Includes a list of F8 console commands: how to open it (the F8 key), connect / disconnect / quit, FPS and ping display (cl_drawfps / cl_drawperf), volume and voice (profile_sfxVolume / voice_inBitrate), bind / rbind, plus netgraph, resmon, and strdbg, which require developer mode (+set moo 31337 and similar). Sourced from the official FiveM documentation.',
        'It also covers putting another player in a car (grab with /escort, seat them with /putincar, get them out with /takeout) and the question of the "escort key". This area depends on the server implementation (ESX, QBCore, and so on), so command names and keys differ; check the help or Discord of the server you are on.',
        'RP chat commands are used by dividing roles: /me (your own action), /do (the situation or result), /ooc (a remark as the player), /looc, and /twt. Policy on /ooc varies a great deal from server to server.',
      ]}
    >
      <div className="flex flex-wrap gap-3 mb-12">
        <LocalLink
          href="/fivem-gtarp/faq"
          className="inline-flex items-center gap-2 px-4 h-10 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-sm rounded transition-colors"
        >
          <HelpCircle size={14} /> {t('chip.faq')}
        </LocalLink>
        <LocalLink
          href="/fivem-gtarp/what-is-gtarp"
          className="inline-flex items-center gap-2 px-4 h-10 bg-black hover:bg-zinc-800 text-white font-mono text-sm rounded transition-colors border border-white/20"
        >
          <Server size={14} /> {t('chip.whatIsGtarp')}
        </LocalLink>
        <LocalLink
          href="/board/gtarp"
          className="inline-flex items-center gap-2 px-4 h-10 bg-pink-600 hover:bg-pink-500 text-white font-mono text-sm rounded transition-colors"
        >
          <MessageSquare size={14} /> {t('chip.boardAsk')}
        </LocalLink>
      </div>
    </ArticleLayout>
  );
}
