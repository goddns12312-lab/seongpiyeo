import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function GET() {
  try {
    const crawlerStatePath = path.join(process.cwd(), 'scripts', 'crawler-state.json');

    if (!fs.existsSync(crawlerStatePath)) {
      return NextResponse.json(
        { error: 'crawler-state.json을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const content = fs.readFileSync(crawlerStatePath, 'utf-8');
    const crawlerState = JSON.parse(content);

    return NextResponse.json(crawlerState);
  } catch (error) {
    return NextResponse.json(
      {
        error: `크롤러 상태 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      },
      { status: 500 }
    );
  }
}
