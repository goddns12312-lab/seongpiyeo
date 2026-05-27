import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();

  // 모든 쿠키 이름과 값 추출
  const allCookies: Record<string, string> = {};
  for (const cookie of cookieStore.getAll()) {
    allCookies[cookie.name] = cookie.value.substring(0, 50); // 처음 50자만
  }

  console.log('[DEBUG] 모든 쿠키:', allCookies);
  console.log('[DEBUG] 쿠키 개수:', cookieStore.getAll().length);

  // pc_bang_session 찾기
  const pcBangSession = cookieStore.get('pc_bang_session');
  console.log('[DEBUG] pc_bang_session:', {
    exists: !!pcBangSession,
    value: pcBangSession ? pcBangSession.value.substring(0, 100) : 'NOT FOUND',
  });

  return NextResponse.json({
    cookies: allCookies,
    pcBangSession: {
      exists: !!pcBangSession,
      value: pcBangSession ? pcBangSession.value : null,
    },
    message: '콘솔에서 [DEBUG] 로그를 확인하세요',
  });
}
