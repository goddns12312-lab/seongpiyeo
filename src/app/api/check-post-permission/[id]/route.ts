import { createServiceRoleClient, getSessionFromRequest } from '@/lib/admin-session';
import { canEditPostWithSession } from '@/lib/post-permissions';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(request);

    if (!session?.id) {
      return Response.json({ postId: id, canEdit: false, canDelete: false });
    }

    const canEdit = await canEditPostWithSession(session, id);

    return Response.json({
      postId: id,
      canEdit,
      canDelete: canEdit,
    });
  } catch (error) {
    console.error('[api/check-post-permission]', error);
    return Response.json({ canEdit: false, canDelete: false }, { status: 500 });
  }
}
