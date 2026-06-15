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

type AdminUserRow = {
  id: string;
  nickname: string;
  username?: string;
  phone?: string | null;
  role: 'user' | 'admin';
  created_at: string;
  listingCount: number;
  postCount: number;
};

const ADMIN_USERS_LIMIT = 500;

function buildCountMap(rows: { user_id: string | null }[] | null): Record<string, number> {
  const map: Record<string, number> = {};
  rows?.forEach((row) => {
    if (!row.user_id) return;
    map[row.user_id] = (map[row.user_id] || 0) + 1;
  });
  return map;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    const supabase = createClient();

    const [usersRes, listingsRes, postsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select(ADMIN_USER_SELECT)
        .order('created_at', { ascending: false })
        .limit(ADMIN_USERS_LIMIT),
      supabase.from('listings').select('user_id'),
      supabase.from('posts').select('user_id'),
    ]);

    const listingCounts = buildCountMap(listingsRes.data);
    const postCounts = buildCountMap(postsRes.data);

    const merged: AdminUserRow[] = (usersRes.data || []).map((user) => ({
      ...(user as Omit<AdminUserRow, 'listingCount' | 'postCount'>),
      role: (user.role as 'user' | 'admin') || 'user',
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
      if (!q) return true;
      return (
        user.nickname.toLowerCase().includes(q) ||
        (user.username?.toLowerCase().includes(q) ?? false) ||
        (user.phone?.includes(q) ?? false)
      );
    });
  }, [users, search, roleFilter]);

  const stats = useMemo(() => {
    const adminCount = users.filter((u) => u.role === 'admin').length;
    return {
      total: users.length,
      admins: adminCount,
      users: users.length - adminCount,
    };
  }, [users]);

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

  if (loading) {
    return <div className="text-center py-12 text-text-secondary">로딩 중...</div>;
  }

  return (
    <div className="bg-bg-primary min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4">
        <Link href="/admin" className="text-gold hover:text-gold/80 text-sm mb-4 inline-block">
          ← 관리자 홈
        </Link>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">회원 관리</h1>
            <p className="text-text-secondary text-sm mt-1">회원 조회, 검색, 권한 관리</p>
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
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
        </div>

        {/* 검색·필터 */}
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
        </div>

        <p className="text-text-muted text-xs mb-3">
          {filteredUsers.length}명 표시 (최대 {ADMIN_USERS_LIMIT}명)
        </p>

        <div className="bg-bg-secondary border border-border-light rounded-lg overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-bg-tertiary border-b border-border-light">
                <th className="px-4 py-3 text-left text-text-primary font-semibold text-sm">아이디</th>
                <th className="px-4 py-3 text-left text-text-primary font-semibold text-sm">닉네임</th>
                <th className="px-4 py-3 text-left text-text-primary font-semibold text-sm">연락처</th>
                <th className="px-4 py-3 text-left text-text-primary font-semibold text-sm">권한</th>
                <th className="px-4 py-3 text-center text-text-primary font-semibold text-sm">매물</th>
                <th className="px-4 py-3 text-center text-text-primary font-semibold text-sm">게시글</th>
                <th className="px-4 py-3 text-left text-text-primary font-semibold text-sm">가입일</th>
                <th className="px-4 py-3 text-left text-text-primary font-semibold text-sm">관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
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
                  <td className="px-4 py-3 text-center text-text-primary text-sm">{user.listingCount}</td>
                  <td className="px-4 py-3 text-center text-text-primary text-sm">{user.postCount}</td>
                  <td className="px-4 py-3 text-text-secondary text-xs whitespace-nowrap">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {user.role === 'admin' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={updatingId === user.id || user.id === currentAdminId}
                        onClick={() => handleRoleChange(user.id, 'user')}
                      >
                        일반 전환
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={updatingId === user.id}
                        onClick={() => handleRoleChange(user.id, 'admin')}
                      >
                        관리자 지정
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
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
