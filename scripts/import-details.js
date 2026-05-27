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

// 한국어 가격을 숫자로 변환
function parsePrice(text) {
  if (!text) return 0;

  text = String(text).trim();

  // "1000만원", "1000만" 형태
  const manMatch = text.match(/(\d+(?:[.,]\d+)?)\s*만/);
  if (manMatch) {
    return parseInt(manMatch[1].replace(/[.,]/, '')) * 10000 || 0;
  }

  // "100" 숫자만
  const numMatch = text.match(/^(\d+)(?:\s|$)/);
  if (numMatch) {
    return parseInt(numMatch[1]) || 0;
  }

  return 0;
}

async function importDetails() {
  try {
    console.log('📥 상세정보 임포트 시작\n');

    const listingsPath = path.join(__dirname, 'output', 'detailed-listings.json');
    if (!fs.existsSync(listingsPath)) {
      console.log('❌ detailed-listings.json이 없습니다');
      return;
    }

    const listings = JSON.parse(fs.readFileSync(listingsPath, 'utf-8'));
    console.log(`📊 ${listings.length}개 매물 임포트 대기\n`);

    let updated = 0;
    let errors = 0;

    for (let idx = 0; idx < listings.length; idx++) {
      const listing = listings[idx];
      try {
        const deposit = parsePrice(listing.deposit);
        const premium = parsePrice(listing.premium);
        const monthly_rent = parsePrice(listing.monthly_rent);

        // 메인 이미지 URL (첫 번째 이미지)
        const main_image_url = listing.images && listing.images.length > 0 ? listing.images[0] : null;

        // price 필수값: 권리금 > 월세 > 보증금 순서
        const price = premium || monthly_rent || deposit || 0;

        // 데이터 준비
        const updateData = {
          location: listing.location,
          deposit,
          premium_price: premium,
          monthly_rent,
          main_image_url,
          description: listing.description || '',
          area: listing.area || null,
          floor: listing.floor || null,
          facilities: listing.facilities || null,
          move_in_date: listing.move_in_date || null,
          business_license: listing.business_license || null,
          administrative_record: listing.administrative_record || null,
          contact: listing.contact || null,
          status: 'active',
          price
        };

        // 1. 기존 매물 찾기
        let { data: existing, error: selectError } = await supabase
          .from('listings')
          .select('id')
          .eq('title', listing.title)
          .limit(1);

        if (selectError) {
          console.log(`  ❌ [${idx+1}] 조회 실패: ${listing.title.slice(0, 20)}`);
          console.log(`     에러: ${selectError.message}`);
          errors++;
          continue;
        }

        if (existing && existing.length > 0) {
          // 기존 매물 업데이트
          const { error: updateError } = await supabase
            .from('listings')
            .update(updateData)
            .eq('id', existing[0].id);

          if (updateError) {
            console.log(`  ❌ [${idx+1}] 업데이트 실패: ${listing.title.slice(0, 20)}`);
            console.log(`     에러: ${updateError.message}`);
            errors++;
          } else {
            updated++;
          }
        } else {
          // 새 매물 생성
          const { error: insertError } = await supabase
            .from('listings')
            .insert({
              title: listing.title,
              region: listing.region,
              ...updateData
            });

          if (insertError) {
            console.log(`  ❌ [${idx+1}] 추가 실패: ${listing.title.slice(0, 20)}`);
            console.log(`     에러: ${insertError.message}`);
            errors++;
          } else {
            updated++;
          }
        }

        if ((updated + errors) % 100 === 0) {
          console.log(`  📊 ${updated + errors}개 처리됨 (성공: ${updated}, 실패: ${errors})`);
        }
      } catch (e) {
        console.log(`  ❌ [${idx+1}] 예외 오류: ${e.message}`);
        errors++;
      }
    }

    console.log(`\n✅ 완료: ${updated}개 매물 업데이트됨, ${errors}개 실패`);

  } catch (error) {
    console.error('❌ 오류:', error.message);
    process.exit(1);
  }
}

importDetails();
