import { useEffect, useRef } from "react";
import { useSimStore } from "@/store/useSimStore";
import { CHECKPOINT_OPTIONS } from "@/constants";
import type { StrategyId } from "@/types";

const STRATEGIES: { label: string; id: StrategyId }[] = [
  { label: "SAC RL Agent", id: "manual_rl" },
  { label: "Local Only",   id: "local_only" },
  { label: "Lowest Carbon",id: "lowest_carbon" },
];

export default function Sidebar() {
  const {
    config,
    setConfig,
    logEntries,
    clearLog,
  } = useSimStore();

  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logEntries]);

  const toggleStrategy = (id: StrategyId) => {
    const cur = config.strategies;
    const next = cur.includes(id) ? cur.filter((s) => s !== id) : [...cur, id];
    setConfig({ strategies: next as StrategyId[] });
  };

  return (
    <aside
      className="w-52 shrink-0 flex flex-col overflow-hidden neon-card"
      style={{ borderRight: "1px solid #30363D", background: "#161B22", margin: "8px 8px 0 0" }}
    >
      {/* ── Config section ────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 p-3 shrink-0">
        <div
          className="font-semibold tracking-wide text-white/80 pt-1"
          style={{ fontSize: 15 }}
        >
          CONFIG
        </div>

        {/* Strategies */}
        <div>
          <div className="micro-label mb-1.5">Strategies</div>
          <div className="flex flex-col gap-1.5">
            {STRATEGIES.map(({ label, id }) => {
              const checked = config.strategies.includes(id);
              return (
                <label key={id} className="flex items-center gap-2 cursor-pointer group">
                  <div
                    onClick={() => toggleStrategy(id)}
                    className="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all cursor-pointer"
                    style={{
                      borderColor: checked ? "#00FFA0" : "rgba(255,255,255,0.15)",
                      background: checked ? "rgba(0,255,160,0.18)" : "transparent",
                      boxShadow: checked ? "0 0 6px rgba(0,255,160,0.3)" : "none",
                    }}
                  >
                    {checked && <span className="text-cyber-green text-xs leading-none">✓</span>}
                  </div>
                  <span className="text-xs text-white/60 group-hover:text-white/90 transition-colors">
                    {label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Checkpoint */}
        <div>
          <div className="micro-label mb-1.5">RL Checkpoint</div>
          <select
            value={config.checkpointName}
            onChange={(e) => setConfig({ checkpointName: e.target.value })}
            className="w-full text-xs rounded px-2 py-1.5 focus:outline-none"
            style={{
              background: "rgba(17,19,24,0.8)",
              border: "1px solid rgba(255,255,255,0.10)",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            {CHECKPOINT_OPTIONS.map(({ display, internal }) => (
              <option key={internal} value={internal}>{display}</option>
            ))}
          </select>
        </div>

        {/* Agent log terminal — fills remaining height ─────────────── */}
      <div className="flex flex-col flex-1 min-h-0 px-3 pb-3">
        <div
          className="font-semibold tracking-wide text-white/80 pt-1 pb-2 shrink-0"
          style={{ fontSize: 15 }}
        >
          AGENT LOG
        </div>

        <div
          ref={logRef}
          className="flex-1 min-h-0 overflow-y-auto"
          style={{
            background: "rgba(22, 27, 34, 0.6)",
            border: "1px solid #30363D",
            borderRadius: 6,
            padding: "6px 8px",
            fontFamily: "Roboto Mono, monospace",
            fontSize: 10,
            lineHeight: 1.6,
            scrollbarWidth: "none",
          }}
        >
          {logEntries.length === 0 ? (
            <span style={{ color: "#8B949E" }}>
              awaiting simulation...
            </span>
          ) : (
            logEntries.map((e) => (
              <div key={e.id} className="log-entry">
                <span style={{ color: "#8B949E" }}>[{e.simTime}]</span>
                {" "}
                <span style={{ color: e.color }}>{e.text}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
