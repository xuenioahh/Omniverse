const ACCOUNTS_KEY = "omniverse_accounts";
const CURRENT_USER_KEY = "omniverse_current_user_id";
const VOICE_SESSIONS_KEY = "omniverse_voice_sessions";
const PRESENTATION_SESSIONS_KEY = "omniverse_presentation_sessions";
const ACTIVITY_RECORDS_KEY = "omniverse_activity_records";

/**
 * @typedef {Error & { code?: string }} LocalStoreError
 */

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readJson(key, fallback) {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function readText(key, fallback = "") {
  if (!canUseStorage()) return fallback;
  return window.localStorage.getItem(key) || fallback;
}

function writeText(key, value) {
  if (!canUseStorage()) return;
  if (!value) {
    window.localStorage.removeItem(key);
    return;
  }
  window.localStorage.setItem(key, value);
}

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function getConfiguredAdminEmails() {
  const raw = import.meta.env.VITE_ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((item) => sanitizeEmail(item))
    .filter(Boolean);
}

function resolveRole(email, fallbackRole = "learner") {
  const normalizedEmail = sanitizeEmail(email);
  return getConfiguredAdminEmails().includes(normalizedEmail) ? "admin" : fallbackRole;
}

function getAccounts() {
  const accounts = readJson(ACCOUNTS_KEY, []);
  return Array.isArray(accounts) ? accounts.filter(Boolean) : [];
}

function setAccounts(accounts) {
  writeJson(ACCOUNTS_KEY, accounts);
}

function toPublicUser(account) {
  if (!account) return null;
  const { password, ...safeUser } = account;
  return safeUser;
}

function getCurrentUserId() {
  return readText(CURRENT_USER_KEY, "");
}

function getCurrentAccount() {
  const currentUserId = getCurrentUserId();
  if (!currentUserId) return null;
  return getAccounts().find((account) => account.id === currentUserId) || null;
}

function requireCurrentAccount() {
  const account = getCurrentAccount();
  if (!account) {
    /** @type {LocalStoreError} */
    const error = new Error("Authentication required");
    error.code = "auth_required";
    throw error;
  }
  return account;
}

function registerUser({ full_name, email, password }) {
  const normalizedEmail = sanitizeEmail(email);
  const trimmedName = String(full_name || "").trim();
  const trimmedPassword = String(password || "").trim();

  if (!trimmedName || !normalizedEmail || !trimmedPassword) {
    throw new Error("Name, email, and password are required");
  }

  const accounts = getAccounts();
  if (accounts.some((account) => account.email === normalizedEmail)) {
    /** @type {LocalStoreError} */
    const error = new Error("This email is already registered");
    error.code = "email_exists";
    throw error;
  }

  // This app is intentionally local-first for coursework review, so account data
  // is stored in browser storage instead of a hosted auth backend.
  const nextAccount = {
    id: createId("user"),
    full_name: trimmedName,
    email: normalizedEmail,
    password: trimmedPassword,
    role: resolveRole(normalizedEmail),
    avatar_url: "",
    created_date: new Date().toISOString(),
  };

  accounts.unshift(nextAccount);
  setAccounts(accounts);
  writeText(CURRENT_USER_KEY, nextAccount.id);
  return toPublicUser(nextAccount);
}

function loginUser({ email, password }) {
  const normalizedEmail = sanitizeEmail(email);
  const trimmedPassword = String(password || "").trim();
  const account = getAccounts().find(
    (entry) => entry.email === normalizedEmail && entry.password === trimmedPassword
  );

  if (!account) {
    /** @type {LocalStoreError} */
    const error = new Error("Incorrect email or password");
    error.code = "invalid_credentials";
    throw error;
  }

  if (account.role !== resolveRole(account.email, account.role)) {
    const accounts = getAccounts();
    const index = accounts.findIndex((entry) => entry.id === account.id);
    const nextAccount = {
      ...account,
      role: resolveRole(account.email, account.role),
    };
    accounts[index] = nextAccount;
    setAccounts(accounts);
    writeText(CURRENT_USER_KEY, nextAccount.id);
    return toPublicUser(nextAccount);
  }

  writeText(CURRENT_USER_KEY, account.id);
  return toPublicUser(account);
}

function logoutUser() {
  writeText(CURRENT_USER_KEY, "");
}

function updateCurrentUser(patch) {
  const current = requireCurrentAccount();
  const accounts = getAccounts();
  const index = accounts.findIndex((entry) => entry.id === current.id);
  const nextEmail = patch.email ? sanitizeEmail(patch.email) : current.email;

  if (
    nextEmail !== current.email &&
    accounts.some((entry) => entry.email === nextEmail && entry.id !== current.id)
  ) {
    /** @type {LocalStoreError} */
    const error = new Error("This email is already registered");
    error.code = "email_exists";
    throw error;
  }

  const nextAccount = {
    ...current,
    ...patch,
    email: nextEmail,
    role: resolveRole(nextEmail, patch.role || current.role || "learner"),
  };
  accounts[index] = nextAccount;
  setAccounts(accounts);
  return toPublicUser(nextAccount);
}

function getCurrentUser() {
  return toPublicUser(requireCurrentAccount());
}

function getCurrentUserOrNull() {
  return toPublicUser(getCurrentAccount());
}

function getCollection(key) {
  const items = readJson(key, []);
  return Array.isArray(items) ? items.filter((item) => item && typeof item === "object") : [];
}

function setCollection(key, items) {
  writeJson(key, items);
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

function listItems(key, sort, limit) {
  const current = requireCurrentAccount();
  const items = getCollection(key).filter((item) => item.user_id === current.id);
  const sorted = sortByField(items, sort);
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

function createItem(key, payload, prefix) {
  const current = requireCurrentAccount();
  const items = getCollection(key);
  const created = {
    id: createId(prefix),
    created_date: new Date().toISOString(),
    user_id: current.id,
    ...payload,
  };
  items.unshift(created);
  setCollection(key, items);
  return created;
}

function deleteItem(key, id) {
  const current = requireCurrentAccount();
  const items = getCollection(key).filter(
    (item) => !(item.id === id && item.user_id === current.id)
  );
  setCollection(key, items);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export const localStore = {
  auth: {
    currentUser: getCurrentUser,
    currentUserOrNull: getCurrentUserOrNull,
    register: registerUser,
    login: loginUser,
    logout: logoutUser,
    updateCurrentUser,
  },
  voiceSessions: {
    list(sort = "-created_date", limit = 50) {
      return listItems(VOICE_SESSIONS_KEY, sort, limit);
    },
    create(payload) {
      return createItem(VOICE_SESSIONS_KEY, payload, "voice");
    },
    delete(id) {
      return deleteItem(VOICE_SESSIONS_KEY, id);
    },
  },
  presentationSessions: {
    list(sort = "-created_date", limit = 50) {
      return listItems(PRESENTATION_SESSIONS_KEY, sort, limit);
    },
    create(payload) {
      return createItem(PRESENTATION_SESSIONS_KEY, payload, "presentation");
    },
    delete(id) {
      return deleteItem(PRESENTATION_SESSIONS_KEY, id);
    },
  },
  activityRecords: {
    list(sort = "-created_date", limit = 200) {
      return listItems(ACTIVITY_RECORDS_KEY, sort, limit);
    },
    create(payload) {
      return createItem(ACTIVITY_RECORDS_KEY, payload, "activity");
    },
    delete(id) {
      return deleteItem(ACTIVITY_RECORDS_KEY, id);
    },
  },
  async fileToDataUrl(file) {
    return fileToDataUrl(file);
  },
};
