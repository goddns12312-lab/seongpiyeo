#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logFile = path.join(logsDir, `pipeline-${timestamp}.log`);
let logContent = '';

function log(...args) {
  const line = `[${new Date().toISOString()}] ${args.join(' ')}`;
  console.log(line);
  logContent += line + '\n';
}

function runCommand(cmd, description) {
  log(`\n${'='.repeat(70)}`);
  log(`📌 ${description}`);
  log('='.repeat(70));

  try {
    execSync(cmd, { stdio: 'inherit', cwd: __dirname });
    log(`✅ ${description} 완료`);
    return true;
  } catch (error) {
    log(`❌ ${description} 실패: ${error.message}`);
    return false;
  }
}

async function runPipeline() {
  log('🚀 PC방 매물 자동화 파이프라인 시작');
  log(`시간: ${new Date().toLocaleString('ko-KR')}`);

  const steps = [
    { cmd: 'node auto-scraper.js', desc: '1️⃣  웹 스크래핑' },
    { cmd: 'node cleanup-images-final.js', desc: '2️⃣  배너/로고 제거' },
    { cmd: 'node import-to-supabase.js', desc: '3️⃣  Supabase 임포트' },
    { cmd: 'node delete-listings-without-images.js', desc: '4️⃣  사진없는 매물 삭제' },
    { cmd: 'node fix-thumbnail-urls.js', desc: '5️⃣  이미지 URL 정규화' }
  ];

  let completedSteps = 0;
  const results = [];

  for (const step of steps) {
    const success = runCommand(step.cmd, step.desc);
    results.push({ step: step.desc, success });
    if (success) completedSteps++;
  }

  // 최종 요약
  log('\n' + '='.repeat(70));
  log('📊 최종 결과 요약');
  log('='.repeat(70));

  results.forEach(r => {
    const icon = r.success ? '✅' : '❌';
    log(`${icon} ${r.step}`);
  });

  log(`\n완료: ${completedSteps}/${steps.length}개`);

  if (completedSteps === steps.length) {
    log('\n🎉 모든 단계 완료! 새로운 매물이 자동으로 등록되었습니다.');
    log('💡 다음: npm run dev → localhost:3001/listings 방문');
  } else {
    log('\n⚠️  일부 단계에서 오류가 발생했습니다. 위의 로그를 확인해주세요.');
  }

  // 로그 파일 저장
  fs.writeFileSync(logFile, logContent);
  log(`\n📝 로그 저장: ${logFile}`);

  process.exit(completedSteps === steps.length ? 0 : 1);
}

runPipeline().catch(err => {
  log(`\n❌ 치명적 오류: ${err.message}`);
  fs.writeFileSync(logFile, logContent);
  process.exit(1);
});
