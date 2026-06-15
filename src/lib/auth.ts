import bcrypt from 'bcryptjs';
import { createClient } from '@/lib/supabase/client';

export interface AuthSession {
  id: string;
  username: string;
  nickname: string;
  role: string;
}

const SESSION_KEY = 'pc_bang_session';

export function saveSession(session: AuthSession) {
  if (typeof window !== 'undefined') {
    // localStorage에 저장
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    // 쿠키에도 저장 (API 요청 시 credentials: 'include'로 전달되도록)
    const maxAge = 7 * 24 * 60 * 60; // 7일
    const cookieValue = encodeURIComponent(JSON.stringify(session));

    // production에서는 Secure 플래그 추가, localhost에서는 제외
    const isProduction = typeof window !== 'undefined' &&
                         window.location.hostname !== 'localhost' &&
                         !window.location.hostname.startsWith('127.');

    const secureFlag = isProduction ? '; Secure' : '';
    const cookieString = `${SESSION_KEY}=${cookieValue}; max-age=${maxAge}; path=/; SameSite=Lax${secureFlag}`;

    document.cookie = cookieString;

    console.log('[Auth] ✓ 세션 저장됨 (localStorage + 쿠키):', {
      sessionKey: SESSION_KEY,
      userId: session.id,
      cookieLength: cookieValue.length,
      isProduction,
      cookieSet: true,
    });
  }
}

export function getSession(): AuthSession | null {
  if (typeof window !== 'undefined') {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  }
  return null;
}

export function clearSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}

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
      console.error('[checkUsernameAvailability] 중복 체크 오류:', error);
      return { available: false, message: '아이디 확인 중 오류가 발생했습니다' };
    }

    if (existingUser) {
      return { available: false, message: '이미 사용 중인 아이디입니다' };
    }

    return { available: true, message: '사용 가능한 아이디입니다' };
  } catch (err) {
    console.error('[checkUsernameAvailability] 예외 발생:', err);
    return { available: false, message: '아이디 확인 중 오류가 발생했습니다' };
  }
}

export async function registerUser(
  username: string,
  password: string,
  nickname: string,
  phone?: string
) {
  console.log('[registerUser] 회원가입 시작:', { username, nickname });

  const usernameValidation = validateUsername(username);
  if (!usernameValidation.valid) {
    console.log('[registerUser] 아이디 유효성 검사 실패:', usernameValidation.error);
    return { success: false, error: usernameValidation.error };
  }

  if (!password || password.length < 6) {
    console.log('[registerUser] 비밀번호 유효성 검사 실패');
    return { success: false, error: '비밀번호는 6자 이상이어야 합니다' };
  }

  if (!nickname || nickname.length < 2) {
    console.log('[registerUser] 닉네임 유효성 검사 실패');
    return { success: false, error: '닉네임은 2자 이상이어야 합니다' };
  }

  try {
    console.log('[registerUser] Supabase 클라이언트 초기화 중...');
    const supabase = createClient();

    console.log('[registerUser] 중복 아이디 체크 중...');
    // 중복 아이디 체크
    const { data: existingUser, error: userCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (userCheckError && userCheckError.code !== 'PGRST116') {
      console.error('[registerUser] 아이디 중복 체크 오류:', userCheckError);
      return { success: false, error: '아이디 확인 중 오류가 발생했습니다: ' + userCheckError.message };
    }

    if (existingUser) {
      console.log('[registerUser] 이미 사용 중인 아이디:', username);
      return { success: false, error: '이미 사용 중인 아이디입니다' };
    }

    console.log('[registerUser] 중복 닉네임 체크 중...');
    // 중복 닉네임 체크
    const { data: existingNickname, error: nicknameCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('nickname', nickname)
      .single();

    if (nicknameCheckError && nicknameCheckError.code !== 'PGRST116') {
      console.error('[registerUser] 닉네임 중복 체크 오류:', nicknameCheckError);
      return { success: false, error: '닉네임 확인 중 오류가 발생했습니다: ' + nicknameCheckError.message };
    }

    if (existingNickname) {
      console.log('[registerUser] 이미 사용 중인 닉네임:', nickname);
      return { success: false, error: '이미 사용 중인 닉네임입니다' };
    }

    console.log('[registerUser] 비밀번호 해싱 중...');
    // 비밀번호 해싱
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('[registerUser] 비밀번호 해싱 완료');

    console.log('[registerUser] 프로필 생성 중...');
    // 프로필 생성
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
      console.error('[registerUser] 프로필 생성 오류:', error);
      return { success: false, error: '프로필 생성 실패: ' + error.message };
    }

    console.log('[registerUser] 프로필 생성 성공, 세션 저장 중...');
    // 세션 저장
    const session: AuthSession = {
      id: data.id,
      username: data.username,
      nickname: data.nickname,
      role: data.role,
    };
    saveSession(session);

    console.log('[registerUser] 회원가입 완료:', { userId: data.id, username: data.username });
    return { success: true, session };
  } catch (err) {
    console.error('[registerUser] 예기치 않은 오류:', err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { success: false, error: '회원가입 중 오류가 발생했습니다: ' + errorMessage };
  }
}

export async function loginUser(username: string, password: string) {
  console.log('[loginUser] 로그인 시작:', { username });

  if (!username || !password) {
    console.log('[loginUser] 아이디 또는 비밀번호 누락');
    return { success: false, error: '아이디와 비밀번호를 입력해주세요' };
  }

  try {
    console.log('[loginUser] Supabase 클라이언트 초기화 중...');
    const supabase = createClient();

    console.log('[loginUser] 사용자 조회 중...');
    // 사용자 조회
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (error) {
      console.error('[loginUser] 사용자 조회 오류:', error);
      if (error.code === 'PGRST116') {
        return { success: false, error: '아이디 또는 비밀번호가 잘못되었습니다' };
      }
      return { success: false, error: '로그인 중 오류: ' + error.message };
    }

    if (!user) {
      console.log('[loginUser] 사용자를 찾을 수 없습니다:', username);
      return { success: false, error: '아이디 또는 비밀번호가 잘못되었습니다' };
    }

    console.log('[loginUser] 사용자 정보:', {
      username: user.username,
      hasPasswordHash: !!user.password_hash,
      passwordHashLength: user.password_hash?.length || 0,
    });

    if (!user.password_hash) {
      console.error('[loginUser] 비밀번호 해시가 없습니다');
      return { success: false, error: '계정 설정 오류입니다. 관리자에게 문의해주세요' };
    }

    console.log('[loginUser] 비밀번호 검증 중...');
    // 비밀번호 검증
    let passwordMatch = false;
    try {
      passwordMatch = await bcrypt.compare(password, user.password_hash);
    } catch (compareErr) {
      console.error('[loginUser] bcrypt 비교 오류:', compareErr);
      return { success: false, error: '비밀번호 검증 중 오류가 발생했습니다' };
    }

    if (!passwordMatch) {
      console.log('[loginUser] 비밀번호 불일치');
      return { success: false, error: '아이디 또는 비밀번호가 잘못되었습니다' };
    }

    const accountStatus = user.account_status as string | undefined;
    if (accountStatus === 'suspended') {
      return { success: false, error: '정지된 계정입니다. 관리자에게 문의하세요.' };
    }
    if (accountStatus === 'deleted') {
      return { success: false, error: '탈퇴 처리된 계정입니다.' };
    }

    console.log('[loginUser] 비밀번호 검증 성공, 세션 저장 중...');
    // 세션 저장
    const session: AuthSession = {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      role: user.role,
    };
    saveSession(session);

    console.log('[loginUser] 로그인 완료:', { userId: user.id, username: user.username });
    return { success: true, session };
  } catch (err) {
    console.error('[loginUser] 예기치 않은 오류:', err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { success: false, error: '로그인 중 오류가 발생했습니다: ' + errorMessage };
  }
}

export function logout() {
  clearSession();
}
