import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      toast.error('送信に失敗しました。時間をおいて再度お試しください');
      return;
    }
    toast.success('メッセージを送信しました！');
    setFormData({ name: '', email: '', message: '' });
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
              <label className="block text-sm font-bold text-[#22d3ee] mb-2">メールアドレス</label>
              <input name="email" type="email" placeholder="your@email.com" value={formData.email} onChange={handleInputChange} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#22d3ee] mb-2">お問い合わせ内容</label>
              <textarea name="message" placeholder="情報提供・削除依頼・その他のご連絡内容をご記入ください" rows={7} value={formData.message} onChange={handleInputChange} className={inputClass} />
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
