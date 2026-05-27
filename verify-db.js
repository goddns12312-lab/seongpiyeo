#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

(async () => {
  console.log('\n🔍 Supabase DB 검증\n');

  const { data: listings, error } = await supabase
    .from('listings')
    .select('id, idx, title, description, price, monthly_rent, deposit, premium_price, main_image_url, status')
    .in('idx', ['171315260', '171314875', '171271874', '171195106', '170842855'])
    .limit(5);

  if (error) {
    console.error('❌ DB 오류:', error);
    process.exit(1);
  }

  if (!listings || listings.length === 0) {
    console.log('❌ Supabase에 데이터 없음');
    process.exit(1);
  }

  console.log(`✅ ${listings.length}개 항목 발견\n`);
  console.log('════'.repeat(20));

  listings.forEach((l, i) => {
    console.log(`\n[${i+1}] idx=${l.idx} | ${l.title}`);
    console.log(`   ✅ Status: ${l.status}`);
    console.log(`   💰 가격 정보:`);
    console.log(`      - 월세: ${l.monthly_rent}만원`);
    console.log(`      - 보증금: ${l.deposit}만원`);
    console.log(`      - 권리금: ${l.premium_price}만원`);
    console.log(`   📸 Main Image: ${l.main_image_url ? '✅ ' + l.main_image_url.substring(0, 60) + '...' : '❌ 없음'}`);

    if (l.description) {
      console.log(`   📝 Description 검증:`);

      // Check for item 12
      if (l.description.includes('12. 연락처')) {
        console.log(`      ✅ Item 12 (연락처) 포함`);
        const match = l.description.match(/12\.\s*연락처\s*[:：]\s*([^\n]+)/);
        if (match) {
          console.log(`         연락처: ${match[1].trim()}`);
        }
      } else {
        console.log(`      ❌ Item 12 (연락처) 없음`);
      }

      // Check for free-form text
      const lines = l.description.split('\n');
      const item12Line = lines.findIndex(l => l.includes('12. 연락처'));
      if (item12Line !== -1 && item12Line < lines.length - 1) {
        const afterItem12 = lines.slice(item12Line + 1).join('\n').trim();
        if (afterItem12.length > 0 && !afterItem12.includes('PC방 사고') && !afterItem12.includes('Copyright')) {
          console.log(`      ✅ 자유문단 포함 (${afterItem12.substring(0, 50)}...)`);
        }
      }

      // Check for site notice filtering
      if (!l.description.includes('매장 사진이 있으면 꼭')) {
        console.log(`      ✅ "매장 사진이 있으면..." 공지문 제외`);
      } else {
        console.log(`      ❌ 공지문 포함됨`);
      }
    }
  });

  console.log('\n' + '════'.repeat(20));
  console.log('\n📊 최종 요약:');
  const withImages = listings.filter(l => l.main_image_url);
  console.log(`✅ 이미지 있는 항목: ${withImages.length}/${listings.length}`);
  const allPending = listings.every(l => l.status === 'pending' || l.status === 'active');
  console.log(`✅ Status 정상: ${allPending ? '예' : '아니오'}`);

  process.exit(0);
})();
