const { chromium } = require('playwright');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // 모든 콘솔 로그 캡처
  const logs = [];
  page.on('console', (msg) => {
    const text = msg.text();
    logs.push(text);
    console.log('[JS 콘솔]', text);
  });

  console.log('[디버그] Supabase에 테스트 사용자 생성...\n');

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const username = 'debugtest_' + Date.now();
  const password = 'DebugTest123!';
  const hash = await bcrypt.hash(password, 10);

  const { data: user } = await supabase.from('profiles').insert({
    username, password_hash: hash, nickname: 'Debug', role: 'user'
  }).select('id').single();

  console.log('[디버그] 사용자:', username, '\n');

  await page.goto('http://localhost:3002/login', { waitUntil: 'networkidle' });

  const idField = await page.locator('input[placeholder*="아이디"]').first();
  const pwField = await page.locator('input[type="password"]').first();

  console.log('[디버그] 로그인 정보 입력...\n');
  await idField.fill(username);
  await pwField.fill(password);

  const btn = await page.locator('button:has-text("로그인")').first();
  await btn.click();

  await page.waitForTimeout(2000);

  console.log('\n[수집된 모든 콘솔 로그]\n');
  logs.forEach(log => {
    if (log.includes('[')) console.log(log);
  });

  const cookies = await page.context().cookies();
  console.log('\n[브라우저 쿠키]\n개수:', cookies.length);
  cookies.forEach(c => console.log('-', c.name));

  await browser.close();
}

test().catch(console.error);
