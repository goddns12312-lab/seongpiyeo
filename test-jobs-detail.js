#!/usr/bin/env node

const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:3002';

async function testJobsDetail() {
  let browser;

  console.log('\n🔍 Jobs Detail Page Test\n');

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const url = `${BASE_URL}/jobs/test-job-1779825910601`;
    console.log(`📍 Testing: ${url}\n`);

    await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });

    // Get response status
    const response = await page.evaluate(() => {
      return {
        status: window.location.href,
        title: document.title,
        h1: document.querySelector('h1')?.textContent || 'No h1',
        bodyContent: document.body.innerText?.substring(0, 500) || 'No content',
        errors: window.__ERROR__,
      };
    });

    console.log('Response Info:');
    console.log(`  Title: ${response.title}`);
    console.log(`  H1: ${response.h1}`);
    console.log(`  First 500 chars: ${response.bodyContent}\n`);

    // Check for specific elements
    const h1Text = await page.locator('h1').first().textContent();
    const hasContact = await page.locator('text=/연락처/').count() > 0;
    const hasDescription = await page.locator('text=/공고|내용|설명/').count() > 0;
    const hasImages = await page.locator('img').count() > 0;

    console.log('Element Check:');
    console.log(`  ✓ H1 Text: "${h1Text}"`);
    console.log(`  ${hasContact ? '✓' : '✗'} Has 연락처 section`);
    console.log(`  ${hasDescription ? '✓' : '✗'} Has description/content`);
    console.log(`  ${hasImages ? '✓' : '✗'} Has images`);
    console.log();

    // Check page source
    const content = await page.content();
    console.log('Source Check:');
    console.log(`  Source length: ${content.length} bytes`);
    console.log(`  Has "Server Error": ${content.includes('Server Error')}`);
    console.log(`  Has job title: ${content.includes('PC방 직원 모집')}`);
    console.log(`  Has 404 text: ${content.includes('This page could not be found')}`);
    console.log();

    // Look for error messages
    const pageText = await page.textContent('body');
    if (pageText.includes('Error') || pageText.includes('error')) {
      console.log('⚠️  Found error text in page:');
      const errorLines = pageText.split('\n').filter(line =>
        line.toLowerCase().includes('error') && line.trim().length > 0
      );
      errorLines.slice(0, 5).forEach(line => console.log(`  ${line.trim()}`));
    }

  } catch (err) {
    console.error('❌ Test failed:', err.message);
  } finally {
    if (browser) await browser.close();
  }
}

testJobsDetail();
