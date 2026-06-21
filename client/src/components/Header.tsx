import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3 cursor-pointer">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663601090021/ibPF46b5bbEBqwBYMcNbNa/leonida-gate-logo-HfUvSPMMEVGJ79Jek8adsA.webp"
            alt="Leonida Gate"
            className="w-8 h-8"
          />
          <span className="flex flex-col leading-tight">
            <span className="text-[10px] font-mono text-secondary tracking-wider">GTA6コミュニティハブ</span>
            <span className="text-lg font-bold text-primary font-display">LEONIDA GATE</span>
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <button 
            onClick={() => scrollToSection('about')}
            className="text-foreground hover:text-primary transition-colors"
          >
            自己紹介
          </button>
          <button
            onClick={() => scrollToSection('gta6-info')}
            className="text-foreground hover:text-primary transition-colors"
          >
            GTA6情報
          </button>
          <a
            href="/servers"
            className="text-foreground hover:text-accent transition-colors"
          >
            サーバー
          </a>
          <a
            href="/board"
            className="text-foreground hover:text-accent transition-colors"
          >
            掲示板
          </a>
          <button
            onClick={() => scrollToSection('contact')}
            className="text-foreground hover:text-primary transition-colors"
          >
            連絡
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className="w-6 h-6 text-primary" />
          ) : (
            <Menu className="w-6 h-6 text-primary" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav className="md:hidden bg-card border-b border-border">
          <div className="container py-4 flex flex-col gap-4">
            <button 
              onClick={() => scrollToSection('about')}
              className="text-foreground hover:text-primary transition-colors text-left"
            >
              自己紹介
            </button>
            <button
              onClick={() => scrollToSection('gta6-info')}
              className="text-foreground hover:text-primary transition-colors text-left"
            >
              GTA6情報
            </button>
            <a
              href="/servers"
              className="text-foreground hover:text-accent transition-colors text-left"
            >
              サーバー
            </a>
            <a
              href="/board"
              className="text-foreground hover:text-accent transition-colors text-left"
            >
              掲示板
            </a>
            <button
              onClick={() => scrollToSection('contact')}
              className="text-foreground hover:text-primary transition-colors text-left"
            >
              連絡
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
