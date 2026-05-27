#!/usr/bin/env node

/**
 * full-backfill.js
 *
 * 구간별 전체 백필 스크립트
 * - 크롤링 대상 사이트의 모든 매물을 구간별로 수집
 * - 각 구간 완료 후 즉시 Supabase에 업로드
 * - 체크포인트로 진행 상황 추적
 *
 * 실행:
 *   node scripts/full-backfill.js --from-page=960 --to-page=801
 *   node scripts/full-backfill.js --from-page=800 --to-page=601
 *   ... 등
 *
 * 또는 배치 파일:
 *   scripts/run-full-backfill-all.bat
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ============================================================================
// 설정
// ============================================================================

const LOGS_DIR = path.join(__dirname, 'logs');
const LOG_FILENAME = `full-backfill-${new Date().toISOString().split('T')[0]}.log`;
const LOG_FILE = path.join(LOGS_DIR, LOG_FILENAME);
const CHECKPOINT_FILE = path.join(LOGS_DIR, 'backfill-checkpoint.json');
const PROJECT_ROOT = path.join(__dirname, '..');

// 로그 디렉토리 생성
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// ============================================================================
// 유틸리티 함수
// ============================================================================

function log(...args) {
  const timestamp = new Date().toISOString();
  const message = args.join(' ');
  const line = `[${timestamp}] ${message}`;

  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + '\n');
  } catch (error) {
    console.error(`⚠️  로그 파일 저장 실패: ${error.message}`);
  }
}

function logSection(title) {
  const separator = '='.repeat(80);
  log(separator);
  log(title);
  log(separator);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// 체크포인트 관리
// ============================================================================

function loadCheckpoint() {
  try {
    if (fs.existsSync(CHECKPOINT_FILE)) {
      return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf-8'));
    }
  } catch (error) {
    log(`⚠️  체크포인트 로드 실패: ${error.message}`);
  }
  return {
    completedRanges: [],
    startTime: new Date().toISOString(),
    lastUpdate: new Date().toISOString()
  };
}

function saveCheckpoint(checkpoint) {
  try {
    checkpoint.lastUpdate = new Date().toISOString();
    fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
    log(`💾 체크포인트 저장: ${checkpoint.completedRanges.join(', ')}`);
  } catch (error) {
    log(`⚠️  체크포인트 저장 실패: ${error.message}`);
  }
}

// ============================================================================
// 명령어 실행 함수
// ============================================================================

function runCommand(command, args, description) {
  return new Promise((resolve, reject) => {
    log(`\n📋 ${description}`);
    log(`   실행: ${command} ${args.join(' ')}`);

    const startTime = Date.now();
    const proc = spawn(command, args, {
      cwd: PROJECT_ROOT,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    proc.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(output);
      try {
        fs.appendFileSync(LOG_FILE, output);
      } catch (error) {
        // 조용히 무시
      }
    });

    proc.stderr.on('data', (data) => {
      const output = data.toString();
      process.stderr.write(output);
      try {
        fs.appendFileSync(LOG_FILE, output);
      } catch (error) {
        // 조용히 무시
      }
    });

    proc.on('close', (code) => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      if (code === 0) {
        log(`✅ 완료 (${elapsed}초)`);
        resolve();
      } else {
        reject(new Error(`${description} 실패 (exit code: ${code})`));
      }
    });

    proc.on('error', (error) => {
      reject(new Error(`${description} 실행 실패: ${error.message}`));
    });
  });
}

// ============================================================================
// 마지막 페이지 감지 함수 (재사용)
// ============================================================================

async function detectLastPageForAutoMode() {
  log('\n📍 Pagination 영역에서 마지막 페이지 감지 중...');

  try {
    const { chromium } = require('playwright');
    const PCBANG_URL = 'https://www.xn--3e0b036btifksj.com/40/';

    const browser = await chromium.launch({ headless: true });

    // playwright-auth.json 로드
    let storageState = undefined;
    if (fs.existsSync(path.join(__dirname, 'playwright-auth.json'))) {
      storageState = JSON.parse(fs.readFileSync(path.join(__dirname, 'playwright-auth.json'), 'utf-8'));
    }

    const context = await browser.newContext({ storageState });
    const page = await context.newPage();
    page.setDefaultTimeout(30000);

    await page.goto(PCBANG_URL, { waitUntil: 'networkidle' });

    // Pagination 영역에서 모든 페이지 번호 추출
    const pageNumbers = await page.evaluate(() => {
      const pages = [];

      // 방법 1: span.page 또는 a.page 찾기
      const pageElements = document.querySelectorAll('[class*="page"]');
      for (const el of pageElements) {
        const text = el.textContent.trim();
        const num = parseInt(text);
        if (!isNaN(num) && num > 0 && num < 10000) {
          pages.push(num);
        }
      }

      // 방법 2: href에서 p= 또는 page= 파라미터 추출
      const links = document.querySelectorAll('a[href*="page="], a[href*="?p="]');
      for (const link of links) {
        const match = link.href.match(/[?&](p|page)=(\d+)/);
        if (match) {
          const num = parseInt(match[2]);
          if (num > 0) pages.push(num);
        }
      }

      return [...new Set(pages)].sort((a, b) => a - b);
    });

    await browser.close();

    if (pageNumbers.length === 0) {
      log(`⚠️  Pagination 감지 실패, 기본값 8 사용`);
      return 8;
    }

    const lastPage = Math.max(...pageNumbers);
    log(`📄 감지된 페이지 배열: [${pageNumbers.join(',')}]`);
    log(`✅ 마지막 페이지: ${lastPage}`);
    return lastPage;

  } catch (error) {
    log(`⚠️  페이지 감지 오류: ${error.message}`);
    log('   → 기본값 8 사용');
    return 8;
  }
}

// ============================================================================
// 구간 자동 분할 함수
// ============================================================================

function autoGenerateSegments(lastPage) {
  const segments = [];
  const segmentSize = 200;

  log('\n📊 구간 자동 분할 (200 단위):\n');

  for (let from = lastPage; from > 1; from -= segmentSize) {
    const to = Math.max(1, from - segmentSize + 1);
    segments.push({ from, to });
    log(`   구간: ${from} → ${to}`);
  }

  return segments.reverse(); // 역순으로 실행하기 위해 뒤집음
}

// ============================================================================
// 메인 실행 함수
// ============================================================================

async function main() {
  // CLI 인자 파싱
  const autoMode = process.argv.includes('--auto');
  const fromPageArg = process.argv.find(arg => arg.startsWith('--from-page='));
  const toPageArg = process.argv.find(arg => arg.startsWith('--to-page='));

  if (!autoMode && (!fromPageArg || !toPageArg)) {
    logSection('❌ 옵션 오류');
    log(`사용법:`);
    log(`  1. 자동 모드 (권장): node scripts/full-backfill.js --auto`);
    log(`  2. 수동 모드: node scripts/full-backfill.js --from-page=N --to-page=M`);
    log('');
    log(`예시: node scripts/full-backfill.js --from-page=960 --to-page=801`);
    process.exit(1);
  }

  if (autoMode) {
    // 자동 모드: 마지막 페이지 감지 후 전체 백필
    logSection('📥 자동 전체 백필 (Auto Full Backfill)');
    log(`📁 로그: ${LOG_FILE}`);
    const startTime = Date.now();

    try {
      // 마지막 페이지 감지
      const lastPage = await detectLastPageForAutoMode();

      // 구간 자동 분할
      const segments = autoGenerateSegments(lastPage);

      log(`\n📋 총 ${segments.length}개 구간을 순차 실행합니다.\n`);

      // 체크포인트 로드
      const checkpoint = loadCheckpoint();

      // 각 구간 실행
      for (let i = 0; i < segments.length; i++) {
        const { from, to } = segments[i];
        const rangeLabel = `${from}→${to}`;

        if (checkpoint.completedRanges.includes(rangeLabel)) {
          log(`⏭️  [${i + 1}/${segments.length}] 구간 ${rangeLabel} (이미 완료됨, 스킵)`);
          continue;
        }

        log(`\n${'='.repeat(80)}`);
        log(`[${i + 1}/${segments.length}] 구간 실행: ${rangeLabel}`);
        log(`${'='.repeat(80)}\n`);

        try {
          await runCommand('node', [
            'scripts/run-scraper.js',
            '--adapter', 'pcbangkingdom',
            `--start-page=${from}`,
            '--update'
          ], `1단계: 피씨천국 크롤링 (페이지 ${rangeLabel})`);

          log('');
          await runCommand('node', [
            'scripts/import-validated.js'
          ], `2단계: Supabase 임포트 (구간 ${rangeLabel})`);

          checkpoint.completedRanges.push(rangeLabel);
          saveCheckpoint(checkpoint);

          log(`\n✅ 구간 ${rangeLabel} 완료`);
        } catch (error) {
          log(`\n❌ 구간 ${rangeLabel} 실패: ${error.message}`);
          log(`다시 실행: node scripts/full-backfill.js --from-page=${from} --to-page=${to}`);
          process.exit(1);
        }
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      logSection('🎉 자동 전체 백필 완료');
      log(`✅ 페이지 ${lastPage} → 1 전체가 완료되었습니다.`);
      log(`✅ 크롤링 대상 사이트의 모든 매물이 Supabase에 등록되었습니다.`);
      log(`⏱️  총 실행 시간: ${elapsed}초`);
      log(`📋 완료된 구간: ${checkpoint.completedRanges.join(', ')}`);

      process.exit(0);
    } catch (error) {
      log(`\n❌ 오류 발생: ${error.message}`);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      logSection('❌ 자동 전체 백필 실패');
      log(`오류: ${error.message}`);
      log(`실행 시간: ${elapsed}초`);
      log(`로그 파일: ${LOG_FILE}`);
      process.exit(1);
    }

    return; // 자동 모드 끝
  }

  // 수동 모드: from-page와 to-page 지정
  const fromPage = parseInt(fromPageArg.split('=')[1]);
  const toPage = parseInt(toPageArg.split('=')[1]);

  if (isNaN(fromPage) || isNaN(toPage) || fromPage <= toPage) {
    logSection('❌ 옵션 오류');
    log(`from-page(${fromPage})는 to-page(${toPage})보다 커야 합니다.`);
    log(`예시: --from-page=960 --to-page=801`);
    process.exit(1);
  }

  const rangeLabel = `${fromPage}→${toPage}`;
  const startTime = Date.now();

  logSection(`📥 구간 백필 (${rangeLabel})`);
  log(`📁 로그: ${LOG_FILE}`);
  log(`⚠️  주의: 이 작업은 시간이 걸릴 수 있습니다. 중단하지 마세요.`);

  // 체크포인트 확인
  const checkpoint = loadCheckpoint();
  if (checkpoint.completedRanges.includes(rangeLabel)) {
    logSection('⏭️  이미 완료된 구간');
    log(`✅ 구간 ${rangeLabel}은 이미 백필되었습니다.`);
    log(`📋 완료된 구간: ${checkpoint.completedRanges.join(', ')}`);
    process.exit(0);
  }

  try {
    // 1단계: 스크래핑 (역순)
    log('');
    await runCommand('node', [
      'scripts/run-scraper.js',
      '--adapter', 'pcbangkingdom',
      `--start-page=${fromPage}`,
      '--update'
    ], `1단계: 피씨천국 크롤링 (페이지 ${rangeLabel})`);

    // 2단계: Supabase 임포트
    log('');
    await runCommand('node', [
      'scripts/import-validated.js'
    ], `2단계: Supabase 임포트 (구간 ${rangeLabel})`);

    // 체크포인트 업데이트
    checkpoint.completedRanges.push(rangeLabel);
    saveCheckpoint(checkpoint);

    // 완료
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    logSection(`🎉 구간 완료 (${rangeLabel})`);
    log(`✅ 페이지 ${rangeLabel} 백필이 완료되었습니다.`);
    log(`⏱️  실행 시간: ${elapsed}초`);
    log(`📋 완료된 구간: ${checkpoint.completedRanges.join(', ')}`);
    log('');
    log('다음 단계:');

    if (fromPage - 160 > toPage) {
      log(`   node scripts/full-backfill.js --from-page=${fromPage - 160} --to-page=${toPage - 160}`);
    } else {
      log(`   ✅ 모든 구간이 완료되었습니다!`);
      log(`   크롤링 대상 사이트의 전체 매물이 Supabase에 등록되었습니다.`);
    }

    process.exit(0);

  } catch (error) {
    log(`\n❌ 오류 발생: ${error.message}`);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    logSection(`❌ 구간 백필 실패 (${rangeLabel})`);
    log(`오류: ${error.message}`);
    log(`실행 시간: ${elapsed}초`);
    log(`로그 파일: ${LOG_FILE}`);
    log(`체크포인트: ${CHECKPOINT_FILE}`);
    log('');
    log(`💡 해결 후 다시 실행하세요:`);
    log(`   node scripts/full-backfill.js --from-page=${fromPage} --to-page=${toPage}`);

    process.exit(1);
  }
}

// 실행
main();
