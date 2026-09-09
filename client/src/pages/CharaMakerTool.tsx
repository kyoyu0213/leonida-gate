import { useEffect, useRef } from 'react';
import Header from '@/components/Header';
import { useSeo } from '@/hooks/useSeo';
import BoardGuide from '@/components/BoardGuide';
import { TOOL_GUIDES } from '@/data/boardGuides';
import { useT, useLang } from '@/lib/i18n';
import './charaMaker.css';
import SiteFooter from '@/components/SiteFooter';

// RPキャラメーカー。
// 検証済みHTML（_reference/rp-chara-maker.html）の挙動を「正」として移植したもの。
// 辞書データ・生成ロジック（名前合成・生年月日と星座・身長の正規分布・血液型の重み抽選・
// 設定文のテンプレ合成）は改変していない。React化にあたって変えたのは、
//   - IIFE → useEffect（AbortController でリスナ解除）
//   - document.getElementById → ルート配下の querySelector（他ページとID衝突させない）
//   - tsc strict 用の型注釈と Date の数値化
// の3点だけ。UIラベルは i18n 化したが、生成される文面（日本語）はデータ側の値をそのまま出す。

/* ============ データ（プロトタイプから未改変で移植） ============ */
const JP_SUR: [string, string][] = [["佐藤","さとう"],["鈴木","すずき"],["高橋","たかはし"],["田中","たなか"],["伊藤","いとう"],["渡辺","わたなべ"],["山本","やまもと"],["中村","なかむら"],["小林","こばやし"],["加藤","かとう"],["吉田","よしだ"],["山田","やまだ"],["佐々木","ささき"],["山口","やまぐち"],["松本","まつもと"],["井上","いのうえ"],["木村","きむら"],["林","はやし"],["斎藤","さいとう"],["清水","しみず"],["山崎","やまざき"],["森","もり"],["池田","いけだ"],["橋本","はしもと"],["阿部","あべ"],["石川","いしかわ"],["中島","なかじま"],["前田","まえだ"],["藤田","ふじた"],["後藤","ごとう"],["岡田","おかだ"],["長谷川","はせがわ"],["村上","むらかみ"],["近藤","こんどう"],["坂本","さかもと"],["遠藤","えんどう"],["青木","あおき"],["藤井","ふじい"],["西村","にしむら"],["福田","ふくだ"],["太田","おおた"],["三浦","みうら"],["藤原","ふじわら"],["岡本","おかもと"],["松田","まつだ"],["中川","なかがわ"],["原田","はらだ"],["小川","おがわ"],["竹内","たけうち"],["金子","かねこ"],["和田","わだ"],["中山","なかやま"],["石田","いしだ"],["上田","うえだ"],["森田","もりた"],["柴田","しばた"],["酒井","さかい"],["工藤","くどう"],["横山","よこやま"],["宮崎","みやざき"],["宮本","みやもと"],["内田","うちだ"],["高木","たかぎ"],["谷口","たにぐち"],["安藤","あんどう"],["今井","いまい"],["河野","こうの"],["藤本","ふじもと"],["村田","むらた"],["武田","たけだ"],["上野","うえの"],["杉山","すぎやま"],["増田","ますだ"],["平野","ひらの"],["久保","くぼ"],["松井","まつい"],["千葉","ちば"],["岩崎","いわさき"],["桜井","さくらい"],["木下","きのした"],["野口","のぐち"],["松尾","まつお"],["野村","のむら"],["菊地","きくち"],["新井","あらい"],["橘","たちばな"],["桐生","きりゅう"],["九条","くじょう"],["一ノ瀬","いちのせ"],["東雲","しののめ"],["御堂","みどう"],["神楽","かぐら"],["白鳥","しらとり"],["鬼塚","おにづか"],["不知火","しらぬい"],["綾瀬","あやせ"],["如月","きさらぎ"],["犬飼","いぬかい"],["大河内","おおこうち"],["榊","さかき"]];
const JP_M: [string, string][] = [["蓮","れん"],["陽翔","はると"],["湊","みなと"],["樹","いつき"],["悠真","ゆうま"],["陸","りく"],["颯太","そうた"],["悠斗","ゆうと"],["大和","やまと"],["瑛太","えいた"],["海斗","かいと"],["翔太","しょうた"],["健太","けんた"],["大輔","だいすけ"],["拓海","たくみ"],["翼","つばさ"],["亮太","りょうた"],["和也","かずや"],["智也","ともや"],["雄大","ゆうだい"],["慎司","しんじ"],["康平","こうへい"],["俊介","しゅんすけ"],["亮介","りょうすけ"],["圭佑","けいすけ"],["隼人","はやと"],["直樹","なおき"],["徹","とおる"],["誠","まこと"],["隆","たかし"],["浩","ひろし"],["学","まなぶ"],["進","すすむ"],["茂","しげる"],["勇","いさむ"],["龍馬","りょうま"],["虎太郎","こたろう"],["銀次","ぎんじ"],["鉄平","てっぺい"],["竜二","りゅうじ"],["嵐","あらし"],["雷蔵","らいぞう"],["錠","じょう"],["政宗","まさむね"],["獅童","しどう"],["岳","がく"],["渉","わたる"],["昴","すばる"],["快","かい"],["新","あらた"]];
const JP_F: [string, string][] = [["陽葵","ひまり"],["凛","りん"],["結菜","ゆいな"],["芽依","めい"],["紬","つむぎ"],["莉子","りこ"],["美咲","みさき"],["葵","あおい"],["結衣","ゆい"],["咲良","さくら"],["花音","かのん"],["美月","みつき"],["彩乃","あやの"],["遥","はるか"],["千夏","ちなつ"],["真由","まゆ"],["愛","あい"],["恵","めぐみ"],["直子","なおこ"],["裕子","ゆうこ"],["明美","あけみ"],["幸子","さちこ"],["椿","つばき"],["鈴音","すずね"],["雫","しずく"],["紅葉","もみじ"],["小夜","さよ"],["琥珀","こはく"],["茜","あかね"],["楓","かえで"],["澪","みお"],["詩","うた"],["蘭","らん"],["朱莉","あかり"],["七海","ななみ"],["京香","きょうか"],["静香","しずか"],["百合","ゆり"],["絹","きぬ"],["胡桃","くるみ"]];
const US_SUR: string[] = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez","Wilson","Anderson","Taylor","Moore","Jackson","Martin","Lee","Walker","Hall","Young","King","Wright","Hill","Scott","Green","Baker","Nelson","Carter","Mitchell","Turner","Parker","Collins","Morgan","Reed","Cook","Bailey","Cooper","Ward","Brooks","Gray","Hayes","Ford","Stone","Fox","Cross","Steele","Vance","Sloane","Burns","Sharp","Wolfe","Dean","Rhodes","Sutton","Boone","Callahan","Delgado","Kane","Monroe","Quinn"];
const US_M: string[] = ["James","Michael","Robert","John","David","William","Richard","Joseph","Thomas","Christopher","Daniel","Matthew","Anthony","Mark","Steven","Andrew","Joshua","Kevin","Brian","Tyler","Ethan","Logan","Mason","Jack","Ryan","Austin","Carlos","Diego","Marcus","Vince","Tony","Eddie","Ray","Frank","Leo","Max","Sam","Cole","Wade","Jax","Dean","Roy","Gus","Hank","Nate"];
const US_F: string[] = ["Mary","Jennifer","Linda","Emily","Emma","Olivia","Ava","Sophia","Mia","Amanda","Jessica","Sarah","Ashley","Rachel","Megan","Lauren","Chloe","Grace","Zoe","Ruby","Scarlett","Violet","Daisy","Roxy","Nina","Faith","Ivy","Jade","Lily","Nora","Stella","Vera","Willow","Piper","Sage","Harley","June","Dixie","Cassidy","Lola"];
const HOME_JP: string[] = ["北海道の漁村","東北の港町","東京の下町","湘南の海沿いの町","名古屋の工場街","大阪の商店街","京都の古い町家通り","神戸の港エリア","広島の川沿いの町","福岡の屋台街の近く","沖縄の離島","山あいの温泉街","地方の農村","雪深い山間の集落","瀬戸内の小さな島"];
const HOME_US: string[] = ["東海岸の港町","西海岸のビーチタウン","中西部の田舎町","南部の小さな町","大都会のダウンタウン","砂漠沿いのモーテル街","五大湖近くの工業都市","山あいのトレーラーパーク"];
const JOBS: string[] = ["タクシー運転手","漁師","ボクサー崩れ","バーテンダー","自動車整備士","警備員","配達ドライバー","屋台の店主","古着屋の店員","消防士","長距離トラックの運転手","美容師","ジムのトレーナー","売れないバンドマン","プログラマー","農家の跡取り","カジノのディーラー","探偵事務所の助手","解体屋","釣り船の船長","レーサー崩れ","パン職人","看護助手","家電量販店の店員","質屋の店番","町工場の旋盤工","ラジオ局の深夜アシスタント","移動販売のコーヒー屋"];
const PERSONA: string[] = ["気前がいいが金遣いが荒い","口は悪いが面倒見がいい","温厚だが敵に回すと誰より怖い","臆病だが土壇場で度胸が据わる","計算高いくせに情に弱い","楽天家で細かいことは気にしない","生真面目で冗談がまったく通じない","人見知りだが酒が入ると別人のように饒舌","負けず嫌いで挑発にめっぽう弱い","マイペースで時間にルーズ","義理堅く、借りは倍にして返す","疑り深いが一度信じた相手はとことん信じる","見栄っ張りで安請け合いしがち","無口だが手先は誰より器用"];
const HABIT: string[] = ["口癖は「まあ、なんとかなるだろ」","緊張すると早口になる","甘いものに目がなく、ポケットに常に飴がある","極度の方向音痴","運転だけは人が変わったように荒い","賭け事になると熱くなりすぎる","なぜか動物によく好かれる","雨の日は古傷が痛むと言い張る","コーヒーの淹れ方に異様なこだわりがある","嘘をつくと目が泳ぐ","考えごとをするとき指でテーブルを叩く癖がある","初対面の相手をあだ名で呼びがち","財布に昔の写真を一枚だけ入れている","絶対に人前でサングラスを外さない"];
const REASON: string[] = ["抱えた借金から逃げるように","一攫千金を夢見て","家族と縁を切って","消息を絶った昔の相棒を探しに","新しい商売を始める資金を作るため","過去を清算するため","恩人に呼ばれて","事故ですべてを失い、再起をかけて","兄弟が残した店を継ぐはずが行き違いで","気づけば流れ流れて"];
const BLOOD_JP: [string, number][] = [["A",38],["O",31],["B",22],["AB",9]];
const BLOOD_US: [string, number][] = [["O",45],["A",40],["B",11],["AB",4]];
const ZODIAC: [string, number][] = [["やぎ座",120],["みずがめ座",219],["うお座",321],["おひつじ座",420],["おうし座",521],["ふたご座",622],["かに座",723],["しし座",823],["おとめ座",923],["てんびん座",1024],["さそり座",1123],["いて座",1222],["やぎ座",1232]];

/* ============ ユーティリティ ============ */
const R = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
function weighted(list: [string, number][]): string {
  let t = list.reduce((s, x) => s + x[1], 0), r = Math.random() * t;
  for (const [x, w] of list) { if ((r -= w) < 0) return x; }
  return list[0][0];
}
function gauss(mean: number, sd: number): number {
  let u = 0, v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/* ============ 生成 ============ */
interface CharaName { name: string; kana: string }
interface Birth { y: number; m: number; d: number; age: number; zodiac: string }
interface Body { build: string; hairColor: string; hairStyle: string; eye: string; mark: string }
interface Chara {
  sex: string; nat: string; nm: CharaName; b: Birth; h: number; blood: string;
  occ: Occupation; body: Body;
  strength: string; weakness: string; goal: string; fear: string;
  story: string;
}

function makeName(nat: string, sex: string): CharaName {
  if (nat === "jp") { const s = R(JP_SUR), g = sex === "m" ? R(JP_M) : R(JP_F); return { name: s[0] + " " + g[0], kana: s[1] + " " + g[1] }; }
  const g = sex === "m" ? R(US_M) : R(US_F); return { name: g + " " + R(US_SUR), kana: "" };
}
function makeBirth(minA: number, maxA: number): Birth {
  const now = new Date();
  const age = minA + Math.floor(Math.random() * (maxA - minA + 1));
  const y = now.getFullYear() - age;
  const m = 1 + Math.floor(Math.random() * 12), d = 1 + Math.floor(Math.random() * 28);
  const bd = new Date(y, m - 1, d);
  const realAge = Math.floor((now.getTime() - bd.getTime()) / 31557600000);
  const md = m * 100 + d; let z = "やぎ座"; for (const [nm, lim] of ZODIAC) { if (md < lim) { z = nm; break; } }
  return { y, m, d, age: realAge, zodiac: z };
}
/* ============ 追加データ（職業・身体・強み/弱み・目標/恐れ） ============ */
// 身体項目はすべて職業と無関係のランダム。職業で偏らせない。
const BUILD: string[] = ["細身", "中肉中背", "がっしりした体格", "筋肉質", "ぽっちゃり", "長身痩躯", "小柄で引き締まった体格"];
const HAIR_COLOR: string[] = ["黒", "焦げ茶", "明るい茶", "金", "赤", "銀", "青", "ピンク", "メッシュ入りの黒"];
const HAIR_STYLE: string[] = ["短髪", "刈り上げ", "センター分け", "ミディアム", "ロング", "ポニーテール", "ツーブロック", "坊主", "パーマ", "三つ編み", "お団子", "無造作な寝癖ヘア"];
const EYE: string[] = ["黒", "焦げ茶", "茶", "青", "灰", "緑", "琥珀", "オッドアイ"];
const MARK: string[] = ["左眉の古い傷跡", "首筋のタトゥー", "腕一面のタトゥー", "両耳のピアス", "鼻ピアス", "目元の泣きぼくろ", "口元のほくろ", "頬の細い傷", "手の甲の火傷跡", "特になし", "特になし"];

// 職業ごとの味付け。辞書を膨らませすぎないよう、各項目3〜4個に絞る。
interface Occupation {
  id: string;
  ja: string;
  en: string;
  /** その職に就く前の仕事 */
  prev: string[];
  /** その職に就いた理由 */
  why: string[];
  /** その職ならではの癖 */
  quirk: string[];
  strengths: string[];
  weaknesses: string[];
  goals: string[];
  fears: string[];
}

const OCCUPATIONS: Occupation[] = [
  {
    id: "free", ja: "フリーランス・無職", en: "Freelance / unemployed",
    prev: ["売れないバンドマン", "地方紙の記者", "何でも屋の助手"],
    why: ["やりたいことを探しに来たと本人は言う", "雇われるのが性に合わないらしい", "前の仕事を辞めた理由は、聞く相手によって説明が違う"],
    quirk: ["名刺の肩書きが会うたびに変わる", "気になったことは何でもメモする", "朝と夜が完全に逆転している"],
    strengths: ["どこにでも顔を出せる身軽さ", "話を引き出すのがうまい", "好奇心が強い", "どの陣営にもつける"],
    weaknesses: ["収入が安定しない", "飽きっぽい", "首を突っ込みすぎる"],
    goals: ["この街で食っていける仕事を見つけること", "誰も知らない話を最初に掴むこと", "名前を覚えてもらうこと"],
    fears: ["何者にもなれないまま終わること", "家賃が払えなくなること", "街に居場所がなくなること"],
  },
  {
    id: "police", ja: "警察官", en: "Police officer",
    prev: ["交通誘導の警備員", "地元の消防団員", "法律を学んでいた学生"],
    why: ["昔、事件に巻き込まれた家族を守れなかったからだという", "知り合いの警官に拾われ、そのままこの道へ進んだ", "「この街は誰かが線を引かないと終わる」が口癖"],
    quirk: ["非番の日でも人の手元を無意識に見てしまう", "報告書の書式にやたらうるさい", "無線の呼び出し音で反射的に立ち上がる"],
    strengths: ["どんな現場でも冷静さを失わない", "責任感が強い", "場を制する声の張り", "人の顔と名前を忘れない"],
    weaknesses: ["融通が利かない", "仕事を抱え込みすぎる", "身内に甘い"],
    goals: ["この街の凶悪犯を一人残らず挙げること", "後輩を一人前の警官に育てること", "昔の未解決事件に決着をつけること"],
    fears: ["守るべき相手を守れないこと", "自分が越えてはいけない線を踏むこと", "身内が事件に巻き込まれること"],
  },
  {
    id: "ems", ja: "救急・医療", en: "EMS / medical",
    prev: ["看護助手", "介護施設の職員", "医学部を中退した学生"],
    why: ["目の前で人が死ぬのを一度見てから進路を変えた", "家族が医療従事者で、当たり前のようにこの道へ来た", "「誰かの最悪の日に居合わせる仕事」がしたかったという"],
    quirk: ["人の顔色をつい観察してしまう", "カバンに常に手袋とガーゼを入れている", "サイレンの音がすると会話を止める"],
    strengths: ["どんな現場でも手が震えない", "観察眼が鋭い", "誰にでも分け隔てなく接する", "体力がある"],
    weaknesses: ["自分のことは後回しにする", "眠らずに働きすぎる", "患者に情を移しすぎる"],
    goals: ["搬送した人を一人も死なせないこと", "街のどこへでも数分で駆けつけられる体制を作ること", "昔助けられなかった人の分まで働くこと"],
    fears: ["自分の判断ミスで人を失うこと", "血の匂いに慣れてしまうこと", "人手の足りない夜"],
  },
  {
    id: "fire", ja: "消防", en: "Firefighter",
    prev: ["建設現場の作業員", "山岳ガイド", "ジムのトレーナー"],
    why: ["子どもの頃に助けられた消防士に憧れて", "体力しか取り柄がないと笑いながら話す", "焼け落ちた実家の記憶が理由だという"],
    quirk: ["建物に入るとまず非常口を確認する", "装備の点検を1日に何度もやる", "焦げた匂いに人一倍敏感"],
    strengths: ["度胸がある", "仲間との連携がうまい", "力仕事に強い", "責任感が強い"],
    weaknesses: ["無茶をしがち", "細かい書類仕事が苦手", "休むのが下手"],
    goals: ["この街で焼死者を出さないこと", "若い隊員を全員無事に帰すこと", "もう一度あの現場をやり直すこと"],
    fears: ["逃げ遅れた誰かを見落とすこと", "仲間を失うこと", "炎の音"],
  },
  {
    id: "mechanic", ja: "メカニック・整備士", en: "Mechanic",
    prev: ["解体屋の下働き", "レース場のピットクルー", "町工場の旋盤工"],
    why: ["親の工場を継ぐつもりが、途中で街へ出てきた", "車の音を聞き分けられるのが自慢", "「機械は嘘をつかない」が持論"],
    quirk: ["爪の間の油汚れが落ちない", "エンジン音だけで不調を当てにいく", "工具の並びを人に触られると不機嫌になる"],
    strengths: ["手先が誰より器用", "不調の原因を見抜く勘", "粘り強い", "値段交渉がうまい"],
    weaknesses: ["口下手", "気に入らない客をあからさまに嫌う", "部品に金をかけすぎる"],
    goals: ["自分の名前で店を持つこと", "街で一番速い車を仕上げること", "畳んだ工場を買い戻すこと"],
    fears: ["自分の整備ミスで事故が起きること", "手が動かなくなること", "借金で工具を手放すこと"],
  },
  {
    id: "cafe", ja: "カフェ・飲食店員", en: "Café / restaurant staff",
    prev: ["ホテルの厨房", "移動販売のコーヒー屋", "パン職人の見習い"],
    why: ["人が食事をしている時間を眺めているのが好きだという", "住み込みで働ける場所を探していた", "味は褒められるが経営はからきしだと自分で言う"],
    quirk: ["他店の味をつい分析してしまう", "客の顔と注文を丸ごと覚えている", "閉店後にひとりで試作を続ける"],
    strengths: ["人当たりがいい", "段取りがうまい", "誰の顔も覚えている", "味に妥協しない"],
    weaknesses: ["断るのが苦手", "原価計算に弱い", "トラブルを一人で抱え込む"],
    goals: ["自分の店を街の溜まり場にすること", "看板メニューを一つ作り上げること", "常連を100人つくること"],
    fears: ["店を畳むことになること", "常連に見放されること", "厨房から火を出すこと"],
  },
  {
    id: "office", ja: "会社員・実業家", en: "Office worker / entrepreneur",
    prev: ["不動産の営業", "保険の外交員", "家業の跡取り"],
    why: ["数字で人生を立て直すつもりでこの街へ来た", "「信用は現金より重い」が口癖", "前の会社を追い出された話は本人がしたがらない"],
    quirk: ["名刺入れを肌身離さず持っている", "相手の靴を見て値踏みする癖がある", "会話の途中で急にメモを取り出す"],
    strengths: ["交渉がうまい", "数字に強い", "人脈が広い", "身なりに隙がない"],
    weaknesses: ["損得で人を見がち", "見栄を張る", "現場仕事に向かない"],
    goals: ["街で一番大きな取引をまとめること", "自分の会社を持つこと", "失った信用を取り戻すこと"],
    fears: ["無一文に戻ること", "裏切られること", "名前に傷がつくこと"],
  },
  {
    id: "driver", ja: "タクシー・運送ドライバー", en: "Taxi / delivery driver",
    prev: ["長距離トラックの運転手", "レーサー崩れ", "配達ドライバー"],
    why: ["座って街を眺めていられる仕事を選んだ", "運転だけは誰にも負けないという自負がある", "事故で選手生命を絶たれ、それでもハンドルに戻った"],
    quirk: ["街の抜け道をすべて把握している", "助手席に物を置かせない", "客の話を覚えていて後日蒸し返す"],
    strengths: ["度胸のある運転", "街の地理に明るい", "話を聞くのがうまい", "時間に正確"],
    weaknesses: ["運転が荒い", "口が軽い", "じっとしているのが苦手"],
    goals: ["自分の車を一台持つこと", "街の全通りを走破すること", "家族への仕送りを続けること"],
    fears: ["免許を失うこと", "乗せた客に何かあること", "二度と運転できなくなること"],
  },
  {
    id: "gang", ja: "ギャング・組織構成員", en: "Gang member",
    prev: ["解体屋", "裏カジノのディーラー", "ボクサー崩れ"],
    why: ["食うために拾ってくれたのが、その組織だった", "身内を潰された落とし前をつけるため", "堅気の仕事に戻る気はないと言い切る"],
    quirk: ["店に入るとまず出口を確認する", "仲間以外には本名を名乗らない", "財布より先に相手の手元を見る"],
    strengths: ["度胸がある", "仲間思い", "修羅場慣れしている", "顔が広い"],
    weaknesses: ["短気", "警察を見ると態度が変わる", "一度キレると引かない"],
    goals: ["組織を街で一番にすること", "拾ってくれた相手に返しきること", "いつか足を洗って堅気になること"],
    fears: ["仲間に裏切られること", "刑務所で終わること", "巻き込みたくない相手を巻き込むこと"],
  },
];

const OCC_BY_ID: Record<string, Occupation> = Object.fromEntries(OCCUPATIONS.map((o) => [o.id, o]));

// 職業に寄せきらないための汎用プール。職業プールと混ぜて抽選する。
const STRENGTH_ANY: string[] = ["物覚えが早い", "場の空気を読むのがうまい", "嘘を見抜く", "打たれ強い", "誰とでもすぐ打ち解ける", "一度決めたら曲げない"];
const WEAKNESS_ANY: string[] = ["酒に弱い", "金にだらしない", "朝が弱い", "人を信じすぎる", "こらえ性がない", "方向音痴"];
const GOAL_ANY: string[] = ["この街に自分の居場所を作ること", "昔の恩人にもう一度会うこと", "誰にも頼らず生きていけるようになること", "失った時間を取り戻すこと"];
const FEAR_ANY: string[] = ["ひとりで死ぬこと", "過去を知られること", "また同じ失敗を繰り返すこと", "誰かに必要とされなくなること"];

/** 7割は職業プール、3割は汎用プールから引く（職業に寄せつつ固定化させない）。 */
const mixed = (job: string[], any: string[]): string => (Math.random() < 0.7 ? R(job) : R(any));

function makeBody(): Body {
  return { build: R(BUILD), hairColor: R(HAIR_COLOR), hairStyle: R(HAIR_STYLE), eye: R(EYE), mark: R(MARK) };
}

/** 設定文。既存のテンプレ合成に、選んだ職業の「前職・就いた理由・その職ならではの癖」を織り込む。 */
function makeStory(nat: string, occ: Occupation, persona: string, habit: string): string {
  const home = nat === "jp" ? R(HOME_JP) : R(HOME_US);
  const reason = R(REASON);
  // 前職は職業ごとの候補と、従来の職業辞書を半々で使う。
  const prev = Math.random() < 0.5 ? R(occ.prev) : R(JOBS);
  const why = R(occ.why);
  const quirk = R(occ.quirk);
  const tpl = Math.floor(Math.random() * 3);
  if (tpl === 0) return `${home}の生まれ。前の街では${prev}。${reason}この街へ流れ着き、いまは${occ.ja}として暮らしている。${why}。${persona}——そう言われるタイプで、${quirk}。`;
  if (tpl === 1) return `${home}の出身。${prev}を経て、${reason}この街に来た。現在は${occ.ja}。性格は「${persona}」。${habit}。`;
  return `${home}で育ち、もとは${prev}。${reason}この街へ。いまは${occ.ja}に落ち着いている。周囲からは「${persona}」と言われていて、${quirk}。`;
}

export default function CharaMakerTool() {
  const t = useT();
  const lang = useLang();
  useSeo(t('tools.charaMaker.seo.title'), t('tools.charaMaker.seo.desc'), { localized: true });
  const rootRef = useRef<HTMLDivElement>(null);
  const tRef = useRef(t);
  tRef.current = t;
  const langRef = useRef(lang);
  langRef.current = lang;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ac = new AbortController();
    const signal = ac.signal;
    const $ = (id: string): any => root.querySelector('#' + id);
    const tr = (k: string) => tRef.current(k);
    const occLabel = (o: Occupation) => (langRef.current === 'en' ? o.en : o.ja);

    const sexSeg = $('sexSeg'), nat = $('nat'), occSel = $('occ'), mn = $('ageMin'), mx = $('ageMax'),
      result = $('result'), listPanel = $('listPanel'), nameList = $('nameList'),
      copyBtn = $('copyBtn');

    let cur: Chara | null = null;

    /** セレクトの値から職業を決める。'r'（おまかせ）なら9職から抽選。 */
    function pickOcc(): Occupation {
      const v = occSel.value;
      return v === 'r' ? R(OCCUPATIONS) : OCC_BY_ID[v];
    }

    function generate(fixedName?: CharaName) {
      const sexSel = sexSeg.querySelector('.on').dataset.v;
      const sex = sexSel === "r" ? (Math.random() < .5 ? "m" : "f") : sexSel;
      const natV = nat.value;
      let a1 = +mn.value, a2 = +mx.value;
      if (a1 > a2) [a1, a2] = [a2, a1];
      const nm = fixedName || makeName(natV, sex);
      const b = makeBirth(a1, a2);
      const hM: [number, number] = natV === "jp" ? [171, 6] : [178, 7];
      const hF: [number, number] = natV === "jp" ? [158, 5.5] : [164, 6];
      const h = Math.round(gauss(...(sex === "m" ? hM : hF)));
      const blood = weighted(natV === "jp" ? BLOOD_JP : BLOOD_US);
      const occ = pickOcc();
      const persona = R(PERSONA), habit = R(HABIT);
      cur = {
        sex, nat: natV, nm, b, h, blood, occ, body: makeBody(),
        strength: mixed(occ.strengths, STRENGTH_ANY),
        weakness: mixed(occ.weaknesses, WEAKNESS_ANY),
        goal: mixed(occ.goals, GOAL_ANY),
        fear: mixed(occ.fears, FEAR_ANY),
        story: makeStory(natV, occ, persona, habit),
      };
      render();
    }

    function render() {
      const c = cur!;
      result.classList.add('on');
      $('rName').textContent = c.nm.name;
      $('rKana').textContent = c.nm.kana;
      $('rSex').textContent = c.sex === "m" ? "男性" : "女性";
      $('rBirth').textContent = `${c.b.y}年${c.b.m}月${c.b.d}日`;
      $('rAge').textContent = c.b.age + "歳";
      $('rOcc').textContent = occLabel(c.occ);
      $('rHeight').textContent = c.h + " cm";
      $('rBuild').textContent = c.body.build;
      $('rHairColor').textContent = c.body.hairColor;
      $('rHairStyle').textContent = c.body.hairStyle;
      $('rEye').textContent = c.body.eye;
      $('rMark').textContent = c.body.mark;
      $('rBlood').textContent = c.blood + "型";
      $('rZodiac').textContent = c.b.zodiac;
      $('rStrength').textContent = c.strength;
      $('rWeakness').textContent = c.weakness;
      $('rGoal').textContent = c.goal;
      $('rFear').textContent = c.fear;
      $('rStory').textContent = c.story;
      copyBtn.classList.remove('done');
      copyBtn.textContent = tr('toolC.copy');
    }

    /* ---- UI ---- */
    const segBtns: any[] = [...sexSeg.querySelectorAll('button')];
    segBtns.forEach((b) => b.addEventListener('click', () => {
      segBtns.forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
    }, { signal }));

    for (let a = 18; a <= 65; a++) {
      mn.add(new Option(a + tr('toolC.age.unit'), String(a)));
      mx.add(new Option(a + tr('toolC.age.unit'), String(a)));
    }
    mn.value = 20; mx.value = 45;

    $('genBtn').addEventListener('click', () => generate(), { signal });
    $('againBtn').addEventListener('click', () => generate(), { signal });

    // 「設定だけ引き直す」：名前・生年月日・身体項目・職業はそのまま、
    // 設定文と強み/弱み・目標/恐れだけを引き直す。
    $('storyBtn').addEventListener('click', () => {
      if (!cur) return;
      const occ = cur.occ;
      cur.strength = mixed(occ.strengths, STRENGTH_ANY);
      cur.weakness = mixed(occ.weaknesses, WEAKNESS_ANY);
      cur.goal = mixed(occ.goals, GOAL_ANY);
      cur.fear = mixed(occ.fears, FEAR_ANY);
      cur.story = makeStory(cur.nat, occ, R(PERSONA), R(HABIT));
      render();
    }, { signal });

    copyBtn.addEventListener('click', () => {
      if (!cur) return;
      const c = cur;
      const txt = [
        `名前: ${c.nm.name}${c.nm.kana ? "（" + c.nm.kana + "）" : ""}`,
        `性別: ${c.sex === "m" ? "男性" : "女性"}`,
        `生年月日: ${c.b.y}年${c.b.m}月${c.b.d}日（${c.b.age}歳）`,
        `職業: ${c.occ.ja}`,
        `身長: ${c.h}cm ／ 体格: ${c.body.build}`,
        `髪: ${c.body.hairColor}・${c.body.hairStyle} ／ 目: ${c.body.eye}`,
        `特徴: ${c.body.mark}`,
        `血液型: ${c.blood}型`,
        `強み: ${c.strength} ／ 弱み: ${c.weakness}`,
        `目標: ${c.goal}`,
        `恐れているもの: ${c.fear}`,
        `キャラクター設定:`,
        c.story,
      ].join("\n");
      const done = () => { copyBtn.classList.add('done'); copyBtn.textContent = tr('toolC.copied'); };
      const fallback = (text: string, cb: () => void) => {
        const ta = document.createElement('textarea');
        ta.value = text; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); cb(); } catch (e) { }
        document.body.removeChild(ta);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(done).catch(() => fallback(txt, done));
      } else fallback(txt, done);
    }, { signal });

    $('gen10Btn').addEventListener('click', () => {
      const sexSel = sexSeg.querySelector('.on').dataset.v;
      const natV = nat.value;
      nameList.innerHTML = "";
      for (let i = 0; i < 10; i++) {
        const sex = sexSel === "r" ? (Math.random() < .5 ? "m" : "f") : sexSel;
        const nm = makeName(natV, sex);
        const li = document.createElement('li');
        if (nm.kana) {
          const small = document.createElement('small');
          small.textContent = nm.kana;
          li.appendChild(small);
        }
        li.appendChild(document.createTextNode(nm.name));
        li.addEventListener('click', () => {
          generate(nm);
          result.scrollIntoView({ behavior: 'smooth' });
        }, { signal });
        nameList.appendChild(li);
      }
      listPanel.classList.add('on');
    }, { signal });

    return () => ac.abort();
  }, []);

  return (
    <div className="vice-page vice-noise">
      <Header />

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[100px] pb-20 relative z-10">
        <div className="chara-maker-tool" ref={rootRef}>
          <div className="wrap">
            <div className="eyebrow">{t('tool.eyebrow')}</div>
            <h1>{t('toolC.h1.pre')}<span className="hl">{t('toolC.h1.hl')}</span></h1>
            <p className="sub">{t('toolC.sub')}</p>
            <div className="privacy"><b>{t('toolC.privacy.bold')}</b>{t('toolC.privacy.rest')}</div>

            <div className="panel">
              <div className="row">
                <div className="field">
                  <label htmlFor="sexSeg">{t('toolC.lab.sex')}</label>
                  <div className="seg" id="sexSeg">
                    <button type="button" data-v="m" className="on">{t('toolC.sex.m')}</button>
                    <button type="button" data-v="f">{t('toolC.sex.f')}</button>
                    <button type="button" data-v="r">{t('toolC.sex.r')}</button>
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="nat">{t('toolC.lab.nat')}</label>
                  <select id="nat" defaultValue="jp">
                    <option value="jp">{t('toolC.nat.jp')}</option>
                    <option value="us">{t('toolC.nat.us')}</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="occ">{t('toolC.lab.occ')}</label>
                  <select id="occ" defaultValue="free">
                    {OCCUPATIONS.map((o) => (
                      <option key={o.id} value={o.id}>{lang === 'en' ? o.en : o.ja}</option>
                    ))}
                    <option value="r">{t('toolC.occ.random')}</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="ageMin">{t('toolC.lab.age')}</label>
                  <div className="agebox">
                    <select id="ageMin" aria-label={t('toolC.lab.ageMin')}></select>
                    <span className="tilde">〜</span>
                    <select id="ageMax" aria-label={t('toolC.lab.ageMax')}></select>
                  </div>
                </div>
              </div>
              <div className="btns">
                <button type="button" className="gen" id="genBtn">{t('toolC.gen')}</button>
                <button type="button" className="gen10" id="gen10Btn">{t('toolC.gen10')}</button>
              </div>
            </div>

            <div className="panel result" id="result">
              <div className="namebox">
                <div className="kana" id="rKana"></div>
                <div className="name" id="rName"></div>
              </div>
              <div className="meta">
                <div className="m"><b>{t('toolC.res.sex')}</b><span id="rSex"></span></div>
                <div className="m"><b>{t('toolC.res.birth')}</b><span id="rBirth"></span></div>
                <div className="m"><b>{t('toolC.res.age')}</b><span id="rAge"></span></div>
                <div className="m"><b>{t('toolC.res.occ')}</b><span id="rOcc"></span></div>
                <div className="m"><b>{t('toolC.res.height')}</b><span id="rHeight"></span></div>
                <div className="m"><b>{t('toolC.res.build')}</b><span id="rBuild"></span></div>
                <div className="m"><b>{t('toolC.res.hairColor')}</b><span id="rHairColor"></span></div>
                <div className="m"><b>{t('toolC.res.hairStyle')}</b><span id="rHairStyle"></span></div>
                <div className="m"><b>{t('toolC.res.eye')}</b><span id="rEye"></span></div>
                <div className="m"><b>{t('toolC.res.mark')}</b><span id="rMark"></span></div>
                <div className="m"><b>{t('toolC.res.blood')}</b><span id="rBlood"></span></div>
                <div className="m"><b>{t('toolC.res.zodiac')}</b><span id="rZodiac"></span></div>
              </div>
              <div className="traits">
                <div className="tr"><b>{t('toolC.res.strength')}</b><span id="rStrength"></span></div>
                <div className="tr"><b>{t('toolC.res.weakness')}</b><span id="rWeakness"></span></div>
                <div className="tr"><b>{t('toolC.res.goal')}</b><span id="rGoal"></span></div>
                <div className="tr"><b>{t('toolC.res.fear')}</b><span id="rFear"></span></div>
              </div>
              <div className="story"><b>{t('toolC.res.story')}</b><span id="rStory"></span></div>
              <div className="sub-actions">
                <button type="button" id="againBtn">{t('toolC.again')}</button>
                <button type="button" id="storyBtn">{t('toolC.storyAgain')}</button>
                <button type="button" id="copyBtn">{t('toolC.copy')}</button>
              </div>
            </div>

            <div className="panel list" id="listPanel">
              <h2>{t('toolC.list.title')}</h2>
              <ul id="nameList"></ul>
            </div>

            <p className="note">{t('toolC.note')}</p>

            <p className="footnote">
              {t('toolC.footnote.privacy')}<br />
              {t('toolC.footnote.b')}
            </p>
          </div>
        </div>
        {/* ツール本体はブラウザ内で動くUIのため、生HTMLに実コンテンツを残すのはこのブロック。 */}
        <BoardGuide content={TOOL_GUIDES['chara-maker']} />
      </main>

      <SiteFooter width={1100} />
    </div>
  );
}
