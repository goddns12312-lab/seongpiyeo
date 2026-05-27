#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  try {
    console.log('❌ listing_images 삭제 중...');

    const { error } = await supabase
      .from('listing_images')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 행 삭제

    if (error) {
      console.log('⚠️  오류:', error.message);
      return;
    }

    console.log('✅ 모든 listing_images 삭제 완료');
    console.log('\n🚀 이제 scrape-slow.js를 실행하세요');

  } catch (e) {
    console.error('❌ 오류:', e.message);
  }
}

main();
