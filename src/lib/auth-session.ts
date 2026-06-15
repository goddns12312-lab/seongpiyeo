export interface AuthSession {
  id: string;
  username: string;
  nickname: string;
  role: string;
}

const SESSION_KEY = 'pc_bang_session';

export function saveSession(session: AuthSession) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    const maxAge = 7 * 24 * 60 * 60;
    const cookieValue = encodeURIComponent(JSON.stringify(session));
    const isProduction =
      typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost' &&
      !window.location.hostname.startsWith('127.');
    const secureFlag = isProduction ? '; Secure' : '';
    document.cookie = `${SESSION_KEY}=${cookieValue}; max-age=${maxAge}; path=/; SameSite=Lax${secureFlag}`;
    window.dispatchEvent(new Event('pc_bang_session_change'));
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
    window.dispatchEvent(new Event('pc_bang_session_change'));
  }
}

export function logout() {
  clearSession();
}
