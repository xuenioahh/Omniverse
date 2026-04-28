import { useEffect, useState } from "react";
import { Activity, Mic, Presentation, RefreshCw, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem("adminDashboardKey") || "");

  const canAccessDashboard = Boolean(isAdmin);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/admin-track", {
        headers: adminKey
          ? {
              "x-admin-key": adminKey,
            }
          : undefined,
      });
      if (!response.ok) {
        throw new Error(`Admin request failed with ${response.status}`);
      }
      setData(await response.json());
    } catch (loadError) {
      console.error("Failed to load admin dashboard:", loadError);
      setError(loadError?.message || "Failed to load admin dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canAccessDashboard) {
      void loadDashboard();
    } else {
      setLoading(false);
    }
  }, [canAccessDashboard]);

  const handleSaveAdminKey = () => {
    sessionStorage.setItem("adminDashboardKey", adminKey);
    void loadDashboard();
  };

  if (!canAccessDashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass rounded-3xl p-6 w-full max-w-md space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 flex items-center justify-center">
              <Shield className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Admin Access Required</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Current user: {user?.email || "unknown"}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            This page is only available to emails listed in `VITE_ADMIN_EMAILS`.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const users = data?.users || [];
  const events = data?.events || [];
  const voiceSessions = data?.voiceSessions || [];
  const presentationSessions = data?.presentationSessions || [];
  const provider = data?.provider || "unknown";

  return (
    <div className="min-h-screen pb-12">
      <div className="px-5 pt-6 pb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-space text-foreground">Admin Dashboard</h1>
            <p className="text-xs text-muted-foreground">Registrations, behavior events, and saved sessions</p>
          </div>
        </div>
        <Button onClick={() => void loadDashboard()} variant="outline" className="rounded-2xl border-white/10">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="px-4 space-y-4">
        {error && (
          <div className="glass rounded-2xl p-4">
            <p className="text-sm text-accent">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Users} label="Registered Users" value={users.length} />
          <StatCard icon={Activity} label="Tracked Events" value={events.length} />
          <StatCard icon={Mic} label="Voice Sessions" value={voiceSessions.length} />
          <StatCard icon={Presentation} label="Presentation Sessions" value={presentationSessions.length} />
        </div>

        <div className="glass rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-foreground">Storage Provider</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Current backend storage: <span className="text-foreground font-medium">{provider}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            `supabase` means server-side Postgres sync is active. `local-json` means this app is using the local file fallback.
          </p>
        </div>

        <div className="glass rounded-2xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Admin API Key</h2>
          <p className="text-sm text-muted-foreground">
            If `ADMIN_DASHBOARD_KEY` is set on the server, enter the same value here to unlock `/api/admin-track`.
          </p>
          <div className="flex gap-3">
            <Input
              type="password"
              value={adminKey}
              onChange={(event) => setAdminKey(event.target.value)}
              className="h-11 rounded-2xl bg-white/5 border-white/10"
              placeholder="Optional admin dashboard key"
            />
            <Button onClick={handleSaveAdminKey} className="rounded-2xl h-11 bg-gradient-to-r from-violet-500 to-indigo-600">
              Save
            </Button>
          </div>
        </div>

        <div className="glass rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">Users</h2>
          <div className="space-y-2">
            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground">No synced users yet.</p>
            ) : (
              users.map((user) => (
                <div key={user.id} className="glass rounded-xl p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{user.full_name || "Unnamed user"}</p>
                      <p className="text-xs text-muted-foreground mt-1">{user.email || "-"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Last seen</p>
                      <p className="text-xs text-foreground mt-1">{formatDate(user.last_seen_at)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">Recent Events</h2>
          <div className="space-y-2">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events recorded yet.</p>
            ) : (
              events.slice(0, 50).map((event) => (
                <div key={event.id} className="glass rounded-xl p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{event.type}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {event.user_email || event.user_id || "Unknown user"}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDate(event.timestamp)}</p>
                  </div>
                  {event.payload && Object.keys(event.payload).length > 0 && (
                    <pre className="mt-3 overflow-auto rounded-xl bg-black/20 p-3 text-[11px] text-muted-foreground">
{JSON.stringify(event.payload, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-white/8 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
    </div>
  );
}
