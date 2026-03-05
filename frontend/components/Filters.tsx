"use client";

interface Props {
  mode: string;
  query: string;
  onModeChange: (m: string) => void;
  onQueryChange: (q: string) => void;
  total?: number;
}

const MODES = ["ALL", "OFFLINE", "ONLINE", "HYBRID"];

export default function Filters({ mode, query, onModeChange, onQueryChange, total }: Props) {
  return (
    <div
      className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4"
      style={{ borderBottom: "2px solid #FFD600", background: "#0d0d0d" }}
    >
      {/* Mode tabs */}
      <div className="flex gap-1">
        {MODES.map((m) => {
          const active = (mode === "" ? "ALL" : mode.toUpperCase()) === m;
          return (
            <button
              key={m}
              onClick={() => onModeChange(m === "ALL" ? "" : m.toLowerCase())}
              className="font-pixel text-[7px] px-3 py-1.5 transition-all"
              style={{
                border: active ? "2px solid #FFD600" : "2px solid #333",
                background: active ? "#FFD600" : "transparent",
                color: active ? "#0B0B0B" : "#888",
                boxShadow: active ? "2px 2px 0 #cc9f00" : "none",
                cursor: "pointer",
              }}
            >
              {m}
            </button>
          );
        })}
      </div>

      {/* Search input */}
      <div
        className="flex items-center flex-1 gap-2 px-3 py-1.5"
        style={{ border: "2px solid #333", maxWidth: 360 }}
      >
        <span className="font-mono text-cream-white text-[11px] opacity-40">{">"}</span>
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search hackathons..."
          className="bg-transparent font-mono text-cream-white text-[11px] w-full outline-none placeholder-gray-600"
        />
      </div>

      {/* Count */}
      {total !== undefined && (
        <span className="font-mono text-cream-white text-[10px] opacity-40 ml-auto">
          {total} events
        </span>
      )}
    </div>
  );
}
