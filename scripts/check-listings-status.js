#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('\n📊 Supabase 매물 통계\n');

  try {
    // 전체 매물 수
    const { count: totalCount } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true });
    console.log(`📋 전체 매물: ${totalCount}개`);

    // active 매물 수
    const { count: activeCount } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');
    console.log(`✅ 공개 매물 (status=active): ${activeCount}개`);

    // pending 매물 수
    const { count: pendingCount } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    console.log(`⏳ 대기 매물 (status=pending): ${pendingCount}개`);

    // 이미지 있는 active 매물
    const { count: activeWithImage } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .not('main_image_url', 'is', null);
    console.log(`🖼️  이미지 있는 공개 매물: ${activeWithImage}개\n`);

    // 최근 매물
    const { data: recent } = await supabase
      .from('listings')
      .select('idx, title, status, main_image_url, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('📝 최근 추가/변경된 매물:');
    recent?.forEach((listing, i) => {
      const img = listing.main_image_url ? '🖼️ ' : '❌';
      console.log(`  ${i + 1}. [${listing.status}] ${img} ${listing.title}`);
    });

    console.log('');
  } catch (error) {
    console.error('❌ 오류:', error.message);
    process.exit(1);
  }
})();
