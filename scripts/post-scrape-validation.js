#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const listingsFile = path.join(__dirname, 'output', 'listings.json');
const failedLogFile = path.join(__dirname, 'output', 'failed.log');

function log(...args) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}]`, ...args);
}

function validateListings() {
  log('═'.repeat(80));
  log('🔍 listings.json 데이터 검증 시작');
  log('═'.repeat(80));

  // 1. listings.json 로드
  if (!fs.existsSync(listingsFile)) {
    log('❌ listings.json을 찾을 수 없습니다');
    return;
  }

  let listings = [];
  try {
    listings = JSON.parse(fs.readFileSync(listingsFile, 'utf-8'));
    log(`\n📋 총 ${listings.length}개 매물 로드됨`);
  } catch (err) {
    log(`❌ JSON 파싱 오류: ${err.message}`);
    return;
  }

  // 2. 검증 기준 정의
  const issues = {
    noDescription: [],
    noMainImageUrl: [],
    invalidMonthlyRent: [],
    duplicateIdx: [],
    noImages: [],
    missingIdx: []
  };

  const seenIdx = new Set();

  listings.forEach((listing, i) => {
    const idx = listing.idx;

    // 중복 idx 확인
    if (seenIdx.has(idx)) {
      issues.duplicateIdx.push({ idx, title: listing.title });
    } else {
      seenIdx.add(idx);
    }

    // description 확인
    if (!listing.description || listing.description.trim() === '') {
      issues.noDescription.push({ idx, title: listing.title });
    }

    // 이미지 확인
    if (!listing.images || listing.images.length === 0) {
      issues.noImages.push({ idx, title: listing.title });
    }

    // monthly_rent 확인
    if (listing.monthly_rent !== null && listing.monthly_rent !== undefined) {
      const rent = parseInt(listing.monthly_rent);
      if (isNaN(rent) || rent < 0 || rent > 10000) {
        issues.invalidMonthlyRent.push({
          idx,
          title: listing.title,
          value: listing.monthly_rent
        });
      }
    }

    // idx 필드 확인
    if (!idx) {
      issues.missingIdx.push({ title: listing.title, i });
    }
  });

  // 3. 검증 결과 출력
  log('\n' + '─'.repeat(80));
  log('📊 검증 결과:\n');

  let hasIssues = false;

  if (issues.noDescription.length > 0) {
    hasIssues = true;
    log(`⚠️  Description 없음: ${issues.noDescription.length}개`);
    issues.noDescription.slice(0, 5).forEach(item => {
      log(`   - idx=${item.idx} | ${item.title}`);
    });
    if (issues.noDescription.length > 5) {
      log(`   ... 그 외 ${issues.noDescription.length - 5}개`);
    }
  }

  if (issues.noImages.length > 0) {
    log(`\n⚠️  이미지 없음: ${issues.noImages.length}개`);
    issues.noImages.slice(0, 5).forEach(item => {
      log(`   - idx=${item.idx} | ${item.title}`);
    });
    if (issues.noImages.length > 5) {
      log(`   ... 그 외 ${issues.noImages.length - 5}개`);
    }
  }

  if (issues.invalidMonthlyRent.length > 0) {
    hasIssues = true;
    log(`\n⚠️  월세 값 비정상: ${issues.invalidMonthlyRent.length}개`);
    issues.invalidMonthlyRent.slice(0, 5).forEach(item => {
      log(`   - idx=${item.idx} | value=${item.value} | ${item.title}`);
    });
    if (issues.invalidMonthlyRent.length > 5) {
      log(`   ... 그 외 ${issues.invalidMonthlyRent.length - 5}개`);
    }
  }

  if (issues.duplicateIdx.length > 0) {
    hasIssues = true;
    log(`\n❌ 중복 idx: ${issues.duplicateIdx.length}개`);
    issues.duplicateIdx.forEach(item => {
      log(`   - idx=${item.idx} | ${item.title}`);
    });
  }

  if (issues.missingIdx.length > 0) {
    hasIssues = true;
    log(`\n❌ idx 필드 누락: ${issues.missingIdx.length}개`);
  }

  if (!hasIssues && issues.noImages.length === 0) {
    log('✅ 모든 검증 통과!');
  }

  // 4. 검증 통과한 매물 통계
  const validListings = listings.filter(l => {
    return l.idx &&
           l.description &&
           l.description.trim() !== '' &&
           l.images &&
           l.images.length > 0;
  });

  log('\n' + '─'.repeat(80));
  log(`✅ 검증 통과 매물: ${validListings.length}개 / ${listings.length}개`);
  log(`⚠️  검증 미통과: ${listings.length - validListings.length}개`);

  // 5. failed.log 확인
  log('\n' + '═'.repeat(80));
  log('📋 failed.log 분석');
  log('═'.repeat(80));

  if (!fs.existsSync(failedLogFile)) {
    log('✅ failed.log 없음 (모두 성공!)');
    return { listings, validListings, issues };
  }

  const failedLog = fs.readFileSync(failedLogFile, 'utf-8');
  const failedLines = failedLog.split('\n').filter(l => l.trim());
  log(`\n총 ${failedLines.length}개 실패 항목`);

  // 재시도 가능한 것 (네트워크 에러)과 불가능한 것(404) 분류
  const retryable = failedLines.filter(l =>
    l.includes('page_load_failed') || l.includes('networkidle') || l.includes('timeout')
  );
  const notRetryable = failedLines.filter(l =>
    l.includes('404') || l.includes('not found') || l.includes('does not exist')
  );

  log(`\n🔄 재시도 가능: ${retryable.length}개 (네트워크 오류)`);
  retryable.slice(0, 5).forEach(line => {
    log(`   ${line.substring(0, 100)}...`);
  });

  log(`\n❌ 재시도 불가능: ${notRetryable.length}개 (404/not found)`);

  return { listings, validListings, issues, retryable, notRetryable };
}

validateListings();
