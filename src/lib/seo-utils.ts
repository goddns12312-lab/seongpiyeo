import { SITE_CONFIG } from './site';

/**
 * SEO 유틸리티 함수 모음
 * Alt 텍스트 생성, Slug 처리, URL 정규화 등
 */

/**
 * 이미지 Alt 텍스트 자동 생성
 * @param context 컨텍스트 (listing, post, product 등)
 * @param data 데이터 객체
 * @returns Alt 텍스트
 */
export function generateAltText(
  context: 'listing' | 'secondhand' | 'community' | 'guide',
  data: { title?: string; region?: string; category?: string }
): string {
  const { title = '', region = '', category = '' } = data;

  switch (context) {
    case 'listing':
      return `${region} PC방 매물: ${title}`;
    case 'secondhand':
      return `중고 물품: ${title}`;
    case 'community':
      return `${category} 게시글: ${title}`;
    case 'guide':
      return `가이드: ${title}`;
    default:
      return title;
  }
}

/**
 * URL-safe slug 생성
 * 한글은 그대로, 영어는 소문자, 특수문자 제거
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // 공백을 하이픈으로
    .replace(/[^\w\-가-힣]/g, '') // 특수문자 제거 (한글, 알파벳, 숫자, 하이픈만 허용)
    .replace(/\-+/g, '-') // 연속 하이픈 제거
    .replace(/^\-|\-$/g, ''); // 시작/끝 하이픈 제거
}

/**
 * 텍스트에서 특수문자 제거 (메타데이터용)
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[<>]/g, '') // HTML 태그 제거
    .replace(/\n{2,}/g, ' ') // 연속 줄바꿈을 공백으로
    .replace(/\s+/g, ' ') // 연속 공백을 단일 공백으로
    .trim();
}

/**
 * 텍스트 길이 제한 (한글 2자 = 1자 계산)
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';

  let length = 0;
  let truncated = '';

  for (const char of text) {
    const charLength = /[-￿]/.test(char) ? 2 : 1; // 한글/특수문자는 2자
    if (length + charLength > maxLength) break;
    truncated += char;
    length += charLength;
  }

  return truncated;
}

/**
 * 메타데이터용 설명 생성 (160자 이하)
 */
export function generateMetaDescription(text: string, maxLength: number = 160): string {
  const cleaned = sanitizeText(text);
  return truncateText(cleaned, maxLength);
}

/**
 * 페이지 제목 생성 (60자 이하, SEO 최적화)
 */
export function generatePageTitle(title: string, suffix?: string): string {
  const maxLength = 60;
  let fullTitle = suffix ? `${title} | ${suffix}` : title;

  if (fullTitle.length > maxLength) {
    fullTitle = truncateText(title, maxLength - (suffix ? suffix.length + 3 : 0));
    if (suffix) fullTitle += ` | ${suffix}`;
  }

  return fullTitle;
}

/**
 * 키워드 배열 생성 및 검증
 */
export function buildKeywordArray(keywords: string[]): string[] {
  return keywords
    .filter(k => k && k.trim().length > 0) // 빈 키워드 제거
    .map(k => k.trim())
    .slice(0, 10); // 최대 10개
}

/**
 * 구조화된 데이터용 날짜 포맷 (ISO 8601)
 */
export function formatDateForSchema(date: string | Date): string {
  const d = new Date(date);
  return d.toISOString();
}

/**
 * 가격 포맷팅 (메타데이터용)
 */
export function formatPriceForDescription(price?: number): string {
  if (!price) return '상담';
  return `${price.toLocaleString()}만원`;
}

/**
 * 지역명 정규화 (OG URL에서 사용)
 */
export function normalizeRegion(region: string): string {
  return encodeURIComponent(region);
}

/**
 * OG 이미지 크기 검증
 * 권장: 1200x630 (og:image), 1200x627 (twitter), 1080x1080 (square)
 */
export function validateOgImageDimensions(
  width: number,
  height: number,
  type: 'og' | 'twitter' | 'square' = 'og'
): { width: number; height: number; type: string } {
  const ratios = {
    og: { width: 1200, height: 630, ratio: 1200 / 630 },
    twitter: { width: 1200, height: 627, ratio: 1200 / 627 },
    square: { width: 1080, height: 1080, ratio: 1 },
  };

  const recommended = ratios[type];
  return {
    width: width || recommended.width,
    height: height || recommended.height,
    type: `image/${getImageTypeFromUrl('', type)}`,
  };
}

/**
 * 이미지 URL에서 타입 추출
 */
function getImageTypeFromUrl(url: string, fallback: string = 'png'): string {
  if (!url) return 'jpeg'; // 기본값

  const ext = url.split('.').pop()?.toLowerCase();
  const typeMap: Record<string, string> = {
    jpg: 'jpeg',
    png: 'png',
    webp: 'webp',
    gif: 'gif',
    svg: 'svg+xml',
  };

  return typeMap[ext || ''] || 'jpeg';
}

/**
 * 포함된 이미지를 로컬 경로로 변환 (CDN 제외)
 */
export function isExternalImage(url?: string): boolean {
  if (!url) return false;
  return (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('//cdn') ||
    url.includes('supabase.co') ||
    url.includes('imweb.me')
  );
}

/**
 * 페이지 유형별 기본 OG 이미지 반환
 */
export function getDefaultOgImage(pageType: 'listing' | 'secondhand' | 'community' | 'guide' = 'listing'): string {
  const images = {
    listing: `${SITE_CONFIG.url}/og-listings.png`,
    secondhand: `${SITE_CONFIG.url}/og-secondhand.png`,
    community: `${SITE_CONFIG.url}/og-community.png`,
    guide: `${SITE_CONFIG.url}/og-guide.png`,
  };

  return images[pageType];
}

/**
 * 검색 엔진 친화적인 URL 생성
 * 인코딩과 정규화 처리
 */
export function buildSearchFriendlyUrl(basePath: string, params?: Record<string, string>): string {
  let url = basePath.startsWith('/') ? basePath : `/${basePath}`;

  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, value);
    });
    const query = searchParams.toString();
    url += query ? `?${query}` : '';
  }

  return url;
}

/**
 * 카테고리명을 사람이 읽기 좋은 형태로 변환
 */
export function humanizeCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    free: '자유게시판',
    startup: '창업 질문',
    interior: '인테리어',
    equipment: '장비',
    listings: 'PC방 매물',
    secondhand: '중고장터',
    jobs: '구인구직',
    community: '커뮤니티',
  };

  return categoryMap[category] || category;
}

/**
 * SEO 친화적 제목 생성 (핵심 키워드 우선)
 */
export function buildSeoFriendlyTitle(
  primaryKeyword: string,
  secondaryKeyword?: string,
  suffix?: string
): string {
  const parts = [primaryKeyword];

  if (secondaryKeyword) {
    parts.push(secondaryKeyword);
  }

  if (suffix) {
    parts.push(suffix);
  }

  return parts.join(' | ').slice(0, 60);
}
