const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('\n=== Testing Form Page ===\n');
    
    // Try to access form directly
    console.log('📍 Accessing /secondhand/new (not logged in)');
    await page.goto('http://localhost:3002/secondhand/new');
    
    const url1 = page.url();
    console.log(`✅ Redirects to: ${url1}`);
    
    if (url1.includes('/login')) {
      console.log('✅ Correctly enforces authentication\n');
      
      // The form should have login page
      const loginText = await page.innerText('body').catch(() => '');
      console.log(`✅ Shows login page: ${loginText.includes('로그인') || loginText.includes('login') ? 'yes' : 'check'}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
