#!/usr/bin/env node

/**
 * auto-sync.js
 *
 * 1시간마다 실행되는 증분 동기화 스크립트
 * - 최신 10페이지만 크롤링 (신규/변경 매물만)
 * - Supabase에 자동 업로드
 * - 신규는 status='active', 기존은 update
 *
 * 실행:
 *   node scripts/auto-sync.js
 *
 * 실행 시간: 약 1-2분 (10페이지)
 * 주기: 1시간마다 (cron 또는 Windows 작업 스케줄러)
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ============================================================================
// 설정
// ============================================================================

const LOGS_DIR = path.join(__dirname, 'logs');
const LOG_FILENAME = `auto-sync-${new Date().toISOString().split('T')[0]}.log`;
const LOG_FILE = path.join(LOGS_DIR, LOG_FILENAME);
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

  // 콘솔에 출력
  console.log(line);

  // 로그 파일에 저장
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

function log_subtitle(title) {
  log('');
  log(`┌─ ${title}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// 명령어 실행 함수
// ============================================================================

function runCommand(command, args, description, envVars = {}) {
  return new Promise((resolve, reject) => {
    log(`\n📋 ${description}`);
    log(`   실행: ${command} ${args.join(' ')}`);

    const startTime = Date.now();
    const proc = spawn(command, args, {
      cwd: PROJECT_ROOT,
      env: { ...process.env, ...envVars },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    // stdout 처리
    proc.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(output);
      try {
        fs.appendFileSync(LOG_FILE, output);
      } catch (error) {
        // 조용히 무시
      }
    });

    // stderr 처리
    proc.stderr.on('data', (data) => {
      const output = data.toString();
      process.stderr.write(output);
      try {
        fs.appendFileSync(LOG_FILE, output);
      } catch (error) {
        // 조용히 무시
      }
    });

    // 종료 처리
    proc.on('close', (code) => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      if (code === 0) {
        log(`✅ 완료 (${elapsed}초)`);
        resolve();
      } else {
        reject(new Error(`${description} 실패 (exit code: ${code})`));
      }
    });

    // 에러 처리
    proc.on('error', (error) => {
      reject(new Error(`${description} 실행 실패: ${error.message}`));
    });
  });
}

// ============================================================================
// 최신 페이지 감지 함수
// ============================================================================

async function detectLastPage() {
  log('\n📍 최신 페이지 자동 감지 중...');

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
    log(`✅ 최신 페이지: ${lastPage}`);
    return lastPage;

  } catch (error) {
    log(`⚠️  페이지 감지 오류: ${error.message}`);
    log('   → 기본값 8 사용');
    return 8;
  }
}

// ============================================================================
// 메인 실행 함수
// ============================================================================

async function main() {
  const startTime = Date.now();

  logSection('🔄 증분 동기화 (Incremental Sync) 시작');
  log(`📁 로그: ${LOG_FILE}`);

  try {
    // 모든 지역 크롤링 (피씨천국 지역별 게시판)
    const regions = [
      { name: '서울', boardNum: 40 },
      { name: '경기', boardNum: 93 },
      { name: '인천', boardNum: 91 },
      { name: '강원', boardNum: 92 },
      { name: '충북', boardNum: 90 },
      { name: '충남', boardNum: 89 },
      { name: '경북', boardNum: 88 },
      { name: '경남', boardNum: 87 },
      { name: '전북', boardNum: 86 },
      { name: '전남', boardNum: 85 },
      { name: '제주', boardNum: 84 }
    ];

    log(`\n🌍 전국 ${regions.length}개 지역 크롤링 시작\n`);

    // 1단계: 모든 지역 스크래핑
    for (const region of regions) {
      log(`\n📍 ${region.name} 크롤링 중...`);
      const boardUrl = `https://www.xn--3e0b036btifksj.com/${region.boardNum}/`;

      await runCommand('node', [
        'scripts/run-scraper.js',
        '--adapter', 'pcbangkingdom',
        '--update'
      ], `${region.name}(${region.boardNum}) 지역 최신 글 크롤링`, {
        BOARD_URL: boardUrl
      });

      // 지역별로 딜레이 (서버 부하 방지)
      await sleep(1500);
    }

    // 2단계: Supabase 임포트
    await runCommand('node', [
      'scripts/import-validated.js'
    ], '2단계: Supabase 임포트');

    // 완료
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    logSection('🎉 증분 동기화 완료');
    log(`✅ 신규 매물이 자동으로 Supabase에 업로드되었습니다.`);
    log(`✅ 기존 매물 변경사항이 반영되었습니다.`);
    log(`⏱️  총 실행 시간: ${elapsed}초`);
    log(`📊 다음 자동 실행: 1시간 후`);

    process.exit(0);
  } catch (error) {
    log(`\n❌ 오류 발생: ${error.message}`);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    logSection('❌ 증분 동기화 실패');
    log(`오류: ${error.message}`);
    log(`실행 시간: ${elapsed}초`);
    log(`로그 파일: ${LOG_FILE}`);
    log(`\n💡 해결 방법:`);
    log(`   1. 네트워크 연결 확인`);
    log(`   2. Playwright 세션 확인 (playwright-auth.json)`);
    log(`   3. Supabase 환경 변수 확인 (.env.local)`);
    log(`   4. 로그 파일 확인: ${LOG_FILE}`);

    process.exit(1);
  }
}

// 실행
main();
