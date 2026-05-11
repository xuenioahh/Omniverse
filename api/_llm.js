export function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = String(text || "").match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function withTimeout(timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(new Error(`timeout_${timeoutMs}ms`)), timeoutMs);
  return {
    signal: controller.signal,
    clear() {
      clearTimeout(timeoutId);
    },
  };
}

function dedupeModels(models = []) {
  return [...new Set(models.filter(Boolean))];
}

function isRetryableStatus(status) {
  return status === 408 || status === 409 || status === 429 || status >= 500;
}

function isRetryableMessage(message = "") {
  const lower = String(message || "").toLowerCase();
  return lower.includes("timeout_") || lower.includes("status=429") || lower.includes("status=408") || lower.includes("status=409") || lower.includes("status=500") || lower.includes("status=502") || lower.includes("status=503") || lower.includes("status=504");
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestCompatibleJson({ provider, apiKey, baseUrl, models, systemText, userText, schemaName, timeoutMs = 6000, maxModelsPerProvider = 1, retryOnce = true }) {
  let lastError = null;

  for (const model of dedupeModels(models).slice(0, maxModelsPerProvider)) {
    const maxAttempts = retryOnce ? 2 : 1;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const { signal, clear } = withTimeout(timeoutMs);
      try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          signal,
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemText },
              { role: "user", content: userText },
            ],
            temperature: 0.5,
            response_format: {
              type: "json_object",
            },
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          lastError = new Error(`provider=${provider} model=${model} status=${response.status} body=${text}`);
          if (attempt === 0 && retryOnce && isRetryableStatus(response.status)) {
            await wait(300 + Math.floor(Math.random() * 500));
            continue;
          }
          break;
        }

        const data = await response.json();
        const parsed = safeJsonParse(data?.choices?.[0]?.message?.content || "");
        if (!parsed) {
          lastError = new Error(`provider=${provider} model=${model} invalid_model_payload`);
          break;
        }

        return { provider, model: data?.model || model, parsed };
      } catch (error) {
        lastError = new Error(`provider=${provider} model=${model} ${error?.message || "request_failed"}`);
        if (attempt === 0 && retryOnce && isRetryableMessage(error?.message)) {
          await wait(300 + Math.floor(Math.random() * 500));
          continue;
        }
        break;
      } finally {
        clear();
      }
    }
  }

  throw lastError || new Error(`provider=${provider} all_models_failed`);
}

async function requestOpenAIJson({ apiKey, models, systemText, userText, schema, schemaName, timeoutMs = 6000, maxModelsPerProvider = 1 }) {
  let lastError = null;

  for (const model of dedupeModels(models).slice(0, maxModelsPerProvider)) {
    const { signal, clear } = withTimeout(timeoutMs);
    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        signal,
        body: JSON.stringify({
          model,
          text: {
            format: {
              type: "json_schema",
              name: schemaName,
              schema,
            },
          },
          input: [
            { role: "system", content: [{ type: "input_text", text: systemText }] },
            { role: "user", content: [{ type: "input_text", text: userText }] },
          ],
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        lastError = new Error(`provider=openai model=${model} status=${response.status} body=${text}`);
        continue;
      }

      const data = await response.json();
      const parsed = safeJsonParse(data.output_text || "");
      if (!parsed) {
        lastError = new Error(`provider=openai model=${model} invalid_model_payload`);
        continue;
      }

      return { provider: "openai", model, parsed };
    } catch (error) {
      lastError = new Error(`provider=openai model=${model} ${error?.message || "request_failed"}`);
    } finally {
      clear();
    }
  }

  throw lastError || new Error("provider=openai all_models_failed");
}

async function requestOpenRouterJson({ apiKey, models, systemText, userText, schema, schemaName, timeoutMs = 6000, maxModelsPerProvider = 1 }) {
  let lastError = null;

  for (const model of dedupeModels(models).slice(0, maxModelsPerProvider)) {
    const { signal, clear } = withTimeout(timeoutMs);
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        signal,
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemText },
            { role: "user", content: userText },
          ],
          temperature: 0.5,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: schemaName,
              strict: true,
              schema,
            },
          },
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        lastError = new Error(`provider=openrouter model=${model} status=${response.status} body=${text}`);
        continue;
      }

      const data = await response.json();
      const parsed = safeJsonParse(data?.choices?.[0]?.message?.content || "");
      if (!parsed) {
        lastError = new Error(`provider=openrouter model=${model} invalid_model_payload`);
        continue;
      }

      return { provider: "openrouter", model: data?.model || model, parsed };
    } catch (error) {
      lastError = new Error(`provider=openrouter model=${model} ${error?.message || "request_failed"}`);
    } finally {
      clear();
    }
  }

  throw lastError || new Error("provider=openrouter all_models_failed");
}

export async function requestStructuredLlm({ systemText, userText, schema, schemaName = "structured_reply", openaiModels = ["gpt-5-mini", "gpt-5", "gpt-4.1"], openrouterModels = [process.env.OPENROUTER_VOICE_CHAT_MODEL, "openrouter/free"], timeoutMs = 6000, maxModelsPerProvider = 1, retryOnce = true }) {
  const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
  const zhipuApiKey = process.env.ZHIPU_API_KEY;
  const longcatApiKey = process.env.LONGCAT_API_KEY;

  if (!deepseekApiKey && !zhipuApiKey && !longcatApiKey) {
    throw new Error("no_llm_api_key_configured");
  }

  const providers = [
    deepseekApiKey
      ? () => requestCompatibleJson({
          provider: "deepseek",
          apiKey: deepseekApiKey,
          baseUrl: "https://api.deepseek.com",
          models: [
            process.env.DEEPSEEK_MODEL,
            "deepseek-chat",
          ],
          systemText: `${systemText}\nReturn strict JSON only matching the requested shape.`,
          userText,
          schemaName,
          timeoutMs,
          maxModelsPerProvider,
          retryOnce,
        })
      : null,
    zhipuApiKey
      ? () => requestCompatibleJson({
          provider: "zhipu",
          apiKey: zhipuApiKey,
          baseUrl: "https://open.bigmodel.cn/api/paas/v4",
          models: [
            process.env.ZHIPU_MODEL,
            "glm-4.7-flash",
            "glm-4.5-flash",
          ],
          systemText: `${systemText}\nReturn strict JSON only matching the requested shape.`,
          userText,
          schemaName,
          timeoutMs,
          maxModelsPerProvider,
          retryOnce,
        })
      : null,
    longcatApiKey
      ? () => requestCompatibleJson({
          provider: "longcat",
          apiKey: longcatApiKey,
          baseUrl: "https://api.longcat.chat/openai/v1",
          models: [
            process.env.LONGCAT_MODEL,
            "LongCat-Flash-Lite",
            "LongCat-Flash-Chat",
          ],
          systemText: `${systemText}\nReturn strict JSON only matching the requested shape.`,
          userText,
          schemaName,
          timeoutMs: Math.max(timeoutMs, 7000),
          maxModelsPerProvider,
          retryOnce,
        })
      : null,
  ].filter(Boolean);

  let lastError = null;
  for (const request of providers) {
    try {
      return await request();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("all_llm_providers_failed");
}
