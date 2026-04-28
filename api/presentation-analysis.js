function fallbackAnalysis(fileName, pageTexts) {
  const totalPages = Math.max((pageTexts || []).length, 1);
  return {
    source: "fallback",
    title: fileName || "Presentation File",
    overviewCards: [
      { value: `${totalPages} ${totalPages === 1 ? "page" : "pages"}` },
      { value: "Frame the topic clearly" },
      { value: "Match your wording to each page type" },
    ],
    structureCards: [
      {
        step: "Opening",
        title: "State the topic and the goal",
        body: "Start by telling the audience what this presentation is about and what they should pay attention to.",
      },
      {
        step: "Middle",
        title: "Explain the strongest pages only",
        body: "Choose the pages with the most useful content and explain them in your own words instead of reading everything.",
      },
      {
        step: "Closing",
        title: "Finish with the result",
        body: "End by restating the main conclusion or action in one sentence.",
      },
    ],
    focusCards: [
      { title: "Priority words", items: ["topic", "evidence", "result"] },
    ],
    presenterTips: [
      "Open with the topic in one sentence.",
      "Say the key term first, then explain it.",
      "Finish with one result or takeaway.",
    ],
  };
}

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

function normalizeAnalysisShape(parsed, fallback) {
  if (!parsed || typeof parsed !== "object") return fallback;

  return {
    source: "ai",
    title: parsed.title || fallback.title,
    summary: parsed.summary || fallback.summary || "",
    documentBlueprint: parsed.documentBlueprint || null,
    overviewCards: Array.isArray(parsed.overviewCards) && parsed.overviewCards.length
      ? parsed.overviewCards.slice(0, 3)
      : fallback.overviewCards,
    structureCards: Array.isArray(parsed.structureCards) && parsed.structureCards.length
      ? parsed.structureCards.slice(0, 3)
      : fallback.structureCards,
    focusCards: Array.isArray(parsed.focusCards) && parsed.focusCards.length
      ? parsed.focusCards.slice(0, 1)
      : fallback.focusCards,
    presenterTips: Array.isArray(parsed.presenterTips) && parsed.presenterTips.length
      ? parsed.presenterTips.slice(0, 3)
      : fallback.presenterTips,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const { fileName, pageTexts } = req.body || {};

  if (!apiKey) {
    res.status(200).json(fallbackAnalysis(fileName, pageTexts));
    return;
  }

  try {
    const fallback = fallbackAnalysis(fileName, pageTexts);
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
              text: "You are a presentation coach. Read the extracted PDF text closely and build a file-specific rehearsal plan. First infer the document blueprint: main topic, 2 to 4 likely sections, repeated terms, likely final takeaway, and the dominant page types in the deck. Explicitly reason about title/opening pages, chart or comparison pages, list/process pages, concept/definition pages, and closing/takeaway pages. Then convert that into short, practical presenter guidance. Return strict JSON only with this shape: {\"title\":\"...\",\"summary\":\"...\",\"documentBlueprint\":{\"mainTopic\":\"...\",\"sectionLabels\":[\"...\",\"...\"],\"audienceGoal\":\"...\",\"finalTakeaway\":\"...\"},\"overviewCards\":[{\"value\":\"...\"},{\"value\":\"...\"},{\"value\":\"...\"}],\"structureCards\":[{\"step\":\"Opening\",\"title\":\"...\",\"body\":\"...\"},{\"step\":\"Middle\",\"title\":\"...\",\"body\":\"...\"},{\"step\":\"Closing\",\"title\":\"...\",\"body\":\"...\"}],\"focusCards\":[{\"title\":\"Priority words\",\"items\":[\"...\",\"...\",\"...\",\"...\"]}],\"presenterTips\":[\"...\",\"...\",\"...\"]}. Requirements: every field must be tied to this exact file; quote or reuse actual topic words from the PDF when possible; avoid generic labels; make the opening, middle, and closing instructions clearly different; mention visual handling where useful; if many pages look like charts, tell the user to describe trends first; if many pages look like lists, tell the user to group points; if pages are concept-heavy, tell the user to define terms before explaining them; keep it concise but concrete.",
            }],
          },
          {
            role: "user",
            content: [{
              type: "input_text",
              text: `File name: ${fileName || "presentation"}\nExtracted page texts:\n${(pageTexts || []).join("\n---\n").slice(0, 12000)}`,
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
    res.status(200).json(normalizeAnalysisShape(parsed, fallback));
  } catch (error) {
    console.error("presentation-analysis api error:", error);
    res.status(200).json(fallbackAnalysis(fileName, pageTexts));
  }
}
