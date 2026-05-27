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
    console.log('📝 테스트 매물 생성 중...\n');

    // 1. 매물만 생성 (이미지는 나중에 추가)
    const { data: listing, error: insertError } = await supabase
      .from('listings')
      .insert([
        {
          idx: 'test-listing-001',
          title: '원주관설동 성인PC방',
          region: '강원도',
          location: '원주시 관설동',
          area_sqm: 18,
          floor: '1층',
          deposit: 2000,
          premium_price: 2000,
          monthly_rent: 120,
          facilities: 'PC 7대, 에어컨 1대',
          contact: '010-5879-3568',
          available_date: '항상',
          business_license: '있음',
          administrative_record: '없음',
          status: 'active',
          price_type: 'lease',
          price: 120,
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.log('❌ 매물 생성 실패:', insertError.message);
      return;
    }

    console.log('✅ 매물 생성 완료');
    console.log('   ID:', listing.id);
    console.log('   제목:', listing.title);
    console.log('\n🚀 이제 scrape-one-listing.js를 실행하세요');
    console.log('   node scripts/scrape-one-listing.js');

  } catch (e) {
    console.error('❌ 오류:', e.message);
  }
}

main();
