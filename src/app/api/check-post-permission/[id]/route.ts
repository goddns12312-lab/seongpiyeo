import { canDeletePost } from '@/lib/permissions';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    const canDelete = token ? await canDeletePost(id, token) : false;

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
