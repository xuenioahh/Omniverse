// Stable Audio Manager using browser SpeechSynthesis as primary TTS.
// This keeps voice playback behavior in one place so pages only need to request
// speech, stop speech, and react to playback state changes.
class StableAudioManager {
  constructor() {
    this.isPlaying = false;
    this.onSpeakingChange = null;
    this.currentPlaybackId = null;
    this.onPlaybackMetaChange = null;
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

  async playAIVoice(text, voiceGender = 'female', options = {}) {
    return new Promise(async (resolve) => {
      const speechText = this._condenseText(text, options);
      if (!this.isSupported() || !speechText) { resolve(false); return; }

      const playbackId = options.playbackId || null;
      this.currentPlaybackId = playbackId;
      this.onPlaybackMetaChange?.(playbackId);

      // Cancel any ongoing speech first
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      utterance.pitch = voiceGender === 'female' ? 1.1 : 0.9;

      const voices = await this._getVoices();
      const preferred = voices.find(v =>
        v.lang.startsWith('en') &&
        v.name.toLowerCase().includes(voiceGender === 'female' ? 'female' : 'male')
      ) || voices.find(v => v.lang.startsWith('en'));
      if (preferred) utterance.voice = preferred;

      let resolved = false;
      const done = () => {
        if (resolved) return;
        resolved = true;
        this.isPlaying = false;
        this.currentPlaybackId = null;
        this.onSpeakingChange?.(false);
        this.onPlaybackMetaChange?.(null);
        resolve(true);
      };

      utterance.onstart = () => {
        this.isPlaying = true;
        this.onSpeakingChange?.(true);
      };
      utterance.onend = done;
      utterance.onerror = (e) => {
        console.error('TTS error:', e);
        if (resolved) return;
        resolved = true;
        this.isPlaying = false;
        this.currentPlaybackId = null;
        this.onSpeakingChange?.(false);
        this.onPlaybackMetaChange?.(null);
        resolve(false);
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  stop() {
    window.speechSynthesis?.cancel();
    this.isPlaying = false;
    this.currentPlaybackId = null;
    this.onSpeakingChange?.(false);
    this.onPlaybackMetaChange?.(null);
  }
}

export const audioManager = new StableAudioManager();
