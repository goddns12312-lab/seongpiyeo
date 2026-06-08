import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  try {
    // pc_bang_session 쿠키에서 사용자 세션 추출
    const cookieHeader = request.headers.get('cookie');
    console.log('[api/secondhand/create] 1. Cookie header 존재 여부:', !!cookieHeader);
    if (cookieHeader) {
      console.log('[api/secondhand/create] 1-1. Cookie header 내용:', cookieHeader.substring(0, 200) + '...');
    }

    let userId: string | null = null;

    if (cookieHeader) {
      const cookies = cookieHeader.split('; ').reduce((acc, cookie) => {
        const eqIndex = cookie.indexOf('=');
        if (eqIndex > -1) {
          const key = cookie.substring(0, eqIndex);
          const value = cookie.substring(eqIndex + 1);
          acc[key] = decodeURIComponent(value);
        }
        return acc;
      }, {} as Record<string, string>);

      console.log('[api/secondhand/create] 2. 파싱된 cookies 키 목록:', Object.keys(cookies));
      console.log('[api/secondhand/create] 2-1. pc_bang_session 존재:', !!cookies['pc_bang_session']);

      const sessionCookie = cookies['pc_bang_session'];
      if (sessionCookie) {
        try {
          const session = JSON.parse(sessionCookie);
          userId = session.id;
          console.log('[api/secondhand/create] 3. Session 파싱 성공:', {
            userId: userId?.substring(0, 8) + '...',
            username: session.username,
            hasId: !!session.id,
          });
        } catch (e) {
          console.error('[api/secondhand/create] 3-1. Session 파싱 실패:', {
            error: e instanceof Error ? e.message : String(e),
            sessionCookie: sessionCookie?.substring(0, 100) || 'null',
          });
        }
      }
    }

    console.log('[api/secondhand/create] 4. 최종 userId:', { exists: !!userId, value: userId || 'null' });

    if (!userId) {
      console.error('[api/secondhand/create] 5. userId 없음 - 401 반환');
      return Response.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    console.log('[api/secondhand/create] 6. userId 확인 통과 - 계속 진행');

    const supabase = await createClient();

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
      user_id: userId.substring(0, 8) + '...',
      region,
      price,
      imageCount: imageUrls.length,
    });

    // listings 테이블에 저장 (필요한 id만 반환)
    const { data: item, error: itemError } = await supabase
      .from('listings')
      .insert([
        {
          user_id: userId,
          title,
          description: description || '',
          price: parseInt(price),
          region,
          main_image_url: imageUrls[0] || null,
          status: 'active',
          listing_type: 'secondhand',
        },
      ])
      .select('id');

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
