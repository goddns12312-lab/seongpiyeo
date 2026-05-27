#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STORAGE_BUCKET = 'listings';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ 환경변수 오류: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필수');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

const DRY_RUN = process.argv.includes('--dry-run');

// Utility functions
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 전화번호 정규화
function normalizePhoneNumber(phone) {
  if (!phone) return null;
  const cleaned = String(phone).replace(/[^\d]/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('010')) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

// location 기반 region 추출
function extractRegionFromLocation(location) {
  if (!location) return '서울';
  const REGIONS = {
    '서울': ['서울', '강서', '강남', '강동', '강북', '마포', '서초', '구로', '영등포'],
    '경기': ['경기', '수원', '성남', '안양', '부천', '용인', '시흥', '안산', '화성', '평택', '파주', '광주', '광명', '고양', '김포', '이천', '하남'],
    '인천': ['인천'], '부산': ['부산'], '대구': ['대구'], '광주': ['광주'],
    '대전': ['대전'], '울산': ['울산'], '세종': ['세종'],
    '강원': ['강원', '춘천', '원주', '강릉'], '충북': ['충북', '청주', '충주'],
    '충남': ['충남', '천안', '공주'], '전북': ['전북', '전주'], '전남': ['전남', '목포'],
    '경북': ['경북', '포항', '경주'], '경남': ['경남', '창원', '진주'], '제주': ['제주']
  };
  const lowerLocation = location.toLowerCase();
  for (const [region, keywords] of Object.entries(REGIONS)) {
    if (keywords.some(k => lowerLocation.includes(k.toLowerCase()))) return region;
  }
  return '서울';
}

async function withRetry(fn, maxRetries = 3, initialDelayMs = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      const delayMs = initialDelayMs * Math.pow(2, i);
      console.warn(`  ⚠️  재시도 대기 중... (${delayMs}ms)`);
      await sleep(delayMs);
    }
  }
}

function parseKoreanPrice(str) {
  if (!str) return null;
  str = String(str).trim();

  // Handle "120 관리7" → "120"
  const cleanStr = str.split(/\s+/)[0];

  // Handle "2천만원" → 2000 (만원 단위)
  const chunMatch = cleanStr.match(/(\d+)천(\d*)만?/);
  if (chunMatch) {
    const thousands = parseInt(chunMatch[1]);
    const hundreds = parseInt(chunMatch[2] || 0);
    return thousands * 1000 + hundreds * 100;
  }

  // Handle "1,300만원" or "120만원" → keep as is
  const manMatch = cleanStr.match(/^(\d+(?:,\d+)?)\s*만?/);
  if (manMatch) {
    return parseInt(manMatch[1].replace(/,/g, ''));
  }

  // Plain number
  const numMatch = cleanStr.match(/^(\d+)/);
  if (numMatch) {
    return parseInt(numMatch[1]);
  }

  return null;
}

function extractRegion(location) {
  if (!location) return '서울';

  const REGIONS = [
    '서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산',
    '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'
  ];

  for (const region of REGIONS) {
    if (location.includes(region)) return region;
  }

  // Seoul districts
  const SEOUL_KEYWORDS = [
    '강서', '강남', '강동', '강북', '마포', '서초', '구로', '영등포',
    '종로', '중구', '노원', '관악', '동작', '동대문', '화곡', '답십리',
    '상계'
  ];

  if (SEOUL_KEYWORDS.some(k => location.includes(k))) {
    return '서울';
  }

  return '서울'; // Default to Seoul
}

function mapBusinessLicense(value) {
  if (!value) return null;
  const str = String(value).toLowerCase();
  if (str.includes('있음') || str.includes('허가증') || str.includes('yes')) {
    return 'yes';
  }
  if (str.includes('없음') || str.includes('no')) {
    return 'no';
  }
  return null; // Default: don't include if doesn't match constraint
}

async function uploadImage(localPath, storagePath) {
  return withRetry(async () => {
    if (!fs.existsSync(localPath)) {
      throw new Error(`파일 없음: ${localPath}`);
    }

    const buffer = fs.readFileSync(localPath);
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        upsert: true,
        contentType: 'image/jpeg'
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    return data.publicUrl;
  });
}

async function importListing(scraped, index, total) {
  const { idx, title: rawTitle } = scraped;

  console.log(`\n[${index}/${total}] ${idx} - ${rawTitle}`);

  // 기존 매물의 status 조회 (덮어쓰지 않기 위함)
  let existingStatus = 'active'; // 기본값
  try {
    const { data: existing } = await supabase
      .from('listings')
      .select('status')
      .eq('idx', idx)
      .single();

    if (existing && existing.status) {
      existingStatus = existing.status;
    }
  } catch (err) {
    // 기존 데이터 없음 - 기본값 사용
  }

  // Upload images
  console.log('  📸 이미지 업로드 중...');
  const imageUrls = [];
  const imagesDir = path.join(__dirname, 'output', 'images', String(idx));

  if (fs.existsSync(imagesDir)) {
    const files = fs.readdirSync(imagesDir)
      .filter(f => /\.(jpg|jpeg|png|gif)$/i.test(f))
      .sort();

    for (const file of files) {
      try {
        const localPath = path.join(imagesDir, file);
        const storagePath = `${idx}/${file}`;
        const url = await uploadImage(localPath, storagePath);
        imageUrls.push(url);
        console.log(`    ✅ ${file}`);
      } catch (err) {
        console.warn(`    ⚠️  업로드 실패: ${file} - ${err.message}`);
      }
    }
  }

  // 🚨 실제 사진이 없으면 skip (중요!)
  if (imageUrls.length === 0) {
    console.log(`  ⏭️  스킵 (실제 사진 없음): idx=${scraped.idx}`);
    return null;
  }

  const thumbnailUrl = imageUrls[0];
  const mainImageUrl = imageUrls[0];

  // Transform data
  console.log('  🔄 데이터 변환 중...');

  // 필드 정제
  const cleanMonthlyRent = (text) => {
    if (!text) return null;
    // "120 관리7" → "120"
    const match = String(text).match(/^(\d+)/);
    return match ? match[1] : text;
  };

  const cleanFacilities = (text) => {
    if (!text) return null;
    // "예)PC7대,..." → "PC7대,..."
    const cleaned = String(text).replace(/^예\s*\)\s*/, '').trim();
    return cleaned || null;
  };

  // 가격 파싱 (월세 중심)
  const monthlyRentStr = cleanMonthlyRent(scraped.monthly_rent);
  const premium = parseKoreanPrice(scraped.premium);
  const monthlyRent = parseKoreanPrice(monthlyRentStr);
  const deposit = parseKoreanPrice(scraped.deposit);
  const areaSqm = parseInt(scraped.size) || null;

  // PC방 매물은 무조건 lease (월세 중심)
  // price = monthly_rent를 메인 가격으로 설정
  const priceType = 'lease';
  const price = monthlyRent || 0;

  const listingData = {
    idx: String(idx),
    title: rawTitle.replace(/\s*N$/, '').trim(),
    description: scraped.description || null,
    price_type: priceType,
    price,
    deposit,
    monthly_rent: monthlyRent,
    premium_price: premium,
    region: extractRegionFromLocation(scraped.location),
    district: scraped.location || null,
    location: scraped.location || null,
    area_sqm: areaSqm,
    floor: scraped.floor || null,
    facilities: cleanFacilities(scraped.facilities),
    available_date: scraped.move_in_date || null,
    business_license: mapBusinessLicense(scraped.business_license),
    administrative_record: scraped.administrative_record || null,
    contact: normalizePhoneNumber(scraped.contact),
    source_url: scraped.detail_url || null,
    thumbnail_url: thumbnailUrl,
    main_image_url: mainImageUrl,
    status: existingStatus,
    view_count: 0,
    updated_at: new Date().toISOString()
  };

  console.log(`    가격: ${priceType === 'lease' ? '임차' : '매매'} ${price}만원, 이미지: ${imageUrls.length}개`);

  if (DRY_RUN) {
    console.log(`    [DRY RUN] DB 쓰기 스킵`);
    return { listingId: 'dry-run', imageCount: imageUrls.length };
  }

  // Upsert listing
  console.log('  💾 DB 저장 중...');
  const { data: upsertedListing, error: upsertError } = await withRetry(() =>
    supabase
      .from('listings')
      .upsert(listingData, { onConflict: 'idx' })
      .select('id')
      .single()
  );

  if (upsertError) {
    throw new Error(`Upsert 실패: ${upsertError.message}`);
  }

  const listingId = upsertedListing.id;

  // Update listing_images: delete old and insert new
  if (imageUrls.length > 0) {
    await supabase
      .from('listing_images')
      .delete()
      .eq('listing_id', listingId);

    const imageRecords = imageUrls.map((url, i) => ({
      listing_id: listingId,
      url,
      is_primary: i === 0,
      order_num: i
    }));

    const { error: imageError } = await withRetry(() =>
      supabase
        .from('listing_images')
        .insert(imageRecords)
    );

    if (imageError) {
      console.warn(`    ⚠️  이미지 DB 저장 실패: ${imageError.message}`);
    }
  }

  return { listingId, imageCount: imageUrls.length };
}

async function main() {
  console.log('🚀 Supabase 임포트 시작\n');
  console.log(`설정: ${DRY_RUN ? '[DRY RUN 모드]' : '[실제 임포트]'}`);
  console.log(`Supabase: ${SUPABASE_URL}`);
  console.log(`Storage Bucket: ${STORAGE_BUCKET}\n`);

  const listingsPath = path.join(__dirname, 'output', 'listings.json');

  if (!fs.existsSync(listingsPath)) {
    console.error(`❌ 파일 없음: ${listingsPath}`);
    process.exit(1);
  }

  let listings;
  try {
    listings = JSON.parse(fs.readFileSync(listingsPath, 'utf-8'));
  } catch (err) {
    console.error(`❌ JSON 파싱 오류: ${err.message}`);
    process.exit(1);
  }

  if (!Array.isArray(listings)) {
    console.error('❌ listings.json은 배열이어야 합니다');
    process.exit(1);
  }

  console.log(`총 ${listings.length}개 매물 발견\n`);

  let succeeded = 0;
  let failed = 0;
  let skipped = 0;
  const errors = [];
  const skippedItems = [];

  for (let i = 0; i < listings.length; i++) {
    try {
      const result = await importListing(listings[i], i + 1, listings.length);

      // null이면 skip된 것 (실제 사진 없음)
      if (result === null) {
        skipped++;
        skippedItems.push({ idx: listings[i].idx, title: listings[i].title });
        continue;
      }

      const { listingId, imageCount } = result;
      console.log(`  ✅ 완료 (ID: ${listingId}, 이미지: ${imageCount}개)`);
      succeeded++;
    } catch (err) {
      console.error(`  ❌ 오류: ${err.message}`);
      errors.push({ idx: listings[i].idx, error: err.message });
      failed++;
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 임포트 결과');
  console.log('='.repeat(60));
  console.log(`✅ 성공: ${succeeded}개`);
  console.log(`❌ 실패: ${failed}개`);
  console.log(`⏭️  스킵 (실제 사진 없음): ${skipped}개`);
  console.log(`합계: ${listings.length}개`);

  if (skipped > 0) {
    console.log('\n⏭️  제외된 매물 (실제 사진 없음):');
    skippedItems.forEach(({ idx, title }) => {
      console.log(`  - idx=${idx} | ${title}`);
    });
  }

  if (errors.length > 0) {
    console.log('\n❌ 실패 목록:');
    errors.forEach(({ idx, error }) => {
      console.log(`  - ${idx}: ${error}`);
    });
  }

  if (DRY_RUN) {
    console.log('\n[DRY RUN] 실제 DB 변경은 없습니다.');
    console.log('실제 임포트: node scripts/import-to-supabase.js');
  }

  console.log('\n완료! ✨');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('\n치명적 오류:', err);
  process.exit(1);
});
