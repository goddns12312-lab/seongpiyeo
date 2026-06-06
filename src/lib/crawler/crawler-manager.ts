import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// 로그 패턴 정규식
const PROGRESS_PATTERN = /\[(\d+)\/(\d+)\]/;
const SUCCESS_PATTERN = /\s+✓\s+성공/;
const FAILURE_PATTERN = /\s+✗\s+|실패:/;
const FINAL_STATS_PATTERN = /성공:\s*(\d+)개|실패:\s*(\d+)개|시도:\s*(\d+)개/;

export type CrawlerStatus = 'idle' | 'running' | 'stopped' | 'error';

export interface CrawlerProgress {
  attempted: number;
  success: number;
  failed: number;
  duplicate?: number;
  excluded?: number;
}

export interface CrawlerState {
  status: CrawlerStatus;
  progress: CrawlerProgress;
  currentRegion?: string;
  currentPage?: number;
  lastPage?: number;
  lastRun: string | null;
  currentCrawlerId: string | null;
  errorMessage: string | null;
}

export interface CrawlerLog {
  timestamp: string;
  level: 'info' | 'success' | 'error';
  message: string;
}

const STATE_DIR = path.join(process.cwd(), 'crawlers-test', 'state');
const LOGS_DIR = path.join(process.cwd(), 'crawlers-test', 'logs');
const STATE_FILE = path.join(STATE_DIR, 'crawler-state.json');
const LOCK_FILE = path.join(STATE_DIR, '.crawler.lock');
const LOG_FILE = path.join(LOGS_DIR, 'crawler-ui.log');

// 디렉토리 생성
function ensureDirs() {
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
}

// 기본 상태
function getDefaultState(): CrawlerState {
  return {
    status: 'idle',
    progress: { attempted: 0, success: 0, failed: 0, duplicate: 0, excluded: 0 },
    currentRegion: undefined,
    currentPage: undefined,
    lastPage: undefined,
    lastRun: null,
    currentCrawlerId: null,
    errorMessage: null,
  };
}

// 상태 읽기
export function readState(): CrawlerState {
  ensureDirs();

  try {
    if (fs.existsSync(STATE_FILE)) {
      const content = fs.readFileSync(STATE_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('상태 파일 읽기 오류:', error);
  }

  return getDefaultState();
}

// 상태 저장
export function writeState(state: CrawlerState): void {
  ensureDirs();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

// 로그 추가
export function addLog(level: 'info' | 'success' | 'error', message: string): void {
  ensureDirs();

  const timestamp = new Date().toLocaleString('ko-KR');
  const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;

  try {
    fs.appendFileSync(LOG_FILE, logLine, 'utf-8');
  } catch (error) {
    console.error('로그 파일 쓰기 오류:', error);
  }
}

// 최근 로그 읽기
export function readRecentLogs(limit: number = 5): CrawlerLog[] {
  ensureDirs();

  try {
    if (!fs.existsSync(LOG_FILE)) {
      return [];
    }

    const content = fs.readFileSync(LOG_FILE, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    const recent = lines.slice(-limit);

    return recent.map(line => {
      // 형식: [timestamp] [level] message
      const match = line.match(/\[(.+?)\]\s*\[(\w+)\]\s*(.*)/);
      if (match) {
        return {
          timestamp: match[1],
          level: (match[2].toLowerCase() as any) || 'info',
          message: match[3],
        };
      }
      return { timestamp: new Date().toISOString(), level: 'info', message: line };
    });
  } catch (error) {
    console.error('로그 파일 읽기 오류:', error);
    return [];
  }
}

// Lock 파일 생성
function createLock(): string {
  ensureDirs();

  const lockId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  fs.writeFileSync(LOCK_FILE, lockId, 'utf-8');
  return lockId;
}

// Lock 파일 제거
function removeLock(): void {
  if (fs.existsSync(LOCK_FILE)) {
    fs.unlinkSync(LOCK_FILE);
  }
}

// Lock 파일 확인
function isLocked(): boolean {
  return fs.existsSync(LOCK_FILE);
}

// 크롤링 시작
export async function startCrawling(region: string = '서울', limit: number = 5): Promise<string> {
  // 이미 실행 중인지 확인
  if (isLocked()) {
    throw new Error('크롤링이 이미 실행 중입니다');
  }

  const state = readState();
  if (state.status === 'running') {
    throw new Error('크롤링이 이미 실행 중입니다');
  }

  // Lock 생성
  const crawlerId = createLock();

  // 상태 업데이트
  const newState: CrawlerState = {
    status: 'running',
    progress: { attempted: 0, success: 0, failed: 0, duplicate: 0, excluded: 0 },
    currentRegion: region,
    currentPage: undefined,
    lastPage: undefined,
    lastRun: new Date().toISOString(),
    currentCrawlerId: crawlerId,
    errorMessage: null,
  };
  writeState(newState);

  addLog('info', `크롤링 시작 (지역=${region}, limit=${limit})`);

  // 백그라운드에서 크롤러 실행 (비동기)
  runCrawlerProcess(region, limit, crawlerId).catch(error => {
    addLog('error', `크롤링 오류: ${error.message}`);
    const errorState = readState();
    errorState.status = 'error';
    errorState.errorMessage = error.message;
    errorState.currentCrawlerId = null;
    writeState(errorState);
    removeLock();
  });

  return crawlerId;
}

// 크롤링 정지
export function stopCrawling(): void {
  removeLock();

  const state = readState();
  state.status = 'stopped';
  state.currentCrawlerId = null;
  writeState(state);

  addLog('info', '크롤링 정지됨');
}

// 크롤링 프로세스 실행
async function runCrawlerProcess(region: string, limit: number, crawlerId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const scriptPath = path.join(process.cwd(), 'crawlers-test', 'crawlers', 'regional-crawler.js');

      // 환경 변수 설정
      const env = {
        ...process.env,
        NODE_OPTIONS: '--max-old-space-size=2048',
      };

      let currentAttempted = 0;
      let currentSuccess = 0;
      let currentFailed = 0;
      let currentDuplicate = 0;
      let currentExcluded = 0;
      let totalToCollect = limit;

      // 스트림 기반 크롤러 실행
      const child = execFile('node', [scriptPath, `--region=${region}`, `--limit=${limit}`], {
        cwd: process.cwd(),
        env,
        maxBuffer: 10 * 1024 * 1024,
        timeout: 30 * 60 * 1000,
      });

      // stdout 스트림 처리
      if (child.stdout) {
        let buffer = '';

        child.stdout.on('data', (data: Buffer) => {
          buffer += data.toString();
          const lines = buffer.split('\n');

          // 마지막 불완전한 라인 보존
          buffer = lines[lines.length - 1];

          for (let i = 0; i < lines.length - 1; i++) {
            let line = lines[i].trim();

            // Windows 줄바꿈 정리
            line = line.replace(/\r$/, '');

            if (!line) continue;

            // 중복 카운트
            if (line.includes('✗ 중복')) {
              currentDuplicate++;
            }

            // 제외 카운트
            if (line.includes('✗ 제외')) {
              currentExcluded++;
            }

            // 성공 카운트
            if (SUCCESS_PATTERN.test(line)) {
              currentSuccess++;
            }

            // 실패 카운트 (중복, 제외 아닌 실패)
            if (FAILURE_PATTERN.test(line) && !line.includes('중복') && !line.includes('제외')) {
              currentFailed++;
            }

            // 진행 상황 저장
            if (currentSuccess > 0 || currentFailed > 0 || currentDuplicate > 0 || currentExcluded > 0) {
              const state = readState();
              state.progress = {
                attempted: limit,
                success: currentSuccess,
                failed: currentFailed,
                duplicate: currentDuplicate,
                excluded: currentExcluded,
              };
              writeState(state);
            }
          }
        });
      }

      // 프로세스 종료 처리
      child.on('close', (code: number) => {
        try {
          if (code === 0) {
            // 최종 결과 파일에서 실제 수치 읽기
            const outputDir = path.join(process.cwd(), 'crawlers-test', 'output');
            const validListingsPath = path.join(outputDir, 'valid-listings.json');

            let finalSuccess = currentSuccess;

            try {
              if (fs.existsSync(validListingsPath)) {
                const fileContent = fs.readFileSync(validListingsPath, 'utf-8');
                const validListings = JSON.parse(fileContent);
                if (validListings.count) {
                  finalSuccess = validListings.count;
                }
              }
            } catch (parseError) {
              // 파일 읽기 실패 시 현재 카운트 사용
              console.error('결과 파일 읽기 오류:', parseError);
            }

            // 최종 통계 저장
            const state = readState();
            state.status = 'idle';
            state.progress = {
              attempted: limit,
              success: finalSuccess,
              failed: currentFailed,
              duplicate: currentDuplicate,
              excluded: currentExcluded,
            };
            state.currentCrawlerId = null;
            writeState(state);

            addLog(
              'success',
              `크롤링 완료 (지역=${region}, 시도=${limit}, 성공=${finalSuccess}, 중복=${currentDuplicate}, 제외=${currentExcluded})`
            );

            removeLock();
            resolve();
          } else {
            throw new Error(`크롤러 프로세스 종료 코드: ${code}`);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          addLog('error', `크롤링 오류: ${errorMsg}`);
          const state = readState();
          state.status = 'error';
          state.errorMessage = errorMsg;
          state.currentCrawlerId = null;
          writeState(state);
          removeLock();
          reject(error);
        }
      });

      // 에러 처리
      child.on('error', (error: Error) => {
        const errorMsg = error.message;
        addLog('error', `크롤링 프로세스 오류: ${errorMsg}`);
        const state = readState();
        state.status = 'error';
        state.errorMessage = errorMsg;
        state.currentCrawlerId = null;
        writeState(state);
        removeLock();
        reject(error);
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      addLog('error', `크롤링 시작 오류: ${errorMsg}`);
      const state = readState();
      state.status = 'error';
      state.errorMessage = errorMsg;
      state.currentCrawlerId = null;
      writeState(state);
      removeLock();
      reject(error);
    }
  });
}

// 상태 초기화
export function resetState(): void {
  removeLock();
  writeState(getDefaultState());
  addLog('info', '상태 초기화됨');
}
