const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your_supabase_url.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key'
);

async function checkSeoul() {
  const { data, error } = await supabase
    .from('listings')
    .select('id, title, idx, region, created_at, status')
    .eq('region', '서울')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('서울 최신 10개 매물 (최신순):');
  console.log('════════════════════════════════════════════════════════');
  data.forEach((item, idx) => {
    const title = item.title?.substring(0, 40) || 'N/A';
    console.log(`${idx + 1}. [${item.created_at.substring(11, 19)}] ${title}`);
  });
}

checkSeoul().catch(console.error);
