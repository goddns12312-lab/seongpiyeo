#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ 환경변수 오류: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필수');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function main() {
  console.log('🚀 Supabase 마이그레이션 적용 중...\n');
  console.log(`Supabase: ${SUPABASE_URL}\n`);

  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_add_scraped_fields.sql');

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ 마이그레이션 파일 없음: ${migrationPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf-8');

  // Split by semicolon and filter empty statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  console.log(`총 ${statements.length}개 SQL 명령 발견\n`);

  let executed = 0;
  let failed = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const description = stmt.substring(0, 60) + (stmt.length > 60 ? '...' : '');
    console.log(`[${i + 1}/${statements.length}] ${description}`);

    try {
      const { error } = await supabase.rpc('exec', { statement: stmt });

      if (error) {
        // Try direct SQL execution approach (Postgres functions might not exist)
        // Use query directly with rpc or raw SQL
        console.warn('  ⚠️  RPC 실패, 직접 SQL 시도...');

        // Unfortunately, we can't directly execute raw SQL with anon/service role in Supabase JS client
        // We need to use the Postgres function approach or dashboard
        console.error(`  ❌ 실패: ${error.message}`);
        failed++;
        continue;
      }

      console.log('  ✅ 완료');
      executed++;
    } catch (err) {
      console.error(`  ❌ 오류: ${err.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 마이그레이션 결과');
  console.log('='.repeat(60));
  console.log(`✅ 실행: ${executed}`);
  console.log(`❌ 실패: ${failed}`);

  if (failed > 0) {
    console.log('\n⚠️  주의: RPC를 통한 SQL 실행이 불가능합니다.');
    console.log('다음 방법 중 하나를 사용하세요:');
    console.log('\n1️⃣  Supabase 대시보드 (가장 간단)');
    console.log('   - https://app.supabase.com → SQL Editor');
    console.log('   - supabase/migrations/001_add_scraped_fields.sql의 내용을 복사');
    console.log('   - RUN 버튼 클릭');
    console.log('\n2️⃣  psql CLI (PostgreSQL 클라이언트)');
    console.log(`   - psql ${SUPABASE_URL} < supabase/migrations/001_add_scraped_fields.sql`);
    console.log('\n3️⃣  Python 스크립트');
    console.log('   - psycopg2 라이브러리로 직접 실행 가능');
    process.exit(1);
  }

  console.log('\n✨ 마이그레이션 적용 완료!');
  console.log('\n다음: node scripts/import-to-supabase.js');
}

main().catch(err => {
  console.error('\n치명적 오류:', err);
  process.exit(1);
});
