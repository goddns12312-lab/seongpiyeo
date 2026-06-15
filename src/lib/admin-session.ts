import { cookies } from 'next/headers';
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import type { AuthSession } from '@/lib/auth';

export function parseSessionFromCookieValue(raw: string | undefined): AuthSession | null {
  if (!raw) return null;

  const attempts = [raw, decodeURIComponent(raw)];
  for (const value of attempts) {
    try {
      const session = JSON.parse(value);
      if (session?.id && session?.username) {
        return session as AuthSession;
      }
    } catch {
      // try next
    }
  }
  return null;
}

export async function getSessionFromRequest(request?: Request): Promise<AuthSession | null> {
  if (request) {
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(/pc_bang_session=([^;]+)/);
      if (match?.[1]) {
        return parseSessionFromCookieValue(match[1]);
      }
    }
  }

  const cookieStore = await cookies();
  return parseSessionFromCookieValue(cookieStore.get('pc_bang_session')?.value);
}

export type AdminAuthResult =
  | { ok: true; session: AuthSession }
  | { ok: false; response: Response };

export async function requireAdminAuth(request?: Request): Promise<AdminAuthResult> {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return { ok: false, response: Response.json({ error: '로그인이 필요합니다' }, { status: 401 }) };
  }

  const supabase = await createServerClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.id)
    .maybeSingle();

  if (profile?.role !== 'admin') {
    return { ok: false, response: Response.json({ error: '관리자 권한이 필요합니다' }, { status: 403 }) };
  }

  return { ok: true, session };
}

export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase service role is not configured');
  }
  return createSupabaseJsClient(url, key);
}
