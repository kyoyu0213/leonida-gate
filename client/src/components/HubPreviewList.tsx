// ============================================================================
//  ハブページ（/board・/recruit）のカード下に出す「最新投稿プレビュー」。
// ----------------------------------------------------------------------------
//  背景：③で板ページには実投稿を焼き込んだが、ハブ2ページは CSR 一覧を持たない
//  純ナビページのため対象外だった。sitemap 掲載ページの中で最も薄く
//  （/recruit 312字・/board 551字）、ナビだけのページになっていた（2026-08-08 の監査）。
//
//  ▼ 表示してよい項目のルール（③と同じ）
//  「板ページ側で実際に描画している項目」だけを出す。ここにだけ出る情報があると
//  クローラーにだけ見えるテキストになりかねないため。
//    板スレッド … タイトル / 更新日 / レス数（BoardThreadList のカードと同じ）
//    募集       … タイトル / プラットフォーム等の属性 / 投稿日
//  連絡先（contact・connect_info・discord_url）と投稿者名（author_name）は
//  そもそも seed に含まれていないので、ここに出しようがない。
// ============================================================================
import { ArrowRight } from 'lucide-react';

export interface PreviewItem {
  /** 遷移先（言語プレフィックス込みの実URL）。 */
  href: string;
  title: string;
  /** タイトル下に出す補助情報（更新日・レス数・プラットフォーム等）。 */
  meta: string[];
}

interface Props {
  items: PreviewItem[];
  /** 板・カテゴリのアクセント色。 */
  color: string;
  /** 「もっと見る」の遷移先と文言。 */
  moreHref: string;
  moreLabel: string;
}

/**
 * カード下部に最新投稿を数件並べる。items が空なら何も描画しない
 * （Supabase 取得失敗時・投稿ゼロ時は従来どおりカードだけになる）。
 */
export default function HubPreviewList({ items, color, moreHref, moreLabel }: Props) {
  if (!items.length) return null;

  return (
    <div className="mt-3 border-t border-white/[0.06] pt-3 flex flex-col gap-1.5">
      {items.map((it) => (
        <a
          key={it.href + it.title}
          href={it.href}
          className="group/item flex items-baseline gap-2.5 rounded-lg px-2 py-1.5 -mx-2 transition-colors hover:bg-white/[0.05]"
        >
          <span className="w-1 h-1 rounded-full flex-none translate-y-[-2px]" style={{ background: color }} />
          <span className="text-[13px] text-white/80 truncate min-w-0 flex-1 group-hover/item:text-white transition-colors">
            {it.title}
          </span>
          {it.meta.length > 0 && (
            <span className="text-[11.5px] text-white/40 flex-none whitespace-nowrap">
              {it.meta.join(' ・ ')}
            </span>
          )}
        </a>
      ))}
      <a
        href={moreHref}
        className="self-start inline-flex items-center gap-1 text-[12px] font-bold mt-0.5 px-2 -mx-2 py-1 hover:underline"
        style={{ color }}
      >
        {moreLabel}
        <ArrowRight size={13} />
      </a>
    </div>
  );
}
