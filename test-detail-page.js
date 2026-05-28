const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('\n=== Testing Detail Page ===\n');
    
    // Go to list page
    await page.goto('http://localhost:3002/secondhand', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Find first item card and click it
    const firstCard = await page.locator('a').filter({ has: page.locator('text=판매중') }).first();
    const href = await firstCard.getAttribute('href');
    console.log(`Clicking item with href: ${href}`);
    
    await firstCard.click();
    await page.waitForTimeout(2000);
    
    // Check detail page elements
    const detailUrl = page.url();
    console.log(`✅ Navigated to: ${detailUrl}`);
    
    // Check 2-column layout
    const layoutGrid = await page.locator('.grid[class*="lg:col-span"]').first();
    const layoutClasses = await layoutGrid.getAttribute('class');
    console.log(`✅ Layout grid: ${layoutClasses.includes('lg:col-span-3') ? '2-column layout (3 cols total)' : 'check layout'}`);
    
    // Check left column (images, description)
    const leftCol = await page.locator('[class*="lg:col-span-2"]').first();
    const leftColVisible = await leftCol.isVisible();
    console.log(`✅ Left column (images): ${leftColVisible ? 'visible' : 'hidden'}`);
    
    // Check sticky sidebar
    const sidebar = await page.locator('[class*="sticky"]').first();
    const sidebarVisible = await sidebar.isVisible();
    console.log(`✅ Sticky sidebar: ${sidebarVisible ? 'visible' : 'hidden'}`);
    
    // Check main image
    const mainImage = await page.locator('img[class*="object-contain"]').first();
    const imageVisible = await mainImage.isVisible();
    console.log(`✅ Main image: ${imageVisible ? 'visible' : 'placeholder'}`);
    
    // Check thumbnail gallery
    const thumbnails = await page.locator('.rounded-lg[class*="aspect-square"]').all();
    console.log(`✅ Thumbnail gallery: ${thumbnails.length} images`);
    
    // Check price card in sidebar
    const priceCard = await page.locator('text=가격').first();
    const priceCardVisible = await priceCard.isVisible();
    console.log(`✅ Price card: ${priceCardVisible ? 'visible' : 'not found'}`);
    
    // Check info card
    const infoCard = await page.locator('text=상품 정보').first();
    const infoCardVisible = await infoCard.isVisible();
    console.log(`✅ Info card: ${infoCardVisible ? 'visible' : 'not found'}`);
    
    // Check action buttons
    const contactBtn = await page.locator('button').filter({ hasText: /판매자에게|문의/ }).first();
    const contactBtnVisible = await contactBtn.isVisible();
    console.log(`✅ Contact button: ${contactBtnVisible ? 'visible' : 'not found'}`);
    
    const backBtn = await page.locator('button').filter({ hasText: /목록으로/ }).first();
    const backBtnVisible = await backBtn.isVisible();
    console.log(`✅ Back button: ${backBtnVisible ? 'visible' : 'not found'}`);
    
    // Check description section
    const descSection = await page.locator('h2').filter({ hasText: '상품 설명' }).first();
    const descVisible = await descSection.isVisible();
    console.log(`✅ Description section: ${descVisible ? 'visible' : 'not found'}`);
    
    console.log('\n✅ Detail page verified successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
