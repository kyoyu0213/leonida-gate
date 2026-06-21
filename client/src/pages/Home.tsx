import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Github, Twitter, Send, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import NewsCard from '@/components/NewsCard';
import ServerCard from '@/components/ServerCard';
import { toast } from 'sonner';
import { newsArticles } from '@/data/news';
import { siteLinks } from '@/data/site';
import { BOARDS, ACCENTS } from '@/lib/boards';
import { listApprovedServers } from '@/lib/servers';
import { supabase, type FivemServer } from '@/lib/supabase';

// トップページに表示する最新記事の件数
const TOP_NEWS_COUNT = 6;
// トップページに表示する最新サーバーの件数
const TOP_SERVER_COUNT = 3;

export default function Home() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const [openProtocol, setOpenProtocol] = useState<number>(-1);
  const [sending, setSending] = useState(false);

  // ニュース記事は client/src/data/news.ts で一元管理。トップは先頭（最新）から数件のみ表示。
  const latestNews = newsArticles.slice(0, TOP_NEWS_COUNT);

  // 最新の承認済みサーバー（Topプレビュー用）
  const [latestServers, setLatestServers] = useState<FivemServer[]>([]);
  useEffect(() => {
    listApprovedServers(TOP_SERVER_COUNT).then(({ data }) =>
      setLatestServers((data as FivemServer[]) ?? [])
    );
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('すべてのフィールドを入力してください');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email)) {
      toast.error('メールアドレスの形式が正しくありません');
      return;
    }

    setSending(true);
    const { error } = await supabase.from('contacts').insert({
      name: formData.name.trim(),
      email: formData.email.trim(),
      message: formData.message.trim(),
    });
    setSending(false);

    if (error) {
      console.error('連絡フォーム送信に失敗:', error);
      toast.error('送信に失敗しました。時間をおいて再度お試しください');
      return;
    }

    toast.success('メッセージを送信しました！');
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Hero Section */}
      <section 
        id="hero"
        className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden"
      >
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(https://d2xsxph8kpxj0f.cloudfront.net/310519663601090021/ibPF46b5bbEBqwBYMcNbNa/hero-cyberpunk-bg-U8qWPJhS9qVRkFmxkHqDgS.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.3
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/70 to-background z-0" />
        
        <div className="container relative z-10 flex flex-col items-center justify-center text-center">
          <div className="slide-in-up mb-8">
            <img 
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663601090021/ibPF46b5bbEBqwBYMcNbNa/leonida-gate-logo-HfUvSPMMEVGJ79Jek8adsA.webp"
              alt="Leonida Gate"
              className="w-24 h-24 mx-auto mb-6 neon-glow"
            />
            <p className="text-sm md:text-base font-mono tracking-[0.3em] text-secondary mb-3">
              GTA6コミュニティハブ
            </p>
            <h1 className="text-5xl md:text-7xl font-display font-bold mb-4 text-primary">
              LEONIDA GATE
            </h1>
            <p className="text-xl md:text-2xl text-secondary mb-8">
              GTA6の最新情報を日本語で、リアルタイムに
            </p>
            <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
              海外の最新ニュースを翻訳・解説し、RPサーバーコミュニティの中心地を目指すプラットフォーム
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="neon-border bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:shadow-lg hover:shadow-primary/50 active:scale-95"
              onClick={() => document.getElementById('gta6-info')?.scrollIntoView({ behavior: 'smooth' })}
            >
              最新情報を見る
            </Button>
            {/* 「コミュニティに参加」ボタンは、コミュニティ機能の準備が整うまで非表示 */}
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-card/50">
        <div className="container">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-12 text-center text-primary">
            自己紹介
          </h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="slide-in-left">
              <div className="neon-border-cyan p-8 rounded-lg">
                <h3 className="text-2xl font-display font-bold mb-4 text-secondary">
                  Leonida Gate
                </h3>
                <p className="text-foreground mb-6">
                  GTA6の海外最新情報を日本語で紹介するコミュニティプラットフォーム。最新ニュース、ゲーム内容、アップデート情報を翻訳・解説し、RPサーバーコミュニティの中心地を目指しています。
                </p>
                <p className="text-muted-foreground">
                  業界の最新情報をいち早くキャッチし、コミュニティメンバーと共に成長するプラットフォームです。
                </p>
              </div>
            </div>
            <div className="slide-in-right grid grid-cols-2 gap-6">
              {/* 記事数：news.ts の記事数から自動算出 */}
              <div className="neon-border p-6 rounded-lg text-center">
                <div className="text-3xl font-display font-bold text-primary mb-2">{newsArticles.length}</div>
                <p className="text-sm text-muted-foreground">記事数</p>
              </div>
              {/* 最終更新：最新記事（配列先頭）の日付 */}
              <div className="neon-border p-6 rounded-lg text-center flex flex-col justify-center">
                <div className="text-xl md:text-2xl font-display font-bold text-secondary mb-2">
                  {newsArticles[0]?.date ?? '—'}
                </div>
                <p className="text-sm text-muted-foreground">最終更新</p>
              </div>
              {/* コミュニティメンバー：Discord開設後（siteLinks.discord 設定時）のみ表示 */}
              {siteLinks.discord && (
                <div className="neon-border p-6 rounded-lg text-center">
                  <div className="text-3xl font-display font-bold text-accent mb-2">
                    {siteLinks.discordMembers || '—'}
                  </div>
                  <p className="text-sm text-muted-foreground">コミュニティメンバー</p>
                </div>
              )}
              {/* 成長の可能性 */}
              <div className="neon-border p-6 rounded-lg text-center">
                <div className="text-3xl font-display font-bold text-primary mb-2">∞</div>
                <p className="text-sm text-muted-foreground">成長の可能性</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GTA6 Info Section - Mission Log Terminal */}
      <section id="gta6-info" className="py-20 relative overflow-hidden">
        {/* Scanline effect overlay */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(0, 245, 255, 0.03) 0px, rgba(0, 245, 255, 0.03) 1px, transparent 1px, transparent 2px)',
            animation: 'scanlines 8s linear infinite'
          }}
        />
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(https://d2xsxph8kpxj0f.cloudfront.net/310519663601090021/ibPF46b5bbEBqwBYMcNbNa/gta6-info-bg-iau6W6ijBRrDZGyhqs7ccE.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.08
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background z-0" />
        
        <div className="container relative z-10">
          {/* Terminal Header */}
          <div className="mb-12 neon-border-cyan rounded-t-lg p-4 bg-card/60 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                <span className="text-xs font-mono text-secondary">MISSION_LOG_TERMINAL_v2.1</span>
              </div>
              <span className="text-xs font-mono text-muted-foreground">STATUS: ACTIVE</span>
            </div>
          </div>
          
          {/* Section Title */}
          <div className="neon-border-cyan rounded-b-lg p-8 bg-background/80 backdrop-blur-sm mb-12">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-center text-secondary mb-2">
              ◆ GTA6最新情報 ◆
            </h2>
            <p className="text-center text-sm text-muted-foreground font-mono">
              &gt; 海外最新情報をリアルタイムで取得・解析中...
            </p>
          </div>

          {/* Mission Cards Grid（トップは最新6件のみ。全件は /news へ） */}
          <div className="grid md:grid-cols-3 gap-6">
            {latestNews.map((item, idx) => (
              <NewsCard key={item.id} article={item} index={idx} />
            ))}
          </div>

          {/* すべての記事を見る */}
          <div className="mt-12 text-center">
            <a
              href="/news"
              className="inline-flex items-center gap-2 px-6 py-3 neon-border-cyan rounded-lg text-secondary font-mono text-sm hover:bg-secondary/10 hover:shadow-lg hover:shadow-secondary/30 transition-all duration-300"
            >
              すべての記事を見る（全{newsArticles.length}件）&gt;
            </a>
          </div>
        </div>
        
        <style>{`
          @keyframes scanlines {
            0% { transform: translateY(0); }
            100% { transform: translateY(10px); }
          }
        `}</style>
      </section>

      {/* FiveM Servers Section - サーバー一覧への導線 */}
      <section id="servers" className="py-20 bg-card/30 relative overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-pink-500/5 to-transparent" />
        <div className="container relative z-10">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-3 text-center text-primary">
            ◆ FiveM日本サーバー一覧 ◆
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            日本のFiveM RPサーバーを探せる掲示板。あなたのサーバーを掲載することもできます。
          </p>

          {latestServers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestServers.map((server) => (
                <ServerCard key={server.id} server={server} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground font-mono text-sm">
              &gt; まだ掲載されたサーバーがありません
            </p>
          )}

          <div className="mt-10 text-center">
            <a
              href="/servers"
              className="inline-flex items-center gap-2 px-6 py-3 neon-border rounded-lg text-primary font-mono text-sm hover:bg-primary/10 transition-all duration-300"
            >
              すべてのサーバーを見る・掲載する &gt;
            </a>
          </div>
        </div>
      </section>

      {/* Board Section - 掲示板への導線 */}
      <section id="board" className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-accent/5 to-transparent" />
        <div className="container relative z-10">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-3 text-center text-accent">
            ◆ 掲示板 ◆
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            匿名でGTA/FiveM RPやGTA6について語り合える、スレッド型の掲示板。だれでも気軽に書き込めます。
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {BOARDS.map((board) => {
              const a = ACCENTS[board.accent];
              return (
                <a
                  key={board.slug}
                  href={`/board/${board.slug}`}
                  className={`group block border ${a.border} ${a.borderHover} rounded-lg p-7 bg-background/60 backdrop-blur-sm transition-all duration-300`}
                >
                  <h3
                    className={`text-xl font-display font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r ${a.gradient}`}
                  >
                    {board.title}
                  </h3>
                  <p className="text-sm text-foreground/80 mb-5">{board.description}</p>
                  <span
                    className={`inline-flex items-center gap-2 font-mono text-sm ${a.text} group-hover:gap-3 transition-all`}
                  >
                    掲示板を開く &gt;
                  </span>
                </a>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <a
              href="/board"
              className="inline-flex items-center gap-2 px-6 py-3 neon-border-green rounded-lg text-accent font-mono text-sm hover:bg-accent/10 transition-all duration-300"
            >
              掲示板一覧を見る &gt;
            </a>
          </div>
        </div>
      </section>

      {/* ▼▼▼ 一旦非表示（サーバー/Discord準備中のため）: コミュニティ・機密プロトコル・Discordゲートウェイ。
              復活させるときは下の `false &&` を `true &&` に変えるだけでOK ▼▼▼ */}
      {false && (<>
      {/* Community Section */}
      <section id="community" className="py-20 bg-card/50">
        <div className="container">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-12 text-center text-primary">
            コミュニティ
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Leonida GATとGTA6を愛するプレイヤーたちのコミュニティ。情報共有、ディスカッション、そして業界のサーバーでの活動を通じて繋がります。
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="neon-border-cyan p-8 rounded-lg">
              <h3 className="text-2xl font-display font-bold mb-4 text-secondary">
                ✓ 参加するメリット
              </h3>
              <ul className="space-y-3 text-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-secondary">▸</span>
                  <span>最新のGTA6情報をいち早く入手</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-secondary">▸</span>
                  <span>同じ興味を持つプレイヤーとネットワーク</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-secondary">▸</span>
                  <span>RPサーバーでの協力プレイ機会</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-secondary">▸</span>
                  <span>コミュニティイベント・大会への参加</span>
                </li>
              </ul>
            </div>
            <div className="neon-border p-8 rounded-lg">
              <h3 className="text-2xl font-display font-bold mb-4 text-primary">
                ⚡ コミュニティ活動
              </h3>
              <ul className="space-y-3 text-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-primary">▸</span>
                  <span>週間ニュースレター配信</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary">▸</span>
                  <span>Discordでのリアルタイムチャット</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary">▸</span>
                  <span>月間コミュニティイベント</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary">▸</span>
                  <span>プレイヤーコンテスト・キャンペーン</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Secret Protocol Section - RP Server Rules */}
      <section id="protocol" className="py-20 relative overflow-hidden">
        <div 
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(0, 255, 200, 0.03) 0px, rgba(0, 255, 200, 0.03) 1px, transparent 1px, transparent 2px)',
            animation: 'scanlines 8s linear infinite'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background z-0" />
        
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Section Header */}
            <div className="mb-8 text-center">
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 text-accent">
                🔐 機密プロトコル
              </h2>
              <p className="text-secondary font-mono text-sm mb-2">RP_SERVER_PROTOCOL_v2.0 | CLEARANCE_LEVEL: PUBLIC</p>
              <p className="text-foreground">RPサーバー参加前に必ずお読みください</p>
            </div>

            {/* Accordion Container */}
            <div className="space-y-4">
              {/* Protocol Item 1 */}
              <div className="neon-border rounded-lg overflow-hidden bg-background/80 backdrop-blur-sm">
                <button
                  onClick={() => setOpenProtocol(openProtocol === 0 ? -1 : 0)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-primary/10 transition-colors duration-200"
                >
                  <span className="text-lg font-display font-bold text-primary flex items-center gap-3">
                    <span className="text-accent">▸</span>
                    基本ルール
                  </span>
                  <span className="text-secondary text-2xl transition-transform duration-300" style={{
                    transform: openProtocol === 0 ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </button>
                {openProtocol === 0 && (
                  <div className="px-6 py-4 border-t border-border/50 bg-background/50 space-y-3 font-mono text-sm">
                    <p className="text-secondary">&gt; RULE_01: 全プレイヤーに対する尊重と礼儀を保つこと</p>
                    <p className="text-foreground">&gt; RULE_02: ハラスメント・差別・暴力的な言動は厳禁</p>
                    <p className="text-foreground">&gt; RULE_03: チートやグリッチの悪用は即座にBANの対象</p>
                    <p className="text-foreground">&gt; RULE_04: 他プレイヤーの財産・キャラクターを尊重する</p>
                    <p className="text-secondary">&gt; RULE_05: サーバー管理者の指示に従うこと</p>
                  </div>
                )}
              </div>

              {/* Protocol Item 2 */}
              <div className="neon-border-cyan rounded-lg overflow-hidden bg-background/80 backdrop-blur-sm">
                <button
                  onClick={() => setOpenProtocol(openProtocol === 1 ? -1 : 1)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-secondary/10 transition-colors duration-200"
                >
                  <span className="text-lg font-display font-bold text-secondary flex items-center gap-3">
                    <span className="text-accent">▸</span>
                    参加条件
                  </span>
                  <span className="text-secondary text-2xl transition-transform duration-300" style={{
                    transform: openProtocol === 1 ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </button>
                {openProtocol === 1 && (
                  <div className="px-6 py-4 border-t border-border/50 bg-background/50 space-y-3 font-mono text-sm">
                    <p className="text-secondary">&gt; REQUIREMENT_01: 18歳以上であること（年齢確認あり）</p>
                    <p className="text-foreground">&gt; REQUIREMENT_02: Discordアカウントを保有していること</p>
                    <p className="text-foreground">&gt; REQUIREMENT_03: 日本語での基本的なコミュニケーションが可能</p>
                    <p className="text-foreground">&gt; REQUIREMENT_04: ルール同意書への署名</p>
                    <p className="text-secondary">&gt; REQUIREMENT_05: 初回ホワイトリスト申請フォーム記入</p>
                  </div>
                )}
              </div>

              {/* Protocol Item 3 */}
              <div className="neon-border rounded-lg overflow-hidden bg-background/80 backdrop-blur-sm">
                <button
                  onClick={() => setOpenProtocol(openProtocol === 2 ? -1 : 2)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-primary/10 transition-colors duration-200"
                >
                  <span className="text-lg font-display font-bold text-primary flex items-center gap-3">
                    <span className="text-accent">▸</span>
                    サーバー仕様
                  </span>
                  <span className="text-secondary text-2xl transition-transform duration-300" style={{
                    transform: openProtocol === 2 ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </button>
                {openProtocol === 2 && (
                  <div className="px-6 py-4 border-t border-border/50 bg-background/50 space-y-3 font-mono text-sm">
                    <p className="text-secondary">&gt; SERVER_TYPE: FiveM RP Server (GTA V Roleplay)</p>
                    <p className="text-foreground">&gt; PLAYER_SLOTS: 64 / 128 (予定)</p>
                    <p className="text-foreground">&gt; REGION: Japan | LANGUAGE: Japanese</p>
                    <p className="text-foreground">&gt; ECONOMY: In-game currency system</p>
                    <p className="text-secondary">&gt; WHITELIST: Required | APPLICATIONS: Discord</p>
                  </div>
                )}
              </div>

              {/* Protocol Item 4 */}
              <div className="neon-border-cyan rounded-lg overflow-hidden bg-background/80 backdrop-blur-sm">
                <button
                  onClick={() => setOpenProtocol(openProtocol === 3 ? -1 : 3)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-secondary/10 transition-colors duration-200"
                >
                  <span className="text-lg font-display font-bold text-secondary flex items-center gap-3">
                    <span className="text-accent">▸</span>
                    キャラクター作成ガイド
                  </span>
                  <span className="text-secondary text-2xl transition-transform duration-300" style={{
                    transform: openProtocol === 3 ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </button>
                {openProtocol === 3 && (
                  <div className="px-6 py-4 border-t border-border/50 bg-background/50 space-y-3 font-mono text-sm">
                    <p className="text-secondary">&gt; CHARACTER_NAME: 実名に近い名前を使用すること</p>
                    <p className="text-foreground">&gt; BACKGROUND: キャラクターのバックストーリーを作成</p>
                    <p className="text-foreground">&gt; ROLEPLAY: 常にキャラクターを演じること（OOC禁止）</p>
                    <p className="text-foreground">&gt; APPEARANCE: 現実的な外見設定を推奨</p>
                    <p className="text-secondary">&gt; JOBS: 複数の職業を選択可能（警察、医者、運転手など）</p>
                  </div>
                )}
              </div>

              {/* Protocol Item 5 */}
              <div className="neon-border rounded-lg overflow-hidden bg-background/80 backdrop-blur-sm">
                <button
                  onClick={() => setOpenProtocol(openProtocol === 4 ? -1 : 4)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-primary/10 transition-colors duration-200"
                >
                  <span className="text-lg font-display font-bold text-primary flex items-center gap-3">
                    <span className="text-accent">▸</span>
                    処罰システム
                  </span>
                  <span className="text-secondary text-2xl transition-transform duration-300" style={{
                    transform: openProtocol === 4 ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </button>
                {openProtocol === 4 && (
                  <div className="px-6 py-4 border-t border-border/50 bg-background/50 space-y-3 font-mono text-sm">
                    <p className="text-secondary">&gt; WARNING: 初回違反時 | 管理者から警告</p>
                    <p className="text-foreground">&gt; MUTE: 2回目違反 | 24時間チャット禁止</p>
                    <p className="text-foreground">&gt; KICK: 3回目違反 | サーバーから一時退出</p>
                    <p className="text-foreground">&gt; BAN: 重大違反 | 永久追放（申し立て可能）</p>
                    <p className="text-secondary">&gt; APPEAL: 異議申し立ては管理者に連絡</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Info */}
            <div className="mt-8 p-4 border border-border/50 rounded-lg bg-background/30 text-center">
              <p className="text-xs font-mono text-muted-foreground mb-2">
                LAST_UPDATED: 2026-06-18 | VERSION: 2.0
              </p>
              <p className="text-sm text-foreground">
                ご質問や申し込みは、Discordサーバーの <span className="text-accent font-mono">#apply</span> チャネルまでお願いします。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Discord Hacking Interface Section */}
      <section id="discord" className="py-20 relative overflow-hidden">
        {/* Scanline effect overlay */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(255, 0, 127, 0.02) 0px, rgba(255, 0, 127, 0.02) 1px, transparent 1px, transparent 2px)',
            animation: 'scanlines 8s linear infinite'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background z-0" />
        
        <div className="container relative z-10">
          {/* Hacking Interface Terminal */}
          <div className="max-w-4xl mx-auto">
            {/* Terminal Header */}
            <div className="mb-6 neon-border-cyan rounded-t-lg p-4 bg-card/60 backdrop-blur-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-xs font-mono text-secondary">DISCORD_GATEWAY_v3.2</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                <span className="text-xs font-mono text-muted-foreground">CONNECTED</span>
              </div>
            </div>

            {/* Main Content */}
            <div className="neon-border-cyan rounded-b-lg p-8 bg-background/80 backdrop-blur-sm">
              {/* Hacking sequence animation */}
              <div className="mb-8 font-mono text-sm space-y-2">
                <div className="text-secondary">&gt; INITIALIZING DISCORD GATEWAY...</div>
                <div className="text-muted-foreground">&gt; SCANNING COMMUNITY MEMBERS...</div>
                <div className="text-accent">&gt; LOADING CHANNELS...</div>
                <div className="text-secondary animate-pulse">&gt; ACCESS GRANTED ✓</div>
              </div>

              {/* Main Message */}
              <div className="mb-8">
                <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 text-primary">
                  🔓 DISCORD GATEWAY
                </h2>
                <p className="text-lg text-secondary mb-4">
                  コミュニティの中枢へアクセス
                </p>
                <p className="text-foreground leading-relaxed">
                  Leonida Gateの公式Discordサーバーに参加して、GTA6の最新情報をリアルタイムで共有し、同じ志を持つプレイヤーたちと繋がりましょう。ここはあなたのための情報ハブであり、コミュニティの本拠地です。
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <div className="neon-border p-4 rounded-lg bg-background/50">
                  <div className="text-accent font-mono text-sm mb-2">&gt; #general</div>
                  <p className="text-sm text-foreground">日本語での情報共有とディスカッション</p>
                </div>
                <div className="neon-border p-4 rounded-lg bg-background/50">
                  <div className="text-secondary font-mono text-sm mb-2">&gt; #news</div>
                  <p className="text-sm text-foreground">GTA6の最新ニュース配信チャネル</p>
                </div>
                <div className="neon-border p-4 rounded-lg bg-background/50">
                  <div className="text-primary font-mono text-sm mb-2">&gt; #gaming</div>
                  <p className="text-sm text-foreground">ゲームプレイ情報とプレイ動画共有</p>
                </div>
                <div className="neon-border p-4 rounded-lg bg-background/50">
                  <div className="text-accent font-mono text-sm mb-2">&gt; #rp-server</div>
                  <p className="text-sm text-foreground">RPサーバー情報と募集掲示板</p>
                </div>
              </div>

              {/* Status Indicators */}
              <div className="mb-8 p-4 border border-border/50 rounded-lg bg-background/30">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-display font-bold text-secondary mb-1">500+</div>
                    <p className="text-xs text-muted-foreground font-mono">MEMBERS</p>
                  </div>
                  <div>
                    <div className="text-2xl font-display font-bold text-primary mb-1">24/7</div>
                    <p className="text-xs text-muted-foreground font-mono">ACTIVE</p>
                  </div>
                  <div>
                    <div className="text-2xl font-display font-bold text-accent mb-1">∞</div>
                    <p className="text-xs text-muted-foreground font-mono">GROWTH</p>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="flex flex-col sm:flex-row gap-4">
                {siteLinks.discord ? (
                  <a
                    href={siteLinks.discord}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-6 py-4 neon-border bg-primary text-primary-foreground font-mono text-center rounded-lg hover:bg-primary/90 transition-all duration-200 hover:shadow-lg hover:shadow-primary/50 active:scale-95"
                  >
                    <span className="text-lg font-bold">→ DISCORD に参加</span>
                  </a>
                ) : (
                  <div
                    className="flex-1 px-6 py-4 border border-border text-muted-foreground font-mono text-center rounded-lg cursor-not-allowed select-none"
                    aria-disabled="true"
                  >
                    <span className="text-lg font-bold">DISCORD 準備中…</span>
                  </div>
                )}
              </div>

              {/* Footer message */}
              <div className="mt-8 pt-8 border-t border-border/50 text-center">
                <p className="text-xs font-mono text-muted-foreground">
                  &gt; ACCESS LEVEL: PUBLIC | STATUS: OPEN FOR ALL | NEXT UPDATE: REAL-TIME
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ▲▲▲ 一旦非表示ここまで ▲▲▲ */}
      </>)}

      {/* Contact Form Section */}
      <section id="contact" className="py-20 relative overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(https://d2xsxph8kpxj0f.cloudfront.net/310519663601090021/ibPF46b5bbEBqwBYMcNbNa/community-bg-pnxVP3F9gYz4nzVYpKLhqM.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.1
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background z-0" />
        
        <div className="container relative z-10">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-12 text-center text-primary">
            連絡フォーム
          </h2>
          <div className="max-w-2xl mx-auto neon-border p-8 rounded-lg bg-background/90 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-mono text-secondary mb-2">
                  お名前
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="bg-card border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-mono text-secondary mb-2">
                  メールアドレス
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="bg-card border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-mono text-secondary mb-2">
                  メッセージ
                </label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Your message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={5}
                  className="bg-card border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={sending}
                className="w-full neon-border bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-primary/50 active:scale-95 disabled:opacity-60"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    送信中...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    メッセージを送信
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card/50 py-12 border-t border-border">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="text-lg font-display font-bold text-primary mb-4">Leonida Gate</h4>
              <p className="text-sm text-muted-foreground">GTA6コミュニティハブ</p>
            </div>
            <div>
              <h4 className="text-lg font-display font-bold text-secondary mb-4">リンク</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#about" className="text-muted-foreground hover:text-secondary transition-colors">自己紹介</a></li>
                <li><a href="#gta6-info" className="text-muted-foreground hover:text-secondary transition-colors">情報</a></li>
                <li><a href="/board" className="text-muted-foreground hover:text-secondary transition-colors">掲示板</a></li>
                <li><a href="/servers" className="text-muted-foreground hover:text-secondary transition-colors">サーバー</a></li>
                <li><a href="/terms" className="text-muted-foreground hover:text-secondary transition-colors">利用規約・プライバシー</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-display font-bold text-accent mb-4">フォロー</h4>
              <div className="flex gap-4">
                {siteLinks.twitter && (
                  <a href={siteLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-secondary transition-colors">
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
                {siteLinks.github && (
                  <a href={siteLinks.github} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-secondary transition-colors">
                    <Github className="w-5 h-5" />
                  </a>
                )}
                {siteLinks.email && (
                  <a href={`mailto:${siteLinks.email}`} className="text-muted-foreground hover:text-secondary transition-colors">
                    <Mail className="w-5 h-5" />
                  </a>
                )}
                {!siteLinks.twitter && !siteLinks.github && !siteLinks.email && (
                  <span className="text-sm text-muted-foreground font-mono">準備中…</span>
                )}
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2026 Leonida Gate. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
