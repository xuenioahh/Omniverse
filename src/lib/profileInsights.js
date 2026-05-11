function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatScore(value) {
  if (!Number.isFinite(value)) return "-";
  return value >= 10 ? Math.round(value).toString() : value.toFixed(1);
}

function mostFrequent(items) {
  const counts = items.reduce((acc, item) => {
    if (!item) return acc;
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
}

function flattenVoiceScores(voiceSessions) {
  return voiceSessions.flatMap((session) => {
    const scores = session.report?.scores || {};
    return Object.entries(scores).map(([name, value]) => ({
      name,
      value: Number(value) || 0,
    }));
  });
}

function flattenPresentationScores(presentationSessions) {
  return presentationSessions.flatMap((session) => {
    const scores = session.report?.scores || {};
    return Object.entries(scores).map(([name, value]) => ({
      name: `presentation_${name}`,
      value: Number(value) || 0,
    }));
  });
}

export function buildProfileInsights({ voiceSessions, presentationSessions, activityRecords = [] }) {
  const totalSessions = voiceSessions.length + presentationSessions.length;
  const allScores = [
    ...flattenVoiceScores(voiceSessions),
    ...flattenPresentationScores(presentationSessions),
  ];
  const byMetric = allScores.reduce((acc, item) => {
    if (!acc[item.name]) acc[item.name] = [];
    acc[item.name].push(item.value);
    return acc;
  }, {});

  const metricAverages = Object.entries(byMetric)
    .map(([name, values]) => ({ name, value: average(values) }))
    .sort((a, b) => b.value - a.value);

  const strongestMetric = metricAverages[0];
  const weakestMetric = metricAverages[metricAverages.length - 1];
  const recentVoice = voiceSessions.slice(0, 5);
  const recentPresentation = presentationSessions.slice(0, 5);
  const recentAverage = average(
    [
      ...recentVoice.map((session) => Number(session.report?.totalScore) || 0),
      ...recentPresentation.map((session) => Number(session.report?.overall_score) || 0),
    ]
      .filter(Boolean)
  );

  const profileTone = totalSessions >= 8
    ? "Consistent learner"
    : totalSessions >= 3
      ? "Developing speaker"
      : "New learner";
  const totalActivities = activityRecords.length + totalSessions;
  const latestActivity = activityRecords[0]?.activity_type || "";

  const focusMode = mostFrequent(voiceSessions.map((session) => session.mode));
  const frequentScenario = mostFrequent(voiceSessions.map((session) => session.scenario));
  const frequentPresentation = mostFrequent(presentationSessions.map((session) => session.file_name));
  const averageWords = average(
    voiceSessions.map((session) => Number(session.words_spoken) || 0).filter(Boolean)
  );
  const averageDuration = average(
    [...voiceSessions, ...presentationSessions]
      .map((session) => Number(session.duration_seconds) || 0)
      .filter(Boolean)
  );

  const strengths = [
    strongestMetric ? `${strongestMetric.name} is your most stable speaking strength.` : "Build more sessions to surface a stable strength.",
    averageWords >= 60 ? "You are producing enough language to sustain longer exchanges." : "Your sessions stay concise, which helps clarity in shorter tasks.",
    recentAverage >= 7 ? "Recent sessions show generally solid speaking control." : "Recent sessions show clear room for improvement and good training value.",
  ];

  const focusAreas = [
    weakestMetric ? `${weakestMetric.name} is the weakest scoring area right now.` : "Add more saved speaking sessions to identify the weakest skill area.",
    averageWords < 50 ? "Expand each answer with one reason and one concrete detail." : "Work on quality and precision, not only answer length.",
    focusMode === "advanced" ? "Keep advanced answers organized so complexity does not reduce clarity." : "Try more advanced mode sessions to stretch fluency and vocabulary.",
  ];

  return {
    profileTone,
    totalSessions,
    totalActivities,
    latestActivity: latestActivity || "Not enough data",
    recentAverage: formatScore(recentAverage),
    strongestMetric: strongestMetric?.name?.replace(/^presentation_/, "") || "Not enough data",
    weakestMetric: weakestMetric?.name?.replace(/^presentation_/, "") || "Not enough data",
    frequentScenario: frequentScenario || frequentPresentation || "Not enough data",
    focusMode: focusMode || "Not enough data",
    averageWords: Math.round(averageWords || 0),
    averageDurationMinutes: averageDuration ? (averageDuration / 60).toFixed(1) : "0.0",
    strengths,
    focusAreas,
  };
}

export function buildVoiceHistorySummary(sessions) {
  const savedSessions = Array.isArray(sessions) ? sessions : [];
  const totals = savedSessions
    .map((session) => Number(session.report?.totalScore) || 0)
    .filter(Boolean);
  const avgTotal = average(totals);

  const latestThree = savedSessions.slice(0, 3);
  const latestReviews = latestThree
    .flatMap((session) => session.report?.conversation_review || [])
    .slice(0, 4);
  const latestSuggestions = latestThree
    .flatMap((session) => session.report?.suggestions || [])
    .slice(0, 4);

  const metricScores = flattenVoiceScores(savedSessions).reduce((acc, item) => {
    if (!acc[item.name]) acc[item.name] = [];
    acc[item.name].push(item.value);
    return acc;
  }, {});

  const rankedMetrics = Object.entries(metricScores)
    .map(([name, values]) => ({ name, value: average(values) }))
    .sort((a, b) => b.value - a.value);

  return {
    averageTotal: formatScore(avgTotal),
    bestMetric: rankedMetrics[0]?.name || "Not enough data",
    weakestMetric: rankedMetrics[rankedMetrics.length - 1]?.name || "Not enough data",
    latestReviews,
    latestSuggestions,
  };
}
