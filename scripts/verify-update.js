#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function verify() {
  try {
    const { data: listing, error } = await supabase
      .from('listings')
      .select('id, idx, title, description, contact')
      .eq('idx', '171322689')
      .single();

    if (error) throw error;

    console.log('📊 Supabase에서 조회한 데이터:');
    console.log('═'.repeat(80));
    console.log(`\nidx: ${listing.idx}`);
    console.log(`contact: ${listing.contact}`);
    console.log(`\n[description 길이: ${listing.description.length} 글자]`);
    console.log('\n' + listing.description);
    console.log('\n═'.repeat(80));

    // 확인
    const has12 = listing.description.includes('12. 연락처');
    const hasFreeform = listing.description.includes('2차선대로변') || listing.description.includes('자세한내용은');

    console.log(`\n✅ 최종 확인:`);
    console.log(`   12번 항목 포함: ${has12 ? '✅ YES' : '❌ NO'}`);
    console.log(`   자유글 포함: ${hasFreeform ? '✅ YES' : '❌ NO'}`);
    console.log(`   Contact 필드: ${listing.contact ? `✅ ${listing.contact}` : '❌ 없음'}`);

    if (has12 && hasFreeform && listing.contact) {
      console.log('\n✅✅✅ 모든 데이터가 올바르게 저장됨!');
      console.log('이제 브라우저에서 확인하세요: http://localhost:3000/listings/[id]');
    }
  } catch (error) {
    console.error(`❌ 오류: ${error.message}`);
    process.exit(1);
  }
}

verify();
