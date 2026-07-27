import {
  BOARD_GUIDES,
  type BoardGuideKey,
  type BoardGuideContent,
} from '@/data/boardGuides';
import { useLang } from '@/lib/i18n';

/**
 * 静的な解説ブロック（掲示板・募集板・ツールページ共通）。
 *
 * スレッド・募集カード・サーバー一覧は Supabase からクライアント取得するため、
 * プリレンダされた生HTMLには「取得中…」しか残らなかった。この解説は data 取得を
 * 待たずに描画されるので、prerender-routes.ts が #root へ焼き込む生HTMLに
 * 実コンテンツとして入る。
 *
 * 一覧・ツール本体の「下」に置くこと（利用者にとっての主役はそちらなので、上に積まない）。
 * 本文は data/boardGuides.ts 側で編集する。
 *
 * 掲示板は guideKey（BOARD_GUIDES を引く）、それ以外は content を直接渡す。
 */
export default function BoardGuide({
  guideKey,
  content,
}: {
  guideKey?: BoardGuideKey;
  content?: { ja: BoardGuideContent; en: BoardGuideContent };
}) {
  const lang = useLang();
  const source = content ?? (guideKey ? BOARD_GUIDES[guideKey] : undefined);
  const guide = source?.[lang === 'en' ? 'en' : 'ja'];
  if (!guide) return null;

  return (
    <section className="mt-14 pt-9 border-t border-white/10">
      <p className="text-[14.5px] md:text-[15px] leading-[1.95] text-white/75 m-0 max-w-[760px]">
        {guide.lead}
      </p>

      {guide.sections.map((s) => (
        <div key={s.heading} className="mt-8">
          <h2 className="font-black text-[17px] md:text-xl m-0 mb-3 flex items-center gap-2.5">
            <span
              className="inline-block rounded-[3px] flex-none"
              style={{
                width: 4,
                height: 19,
                background: 'linear-gradient(#ff8a3d,#ff2d95)',
                boxShadow: '0 0 10px rgba(255,45,149,.5)',
              }}
            />
            {s.heading}
          </h2>
          {s.body.map((p, i) => (
            <p
              key={i}
              className="text-[14px] md:text-[14.5px] leading-[1.95] text-white/65 m-0 mb-3 last:mb-0 max-w-[760px]"
            >
              {p}
            </p>
          ))}
        </div>
      ))}
    </section>
  );
}
