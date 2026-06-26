import { HelpCircle, Server, MessageSquare } from 'lucide-react';
import ArticleLayout from '@/components/ArticleLayout';

const TITLE = 'FiveMコマンド辞典｜GTARPでよく使うチャットコマンド一覧';

const BODY = `GTARPでは、チャット欄に「/（スラッシュ）」から始まるコマンドを入力することで、職業の確認、救助要請、車の操作、所持金の表示など、さまざまな操作ができる。この記事では、GTA6 FEEDが、初心者がよく使うコマンドを用途ごとに整理した。

なお、ここで紹介するコマンドは、サーバーやバージョン、導入されているスクリプトによって名称や挙動が異なる、あるいは存在しない場合がある。実際に使えるコマンドは、参加しているサーバーのDiscordや案内で確認してほしい。

## 基本・キャラクター系

- **/me** — 自分のキャラクターの状況や行動を、文字で表示する。
- **/job** — 現在の職業を表示する。
- **/name** — ネームタグの初心者マークや、配信中マークの表示・非表示を切り替える。
- **/reloadskin** — スキン（見た目）を再読み込みする。サーバーによっては /refreshskin の場合もある。
- **/closeinv** — インベントリ画面が消えずに残ってしまったときに、強制的に閉じる。

## 救助・通報系

- **/help** — NPCのドクターを呼ぶ。
- **/911** — 警察・救急隊にレポート（通報）する。
- **/911p** — 警察にレポートする。サーバーによっては /311 など、番号が異なる場合がある。
- **/escort** — ダウンしているプレイヤーを護送する。
- **/carry** — 人を担ぐ。担がれた側も /carry を使うと解除できる。

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

## キーバインド関連のコンソール操作

コマンドではないが、F8コンソールからキー割り当ても設定できる。

- **bind keyboard "キー" "内容"** — 指定したキーに、指定した内容（エモートやコマンドなど）を割り当てる。
- **unbind keyboard "キー"** — 割り当てを解除する。設定を更新したいときは、いったんこれで解除してから割り当て直す。
- **quit** — ゲームを終了する。続けてもう一度実行すると即座に終了する。

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

## Rescue / Reporting

- **/help** — Calls an NPC doctor.
- **/911** — Reports to the police/EMS.
- **/911p** — Reports to the police. On some servers the number differs, such as /311.
- **/escort** — Escorts a downed player.
- **/carry** — Carries a person. The carried person can also use /carry to release it.

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

## Console Operations Related to Keybinds

Although not commands, you can also set key assignments from the F8 console.

- **bind keyboard "key" "content"** — Assigns the specified content (an emote, a command, etc.) to the specified key.
- **unbind keyboard "key"** — Releases the assignment. When you want to update a setting, release it once with this, then reassign.
- **quit** — Quits the game. Running it once more after that quits instantly.

## Disclaimer

This article is an explanatory piece organized by GTA6 FEED based on various publicly available information and actual operation, and it has no relationship whatsoever with Rockstar Games or Take-Two Interactive, or with the operators of the various servers. The commands and settings introduced here may differ depending on the server, the version, and the installed scripts, and may change over time. For the latest and accurate information, please check the official information of each server you join.`;

export default function FivemCommandsArticle() {
  return (
    <ArticleLayout
      seoTitle="FiveMコマンド辞典｜GTARPでよく使うチャットコマンド一覧｜GTA6 FEED"
      seoDesc="GTARPでよく使う「/」から始まるチャットコマンドを用途ごとに解説。/me・/job・/911・/escort などの基本コマンドから、車・お金系、クロスヘア（照準）設定コマンド、キーバインド（bind keyboard）まで初心者向けにまとめました。"
      title={TITLE}
      titleEn={TITLE_EN}
      icon="⌨️"
      date="2026-06-27"
      body={BODY}
      bodyEn={BODY_EN}
      seoTitleEn="FiveM Command Dictionary | Chat Commands Commonly Used in GTARP | GTA6 FEED"
      seoDescEn="A purpose-by-purpose guide to the '/' chat commands commonly used in GTARP. From basics like /me, /job, /911, and /escort to vehicle and money commands, crosshair setting commands, and keybinds (bind keyboard)."
      aiSummary={[
        'GTARPのチャットコマンド（/から始まる）を用途別に整理。/me（行動表示）・/job（職業）・/911（通報）・/escort（護送）など基本から、車・お金・施設系まで。',
        'クロスヘア（照準）はF8コンソールに設定コマンドを貼って表示・変更できる。ドット／十字などの設定例と、色の変更（cl_crosshaircolor の数字）・非表示（cl_customCrosshair false）も掲載。ただしサーバーによっては使用禁止。',
        'F8コンソールのキーバインド（bind keyboard / unbind keyboard）や即終了（quit）も解説。コマンドはサーバー・バージョン・スクリプトで名称や有無が異なるため各サーバーで確認を。',
      ]}
      aiSummaryEn={[
        'GTARP chat commands (starting with /) organized by purpose: from basics like /me (show actions), /job, /911 (report), and /escort, to vehicle, money, and facility commands.',
        'A crosshair can be displayed/changed by pasting setting commands into the F8 console. It includes dot/cross examples, color changes (the number in cl_crosshaircolor), and hiding it (cl_customCrosshair false) — but some servers prohibit its use.',
        'It also covers F8 console keybinds (bind keyboard / unbind keyboard) and instant quit (quit). Commands differ in name and availability by server, version, and script, so confirm with each server.',
      ]}
    >
      <div className="flex flex-wrap gap-3 mb-12">
        <a
          href="/fivem-gtarp/faq"
          className="inline-flex items-center gap-2 px-4 h-10 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-sm rounded transition-colors"
        >
          <HelpCircle size={14} /> よくある質問（FAQ）
        </a>
        <a
          href="/fivem-gtarp/what-is-gtarp"
          className="inline-flex items-center gap-2 px-4 h-10 bg-black hover:bg-zinc-800 text-white font-mono text-sm rounded transition-colors border border-white/20"
        >
          <Server size={14} /> GTARPとは？
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
