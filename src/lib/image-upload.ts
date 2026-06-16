'use client';

import type { SupabaseClient } from '@supabase/supabase-js';

const MAX_WIDTH = 1920;
const JPEG_QUALITY = 0.82;
const SKIP_COMPRESS_BYTES = 300 * 1024;

/** 업로드 전 클라이언트 리사이즈·압축 (원본 300KB 이하는 그대로) */
export async function compressImageFile(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.size <= SKIP_COMPRESS_BYTES) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;

    if (width > MAX_WIDTH) {
      height = Math.round(height * (MAX_WIDTH / width));
      width = MAX_WIDTH;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return file;
    }

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
    );

    if (!blob || blob.size >= file.size) {
      return file;
    }

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

const BANNER_MAX_WIDTH = 1200;
const BANNER_JPEG_QUALITY = 0.78;

/** 배너 전용: GIF/PNG 포함 항상 JPEG로 변환·리사이즈 (Lighthouse 용량 개선) */
export async function compressBannerFile(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;

    if (width > BANNER_MAX_WIDTH) {
      height = Math.round(height * (BANNER_MAX_WIDTH / width));
      width = BANNER_MAX_WIDTH;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return file;
    }

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', BANNER_JPEG_QUALITY)
    );

    if (!blob) {
      return file;
    }

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'banner';
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

/** Supabase Storage에 파일을 병렬 업로드 */
export async function uploadFilesToStorage(
  supabase: SupabaseClient,
  bucket: string,
  files: File[],
  pathPrefix: string,
  onProgress?: (completed: number, total: number) => void
): Promise<string[]> {
  const total = files.length;
  let completed = 0;

  const results = await Promise.all(
    files.map(async (file) => {
      const compressed = await compressImageFile(file);
      const safeName = compressed.name.replace(/[^\w.\-가-힣]/g, '_');
      const path = `${pathPrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${safeName}`;

      const { error } = await supabase.storage.from(bucket).upload(path, compressed, {
        cacheControl: '31536000',
        upsert: false,
      });

      completed += 1;
      onProgress?.(completed, total);

      if (error) {
        console.error('Upload error:', error.message);
        return null;
      }

      return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    })
  );

  return results.filter((url): url is string => url !== null);
}
