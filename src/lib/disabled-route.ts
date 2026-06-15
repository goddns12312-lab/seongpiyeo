import { NextResponse } from 'next/server';

/** 크롤링·삭제 등 비활성화된 API용 응답 */
export function disabledRouteResponse() {
  return NextResponse.json(
    { error: 'This feature has been disabled.' },
    { status: 404 }
  );
}
