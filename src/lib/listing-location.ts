import { REGIONS } from '@/types';

/** 짧은 지역명 → 사이트 표준 region (REGIONS 배열 값) */
const REGION_ALIASES: Record<string, string> = {
  서울: '서울',
  서울시: '서울',
  서울특별시: '서울',
  경기: '경기도',
  경기도: '경기도',
  인천: '인천',
  인천시: '인천',
  인천광역시: '인천',
  부산: '부산',
  부산시: '부산',
  부산광역시: '부산',
  대구: '대구',
  대구시: '대구',
  대구광역시: '대구',
  광주: '광주',
  광주시: '광주',
  광주광역시: '광주',
  대전: '대전',
  대전시: '대전',
  대전광역시: '대전',
  울산: '울산',
  울산시: '울산',
  울산광역시: '울산',
  세종: '세종',
  세종시: '세종',
  세종특별자치시: '세종',
  강원: '강원도',
  강원도: '강원도',
  충북: '충청북도',
  충청북도: '충청북도',
  충남: '충청남도',
  충청남도: '충청남도',
  전북: '전라북도',
  전라북도: '전라북도',
  전남: '전라남도',
  전라남도: '전라남도',
  경북: '경상북도',
  경상북도: '경상북도',
  경남: '경상남도',
  경상남도: '경상남도',
  제주: '제주도',
  제주도: '제주도',
};

const FALSE_REGION_PREFIXES: Record<string, string[]> = {
  강원: ['강원랜드'],
};

function isValidRegionTermMatch(text: string, index: number, term: string): boolean {
  for (const blocked of FALSE_REGION_PREFIXES[term] || []) {
    if (text.slice(index, index + blocked.length) === blocked) {
      return false;
    }
  }

  if (index > 0 && !/[\s([{·]/.test(text[index - 1]!)) {
    return false;
  }

  const nextChar = text[index + term.length];
  if (nextChar && !/[\s,./)|\-]/.test(nextChar)) {
    return false;
  }

  return true;
}

const REGION_MATCH_TERMS = [...new Set([...REGIONS, ...Object.keys(REGION_ALIASES)])].sort(
  (a, b) => b.length - a.length
);

export type ResolvedListingLocation = {
  region: string;
  district?: string;
  locality?: string;
  displayLocation: string;
  /** DB region과 제목 추출 region 불일치 */
  regionMismatch: boolean;
  /** district/location 비어 있어 제목에서 보정 */
  enrichedFromTitle: boolean;
};

export function normalizeListingRegion(value?: string | null): string | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  if (REGION_ALIASES[trimmed]) return REGION_ALIASES[trimmed];
  if (REGIONS.includes(trimmed)) return trimmed;
  return null;
}

export function extractLocationFromTitle(title?: string | null): {
  region?: string;
  district?: string;
  locality?: string;
} | null {
  if (!title?.trim()) return null;

  const text = title.replace(/\s+/g, ' ').trim();
  let matchedTerm: string | null = null;
  let matchIndex = -1;

  for (const term of REGION_MATCH_TERMS) {
    const idx = text.indexOf(term);
    if (idx !== -1 && isValidRegionTermMatch(text, idx, term)) {
      matchedTerm = term;
      matchIndex = idx;
      break;
    }
  }

  if (!matchedTerm || matchIndex === -1) return null;

  const region = REGION_ALIASES[matchedTerm] || normalizeListingRegion(matchedTerm) || matchedTerm;
  const afterRegion = text.slice(matchIndex + matchedTerm.length).trim();

  const districtMatch = afterRegion.match(/^([가-힣]{2,12}(?:시|군|구))(?![가-힣])/);
  const district = districtMatch?.[1];

  const remainder = district ? afterRegion.slice(district.length).trim() : afterRegion;
  const localityMatch = remainder.match(/([가-힣]{2,12}동)/);
  const locality = localityMatch?.[1];

  return { region, district, locality };
}

/**
 * SEO·화면 표시용 지역 (DB 오류 시 제목 기준 보정)
 */
export function resolveListingLocation(listing: Record<string, unknown>): ResolvedListingLocation {
  const dbRegion = String(listing.region || '').trim();
  const dbDistrict = (listing.district as string | undefined)?.trim();
  const dbLocation = (listing.location as string | undefined)?.trim();
  const dbAddress = (listing.address as string | undefined)?.trim();
  const title = String(listing.title || '');

  const fromTitle = extractLocationFromTitle(title);
  const normalizedDbRegion = normalizeListingRegion(dbRegion) || dbRegion;
  const titleRegion = fromTitle?.region;

  const regionMismatch =
    !!titleRegion &&
    !!normalizedDbRegion &&
    normalizeListingRegion(titleRegion) !== normalizeListingRegion(normalizedDbRegion);

  const useTitleRegion = regionMismatch && titleRegion;
  const region = useTitleRegion ? titleRegion! : normalizedDbRegion || titleRegion || dbRegion;

  let district = dbDistrict || undefined;
  let locality = dbLocation || undefined;
  let enrichedFromTitle = false;

  if (!district && fromTitle?.district) {
    district = fromTitle.district;
    enrichedFromTitle = true;
  }

  if (!locality && fromTitle?.locality) {
    locality = fromTitle.locality;
    enrichedFromTitle = true;
  }

  if (regionMismatch) {
    enrichedFromTitle = true;
  }

  const displayParts = [region, district, locality].filter(Boolean);
  if (displayParts.length === 0 && dbAddress) {
    displayParts.push(dbAddress);
  }

  return {
    region,
    district,
    locality,
    displayLocation: displayParts.join(' ') || region || '전국',
    regionMismatch,
    enrichedFromTitle,
  };
}

/** 관리자/스크립트용 — DB 업데이트 제안 */
export function suggestListingLocationFixes(listing: Record<string, unknown>): {
  shouldUpdate: boolean;
  updates: Partial<{ region: string; district: string; location: string }>;
  reason: string[];
} {
  const resolved = resolveListingLocation(listing);
  const updates: Partial<{ region: string; district: string; location: string }> = {};
  const reason: string[] = [];

  const dbRegion = normalizeListingRegion(String(listing.region || ''));
  const resolvedRegion = normalizeListingRegion(resolved.region);

  if (resolved.regionMismatch && resolvedRegion && resolvedRegion !== dbRegion) {
    updates.region = resolvedRegion;
    reason.push(`region: ${listing.region} → ${resolvedRegion} (제목 기준)`);
  }

  if (!listing.district && resolved.district) {
    updates.district = resolved.district;
    reason.push(`district: (비어있음) → ${resolved.district} (제목 추출)`);
  }

  if (!listing.location && resolved.locality) {
    updates.location = resolved.locality;
    reason.push(`location: (비어있음) → ${resolved.locality} (제목 추출)`);
  }

  return {
    shouldUpdate: Object.keys(updates).length > 0,
    updates,
    reason,
  };
}
