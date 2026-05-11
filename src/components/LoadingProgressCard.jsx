import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const DEFAULT_STEPS = [
  "Preparing your data",
  "Analyzing content",
  "Building feedback",
  "Finalizing summary",
];

export default function LoadingProgressCard({
  title = "Loading",
  description = "Please wait a moment...",
  steps = DEFAULT_STEPS,
  durationMs = 9000,
}) {
  const safeSteps = useMemo(() => (Array.isArray(steps) && steps.length ? steps : DEFAULT_STEPS), [steps]);
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    setProgress(8);
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const ratio = Math.min(elapsed / Math.max(durationMs, 1000), 1);
      const eased = 8 + ratio * 84;
      setProgress((current) => (eased > current ? Math.min(92, eased) : current));
    }, 180);

    return () => window.clearInterval(timer);
  }, [durationMs, steps]);

  const activeStepIndex = Math.min(
    safeSteps.length - 1,
    Math.max(0, Math.floor((progress / 100) * safeSteps.length)),
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg glass rounded-[28px] border border-white/8 p-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <p className="text-[14px] text-muted-foreground mt-1">{description}</p>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-[12px] text-muted-foreground mb-2">
            <span>{safeSteps[activeStepIndex]}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-white/8 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400"
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeOut", duration: 0.2 }}
            />
          </div>
        </div>

        <div className="mt-5 space-y-2">
          {safeSteps.map((step, index) => {
            const isDone = index < activeStepIndex;
            const isActive = index === activeStepIndex;
            return (
              <div key={step} className="flex items-center gap-3">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    isDone ? "bg-emerald-400" : isActive ? "bg-primary" : "bg-white/15"
                  }`}
                />
                <p
                  className={`text-[13px] ${
                    isDone || isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step}
                </p>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
