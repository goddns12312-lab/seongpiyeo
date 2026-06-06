import { NextRequest, NextResponse } from 'next/server';
import { startCrawling, readState } from '@/lib/crawler/crawler-manager';

export async function POST(req: NextRequest) {
  try {
    // 관리자 인증 확인 (추후 추가)
    // const session = await getSession();
    // if (!session || session.role !== 'admin') {
    //   return NextResponse.json({ error: '관리자만 접근 가능합니다' }, { status: 403 });
    // }

    const body = await req.json().catch(() => ({}));
    const region = body.region || '서울';
    const limit = body.limit || 5;

    if (typeof limit !== 'number' || limit < 1 || limit > 1000) {
      return NextResponse.json(
        { error: 'limit은 1 ~ 1000 사이의 숫자여야 합니다' },
        { status: 400 }
      );
    }

    const crawlerId = await startCrawling(region, limit);

    return NextResponse.json({
      status: 'running',
      crawlerId,
      message: `크롤링이 시작되었습니다 (지역=${region}, limit=${limit})`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '크롤링 시작 실패',
        status: readState().status,
      },
      { status: 400 }
    );
  }
}
