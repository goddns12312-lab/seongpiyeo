import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export function CommunitySearchBar({ defaultQuery = '' }: { defaultQuery?: string }) {
  return (
    <form action="/community" method="get" className="flex gap-2 mb-8">
      <input
        type="search"
        name="q"
        defaultValue={defaultQuery}
        placeholder="제목·내용 검색"
        className="flex-1 px-4 py-2 bg-bg-secondary border border-border-light rounded text-text-primary text-sm focus:border-gold outline-none"
      />
      <Button type="submit" variant="secondary" size="sm">
        검색
      </Button>
    </form>
  );
}

function PaginationLink({
  page,
  current,
  q,
}: {
  page: number;
  current: number;
  q?: string;
}) {
  const params = new URLSearchParams();
  if (page > 1) params.set('page', String(page));
  if (q) params.set('q', q);
  const href = params.toString() ? `/community?${params}` : '/community';
  const isActive = page === current;

  return (
    <Link
      href={href}
      className={`px-3 py-1 rounded text-sm ${
        isActive
          ? 'bg-gold text-bg-primary font-semibold'
          : 'bg-bg-secondary text-text-secondary hover:text-gold border border-border-light'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      {page}
    </Link>
  );
}

export function CommunityPagination({
  currentPage,
  totalPages,
  q,
}: {
  currentPage: number;
  totalPages: number;
  q?: string;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1);

  return (
    <nav className="flex justify-center gap-2 mt-8" aria-label="게시글 페이지">
      {currentPage > 1 && (
        <PaginationLink page={currentPage - 1} current={currentPage} q={q} />
      )}
      {pages.map((p) => (
        <PaginationLink key={p} page={p} current={currentPage} q={q} />
      ))}
      {currentPage < totalPages && (
        <PaginationLink page={currentPage + 1} current={currentPage} q={q} />
      )}
    </nav>
  );
}
