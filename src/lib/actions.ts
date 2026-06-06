'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { sanitizeListingBeforeSave, sanitizeJobBeforeSave, sanitizeSecondhandBeforeSave, sanitizePostBeforeSave } from '@/lib/seo-title-auto-fix';

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
  const supabase = await createClient();

  // SEO 제목 자동 보정 적용
  const sanitized = sanitizeListingBeforeSave(data);
  console.log('[SEO] Listing title auto-fix applied:', {
    original: data.title,
    fixed: sanitized.title,
    applied: sanitized._seoApplied,
  });

  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .insert([sanitized])
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

  const { error: imageError } = await supabase
    .from('listing_images')
    .insert(images);

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
