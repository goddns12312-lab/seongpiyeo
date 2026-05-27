const { chromium } = require('playwright');
const fs = require('fs');

async function analyzeLoginPage() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('🔍 로그인 페이지 구조 분석 중...\n');

  await page.goto('https://www.xn--3e0b036btifksj.com', { waitUntil: 'domcontentloaded', timeout: 30000 });

  const loginPageInfo = await page.evaluate(() => {
    return {
      // 모든 form 요소
      forms: Array.from(document.querySelectorAll('form')).map((f, i) => ({
        id: f.id,
        class: f.className,
        action: f.action,
        method: f.method,
        inputs: Array.from(f.querySelectorAll('input')).map(inp => ({
          type: inp.type,
          name: inp.name,
          placeholder: inp.placeholder
        }))
      })),

      // 모든 input 요소
      inputs: Array.from(document.querySelectorAll('input')).map((inp, i) => ({
        type: inp.type,
        name: inp.name,
        id: inp.id,
        placeholder: inp.placeholder,
        className: inp.className
      })),

      // 로그인 관련 버튼
      buttons: Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]'))
        .filter(b => b.textContent.includes('로그인') || b.value.includes('로그인'))
        .map(b => ({
          type: b.type,
          text: b.textContent.trim() || b.value,
          class: b.className,
          id: b.id
        })),

      // iframe 확인
      iframes: Array.from(document.querySelectorAll('iframe')).map(i => ({
        src: i.src,
        id: i.id,
        class: i.className
      })),

      // 로그인 관련 div/section
      loginContainers: Array.from(document.querySelectorAll('[class*="login"], [id*="login"]')).map(el => ({
        tag: el.tagName,
        class: el.className,
        id: el.id
      })).slice(0, 10)
    };
  });

  console.log('📋 폼 분석:');
  loginPageInfo.forms.forEach((form, i) => {
    console.log(`\n  폼 ${i + 1}:`);
    console.log(`    ID: ${form.id || '없음'}`);
    console.log(`    Class: ${form.class || '없음'}`);
    console.log(`    Action: ${form.action || '없음'}`);
    console.log(`    입력필드: ${form.inputs.length}개`);
    form.inputs.forEach(inp => {
      console.log(`      - [${inp.type}] ${inp.name || '이름없음'} (${inp.placeholder || '플레이스홀더없음'})`);
    });
  });

  console.log('\n📝 모든 입력필드:');
  loginPageInfo.inputs.slice(0, 15).forEach(inp => {
    console.log(`  [${inp.type}] ID: ${inp.id || '없음'}, Name: ${inp.name || '없음'}`);
  });

  console.log('\n🔘 로그인 버튼:');
  loginPageInfo.buttons.forEach(btn => {
    console.log(`  ${btn.text} (${btn.class || '클래스없음'})`);
  });

  console.log('\n🖼️ iframe:');
  if (loginPageInfo.iframes.length > 0) {
    loginPageInfo.iframes.forEach(iframe => {
      console.log(`  src: ${iframe.src}`);
      console.log(`  id: ${iframe.id}`);
    });
  } else {
    console.log('  없음');
  }

  console.log('\n🔐 로그인 관련 컨테이너:');
  loginPageInfo.loginContainers.forEach(c => {
    console.log(`  <${c.tag}> ID: ${c.id || '없음'}, Class: ${c.class || '없음'}`);
  });

  // HTML 저장
  const html = await page.content();
  fs.writeFileSync(
    'c:/Users/B/Desktop/aass/scripts/login-page-html.html',
    html,
    'utf-8'
  );

  console.log('\n✅ login-page-html.html 저장됨 (수동 검사용)');

  await browser.close();
}

analyzeLoginPage().catch(err => {
  console.error('❌ 오류:', err.message);
  process.exit(1);
});
