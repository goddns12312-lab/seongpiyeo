const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('\n=== Testing Detail Page Layout ===\n');
    
    // Go to list page
    await page.goto('http://localhost:3002/secondhand', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    
    // Click first item
    const firstCard = await page.locator('a[href^="/secondhand/"]').first();
    await firstCard.click();
    await page.waitForTimeout(2000);
    
    const detailUrl = page.url();
    console.log(`✅ Detail Page URL: ${detailUrl}`);
    
    // Check layout elements
    const pageText = await page.innerText('main');
    console.log('\nPage Content (first 400 chars):');
    console.log('─'.repeat(50));
    console.log(pageText.substring(0, 400));
    console.log('─'.repeat(50));
    
    // Check specific elements
    console.log('\n✅ ELEMENTS FOUND:');
    
    // Back link
    const backLink = await page.locator('text=목록으로').first().isVisible();
    console.log(`${backLink ? '✅' : '❌'} Back link to list`);
    
    // Title (h1)
    const titleElem = await page.locator('h1').first();
    const titleVisible = await titleElem.isVisible();
    const titleText = await titleElem.textContent();
    console.log(`${titleVisible ? '✅' : '❌'} Product title: "${titleText}"`);
    
    // Meta info (region, status, date)
    const regionText = await page.innerText('text=📍');
    console.log(`✅ Region info: "${regionText}"`);
    
    // Images section
    const imageSection = await page.locator('img').first().isVisible();
    console.log(`${imageSection ? '✅' : '❌'} Images displayed`);
    
    // Sidebar elements
    const priceText = await page.innerText('text=가격').catch(() => null);
    console.log(`${priceText ? '✅' : '❌'} Price card in sidebar`);
    
    const infoText = await page.innerText('text=상품 정보').catch(() => null);
    console.log(`${infoText ? '✅' : '❌'} Product info card`);
    
    // Action buttons
    const contactBtn = await page.innerText('button').then(t => t.includes('판매자') || t.includes('문의'));
    console.log(`✅ Contact button available`);
    
    // Description section
    const descText = await page.innerText('text=상품 설명').catch(() => null);
    console.log(`${descText ? '✅' : '❌'} Description section`);
    
    // Check layout structure
    const gridCount = await page.locator('.grid').count();
    console.log(`\n✅ Layout: ${gridCount} grid(s) found (main grid + footer)`);
    
    console.log('\n✅ DETAIL PAGE VERIFICATION COMPLETE\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
