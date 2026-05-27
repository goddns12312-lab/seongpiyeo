'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSession } from '@/lib/auth';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { ListingCard } from '@/components/listings/ListingCard';
import { PostCard } from '@/components/community/PostCard';
import { Listing, Post, Profile, AuthSession } from '@/types';

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [likedListings, setLikedListings] = useState<Listing[]>([]);
  const [posts, setPosts] = useState<(Post & { profiles?: { nickname: string } })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    setUser(session);
    fetchData(session.id);
  }, [router]);

  const fetchData = async (userId: string) => {
    try {
      const supabase = createClient();

      // Get profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Get user listings
      const { data: listingsData } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (listingsData) {
        setListings(listingsData);
      }

      // Get liked listings
      const { data: favoritesData } = await supabase
        .from('favorites')
        .select('listing_id')
        .eq('user_id', userId);

      if (favoritesData && favoritesData.length > 0) {
        const likedListingIds = favoritesData.map(f => f.listing_id);
        const { data: likedListingsData } = await supabase
          .from('listings')
          .select('*')
          .in('id', likedListingIds)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (likedListingsData) {
          setLikedListings(likedListingsData);
        }
      }

      // Get user posts
      const { data: postsData } = await supabase
        .from('posts')
        .select('*, profiles(nickname)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (postsData) {
        setPosts(postsData);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading || !user || !profile) {
    return (
      <div className="bg-bg-primary min-h-screen py-12">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-text-secondary">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-primary min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Profile Header */}
        <div className="bg-bg-secondary border border-border-light rounded-lg p-6 md:p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary mb-1">
                  {profile.nickname}
                </h1>
                <p className="text-text-secondary text-sm">@{profile.username}</p>
                {profile.phone && (
                  <p className="text-text-secondary text-sm">{profile.phone}</p>
                )}
              </div>
            </div>

            {profile.role === 'admin' && (
              <Link href="/admin">
                <Button variant="primary" size="sm">
                  관리자 페이지
                </Button>
              </Link>
            )}
          </div>

          <div className="border-t border-border-light pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gold">{listings.length}</p>
                <p className="text-text-secondary text-sm mt-1">등록된 매물</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gold">{likedListings.length}</p>
                <p className="text-text-secondary text-sm mt-1">좋아요한 매물</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gold">{posts.length}</p>
                <p className="text-text-secondary text-sm mt-1">작성한 게시글</p>
              </div>
            </div>
          </div>
        </div>

        {/* My Listings */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-text-primary">내 매물</h2>
            <Link href="/listings/new">
              <Button variant="primary">새 매물 등록</Button>
            </Link>
          </div>

          {listings && listings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="bg-bg-secondary border border-border-light rounded-lg p-8 text-center">
              <p className="text-text-secondary mb-4">등록된 매물이 없습니다.</p>
              <Link href="/listings/new">
                <Button variant="primary">첫 매물 등록하기</Button>
              </Link>
            </div>
          )}
        </section>

        {/* Liked Listings */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-6">좋아요한 매물</h2>

          {likedListings && likedListings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {likedListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="bg-bg-secondary border border-border-light rounded-lg p-8 text-center">
              <p className="text-text-secondary mb-4">좋아요한 매물이 없습니다.</p>
              <Link href="/listings">
                <Button variant="primary">매물 둘러보기</Button>
              </Link>
            </div>
          )}
        </section>

        {/* My Posts */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-text-primary">최근 게시글</h2>
            <Link href="/community/new">
              <Button variant="primary">게시글 작성</Button>
            </Link>
          </div>

          {posts && posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="bg-bg-secondary border border-border-light rounded-lg p-8 text-center">
              <p className="text-text-secondary mb-4">작성한 게시글이 없습니다.</p>
              <Link href="/community/new">
                <Button variant="primary">첫 게시글 작성하기</Button>
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
