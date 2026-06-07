import { canDeletePost } from '@/lib/permissions';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const canDelete = await canDeletePost(id);

    return Response.json({
      postId: id,
      canDelete,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[api/check-post-permission] 오류:', error);
    return Response.json(
      {
        error: '권한 확인 실패',
        canDelete: false,
      },
      { status: 500 }
    );
  }
}
