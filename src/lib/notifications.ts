import { createServiceRoleClient } from '@/lib/admin-session';

export async function createNotification(input: {
  userId: string;
  type: 'comment' | 'reply' | 'notice';
  title: string;
  body?: string;
  linkUrl?: string;
}) {
  if (!input.userId) return;

  const supabase = createServiceRoleClient();
  await supabase.from('user_notifications').insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body || null,
    link_url: input.linkUrl || null,
    is_read: false,
  });
}
