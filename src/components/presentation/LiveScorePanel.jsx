import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smile, Activity, Eye, AudioLines } from "lucide-react";

const METRICS = [
  { key: "expression", label: "Expression", icon: Smile, color: "text-amber-400", bar: "from-amber-400 to-orange-500" },
  { key: "posture", label: "Posture", icon: Activity, color: "text-emerald-400", bar: "from-emerald-400 to-teal-500" },
  { key: "eye_contact", label: "Eye Contact", icon: Eye, color: "text-cyan-400", bar: "from-cyan-400 to-blue-500" },
  { key: "fluency", label: "Fluency", icon: AudioLines, color: "text-violet-400", bar: "from-violet-400 to-purple-500" },
];

function getRandomScore(current, min = 55, max = 96) {
  // Drift slowly
  const delta = (Math.random() - 0.5) * 14;
  return Math.max(min, Math.min(max, Math.round(current + delta)));
}

export default function LiveScorePanel({ onScoresChange }) {
  const [scores, setScores] = useState({ expression: 72, posture: 68, eye_contact: 75, fluency: 70 });
  const [tip, setTip] = useState("");

  const TIPS = [
    "Smile naturally — it builds rapport!",
    "Keep your back straight for confidence.",
    "Look directly at the camera / audience.",
    "Vary your tone to stay engaging.",
    "Use hand gestures to emphasize points.",
    "Take a breath — slow down slightly.",
    "Maintain steady eye contact.",
    "Keep your phrasing smooth and continuous.",
  ];

  useEffect(() => {
    // Update scores every 3 seconds
    const interval = setInterval(() => {
      setScores(prev => ({
        expression: getRandomScore(prev.expression),
        posture: getRandomScore(prev.posture),
        eye_contact: getRandomScore(prev.eye_contact),
        fluency: getRandomScore(prev.fluency),
      }));
    }, 3000);

    // Rotate tips every 6 seconds
    let tipIdx = 0;
    setTip(TIPS[0]);
    const tipInterval = setInterval(() => {
      tipIdx = (tipIdx + 1) % TIPS.length;
      setTip(TIPS[tipIdx]);
    }, 6000);

    return () => { clearInterval(interval); clearInterval(tipInterval); };
  }, []);

  const avg = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 4);

  const getColor = (v) => v >= 80 ? "text-emerald-400" : v >= 60 ? "text-amber-400" : "text-accent";

  useEffect(() => {
    onScoresChange?.(scores);
  }, [onScoresChange, scores]);

  return (
    <div className="glass rounded-xl p-5 space-y-4">
      {/* Overall */}
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-semibold text-muted-foreground uppercase tracking-wide">Live Score</span>
        <motion.span
          key={avg}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          className={`text-[24px] font-bold ${getColor(avg)}`}
        >
          {avg}
        </motion.span>
      </div>

      {/* Metric bars */}
      {METRICS.map(({ key, label, icon: Icon, color, bar }) => (
        <div key={key}>
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-1">
              <Icon className={`w-3.5 h-3.5 ${color}`} />
              <span className="text-[15px] text-muted-foreground">{label}</span>
            </div>
            <span className={`text-[15px] font-semibold ${getColor(scores[key])}`}>{scores[key]}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${scores[key]}%` }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className={`h-full bg-gradient-to-r ${bar} rounded-full`}
            />
          </div>
        </div>
      ))}

      {/* Tip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tip}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.4 }}
          className="bg-primary/10 rounded-lg px-2.5 py-2"
        >
          <p className="text-[15px] text-primary/90 leading-relaxed">{tip}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
