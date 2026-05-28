const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3002/secondhand', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Find grids and check content
    const grids = await page.locator('.grid').all();
    const cardGrid = grids[0]; // First grid is the card grid
    
    const text = await cardGrid.innerText();
    console.log('Card Grid Content:');
    console.log('─'.repeat(60));
    console.log(text);
    console.log('─'.repeat(60));
    
    if (text.includes('로딩')) {
      console.log('\n✅ Page is showing loading state');
    } else if (text.includes('물품이 없습니다')) {
      console.log('\n✅ Page is showing empty state (no items)');
    } else {
      console.log('\n✅ Page is displaying items or other content');
    }
    
  } finally {
    await browser.close();
  }
})();
