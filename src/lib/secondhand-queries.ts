import { cache } from 'react';
import { createPublicClient } from '@/lib/supabase/public';

export const SECONDHAND_DETAIL_SELECT =
  'id, title, description, price, region, status, created_at, main_image_url, user_id, updated_at';

export const SECONDHAND_LIST_SELECT =
  'id, title, description, price, region, status, created_at, main_image_url';

/** 요청당 1회 — metadata + layout + page 중복 조회 방지 */
export const getSecondhandById = cache(async (id: string) => {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('secondhand_items')
    .select(`${SECONDHAND_DETAIL_SELECT}, secondhand_images(url, order_num)`)
    .eq('id', id)
    .single();

  return data;
});
