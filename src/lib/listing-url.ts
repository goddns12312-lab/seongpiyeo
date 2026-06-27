export function getListingPublicPath(region: string | null | undefined, id: string): string {
  const regionSegment = encodeURIComponent(region || 'all');
  return `/pc-bangs/${regionSegment}/${encodeURIComponent(id)}`;
}

export function getListingEditPath(region: string | null | undefined, id: string): string {
  return `${getListingPublicPath(region, id)}/edit`;
}

export function getListingCanonicalUrl(siteUrl: string, region: string | null | undefined, id: string): string {
  return `${siteUrl}${getListingPublicPath(region, id)}`;
}
