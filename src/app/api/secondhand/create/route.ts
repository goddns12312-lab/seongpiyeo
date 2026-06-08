import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  try {
    // pc_bang_session 쿠키에서 사용자 세션 추출
    const cookieHeader = request.headers.get('cookie');

    console.log('='.repeat(80));
    console.log('[api/secondhand/create] 📋 Cookie 디버깅 시작');
    console.log('='.repeat(80));
    console.log('[api/secondhand/create] 1️⃣ cookieHeader (raw):', {
      exists: !!cookieHeader,
      length: cookieHeader?.length || 0,
      value: cookieHeader || 'null',
    });

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

      console.log('[api/secondhand/create] 2️⃣ 파싱된 cookies:', {
        keys: Object.keys(cookies),
        cookieCount: Object.keys(cookies).length,
      });

      const sessionCookie = cookies['pc_bang_session'];
      console.log('[api/secondhand/create] 3️⃣ sessionCookie (raw):', {
        exists: !!sessionCookie,
        length: sessionCookie?.length || 0,
        value: sessionCookie || 'null',
      });

      if (sessionCookie) {
        try {
          const session = JSON.parse(sessionCookie);
          console.log('[api/secondhand/create] 4️⃣ parsedSession (JSON parse 성공):', {
            session: session,
            id: session.id || 'undefined',
            username: session.username || 'undefined',
            nickname: session.nickname || 'undefined',
            role: session.role || 'undefined',
          });

          userId = session.id;
          console.log('[api/secondhand/create] 5️⃣ userId (최종):', {
            userId: userId || 'null',
            type: typeof userId,
            length: userId?.length || 0,
          });
        } catch (e) {
          console.error('[api/secondhand/create] ❌ Session 파싱 실패:', {
            error: e instanceof Error ? e.message : String(e),
            stack: e instanceof Error ? e.stack : 'no stack',
            sessionCookie: sessionCookie,
          });
        }
      } else {
        console.warn('[api/secondhand/create] ⚠️ pc_bang_session 쿠키 없음');
      }
    } else {
      console.warn('[api/secondhand/create] ⚠️ cookie header 자체가 없음');
    }

    console.log('[api/secondhand/create] 6️⃣ 최종 결과:', {
      userIdExists: !!userId,
      userId: userId || 'null',
      willProceed: !!userId,
    });
    console.log('='.repeat(80));

    if (!userId) {
      console.error('[api/secondhand/create] ❌ userId 없음 - 401 반환');
      return Response.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    console.log('[api/secondhand/create] ✅ userId 확인 통과 - 계속 진행');

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

    // secondhand_items 테이블에 저장
    const { data: item, error: itemError } = await supabase
      .from('secondhand_items')
      .insert([
        {
          user_id: userId,
          title,
          description: description || '',
          price: parseInt(price),
          region,
          main_image_url: imageUrls[0] || null,
          status: 'active',
        },
      ])
      .select();

    console.log('[api/secondhand/create] INSERT RESULT:', {
      data: item,
      error: itemError,
      dataType: typeof item,
      dataLength: item?.length,
      firstItem: item?.[0],
    });

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
    console.log('[api/secondhand/create] NEW ITEM ID:', {
      itemId: newItem.id,
      redirectUrl: `/secondhand/${newItem.id}`,
    });

    // 이미지 저장
    if (imageUrls.length > 0) {
      const imageData = imageUrls.map((url: string, index: number) => ({
        item_id: newItem.id,
        url: url,
        order_num: index,
      }));

      const { error: imageError } = await supabase
        .from('secondhand_images')
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
