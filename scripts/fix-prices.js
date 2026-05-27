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

// 더 정확한 가격 파싱
function parsePrice(text) {
  if (!text) return 0;

  text = String(text).trim();

  // "1000만원" 형태
  const manMatch = text.match(/(\d+)\s*만\s*원?/);
  if (manMatch) {
    return parseInt(manMatch[1]) || 0;
  }

  // "1000" 숫자만
  const numMatch = text.match(/(\d+)/);
  if (numMatch) {
    const num = parseInt(numMatch[1]);
    // 20 이상 1000000 이하면 만원 단위로 봄
    if (num >= 20 && num <= 1000000) {
      return num;
    }
  }

  return 0;
}

// 설명에서 번호 기준으로 각 항목 분리
function extractPrice(desc) {
  if (!desc) return { deposit: null, monthly_rent: null, premium: null };

  const result = {
    deposit: null,
    monthly_rent: null,
    premium: null
  };

  // "5. 보증금 : 1000" 형태로 분리
  // 음수 lookahead를 사용해 다음 번호 전까지만 추출

  // 보증금
  const depositMatch = desc.match(/5[\..\s]*보증금\s*[:：]\s*([^0-9]*\d+[^0-9]*?)(?=\d\.|$)/);
  if (depositMatch) {
    result.deposit = parsePrice(depositMatch[1]);
  }

  // 권리금
  const premiumMatch = desc.match(/6[\..\s]*(?:희망)?권리금\s*[:：]\s*([^0-9]*\d+[^0-9]*?)(?=\d\.|$)/);
  if (premiumMatch) {
    result.premium = parsePrice(premiumMatch[1]);
  }

  // 월세
  const rentMatch = desc.match(/7[\..\s]*월세\s*[:：]\s*([^0-9]*\d+[^0-9]*?)(?=\d\.|$)/);
  if (rentMatch) {
    result.monthly_rent = parsePrice(rentMatch[1]);
  }

  return result;
}

async function fixPrices() {
  try {
    console.log('🔄 가격 데이터 수정 중...\n');

    const { data: listings } = await supabase
      .from('listings')
      .select('id, description')
      .eq('status', 'active')
      .limit(1000);

    let fixed = 0;

    for (const listing of listings || []) {
      const parsed = extractPrice(listing.description);

      // 기존 데이터가 0 또는 잘못된 경우만 업데이트
      const { error } = await supabase
        .from('listings')
        .update({
          deposit: parsed.deposit,
          monthly_rent: parsed.monthly_rent,
          premium_price: parsed.premium,
          price: parsed.premium || parsed.monthly_rent || parsed.deposit || 0
        })
        .eq('id', listing.id);

      if (!error) {
        fixed++;
        if (fixed % 100 === 0) {
          console.log(`  ✅ ${fixed}개 수정됨...`);
        }
      }
    }

    console.log(`\n✅ 완료: ${fixed}개 수정됨`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixPrices();
