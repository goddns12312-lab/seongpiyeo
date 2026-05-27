#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STORAGE_BUCKET = 'listings';

const CONFIG = {
  listingsFile: path.join(__dirname, 'output', 'listings.json'),
  imagesDir: path.join(__dirname, 'output', 'images')
};

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ 환경변수 오류: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필수');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

function log(...args) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}]`, ...args);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function cleanTitle(title) {
  if (!title) return '';

  // 줄바꿈으로 split
  const lines = title.split('\n');
  let cleanTitle = lines[0] || '';

  // 줄 내에 "1. 매물업종" 같은 패턴이 있으면 그 전까지만
  const itemMatch = cleanTitle.match(/^(.+?)(?:\d+\.\s*매물업종|$)/);
  if (itemMatch) {
    cleanTitle = itemMatch[1].trim();
  }

  // " N" suffix 제거
  cleanTitle = cleanTitle.replace(/\s+N\s*$/, '').trim();

  return cleanTitle;
}

function extractRegionFromDetailUrl(detailUrl) {
  // detail_url에서 보드 번호 추출 (정확한 지역 결정)
  const boardMap = {
    '40': '서울',
    '93': '경기',
    '92': '강원',
    '91': '인천',
    '90': '충북',
    '89': '충남',
    '88': '경북',
    '87': '경남',
    '86': '전북',
    '85': '전남',
    '84': '제주'
  };

  if (!detailUrl) return '서울';

  const match = detailUrl.match(/xn--3e0b036btifksj\.com\/(\d+)\//);
  if (match) {
    const boardNum = match[1];
    return boardMap[boardNum] || '서울';
  }

  return '서울';
}

// description에서 가격 정보 추출 (파싱 실패 시 폴백)
function extractPricesFromDescription(description, listing) {
  if (!description) return { deposit: null, premium: null, monthly_rent: null };

  // 이미 값이 있으면 그대로 사용
  if (listing.deposit || listing.premium || listing.monthly_rent) {
    return {
      deposit: listing.deposit,
      premium: listing.premium,
      monthly_rent: listing.monthly_rent
    };
  }

  const result = { deposit: null, premium: null, monthly_rent: null };

  // 보증금 추출 (5. 보증금 : ...) - 첫 번째 숫자만 추출
  const depositMatch = description.match(/5\.\s*보증금\s*[:：]\s*([^\n]+)/);
  if (depositMatch) {
    const text = depositMatch[1].trim();
    // "2,000만원 또는 1,300만원" -> 2000 추출
    const numMatch = text.match(/(\d+(?:,\d+)?)/);
    if (numMatch) {
      const num = parseInt(numMatch[1].replace(/,/g, ''));
      if (!isNaN(num) && num > 0) {
        result.deposit = num;
      }
    }
  }

  // 권리금 추출 (6. 희망권리금 : ...)
  const premiumMatch = description.match(/6\.\s*희망권리금\s*[:：]\s*([^\n]+)/);
  if (premiumMatch) {
    const text = premiumMatch[1].trim();
    // "1,300만원" -> 1300 추출
    const numMatch = text.match(/(\d+(?:,\d+)?)/);
    if (numMatch) {
      const num = parseInt(numMatch[1].replace(/,/g, ''));
      if (!isNaN(num) && num > 0) {
        result.premium = num;
      }
    }
  }

  // 월세 추출 (7. 월세 : ...)
  const rentMatch = description.match(/7\.\s*월세\s*[:：]\s*([^\n]+)/);
  if (rentMatch) {
    const text = rentMatch[1].trim();
    // "120 관리7" -> 120만 추출
    const numMatch = text.match(/(\d+(?:,\d+)?)/);
    if (numMatch) {
      const num = parseInt(numMatch[1].replace(/,/g, ''));
      if (!isNaN(num) && num > 0) {
        result.monthly_rent = num;
      }
    }
  }

  return result;
}

async function uploadImage(localPath, storagePath) {
  try {
    if (!fs.existsSync(localPath)) {
      return null;
    }

    const buffer = fs.readFileSync(localPath);
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        upsert: true,
        contentType: 'image/jpeg'
      });

    if (error) {
      log(`  ⚠️  업로드 실패: ${storagePath}`);
      return null;
    }

    const { data } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    return data.publicUrl;
  } catch (error) {
    log(`  ⚠️  이미지 업로드 오류: ${error.message}`);
    return null;
  }
}

async function importValidatedListings() {
  log('═'.repeat(80));
  log('📤 검증된 매물 Supabase 임포트 시작');
  log('═'.repeat(80));

  // 1. listings.json 로드
  if (!fs.existsSync(CONFIG.listingsFile)) {
    log(`❌ ${CONFIG.listingsFile}을 찾을 수 없습니다`);
    process.exit(1);
  }

  let listings = [];
  try {
    listings = JSON.parse(fs.readFileSync(CONFIG.listingsFile, 'utf-8'));
    log(`\n📋 총 ${listings.length}개 매물 로드됨`);
  } catch (error) {
    log(`❌ JSON 파싱 오류: ${error.message}`);
    process.exit(1);
  }

  // 2. 최소 검증 (idx만 확인)
  const validListings = listings.filter(l => {
    // idx가 있는 것만
    return l.idx;
  });

  log(`\n✅ 검증 통과: ${validListings.length}개`);
  log(`⚠️  검증 미통과: ${listings.length - validListings.length}개 (스킵)`);

  // 3. Supabase에 존재하는 idx 조회
  log('\n📋 기존 매물 조회 중...');
  const { data: existingListings } = await supabase
    .from('listings')
    .select('idx, status, created_at');

  const existingIdxMap = new Map();
  const existingCreatedAtMap = new Map();
  if (existingListings) {
    existingListings.forEach(l => {
      existingIdxMap.set(l.idx, l.status);
      existingCreatedAtMap.set(l.idx, l.created_at); // created_at 보존
    });
  }
  log(`✅ 기존 매물: ${existingListings ? existingListings.length : 0}개`);

  // 4. Import 진행
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const errors = [];

  log('\n🔄 임포트 진행 중...\n');

  for (let i = 0; i < validListings.length; i++) {
    const listing = validListings[i];
    const isNew = !existingIdxMap.has(listing.idx);

    log(`[${i + 1}/${validListings.length}] idx=${listing.idx} | ${listing.title.substring(0, 50)}`);

    // 기존 매물은 스킵 (신규만 추가)
    if (!isNew) {
      log(`  ⏭️  기존 매물 스킵`);
      skipped++;
      continue;
    }

    try {
      // 이미지 업로드
      const uploadedImages = [];
      if (listing.images && listing.images.length > 0) {
        for (const imagePath of listing.images) {
          const filename = path.basename(imagePath);
          const storagePath = `${listing.idx}/${filename}`;
          const url = await uploadImage(imagePath, storagePath);
          if (url) {
            uploadedImages.push(url);
          }
        }
      }

      // 데이터 준비
      // Description에서 파싱된 가격 정보 추출 (파싱 실패 시 폴백)
      const prices = extractPricesFromDescription(listing.description, listing);

      // 최종 가격 결정: 월세 > 권리금 > 보증금 우선순위
      let finalPrice = 0;
      let priceType = 'lease';

      if (prices.monthly_rent) {
        // 월세 있으면 메인은 월세
        finalPrice = prices.monthly_rent;
        priceType = 'lease';
      } else if (prices.premium) {
        // 월세 없으면 권리금
        finalPrice = prices.premium;
        priceType = 'sale';
      } else if (prices.deposit) {
        // 둘 다 없으면 보증금
        finalPrice = prices.deposit;
        priceType = 'sale';
      }

      // business_license와 administrative_record 처리
      // 비어있거나 공백이면 '미기재'로 설정 (DB 제약 조건 회피)
      let business_license_val = (listing.business_license?.trim() || '').length > 0
        ? listing.business_license.trim()
        : '미기재';
      let admin_record_val = (listing.administrative_record?.trim() || '').length > 0
        ? listing.administrative_record.trim()
        : '미기재';

      const listingData = {
        idx: listing.idx,
        title: cleanTitle(listing.title),
        description: listing.description,
        price_type: priceType,
        price: finalPrice,
        deposit: prices.deposit || null,
        monthly_rent: prices.monthly_rent || null,
        premium_price: prices.premium || null,
        region: extractRegionFromDetailUrl(listing.detail_url),
        district: listing.location || null,
        location: listing.location || null,
        area_sqm: listing.size ? parseInt(listing.size) : null,
        floor: listing.floor || null,
        facilities: listing.facilities || null,
        available_date: listing.move_in_date || null,
        business_license: business_license_val,
        administrative_record: admin_record_val,
        contact: listing.contact || null,
        source_url: listing.detail_url || null,
        source_name: listing.source_name || 'pcbangkingdom',
        thumbnail_url: uploadedImages[0] || null,
        main_image_url: uploadedImages[0] || null,
        // Status: 신규는 active, 기존은 유지
        status: isNew ? 'active' : existingIdxMap.get(listing.idx),
        view_count: isNew ? 0 : undefined, // 기존 매물은 view_count 유지
        updated_at: new Date().toISOString(),
        // 기존 매물이면 created_at 보존, 신규 매물이면 현재 시간에서 crawled_at 기반
        created_at: isNew ? (listing.crawled_at || new Date().toISOString()) : existingCreatedAtMap.get(listing.idx)
      };

      // 가격 값 검증 (정수 범위: -2147483648 ~ 2147483647)
      if (listingData.price > 2147483647) {
        listingData.price = 0; // 범위 초과시 0으로 설정
        log(`  ⚠️  경고: 가격 범위 초과 (${listing.idx}), 0으로 설정됨`);
      }
      if (listingData.deposit && listingData.deposit > 2147483647) {
        listingData.deposit = null;
      }
      if (listingData.premium_price && listingData.premium_price > 2147483647) {
        listingData.premium_price = null;
      }
      if (listingData.monthly_rent && listingData.monthly_rent > 2147483647) {
        listingData.monthly_rent = null;
      }

      // 신규만 insert, 기존은 skip
      let result;
      let error;

      if (isNew) {
        // 신규: insert만 수행
        const { data: insertResult, error: insertError } = await supabase
          .from('listings')
          .insert([listingData])
          .select('id, status')
          .single();

        result = insertResult;
        error = insertError;
      } else {
        // 기존: 이미지만 업데이트 (데이터는 변경 안 함)
        const { data: existingData } = await supabase
          .from('listings')
          .select('id')
          .eq('idx', listing.idx)
          .single();

        result = existingData;
        error = null;
      }

      if (error) {
        throw new Error(error.message);
      }

      // listing_images 처리
      if (uploadedImages.length > 0) {
        // 기존 이미지 삭제
        await supabase
          .from('listing_images')
          .delete()
          .eq('listing_id', result.id);

        // 새 이미지 삽입
        const imageRecords = uploadedImages.map((url, idx) => ({
          listing_id: result.id,
          url,
          is_primary: idx === 0,
          order_num: idx
        }));

        await supabase
          .from('listing_images')
          .insert(imageRecords);
      }

      if (isNew) {
        log(`  ✨ 신규 추가 (status=${result.status})`);
        inserted++;
      } else {
        log(`  🔄 기존 업데이트 (status=${result.status})`);
        updated++;
      }

    } catch (error) {
      log(`  ❌ 오류: ${error.message}`);
      errors.push({
        idx: listing.idx,
        title: listing.title,
        error: error.message
      });
      skipped++;
    }

    if ((i + 1) % 10 === 0) {
      await sleep(500);
    }
  }

  // 5. 최종 통계
  log('\n' + '═'.repeat(80));
  log('✅ 임포트 완료');
  log('═'.repeat(80));
  log(`\n📊 결과:`);
  log(`   ✨ 신규 추가: ${inserted}개 (status=pending)`);
  log(`   🔄 기존 업데이트: ${updated}개 (status 유지)`);
  log(`   ❌ 실패/스킵: ${skipped}개`);
  log(`   📋 총합: ${inserted + updated}개`);

  if (errors.length > 0) {
    log(`\n❌ 실패한 매물:`);
    errors.slice(0, 10).forEach(item => {
      log(`   - idx=${item.idx} | ${item.title}`);
      log(`     오류: ${item.error}`);
    });
    if (errors.length > 10) {
      log(`   ... 그 외 ${errors.length - 10}개`);
    }
  }
}

async function gracefulExit(code) {
  // 모든 pending 요청 완료 대기 (최대 5초)
  await new Promise(resolve => setTimeout(resolve, 500));
  process.exit(code);
}

importValidatedListings()
  .then(() => {
    gracefulExit(0);
  })
  .catch(err => {
    log(`❌ 오류: ${err.message}`);
    gracefulExit(1);
  });
