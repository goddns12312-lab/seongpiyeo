'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSession, AuthSession } from '@/lib/auth-session';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { ListingCard } from '@/components/listings/ListingCard';
import { PostCard } from '@/components/community/PostCard';
import { Listing, Post, Profile } from '@/types';
import {
  PageShell,
  PageContainer,
  StatCard,
  SectionHeader,
  EmptyState,
  SurfaceCard,
} from '@/components/layout/PageShell';

/** mypage 전용 — 존재하지 않을 수 있는 컬럼(idx 등) 제외 */
const MY_LISTING_SELECT =
  'id, title, price_type, price, deposit, monthly_rent, premium_price, region, district, area_sqm, pc_count, main_image_url, thumbnail_url, view_count, created_at, status';

const MY_POST_SELECT = 'id, title, category, view_count, status, created_at, user_id';

const MY_LISTINGS_LIMIT = 50;
const LIKED_LISTINGS_LIMIT = 30;

function profileFromSession(session: AuthSession): Profile {
  return {
    id: session.id,
    email: '',
    nickname: session.nickname,
    role: session.role as Profile['role'],
    created_at: new Date().toISOString(),
  };
}

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [likedListings, setLikedListings] = useState<Listing[]>([]);
  const [posts, setPosts] = useState<(Post & { profiles?: { nickname: string } })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const session = getSession();
      if (!session) {
        router.push('/login');
        setLoading(false);
        return;
      }

      if (cancelled) return;

      setUser(session);
      setProfile(profileFromSession(session));

      const supabase = createClient();

      // 프로필 추가 정보 (username 기준 — 로그인과 동일)
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('id, nickname, phone, role')
        .eq('username', session.username)
        .maybeSingle();

      if (!cancelled && profileRow) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                id: profileRow.id || prev.id,
                nickname: profileRow.nickname || prev.nickname,
                phone: profileRow.phone ?? prev.phone,
                role: (profileRow.role as Profile['role']) || prev.role,
              }
            : profileFromSession(session)
        );
      }

      const userId = profileRow?.id || session.id;

      const [listingsRes, postsRes] = await Promise.all([
        supabase
          .from('listings')
          .select(MY_LISTING_SELECT)
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

      if (!cancelled && listingsRes.data) {
        setListings(
          listingsRes.data.map((listing) => ({
            ...listing,
            commentCount: 0,
            favoriteCount: 0,
          })) as Listing[]
        );
      }

      if (!cancelled && postsRes.data) {
        setPosts(
          postsRes.data.map((post) => ({
            ...post,
            profiles: { nickname: session.nickname },
          })) as (Post & { profiles?: { nickname: string } })[]
        );
      }

      // favorites 테이블 없을 수 있음 — 실패해도 무시
      const { data: favoritesData, error: favoritesError } = await supabase
        .from('favorites')
        .select('listing_id')
        .eq('user_id', userId)
        .limit(LIKED_LISTINGS_LIMIT);

      if (!cancelled && !favoritesError && favoritesData && favoritesData.length > 0) {
        const likedIds = favoritesData.map((f) => f.listing_id);
        const { data: likedListingsData } = await supabase
          .from('listings')
          .select(MY_LISTING_SELECT)
          .in('id', likedIds)
          .eq('status', 'active');

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

      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading || !user || !profile) {
    return (
      <PageShell>
        <PageContainer className="py-20 text-center">
          <div className="inline-block w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-text-secondary">로딩 중...</p>
        </PageContainer>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageContainer className="py-10 md:py-12">
        <SurfaceCard className="p-6 md:p-8 mb-10">
          <div className="flex items-start justify-between mb-8 gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gold/15 border border-gold/25 flex items-center justify-center shrink-0">
                <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-1">{profile.nickname}</h1>
                <p className="text-text-muted text-sm">@{user.username}</p>
                {profile.phone && <p className="text-text-secondary text-sm mt-1">{profile.phone}</p>}
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

          <div className="border-t border-border-light/60 pt-8">
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="등록된 매물" value={listings.length} />
              <StatCard label="좋아요한 매물" value={likedListings.length} />
              <StatCard label="작성한 게시글" value={posts.length} />
            </div>
          </div>
        </SurfaceCard>

        <section className="mb-10">
          <SectionHeader
            title="내 매물"
            action={
              <Link href="/listings/new">
                <Button variant="primary" size="sm">새 매물 등록</Button>
              </Link>
            }
          />

          {listings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="등록된 매물이 없습니다"
              action={
                <Link href="/listings/new">
                  <Button variant="primary">첫 매물 등록하기</Button>
                </Link>
              }
            />
          )}
        </section>

        <section className="mb-10">
          <SectionHeader title="좋아요한 매물" />

          {likedListings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {likedListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="좋아요한 매물이 없습니다"
              action={
                <Link href="/listings">
                  <Button variant="primary">매물 둘러보기</Button>
                </Link>
              }
            />
          )}
        </section>

        <section className="mb-10">
          <SectionHeader
            title="최근 게시글"
            action={
              <Link href="/community/new">
                <Button variant="primary" size="sm">게시글 작성</Button>
              </Link>
            }
          />

          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="작성한 게시글이 없습니다"
              action={
                <Link href="/community/new">
                  <Button variant="primary">첫 게시글 작성하기</Button>
                </Link>
              }
            />
          )}
        </section>
      </PageContainer>
    </PageShell>
  );
}
