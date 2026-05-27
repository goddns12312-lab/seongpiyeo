#!/usr/bin/env node

/**
 * OG/Twitter 이미지 생성 스크립트
 *
 * 설명: Canvas를 사용하여 SEO 이미지 생성
 * 사용법: node scripts/generate-og-images.js
 *
 * 생성 파일:
 * - public/og-image.png (1200x630)
 * - public/twitter-image.png (1200x630)
 * - public/logo.png (512x512)
 * - public/og-listings.png (1200x630)
 * - public/og-community.png (1200x630)
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// 파일 경로
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 색상 정의
const COLORS = {
  dark: '#0a0a0a',
  gold: '#c8a96b',
  gray: '#e5e5e5',
  accent: '#1f1f1f',
};

/**
 * OG 이미지 생성 (1200x630)
 */
function generateOgImage(filename, title, subtitle) {
  const canvas = createCanvas(1200, 630);
  const ctx = canvas.getContext('2d');

  // 배경
  ctx.fillStyle = COLORS.dark;
  ctx.fillRect(0, 0, 1200, 630);

  // 상단 금색 라인
  ctx.fillStyle = COLORS.gold;
  ctx.fillRect(0, 0, 1200, 8);

  // 로고/텍스트
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 80px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PC365', 600, 200);

  // 제목
  ctx.fillStyle = COLORS.gray;
  ctx.font = 'bold 48px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 600, 320);

  // 부제목
  ctx.fillStyle = '#999999';
  ctx.font = '32px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(subtitle, 600, 400);

  // 하단 텍스트
  ctx.fillStyle = COLORS.gold;
  ctx.font = '24px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PC방 매매·양도양수 플랫폼', 600, 550);

  // 파일 저장
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(publicDir, filename), buffer);
  console.log(`✅ 생성됨: public/${filename}`);
}

/**
 * 로고 이미지 생성 (512x512)
 */
function generateLogo() {
  const canvas = createCanvas(512, 512);
  const ctx = canvas.getContext('2d');

  // 배경
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 512, 512);

  // 원형 배경
  ctx.fillStyle = COLORS.dark;
  ctx.beginPath();
  ctx.arc(256, 256, 240, 0, Math.PI * 2);
  ctx.fill();

  // 텍스트
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 200px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PC', 256, 220);

  // 숫자
  ctx.font = 'bold 120px Arial, sans-serif';
  ctx.fillText('365', 256, 320);

  // 파일 저장
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(publicDir, 'logo.png'), buffer);
  console.log(`✅ 생성됨: public/logo.png`);
}

/**
 * 매물 목록 OG 이미지
 */
function generateListingsOg() {
  const canvas = createCanvas(1200, 630);
  const ctx = canvas.getContext('2d');

  // 배경
  ctx.fillStyle = COLORS.dark;
  ctx.fillRect(0, 0, 1200, 630);

  // 상단 금색 라인
  ctx.fillStyle = COLORS.gold;
  ctx.fillRect(0, 0, 1200, 8);

  // 왼쪽 섹션
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 64px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('PC방', 80, 200);

  // 오른쪽 섹션
  ctx.fillStyle = COLORS.gray;
  ctx.font = '48px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('매물 목록', 80, 280);

  // 설명
  ctx.fillStyle = '#999999';
  ctx.font = '32px Arial, sans-serif';
  ctx.fillText('전국 성인PC 매물 정보', 80, 370);
  ctx.fillText('매매·임대·양도양수', 80, 420);

  // 우측 강조
  ctx.fillStyle = COLORS.gold;
  ctx.globalAlpha = 0.3;
  ctx.fillRect(800, 100, 350, 450);
  ctx.globalAlpha = 1;

  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 48px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('수백 개', 975, 280);
  ctx.fillStyle = '#999999';
  ctx.font = '32px Arial, sans-serif';
  ctx.fillText('매물 정보', 975, 340);

  // 파일 저장
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(publicDir, 'og-listings.png'), buffer);
  console.log(`✅ 생성됨: public/og-listings.png`);
}

/**
 * 커뮤니티 OG 이미지
 */
function generateCommunityOg() {
  const canvas = createCanvas(1200, 630);
  const ctx = canvas.getContext('2d');

  // 배경
  ctx.fillStyle = COLORS.dark;
  ctx.fillRect(0, 0, 1200, 630);

  // 상단 금색 라인
  ctx.fillStyle = COLORS.gold;
  ctx.fillRect(0, 0, 1200, 8);

  // 제목
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 64px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PC방 창업', 600, 180);

  // 부제목
  ctx.fillStyle = COLORS.gray;
  ctx.font = 'bold 48px Arial, sans-serif';
  ctx.fillText('커뮤니티', 600, 260);

  // 설명
  ctx.fillStyle = '#999999';
  ctx.font = '32px Arial, sans-serif';
  ctx.fillText('창업정보 | 인테리어 | 장비 | 운영팁', 600, 350);
  ctx.fillText('경험자들의 정보공유 공간', 600, 410);

  // 카테고리 표시
  ctx.fillStyle = COLORS.gold;
  ctx.globalAlpha = 0.2;
  ctx.fillRect(200, 470, 250, 100);
  ctx.fillRect(550, 470, 250, 100);
  ctx.fillRect(900, 470, 250, 100);
  ctx.globalAlpha = 1;

  ctx.fillStyle = COLORS.gray;
  ctx.font = '24px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('창업정보', 325, 530);
  ctx.fillText('인테리어', 675, 530);
  ctx.fillText('장비·운영', 1025, 530);

  // 파일 저장
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(publicDir, 'og-community.png'), buffer);
  console.log(`✅ 생성됨: public/og-community.png`);
}

/**
 * 메인 함수
 */
async function main() {
  console.log('\n📸 SEO 이미지 생성 시작\n');

  try {
    // 기본 OG 이미지
    generateOgImage(
      'og-image.png',
      'PC365',
      'PC방 매매·양도양수 플랫폼'
    );

    // Twitter 이미지 (og-image와 동일)
    generateOgImage(
      'twitter-image.png',
      'PC365',
      'PC방 매매·양도양수 플랫폼'
    );

    // 로고
    generateLogo();

    // 매물 목록 OG
    generateListingsOg();

    // 커뮤니티 OG
    generateCommunityOg();

    console.log('\n✅ 모든 이미지 생성 완료!\n');
    console.log('📁 생성된 파일:');
    console.log('  - public/og-image.png (1200×630)');
    console.log('  - public/twitter-image.png (1200×630)');
    console.log('  - public/logo.png (512×512)');
    console.log('  - public/og-listings.png (1200×630)');
    console.log('  - public/og-community.png (1200×630)\n');
    console.log('💡 참고: 이 이미지들은 placeholder입니다.');
    console.log('   실제 브랜드 디자인으로 교체하세요.\n');

  } catch (err) {
    console.error('❌ 이미지 생성 실패:', err.message);
    process.exit(1);
  }
}

main();
