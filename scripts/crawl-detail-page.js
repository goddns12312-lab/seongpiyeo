#!/usr/bin/env node

const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// CLI 옵션 파싱
const args = process.argv.slice(2);
let limit = 1;
for (const arg of args) {
  if (arg.startsWith('--limit=')) {
    limit = parseInt(arg.split('=')[1]) || 1;
  }
}

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const CRAWL_LIST_FILTERED_URL = env.CRAWL_LIST_FILTERED_URL || 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=1';

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, { timeout: 5000 }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function checkLoginStatus(page) {
  const loginStatus = await page.evaluate(() => {
    // 모든 링크와 버튼 요소 수집
    const allElements = [...document.querySelectorAll('a, button')];

    // 텍스트 기반으로 로그아웃 버튼 찾기
    const hasLogoutBtn = allElements.some(el =>
      el.textContent.includes('로그아웃') ||
      el.getAttribute('href')?.includes('logout')
    );

    // 마이페이지 찾기
    const hasMypage = allElements.some(el =>
      el.textContent.includes('마이페이지') ||
      el.textContent.includes('내정보') ||
      el.getAttribute('href')?.includes('mypage') ||
      el.getAttribute('href')?.includes('my')
    );

    // 로그인 버튼 찾기 (단, 로그아웃과 겹치지 않게)
    const hasLoginBtn = allElements.some(el =>
      el.textContent.includes('로그인') &&
      !el.textContent.includes('로그아웃') &&
      !el.getAttribute('href')?.includes('logout')
    );

    // 닉네임/사용자 정보 클래스 검색
    const nicknameElements = [
      ...document.querySelectorAll('[class*="user"], [class*="nick"], [class*="name"], [class*="member"]')
    ];
    const hasNickname = nicknameElements.some(el =>
      el.textContent && el.textContent.trim().length > 1
    );

    return {
      isLoggedIn: (hasLogoutBtn || hasMypage || hasNickname) && !hasLoginBtn,
      hasLogoutBtn,
      hasMypage,
      hasNickname,
      hasLoginBtn
    };
  });

  return loginStatus;
}

async function extractDetailContent(page) {
  return await page.evaluate(() => {
    let fullText = '';
    let images = [];
    let source = 'none';

    // 방법 1: .board_txt_area.fr-view (게시글 본문 컨테이너)
    let boardTxtArea = document.querySelector('.board_txt_area.fr-view');
    if (boardTxtArea) {
      fullText = boardTxtArea.innerText || '';
      source = 'board_txt_area';
    }

    // 방법 2: 모달 (대체)
    if (!fullText) {
      const modal = document.querySelector('[role="dialog"]');
      if (modal) {
        fullText = modal.innerText || '';
        source = 'modal';
      }
    }

    // 방법 3: body 전체 (최후의 수단)
    if (!fullText) {
      fullText = document.body.innerText || '';
      source = 'body';
    }

    // 이미지 추출: img.fr-dii._img_light_gallery
    const imgElements = Array.from(document.querySelectorAll('img.fr-dii._img_light_gallery'));

    if (imgElements.length > 0) {
      images = imgElements
        .map(img => {
          const src = img.src || img.getAttribute('data-src') || img.getAttribute('src');
          return {
            src: src,
            width: img.width || img.naturalWidth || 0,
            height: img.height || img.naturalHeight || 0
          };
        })
        .filter(img => {
          if (!img.src) return false;
          if (!img.src.includes('cdn.imweb.me/upload/')) return false;
          return true;
        })
        .map(img => img.src)
        .filter((src, idx, arr) => arr.indexOf(src) === idx);
    }

    // 폴백: 전체 페이지에서 /upload/ 이미지 검색
    if (images.length === 0) {
      const allImages = Array.from(document.querySelectorAll('img[src*="/upload/"], img[data-src*="/upload/"]'));
      images = allImages
        .map(img => img.src || img.getAttribute('data-src'))
        .filter(src => src && src.includes('cdn.imweb.me/upload/'))
        .filter((src, idx, arr) => arr.indexOf(src) === idx);
    }

    return {
      fullText,
      images,
      source
    };
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const authPath = path.join(process.cwd(), 'auth_state.json');

  if (!fs.existsSync(authPath)) {
    console.error('\n❌ auth_state.json을 찾을 수 없습니다');
    console.error(`📍 찾는 경로: ${authPath}`);
    console.error('먼저 다음을 실행하세요: node scripts/capture-auth.js\n');
    process.exit(1);
  }

  try {
    console.log('\n🚀 상세 페이지 크롤링 시작\n');
    console.log('📍 설정:');
    console.log(`   대상: ${CRAWL_LIST_FILTERED_URL}`);
    console.log(`   한계: ${limit}개 매물\n`);

    const storageState = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
    const context = await browser.newContext({ storageState });
    const page = await context.newPage();

    // 1단계: 목록 페이지 접속
    console.log('📄 목록 페이지 접속 중...');
    await page.goto(CRAWL_LIST_FILTERED_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log(`✅ 목록 페이지 로드됨\n`);

    // 2단계: 로그인 상태 확인
    console.log('🔐 로그인 상태 확인 중...');
    const loginStatus = await checkLoginStatus(page);

    console.log(`   - 로그아웃 버튼: ${loginStatus.hasLogoutBtn ? '✅' : '❌'}`);
    console.log(`   - 마이페이지: ${loginStatus.hasMypage ? '✅' : '❌'}`);
    console.log(`   - 닉네임: ${loginStatus.hasNickname ? '✅' : '❌'}`);
    console.log(`   - 로그인 버튼: ${loginStatus.hasLoginBtn ? '❌ (로그인됨)' : '✅ (로그인됨)'}\n`);

    if (!loginStatus.isLoggedIn) {
      console.error('❌ 로그인 상태가 아닙니다');
      console.error('세션이 만료되었거나 유효하지 않습니다\n');
      console.error('다시 로그인하려면 다음을 실행하세요:');
      console.error('  node scripts/capture-auth.js\n');
      process.exit(1);
    }

    console.log('✅ 로그인 확인됨\n');

    // 3단계: 게시글 찾기
    console.log('📋 첫 번째 게시글 찾는 중...');
    const firstPostInfo = await page.evaluate(() => {
      const titleLink = document.querySelector('li.tit a.title_link');
      if (!titleLink) return null;

      const title = titleLink.innerText?.split('\n')[0]?.trim();
      const href = titleLink.getAttribute('href');

      return { title, href };
    });

    if (!firstPostInfo) {
      console.error('❌ 게시글을 찾을 수 없습니다\n');
      process.exit(1);
    }

    console.log(`✅ 게시글 발견: "${firstPostInfo.title}"\n`);

    // 4단계: 게시글 클릭
    console.log('📝 게시글 클릭 중...');
    const urlBefore = page.url();

    await Promise.race([
      page.click('li.tit a.title_link').catch(() => null),
      page.waitForTimeout(1000)
    ]);

    console.log('⏳ 콘텐츠 로드 대기...');
    await page.waitForTimeout(3000);

    const urlAfter = page.url();
    console.log(`   URL 변화: ${urlBefore === urlAfter ? '❌ 없음 (모달)' : '✅ 있음 (새 페이지)'}`);
    console.log();

    // 5단계: 상세 정보 추출
    console.log('🔍 상세 정보 추출 중...');
    const detailContent = await extractDetailContent(page);

    console.log(`\n   ✅ 추출 결과:`);
    console.log(`   - 추출 방법: ${detailContent.source}`);
    console.log(`   - Selector: ${detailContent.source === 'board_txt_area' ? '.board_txt_area.fr-view' : detailContent.source === 'modal' ? '[role="dialog"]' : 'document.body'}`);
    console.log(`   - 본문: ${detailContent.fullText.length}자`);
    console.log(`   - 이미지: ${detailContent.images.length}개`);
    if (detailContent.images.length > 0) {
      console.log(`     이미지 Selector: img.fr-dii._img_light_gallery`);
      console.log(`     이미지 경로: cdn.imweb.me/upload/...`);
    }
    console.log();

    // 6단계: 데이터 품질 검증
    console.log('✅ 데이터 품질 검증 중...');
    const hasValidText = detailContent.fullText.length >= 100;
    const hasValidImages = detailContent.images.length >= 1;

    console.log(`   - 본문 100자 이상: ${hasValidText ? '✅ 통과' : `❌ 실패 (${detailContent.fullText.length}자)`}`);
    console.log(`   - 이미지 1개 이상: ${hasValidImages ? '✅ 통과' : '❌ 실패'}\n`);

    if (!hasValidText || !hasValidImages) {
      console.error('❌ 데이터 품질 부족 - DB 저장 금지\n');

      // Debug HTML 저장
      const debugPath = path.join(process.cwd(), 'debug-page-content.html');
      const pageContent = await page.content();
      fs.writeFileSync(debugPath, pageContent);
      console.log(`📝 Debug HTML 저장: ${debugPath}\n`);

      console.log('본문 샘플 (첫 300자):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(detailContent.fullText.substring(0, 300));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      process.exit(1);
    }

    console.log('✅ 품질 검증 통과\n');

    // 7단계: DB 저장 전 미리보기
    console.log('📋 DB 저장 미리보기:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   게시글 제목: "${firstPostInfo.title}"`);
    console.log(`   본문 길이: ${detailContent.fullText.length}자`);
    console.log(`   이미지 개수: ${detailContent.images.length}개`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 8단계: 이미지 목록
    if (detailContent.images.length > 0) {
      console.log('📸 이미지 목록:');
      detailContent.images.forEach((img, idx) => {
        console.log(`   [${idx + 1}/${detailContent.images.length}] ${img.substring(0, 80)}...`);
      });
      console.log();
    }

    // 9단계: 본문 미리보기
    console.log('📄 본문 미리보기 (첫 500자):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(detailContent.fullText.substring(0, 500));
    console.log('...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 10단계: DB 저장
    const { data: listings } = await supabase
      .from('listings')
      .select('id')
      .limit(1);

    if (!listings || listings.length === 0) {
      console.error('❌ 테스트 매물을 찾을 수 없습니다\n');
      process.exit(1);
    }

    const listingId = listings[0].id;
    console.log(`💾 DB 저장 시작... (매물 ID: ${listingId})\n`);

    // 이미지 다운로드 및 업로드
    const uploadedUrls = [];

    for (let idx = 0; idx < detailContent.images.length; idx++) {
      try {
        console.log(`🖼️  [${idx + 1}/${detailContent.images.length}] 다운로드 중...`);
        const imageBuffer = await downloadImage(detailContent.images[idx]);
        const filename = `listing-test-${idx + 1}-${Date.now()}.jpg`;

        const { error: uploadError } = await supabase
          .storage
          .from('listings')
          .upload(`images-all/${filename}`, imageBuffer, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase
            .storage
            .from('listings')
            .getPublicUrl(`images-all/${filename}`);
          uploadedUrls.push(publicUrl);
          console.log(`   ✅ 업로드 완료`);
        } else {
          console.log(`   ❌ 업로드 실패: ${uploadError.message}`);
        }
      } catch (e) {
        console.log(`   ❌ 실패: ${e.message}`);
      }
    }

    console.log();

    // listing_images 저장
    if (uploadedUrls.length > 0) {
      await supabase
        .from('listing_images')
        .delete()
        .eq('listing_id', listingId);

      const imagesToInsert = uploadedUrls.map((url, imgIdx) => ({
        listing_id: listingId,
        url: url,
        is_primary: imgIdx === 0,
        order_num: imgIdx
      }));

      await supabase.from('listing_images').insert(imagesToInsert);
      console.log(`✅ ${uploadedUrls.length}개 이미지 저장됨\n`);
    }

    // 월세 파싱 (description에서 추출)
    let monthlyRent = null;
    const rentMatch = detailContent.fullText.match(/7\.\s*월세\s*[:：]\s*([^\n]+)/);
    if (rentMatch) {
      const rentText = rentMatch[1].trim();
      // "83만원" -> 83 추출
      const rentNum = rentText.match(/(\d+)/);
      if (rentNum) {
        monthlyRent = parseInt(rentNum[1]);
      }
    }

    // 본문 저장
    const updateData = {
      description: detailContent.fullText
    };
    if (monthlyRent) {
      updateData.monthly_rent = monthlyRent;
    }

    await supabase
      .from('listings')
      .update(updateData)
      .eq('id', listingId);

    console.log('✅ DB 저장 완료!\n');
    if (monthlyRent) {
      console.log(`   월세: ${monthlyRent}만원 파싱되어 저장됨\n`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 저장 결과:');
    console.log(`   - 매물 ID: ${listingId}`);
    console.log(`   - 이미지: ${uploadedUrls.length}개 저장`);
    console.log(`   - 본문: ${detailContent.fullText.length}자 저장`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ 크롤링 완료! 테스트 성공!\n');
    console.log('🌐 브라우저에서 확인:');
    console.log(`   http://localhost:3001/listings/${listingId}\n`);

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
