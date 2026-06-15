import { createClient } from '@/lib/supabase/client';

export type { AuthSession } from '@/lib/auth-session';
export { saveSession, getSession, clearSession, logout } from '@/lib/auth-session';

export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username) {
    return { valid: false, error: '아이디를 입력해주세요' };
  }
  if (username.length < 4) {
    return { valid: false, error: '아이디는 4자 이상이어야 합니다' };
  }
  if (username.length > 20) {
    return { valid: false, error: '아이디는 20자 이하여야 합니다' };
  }
  if (!/^[a-zA-Z0-9]+$/.test(username)) {
    return { valid: false, error: '아이디는 영문과 숫자만 사용할 수 있습니다' };
  }
  return { valid: true };
}

export async function checkUsernameAvailability(username: string): Promise<{ available: boolean; message: string }> {
  const validation = validateUsername(username);
  if (!validation.valid) {
    return { available: false, message: validation.error || '아이디 형식이 올바르지 않습니다' };
  }

  try {
    const supabase = createClient();
    const { data: existingUser, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (error && error.code !== 'PGRST116') {
      return { available: false, message: '아이디 확인 중 오류가 발생했습니다' };
    }

    if (existingUser) {
      return { available: false, message: '이미 사용 중인 아이디입니다' };
    }

    return { available: true, message: '사용 가능한 아이디입니다' };
  } catch {
    return { available: false, message: '아이디 확인 중 오류가 발생했습니다' };
  }
}
