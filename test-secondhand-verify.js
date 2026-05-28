const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('\n=== Testing Secondhand Pages ===\n');
    
    console.log('📍 Step 1: Load /secondhand page');
    await page.goto('http://localhost:3002/secondhand', { waitUntil: 'networkidle' });
    console.log('✅ Page loaded');
    
    // Wait for potential loading to complete
    await page.waitForTimeout(2000);
    
    // Check hero section
    const heroSection = await page.locator('.bg-gradient-to-b').first();
    if (await heroSection.isVisible()) {
      const heroTitle = await page.locator('h1').first().textContent();
      const heroDesc = await page.locator('h1').first().evaluate(el => el.nextElementSibling?.textContent);
      console.log(`✅ Hero title: "${heroTitle}"`);
      console.log(`✅ Hero found with title`);
    }
    
    // Check search/filter area
    const searchInput = await page.locator('input[placeholder*="물품명"]');
    if (await searchInput.isVisible()) {
      console.log(`✅ Search input visible`);
    }
    
    const regionDropdown = await page.locator('select').first();
    if (await regionDropdown.isVisible()) {
      const regions = await regionDropdown.locator('option').allTextContents();
      console.log(`✅ Region dropdown with ${regions.length} regions`);
    }
    
    const sortButtons = await page.locator('button').filter({ hasText: '최신순' });
    if (await sortButtons.isVisible()) {
      console.log(`✅ Sort buttons visible (최신순 found)`);
    }
    
    // Check grid and content
    const gridContainer = await page.locator('.grid[class*="grid-cols"]').nth(1);
    const contentText = await page.locator('text=로딩 중|등록된 물품이 없습니다').first().textContent();
    console.log(`✅ Grid status: "${contentText}"`);
    
    console.log('\n📍 Step 2: Test /secondhand/new page');
    await page.goto('http://localhost:3002/secondhand/new', { waitUntil: 'networkidle' });
    const pageUrl = page.url();
    
    if (pageUrl.includes('/login')) {
      console.log(`✅ Correctly redirects to login (expected when not authenticated)`);
      console.log(`✅ URL: ${pageUrl}`);
    } else {
      const formTitle = await page.locator('h1').first().textContent();
      console.log(`✅ Form page loaded with title: "${formTitle}"`);
      
      // Check form fields
      const titleInput = await page.locator('input[name="title"]');
      const descInput = await page.locator('textarea[name="description"]');
      const priceInput = await page.locator('input[name="price"]');
      const regionSelect = await page.locator('select[name="region"]');
      const imageInput = await page.locator('input[type="file"]');
      
      if (await titleInput.isVisible()) console.log(`✅ Title input field`);
      if (await descInput.isVisible()) console.log(`✅ Description textarea`);
      if (await priceInput.isVisible()) console.log(`✅ Price input field`);
      if (await regionSelect.isVisible()) console.log(`✅ Region dropdown`);
      if (await imageInput.isVisible()) console.log(`✅ Image upload input`);
      
      // Check submit button
      const submitBtn = await page.locator('button').filter({ hasText: '등록하기' });
      if (await submitBtn.isVisible()) console.log(`✅ Submit button`);
    }
    
    console.log('\n=== All Checks Complete ===\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
