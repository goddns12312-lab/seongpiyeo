#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function debug() {
  console.log('🔍 Supabase listings 테이블 상태 확인\n');

  try {
    // 1. 전체 매물 수
    console.log('📊 1단계: 전체 매물 통계');
    const { count: totalCount } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true });
    console.log(`   전체: ${totalCount}개\n`);

    // 2. Status별 통계
    console.log('📊 2단계: Status별 통계');
    const statuses = ['active', 'pending', 'sold', 'hidden'];
    for (const status of statuses) {
      const { count } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', status);
      console.log(`   ${status}: ${count}개`);
    }
    console.log('');

    // 3. Active + main_image_url 조건 만족 매물
    console.log('📊 3단계: Active + main_image_url 있는 매물');
    const { data: activeWithImage, error: error1 } = await supabase
      .from('listings')
      .select('id, idx, title, status, main_image_url, region, created_at')
      .eq('status', 'active')
      .not('main_image_url', 'is', null)
      .order('created_at', { ascending: false });

    if (error1) throw error1;
    console.log(`   조건 만족: ${activeWithImage?.length || 0}개\n`);

    if (activeWithImage && activeWithImage.length > 0) {
      console.log('   매물 목록:');
      activeWithImage.forEach((item, i) => {
        console.log(`   ${i + 1}. [${item.id}] ${item.title}`);
        console.log(`      idx: ${item.idx}`);
        console.log(`      status: ${item.status}`);
        console.log(`      region: ${item.region}`);
        console.log(`      main_image_url: ${item.main_image_url ? '✅ 있음' : '❌ 없음'}`);
        console.log(`      created_at: ${item.created_at}`);
        console.log('');
      });
    } else {
      console.log('   ❌ 조건을 만족하는 매물이 없습니다!\n');
    }

    // 4. Active 상태이지만 main_image_url이 null인 매물
    console.log('📊 4단계: Active이지만 main_image_url = NULL인 매물');
    const { data: activeNoImage, error: error2 } = await supabase
      .from('listings')
      .select('id, idx, title, status, main_image_url, region')
      .eq('status', 'active')
      .is('main_image_url', null);

    if (error2) throw error2;
    console.log(`   개수: ${activeNoImage?.length || 0}개\n`);

    if (activeNoImage && activeNoImage.length > 0) {
      console.log('   매물 목록:');
      activeNoImage.slice(0, 5).forEach((item, i) => {
        console.log(`   ${i + 1}. [${item.id}] ${item.title} (idx: ${item.idx})`);
      });
      if (activeNoImage.length > 5) {
        console.log(`   ... 외 ${activeNoImage.length - 5}개`);
      }
      console.log('');
    }

    // 5. 최근 업데이트된 매물 (3개 확인용)
    console.log('📊 5단계: 최근 업데이트된 3개 매물 상세 정보');
    const { data: recentListings, error: error3 } = await supabase
      .from('listings')
      .select(`
        id, idx, title, status, main_image_url, thumbnail_url,
        region, deposit, premium_price, monthly_rent,
        updated_at, created_at, view_count,
        listing_images(id, url, is_primary, order_num)
      `)
      .order('updated_at', { ascending: false })
      .limit(3);

    if (error3) throw error3;

    if (recentListings && recentListings.length > 0) {
      recentListings.forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.title}`);
        console.log(`      id: ${item.id}`);
        console.log(`      idx: ${item.idx}`);
        console.log(`      status: ${item.status}`);
        console.log(`      region: ${item.region}`);
        console.log(`      main_image_url: ${item.main_image_url || '❌ NULL'}`);
        console.log(`      thumbnail_url: ${item.thumbnail_url || '❌ NULL'}`);
        console.log(`      이미지 개수: ${item.listing_images?.length || 0}개`);
        if (item.listing_images && item.listing_images.length > 0) {
          item.listing_images.forEach((img, j) => {
            console.log(`        - 이미지 ${j + 1}: ${img.url.substring(0, 50)}...`);
          });
        }
        console.log(`      created_at: ${item.created_at}`);
        console.log(`      updated_at: ${item.updated_at}`);
        console.log('');
      });
    }

    // 6. Idx 171322689, 171315260, 171314875 매물 확인
    console.log('📊 6단계: 자동 동기화로 업데이트된 3개 매물 상세 확인');
    const targetIdxes = ['171322689', '171315260', '171314875'];

    for (const idx of targetIdxes) {
      const { data: listing, error } = await supabase
        .from('listings')
        .select(`
          id, idx, title, status, main_image_url, thumbnail_url,
          region, created_at, updated_at,
          listing_images(id, url, is_primary)
        `)
        .eq('idx', idx)
        .single();

      if (error) {
        console.log(`   ❌ idx=${idx}: ${error.message}`);
      } else if (!listing) {
        console.log(`   ⚠️  idx=${idx}: 매물을 찾을 수 없음`);
      } else {
        console.log(`   ✅ idx=${idx}`);
        console.log(`      title: ${listing.title}`);
        console.log(`      status: ${listing.status}`);
        console.log(`      region: ${listing.region}`);
        console.log(`      main_image_url: ${listing.main_image_url ? '✅ 있음' : '❌ NULL'}`);
        console.log(`      thumbnail_url: ${listing.thumbnail_url ? '✅ 있음' : '❌ NULL'}`);
        console.log(`      이미지 개수: ${listing.listing_images?.length || 0}개`);
        console.log(`      created_at: ${listing.created_at}`);
        console.log(`      updated_at: ${listing.updated_at}`);
        console.log('');
      }
    }

    // 7. 쿼리 테스트 (목록 페이지와 동일)
    console.log('📊 7단계: 목록 페이지 쿼리 테스트 (실제 쿼리)');
    const { data: testQuery, error: error4 } = await supabase
      .from('listings')
      .select('id, title, price_type, price, region, district, area_sqm, pc_count, deposit, premium_price, monthly_revenue, monthly_profit, view_count, created_at, thumbnail_url, main_image_url, status, listing_images(id, url, order_num)')
      .eq('status', 'active')
      .not('main_image_url', 'is', null)
      .order('created_at', { ascending: false });

    if (error4) throw error4;
    console.log(`   결과: ${testQuery?.length || 0}개\n`);

    if (testQuery && testQuery.length > 0) {
      testQuery.slice(0, 5).forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.title} (${item.region})`);
      });
      if (testQuery.length > 5) {
        console.log(`   ... 외 ${testQuery.length - 5}개`);
      }
    } else {
      console.log('   ⚠️  결과가 없습니다. 쿼리 문제이거나 데이터 문제입니다.');
    }

  } catch (error) {
    console.error(`\n❌ 오류: ${error.message}`);
    process.exit(1);
  }
}

debug();
