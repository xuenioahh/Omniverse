// Stable Audio Manager using browser SpeechSynthesis as primary TTS.
// This keeps voice playback behavior in one place so pages only need to request
// speech, stop speech, and react to playback state changes.
class StableAudioManager {
  constructor() {
    this.isPlaying = false;
    this.onSpeakingChange = null;
    this.currentPlaybackId = null;
    this.onPlaybackMetaChange = null;
    this._playRequestId = 0;
    this._voicesReady = false;
    this._voicesLoadedCallbacks = [];

    if (window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        this._voicesReady = true;
      } else {
        window.speechSynthesis.addEventListener('voiceschanged', () => {
          if (!this._voicesReady) {
            this._voicesReady = true;
            this._voicesLoadedCallbacks.forEach(cb => cb());
            this._voicesLoadedCallbacks = [];
          }
        }, { once: true });
      }
    }
  }

  _pickVoice(voices, voiceGender) {
    const normalizedGender = voiceGender === "male" ? "male" : "female";
    const englishVoices = (voices || []).filter((voice) => String(voice.lang || "").toLowerCase().startsWith("en"));
    const genderHints = normalizedGender === "female"
      ? ["female", "samantha", "ava", "victoria", "zira", "karen", "moira"]
      : ["male", "daniel", "alex", "fred", "thomas", "jorge"];

    return englishVoices.find((voice) => {
      const name = String(voice.name || "").toLowerCase();
      return genderHints.some((hint) => name.includes(hint));
    }) || englishVoices[0] || voices?.[0] || null;
  }

  _speakUtterance(utterance) {
    return new Promise((resolve) => {
      let finished = false;
      let startTimer = null;

      const cleanup = () => {
        if (startTimer) {
          window.clearTimeout(startTimer);
          startTimer = null;
        }
      };

      const done = (ok) => {
        if (finished) return;
        finished = true;
        cleanup();
        resolve(ok);
      };

      utterance.onstart = () => {
        this.isPlaying = true;
        this.onSpeakingChange?.(true);
      };
      utterance.onend = () => {
        this.isPlaying = false;
        this.currentPlaybackId = null;
        this.onSpeakingChange?.(false);
        this.onPlaybackMetaChange?.(null);
        done(true);
      };
      utterance.onerror = (error) => {
        console.error("TTS error:", error);
        this.isPlaying = false;
        this.currentPlaybackId = null;
        this.onSpeakingChange?.(false);
        this.onPlaybackMetaChange?.(null);
        done(false);
      };

      startTimer = window.setTimeout(() => {
        if (!this.isPlaying) {
          done(false);
        }
      }, 1200);

      window.speechSynthesis.speak(utterance);
    });
  }

  isSupported() {
    return typeof window !== "undefined" && Boolean(window.speechSynthesis);
  }

  _getVoices() {
    return new Promise((resolve) => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) return resolve(voices);
      const timeout = window.setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1200);
      this._voicesLoadedCallbacks.push(() => {
        window.clearTimeout(timeout);
        resolve(window.speechSynthesis.getVoices());
      });
    });
  }

  _condenseText(text, options = {}) {
    const normalized = String(text || "").replace(/\s+/g, " ").trim();
    if (!normalized) return "";

    const {
      concise = false,
      maxSentences = 2,
      maxChars = 180,
    } = options;

    if (!concise && normalized.length <= maxChars) {
      return normalized;
    }

    // Long model replies sound unnatural when read verbatim. Condensing them
    // keeps playback usable during rapid back-and-forth practice.
    const sentenceMatches = normalized.match(/[^.!?]+[.!?]?/g) || [normalized];
    const selected = sentenceMatches
      .map((sentence) => sentence.trim())
      .filter(Boolean)
      .slice(0, concise ? maxSentences : sentenceMatches.length);
    let condensed = selected.join(" ").trim();

    if (condensed.length > maxChars) {
      condensed = `${condensed.slice(0, Math.max(0, maxChars - 1)).trimEnd()}...`;
    }

    return condensed || normalized.slice(0, maxChars).trimEnd();
  }

  _chunkSpeechText(text, maxChunkChars = 90) {
    const normalized = String(text || "").replace(/\s+/g, " ").trim();
    if (!normalized) return [];

    const sentences = normalized.match(/[^.!?]+[.!?]?/g) || [normalized];
    const chunks = [];
    let current = "";

    for (const rawSentence of sentences) {
      const sentence = rawSentence.trim();
      if (!sentence) continue;

      if (!current) {
        current = sentence;
        continue;
      }

      if (`${current} ${sentence}`.length <= maxChunkChars) {
        current = `${current} ${sentence}`;
      } else {
        chunks.push(current);
        current = sentence;
      }
    }

    if (current) {
      chunks.push(current);
    }

    return chunks;
  }

  async playAIVoice(text, voiceGender = 'female', options = {}) {
    const speechText = this._condenseText(text, options);
    if (!this.isSupported() || !speechText) return false;

    this._playRequestId += 1;
    const requestId = this._playRequestId;
    const playbackId = options.playbackId || null;
    this.currentPlaybackId = playbackId;
    this.onPlaybackMetaChange?.(playbackId);

    try {
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
      }
      window.speechSynthesis.resume();
    } catch {
      // ignore browser-specific speech state errors
    }

    const voices = await this._getVoices();
    if (requestId !== this._playRequestId) return false;
    const preferredVoice = this._pickVoice(voices, voiceGender);
    const chunks = this._chunkSpeechText(speechText, options.chunkChars || 90);

    const attemptSpeakChunk = async (chunkText, voice = preferredVoice) => {
      const utterance = new SpeechSynthesisUtterance(chunkText);
      utterance.lang = 'en-US';
      utterance.rate = options.rate || 1;
      utterance.pitch = voiceGender === 'female' ? 1.05 : 0.95;
      if (voice) utterance.voice = voice;

      await new Promise((resolve) => window.setTimeout(resolve, 30));
      try {
        window.speechSynthesis.resume();
      } catch {
        // ignore
      }
      return this._speakUtterance(utterance);
    };

    const speakChunks = async (voice = preferredVoice) => {
      for (const chunk of chunks) {
        if (requestId !== this._playRequestId) return false;
        const ok = await attemptSpeakChunk(chunk, voice);
        if (!ok) return false;
        await new Promise((resolve) => window.setTimeout(resolve, 10));
      }
      return true;
    };

    let ok = await speakChunks(preferredVoice);
    if (!ok && requestId === this._playRequestId) {
      try {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.cancel();
        }
        window.speechSynthesis.resume();
      } catch {
        // ignore
      }
      ok = await speakChunks(null);
    }

    return ok;
  }

  stop() {
    this._playRequestId += 1;
    window.speechSynthesis?.cancel();
    this.isPlaying = false;
    this.currentPlaybackId = null;
    this.onSpeakingChange?.(false);
    this.onPlaybackMetaChange?.(null);
  }
}

export const audioManager = new StableAudioManager();
