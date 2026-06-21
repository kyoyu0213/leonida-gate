import { CATEGORY_CONFIG, type NewsArticle } from '@/data/news';

interface NewsCardProps {
  article: NewsArticle;
  /** 出現アニメーションの遅延に使う（任意） */
  index?: number;
}

/**
 * ニュース一覧で使うカード。トップページと一覧ページ(/news)で共用。
 * クリックで /news/:id の詳細ページへ遷移する。
 */
export default function NewsCard({ article, index = 0 }: NewsCardProps) {
  const { color, status } = CATEGORY_CONFIG[article.category];

  return (
    <a
      href={`/news/${article.id}`}
      className="group relative block cursor-pointer"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Glow effect */}
      <div
        className={`absolute -inset-0.5 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-300 ${
          color === 'primary'
            ? 'bg-gradient-to-r from-primary to-primary/50'
            : color === 'secondary'
              ? 'bg-gradient-to-r from-secondary to-secondary/50'
              : 'bg-gradient-to-r from-accent to-accent/50'
        }`}
      />

      {/* Card */}
      <div className="relative neon-border p-6 rounded-lg bg-background/90 backdrop-blur-sm hover:bg-background transition-all duration-300 h-full flex flex-col">
        {/* Status indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-3xl filter drop-shadow-lg">{article.icon}</div>
          <span
            className={`text-xs font-mono px-2 py-1 rounded border ${
              color === 'primary'
                ? 'border-primary text-primary'
                : color === 'secondary'
                  ? 'border-secondary text-secondary'
                  : 'border-accent text-accent'
            }`}
          >
            {status}
          </span>
        </div>

        {/* Content */}
        <h3
          className={`text-lg font-display font-bold mb-3 ${
            color === 'primary'
              ? 'text-primary'
              : color === 'secondary'
                ? 'text-secondary'
                : 'text-accent'
          }`}
        >
          {article.title}
        </h3>
        <p className="text-foreground text-sm leading-relaxed flex-grow">
          {article.description}
        </p>

        {/* Footer: date + read more */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
            <span>📅 {article.date}</span>
            <span className="text-secondary group-hover:text-primary transition-colors">
              詳細を読む &gt;
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
