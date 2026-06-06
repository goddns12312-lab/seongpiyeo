import { NextRequest, NextResponse } from 'next/server';
import { readState } from '@/lib/crawler/crawler-manager';

export async function GET(req: NextRequest) {
  try {
    const state = readState();

    // 한글 상태 설명
    const statusText = {
      idle: '대기중',
      running: '실행중',
      stopped: '정지됨',
      error: '오류',
    }[state.status] || state.status;

    return NextResponse.json({
      status: state.status,
      statusText,
      progress: state.progress,
      lastRun: state.lastRun ? new Date(state.lastRun).toLocaleString('ko-KR') : '없음',
      errorMessage: state.errorMessage,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '상태 조회 실패' },
      { status: 400 }
    );
  }
}
