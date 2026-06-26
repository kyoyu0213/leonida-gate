import { Terminal, Server, MessageSquare } from 'lucide-react';
import ArticleLayout from '@/components/ArticleLayout';

const TITLE = 'FiveM・GTARP よくある質問（FAQ）｜初心者がつまずくトラブルと操作まとめ';

const BODY = `FiveMやGTARPを始めたばかりの頃は、動作の重さ、音が出ない、操作がわからない、といったつまずきが起きやすい。この記事では、GTA6 FEEDが、初心者が実際に直面しやすい質問とその対処をFAQ形式で整理した。

なお、ここで紹介する設定やコマンドは、サーバーやバージョン、導入されているスクリプトによって異なる場合がある。うまくいかないときは、参加しているサーバーのDiscordや、その街の住人に確認するのが最も確実である。以下はあくまで一般的な目安として読んでほしい。

## 動作・トラブル系

### 長く遊んでいると動作が重くなってきた

FiveMはプレイを続けるとキャッシュが溜まり、動作が重くなることがある。定期的なキャッシュ削除で改善する場合がある。手順は次のとおり。

FiveMのアイコンを右クリックし、「詳細」から「ファイルの場所を開く」を選ぶ。Windowsの検索画面で「FiveM」と検索しても、この項目は表示される。

![FiveMアイコンから「ファイルの場所を開く」で表示されるフォルダ。「FiveM Application Data」を開く](/images/FAQ/filenobasyo.png)

次に「FiveM Application Data」を開き、その中の「data」フォルダに入る。

![FiveM Application Data の中にある「data」フォルダ](/images/FAQ/datafolder.png)

dataフォルダ内にある「cache」「server-cache」「server-cache-priv」の3つを削除する。dataフォルダからこの3つが消えていれば成功である。

![data フォルダ内の「cache」「server-cache」「server-cache-priv」を削除する](/images/FAQ/cache.png)

削除してもアカウントやゲーム本体には影響しない。再接続時に必要なデータは改めて読み込まれる。

### 建物や道路が表示されない・読み込まれない

グラフィック設定の「Extended Texture Budget」を最大まで上げると改善することが多い。設定場所は、Escキーからオプション（OPTIONS）を開き、「グラフィックス」の項目内にある。テクスチャの読み込みに割り当てる容量が増えるため、街の表示が安定しやすくなる。

![OPTIONS＞グラフィックス内の「Extended Texture Budget」を最大まで上げる](/images/FAQ/ExtendedTextureBudget.png)

### 周りの人の声が聞こえない

ボイスチャットが無効になっている可能性がある。Escキーからオプション（OPTIONS）を開き、「ボイスチャット」の項目で、ボイスチャットの有効・無効が正しく設定されているかを確認する。

### 裏画面で六法（Discord）を見ているとゲームの音が止まる

GTA5の仕様で、ウィンドウからフォーカスが外れると音が止まる設定が有効になっていることがある。オプションの「オーディオ」内にある「フォーカスの喪失時にオーディオをポーズ」をオフにすると、別のウィンドウでDiscordの六法などを開いている間も、ボイスチャットやゲーム内の音が聞こえるようになる。

![OPTIONS＞オーディオ内の「フォーカスの喪失時にオーディオをポーズ」をオフにする](/images/FAQ/focusnosousitujiniaudiowopause.png)

### FiveMのメニュー画面の音楽を消したい

設定（Settings）の「Interface」内にある、メインメニューのバックグラウンド音楽に関するチェックを外すと、メニュー画面の音楽をオフにできる。

![Settings＞Interface の「Main Menu Audio」のチェックを外す](/images/FAQ/interface.png)

### インベントリを触っていると勝手に殴ってしまう

インベントリ操作中に殴るモーションが出てしまう場合、マウス入力方式が原因のことがある。Escキーからオプション（OPTIONS）を開き、「キーボード/マウス」の「マウス入力方法」を「Raw Input」に変更すると改善する。

![OPTIONS＞キーボード/マウスの「マウス入力方法」を「Raw Input」に変更する](/images/FAQ/RawInput.png)

## 操作・キー設定系

### 基本的な操作キーを知りたい

徒歩時の移動は、前進（W）、後退（S）、左（A）、右（D）が基本となる。あわせて、走る（Shift）、しゃがむ（左Ctrl）、伏せる・匍匐前進（右Ctrl）、ジャンプ・避ける（Space）、インベントリ（Tab、または1）、マップ（P）、スマホ（F1またはM）などを使う。マウスは、左クリックで殴る、右クリックで構える。サーバーによってキー割り当てが異なる場合がある。

### 泳ぎ方・水中での操作を知りたい

水泳の操作はGTAオンライン（GTA5本体）と共通である。水に入ると自動的に泳ぎ始め、水面では移動キー（WASD）で方向を取り、左Shiftで前に進む（連打すると速くなる）。

水中に潜るにはSpaceを押す。水中では、W・Sで上下（潜る・浮く）の向きを調整し、マウスの視点で進む方向を決める。水面へ浮上したいときは、左Shiftを押しながらSを入力する。なお、潜っている間は画面左下に酸素ゲージ（水色のバー）が表示され、これが尽きる前に浮上しないと溺れてしまう。岸や地面によじ登って水から上がる際は、Spaceを使う。

GTA5の水泳操作は独特で、初めてだと溺れやすい。落ち着いて、浮上は左Shift＋S、と覚えておくとよい。

### 運転中の操作キーを知りたい

運転時は、加速（W）、ブレーキ（S）、左（A）、右（D）、サイドブレーキ（Space）、ニトロ噴射（Shift）、乗り降り（F）、エンジンを切る（G）、ライト（H）などが基本となる。これらもサーバーの設定により変わることがある。

### スマホを開くキーは？

デフォルトではF1キーまたはMキーで開けることが多い。サーバーによって異なる場合がある。

### ゲームをすぐ終了したい

F8キーを押してコンソールを開き、「quit」と入力する。続けてもう一度「quit」を実行すると、ゲームを即座に終了できる。

### キーバインド（ショートカット）を設定したい

設定方法は主に2通りある。

1つ目は、F8キーでコンソールを開き、入力欄に「bind keyboard "設定したいキー" "設定したい内容"」と入力してEnterを押す方法。設定を変更・更新したい場合は、先に「unbind keyboard "設定したいキー"」でいったん解除する必要がある。

2つ目は、Escキーからオプション（OPTIONS）を開き、「キーの割り当て」内の「FiveM」項目にある「(custom_keyboard)」に対して、任意のキーを割り当てる方法。

エモートなどをショートカット化したい場合は、この仕組みを使って好きなキーに割り当てられる。

### 「心の目」とは何？

左Altキーを指す、日本のGTARPでの言い換え表現。オブジェクトやNPCなどに設定されたインタラクト（操作）メニューを開く際に使われる。また、クロスヘア（照準）が使えないサーバーで、エイムを合わせる目安としても利用される。表示や対応の有無はサーバーによって異なる。

## エイム・照準（クロスヘア）について

### クロスヘアを表示したい

「t/aim」が使えない場合、コンソール（F8）から設定コマンドを入力してクロスヘアを表示する方法がある。ただし、サーバーによってはクロスヘアの使用自体が禁止されている場合があるため、必ず各サーバーのルールを確認すること。クロスヘアが禁止されている場合は、左Altキーの「心の目」でエイムを合わせる。

クロスヘアの形状や色を変えるコマンド、非表示にするコマンドなどの詳細は、別ページの[FiveMコマンド辞典](/fivem-gtarp/commands)にまとめている。

## コマンドについて

GTARPでは、チャット欄に「/」から始まるコマンドを打つことで、職業確認、救助要請、車の操作などさまざまな操作ができる。代表的な例を挙げる。

/me は、自分のキャラクターの状況や行動を文字で表示するコマンド。/job は現在の職業の表示、/911 は警察・救急隊へのレポート、/escort はダウンしているプレイヤーの護送などに使う。

これらのコマンドはサーバーによって名称や有無が異なる（たとえばレポートが /311 のサーバーもある）。利用できるコマンドの一覧と詳細は、別ページの[FiveMコマンド辞典](/fivem-gtarp/commands)にまとめているので、あわせて参照してほしい。

## 免責事項

本記事はGTA6 FEEDが各種公開情報や実際の操作をもとに整理した解説記事であり、Rockstar GamesおよびTake-Two Interactive、ならびに各サーバーの運営とは一切関係がない。ここで紹介した設定・操作・コマンドは、サーバーやバージョン、導入スクリプトによって異なる場合があり、時間の経過とともに変化することもある。最新かつ正確な情報は、参加する各サーバーの公式情報を確認されたい。`;

const TITLE_EN = 'FiveM & GTARP FAQ | Common Beginner Troubles and Controls';

const BODY_EN = `When you have just started FiveM or GTARP, you tend to run into stumbling blocks such as heavy performance, no sound, or not knowing the controls. In this article, GTA6 FEED has organized, in FAQ form, the questions beginners are likely to actually face and how to deal with them.

Note that the settings and commands introduced here may differ depending on the server, the version, and the scripts that have been installed. When something does not work, the most reliable approach is to check with the Discord of the server you are on, or with the residents of that city. Please read the following strictly as a general guideline.

## Performance / Troubleshooting

### It has gotten heavy after playing for a long time

As you keep playing FiveM, the cache builds up and performance can become heavy. Periodically deleting the cache may improve it. The steps are as follows.

Right-click the FiveM icon and choose "Open file location" from "More." You can also bring this up by searching "FiveM" in the Windows search screen.

![The folder shown via "Open file location" from the FiveM icon. Open "FiveM Application Data"](/images/FAQ/filenobasyo.png)

Next, open "FiveM Application Data" and go into the "data" folder inside it.

![The "data" folder inside FiveM Application Data](/images/FAQ/datafolder.png)

Delete the three folders "cache," "server-cache," and "server-cache-priv" inside the data folder. If these three are gone from the data folder, you have succeeded.

![Delete "cache," "server-cache," and "server-cache-priv" inside the data folder](/images/FAQ/cache.png)

Deleting them does not affect your account or the base game. The data needed when you reconnect will be loaded again.

### Buildings and roads do not appear / do not load

Raising the graphics setting "Extended Texture Budget" to the maximum often improves it. To find the setting, press the Esc key to open OPTIONS, and it is within the "Graphics" item. Because more capacity is allocated to loading textures, the city's rendering tends to become more stable.

![Raise "Extended Texture Budget" in OPTIONS > Graphics to the maximum](/images/FAQ/ExtendedTextureBudget.png)

### I cannot hear the voices of people around me

Voice chat may be disabled. Press the Esc key to open OPTIONS, and in the "Voice Chat" item, check whether voice chat is correctly set to enabled/disabled.

### The game sound stops when I look at the rules (Discord) in a background window

Due to a GTA5 specification, a setting that stops the sound when the window loses focus may be enabled. If you turn off "Pause audio on focus loss" within "Audio" in the options, you will be able to hear voice chat and in-game sound even while you have Discord rules and the like open in another window.

![Turn off "Pause audio on focus loss" in OPTIONS > Audio](/images/FAQ/focusnosousitujiniaudiowopause.png)

### I want to turn off the music on the FiveM menu screen

In Settings, within "Interface," unchecking the option related to the main menu's background music turns off the music on the menu screen.

![Uncheck "Main Menu Audio" in Settings > Interface](/images/FAQ/interface.png)

### I keep punching by accident while handling the inventory

If a punching motion comes out while you are operating the inventory, the mouse input method may be the cause. Press the Esc key to open OPTIONS, and changing "Mouse input method" in "Keyboard/Mouse" to "Raw Input" improves it.

![Change "Mouse input method" in OPTIONS > Keyboard/Mouse to "Raw Input"](/images/FAQ/RawInput.png)

## Controls / Key Settings

### I want to know the basic control keys

For movement on foot, forward (W), backward (S), left (A), and right (D) are the basics. Along with these, you use run (Shift), crouch (Left Ctrl), prone / crawl (Right Ctrl), jump / dodge (Space), inventory (Tab, or 1), map (P), phone (F1 or M), and so on. With the mouse, left click to punch and right click to aim. The key assignments may differ by server.

### I want to know how to swim / underwater controls

Swimming controls are common with GTA Online (the GTA5 base game). When you enter the water you automatically begin swimming; on the surface you take direction with the movement keys (WASD) and move forward with Left Shift (tapping it repeatedly makes you faster).

To dive underwater, press Space. Underwater, you adjust the up/down direction (dive/rise) with W and S, and decide the direction you move with the mouse viewpoint. When you want to surface, input S while holding Left Shift. Note that while you are diving, an oxygen gauge (a light blue bar) is displayed at the bottom left of the screen, and if you do not surface before it runs out, you will drown. When climbing up onto a bank or the ground to get out of the water, use Space.

GTA5's swimming controls are peculiar and easy to drown with the first time. Stay calm and remember: to surface, Left Shift + S.

### I want to know the control keys while driving

While driving, accelerate (W), brake (S), left (A), right (D), handbrake (Space), nitro boost (Shift), get in/out (F), turn off the engine (G), and lights (H) are the basics. These too may change depending on the server's settings.

### What key opens the phone?

By default it can often be opened with the F1 key or the M key. It may differ by server.

### I want to quit the game immediately

Press the F8 key to open the console and type "quit." Running "quit" once more after that lets you quit the game instantly.

### I want to set a keybind (shortcut)

There are mainly two ways to set it.

The first is to open the console with the F8 key and type \`bind keyboard "the key you want to set" "the content you want to set"\` into the input field, then press Enter. If you want to change or update the setting, you first need to release it once with \`unbind keyboard "the key you want to set"\`.

The second is to press the Esc key to open OPTIONS, and assign any key to "(custom_keyboard)" in the "FiveM" item within "Key Bindings."

If you want to make emotes and the like into shortcuts, you can use this mechanism to assign them to keys you like.

### What is the "Mind's Eye" (kokoro no me)?

A euphemism in Japan's GTARP referring to the left Alt key. It is used when opening an interact (operation) menu set on objects, NPCs, and the like. It is also used as a guide for lining up your aim on servers where the crosshair cannot be used. Whether it is displayed and supported differs by server.

## About Aim / Crosshair

### I want to display a crosshair

If "t/aim" cannot be used, there is a method of displaying a crosshair by entering a setting command from the console (F8). However, because some servers prohibit the use of a crosshair itself, be sure to check each server's rules. If the crosshair is prohibited, line up your aim with the "Mind's Eye" of the left Alt key.

For details on the commands to change the crosshair's shape and color, or to hide it, see the separate [FiveM Command Dictionary](/fivem-gtarp/commands) page.

## About Commands

In GTARP, by typing commands starting with "/" into the chat field, you can do various things such as checking your job, requesting rescue, and operating vehicles. Here are some representative examples.

/me is a command that displays your character's situation or actions in text. /job displays your current job, /911 reports to the police/EMS, and /escort is used to escort a downed player, among others.

These commands differ by server in name and availability (for example, on some servers the report is /311). A list and details of the commands you can use are compiled on the separate [FiveM Command Dictionary](/fivem-gtarp/commands) page, so please refer to it as well.

## Disclaimer

This article is an explanatory piece organized by GTA6 FEED based on various publicly available information and actual operation, and it has no relationship whatsoever with Rockstar Games or Take-Two Interactive, or with the operators of the various servers. The settings, controls, and commands introduced here may differ depending on the server, the version, and the installed scripts, and may change over time. For the latest and accurate information, please check the official information of each server you join.`;

export default function FivemFaqArticle() {
  return (
    <ArticleLayout
      seoTitle="FiveM・GTARP よくある質問（FAQ）｜初心者のトラブル・操作まとめ｜GTA6 FEED"
      seoDesc="FiveM・GTARPの初心者がつまずきやすいトラブルと操作をFAQ形式で解説。動作が重いときのキャッシュ削除、建物が表示されない、音が出ない、泳ぎ方・運転キー、キーバインド、クロスヘア設定まで、画像つきでわかりやすくまとめました。"
      title={TITLE}
      titleEn={TITLE_EN}
      icon="❓"
      date="2026-06-27"
      body={BODY}
      bodyEn={BODY_EN}
      seoTitleEn="FiveM & GTARP FAQ | Common Beginner Troubles and Controls | GTA6 FEED"
      seoDescEn="An FAQ-style guide to the troubles and controls FiveM/GTARP beginners stumble on: cache deletion for heavy performance, buildings not loading, no sound, swimming and driving keys, keybinds, and crosshair settings — with images."
      aiSummary={[
        '動作が重いときはキャッシュ削除（data 内の cache / server-cache / server-cache-priv を削除）で改善することがある。アカウントやゲーム本体には影響しない。',
        '建物が出ない→Extended Texture Budgetを最大に、音が出ない→ボイスチャット設定／「フォーカス喪失時にオーディオをポーズ」をオフ、勝手に殴る→マウス入力をRaw Inputに、など設定で直せるものが多い。',
        '徒歩・水泳・運転の基本キー、スマホ（F1/M）、即終了（F8で quit）、キーバインド（bind keyboard）、クロスヘア表示も解説。設定・コマンドはサーバーごとに異なるため最終的には各サーバーで確認を。',
      ]}
      aiSummaryEn={[
        'When performance is heavy, deleting the cache (delete cache / server-cache / server-cache-priv inside data) can help. It does not affect your account or the base game.',
        'Many issues are fixable in settings: buildings not loading → set Extended Texture Budget to max; no sound → check voice chat / turn off "Pause audio on focus loss"; punching by accident → set mouse input to Raw Input.',
        'It also covers basic keys for walking, swimming, and driving, the phone (F1/M), instant quit (quit in F8), keybinds (bind keyboard), and displaying a crosshair. Settings and commands differ by server, so confirm with each server in the end.',
      ]}
    >
      <div className="flex flex-wrap gap-3 mb-12">
        <a
          href="/fivem-gtarp/commands"
          className="inline-flex items-center gap-2 px-4 h-10 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-sm rounded transition-colors"
        >
          <Terminal size={14} /> FiveMコマンド辞典
        </a>
        <a
          href="/fivem-gtarp/how-to-install"
          className="inline-flex items-center gap-2 px-4 h-10 bg-black hover:bg-zinc-800 text-white font-mono text-sm rounded transition-colors border border-white/20"
        >
          <Server size={14} /> FiveMの導入方法
        </a>
        <a
          href="/board/gtarp"
          className="inline-flex items-center gap-2 px-4 h-10 bg-pink-600 hover:bg-pink-500 text-white font-mono text-sm rounded transition-colors"
        >
          <MessageSquare size={14} /> GTARP掲示板で聞く
        </a>
      </div>
    </ArticleLayout>
  );
}
