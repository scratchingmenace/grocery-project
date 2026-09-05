# GroceryPulse Category Screenshot Tool

Automates opening each category accordion on the GroceryPulse Ottawa page,
screenshotting each one expanded, and stitching them into a single tall image.

## Setup (one-time)

1. Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).
2. In this folder, run:

   ```bash
   npm install
   npx playwright install chromium
   ```

   The second command downloads the actual browser Playwright drives — only
   needed once.

## Run it

```bash
node capture.js
```

This will:
- Open `https://grocerypulse.ca/city/ottawa` in a headless Chromium browser
- Dismiss the cookie banner if it appears
- Click through each category accordion one at a time, screenshotting it
  expanded (individual images land in `./shots/`)
- Stitch all the screenshots into one combined image: `./combined.png`

## Notes / things that might need tweaking

- If GroceryPulse changes their page layout or class names, the selectors
  in `capture.js` (e.g. the `section` lookup by "Prices by Category" text,
  or `button[aria-expanded]`) may need updating.
- If a category table is very tall, you may want to increase the browser
  viewport height in `capture.js` (`viewport: { width: 1200, height: 900 }`).
- Right now it takes one screenshot per category (so you get 10 clean
  images + 1 combined image). If you specifically need ALL categories
  visibly expanded in a single live screenshot (not stitched after the
  fact), that's not possible here since the site only renders one
  category's content in the DOM at a time — stitching is the workaround.
