import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, Send, Server as ServerIcon, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import ServerCard from '@/components/ServerCard';
import { toast } from 'sonner';
import { supabase, type FivemServer } from '@/lib/supabase';
import { listApprovedServers } from '@/lib/servers';

// 投稿フォームのタイプ選択肢
const SERVER_TYPES = [
  { id: 'all', label: 'すべて', icon: '◆' },
  { id: 'RP', label: 'RP', icon: '🎭' },
  { id: 'Racing', label: 'レース', icon: '🏎️' },
  { id: 'Survival', label: 'サバイバル', icon: '🏕️' },
  { id: 'Other', label: 'その他', icon: '🎮' },
];

const emptyForm = {
  name: '',
  description: '',
  type: 'RP',
  connect_info: '',
  discord_url: '',
  language: '日本語',
  tags: '',
};

export default function ServerBoard() {
  const [servers, setServers] = useState<FivemServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // 承認済みサーバーを取得
  const loadServers = async () => {
    setLoading(true);
    const { data, error } = await listApprovedServers();

    if (error) {
      console.error('サーバー一覧の取得に失敗:', error);
      toast.error('サーバー一覧の取得に失敗しました');
      setServers([]);
    } else {
      setServers((data as FivemServer[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadServers();
  }, []);

  const allTags = Array.from(new Set(servers.flatMap((s) => s.tags ?? [])));

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const filteredServers = servers.filter((server) => {
    const matchesType = selectedType === 'all' || server.type === selectedType;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      server.name.toLowerCase().includes(q) || server.description.toLowerCase().includes(q);
    const matchesTags =
      selectedTags.length === 0 || selectedTags.some((tag) => (server.tags ?? []).includes(tag));
    return matchesType && matchesSearch && matchesTags;
  });

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim()) {
      toast.error('サーバー名と説明は必須です');
      return;
    }
    if (!form.connect_info.trim() && !form.discord_url.trim()) {
      toast.error('接続情報かDiscordリンクのどちらかは入力してください');
      return;
    }

    setSubmitting(true);
    const tags = form.tags
      .split(/[,、\s]+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 8);

    const { error } = await supabase.from('fivem_servers').insert({
      name: form.name.trim(),
      description: form.description.trim(),
      type: form.type,
      connect_info: form.connect_info.trim() || null,
      discord_url: form.discord_url.trim() || null,
      language: form.language.trim() || null,
      tags,
      // approved は DB 側のデフォルト false（承認制）。ここでは送らない。
    });
    setSubmitting(false);

    if (error) {
      console.error('投稿に失敗:', error);
      toast.error('投稿に失敗しました。時間をおいて再度お試しください');
      return;
    }

    toast.success('申請を受け付けました！運営の承認後に掲載されます');
    setForm(emptyForm);
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pt-16">
      <Header />

      {/* Hero Section */}
      <section className="relative py-16 px-4 border-b border-cyan-500/30">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/20 to-transparent" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-block mb-4 px-4 py-2 border border-cyan-500/50 rounded-lg bg-cyan-500/10 backdrop-blur-sm">
            <span className="text-cyan-400 font-mono text-sm">FIVEM_SERVER_BOARD v2.0</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-cyan-400 to-lime-400 font-mono">
            FiveM サーバー掲示板
          </h1>

          <p className="text-cyan-300 text-lg mb-8 font-mono">
            &gt; あなたのサーバーを掲載・発見する
          </p>

          <Button
            onClick={() => setShowForm((v) => !v)}
            className="bg-pink-600 hover:bg-pink-500 text-white font-mono shadow-lg shadow-pink-500/30"
          >
            {showForm ? (
              <>
                <X size={16} className="mr-2" /> 閉じる
              </>
            ) : (
              <>
                <Plus size={16} className="mr-2" /> サーバーを掲載する
              </>
            )}
          </Button>
        </div>
      </section>

      {/* Submission Form */}
      {showForm && (
        <section className="py-10 px-4 border-b border-pink-500/30 bg-pink-500/5">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-2 text-pink-400 font-mono">サーバーを掲載する</h2>
            <p className="text-sm text-gray-400 mb-6 font-mono">
              &gt; 投稿は運営の承認後に掲載されます（スパム防止のため）
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-mono text-cyan-400 mb-2">サーバー名 *</label>
                <Input
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="例: LEONIDA RP"
                  className="bg-background/60 border-cyan-500/40 text-foreground"
                  maxLength={60}
                />
              </div>

              <div>
                <label className="block text-sm font-mono text-cyan-400 mb-2">説明 *</label>
                <Textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  placeholder="サーバーの特徴やコンセプトを書いてください"
                  rows={4}
                  className="bg-background/60 border-cyan-500/40 text-foreground"
                  maxLength={500}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-mono text-cyan-400 mb-2">タイプ</label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleFormChange}
                    className="w-full h-10 rounded-md bg-background/60 border border-cyan-500/40 text-foreground px-3 font-mono text-sm"
                  >
                    {SERVER_TYPES.filter((t) => t.id !== 'all').map((t) => (
                      <option key={t.id} value={t.id} className="bg-background">
                        {t.icon} {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-mono text-cyan-400 mb-2">言語</label>
                  <Input
                    name="language"
                    value={form.language}
                    onChange={handleFormChange}
                    placeholder="日本語 / 英語 など"
                    className="bg-background/60 border-cyan-500/40 text-foreground"
                    maxLength={30}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-mono text-cyan-400 mb-2">
                  接続情報（cfx.re コード または IP:ポート）
                </label>
                <Input
                  name="connect_info"
                  value={form.connect_info}
                  onChange={handleFormChange}
                  placeholder="例: cfx.re/join/abc123 もしくは 123.45.67.89:30120"
                  className="bg-background/60 border-cyan-500/40 text-foreground font-mono"
                  maxLength={120}
                />
              </div>

              <div>
                <label className="block text-sm font-mono text-cyan-400 mb-2">Discord 招待URL</label>
                <Input
                  name="discord_url"
                  value={form.discord_url}
                  onChange={handleFormChange}
                  placeholder="https://discord.gg/xxxxxxx"
                  className="bg-background/60 border-cyan-500/40 text-foreground font-mono"
                  maxLength={120}
                />
              </div>

              <div>
                <label className="block text-sm font-mono text-cyan-400 mb-2">
                  タグ（カンマ区切り・最大8個）
                </label>
                <Input
                  name="tags"
                  value={form.tags}
                  onChange={handleFormChange}
                  placeholder="例: 初心者向け, ホワイトリスト, 経済システム"
                  className="bg-background/60 border-cyan-500/40 text-foreground"
                  maxLength={120}
                />
              </div>

              <p className="text-xs text-gray-500 font-mono">
                * は必須。接続情報かDiscordリンクのどちらかは必ず入力してください。
              </p>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-pink-600 hover:bg-pink-500 text-white font-mono disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" /> 送信中...
                  </>
                ) : (
                  <>
                    <Send size={16} className="mr-2" /> 掲載を申請する
                  </>
                )}
              </Button>
            </form>
          </div>
        </section>
      )}

      {/* Search & Filter Section */}
      <section className="py-10 px-4 border-b border-cyan-500/30">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Input
              type="text"
              placeholder="サーバー名・説明で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-background/50 border border-cyan-500/50 rounded-lg px-4 py-3 text-foreground placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 font-mono"
            />
          </div>

          {/* Filter Buttons - Type */}
          <div className="mb-6">
            <p className="text-cyan-400 font-mono text-sm mb-3">◆ プレイスタイル:</p>
            <div className="flex flex-wrap gap-3">
              {SERVER_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`px-4 py-2 rounded-lg font-mono text-sm transition-all duration-300 border ${
                    selectedType === type.id
                      ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300 shadow-lg shadow-cyan-500/50'
                      : 'border-cyan-500/30 bg-background/50 text-cyan-400 hover:border-cyan-500/60 hover:bg-cyan-500/10'
                  }`}
                >
                  {type.icon} {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Buttons - Tags */}
          {allTags.length > 0 && (
            <div className="mb-6">
              <p className="text-pink-400 font-mono text-sm mb-3">◆ タグ:</p>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-lg font-mono text-xs transition-all duration-300 border ${
                      selectedTags.includes(tag)
                        ? 'border-pink-500 bg-pink-500/20 text-pink-300 shadow-lg shadow-pink-500/50'
                        : 'border-pink-500/30 bg-background/50 text-pink-400 hover:border-pink-500/60 hover:bg-pink-500/10'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 text-cyan-400 font-mono text-sm">
            &gt; {loading ? '読み込み中...' : `${filteredServers.length} サーバーが見つかりました`}
          </div>
        </div>
      </section>

      {/* Server Cards Grid */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="text-center py-16 text-cyan-400 font-mono">
              <Loader2 size={28} className="mx-auto mb-4 animate-spin" />
              &gt; サーバー情報を取得中...
            </div>
          ) : filteredServers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServers.map((server) => (
                <ServerCard key={server.id} server={server} onTagClick={toggleTag} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <ServerIcon size={40} className="mx-auto mb-4 text-cyan-500/50" />
              {servers.length === 0 ? (
                <>
                  <p className="text-gray-400 font-mono mb-4">
                    &gt; まだ掲載されたサーバーがありません
                  </p>
                  <Button
                    onClick={() => setShowForm(true)}
                    className="bg-pink-600 hover:bg-pink-500 text-white font-mono"
                  >
                    <Plus size={16} className="mr-2" /> 最初のサーバーを掲載する
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-gray-400 font-mono mb-4">
                    &gt; 検索条件に一致するサーバーが見つかりません
                  </p>
                  <Button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedType('all');
                      setSelectedTags([]);
                    }}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-mono"
                  >
                    フィルターをリセット
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-cyan-500/30 py-8 px-4 text-center text-gray-500 font-mono text-sm">
        <p>&copy; 2026 Leonida Gate. All rights reserved.</p>
      </footer>
    </div>
  );
}
