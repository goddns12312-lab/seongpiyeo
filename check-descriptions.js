const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

(async () => {
  const { data: listings } = await supabase
    .from('listings')
    .select('id, idx, title, description')
    .order('created_at', { ascending: false })
    .limit(3);

  console.log('\n📋 Description 앞부분 3줄\n');
  console.log('═'.repeat(70));

  listings.forEach((listing, i) => {
    console.log(`\n[${i + 1}] ${listing.title}`);
    console.log(`idx: ${listing.idx}`);
    console.log(`\n📝 Description (첫 3줄):`);

    const lines = (listing.description || '').split('\n').slice(0, 3);
    lines.forEach(line => {
      if (line.trim()) console.log(`  ${line}`);
    });

    console.log('─'.repeat(70));
  });

  console.log('\n✅ 데이터베이스 확인 완료');
  process.exit(0);
})();
