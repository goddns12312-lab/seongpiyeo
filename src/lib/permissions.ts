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
export async function canEditPost(postId: string, token?: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    // 한 번에 user와 post 정보 조회
    const { data: { user }, error: authError } = token
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser();

    if (authError) {
      console.error('[canEditPost] auth.getUser() 오류:', authError);
      return false;
    }

    if (!user) {
      return false;
    }

    // 사용자 프로필 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, id, username')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[canEditPost] profiles 쿼리 오류:', profileError);
      return false;
    }

    if (!profile) {
      console.warn('[canEditPost] 프로필 없음 (profile === null)');
      return false;
    }

    const isAdmin = profile?.role === 'admin';

    if (isAdmin) {
      return true;
    }

    // 작성자 확인
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('user_id, title')
      .eq('id', postId)
      .single();

    if (postError) {
      console.error('[canEditPost] posts 쿼리 오류:', postError);
      return false;
    }

    const isAuthor = post?.user_id === user.id;

    return isAuthor;
  } catch (error) {
    console.error('[permissions] canEditPost EXCEPTION:', error);
    return false;
  }
}

/**
 * 게시글(posts) 삭제 권한 확인
 */
export async function canDeletePost(postId: string, token?: string): Promise<boolean> {
  return canEditPost(postId, token); // 수정 권한과 동일
}

/**
 * 중고물품(secondhand_items) 수정 권한 확인
 */
export async function canEditSecondhand(itemId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('[canEditSecondhand] auth.getUser() 오류:', authError);
      return false;
    }

    if (!user) {
      return false;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, id, username')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[canEditSecondhand] profiles 쿼리 오류:', profileError);
      return false;
    }

    const isAdmin = profile?.role === 'admin';

    if (isAdmin) {
      return true;
    }

    const { data: item, error: itemError } = await supabase
      .from('secondhand_items')
      .select('user_id')
      .eq('id', itemId)
      .single();

    if (itemError) {
      console.error('[canEditSecondhand] secondhand_items 쿼리 오류:', itemError);
      return false;
    }

    const isAuthor = item?.user_id === user.id;

    return isAuthor;
  } catch (error) {
    console.error('[permissions] canEditSecondhand EXCEPTION:', error);
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
export async function canEditListing(listingId: string, token?: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = token
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser();

    if (authError) {
      console.error('[canEditListing] auth.getUser() 오류:', authError);
      return false;
    }

    if (!user) {
      return false;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, id, username')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[canEditListing] profiles 쿼리 오류:', profileError);
      return false;
    }

    const isAdmin = profile?.role === 'admin';

    if (isAdmin) {
      return true;
    }

    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('user_id')
      .eq('id', listingId)
      .single();

    if (listingError) {
      console.error('[canEditListing] listings 쿼리 오류:', listingError);
      return false;
    }

    const isAuthor = listing?.user_id === user.id;

    return isAuthor;
  } catch (error) {
    console.error('[permissions] canEditListing EXCEPTION:', error);
    return false;
  }
}

/**
 * 매물(listings) 삭제 권한 확인
 */
export async function canDeleteListing(listingId: string, token?: string): Promise<boolean> {
  return canEditListing(listingId, token);
}
