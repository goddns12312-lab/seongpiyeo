import { createClient } from '@/lib/supabase/server';
import { getSessionFromRequest } from '@/lib/admin-session';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.id) {
      return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const supabase = await createClient();
    const data = await request.json();
    const { title, description, price, region, imageUrls = [] } = data;

    if (!title || !price) {
      return Response.json({ error: '제목과 가격은 필수입니다' }, { status: 400 });
    }

    const { data: item, error: itemError } = await supabase
      .from('secondhand_items')
      .insert([
        {
          user_id: session.id,
          title,
          description: description || '',
          price: parseInt(price, 10),
          region,
          main_image_url: imageUrls[0] || null,
          status: 'active',
        },
      ])
      .select();

    if (itemError) {
      return Response.json({ error: itemError.message }, { status: 500 });
    }

    if (!item?.length) {
      return Response.json({ error: '물품 등록에 실패했습니다.' }, { status: 500 });
    }

    const newItem = item[0];

    if (imageUrls.length > 0) {
      const imageData = imageUrls.map((url: string, index: number) => ({
        item_id: newItem.id,
        url,
        order_num: index,
      }));

      await supabase.from('secondhand_images').insert(imageData);
    }

    revalidatePath('/');
    revalidatePath('/secondhand');
    revalidatePath(`/secondhand/${newItem.id}`);

    return Response.json({ success: true, itemId: newItem.id });
  } catch (error) {
    console.error('[api/secondhand/create]', error);
    return Response.json(
      { error: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500 }
    );
  }
}
