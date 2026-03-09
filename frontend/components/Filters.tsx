"use client";

type PptFilter = "all" | "yes" | "no";

interface Props {
  mode: string;
  query: string;
  pptFilter: PptFilter;
  onModeChange: (m: string) => void;
  onQueryChange: (q: string) => void;
  onPptChange: (p: PptFilter) => void;
  total?: number;
}

const MODES = ["ALL", "OFFLINE", "ONLINE", "HYBRID"];
const PPT_OPTIONS: { label: string; value: PptFilter }[] = [
  { label: "ALL ROUNDS", value: "all" },
  { label: "📊 WITH PPT", value: "yes" },
  { label: "⚡ NO PPT",   value: "no"  },
];

export default function Filters({
  mode, query, pptFilter,
  onModeChange, onQueryChange, onPptChange,
  total,
}: Props) {
  const activeStyle = {
    border: "2px solid #FFD600",
    background: "#FFD600",
    color: "#0B0B0B",
    boxShadow: "2px 2px 0 #cc9f00",
    cursor: "pointer",
  };
  const inactiveStyle = {
    border: "2px solid #333",
    background: "transparent",
    color: "#888",
    boxShadow: "none",
    cursor: "pointer",
  };

  return (
    <div
      className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 p-4"
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
              style={active ? activeStyle : inactiveStyle}
            >
              {m}
            </button>
          );
        })}
      </div>

      {/* PPT filter tabs */}
      <div className="flex gap-1">
        {PPT_OPTIONS.map(({ label, value }) => {
          const active = pptFilter === value;
          return (
            <button
              key={value}
              onClick={() => onPptChange(value)}
              className="font-pixel text-[7px] px-3 py-1.5 transition-all"
              style={active ? { ...activeStyle, background: active && value === "yes" ? "#FF2E88" : active && value === "no" ? "#2EDBFF" : "#FFD600", border: active && value === "yes" ? "2px solid #FF2E88" : active && value === "no" ? "2px solid #2EDBFF" : "2px solid #FFD600", boxShadow: active && value === "yes" ? "2px 2px 0 #99004d" : active && value === "no" ? "2px 2px 0 #007a99" : "2px 2px 0 #cc9f00" } : inactiveStyle}
            >
              {label}
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
