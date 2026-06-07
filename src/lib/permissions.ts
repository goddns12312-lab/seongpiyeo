/**
 * 게시글 권한 관리 함수
 * - 관리자: 모든 게시글 수정/삭제 가능
 * - 작성자: 자신의 글만 수정/삭제 가능
 * - 기타: 권한 없음
 */

import { createClient } from '@/lib/supabase/server';

/**
 * 현재 로그인한 사용자가 관리자인지 확인
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return false;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    return profile?.role === 'admin';
  } catch (error) {
    console.error('[permissions] isAdmin error:', error);
    return false;
  }
}

/**
 * 현재 로그인한 사용자의 ID 조회
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error('[permissions] getCurrentUserId error:', error);
    return null;
  }
}

/**
 * 게시글(posts) 수정 권한 확인
 */
export async function canEditPost(postId: string): Promise<boolean> {
  try {
    const [userId, adminStatus] = await Promise.all([
      getCurrentUserId(),
      isAdmin(),
    ]);

    if (!userId) return false; // 비로그인
    if (adminStatus) return true; // 관리자는 모두 가능

    // 작성자만 가능
    const supabase = await createClient();
    const { data: post } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    return post?.user_id === userId;
  } catch (error) {
    console.error('[permissions] canEditPost error:', error);
    return false;
  }
}

/**
 * 게시글(posts) 삭제 권한 확인
 */
export async function canDeletePost(postId: string): Promise<boolean> {
  return canEditPost(postId); // 수정 권한과 동일
}

/**
 * 중고물품(secondhand_items) 수정 권한 확인
 */
export async function canEditSecondhand(itemId: string): Promise<boolean> {
  try {
    const [userId, adminStatus] = await Promise.all([
      getCurrentUserId(),
      isAdmin(),
    ]);

    if (!userId) return false;
    if (adminStatus) return true;

    const supabase = await createClient();
    const { data: item } = await supabase
      .from('secondhand_items')
      .select('user_id')
      .eq('id', itemId)
      .single();

    return item?.user_id === userId;
  } catch (error) {
    console.error('[permissions] canEditSecondhand error:', error);
    return false;
  }
}

/**
 * 중고물품(secondhand_items) 삭제 권한 확인
 */
export async function canDeleteSecondhand(itemId: string): Promise<boolean> {
  return canEditSecondhand(itemId);
}

/**
 * 매물(listings) 수정 권한 확인
 */
export async function canEditListing(listingId: string): Promise<boolean> {
  try {
    const [userId, adminStatus] = await Promise.all([
      getCurrentUserId(),
      isAdmin(),
    ]);

    if (!userId) return false;
    if (adminStatus) return true;

    const supabase = await createClient();
    const { data: listing } = await supabase
      .from('listings')
      .select('user_id')
      .eq('id', listingId)
      .single();

    return listing?.user_id === userId;
  } catch (error) {
    console.error('[permissions] canEditListing error:', error);
    return false;
  }
}

/**
 * 매물(listings) 삭제 권한 확인
 */
export async function canDeleteListing(listingId: string): Promise<boolean> {
  return canEditListing(listingId);
}
