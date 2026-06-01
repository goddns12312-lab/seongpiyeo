'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getSession } from '@/lib/auth';
import { Button } from '@/components/ui/Button';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingCount: 0,
    activeListings: 0,
    totalUsers: 0,
    totalPosts: 0,
  });

  useEffect(() => {
    const checkAdmin = async () => {
      const session = getSession();

      if (!session) {
        window.location.href = '/login';
        return;
      }

      const supabase = createClient();

      // Check if admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.id)
        .single();

      if (profile?.role !== 'admin') {
        window.location.href = '/';
        return;
      }

      // Get stats
      const { count: pendingCount } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: activeListings } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: totalPosts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      setStats({
        pendingCount: pendingCount || 0,
        activeListings: activeListings || 0,
        totalUsers: totalUsers || 0,
        totalPosts: totalPosts || 0,
      });

      setLoading(false);
    };

    checkAdmin();
  }, []);

  if (loading) {
    return (
      <div className="bg-bg-primary min-h-screen py-12 flex items-center justify-center">
        <p className="text-text-secondary">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-primary min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-text-primary mb-8">관리자 대시보드</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-bg-secondary border border-border-light rounded-lg p-6">
            <p className="text-text-secondary text-sm mb-2">승인 대기</p>
            <p className="text-3xl font-bold text-gold">{stats.pendingCount}</p>
          </div>
          <div className="bg-bg-secondary border border-border-light rounded-lg p-6">
            <p className="text-text-secondary text-sm mb-2">활성 매물</p>
            <p className="text-3xl font-bold text-gold">{stats.activeListings}</p>
          </div>
          <div className="bg-bg-secondary border border-border-light rounded-lg p-6">
            <p className="text-text-secondary text-sm mb-2">회원 수</p>
            <p className="text-3xl font-bold text-gold">{stats.totalUsers}</p>
          </div>
          <div className="bg-bg-secondary border border-border-light rounded-lg p-6">
            <p className="text-text-secondary text-sm mb-2">게시글</p>
            <p className="text-3xl font-bold text-gold">{stats.totalPosts}</p>
          </div>
        </div>

        {/* Management Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/admin/listings">
            <div className="bg-bg-secondary border border-border-light rounded-lg p-6 hover:border-gold transition-colors cursor-pointer group">
              <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-text-primary font-semibold mb-2">매물 관리</h3>
              <p className="text-text-secondary text-sm">매물 승인, 수정, 삭제</p>
            </div>
          </Link>

          <Link href="/admin/posts">
            <div className="bg-bg-secondary border border-border-light rounded-lg p-6 hover:border-gold transition-colors cursor-pointer group">
              <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h3 className="text-text-primary font-semibold mb-2">게시글 관리</h3>
              <p className="text-text-secondary text-sm">부적절한 게시글 삭제</p>
            </div>
          </Link>

          <Link href="/admin/users">
            <div className="bg-bg-secondary border border-border-light rounded-lg p-6 hover:border-gold transition-colors cursor-pointer group">
              <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 12H9m4 5H9m6-9h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-text-primary font-semibold mb-2">회원 관리</h3>
              <p className="text-text-secondary text-sm">사용자 정보 조회</p>
            </div>
          </Link>

          <Link href="/admin/banners">
            <div className="bg-bg-secondary border border-border-light rounded-lg p-6 hover:border-gold transition-colors cursor-pointer group">
              <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h3 className="text-text-primary font-semibold mb-2">배너 관리</h3>
              <p className="text-text-secondary text-sm">광고 배너 추가/수정</p>
            </div>
          </Link>

          <Link href="/admin/scraper">
            <div className="bg-bg-secondary border border-border-light rounded-lg p-6 hover:border-gold transition-colors cursor-pointer group">
              <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-text-primary font-semibold mb-2">외부 사이트 크롤링</h3>
              <p className="text-text-secondary text-sm">PC천국에서 매물 가져오기</p>
            </div>
          </Link>

        </div>
      </div>
    </div>
  );
}
