import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/** 공개 매물 조회용 — cookies() 미사용으로 SSR/캐시 성능 개선 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
