import { useState } from 'react';
import { Send, Loader2, ImagePlus, X } from 'lucide-react';
import Header from '@/components/Header';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { uploadRawImages } from '@/lib/images';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.message) {
      toast.error('お名前とお問い合わせ内容を入力してください');
      return;
    }
    // メールは任意。入力された場合のみ形式チェック。
    if (formData.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email)) {
      toast.error('メールアドレスの形式が正しくありません');
      return;
    }
    setSending(true);
    // 添付画像があれば先にアップロード（EXIF除去・圧縮）
    let imagePaths: string[] = [];
    if (files.length > 0) {
      const { paths, error: upErr } = await uploadRawImages('contact', files);
      if (upErr) {
        setSending(false);
        toast.error(upErr);
        return;
      }
      imagePaths = paths;
    }
    const { error } = await supabase.from('contacts').insert({
      name: formData.name.trim(),
      email: formData.email.trim() || null,
      message: formData.message.trim(),
      images: imagePaths,
    });
    setSending(false);
    if (error) {
      toast.error('送信に失敗しました。時間をおいて再度お試しください');
      return;
    }
    toast.success('メッセージを送信しました！');
    setFormData({ name: '', email: '', message: '' });
    setFiles([]);
  };

  const inputClass =
    'w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-[#f4eef8] placeholder:text-white/35 focus:outline-none focus:border-[#ff2d95]/60 transition-colors';

  return (
    <div className="vice-page vice-noise">
      <Header />

      <main className="max-w-[760px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-[100px] pb-20 relative z-10">
        <span className="text-xs font-extrabold tracking-[0.3em] text-[#22d3ee] uppercase">Contact</span>
        <h1 className="vice-display vice-grad text-4xl md:text-5xl mt-2 mb-4">お問い合わせ</h1>
        <p className="text-white/60 leading-relaxed mb-4">
          情報提供・削除依頼などのお問い合わせはこちらから。GTA6・FiveM RPに関する情報提供、記事や掲示板・サーバー掲載内容の削除・修正のご依頼、その他のご連絡は、以下のフォームよりお送りください。内容を確認のうえ、必要に応じて対応いたします。
        </p>
        <div className="mb-8 rounded-xl border border-[#ff2d95]/25 bg-[#ff2d95]/[0.07] px-4 py-3">
          <p className="text-[13px] text-white/60 leading-relaxed">
            ※ いただいたお問い合わせの内容によっては、すべてのご要望にお応えできない場合や、個別にご返信できない場合がございます。あらかじめご了承ください。
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#22d3ee] mb-2">お名前</label>
              <input name="name" type="text" placeholder="お名前（ハンドルネーム可）" value={formData.name} onChange={handleInputChange} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#22d3ee] mb-2">メールアドレス（返信が必要な方のみ）</label>
              <input name="email" type="email" placeholder="your@email.com（任意）" value={formData.email} onChange={handleInputChange} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#22d3ee] mb-2">お問い合わせ内容</label>
              <textarea name="message" placeholder="情報提供・削除依頼・その他のご連絡内容をご記入ください" rows={7} value={formData.message} onChange={handleInputChange} className={inputClass} />
            </div>

            {/* 画像添付（任意・jpg/png/webp・最大3枚） */}
            <div>
              <label className="block text-sm font-bold text-[#22d3ee] mb-2">
                画像の添付（任意・jpg/png/webp・最大3枚）
              </label>
              {files.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {files.map((f, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 text-[11px] text-white/70 bg-white/[0.06] border border-white/10 rounded-lg px-2 py-1"
                    >
                      {f.name.length > 20 ? f.name.slice(0, 18) + '…' : f.name}
                      <button
                        type="button"
                        onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-white/40 hover:text-[#ff8fc0]"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-[13px] font-bold text-white/70 hover:text-[#22d3ee] border border-white/15 rounded-lg px-3 py-2 transition-colors">
                <ImagePlus size={16} /> 画像を選ぶ
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const picked = Array.from(e.target.files ?? []);
                    setFiles((prev) => [...prev, ...picked].slice(0, 3));
                    e.target.value = '';
                  }}
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 text-white font-extrabold py-3 rounded-full hover:-translate-y-0.5 transition-transform disabled:opacity-60 disabled:hover:translate-y-0"
              style={{ background: 'linear-gradient(95deg,#ff8a3d,#ff2d95 60%,#c44be0)' }}
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> 送信中...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> 送信する
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-10">
          <a href="/" className="inline-flex items-center gap-2 text-[#22d3ee] hover:text-white transition-colors font-bold text-sm">
            &larr; ホームに戻る
          </a>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/10" style={{ background: 'rgba(8,6,15,.6)' }}>
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-[30px] py-8 text-center text-[11.5px] text-white/40">
          本サイトは GTA6 の非公式ファンコミュニティです。Rockstar Games / Take-Two とは一切関係ありません。© 2026 GTA6 FEED
        </div>
      </footer>
    </div>
  );
}
