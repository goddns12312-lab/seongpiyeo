import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      console.error('[api/secondhand/create] No authorization token provided');
      return Response.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // 토큰을 사용하여 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    console.log('[api/secondhand/create] Auth check:', {
      token: token.substring(0, 20) + '...',
      user: user ? { id: user.id.substring(0, 8) + '...', email: user.email } : null,
      error: authError?.message,
      timestamp: new Date().toISOString(),
    });

    if (!user) {
      console.error('[api/secondhand/create] User is null - login required', { error: authError?.message });
      return Response.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { title, description, price, region, imageUrls = [] } = data;

    // 유효성 검사
    if (!title || !price) {
      return Response.json(
        { error: '제목과 가격은 필수입니다' },
        { status: 400 }
      );
    }

    console.log('[api/secondhand/create] Saving item:', {
      title,
      user_id: user.id.substring(0, 8) + '...',
      region,
      price,
      imageCount: imageUrls.length,
    });

    // listings 테이블에 저장
    const { data: item, error: itemError } = await supabase
      .from('listings')
      .insert([
        {
          user_id: user.id,
          title,
          description: description || '',
          price: parseInt(price),
          region,
          main_image_url: imageUrls[0] || null,
          status: 'active',
          listing_type: 'secondhand',
        },
      ])
      .select();

    if (itemError) {
      console.error('[api/secondhand/create] DB error:', itemError.message);
      return Response.json(
        { error: itemError.message },
        { status: 500 }
      );
    }

    if (!item || item.length === 0) {
      console.error('[api/secondhand/create] Insert succeeded but no data returned');
      return Response.json(
        { error: '물품 등록에 실패했습니다.' },
        { status: 500 }
      );
    }

    const newItem = item[0];

    // 이미지 저장
    if (imageUrls.length > 0) {
      const imageData = imageUrls.map((url: string, index: number) => ({
        listing_id: newItem.id,
        image_url: url,
        order_num: index,
      }));

      const { error: imageError } = await supabase
        .from('listing_images')
        .insert(imageData);

      if (imageError) {
        console.error('[api/secondhand/create] Image error:', imageError.message);
        // 이미지 저장 실패해도 물품은 생성됨
      }
    }

    // 캐시 무효화
    revalidatePath('/');
    revalidatePath('/secondhand');
    revalidatePath(`/secondhand/${newItem.id}`);

    console.log('[api/secondhand/create] Item created:', {
      itemId: newItem.id.substring(0, 8) + '...',
      user_id: newItem.user_id?.substring(0, 8) + '...',
    });

    return Response.json({ success: true, itemId: newItem.id });
  } catch (error) {
    console.error('[api/secondhand/create] Exception:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500 }
    );
  }
}
