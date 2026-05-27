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

// 한글 숫자를 숫자로 변환
function parseKoreanNumber(str) {
  if (!str) return 0;

  str = str.trim().replace(/[^\d만천원]/g, '');

  if (str.includes('만')) {
    const num = parseInt(str.replace('만', '')) || 0;
    return num;
  }
  if (str.includes('천')) {
    const num = parseInt(str.replace('천', '')) || 0;
    return Math.floor(num / 10); // 천원을 만원 단위로
  }
  return parseInt(str) || 0;
}

// 설명에서 정보 추출
function parseDescription(desc) {
  if (!desc) return {};

  const info = {};

  // 보증금 추출
  const depositMatch = desc.match(/보증금\s*[:\.]?\s*([^\n0-9]*\d+[^\n]*)/);
  if (depositMatch) {
    info.deposit = parseKoreanNumber(depositMatch[1]);
  }

  // 권리금 추출
  const premiumMatch = desc.match(/권리금|희망권리금\s*[:\.]?\s*([^\n0-9]*\d+[^\n]*)/);
  if (premiumMatch) {
    info.premium = parseKoreanNumber(premiumMatch[1]);
  }

  // 월세 추출
  const rentMatch = desc.match(/월세\s*[:\.]?\s*([^\n0-9]*\d+[^\n]*)/);
  if (rentMatch) {
    info.monthly_rent = parseKoreanNumber(rentMatch[1]);
  }

  return info;
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
      console.log(`📍 [${region}] ${regionListings.length}개 저장 중...`);

      for (let idx = 0; idx < regionListings.length; idx++) {
        const listing = regionListings[idx];
        const parsed = parseDescription(listing.description);

        // 타임스탬프: 첫 번째 항목이 최신
        const minutesBack = regionListings.length - 1 - idx;
        const createdAt = new Date(now.getTime() - minutesBack * 60000);

        // 가격 결정: 권리금 > 월세 > 보증금 > 0
        const price = parsed.premium || parsed.monthly_rent || parsed.deposit || 1000;
        const priceType = parsed.monthly_rent ? 'lease' : 'sale';

        const listingData = {
          title: listing.title,
          description: listing.description || listing.title,
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
          if (saved % 50 === 0) {
            console.log(`  ✅ ${saved}개 저장됨...`);
          }
        } else {
          failed++;
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
