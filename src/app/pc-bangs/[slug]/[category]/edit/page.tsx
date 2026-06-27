'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getSession } from '@/lib/auth-session';
import { ListingFormNew } from '@/components/listings/ListingFormNew';

export default function EditPcBangListingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.category as string;

  const [listing, setListing] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const loadListing = async () => {
      try {
        const session = getSession();
        if (!session) {
          router.push('/login');
          return;
        }

        const supabase = createClient();

        const { data: listingData, error: listingError } = await supabase
          .from('listings')
          .select('*')
          .eq('id', id)
          .single();

        if (listingError || !listingData) {
          setError('매물을 찾을 수 없습니다.');
          setLoading(false);
          return;
        }

        if (listingData.user_id !== session.id && session.role !== 'admin') {
          setError('이 매물을 수정할 권한이 없습니다.');
          setLoading(false);
          return;
        }

        const { data: imageData } = await supabase
          .from('listing_images')
          .select('*')
          .eq('listing_id', id)
          .order('order_num', { ascending: true });

        setListing(listingData);
        setImages(imageData || []);
        setIsOwner(true);
        setLoading(false);
      } catch (err) {
        console.error('Load error:', err);
        setError('매물 정보를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    };

    loadListing();
  }, [id, router]);

  if (loading) {
    return (
      <div className="bg-bg-primary min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-text-secondary">
          로딩 중...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-bg-primary min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-900/20 border border-red-900 text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <button
            onClick={() => router.back()}
            className="text-gold hover:text-gold/80"
          >
            ← 뒤로 가기
          </button>
        </div>
      </div>
    );
  }

  if (!isOwner || !listing) {
    return (
      <div className="bg-bg-primary min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-text-secondary">
          권한이 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-primary min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">매물 수정</h1>
          <p className="text-text-secondary">매물 정보를 수정합니다.</p>
        </div>

        <ListingFormNew
          initialData={listing}
          mode="edit"
          listingId={id}
          existingImages={images}
        />
      </div>
    </div>
  );
}
