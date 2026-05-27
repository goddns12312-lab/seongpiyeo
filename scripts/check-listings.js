const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false });

  console.log(`\n총 ${listings?.length}개 매물\n`);

  for (const listing of listings || []) {
    const { data: images } = await supabase
      .from('listing_images')
      .select('*')
      .eq('listing_id', listing.id);

    console.log(`${listing.title}`);
    console.log(`  - 권리금: ${listing.price.toLocaleString()}원`);
    console.log(`  - 보증금: ${listing.deposit.toLocaleString()}원`);
    console.log(`  - 월세: ${listing.monthly_rent}만원`);
    console.log(`  - 면적: ${listing.area_sqm}㎡`);
    console.log(`  - 지역: ${listing.region} ${listing.district}`);
    console.log(`  - 이미지: ${images?.length || 0}개`);
    if (images && images.length > 0) {
      images.forEach((img, idx) => {
        console.log(`    ${idx + 1}. ${img.url.substring(0, 60)}...`);
      });
    }
    console.log();
  }
}

check();
