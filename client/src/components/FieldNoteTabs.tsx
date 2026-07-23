import { useLang } from '@/lib/i18n';
import { FIELD_NOTE_CATEGORY_CONFIG, type FieldNoteCategory } from '@/data/fieldNotes';

// 体験記（開発日記／サーバー訪問記）のタブ帯。RecruitTabs と同じ見せ方に揃えている。
// 色は FIELD_NOTE_CATEGORY_CONFIG を参照するので、カードのバッジと必ず一致する。
const TABS: { id: FieldNoteCategory; href: string }[] = [
  { id: 'dev-diary', href: '/fivem-gtarp/field-notes/dev-diary' },
  { id: 'visit-note', href: '/fivem-gtarp/field-notes/visit-note' },
];

interface FieldNoteTabsProps {
  /** アクティブなタブ（'dev-diary' / 'visit-note'）。 */
  active: FieldNoteCategory;
}

export default function FieldNoteTabs({ active }: FieldNoteTabsProps) {
  const lang = useLang();
  const isEn = lang === 'en';
  // 体験記は日英の対があるため、英語表示では /en/ を前置する。
  const prefix = isEn ? '/en' : '';

  // 横スクロールはさせず、収まらない分は折り返す（RecruitTabs と同じ）。
  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-5">
      {TABS.map((t) => {
        const on = t.id === active;
        const cat = FIELD_NOTE_CATEGORY_CONFIG[t.id];
        const c = cat.color;
        return (
          <a
            key={t.id}
            href={`${prefix}${t.href}`}
            aria-current={on ? 'page' : undefined}
            className="flex-none inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-[12px] sm:text-[13px] font-extrabold whitespace-nowrap transition-colors"
            style={{
              border: `1px solid ${on ? c : 'rgba(255,255,255,.1)'}`,
              background: on ? `${c}1f` : 'rgba(255,255,255,.05)',
              color: on ? '#fff' : 'rgba(244,238,248,.65)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: c, boxShadow: `0 0 6px ${c}` }} />
            {isEn ? cat.en : cat.ja}
          </a>
        );
      })}
    </div>
  );
}
