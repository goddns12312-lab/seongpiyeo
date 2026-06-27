export const FRESH_LISTING_POOL_LIMIT = 5000;

type FreshListingBase = {
  id: string;
  region?: string | null;
  district?: string | null;
  price_type?: string | null;
  created_at?: string | null;
};

type FreshOrderOptions<T extends FreshListingBase> = {
  seed: number;
  page?: number;
  perPage?: number;
  groupBy: (listing: T) => string | null | undefined;
};

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function uniqueById<T extends FreshListingBase>(items: T[]): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];

  for (const item of items) {
    if (!item.id || seen.has(item.id)) continue;
    seen.add(item.id);
    unique.push(item);
  }

  return unique;
}

export function createFreshSeed(rawSeed?: string): number {
  const parsed = rawSeed ? Number.parseInt(rawSeed, 10) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  return Date.now();
}

export function buildFreshPageHref(
  basePath: string,
  page: number,
  params: Record<string, string | number | null | undefined> = {}
): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue;
    searchParams.set(key, String(value));
  }

  searchParams.set('page', String(page));
  const query = searchParams.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function orderListingsFresh<T extends FreshListingBase>(
  listings: T[],
  options: FreshOrderOptions<T>
): T[] {
  const uniqueListings = uniqueById(listings);
  const groups = new Map<string, T[]>();

  for (const listing of uniqueListings) {
    const groupKey = options.groupBy(listing) || listing.region || listing.price_type || 'unknown';
    const group = groups.get(groupKey) || [];
    group.push(listing);
    groups.set(groupKey, group);
  }

  const orderedGroups = [...groups.entries()]
    .map(([key, items]) => ({
      key,
      items: [...items].sort((a, b) => {
        const aHash = hashString(`${options.seed}:${key}:${a.id}:${a.created_at || ''}`);
        const bHash = hashString(`${options.seed}:${key}:${b.id}:${b.created_at || ''}`);
        return aHash - bHash;
      }),
    }))
    .sort((a, b) => hashString(`${options.seed}:group:${a.key}`) - hashString(`${options.seed}:group:${b.key}`));

  const result: T[] = [];
  const maxGroupLength = Math.max(0, ...orderedGroups.map((group) => group.items.length));

  for (let round = 0; round < maxGroupLength; round += 1) {
    const groupCount = orderedGroups.length;
    const start = groupCount > 0 ? hashString(`${options.seed}:round:${round}`) % groupCount : 0;

    for (let offset = 0; offset < groupCount; offset += 1) {
      const group = orderedGroups[(start + offset) % groupCount];
      const item = group.items[round];
      if (item) result.push(item);
    }
  }

  return uniqueById(result);
}

export function getFreshListingPage<T extends FreshListingBase>(
  listings: T[],
  options: FreshOrderOptions<T>
): { items: T[]; ordered: T[] } {
  const ordered = orderListingsFresh(listings, options);
  const page = Math.max(1, options.page || 1);
  const perPage = Math.max(1, options.perPage || 20);
  const start = (page - 1) * perPage;

  return {
    ordered,
    items: ordered.slice(start, start + perPage),
  };
}
