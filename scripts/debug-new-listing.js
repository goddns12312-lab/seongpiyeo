#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function debugNewListing() {
  console.log('🔍 새로 등록된 매물 확인 프로세스\n');

  try {
    // Step 1: 최근 등록된 매물 조회 (생성 순서로 최신 것부터)
    console.log('📍 Step 1: Supabase listings 테이블에서 최근 매물 조회');

    const { data: recentListings, error: fetchError } = await supabase
      .from('listings')
      .select('id, title, status, created_at, user_id, price')
      .order('created_at', { ascending: false })
      .limit(5);

    if (fetchError) throw fetchError;

    console.log(`✅ 최근 5개 매물:\n`);

    for (const listing of recentListings) {
      console.log(`   ID: ${listing.id}`);
      console.log(`   Title: "${listing.title}"`);
      console.log(`   Status: ${listing.status}`);
      console.log(`   Created: ${listing.created_at}`);
      console.log(`   Price: ${listing.price || '(없음)'}`);
      console.log('');
    }

    // Step 2: status 값 확인
    console.log('📍 Step 2: Status별 매물 통계');

    const { data: statusStats, error: statsError } = await supabase
      .rpc('count_by_status');

    if (!statsError && statusStats) {
      console.log(`✅ 통계:\n${JSON.stringify(statusStats, null, 2)}\n`);
    } else {
      // 대체 방법: 직접 조회
      const statuses = ['pending', 'active', 'sold', 'hidden'];
      for (const status of statuses) {
        const { count } = await supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('status', status);
        console.log(`   ${status}: ${count}개`);
      }
      console.log('');
    }

    // Step 3: 목록 페이지 쿼리 확인 (실제 쿼리 로직)
    console.log('📍 Step 3: 목록 페이지에서 보이는 매물 확인');

    const { data: visibleListings, error: visibleError } = await supabase
      .from('listings')
      .select('id, title, status, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10);

    if (visibleError) throw visibleError;

    console.log(`✅ 목록 페이지에 보이는 매물 (status='active'): ${visibleListings.length}개\n`);

    if (visibleListings.length > 0) {
      console.log('   최근 5개:');
      for (let i = 0; i < Math.min(5, visibleListings.length); i++) {
        console.log(`   - ${visibleListings[i].title}`);
      }
    } else {
      console.log('   (없음)');
    }
    console.log('');

    // Step 4: pending 매물 확인
    console.log('📍 Step 4: Pending 매물 (승인 대기) 확인');

    const { data: pendingListings, error: pendingError } = await supabase
      .from('listings')
      .select('id, title, status, created_at, user_id')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);

    if (pendingError) throw pendingError;

    console.log(`✅ Pending 상태 매물: ${pendingListings.length}개\n`);

    if (pendingListings.length > 0) {
      console.log('   최근 5개:');
      for (let i = 0; i < Math.min(5, pendingListings.length); i++) {
        const p = pendingListings[i];
        console.log(`   - [${p.id}] "${p.title}" (user: ${p.user_id})`);
      }
      console.log('\n⚠️  이 매물들은 관리자 승인 후 active로 변경되어야 목록에 보입니다');
    }
    console.log('');

    // Step 5: 테스트 - 첫 번째 pending 매물을 active로 변경
    if (pendingListings.length > 0) {
      console.log('📍 Step 5: 테스트 - 첫 pending 매물을 active로 변경\n');

      const testListing = pendingListings[0];
      console.log(`   대상: "${testListing.title}" (${testListing.id})`);

      const { error: updateError } = await supabase
        .from('listings')
        .update({ status: 'active' })
        .eq('id', testListing.id);

      if (updateError) throw updateError;

      console.log(`   ✅ Status 변경: pending → active`);
      console.log(`\n   브라우저 새로고침 후 목록 페이지에서 확인하세요:`);
      console.log(`   http://localhost:3000/listings`);
      console.log(`\n   나중에 다시 pending으로 되돌리려면:`);
      console.log(`   supabase update listings set status='pending' where id='${testListing.id}'`);
    } else {
      console.log('📍 Step 5: Pending 매물이 없어서 테스트 스킵\n');
    }

    // 최종 요약
    console.log('═'.repeat(80));
    console.log('\n📋 최종 정리:\n');
    console.log(`   Active 매물: ${visibleListings.length}개 (목록에 표시됨)`);
    console.log(`   Pending 매물: ${pendingListings.length}개 (승인 대기 중)`);
    console.log(`\n💡 새 등록 매물이 안 보이는 이유:`);

    if (pendingListings.length > 0) {
      console.log(`   → Status='pending'이므로 관리자 승인 필요`);
      console.log(`   → Admin 페이지에서 승인 후 active로 변경해야 함`);
    } else {
      console.log(`   → DB에 저장 자체가 안 됐거나`);
      console.log(`   → 쿼리 조건이 다를 수 있음`);
    }

  } catch (error) {
    console.error(`\n❌ 오류: ${error.message}`);
    process.exit(1);
  }
}

debugNewListing();
