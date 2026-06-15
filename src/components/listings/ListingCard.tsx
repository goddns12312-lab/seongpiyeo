'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, memo } from 'react';
import { formatPrice, formatDate } from '@/lib/utils';
import { Listing, ListingImage } from '@/types';

interface ListingCardProps {
  listing: Listing;
  images?: ListingImage[];
}

function ListingCardComponent({ listing, images = [] }: ListingCardProps) {
  const [imageIndex, setImageIndex] = useState(0);

  // 이미지 배열 정렬 (order_num 기준)
  const sortedImages = images.length > 0 ? [...images].sort((a, b) => a.order_num - b.order_num) : [];
  const currentImage = sortedImages[imageIndex]?.url || listing.main_image_url || listing.thumbnail_url;

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    setImageIndex((prev) => (prev === 0 ? sortedImages.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    setImageIndex((prev) => (prev === sortedImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <Link href={`/listings/${listing.id}`}>
      <div className="bg-gradient-to-br from-bg-card to-bg-light border border-border-light rounded-2xl overflow-hidden hover:shadow-hover hover:border-gold/40 transition-all duration-300 group cursor-pointer h-full flex flex-col hover-lift">
        {/* Image with Overlay */}
        <div className="relative w-full aspect-[16/9] sm:aspect-[4/3] md:aspect-[16/9] bg-gradient-to-br from-bg-tertiary via-bg-secondary to-bg-light flex items-center justify-center overflow-hidden">
          {/* 현재 이미지 표시 */}
          {currentImage ? (
            <Image
              src={currentImage}
              alt={`${listing.title} - ${listing.region} PC방 매물`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              priority={false}
              unoptimized
            />
          ) : (
            <Image
              src="/default-listing.png"
              alt={`${listing.title} - ${listing.region} 성인PC 매물 이미지`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 opacity-40 pointer-events-none" />

          {/* 이미지 네비게이션 버튼 (이미지가 2개 이상일 때만 표시) */}
          {sortedImages.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white px-2 py-1 rounded text-xs font-bold transition-colors"
                aria-label="이전 이미지"
              >
                ‹
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white px-2 py-1 rounded text-xs font-bold transition-colors"
                aria-label="다음 이미지"
              >
                ›
              </button>

              {/* 이미지 인덱스 표시 */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {imageIndex + 1} / {sortedImages.length}
              </div>
            </>
          )}

          {/* Type Badge */}
          <div className="absolute top-2 right-2 bg-gradient-to-r from-gold-dark to-gold px-2 py-0.5 rounded-lg shadow-elevated">
            <span className="text-bg-primary text-xs font-semibold">
              {listing.price_type === 'sale' ? '매매' : '임차'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-3.5 flex-1 flex flex-col">
          {/* Region */}
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-block px-2.5 py-0.5 bg-bg-tertiary border border-border-light rounded-lg text-xs font-semibold text-gold-muted">
              {listing.region}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-sm text-text-primary mb-2 line-clamp-2 leading-snug">
            {listing.title || `PC방 매물 #${listing.id?.slice(0, 8)}`}
          </h3>

          {/* Price - Monthly Rent First (PC방은 무조건 월세) */}
          <div className="mb-2 pb-2 border-b border-border-light/50">
            {/* 메인 가격: 월세 */}
            <p className="text-text-muted text-xs font-medium mb-0.5 uppercase tracking-widest opacity-75">월세</p>
            <p className="text-gold font-bold text-lg lg:text-xl mb-2">
              {listing.monthly_rent ? formatPrice(listing.monthly_rent) : '정보없음'}
            </p>

            {/* 보조 정보: 보증금 / 권리금 */}
            {(listing.deposit || (listing as any).premium_price) && (
              <div className="flex gap-2 text-xs flex-wrap">
                {listing.deposit && (
                  <span className="text-text-secondary">보증금: <span className="text-text-primary font-semibold">{formatPrice(listing.deposit)}</span></span>
                )}
                {(listing as any).premium_price && (
                  <span className="text-text-secondary">권리금: <span className="text-text-primary font-semibold">{formatPrice((listing as any).premium_price)}</span></span>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          {(listing as any).description && (
            <div className="mb-3 p-2 bg-bg-tertiary rounded border border-border-light/30">
              <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                {(listing as any).description}
              </p>
            </div>
          )}

          {/* Main Info Box */}
          <div className="bg-gold/10 border border-gold/30 rounded-lg p-2.5 mb-3 text-xs space-y-1">
            {/* 평수 & PC 대수 */}
            {(listing.area_sqm || listing.pc_count) && (
              <p className="text-text-primary font-semibold">
                {[
                  listing.area_sqm && `${listing.area_sqm}평`,
                  listing.pc_count && `PC ${listing.pc_count}대`
                ].filter(Boolean).join(' • ')}
              </p>
            )}

            {/* 층수 & 입주가능일 */}
            {((listing as any).floor || (listing as any).available_date) && (
              <p className="text-text-secondary">
                {[
                  (listing as any).floor && `${(listing as any).floor}`,
                  (listing as any).available_date && ((listing as any).available_date === 'immediate' ? '즉시입주' : (listing as any).available_date)
                ].filter(Boolean).join(' • ')}
              </p>
            )}
          </div>


          {/* Footer Meta */}
          <div className="space-y-2 border-t border-border-light/50 pt-2 mt-auto">
            {/* Stats Row */}
            <div className="flex items-center justify-between gap-2 text-xs text-text-muted font-light">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1" aria-label="조회수">
                  👁️ {listing.view_count}
                </span>
                <span className="flex items-center gap-1" aria-label="댓글 수">
                  💬 {(listing as any).commentCount || 0}
                </span>
                <span className="flex items-center gap-1" aria-label="좋아요 수">
                  ❤️ {(listing as any).favoriteCount || 0}
                </span>
              </div>
              <span>{formatDate(listing.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export const ListingCard = memo(ListingCardComponent);
