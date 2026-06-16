import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { Post, CATEGORY_LABELS } from '@/types';

interface PostCardProps {
  post: Post & { profiles?: { nickname: string } };
}

export function PostCard({ post }: PostCardProps) {
  const href =
    post.category === 'exchange' ? `/exchange-info/${post.id}` : `/community/${post.id}`;

  return (
    <Link href={href}>
      <div className="bg-bg-secondary border border-border-light rounded-lg p-4 hover:border-gold transition-colors group cursor-pointer">
        <div className="flex items-start justify-between mb-2">
          <Badge variant="info">{CATEGORY_LABELS[post.category]}</Badge>
          <span className="text-text-secondary text-xs">{formatDate(post.created_at)}</span>
        </div>

        <h3 className="text-text-primary font-semibold mb-2 line-clamp-2 group-hover:text-gold transition-colors">
          {post.title}
        </h3>

        <p className="text-text-secondary text-sm line-clamp-2 mb-3">
          {post.content}
        </p>

        <div className="flex justify-between items-center text-text-secondary text-xs">
          <span>{post.profiles?.nickname || '익명'}</span>
          <span>조회 {post.view_count}</span>
        </div>
      </div>
    </Link>
  );
}
