import { generatePresentationPauseFeedback } from "../src/lib/localReports.js";

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function normalizeFeedback(parsed, fallback) {
  if (!parsed || typeof parsed !== "object") return fallback;

  return {
    ...fallback,
    source: "ai",
    title: parsed.title || fallback.title,
    elapsedLabel: parsed.elapsedLabel || fallback.elapsedLabel,
    overallScore: Number.isFinite(parsed.overallScore) ? parsed.overallScore : fallback.overallScore,
    transcriptPreview: parsed.transcriptPreview || fallback.transcriptPreview,
    pageContentPreview: parsed.pageContentPreview || fallback.pageContentPreview,
    nextStep: parsed.nextStep || fallback.nextStep,
    strengths: Array.isArray(parsed.strengths) && parsed.strengths.length
      ? parsed.strengths.slice(0, 3)
      : fallback.strengths,
    improvements: Array.isArray(parsed.improvements) && parsed.improvements.length
      ? parsed.improvements.slice(0, 3)
      : fallback.improvements,
    priorityCards: Array.isArray(parsed.priorityCards) && parsed.priorityCards.length
      ? parsed.priorityCards.slice(0, 2).map((card, index) => ({
          ...fallback.priorityCards[index],
          ...card,
        }))
      : fallback.priorityCards,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const payload = req.body || {};
  const fallback = generatePresentationPauseFeedback(payload);
  fallback.source = "fallback";
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    res.status(200).json(fallback);
    return;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5.4-mini",
        input: [
          {
            role: "system",
            content: [{
              type: "input_text",
              text: "You are a live presentation coach. The user has paused on one specific PDF page. Give realtime feedback tied to the current page content, transcript, and delivery scores. First infer what kind of page this is: title/opening page, chart/comparison page, list/process page, concept/definition page, or conclusion/takeaway page. Then coach according to that page type. Return strict JSON only with shape {\"title\":\"...\",\"elapsedLabel\":\"...\",\"overallScore\":72,\"transcriptPreview\":\"...\",\"pageContentPreview\":\"...\",\"strengths\":[\"...\"],\"improvements\":[\"...\"],\"nextStep\":\"...\",\"priorityCards\":[{\"title\":\"...\",\"score\":72,\"body\":\"...\"},{\"title\":\"...\",\"score\":68,\"body\":\"...\"}]}. Requirements: make it specific to the current page; mention what this page is mainly about; give one short example sentence the user can say now; if it is a chart page, tell the user to describe the trend before details; if it is a list page, tell the user to group bullets; if it is an opening page, tell the user to frame the topic and audience expectation; if it is a conclusion page, tell the user to restate the takeaway; keep it concise and coach-like.",
            }],
          },
          {
            role: "user",
            content: [{
              type: "input_text",
              text: `Current page: ${payload.page}\nElapsed: ${payload.elapsed}\nTranscript: ${payload.transcript || "(empty)"}\nCurrent page text:\n${payload.currentPageText || "(none)"}\nScores: ${JSON.stringify(payload.scores || {})}\nRecent pause history: ${JSON.stringify(payload.history || []).slice(0, 2000)}`,
            }],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI error ${response.status}`);
    }

    const data = await response.json();
    const parsed = safeJsonParse(data.output_text || "");
    res.status(200).json(normalizeFeedback(parsed, fallback));
  } catch (error) {
    console.error("presentation-pause-feedback api error:", error);
    res.status(200).json(fallback);
  }
}
