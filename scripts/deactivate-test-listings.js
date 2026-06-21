/**
 * 테스트·스팸 매물 비활성화 (status → hidden)
 * 사용: node scripts/deactivate-test-listings.js [--execute]
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const { createClient } = require('@supabase/supabase-js');

function isLikelyTestListing(listing) {
  const title = String(listing.title || '').trim();
  if (!title) return true;

  const compact = title.replace(/\s/g, '');
  const hasKorean = /[가-힣]/.test(title);

  if (compact.length >= 8 && /^(.)\1{5,}$/.test(compact)) return true;
  if (/^[\d\s]+$/.test(title) && title.replace(/\s/g, '').length >= 6) return true;
  if (/d{6,}/i.test(compact)) return true;
  if (title.length <= 2) return true;

  const monthly = Number(listing.monthly_rent) || 0;
  const premium = Number(listing.premium_price) || 0;
  const deposit = Number(listing.deposit) || 0;
  const absurdPrice = monthly > 50000 || premium > 50000 || deposit > 50000;
  if (absurdPrice && !hasKorean) return true;
  if (absurdPrice && compact.length <= 8) return true;

  return false;
}

async function main() {
  const execute = process.argv.includes('--execute');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('❌ .env.local 에 SUPABASE 키 필요');
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const { data: listings, error } = await supabase
    .from('listings')
    .select('id, title, monthly_rent, premium_price, deposit, status')
    .eq('status', 'active');

  if (error) {
    console.error('❌ 조회 실패:', error.message);
    process.exit(1);
  }

  const targets = listings.filter(isLikelyTestListing);

  console.log(`\n📊 active ${listings.length}건 중 테스트·스팸 의심 ${targets.length}건\n`);
  targets.forEach((row, i) => {
    console.log(`${i + 1}. [${row.id}] ${row.title}`);
  });

  if (!execute) {
    console.log('\n💡 DB 반영: node scripts/deactivate-test-listings.js --execute');
    return;
  }

  if (targets.length === 0) {
    console.log('\n✅ 처리할 매물 없음');
    return;
  }

  console.log('\n🔧 status → hidden 처리 중...');
  let ok = 0;
  let fail = 0;

  for (const row of targets) {
    const { error: updateError } = await supabase
      .from('listings')
      .update({ status: 'hidden' })
      .eq('id', row.id);

    if (updateError) {
      fail++;
      console.error(`❌ ${row.id}: ${updateError.message}`);
    } else {
      ok++;
    }
  }

  console.log(`\n✅ 완료: ${ok}건 hidden, ${fail}건 실패`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
