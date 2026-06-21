/**
 * DB listing.description 품질 감사 (dry-run 리포트)
 * 사용: node scripts/audit-listing-descriptions.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const { createClient } = require('@supabase/supabase-js');

const CRAWL_MARKERS = ['PC천국에서 가져온', '에서 가져온 매물'];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('❌ .env.local 필요');
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const { data: listings, error } = await supabase
    .from('listings')
    .select('id, title, description, idx, user_id, status')
    .eq('status', 'active');

  if (error) {
    console.error('❌', error.message);
    process.exit(1);
  }

  let empty = 0;
  let short = 0;
  let crawlMarker = 0;
  let crawledWithText = 0;
  let userWritten = 0;

  const samples = { short: [], crawl: [], user: [] };

  for (const row of listings) {
    const text = String(row.description || '').trim();
    if (!text) {
      empty++;
      continue;
    }
    if (text.length < 50) {
      short++;
      if (samples.short.length < 5) samples.short.push({ id: row.id, title: row.title, len: text.length });
    }
    if (CRAWL_MARKERS.some((m) => text.includes(m))) {
      crawlMarker++;
      if (samples.crawl.length < 5) samples.crawl.push({ id: row.id, title: row.title });
    }
    if (row.idx && !row.user_id) crawledWithText++;
    if (row.user_id && text) {
      userWritten++;
      if (samples.user.length < 3) samples.user.push({ id: row.id, title: row.title, len: text.length });
    }
  }

  console.log('\n📋 DB description 품질 감사 (active)\n');
  console.log(`전체 active: ${listings.length}`);
  console.log(`비어있음: ${empty}`);
  console.log(`50자 미만: ${short}`);
  console.log(`크롤 마커 포함: ${crawlMarker}`);
  console.log(`크롤(idx) + description 있음: ${crawledWithText} → 화면에서 숨김 처리됨`);
  console.log(`회원 등록 + description: ${userWritten}`);
  console.log('\n💡 SEO meta description은 코드 생성(buildListingSeoDescription) — DB 값과 무관');
  console.log('💡 크롤 본문은 1d83bed 배포 후 상세 페이지에서 숨김\n');

  if (samples.short.length) {
    console.log('--- 50자 미만 샘플 ---');
    samples.short.forEach((s) => console.log(`  [${s.id}] ${s.len}자 — ${s.title}`));
  }
}

main().catch(console.error);
