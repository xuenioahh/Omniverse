import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Edit2, LogOut, Camera, CheckCircle, Loader2, Mic, Presentation, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { localApi } from "@/api/localClient";
import BottomNav from "@/components/BottomNav";
import { buildProfileInsights } from "@/lib/profileInsights";
import { subscribeActivitySync } from "@/lib/activitySync";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Profile() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [voiceSessions, setVoiceSessions] = useState([]);
  const [presentationSessions, setPresentationSessions] = useState([]);
  const [activityRecords, setActivityRecords] = useState([]);
  const fileInputRef = useRef(null);
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (location.pathname === "/profile") {
      loadData();
    }
  }, [location.pathname]);

  useEffect(() => {
    return subscribeActivitySync(() => {
      loadData();
    });
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const u = await localApi.auth.me();
      setUser(u);
      setNewName(u?.full_name || "");
      setAvatarUrl(u?.avatar_url || "");

      const [vs, ps, activities] = await Promise.all([
        localApi.entities.VoiceSession.list("-created_date", 50),
        localApi.entities.PresentationSession.list("-created_date", 50),
        localApi.entities.ActivityRecord.list("-created_date", 200),
      ]);
      setVoiceSessions(vs || []);
      setPresentationSessions(ps || []);
      setActivityRecords(activities || []);
    } catch (err) {
      console.error("Profile load failed:", err);
      setError(err?.message || "Profile could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  const getWeeklyStats = () => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);

    const allSessions = [...(voiceSessions || []), ...(presentationSessions || [])].filter(Boolean);
    const weekCount = allSessions.filter(s => {
      const d = new Date(s.created_date);
      return d >= monday;
    }).length;

    const dayActivity = DAYS.map((_, idx) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + idx);
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);
      return allSessions.some(s => {
        const d = new Date(s.created_date);
        return d >= day && d < nextDay;
      });
    });

    return { weekCount, dayActivity };
  };

  const handleSaveName = async () => {
    setSaving(true);
    await localApi.auth.updateMe({ full_name: newName });
    setSaved(true);
    setSaving(false);
    setEditing(false);
    setUser(prev => ({ ...prev, full_name: newName }));
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await localApi.integrations.Core.UploadFile({ file });
    await localApi.auth.updateMe({ avatar_url: file_url });
    setAvatarUrl(file_url);
  };

  const { weekCount, dayActivity } = getWeeklyStats();
  const totalSessions = (voiceSessions?.length || 0) + (presentationSessions?.length || 0);
  const insights = buildProfileInsights({
    voiceSessions: Array.isArray(voiceSessions) ? voiceSessions : [],
    presentationSessions: Array.isArray(presentationSessions) ? presentationSessions : [],
    activityRecords: Array.isArray(activityRecords) ? activityRecords : [],
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-xl font-bold font-space text-foreground">Profile</h1>
      </div>

      <div className="px-4 space-y-4">
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-4">
            <p className="text-sm text-accent">{error}</p>
          </motion.div>
        )}

        {/* User Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div
                className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-white">
                    {user?.full_name?.[0]?.toUpperCase() || "?"}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
              >
                <Camera className="w-2.5 h-2.5 text-white" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="h-8 text-sm bg-white/5 border-white/10 rounded-xl"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleSaveName} disabled={saving} className="rounded-xl h-8 px-3">
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-foreground truncate">
                    {user?.full_name || "User"}
                  </h2>
                  {saved && <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0" />}
                  <button onClick={() => setEditing(true)} className="flex-shrink-0">
                    <Edit2 className="w-3.5 h-3.5 text-muted-foreground hover:text-primary transition-colors" />
                  </button>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{user?.email}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5 capitalize">
                {user?.role || "user"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-3 gap-3">
          <StatCard value={weekCount} label="This Week" />
          <StatCard value={voiceSessions.length} label="Speaking" icon={Mic} />
          <StatCard value={presentationSessions.length} label="Presents" icon={Presentation} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }} className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">User Portrait</h3>
              <p className="text-xs text-muted-foreground mt-1">{insights.profileTone}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-primary">{insights.recentAverage}</p>
              <p className="text-[10px] text-muted-foreground">recent avg</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <PortraitMetric label="Strongest" value={insights.strongestMetric} />
            <PortraitMetric label="Focus area" value={insights.weakestMetric} />
            <PortraitMetric label="Top scenario" value={insights.frequentScenario} />
            <PortraitMetric label="Main mode" value={insights.focusMode} />
          </div>
        </motion.div>

        {/* Weekly Practice */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">📊 Weekly Practice</h3>
            <span className="text-xs text-muted-foreground">{weekCount} sessions</span>
          </div>
          <div className="flex items-end justify-between gap-1">
            {DAYS.map((day, i) => (
              <div key={day} className="flex flex-col items-center gap-1.5 flex-1">
                <div className={`w-full rounded-lg transition-all ${
                  dayActivity[i]
                    ? "bg-gradient-to-t from-violet-600 to-indigo-500"
                    : "bg-white/5"
                }`} style={{ height: dayActivity[i] ? "28px" : "12px" }} />
                <span className="text-[9px] text-muted-foreground">{day}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="glass rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-foreground">Learning Snapshot</h3>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <StatMini label="Total" value={totalSessions} />
            <StatMini label="Activities" value={insights.totalActivities} />
            <StatMini label="Avg words" value={insights.averageWords} />
            <StatMini label="Avg mins" value={insights.averageDurationMinutes} />
          </div>
          {totalSessions === 0 && (
            <p className="text-xs text-muted-foreground mt-3">
              No saved sessions yet. Complete one speaking or presentation practice to build your profile.
            </p>
          )}
          {insights.latestActivity !== "Not enough data" && (
            <p className="text-xs text-muted-foreground mt-2">
              Latest activity: {insights.latestActivity}
            </p>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="glass rounded-2xl p-4 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Strengths</h3>
            <div className="space-y-2 mt-3">
              {insights.strengths.map((item) => (
                <div key={item} className="glass rounded-xl px-3 py-2">
                  <p className="text-xs text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Next Focus</h3>
            <div className="space-y-2 mt-3">
              {insights.focusAreas.map((item) => (
                <div key={item} className="glass rounded-xl px-3 py-2">
                  <p className="text-xs text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.145 }}>
          <Link
            to="/admin"
            className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl border border-emerald-400/20 text-emerald-300 hover:bg-emerald-500/8 transition-colors"
          >
            <Shield className="w-4 h-4" />
            Open Admin Dashboard
          </Link>
        </motion.div>

        {/* Sign Out */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Button
            onClick={() => localApi.auth.logout("/")}
            variant="outline"
            className="w-full h-12 rounded-2xl border-accent/30 text-accent hover:bg-accent/10 hover:border-accent/50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
}

/**
 * @param {{ label: string, value: string | number }} props
 */
function PortraitMetric({ label, value }) {
  return (
    <div className="glass rounded-xl px-3 py-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground mt-1">{value}</p>
    </div>
  );
}

/**
 * @param {{ value: string | number, label: string, icon?: any }} props
 */
function StatCard({ value, label, icon: Icon = null }) {
  return (
    <div className="glass rounded-2xl px-3 py-3 text-center">
      <div className="flex items-center justify-center gap-1.5">
        {Icon ? <Icon className="w-3.5 h-3.5 text-primary" /> : null}
        <p className="text-xl font-bold text-foreground">{value}</p>
      </div>
      <p className="text-[11px] text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

/**
 * @param {{ label: string, value: string | number }} props
 */
function StatMini({ label, value }) {
  return (
    <div className="glass rounded-xl px-3 py-2 text-center">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
