// ============================================================================
//  GTA6まとめWiki の画像（サムネイル＋クリックで拡大するライトボックス）。
//  サムネイルの <img> は SSR（プリレンダ）で出力し、ライトボックスはクリック後にクライアントで開く。
//  ライトボックスは document.body へポータルで描く（本文の <main> は z-10 の重なり文脈にあり、
//  そのまま中に描くと固定ヘッダーやスマホ下部タブの下に潜ってしまうため）。
//  document へのアクセスは useEffect とクリック後の描画に限る（SSR 安全）。
// ============================================================================
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn } from 'lucide-react';
import type { WikiImage } from '@/data/wiki/types';

const DEFAULT_CREDIT = 'Rockstar Games（プレス素材）';

/** サムネイル1枚＋クリックで拡大するライトボックス。variant で見た目を変える。 */
export function WikiThumb({ image, variant = 'inline' }: { image: WikiImage; variant?: 'inline' | 'gallery' }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const credit = image.credit ?? DEFAULT_CREDIT;
  return (
    <figure className={`wiki-fig wiki-fig--${variant}`}>
      <button type="button" className="wiki-fig__btn" onClick={() => setOpen(true)} aria-label={`${image.alt} を拡大`}>
        <img src={image.src} alt={image.alt} loading="lazy" decoding="async" />
        <span className="wiki-fig__zoom" aria-hidden="true">
          <ZoomIn size={14} />
        </span>
      </button>
      {image.caption && <figcaption className="wiki-fig__cap">{image.caption}</figcaption>}
      {open &&
        createPortal(
          // .gta-wiki の外に出るので、ライトボックスのスタイルは .gta-wiki-portal 配下にスコープしている。
          <div className="gta-wiki-portal">
            <div
              className="wiki-lightbox"
              role="dialog"
              aria-modal="true"
              aria-label={image.alt}
              onClick={() => setOpen(false)}
            >
              <button type="button" className="wiki-lightbox__close" aria-label="閉じる" onClick={() => setOpen(false)}>
                <X size={22} aria-hidden="true" />
              </button>
              <figure className="wiki-lightbox__inner" onClick={(e) => e.stopPropagation()}>
                <img src={image.src} alt={image.alt} />
                <figcaption className="wiki-lightbox__cap">
                  {image.caption && <span>{image.caption}</span>}
                  <span className="wiki-lightbox__credit">画像：{credit}</span>
                </figcaption>
              </figure>
            </div>
          </div>,
          document.body,
        )}
    </figure>
  );
}

/** 節のギャラリー（サムネイルを折り返し表示）。 */
export function WikiGallery({ images }: { images: WikiImage[] }) {
  return (
    <div className="wiki-gallery">
      {images.map((im, i) => (
        <WikiThumb key={i} image={im} variant="gallery" />
      ))}
    </div>
  );
}
