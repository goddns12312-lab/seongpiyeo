#!/usr/bin/env node

const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:3002';

async function test() {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('Loading /jobs page...\n');
    await page.goto(`${BASE_URL}/jobs`, { waitUntil: 'networkidle' });

    // Get all links
    console.log('All links on /jobs page:');
    const links = await page.locator('a').all();
    console.log(`Found ${links.length} links\n`);

    for (let i = 0; i < Math.min(15, links.length); i++) {
      const href = await links[i].getAttribute('href');
      const text = (await links[i].textContent()).trim().substring(0, 40);
      console.log(`  [${i}] href="${href}" | text="${text}"`);
    }

    // Get job cards
    console.log('\nJob cards (hover:border-gold elements):');
    const cards = await page.locator('[class*="hover:border-gold"]').all();
    console.log(`Found ${cards.length} cards\n`);

    // For each card, find the nearest Link element
    for (let i = 0; i < Math.min(3, cards.length); i++) {
      const card = cards[i];
      // Find parent link of this card
      const parentLink = card.locator('xpath=/ancestor::a');
      const href = await parentLink.first().getAttribute('href').catch(() => 'NO HREF FOUND');
      console.log(`  Card ${i}: link href="${href}"`);
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    if (browser) await browser.close();
  }
}

test();
