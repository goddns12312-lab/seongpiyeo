const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .limit(1);

  if (error) {
    console.log('❌ 오류:', error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log('posts 테이블의 컬럼들:');
    Object.keys(data[0]).forEach(key => {
      console.log(`  - ${key}`);
    });
  }
}

check();
