/**
 * URL 정규화 및 생성 유틸리티
 * 한글 도메인(성피요.com)을 punycode(xn--oj4bo2hu1o.com)로 통일하는 중앙집중식 관리
 */

/**
 * 한글 도메인을 punycode로 변환
 * @param domain 입력 도메인
 * @returns punycode 도메인
 */
export function convertKoreanDomainToPunycode(domain: string): string {
  // localhost나 IP는 그대로 반환
  if (domain.includes('localhost') || domain.includes('127.0.0.1')) {
    return domain;
  }

  // 이미 punycode (xn--로 시작)이면 그대로 반환
  if (domain.includes('xn--')) {
    return domain;
  }

  // 한글 도메인을 punycode로 변환
  try {
    // TextEncoder를 사용한 punycode 변환
    // 한글 "성피요" → "xn--oj4bo2hu1o"
    if (domain.includes('성피요')) {
      return domain.replace('성피요', 'xn--oj4bo2hu1o');
    }
    return domain;
  } catch {
    return domain;
  }
}

/**
 * 정규화된 사이트 URL 반환
 * @param includeProtocol 프로토콜 포함 여부 (기본값: true)
 * @returns 정규화된 URL
 */
export function getNormalizedSiteUrl(includeProtocol = true): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://xn--oj4bo2hu1o.com';

  // localhost는 그대로 반환
  if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
    return baseUrl;
  }

  // 프로토콜이 없으면 https 추가
  if (!baseUrl.startsWith('http')) {
    return includeProtocol ? `https://${convertKoreanDomainToPunycode(baseUrl)}` : convertKoreanDomainToPunycode(baseUrl);
  }

  // 프로토콜이 있으면 도메인만 정규화
  const url = new URL(baseUrl);
  url.hostname = convertKoreanDomainToPunycode(url.hostname);

  return includeProtocol ? url.toString().replace(/\/$/, '') : url.hostname;
}

/**
 * 경로 기반 canonical URL 생성 (인코딩 불필요)
 * @param path URL 경로 (예: '/listings', '/community')
 * @returns 완전한 canonical URL
 */
export function createCanonicalUrl(path: string): string {
  const baseUrl = getNormalizedSiteUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

/**
 * 동적 세그먼트 포함 canonical URL (자동 인코딩)
 * @param basePath 기본 경로 (예: '/listings/region')
 * @param segment 동적 세그먼트 (예: '부산광역시')
 * @param additionalParams 추가 쿼리 파라미터
 * @returns 완전한 canonical URL (인코딩됨)
 */
export function createCanonicalUrlWithSegment(
  basePath: string,
  segment: string,
  additionalParams?: Record<string, string>
): string {
  const baseUrl = getNormalizedSiteUrl();
  const encodedSegment = encodeURIComponent(segment);
  const normalizedPath = basePath.startsWith('/') ? basePath : `/${basePath}`;

  let url = `${baseUrl}${normalizedPath}/${encodedSegment}`;

  // 쿼리 파라미터 추가
  if (additionalParams && Object.keys(additionalParams).length > 0) {
    const searchParams = new URLSearchParams(additionalParams);
    url = `${url}?${searchParams.toString()}`;
  }

  return url;
}

/**
 * 지역 이름을 URL에 맞게 인코딩
 * @param region 지역명 (예: '부산광역시')
 * @returns 인코딩된 지역명
 */
export function encodeRegionForUrl(region: string): string {
  return encodeURIComponent(region);
}

/**
 * 인코딩된 지역명을 원본으로 디코딩
 * @param encoded 인코딩된 지역명
 * @returns 원본 지역명
 */
export function decodeRegionFromUrl(encoded: string): string {
  return decodeURIComponent(encoded);
}

/**
 * SEO용 URL 정규화
 * 중복된 slashes, trailing slashes 제거
 * @param url URL 문자열
 * @returns 정규화된 URL
 */
export function normalizeUrlForSeo(url: string): string {
  try {
    const urlObj = new URL(url);

    // 도메인 정규화
    urlObj.hostname = convertKoreanDomainToPunycode(urlObj.hostname);

    // trailing slash 제거 (root 제외)
    let pathname = urlObj.pathname;
    if (pathname !== '/' && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    // 연속된 slashes 제거
    pathname = pathname.replace(/\/+/g, '/');
    urlObj.pathname = pathname;

    // 쿼리 파라미터 정렬 (일관성)
    if (urlObj.search) {
      const params = new URLSearchParams(urlObj.search);
      const sortedParams = new URLSearchParams([...params.entries()].sort());
      urlObj.search = sortedParams.toString();
    }

    return urlObj.toString().replace(/\/$/, '') === urlObj.origin ? urlObj.origin : urlObj.toString().replace(/\/$/, '');
  } catch {
    return url;
  }
}

/**
 * metadataBase용 URL 객체 생성
 * @returns Next.js metadataBase에 사용할 URL 객체
 */
export function getMetadataBaseUrl(): URL {
  const baseUrl = getNormalizedSiteUrl();
  return new URL(baseUrl);
}
