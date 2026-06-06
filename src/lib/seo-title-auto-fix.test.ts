/**
 * SEO Title Auto-Fix Tests
 * 실행: node -r esbuild-register src/lib/seo-title-auto-fix.test.ts
 */

import {
  autoFixPostTitle,
  autoFixPostDescription,
  autoFixPostMetadata,
  sanitizePostBeforeSave,
} from './seo-title-auto-fix';

console.log('=== SEO Title Auto-Fix Tests ===\n');

// Test 1: 짧은 제목 자동 확장
console.log('Test 1: 짧은 제목 자동 확장');
const test1 = autoFixPostTitle('급매', 'free');
console.log(`입력: "${test1.original}"`);
console.log(`출력: "${test1.fixed}"`);
console.log(`적용됨: ${test1.isApplied}`);
console.log(`이유: ${test1.reason}\n`);

// Test 2: 정상 길이 제목은 그대로
console.log('Test 2: 정상 길이 제목');
const test2 = autoFixPostTitle('PC방 창업하면서 겪은 경험 공유', 'startup');
console.log(`입력: "${test2.original}"`);
console.log(`출력: "${test2.fixed}"`);
console.log(`적용됨: ${test2.isApplied}\n`);

// Test 3: 각 카테고리별 자동 확장
console.log('Test 3: 카테고리별 자동 확장');
const categories = ['free', 'startup', 'interior', 'equipment'];
categories.forEach((cat) => {
  const result = autoFixPostTitle('팁', cat);
  console.log(`카테고리 "${cat}": "${result.fixed}"`);
});
console.log();

// Test 4: 설명 자동 보정
console.log('Test 4: 설명 자동 보정');
const test4 = autoFixPostDescription('제목', '너무 짧은 설명입니다', 'free');
console.log(`입력: "${test4.original}"`);
console.log(`출력: "${test4.fixed}"`);
console.log(`적용됨: ${test4.isApplied}\n`);

// Test 5: 전체 메타데이터 보정
console.log('Test 5: 전체 메타데이터 보정');
const test5 = autoFixPostMetadata('구함', '도와주세요', 'startup', '성피요');
console.log(`제목 적용: ${test5.titleFixed}`);
console.log(`설명 적용: ${test5.descriptionFixed}`);
console.log(`변경사항: ${test5.changes.join(', ')}`);
console.log(`최종 제목: "${test5.title}"\n`);

// Test 6: Supabase 저장 전 정규화
console.log('Test 6: Supabase 저장 전 정규화');
const test6 = sanitizePostBeforeSave(
  {
    title: '급',
    content: '내용입니다',
    category: 'free',
  },
  '성피요'
);
console.log(`저장할 제목: "${test6.title}"`);
console.log(`SEO 적용됨: ${test6._seoApplied}`);
console.log(`변경사항: ${test6._seoChanges.join(', ')}\n`);

// Test 7: 경계선 테스트 (정확히 5자)
console.log('Test 7: 경계선 테스트');
const test7a = autoFixPostTitle('12345', 'free');
console.log(`5자 입력 "12345": 적용됨=${test7a.isApplied}`);

const test7b = autoFixPostTitle('123456', 'free');
console.log(`6자 입력 "123456": 적용됨=${test7b.isApplied}\n`);

// Test 8: 길이 제한 확인
console.log('Test 8: 길이 제한 확인');
const longTitle = 'a'.repeat(100);
const test8 = autoFixPostTitle(longTitle, 'free');
console.log(`100자 입력 길이: ${longTitle.length}`);
console.log(`출력 길이: ${test8.fixed.length}`);
console.log(`제한 준수: ${test8.fixed.length <= 80}\n`);

console.log('=== All Tests Complete ===');
