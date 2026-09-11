import { useState } from 'react';
import Header from '@/components/Header';
import { useSeo } from '@/hooks/useSeo';
import BoardGuide from '@/components/BoardGuide';
import LocalLink from '@/components/LocalLink';
import { TOOL_GUIDES } from '@/data/boardGuides';
import { useT } from '@/lib/i18n';
import './crewName.css';
import SiteFooter from '@/components/SiteFooter';

// クルー名・ギャング名ジェネレーター。
// RPキャラメーカー（CharaMakerTool）と同じ型：ゼロ通信（fetch なし）・結果はメモリ内だけ・
// ツール本体の下に BoardGuide で解説を置き、プリレンダの生HTMLにはその解説が残る。
// キャラメーカーはプロトタイプHTMLの移植なので DOM を直接触っているが、こちらは新規なので
// React の state で組んでいる。
//
// 語彙はすべて造語用の部品。実在のギャング名・企業名・犯罪一家名は入れない。

/* ============ 語彙バンク ============ */
export type CrewStyle = 'street' | 'biker' | 'mafia' | 'cartel' | 'corpo' | 'crew';
export const CREW_STYLES: CrewStyle[] = ['street', 'biker', 'mafia', 'cartel', 'corpo', 'crew'];

const STREET_PLACE = ["Eastside","Westside","Northside","Southside","Uptown","Downtown","Harborside","Heights","Riverside","Hillside","Backstreet","Lakeside","Bayside","Seaside","Freeway"];
const STREET_COLOR = ["Crimson","Onyx","Golden","Silver","Jade","Violet","Scarlet","Ivory","Cobalt","Ruby","Emerald","Ash"];
const STREET_COLLECTIVE = ["Kings","Saints","Vipers","Reapers","Hustlers","Soldiers","Wolves","Hyenas","Jackals","Mob","Clique","Familia","Locos","Set","Hounds"];

const BIKER_ADJ = ["Iron","Steel","Broken","Fallen","Savage","Rusty","Screaming","Wild","Lone","Dead","Burning","Frozen","Thunder","Ghost","Midnight"];
const BIKER_BEAST = ["Vultures","Wolves","Angels","Reapers","Devils","Serpents","Ravens","Hounds","Skulls","Vipers","Nomads","Outlaws","Sinners","Ravagers","Buzzards"];

const MAFIA_SURNAME = ["Corvino","Vanzetti","Bellandi","Lombardo","Moretti","Serrano","Falcone","Vitale","Marchetti","Rizzoli","Delgado","Kovac","Sorrentino","Bianchi","Rossi"];
const MAFIA_ORG = ["Family","Syndicate","Outfit","Combine","Consortium","Ring","Enterprise","Cosca"];

const CARTEL_NOUN = ["Muertos","Diablos","Lobos","Sombras","Serpientes","Halcones","Reyes","Cuervos","Escorpiones","Toros","Tiburones","Fantasmas"];

const CORPO_NAME = ["Meridian","Vanguard","Apex","Zenith","Summit","Pinnacle","Northgate","Ironwood","Redstone","Silverline","Cobalt","Halcyon","Obsidian","Everline","Kingsgate"];
const CORPO_WORD = ["Holdings","Industries","Group","Corp","Solutions","Ventures","Capital","Logistics","Security","Consulting","Enterprises","Partners"];

const CREW_ADJ = ["Midnight","Neon","Golden","Rogue","Elite","Shadow","Chrome","Velvet","Toxic","Rapid","Silent","Reckless","Loyal","Ruthless","Crimson"];
const CREW_NOUN = ["Vipers","Legends","Syndicate","Union","Collective","Society","Order","Circle","Dynasty","Alliance","Squad","Empire","Kings","Phantoms","Renegades"];

/** 各案に添える設定ヒント（日本語1行）。 */
const HINTS: Record<CrewStyle, string[]> = {
  street: ["縄張り意識が強い路上組織", "色とサインで結束するクリック", "下町を仕切る叩き上げ集団"],
  biker: ["爆音で街道を支配するMC", "義理と暴力の走り屋集団", "無法のロードギャング"],
  mafia: ["表と裏を使い分ける組織", "血の掟で結ばれた一家", "街の裏経済を握るシンジケート"],
  cartel: ["密輸ルートを握る武装組織", "国境をまたぐ供給網", "恐怖で街を沈黙させる勢力"],
  corpo: ["合法企業の看板を掲げた裏組織", "資本で街を動かすフロント企業", "スーツを着た犯罪組織"],
  crew: ["目的で集まった実力派クルー", "オンラインで名を上げる集団", "何でもこなす精鋭チーム"],
};

/* ============ 生成 ============ */
const R = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];

export function makeCrewName(style: CrewStyle): string {
  switch (style) {
    case 'street':
      return `${Math.random() < 0.5 ? R(STREET_PLACE) : R(STREET_COLOR)} ${R(STREET_COLLECTIVE)}`;
    case 'biker':
      return `${R(BIKER_ADJ)} ${R(BIKER_BEAST)} MC`;
    case 'mafia':
      return `${Math.random() < 0.7 ? R(MAFIA_SURNAME) : R(STREET_PLACE)} ${R(MAFIA_ORG)}`;
    case 'cartel':
      return Math.random() < 0.5 ? `Los ${R(CARTEL_NOUN)} Cartel` : `Cartel de los ${R(CARTEL_NOUN)}`;
    case 'corpo':
      return `${R(CORPO_NAME)} ${R(CORPO_WORD)}`;
    case 'crew':
      return `${R(CREW_ADJ)} ${R(CREW_NOUN)}`;
  }
}

/** タグ化で読み飛ばす小語（大文字小文字は区別しない）。 */
const TAG_STOPWORDS = new Set(['de', 'los', 'el', 'the', 'of', 'mc']);

/**
 * 名前からクルータグ（GTA Online の上限に合わせて最大4文字・大文字）を作る。
 * 小語を除いた各単語の頭文字をつなぎ、4文字を超えたら切り詰める。
 * 2文字に満たないときは先頭単語の続きの文字で補う。
 *   Eastside Kings→EK ／ Los Muertos Cartel→MC ／ Iron Vultures MC→IV ／ Meridian Holdings→MH
 */
export function makeCrewTag(name: string): string {
  const words = name.split(/\s+/).map((w) => w.replace(/[^A-Za-z0-9]/g, '')).filter(Boolean);
  const kept = words.filter((w) => !TAG_STOPWORDS.has(w.toLowerCase()));
  let tag = kept.map((w) => w[0]).join('').toUpperCase().slice(0, 4);
  if (tag.length < 2) {
    const head = kept[0] ?? words[0] ?? '';
    tag = head.slice(0, 2).toUpperCase();
  }
  return tag;
}

export interface CrewIdea {
  name: string;
  tag: string;
  style: CrewStyle;
  hint: string;
}

/** 一度に出す案の数。 */
const BATCH = 5;

/** 案を count 件作る。'random'（おまかせ）なら1件ごとにスタイルを抽選する。同じ名前は1回の生成で重複させない。 */
export function makeCrewIdeas(choice: CrewStyle | 'random', count = BATCH): CrewIdea[] {
  const out: CrewIdea[] = [];
  const seen = new Set<string>();
  for (let tries = 0; out.length < count && tries < count * 20; tries++) {
    const style = choice === 'random' ? R(CREW_STYLES) : choice;
    const name = makeCrewName(style);
    if (seen.has(name)) continue;
    seen.add(name);
    out.push({ name, tag: makeCrewTag(name), style, hint: R(HINTS[style]) });
  }
  return out;
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

const CHOICES: (CrewStyle | 'random')[] = [...CREW_STYLES, 'random'];

export default function CrewNameTool() {
  const t = useT();
  useSeo(t('tools.crewName.seo.title'), t('tools.crewName.seo.desc'), { localized: true });

  const [choice, setChoice] = useState<CrewStyle | 'random'>('street');
  const [ideas, setIdeas] = useState<CrewIdea[]>([]);
  /** コピー済み表示を出している案の index（-1 = なし）。 */
  const [copied, setCopied] = useState(-1);

  const generate = () => {
    setIdeas(makeCrewIdeas(choice));
    setCopied(-1);
  };

  const onCopy = async (i: number, name: string) => {
    if (await copyText(name)) setCopied(i);
  };

  return (
    <div className="vice-page vice-noise">
      <Header />

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[100px] pb-20 relative z-10">
        <div className="crew-name-tool">
          <div className="wrap">
            <div className="eyebrow">{t('tool.eyebrow')}</div>
            <h1>{t('toolN.h1.pre')}<span className="hl">{t('toolN.h1.hl')}</span></h1>
            <p className="sub">{t('toolN.sub')}</p>
            <div className="privacy"><b>{t('toolN.privacy.bold')}</b>{t('toolN.privacy.rest')}</div>

            <div className="panel">
              <div className="lab" id="crewStyleLabel">{t('toolN.lab.style')}</div>
              <div className="styles" role="radiogroup" aria-labelledby="crewStyleLabel">
                {CHOICES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={choice === c}
                    className={choice === c ? 'on' : undefined}
                    onClick={() => setChoice(c)}
                  >
                    {t(`toolN.style.${c}`)}
                  </button>
                ))}
              </div>
              <button type="button" className="gen" onClick={generate}>
                {ideas.length ? t('toolN.again') : t('toolN.gen')}
              </button>
            </div>

            {ideas.length > 0 && (
              <ul className="ideas" aria-live="polite">
                {ideas.map((idea, i) => (
                  <li key={`${idea.name}-${i}`} className="idea">
                    <div className="top">
                      <span className={`badge s-${idea.style}`}>{t(`toolN.style.${idea.style}`)}</span>
                      <span className="tag" title={t('toolN.tagTitle')}>[{idea.tag}]</span>
                    </div>
                    <div className="name">{idea.name}</div>
                    <p className="hint">{idea.hint}</p>
                    <button
                      type="button"
                      className={copied === i ? 'copy done' : 'copy'}
                      onClick={() => onCopy(i, idea.name)}
                    >
                      {copied === i ? t('toolN.copied') : t('toolN.copy')}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <p className="note">{t('toolN.note')}</p>

            <p className="footnote">
              {t('toolN.footnote.privacy')}<br />
              {t('toolN.related.pre')}
              <LocalLink href="/fivem-gtarp/tools/chara-maker">{t('fg.card.charaMaker.title')}</LocalLink>
              {t('toolN.related.mid')}
              <LocalLink href="/fivem-gtarp/what-is-gtarp">{t('toolN.related.gtarp')}</LocalLink>
              {t('toolN.related.post')}<br />
              {t('toolN.related2.pre')}
              <LocalLink href="/fivem-gtarp/tools/rp-scenario">{t('fg.card.rpScenario.title')}</LocalLink>
              {t('toolN.related2.post')}
            </p>
          </div>
        </div>
        {/* ツール本体はブラウザ内で動くUIのため、生HTMLに実コンテンツを残すのはこのブロック。 */}
        <BoardGuide content={TOOL_GUIDES['crew-name']} />
      </main>

      <SiteFooter width={1100} />
    </div>
  );
}
