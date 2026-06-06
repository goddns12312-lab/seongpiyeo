/**
 * 지역 인접도 매핑
 * 검색 유입이 적은 지역에서 인접 지역 매물 링크를 제공하기 위한 데이터
 */

export const ADJACENT_REGIONS: Record<string, string[]> = {
  // 대전 (3건) → 충청도 지역
  대전: ['충청남도', '충청북도'],

  // 광주 (8건) → 전라도 지역
  광주: ['전라남도', '전라북도'],

  // 울산 (47건) → 경상도 지역 (충분한 매물이 있으나 추가 선택지 제공)
  울산: ['부산', '경상남도'],

  // 대구 (21건) → 경상도 지역
  대구: ['경상북도', '경상남도'],

  // 서울 (68건) → 경기/인천
  서울: ['경기도', '인천'],

  // 경기도 (214건) → 주변 지역
  경기도: ['서울', '인천'],

  // 인천 (82건) → 경기/서울
  인천: ['경기도', '서울'],

  // 부산 → 경상남도, 울산
  부산: ['경상남도', '울산'],

  // 강원도 (12건) → 서울, 경기
  강원도: ['서울', '경기도'],

  // 충청북도 (58건) → 충청남도, 대전
  충청북도: ['충청남도', '대전'],

  // 충청남도 (2건) → 대전, 충청북도
  충청남도: ['대전', '충청북도'],

  // 경상북도 (54건) → 대구, 경상남도
  경상북도: ['대구', '경상남도'],

  // 경상남도 (35건) → 부산, 울산, 대구
  경상남도: ['부산', '울산', '대구'],

  // 전라북도 (11건) → 광주, 전라남도
  전라북도: ['광주', '전라남도'],

  // 전라남도 (22건) → 광주, 전라북도
  전라남도: ['광주', '전라북도'],

  // 제주도 (1건) → 전국 주요 지역
  제주도: ['서울', '부산', '광주'],
};

/**
 * 지역의 매물 수가 5개 미만인지 확인
 * @param region 지역명
 * @param listingCount 해당 지역의 매물 수
 * @returns true if should show adjacent regions
 */
export function shouldShowAdjacentRegions(listingCount: number): boolean {
  return listingCount < 5;
}

/**
 * 지역의 인접 지역 목록 조회
 * @param region 지역명
 * @returns 인접 지역 배열
 */
export function getAdjacentRegions(region: string): string[] {
  return ADJACENT_REGIONS[region] || [];
}

/**
 * 지역의 인접 지역이 있는지 확인
 * @param region 지역명
 * @returns true if adjacent regions exist
 */
export function hasAdjacentRegions(region: string): boolean {
  return getAdjacentRegions(region).length > 0;
}
