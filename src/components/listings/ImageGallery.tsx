'use client';

import { useState, useCallback } from 'react';
import { ListingImage } from '@/types';
import { buildListingImageAlt } from '@/lib/seo-metadata';
import { getOptimizedImageUrl } from '@/lib/image-url';

type GalleryImage = Pick<ListingImage, 'id' | 'url' | 'order_num'> & Partial<ListingImage>;

interface ImageGalleryProps {
  images: GalleryImage[];
  title: string;
  listing?: any;
}

export function ImageGallery({ images, title, listing }: ImageGalleryProps) {
  const getImageAlt = (index?: number) => {
    if (!listing) {
      return index !== undefined ? `${title} 이미지 ${index + 1}` : `${title} - 성인PC 매물 메인 이미지`;
    }
    const baseAlt = buildListingImageAlt(listing);
    return index !== undefined ? `${baseAlt} (${index + 1})` : baseAlt;
  };

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const optimizedUrl = (url: string, width: number) => getOptimizedImageUrl(url, width, 80);

  const openGallery = useCallback((index: number) => setSelectedIndex(index), []);
  const closeGallery = useCallback(() => setSelectedIndex(null), []);

  if (!images || images.length === 0) {
    return (
      <div className="bg-bg-secondary border border-border-light rounded-lg overflow-hidden mb-4">
        <div className="w-full aspect-video sm:aspect-[4/3] lg:aspect-video bg-bg-tertiary flex items-center justify-center">
          <svg className="w-16 h-16 sm:w-20 sm:h-20 text-text-secondary opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-bg-secondary border border-border-light rounded-lg overflow-hidden mb-4">
        <button
          type="button"
          className="w-full aspect-[16/9] sm:aspect-[4/3] md:aspect-[16/10] lg:aspect-[16/9] bg-bg-tertiary flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity group overflow-hidden p-0 border-0"
          onClick={() => openGallery(0)}
          aria-label={`${title} 이미지 갤러리 열기`}
        >
          <img
            src={optimizedUrl(images[0].url, 960)}
            alt={getImageAlt()}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            loading="eager"
          />
        </button>

        {images.length > 1 && (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-1 sm:gap-2 p-3 sm:p-4">
            {images.slice(0, 8).map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => openGallery(index)}
                className="w-full aspect-square rounded cursor-pointer hover:opacity-80 transition-opacity border-2 border-transparent hover:border-gold p-0 bg-none overflow-hidden"
                aria-label={`${title} 이미지 ${index + 1} 보기`}
              >
                <img
                  src={optimizedUrl(image.url, 160)}
                  alt={getImageAlt(index)}
                  className="w-full h-full object-cover rounded"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} 이미지 갤러리`}
          onClick={closeGallery}
          onKeyDown={(e) => {
            if (e.key === 'Escape') closeGallery();
          }}
        >
          <div className="relative w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <img
              src={optimizedUrl(images[selectedIndex].url, 1200)}
              alt={getImageAlt(selectedIndex)}
              className="w-full h-auto rounded-lg"
            />

            <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none">
              {selectedIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedIndex(selectedIndex - 1)}
                  className="pointer-events-auto bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                  aria-label="이전 이미지"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              {selectedIndex < images.length - 1 && (
                <button
                  type="button"
                  onClick={() => setSelectedIndex(selectedIndex + 1)}
                  className="pointer-events-auto ml-auto bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                  aria-label="다음 이미지"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={closeGallery}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
              aria-label="갤러리 닫기"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm" aria-live="polite">
              {selectedIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
