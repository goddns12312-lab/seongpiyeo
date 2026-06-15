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
import { LISTING_LIST_SELECT } from '@/lib/listing-queries';
import { MY_PROFILE_SELECT, MY_POST_SELECT } from '@/lib/account-queries';

const MY_LISTINGS_LIMIT = 50;
const LIKED_LISTINGS_LIMIT = 30;

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
    fetchData(session.id, session.nickname, session.role);
  }, [router]);

  const fetchData = async (userId: string, nickname: string, role: AuthSession['role']) => {
    try {
      const supabase = createClient();

      const profileRes = await supabase
        .from('profiles')
        .select(MY_PROFILE_SELECT)
        .eq('id', userId)
        .single();

      if (profileRes.data) {
        setProfile(profileRes.data as Profile);
      } else if (profileRes.error) {
        // profiles 조회 실패 시 세션 정보로 최소 프로필 구성
        setProfile({
          id: userId,
          email: '',
          nickname,
          role,
          created_at: new Date().toISOString(),
        });
      }

      const [listingsRes, postsRes] = await Promise.all([
        supabase
          .from('listings')
          .select(LISTING_LIST_SELECT)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(MY_LISTINGS_LIMIT),
        supabase
          .from('posts')
          .select(MY_POST_SELECT)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      if (listingsRes.data) {
        setListings(
          listingsRes.data.map((listing) => ({
            ...listing,
            commentCount: 0,
            favoriteCount: 0,
          })) as Listing[]
        );
      }

      if (postsRes.data) {
        setPosts(
          postsRes.data.map((post) => ({
            ...post,
            profiles: { nickname },
          })) as (Post & { profiles?: { nickname: string } })[]
        );
      }

      // 좋아요 매물: JOIN 대신 2단계 조회 (RLS/스키마 호환)
      const { data: favoritesData } = await supabase
        .from('favorites')
        .select('listing_id')
        .eq('user_id', userId)
        .limit(LIKED_LISTINGS_LIMIT);

      if (favoritesData && favoritesData.length > 0) {
        const likedIds = favoritesData.map((f) => f.listing_id);
        const { data: likedListingsData } = await supabase
          .from('listings')
          .select(LISTING_LIST_SELECT)
          .in('id', likedIds)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (likedListingsData) {
          setLikedListings(
            likedListingsData.map((listing) => ({
              ...listing,
              commentCount: 0,
              favoriteCount: 0,
            })) as Listing[]
          );
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="bg-bg-primary min-h-screen py-12">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-text-secondary">로딩 중...</p>
        </div>
      </div>
    );
  }

  const displayProfile = profile ?? {
    id: user.id,
    email: '',
    nickname: user.nickname,
    role: user.role,
    created_at: new Date().toISOString(),
  };

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
                  {displayProfile.nickname}
                </h1>
                <p className="text-text-secondary text-sm">@{user.username}</p>
                {displayProfile.phone && (
                  <p className="text-text-secondary text-sm">{displayProfile.phone}</p>
                )}
              </div>
            </div>

            {displayProfile.role === 'admin' && (
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

          {listings.length > 0 ? (
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

          {likedListings.length > 0 ? (
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

          {posts.length > 0 ? (
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
