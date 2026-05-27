#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function main() {
  console.log('🗑️  사진 없는 매물 정리 시작\n');

  const { data: listings } = await supabase
    .from('listings')
    .select('id, title, idx, main_image_url, thumbnail_url')
    .order('created_at', { ascending: false });

  if (!listings || listings.length === 0) {
    console.log('❌ 매물이 없습니다');
    process.exit(1);
  }

  const toDelete = [];

  for (const listing of listings) {
    const hasMainImage = listing.main_image_url && listing.main_image_url.length > 0;
    const hasThumbnail = listing.thumbnail_url && listing.thumbnail_url.length > 0;

    if (!hasMainImage && !hasThumbnail) {
      console.log(`❌ ${listing.title} (idx: ${listing.idx || 'N/A'})`);
      toDelete.push(listing.id);
    }
  }

  if (toDelete.length === 0) {
    console.log('✅ 사진 없는 매물이 없습니다');
    process.exit(0);
  }

  console.log(`\n삭제 대상: ${toDelete.length}개`);
  console.log('='.repeat(50));

  // 삭제 실행
  const { error } = await supabase
    .from('listings')
    .delete()
    .in('id', toDelete);

  if (error) {
    console.error(`❌ 삭제 실패: ${error.message}`);
    process.exit(1);
  }

  console.log(`✅ ${toDelete.length}개 매물 삭제 완료`);
  process.exit(0);
}

main().catch(err => {
  console.error('❌ 오류:', err.message);
  process.exit(1);
});
