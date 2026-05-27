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
  if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function deduplicateListings() {
  console.log('\n🧹 매물 중복 제거 시작\n');

  try {
    // 모든 활성 매물 조회
    const { data: allListings, error: fetchError } = await supabase
      .from('listings')
      .select('id, idx, title, description, contact, main_image_url, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ 매물 조회 실패:', fetchError.message);
      process.exit(1);
    }

    console.log(`📊 총 매물: ${allListings.length}개\n`);

    // 1단계: idx 중복 확인
    console.log('🔍 1단계: idx 중복 확인');
    const idxMap = {};
    const idxDuplicates = [];

    allListings.forEach(item => {
      if (item.idx) {
        if (!idxMap[item.idx]) {
          idxMap[item.idx] = [];
        }
        idxMap[item.idx].push(item);
      }
    });

    Object.entries(idxMap).forEach(([idx, items]) => {
      if (items.length > 1) {
        idxDuplicates.push({ idx, items, count: items.length });
      }
    });

    console.log(`   발견: ${idxDuplicates.length}개의 idx 중복\n`);

    // 2단계: 제목 + 설명 동일한 매물 확인
    console.log('🔍 2단계: 제목+설명 동일 중복 확인');
    const contentMap = {};
    const contentDuplicates = [];

    allListings.forEach(item => {
      const key = `${item.title}|${item.description?.substring(0, 100) || ''}`;
      if (!contentMap[key]) {
        contentMap[key] = [];
      }
      contentMap[key].push(item);
    });

    Object.entries(contentMap).forEach(([key, items]) => {
      if (items.length > 1) {
        contentDuplicates.push({ items, count: items.length });
      }
    });

    console.log(`   발견: ${contentDuplicates.length}개의 내용 중복\n`);

    // 3단계: 제목 중복 확인
    console.log('🔍 3단계: 제목만 중복 확인');
    const titleMap = {};
    const titleDuplicates = [];

    allListings.forEach(item => {
      if (!titleMap[item.title]) {
        titleMap[item.title] = [];
      }
      titleMap[item.title].push(item);
    });

    Object.entries(titleMap).forEach(([title, items]) => {
      if (items.length > 1) {
        titleDuplicates.push({ title, items, count: items.length });
      }
    });

    console.log(`   발견: ${titleDuplicates.length}개의 제목 중복\n`);

    // 샘플 표시
    if (idxDuplicates.length > 0) {
      console.log('📋 idx 중복 샘플:');
      idxDuplicates.slice(0, 3).forEach(dup => {
        console.log(`\n   idx=${dup.idx} (${dup.count}개)`);
        dup.items.forEach((item, i) => {
          console.log(`     ${i + 1}. id=${item.id?.substring(0, 8)}... | ${item.title.substring(0, 40)}`);
        });
      });
    }

    if (titleDuplicates.length > 0) {
      console.log('\n📋 제목 중복 샘플:');
      titleDuplicates.slice(0, 3).forEach(dup => {
        console.log(`\n   "${dup.title.substring(0, 50)}" (${dup.count}개)`);
        dup.items.forEach((item, i) => {
          console.log(`     ${i + 1}. idx=${item.idx} | id=${item.id?.substring(0, 8)}...`);
        });
      });
    }

    // 4단계: 중복 제거 제안
    console.log('\n\n⚠️  중복 제거 옵션:\n');
    console.log('선택 1: idx 기준으로 최신 매물만 유지');
    console.log('   → 가장 최근 등록된 것만 유지, 나머지 삭제\n');

    console.log('선택 2: 제목 기준으로 첫 번째만 유지');
    console.log('   → 먼저 등록된 것만 유지, 나머지 삭제\n');

    console.log('선택 3: 내용 기준으로 최신만 유지 (권장)');
    console.log('   → 제목+설명이 같은 것 중 최신만 유지\n');

    // 자동 정리: 제목 동일 + 최신 유지
    if (titleDuplicates.length > 0 && process.argv.includes('--clean')) {
      console.log('\n🗑️  자동 정리 시작 (제목 중복, 최신만 유지)...\n');

      let deletedCount = 0;

      for (const dup of titleDuplicates) {
        // 최신 순으로 정렬 (created_at 내림차순)
        const sorted = dup.items.sort((a, b) =>
          new Date(b.created_at) - new Date(a.created_at)
        );

        // 첫 번째는 유지, 나머지는 삭제
        const toDelete = sorted.slice(1);

        for (const item of toDelete) {
          // 먼저 listing_images 삭제
          await supabase
            .from('listing_images')
            .delete()
            .eq('listing_id', item.id);

          // 매물 삭제
          const { error } = await supabase
            .from('listings')
            .delete()
            .eq('id', item.id);

          if (error) {
            console.log(`   ❌ 삭제 실패: ${item.id}`);
          } else {
            console.log(`   ✅ 삭제됨: ${item.title.substring(0, 40)} (id=${item.id.substring(0, 8)}...)`);
            deletedCount++;
          }
        }
      }

      console.log(`\n✨ 정리 완료: ${deletedCount}개 삭제됨`);
      console.log(`📊 남은 매물: ${allListings.length - deletedCount}개\n`);
    } else {
      console.log('\n💡 자동 정리를 실행하려면:\n');
      console.log('   node scripts/dedupe-listings.js --clean\n');
    }

  } catch (error) {
    console.error('\n❌ 오류:', error.message);
    process.exit(1);
  }
}

deduplicateListings();
