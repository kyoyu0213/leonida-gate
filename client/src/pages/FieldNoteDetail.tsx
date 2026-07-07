import { useRoute } from 'wouter';
import { NotebookPen, Wrench, Megaphone, Server } from 'lucide-react';
import Header from '@/components/Header';
import ArticleLayout from '@/components/ArticleLayout';
import { getFieldNoteBySlug } from '@/data/fieldNotes';
import { useLang } from '@/lib/i18n';

/**
 * 体験記の記事ページ（/fivem-gtarp/field-notes/:slug、/en/... も）。
 * slug から fieldNotes を解決し、既存の解説記事と同じ ArticleLayout で本文を描画する。
 * データ駆動なので data/fieldNotes.ts にエントリを足すだけで新記事が増える。
 */
export default function FieldNoteDetail() {
  const [matchJa, paramsJa] = useRoute('/fivem-gtarp/field-notes/:category/:slug');
  const [matchEn, paramsEn] = useRoute('/en/fivem-gtarp/field-notes/:category/:slug');
  const match = matchJa || matchEn;
  const params = (paramsJa || paramsEn) as { category: string; slug: string } | undefined;
  const lang = useLang();
  const isEn = lang === 'en';
  const prefix = isEn ? '/en' : '';

  const note = getFieldNoteBySlug(match ? params?.slug : undefined);

  if (!match) return null;

  if (!note) {
    return (
      <div className="min-h-screen bg-background text-foreground pt-16">
        <Header />
        <div className="container py-20 text-center">
          <p className="text-gray-400 font-mono mb-4">
            {isEn ? 'Entry not found' : '体験記が見つかりません'}
          </p>
          <a
            href={`${prefix}/fivem-gtarp`}
            className="text-cyan-400 hover:text-cyan-300 font-mono"
          >
            {isEn ? 'Back to FiveM / GTARP' : 'FiveM / GTARP に戻る'}
          </a>
        </div>
      </div>
    );
  }

  // 一覧へ戻るリンクは、その記事のカテゴリの一覧ページへ。
  const listHref = `${prefix}/fivem-gtarp/field-notes/${note.category}`;
  const listLabel = isEn
    ? note.category === 'dev-diary'
      ? 'Dev Diary list'
      : 'Visit Notes list'
    : note.category === 'dev-diary'
      ? '開発日記の一覧'
      : '訪問記の一覧';

  return (
    <ArticleLayout
      seoTitle={note.seoTitle}
      seoDesc={note.seoDesc}
      seoTitleEn={note.seoTitleEn}
      seoDescEn={note.seoDescEn}
      title={note.title}
      titleEn={note.titleEn}
      icon={note.icon}
      date={note.date}
      body={note.body}
      bodyEn={note.bodyEn}
    >
      <div className="flex flex-wrap gap-3 mb-12">
        <a
          href={listHref}
          className="inline-flex items-center gap-2 px-4 h-10 bg-[#fb923c] hover:bg-[#f59e42] text-black font-mono text-sm rounded transition-colors"
        >
          <NotebookPen size={14} /> {listLabel}
        </a>
        <a
          href="/fivem-gtarp/server-setup"
          className="inline-flex items-center gap-2 px-4 h-10 bg-black hover:bg-zinc-800 text-white font-mono text-sm rounded transition-colors border border-white/20"
        >
          <Wrench size={14} /> {isEn ? 'How to set up a FiveM server' : 'FiveMサーバーの立て方'}
        </a>
        <a
          href="/servers"
          className="inline-flex items-center gap-2 px-4 h-10 bg-black hover:bg-zinc-800 text-white font-mono text-sm rounded transition-colors border border-white/20"
        >
          <Megaphone size={14} /> {isEn ? 'Server board' : 'FiveMサーバー募集板'}
        </a>
        <a
          href="/fivem-gtarp/how-to-install"
          className="inline-flex items-center gap-2 px-4 h-10 bg-black hover:bg-zinc-800 text-white font-mono text-sm rounded transition-colors border border-white/20"
        >
          <Server size={14} /> {isEn ? 'How to install FiveM' : 'FiveMの導入方法'}
        </a>
      </div>
    </ArticleLayout>
  );
}
