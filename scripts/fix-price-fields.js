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
  console.log('🔧 PC방 매물 가격 필드 일괄 보정 시작\n');

  const { data: listings, error: fetchError } = await supabase
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false });

  if (fetchError) {
    console.error('❌ 매물 조회 실패:', fetchError.message);
    process.exit(1);
  }

  if (!listings || listings.length === 0) {
    console.log('✅ 매물이 없습니다.');
    process.exit(0);
  }

  console.log(`총 ${listings.length}개 매물 검사\n`);
  console.log('='.repeat(70));

  let updated = 0;
  let skipped = 0;

  for (const listing of listings) {
    const title = listing.title.substring(0, 40);
    const id = listing.id.substring(0, 8);

    // 현재 값
    const currentPrice = listing.price;
    const currentPriceType = listing.price_type;
    const monthlyRent = listing.monthly_rent;
    const premiumPrice = listing.premium_price;
    const deposit = listing.deposit;

    // 보정 필요 여부 확인
    const needsUpdate = currentPriceType !== 'lease' || currentPrice !== monthlyRent;

    if (!needsUpdate) {
      console.log(`✅ ${title} (${id}...)`);
      console.log(`   월세: ${monthlyRent}만원, 권리금: ${premiumPrice}만원, 보증금: ${deposit}만원, type: lease`);
      skipped++;
    } else {
      // 보정
      const { error: updateError } = await supabase
        .from('listings')
        .update({
          price_type: 'lease',
          price: monthlyRent
        })
        .eq('id', listing.id);

      if (updateError) {
        console.log(`❌ ${title} (${id}...) - 업데이트 실패: ${updateError.message}`);
      } else {
        console.log(`🔧 ${title} (${id}...) - 수정됨`);
        console.log(`   ✅ price_type: ${currentPriceType} → lease`);
        console.log(`   ✅ price: ${currentPrice} → ${monthlyRent}`);
        console.log(`   월세: ${monthlyRent}만원, 권리금: ${premiumPrice}만원, 보증금: ${deposit}만원`);
        updated++;
      }
    }
    console.log('');
  }

  console.log('='.repeat(70));
  console.log('📊 보정 결과');
  console.log('='.repeat(70));
  console.log(`✅ 이미 정상: ${skipped}개`);
  console.log(`🔧 수정됨: ${updated}개`);
  console.log(`합계: ${listings.length}개`);

  if (updated > 0) {
    console.log('\n✨ 모든 매물이 월세 중심으로 보정되었습니다!');
    console.log('다음: npm run dev → 목록 페이지 새로고침');
  } else {
    console.log('\n✅ 모든 매물이 이미 정상입니다.');
  }

  process.exit(0);
}

main().catch(err => {
  console.error('❌ 오류:', err.message);
  process.exit(1);
});
