const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function inspectPostImages() {
  const browser = await chromium.launch({ headless: true });
  const authFile = path.join(__dirname, 'playwright-auth.json');

  if (!fs.existsSync(authFile)) {
    console.log('❌ playwright-auth.json을 찾을 수 없습니다.');
    await browser.close();
    process.exit(1);
  }

  const page = await browser.newPage();
  const storageState = JSON.parse(fs.readFileSync(authFile, 'utf-8'));

  if (storageState.cookies && storageState.cookies.length > 0) {
    await page.context().addCookies(storageState.cookies);
  }

  if (storageState.origins && storageState.origins.length > 0) {
    for (const origin of storageState.origins) {
      if (origin.localStorage && origin.localStorage.length > 0) {
        await page.addInitScript((items) => {
          items.forEach(item => {
            localStorage.setItem(item.name, item.value);
          });
        }, origin.localStorage);
      }
    }
  }

  const context = page.context();

  try {
    // 2개 게시글 비교 분석
    const posts = [
      { id: 'p20230501948641a7bc92f', title: '중곡동' },
      { id: 'p20230410358600eb6c03b', title: '구의동' }
    ];

    for (const post of posts) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📖 분석: ${post.title} (${post.id})`);
      console.log('='.repeat(80));

      const url = `https://www.xn--3e0b036btifksj.com/40/?mode=view&id=${post.id}`;
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // 페이지 HTML 전체 저장
      const html = await page.content();
      fs.writeFileSync(`post-html-${post.id}.html`, html);

      // 모든 이미지 상세 분석
      const imageData = await page.evaluate(() => {
        const images = [];

        // 모든 img 태그
        Array.from(document.querySelectorAll('img')).forEach((img, idx) => {
          const rect = img.getBoundingClientRect();
          images.push({
            idx,
            type: 'img',
            src: img.src,
            dataSrc: img.getAttribute('data-src'),
            alt: img.alt,
            title: img.title,
            className: img.className,
            id: img.id,
            width: img.width,
            height: img.height,
            offsetParent: img.offsetParent ? img.offsetParent.className : null,
            visible: rect.width > 0 && rect.height > 0,
            style: img.getAttribute('style'),
            parentHTML: img.parentElement?.outerHTML?.substring(0, 200)
          });
        });

        // data URI 이미지
        Array.from(document.querySelectorAll('[style*="background-image"]')).forEach((el, idx) => {
          const style = el.getAttribute('style') || '';
          const match = style.match(/url\(['"]?([^'")\s]+)['"]?\)/);
          if (match && match[1]) {
            images.push({
              idx: -1,
              type: 'background-image',
              src: match[1],
              element: el.tagName,
              className: el.className,
              style: style.substring(0, 100)
            });
          }
        });

        // Picture 태그
        Array.from(document.querySelectorAll('picture')).forEach((pic, idx) => {
          Array.from(pic.querySelectorAll('source, img')).forEach(el => {
            const src = el.src || el.getAttribute('srcset');
            if (src) {
              images.push({
                type: 'picture',
                element: el.tagName,
                src: src.substring(0, 200)
              });
            }
          });
        });

        // srcset 분석
        Array.from(document.querySelectorAll('[srcset]')).forEach(el => {
          images.push({
            type: 'srcset',
            element: el.tagName,
            srcset: el.getAttribute('srcset')?.substring(0, 300)
          });
        });

        return {
          totalImages: images.length,
          images: images.slice(0, 50)
        };
      });

      console.log(`\n📷 이미지 데이터 (총 ${imageData.totalImages}개):`);

      // 게시글 관련 이미지만 필터링
      const postImages = imageData.images.filter(img =>
        img.src && img.src.includes('cdn.imweb.me') &&
        !img.src.includes('vendor') && !img.src.includes('logo') && !img.src.includes('profile')
      );

      console.log(`\n🎯 게시글 관련 이미지 (${postImages.length}개):`);
      postImages.forEach((img, idx) => {
        console.log(`\n${idx + 1}. [${img.type}]`);
        console.log(`   src: ${img.src?.substring(0, 120)}`);
        if (img.className) console.log(`   class: ${img.className}`);
        if (img.visible !== undefined) console.log(`   visible: ${img.visible}`);
      });

      // 개별 게시글 데이터 저장
      const postData = await page.evaluate(() => {
        const pageText = document.body.innerText;

        // 게시글 제목 찾기
        const titleMatch = pageText.match(/^[^\n]{10,100}/);

        // 게시글 이미지 섹션 찾기
        let imageSection = '';
        const lines = pageText.split('\n');
        let inImageSection = false;

        for (const line of lines) {
          if (line.includes('이미지') || line.includes('사진')) {
            inImageSection = true;
          }
          if (inImageSection && line.trim()) {
            imageSection += line + '\n';
          }
          if (inImageSection && imageSection.split('\n').length > 20) {
            break;
          }
        }

        return {
          title: titleMatch ? titleMatch[0] : '',
          imageSection: imageSection.substring(0, 500)
        };
      });

      console.log(`\n📝 게시글 정보:`);
      console.log(`   제목: ${postData.title}`);

      await page.waitForTimeout(500);
    }

  } catch (error) {
    console.error(`❌ 오류: ${error.message}`);
  } finally {
    await context.close();
    await browser.close();
  }
}

inspectPostImages().catch(err => {
  console.error('❌ 치명적 오류:', err.message);
  process.exit(1);
});
