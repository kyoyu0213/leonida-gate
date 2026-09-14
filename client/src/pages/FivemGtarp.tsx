import { MAP_RELEASED } from '@/data/maps/release';
import Header from '@/components/Header';
import { Server, Users, GitCompare, MessageSquare, Compass, Download, History, BookOpen, HelpCircle, Terminal, Tv, Megaphone, Eye, Footprints, Wrench, ArrowRight, ImageDown, EyeOff, UserRoundPlus, Clapperboard, Map as MapIcon, NotebookPen, MapPinned, Newspaper } from 'lucide-react';
import { fieldNotes, FIELD_NOTE_CATEGORY_CONFIG } from '@/data/fieldNotes';
import { getArticleById, isNoindexNewsId, formatArticleDate } from '@/data/news';
import { useSeo } from '@/hooks/useSeo';
import { useT, useLang } from '@/lib/i18n';
import { useLocalHref } from '@/components/LocalLink';
import SiteFooter from '@/components/SiteFooter';
// 地（.wiki-shell）は GTA6まとめWiki と共用。ハブ固有の部品は fivemHub.css（.fhub 配下）。
import './gtaWiki.css';
import './fivemHub.css';

interface Card {
  titleKey: string;
  descKey: string;
  href: string;
  icon: typeof Server;
  accent: string; // 旧ネオン色（㊼以降は表示に使わない。カードはグループ色で統一）
}

interface CardGroup {
  labelKey: string;
  /** グループ色（白地向けの落ち着いた色。カードの左帯・アイコン・見出しの四角・目次に使う）。 */
  accent: string;
  cards: Card[];
}

// カードが増えて縦に長くなったため、用途ごとに3グループへ分けて見つけやすくする。
const GROUPS: CardGroup[] = [
  {
    labelKey: 'fg.group.basics',
    accent: '#0e7490',
    cards: [
      { titleKey: 'fg.card.fivem.title', descKey: 'fg.card.fivem.desc', href: '/fivem-gtarp/what-is-fivem', icon: Server, accent: '#22d3ee' },
      { titleKey: 'fg.card.gtarp.title', descKey: 'fg.card.gtarp.desc', href: '/fivem-gtarp/what-is-gtarp', icon: Users, accent: '#a78bfa' },
      { titleKey: 'fg.card.diff.title', descKey: 'fg.card.diff.desc', href: '/fivem-gtarp/fivem-vs-gtarp', icon: GitCompare, accent: '#ff8a3d' },
    ],
  },
  {
    labelKey: 'fg.group.play',
    accent: '#047857',
    cards: [
      { titleKey: 'fg.card.install.title', descKey: 'fg.card.install.desc', href: '/fivem-gtarp/how-to-install', icon: Download, accent: '#38bdf8' },
      { titleKey: 'fg.card.guide.title', descKey: 'fg.card.guide.desc', href: '/fivem-gtarp/server-guide', icon: Compass, accent: '#3de0a0' },
      { titleKey: 'fg.card.firstDay.title', descKey: 'fg.card.firstDay.desc', href: '/fivem-gtarp/first-day-guide', icon: Footprints, accent: '#facc15' },
      { titleKey: 'fg.card.faq.title', descKey: 'fg.card.faq.desc', href: '/fivem-gtarp/faq', icon: HelpCircle, accent: '#34d399' },
      { titleKey: 'fg.card.commands.title', descKey: 'fg.card.commands.desc', href: '/fivem-gtarp/commands', icon: Terminal, accent: '#fb7185' },
      { titleKey: 'fg.card.servers.title', descKey: 'fg.card.servers.desc', href: '/servers', icon: Megaphone, accent: '#fbbf24' },
      { titleKey: 'fg.card.serverBoard.title', descKey: 'fg.card.serverBoard.desc', href: '/board/gtarp-servers', icon: MessageSquare, accent: '#ff8a3d' },
      { titleKey: 'fg.card.board.title', descKey: 'fg.card.board.desc', href: '/board/gtarp', icon: MessageSquare, accent: '#ff2d95' },
    ],
  },
  {
    labelKey: 'fg.group.watch',
    accent: '#6d28d9',
    cards: [
      { titleKey: 'fg.card.observer.title', descKey: 'fg.card.observer.desc', href: '/fivem-gtarp/observer-guide', icon: Eye, accent: '#e879f9' },
      { titleKey: 'fg.card.streamerHistory.title', descKey: 'fg.card.streamerHistory.desc', href: '/fivem-gtarp/streamer-server-history', icon: Tv, accent: '#f472b6' },
      { titleKey: 'fg.card.streamerBoard.title', descKey: 'fg.card.streamerBoard.desc', href: '/board/streamer-servers', icon: MessageSquare, accent: '#ff2d95' },
    ],
  },
  {
    labelKey: 'fg.group.more',
    accent: '#be185d',
    cards: [
      { titleKey: 'fg.card.glossary.title', descKey: 'fg.card.glossary.desc', href: '/fivem-gtarp/glossary', icon: BookOpen, accent: '#c084fc' },
      { titleKey: 'fg.card.history.title', descKey: 'fg.card.history.desc', href: '/fivem-gtarp/history', icon: History, accent: '#f0b429' },
    ],
  },
  {
    labelKey: 'fg.group.dev',
    accent: '#1d4ed8',
    cards: [
      { titleKey: 'fg.card.serverSetup.title', descKey: 'fg.card.serverSetup.desc', href: '/fivem-gtarp/server-setup', icon: Wrench, accent: '#60a5fa' },
      { titleKey: 'fg.card.serverPromo.title', descKey: 'fg.card.serverPromo.desc', href: '/servers', icon: Megaphone, accent: '#38bdf8' },
      { titleKey: 'fg.card.devBoard.title', descKey: 'fg.card.devBoard.desc', href: '/board/fivem-dev', icon: MessageSquare, accent: '#22d3ee' },
    ],
  },
  {
    labelKey: 'fg.group.tools',
    accent: '#b45309',
    cards: [
      { titleKey: 'fg.card.imageResize.title', descKey: 'fg.card.imageResize.desc', href: '/fivem-gtarp/tools/image-resize', icon: ImageDown, accent: '#2de2e6' },
      { titleKey: 'fg.card.imageMask.title', descKey: 'fg.card.imageMask.desc', href: '/fivem-gtarp/tools/image-mask', icon: EyeOff, accent: '#ff2d95' },
      // 文言・アイコン・アクセント色は ToolsIndex（/fivem-gtarp/tools）のカードと同じものを使う。
      // 説明文は i18n の fg.card.charaMaker.* が単一ソースなので、ハブと食い違わない。
      { titleKey: 'fg.card.charaMaker.title', descKey: 'fg.card.charaMaker.desc', href: '/fivem-gtarp/tools/chara-maker', icon: UserRoundPlus, accent: '#ff8a3d' },
      { titleKey: 'fg.card.crewName.title', descKey: 'fg.card.crewName.desc', href: '/fivem-gtarp/tools/crew-name-generator', icon: Users, accent: '#fbbf24' },
      { titleKey: 'fg.card.rpScenario.title', descKey: 'fg.card.rpScenario.desc', href: '/fivem-gtarp/tools/rp-scenario', icon: Clapperboard, accent: '#c084fc' },
      // 地図ツールは公開フラグが立つまで出さない（client/src/data/maps/release.ts）。
      ...(MAP_RELEASED.gta5
        ? [{ titleKey: 'fg.card.gta5Map.title', descKey: 'fg.card.gta5Map.desc', href: '/fivem-gtarp/tools/gta5-map', icon: MapIcon, accent: '#34d399' }]
        : []),
      // ツール一覧ページ本体への導線。各記事は個別ツールへ直リンクしており、
      // ハブ（/fivem-gtarp/tools）がどこからもリンクされず orphan になっていた
      // （2026-08-08 の監査）。日英とも同じカードで解消する。
      { titleKey: 'fg.card.toolsIndex.title', descKey: 'fg.card.toolsIndex.desc', href: '/fivem-gtarp/tools', icon: Wrench, accent: '#a78bfa' },
    ],
  },
  {
    // オリジナル一次情報（体験記）。ヘッダー・トップにも導線があるため、ハブでは最下部に置く。
    // カードは render 側で「各カテゴリの最新1本」だけをデータ駆動で描画し、記事が増えても伸びない。
    // ここの cards は一覧への導線として保持（実描画では最新記事＋一覧リンクを出す）。
    labelKey: 'fg.group.fieldnotes',
    accent: '#c2410c',
    cards: [
      { titleKey: 'fg.card.devDiary.title', descKey: 'fg.card.devDiary.desc', href: '/fivem-gtarp/field-notes/dev-diary', icon: NotebookPen, accent: '#fb923c' },
      { titleKey: 'fg.card.visitNote.title', descKey: 'fg.card.visitNote.desc', href: '/fivem-gtarp/field-notes/visit-note', icon: MapPinned, accent: '#38bdf8' },
    ],
  },
];

// ページ最下部に出す「GTA RP関連のニュース」で拾う記事ID（新しい順に手で並べる）。
//  - ハブのカード群（GROUPS）とは別枠で、本文の最後に常時表示する（目次からも飛べる）。
//  - 非表示記事（HIDDEN_NEWS_IDS）は getArticleById が undefined を返すので自動で落ちる。
//    noindex 記事（NOINDEX_NEWS_IDS）も内部リンクで推さないよう明示的に除外する。
//  - ここに id を足すだけで増える。タイトル・説明・日付は news.ts から引くので二重管理にならない。
const GTARP_NEWS_IDS = [58, 57, 55, 41, 18] as const;

// ㊼ 絞り込みチップはやめ、全グループを常に表示して左の目次（アンカー）で移動する形にした。
// 生HTMLに全カードの <a> が常に残る（プリレンダ規約。以前の selected='all' 初期値と同じ結果）。
/** グループ見出しのアンカー id（例：fg.group.basics → g-basics）。目次・目的ボタンから飛ぶ。 */
const groupId = (labelKey: string) => `g-${labelKey.replace('fg.group.', '')}`;
const NEWS_ID = 'g-news';
/** 最下部「GTA RP関連のニュース」の色（白地向け）。 */
const NEWS_COLOR = '#be185d';

/** 目的から探す：各ボタンは該当グループの見出しへスクロールする（アンカーなので JS 不要）。 */
const INTENTS = [
  { label: 'FiveMを始めたい', group: 'fg.group.basics' },
  { label: '遊び方を知りたい', group: 'fg.group.play' },
  { label: '配信を楽しむ', group: 'fg.group.watch' },
  { label: 'サーバーを作る', group: 'fg.group.dev' },
];
const GROUP_COLOR: Record<string, string> = Object.fromEntries(GROUPS.map((g) => [g.labelKey, g.accent]));

export default function FivemGtarp() {
  const L = useLocalHref();
  const t = useT();
  const lang = useLang();
  useSeo(t('fg.seo.title'), t('fg.seo.desc'), { localized: true });
  // 全グループを常に描画する（絞り込みは廃止）。ハブから各解説記事への <a> が1本残らず生HTMLに出る
  // （NewsList.tsx 冒頭の規約と同じ）。今後一部を隠すUIにするときも、DOMから外さず hidden / display で切り替えること。

  // 体験記は各カテゴリの最新1本だけを出す（開発日記1＋訪問記1＝計2枚）。
  // 記事が増えても枚数が固定されるので、ハブページが伸び続けない。
  const latestNotes = (['dev-diary', 'visit-note'] as const)
    .map((c) =>
      fieldNotes
        .filter((n) => n.category === c)
        .sort((a, b) => b.date.localeCompare(a.date))[0],
    )
    .filter(Boolean);

  const langPrefix = lang === 'en' ? '/en' : '';

  // GTA RP関連のニュース（最下部）。存在しない／非表示／noindex の id は落とす。
  const gtarpNews = GTARP_NEWS_IDS.map((id) => getArticleById(id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a))
    .filter((a) => !isNoindexNewsId(a.id));

  return (
    <div className="wiki-shell fhub">
      <Header />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[100px] pb-20 relative z-10">
        {/* Hero */}
        <span className="fhub__eyebrow">FiveM / GTARP</span>
        {/* H1 は固定文字列（i18n 非依存。英語版は公開停止中）。ヘッダーの表記は「RPまとめWiki」。 */}
        <h1 className="fhub__h1">GTARPまとめWiki</h1>
        <p className="fhub__lead">{t('fg.lead')}</p>

        {/* 目的から探す（意図ベースの入口）。各ボタンは該当グループの見出しへ飛ぶアンカー。 */}
        <div className="fhub-intent">
          <p className="fhub-intent__h">
            <Compass size={15} aria-hidden="true" />
            目的から探す
            <small>やりたいことを選ぶ</small>
          </p>
          <div className="fhub-intent__grid">
            {INTENTS.map((b) => (
              <a
                key={b.group}
                href={`#${groupId(b.group)}`}
                className="fhub-intent__b"
                style={{ ['--ca' as string]: GROUP_COLOR[b.group] }}
              >
                <span className="dot" aria-hidden="true" />
                <span>{b.label}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="fhub-layout">
          {/* 左：目次（PC は sticky。スマホは本文の上） */}
          <aside className="fhub-side">
            <nav className="fhub-toc" aria-label="目次">
              <p className="fhub-toc__h">目次</p>
              <ol>
                {GROUPS.map((g) => (
                  <li key={g.labelKey}>
                    <a href={`#${groupId(g.labelKey)}`}>
                      <span className="d" style={{ background: g.accent }} aria-hidden="true" />
                      {t(g.labelKey)}
                    </a>
                  </li>
                ))}
                {gtarpNews.length > 0 && (
                  <li>
                    <a href={`#${NEWS_ID}`}>
                      <span className="d" style={{ background: NEWS_COLOR }} aria-hidden="true" />
                      {t('fg.news.title')}
                    </a>
                  </li>
                )}
              </ol>
            </nav>
          </aside>

          {/* 右：本文。全グループを常に描画する（生HTMLに全カードの <a> を残す）。 */}
          <div className="fhub-body">
            {GROUPS.map((g) => (
              <section key={g.labelKey} className="fhub-section">
                <h2 id={groupId(g.labelKey)} className="fhub-h2">
                  <span className="d" style={{ background: g.accent }} aria-hidden="true" />
                  {t(g.labelKey)}
                </h2>

                {g.labelKey === 'fg.group.fieldnotes' ? (
                  <>
                    {/* 各カテゴリの最新1本へ言語対応で直リンク（1ホップ）。枚数固定なので伸びない。 */}
                    <div className="fhub-cards">
                      {latestNotes.map((note) => {
                        const cat = FIELD_NOTE_CATEGORY_CONFIG[note.category];
                        return (
                          <a
                            key={note.slug}
                            href={`${langPrefix}/fivem-gtarp/field-notes/${note.category}/${note.slug}`}
                            className="fhub-card"
                            style={{ ['--ca' as string]: g.accent }}
                          >
                            <span className="fhub-card__ic" aria-hidden="true">
                              {note.icon}
                            </span>
                            <div className="fhub-card__b">
                              <h3 className="fhub-card__t">{lang === 'en' ? note.titleEn : note.title}</h3>
                              <span className="fhub-card__d">
                                {lang === 'en' ? cat.en : cat.ja}｜{lang === 'en' ? note.excerptEn : note.excerpt}
                              </span>
                            </div>
                            <ArrowRight size={15} className="fhub-card__a" aria-hidden="true" />
                          </a>
                        );
                      })}
                    </div>
                    {/* 一覧ページへの導線も併存（sitemap収録・被リンク経路として維持） */}
                    <div className="fhub-more">
                      <a href={`${langPrefix}/fivem-gtarp/field-notes/dev-diary`}>
                        {lang === 'en' ? 'All dev diaries' : '開発日記の一覧'} →
                      </a>
                      <a href={`${langPrefix}/fivem-gtarp/field-notes/visit-note`}>
                        {lang === 'en' ? 'All visit notes' : '訪問記の一覧'} →
                      </a>
                    </div>
                  </>
                ) : (
                  <div className="fhub-cards">
                    {g.cards.map((c) => {
                      const Icon = c.icon;
                      return (
                        <a
                          key={c.href}
                          href={L(c.href)}
                          className="fhub-card"
                          style={{ ['--ca' as string]: g.accent }}
                        >
                          <span className="fhub-card__ic" aria-hidden="true">
                            <Icon size={17} />
                          </span>
                          <div className="fhub-card__b">
                            <h3 className="fhub-card__t">{t(c.titleKey)}</h3>
                            <span className="fhub-card__d">{t(c.descKey)}</span>
                          </div>
                          <ArrowRight size={15} className="fhub-card__a" aria-hidden="true" />
                        </a>
                      );
                    })}
                  </div>
                )}
              </section>
            ))}

            {/* GTA RP関連のニュース：常に最下部へ出す（条件はデータの有無だけ。表示切り替えでは消さない）。 */}
            {gtarpNews.length > 0 && (
              <section className="fhub-section">
                <h2 id={NEWS_ID} className="fhub-h2">
                  <span className="d" style={{ background: NEWS_COLOR }} aria-hidden="true" />
                  {t('fg.news.title')}
                </h2>
                <p className="fhub-section__lead">{t('fg.news.lead')}</p>

                <div className="fhub-cards">
                  {gtarpNews.map((a) => (
                    <a
                      key={a.id}
                      href={`${langPrefix}/news/${a.id}`}
                      className="fhub-card"
                      style={{ ['--ca' as string]: NEWS_COLOR }}
                    >
                      <span className="fhub-card__ic" aria-hidden="true">
                        {a.icon}
                      </span>
                      <div className="fhub-card__b">
                        <h3 className="fhub-card__t">{(lang === 'en' && a.titleEn) || a.title}</h3>
                        <span className="fhub-card__d">{formatArticleDate(a, lang)}</span>
                      </div>
                      <ArrowRight size={15} className="fhub-card__a" aria-hidden="true" />
                    </a>
                  ))}
                </div>

                <div className="fhub-more">
                  <a href={`${langPrefix}/news/gtarp`}>
                    <Newspaper size={14} aria-hidden="true" />
                    {t('fg.news.all')} →
                  </a>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      <SiteFooter width={1100} />
    </div>
  );
}
