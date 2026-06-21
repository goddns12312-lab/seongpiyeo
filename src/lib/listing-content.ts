const CRAWL_DESCRIPTION_MARKERS = [
  'PC천국에서 가져온',
  'pc천국에서 가져온',
  '에서 가져온 매물',
];

/** 크롤/중복 본문(description) 노출 여부 — 사용자 직접 등록만 표시 */
export function shouldShowListingUserDescription(listing: Record<string, unknown>): boolean {
  const text = String(listing.description || '').trim();
  if (!text) return false;

  if (listing.user_id) return true;

  if (listing.idx) return false;

  const lower = text.toLowerCase();
  if (CRAWL_DESCRIPTION_MARKERS.some((marker) => lower.includes(marker.toLowerCase()))) {
    return false;
  }

  return false;
}

/** sitemap/색인 품질 — 테스트·스팸 매물 감지 */
export function isLikelyTestListing(listing: Record<string, unknown>): boolean {
  const title = String(listing.title || '').trim();
  if (!title) return true;

  const compact = title.replace(/\s/g, '');
  const hasKorean = /[가-힣]/.test(title);

  if (compact.length >= 8 && /^(.)\1{5,}$/.test(compact)) return true;
  if (/^[\d\s]+$/.test(title) && title.replace(/\s/g, '').length >= 6) return true;
  if (/d{6,}/i.test(compact)) return true;
  if (title.length <= 2) return true;

  const monthly = Number(listing.monthly_rent) || 0;
  const premium = Number(listing.premium_price) || 0;
  const deposit = Number(listing.deposit) || 0;
  const absurdPrice = monthly > 50_000 || premium > 50_000 || deposit > 50_000;
  if (absurdPrice && !hasKorean) return true;
  if (absurdPrice && compact.length <= 8) return true;

  return false;
}
