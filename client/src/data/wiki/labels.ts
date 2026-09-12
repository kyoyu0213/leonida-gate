// ============================================================================
//  確度ラベルの定義と、本文中の【…】トークンの判定。
// ============================================================================
import type { WikiLabel } from './types';

export interface WikiLabelMeta {
  /** バッジ・凡例に出す短い名前。 */
  name: string;
  /** 凡例の説明。 */
  desc: string;
}

/** 表示順＝凡例の並び。 */
export const WIKI_LABEL_ORDER: WikiLabel[] = ['official', 'preview', 'testimony', 'analysis'];

export const WIKI_LABELS: Record<WikiLabel, WikiLabelMeta> = {
  official: { name: '公式', desc: 'Rockstar公式・トレーラー・開発者の公式発言' },
  preview: { name: '取材', desc: 'メディア先行取材（ハンズオフ）' },
  testimony: { name: '証言', desc: '招待クリエイターの証言（ハンズオフ）' },
  analysis: { name: '考察', desc: '未確定・推測・リーク' },
};

/** トークン内の1要素（例：「公式映像」「公式（Rob Nelson発言）」）の種別。 */
function kindOf(part: string): WikiLabel | null {
  if (part.startsWith('公式')) return 'official';
  if (part.startsWith('取材')) return 'preview';
  if (part.startsWith('証言')) return 'testimony';
  if (part.startsWith('考察') || part.startsWith('未確認')) return 'analysis';
  return null;
}

export interface LabelPart {
  kind: WikiLabel;
  /** バッジに出す文字（補足込み。例：「公式映像」）。 */
  text: string;
}

/**
 * 【】の中身をラベル列に分解する。「/」「＋」で併記を区切る。
 * 1つでもラベルとして読めない要素があれば null（＝ただの括弧書きとして本文に残す）。
 */
export function parseLabelToken(inner: string): LabelPart[] | null {
  const parts = inner.split(/[/／＋]/).map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return null;
  const out: LabelPart[] = [];
  for (const p of parts) {
    const kind = kindOf(p);
    if (!kind) return null;
    out.push({ kind, text: p });
  }
  return out;
}

/** 本文を「テキスト」と「ラベル」の並びに分解する。 */
export type TextChunk = { type: 'text'; text: string } | { type: 'label'; parts: LabelPart[] };

export function splitLabels(text: string): TextChunk[] {
  const chunks: TextChunk[] = [];
  const re = /【([^】]+)】/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const parts = parseLabelToken(m[1]);
    if (!parts) continue;
    if (m.index > last) chunks.push({ type: 'text', text: text.slice(last, m.index) });
    chunks.push({ type: 'label', parts });
    last = m.index + m[0].length;
  }
  if (last < text.length) chunks.push({ type: 'text', text: text.slice(last) });
  return chunks;
}
