# Ottawa Grocery Savings

A small site that shows the cheapest way to buy your 21-item grocery list in
Ottawa, three ways: all at Superstore, all at the cheapest single store, or
mixed across whichever store has each item cheapest.

## Structure

```
grocery-site/                 → the static site (deploy this folder to Netlify)
  index.html
  data.json                   → prices, regenerated weekly by the scraper
grocerypulse-screenshot/      → the scraper
  scrape.js
  package.json
.github/workflows/
  update-prices.yml           → runs the scraper every Thursday, commits data.json
```

## One-time setup

### 1. Put this whole folder under Git and push it to GitHub

```bash
cd grocery-project
git init
git add .
git commit -m "Initial commit"
```

Then create a new repository on [github.com/new](https://github.com/new)
(private is fine), and follow the "push an existing repository" instructions
it shows you — something like:

```bash
git remote add origin https://github.com/YOUR_USERNAME/grocery-project.git
git branch -M main
git push -u origin main
```

### 2. Connect Netlify to the GitHub repo (not drag-and-drop this time)

Drag-and-drop deploys can't auto-update when GitHub Actions pushes new
prices — you need Netlify's Git-connected mode instead:

1. Go to [app.netlify.com](https://app.netlify.com) and log in / sign up.
2. Click **Add new site → Import an existing project**.
3. Choose **GitHub**, authorize it, and pick your `grocery-project` repo.
4. Set **Base directory** to `grocery-site` (important — that's the folder
   with `index.html` in it).
5. Leave build command blank (there's nothing to build) and publish directory
   as `grocery-site` (or `.` if you already set the base directory above).
6. Click **Deploy**. You'll get a live URL, same as before.

From now on, any push to the `main` branch — including the automatic ones
from GitHub Actions — triggers a new deploy automatically.

### 3. The scheduled scrape

`.github/workflows/update-prices.yml` runs every Thursday around noon
Eastern time, re-scrapes GroceryPulse, and commits the refreshed
`grocery-site/data.json` back to the repo. That commit triggers the Netlify
redeploy from step 2 — so the site updates itself with no further action
from you.

You can also trigger it manually any time: go to your repo on GitHub → the
**Actions** tab → **Update grocery prices** → **Run workflow**.

### Editing your item list

Your 21 items live in the `MY_ITEMS` array near the top of
`grocerypulse-screenshot/scrape.js`. Add or remove lines there, commit, and
push — the next scheduled (or manual) run will pick up the change.
