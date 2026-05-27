/**
 * BaseAdapter - 모든 웹 스크래퍼가 구현해야 하는 인터페이스
 *
 * 각 어댑터는 특정 사이트의 DOM 구조와 인증 방식에만 집중하고,
 * 공통 인프라(Playwright, 이미지 다운로드, Supabase 임포트 등)는
 * 통합 러너(run-scraper.js)가 처리한다.
 */

class BaseAdapter {
  /**
   * 정적 속성: 어댑터 식별자
   */
  static sourceName = 'base';  // 예: 'pcbangkingdom'
  static displayName = 'Base Adapter';  // 예: '피씨천국'

  /**
   * setup(browser) - 브라우저 인증 및 초기화
   *
   * @param {Browser} browser - Playwright Browser 인스턴스
   * @returns {Promise<Page>} 로그인된 상태의 Page 객체
   * @throws {Error} 인증 실패 또는 세션 없음
   *
   * 역할: 저장된 세션 로드, 쿠키 적용, 필요시 로그인 로직 수행
   */
  async setup(browser) {
    throw new Error('setup() not implemented');
  }

  /**
   * navigateToPage(page, pageNum) - 페이지 수동 네비게이션
   *
   * @param {Page} page - 현재 Page 객체
   * @param {number} pageNum - 페이지 번호 (1부터 시작)
   * @returns {Promise<void>}
   *
   * 역할: 사이트의 페이지네이션 패턴에 따라 URL 구성 및 이동
   * 예: boardUrl + '?p=' + pageNum (피씨천국 방식)
   */
  async navigateToPage(page, pageNum) {
    throw new Error('navigateToPage() not implemented');
  }

  /**
   * getPostLinks(page, pageNum) - 목록 페이지에서 게시글 링크 추출
   *
   * @param {Page} page - 로드된 목록 페이지
   * @param {number} pageNum - 현재 페이지 번호
   * @returns {Promise<Array>} [{ idx, title, href }, ...]
   *   - idx: 사이트 고유 ID (예: '171322689')
   *   - title: 게시글 제목
   *   - href: 상세페이지로 이동하는 상대/절대 경로
   *
   * 역할: 페이지 DOM에서 사이트 특정 선택자를 이용해 링크 추출
   * 페이지에 게시글이 없으면 빈 배열 반환 (페이지네이션 종료 신호)
   */
  async getPostLinks(page, pageNum) {
    throw new Error('getPostLinks() not implemented');
  }

  /**
   * buildDetailUrl(postInfo) - 게시글 상세페이지 URL 생성
   *
   * @param {object} postInfo - { idx, title, href }
   * @returns {string} 완전한 상세페이지 URL
   *
   * 역할: href를 필요시 정리하고 baseUrl과 조합하여 절대 URL 생성
   */
  buildDetailUrl(postInfo) {
    throw new Error('buildDetailUrl() not implemented');
  }

  /**
   * extractDetails(page) - 상세페이지에서 구조화된 데이터 추출
   *
   * @param {Page} page - 상세페이지가 로드된 Page 객체
   * @returns {Promise<Object>} 추출된 데이터
   * {
   *   location: string,           // 예: '화곡동'
   *   size: string,               // 예: '18'
   *   floor: string,              // 예: '1'
   *   deposit: number|null,       // 보증금 (만원 단위)
   *   premium_price: number|null, // 권리금 (만원 단위)
   *   monthly_rent: number|null,  // 월세 (만원 단위)
   *   facilities: string,         // 예: 'PC7대,에어컨1대'
   *   description: string,        // 전체 설명 텍스트
   *   contact: string|null,       // 연락처 (예: '010-1234-5678')
   *   imageUrls: string[],        // CDN 이미지 URL 배열 (로컬 경로 아님!)
   *   move_in_date: string,       // 입주가능일
   *   business_license: string,   // 허가여부
   *   administrative_record: string // 행정처분여부
   * }
   *
   * 역할: 페이지의 DOM/텍스트를 파싱하여 구조화된 필드 추출
   * imageUrls는 다운로드할 CDN URL이어야 함 (runner가 다운로드 후 로컬 경로로 변환)
   */
  async extractDetails(page) {
    throw new Error('extractDetails() not implemented');
  }

  /**
   * shouldSkip(postInfo, existingIds) - 게시글 스킵 여부 결정
   *
   * @param {object} postInfo - { idx, title, href }
   * @param {Set<string>} existingIds - 이미 수집된 idx 세트
   * @returns {boolean} true면 스킵, false면 수집
   *
   * 역할: 기본적으로 중복 확인, 필요시 재수집 로직 추가
   */
  shouldSkip(postInfo, existingIds) {
    return existingIds.has(postInfo.idx);
  }
}

module.exports = BaseAdapter;
