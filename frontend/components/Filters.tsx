"use client";

type PptFilter = "all" | "yes" | "no";
type SourceFilter = "all" | "devpost" | "unstop" | "hackerearth";

interface Props {
  mode: string;
  query: string;
  pptFilter: PptFilter;
  sourceFilter: SourceFilter;
  onModeChange: (m: string) => void;
  onQueryChange: (q: string) => void;
  onPptChange: (p: PptFilter) => void;
  onSourceChange: (s: SourceFilter) => void;
  total?: number;
}

const MODES = ["ALL", "OFFLINE", "ONLINE", "HYBRID"];

const PPT_OPTIONS: { label: string; value: PptFilter; color: string }[] = [
  { label: "ALL ROUNDS", value: "all",  color: "#FFD600" },
  { label: "📊 WITH PPT", value: "yes", color: "#FF2E88" },
  { label: "⚡ NO PPT",   value: "no",  color: "#2EDBFF" },
];

const SOURCE_OPTIONS: { label: string; value: SourceFilter; color: string }[] = [
  { label: "ALL SOURCES",  value: "all",         color: "#FFD600" },
  { label: "DEVPOST",      value: "devpost",      color: "#FF6B35" },
  { label: "UNSTOP",       value: "unstop",       color: "#A78BFA" },
  { label: "HACKEREARTH",  value: "hackerearth",  color: "#34D399" },
];

function TabBtn({
  label, active, activeColor, onClick,
}: { label: string; active: boolean; activeColor: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="font-pixel text-[7px] px-3 py-1.5 transition-all"
      style={{
        border:      `2px solid ${active ? activeColor : "#333"}`,
        background:  active ? activeColor : "transparent",
        color:       active ? "#0B0B0B" : "#888",
        boxShadow:   active ? `2px 2px 0 ${activeColor}88` : "none",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

export default function Filters({
  mode, query, pptFilter, sourceFilter,
  onModeChange, onQueryChange, onPptChange, onSourceChange,
  total,
}: Props) {
  return (
    <div
      className="flex flex-col gap-3 p-4"
      style={{ borderBottom: "2px solid #FFD600", background: "#0d0d0d" }}
    >
      {/* Row 1: Mode + Search + Count */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Mode tabs */}
        <div className="flex gap-1">
          {MODES.map((m) => {
            const active = (mode === "" ? "ALL" : mode.toUpperCase()) === m;
            return (
              <TabBtn
                key={m}
                label={m}
                active={active}
                activeColor="#FFD600"
                onClick={() => onModeChange(m === "ALL" ? "" : m.toLowerCase())}
              />
            );
          })}
        </div>

        {/* Search input */}
        <div
          className="flex items-center flex-1 gap-2 px-3 py-1.5"
          style={{ border: "2px solid #333", maxWidth: 320, minWidth: 160 }}
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

        {total !== undefined && (
          <span className="font-mono text-cream-white text-[10px] opacity-40 ml-auto">
            {total} events
          </span>
        )}
      </div>

      {/* Row 2: Source + PPT */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Source tabs */}
        <div className="flex gap-1 flex-wrap">
          {SOURCE_OPTIONS.map(({ label, value, color }) => (
            <TabBtn
              key={value}
              label={label}
              active={sourceFilter === value}
              activeColor={color}
              onClick={() => onSourceChange(value)}
            />
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: "#333", flexShrink: 0 }} />

        {/* PPT tabs */}
        <div className="flex gap-1">
          {PPT_OPTIONS.map(({ label, value, color }) => (
            <TabBtn
              key={value}
              label={label}
              active={pptFilter === value}
              activeColor={color}
              onClick={() => onPptChange(value)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
