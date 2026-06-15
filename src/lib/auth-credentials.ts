import bcrypt from 'bcryptjs';
import { createClient } from '@/lib/supabase/client';
import { type AuthSession, saveSession } from '@/lib/auth-session';
import { validateUsername } from '@/lib/auth';

export async function registerUser(
  username: string,
  password: string,
  nickname: string,
  phone?: string
) {
  const usernameValidation = validateUsername(username);
  if (!usernameValidation.valid) {
    return { success: false, error: usernameValidation.error };
  }

  if (!password || password.length < 6) {
    return { success: false, error: '비밀번호는 6자 이상이어야 합니다' };
  }

  if (!nickname || nickname.length < 2) {
    return { success: false, error: '닉네임은 2자 이상이어야 합니다' };
  }

  try {
    const supabase = createClient();

    const { data: existingUser, error: userCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (userCheckError && userCheckError.code !== 'PGRST116') {
      return { success: false, error: '아이디 확인 중 오류가 발생했습니다: ' + userCheckError.message };
    }

    if (existingUser) {
      return { success: false, error: '이미 사용 중인 아이디입니다' };
    }

    const { data: existingNickname, error: nicknameCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('nickname', nickname)
      .single();

    if (nicknameCheckError && nicknameCheckError.code !== 'PGRST116') {
      return { success: false, error: '닉네임 확인 중 오류가 발생했습니다: ' + nicknameCheckError.message };
    }

    if (existingNickname) {
      return { success: false, error: '이미 사용 중인 닉네임입니다' };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        username,
        password_hash: passwordHash,
        nickname,
        phone: phone || null,
        role: 'user',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: '프로필 생성 실패: ' + error.message };
    }

    const session: AuthSession = {
      id: data.id,
      username: data.username,
      nickname: data.nickname,
      role: data.role,
    };
    saveSession(session);

    return { success: true, session };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { success: false, error: '회원가입 중 오류가 발생했습니다: ' + errorMessage };
  }
}

export async function loginUser(username: string, password: string) {
  if (!username || !password) {
    return { success: false, error: '아이디와 비밀번호를 입력해주세요' };
  }

  try {
    const supabase = createClient();

    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: '아이디 또는 비밀번호가 잘못되었습니다' };
      }
      return { success: false, error: '로그인 중 오류: ' + error.message };
    }

    if (!user?.password_hash) {
      return { success: false, error: '아이디 또는 비밀번호가 잘못되었습니다' };
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return { success: false, error: '아이디 또는 비밀번호가 잘못되었습니다' };
    }

    const accountStatus = user.account_status as string | undefined;
    if (accountStatus === 'suspended') {
      return { success: false, error: '정지된 계정입니다. 관리자에게 문의하세요.' };
    }
    if (accountStatus === 'deleted') {
      return { success: false, error: '탈퇴 처리된 계정입니다.' };
    }

    const session: AuthSession = {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      role: user.role,
    };
    saveSession(session);

    return { success: true, session };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { success: false, error: '로그인 중 오류가 발생했습니다: ' + errorMessage };
  }
}
