import { useState, useMemo } from "react";
import { ChevronDown, MapPin } from "lucide-react";

// ---- Raw price data (CAD) for your 21-item Ottawa list ----
// null = item not carried / not priced at that banner
const ITEMS = [
  { name: "2% Milk, 4L", prices: { "Food Basics": null, FreshCo: 6.44, "Giant Tiger": 6.88, Loblaws: 6.44, Metro: 8.16, "No Frills": 6.44, Sobeys: 6.49, Superstore: 6.44 } },
  { name: "Butter, Salted, 454g", prices: { "Food Basics": 4.98, FreshCo: 5.99, "Giant Tiger": 4.88, Loblaws: 5.99, Metro: 6.49, "No Frills": 4.99, Sobeys: 6.19, Superstore: 5.99 } },
  { name: "Cheddar Cheese, Medium, 400g", prices: { "Food Basics": 4.99, FreshCo: 5.99, "Giant Tiger": 4.87, Loblaws: 6.00, Metro: 4.44, "No Frills": 5.99, Sobeys: 6.99, Superstore: 5.97 } },
  { name: "Cream Cheese, 250g", prices: { "Food Basics": 3.19, FreshCo: 2.99, "Giant Tiger": 2.97, Loblaws: 3.99, Metro: 2.99, "No Frills": 3.00, Sobeys: 3.99, Superstore: 3.00 } },
  { name: "Chicken Breast, Boneless Skinless, per kg", prices: { "Food Basics": 10.98, FreshCo: 13.50, "Giant Tiger": 11.03, Loblaws: 18.80, Metro: 19.82, "No Frills": 13.87, Sobeys: 21.58, Superstore: 18.72 } },
  { name: "Ground Beef, Lean, per kg", prices: { "Food Basics": 20.92, FreshCo: 10.00, "Giant Tiger": 10.87, Loblaws: 22.00, Metro: 21.58, "No Frills": 18.72, Sobeys: 19.82, Superstore: 18.72 } },
  { name: "Chicken Thighs, Bone-In, per kg", prices: { "Food Basics": 9.90, FreshCo: 7.50, "Giant Tiger": 11.59, Loblaws: 11.90, Metro: 13.87, "No Frills": 7.47, Sobeys: 13.49, Superstore: 10.34 } },
  { name: "White Bread, 675g", prices: { "Food Basics": 2.48, FreshCo: 2.48, "Giant Tiger": 1.97, Loblaws: 3.99, Metro: 2.69, "No Frills": 3.00, Sobeys: 2.49, Superstore: 3.25 } },
  { name: "Whole Wheat Bread, 675g", prices: { "Food Basics": 2.48, FreshCo: 2.48, "Giant Tiger": 1.97, Loblaws: 2.45, Metro: 4.00, "No Frills": 2.48, Sobeys: 2.49, Superstore: 2.45 } },
  { name: "Hamburger Buns, 8-pack", prices: { "Food Basics": 7.99, FreshCo: 3.49, "Giant Tiger": 2.50, Loblaws: 3.29, Metro: 6.29, "No Frills": 2.29, Sobeys: 2.67, Superstore: 2.39 } },
  { name: "Bananas, per kg", prices: { "Food Basics": 1.52, FreshCo: 1.52, "Giant Tiger": 1.89, Loblaws: 1.96, Metro: 2.18, "No Frills": 1.52, Sobeys: 1.52, Superstore: 1.52 } },
  { name: "Apples, ~2kg Bag", prices: { "Food Basics": 4.99, FreshCo: 4.99, "Giant Tiger": 5.97, Loblaws: 8.00, Metro: 2.99, "No Frills": 7.99, Sobeys: 6.99, Superstore: 8.00 } },
  { name: "Strawberries, 454g", prices: { "Food Basics": 4.99, FreshCo: 5.99, "Giant Tiger": 3.84, Loblaws: 5.00, Metro: 5.99, "No Frills": 4.99, Sobeys: 4.97, Superstore: 5.00 } },
  { name: "Oranges, per kg", prices: { "Food Basics": 4.40, FreshCo: 3.06, "Giant Tiger": 3.30, Loblaws: 3.31, Metro: 2.80, "No Frills": 3.70, Sobeys: 4.39, Superstore: 3.90 } },
  { name: "Blueberries, Fresh 454g", prices: { "Food Basics": 2.99, FreshCo: 4.99, "Giant Tiger": 3.97, Loblaws: 5.00, Metro: 4.99, "No Frills": 3.99, Sobeys: 5.99, Superstore: 5.00 } },
  { name: "Potatoes, 10lb Bag", prices: { "Food Basics": 5.98, FreshCo: 6.99, "Giant Tiger": 4.44, Loblaws: 2.00, Metro: 6.99, "No Frills": 4.99, Sobeys: 5.99, Superstore: 5.00 } },
  { name: "Onions, 3lb Bag", prices: { "Food Basics": 2.99, FreshCo: 1.79, "Giant Tiger": 1.95, Loblaws: 4.00, Metro: 1.99, "No Frills": 2.99, Sobeys: 2.77, Superstore: 3.00 } },
  { name: "Carrots, 2lb Bag", prices: { "Food Basics": 3.49, FreshCo: 2.84, "Giant Tiger": 2.44, Loblaws: 3.00, Metro: 1.99, "No Frills": 2.99, Sobeys: 2.77, Superstore: 3.00 } },
  { name: "Broccoli, per Head or Crown", prices: { "Food Basics": 2.50, FreshCo: 6.35, "Giant Tiger": 3.47, Loblaws: 2.50, Metro: 2.99, "No Frills": 1.99, Sobeys: 8.80, Superstore: 2.50 } },
  { name: "Tomatoes, per kg", prices: { "Food Basics": 5.49, FreshCo: 6.55, "Giant Tiger": 4.23, Loblaws: 2.20, Metro: 7.69, "No Frills": 2.18, Sobeys: 4.39, Superstore: 4.41 } },
  { name: "Romaine Lettuce, per Head", prices: { "Food Basics": 2.99, FreshCo: 2.77, "Giant Tiger": 3.97, Loblaws: 3.00, Metro: 1.99, "No Frills": 2.49, Sobeys: 1.99, Superstore: 2.00 } },
];

const STORES = ["Food Basics", "FreshCo", "Giant Tiger", "Loblaws", "Metro", "No Frills", "Sobeys", "Superstore"];

const fmt = (n) => `$${n.toFixed(2)}`;

function computeStoreTotal(store) {
  let total = 0;
  let missing = 0;
  for (const item of ITEMS) {
    const p = item.prices[store];
    if (p == null) missing += 1;
    else total += p;
  }
  return { total, missing };
}

function computeMixAndMatch() {
  const perItem = ITEMS.map((item) => {
    let bestStore = null;
    let bestPrice = Infinity;
    for (const store of STORES) {
      const p = item.prices[store];
      if (p != null && p < bestPrice) {
        bestPrice = p;
        bestStore = store;
      }
    }
    return { name: item.name, store: bestStore, price: bestPrice };
  });

  const byStore = {};
  for (const row of perItem) {
    if (!byStore[row.store]) byStore[row.store] = [];
    byStore[row.store].push(row);
  }
  const groups = Object.entries(byStore)
    .map(([store, rows]) => ({
      store,
      rows: rows.sort((a, b) => b.price - a.price),
      subtotal: rows.reduce((s, r) => s + r.price, 0),
    }))
    .sort((a, b) => b.subtotal - a.subtotal);

  const total = perItem.reduce((s, r) => s + r.price, 0);
  return { groups, total, storeCount: groups.length };
}

export default function GrocerySavings() {
  const superstore = useMemo(() => computeStoreTotal("Superstore"), []);
  const cheapestSingle = useMemo(() => {
    const candidates = STORES.filter((s) => s !== "Superstore").map((s) => ({
      store: s,
      ...computeStoreTotal(s),
    }));
    const complete = candidates.filter((c) => c.missing === 0);
    return complete.sort((a, b) => a.total - b.total)[0];
  }, []);
  const mix = useMemo(() => computeMixAndMatch(), []);

  const savingsSingle = superstore.total - cheapestSingle.total;
  const savingsMix = superstore.total - mix.total;
  const pctMix = Math.round((savingsMix / superstore.total) * 100);
  const pctSingle = Math.round((savingsSingle / superstore.total) * 100);

  const [open, setOpen] = useState("mix");

  return (
    <div
      style={{
        fontFamily: "'Libre Franklin', sans-serif",
        background: "#1F2E23",
        minHeight: "100%",
        padding: "32px 16px",
        color: "#F2EFE6",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Libre+Franklin:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
        .num { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
        .acc-body { overflow: hidden; transition: grid-template-rows 320ms ease; display: grid; }
        @media (prefers-reduced-motion: reduce) { .acc-body { transition: none; } .chev { transition: none !important; } }
        .chev { transition: transform 220ms ease; }
      `}</style>

      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, letterSpacing: 0.3, color: "#9FB3A4", marginBottom: 6 }}>
            Ottawa · 21 items · updated weekly
          </div>
          <h1
            style={{
              fontFamily: "'Fraunces', serif",
              fontWeight: 600,
              fontSize: 30,
              lineHeight: 1.15,
              margin: 0,
              color: "#F7F4EC",
            }}
          >
            Where to buy your list
          </h1>
          <p style={{ color: "#B7C6BA", fontSize: 14.5, marginTop: 8, lineHeight: 1.5 }}>
            Three ways to shop the same 21 items — one stop at Superstore, one stop at the
            cheapest complete store, or splitting the list across banners for the lowest total.
          </p>
        </div>

        <AccordionCard
          id="superstore"
          open={open === "superstore"}
          onToggle={() => setOpen(open === "superstore" ? null : "superstore")}
          eyebrow="ONE STOP"
          title="Superstore"
          subtitle="All 21 items"
          total={superstore.total}
        >
          <ItemTable items={ITEMS.map((i) => ({ name: i.name, price: i.prices.Superstore }))} />
        </AccordionCard>

        <AccordionCard
          id="cheapest"
          open={open === "cheapest"}
          onToggle={() => setOpen(open === "cheapest" ? null : "cheapest")}
          eyebrow="ONE STOP · CHEAPEST"
          title={cheapestSingle.store}
          subtitle="All 21 items, lowest single-store total"
          total={cheapestSingle.total}
          savings={savingsSingle}
          savingsPct={pctSingle}
        >
          <ItemTable
            items={ITEMS.map((i) => ({ name: i.name, price: i.prices[cheapestSingle.store] }))}
          />
        </AccordionCard>

        <AccordionCard
          id="mix"
          open={open === "mix"}
          onToggle={() => setOpen(open === "mix" ? null : "mix")}
          eyebrow={`MIX & MATCH · ${mix.storeCount} STOPS`}
          title="Cheapest per item"
          subtitle={`Split across ${mix.storeCount} stores`}
          total={mix.total}
          savings={savingsMix}
          savingsPct={pctMix}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {mix.groups.map((g) => (
              <div key={g.store}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <MapPin size={13} color="#E8B94A" />
                    <span style={{ fontWeight: 600, fontSize: 15, color: "#F7F4EC" }}>
                      {g.store}
                    </span>
                    <span style={{ fontSize: 12.5, color: "#8AA090" }}>
                      · {g.rows.length} item{g.rows.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <span className="num" style={{ fontSize: 14.5, color: "#D8CE9E" }}>
                    {fmt(g.subtotal)}
                  </span>
                </div>
                <ItemTable items={g.rows} dim />
              </div>
            ))}
          </div>
        </AccordionCard>

        <p style={{ fontSize: 12.5, color: "#7C9082", marginTop: 20, lineHeight: 1.5 }}>
          Mix &amp; match means {mix.storeCount} separate stops. Weigh the {fmt(savingsMix)} saved
          against the extra driving before committing to the full split.
        </p>
      </div>
    </div>
  );
}

function AccordionCard({ open, onToggle, eyebrow, title, subtitle, total, savings, savingsPct, children }) {
  return (
    <div style={{ borderTop: "1px solid #3A4A3E", paddingTop: 16, paddingBottom: 16 }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          textAlign: "left",
          color: "inherit",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, letterSpacing: 0.4, color: "#7C9082", marginBottom: 3 }}>
            {eyebrow}
          </div>
          <div
            style={{
              fontFamily: "'Fraunces', serif",
              fontWeight: 600,
              fontSize: 20,
              color: "#F7F4EC",
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 13, color: "#9FB3A4", marginTop: 2 }}>{subtitle}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          <div style={{ textAlign: "right" }}>
            <div className="num" style={{ fontSize: 19, fontWeight: 600, color: "#F7F4EC" }}>
              {fmt(total)}
            </div>
            {savings != null && savings > 0 && (
              <div
                style={{
                  fontSize: 11.5,
                  color: "#E8B94A",
                  marginTop: 2,
                  transform: "rotate(-1.5deg)",
                  fontWeight: 600,
                }}
              >
                save {fmt(savings)} · {savingsPct}%
              </div>
            )}
          </div>
          <ChevronDown
            size={18}
            color="#9FB3A4"
            className="chev"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </div>
      </button>

      <div className="acc-body" style={{ gridTemplateRows: open ? "1fr" : "0fr", marginTop: open ? 16 : 0 }}>
        <div style={{ minHeight: 0, overflow: "hidden" }}>{children}</div>
      </div>
    </div>
  );
}

function ItemTable({ items, dim }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {items.map((item, idx) => (
        <div
          key={item.name}
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            padding: "6px 0",
            borderBottom: idx < items.length - 1 ? "1px dashed #33422F" : "none",
          }}
        >
          <span style={{ fontSize: 14, color: dim ? "#B7C6BA" : "#DCE5D9" }}>{item.name}</span>
          <span
            className="num"
            style={{
              fontSize: 14,
              color: item.price == null ? "#5F7466" : dim ? "#C7BE93" : "#E8B94A",
              flexShrink: 0,
            }}
          >
            {item.price == null ? "not carried" : fmt(item.price)}
          </span>
        </div>
      ))}
    </div>
  );
}
