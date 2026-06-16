import { createServiceRoleClient } from '@/lib/admin-session';
import type { AuthSession } from '@/lib/auth-session';

export const COMMUNITY_POST_CATEGORIES = ['free', 'startup', 'interior', 'equipment'] as const;
export type CommunityPostCategory = (typeof COMMUNITY_POST_CATEGORIES)[number];

export function isCommunityCategory(value: string): value is CommunityPostCategory {
  return (COMMUNITY_POST_CATEGORIES as readonly string[]).includes(value);
}

export async function isPostAdmin(userId: string): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
  return data?.role === 'admin';
}

export async function canEditPostWithSession(session: AuthSession, postId: string): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const { data: post } = await supabase
    .from('posts')
    .select('user_id, status')
    .eq('id', postId)
    .maybeSingle();

  if (!post || post.status === 'deleted') return false;
  if (await isPostAdmin(session.id)) return true;
  if (!post.user_id) return false;
  return post.user_id === session.id;
}

export function appendImagesToContent(content: string, imageUrls: string[]): string {
  if (!imageUrls.length) return content.trim();
  const gallery = imageUrls.map((url, i) => `![image-${i + 1}](${url})`).join('\n');
  return `${content.trim()}\n\n${gallery}`;
}

export function splitContentAndImages(content: string): { body: string; images: string[] } {
  const images: string[] = [];
  const imageLine = /!\[[^\]]*\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = imageLine.exec(content)) !== null) {
    images.push(match[1]);
  }
  const body = content.replace(/!\[[^\]]*\]\([^)]+\)\n?/g, '').trim();
  return { body, images };
}
