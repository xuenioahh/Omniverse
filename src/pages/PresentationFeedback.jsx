import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Volume2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { localApi } from "@/api/localClient";
import { audioManager } from "@/lib/audioManager";

export default function PresentationFeedback() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [spokenSnapshot, setSpokenSnapshot] = useState(null);
  const [audioFailed, setAudioFailed] = useState(false);

  const speakText = async (text) => {
    if (!text) return;
    const ok = await audioManager.playAIVoice(text, "female");
    setAudioFailed(!ok);
  };

  useEffect(() => {
    let mounted = true;
    let lastSeenUpdatedAt = null;

    const refreshFeedback = async () => {
      const payload = JSON.parse(
        sessionStorage.getItem("presentationPauseFeedbackLive") ||
        sessionStorage.getItem("presentationPauseFeedbackPayload") ||
        "null"
      );

      if (!payload) {
        navigate("/presentation/practice");
        return;
      }

      if (lastSeenUpdatedAt === payload.updatedAt) {
        return;
      }

      const result = await localApi.integrations.Core.InvokeLLM({
        input: {
          kind: "presentation-pause-feedback",
          ...payload,
        },
      });

      if (!mounted) return;
      lastSeenUpdatedAt = payload.updatedAt;
      setFeedback(result);
      setLastUpdatedAt(payload.updatedAt || Date.now());
    };

    refreshFeedback();
    const interval = window.setInterval(refreshFeedback, 300);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [navigate]);

  useEffect(() => {
    if (!feedback) return;

    if (spokenSnapshot === lastUpdatedAt) return;

    const summary = [
      `Pause feedback. Score ${feedback.overallScore}.`,
      feedback.priorityCards?.[0]?.body || "",
      feedback.priorityCards?.[1]?.body || "",
    ]
      .filter(Boolean)
      .join(" ");

    audioManager.playAIVoice(summary, "female").then((ok) => {
      setAudioFailed(!ok);
      setSpokenSnapshot(lastUpdatedAt);
    });

    return () => {
      audioManager.stop();
    };
  }, [feedback, lastUpdatedAt, spokenSnapshot]);

  if (!feedback) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[15px] text-muted-foreground">Preparing feedback...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5">
        <button onClick={() => navigate("/presentation/practice?resume=1")} className="p-2 rounded-xl hover:bg-white/5">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h2 className="font-semibold text-foreground">Pause Feedback</h2>
          <p className="text-[14px] text-muted-foreground">One fix before you continue</p>
        </div>
      </div>

      {audioFailed && (
        <div className="px-4 pt-3">
          <p className="text-[13px] text-accent">Voice playback is unavailable right now in this browser.</p>
        </div>
      )}
      <div className="px-4 pt-3">
        <p className="text-[11px] text-muted-foreground">
          Source: {feedback.source === "ai" ? "AI-generated" : "Fallback"}
        </p>
      </div>

      <div className="px-4 py-4 space-y-3">
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => speakText(feedback.nextStep)}
          className="glass rounded-2xl p-4 w-full text-left border border-primary/20"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-[15px] font-semibold text-foreground">Say this now</p>
            <Volume2 className="w-3.5 h-3.5 text-primary" />
          </div>
          <p className="text-[14px] text-primary mt-2">{feedback.nextStep}</p>
        </motion.button>

        <motion.button
          type="button"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          onClick={() => speakText(`Overall score ${feedback.overallScore}. ${feedback.priorityCards?.[1]?.body || feedback.nextStep}`)}
          className="glass rounded-2xl p-4 w-full text-left"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[13px] uppercase tracking-[0.16em] text-muted-foreground">Current checkpoint</p>
              <p className="text-[16px] font-semibold text-foreground mt-2">{feedback.title}</p>
              <p className="text-[14px] text-muted-foreground mt-1">{feedback.elapsedLabel}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold font-space text-primary">{feedback.overallScore}</div>
              <p className="text-[13px] text-muted-foreground mt-1">score</p>
            </div>
          </div>
        </motion.button>

        <motion.button
          type="button"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          onClick={() => speakText(`${feedback.priorityCards?.[1]?.title || "Fix first"}. ${feedback.priorityCards?.[1]?.body || feedback.nextStep}`)}
          className="glass rounded-2xl p-4 w-full text-left"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[15px] font-semibold text-foreground">{feedback.priorityCards?.[1]?.title || "Fix this first"}</h3>
            <div className="flex items-center gap-1.5">
              <span className="text-[15px] font-semibold text-primary">{feedback.priorityCards?.[1]?.score || 0}</span>
              <span className="text-[12px] text-muted-foreground">listen</span>
            </div>
          </div>
          <p className="text-[14px] text-muted-foreground mt-2">{feedback.priorityCards?.[1]?.body || feedback.nextStep}</p>
        </motion.button>

        {feedback.pageContentPreview && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="glass rounded-2xl p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] uppercase tracking-[0.16em] text-muted-foreground">Page cue</p>
              <button
                type="button"
                onClick={() => speakText(feedback.pageContentPreview)}
                className="text-[13px] text-primary"
              >
                Listen
              </button>
            </div>
            <p className="text-[14px] text-foreground/90 mt-2 leading-relaxed line-clamp-4">{feedback.pageContentPreview}</p>
          </motion.div>
        )}

        <div className="pt-2">
          <Button
            onClick={() => navigate("/presentation/practice?resume=1")}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-600"
          >
            <Play className="w-4 h-4 mr-2" />
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
