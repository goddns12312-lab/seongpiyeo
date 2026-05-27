#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const PcbangkingdomAdapter = require('./adapters/pcbangkingdom-adapter');

const IDX = '171322689';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function testSingleItem() {
  console.log('🔄 수정된 코드로 단일 매물 재크롤링\n');

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const adapter = new PcbangkingdomAdapter();

    // Setup
    const page = await adapter.setup(browser);

    // Navigate to detail page
    const detailUrl = `https://www.xn--3e0b036btifksj.com/40/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&bmode=view&idx=${IDX}&t=board`;
    await page.goto(detailUrl, { waitUntil: 'networkidle' });

    console.log(`✅ 페이지 로드: ${detailUrl}\n`);

    // Extract details
    const details = await adapter.extractDetails(page);

    console.log('📋 추출된 데이터:');
    console.log('═'.repeat(80));
    console.log(`\n[description 길이: ${details.description.length} 글자]\n`);
    console.log(details.description);
    console.log('\n═'.repeat(80));

    // 12번과 자유글 확인
    const has12 = details.description.includes('12. 연락처');
    const hasFreeform = details.description.includes('2차선대로변') || details.description.includes('자세한내용은');

    console.log(`\n✅ 항목 확인:`);
    console.log(`   12번 항목 포함: ${has12 ? '✅ YES' : '❌ NO'}`);
    console.log(`   자유글 포함: ${hasFreeform ? '✅ YES' : '❌ NO'}`);

    if (has12 && hasFreeform) {
      console.log('\n✅ 수정 성공! 12번 항목과 자유글이 모두 포함됨');

      // Contact 확인
      console.log(`\n💬 추출된 contact: ${details.contact || '(없음)'}`);

      // Supabase 강제 업데이트
      console.log(`\n💾 Supabase 강제 업데이트 중...\n`);

      // 가격 정보 추출
      const prices = extractPricesFromDescription(details.description);

      let finalPrice = 0;
      let priceType = 'lease';
      if (prices.monthly_rent) {
        finalPrice = prices.monthly_rent;
        priceType = 'lease';
      } else if (prices.premium) {
        finalPrice = prices.premium;
        priceType = 'sale';
      } else if (prices.deposit) {
        finalPrice = prices.deposit;
        priceType = 'sale';
      }

      // 기존 데이터 조회
      const { data: existingListing, error: fetchError } = await supabase
        .from('listings')
        .select('id, status')
        .eq('idx', IDX)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingListing) {
        // Update
        const { error: updateError } = await supabase
          .from('listings')
          .update({
            title: 'idx=' + IDX,
            description: details.description,
            price_type: priceType,
            price: finalPrice,
            deposit: prices.deposit || null,
            monthly_rent: prices.monthly_rent || null,
            premium_price: prices.premium || null,
            contact: details.contact || null,
            location: extractLocation(details.description),
            region: '서울',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingListing.id);

        if (updateError) throw updateError;
        console.log(`✅ Supabase 업데이트 완료 (id=${existingListing.id})`);
      } else {
        console.log(`⚠️  idx=${IDX} 항목이 Supabase에 없음`);
      }
    } else {
      console.log('\n❌ 수정 실패! 아직도 내용이 누락됨');
      console.log('   필요한 항목 재확인:');
      if (!has12) console.log('   - 12번 항목 (연락처) 누락');
      if (!hasFreeform) console.log('   - 자유글 누락');
    }

    await page.context().close();
  } catch (error) {
    console.error(`\n❌ 오류: ${error.message}`);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

function extractPricesFromDescription(description) {
  if (!description) return { deposit: null, premium: null, monthly_rent: null };

  const result = { deposit: null, premium: null, monthly_rent: null };

  const depositMatch = description.match(/5\.\s*보증금\s*[:：]\s*([^\n]+)/);
  if (depositMatch) {
    const num = parseInt(depositMatch[1].replace(/[^\d]/g, ''));
    if (!isNaN(num) && num > 0) result.deposit = num;
  }

  const premiumMatch = description.match(/6\.\s*희망권리금\s*[:：]\s*([^\n]+)/);
  if (premiumMatch) {
    const num = parseInt(premiumMatch[1].replace(/[^\d]/g, ''));
    if (!isNaN(num) && num > 0) result.premium = num;
  }

  const rentMatch = description.match(/7\.\s*월세\s*[:：]\s*([^\n]+)/);
  if (rentMatch) {
    const num = parseInt(rentMatch[1].replace(/[^\d]/g, ''));
    if (!isNaN(num) && num > 0) result.monthly_rent = num;
  }

  return result;
}

function extractLocation(description) {
  const locationMatch = description.match(/2\.\s*매물위치\s*[:：]\s*([^\n]+)/);
  return locationMatch ? locationMatch[1].trim() : '';
}

testSingleItem();
