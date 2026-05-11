import { mutateAppDb, readAppDb } from "./_appDb.js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FORCE_LOCAL_DATA = /^(1|true|yes)$/i.test(String(process.env.FORCE_LOCAL_DATA || ""));

const TABLES = {
  users: "app_users",
  voiceSessions: "app_voice_sessions",
  presentationSessions: "app_presentation_sessions",
  activityRecords: "app_activity_records",
  settings: "app_settings",
};

function isMissingTableError(error, table) {
  const message = String(error?.message || "");
  return message.includes("PGRST205") && message.includes(`public.${table}`);
}

function shouldFallbackToLocal(error) {
  const message = String(error?.message || error || "");
  return (
    message.startsWith("Supabase ") ||
    message.includes("fetch failed") ||
    message.includes("ECONNREFUSED") ||
    message.includes("ENOTFOUND") ||
    message.includes("network")
  );
}

function hasSupabase() {
  return !FORCE_LOCAL_DATA && Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

async function supabaseRequest(table, { method = "GET", query = "", body, prefer } = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query ? `?${query}` : ""}`;
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: prefer || (method === "GET" ? "count=exact" : "return=representation"),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase ${method} ${table} failed: ${response.status} ${text}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function toLocalShape(db = {}) {
  return {
    users: Array.isArray(db.users) ? db.users : [],
    voiceSessions: Array.isArray(db.voiceSessions) ? db.voiceSessions : [],
    presentationSessions: Array.isArray(db.presentationSessions) ? db.presentationSessions : [],
    activityRecords: Array.isArray(db.activityRecords) ? db.activityRecords : [],
    settings: {
      adminEmails: Array.isArray(db.settings?.adminEmails) ? db.settings.adminEmails : [],
    },
  };
}

async function readSupabaseSettings() {
  try {
    const rows = await supabaseRequest(TABLES.settings, {
      query: "select=key,value&key=eq.adminEmails",
    });
    return Array.isArray(rows) && rows[0]?.value
      ? { adminEmails: Array.isArray(rows[0].value) ? rows[0].value : [] }
      : { adminEmails: [] };
  } catch (error) {
    if (isMissingTableError(error, TABLES.settings)) {
      console.warn(
        `Supabase table public.${TABLES.settings} is missing; falling back to empty app settings.`
      );
      return { adminEmails: [] };
    }
    throw error;
  }
}

async function writeSupabaseSettings(settings) {
  try {
    await supabaseRequest(TABLES.settings, {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=representation",
      body: {
        key: "adminEmails",
        value: Array.isArray(settings?.adminEmails) ? settings.adminEmails : [],
      },
    });
  } catch (error) {
    if (isMissingTableError(error, TABLES.settings)) {
      console.warn(
        `Supabase table public.${TABLES.settings} is missing; skipping app settings write.`
      );
      return;
    }
    throw error;
  }
}

export async function readAppStore() {
  if (!hasSupabase()) {
    return toLocalShape(await readAppDb());
  }

  try {
    const [users, voiceSessions, presentationSessions, activityRecords, settings] = await Promise.all([
      supabaseRequest(TABLES.users, { query: "select=*&order=created_date.desc" }),
      supabaseRequest(TABLES.voiceSessions, { query: "select=*&order=created_date.desc" }),
      supabaseRequest(TABLES.presentationSessions, { query: "select=*&order=created_date.desc" }),
      supabaseRequest(TABLES.activityRecords, { query: "select=*&order=created_date.desc" }),
      readSupabaseSettings(),
    ]);

    return toLocalShape({
      users,
      voiceSessions,
      presentationSessions,
      activityRecords,
      settings,
    });
  } catch (error) {
    if (shouldFallbackToLocal(error)) {
      console.warn("Supabase app store unavailable; falling back to local JSON.", error);
      return toLocalShape(await readAppDb());
    }
    throw error;
  }
}

export async function mutateAppStore(mutator) {
  if (!hasSupabase()) {
    const db = await readAppDb();
    const nextDb = (await mutator(toLocalShape(db))) || db;
    await mutateAppDb(() => nextDb);
    return toLocalShape(nextDb);
  }

  try {
    const current = await readAppStore();
    const next = (await mutator(structuredClone(current))) || current;

    const previousUsers = new Map(current.users.map((entry) => [entry.id, entry]));
    const nextUsers = new Map(next.users.map((entry) => [entry.id, entry]));

    const collections = [
      ["voiceSessions", TABLES.voiceSessions],
      ["presentationSessions", TABLES.presentationSessions],
      ["activityRecords", TABLES.activityRecords],
    ];

    await Promise.all(
      [...nextUsers.values()].map((entry) =>
        supabaseRequest(TABLES.users, {
          method: "POST",
          prefer: "resolution=merge-duplicates,return=representation",
          body: entry,
        })
      )
    );

    await Promise.all(
      [...previousUsers.keys()]
        .filter((id) => !nextUsers.has(id))
        .map((id) =>
          supabaseRequest(TABLES.users, {
            method: "DELETE",
            query: `id=eq.${encodeURIComponent(id)}`,
          })
        )
    );

    for (const [key, table] of collections) {
      const previousMap = new Map(current[key].map((entry) => [entry.id, entry]));
      const nextMap = new Map(next[key].map((entry) => [entry.id, entry]));

      await Promise.all(
        [...nextMap.values()].map((entry) =>
          supabaseRequest(table, {
            method: "POST",
            prefer: "resolution=merge-duplicates,return=representation",
            body: entry,
          })
        )
      );

      await Promise.all(
        [...previousMap.keys()]
          .filter((id) => !nextMap.has(id))
          .map((id) =>
            supabaseRequest(table, {
              method: "DELETE",
              query: `id=eq.${encodeURIComponent(id)}`,
            })
          )
      );
    }

    await writeSupabaseSettings(next.settings);
    return toLocalShape(next);
  } catch (error) {
    if (shouldFallbackToLocal(error)) {
      console.warn("Supabase app store write failed; writing to local JSON instead.", error);
      const db = await readAppDb();
      const nextDb = (await mutator(toLocalShape(db))) || db;
      await mutateAppDb(() => nextDb);
      return toLocalShape(nextDb);
    }
    throw error;
  }
}
