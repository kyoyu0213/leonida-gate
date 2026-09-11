import { useState } from 'react';
import Header from '@/components/Header';
import { useSeo } from '@/hooks/useSeo';
import BoardGuide from '@/components/BoardGuide';
import LocalLink from '@/components/LocalLink';
import { TOOL_GUIDES } from '@/data/boardGuides';
import { useT } from '@/lib/i18n';
import './rpScenario.css';
import SiteFooter from '@/components/SiteFooter';

// RPお題（シチュエーション）ジェネレーター。
// クルー名ジェネレーター（CrewNameTool）と同じ型：ゼロ通信（fetch なし）・結果はメモリ内だけ・
// ツール本体の下に BoardGuide で解説を置き、プリレンダの生HTMLにはその解説が残る。
//
// お題はテンプレートの {PLACE}{PERSON}{OBJECT}{MOTIVE} を語彙から埋めて作る。
// 語彙はすべて架空の場面用で、実在の事件・人物・団体は入れない。

/* ============ 語彙 ============ */
export type ScenarioGenre = 'crime' | 'emergency' | 'slice' | 'business' | 'drama' | 'chaos' | 'incident';
export const SCENARIO_GENRES: ScenarioGenre[] = ['crime', 'emergency', 'slice', 'business', 'drama', 'chaos', 'incident'];

const SLOTS: Record<'PLACE' | 'PERSON' | 'MOTIVE', string[]> = {
  PLACE: ["ダウンタウンの路地","港の倉庫","24時間営業のガソリンスタンド","高速道路のパーキング","場末のバー","高級住宅街の一角","ビーチ沿いの駐車場","廃工場","病院の裏口","ナイトクラブの搬入口","中古車ディーラー","質屋のカウンター","深夜のダイナー","安モーテルの一室","地下駐車場","橋の下","無人の埠頭","街外れのガソリンスタンド"],
  PERSON: ["見知らぬ配達人","借金取り","かつての相棒","覆面の依頼人","酔った常連客","新人の警官","地元の顔役","嗅ぎ回る記者","匿名の内部告発者","羽振りのいい商人","訳ありの流れ者","古い馴染み","見覚えのある人物","若いチンピラ","引退したはずの元プロ"],
  MOTIVE: ["借金を返す","仲間を助け出す","証拠を消す","筋を通す","評判を上げる","縄張りを守る","家族を守る","過去を清算する","一発逆転を狙う","恩を返す"],
};

// {OBJECT} は物の性質で2つのプールに分け、ジャンルごとに使うプールを固定する。
// 以前は1つの配列に混ぜていたため、古い写真を運ぶ仕事が大げさな取引として語られるなど、
// 個人的な小物が取引・事件の枠に入って意味が通らない文が出ていた。
/** 取引・事件になりうる価値物（crime / business / incident） */
export const GOODS = ["中身の分からないバッグ","札束","一本のUSBメモリ","盗難車のキー","偽造書類の束","中身不明の小包","高価な腕時計"];
/** 個人的な意味を持つ物（slice / drama） */
export const PERSONAL = ["古い写真","封を切っていない手紙","血のついた上着","誰かの携帯電話","名前だけ書かれたメモ"];
/** どちらでも成り立つジャンル用（emergency / chaos） */
const ANY_OBJECT = [...GOODS, ...PERSONAL];

/** ひとひねり（TWIST_RATE の確率で1行添える）。 */
const TWISTS = ["実はこれは罠だった","警察が近くで張り込んでいる","制限時間はわずかしかない","信頼していた相手が裏切る","予想外の目撃者がいる","金額（条件）が話と違う","相手は別の目的を隠している","仲間の一人が寝返る","本物とすり替えられている","通報が入り時間がない"];
const TWIST_RATE = 0.6;

/** おすすめ人数（ジャンル横断）。 */
const PLAYERS = ["ソロ向き", "2〜3人向き", "4人以上/イベント向き"];

interface GenreDef {
  templates: string[];
  /** {OBJECT} を引くプール */
  objectPool: string[];
  /** 想定ロール */
  role: string;
  /** 雰囲気 */
  mood: string;
}

// テンプレートは指示の文面が基本。{MOTIVE} は「〜ために、〜」の形でつなぐ。
// business の1本目だけ、「{PLACE}の商売は順調」にすると「橋の下の商売」「無人の埠頭の商売」が
// 出るため、場所を「現れた」側へ回している。
const GENRES: Record<ScenarioGenre, GenreDef> = {
  crime: {
    role: '犯罪者/ギャング', mood: 'シリアス', objectPool: GOODS,
    templates: [
      "{PLACE}で{PERSON}から{OBJECT}を受け取る——それが今回の仕事だ。",
      "{OBJECT}を{PLACE}まで運ぶ仕事が入った。{MOTIVE}ために、断るわけにはいかない。",
      "{PERSON}の依頼は単純だった：{PLACE}で{OBJECT}を手に入れること。",
    ],
  },
  emergency: {
    role: '警察/EMS', mood: 'シリアス', objectPool: ANY_OBJECT,
    templates: [
      "{PLACE}で通報。現場に着くと{PERSON}が{OBJECT}を巡って揉めている。",
      "{PLACE}で事故。負傷者は{PERSON}。だが様子がどこかおかしい。",
      "無線が入る——{PLACE}に不審な{PERSON}。応援は遠い。",
    ],
  },
  slice: {
    role: '民間/一般', mood: 'ライト', objectPool: PERSONAL,
    templates: [
      "{PLACE}でいつもの一日。ところが{PERSON}が{OBJECT}を持って現れる。",
      "{PERSON}との待ち合わせは{PLACE}。ささいな約束のはずだった。",
    ],
  },
  business: {
    role: '経営者/民間', mood: 'ドライ', objectPool: GOODS,
    templates: [
      "商売は順調——のはずが、{PLACE}に現れた{PERSON}が{OBJECT}がらみの取引を持ちかけてきた。",
      "{PERSON}との商談。{MOTIVE}ために、この取引は落とせない。",
    ],
  },
  drama: {
    role: '誰でも', mood: 'エモ', objectPool: PERSONAL,
    templates: [
      "{PERSON}からの呼び出しは{PLACE}。そこで{OBJECT}を突きつけられる。",
      "{PLACE}で{PERSON}と鉢合わせる。{MOTIVE}べきか、気持ちが揺れる。",
    ],
  },
  chaos: {
    role: '誰でも', mood: 'カオス', objectPool: ANY_OBJECT,
    templates: [
      "{PLACE}で、なぜか{PERSON}が{OBJECT}を配り始めた。あなたも巻き込まれる。",
      "{OBJECT}を賭けて、{PLACE}で{PERSON}と勝負することになった。",
    ],
  },
  incident: {
    role: '緊急系/誰でも', mood: '緊迫', objectPool: GOODS,
    templates: [
      "{PLACE}が突然騒然となる。{PERSON}が{OBJECT}を持ち出し、逃げ場はない。",
      "{PLACE}で予期せぬ事態。手元には{OBJECT}だけ。{MOTIVE}しかない。",
    ],
  },
};

/* ============ 生成 ============ */
const R = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];

export interface Scenario {
  genre: ScenarioGenre;
  body: string;
  /** ひとひねり（無い案は null） */
  twist: string | null;
  role: string;
  mood: string;
  players: string;
}

type SlotKey = keyof typeof SLOTS | 'OBJECT';

/** テンプレートのスロットを埋める。{OBJECT} はジャンルのプールから引く。同じスロットが2回出ても同じ語で埋める。 */
function fill(template: string, objectPool: string[]): string {
  const picked: Partial<Record<SlotKey, string>> = {};
  return template.replace(/\{(PLACE|PERSON|OBJECT|MOTIVE)\}/g, (_, k: SlotKey) =>
    (picked[k] ??= R(k === 'OBJECT' ? objectPool : SLOTS[k])));
}

export function makeScenario(genre: ScenarioGenre): Scenario {
  const g = GENRES[genre];
  return {
    genre,
    body: fill(R(g.templates), g.objectPool),
    twist: Math.random() < TWIST_RATE ? R(TWISTS) : null,
    role: g.role,
    mood: g.mood,
    players: R(PLAYERS),
  };
}

/** 一度に出す案の数（お題は長いので3案）。 */
const BATCH = 3;

/** 案を count 件作る。'random'（おまかせ）なら1件ごとにジャンルを抽選する。1回の生成で本文を重複させない。 */
export function makeScenarios(choice: ScenarioGenre | 'random', count = BATCH): Scenario[] {
  const out: Scenario[] = [];
  const seen = new Set<string>();
  for (let tries = 0; out.length < count && tries < count * 30; tries++) {
    const s = makeScenario(choice === 'random' ? R(SCENARIO_GENRES) : choice);
    if (seen.has(s.body)) continue;
    seen.add(s.body);
    out.push(s);
  }
  return out;
}

/** コピー用の文面（本文＋ひとひねり）。 */
export function scenarioText(s: Scenario): string {
  return s.twist ? `${s.body}\nひとひねり：${s.twist}` : s.body;
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // 権限拒否・非セキュアコンテキストは下のフォールバックへ。
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch { ok = false; }
  document.body.removeChild(ta);
  return ok;
}

const CHOICES: (ScenarioGenre | 'random')[] = [...SCENARIO_GENRES, 'random'];

export default function RpScenarioTool() {
  const t = useT();
  useSeo(t('tools.rpScenario.seo.title'), t('tools.rpScenario.seo.desc'), { localized: true });

  const [choice, setChoice] = useState<ScenarioGenre | 'random'>('crime');
  const [items, setItems] = useState<Scenario[]>([]);
  /** コピー済み表示を出している案の index（-1 = なし）。 */
  const [copied, setCopied] = useState(-1);

  const generate = () => {
    setItems(makeScenarios(choice));
    setCopied(-1);
  };

  const onCopy = async (i: number, s: Scenario) => {
    if (await copyText(scenarioText(s))) setCopied(i);
  };

  return (
    <div className="vice-page vice-noise">
      <Header />

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[100px] pb-20 relative z-10">
        <div className="rp-scenario-tool">
          <div className="wrap">
            <div className="eyebrow">{t('tool.eyebrow')}</div>
            <h1>{t('toolS.h1.pre')}<span className="hl">{t('toolS.h1.hl')}</span></h1>
            <p className="sub">{t('toolS.sub')}</p>
            <div className="privacy"><b>{t('toolS.privacy.bold')}</b>{t('toolS.privacy.rest')}</div>

            <div className="panel">
              <div className="lab" id="rpGenreLabel">{t('toolS.lab.genre')}</div>
              <div className="genres" role="radiogroup" aria-labelledby="rpGenreLabel">
                {CHOICES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={choice === c}
                    className={choice === c ? 'on' : undefined}
                    onClick={() => setChoice(c)}
                  >
                    {t(`toolS.genre.${c}`)}
                  </button>
                ))}
              </div>
              <button type="button" className="gen" onClick={generate}>
                {items.length ? t('toolS.again') : t('toolS.gen')}
              </button>
            </div>

            {items.length > 0 && (
              <ul className="scenarios" aria-live="polite">
                {items.map((s, i) => (
                  <li key={`${s.body}-${i}`} className="scenario">
                    <span className={`genre g-${s.genre}`}>{t(`toolS.genre.${s.genre}`)}</span>
                    <p className="body">{s.body}</p>
                    {s.twist && (
                      <p className="twist"><b>{t('toolS.twist')}</b>{s.twist}</p>
                    )}
                    <dl className="tags">
                      <div><dt>{t('toolS.tag.role')}</dt><dd>{s.role}</dd></div>
                      <div><dt>{t('toolS.tag.mood')}</dt><dd>{s.mood}</dd></div>
                      <div><dt>{t('toolS.tag.players')}</dt><dd>{s.players}</dd></div>
                    </dl>
                    <button
                      type="button"
                      className={copied === i ? 'copy done' : 'copy'}
                      onClick={() => onCopy(i, s)}
                    >
                      {copied === i ? t('toolS.copied') : t('toolS.copy')}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <p className="note">{t('toolS.note')}</p>

            <p className="footnote">
              {t('toolS.footnote.privacy')}<br />
              {t('toolS.related.pre')}
              <LocalLink href="/fivem-gtarp/tools/chara-maker">{t('fg.card.charaMaker.title')}</LocalLink>
              {t('toolS.related.mid1')}
              <LocalLink href="/fivem-gtarp/tools/crew-name-generator">{t('fg.card.crewName.title')}</LocalLink>
              {t('toolS.related.mid2')}
              <LocalLink href="/fivem-gtarp/what-is-gtarp">{t('toolN.related.gtarp')}</LocalLink>
              {t('toolS.related.post')}
            </p>
          </div>
        </div>
        {/* ツール本体はブラウザ内で動くUIのため、生HTMLに実コンテンツを残すのはこのブロック。 */}
        <BoardGuide content={TOOL_GUIDES['rp-scenario']} />
      </main>

      <SiteFooter width={1100} />
    </div>
  );
}
