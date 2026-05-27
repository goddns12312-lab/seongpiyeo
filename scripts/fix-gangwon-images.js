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

async function fixGangwonImages() {
  console.log('\n🔧 강원도 이미지 없는 매물 처리\n');

  // 이미지 없는 2개 idx
  const idxToDelete = ['166847444', '2955817'];

  for (const idx of idxToDelete) {
    try {
      // 먼저 조회
      const { data: listing, error: selectError } = await supabase
        .from('listings')
        .select('id, idx, title, status')
        .eq('idx', idx)
        .single();

      if (selectError || !listing) {
        console.log(`⚠️  idx=${idx}: DB에서 찾을 수 없음`);
        continue;
      }

      console.log(`📋 idx=${idx} | ${listing.title.substring(0, 50)}`);
      console.log(`   현재 상태: ${listing.status}`);

      // 3가지 옵션
      // 1. 상태를 'hidden'으로 변경 (soft delete)
      // 2. 완전 삭제 (hard delete)
      // 여기서는 'hidden'으로 변경하여 데이터 보존

      const { error: updateError } = await supabase
        .from('listings')
        .update({ status: 'hidden' })
        .eq('idx', idx);

      if (updateError) {
        console.log(`   ❌ 오류: ${updateError.message}`);
      } else {
        console.log(`   ✅ 상태 변경: active → hidden`);
      }
      console.log('');
    } catch (err) {
      console.error(`❌ idx=${idx} 처리 중 오류: ${err.message}`);
    }
  }

  // 최종 확인
  console.log('══════════════════════════════════════════════════════');
  console.log('📊 처리 후 상태 확인\n');

  try {
    const { data: gangwonListings } = await supabase
      .from('listings')
      .select('status')
      .eq('region', '강원도');

    const statusCounts = {};
    gangwonListings?.forEach(l => {
      statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
    });

    console.log('강원도 DB 최종 통계:');
    console.log(`  active:  ${statusCounts['active'] || 0}개 (이미지 있는 매물)`);
    console.log(`  hidden:  ${statusCounts['hidden'] || 0}개 (이미지 없는 매물)`);
    console.log(`  합계:    ${gangwonListings?.length || 0}개\n`);

    console.log('✅ 강원도 이미지 없는 매물 처리 완료!');
    console.log('   active 상태 13개만 사용자에게 노출됩니다.\n');

  } catch (err) {
    console.error('최종 확인 오류:', err.message);
  }

  console.log('══════════════════════════════════════════════════════\n');
}

fixGangwonImages().catch(console.error);
