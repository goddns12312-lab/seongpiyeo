/**
 * SEO Title Auto-Fix Logic
 * 모든 콘텐츠 타입(커뮤니티, 매물, 공고, 중고)에서
 * 사용자가 입력한 제목이 너무 짧으면 메타정보를 포함하여 자동 확장
 */

export interface AutoFixResult {
  original: string;
  fixed: string;
  isApplied: boolean;
  reason?: string;
}

export interface ContentMetadata {
  type: 'post' | 'listing' | 'job' | 'secondhand';
  title: string;
  category?: string;
  region?: string;
  employmentType?: string;
  priceType?: string;
  [key: string]: any;
}

/**
 * 제목이 5자 이하면 SEO 최적화 제목으로 자동 확장
 * @param title 사용자 입력 제목
 * @param category 게시글 카테고리 (free, startup, interior, equipment, etc)
 * @param businessName 비즈니스 이름
 * @returns 자동 보정 결과
 */
export function autoFixPostTitle(
  title: string,
  category: string = 'free',
  businessName: string = '성피요'
): AutoFixResult {
  const trimmedTitle = title.trim();
  const titleLength = trimmedTitle.length;

  // 정상적인 길이이면 그대로 반환
  if (titleLength > 5) {
    return {
      original: trimmedTitle,
      fixed: trimmedTitle,
      isApplied: false,
    };
  }

  // 너무 짧으면 자동 보정
  const categoryLabel = getCategoryLabelForTitle(category);
  const fixed = `${trimmedTitle} | PC방 ${categoryLabel} | ${businessName}`;

  return {
    original: trimmedTitle,
    fixed: fixed.slice(0, 80), // 메타 제목 길이 제한 (약 70-80자)
    isApplied: true,
    reason: `제목이 ${titleLength}자로 너무 짧아 카테고리 정보 추가`,
  };
}

/**
 * Description이 50자 이하이면 자동 확장
 * @param title 제목
 * @param description 사용자 입력 설명
 * @param category 카테고리
 * @returns 자동 보정된 설명
 */
export function autoFixPostDescription(
  title: string,
  description: string,
  category: string = 'free'
): AutoFixResult {
  const trimmedDesc = description.trim();
  const descLength = trimmedDesc.length;

  // 충분한 길이면 그대로 반환
  if (descLength > 50) {
    return {
      original: trimmedDesc,
      fixed: trimmedDesc.slice(0, 160),
      isApplied: false,
    };
  }

  // 너무 짧으면 자동 보정
  const categoryLabel = getCategoryLabelForTitle(category);
  const fixed = `${trimmedDesc} | PC방 ${categoryLabel} 커뮤니티에서 공유되는 글입니다.`;

  return {
    original: trimmedDesc,
    fixed: fixed.slice(0, 160),
    isApplied: true,
    reason: `설명이 ${descLength}자로 너무 짧아 카테고리 정보 추가`,
  };
}

/**
 * 카테고리 코드를 한글 레이블로 변환
 */
function getCategoryLabelForTitle(category: string): string {
  const labels: Record<string, string> = {
    free: '자유게시판',
    startup: '창업',
    interior: '인테리어',
    equipment: '장비',
    exchange: '환전정보',
  };

  return labels[category] || '커뮤니티';
}

/**
 * 전체 메타데이터를 자동 보정 (제목 + 설명)
 */
export function autoFixPostMetadata(
  title: string,
  description: string,
  category: string = 'free',
  businessName: string = '성피요'
) {
  const titleResult = autoFixPostTitle(title, category, businessName);
  const descResult = autoFixPostDescription(title, description, category);

  return {
    title: titleResult.fixed,
    description: descResult.fixed,
    titleFixed: titleResult.isApplied,
    descriptionFixed: descResult.isApplied,
    changes: [
      titleResult.isApplied ? titleResult.reason : null,
      descResult.isApplied ? descResult.reason : null,
    ].filter(Boolean),
  };
}

/**
 * ============================================================
 * LISTINGS (매물) - 제목 자동 보정
 * ============================================================
 */

export function autoFixListingTitle(
  title: string,
  region: string,
  priceType: 'rent' | 'sale' = 'rent',
  businessName: string = '성피요'
): AutoFixResult {
  const trimmedTitle = title.trim();
  const titleLength = trimmedTitle.length;

  if (titleLength > 5) {
    return {
      original: trimmedTitle,
      fixed: trimmedTitle,
      isApplied: false,
    };
  }

  const priceTypeLabel = priceType === 'rent' ? '임대' : '매매';
  const fixed = `${region} 성인PC ${priceTypeLabel} - ${trimmedTitle} | ${businessName}`;

  return {
    original: trimmedTitle,
    fixed: fixed.slice(0, 80),
    isApplied: true,
    reason: `제목이 ${titleLength}자로 너무 짧아 지역/가격타입 정보 추가`,
  };
}

/**
 * ============================================================
 * JOBS (공고) - 제목 자동 보정
 * ============================================================
 */

export function autoFixJobTitle(
  title: string,
  region: string,
  employmentType?: string,
  businessName: string = '성피요'
): AutoFixResult {
  const trimmedTitle = title.trim();
  const titleLength = trimmedTitle.length;

  if (titleLength > 5) {
    return {
      original: trimmedTitle,
      fixed: trimmedTitle,
      isApplied: false,
    };
  }

  const typeLabel = employmentType ? `[${getEmploymentTypeLabel(employmentType)}]` : '';
  const fixed = `${region} ${typeLabel} 성인PC 구인 - ${trimmedTitle} | ${businessName}`.replace(
    /\[\]/,
    ''
  ); // 빈 괄호 제거

  return {
    original: trimmedTitle,
    fixed: fixed.slice(0, 80),
    isApplied: true,
    reason: `제목이 ${titleLength}자로 너무 짧아 지역/직무 정보 추가`,
  };
}

/**
 * ============================================================
 * SECONDHAND (중고) - 제목 자동 보정
 * ============================================================
 */

export function autoFixSecondhandTitle(
  title: string,
  region: string,
  itemCategory?: string,
  businessName: string = '성피요'
): AutoFixResult {
  const trimmedTitle = title.trim();
  const titleLength = trimmedTitle.length;

  if (titleLength > 5) {
    return {
      original: trimmedTitle,
      fixed: trimmedTitle,
      isApplied: false,
    };
  }

  const categoryLabel = itemCategory ? `중고 ${itemCategory}` : '중고물품';
  const fixed = `${region} ${categoryLabel} - ${trimmedTitle} | ${businessName}`;

  return {
    original: trimmedTitle,
    fixed: fixed.slice(0, 80),
    isApplied: true,
    reason: `제목이 ${titleLength}자로 너무 짧아 지역/카테고리 정보 추가`,
  };
}

/**
 * ============================================================
 * 공용 함수: 타입별 자동 보정 통합 처리
 * ============================================================
 */

export function autoFixTitleByType(
  metadata: ContentMetadata,
  businessName: string = '성피요'
): AutoFixResult {
  const { type, title, region, category, employmentType, priceType, itemCategory } = metadata;

  switch (type) {
    case 'post':
      return autoFixPostTitle(title, category, businessName);

    case 'listing':
      return autoFixListingTitle(
        title,
        region || '전국',
        (priceType === 'monthly' ? 'rent' : 'sale') as 'rent' | 'sale',
        businessName
      );

    case 'job':
      return autoFixJobTitle(title, region || '전국', employmentType, businessName);

    case 'secondhand':
      return autoFixSecondhandTitle(title, region || '전국', itemCategory, businessName);

    default:
      return {
        original: title,
        fixed: title,
        isApplied: false,
        reason: `Unknown type: ${type}`,
      };
  }
}

/**
 * ============================================================
 * Supabase 저장 전 일괄 처리
 * ============================================================
 */

/**
 * 실제 Supabase insert/update 전에 호출할 함수
 * 게시글 객체를 받아서 title과 description을 자동 보정
 */
export function sanitizePostBeforeSave(
  post: {
    title: string;
    content?: string;
    category?: string;
  },
  businessName: string = '성피요'
) {
  const category = post.category || 'free';
  const description = (post.content || '').slice(0, 160);

  const fixed = autoFixPostMetadata(
    post.title,
    description,
    category,
    businessName
  );

  return {
    ...post,
    title: fixed.title,
    _seoApplied: fixed.titleFixed || fixed.descriptionFixed,
    _seoChanges: fixed.changes,
  };
}

/**
 * Listings 저장 전 보정
 */
export function sanitizeListingBeforeSave(
  listing: {
    title: string;
    region?: string;
    monthly_rent?: number;
    [key: string]: any;
  },
  businessName: string = '성피요'
) {
  const priceType = listing.monthly_rent ? 'rent' : 'sale';
  const fixed = autoFixListingTitle(
    listing.title,
    listing.region || '전국',
    priceType,
    businessName
  );

  return {
    ...listing,
    title: fixed.fixed,
    _seoApplied: fixed.isApplied,
    _seoReason: fixed.reason,
  };
}

/**
 * Jobs 저장 전 보정
 */
export function sanitizeJobBeforeSave(
  job: {
    title: string;
    region?: string;
    employment_type?: string;
    [key: string]: any;
  },
  businessName: string = '성피요'
) {
  const fixed = autoFixJobTitle(
    job.title,
    job.region || '전국',
    job.employment_type,
    businessName
  );

  return {
    ...job,
    title: fixed.fixed,
    _seoApplied: fixed.isApplied,
    _seoReason: fixed.reason,
  };
}

/**
 * Secondhand 저장 전 보정
 */
export function sanitizeSecondhandBeforeSave(
  item: {
    title: string;
    region?: string;
    [key: string]: any;
  },
  businessName: string = '성피요'
) {
  const fixed = autoFixSecondhandTitle(item.title, item.region || '전국', undefined, businessName);

  return {
    ...item,
    title: fixed.fixed,
    _seoApplied: fixed.isApplied,
    _seoReason: fixed.reason,
  };
}

/**
 * Helper: 고용 형태 레이블
 */
function getEmploymentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    part_time: '파트타임',
    full_time: '정규직',
    contract: '계약직',
    internship: '인턴',
    freelance: '프리랜서',
  };
  return labels[type] || type;
}
