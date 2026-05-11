import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Send, RotateCcw, Square, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function RecordingControls({ onSend, disabled }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [typedText, setTypedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const transcriptRef = useRef("");
  const shouldRestartRef = useRef(false);
  const isRecordingRef = useRef(false);
  const isSendingRef = useRef(false);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    isRecordingRef.current = false;
    shouldRestartRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const sendMessage = useCallback(async () => {
    if (isSendingRef.current) return;
    const text = (transcriptRef.current || typedText).trim();
    if (!text) return;

    isSendingRef.current = true;
    stopRecording();
    const sentText = text;
    setTranscript("");
    transcriptRef.current = "";
    setTypedText("");
    setIsProcessing(true);
    try {
      await onSend(sentText);
    } finally {
      setIsProcessing(false);
      isSendingRef.current = false;
    }
  }, [onSend, stopRecording, typedText]);

  const resetSilenceTimer = useCallback((delay = 850) => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      if (transcriptRef.current.trim()) {
        sendMessage();
      }
    }, delay);
  }, [sendMessage]);

  const startRecording = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    shouldRestartRef.current = true;

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";
      let hasFreshFinal = false;

      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
          hasFreshFinal = true;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const fullText = finalTranscript + interimTranscript;
      transcriptRef.current = fullText;
      setTranscript(fullText);
      resetSilenceTimer(hasFreshFinal ? 420 : 850);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "aborted" || event.error === "no-speech") return;
      stopRecording();
    };

    recognition.onend = () => {
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }
      if (!shouldRestartRef.current || !isRecordingRef.current) return;
      window.setTimeout(() => {
        if (!shouldRestartRef.current || !isRecordingRef.current) return;
        startRecording();
      }, 120);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      recognitionRef.current = null;
      return;
    }
    setIsRecording(true);
    isRecordingRef.current = true;
    setTranscript("");
    transcriptRef.current = "";
    resetSilenceTimer();
  }, [resetSilenceTimer, sendMessage, stopRecording]);

  const handleReSpeak = () => {
    stopRecording();
    setTranscript("");
    transcriptRef.current = "";
    setTimeout(() => startRecording(), 200);
  };

  const handleRecordButton = () => {
    if (isRecording) {
      if (transcriptRef.current.trim()) {
        sendMessage();
        return;
      }
      stopRecording();
      return;
    }

    startRecording();
  };

  const handleManualSend = () => {
    if (isSendingRef.current) return;
    if (transcriptRef.current.trim() || typedText.trim()) {
      sendMessage();
    }
  };

  const handleTypedTextChange = (event) => {
    const value = event.target.value;
    setTypedText(value);
    if (!isRecording) {
      transcriptRef.current = value;
    }
  };

  const handleTypedTextKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleManualSend();
    }
  };

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return (
    <div className="glass border-t border-white/5 px-4 py-3 space-y-2">
      <div className="flex items-center gap-2">
        <Input
          value={typedText}
          onChange={handleTypedTextChange}
          onKeyDown={handleTypedTextKeyDown}
          placeholder="Type your reply if voice input does not work"
          disabled={disabled || isProcessing}
          className="h-11 rounded-2xl border-white/10 bg-white/5 text-foreground placeholder:text-muted-foreground"
        />
        <button
          onClick={handleManualSend}
          disabled={disabled || isProcessing || (!typedText.trim() && !transcript.trim())}
          className="h-11 w-11 flex-shrink-0 rounded-2xl glass hover:bg-white/10 disabled:opacity-30 transition-all flex items-center justify-center"
        >
          <Send className="w-5 h-5 text-primary" />
        </button>
      </div>

      {/* Transcript preview */}
      <AnimatePresence>
        {(transcript || isRecording) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-xl px-3 py-2 mb-2"
          >
            <p className="text-sm text-foreground/80 min-h-[20px]">
              {transcript || (
                <span className="text-muted-foreground italic">Listening...</span>
              )}
            </p>
            {transcript && isRecording && (
              <p className="mt-1 text-[11px] text-muted-foreground/70">
                Tap the center button to send now.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6">
        {/* Re-speak */}
        <button
          onClick={handleReSpeak}
          disabled={disabled || isProcessing || (!isRecording && !transcript)}
          className="p-3 rounded-full glass hover:bg-white/10 disabled:opacity-30 transition-all"
        >
          <RotateCcw className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Record / Stop */}
        <button
          onClick={handleRecordButton}
          disabled={disabled || isProcessing}
          className={`p-5 rounded-full transition-all ${
            isRecording
              ? "bg-accent shadow-lg shadow-accent/30 animate-pulse-glow"
              : "bg-primary shadow-lg shadow-primary/30 hover:shadow-primary/50"
          } disabled:opacity-50`}
        >
          {isProcessing ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : isRecording ? (
            <Square className="w-6 h-6 text-white" />
          ) : (
            <Mic className="w-6 h-6 text-white" />
          )}
        </button>

        {/* Send */}
        <div className="w-11" />
      </div>
    </div>
  );
}
