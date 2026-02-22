import { useSimStore } from "@/store/useSimStore";

const SPEEDS = [0.5, 1, 2, 4];

export default function Header() {
  const { isPlaying, setIsPlaying, speed, setSpeed, results, liveCarbon } =
    useSimStore();

  return (
    <header className="flex items-center gap-3 px-4 py-2 border-b shrink-0"
      style={{ borderColor: "#30363D", background: "#0B0E14" }}>

      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="glow-green text-base">⬡</span>
        <span className="font-semibold tracking-tight text-white/90">GreenDispatch</span>
        <span className="micro-label text-white/20 hidden sm:inline">CARBON-AWARE SCHEDULER</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Speed */}
        <div className="flex items-center gap-1">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={speed === s ? "btn-cyber" : "btn-cyber-dim"}
            >
              {s}×
            </button>
          ))}
        </div>

        {/* Play/Pause */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          disabled={!results}
          className={results ? "btn-cyber" : "btn-cyber-dim"}
          style={{ minWidth: 64 }}
        >
          {isPlaying ? "⏸ Pause" : "▶ Play"}
        </button>

        {/* Live indicator */}
        {liveCarbon?.is_live && (
          <div className="flex items-center gap-1.5">
            <div className="pulse-dot" />
            <span className="micro-label text-cyber-green/70">LIVE</span>
          </div>
        )}
      </div>
    </header>
  );
}
