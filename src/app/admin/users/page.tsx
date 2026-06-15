'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ensureAdminClient } from '@/lib/admin-client';
import { getSession } from '@/lib/auth-session';
import { ADMIN_USER_SELECT } from '@/lib/account-queries';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';

type AccountStatus = 'active' | 'suspended' | 'deleted';

type AdminUserRow = {
  id: string;
  nickname: string;
  username?: string;
  phone?: string | null;
  role: 'user' | 'admin';
  account_status?: AccountStatus | null;
  created_at: string;
  listingCount: number;
  postCount: number;
};

const ADMIN_USERS_LIMIT = 500;

const STATUS_LABELS: Record<AccountStatus, string> = {
  active: '정상',
  suspended: '정지',
  deleted: '탈퇴',
};

const STAT_CARDS = [
  { key: 'total', label: '전체 회원', accent: 'from-gold/20 to-transparent', icon: 'users' },
  { key: 'admins', label: '관리자', accent: 'from-amber-500/15 to-transparent', icon: 'shield' },
  { key: 'users', label: '일반 회원', accent: 'from-slate-400/10 to-transparent', icon: 'user' },
  { key: 'suspended', label: '정지', accent: 'from-orange-500/15 to-transparent', icon: 'pause' },
  { key: 'deleted', label: '탈퇴', accent: 'from-red-500/15 to-transparent', icon: 'ban' },
] as const;

function buildCountMap(rows: { user_id: string | null }[] | null): Record<string, number> {
  const map: Record<string, number> = {};
  rows?.forEach((row) => {
    if (!row.user_id) return;
    map[row.user_id] = (map[row.user_id] || 0) + 1;
  });
  return map;
}

function normalizeStatus(status: string | null | undefined): AccountStatus {
  if (status === 'suspended' || status === 'deleted') return status;
  return 'active';
}

function userInitial(nickname: string) {
  return nickname.trim().charAt(0).toUpperCase() || '?';
}

function StatIcon({ type }: { type: (typeof STAT_CARDS)[number]['icon'] }) {
  const cls = 'w-5 h-5 text-gold';
  switch (type) {
    case 'shield':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    case 'user':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case 'pause':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'ban':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      );
    default:
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
  }
}

function LoadingSkeleton() {
  return (
    <div className="bg-bg-primary min-h-screen py-10 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-4 w-24 bg-bg-tertiary rounded mb-8" />
        <div className="h-10 w-48 bg-bg-tertiary rounded mb-3" />
        <div className="h-4 w-72 bg-bg-tertiary rounded mb-10" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-bg-secondary border border-border-light rounded-2xl" />
          ))}
        </div>
        <div className="h-16 bg-bg-secondary border border-border-light rounded-2xl mb-6" />
        <div className="h-96 bg-bg-secondary border border-border-light rounded-2xl" />
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrationHint, setMigrationHint] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | AccountStatus>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchUsers = useCallback(async () => {
    const supabase = createClient();

    let usersRes = await supabase
      .from('profiles')
      .select(ADMIN_USER_SELECT)
      .order('created_at', { ascending: false })
      .limit(ADMIN_USERS_LIMIT);

    if (usersRes.error?.message?.includes('account_status')) {
      setMigrationHint(
        'account_status 컬럼이 없습니다. Supabase SQL Editor에서 013_profiles_account_status.sql을 실행하면 정지·탈퇴 기능을 사용할 수 있습니다.'
      );
      usersRes = await supabase
        .from('profiles')
        .select('id, nickname, username, phone, role, created_at')
        .order('created_at', { ascending: false })
        .limit(ADMIN_USERS_LIMIT);
    } else if (usersRes.error) {
      setMigrationHint(usersRes.error.message);
    } else {
      setMigrationHint(null);
    }

    const [listingsRes, postsRes] = await Promise.all([
      supabase.from('listings').select('user_id'),
      supabase.from('posts').select('user_id'),
    ]);

    const listingCounts = buildCountMap(listingsRes.data);
    const postCounts = buildCountMap(postsRes.data);

    const merged: AdminUserRow[] = (usersRes.data || []).map((user) => ({
      ...(user as Omit<AdminUserRow, 'listingCount' | 'postCount' | 'account_status'>),
      role: (user.role as 'user' | 'admin') || 'user',
      account_status: normalizeStatus((user as { account_status?: string }).account_status),
      listingCount: listingCounts[user.id] || 0,
      postCount: postCounts[user.id] || 0,
    }));

    setUsers(merged);
    setLoading(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      const session = getSession();
      setCurrentAdminId(session?.id || null);

      const { ok } = await ensureAdminClient({ router });
      if (!ok) {
        setLoading(false);
        return;
      }
      await fetchUsers();
    };
    init();
  }, [router, fetchUsers]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter !== 'all' && user.role !== roleFilter) return false;
      const status = normalizeStatus(user.account_status);
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      if (!q) return true;
      return (
        user.nickname.toLowerCase().includes(q) ||
        (user.username?.toLowerCase().includes(q) ?? false) ||
        (user.phone?.includes(q) ?? false)
      );
    });
  }, [users, search, roleFilter, statusFilter]);

  const stats = useMemo(() => {
    const adminCount = users.filter((u) => u.role === 'admin').length;
    const suspended = users.filter((u) => normalizeStatus(u.account_status) === 'suspended').length;
    const deleted = users.filter((u) => normalizeStatus(u.account_status) === 'deleted').length;
    return {
      total: users.length,
      admins: adminCount,
      users: users.length - adminCount,
      suspended,
      deleted,
    };
  }, [users]);

  const statValues: Record<(typeof STAT_CARDS)[number]['key'], number> = stats;

  const callAdminApi = async (path: string, body: Record<string, unknown>) => {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || '요청 실패');
    }
    return data;
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    setOpenMenuId(null);
    if (userId === currentAdminId && newRole === 'user') {
      alert('본인의 관리자 권한은 해제할 수 없습니다.');
      return;
    }

    const label = newRole === 'admin' ? '관리자' : '일반 회원';
    if (!confirm(`이 회원의 권한을 "${label}"(으)로 변경하시겠습니까?`)) return;

    setUpdatingId(userId);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
      if (error) {
        alert('권한 변경 실패: ' + error.message);
        return;
      }
      await fetchUsers();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusChange = async (userId: string, nickname: string, status: AccountStatus) => {
    setOpenMenuId(null);
    if (userId === currentAdminId && status !== 'active') {
      alert('본인 계정은 정지·탈퇴 처리할 수 없습니다.');
      return;
    }

    const label = STATUS_LABELS[status];
    const extra =
      status === 'suspended' || status === 'deleted'
        ? '\n\n해당 회원의 공개 매물·게시글도 함께 숨김 처리됩니다.'
        : '';
    if (!confirm(`"${nickname}" 회원을 "${label}" 상태로 변경하시겠습니까?${extra}`)) return;

    setUpdatingId(userId);
    try {
      await callAdminApi('/api/admin/users/status', { userId, status, hideContent: true });
      await fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : '상태 변경 실패');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleResetPassword = async (userId: string, nickname: string) => {
    setOpenMenuId(null);
    const newPassword = prompt(`"${nickname}" 회원의 새 비밀번호 (6자 이상):`);
    if (!newPassword) return;
    if (newPassword.length < 6) {
      alert('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    if (!confirm('비밀번호를 초기화하시겠습니까? 회원에게 새 비밀번호를 안내해주세요.')) return;

    setUpdatingId(userId);
    try {
      await callAdminApi('/api/admin/users/reset-password', { userId, newPassword });
      alert('비밀번호가 초기화되었습니다.');
    } catch (err) {
      alert(err instanceof Error ? err.message : '비밀번호 초기화 실패');
    } finally {
      setUpdatingId(null);
    }
  };

  const contentLink = (type: 'listings' | 'posts', user: AdminUserRow) => {
    const params = new URLSearchParams({ user: user.id, nickname: user.nickname });
    return `/admin/${type}?${params.toString()}`;
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="page-shell">
      <div className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-gold/5 via-transparent to-transparent pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10">
          {/* 헤더 */}
          <nav className="flex items-center gap-2 text-sm text-text-muted mb-8">
            <Link href="/admin" className="hover:text-gold transition-colors">
              관리자
            </Link>
            <span className="text-border-light">/</span>
            <span className="text-text-secondary">회원 관리</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <StatIcon type="users" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
                  회원 관리
                </h1>
              </div>
              <p className="text-text-secondary text-sm sm:text-base max-w-xl leading-relaxed">
                회원 조회 · 권한 변경 · 정지·탈퇴 · 비밀번호 초기화 · 콘텐츠 바로가기
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-muted bg-bg-secondary/80 border border-border-light rounded-full px-4 py-2 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              실시간 {filteredUsers.length}명 표시 · 최대 {ADMIN_USERS_LIMIT}명
            </div>
          </div>

          {migrationHint && (
            <div className="mb-8 flex gap-3 p-4 sm:p-5 rounded-2xl bg-amber-500/8 border border-amber-500/25 backdrop-blur-sm">
              <div className="shrink-0 w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-amber-200/90 text-sm leading-relaxed">{migrationHint}</p>
            </div>
          )}

          {/* 통계 카드 */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
            {STAT_CARDS.map((card) => (
              <div
                key={card.key}
                className="group relative overflow-hidden rounded-2xl border border-border-light bg-bg-secondary/80 backdrop-blur-sm p-4 sm:p-5 transition-all duration-300 hover:border-gold/30 hover:shadow-lg hover:shadow-gold/5"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-60`} />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-text-muted text-xs font-medium tracking-wide uppercase">
                      {card.label}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center group-hover:bg-gold/15 transition-colors">
                      <StatIcon type={card.icon} />
                    </div>
                  </div>
                  <p
                    className={`text-2xl sm:text-3xl font-bold tabular-nums ${
                      card.key === 'suspended'
                        ? 'text-orange-400'
                        : card.key === 'deleted'
                          ? 'text-red-400'
                          : 'text-gold'
                    }`}
                  >
                    {statValues[card.key]}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* 검색·필터 */}
          <div className="mb-6 rounded-2xl border border-border-light bg-bg-secondary/60 backdrop-blur-sm p-4 sm:p-5">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="닉네임, 아이디, 연락처 검색..."
                  className="w-full pl-11 pr-4 py-3 bg-bg-primary/50 border border-border-light rounded-xl text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-1.5 p-1 bg-bg-primary/50 border border-border-light rounded-xl">
                  {(['all', 'admin', 'user'] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setRoleFilter(role)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                        roleFilter === role
                          ? 'bg-gold text-bg-primary shadow-sm'
                          : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                      }`}
                    >
                      {role === 'all' ? '전체' : role === 'admin' ? '관리자' : '일반'}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 p-1 bg-bg-primary/50 border border-border-light rounded-xl overflow-x-auto">
                  {(['all', 'active', 'suspended', 'deleted'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                        statusFilter === status
                          ? 'bg-gold text-bg-primary shadow-sm'
                          : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                      }`}
                    >
                      {status === 'all' ? '전체' : STATUS_LABELS[status]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 테이블 */}
          <div className="rounded-2xl border border-border-light bg-bg-secondary/40 backdrop-blur-sm overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px]">
                <thead>
                  <tr className="border-b border-border-light bg-bg-tertiary/60">
                    <th className="px-5 py-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                      회원
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                      연락처
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-semibold text-text-muted uppercase tracking-wider">
                      권한
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-semibold text-text-muted uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-semibold text-text-muted uppercase tracking-wider">
                      활동
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                      가입일
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light/60">
                  {filteredUsers.map((user) => {
                    const status = normalizeStatus(user.account_status);
                    const isSelf = user.id === currentAdminId;
                    const busy = updatingId === user.id;
                    const menuOpen = openMenuId === user.id;

                    return (
                      <tr
                        key={user.id}
                        className={`group transition-colors ${
                          busy ? 'opacity-60' : 'hover:bg-bg-tertiary/40'
                        }`}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border ${
                                user.role === 'admin'
                                  ? 'bg-gold/15 text-gold border-gold/30'
                                  : 'bg-bg-tertiary text-text-secondary border-border-light'
                              }`}
                            >
                              {userInitial(user.nickname)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-text-primary truncate">{user.nickname}</p>
                              <p className="text-xs text-text-muted truncate">@{user.username || '-'}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-text-secondary whitespace-nowrap">
                          {user.phone || '—'}
                        </td>

                        <td className="px-4 py-4 text-center">
                          <Badge variant={user.role === 'admin' ? 'primary' : 'secondary'}>
                            {user.role === 'admin' ? '관리자' : '일반'}
                          </Badge>
                        </td>

                        <td className="px-4 py-4 text-center">
                          <Badge
                            variant={
                              status === 'active' ? 'success' : status === 'suspended' ? 'info' : 'danger'
                            }
                          >
                            {STATUS_LABELS[status]}
                          </Badge>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {user.listingCount > 0 ? (
                              <Link
                                href={contentLink('listings', user)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 transition-colors"
                              >
                                매물 {user.listingCount}
                              </Link>
                            ) : (
                              <span className="text-xs text-text-muted px-2">매물 0</span>
                            )}
                            {user.postCount > 0 ? (
                              <Link
                                href={contentLink('posts', user)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 transition-colors"
                              >
                                글 {user.postCount}
                              </Link>
                            ) : (
                              <span className="text-xs text-text-muted px-2">글 0</span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-xs text-text-secondary whitespace-nowrap tabular-nums">
                          {formatDate(user.created_at)}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="relative inline-block" ref={menuOpen ? menuRef : undefined}>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => setOpenMenuId(menuOpen ? null : user.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-border-light bg-bg-primary/60 text-text-primary hover:border-gold/40 hover:text-gold transition-all disabled:opacity-50"
                            >
                              {busy ? (
                                <>
                                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                  처리 중
                                </>
                              ) : (
                                <>
                                  관리
                                  <svg className={`w-3.5 h-3.5 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </>
                              )}
                            </button>

                            {menuOpen && !busy && (
                              <div className="absolute right-0 top-full mt-2 z-20 w-44 py-1.5 rounded-xl border border-border-light bg-bg-secondary shadow-xl shadow-black/20 origin-top transition-all">
                                {user.role === 'admin' ? (
                                  <MenuItem
                                    disabled={isSelf}
                                    onClick={() => handleRoleChange(user.id, 'user')}
                                    label="일반 회원 전환"
                                  />
                                ) : (
                                  <MenuItem
                                    onClick={() => handleRoleChange(user.id, 'admin')}
                                    label="관리자 지정"
                                  />
                                )}

                                <div className="my-1.5 border-t border-border-light/60" />

                                {status !== 'suspended' && !isSelf && (
                                  <MenuItem
                                    onClick={() => handleStatusChange(user.id, user.nickname, 'suspended')}
                                    label="계정 정지"
                                    warn
                                  />
                                )}
                                {status !== 'active' && !isSelf && (
                                  <MenuItem
                                    onClick={() => handleStatusChange(user.id, user.nickname, 'active')}
                                    label="계정 복구"
                                  />
                                )}
                                {status !== 'deleted' && !isSelf && (
                                  <MenuItem
                                    onClick={() => handleStatusChange(user.id, user.nickname, 'deleted')}
                                    label="탈퇴 처리"
                                    danger
                                  />
                                )}

                                <div className="my-1.5 border-t border-border-light/60" />

                                <MenuItem
                                  onClick={() => handleResetPassword(user.id, user.nickname)}
                                  label="비밀번호 초기화"
                                />
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-14 h-14 rounded-2xl bg-bg-tertiary border border-border-light flex items-center justify-center mb-4">
                  <StatIcon type="users" />
                </div>
                <p className="text-text-primary font-medium mb-1">조건에 맞는 회원이 없습니다</p>
                <p className="text-text-muted text-sm">검색어나 필터를 변경해 보세요</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuItem({
  label,
  onClick,
  disabled,
  danger,
  warn,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  warn?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        danger
          ? 'text-red-400 hover:bg-red-500/10'
          : warn
            ? 'text-orange-400 hover:bg-orange-500/10'
            : 'text-text-primary hover:bg-bg-tertiary hover:text-gold'
      }`}
    >
      {label}
    </button>
  );
}
