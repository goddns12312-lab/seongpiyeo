#!/usr/bin/env node

const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function test() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  console.log('\n🔍 Listings 데이터베이스 상태 확인\n');

  // Query 1: 전체 매물
  console.log('1️⃣  전체 매물:');
  const { data: allListings, error: allError } = await supabase
    .from('listings')
    .select('id, title, status, region, created_at')
    .order('created_at', { ascending: false });

  if (allError) {
    console.error('  Error:', allError.message);
  } else {
    console.log(`  Total: ${allListings.length}`);
    allListings.forEach(l => {
      console.log(`    - ID: ${l.id.substring(0, 8)}... | Status: ${l.status} | Title: ${l.title.substring(0, 30)}`);
    });
  }

  // Query 2: active만
  console.log('\n2️⃣  Active 매물만:');
  const { data: activeListings, error: activeError } = await supabase
    .from('listings')
    .select('id, title, status, region, created_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (activeError) {
    console.error('  Error:', activeError.message);
  } else {
    console.log(`  Count: ${activeListings.length}`);
    activeListings.forEach(l => {
      console.log(`    - ID: ${l.id.substring(0, 8)}... | Title: ${l.title.substring(0, 30)}`);
    });
  }

  // Query 3: 첫 번째 active 매물 상세
  if (activeListings && activeListings.length > 0) {
    const firstId = activeListings[0].id;
    console.log(`\n3️⃣  첫 번째 active 매물 상세 조회 (ID: ${firstId.substring(0, 8)}...):`);

    const { data: detail, error: detailError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', firstId)
      .single();

    if (detailError) {
      console.error('  Error:', detailError.message);
    } else {
      console.log(`  ✅ Found:`);
      console.log(`    Title: ${detail.title}`);
      console.log(`    Status: ${detail.status}`);
      console.log(`    Region: ${detail.region}`);
      console.log(`    Price: ${detail.price}`);
    }

    console.log(`\n4️⃣  이 매물을 URL로 접속할 때:\n  → http://localhost:3002/listings/${firstId}`);
  }
}

test();
