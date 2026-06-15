'use client';

import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { createClient } from '@/lib/supabase/client';
import { getSession } from '@/lib/auth';

type EnsureAdminOptions = {
  router?: AppRouterInstance;
};

/** 클라이언트 관리자 페이지: 세션·권한 확인 후 supabase 반환 */
export async function ensureAdminClient({ router }: EnsureAdminOptions = {}) {
  const session = getSession();

  if (!session) {
    if (router) router.push('/login');
    else if (typeof window !== 'undefined') window.location.href = '/login';
    return { supabase: createClient(), ok: false as const };
  }

  const supabase = createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.id)
    .single();

  if (profile?.role !== 'admin') {
    if (router) router.push('/');
    else if (typeof window !== 'undefined') window.location.href = '/';
    return { supabase, ok: false as const };
  }

  return { supabase, ok: true as const };
}
