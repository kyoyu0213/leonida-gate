import { Button } from '@/components/ui/button';
import { Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import type { FivemServer } from '@/lib/supabase';

interface ServerCardProps {
  server: FivemServer;
  /** タグクリック時のハンドラ（一覧ページの絞り込み用。Topでは省略） */
  onTagClick?: (tag: string) => void;
}

/**
 * FiveMサーバーのカード。サーバー一覧ページ(/servers)とトップページで共用。
 */
export default function ServerCard({ server, onTagClick }: ServerCardProps) {
  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('コピーしました');
  };

  return (
    <div className="group relative border border-pink-500/40 rounded-lg p-6 bg-gradient-to-br from-pink-500/5 to-cyan-500/5 hover:border-pink-500/80 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/30 flex flex-col">
      {/* Server Type Badge */}
      <div className="mb-4">
        <span className="inline-block px-3 py-1 bg-cyan-500/20 border border-cyan-500/50 rounded text-cyan-300 text-xs font-mono">
          {server.type}
        </span>
      </div>

      {/* Server Name */}
      <h3 className="text-xl font-bold mb-2 text-pink-400 font-mono group-hover:text-pink-300 transition-colors break-words">
        {server.name}
      </h3>

      {/* Description */}
      <p className="text-gray-300 text-sm mb-4 whitespace-pre-wrap flex-grow">{server.description}</p>

      {/* Server Info */}
      <div className="space-y-2 mb-4 text-sm">
        {server.connect_info && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-400 font-mono shrink-0">接続:</span>
            <div className="flex items-center gap-2 min-w-0">
              <code className="text-cyan-300 font-mono text-xs bg-background/50 px-2 py-1 rounded truncate">
                {server.connect_info}
              </code>
              <button
                onClick={() => copy(server.connect_info!)}
                className="p-1 hover:bg-cyan-500/20 rounded transition-colors shrink-0"
                title="コピー"
              >
                <Copy size={14} className="text-cyan-400" />
              </button>
            </div>
          </div>
        )}

        {server.language && (
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-mono">言語:</span>
            <span className="text-cyan-300 text-xs">{server.language}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-gray-400 font-mono">登録:</span>
          <span className="text-gray-400 text-xs font-mono">{server.created_at.slice(0, 10)}</span>
        </div>
      </div>

      {/* Tags */}
      {server.tags && server.tags.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {server.tags.map((tag, idx) => (
              <span
                key={idx}
                className={`text-xs px-2 py-1 bg-pink-500/10 border border-pink-500/30 rounded text-pink-300 font-mono transition-colors ${
                  onTagClick ? 'cursor-pointer hover:bg-pink-500/20' : ''
                }`}
                onClick={onTagClick ? () => onTagClick(tag) : undefined}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-cyan-500/20 mt-auto">
        {server.connect_info && (
          <Button
            onClick={() => copy(server.connect_info!)}
            className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-sm h-9 rounded transition-all duration-300"
          >
            <Copy size={14} className="mr-1" />
            接続コピー
          </Button>
        )}
        {server.discord_url && (
          <Button
            onClick={() => window.open(server.discord_url!, '_blank', 'noopener')}
            className="flex-1 bg-pink-600 hover:bg-pink-500 text-white font-mono text-sm h-9 rounded transition-all duration-300"
          >
            <ExternalLink size={14} className="mr-1" />
            Discord
          </Button>
        )}
      </div>
    </div>
  );
}
