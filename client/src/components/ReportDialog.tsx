import { useState } from 'react';
import { Flag, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { reportPost, REPORT_REASONS, boardErrorMessage } from '@/lib/board';
import { useT } from '@/lib/i18n';

interface Props {
  postId: string;
  /** すでに通報済み（このブラウザで）か。ボタンを無効化する。 */
  reported: boolean;
  onReported: (postId: string) => void;
}

export default function ReportDialog({ postId, reported, onReported }: Props) {
  const tr = useT();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REPORT_REASONS[0].value);
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await reportPost(postId, reason, detail.trim());
    setSubmitting(false);
    if (error) {
      toast.error(boardErrorMessage(error.message));
      // 重複通報ならローカルにも記録してボタンを抑制
      if ((error.message ?? '').includes('duplicate report')) onReported(postId);
      return;
    }
    toast.success(tr('brd.toast.reportDone'));
    onReported(postId);
    setOpen(false);
    setDetail('');
    setReason(REPORT_REASONS[0].value);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={reported}
        className="inline-flex items-center gap-1 text-[11px] font-bold text-white/30 hover:text-[#ff8fc0] transition-colors disabled:opacity-50 disabled:hover:text-white/30"
        title={reported ? tr('brd.reportDone') : tr('brd.reportThis')}
      >
        <Flag size={12} /> {reported ? tr('brd.reported') : tr('brd.report')}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton
          className="border-white/15 bg-[#0e0a17] text-[#f4eef8]"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#ff8fc0]">
              <Flag size={18} /> {tr('brd.reportTitle')}
            </DialogTitle>
            <DialogDescription className="text-white/60">
              {tr('brd.reportDesc')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r.value}
                  className="flex items-center gap-2.5 cursor-pointer rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 hover:border-[#a78bfa]/50 transition-colors"
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="accent-[#a78bfa]"
                  />
                  <span className="text-sm text-white/80">{tr(`brd.reason.${r.value}`)}</span>
                </label>
              ))}
            </div>

            <div>
              <label className="block text-[12px] font-bold text-white/50 mb-1.5">
                {tr('brd.reportDetailLabel')}
              </label>
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder={tr('brd.ph.reportDetail')}
                className="w-full bg-white/[0.04] border border-white/12 rounded-xl px-3 py-2 text-sm text-[#f4eef8] placeholder:text-white/30 focus:outline-none focus:border-[#a78bfa]/60 transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 text-white font-extrabold py-2.5 rounded-full disabled:opacity-60"
              style={{ background: 'linear-gradient(95deg,#ff8a3d,#ff2d95 60%,#c44be0)' }}
            >
              {submitting ? (
                <><Loader2 size={16} className="animate-spin" /> {tr('brd.sending')}</>
              ) : (
                <><Send size={16} /> {tr('brd.reportSubmit')}</>
              )}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
