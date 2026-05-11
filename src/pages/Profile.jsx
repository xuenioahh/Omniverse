import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import {
  Edit2,
  LogOut,
  Camera,
  CheckCircle,
  Loader2,
  Mic,
  Presentation,
  Shield,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Sparkles,
  Stars,
  BadgeCheck,
  AudioLines,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { localApi } from "@/api/localClient";
import BottomNav from "@/components/BottomNav";
import { buildProfileInsights } from "@/lib/profileInsights";
import { subscribeActivitySync } from "@/lib/activitySync";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PROFILE_BGM_TRACKS = [
  {
    title: "Valley Sunset",
    fileName: "profile-bgm-127.mp3",
    src: "/profile-bgm-127.mp3",
    mimeType: "audio/mpeg",
  },
  {
    title: "Vastness",
    fileName: "profile-bgm-292.mp3",
    src: "/profile-bgm-292.mp3",
    mimeType: "audio/mpeg",
  },
  {
    title: "Hazy After Hours",
    fileName: "profile-bgm-139.mp3",
    src: "/profile-bgm-139.mp3",
    mimeType: "audio/mpeg",
  },
  {
    title: "Sleepy Cat",
    fileName: "profile-bgm-135.mp3",
    src: "/profile-bgm-135.mp3",
    mimeType: "audio/mpeg",
  },
  {
    title: "Tech House Vibes",
    fileName: "profile-bgm-640.mp3",
    src: "/profile-bgm-640.mp3",
    mimeType: "audio/mpeg",
  },
];

function pickNextTrackIndex(currentIndex, total) {
  if (total <= 1) return 0;
  let nextIndex = Math.floor(Math.random() * total);
  if (nextIndex === currentIndex) {
    nextIndex = (currentIndex + 1 + Math.floor(Math.random() * (total - 1))) % total;
  }
  return nextIndex;
}

export default function Profile() {
  const { isAdmin } = useAuth();
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
  const audioRef = useRef(null);
  const trackIndexRef = useRef(-1);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.35);
  const [musicError, setMusicError] = useState("");
  const [musicReady, setMusicReady] = useState(false);
  const [musicSrc, setMusicSrc] = useState("");
  const [currentTrackTitle, setCurrentTrackTitle] = useState("");

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

  useEffect(() => {
    if (location.pathname === "/profile" && location.state?.deniedAdminFor) {
      toast.error(`Admin access denied for ${location.state.deniedAdminFor}`);
      window.history.replaceState({}, "", "/profile");
    }
  }, [location.pathname, location.state]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = musicVolume;
  }, [musicVolume]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = isMusicMuted;
  }, [isMusicMuted]);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const supportedTracks = PROFILE_BGM_TRACKS.filter((track) => {
      if (typeof audio.canPlayType !== "function") return true;
      return audio.canPlayType(track.mimeType) !== "";
    });

    if (!supportedTracks.length) {
      setMusicSrc("");
      setCurrentTrackTitle("");
      setMusicReady(false);
      setMusicError("Background music is unavailable in this browser.");
      return;
    }

    const assignTrack = (trackIndex) => {
      const safeTrack = supportedTracks[trackIndex];
      if (!safeTrack) return;
      trackIndexRef.current = trackIndex;
      setMusicSrc(safeTrack.src);
      setCurrentTrackTitle(safeTrack.title);
      setMusicReady(false);
      setMusicError("");
      audio.src = safeTrack.src;
      audio.preload = "metadata";
      audio.volume = musicVolume;
      audio.muted = isMusicMuted;
      audio.load();
    };

    assignTrack(pickNextTrackIndex(-1, supportedTracks.length));

    const handlePlay = () => setIsMusicPlaying(true);
    const handlePause = () => setIsMusicPlaying(false);
    const handleCanPlay = () => {
      setMusicReady(true);
      setMusicError("");
    };
    const handleError = () => {
      setMusicReady(false);
      setMusicError("Background music could not be loaded.");
      setIsMusicPlaying(false);
    };
    const handleEnded = async () => {
      const nextIndex = pickNextTrackIndex(trackIndexRef.current, supportedTracks.length);
      assignTrack(nextIndex);
      try {
        await audio.play();
      } catch (error) {
        setMusicError(error?.message || "Playback was blocked.");
        setIsMusicPlaying(false);
      }
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("loadedmetadata", handleCanPlay);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("canplaythrough", handleCanPlay);
    audio.addEventListener("error", handleError);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("loadedmetadata", handleCanPlay);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("canplaythrough", handleCanPlay);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("ended", handleEnded);
      if (audioRef.current === audio) {
        audioRef.current = null;
      }
    };
  }, [isMusicMuted, musicVolume]);

  useEffect(() => {
    if (location.pathname !== "/profile") return;
    const audio = audioRef.current;
    if (!audio || !musicReady) return;

    let cancelled = false;

    const tryAutoplay = async () => {
      try {
        setMusicError("");
        await audio.play();
        if (!cancelled) {
          setIsMusicPlaying(true);
        }
      } catch (error) {
        if (!cancelled) {
          setMusicError("Autoplay was blocked. Press Play to start the music.");
          setIsMusicPlaying(false);
        }
      }
    };

    tryAutoplay();

    return () => {
      cancelled = true;
    };
  }, [location.pathname, musicReady]);

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

  const handleToggleMusic = async () => {
    const audio = audioRef.current;
    if (!audio || !musicSrc) {
      setMusicError("Background music is unavailable right now.");
      return;
    }

    if (isMusicPlaying) {
      audio.pause();
      return;
    }

    try {
      setMusicError("");
      if (audio.readyState === 0) {
        audio.load();
      }
      await audio.play();
      setMusicReady(true);
    } catch (error) {
      setMusicError(error?.message || "Playback was blocked.");
      setIsMusicPlaying(false);
    }
  };

  const handleToggleMute = () => {
    setIsMusicMuted((prev) => !prev);
  };

  const handleVolumeChange = (event) => {
    const nextVolume = Number(event.target.value);
    setMusicVolume(nextVolume);
    if (nextVolume > 0 && isMusicMuted) {
      setIsMusicMuted(false);
    }
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
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.16),transparent_24%),linear-gradient(135deg,rgba(99,102,241,0.22),rgba(15,23,42,0.88))] px-5 py-6"
        >
          <div className="pointer-events-none absolute inset-0 opacity-80">
            <div className="profile-orbit profile-orbit-a" />
            <div className="profile-orbit profile-orbit-b" />
          </div>
          <div className="relative">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-cyan-100/80">
                <Sparkles className="w-3.5 h-3.5" />
                Growth Profile
              </p>
              <h2 className="mt-3 text-[2.05rem] leading-tight font-space font-bold text-white">Your speaking growth, visualized.</h2>
              <p className="mt-2 max-w-[290px] text-[0.95rem] leading-relaxed text-white/72">
                Keep going. Every practice session makes your speaking more confident, more natural, and more ready for the real moment.
              </p>
            </div>
            <div className="mt-7 flex justify-center">
              <div className="profile-character-stage">
                <div className="profile-skill-tag profile-skill-tag-a">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-300" />
                  Clear Accent
                </div>
                <div className="profile-skill-tag profile-skill-tag-b">
                  <Flame className="w-3.5 h-3.5 text-amber-300" />
                  Confident
                </div>
                <div className="profile-skill-tag profile-skill-tag-c">
                  <AudioLines className="w-3.5 h-3.5 text-cyan-300" />
                  Smooth Rhythm
                </div>
                <div className="profile-skill-tag profile-skill-tag-d">
                  <Stars className="w-3.5 h-3.5 text-violet-200" />
                  Natural Tone
                </div>
                <div className="profile-skill-tag profile-skill-tag-e">
                  <Sparkles className="w-3.5 h-3.5 text-rose-200" />
                  Stage Ready
                </div>
                <div className="profile-character-main">
                  <div className="profile-hero-illustration-shell">
                    <img
                      src="/profile-hero-illustration.png"
                      alt="Profile illustration"
                      className="profile-hero-illustration"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] text-white/80">
                <Stars className="w-3.5 h-3.5 text-amber-200" />
                animated speaking persona
              </span>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-4">
            <p className="text-sm text-accent">{error}</p>
          </motion.div>
        )}

        {/* User Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5 overflow-hidden relative">
          <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-cyan-400/10 blur-2xl" />
          <div className="pointer-events-none absolute -left-6 bottom-0 h-24 w-24 rounded-full bg-violet-500/10 blur-2xl" />
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="profile-avatar-aura" />
              <div
                className="relative z-10 w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center cursor-pointer"
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
              <div className="mt-3 flex flex-wrap gap-2">
                <BadgePill label={`${weekCount} this week`} tone="violet" />
                <BadgePill label={`${totalSessions} sessions`} tone="cyan" />
              </div>
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
                } ${dayActivity[i] ? "profile-bar-active" : ""}`} style={{ height: dayActivity[i] ? "28px" : "12px", animationDelay: `${i * 120}ms` }} />
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

        {isAdmin && user?.role === "admin" ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.145 }}>
            <Link
              to="/admin"
              className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl border border-emerald-400/20 text-emerald-300 hover:bg-emerald-500/8 transition-colors"
            >
              <Shield className="w-4 h-4" />
              Open Admin Dashboard
            </Link>
          </motion.div>
        ) : null}

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

      <div className="fixed bottom-24 right-4 z-30 flex flex-col items-end gap-2">
        {(musicError || musicReady) && (
          <div className="glass max-w-[210px] rounded-2xl px-3 py-2 text-right">
            <div className="flex items-center justify-end gap-1.5">
              <span className={`music-dot !h-3 !w-3 rounded-full ${isMusicPlaying ? "music-dot-live" : ""}`} />
              <p className="text-[11px] font-medium text-foreground">BGM</p>
            </div>
            {musicError ? (
              <p className="mt-1 text-[10px] leading-relaxed text-amber-300">{musicError}</p>
            ) : (
              <>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {isMusicPlaying ? "Playing quietly in background." : "Optional background music."}
                </p>
                {currentTrackTitle && (
                  <p className="mt-1 text-[10px] leading-relaxed text-cyan-200/85">
                    Now playing: {currentTrackTitle}
                  </p>
                )}
              </>
            )}
            <div className="mt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleToggleMute}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-foreground transition-colors hover:bg-white/10"
                aria-label={isMusicMuted ? "Unmute music" : "Mute music"}
              >
                {isMusicMuted || musicVolume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={musicVolume}
                onChange={handleVolumeChange}
                className="w-20 accent-amber-500"
                aria-label="Music volume"
              />
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleToggleMusic}
          disabled={!musicSrc}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-slate-900/80 text-white shadow-[0_16px_30px_rgba(15,23,42,0.28)] transition-all hover:scale-[1.03] hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={isMusicPlaying ? "Pause background music" : "Play background music"}
        >
          {isMusicPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>
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
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      className="glass rounded-2xl px-3 py-3 text-center"
    >
      <div className="flex items-center justify-center gap-1.5">
        {Icon ? <Icon className="w-3.5 h-3.5 text-primary" /> : null}
        <p className="text-xl font-bold text-foreground">{value}</p>
      </div>
      <p className="text-[11px] text-muted-foreground mt-1">{label}</p>
    </motion.div>
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

function BadgePill({ label, tone = "violet" }) {
  const toneClass = tone === "cyan"
    ? "border-cyan-300/20 bg-cyan-400/10 text-cyan-100"
    : "border-violet-300/20 bg-violet-400/10 text-violet-100";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium ${toneClass}`}>
      {label}
    </span>
  );
}
