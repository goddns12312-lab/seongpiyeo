import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import { Transform } from 'stream';
import { createReadStream } from 'fs';

// 지역 목록 (region-config.js와 동일)
const REGIONS = [
  { name: '서울', boardId: 40 },
  { name: '경기도', boardId: 93 },
  { name: '강원도', boardId: 92 },
  { name: '인천', boardId: 91 },
  { name: '충청북도', boardId: 90 },
  { name: '충청남도', boardId: 89 },
  { name: '경상북도', boardId: 88 },
  { name: '경상남도', boardId: 87 },
  { name: '전라북도', boardId: 86 },
  { name: '전라남도', boardId: 85 },
  { name: '제주도', boardId: 84 },
];

const LOCK_FILE = path.join(process.cwd(), 'crawlers-test', 'state', '.crawl.lock');
const STATE_DIR = path.join(process.cwd(), 'crawlers-test', 'state');
const CRAWLER_SCRIPT = path.join(process.cwd(), 'crawlers-test', 'crawlers', 'regional-crawler.js');

// ============================================================================
// Lock 파일 관리
// ============================================================================

function ensureStateDir() {
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }
}

function isLocked(): boolean {
  return fs.existsSync(LOCK_FILE);
}

function acquireLock(): string {
  ensureStateDir();
  const lockId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  fs.writeFileSync(LOCK_FILE, lockId, 'utf-8');
  return lockId;
}

function releaseLock() {
  if (fs.existsSync(LOCK_FILE)) {
    try {
      fs.unlinkSync(LOCK_FILE);
    } catch (error) {
      console.warn('Lock file 삭제 실패:', error);
    }
  }
}

// ============================================================================
// 크롤러 실행 함수
// ============================================================================

function runCrawlerProcess(region: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = execFile('node', [CRAWLER_SCRIPT, `--region=${region}`], {
      cwd: process.cwd(),
      timeout: 3600000, // 1시간 타임아웃
      maxBuffer: 10 * 1024 * 1024, // 10MB 버퍼
      env: {
        ...process.env,
        // .env.test.local 설정이 스크립트에서 로드됨
      },
    });

    let output = '';
    let errorOutput = '';

    child.stdout?.on('data', (data) => {
      output += data.toString();
    });

    child.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`크롤러 실패 (코드: ${code})\n${errorOutput}`));
      }
    });

    child.on('error', (error) => {
      reject(new Error(`크롤러 실행 오류: ${error.message}`));
    });
  });
}

// ============================================================================
// POST 핸들러
// ============================================================================

interface CrawlRequest {
  region?: string;
  allRegions?: boolean;
}

interface LogEntry {
  type: 'log' | 'status' | 'complete' | 'error';
  message?: string;
  region?: string;
  savedCount?: number;
  duplicateCount?: number;
  timestamp: string;
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = (await req.json()) as CrawlRequest;
    const { region, allRegions } = body;

    // 검증
    if (!allRegions && !region) {
      return NextResponse.json(
        { error: '지역 선택 필요' },
        { status: 400 }
      );
    }

    if (allRegions && region) {
      return NextResponse.json(
        { error: '전체 또는 단일 선택' },
        { status: 400 }
      );
    }

    // 동시 실행 확인
    if (isLocked()) {
      return NextResponse.json(
        { error: '크롤링이 이미 실행 중입니다' },
        { status: 409 }
      );
    }

    // Lock 획득
    const lockId = acquireLock();

    // 지역 목록 결정
    const regionsToProcess = allRegions ? REGIONS.map((r) => r.name) : [region!];

    // 스트림 생성
    const { readable, writable } = new TransformStream<Uint8Array>();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // 백그라운드에서 크롤링 실행
    (async () => {
      try {
        let regionIndex = 1;

        for (const targetRegion of regionsToProcess) {
          try {
            // 상태 로그 전송
            const statusLog: LogEntry = {
              type: 'status',
              message: `[${regionIndex}/${regionsToProcess.length}] ${targetRegion} 시작...`,
              region: targetRegion,
              timestamp: new Date().toISOString(),
            };
            await writer.write(
              encoder.encode(JSON.stringify(statusLog) + '\n')
            );

            // 크롤러 실행
            const output = await runCrawlerProcess(targetRegion);

            // 출력에서 통계 추출 (정규표현식)
            const newCountMatch = output.match(/신규 발견: (\d+)/);
            const savedCountMatch = output.match(/신규 저장: (\d+)/);
            const duplicateMatch = output.match(/기존 중복: (\d+)/);

            const newCount = newCountMatch ? parseInt(newCountMatch[1]) : 0;
            const savedCount = savedCountMatch ? parseInt(savedCountMatch[1]) : 0;
            const duplicateCount = duplicateMatch ? parseInt(duplicateMatch[1]) : 0;

            // 로그 라인 전송
            const logLines = output.split('\n');
            for (const line of logLines) {
              if (line.trim()) {
                const logEntry: LogEntry = {
                  type: 'log',
                  message: line,
                  region: targetRegion,
                  timestamp: new Date().toISOString(),
                };
                await writer.write(
                  encoder.encode(JSON.stringify(logEntry) + '\n')
                );
              }
            }

            // 완료 로그 전송
            const completeLog: LogEntry = {
              type: 'complete',
              message: `${targetRegion} 완료`,
              region: targetRegion,
              newCount,
              savedCount,
              duplicateCount,
              timestamp: new Date().toISOString(),
            };
            await writer.write(
              encoder.encode(JSON.stringify(completeLog) + '\n')
            );
          } catch (error) {
            const errorLog: LogEntry = {
              type: 'error',
              message:
                error instanceof Error ? error.message : '알 수 없는 오류',
              region: targetRegion,
              timestamp: new Date().toISOString(),
            };
            await writer.write(
              encoder.encode(JSON.stringify(errorLog) + '\n')
            );

            // 전체 지역 모드에서는 계속 진행
            if (!allRegions) {
              throw error;
            }
          }

          regionIndex++;
        }

        // 최종 로그
        const finalLog: LogEntry = {
          type: 'complete',
          message: '모든 크롤링 완료',
          timestamp: new Date().toISOString(),
        };
        await writer.write(encoder.encode(JSON.stringify(finalLog) + '\n'));

        await writer.close();
      } catch (error) {
        const errorLog: LogEntry = {
          type: 'error',
          message:
            error instanceof Error ? error.message : '알 수 없는 오류',
          timestamp: new Date().toISOString(),
        };
        await writer.write(encoder.encode(JSON.stringify(errorLog) + '\n'));
        await writer.close();
      } finally {
        // Lock 해제
        releaseLock();
      }
    })();

    // 스트림 응답
    return new Response(readable, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '오류 발생',
      },
      { status: 500 }
    );
  }
}
