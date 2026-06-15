'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ensureAdminClient } from '@/lib/admin-client';
import { ADMIN_USER_SELECT } from '@/lib/account-queries';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { Profile } from '@/types';

const ADMIN_USERS_LIMIT = 500;

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('profiles')
      .select(ADMIN_USER_SELECT)
      .order('created_at', { ascending: false })
      .limit(ADMIN_USERS_LIMIT);

    setUsers((data || []) as Profile[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      const { ok } = await ensureAdminClient({ router });
      if (!ok) {
        setLoading(false);
        return;
      }
      await fetchUsers();
    };
    init();
  }, [router, fetchUsers]);

  if (loading) {
    return <div className="text-center py-12">로딩 중...</div>;
  }

  return (
    <div className="bg-bg-primary min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-text-primary mb-8">회원 관리</h1>

        <div className="bg-bg-secondary border border-border-light rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-bg-tertiary border-b border-border-light">
                <th className="px-6 py-4 text-left text-text-primary font-semibold text-sm">닉네임</th>
                <th className="px-6 py-4 text-left text-text-primary font-semibold text-sm">연락처</th>
                <th className="px-6 py-4 text-left text-text-primary font-semibold text-sm">권한</th>
                <th className="px-6 py-4 text-left text-text-primary font-semibold text-sm">가입일</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border-light hover:bg-bg-tertiary/50 transition-colors last:border-b-0">
                  <td className="px-6 py-4 text-text-primary font-medium">{user.nickname}</td>
                  <td className="px-6 py-4 text-text-secondary text-sm">{user.phone || '-'}</td>
                  <td className="px-6 py-4">
                    <Badge variant={user.role === 'admin' ? 'primary' : 'secondary'}>
                      {user.role === 'admin' ? '관리자' : '일반사용자'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-text-secondary text-sm">
                    {formatDate(user.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12 text-text-secondary">
            <p>사용자가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
