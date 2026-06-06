import { NextRequest, NextResponse } from 'next/server';
import { readRecentLogs } from '@/lib/crawler/crawler-manager';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '5');

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'limit은 1 ~ 100 사이여야 합니다' },
        { status: 400 }
      );
    }

    const logs = readRecentLogs(limit);

    return NextResponse.json({
      logs,
      count: logs.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '로그 조회 실패' },
      { status: 400 }
    );
  }
}
