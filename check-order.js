const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your_supabase_url.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key'
);

async function checkOrder() {
  const { data, error } = await supabase
    .from('listings')
    .select('id, title, idx, region, created_at, status')
    .eq('region', '강원도')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('강원도 매물 (최신순):');
  console.log('════════════════════════════════════════════════════════');
  data.forEach((item, idx) => {
    const title = item.title?.substring(0, 40) || 'N/A';
    console.log(`${idx + 1}. [${item.created_at}] ${title}`);
    console.log(`   idx=${item.idx}, status=${item.status}`);
  });
}

checkOrder().catch(console.error);
