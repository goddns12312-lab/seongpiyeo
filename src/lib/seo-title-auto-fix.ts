/**
 * SEO Title Auto-Fix Logic
 * 사용자가 입력한 제목이 너무 짧으면 카테고리 정보를 포함하여 자동 확장
 */

export interface AutoFixResult {
  original: string;
  fixed: string;
  isApplied: boolean;
  reason?: string;
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
