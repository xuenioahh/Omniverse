import { localStore } from "@/lib/localStore";
import { emitActivitySync } from "@/lib/activitySync";
import {
  generateConversationReply,
  generateVoiceReport,
} from "@/lib/localReports";
import { getScenario } from "@/lib/scenarios";

function redirectTo(path) {
  if (typeof window !== "undefined" && path) {
    window.location.href = path;
  }
}

function buildEntityStore(collection) {
  return {
    async list(sort, limit) {
      return collection.list(sort, limit);
    },
    async create(payload) {
      const created = collection.create(payload);
      emitActivitySync({ type: "entity:create" });
      return created;
    },
    async delete(id) {
      collection.delete(id);
      emitActivitySync({ type: "entity:delete" });
    },
  };
}

async function syncAdminEvent(type, payload = {}) {
  try {
    const user = localStore.auth.currentUserOrNull();
    await fetch("/api/admin-track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type,
        user,
        payload,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error("Failed to sync admin event:", error);
  }
}

/**
 * @typedef {{
 *   prompt?: string,
 *   input?: {
 *     kind?: string,
 *     [key: string]: any
 *   }
 * }} InvokeLlmRequest
 */

export const localApi = {
  auth: {
    async me() {
      return localStore.auth.currentUser();
    },
    async updateMe(patch) {
      const updated = localStore.auth.updateCurrentUser(patch);
      emitActivitySync({ type: "user:update" });
      await syncAdminEvent("user_updated", { patch, user: updated });
      return updated;
    },
    async login(payload) {
      const loggedIn = localStore.auth.login(payload);
      emitActivitySync({ type: "auth:login" });
      await syncAdminEvent("user_logged_in", { email: loggedIn?.email || payload?.email || "" });
      return loggedIn;
    },
    async register(payload) {
      const registered = localStore.auth.register(payload);
      emitActivitySync({ type: "auth:register" });
      await syncAdminEvent("user_registered", { email: registered?.email || payload?.email || "" });
      return registered;
    },
    logout(redirectPath = "/") {
      void syncAdminEvent("user_logged_out", { redirectPath });
      localStore.auth.logout();
      emitActivitySync({ type: "auth:logout" });
      redirectTo(redirectPath);
    },
    redirectToLogin(redirectPath = "/auth") {
      redirectTo(redirectPath);
    },
  },
  entities: {
    VoiceSession: buildEntityStore({
      ...localStore.voiceSessions,
      create(payload) {
        const created = localStore.voiceSessions.create(payload);
        void syncAdminEvent("voice_session_saved", { session: created });
        return created;
      },
    }),
    PresentationSession: buildEntityStore({
      ...localStore.presentationSessions,
      create(payload) {
        const created = localStore.presentationSessions.create(payload);
        void syncAdminEvent("presentation_session_saved", { session: created });
        return created;
      },
    }),
    ActivityRecord: buildEntityStore({
      ...localStore.activityRecords,
      create(payload) {
        const created = localStore.activityRecords.create(payload);
        void syncAdminEvent("activity_record_saved", { activity: created });
        return created;
      },
    }),
  },
  integrations: {
    Core: {
      async UploadFile({ file }) {
        const file_url = await localStore.fileToDataUrl(file);
        return { file_url };
      },
      async TrackActivity(payload) {
        const activity = localStore.activityRecords.create(payload || {});
        emitActivitySync({ type: "activity:track" });
        await syncAdminEvent("activity_tracked", { activity });
        return activity;
      },
      /**
       * @param {InvokeLlmRequest} request
       */
      async InvokeLLM(request = {}) {
        const { prompt, input } = request;
        const payload = input || {};

        if (payload.kind === "voice-chat") {
          const response = await fetch("/api/voice-chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            throw new Error(`voice-chat request failed with ${response.status}`);
          }

          return response.json();
        }

        if (payload.kind === "voice-report") {
          return generateVoiceReport({
            messages: payload.messages || [],
            scoring: payload.scoring || "daily",
            duration: payload.duration || 0,
            words: payload.words || 0,
            exchanges: payload.exchanges || 0,
            scenarioTitle: payload.scenarioTitle || "Practice Session",
            mode: payload.mode || "basic",
            dialogMode: payload.dialogMode || "free_talk",
          });
        }

        if (payload.kind === "presentation-report") {
          const response = await fetch("/api/presentation-report", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            throw new Error(`presentation-report request failed with ${response.status}`);
          }

          return response.json();
        }

        if (payload.kind === "presentation-analysis") {
          const response = await fetch("/api/presentation-analysis", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            throw new Error(`presentation-analysis request failed with ${response.status}`);
          }

          return response.json();
        }

        if (payload.kind === "presentation-pause-feedback") {
          const response = await fetch("/api/presentation-pause-feedback", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            throw new Error(`presentation-pause-feedback request failed with ${response.status}`);
          }

          return response.json();
        }

        const scenario = getScenario(payload.scenarioId || "cafe");
        const scenarioData = payload.isGoalOriented
          ? scenario?.goalOriented
          : scenario?.freeTalk;

        return generateConversationReply({
          scenario,
          scenarioData,
          history: payload.history || [],
          userText: payload.userText || prompt || "Can you help me?",
          scoring: payload.scoring || "daily",
          mode: payload.mode || "basic",
          isGoalOriented: Boolean(payload.isGoalOriented),
        });
      },
    },
  },
};
