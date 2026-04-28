import { appendAdminEvent, listAdminData } from "./_adminStore.js";

function hasValidAdminKey(req) {
  const expected = process.env.ADMIN_DASHBOARD_KEY;
  if (!expected) return true;
  const received = req.headers["x-admin-key"];
  return typeof received === "string" && received === expected;
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    if (!hasValidAdminKey(req)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const db = await listAdminData();
    res.status(200).json(db);
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const payload = req.body || {};
    const result = await appendAdminEvent(payload);
    res.status(200).json({ ok: true, ...result });
  } catch (error) {
    console.error("admin-track error:", error);
    res.status(500).json({ error: error?.message || "Failed to record admin event" });
  }
}
