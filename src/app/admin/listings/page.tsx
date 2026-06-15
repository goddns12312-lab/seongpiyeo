'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ensureAdminClient } from '@/lib/admin-client';
import { ADMIN_LISTING_SELECT } from '@/lib/account-queries';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatPrice, formatDate } from '@/lib/utils';
import { Listing } from '@/types';

const ADMIN_LISTINGS_LIMIT = 500;

export default function AdminListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('listings')
      .select(ADMIN_LISTING_SELECT)
      .order('created_at', { ascending: false })
      .limit(ADMIN_LISTINGS_LIMIT);

    setListings((data || []) as Listing[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      const { ok } = await ensureAdminClient({ router });
      if (!ok) {
        setLoading(false);
        return;
      }
      await fetchListings();
    };
    init();
  }, [router, fetchListings]);

  const handleApprove = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('listings').update({ status: 'active' }).eq('id', id);
    if (!error) fetchListings();
  };

  const handleReject = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('listings').update({ status: 'hidden' }).eq('id', id);
    if (!error) fetchListings();
  };

  if (loading) {
    return <div className="text-center py-12">로딩 중...</div>;
  }

  return (
    <div className="bg-bg-primary min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-text-primary mb-8">매물 관리</h1>

        <div className="overflow-x-auto bg-bg-secondary border border-border-light rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light">
                <th className="px-6 py-3 text-left text-text-primary font-semibold">제목</th>
                <th className="px-6 py-3 text-left text-text-primary font-semibold">가격</th>
                <th className="px-6 py-3 text-left text-text-primary font-semibold">상태</th>
                <th className="px-6 py-3 text-left text-text-primary font-semibold">등록일</th>
                <th className="px-6 py-3 text-left text-text-primary font-semibold">작업</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr key={listing.id} className="border-b border-border-light hover:bg-bg-tertiary transition-colors">
                  <td className="px-6 py-3 text-text-primary">{listing.title}</td>
                  <td className="px-6 py-3 text-gold font-semibold">{formatPrice(listing.price)}</td>
                  <td className="px-6 py-3">
                    <Badge
                      variant={
                        listing.status === 'active'
                          ? 'success'
                          : listing.status === 'pending'
                            ? 'info'
                            : 'danger'
                      }
                    >
                      {listing.status === 'pending' && '승인 대기'}
                      {listing.status === 'active' && '활성'}
                      {listing.status === 'sold' && '거래 완료'}
                      {listing.status === 'hidden' && '비공개'}
                    </Badge>
                  </td>
                  <td className="px-6 py-3 text-text-secondary text-xs">
                    {formatDate(listing.created_at)}
                  </td>
                  <td className="px-6 py-3 space-x-2">
                    {listing.status === 'pending' && (
                      <>
                        <Button variant="primary" size="sm" onClick={() => handleApprove(listing.id)}>
                          승인
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleReject(listing.id)}>
                          거절
                        </Button>
                      </>
                    )}
                    {listing.status !== 'pending' && (
                      <Button variant="danger" size="sm" onClick={() => handleReject(listing.id)}>
                        숨김
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {listings.length === 0 && (
          <div className="text-center py-12 text-text-secondary">
            <p>매물이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
