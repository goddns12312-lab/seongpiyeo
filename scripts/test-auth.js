#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// .env.local 로드
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) process.env[key.trim()] = value.trim();
  });
}

const CRAWL_LIST_URL = process.env.CRAWL_LIST_URL || 'https://www.xn--3e0b036btifksj.com/40/';

async function main() {
  const authPath = path.join(process.cwd(), 'auth_state.json');

  if (!fs.existsSync(authPath)) {
    console.error('\n❌ auth_state.json을 찾을 수 없습니다');
    console.error(`📍 찾는 경로: ${authPath}`);
    console.error('먼저 다음을 실행하세요: node scripts/capture-auth.js\n');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });

  try {
    console.log('\n🔐 인증 세션 테스트\n');
    console.log('📍 대상 사이트:');
    console.log(`   ${CRAWL_LIST_URL}\n`);

    const storageState = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
    console.log('✅ 기존 세션 로드됨\n');

    const context = await browser.newContext({ storageState });
    const page = await context.newPage();

    // 목록 페이지 접속
    console.log('📄 목록 페이지 접속 중...');
    await page.goto(CRAWL_LIST_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log(`현재 URL: ${page.url()}\n`);

    // 첫 게시글 제목 추출
    const firstPostTitle = await page.evaluate(() => {
      const titleLink = document.querySelector('li.tit a.title_link');
      return titleLink?.innerText?.split('\n')[0]?.trim();
    });

    if (!firstPostTitle) {
      console.log('⚠️  게시글을 찾을 수 없습니다\n');
      await page.close();
      await context.close();
      return;
    }

    console.log(`✅ 게시글 발견: ${firstPostTitle}\n`);

    // 첫 게시글 클릭해서 모달 열기
    console.log('📝 상세 페이지 접속 중...\n');
    await page.click('li.tit a.title_link');

    // 모달이 나타날 때까지 대기
    try {
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    } catch (e) {
      console.log('⚠️  모달 로드 실패\n');
    }

    // 모달 콘텐츠 대기
    await page.waitForTimeout(2000);

    // 로그인 필요 여부 확인
    const pageContent = await page.content();
    const isLoginRequired = pageContent.includes('로그인상태유지') || pageContent.includes('로그인');

    if (isLoginRequired) {
      console.log('⚠️  로그인 필요합니다');
      console.log('    브라우저에서 수동으로 로그인하신 후');
      console.log('    Enter 키를 누르세요...\n');

      // 사용자 입력 대기
      await new Promise(resolve => {
        process.stdin.once('data', resolve);
      });

      // 로그인 후 모달 다시 체크
      await page.click('li.tit a.title_link');
      await page.waitForTimeout(3000);
    }

    // 모달 콘텐츠 확인
    const modalContent = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]');
      if (!modal) return { text: '', hasImages: false };

      const text = modal.innerText || '';
      const images = modal.querySelectorAll('img[src*="/upload/"]');

      return {
        text: text.substring(0, 200),
        hasImages: images.length > 0,
        imageCount: images.length
      };
    });

    if (modalContent.text.length > 20 && !modalContent.text.includes('로그인')) {
      console.log('✅ 인증 성공! 상세 페이지 접근 가능합니다\n');
      console.log(`📸 이미지 ${modalContent.imageCount}개 감지됨\n`);
      console.log('💬 설명글 샘플:');
      console.log(`   ${modalContent.text}...\n`);
    } else if (modalContent.text.includes('로그인')) {
      console.log('❌ 여전히 로그인 필요 (세션 미작동)\n');
    } else {
      console.log('⚠️  모달 상태 불명확\n');
    }

    console.log('✅ 테스트 완료!\n');

    await page.close();
    await context.close();

  } catch (error) {
    console.error('\n❌ 오류:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
