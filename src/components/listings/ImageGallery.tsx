'use client';

import { useState } from 'react';
import { ListingImage } from '@/types';

interface ImageGalleryProps {
  images: ListingImage[];
  title: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!images || images.length === 0) {
    return (
      <div className="bg-bg-secondary border border-border-light rounded-lg overflow-hidden mb-4">
        <div className="w-full aspect-video sm:aspect-[4/3] lg:aspect-video bg-bg-tertiary flex items-center justify-center">
          <svg className="w-16 h-16 sm:w-20 sm:h-20 text-text-secondary opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-bg-secondary border border-border-light rounded-lg overflow-hidden mb-4">
        {/* Main Image - 더 크게 */}
        <div
          className="w-full aspect-[16/9] sm:aspect-[4/3] md:aspect-[16/10] lg:aspect-[16/9] bg-bg-tertiary flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity group overflow-hidden"
          onClick={() => setSelectedIndex(0)}
          role="button"
          tabIndex={0}
          aria-label="갤러리 보기"
        >
          <img
            src={images[0].url}
            alt={`${title} - 성인PC 매물 메인 이미지`}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            loading="eager"
          />
        </div>

        {/* Thumbnail Gallery */}
        {images.length > 1 && (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-1 sm:gap-2 p-3 sm:p-4">
            {images.slice(0, 8).map((image, index) => (
              <button
                key={image.id}
                onClick={() => setSelectedIndex(index)}
                className="w-full aspect-square rounded cursor-pointer hover:opacity-80 transition-opacity border-2 border-transparent hover:border-gold p-0 bg-none overflow-hidden"
                aria-label={`${title} 이미지 ${index + 1} 보기`}
              >
                <img
                  src={image.url}
                  alt={`${title} 이미지 ${index + 1}`}
                  className="w-full h-full object-cover rounded"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedIndex(null)}
        >
          <div className="relative w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Image */}
            <img
              src={images[selectedIndex].url}
              alt={`${title} ${selectedIndex + 1}`}
              className="w-full h-auto rounded-lg"
            />

            {/* Navigation */}
            <div className="absolute inset-0 flex items-center justify-between p-4">
              {selectedIndex > 0 && (
                <button
                  onClick={() => setSelectedIndex(selectedIndex - 1)}
                  className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              {selectedIndex < images.length - 1 && (
                <button
                  onClick={() => setSelectedIndex(selectedIndex + 1)}
                  className="ml-auto bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {selectedIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
