const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function reset() {
  try {
    console.log('데이터베이스 초기화 중...');

    // Delete all listings
    const { error: listingsError } = await supabase
      .from('listings')
      .delete()
      .gt('created_at', '1900-01-01');

    if (listingsError) {
      console.log('❌ listings 삭제 실패:', listingsError.message);
    } else {
      console.log('✓ listings 삭제 완료');
    }

    // Delete all posts
    const { error: postsError } = await supabase
      .from('posts')
      .delete()
      .gt('created_at', '1900-01-01');

    if (postsError) {
      console.log('❌ posts 삭제 실패:', postsError.message);
    } else {
      console.log('✓ posts 삭제 완료');
    }

    // Delete all listing_images (should cascade delete but just in case)
    const { error: listingImagesError } = await supabase
      .from('listing_images')
      .delete()
      .gt('created_at', '1900-01-01');

    if (listingImagesError) {
      console.log('❌ listing_images 삭제 실패:', listingImagesError.message);
    } else {
      console.log('✓ listing_images 삭제 완료');
    }

    // Delete all post_images
    const { error: postImagesError } = await supabase
      .from('post_images')
      .delete()
      .gt('created_at', '1900-01-01');

    if (postImagesError) {
      console.log('❌ post_images 삭제 실패:', postImagesError.message);
    } else {
      console.log('✓ post_images 삭제 완료');
    }

    console.log('\n✓ 완전 초기화 완료');
  } catch (err) {
    console.log('❌ 오류:', err.message);
  }
}

reset();
