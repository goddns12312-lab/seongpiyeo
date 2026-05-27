#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resetListings() {
  try {
    console.log('🗑️  모든 매물 삭제 중...');

    // Get count first
    const { count: totalCount, error: countError } = await supabase
      .from('listings')
      .select('id', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ 조회 실패:', countError.message);
      process.exit(1);
    }

    // Delete all by fetching and deleting in batches
    if (totalCount && totalCount > 0) {
      const { data: allListings, error: fetchError } = await supabase
        .from('listings')
        .select('id')
        .limit(1000);

      if (fetchError) {
        console.error('❌ 조회 실패:', fetchError.message);
        process.exit(1);
      }

      if (allListings && allListings.length > 0) {
        const { error: deleteError } = await supabase
          .from('listings')
          .delete()
          .in('id', allListings.map(l => l.id));

        if (deleteError) {
          console.error('❌ 삭제 실패:', deleteError.message);
          process.exit(1);
        }
      }
    }

    console.log(`✅ 완료: ${totalCount}개 삭제됨`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

resetListings();
