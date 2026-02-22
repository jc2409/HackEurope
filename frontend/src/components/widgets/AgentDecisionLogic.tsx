import { useMemo } from "react";
import type { PerDcRow } from "@/types";
import { STRATEGY_COLORS } from "@/constants";

interface AgentDecisionLogicProps {
  perDcData: PerDcRow[];
  playbackStep: number;
}

const ACTIONS = [
  { id: 0, label: "Dispatch", color: "#00FF9F" },
  { id: 1, label: "Defer 1h", color: "#FBBF24" },
  { id: 2, label: "Defer 4h", color: "#F43F5E" },
  { id: 3, label: "Migrate", color: "#00D4FF" },
];

export default function AgentDecisionLogic({
  perDcData,
  playbackStep,
}: AgentDecisionLogicProps) {
  // Derive action probabilities from the distribution at current step
  const actionProbs = useMemo(() => {
    const rlRows = perDcData.filter(
      (r) => r.timestep === playbackStep && r.controller === "manual_rl"
    );

    if (rlRows.length === 0) {
      return ACTIONS.map((a) => ({ ...a, prob: 0.25 }));
    }

    // Mock probabilities for now (would come from backend once action probs are exported)
    // Derive from deferred task ratio as a proxy
    const deferredCount = rlRows.reduce((s, r) => s + r.deferred_tasks_this_step, 0);
    const totalTasks = rlRows.reduce((s, r) => s + r.running_tasks_count, 0);
    const deferRatio = totalTasks > 0 ? deferredCount / totalTasks : 0;

    // Mock distribution: if deferred is high, defer actions are more likely
    return [
      { ...ACTIONS[0], prob: Math.max(0.15, 1 - deferRatio * 1.5) },
      { ...ACTIONS[1], prob: Math.min(0.5, deferRatio * 0.8) },
      { ...ACTIONS[2], prob: Math.min(0.3, deferRatio * 0.5) },
      { ...ACTIONS[3], prob: 0.05 },
    ].map((a) => ({
      ...a,
      prob: a.prob / 4.5, // Normalize to roughly sum to 1
    }));
  }, [perDcData, playbackStep]);

  const maxProb = Math.max(...actionProbs.map((a) => a.prob), 0.1);

  return (
    <div className="glass-card p-3 flex flex-col gap-2">
      <div className="text-xs font-semibold text-white/70 tracking-widest">
        AGENT DECISION
      </div>

      <div className="flex flex-col gap-1.5">
        {actionProbs.map((action) => {
          const barWidth = (action.prob / maxProb) * 100;
          const isHighest = action.prob === Math.max(...actionProbs.map((a) => a.prob));

          return (
            <div key={action.id} className="flex items-center gap-2">
              <span className="micro-label w-12 text-right text-xs">
                {action.label}
              </span>
              <div
                className="flex-1 h-2 rounded bg-slate-700 overflow-hidden transition-all duration-200"
                style={{ backgroundColor: "#30363D" }}
              >
                <div
                  className={`h-full transition-all duration-200 ${
                    isHighest ? "neon-glow-green" : ""
                  }`}
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: isHighest ? action.color : action.color + "66",
                  }}
                />
              </div>
              <span
                className="text-xs font-mono text-right w-8"
                style={{ color: action.color }}
              >
                {(action.prob * 100).toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-white/20 mt-1 text-center">
        RL Agent Confidence Distribution
      </div>
    </div>
  );
}
