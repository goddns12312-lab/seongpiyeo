import { NextRequest, NextResponse } from 'next/server';
import { stopCrawling, readState } from '@/lib/crawler/crawler-manager';

export async function POST(req: NextRequest) {
  try {
    const state = readState();

    if (state.status !== 'running') {
      return NextResponse.json(
        { error: '실행 중인 크롤링이 없습니다', status: state.status },
        { status: 400 }
      );
    }

    stopCrawling();

    return NextResponse.json({
      status: 'stopped',
      message: '크롤링이 정지되었습니다',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '크롤링 정지 실패' },
      { status: 400 }
    );
  }
}
