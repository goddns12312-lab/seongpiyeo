/** Supabase Storage 이미지 URL 경량화 (render API → WebP, 미지원 시 원본) */
export function getOptimizedImageUrl(url: string, width: number, quality = 75): string {
  if (!url) return url;

  try {
    if (url.includes('.supabase.co/storage/v1/object/public/')) {
      const renderUrl = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
      const parsed = new URL(renderUrl);
      parsed.searchParams.set('width', String(width));
      parsed.searchParams.set('quality', String(quality));
      parsed.searchParams.set('format', 'webp');
      return parsed.toString();
    }
  } catch {
    // fall through
  }

  return url;
}

export function getBannerImageUrl(url: string, isMobile = false): string {
  if (!url) return url;

  try {
    if (url.includes('.supabase.co/storage/v1/object/public/')) {
      const renderUrl = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
      const parsed = new URL(renderUrl);
      parsed.searchParams.set('width', String(isMobile ? 720 : 1200));
      parsed.searchParams.set('quality', '70');
      parsed.searchParams.set('resize', 'contain');
      if (!url.toLowerCase().includes('.gif')) {
        parsed.searchParams.set('format', 'webp');
      }
      return parsed.toString();
    }
  } catch {
    // fall through
  }

  return url;
}
