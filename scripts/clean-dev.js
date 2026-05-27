#!/usr/bin/env node

/**
 * clean-dev.js
 * 개발 서버 시작 전 포트 3002 정리 및 .next 캐시 삭제
 *
 * 사용: node scripts/clean-dev.js
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 3002;
const NEXT_DIR = path.join(__dirname, '..', '.next');

console.log('\n🧹 개발 서버 정리 시작...\n');

// 1. 포트 3002 프로세스 종료
function killPortProcess() {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      // Windows: netstat 사용
      exec(`netstat -ano | findstr :${PORT}`, (error, stdout) => {
        if (error || !stdout.trim()) {
          console.log(`✓ 포트 ${PORT} 비어있음`);
          resolve();
          return;
        }

        const lines = stdout.trim().split('\n');
        const pids = new Set();

        lines.forEach((line) => {
          const parts = line.trim().split(/\s+/);
          if (parts.length > 4) {
            pids.add(parts[4]); // PID는 마지막 컬럼
          }
        });

        if (pids.size === 0) {
          console.log(`✓ 포트 ${PORT} 비어있음`);
          resolve();
          return;
        }

        // 각 PID 종료
        let killed = 0;
        pids.forEach((pid) => {
          if (pid && pid !== '0') {
            exec(`taskkill /PID ${pid} /F`, (err) => {
              if (!err) {
                killed++;
                console.log(`✓ 프로세스 종료 (PID: ${pid})`);
              }
              if (killed === pids.size) {
                console.log(`✓ ${pids.size}개 프로세스 종료 완료\n`);
                resolve();
              }
            });
          }
        });
      });
    } else {
      // macOS/Linux: lsof 사용
      exec(`lsof -i :${PORT} -t`, (error, stdout) => {
        if (error || !stdout.trim()) {
          console.log(`✓ 포트 ${PORT} 비어있음\n`);
          resolve();
          return;
        }

        const pids = stdout.trim().split('\n').filter((p) => p);
        if (pids.length === 0) {
          console.log(`✓ 포트 ${PORT} 비어있음\n`);
          resolve();
          return;
        }

        pids.forEach((pid) => {
          exec(`kill -9 ${pid}`, (err) => {
            if (!err) {
              console.log(`✓ 프로세스 종료 (PID: ${pid})`);
            }
          });
        });

        console.log(`✓ ${pids.length}개 프로세스 종료 완료\n`);
        resolve();
      });
    }
  });
}

// 2. .next 캐시 삭제
function deleteNextCache() {
  return new Promise((resolve) => {
    if (fs.existsSync(NEXT_DIR)) {
      try {
        fs.rmSync(NEXT_DIR, { recursive: true, force: true });
        console.log('✓ .next 캐시 삭제됨\n');
      } catch (error) {
        console.error(`⚠️  .next 삭제 실패: ${error.message}\n`);
      }
    } else {
      console.log('✓ .next 폴더 없음 (이미 정리됨)\n');
    }
    resolve();
  });
}

// 3. 메인 실행
async function main() {
  try {
    console.log(`🔍 포트 ${PORT} 확인 중...`);
    await killPortProcess();

    console.log('🗑️  .next 캐시 정리 중...');
    await deleteNextCache();

    console.log('✅ 정리 완료! 깨끗한 개발 서버 준비됨\n');
    console.log('💡 다음 명령 실행: next dev -p 3002\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    process.exit(1);
  }
}

main();
