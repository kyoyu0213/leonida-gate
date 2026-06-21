import { useState } from 'react';
import Header from '@/components/Header';
import NewsCard from '@/components/NewsCard';
import { newsArticles, CATEGORIES } from '@/data/news';

/**
 * ニュース一覧ページ（/news）。全記事をカテゴリ絞り込み付きで表示する。
 * トップページは最新数件のみ表示し、ここで全件を見せる。
 */
export default function NewsList() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredNews =
    selectedCategory === 'all'
      ? newsArticles
      : newsArticles.filter((item) => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background text-foreground pt-16">
      <Header />

      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/5 to-transparent z-0" />

        <div className="container relative z-10">
          {/* Title */}
          <div className="neon-border-cyan rounded-lg p-8 bg-background/80 backdrop-blur-sm mb-10 text-center">
            <p className="text-xs font-mono text-secondary mb-2">MISSION_LOG_TERMINAL_v2.1 | ALL RECORDS</p>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-secondary mb-2">
              ◆ GTA6最新情報（全記事）◆
            </h1>
            <p className="text-sm text-muted-foreground font-mono">
              &gt; 全{newsArticles.length}件の記録を表示中
            </p>
          </div>

          {/* Category Filter Buttons */}
          <div className="mb-10 flex flex-wrap gap-3 justify-center">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg font-mono text-sm transition-all duration-300 ${
                  selectedCategory === cat.id
                    ? 'neon-border bg-primary/20 text-primary shadow-lg shadow-primary/50'
                    : 'neon-border-cyan text-secondary hover:bg-secondary/10 hover:shadow-lg hover:shadow-secondary/30'
                }`}
              >
                <span className="mr-2">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {filteredNews.map((item, idx) => (
              <NewsCard key={item.id} article={item} index={idx} />
            ))}
          </div>

          {/* Back to home */}
          <div className="mt-12 text-center">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-secondary hover:text-primary transition-colors font-mono text-sm"
            >
              &larr; ホームに戻る
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
