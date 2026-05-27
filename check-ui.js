const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

(async () => {
  console.log('\n🔍 테스트 매물 조회\n');

  const { data: listings, error } = await supabase
    .from('listings')
    .select('id, idx, title, price, price_type, monthly_rent, deposit, premium_price, description, facilities')
    .in('idx', ['171322689', '171315260', '171314875'])
    .limit(1);

  if (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }

  if (!listings || listings.length === 0) {
    console.log('❌ 매물을 찾을 수 없습니다');
    process.exit(1);
  }

  const listing = listings[0];

  console.log(`📋 매물: ${listing.title}`);
  console.log(`   ID: ${listing.id}`);
  console.log(`   idx: ${listing.idx}`);
  console.log(`\n💰 가격 정보:`);
  console.log(`   가격 타입: ${listing.price_type}`);
  console.log(`   메인 가격: ${listing.price}만원`);
  console.log(`   월세: ${listing.monthly_rent}만원`);
  console.log(`   보증금: ${listing.deposit}만원`);
  console.log(`   권리금: ${listing.premium_price}만원`);
  console.log(`\n📸 시설:`);
  if (listing.facilities) {
    console.log(`   ${listing.facilities}`);
  }
  console.log(`\n📝 설명 첫 100글자:`);
  if (listing.description) {
    console.log(`   ${listing.description.substring(0, 100)}...`);
  }

  console.log(`\n🌐 UI 확인 URL:`);
  console.log(`   http://localhost:3001/listings/${listing.id}`);
  console.log(`\n✅ 체크리스트:`);
  console.log(`   [ ] 매물 목록 페이지에서 표시되는가?`);
  console.log(`   [ ] 사진이 정상 로드되는가?`);
  console.log(`   [ ] 월세가 메인 가격으로 표시되는가?`);
  console.log(`   [ ] 보증금/권리금이 보조로 표시되는가?`);
  console.log(`   [ ] 게시글 원문이 표시되는가?`);
  console.log(`   [ ] 시설정보가 칩으로 표시되는가?`);

  process.exit(0);
})();
