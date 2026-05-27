const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

async function manualLoginCapture() {
  console.log('\n' + '='.repeat(80));
  console.log('🔐 수동 로그인 세션 캡처');
  console.log('='.repeat(80));
  console.log('\n📌 지침:');
  console.log('   1. 브라우저 창이 열립니다');
  console.log('   2. 로그인 버튼을 클릭하세요');
  console.log('   3. 아이디(이메일)와 비밀번호를 입력하세요');
  console.log('   4. 로그인을 클릭하세요');
  console.log('   5. 2FA 인증이 필요하면 완료하세요');
  console.log('   6. 로그인 완료 후 이 콘솔로 돌아와서 "완료" 입력 후 Enter\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    const context = page.context();

    // 네트워크 요청 캡처 (디버깅용)
    const loginRequests = [];
    page.on('request', req => {
      if (req.method() === 'POST' &&
          (req.url().includes('login') || req.url().includes('member') || req.url().includes('auth'))) {
        loginRequests.push({
          url: req.url(),
          timestamp: new Date().toISOString()
        });
      }
    });

    // 메인 페이지로 이동
    console.log('🌐 피씨천국 사이트에 접속 중...\n');
    await page.goto('https://www.xn--3e0b036btifksj.com', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // 사용자 입력 대기
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const getUserInput = (prompt) => {
      return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
          resolve(answer.trim().toLowerCase());
        });
      });
    };

    console.log('⏳ 브라우저에서 로그인을 완료해주세요...\n');
    console.log('💡 로그인 완료했으면 "완료" 입력 후 Enter를 누르세요\n');
    console.log('> ');

    let completed = false;
    let loginSuccess = false;

    // 입력 대기 (타임아웃 60분)
    const inputPromise = new Promise((resolve) => {
      rl.once('line', (input) => {
        resolve(input.trim().toLowerCase());
      });
    });

    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => resolve('timeout'), 60 * 60 * 1000); // 60분
    });

    const userInput = await Promise.race([inputPromise, timeoutPromise]);

    if (userInput === 'timeout') {
      console.log('\n⏱️ 시간 초과 (60분)');
      process.exit(1);
    }

    if (userInput === '완료' || userInput === '') {
      console.log('\n✓ 로그인 상태 확인 중...\n');

      // 로그인 상태 확인
      const loginStatus = await page.evaluate(() => {
        const content = document.body.innerText || '';
        const url = window.location.href;

        // 로그인 여부 판별
        const hasLogout = content.includes('로그아웃');
        const hasMyPage = content.includes('마이페이지');
        const isStillOnLoginPage = url.includes('/login') && content.includes('이메일') && content.includes('비밀번호');

        return {
          url,
          isLoggedIn: hasLogout || (hasMyPage && !isStillOnLoginPage),
          hasLogout,
          hasMyPage,
          isStillOnLoginPage,
          pageTitle: document.title
        };
      });

      console.log('📊 로그인 상태:');
      console.log(`   현재 URL: ${loginStatus.url.substring(0, 80)}`);
      console.log(`   페이지 제목: ${loginStatus.pageTitle}`);
      console.log(`   로그인 성공: ${loginStatus.isLoggedIn ? '✅ YES' : '❌ NO'}`);
      console.log(`   로그아웃 텍스트: ${loginStatus.hasLogout ? '✓' : '✗'}`);
      console.log(`   마이페이지 텍스트: ${loginStatus.hasMyPage ? '✓' : '✗'}\n`);

      loginSuccess = loginStatus.isLoggedIn;

      if (!loginSuccess) {
        console.log('⚠️  로그인이 완료되지 않은 것 같습니다.');
        console.log('   다시 시도하시겠습니까? (예/아니오)\n');

        rl.once('line', async (retry) => {
          if (retry.toLowerCase() === '예' || retry.toLowerCase() === 'y') {
            rl.close();
            await page.close();
            await browser.close();
            console.log('\n브라우저를 다시 실행하세요.\n');
            process.exit(0);
          }
        });

        await new Promise(resolve => {
          rl.once('line', (retry) => {
            resolve();
          });
        });
      }

      // 쿠키 정보
      if (loginSuccess) {
        const cookies = await context.cookies();
        const sessionCookies = cookies.filter(c =>
          c.name.toLowerCase().includes('session') ||
          c.name.toLowerCase().includes('sid') ||
          c.name.toLowerCase().includes('auth') ||
          c.name.toLowerCase().includes('token') ||
          c.name.toLowerCase().includes('user') ||
          c.name.toLowerCase().includes('member')
        );

        console.log('🍪 저장된 세션 쿠키:');
        if (sessionCookies.length > 0) {
          sessionCookies.slice(0, 10).forEach(c => {
            console.log(`   ✓ ${c.name}`);
          });
        } else {
          console.log('   (쿠키로는 로그인이 저장되지 않은 경우도 있습니다)');
        }

        // Storage state 저장
        console.log('\n💾 세션 저장 중...');
        const storageState = await context.storageState();

        const authFilePath = path.join(__dirname, 'playwright-auth.json');
        fs.writeFileSync(authFilePath, JSON.stringify(storageState, null, 2));

        console.log(`   ✅ playwright-auth.json 저장 완료`);
        console.log(`   📁 위치: ${authFilePath}\n`);

        // 상세 페이지 접근 테스트
        console.log('🧪 상세 페이지 접근 테스트...\n');

        try {
          const testPostId = 'p20230501948641a7bc92f';
          const detailUrl = `https://www.xn--3e0b036btifksj.com/40/?mode=view&id=${testPostId}`;

          console.log(`   URL: ${detailUrl}\n`);
          await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

          const detailTest = await page.evaluate(() => {
            const content = document.body.innerText || '';
            const html = document.documentElement.outerHTML;

            return {
              contentLength: content.length,
              has12Items: content.includes('매물업종') && content.includes('매물위치'),
              hasLoginMsg: content.includes('로그인이 필요'),
              hasOtherPosts: content.includes('중곡동') || content.includes('구의동'),
              imageCount: Array.from(document.querySelectorAll('img')).filter(img =>
                img.src && img.src.includes('cdn.imweb.me') && !img.src.includes('vendor-cdn')
              ).length
            };
          });

          console.log('   📋 상세 페이지 내용:');
          console.log(`   본문 길이: ${detailTest.contentLength}자`);
          console.log(`   12항목 데이터: ${detailTest.has12Items ? '✅ 있음' : '❌ 없음'}`);
          console.log(`   로그인 필요 메시지: ${detailTest.hasLoginMsg ? '⚠️  있음 (로그인 불충분)' : '✅ 없음 (로그인 완전)'}`);
          console.log(`   게시글 데이터: ${detailTest.hasOtherPosts ? '✓' : '✗'}`);
          console.log(`   이미지: ${detailTest.imageCount}개\n`);

          if (detailTest.has12Items && !detailTest.hasLoginMsg) {
            console.log('✅ 상세 페이지 접근 성공!');
            console.log('   로그인 세션이 정상입니다.\n');
          } else if (detailTest.hasLoginMsg) {
            console.log('⚠️  상세 페이지에 여전히 로그인 필요 메시지가 있습니다.');
            console.log('   2FA 인증이 완료되지 않았을 수 있습니다.\n');
          } else {
            console.log('⚠️  상세 데이터를 확인할 수 없습니다.\n');
          }

        } catch (error) {
          console.log(`⚠️  상세 페이지 테스트 실패: ${error.message}\n`);
        }

        console.log('='.repeat(80));
        console.log('✅ 세션 저장 완료!');
        console.log('='.repeat(80));
        console.log('\n📝 다음 단계:');
        console.log('   저장된 playwright-auth.json을 사용하여 상세 크롤러를 실행할 수 있습니다.\n');
        console.log('   명령어: node scrape-with-auth.js\n');
      }

      rl.close();
    }

    await page.close();
    await browser.close();

  } catch (error) {
    console.error('\n❌ 오류:', error.message);
    process.exit(1);
  }
}

manualLoginCapture().catch(err => {
  console.error('❌ 치명적 오류:', err.message);
  process.exit(1);
});
