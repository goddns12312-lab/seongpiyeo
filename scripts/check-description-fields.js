#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function main() {
  console.log('🔍 description vs facilities 필드 검증\n');

  const { data: listings, error } = await supabase
    .from('listings')
    .select('id, idx, title, description, facilities')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ 조회 실패:', error.message);
    process.exit(1);
  }

  if (!listings || listings.length === 0) {
    console.log('✅ 매물이 없습니다.');
    process.exit(0);
  }

  console.log(`총 ${listings.length}개 매물 검사\n`);
  console.log('='.repeat(80));

  listings.forEach((listing, index) => {
    const title = listing.title.substring(0, 40);
    const id = listing.id.substring(0, 8);

    console.log(`\n[${index + 1}] ${title} (${id}...)`);
    console.log(`   idx: ${listing.idx}`);
    console.log(`\n   📝 Description (설명):`);
    console.log(`   ${listing.description ? listing.description.substring(0, 100) : '(없음)'}`);
    console.log(`\n   🏗️ Facilities (매물강점):`);
    console.log(`   ${listing.facilities ? listing.facilities.substring(0, 100) : '(없음)'}`);

    // 문제 진단
    const hasDescription = !!listing.description;
    const hasFacilities = !!listing.facilities;

    if (!hasDescription && !hasFacilities) {
      console.log(`\n   ⚠️  문제: 둘 다 없음`);
    } else if (listing.description && listing.description.includes('PC') && listing.description.includes('대')) {
      console.log(`\n   ⚠️  문제: description이 facilities 같은 텍스트 포함 (예: "PC7대")`);
    } else if (!hasDescription) {
      console.log(`\n   ⚠️  경고: description 없음`);
    } else {
      console.log(`\n   ✅ OK`);
    }

    console.log('   ' + '-'.repeat(76));
  });

  console.log('\n' + '='.repeat(80));
  console.log('✅ 검증 완료');
}

main().catch(err => {
  console.error('❌ 오류:', err.message);
  process.exit(1);
});
