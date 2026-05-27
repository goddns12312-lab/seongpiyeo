const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function verifyLoginAuthority() {
  console.log('🔐 로그인 및 권한 검증\n');

  const browser = await chromium.launch({ headless: true });
  const authFile = path.join(__dirname, 'playwright-auth.json');

  if (!fs.existsSync(authFile)) {
    console.log('❌ playwright-auth.json을 찾을 수 없습니다.');
    await browser.close();
    process.exit(1);
  }

  const storageState = JSON.parse(fs.readFileSync(authFile, 'utf-8'));

  // 로그인된 세션
  const context = await browser.newContext({ storageState });
  const page = await context.newPage();

  try {
    console.log('='.repeat(80));
    console.log('1️⃣ 로그인 상태 검증');
    console.log('='.repeat(80) + '\n');

    // 홈페이지 접근
    await page.goto('https://www.xn--3e0b036btifksj.com', { waitUntil: 'domcontentloaded', timeout: 30000 });

    const loginStatus = await page.evaluate(() => {
      const pageText = document.body.innerText;
      const pageHtml = document.documentElement.outerHTML;

      // 닉네임/사용자명 찾기
      const nicknameMatch = pageText.match(/(?:닉네임|사용자명|님|회원):\s*(\S+)/);
      const nicknameElement = document.querySelector('[class*="name"], [class*="user"], [class*="member"], [class*="profile"]');

      // 메뉴 확인
      const hasLogoutButton = pageText.includes('로그아웃');
      const hasMyPageMenu = pageText.includes('마이페이지') || pageText.includes('내 정보');
      const hasAdminMenu = pageText.includes('관리자');

      // 스크린샷
      const profileArea = document.querySelector('[class*="profile"], [class*="user-info"], [class*="member"]');

      return {
        pageTitle: document.title,
        hasLogoutButton,
        hasMyPageMenu,
        hasAdminMenu,
        nicknameElement: nicknameElement ? {
          text: nicknameElement.innerText?.substring(0, 100),
          class: nicknameElement.className
        } : null,
        loginIndicators: {
          logoutText: pageText.includes('로그아웃'),
          mypageText: pageText.includes('마이페이지'),
          profileText: pageText.includes('프로필'),
          memberText: pageText.includes('회원')
        }
      };
    });

    console.log('📌 로그인 상태:');
    console.log(`   로그아웃 버튼: ${loginStatus.hasLogoutButton ? '✅ 있음' : '❌ 없음'}`);
    console.log(`   마이페이지 메뉴: ${loginStatus.hasMyPageMenu ? '✅ 있음' : '❌ 없음'}`);
    console.log(`   관리자 메뉴: ${loginStatus.hasAdminMenu ? '✅ 있음' : '❌ 없음'}`);
    console.log(`   닉네임 요소: ${loginStatus.nicknameElement ? '✅ 발견' : '❌ 없음'}`);

    if (loginStatus.nicknameElement) {
      console.log(`   내용: "${loginStatus.nicknameElement.text}"`);
    }

    console.log('');

    // 2️⃣ 쿠키 및 로컬스토리지 검증
    console.log('='.repeat(80));
    console.log('2️⃣ 쿠키 및 권한 정보 검증');
    console.log('='.repeat(80) + '\n');

    const cookies = await context.cookies();
    const storageData = await page.evaluate(() => {
      const local = {};
      const session = {};

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        if (key && (key.includes('auth') || key.includes('user') || key.includes('member') ||
                    key.includes('grade') || key.includes('level') || key.includes('account'))) {
          local[key] = value?.substring(0, 100);
        }
      }

      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        const value = sessionStorage.getItem(key);
        if (key && (key.includes('auth') || key.includes('user') || key.includes('member'))) {
          session[key] = value?.substring(0, 100);
        }
      }

      return { localStorage: local, sessionStorage: session };
    });

    console.log('🍪 쿠키 정보:\n');
    const authCookies = cookies.filter(c =>
      c.name.toLowerCase().includes('auth') ||
      c.name.toLowerCase().includes('session') ||
      c.name.toLowerCase().includes('member') ||
      c.name.toLowerCase().includes('user')
    );

    if (authCookies.length > 0) {
      authCookies.forEach(cookie => {
        console.log(`   ${cookie.name}: ${cookie.value?.substring(0, 80)}...`);
      });
    } else {
      console.log('   (인증 관련 쿠키 없음)');
    }

    console.log(`\n📦 localStorage 권한 정보:\n`);
    if (Object.keys(storageData.localStorage).length > 0) {
      Object.entries(storageData.localStorage).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
    } else {
      console.log('   (권한 정보 없음)');
    }

    console.log(`\n📦 sessionStorage 권한 정보:\n`);
    if (Object.keys(storageData.sessionStorage).length > 0) {
      Object.entries(storageData.sessionStorage).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
    } else {
      console.log('   (권한 정보 없음)');
    }

    // 3️⃣ 게시글 상세 페이지 응답 분석
    console.log('\n' + '='.repeat(80));
    console.log('3️⃣ 게시글 상세 페이지 응답 분석');
    console.log('='.repeat(80) + '\n');

    const postId = 'p20230501948641a7bc92f';
    const postUrl = `https://www.xn--3e0b036btifksj.com/40/?mode=view&id=${postId}`;

    console.log(`게시글: ${postId}\n`);

    const response = await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const postContent = await page.evaluate(() => {
      const content = document.body.innerText;
      const lines = content.split('\n').filter(l => l.trim());

      // 본문 내용 확인
      const hasRealContent = lines.some(line =>
        line.includes('매물') && line.includes('평') ||
        line.includes('층') && line.includes('보증금') ||
        line.match(/\d+만원|\d+평/)
      );

      // 이미지 확인
      const images = document.querySelectorAll('img');
      const uniqueImages = new Set();
      images.forEach(img => {
        if (img.src && img.src.includes('cdn')) {
          uniqueImages.add(img.src);
        }
      });

      // 데이터 속성 확인
      const dataAttributes = [];
      document.querySelectorAll('*').forEach(el => {
        for (let attr of el.attributes) {
          if (attr.name.startsWith('data-')) {
            dataAttributes.push({
              element: el.tagName,
              attr: attr.name,
              value: attr.value?.substring(0, 50)
            });
          }
        }
      });

      return {
        contentLength: content.length,
        lineCount: lines.length,
        hasRealContent,
        uniqueImageCount: uniqueImages.size,
        dataAttributeCount: dataAttributes.length,
        firstLines: lines.slice(0, 20),
        dataAttributes: dataAttributes.slice(0, 10)
      };
    });

    console.log('📊 페이지 콘텐츠:');
    console.log(`   본문 길이: ${postContent.contentLength}자`);
    console.log(`   줄 수: ${postContent.lineCount}개`);
    console.log(`   실제 본문 데이터: ${postContent.hasRealContent ? '✅ 있음' : '❌ 없음'}`);
    console.log(`   고유 이미지: ${postContent.uniqueImageCount}개`);
    console.log(`   데이터 속성: ${postContent.dataAttributeCount}개\n`);

    console.log('첫 20줄:');
    postContent.firstLines.forEach((line, idx) => {
      console.log(`   ${idx + 1}. ${line.substring(0, 100)}`);
    });

    // 4️⃣ 권한 수준 판단
    console.log('\n' + '='.repeat(80));
    console.log('4️⃣ 권한 수준 판단');
    console.log('='.repeat(80) + '\n');

    const authLevel = {
      isLoggedIn: loginStatus.hasLogoutButton,
      hasUserMenu: loginStatus.hasMyPageMenu,
      hasAdminAccess: loginStatus.hasAdminMenu,
      hasAuthCookie: authCookies.length > 0,
      hasStorageData: Object.keys(storageData.localStorage).length > 0,
      hasPostContent: postContent.hasRealContent,
      imageCount: postContent.uniqueImageCount
    };

    console.log('✓ 로그인 완료:', authLevel.isLoggedIn);
    console.log('✓ 사용자 메뉴:', authLevel.hasUserMenu);
    console.log('✓ 관리자 접근:', authLevel.hasAdminAccess);
    console.log('✓ 인증 쿠키:', authLevel.hasAuthCookie);
    console.log('✓ 권한 정보:', authLevel.hasStorageData);
    console.log('✓ 게시글 본문:', authLevel.hasPostContent);
    console.log('✓ 이미지 수:', authLevel.imageCount);

    // 결론
    console.log('\n' + '='.repeat(80));
    console.log('💡 결론');
    console.log('='.repeat(80) + '\n');

    if (!authLevel.isLoggedIn) {
      console.log('⚠️  로그인 상태 의심: 로그아웃 버튼이 보이지 않습니다.');
      console.log('   → 세션이 만료되었을 가능성');
    } else if (!authLevel.hasPostContent && authLevel.imageCount === 0) {
      console.log('⚠️  권한 제한 가능성 높음:');
      console.log('   → 로그인은 되었지만 게시글 콘텐츠/이미지가 없음');
      console.log('   → 유료 회원 전용, 등급 제한, 또는 구독 필요');
    } else if (authLevel.hasPostContent) {
      console.log('✅ 로그인 및 권한 정상:');
      console.log('   → 게시글 본문 데이터 표시됨');
    } else {
      console.log('⚠️  상태 불명확 - 추가 확인 필요');
    }

    // 결과 저장
    const authAnalysis = {
      timestamp: new Date().toISOString(),
      loginStatus,
      cookies: authCookies.map(c => ({ name: c.name, hasValue: !!c.value })),
      localStorage: Object.keys(storageData.localStorage),
      postContent,
      authLevel,
      conclusion: authLevel.isLoggedIn ? (authLevel.hasPostContent ? 'FULL_ACCESS' : 'LIMITED_ACCESS') : 'NOT_LOGGED_IN'
    };

    fs.writeFileSync(
      path.join(__dirname, 'login-authority-analysis.json'),
      JSON.stringify(authAnalysis, null, 2)
    );

    console.log(`\n✅ login-authority-analysis.json 저장 완료\n`);

  } catch (error) {
    console.error(`\n❌ 오류: ${error.message}`);
  } finally {
    await context.close();
    await browser.close();
  }
}

verifyLoginAuthority().catch(err => {
  console.error('❌ 치명적 오류:', err.message);
  process.exit(1);
});
