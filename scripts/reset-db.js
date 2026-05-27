/**
 * DB 초기화
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Supabase 환경변수 없음');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function reset() {
  try {
    console.log('DB 초기화 중...');

    // listing_images 삭제
    const { error: imgErr } = await supabase
      .from('listing_images')
      .delete()
      .gt('created_at', '1900-01-01');

    if (imgErr) {
      console.log('❌ listing_images 삭제 실패:', imgErr.message);
      return;
    }

    // listings 삭제
    const { error: listErr } = await supabase
      .from('listings')
      .delete()
      .gt('created_at', '1900-01-01');

    if (listErr) {
      console.log('❌ listings 삭제 실패:', listErr.message);
      return;
    }

    console.log('✓ DB 초기화 완료');
    process.exit(0);
  } catch (err) {
    console.log('❌ 오류:', err.message);
    process.exit(1);
  }
}

reset();
