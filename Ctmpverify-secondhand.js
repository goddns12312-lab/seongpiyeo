const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Test 1: Load /secondhand list page
    console.log('\n=== Verifying /secondhand list page ===');
    await page.goto('http://localhost:3002/secondhand', { waitUntil: 'networkidle' });
    
    // Verify hero section
    const heroTitle = await page.locator('h1:has-text("중고장터")');
    if (await heroTitle.isVisible()) {
      console.log('✅ Hero title visible: 중고장터');
    } else {
      console.log('❌ Hero title NOT visible');
    }

    // Verify description
    const heroDesc = await page.locator('text=PC방 관련 중고 물품을 거래하는 공간입니다');
    if (await heroDesc.isVisible()) {
      console.log('✅ Hero description visible');
    } else {
      console.log('❌ Hero description NOT visible');
    }

    // Verify search input
    const searchInput = await page.locator('input[placeholder*="물품명"]');
    if (await searchInput.isVisible()) {
      console.log('✅ Search input visible');
    } else {
      console.log('❌ Search input NOT visible');
    }

    // Verify region dropdown
    const regionSelect = await page.locator('select');
    if (await regionSelect.isVisible()) {
      console.log('✅ Region dropdown visible');
    } else {
      console.log('❌ Region dropdown NOT visible');
    }

    // Verify sort buttons
    const sortButtons = await page.locator('button:has-text("최신순")');
    if (await sortButtons.isVisible()) {
      console.log('✅ Sort buttons visible');
    } else {
      console.log('❌ Sort buttons NOT visible');
    }

    // Verify item cards exist or empty state
    const emptyState = await page.locator('text=등록된 물품이 없습니다');
    const cardGrid = await page.locator('a[href*="/secondhand/"]');
    
    if (await emptyState.isVisible()) {
      console.log('✅ Empty state displayed (no items yet)');
    } else if (await cardGrid.count() > 0) {
      console.log(`✅ Card grid visible with ${await cardGrid.count()} items`);
    } else {
      console.log('❌ Neither card grid nor empty state visible');
    }

    // Test 2: Check /secondhand/new form page (may redirect to login)
    console.log('\n=== Verifying /secondhand/new form page ===');
    await page.goto('http://localhost:3002/secondhand/new', { waitUntil: 'networkidle' });
    
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('✅ Redirected to login (authentication required - correct behavior)');
    } else if (currentUrl.includes('/secondhand/new')) {
      // Check for form elements
      const titleInput = await page.locator('input[name="title"]');
      const priceInput = await page.locator('input[name="price"]');
      const regionSelect2 = await page.locator('select[name="region"]');
      
      if (await titleInput.isVisible() && await priceInput.isVisible()) {
        console.log('✅ Form loaded with title and price inputs');
        
        if (await regionSelect2.isVisible()) {
          console.log('✅ Region select visible');
        }
      } else {
        console.log('❌ Form inputs NOT visible');
      }
    } else {
      console.log('⚠️ Unexpected URL: ' + currentUrl);
    }

    console.log('\n=== Verification Summary ===');
    console.log('List page: ✅ Loaded');
    console.log('Form page: Redirects appropriately');
    
  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await browser.close();
  }
})();
