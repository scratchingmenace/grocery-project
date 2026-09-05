// capture.js
// Opens the GroceryPulse Ottawa page, expands each category one at a time,
// screenshots the "Prices by Category" section in its expanded state,
// then stitches all the screenshots into one tall composite image.
//
// Usage:
//   node capture.js
//
// Output:
//   ./shots/           - individual screenshots, one per category
//   ./combined.png      - all categories stacked into a single image

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const URL = 'https://grocerypulse.ca/city/ottawa';
const SHOTS_DIR = path.join(__dirname, 'shots');

async function main() {
  if (!fs.existsSync(SHOTS_DIR)) fs.mkdirSync(SHOTS_DIR);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });

  console.log(`Opening ${URL} ...`);
  await page.goto(URL, { waitUntil: 'networkidle' });

  // Accept cookie banner if present, so it doesn't block anything
  try {
    await page.getByText('Accept', { exact: true }).click({ timeout: 3000 });
  } catch (_) {
    // no cookie banner, ignore
  }

  // Find the "Prices by Category" section, then grab all its accordion buttons
  const section = page.locator('section', { hasText: 'Prices by Category' }).first();
  await section.scrollIntoViewIfNeeded();

  const buttons = section.locator('button[aria-expanded]');
  const count = await buttons.count();
  console.log(`Found ${count} category sections.`);

  const shotPaths = [];

  for (let i = 0; i < count; i++) {
    const button = buttons.nth(i);
    const label = (await button.locator('span').first().innerText()).trim();
    const safeName = label.replace(/[^a-z0-9]+/gi, '_').toLowerCase();

    // Close any currently open panel first (click any button that's expanded)
    const openButtons = section.locator('button[aria-expanded="true"]');
    const openCount = await openButtons.count();
    for (let j = 0; j < openCount; j++) {
      const isExpanded = await openButtons.nth(j).getAttribute('aria-expanded');
      if (isExpanded === 'true') {
        await openButtons.nth(j).click();
        await page.waitForTimeout(300); // allow collapse animation
      }
    }

    // Open this one
    await button.scrollIntoViewIfNeeded();
    await button.click();
    await page.waitForTimeout(400); // allow expand animation

    // Screenshot just the row/panel for this category.
    // We screenshot the parent wrapper div (button + its panel) so we get
    // exactly one open table per image, cleanly cropped.
    const wrapper = button.locator('xpath=..'); // parent div wraps button + panel
    const shotPath = path.join(SHOTS_DIR, `${String(i).padStart(2, '0')}_${safeName}.png`);
    await wrapper.screenshot({ path: shotPath });
    shotPaths.push(shotPath);

    console.log(`Captured: ${label} -> ${shotPath}`);
  }

  await browser.close();

  console.log('Stitching screenshots together...');
  await stitchVertically(shotPaths, path.join(__dirname, 'combined.png'));
  console.log('Done! See combined.png');
}

function loadPNG(filePath) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(new PNG())
      .on('parsed', function () {
        resolve(this);
      })
      .on('error', reject);
  });
}

async function stitchVertically(imagePaths, outputPath) {
  const images = await Promise.all(imagePaths.map(loadPNG));

  const width = Math.max(...images.map((img) => img.width));
  const totalHeight = images.reduce((sum, img) => sum + img.height, 0);
  const gap = 12; // small gap between screenshots
  const finalHeight = totalHeight + gap * (images.length - 1);

  const output = new PNG({ width, height: finalHeight });
  // fill white background
  output.data.fill(255);

  let yOffset = 0;
  for (const img of images) {
    img.bitblt(output, 0, 0, img.width, img.height, 0, yOffset);
    yOffset += img.height + gap;
  }

  output.pack().pipe(fs.createWriteStream(outputPath));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
