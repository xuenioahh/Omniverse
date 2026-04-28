import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, History } from "lucide-react";
import { SCENARIOS } from "@/lib/scenarios";
import ScenarioCard from "@/components/voice/ScenarioCard";
import ModeSelector from "@/components/voice/ModeSelector";
import BottomNav from "@/components/BottomNav";

export default function Home() {
  const navigate = useNavigate();
  const [selectedScenario, setSelectedScenario] = useState(null);

  const handleModeComplete = (selections) => {
    const params = new URLSearchParams({
      scenario: selectedScenario.id,
      mode: selections.mode,
      dialogMode: selections.dialogMode,
      scoring: selections.scoringStandard,
    });
    navigate(`/voice/setup?${params.toString()}`);
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-space text-foreground">SpeakNow</h1>
            <p className="text-sm text-muted-foreground">Practice English Speaking</p>
          </div>
        </motion.div>
      </div>

      {/* Section Title */}
      <div className="px-5 mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Choose a Scenario</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Pick a real-life situation to practice your English
          </p>
        </div>
        <Link
          to="/voice/history"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors glass rounded-xl px-3 py-2"
        >
          <History className="w-3.5 h-3.5" />
          History
        </Link>
      </div>

      {/* Scenario Grid - 12 cards filling the screen */}
      <div className="px-4 grid grid-cols-3 gap-3">
        {SCENARIOS.map((scenario, i) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            index={i}
            onClick={() => setSelectedScenario(scenario)}
          />
        ))}
      </div>

      {/* Mode Selector Overlay */}
      {selectedScenario && (
        <ModeSelector
          scenario={selectedScenario}
          onComplete={handleModeComplete}
          onBack={() => setSelectedScenario(null)}
        />
      )}

      <BottomNav />
    </div>
  );
}
