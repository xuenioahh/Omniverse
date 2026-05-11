import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Mic, Volume2 } from "lucide-react";
import { localApi } from "@/api/localClient";
import { getScenario } from "@/lib/scenarios";
import { audioManager } from "@/lib/audioManager";
import { getDynamicSceneCue, getSceneAsset } from "@/lib/sceneAssets";
import CharacterFigure from "@/components/CharacterFigure";
import ChatMessage from "@/components/voice/ChatMessage";
import RecordingControls from "@/components/voice/RecordingControls";
import { toast } from "sonner";

function buildFallbackReply({ scenario, scenarioData, userText, isGoalOriented, scoring, mode }) {
  const safeTopic = isGoalOriented
    ? scenarioData?.goal || "the task"
    : scenarioData?.topic || scenario?.title || "the topic";
  const summary = (userText || "").trim().replace(/\s+/g, " ") || "your answer";
  const wordCount = summary.split(/\s+/).filter(Boolean).length;
  const styleTail = scoring === "ielts"
    ? "Answer in a fuller, more natural way."
    : scoring === "toefl"
      ? "Keep your answer organized and precise."
      : mode === "advanced"
        ? "Keep it natural and specific."
        : "Keep it simple and clear.";
  const followUp = isGoalOriented
    ? wordCount >= 10
      ? "What result do you want me to confirm for you?"
      : "Can you explain the problem and what help you need?"
    : wordCount >= 10
      ? "Can you give one concrete example to support that idea?"
      : "Can you add one reason or one example?";

  return `Okay. We're still talking about ${safeTopic.toLowerCase()}. ${followUp} ${styleTail}`;
}

export default function VoiceChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const scenarioId = params.get("scenario");
  const mode = params.get("mode");
  const dialogMode = params.get("dialogMode");
  const scoring = params.get("scoring");

  const scenario = getScenario(scenarioId);
  const isGoalOriented = dialogMode === "goal_oriented";
  const scenarioData = isGoalOriented ? scenario?.goalOriented : scenario?.freeTalk;
  const examinerScene = getSceneAsset(scenarioId)?.fallback || null;

  const [messages, setMessages] = useState([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [activePlaybackId, setActivePlaybackId] = useState(null);
  const [hasUserSpoken, setHasUserSpoken] = useState(false);
  const [fallbackNotice, setFallbackNotice] = useState("");
  const [autoPlayIntroPending, setAutoPlayIntroPending] = useState(true);
  const [startTime] = useState(Date.now());
  const chatEndRef = useRef(null);
  const messageRefs = useRef({});
  const sessionDataRef = useRef({ wordCount: 0, exchanges: 0 });
  const lastSentRef = useRef({ text: "", time: 0 });
  const messagesRef = useRef([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!scenario) {
      navigate("/voice");
    }
  }, [navigate, scenario]);

  // Initialize with AI first message
  useEffect(() => {
    if (!scenario || !scenarioData) return;
    void localApi.integrations.Core.TrackActivity({
      activity_type: "voice_practice_started",
      scenario: scenarioId,
      mode,
      dialog_mode: dialogMode,
      scoring_standard: scoring,
    }).catch((error) => {
      console.error("Failed to track voice practice start:", error);
    });
    
    const initMessage = {
      id: `ai-${Date.now()}`,
      role: "ai",
      content: scenarioData.firstMessage,
      aiRole: scenario.aiRole,
      visual: getDynamicSceneCue(scenarioId, scenarioData.firstMessage),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages([initMessage]);
    
    setAutoPlayIntroPending(true);
  }, [dialogMode, mode, scenario, scenarioData, scenarioId, scoring]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  useEffect(() => {
    if (!autoPlayIntroPending || !messages.length) return;
    const firstAiMessage = messages[0];
    if (!firstAiMessage || firstAiMessage.role !== "ai") return;

    const timer = window.setTimeout(() => {
      void audioManager.playAIVoice(firstAiMessage.content, scenario.aiVoice, {
        concise: true,
        maxSentences: 2,
        maxChars: 180,
        playbackId: firstAiMessage.id,
      });
      setAutoPlayIntroPending(false);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [autoPlayIntroPending, messages, scenario?.aiVoice]);

  useEffect(() => {
    audioManager.onPlaybackMetaChange = (playbackId) => {
      setActivePlaybackId(playbackId);
    };

    return () => {
      if (audioManager.onPlaybackMetaChange) {
        audioManager.onPlaybackMetaChange = null;
      }
    };
  }, []);

  useEffect(() => () => {
    audioManager.stop();
  }, []);

  const handleSend = async (userText) => {
    const normalizedText = (userText || "").trim().replace(/\s+/g, " ");
    if (!normalizedText) return;
    const now = Date.now();
    if (
      lastSentRef.current.text === normalizedText &&
      now - lastSentRef.current.time < 1500
    ) {
      return;
    }
    lastSentRef.current = { text: normalizedText, time: now };

    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    
    // Count words
    sessionDataRef.current.wordCount += normalizedText.split(/\s+/).length;
    sessionDataRef.current.exchanges += 1;
    setHasUserSpoken(true);

    // Add user message (feedback will come from AI)
    const userMsg = { id: `user-${now}`, role: "user", content: normalizedText, time };
    setMessages(prev => [...prev, userMsg]);
    setIsAiThinking(true);

    let result = null;

    try {
      result = await localApi.integrations.Core.InvokeLLM({
        input: {
          kind: "voice-chat",
          scenario,
          scenarioData,
          history: [...messages, userMsg],
          userText: normalizedText,
          mode,
          scoring,
          isGoalOriented,
        },
      });
      if (result?.source === "fallback" || result?.fallback_reason) {
        const nextReason = String(result?.fallback_reason || "unknown_fallback").slice(0, 220);
        setFallbackNotice(nextReason);
        toast.warning(`AI fallback reply: ${nextReason}`);
      } else {
        setFallbackNotice("");
      }
    } catch (error) {
      console.error("Failed to generate AI reply:", error);
      toast.error("Reply generation failed once. Using a fallback reply.");
      setFallbackNotice(error?.message || "request_failed");
      result = null;
    } finally {
      // Update user message with feedback without relying on findLastIndex for browser compatibility.
      setMessages(prev => {
        const updated = [...prev];
        let lastUserIdx = -1;
        for (let i = updated.length - 1; i >= 0; i -= 1) {
          if (updated[i].role === "user") {
            lastUserIdx = i;
            break;
          }
        }
        if (lastUserIdx >= 0 && result?.feedback) {
          updated[lastUserIdx] = { ...updated[lastUserIdx], feedback: result.feedback };
        }
        return updated;
      });

      const replyText = result?.reply?.trim() || buildFallbackReply({
        scenario,
        scenarioData,
        userText: normalizedText,
        isGoalOriented,
        scoring,
        mode,
      });
      const aiTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const nextPlaybackId = `ai-${Date.now()}`;
      setMessages(prev => {
        const nextVisual = getDynamicSceneCue(scenarioId, replyText);
        const lastAiVisualKey = [...prev]
          .reverse()
          .find((entry) => entry.role === "ai" && entry.visual?.key)?.visual?.key;
        const visual = nextVisual?.key && nextVisual.key === lastAiVisualKey ? null : nextVisual;

        const nextMessages = [
          ...prev,
          {
            id: nextPlaybackId,
            playbackId: nextPlaybackId,
            role: "ai",
            content: replyText,
            source: result?.source || "fallback",
            model: result?.model || null,
            fallbackReason: result?.fallback_reason || null,
            aiRole: scenario.aiRole,
            visual,
            time: aiTime,
          },
        ];
        messagesRef.current = nextMessages;
        return nextMessages;
      });
      setIsAiThinking(false);
    }
  };

  const handleEnd = () => {
    audioManager.stop();
    const duration = Math.floor((Date.now() - startTime) / 1000);
    const endParams = new URLSearchParams({
      scenario: scenarioId,
      mode,
      dialogMode,
      scoring,
      duration: duration.toString(),
      words: sessionDataRef.current.wordCount.toString(),
      exchanges: sessionDataRef.current.exchanges.toString(),
    });
    
    // Store messages in sessionStorage for report
    sessionStorage.setItem("voiceMessages", JSON.stringify(messagesRef.current));
    sessionStorage.setItem(
      "voiceReportContext",
      JSON.stringify({
        scenario: scenarioId,
        mode,
        dialogMode,
        scoring,
        duration,
        words: sessionDataRef.current.wordCount,
        exchanges: sessionDataRef.current.exchanges,
      })
    );
    navigate(`/voice/report?${endParams.toString()}`);
  };

  const handleExit = () => {
    audioManager.stop();
    navigate("/voice");
  };

  if (!scenario) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 glass">
        <button onClick={handleExit} className="flex items-center gap-1 text-sm text-accent font-medium">
          <ArrowLeft className="w-4 h-4" />
          Exit
        </button>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">{scenario.aiRole}</p>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium uppercase">
          {scoring}
        </span>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isGoalOriented && examinerScene && (
          <div className="flex justify-center">
            <div className="w-full max-w-sm overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(15,23,42,0.32))] px-5 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
              <div className="text-center">
                <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/75">Virtual Examiner</p>
                <div className="mt-5 flex justify-center">
                  <CharacterFigure
                    fallback={String(scenario.aiRole || "E").slice(0, 1)}
                    size="large"
                    accent="cyan"
                    label={scenario.aiRole}
                    subtitle={scenarioData?.context || examinerScene.tip}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        {fallbackNotice && (
          <div className="glass rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3">
            <p className="text-xs font-medium text-amber-200">AI fallback mode</p>
            <p className="mt-1 text-xs text-amber-100/90 break-words">{fallbackNotice}</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatMessage
            key={msg.id || i}
            message={msg}
            voiceGender={scenario.aiVoice}
            isActive={activePlaybackId === (msg.playbackId || msg.id)}
            registerRef={(node) => {
              if (!msg.id && !msg.playbackId) return;
              messageRefs.current[msg.playbackId || msg.id] = node;
            }}
          />
        ))}
        
        {isAiThinking && (
          <div className="flex gap-3 items-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xs font-bold text-white">
              AI
            </div>
            <div className="glass rounded-2xl rounded-tl-md px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="border-t border-white/5 glass px-4 py-3 space-y-3">
        {!hasUserSpoken && (
          <div className="glass rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <Mic className="w-4 h-4 text-primary" />
              <h3 className="text-[15px] font-semibold text-foreground">Speaking Guidance</h3>
            </div>
            <div className="space-y-1.5">
              <p className="text-[14px] text-muted-foreground">1. Answer in full sentences before sending.</p>
              <p className="text-[14px] text-muted-foreground">2. Add one reason or example to sound more natural.</p>
              <p className="text-[14px] text-muted-foreground">3. Use the replay button on AI replies if you want listening support.</p>
            </div>
          </div>
        )}
        <RecordingControls onSend={handleSend} disabled={isAiThinking} />
        <button
          onClick={handleEnd}
          className="w-full h-12 rounded-2xl bg-accent/15 text-accent hover:bg-accent/20 transition-colors text-[16px] font-medium flex items-center justify-center gap-2"
        >
          <Volume2 className="w-4 h-4" />
          End Practice and View Summary
        </button>
      </div>
    </div>
  );
}
