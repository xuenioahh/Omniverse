function fallbackReport({ duration, totalPages, fileName }) {
  const durationStr = `${Math.floor((duration || 0) / 60)}m ${(duration || 0) % 60}s`;
  return {
    source: "fallback",
    overall_score: 7.0,
    scores: {
      content: 7.0,
      delivery: 7.0,
      body_language: 6.8,
      engagement: 7.1,
      document_handling: 7.0,
    },
    time_analysis: {
      total_duration: durationStr,
      avg_per_page: `${Math.floor(((totalPages ? duration / totalPages : duration) || 0) / 60)}m ${Math.round(((totalPages ? duration / totalPages : duration) || 0) % 60)}s`,
      recommendation: "Keep each slide focused on one point, then close with a short takeaway.",
      page_assessments: [],
    },
    feedback: {
      content: {
        strengths: "Your session data was captured, so you can still review your overall flow.",
        improvements: "Make each slide explanation shorter and clearer before moving on.",
      },
      delivery: {
        strengths: "You completed a full practice run.",
        improvements: "Use steadier pacing and clearer transitions between slides.",
      },
    },
    key_takeaways: [
      "You finished the practice session successfully.",
      "A fallback summary is shown because the model response was unavailable.",
      "Focus next on clearer slide-by-slide transitions and shorter takeaways.",
    ],
    suggestions: [
      "State the main idea of each slide first.",
      "Add one example only, then move on.",
      "End with a short final takeaway.",
    ],
    pdf_summary: {
      fileName,
      overlap: 0,
      trackedKeywords: [],
      transcriptKeywords: [],
      coverageLabel: "Unavailable",
    },
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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const payload = req.body || {};

  if (!apiKey) {
    res.status(200).json(fallbackReport(payload));
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
              text: "You are a presentation coach. Return strict JSON only with shape {\"overall_score\":0,\"scores\":{\"content\":0,\"delivery\":0,\"body_language\":0,\"engagement\":0,\"document_handling\":0},\"time_analysis\":{\"total_duration\":\"...\",\"avg_per_page\":\"...\",\"recommendation\":\"...\",\"page_assessments\":[]},\"feedback\":{\"content\":{\"strengths\":\"...\",\"improvements\":\"...\"},\"delivery\":{\"strengths\":\"...\",\"improvements\":\"...\"}},\"key_takeaways\":[\"...\",\"...\",\"...\"],\"suggestions\":[\"...\",\"...\",\"...\"],\"pdf_summary\":{\"fileName\":\"...\",\"overlap\":0,\"trackedKeywords\":[],\"transcriptKeywords\":[],\"coverageLabel\":\"...\"}}. Requirements: use the uploaded PDF text, transcript, and pacing to infer what kinds of pages the user practiced most, such as chart pages, list pages, concept pages, or conclusion pages; make suggestions specific to those page types; keep it practical, concise, and student-friendly; avoid generic praise.",
            }],
          },
          {
            role: "user",
            content: [{
              type: "input_text",
              text: JSON.stringify(payload).slice(0, 14000),
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
    res.status(200).json(parsed ? { source: "ai", ...parsed } : fallbackReport(payload));
  } catch (error) {
    console.error("presentation-report api error:", error);
    res.status(200).json(fallbackReport(payload));
  }
}
