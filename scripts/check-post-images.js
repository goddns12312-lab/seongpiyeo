const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  try {
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, title');
    
    if (postsError) {
      console.log('❌ posts 조회 실패:', postsError.message);
      return;
    }

    console.log(`\n총 ${posts?.length}개 게시글\n`);

    for (const post of posts || []) {
      const { data: images } = await supabase
        .from('post_images')
        .select('*')
        .eq('post_id', post.id);

      console.log(`${post.title}:`);
      console.log(`  이미지 ${images?.length || 0}개`);
      if (images && images.length > 0) {
        images.forEach((img, idx) => {
          console.log(`    ${idx + 1}. ${img.url}`);
        });
      }
    }
  } catch (err) {
    console.log('❌ 오류:', err.message);
  }
}

check();
