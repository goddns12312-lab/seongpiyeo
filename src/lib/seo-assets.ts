import { SITE_CONFIG } from './site';

/** 프로덕션 OG 이미지 (1200×630 권장) */
export const DEFAULT_OG_IMAGE_PATH = '/423432.png';

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export function getOgImageUrl(path: string = DEFAULT_OG_IMAGE_PATH): string {
  return `${SITE_CONFIG.url}${path}`;
}

export function buildOgImageEntry(alt: string, path: string = DEFAULT_OG_IMAGE_PATH) {
  return {
    url: getOgImageUrl(path),
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
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
