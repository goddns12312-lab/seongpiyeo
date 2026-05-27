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
  console.log('🔧 description 필드 초기화\n');
  console.log('문제: description 필드가 facilities 데이터로 채워져 있음');
  console.log('해결: description 필드를 NULL로 초기화하여 다시 스크래핑 가능하도록 함\n');

  const { data: listings, error: fetchError } = await supabase
    .from('listings')
    .select('id, idx, title, description, facilities')
    .order('created_at', { ascending: false });

  if (fetchError) {
    console.error('❌ 조회 실패:', fetchError.message);
    process.exit(1);
  }

  if (!listings || listings.length === 0) {
    console.log('✅ 매물이 없습니다.');
    process.exit(0);
  }

  console.log(`총 ${listings.length}개 매물 검사\n`);
  console.log('='.repeat(70));

  // 문제 있는 매물 찾기 (description === facilities)
  const needsClearing = listings.filter(l =>
    l.description &&
    l.facilities &&
    l.description.trim() === l.facilities.trim()
  );

  console.log(`\n⚠️  문제 발견: ${needsClearing.length}개 매물`);
  console.log(`   (description과 facilities가 동일한 매물)\n`);

  if (needsClearing.length === 0) {
    console.log('✅ 문제 없음 - 모든 매물의 description이 올바릅니다.');
    process.exit(0);
  }

  needsClearing.forEach((listing, i) => {
    console.log(`[${i + 1}] ${listing.title.substring(0, 40)}`);
    console.log(`    현재 description: ${listing.description.substring(0, 60)}...`);
  });

  console.log('\n' + '='.repeat(70));
  console.log('🔄 초기화 진행...\n');

  let updated = 0;

  for (const listing of needsClearing) {
    const { error: updateError } = await supabase
      .from('listings')
      .update({ description: null })
      .eq('id', listing.id);

    if (updateError) {
      console.log(`❌ ${listing.title.substring(0, 40)} - 실패: ${updateError.message}`);
    } else {
      console.log(`✅ ${listing.title.substring(0, 40)} - 초기화됨`);
      updated++;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ 완료');
  console.log('='.repeat(70));
  console.log(`초기화된 매물: ${updated}개`);
  console.log(`\n📝 다음 단계:`);
  console.log(`1. 수정된 auto-scraper.js를 사용하여 다시 스크래핑`);
  console.log(`2. node scripts/auto-scraper.js --update`);
  console.log(`3. npm run import (또는 node scripts/import-to-supabase.js)`);

  process.exit(0);
}

main().catch(err => {
  console.error('❌ 오류:', err.message);
  process.exit(1);
});
