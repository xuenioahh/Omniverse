import { appendAdminEvent, deleteAdminRecord, listAdminData } from "./_adminStore.js";
import { readAppStore } from "./_appStore.js";

function sanitizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function hasValidAdminKey(req) {
  const expected = process.env.ADMIN_DASHBOARD_KEY;
  if (!expected) return true;
  const received = req.headers["x-admin-key"];
  return typeof received === "string" && received === expected;
}

async function hasAdminUserAccess(req) {
  const userId = req.headers["x-user-id"];
  if (!userId) return false;

  const db = await readAppStore();
  const user = db.users.find((entry) => entry.id === userId);
  if (!user) return false;

  const envAdmins = String(process.env.VITE_ADMIN_EMAILS || "")
    .split(",")
    .map((item) => sanitizeEmail(item))
    .filter(Boolean);
  const savedAdmins = Array.isArray(db.settings?.adminEmails)
    ? db.settings.adminEmails.map((item) => sanitizeEmail(item)).filter(Boolean)
    : [];
  const adminSet = new Set([...envAdmins, ...savedAdmins]);

  return user.role === "admin" || adminSet.has(sanitizeEmail(user.email));
}

async function isAuthorizedAdminRequest(req) {
  if (hasValidAdminKey(req)) {
    return true;
  }
  return hasAdminUserAccess(req);
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    if (!(await isAuthorizedAdminRequest(req))) {
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
    if (payload.action === "delete_record") {
      if (!(await isAuthorizedAdminRequest(req))) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const result = await deleteAdminRecord(payload);
      res.status(200).json({ ok: true, ...result });
      return;
    }
    const result = await appendAdminEvent(payload);
    res.status(200).json({ ok: true, ...result });
  } catch (error) {
    console.error("admin-track error:", error);
    res.status(500).json({ error: error?.message || "Failed to record admin event" });
  }
}
