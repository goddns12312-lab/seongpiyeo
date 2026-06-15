'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ensureAdminClient } from '@/lib/admin-client';
import {
  PageShell,
  PageHero,
  PageContainer,
  StatCard,
  SurfaceCard,
} from '@/components/layout/PageShell';

const ADMIN_LINKS = [
  {
    href: '/admin/listings',
    title: '매물 관리',
    desc: '매물 승인, 수정, 삭제',
    icon: 'M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z',
  },
  {
    href: '/admin/posts',
    title: '게시글 관리',
    desc: '부적절한 게시글 삭제',
    icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2h-3l-4 4z',
  },
  {
    href: '/admin/users',
    title: '회원 관리',
    desc: '회원 조회, 정지, 권한 관리',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  },
  {
    href: '/admin/banners',
    title: '배너 관리',
    desc: '광고 배너 추가/수정',
    icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
  },
];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingCount: 0,
    activeListings: 0,
    totalUsers: 0,
    totalPosts: 0,
  });

  useEffect(() => {
    const load = async () => {
      const { supabase, ok } = await ensureAdminClient();
      if (!ok) {
        setLoading(false);
        return;
      }

      const [
        { count: pendingCount },
        { count: activeListings },
        { count: totalUsers },
        { count: totalPosts },
      ] = await Promise.all([
        supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      ]);

      setStats({
        pendingCount: pendingCount || 0,
        activeListings: activeListings || 0,
        totalUsers: totalUsers || 0,
        totalPosts: totalPosts || 0,
      });
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <PageShell>
        <PageContainer className="py-20 flex items-center justify-center">
          <p className="text-text-secondary">로딩 중...</p>
        </PageContainer>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHero
        title="관리자 대시보드"
        description="매물, 게시글, 회원, 배너를 한곳에서 관리합니다."
        breadcrumb={[{ label: '홈', href: '/' }, { label: '관리자' }]}
      />

      <PageContainer className="py-10 md:py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard label="승인 대기" value={stats.pendingCount} accent="orange" />
          <StatCard label="활성 매물" value={stats.activeListings} />
          <StatCard label="회원 수" value={stats.totalUsers} />
          <StatCard label="게시글" value={stats.totalPosts} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ADMIN_LINKS.map((item) => (
            <Link key={item.href} href={item.href}>
              <SurfaceCard hover className="p-6 h-full group">
                <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4 group-hover:bg-gold/15 transition-colors">
                  <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={item.icon} />
                  </svg>
                </div>
                <h2 className="text-text-primary font-semibold mb-2">{item.title}</h2>
                <p className="text-text-muted text-sm">{item.desc}</p>
              </SurfaceCard>
            </Link>
          ))}
        </div>
      </PageContainer>
    </PageShell>
  );
}
