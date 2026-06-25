import { useSyncExternalStore } from 'react';

// サイトの表示言語（日本語デフォルト＋英語）。localStorage に保存し、
// ボタンで切り替える。まずはトップページの固定文言を対象にする。
export type Lang = 'ja' | 'en';

const KEY = 'site_lang';

// ブラウザ言語から初期言語を推定（日本語ブラウザ=ja、それ以外=en）。
// 海外（日本語以外）からのアクセスは英語をデフォルト表示にする狙い。
function detectFromBrowser(): Lang {
  try {
    const langs =
      navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
    const isJa = langs.some((l) => typeof l === 'string' && l.toLowerCase().startsWith('ja'));
    return isJa ? 'ja' : 'en';
  } catch {
    return 'ja';
  }
}

function read(): Lang {
  // ユーザーが明示的に選んだ言語があれば最優先。
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'en' || saved === 'ja') return saved;
  } catch {
    /* ignore */
  }
  // 未選択ならブラウザ言語で判定（保存はしない＝明示選択するまで自動）。
  return detectFromBrowser();
}

let current: Lang = read();
const listeners = new Set<() => void>();

export function getLang(): Lang {
  return current;
}
export function setLang(l: Lang): void {
  if (l === current) return;
  current = l;
  try {
    localStorage.setItem(KEY, l);
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => fn());
}
function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
/** 現在の言語を購読して返す（変更で再描画）。 */
export function useLang(): Lang {
  return useSyncExternalStore(subscribe, getLang, getLang);
}

type Dict = Record<string, string>;

const JA: Dict = {
  'nav.home': 'ホーム',
  'nav.news': 'GTA6最新情報',
  'nav.servers': 'FiveMサーバー募集',
  'nav.board': '掲示板',
  'nav.fivemgtarp': 'FiveM/GTARP',
  'nav.contact': 'お問い合わせ',
  'header.search': '記事・掲示板を検索…',
  'hero.tagline': 'バイスシティ総合情報 ＆ コミュニティ',
  'home.latest': '最新情報',
  'home.trending': 'トレンドのスレッド',
  'home.noThreads': 'まだスレッドがありません',
  'home.viewBoard': '掲示板を見る →',
  'home.recruitTitle': '🎮 FiveMサーバー募集',
  'home.recruitDesc': 'いま掲載中のRP・フリー鯖をチェック。仲間を探そう。',
  'home.noRecruit': 'まだ募集がありません',
  'home.viewRecruit': '募集一覧を見る →',
  'footer.disclaimer':
    '本サイトは GTA6（Grand Theft Auto VI）の非公式ファンコミュニティです。Rockstar Games / Take-Two とは一切関係ありません。',
  'footer.terms': '利用規約・プライバシー',
  // ニュースのカテゴリ
  'cat.all': 'すべて',
  'cat.release': '公式情報',
  'cat.update': 'アップデート',
  'cat.speculation': '考察・リーク',
  'cat.event': 'イベント',
  // 掲示板名（slug 別）
  'board.gtarp-servers': 'GTARP鯖別',
  'board.gtarp': 'GTARPプレイヤー交流',
  'board.gta6': 'GTA6情報交換',
};

const EN: Dict = {
  'nav.home': 'Home',
  'nav.news': 'GTA6 News',
  'nav.servers': 'FiveM Servers',
  'nav.board': 'Board',
  'nav.fivemgtarp': 'FiveM/GTARP',
  'nav.contact': 'Contact',
  'header.search': 'Search articles & board…',
  'hero.tagline': 'Vice City news & community',
  'home.latest': 'Latest',
  'home.trending': 'Trending threads',
  'home.noThreads': 'No threads yet',
  'home.viewBoard': 'View board →',
  'home.recruitTitle': '🎮 FiveM Servers',
  'home.recruitDesc': 'Check the RP / free-roam servers listed now and find your crew.',
  'home.noRecruit': 'No servers listed yet',
  'home.viewRecruit': 'View all servers →',
  'footer.disclaimer':
    'This is an unofficial GTA6 (Grand Theft Auto VI) fan community. Not affiliated with Rockstar Games / Take-Two.',
  'footer.terms': 'Terms & Privacy',
  'cat.all': 'All',
  'cat.release': 'Official',
  'cat.update': 'Updates',
  'cat.speculation': 'Leaks & Analysis',
  'cat.event': 'Events',
  'board.gtarp-servers': 'GTARP Servers',
  'board.gtarp': 'GTARP Community',
  'board.gta6': 'GTA6 Info',
};

const DICTS: Record<Lang, Dict> = { ja: JA, en: EN };

/** 翻訳関数を返すフック。t('home.latest') のように使う。未定義キーは日本語→キー名でフォールバック。 */
export function useT(): (key: string) => string {
  const lang = useLang();
  return (key: string) => DICTS[lang][key] ?? JA[key] ?? key;
}
