import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Mic, Monitor, Sparkles } from "lucide-react";

const ENTRY_CARDS = [
  {
    to: "/presentation",
    icon: Monitor,
    title: "Presentation Practice",
    subtitle: "Slides, rehearsal, live coaching",
    description: "Open your material, rehearse page by page, and keep your delivery steady from start to finish.",
    highlights: ["Structured flow", "Live feedback", "Session summary"],
    accent: "from-amber-500 to-orange-600",
    glow: "bg-amber-500/20",
    panel: "from-amber-400/28 via-orange-500/16 to-rose-500/8",
    border: "border-amber-300/18",
  },
  {
    to: "/voice",
    icon: Mic,
    title: "Scenario Speaking",
    subtitle: "Role-play, fluency, interaction",
    description: "Step into realistic situations and build smoother, more confident spoken English through guided exchange.",
    highlights: ["Role-based dialogue", "Smart follow-up", "Speaking feedback"],
    accent: "from-cyan-500 to-blue-600",
    glow: "bg-blue-500/20",
    panel: "from-cyan-400/24 via-blue-500/16 to-violet-500/8",
    border: "border-cyan-300/18",
  },
];

export default function MainLanding() {
  return (
    <div className="min-h-screen pb-10 relative overflow-hidden bg-[#171717]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-x-[10%] top-[-8%] h-[30%] rounded-full bg-violet-500/26 blur-[82px]" />
        <div className="absolute inset-x-[14%] top-[14%] h-[34%] rounded-full bg-indigo-400/18 blur-[84px]" />
        <div className="absolute inset-x-[22%] top-[34%] h-[20%] rounded-full bg-cyan-400/12 blur-[90px]" />
        <div className="absolute inset-x-[14%] bottom-[10%] h-[28%] rounded-full bg-amber-400/22 blur-[78px]" />
        <div className="absolute inset-x-[6%] bottom-[-10%] h-[26%] rounded-full bg-violet-500/12 blur-[88px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04),rgba(0,0,0,0)_60%)]" />
      </div>

      <div className="relative px-4 pt-4 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-[30px] px-5 pt-5 pb-6 overflow-hidden"
        >
          <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[44px] leading-none font-bold font-space tracking-[-0.04em] text-foreground">
                Speak Now
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 pt-1">
          {ENTRY_CARDS.map(({ to, icon: Icon, title, subtitle, description, highlights, accent, glow, panel, border }, index) => (
            <motion.div
              key={to}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * (index + 1) }}
            >
              <Link to={to} className="block">
                <div className={`glass rounded-[30px] p-5 relative overflow-hidden min-h-[270px] bg-gradient-to-b ${panel} ${border}`}>
                  <div className={`absolute inset-0 ${glow}`} />
                  <div className="absolute right-[-12%] top-[-8%] w-40 h-40 rounded-full bg-white/8 blur-3xl" />
                  <div className="relative h-full flex flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-14 h-14 rounded-[20px] bg-gradient-to-br ${accent} flex items-center justify-center shadow-lg`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-[12px] uppercase tracking-[0.18em] text-foreground/55">{subtitle}</p>
                          <div className={`mt-2 w-16 h-1 rounded-full bg-gradient-to-r ${accent}`} />
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
                        <ChevronRight className="w-5 h-5 text-foreground/70" />
                      </div>
                    </div>

                    <div className="mt-8">
                      <h2 className="text-[28px] leading-tight font-semibold font-space text-foreground">{title}</h2>
                      <p className="text-[15px] text-foreground/78 mt-3 leading-relaxed max-w-[26rem]">
                        {description}
                      </p>
                    </div>

                    <div className="mt-auto pt-6 flex flex-wrap gap-2">
                      {highlights.map((item) => (
                        <span key={item} className="rounded-full bg-white/10 px-3 py-1.5 text-[13px] text-foreground/86">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
