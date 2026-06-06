// Community post categories with metadata
export const COMMUNITY_CATEGORIES = {
  free: {
    label: '자유',
    color: 'text-blue-500',
    description: 'PC방 운영자들이 자유롭게 정보를 공유하는 공간입니다.',
    keywords: ['자유게시판', '정보공유', 'PC방 운영', '성인PC'],
  },
  startup: {
    label: '창업 & 사업',
    color: 'text-green-500',
    description: 'PC방 창업 준비, 사업 경험을 공유하는 공간입니다.',
    keywords: ['PC방 창업', '사업정보', '창업팁', '경험공유'],
  },
  interior: {
    label: '인테리어 & 시설',
    color: 'text-purple-500',
    description: 'PC방 인테리어, 시설 개선 정보를 공유하는 공간입니다.',
    keywords: ['인테리어', '시설개선', 'PC방 리모델링', '디자인'],
  },
  equipment: {
    label: '장비 & 기자재',
    color: 'text-orange-500',
    description: 'PC방 장비, 기자재 선택과 관리 정보를 공유하는 공간입니다.',
    keywords: ['장비정보', '기자재', 'PC 사양', '기계실 관리'],
  },
} as const;

export type CommunityCategory = keyof typeof COMMUNITY_CATEGORIES;

export function getCategoryInfo(category: string) {
  return COMMUNITY_CATEGORIES[category as CommunityCategory];
}

export function buildCategoryTitle(category: string): string {
  const info = getCategoryInfo(category);
  if (!info) return '커뮤니티';

  const categoryLabel = info.label;
  return `${categoryLabel} | PC방 커뮤니티 | 성피요`;
}

export function buildCategoryDescription(category: string): string {
  const info = getCategoryInfo(category);
  if (!info) return '성인PC 커뮤니티';
  return info.description;
}

export function buildCategoryKeywords(category: string): string {
  const info = getCategoryInfo(category);
  if (!info) return '성인PC, 커뮤니티';

  const baseKeywords = ['성인PC', '성인피씨', '커뮤니티'];
  const allKeywords = [...baseKeywords, ...info.keywords];
  return allKeywords.join(', ');
}
