import { mutateAppStore, readAppStore } from "./_appStore.js";

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function getConfiguredAdminEmails() {
  const raw = process.env.VITE_ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((item) => sanitizeEmail(item))
    .filter(Boolean);
}

function getDbAdminEmails(db) {
  return Array.isArray(db?.settings?.adminEmails)
    ? db.settings.adminEmails.map((item) => sanitizeEmail(item)).filter(Boolean)
    : [];
}

function getMergedAdminEmails(db) {
  return [...new Set([...getConfiguredAdminEmails(), ...getDbAdminEmails(db)])];
}

function resolveRole(db, email, fallbackRole = "learner") {
  const normalizedEmail = sanitizeEmail(email);
  return getMergedAdminEmails(db).includes(normalizedEmail) ? "admin" : fallbackRole;
}

function toPublicUser(account) {
  if (!account) return null;
  const { password, ...safeUser } = account;
  return safeUser;
}

function sortByField(items, sort) {
  if (!sort) return items;
  const desc = sort.startsWith("-");
  const field = desc ? sort.slice(1) : sort;
  return [...items].sort((a, b) => {
    const left = new Date(a[field] || 0).getTime() || a[field] || 0;
    const right = new Date(b[field] || 0).getTime() || b[field] || 0;
    if (left === right) return 0;
    return desc ? (left < right ? 1 : -1) : left < right ? -1 : 1;
  });
}

function requireUser(db, req) {
  const userId = req.headers["x-user-id"];
  const account = db.users.find((entry) => entry.id === userId) || null;
  if (!account) {
    const error = new Error("Authentication required");
    error.code = "auth_required";
    throw error;
  }
  return account;
}

function requireAdmin(db, req) {
  const account = requireUser(db, req);
  const resolvedRole = resolveRole(db, account.email, account.role);
  if (resolvedRole !== "admin") {
    const error = new Error("Admin access required");
    error.code = "admin_required";
    throw error;
  }
  return account;
}

function getCollectionKey(entity) {
  const mapping = {
    VoiceSession: "voiceSessions",
    PresentationSession: "presentationSessions",
    ActivityRecord: "activityRecords",
  };
  return mapping[entity] || null;
}

function normalizeEntityData(entity, data = {}) {
  if (entity !== "ActivityRecord") {
    return data;
  }

  const {
    activity_type = "",
    created_date,
    user_id,
    ...payload
  } = data || {};

  return {
    activity_type,
    ...(payload && Object.keys(payload).length ? { payload } : {}),
  };
}

async function register(_req, payload) {
  const normalizedEmail = sanitizeEmail(payload?.email);
  const trimmedName = String(payload?.full_name || "").trim();
  const trimmedPassword = String(payload?.password || "").trim();

  if (!trimmedName || !normalizedEmail || !trimmedPassword) {
    throw new Error("Name, email, and password are required");
  }

  let createdUser = null;

  await mutateAppStore((db) => {
    if (db.users.some((account) => account.email === normalizedEmail)) {
      const error = new Error("This email is already registered");
      error.code = "email_exists";
      throw error;
    }

    const account = {
      id: createId("user"),
      full_name: trimmedName,
      email: normalizedEmail,
      password: trimmedPassword,
      role: resolveRole(db, normalizedEmail),
      avatar_url: "",
      created_date: new Date().toISOString(),
    };

    db.users.unshift(account);
    createdUser = toPublicUser(account);
    return db;
  });

  return createdUser;
}

async function login(_req, payload) {
  const normalizedEmail = sanitizeEmail(payload?.email);
  const trimmedPassword = String(payload?.password || "").trim();
  let loggedIn = null;

  await mutateAppStore((db) => {
    const account = db.users.find(
      (entry) => entry.email === normalizedEmail && entry.password === trimmedPassword
    );

    if (!account) {
      const error = new Error("Incorrect email or password");
      error.code = "invalid_credentials";
      throw error;
    }

    account.role = resolveRole(db, account.email, account.role);
    loggedIn = toPublicUser(account);
    return db;
  });

  return loggedIn;
}

async function me(req) {
  let currentUser = null;
  await mutateAppStore((db) => {
    const account = requireUser(db, req);
    const resolvedRole = resolveRole(db, account.email, account.role);
    if (account.role !== resolvedRole) {
      account.role = resolvedRole;
    }
    currentUser = toPublicUser(account);
    return db;
  });
  return currentUser;
}

async function updateMe(req, payload) {
  const db = await readAppStore();
  const current = requireUser(db, req);
  const nextEmail = payload?.email ? sanitizeEmail(payload.email) : current.email;

  let updated = null;

  await mutateAppStore((nextDb) => {
    if (
      nextEmail !== current.email &&
      nextDb.users.some((entry) => entry.email === nextEmail && entry.id !== current.id)
    ) {
      const error = new Error("This email is already registered");
      error.code = "email_exists";
      throw error;
    }

    const index = nextDb.users.findIndex((entry) => entry.id === current.id);
    nextDb.users[index] = {
      ...nextDb.users[index],
      ...payload,
      email: nextEmail,
      role: resolveRole(nextDb, nextEmail, payload?.role || nextDb.users[index].role || "learner"),
    };
    updated = toPublicUser(nextDb.users[index]);
    return nextDb;
  });

  return updated;
}

async function listEntity(req, payload) {
  const db = await readAppStore();
  const current = requireUser(db, req);
  const collectionKey = getCollectionKey(payload?.entity);
  if (!collectionKey) throw new Error("Unknown entity");

  const items = db[collectionKey].filter((item) => item.user_id === current.id);
  const sorted = sortByField(items, payload?.sort || "-created_date");
  return typeof payload?.limit === "number" ? sorted.slice(0, payload.limit) : sorted;
}

async function createEntity(req, payload) {
  const db = await readAppStore();
  const current = requireUser(db, req);
  const collectionKey = getCollectionKey(payload?.entity);
  if (!collectionKey) throw new Error("Unknown entity");

  let created = null;

  await mutateAppStore((nextDb) => {
    created = {
      id: createId(payload?.prefix || "item"),
      created_date: new Date().toISOString(),
      user_id: current.id,
      ...normalizeEntityData(payload?.entity, payload?.data || {}),
    };
    nextDb[collectionKey].unshift(created);
    return nextDb;
  });

  return created;
}

async function deleteEntity(req, payload) {
  const db = await readAppStore();
  const current = requireUser(db, req);
  const collectionKey = getCollectionKey(payload?.entity);
  if (!collectionKey) throw new Error("Unknown entity");

  await mutateAppStore((nextDb) => {
    nextDb[collectionKey] = nextDb[collectionKey].filter(
      (item) => !(item.id === payload?.id && item.user_id === current.id)
    );
    return nextDb;
  });

  return { ok: true };
}

async function listAdminSettings(req) {
  const db = await readAppStore();
  requireAdmin(db, req);
  return {
    envAdminEmails: getConfiguredAdminEmails(),
    savedAdminEmails: getDbAdminEmails(db),
    adminEmails: getMergedAdminEmails(db),
  };
}

async function addAdminEmail(req, payload) {
  const normalizedEmail = sanitizeEmail(payload?.email);
  if (!normalizedEmail) {
    throw new Error("Admin email is required");
  }

  let result = null;
  await mutateAppStore((db) => {
    requireAdmin(db, req);
    const current = getDbAdminEmails(db);
    if (!current.includes(normalizedEmail)) {
      db.settings.adminEmails = [...current, normalizedEmail];
    }

    db.users = db.users.map((user) =>
      user.email === normalizedEmail
        ? { ...user, role: "admin" }
        : user
    );

    result = {
      envAdminEmails: getConfiguredAdminEmails(),
      savedAdminEmails: getDbAdminEmails(db),
      adminEmails: getMergedAdminEmails(db),
    };
    return db;
  });

  return result;
}

async function removeAdminEmail(req, payload) {
  const normalizedEmail = sanitizeEmail(payload?.email);
  if (!normalizedEmail) {
    throw new Error("Admin email is required");
  }

  let result = null;
  await mutateAppStore((db) => {
    requireAdmin(db, req);
    db.settings.adminEmails = getDbAdminEmails(db).filter((email) => email !== normalizedEmail);
    db.users = db.users.map((user) =>
      user.email === normalizedEmail
        ? { ...user, role: resolveRole(db, user.email, "learner") }
        : user
    );

    result = {
      envAdminEmails: getConfiguredAdminEmails(),
      savedAdminEmails: getDbAdminEmails(db),
      adminEmails: getMergedAdminEmails(db),
    };
    return db;
  });

  return result;
}

const ACTIONS = {
  register,
  login,
  me,
  updateMe,
  listEntity,
  createEntity,
  deleteEntity,
  listAdminSettings,
  addAdminEmail,
  removeAdminEmail,
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const payload = req.body || {};
    const action = ACTIONS[payload.action];

    if (!action) {
      res.status(400).json({ error: "Unknown action" });
      return;
    }

    const data = await action(req, payload);
    res.status(200).json({ ok: true, data });
  } catch (error) {
    const status = error?.code === "auth_required"
      ? 401
      : error?.code === "admin_required"
        ? 403
        : 400;
    res.status(status).json({
      error: error?.message || "Request failed",
      code: error?.code || "request_failed",
    });
  }
}
