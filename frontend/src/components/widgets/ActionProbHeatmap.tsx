/**
 * ActionProbHeatmap — vertical bar chart of the SAC agent's action
 * probability distribution at the current timestep.
 *
 * Action index mapping (5-DC + defer enabled checkpoint):
 *   0        = DEFER
 *   1 – n-1  = DISPATCH to DC1…DCn
 *   (no separate migrate in current env — routing to a distant DC is migration)
 *
 * We aggregate DC dispatch probs into a single "DISPATCH" bar so the chart
 * stays readable regardless of how many DCs the checkpoint was trained on.
 */

import { useEffect, useRef, useState } from "react";

interface Props {
  actionProbs: number[];
}

// ── Action grouping ────────────────────────────────────────────────────────
interface ActionGroup {
  label: string;
  sublabel: string;
  prob: number;
  color: string;
}

function groupProbs(probs: number[]): ActionGroup[] {
  if (probs.length === 0) return [];

  const defer   = probs[0] ?? 0;
  const dispatch = probs.length > 1 ? probs.slice(1).reduce((s, p) => s + p, 0) : 0;

  return [
    {
      label: "DISPATCH",
      sublabel: "route now",
      prob: dispatch,
      color: "#00FF9F",
    },
    {
      label: "DEFER",
      sublabel: "wait",
      prob: defer,
      color: "#FBBF24",
    },
  ];
}

// Entropy: H = -sum(p * log(p))  — max is log2(n) for n actions
function entropy(probs: number[]): number {
  return -probs
    .filter((p) => p > 0)
    .reduce((s, p) => s + p * Math.log2(p), 0);
}

function entropyLabel(h: number, nActions: number): { text: string; color: string } {
  const maxH = Math.log2(Math.max(nActions, 2));
  const ratio = h / maxH;
  if (ratio < 0.35) return { text: "HIGH CONFIDENCE", color: "#00FF9F" };
  if (ratio < 0.65) return { text: "MODERATE",        color: "#FBBF24" };
  return                 { text: "UNCERTAIN",          color: "#F43F5E" };
}

// ── Component ──────────────────────────────────────────────────────────────

export default function ActionProbHeatmap({ actionProbs }: Props) {
  const prevProbs = useRef<number[]>([]);
  const [pulsing, setPulsing] = useState<Set<number>>(new Set());

  // Detect significant distribution shifts and trigger pulse animation
  useEffect(() => {
    if (actionProbs.length === 0 || prevProbs.current.length === 0) {
      prevProbs.current = actionProbs;
      return;
    }

    const changed = new Set<number>();
    actionProbs.forEach((p, i) => {
      const delta = Math.abs(p - (prevProbs.current[i] ?? 0));
      if (delta > 0.05) changed.add(i);
    });

    if (changed.size > 0) {
      setPulsing(changed);
      const t = setTimeout(() => setPulsing(new Set()), 500);
      prevProbs.current = actionProbs;
      return () => clearTimeout(t);
    }
    prevProbs.current = actionProbs;
  }, [actionProbs]);

  const groups = groupProbs(actionProbs);
  const hasData = actionProbs.length > 0;
  const h = entropy(actionProbs);
  const { text: entropyText, color: entropyColor } = entropyLabel(h, actionProbs.length);
  const maxProb = Math.max(...groups.map((g) => g.prob), 0.01);

  return (
    <div className="flex flex-col gap-2 pb-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold tracking-wide" style={{ color: "#E6EDF3", fontSize: 13 }}>
          AGENT POLICY
        </div>
        {hasData && (
          <div
            className="text-xs font-mono"
            style={{ color: entropyColor, fontSize: 9, letterSpacing: "0.08em" }}
          >
            {entropyText}
          </div>
        )}
      </div>

      {!hasData ? (
        /* Placeholder — shows until live simulation runs */
        <div
          className="flex flex-col gap-1.5 items-center justify-center rounded"
          style={{
            height: 88,
            background: "rgba(22,27,34,0.5)",
            border: "1px solid #30363D",
          }}
        >
          <span style={{ color: "#8B949E", fontSize: 9, fontFamily: "Roboto Mono, monospace" }}>
            REQUIRES LIVE SIMULATION
          </span>
          <span style={{ color: "#30363D", fontSize: 8, fontFamily: "Roboto Mono, monospace" }}>
            enable live mode to see policy
          </span>
        </div>
      ) : (
        <>
          {/* Vertical bars */}
          <div className="flex items-end gap-2" style={{ height: 72 }}>
            {groups.map((g, i) => {
              const heightPct = (g.prob / maxProb) * 100;
              const isPrimary = g.prob === Math.max(...groups.map((x) => x.prob));
              const isOldIndex = i < actionProbs.length;
              const isPulsing = isOldIndex && pulsing.has(i);

              return (
                <div
                  key={g.label}
                  className="flex flex-col items-center flex-1 gap-1"
                  style={{ height: "100%" }}
                >
                  {/* Percentage label above bar */}
                  <span
                    className="font-mono"
                    style={{
                      fontSize: 9,
                      color: isPrimary ? g.color : "#8B949E",
                      transition: "color 300ms ease",
                    }}
                  >
                    {(g.prob * 100).toFixed(0)}%
                  </span>

                  {/* Bar track */}
                  <div
                    className="flex-1 w-full flex flex-col justify-end rounded overflow-hidden"
                    style={{ background: "#30363D" }}
                  >
                    <div
                      style={{
                        height: `${heightPct}%`,
                        background: isPrimary ? g.color : g.color + "55",
                        transition: "height 200ms ease-in-out, background 200ms ease",
                        boxShadow: isPrimary
                          ? `0 0 8px ${g.color}66`
                          : "none",
                        animation: isPulsing ? "bar-pulse 0.5s ease-out" : "none",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Labels below bars */}
          <div className="flex gap-2">
            {groups.map((g) => (
              <div key={g.label} className="flex flex-col items-center flex-1">
                <span
                  className="font-mono text-center"
                  style={{ fontSize: 8, color: "#8B949E", letterSpacing: "0.06em" }}
                >
                  {g.label}
                </span>
                <span
                  className="font-mono text-center"
                  style={{ fontSize: 7, color: "#4b5563" }}
                >
                  {g.sublabel}
                </span>
              </div>
            ))}
          </div>

          {/* Raw action probs (small detail row) */}
          <div className="flex gap-1 flex-wrap mt-0.5">
            {actionProbs.map((p, i) => (
              <span
                key={i}
                className="font-mono"
                style={{
                  fontSize: 7,
                  color: p === Math.max(...actionProbs) ? "#00FF9F" : "#30363D",
                  transition: "color 200ms ease",
                }}
              >
                a{i}:{(p * 100).toFixed(0)}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
