#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    const listUrl = 'https://www.xn--3e0b036btifksj.com/40/?page=1';
    console.log('📄 목록 페이지 열기');
    await page.goto(listUrl, { waitUntil: 'networkidle' });

    const titleLinks = await page.locator('.title_link._fade_link').all();
    console.log(`✅ 찾은 링크: ${titleLinks.length}개\n`);

    if (titleLinks.length > 0) {
      console.log('👆 첫 번째 링크 클릭...');
      await titleLinks[0].click();
      await page.waitForTimeout(3000);

      // HTML에서 idx 패턴 찾기
      const html = await page.content();

      // 여러 패턴으로 시도
      const patterns = [
        /idx[=\s:]+(\d+)/gi,
        /idx=(\d+)/gi,
        /"idx":"?(\d+)"?/gi,
        /\bidx\b[=\s:]+(\d+)/gi,
      ];

      console.log('\n🔍 idx 패턴 검색:');
      let foundIdx = null;

      for (const pattern of patterns) {
        const match = pattern.exec(html);
        if (match) {
          console.log(`   ✅ 패턴 ${pattern}: ${match[1]}`);
          foundIdx = match[1];
          break;
        }
      }

      if (!foundIdx) {
        console.log('   ❌ idx를 찾을 수 없음');

        // HTML 일부 저장 (분석용)
        const snippet = html.substring(0, 5000);
        fs.writeFileSync('/tmp/page-snippet.html', snippet);
        console.log('   📝 HTML 일부를 /tmp/page-snippet.html에 저장');
      } else {
        console.log(`\n✅ idx 발견: ${foundIdx}`);
      }
    }

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await browser.close();
  }
})();
