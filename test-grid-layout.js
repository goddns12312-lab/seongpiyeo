const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3002/secondhand', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    
    // Find all grid containers
    const grids = await page.locator('.grid').all();
    console.log(`Found ${grids.length} grid containers\n`);
    
    for (let i = 0; i < grids.length; i++) {
      const grid = grids[i];
      const classes = await grid.getAttribute('class');
      const children = await grid.locator('> *').count();
      
      console.log(`Grid ${i + 1}:`);
      console.log(`  Classes: ${classes}`);
      console.log(`  Children: ${children}`);
      console.log(`  Contains grid-cols-1: ${classes.includes('grid-cols-1')}`);
      console.log(`  Contains sm:grid-cols-2: ${classes.includes('sm:grid-cols-2')}`);
      console.log(`  Contains lg:grid-cols-3: ${classes.includes('lg:grid-cols-3')}`);
      console.log(`  Contains xl:grid-cols-4: ${classes.includes('xl:grid-cols-4')}`);
      console.log('');
    }
    
  } finally {
    await browser.close();
  }
})();
