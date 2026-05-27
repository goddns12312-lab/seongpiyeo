#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function applyMigrations() {
  try {
    console.log('🔧 마이그레이션 적용 시작\n');

    const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      console.log(`📝 ${file}...`);

      try {
        const { error } = await supabase.rpc('exec_sql', { sql });

        if (error) {
          console.log(`  ⚠️  ${error.message}`);
        } else {
          console.log(`  ✅ 완료`);
        }
      } catch (e) {
        // If exec_sql RPC doesn't exist, try direct SQL execution
        console.log(`  ⚠️  RPC 함수 없음 - 수동으로 실행하세요`);
      }
    }

    console.log('\n✅ 마이그레이션 완료\n');
    console.log('💡 참고: Supabase SQL Editor에서 수동으로도 실행 가능합니다');
    console.log('   - supabase/migrations/001_add_scraped_fields.sql 복사 → SQL Editor에 붙여넣기');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    process.exit(1);
  }
}

applyMigrations();
