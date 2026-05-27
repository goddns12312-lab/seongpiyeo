import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();

    // 1. 모든 listing_images 삭제
    const { error: imageError } = await supabase
      .from('listing_images')
      .delete()
      .gt('created_at', '1900-01-01'); // 모든 행 삭제 (created_at이 1900년 이후인 모든 것)

    if (imageError) {
      return Response.json({ error: imageError.message }, { status: 500 });
    }

    // 2. 모든 listings 삭제
    const { error: listingError } = await supabase
      .from('listings')
      .delete()
      .gt('created_at', '1900-01-01'); // 모든 행 삭제

    if (listingError) {
      return Response.json({ error: listingError.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: '데이터베이스가 초기화되었습니다. 모든 매물이 삭제되었습니다.',
    });
  } catch (error) {
    return Response.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
