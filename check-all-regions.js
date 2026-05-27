const { createClient } = require('@supabase/supabase-js');
const { REGIONS } = require('./scripts/region-config');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your_supabase_url.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key'
);

async function checkAllRegions() {
  console.log('📊 지역별 현재 DB 개수:');
  console.log('════════════════════════════════════════════════════════');
  
  let totalBefore = 0;
  
  for (const region of REGIONS) {
    const { count } = await supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('region', region.name)
      .eq('status', 'active');
    
    console.log(`${region.name.padEnd(12)} : ${count || 0}개`);
    totalBefore += count || 0;
  }
  
  console.log('════════════════════════════════════════════════════════');
  console.log(`전체 합계              : ${totalBefore}개`);
}

checkAllRegions().catch(console.error);
