import { useState } from 'react';
import Header from '@/components/Header';
import { useSeo } from '@/hooks/useSeo';
import BoardGuide from '@/components/BoardGuide';
import LocalLink from '@/components/LocalLink';
import { TOOL_GUIDES } from '@/data/boardGuides';
import { useT } from '@/lib/i18n';
import './rpScenario.css';
import SiteFooter from '@/components/SiteFooter';

// RPお題ジェネレーター（役職別＋共通の「今日のお題」）。
// クルー名ジェネレーター（CrewNameTool）と同じ型：ゼロ通信（fetch なし）・結果はメモリ内だけ・
// ツール本体の下に BoardGuide で解説を置き、プリレンダの生HTMLにはその解説が残る。
//
// お題の採否基準：自分から着手・実行できるものだけを入れる。
// 特定の Mod・ミッションの存在や、他プレイヤー・イベントのお膳立てが前提のお題は入れない。
// お題はカテゴリごとの固定文で、語の組み合わせは行わない（意味が破綻しない）。

/* ============ データ ============ */
export type TopicType = 'やり込み' | '縛り' | 'なりきり' | '交流' | 'ネタ';
export type TopicCategory =
  | 'police' | 'ems' | 'mechanic' | 'criminal' | 'media' | 'transport' | 'civilian' | 'shop' | 'common';
export const TOPIC_CATEGORIES: TopicCategory[] = [
  'police', 'ems', 'mechanic', 'criminal', 'media', 'transport', 'civilian', 'shop', 'common',
];

export interface Topic {
  text: string;
  type: TopicType;
}

const t = (text: string, type: TopicType): Topic => ({ text, type });

/** 役職バンクは やり込み／縛り／なりきり、共通バンクは 交流／ネタ。 */
export const BANKS: Record<TopicCategory, Topic[]> = {
  police: [
    t('ヘリでの追跡・上空支援を極める', 'やり込み'),
    t('カーチェイスの運転技術を磨く', 'やり込み'),
    t('街の隅々までパトロール範囲を広げる', 'やり込み'),
    t('発砲ゼロを貫く一日にする', '縛り'),
    t('単独行動だけで勤務する（応援を呼ばない）', '縛り'),
    t('職務質問と交通取り締まりに徹する', '縛り'),
    t('徒歩・自転車だけで巡回する', '縛り'),
    t('新人警官になりきって初々しく振る舞う', 'なりきり'),
    t('ベテラン刑事になりきって渋く決める', 'なりきり'),
    t('無線報告と言葉遣いをきっちり演じる', 'なりきり'),
    t('確保・逮捕術の所作を丁寧に演じる', 'なりきり'),
  ],
  ems: [
    t('現場到着から処置開始までの動きを速くする', 'やり込み'),
    t('心肺蘇生・搬送の所作を作り込む', 'やり込み'),
    t('街の救急要請に即応できる待機位置を工夫する', 'やり込み'),
    t('ヘリ・特殊車両の運用を練習する', 'やり込み'),
    t('一人で現場を完結させる（応援なし）', '縛り'),
    t('応急処置の手順ロールを丁寧に演じる', 'なりきり'),
    t('患者を落ち着かせる声かけを極める', 'なりきり'),
    t('新人救命士になりきって基礎から丁寧にやる', 'なりきり'),
    t('記録・引き継ぎの言葉をきっちり残す', 'なりきり'),
  ],
  mechanic: [
    t('一台のフルカスタムを完成させる', 'やり込み'),
    t('見た目より性能重視のセッティングを追求する', 'やり込み'),
    t('珍しい車種・難物の整備に挑戦する', 'やり込み'),
    t('店の在庫・パーツ管理を細かくロールする', 'やり込み'),
    t('出張レッカー・現場修理だけで回す', '縛り'),
    t('深夜に一人で店を切り盛りする', '縛り'),
    t('客の要望を丁寧にヒアリングして提案する姿勢を貫く', 'なりきり'),
    t('見積もりと接客の言葉を作り込む', 'なりきり'),
    t('新人整備士になりきって基礎から丁寧にやる', 'なりきり'),
  ],
  criminal: [
    t('足のつかない立ち回りを徹底する', 'やり込み'),
    t('逃走ルートを事前に下見して覚える', 'やり込み'),
    t('運転・射撃など“仕事”の技術を磨く', 'やり込み'),
    t('暴力を使わない一日にする（脅し・交渉のみ）', '縛り'),
    t('顔・車を割られないよう変装・偽装を徹底する', '縛り'),
    t('縄張り・シマの管理をロールする', 'なりきり'),
    t('冷静な交渉役になりきる', 'なりきり'),
    t('裏取引の段取りを丁寧に演出する', 'なりきり'),
    t('新入り目線で下積みを演じる', 'なりきり'),
  ],
  media: [
    t('街を回ってネタ・噂を集める', 'やり込み'),
    t('「〇〇縛り」など自分の企画を立てて実行する', 'やり込み'),
    t('撮れ高重視で映える画作りにこだわる', 'やり込み'),
    t('一次情報だけで記事を作る（伝聞に頼らない）', '縛り'),
    t('顔出しせず声だけで通す配信にする', '縛り'),
    t('一日密着ドキュメント風に回す', 'なりきり'),
    t('落ち着いたアナウンサー口調になりきる', 'なりきり'),
    t('街の店や名所を紹介する紹介企画をやる', 'なりきり'),
  ],
  transport: [
    t('街の地理を覚えて最短ルートで走る', 'やり込み'),
    t('長距離配送を時間内に完遂する', 'やり込み'),
    t('無事故・丁寧運転を貫く', '縛り'),
    t('制限速度を守り切る一日にする', '縛り'),
    t('深夜帯だけ営業してみる', '縛り'),
    t('丁寧な接客・案内をするドライバーになりきる', 'なりきり'),
    t('観光案内・街の豆知識を提供する', 'なりきり'),
    t('車内・積荷の扱いを丁寧にロールする', 'なりきり'),
  ],
  civilian: [
    t('街を散策して知らない場所を巡る', 'やり込み'),
    t('新しい趣味（釣り・ゴルフ等）に没頭する', 'やり込み'),
    t('街のイベントや店に自分から足を運ぶ', 'やり込み'),
    t('一日ノートラブルで平和に過ごす', '縛り'),
    t('お金を使わず一日過ごす（節約縛り）', '縛り'),
    t('平凡な会社員の一日を丁寧に演じる', 'なりきり'),
    t('行きつけの店の常連になりきる', 'なりきり'),
    t('一貫したキャラ設定・口調を崩さず通す', 'なりきり'),
  ],
  shop: [
    t('名物メニューを一つ作り込む', 'やり込み'),
    t('仕入れ・原価・在庫を細かくロールする', 'やり込み'),
    t('新メニューや値付けを自分で企画する', 'やり込み'),
    t('混雑時のオペレーションを一人で回す', '縛り'),
    t('深夜・早朝だけ開ける変則営業にする', '縛り'),
    t('接客のホスピタリティを極める姿勢を貫く', 'なりきり'),
    t('一貫した店のコンセプト・口上を作り込む', 'なりきり'),
    t('常連向けの“いつもの”を用意して覚える', 'なりきり'),
  ],
  common: [
    t('新しい友達を1人つくる', '交流'),
    t('連絡先を3人と交換する', '交流'),
    t('新規住人を見つけてご飯をおごる', '交流'),
    t('初対面の人に自分から話しかける', '交流'),
    t('誰かの手伝いを自分から買って出る', '交流'),
    t('一日で5人と会話する', '交流'),
    t('街の集まり・イベントに顔を出す', '交流'),
    t('一日お嬢様言葉で過ごす', 'ネタ'),
    t('カタカナ英語を使わずに過ごす', 'ネタ'),
    t('敬語だけで一日通す', 'ネタ'),
    t('語尾に決めゼリフをつけて話す', 'ネタ'),
    t('一人称をキャラらしく貫く', 'ネタ'),
    t('どんな時も笑顔・ポジティブで押し通す', 'ネタ'),
    t('嘘をつかない正直者ロールを貫く', 'ネタ'),
  ],
};

/* ============ 生成 ============ */
export interface DrawnTopic extends Topic {
  category: TopicCategory;
}

/** 一度に出すお題の数。 */
const BATCH = 3;

/** a から重複なしで n 件を抜き出す（部分的な Fisher–Yates）。 */
function sample<T>(a: T[], n: number): T[] {
  const pool = [...a];
  const out: T[] = [];
  for (let i = 0; i < n && pool.length; i++) {
    const j = Math.floor(Math.random() * pool.length);
    out.push(pool[j]);
    pool.splice(j, 1);
  }
  return out;
}

/**
 * お題を count 件出す。カテゴリ指定ならそのバンクから重複なしで、
 * 'random'（おまかせ）なら共通を含む全カテゴリから、カテゴリが重ならないように1件ずつ引く。
 */
export function drawTopics(choice: TopicCategory | 'random', count = BATCH): DrawnTopic[] {
  if (choice === 'random') {
    return sample(TOPIC_CATEGORIES, count).map((category) => ({ ...sample(BANKS[category], 1)[0], category }));
  }
  return sample(BANKS[choice], count).map((topic) => ({ ...topic, category: choice }));
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

const CHOICES: (TopicCategory | 'random')[] = [...TOPIC_CATEGORIES, 'random'];

export default function RpScenarioTool() {
  const tr = useT();
  useSeo(tr('tools.rpScenario.seo.title'), tr('tools.rpScenario.seo.desc'), { localized: true });

  const [choice, setChoice] = useState<TopicCategory | 'random'>('police');
  const [items, setItems] = useState<DrawnTopic[]>([]);
  /** コピー済み表示を出しているお題の index（-1 = なし）。 */
  const [copied, setCopied] = useState(-1);

  const draw = () => {
    setItems(drawTopics(choice));
    setCopied(-1);
  };

  const onCopy = async (i: number, text: string) => {
    if (await copyText(text)) setCopied(i);
  };

  return (
    <div className="vice-page vice-noise">
      <Header />

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[100px] pb-20 relative z-10">
        <div className="rp-scenario-tool">
          <div className="wrap">
            <div className="eyebrow">{tr('tool.eyebrow')}</div>
            <h1>{tr('toolS.h1.pre')}<span className="hl">{tr('toolS.h1.hl')}</span></h1>
            <p className="sub">{tr('toolS.sub')}</p>
            <div className="privacy"><b>{tr('toolS.privacy.bold')}</b>{tr('toolS.privacy.rest')}</div>

            <div className="panel">
              <div className="lab" id="rpCategoryLabel">{tr('toolS.lab.cat')}</div>
              <div className="cats" role="radiogroup" aria-labelledby="rpCategoryLabel">
                {CHOICES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={choice === c}
                    className={choice === c ? 'on' : undefined}
                    onClick={() => setChoice(c)}
                  >
                    {tr(`toolS.cat.${c}`)}
                  </button>
                ))}
              </div>
              <button type="button" className="gen" onClick={draw}>
                {items.length ? tr('toolS.again') : tr('toolS.gen')}
              </button>
            </div>

            {items.length > 0 && (
              <ul className="topics" aria-live="polite">
                {items.map((it, i) => (
                  <li key={`${it.category}-${it.text}`} className="topic">
                    <div className="top">
                      <span className={`cat c-${it.category}`}>{tr(`toolS.cat.${it.category}`)}</span>
                      <span className="type">{it.type}</span>
                    </div>
                    <p className="text">{it.text}</p>
                    <button
                      type="button"
                      className={copied === i ? 'copy done' : 'copy'}
                      onClick={() => onCopy(i, it.text)}
                    >
                      {copied === i ? tr('toolS.copied') : tr('toolS.copy')}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <p className="note">{tr('toolS.note')}</p>

            <p className="footnote">
              {tr('toolS.footnote.privacy')}<br />
              {tr('toolS.related.pre')}
              <LocalLink href="/fivem-gtarp/tools/chara-maker">{tr('fg.card.charaMaker.title')}</LocalLink>
              {tr('toolS.related.mid1')}
              <LocalLink href="/fivem-gtarp/tools/crew-name-generator">{tr('fg.card.crewName.title')}</LocalLink>
              {tr('toolS.related.mid2')}
              <LocalLink href="/fivem-gtarp/what-is-gtarp">{tr('toolN.related.gtarp')}</LocalLink>
              {tr('toolS.related.post')}
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
