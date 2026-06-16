import { createServiceRoleClient, requireAdminAuth } from '@/lib/admin-session';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  const auth = await requireAdminAuth(request);
  if (!auth.ok) return auth.response;

  const { postId, is_pinned, is_notice } = await request.json();
  if (!postId) {
    return Response.json({ error: 'postId 필요' }, { status: 400 });
  }

  const updates: Record<string, boolean> = {};
  if (typeof is_pinned === 'boolean') updates.is_pinned = is_pinned;
  if (typeof is_notice === 'boolean') updates.is_notice = is_notice;

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from('posts').update(updates).eq('id', postId);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  revalidatePath('/community');
  revalidatePath('/exchange-info');

  return Response.json({ success: true });
}
