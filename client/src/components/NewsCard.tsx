import { MessageSquare } from 'lucide-react';
import { CATEGORY_CONFIG, type NewsArticle } from '@/data/news';
import { useT, useLang } from '@/lib/i18n';

// ニュースカードのサムネ用サンセットグラデ（カードごとに巡回）
const THUMB_GRADIENTS = [
  'linear-gradient(155deg,#ff2d95 0%,#ff6a3d 55%,#9b4bd8 100%)',
  'linear-gradient(155deg,#2a0f3a 0%,#7a2767 50%,#ff7a4d 100%)',
  'linear-gradient(155deg,#3a1248 0%,#ff2d95 60%,#ffb24d 100%)',
  'linear-gradient(155deg,#7a2767 0%,#ff7a4d 100%)',
];

// サムネ内のヤシ（画像が無いカード用）
function ThumbPalm() {
  return (
    <svg
      viewBox="0 0 320 200"
      preserveAspectRatio="xMidYMax slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <g stroke="rgba(8,4,12,.55)" strokeWidth="5" fill="none" strokeLinecap="round">
        <path d="M44 200 C38 158 44 124 58 96" />
        <path d="M58 96 C30 86 10 88 -6 102" />
        <path d="M58 96 C40 70 16 56 -8 52" />
        <path d="M58 96 C60 64 52 36 38 12" />
        <path d="M58 96 C88 70 120 58 150 64" />
        <path d="M58 96 C90 78 124 80 150 98" />
      </g>
    </svg>
  );
}

interface NewsCardProps {
  article: NewsArticle;
  index?: number;
  /** この記事のコメント数（0 のときは非表示）。 */
  commentCount?: number;
}

/**
 * VICE HUB スタイルのニュースカード。トップページと記事一覧(/news)で共用。
 */
export default function NewsCard({ article, index = 0, commentCount = 0 }: NewsCardProps) {
  const t = useT();
  const lang = useLang();
  const color = CATEGORY_CONFIG[article.category].vice;
  const title = lang === 'en' && article.titleEn ? article.titleEn : article.title;

  return (
    <a
      href={`/news/${article.id}`}
      className="group flex flex-col h-full rounded-2xl overflow-hidden border hover:-translate-y-[3px] transition-all"
      style={{
        // サイト全体のダーク基調に合わせた暗色カード。
        // 背景をページ地色より少し明るくし、枠線＋影でカード同士の境界を出す。
        background: '#1a0f28',
        borderColor: 'rgba(255,255,255,.10)',
        boxShadow: '0 6px 20px rgba(0,0,0,.35)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${color}80`;
        e.currentTarget.style.boxShadow = `0 10px 28px rgba(0,0,0,.45), 0 0 18px ${color}33`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,.10)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,.35)';
      }}
    >
      <div
        className="relative overflow-hidden"
        style={{
          aspectRatio: '16/10',
          background: article.image ? '#1a0a26' : THUMB_GRADIENTS[index % THUMB_GRADIENTS.length],
        }}
      >
        {article.image ? (
          <img
            src={article.image}
            alt={title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300"
          />
        ) : (
          <>
            <div
              className="absolute"
              style={{
                right: '18%',
                top: '26%',
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'radial-gradient(circle,#fff7e6,#ffb24d 42%,rgba(255,90,120,0) 72%)',
              }}
            />
            <ThumbPalm />
          </>
        )}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg,rgba(8,6,15,0) 50%,rgba(8,6,15,.55) 100%)' }}
        />
        <span
          className={`absolute top-3 ${article.image ? 'right-3' : 'left-3'} text-[10.5px] font-black rounded-md`}
          style={{ background: color, color: '#0a0612', padding: '4px 10px' }}
        >
          {t(`cat.${article.category}`)}
        </span>
        {!article.image && <span className="absolute top-3 right-3 text-2xl">{article.icon}</span>}
      </div>
      <div className="p-[14px] pt-3.5 flex flex-col gap-2.5 flex-1">
        <h3 className="text-[15px] font-bold leading-[1.5] m-0 line-clamp-3 min-h-[68px] text-[#f5f7ff]">
          {title}
        </h3>
        <div className="flex items-center gap-3 mt-auto text-white/50 text-[11.5px] font-semibold">
          <span className="vice-num">{article.date}</span>
          {commentCount > 0 && (
            <span className="inline-flex items-center gap-1 ml-auto text-[#ff2d95]">
              <MessageSquare size={13} strokeWidth={2.4} />
              {lang === 'ja' ? 'コメント' : 'Comments'}
              <span className="vice-num">{commentCount}</span>
              {lang === 'ja' ? '件' : ''}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}
