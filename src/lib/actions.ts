'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { sanitizeListingBeforeSave, sanitizeJobBeforeSave, sanitizeSecondhandBeforeSave, sanitizePostBeforeSave } from '@/lib/seo-title-auto-fix';
import { buildListingSeoDescription, buildListingImageAlt } from '@/lib/seo-metadata';

export async function deleteZeroPriceListings() {
  const supabase = await createClient();

  // 가격이 0인 매물들의 이미지 먼저 삭제
  const { data: listings } = await supabase
    .from('listings')
    .select('id')
    .eq('price', 0);

  if (listings && listings.length > 0) {
    for (const listing of listings) {
      await deleteListingImages(listing.id);
    }

    // 매물 삭제
    const { error: deleteError } = await supabase
      .from('listings')
      .delete()
      .eq('price', 0);

    if (deleteError) {
      return { error: deleteError.message, count: 0 };
    }

    revalidatePath('/');
    revalidatePath('/listings');

    return { success: true, count: listings.length };
  }

  return { success: true, count: 0 };
}

export async function createListing(data: any) {
  console.log('[createListing] Server Action 실행 시작');
  console.log('[createListing] 1. 받은 데이터:', {
    hasUserIdInData: !!data.user_id,
    userId: data.user_id || 'undefined',
    title: data.title,
    dataKeys: Object.keys(data).slice(0, 10),
  });

  const supabase = await createClient();

  // pc_bang_session 쿠키 기반 user_id 확인
  const userId = data.user_id;
  console.log('[createListing] 2. userId 확인:', { userId, exists: !!userId });

  if (!userId) {
    console.error('[createListing] userId 없음 - 에러 반환');
    return { error: '로그인이 필요합니다' };
  }

  console.log('[createListing] 3. userId 검증 통과:', { userId });

  // SEO 제목 자동 보정 적용
  const sanitized = sanitizeListingBeforeSave(data);

  // 내부용 필드 제거 (_ 로 시작하는 모든 필드: _seoApplied, _seoChanges, _seoReason 등)
  const cleanListingData = Object.fromEntries(
    Object.entries(sanitized).filter(([key]) => !key.startsWith('_'))
  );

  // SEO Description 자동 생성 (formData에 없으면 자동 생성)
  const seoDescription = data.seo_description || buildListingSeoDescription({
    region: cleanListingData.region,
    district: cleanListingData.district,
    location: cleanListingData.address,
    premium_price: cleanListingData.premium_price,
    deposit: cleanListingData.deposit,
    monthly_rent: cleanListingData.monthly_rent,
    area_sqm: cleanListingData.area_sqm,
    pc_count: cleanListingData.pc_count,
  });

  const finalData = {
    ...cleanListingData,
    seo_description: seoDescription,
    user_id: userId,
    status: 'active',
  };

  console.log('[SEO] Listing SEO applied:', {
    title: finalData.title,
    region: finalData.region,
    district: finalData.district,
    hasDescription: !!seoDescription,
  });

  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .insert([finalData])
    .select();

  if (listingError) {
    return { error: listingError.message };
  }

  if (!listing || listing.length === 0) {
    return { error: '매물 등록에 실패했습니다.' };
  }

  const newListing = listing[0];

  // 캐시 무효화
  revalidatePath('/');
  revalidatePath('/listings');
  revalidatePath(`/listings/${newListing.id}`);

  return { success: true, listingId: newListing.id };
}

export async function createListingImages(images: any[]) {
  const supabase = await createClient();

  // alt 필드를 포함하여 저장 (buildListingImageAlt로 생성된 텍스트)
  const imagesToInsert = images.map(img => ({
    listing_id: img.listing_id,
    image_url: img.image_url,
    alt: img.alt || '',
    order_num: img.order_num || 0,
  }));

  const { error: imageError } = await supabase
    .from('listing_images')
    .insert(imagesToInsert);

  if (imageError) {
    console.error('Image insert error:', imageError);
    return { error: imageError.message };
  }

  return { success: true };
}

export async function createBanner(data: any) {
  const supabase = await createClient();

  const { data: banner, error: bannerError } = await supabase
    .from('banners')
    .insert([data])
    .select();

  if (bannerError) {
    return { error: bannerError.message };
  }

  if (!banner || banner.length === 0) {
    return { error: '배너 추가에 실패했습니다.' };
  }

  revalidatePath('/');
  revalidatePath('/admin/banners');

  return { success: true, bannerId: banner[0].id };
}

export async function updateListing(id: string, data: any) {
  const supabase = await createClient();

  const { error: updateError } = await supabase
    .from('listings')
    .update(data)
    .eq('id', id);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath('/');
  revalidatePath('/listings');
  revalidatePath(`/listings/${id}`);

  return { success: true };
}

export async function deleteListingImages(listingId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('listing_images')
    .delete()
    .eq('listing_id', listingId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

/**
 * ============================================================
 * COMMUNITY 게시글 저장
 * ============================================================
 */

export async function createCommunityPost(data: any) {
  const supabase = await createClient();

  // 현재 로그인한 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: '로그인이 필요합니다' };
  }

  // SEO 제목 자동 보정 적용
  const sanitized = sanitizePostBeforeSave(data);
  console.log('[SEO] Community post title auto-fix applied:', {
    original: data.title,
    fixed: sanitized.title,
    applied: sanitized._seoApplied,
  });

  // 내부용 필드 제거 (_ 로 시작하는 모든 필드)
  const cleanPostData = Object.fromEntries(
    Object.entries(sanitized).filter(([key]) => !key.startsWith('_'))
  );

  // user_id 추가
  cleanPostData.user_id = user.id;

  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert([cleanPostData])
    .select();

  if (postError) {
    return { error: postError.message };
  }

  if (!post || post.length === 0) {
    return { error: '게시글 작성에 실패했습니다.' };
  }

  const newPost = post[0];

  // 캐시 무효화
  revalidatePath('/');
  revalidatePath('/community');
  revalidatePath(`/community/${newPost.id}`);

  return { success: true, postId: newPost.id };
}

/**
 * ============================================================
 * SECONDHAND 상품 저장
 * ============================================================
 */

export async function createSecondhandItem(data: any) {
  const supabase = await createClient();

  // 현재 로그인한 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: '로그인이 필요합니다' };
  }

  // SEO 제목 자동 보정 적용
  const sanitized = sanitizeSecondhandBeforeSave(data);
  console.log('[SEO] Secondhand item title auto-fix applied:', {
    original: data.title,
    fixed: sanitized.title,
    applied: sanitized._seoApplied,
  });

  // 내부용 필드 제거 (_ 로 시작하는 모든 필드)
  const cleanItemData = Object.fromEntries(
    Object.entries(sanitized).filter(([key]) => !key.startsWith('_'))
  );

  // user_id 추가
  cleanItemData.user_id = user.id;

  const { data: item, error: itemError } = await supabase
    .from('secondhand_items')
    .insert([cleanItemData])
    .select();

  if (itemError) {
    return { error: itemError.message };
  }

  if (!item || item.length === 0) {
    return { error: '상품 등록에 실패했습니다.' };
  }

  const newItem = item[0];

  // 캐시 무효화
  revalidatePath('/');
  revalidatePath('/secondhand');
  revalidatePath(`/secondhand/${newItem.id}`);

  return { success: true, itemId: newItem.id };
}

/**
 * ============================================================
 * EXCHANGE-INFO 게시글 저장
 * ============================================================
 */

export async function createExchangeInfoPost(data: any) {
  const supabase = await createClient();

  // 현재 로그인한 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: '로그인이 필요합니다' };
  }

  // SEO 제목 자동 보정 적용 (category: 'exchange' 추가)
  const exchangeData = { ...data, category: 'exchange' };
  const sanitized = sanitizePostBeforeSave(exchangeData);
  console.log('[SEO] Exchange-info post title auto-fix applied:', {
    original: data.title,
    fixed: sanitized.title,
    applied: sanitized._seoApplied,
  });

  // 내부용 필드 제거 (_ 로 시작하는 모든 필드)
  const cleanPostData = Object.fromEntries(
    Object.entries(sanitized).filter(([key]) => !key.startsWith('_'))
  );

  // user_id 추가
  cleanPostData.user_id = user.id;

  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert([cleanPostData])
    .select();

  if (postError) {
    return { error: postError.message };
  }

  if (!post || post.length === 0) {
    return { error: '게시글 작성에 실패했습니다.' };
  }

  const newPost = post[0];

  // 캐시 무효화
  revalidatePath('/');
  revalidatePath('/exchange-info');
  revalidatePath(`/exchange-info/${newPost.id}`);

  return { success: true, postId: newPost.id };
}

export async function deleteListing(id: string) {
  const supabase = await createClient();

  // 이미지 먼저 삭제
  const imageResult = await deleteListingImages(id);
  if (imageResult.error) {
    return { error: '이미지 삭제 실패: ' + imageResult.error };
  }

  // 매물 삭제
  const { error: deleteError } = await supabase
    .from('listings')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return { error: deleteError.message };
  }

  revalidatePath('/');
  revalidatePath('/listings');

  return { success: true };
}

export async function updateBanner(id: string, data: any) {
  const supabase = await createClient();

  const { error: updateError } = await supabase
    .from('banners')
    .update(data)
    .eq('id', id);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath('/');
  revalidatePath('/admin/banners');

  return { success: true };
}

export async function deleteBanner(id: string) {
  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from('banners')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return { error: deleteError.message };
  }

  revalidatePath('/');
  revalidatePath('/admin/banners');

  return { success: true };
}

/**
 * ============================================================
 * 게시글 수정
 * ============================================================
 */

export async function updatePost(id: string, data: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: '로그인이 필요합니다' };
  }

  // 게시글 조회
  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('user_id, category')
    .eq('id', id)
    .single();

  if (fetchError) {
    return { error: '게시글을 찾을 수 없습니다' };
  }

  // 권한 확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin';
  const isAuthor = post.user_id === user.id;
  const isNullOwner = post.user_id === null;

  // user_id가 NULL이면 관리자만 수정 가능
  if (isNullOwner && !isAdmin) {
    return { error: '수정 권한이 없습니다' };
  }

  // user_id가 있으면 관리자 또는 작성자만
  if (!isNullOwner && !isAdmin && !isAuthor) {
    return { error: '수정 권한이 없습니다' };
  }

  // 수정할 데이터 준비
  const updateData = {
    title: data.title,
    content: data.content,
    category: post.category, // 카테고리는 유지
    updated_at: new Date().toISOString(),
  };

  // 업데이트
  const { error: updateError } = await supabase
    .from('posts')
    .update(updateData)
    .eq('id', id);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath('/');
  revalidatePath('/community');
  revalidatePath('/exchange-info');
  revalidatePath(`/community/${id}`);
  revalidatePath(`/exchange-info/${id}`);

  return { success: true, postId: id };
}

export async function updateSecondhandItem(id: string, data: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: '로그인이 필요합니다' };
  }

  // 중고물품 조회
  const { data: item, error: fetchError } = await supabase
    .from('secondhand_items')
    .select('user_id')
    .eq('id', id)
    .single();

  if (fetchError) {
    return { error: '물품을 찾을 수 없습니다' };
  }

  // 권한 확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin';
  const isAuthor = item.user_id === user.id;
  const isNullOwner = item.user_id === null;

  // user_id가 NULL이면 관리자만 수정 가능
  if (isNullOwner && !isAdmin) {
    return { error: '수정 권한이 없습니다' };
  }

  // user_id가 있으면 관리자 또는 작성자만
  if (!isNullOwner && !isAdmin && !isAuthor) {
    return { error: '수정 권한이 없습니다' };
  }

  // 수정할 데이터 준비
  const updateData = {
    title: data.title,
    description: data.description,
    price: data.price,
    region: data.region,
    main_image_url: data.main_image_url,
    updated_at: new Date().toISOString(),
  };

  // 업데이트
  const { error: updateError } = await supabase
    .from('secondhand_items')
    .update(updateData)
    .eq('id', id);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath('/');
  revalidatePath('/secondhand');
  revalidatePath(`/secondhand/${id}`);

  return { success: true, itemId: id };
}

/**
 * ============================================================
 * 권한 기반 삭제 함수들
 * ============================================================
 */

export async function deletePost(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: '로그인이 필요합니다' };
  }

  // 게시글 조회
  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', id)
    .single();

  if (fetchError) {
    return { error: '게시글을 찾을 수 없습니다' };
  }

  // 권한 확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin';
  const isAuthor = post.user_id === user.id;

  if (!isAdmin && !isAuthor) {
    return { error: '삭제 권한이 없습니다' };
  }

  // status를 'deleted'로 변경 (soft delete)
  const { error: updateError } = await supabase
    .from('posts')
    .update({ status: 'deleted', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath('/');
  revalidatePath('/community');
  revalidatePath('/exchange-info');
  revalidatePath(`/community/${id}`);
  revalidatePath(`/exchange-info/${id}`);

  return { success: true };
}

export async function deleteSecondhandItem(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: '로그인이 필요합니다' };
  }

  // 중고물품 조회
  const { data: item, error: fetchError } = await supabase
    .from('secondhand_items')
    .select('user_id')
    .eq('id', id)
    .single();

  if (fetchError) {
    return { error: '물품을 찾을 수 없습니다' };
  }

  // 권한 확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin';
  const isAuthor = item.user_id === user.id;

  if (!isAdmin && !isAuthor) {
    return { error: '삭제 권한이 없습니다' };
  }

  // status를 'deleted'로 변경
  const { error: updateError } = await supabase
    .from('secondhand_items')
    .update({ status: 'deleted', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath('/');
  revalidatePath('/secondhand');
  revalidatePath(`/secondhand/${id}`);

  return { success: true };
}
