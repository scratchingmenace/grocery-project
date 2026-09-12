import { getStore } from "@netlify/blobs";

// A single shared JSON blob holding the app's whole live state:
// { selections, session, lastTrip, justFinished, updatedAt }.
// There's one grocery list and (in practice) one shopper, so one key is
// enough — no per-user auth, no accounts, nothing to configure.
const STORE_NAME = "grocery-app";
const KEY = "state";

export default async (req) => {
  const store = getStore({ name: STORE_NAME, consistency: "strong" });

  if (req.method === "GET") {
    const data = await store.get(KEY, { type: "json" });
    return new Response(JSON.stringify(data || null), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const payload = Object.assign({}, body, { updatedAt: Date.now() });
    await store.setJSON(KEY, payload);
    return new Response(JSON.stringify(payload), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "DELETE") {
    await store.delete(KEY);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config = {
  path: "/api/state",
};
