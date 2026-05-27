#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 환경변수 로드
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// 오염된 제목 패턴
const badPatterns = [
  /1\.\s*매물업종/,           // 1. 매물업종
  /2\.\s*매물위치/,           // 2. 매물위치
  /3\.\s*실평수/,             // 3. 실평수
  /4\.\s*층수/,               // 4. 층수
];

function getTitleFromDescription(description) {
  if (!description) return null;

  // 설명의 첫 번째 문장 또는 중요 부분에서 제목 추출
  // "1. 매물업종 : 성인PC방" 형식이면 "성인PC방" 추출
  const match = description.match(/1\.\s*매물업종\s*[:：]\s*([^\n]+)/);
  if (match) {
    const industry = match[1].trim();
    // "2. 매물위치"를 찾아서 위치 정보 추출
    const locationMatch = description.match(/2\.\s*매물위치\s*[:：]\s*([^\n]+)/);
    if (locationMatch) {
      const location = locationMatch[1].trim().split(/[0-9]/)[0].trim();  // 숫자 전까지
      if (location) {
        return `${location} ${industry}`;
      }
    }
    return industry;
  }

  return null;
}

async function cleanupTitles() {
  console.log('\n🔧 DB 제목 정리 시작\n');

  try {
    // 모든 listings 조회
    const { data: allListings, error: selectError } = await supabase
      .from('listings')
      .select('id, idx, title, description, region, status');

    if (selectError) {
      console.error('❌ DB 조회 실패:', selectError.message);
      process.exit(1);
    }

    console.log(`📊 총 매물: ${allListings?.length || 0}개\n`);

    let correctedCount = 0;
    let cannotFixCount = 0;

    for (const listing of allListings || []) {
      // 제목이 오염되었는지 확인
      let isCorrupted = false;
      for (const pattern of badPatterns) {
        if (pattern.test(listing.title)) {
          isCorrupted = true;
          break;
        }
      }

      if (!isCorrupted) {
        continue;
      }

      // 설명에서 새 제목 추출
      const newTitle = getTitleFromDescription(listing.description);

      if (!newTitle) {
        console.log(`⚠️  idx=${listing.idx} | 제목 추출 불가`);
        console.log(`   현재: "${listing.title.substring(0, 60)}"`);
        cannotFixCount++;
        continue;
      }

      // 제목 업데이트
      const { error: updateError } = await supabase
        .from('listings')
        .update({ title: newTitle })
        .eq('id', listing.id);

      if (updateError) {
        console.log(`❌ idx=${listing.idx} 업데이트 실패`);
      } else {
        console.log(`✅ idx=${listing.idx}`);
        console.log(`   이전: "${listing.title.substring(0, 50)}"`);
        console.log(`   변경: "${newTitle}"`);
        correctedCount++;
      }
    }

    console.log('\n══════════════════════════════════════════════════════');
    console.log(`📊 정리 결과:`);
    console.log(`   수정됨: ${correctedCount}개`);
    console.log(`   수정 불가: ${cannotFixCount}개`);
    console.log(`══════════════════════════════════════════════════════\n`);

  } catch (err) {
    console.error('❌ 오류:', err.message);
    process.exit(1);
  }
}

cleanupTitles();
