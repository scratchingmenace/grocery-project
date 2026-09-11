// csv-to-data.js
// Converts my-grocery-list.csv (produced by scrape.js) into data.json, the
// format the shopping-list site actually reads. Run this right after
// scrape.js:
//
//   node scrape.js && node csv-to-data.js
//
// What this handles automatically:
//   - Drops the Sobeys column (tracked by GroceryPulse, not part of this
//     comparison)
//   - Skips items you've deliberately excluded (see EXCLUDE_ITEMS below)
//   - Preserves per-item metadata (like requiresHalal) across runs
//   - Carries forward stale data (flagged with staleSince) for any
//     tracked item that didn't show up in this week's scrape, instead of
//     silently losing it
//   - Applies known product renames (see RENAMED_ITEMS below) so a
//     GroceryPulse rename doesn't produce a duplicate stale entry
//     alongside the fresh one
//
// What still needs a manual one-line edit occasionally:
//   - If GroceryPulse renames a tracked product again, add the mapping to
//     RENAMED_ITEMS so old metadata/price history carries over cleanly
//     instead of creating a duplicate. (You'll see a console warning if
//     an old item goes stale -- that's your cue to check whether it was
//     renamed vs. genuinely discontinued.)
//   - If you decide to stop tracking an item entirely, add it to
//     EXCLUDE_ITEMS.

const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, 'my-grocery-list.csv');
const DATA_PATH = path.join(__dirname, 'data.json');

// Items scrape.js still requests (via its MY_ITEMS list) but that you've
// deliberately decided not to track in data.json -- e.g. Ground Beef,
// whose halal-option pricing didn't line up with what GroceryPulse pulls.
const EXCLUDE_ITEMS = new Set([
  'Ground Beef, Lean, per kg',
]);

// old name -> current name, whenever GroceryPulse renames a tracked
// product. Keeps requiresHalal and other metadata attached correctly
// across the rename, and prevents a duplicate stale entry under the old
// name from sitting alongside the fresh one under the new name.
const RENAMED_ITEMS = {
  'Blueberries, Fresh 454g': 'Blueberries, Fresh 454g (1lb)',
};

// The stores this site actually compares.
const STORES = ['Food Basics', 'FreshCo', 'Giant Tiger', 'Loblaws', 'Metro', 'No Frills', 'Superstore'];

// Minimal CSV parser -- handles quoted fields containing commas, which
// scrape.js produces for item names like "Apples, ~2kg Bag".
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (field !== '' || row.length) { row.push(field); rows.push(row); row = []; field = ''; }
      if (c === '\r' && text[i + 1] === '\n') i++;
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function parsePrice(raw) {
  const cleaned = (raw || '').trim();
  if (!cleaned || cleaned === '—' || cleaned === '-' || /^n\/a$/i.test(cleaned)) return null;
  const num = parseFloat(cleaned.replace(/[$,]/g, ''));
  return isNaN(num) ? null : num;
}

function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`Could not find ${CSV_PATH} -- run "node scrape.js" first.`);
    process.exit(1);
  }

  const rows = parseCsv(fs.readFileSync(CSV_PATH, 'utf8'));
  const header = rows[0];
  const dataRows = rows.slice(1).filter((r) => r.length && r[0]);

  const oldData = fs.existsSync(DATA_PATH)
    ? JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))
    : { items: [], generatedAt: null };

  // Key old items by their CURRENT name (applying any known rename), so a
  // renamed product's metadata and price history are found correctly
  // when the fresh CSV shows up under its new name.
  const oldByCurrentName = new Map();
  for (const item of oldData.items) {
    const currentName = RENAMED_ITEMS[item.name] || item.name;
    oldByCurrentName.set(currentName, item);
  }

  const newItems = [];
  const seenNames = new Set();

  for (const row of dataRows) {
    const name = row[0];
    if (!name || EXCLUDE_ITEMS.has(name)) continue;
    seenNames.add(name);

    const rowByStore = {};
    header.slice(1).forEach((store, idx) => { rowByStore[store] = row[idx + 1]; });

    const prices = {};
    for (const store of STORES) prices[store] = parsePrice(rowByStore[store]);

    const item = { name, prices };
    const oldItem = oldByCurrentName.get(name);
    if (oldItem && oldItem.requiresHalal) item.requiresHalal = true;
    newItems.push(item);
  }

  // Anything previously tracked that didn't show up this week -- carry
  // its old price forward, flagged, instead of silently dropping it.
  for (const [name, oldItem] of oldByCurrentName) {
    if (seenNames.has(name) || EXCLUDE_ITEMS.has(name)) continue;
    const item = {
      name,
      prices: oldItem.prices,
      staleSince: oldItem.staleSince || oldData.generatedAt,
    };
    if (oldItem.requiresHalal) item.requiresHalal = true;
    newItems.push(item);
    console.warn(`Warning: "${name}" was not in this week's scrape -- carrying forward stale price data. If it was renamed on GroceryPulse, add it to RENAMED_ITEMS in this script.`);
  }

  const newData = {
    stores: STORES,
    items: newItems,
    generatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(DATA_PATH, JSON.stringify(newData, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${newItems.length} items to ${DATA_PATH}`);
}

main();
