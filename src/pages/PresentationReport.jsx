import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Home, CheckCircle, Loader2, ExternalLink, Volume2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { localApi } from "@/api/localClient";
import { audioManager } from "@/lib/audioManager";
import { toast } from "sonner";

const TED_TALKS = [
  {
    title: "How to speak so that people want to listen",
    author: "Julian Treasure",
    duration: "9:58",
    url: "https://www.ted.com/talks/julian_treasure_how_to_speak_so_that_people_want_to_listen",
    thumbnail: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400&q=80",
  },
  {
    title: "The secret structure of great talks",
    author: "Nancy Duarte",
    duration: "17:52",
    url: "https://www.ted.com/talks/nancy_duarte_the_secret_structure_of_great_talks",
    thumbnail: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&q=80",
  },
  {
    title: "10 ways to have a better conversation",
    author: "Celeste Headlee",
    duration: "11:52",
    url: "https://www.ted.com/talks/celeste_headlee_10_ways_to_have_a_better_conversation",
    thumbnail: "https://images.unsplash.com/photo-1560439514-4e9645039924?w=400&q=80",
  },
  {
    title: "Your body language may shape who you are",
    author: "Amy Cuddy",
    duration: "20:54",
    url: "https://www.ted.com/talks/amy_cuddy_your_body_language_may_shape_who_you_are",
    thumbnail: "https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=400&q=80",
  },
];

export default function PresentationReport() {
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [audioFailed, setAudioFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showResources, setShowResources] = useState(false);

  const fileName = sessionStorage.getItem("presentationFile");
  const duration = parseInt(sessionStorage.getItem("presentationDuration") || "0");
  const totalPages = parseInt(sessionStorage.getItem("presentationTotalPages") || "1");
  const pageTimings = JSON.parse(sessionStorage.getItem("presentationPageTimings") || "[]");
  const transcript = sessionStorage.getItem("presentationTranscriptCombined") || "";
  const pageTexts = JSON.parse(sessionStorage.getItem("presentationPdfPageTexts") || "[]");
  const pauseHistory = JSON.parse(sessionStorage.getItem("presentationPauseHistory") || "[]");
  const hasCompletedSession =
    duration > 0 ||
    pageTimings.some((value) => Number(value) > 0) ||
    transcript.trim().length > 0 ||
    pauseHistory.length > 0;

  const durationStr = `${Math.floor(duration / 60)}m ${duration % 60}s`;

  useEffect(() => {
    if (!fileName || !hasCompletedSession) {
      navigate("/presentation");
      return;
    }
    void generateReport();
  }, [fileName, hasCompletedSession, navigate]);

  const spokenFocus = useMemo(() => {
    if (!report) return "";

    const parts = [
      `Presentation report. Overall score ${report.overall_score} out of 10.`,
      report.key_takeaways?.[0] || "",
      report.key_takeaways?.[1] || "",
      report.feedback?.pdf_alignment?.improvements || "",
      report.feedback?.content?.improvements || "",
      report.suggestions?.[0] || "",
    ];

    return parts.filter(Boolean).join(" ");
  }, [report]);

  useEffect(() => {
    if (!spokenFocus) return undefined;

    audioManager.playAIVoice(spokenFocus, "female").then((ok) => {
      setAudioFailed(!ok);
    });

    return () => {
      audioManager.stop();
    };
  }, [spokenFocus]);

  const buildFallbackReport = () => ({
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
      avg_per_page: `${Math.floor((totalPages ? duration / totalPages : duration) / 60)}m ${Math.round((totalPages ? duration / totalPages : duration) % 60)}s`,
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
      "The report generator hit a problem, so this fallback summary was shown instead.",
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
  });

  const generateReport = async () => {
    try {
      const result = await localApi.integrations.Core.InvokeLLM({
        input: {
          kind: "presentation-report",
          duration,
          totalPages,
          pageTimings,
          fileName,
          transcript,
          pageTexts,
          pauseHistory,
        },
      });

      setReport(result || buildFallbackReport());
      await localApi.integrations.Core.TrackActivity({
        activity_type: "presentation_report_generated",
        file_name: fileName,
        duration_seconds: duration,
        total_pages: totalPages,
        report_summary: {
          overall_score: result?.overall_score || null,
          scores: result?.scores || null,
        },
      });
      setErrorMessage("");
    } catch (error) {
      console.error("Failed to generate presentation report:", error);
      setReport(buildFallbackReport());
      setErrorMessage("The full summary could not be generated, so a fallback summary is shown instead.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await localApi.entities.PresentationSession.create({
      file_name: fileName,
      duration_seconds: duration,
      total_pages: totalPages,
      page_timings: pageTimings,
      report,
    });
    setSaved(true);
    setSaving(false);
    toast.success("Report saved successfully!");
  };

  const handleRead = async (text) => {
    if (!text) return;
    const ok = await audioManager.playAIVoice(text, "female");
    setAudioFailed(!ok);
  };

  if (!fileName || !hasCompletedSession) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-[15px] text-muted-foreground">Generating your report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5">
        <button onClick={() => navigate("/presentation")} className="p-2 rounded-xl hover:bg-white/5">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <h2 className="font-semibold text-foreground">Presentation Summary</h2>
      </div>

      <div className="px-4 py-4 space-y-4">
        {errorMessage && (
          <div className="glass rounded-2xl px-4 py-3">
            <p className="text-[13px] text-amber-200">{errorMessage}</p>
          </div>
        )}
        <div className="px-1">
          <p className="text-[11px] text-muted-foreground">
            Source: {report?.source === "ai" ? "AI-generated" : "Fallback"}
          </p>
        </div>
        {audioFailed && (
          <p className="text-[13px] text-accent">Voice playback is unavailable right now in this browser.</p>
        )}

        {/* Overall Score */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5 text-center">
          <h3 className="text-sm font-semibold mb-2">Overall score</h3>
          <div className="text-5xl font-bold font-space text-primary">{report?.overall_score}</div>
          <p className="text-[14px] text-muted-foreground mt-1">out of 10</p>
        </motion.div>

        {report?.key_takeaways?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }} className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-sm font-semibold">What worked best</h3>
              <button
                onClick={() => handleRead(report.key_takeaways.join(" "))}
                className="flex items-center gap-1.5 text-[14px] text-primary"
              >
                <Volume2 className="w-3.5 h-3.5" />
                Listen
              </button>
            </div>
            <div className="space-y-2">
              <div className="glass rounded-xl px-3 py-2">
                <p className="text-[14px] text-muted-foreground leading-relaxed">{report.key_takeaways[0]}</p>
              </div>
              {report.key_takeaways[1] && (
                <div className="glass rounded-xl px-3 py-2">
                  <p className="text-[12px] text-muted-foreground/80">{report.key_takeaways[1]}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Detailed Scores */}
        {report?.scores && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass rounded-2xl p-4">
            <h3 className="text-sm font-semibold mb-3">Detailed scores</h3>
            <div className="space-y-2">
              {Object.entries(report.scores).map(([key, val]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-[14px] text-muted-foreground capitalize w-32">{key.replace(/_/g, " ")}</span>
                  <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-indigo-600 rounded-full"
                      style={{ width: `${val * 10}%` }}
                    />
                  </div>
                  <span className="text-[14px] font-semibold text-foreground w-8 text-right">{val}/10</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Time Analysis */}
        {report?.time_analysis && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-4">
            <h3 className="text-sm font-semibold mb-3">Pacing</h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="glass rounded-xl px-3 py-2 text-center">
                <p className="text-[14px] text-muted-foreground">Total Duration</p>
                <p className="text-sm font-semibold text-foreground">{durationStr}</p>
              </div>
              <div className="glass rounded-xl px-3 py-2 text-center">
                <p className="text-[14px] text-muted-foreground">Avg per Slide</p>
                <p className="text-sm font-semibold text-foreground">{report.time_analysis.avg_per_page}</p>
              </div>
            </div>
            {report.time_analysis.page_assessments?.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[13px] font-medium text-muted-foreground uppercase tracking-[0.14em]">Slide timing</p>
                {report.time_analysis.page_assessments.map((p, i) => (
                  <div key={i} className="glass rounded-xl px-3 py-2 flex justify-between items-center">
                    <span className="text-[14px] text-muted-foreground">Slide {p.page}</span>
                    <span className="text-[14px] text-foreground">{p.time_spent}</span>
                    <span className={`text-[14px] px-2 py-0.5 rounded-full ${
                      p.assessment?.toLowerCase().includes("good") ? "bg-success/20 text-success" :
                      p.assessment?.toLowerCase().includes("long") ? "bg-accent/20 text-accent" :
                      "bg-amber-500/20 text-amber-400"
                    }`}>
                      {p.assessment}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[14px] text-muted-foreground mt-2 italic">{report.time_analysis.recommendation}</p>
          </motion.div>
        )}

        {/* Feedback */}
        {report?.feedback && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">Fix first</h3>
              <button
                onClick={() => handleRead([
                  report.feedback?.pdf_alignment?.improvements,
                  report.feedback?.content?.improvements,
                  report.feedback?.delivery?.improvements,
                ].filter(Boolean).join(" "))}
                className="flex items-center gap-1.5 text-[14px] text-primary"
              >
                <Volume2 className="w-3.5 h-3.5" />
                Listen
              </button>
            </div>
            {Object.entries(report.feedback).slice(0, 2).map(([key, val]) => (
              <div key={key} className="glass rounded-xl p-3 space-y-1">
                <p className="text-[13px] font-medium text-foreground">{key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</p>
                {val.improvements && <p className="text-[14px] text-muted-foreground">{val.improvements}</p>}
              </div>
            ))}
          </motion.div>
        )}

        {report?.pdf_summary && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="glass rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">Content alignment</h3>
                <p className="text-[14px] text-muted-foreground mt-1 line-clamp-2">{report.pdf_summary.fileName}</p>
              </div>
              <div className="text-right">
                <p className="text-[14px] text-muted-foreground">Coverage</p>
                <p className="text-[15px] font-semibold text-foreground">{report.pdf_summary.coverageLabel}</p>
                <button
                  onClick={() => handleRead([
                    `PDF coverage ${report.pdf_summary.coverageLabel}.`,
                    report.feedback?.pdf_alignment?.strengths,
                    report.feedback?.pdf_alignment?.improvements,
                  ].filter(Boolean).join(" "))}
                  className="mt-2 ml-auto flex items-center gap-1 text-[14px] text-primary"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  Listen
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="glass rounded-xl px-3 py-2">
                <p className="text-[14px] text-muted-foreground">Key Terms</p>
                <p className="text-[14px] font-medium text-foreground mt-1 line-clamp-3">
                  {report.pdf_summary.trackedKeywords?.length ? report.pdf_summary.trackedKeywords.join(", ") : "No text extracted"}
                </p>
              </div>
              <div className="glass rounded-xl px-3 py-2">
                <p className="text-[14px] text-muted-foreground">Spoken Match</p>
                <p className="text-[14px] font-medium text-foreground mt-1 line-clamp-3">
                  {report.pdf_summary.transcriptKeywords?.length ? report.pdf_summary.transcriptKeywords.join(", ") : "No transcript captured"}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* TED Talk Recommendations */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-4">
            <h3 className="text-sm font-semibold mb-3">Next rehearsal plan</h3>
            <div className="space-y-2 mb-4">
              {report.suggestions?.slice(0, 3).map((s, i) => (
                <div key={i} className="glass rounded-xl px-3 py-2 flex gap-2">
                  <span className="text-primary font-semibold text-sm">{i + 1}.</span>
                  <p className="text-sm text-muted-foreground">{s}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowResources((value) => !value)}
              className="w-full flex items-center justify-between text-left border-t border-white/8 pt-4"
            >
              <div>
                <h3 className="text-sm font-semibold">Extra resources</h3>
                <p className="text-[13px] text-muted-foreground mt-1">Open this only if you want outside examples after reviewing your own report.</p>
              </div>
              {showResources ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {showResources && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                {TED_TALKS.map((talk, i) => (
                  <a
                    key={i}
                    href={talk.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass glass-hover rounded-xl overflow-hidden group block"
                  >
                    <div className="aspect-[4/0.62] overflow-hidden">
                      <img
                        src={talk.thumbnail}
                        alt={talk.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-2.5">
                      <p className="text-[14px] font-medium text-foreground leading-snug line-clamp-2">{talk.title}</p>
                      <p className="text-[14px] text-muted-foreground mt-1">{talk.author}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[14px] text-muted-foreground">{talk.duration}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-primary" />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
        </motion.div>

        {/* Save Status */}
        {saved && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-4 border border-success/30 flex items-center gap-2 justify-center">
            <CheckCircle className="w-4 h-4 text-success" />
            <p className="text-sm font-medium text-success">Summary Saved Successfully!</p>
          </motion.div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={saved || saving}
            className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saved ? "Saved" : "Save Summary"}
          </Button>
          <Button
            onClick={() => navigate("/presentation")}
            variant="outline"
            className="flex-1 h-12 rounded-2xl border-white/10 hover:bg-white/5"
          >
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
        </div>
      </div>
    </div>
  );
}
