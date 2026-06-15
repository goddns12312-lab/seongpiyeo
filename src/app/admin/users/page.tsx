'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ensureAdminClient } from '@/lib/admin-client';
import { getSession } from '@/lib/auth';
import { ADMIN_USER_SELECT } from '@/lib/account-queries';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
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

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrationHint, setMigrationHint] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | AccountStatus>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);

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

  if (loading) {
    return <div className="text-center py-12 text-text-secondary">로딩 중...</div>;
  }

  return (
    <div className="bg-bg-primary min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4">
        <Link href="/admin" className="text-gold hover:text-gold/80 text-sm mb-4 inline-block">
          ← 관리자 홈
        </Link>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">회원 관리</h1>
            <p className="text-text-secondary text-sm mt-1">
              회원 조회, 정지·탈퇴, 비밀번호 초기화, 콘텐츠 바로가기
            </p>
          </div>
        </div>

        {migrationHint && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-200 text-sm">
            {migrationHint}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-bg-secondary border border-border-light rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gold">{stats.total}</p>
            <p className="text-text-secondary text-xs mt-1">전체 회원</p>
          </div>
          <div className="bg-bg-secondary border border-border-light rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gold">{stats.admins}</p>
            <p className="text-text-secondary text-xs mt-1">관리자</p>
          </div>
          <div className="bg-bg-secondary border border-border-light rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gold">{stats.users}</p>
            <p className="text-text-secondary text-xs mt-1">일반 회원</p>
          </div>
          <div className="bg-bg-secondary border border-border-light rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-orange-400">{stats.suspended}</p>
            <p className="text-text-secondary text-xs mt-1">정지</p>
          </div>
          <div className="bg-bg-secondary border border-border-light rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{stats.deleted}</p>
            <p className="text-text-secondary text-xs mt-1">탈퇴</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="닉네임, 아이디, 연락처 검색..."
            className="flex-1 px-4 py-2 bg-bg-secondary border border-border-light rounded-lg text-text-primary text-sm focus:outline-none focus:border-gold"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'user')}
            className="px-4 py-2 bg-bg-secondary border border-border-light rounded-lg text-text-primary text-sm focus:outline-none focus:border-gold"
          >
            <option value="all">전체 권한</option>
            <option value="admin">관리자만</option>
            <option value="user">일반 회원만</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | AccountStatus)}
            className="px-4 py-2 bg-bg-secondary border border-border-light rounded-lg text-text-primary text-sm focus:outline-none focus:border-gold"
          >
            <option value="all">전체 상태</option>
            <option value="active">정상</option>
            <option value="suspended">정지</option>
            <option value="deleted">탈퇴</option>
          </select>
        </div>

        <p className="text-text-muted text-xs mb-3">
          {filteredUsers.length}명 표시 (최대 {ADMIN_USERS_LIMIT}명)
        </p>

        <div className="bg-bg-secondary border border-border-light rounded-lg overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="bg-bg-tertiary border-b border-border-light">
                <th className="px-4 py-3 text-left text-text-primary font-semibold text-sm">아이디</th>
                <th className="px-4 py-3 text-left text-text-primary font-semibold text-sm">닉네임</th>
                <th className="px-4 py-3 text-left text-text-primary font-semibold text-sm">연락처</th>
                <th className="px-4 py-3 text-left text-text-primary font-semibold text-sm">권한</th>
                <th className="px-4 py-3 text-left text-text-primary font-semibold text-sm">상태</th>
                <th className="px-4 py-3 text-center text-text-primary font-semibold text-sm">매물</th>
                <th className="px-4 py-3 text-center text-text-primary font-semibold text-sm">게시글</th>
                <th className="px-4 py-3 text-left text-text-primary font-semibold text-sm">가입일</th>
                <th className="px-4 py-3 text-left text-text-primary font-semibold text-sm">관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const status = normalizeStatus(user.account_status);
                const isSelf = user.id === currentAdminId;
                const busy = updatingId === user.id;

                return (
                  <tr
                    key={user.id}
                    className="border-b border-border-light hover:bg-bg-tertiary/50 transition-colors last:border-b-0"
                  >
                    <td className="px-4 py-3 text-text-secondary text-sm">{user.username || '-'}</td>
                    <td className="px-4 py-3 text-text-primary font-medium">{user.nickname}</td>
                    <td className="px-4 py-3 text-text-secondary text-sm">{user.phone || '-'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={user.role === 'admin' ? 'primary' : 'secondary'}>
                        {user.role === 'admin' ? '관리자' : '일반'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          status === 'active' ? 'success' : status === 'suspended' ? 'info' : 'danger'
                        }
                      >
                        {STATUS_LABELS[status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      {user.listingCount > 0 ? (
                        <Link
                          href={contentLink('listings', user)}
                          className="text-gold hover:underline"
                        >
                          {user.listingCount}
                        </Link>
                      ) : (
                        <span className="text-text-muted">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      {user.postCount > 0 ? (
                        <Link href={contentLink('posts', user)} className="text-gold hover:underline">
                          {user.postCount}
                        </Link>
                      ) : (
                        <span className="text-text-muted">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs whitespace-nowrap">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                        {user.role === 'admin' ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={busy || isSelf}
                            onClick={() => handleRoleChange(user.id, 'user')}
                          >
                            일반 전환
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={busy}
                            onClick={() => handleRoleChange(user.id, 'admin')}
                          >
                            관리자
                          </Button>
                        )}

                        {status !== 'suspended' && !isSelf && (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={busy}
                            onClick={() => handleStatusChange(user.id, user.nickname, 'suspended')}
                          >
                            정지
                          </Button>
                        )}

                        {status !== 'active' && !isSelf && (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={busy}
                            onClick={() => handleStatusChange(user.id, user.nickname, 'active')}
                          >
                            복구
                          </Button>
                        )}

                        {status !== 'deleted' && !isSelf && (
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={busy}
                            onClick={() => handleStatusChange(user.id, user.nickname, 'deleted')}
                          >
                            탈퇴
                          </Button>
                        )}

                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={busy}
                          onClick={() => handleResetPassword(user.id, user.nickname)}
                        >
                          비번 초기화
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-text-secondary">
            <p>조건에 맞는 회원이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
