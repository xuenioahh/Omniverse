function buildSystemPrompt({ scenario, scenarioData, mode, scoring, isGoalOriented }) {
  const role = scenario?.aiRole || "conversation partner";
  const title = scenario?.title || "General English Practice";
  const userRole = scenarioData?.userRole || "learner";
  const objective = isGoalOriented
    ? `Goal: ${scenarioData?.goal || "Help the user complete the task clearly."}`
    : `Topic: ${scenarioData?.topic || title}`;
  const scoringGuide = scoring === "ielts"
    ? "IELTS style: encourage fuller, natural answers with a clear opinion, reason, and example."
    : scoring === "toefl"
      ? "TOEFL style: encourage organized answers with a main point and supporting detail."
      : "Daily style: keep it natural, conversational, and practical.";
  const difficultyGuide = mode === "advanced"
    ? "Advanced mode: use natural but slightly richer English and ask sharper follow-up questions."
    : "Basic mode: keep your English clear, supportive, and easy to follow.";
  const dialogGuide = isGoalOriented
    ? "Goal-oriented mode: stay in role and move the task forward step by step. Ask for missing details needed to complete the task."
    : "Free-talk mode: stay in role and chat naturally. Ask follow-up questions about feelings, reasons, examples, or experiences.";

  return [
    `You are roleplaying as ${role} in a scenario called ${title}.`,
    `The user is roleplaying as ${userRole}.`,
    objective,
    scoringGuide,
    difficultyGuide,
    dialogGuide,
    "Sound human, warm, and concise. Do not say phrases like 'As the ... I understand ...'.",
    "Do not describe yourself as an AI. Stay in character.",
    "Your main reply should feel like a realistic spoken response from the character.",
    "Also provide short speaking feedback for grammar, vocabulary, pronunciation, and task completion.",
    "Return strict JSON only with this shape: {\"reply\":\"...\",\"feedback\":{\"grammar\":\"...\",\"vocabulary\":\"...\",\"pronunciation\":\"...\",\"task\":\"...\"}}",
  ].join(" ");
}

function buildUserPrompt({ history, userText }) {
  const recent = (Array.isArray(history) ? history : [])
    .slice(-8)
    .map((message) => `${message.role === "ai" ? "Assistant" : "User"}: ${message.content}`)
    .join("\n");

  return [
    recent ? `Conversation so far:\n${recent}` : "",
    `Latest user message: ${userText || ""}`,
  ].filter(Boolean).join("\n\n");
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

function fallbackPayload({ userText, isGoalOriented, scenarioData, scoring, mode }) {
  const safeUserText = String(userText || "").trim();
  const topic = isGoalOriented
    ? scenarioData?.goal || "the task"
    : scenarioData?.topic || "the topic";
  const styleTail = scoring === "ielts"
    ? "Try to answer with a clear reason and one example."
    : scoring === "toefl"
      ? "Try to organize your answer with one main point and one detail."
      : mode === "advanced"
        ? "Keep it natural and specific."
        : "Keep it simple and clear.";

  const reflective = safeUserText
    ? safeUserText.split(/\s+/).length <= 5
      ? `I heard you say "${safeUserText}".`
      : `I understand. You said "${safeUserText.split(/\s+/).slice(0, 10).join(" ")}${safeUserText.split(/\s+/).length > 10 ? "..." : ""}"`
    : "I understand.";

  return {
    source: "fallback",
    reply: isGoalOriented
      ? `${reflective} Let's focus on ${topic.toLowerCase()}. What exactly do you need help with? ${styleTail}`
      : `${reflective} Tell me a little more about ${topic.toLowerCase()}. ${styleTail}`,
    feedback: {
      grammar: "Use one complete sentence with a subject, verb, and clear idea.",
      vocabulary: "Add one more specific word or detail to sound more natural.",
      pronunciation: "Slow down slightly and stress the key content words.",
      task: isGoalOriented
        ? "State the problem, your request, and the result you want."
        : "Add one reason, feeling, or personal example to develop your answer.",
    },
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const payload = req.body || {};
  const { scenario, scenarioData, history, userText, mode, scoring, isGoalOriented } = payload;

  if (!apiKey) {
    res.status(200).json(fallbackPayload({ userText, isGoalOriented, scenarioData, scoring, mode }));
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
            content: [{ type: "input_text", text: buildSystemPrompt({ scenario, scenarioData, mode, scoring, isGoalOriented }) }],
          },
          {
            role: "user",
            content: [{ type: "input_text", text: buildUserPrompt({ history, userText }) }],
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI error ${response.status}: ${text}`);
    }

    const data = await response.json();
    const text = data.output_text || "";
    const parsed = safeJsonParse(text);

    if (!parsed?.reply) {
      res.status(200).json(fallbackPayload({ userText, isGoalOriented, scenarioData, scoring, mode }));
      return;
    }

    res.status(200).json({
      source: "ai",
      reply: parsed.reply,
      feedback: {
        grammar: parsed.feedback?.grammar || "",
        vocabulary: parsed.feedback?.vocabulary || "",
        pronunciation: parsed.feedback?.pronunciation || "",
        task: parsed.feedback?.task || "",
      },
    });
  } catch (error) {
    console.error("voice-chat api error:", error);
    res.status(200).json(fallbackPayload({ userText, isGoalOriented, scenarioData, scoring, mode }));
  }
}
