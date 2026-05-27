#!/usr/bin/env node

const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function test() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  console.log('\n🔍 Testing slug query...\n');

  // Test 1: Query all jobs to see what slugs exist
  console.log('Test 1: Query all active jobs');
  const { data: allJobs, error: allError } = await supabase
    .from('jobs')
    .select('id, slug, title, status, deleted_at')
    .eq('status', 'active')
    .is('deleted_at', null);

  if (allError) {
    console.error('Error:', allError.message);
  } else {
    console.log(`Found ${allJobs.length} active jobs:`);
    allJobs.forEach(job => {
      console.log(`  - Slug: "${job.slug}" | Title: "${job.title}"`);
    });
  }

  // Test 2: Try exact slug from database
  if (allJobs && allJobs.length > 0) {
    const targetSlug = allJobs[0].slug;
    console.log(`\nTest 2: Query by exact slug "${targetSlug}"`);

    const { data: job, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('slug', targetSlug)
      .eq('status', 'active')
      .is('deleted_at', null)
      .single();

    if (error) {
      console.error('Error:', error.message);
    } else {
      console.log('Found job:');
      console.log(`  - ID: ${job.id}`);
      console.log(`  - Slug: "${job.slug}"`);
      console.log(`  - Title: "${job.title}"`);
      console.log(`  - Status: ${job.status}`);
    }
  }

  // Test 3: Try with Korean slug
  console.log(`\nTest 3: Query by Korean slug "인천-32f-mpn2fr10"`);

  const { data: koJob, error: koError } = await supabase
    .from('jobs')
    .select('*')
    .eq('slug', '인천-32f-mpn2fr10')
    .eq('status', 'active')
    .is('deleted_at', null)
    .single();

  if (koError) {
    console.error('Error:', koError.message);
  } else if (koJob) {
    console.log('Found job:');
    console.log(`  - ID: ${koJob.id}`);
    console.log(`  - Slug: "${koJob.slug}"`);
  } else {
    console.log('No job found');
  }
}

test().catch(err => console.error('Test error:', err));
