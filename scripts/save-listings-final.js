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

// 한글 숫자를 숫자로 변환 (더 정확한 버전)
function parseKoreanPrice(str) {
  if (!str) return 0;

  str = str.trim();

  // "1000만원" 형태
  const manMatch = str.match(/(\d+)만원/);
  if (manMatch) {
    return parseInt(manMatch[1]) || 0;
  }

  // "1000" 형태 (이미 숫자)
  const numMatch = str.match(/(\d+)/);
  if (numMatch) {
    return parseInt(numMatch[1]) || 0;
  }

  return 0;
}

// 설명에서 정보 추출 (더 정확한 버전)
function parseDescription(desc) {
  if (!desc) return {};

  const info = {
    deposit: null,
    premium: null,
    monthly_rent: null
  };

  // 번호를 기준으로 각 항목 분리
  // "5. 보증금 : 1000만원 6. 희망권리금 : 1000만원7. 월세 : 90만원"

  // 보증금 추출
  const depositPattern = /[5핚]\.?\s*보증금\s*[:：]\s*([^0-9]*\d+[^0-9]*)/;
  const depositMatch = desc.match(depositPattern);
  if (depositMatch) {
    info.deposit = parseKoreanPrice(depositMatch[1]);
  }

  // 권리금 추출 (희망권리금 또는 권리금)
  const premiumPattern = /[6육]\.?\s*(?:희망)?권리금\s*[:：]\s*([^0-9]*\d+[^0-9]*)/;
  const premiumMatch = desc.match(premiumPattern);
  if (premiumMatch) {
    info.premium = parseKoreanPrice(premiumMatch[1]);
  }

  // 월세 추출
  const rentPattern = /[7칠]\.?\s*월세\s*[:：]\s*([^0-9]*\d+[^0-9]*)/;
  const rentMatch = desc.match(rentPattern);
  if (rentMatch) {
    info.monthly_rent = parseKoreanPrice(rentMatch[1]);
  }

  // 실패시 다른 패턴으로 재시도
  if (!info.deposit) {
    const alt = desc.match(/보증금\s*[:：]\s*(\d+)만?/);
    if (alt) info.deposit = parseKoreanPrice(alt[1]);
  }
  if (!info.premium) {
    const alt = desc.match(/권리금\s*[:：]\s*(\d+)만?/);
    if (alt) info.premium = parseKoreanPrice(alt[1]);
  }
  if (!info.monthly_rent) {
    const alt = desc.match(/월세\s*[:：]\s*(\d+)만?/);
    if (alt) info.monthly_rent = parseKoreanPrice(alt[1]);
  }

  return info;
}

// 설명을 정리
function cleanDescription(desc) {
  if (!desc) return '';

  // 번호로 구분된 항목들을 줄바꿈으로 변환
  return desc
    .replace(/(\d+)\.\s+/g, '\n$1. ')
    .replace(/\n\n+/g, '\n')
    .trim();
}

async function saveListings() {
  try {
    const jsonPath = path.join(__dirname, 'output', 'all-listings.json');
    const listings = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    console.log(`\n📊 ${listings.length}개 매물 저장 중...\n`);

    const now = new Date();
    let saved = 0;
    let failed = 0;

    // 지역별 그룹화
    const byRegion = {};
    listings.forEach(l => {
      if (!byRegion[l.region]) byRegion[l.region] = [];
      byRegion[l.region].push(l);
    });

    // 지역별 처리
    for (const [region, regionListings] of Object.entries(byRegion)) {
      // 이미지 있는 매물만 필터링
      const withImages = regionListings.filter(l => l.imageUrl);
      console.log(`📍 [${region}] ${regionListings.length}개 중 이미지 있는 ${withImages.length}개 저장 중...`);

      for (let idx = 0; idx < withImages.length; idx++) {
        const listing = withImages[idx];
        const parsed = parseDescription(listing.description);

        // 타임스탬프: 첫 번째 항목이 최신
        const minutesBack = regionListings.length - 1 - idx;
        const createdAt = new Date(now.getTime() - minutesBack * 60000);

        // 가격 결정: 권리금 > 월세 > 보증금 > 0
        const price = parsed.premium || parsed.monthly_rent || parsed.deposit || 0;
        const priceType = parsed.monthly_rent ? 'lease' : 'sale';

        const listingData = {
          title: listing.title.trim(),
          description: cleanDescription(listing.description) || listing.title,
          price_type: priceType,
          price: price,
          deposit: parsed.deposit || null,
          monthly_rent: parsed.monthly_rent || null,
          premium_price: parsed.premium || null,
          region: region,
          thumbnail_url: listing.imageUrl || null,
          main_image_url: listing.imageUrl || null,
          status: 'active',
          view_count: 0,
          created_at: createdAt.toISOString(),
        };

        const { error } = await supabase
          .from('listings')
          .insert([listingData]);

        if (!error) {
          saved++;
          if (saved % 100 === 0) {
            console.log(`  ✅ ${saved}개 저장됨...`);
          }
        } else {
          failed++;
          if (failed < 5) {
            console.log(`  ⚠️  실패: ${listing.title.slice(0, 30)}`);
          }
        }
      }
    }

    console.log(`\n✅ 완료: ${saved}개 저장됨`);
    if (failed > 0) {
      console.log(`⚠️  실패: ${failed}개`);
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

saveListings();
