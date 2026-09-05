// scrape.js
// Opens the GroceryPulse Ottawa page, expands each category, extracts every
// item's name + prices across all banners, filters down to a personal
// shopping list, and writes the result to a CSV.
//
// Usage:
//   node scrape.js
//
// Output:
//   ./my-grocery-list.csv

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = 'https://grocerypulse.ca/city/ottawa';
const OUTPUT_CSV = path.join(__dirname, 'my-grocery-list.csv');
// Adjust this if you move the site folder relative to this script.
const OUTPUT_JSON = path.join(__dirname, '..', 'grocery-site', 'data.json');

// ---- YOUR PERSONAL ITEM LIST ----
// Edit this list any time to add/remove items. Matching is case-insensitive
// and ignores leading/trailing whitespace, but otherwise must match the
// product name on the site exactly (e.g. "2% Milk, 4L").
const MY_ITEMS = [
  '2% Milk, 4L',
  'Butter, Salted, 454g',
  'Cheddar Cheese, Medium, 400g',
  'Cream Cheese, 250g',
  'Chicken Breast, Boneless Skinless, per kg',
  'Ground Beef, Lean, per kg',
  'Chicken Thighs, Bone-In, per kg',
  'White Bread, 675g',
  'Whole Wheat Bread, 675g',
  'Hamburger Buns, 8-pack',
  'Bananas, per kg',
  'Apples, ~2kg Bag',
  'Strawberries, 454g',
  'Oranges, per kg',
  'Blueberries, Fresh 454g',
  'Potatoes, 10lb Bag',
  'Onions, 3lb Bag',
  'Carrots, 2lb Bag',
  'Broccoli, per Head or Crown',
  'Tomatoes, per kg',
  'Romaine Lettuce, per Head',
];

function normalize(str) {
  return str.trim().toLowerCase();
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });

  console.log(`Opening ${URL} ...`);
  await page.goto(URL, { waitUntil: 'networkidle' });

  // Dismiss cookie banner if present
  try {
    await page.getByText('Accept', { exact: true }).click({ timeout: 3000 });
  } catch (_) {
    // no cookie banner, ignore
  }

  const section = page.locator('section', { hasText: 'Prices by Category' }).first();
  await section.scrollIntoViewIfNeeded();

  const buttons = section.locator('button[aria-expanded]');
  const count = await buttons.count();
  console.log(`Found ${count} category sections.`);

  const wantedSet = new Set(MY_ITEMS.map(normalize));
  const foundRows = []; // { name, prices: { bannerName: price } }
  let bannerNames = null; // determined from the first table's thead

  for (let i = 0; i < count; i++) {
    const button = buttons.nth(i);

    // Open this category (accordion may auto-close others, that's fine)
    await button.scrollIntoViewIfNeeded();
    const isOpen = (await button.getAttribute('aria-expanded')) === 'true';
    if (!isOpen) {
      await button.click();
      await page.waitForTimeout(400);
    }

    const wrapper = button.locator('xpath=..');
    const table = wrapper.locator('table').first();

    // Grab banner names from thead once
    if (!bannerNames) {
      const headerCells = table.locator('thead th');
      const headerCount = await headerCells.count();
      bannerNames = [];
      for (let h = 1; h < headerCount; h++) {
        // first th is usually "Product" label, skip it
        const text = (await headerCells.nth(h).innerText()).trim();
        bannerNames.push(text);
      }
    }

    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();

    for (let r = 0; r < rowCount; r++) {
      const row = rows.nth(r);
      const name = (await row.locator('th').innerText()).trim();

      if (!wantedSet.has(normalize(name))) continue; // skip items not on your list

      const cells = row.locator('td');
      const cellCount = await cells.count();
      const prices = {};
      for (let c = 0; c < cellCount; c++) {
        const price = (await cells.nth(c).innerText()).trim();
        const banner = bannerNames[c] || `Store ${c + 1}`;
        prices[banner] = price;
      }
      foundRows.push({ name, prices });
    }
  }

  await browser.close();

  // Warn about any requested items that weren't found on the site
  const foundNames = new Set(foundRows.map((r) => normalize(r.name)));
  const missing = MY_ITEMS.filter((item) => !foundNames.has(normalize(item)));
  if (missing.length) {
    console.warn('Warning: these items from your list were not found on the page:');
    missing.forEach((m) => console.warn(`  - ${m}`));
  }

  // Build CSV
  const header = ['Item', ...bannerNames];
  const csvLines = [header.map(csvEscape).join(',')];

  // Preserve the order given in MY_ITEMS rather than scrape order
  const rowsByName = new Map(foundRows.map((r) => [normalize(r.name), r]));
  for (const item of MY_ITEMS) {
    const row = rowsByName.get(normalize(item));
    if (!row) continue;
    const line = [row.name, ...bannerNames.map((b) => row.prices[b] ?? '')];
    csvLines.push(line.map(csvEscape).join(','));
  }

  fs.writeFileSync(OUTPUT_CSV, csvLines.join('\n'), 'utf8');
  console.log(`Done! Wrote ${foundRows.length} items to ${OUTPUT_CSV}`);

  // Also write data.json for the hosted site, if that folder exists next to this one
  const jsonData = {
    generatedAt: new Date().toISOString(),
    stores: bannerNames,
    items: MY_ITEMS
      .map((item) => rowsByName.get(normalize(item)))
      .filter(Boolean)
      .map((row) => ({
        name: row.name,
        prices: Object.fromEntries(bannerNames.map((b) => [b, parsePrice(row.prices[b])])),
      })),
  };

  try {
    fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(jsonData, null, 2), 'utf8');
    console.log(`Also updated ${OUTPUT_JSON}`);
  } catch (err) {
    console.warn(`Could not write data.json (site folder may not exist at ${OUTPUT_JSON}): ${err.message}`);
  }
}

function parsePrice(str) {
  if (!str) return null;
  const trimmed = str.trim();
  if (trimmed === '' || trimmed === '—' || trimmed === '-') return null;
  const num = parseFloat(trimmed.replace(/[^0-9.]/g, ''));
  return Number.isNaN(num) ? null : num;
}

function csvEscape(value) {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
