/**
 * 지역 데이터 불일치·누락 감사 (dry-run)
 * 사용: node scripts/audit-listing-regions.js [--execute]
 *
 * .env.local 의 SUPABASE 키 필요
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const { createClient } = require('@supabase/supabase-js');

const REGIONS = [
  '서울', '경기도', '인천', '부산', '대구', '광주', '대전', '울산', '세종',
  '강원도', '충청북도', '충청남도', '전라북도', '전라남도', '경상북도', '경상남도', '제주도',
];

const REGION_ALIASES = {
  서울: '서울', 서울시: '서울', 서울특별시: '서울',
  경기: '경기도', 경기도: '경기도',
  인천: '인천', 인천시: '인천', 인천광역시: '인천',
  부산: '부산', 부산시: '부산', 부산광역시: '부산',
  대구: '대구', 대구시: '대구', 대구광역시: '대구',
  광주: '광주', 광주시: '광주', 광주광역시: '광주',
  대전: '대전', 대전시: '대전', 대전광역시: '대전',
  울산: '울산', 울산시: '울산', 울산광역시: '울산',
  세종: '세종', 세종시: '세종', 세종특별자치시: '세종',
  강원: '강원도', 강원도: '강원도',
  충북: '충청북도', 충청북도: '충청북도',
  충남: '충청남도', 충청남도: '충청남도',
  전북: '전라북도', 전라북도: '전라북도',
  전남: '전라남도', 전라남도: '전라남도',
  경북: '경상북도', 경상북도: '경상북도',
  경남: '경상남도', 경상남도: '경상남도',
  제주: '제주도', 제주도: '제주도',
};

const REGION_MATCH_TERMS = [...new Set([...REGIONS, ...Object.keys(REGION_ALIASES)])].sort(
  (a, b) => b.length - a.length
);

function normalizeRegion(value) {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  if (REGION_ALIASES[trimmed]) return REGION_ALIASES[trimmed];
  if (REGIONS.includes(trimmed)) return trimmed;
  return null;
}

function extractFromTitle(title) {
  if (!title?.trim()) return null;
  const text = title.replace(/\s+/g, ' ').trim();
  let matchedTerm = null;
  let matchIndex = -1;

  for (const term of REGION_MATCH_TERMS) {
    const idx = text.indexOf(term);
    if (idx !== -1) {
      matchedTerm = term;
      matchIndex = idx;
      break;
    }
  }

  if (!matchedTerm) return null;

  const region = REGION_ALIASES[matchedTerm] || normalizeRegion(matchedTerm) || matchedTerm;
  const afterRegion = text.slice(matchIndex + matchedTerm.length).trim();
  const districtMatch = afterRegion.match(/^([가-힣]{2,12}(?:시|군|구))/);
  const district = districtMatch?.[1];
  const remainder = district ? afterRegion.slice(district.length).trim() : afterRegion;
  const localityMatch = remainder.match(/([가-힣]{2,12}동)/);
  const locality = localityMatch?.[1];

  return { region, district, locality };
}

function suggestFixes(listing) {
  const fromTitle = extractFromTitle(listing.title);
  const dbRegion = normalizeRegion(listing.region) || listing.region;
  const updates = {};
  const reasons = [];

  if (
    fromTitle?.region &&
    dbRegion &&
    normalizeRegion(fromTitle.region) !== normalizeRegion(dbRegion)
  ) {
    updates.region = normalizeRegion(fromTitle.region) || fromTitle.region;
    reasons.push(`region: ${listing.region} → ${updates.region}`);
  }

  if (!listing.district && fromTitle?.district) {
    updates.district = fromTitle.district;
    reasons.push(`district: (empty) → ${updates.district}`);
  }

  if (!listing.location && fromTitle?.locality) {
    updates.location = fromTitle.locality;
    reasons.push(`location: (empty) → ${updates.location}`);
  }

  return { updates, reasons, fromTitle, regionMismatch: reasons.some((r) => r.startsWith('region:')) };
}

async function main() {
  const execute = process.argv.includes('--execute');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('❌ .env.local 에 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필요');
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const { data: listings, error } = await supabase
    .from('listings')
    .select('id, title, region, district, location, status')
    .eq('status', 'active');

  if (error) {
    console.error('❌ 조회 실패:', error.message);
    process.exit(1);
  }

  const fixes = [];
  let mismatchCount = 0;
  let emptyDistrictCount = 0;

  for (const listing of listings) {
    if (!listing.district) emptyDistrictCount++;
    const { updates, reasons, regionMismatch } = suggestFixes(listing);
    if (regionMismatch) mismatchCount++;
    if (Object.keys(updates).length > 0) {
      fixes.push({ id: listing.id, title: listing.title, updates, reasons });
    }
  }

  console.log(`\n📊 active 매물 ${listings.length}건`);
  console.log(`   district 비어있음: ${emptyDistrictCount}건`);
  console.log(`   region/title 불일치: ${mismatchCount}건`);
  console.log(`   자동 보정 가능: ${fixes.length}건\n`);

  fixes.slice(0, 30).forEach((f, i) => {
    console.log(`${i + 1}. [${f.id}] ${f.title}`);
    f.reasons.forEach((r) => console.log(`   → ${r}`));
  });

  if (fixes.length > 30) {
    console.log(`\n... 외 ${fixes.length - 30}건 (전체 목록은 --execute 시 적용)`);
  }

  if (!execute) {
    console.log('\n💡 DB 반영: node scripts/audit-listing-regions.js --execute');
    return;
  }

  console.log('\n🔧 DB 업데이트 시작...');
  let ok = 0;
  let fail = 0;

  for (const f of fixes) {
    const { error: updateError } = await supabase
      .from('listings')
      .update(f.updates)
      .eq('id', f.id);

    if (updateError) {
      fail++;
      console.error(`❌ ${f.id}: ${updateError.message}`);
    } else {
      ok++;
    }
  }

  console.log(`\n✅ 완료: ${ok}건 성공, ${fail}건 실패`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
