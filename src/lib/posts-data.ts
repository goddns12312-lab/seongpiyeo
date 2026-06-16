import { createPublicClient } from '@/lib/supabase/public';

const PAGE_SIZE = 20;

export type PostListItem = {
  id: string;
  title: string;
  content: string;
  category: string;
  view_count: number;
  created_at: string;
  user_id: string | null;
  authorNickname: string;
  commentCount: number;
};

export async function fetchCommunityPosts(options: {
  category?: string;
  excludeExchange?: boolean;
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ posts: PostListItem[]; total: number }> {
  const supabase = createPublicClient();
  const page = Math.max(1, options.page ?? 1);
  const limit = options.limit ?? PAGE_SIZE;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('posts')
    .select('id, title, content, category, view_count, created_at, user_id', { count: 'exact' })
    .eq('status', 'active');

  if (options.category) {
    query = query.eq('category', options.category);
  } else if (options.excludeExchange) {
    query = query.neq('category', 'exchange');
  }

  if (options.search?.trim()) {
    const q = options.search.trim();
    query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%`);
  }

  const { data: posts, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !posts?.length) {
    return { posts: [], total: count ?? 0 };
  }

  const userIds = [...new Set(posts.map((p) => p.user_id).filter(Boolean))] as string[];
  const postIds = posts.map((p) => p.id);

  const [profilesRes, commentsRes] = await Promise.all([
    userIds.length
      ? supabase.from('profiles').select('id, nickname').in('id', userIds)
      : Promise.resolve({ data: [] as { id: string; nickname: string }[] }),
    supabase.from('comments').select('post_id').eq('status', 'active').in('post_id', postIds),
  ]);

  const nicknameMap = new Map(
    (profilesRes.data || []).map((p) => [p.id, p.nickname || '익명'])
  );
  const commentCounts = new Map<string, number>();
  for (const c of commentsRes.data || []) {
    commentCounts.set(c.post_id, (commentCounts.get(c.post_id) || 0) + 1);
  }

  const enriched: PostListItem[] = posts.map((post) => ({
    ...post,
    authorNickname: post.user_id ? nicknameMap.get(post.user_id) || '익명' : '익명',
    commentCount: commentCounts.get(post.id) || 0,
  }));

  return { posts: enriched, total: count ?? enriched.length };
}

export async function fetchPostComments(postId: string) {
  const supabase = createPublicClient();
  const { data: comments } = await supabase
    .from('comments')
    .select('id, post_id, user_id, content, status, created_at')
    .eq('post_id', postId)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  if (!comments?.length) return [];

  const userIds = [...new Set(comments.map((c) => c.user_id).filter(Boolean))] as string[];
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, nickname').in('id', userIds)
    : { data: [] as { id: string; nickname: string }[] };

  const nicknameMap = new Map(
    (profiles || []).map((p) => [p.id, p.nickname || '익명'])
  );

  return comments.map((c) => ({
    ...c,
    profiles: { nickname: c.user_id ? nicknameMap.get(c.user_id) || '익명' : '익명' },
  }));
}

export { PAGE_SIZE as POSTS_PAGE_SIZE };
