import { SITE_CONFIG } from './site';

/** 프로덕션에서 사용 중인 기본 OG/로고 이미지 */
export const DEFAULT_OG_IMAGE_PATH = '/logo-icon.png';

export function getOgImageUrl(path: string = DEFAULT_OG_IMAGE_PATH): string {
  return `${SITE_CONFIG.url}${path}`;
}

export function buildOgImageEntry(alt: string) {
  return {
    url: getOgImageUrl(),
    width: 1200,
    height: 630,
    alt,
    type: 'image/png' as const,
  };
}

export const SEO_OG_IMAGES = {
  default: DEFAULT_OG_IMAGE_PATH,
  listings: DEFAULT_OG_IMAGE_PATH,
  community: DEFAULT_OG_IMAGE_PATH,
  jobs: DEFAULT_OG_IMAGE_PATH,
  secondhand: DEFAULT_OG_IMAGE_PATH,
} as const;
