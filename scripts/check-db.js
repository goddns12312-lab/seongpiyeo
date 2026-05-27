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

async function checkDb() {
  try {
    console.log('📊 데이터베이스 현황 확인\n');

    // 전체 매물 개수
    const { count: totalCount } = await supabase
      .from('listings')
      .select('*', { count: 'exact' });

    console.log(`📍 전체 매물: ${totalCount}개\n`);

    // Status별 개수
    const { data: statusData } = await supabase
      .from('listings')
      .select('status')
      .limit(1000);

    const byStatus = {};
    statusData?.forEach(item => {
      byStatus[item.status] = (byStatus[item.status] || 0) + 1;
    });

    console.log('Status별:');
    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}개`);
    });

    // 샘플 데이터 확인
    console.log('\n📄 샘플 매물 (상위 3개):');
    const { data: samples } = await supabase
      .from('listings')
      .select('id, title, price, deposit, monthly_rent, premium_price, description')
      .limit(3);

    samples?.forEach((item, i) => {
      console.log(`\n[${i + 1}] ${item.title}`);
      console.log(`    Price: ${item.price}`);
      console.log(`    보증금: ${item.deposit}`);
      console.log(`    월세: ${item.monthly_rent}`);
      console.log(`    권리금: ${item.premium_price}`);
      console.log(`    설명: ${item.description?.slice(0, 80) || '(없음)'}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkDb();
