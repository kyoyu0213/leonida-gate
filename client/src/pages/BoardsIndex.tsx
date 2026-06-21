import { MessageSquare, ChevronRight } from 'lucide-react';
import Header from '@/components/Header';
import { BOARDS, ACCENTS } from '@/lib/boards';

export default function BoardsIndex() {
  return (
    <div className="min-h-screen bg-background text-foreground pt-16">
      <Header />

      <section className="relative py-16 px-4 border-b border-cyan-500/30">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/20 to-transparent" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-block mb-4 px-4 py-2 border border-cyan-500/50 rounded-lg bg-cyan-500/10 backdrop-blur-sm">
            <span className="text-cyan-400 font-mono text-sm">ANONYMOUS_BOARDS</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-cyan-400 to-lime-400 font-mono">
            掲示板
          </h1>
          <p className="text-cyan-300 text-sm md:text-base font-mono">
            &gt; 匿名で語り合うスレッド型掲示板
          </p>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto space-y-5">
          {BOARDS.map((board) => {
            const a = ACCENTS[board.accent];
            return (
              <a
                key={board.slug}
                href={`/board/${board.slug}`}
                className={`group block border ${a.border} ${a.borderHover} rounded-lg p-6 bg-background/50 transition-all duration-200`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <MessageSquare className={`${a.text} mt-1 shrink-0`} size={24} />
                    <div className="min-w-0">
                      <h2
                        className={`text-xl font-bold font-mono mb-1 text-transparent bg-clip-text bg-gradient-to-r ${a.gradient}`}
                      >
                        {board.title}
                      </h2>
                      <p className="text-sm text-muted-foreground">{board.description}</p>
                    </div>
                  </div>
                  <ChevronRight
                    className={`${a.text} shrink-0 group-hover:translate-x-1 transition-transform`}
                    size={20}
                  />
                </div>
              </a>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-cyan-500/30 py-8 px-4 text-center text-gray-500 font-mono text-sm">
        <p>&copy; 2026 Leonida Gate. All rights reserved.</p>
      </footer>
    </div>
  );
}
