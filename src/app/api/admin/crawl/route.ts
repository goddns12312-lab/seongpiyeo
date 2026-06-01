import { spawn } from 'child_process';
import { NextRequest } from 'next/server';
import * as path from 'path';

interface CrawlRequest {
  region?: string;
  allRegions?: boolean;
}

interface CrawlLogMessage {
  type: 'log' | 'error' | 'complete' | 'status';
  message?: string;
  crawledCount?: number;
  skippedCount?: number;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CrawlRequest = await request.json();
    const { region, allRegions } = body;

    // 입력 검증
    if (!region && !allRegions) {
      return new Response(
        JSON.stringify({ error: '지역을 지정하거나 allRegions를 true로 설정해야 합니다' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // CLI 인자 구성
    const projectRoot = path.resolve(process.cwd());
    const crawlScript = path.join(projectRoot, 'scripts', 'crawl-regions.js');
    const args = [crawlScript, '--new-only'];
    if (allRegions) {
      args.push('--all-regions');
    } else if (region) {
      args.push(`--region=${region}`);
    }

    // ReadableStream 생성
    const stream = new ReadableStream<CrawlLogMessage>({
      async start(controller) {
        try {
          const childProcess = spawn('node', args, {
            cwd: projectRoot,
            stdio: ['ignore', 'pipe', 'pipe'],
          });

          let crawledCount = 0;
          let skippedCount = 0;

          // stdout 처리
          childProcess.stdout?.on('data', (data) => {
            const lines = data.toString().split('\n');
            lines.forEach((line: string) => {
              if (line.trim()) {
                // 크롤링됨 개수 추출
                const crawledMatch = line.match(/크롤링됨:\s*(\d+)개/);
                if (crawledMatch) {
                  crawledCount = parseInt(crawledMatch[1]);
                }

                // 스킵됨 개수 추출
                const skippedMatch = line.match(/스킵됨:\s*(\d+)개/);
                if (skippedMatch) {
                  skippedCount = parseInt(skippedMatch[1]);
                }

                // 로그 메시지 전송
                const logMessage: CrawlLogMessage = {
                  type: 'log',
                  message: line,
                  timestamp: new Date().toISOString(),
                };
                controller.enqueue(JSON.stringify(logMessage) + '\n');
              }
            });
          });

          // stderr 처리
          childProcess.stderr?.on('data', (data) => {
            const line = data.toString().trim();
            if (line) {
              const errorMessage: CrawlLogMessage = {
                type: 'error',
                message: line,
                timestamp: new Date().toISOString(),
              };
              controller.enqueue(JSON.stringify(errorMessage) + '\n');
            }
          });

          // 프로세스 완료 대기
          childProcess.on('close', (code) => {
            const completeMessage: CrawlLogMessage = {
              type: 'complete',
              crawledCount,
              skippedCount,
              timestamp: new Date().toISOString(),
            };
            controller.enqueue(JSON.stringify(completeMessage) + '\n');

            if (code !== 0) {
              const errorMessage: CrawlLogMessage = {
                type: 'error',
                message: `프로세스 종료 코드: ${code}`,
                timestamp: new Date().toISOString(),
              };
              controller.enqueue(JSON.stringify(errorMessage) + '\n');
            }

            controller.close();
          });

          // 에러 처리
          childProcess.on('error', (error) => {
            const errorMessage: CrawlLogMessage = {
              type: 'error',
              message: `프로세스 오류: ${error.message}`,
              timestamp: new Date().toISOString(),
            };
            controller.enqueue(JSON.stringify(errorMessage) + '\n');
            controller.close();
          });
        } catch (error) {
          const errorMessage: CrawlLogMessage = {
            type: 'error',
            message: `오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
            timestamp: new Date().toISOString(),
          };
          controller.enqueue(JSON.stringify(errorMessage) + '\n');
          controller.close();
        }
      },
    });

    // NDJSON 응답 반환
    return new Response(stream as any, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: `요청 처리 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
