import { useEffect, useRef } from 'react';
import Header from '@/components/Header';
import { useSeo } from '@/hooks/useSeo';
import BoardGuide from '@/components/BoardGuide';
import { TOOL_GUIDES } from '@/data/boardGuides';
import { useT } from '@/lib/i18n';
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
interface Chara { sex: string; nat: string; nm: CharaName; b: Birth; h: number; blood: string; story: string }

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
function makeStory(nat: string, job: string, persona: string, habit: string): string {
  const home = nat === "jp" ? R(HOME_JP) : R(HOME_US);
  const reason = R(REASON);
  const tpl = Math.floor(Math.random() * 3);
  if (tpl === 0) return `${home}の生まれ。${job}として働いていたが、${reason}この街へ流れ着いた。${persona}性格で、${habit}。`;
  if (tpl === 1) return `${home}の出身。前の街では${job}をしていた。${reason}この街に来たが、本人はあまり昔を語りたがらない。${persona}タイプ。${habit}。`;
  return `${home}で育ち、長く${job}をやっていた。${reason}この街へ。周囲からは「${persona}やつ」と言われている。${habit}。`;
}

export default function CharaMakerTool() {
  const t = useT();
  useSeo(t('tools.charaMaker.seo.title'), t('tools.charaMaker.seo.desc'), { localized: true });
  const rootRef = useRef<HTMLDivElement>(null);
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ac = new AbortController();
    const signal = ac.signal;
    const $ = (id: string): any => root.querySelector('#' + id);
    const tr = (k: string) => tRef.current(k);

    const sexSeg = $('sexSeg'), nat = $('nat'), mn = $('ageMin'), mx = $('ageMax'),
      result = $('result'), listPanel = $('listPanel'), nameList = $('nameList'),
      copyBtn = $('copyBtn');

    let cur: Chara | null = null;

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
      const job = R(JOBS), persona = R(PERSONA), habit = R(HABIT);
      cur = { sex, nat: natV, nm, b, h, blood, story: makeStory(natV, job, persona, habit) };
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
      $('rHeight').textContent = c.h + " cm";
      $('rBlood').textContent = c.blood + "型";
      $('rZodiac').textContent = c.b.zodiac;
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
    $('storyBtn').addEventListener('click', () => {
      if (!cur) return;
      cur.story = makeStory(cur.nat, R(JOBS), R(PERSONA), R(HABIT));
      render();
    }, { signal });

    copyBtn.addEventListener('click', () => {
      if (!cur) return;
      const c = cur;
      const txt = `名前: ${c.nm.name}${c.nm.kana ? "（" + c.nm.kana + "）" : ""}\n性別: ${c.sex === "m" ? "男性" : "女性"}\n生年月日: ${c.b.y}年${c.b.m}月${c.b.d}日（${c.b.age}歳）\n身長: ${c.h}cm\n血液型: ${c.blood}型\nキャラクター設定:\n${c.story}`;
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
                <div className="m"><b>{t('toolC.res.height')}</b><span id="rHeight"></span></div>
                <div className="m"><b>{t('toolC.res.blood')}</b><span id="rBlood"></span></div>
                <div className="m"><b>{t('toolC.res.zodiac')}</b><span id="rZodiac"></span></div>
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
