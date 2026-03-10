"use client";
import { useState } from "react";

export type PptFilter    = "all" | "yes" | "no";
export type SourceFilter = "all" | "devpost" | "unstop" | "hackerearth";
export type ModeFilter   = "" | "online" | "offline" | "hybrid";

export interface ActiveFilters {
  mode:      ModeFilter;
  source:    SourceFilter;
  ppt:       PptFilter;
  query:     string;
}

interface Props {
  filters:   ActiveFilters;
  total?:    number;
  onChange:  (f: ActiveFilters) => void;
  onReset:   () => void;
}

// ── helpers ──────────────────────────────────────────────────────────────────
function PillBtn({
  label, active, color = "#FFD600", onClick,
}: { label: string; active: boolean; color?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="font-pixel text-[7px] px-2.5 py-1.5 transition-all"
      style={{
        border: `2px solid ${active ? color : "#333"}`,
        background: active ? color : "transparent",
        color: active ? "#0B0B0B" : "#888",
        boxShadow: active ? `2px 2px 0 ${color}66` : "none",
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-pixel text-[6px] uppercase opacity-40 text-cream-white tracking-widest">
        {title}
      </span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

// ── mode options ──────────────────────────────────────────────────────────────
const MODES: { label: string; value: ModeFilter; color: string }[] = [
  { label: "ALL",     value: "",        color: "#FFD600" },
  { label: "ONLINE",  value: "online",  color: "#2EDBFF" },
  { label: "OFFLINE", value: "offline", color: "#FFD600" },
  { label: "HYBRID",  value: "hybrid",  color: "#FF2E88" },
];

// ── source options (Devpost / Unstop / HackerEarth) ──────────────────────────
const SOURCES: { label: string; value: SourceFilter; color: string }[] = [
  { label: "ALL SOURCES",  value: "all",        color: "#FFD600" },
  { label: "DEVPOST",      value: "devpost",     color: "#FF6B35" },
  { label: "UNSTOP",       value: "unstop",      color: "#A78BFA" },
  { label: "HACKEREARTH",  value: "hackerearth", color: "#34D399" },
];

// ── PPT options ───────────────────────────────────────────────────────────────
const PPT_OPTS: { label: string; value: PptFilter; color: string }[] = [
  { label: "ALL ROUNDS", value: "all", color: "#FFD600" },
  { label: "📊 WITH PPT", value: "yes", color: "#FF2E88" },
  { label: "⚡ NO PPT",   value: "no",  color: "#2EDBFF" },
];

// ── active filter count ───────────────────────────────────────────────────────
function countActive(f: ActiveFilters) {
  let n = 0;
  if (f.mode)       n++;
  if (f.source !== "all") n++;
  if (f.ppt  !== "all")   n++;
  if (f.query)      n++;
  return n;
}

// ── main component ────────────────────────────────────────────────────────────
export default function Filters({ filters, total, onChange, onReset }: Props) {
  const [open, setOpen] = useState(false);
  const active = countActive(filters);

  const set = (patch: Partial<ActiveFilters>) => onChange({ ...filters, ...patch });

  return (
    <div
      className="sticky top-0 z-30"
      style={{ background: "#0d0d0d", borderBottom: "2px solid #FFD600" }}
    >
      {/* ── Top bar ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Search */}
        <div
          className="flex items-center flex-1 gap-2 px-3 py-1.5"
          style={{ border: "2px solid #333", maxWidth: 360 }}
        >
          <span className="font-mono text-cream-white text-[11px] opacity-40">{">"}</span>
          <input
            type="text"
            value={filters.query}
            onChange={(e) => set({ query: e.target.value })}
            placeholder="Search hackathons..."
            className="bg-transparent font-mono text-cream-white text-[11px] w-full outline-none placeholder-gray-600"
          />
          {filters.query && (
            <button
              onClick={() => set({ query: "" })}
              className="font-mono text-hot-pink text-[11px] opacity-60 hover:opacity-100"
            >
              ×
            </button>
          )}
        </div>

        {/* Filters toggle button */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="font-pixel text-[7px] px-3 py-1.5 flex items-center gap-2 transition-all"
          style={{
            border: `2px solid ${open || active > 0 ? "#FFD600" : "#444"}`,
            color: open || active > 0 ? "#FFD600" : "#888",
            background: open ? "rgba(255,214,0,0.08)" : "transparent",
            cursor: "pointer",
          }}
        >
          {open ? "▲ FILTERS" : "▼ FILTERS"}
          {active > 0 && (
            <span
              className="font-pixel text-[6px] px-1.5 py-0.5"
              style={{ background: "#FF2E88", color: "#0B0B0B" }}
            >
              {active}
            </span>
          )}
        </button>

        {/* Quick mode pills */}
        <div className="hidden sm:flex gap-1">
          {MODES.map(({ label, value, color }) => (
            <PillBtn
              key={value}
              label={label}
              active={filters.mode === value}
              color={color}
              onClick={() => set({ mode: value })}
            />
          ))}
        </div>

        {/* Total count */}
        {total !== undefined && (
          <span className="font-mono text-cream-white text-[10px] opacity-40 ml-auto shrink-0">
            {total.toLocaleString()} events
          </span>
        )}
      </div>

      {/* ── Expanded panel ────────────────────────────────────────────── */}
      {open && (
        <div
          className="border-t grid grid-cols-1 gap-5 px-5 py-4"
          style={{ borderColor: "#222", background: "#111" }}
        >
          {/* Mode (shown on mobile only — desktop uses quick pills) */}
          <div className="sm:hidden">
            <Section title="Format">
              {MODES.map(({ label, value, color }) => (
                <PillBtn key={value} label={label} active={filters.mode === value} color={color}
                  onClick={() => set({ mode: value })} />
              ))}
            </Section>
          </div>

          {/* Source */}
          <Section title="Platform">
            {SOURCES.map(({ label, value, color }) => (
              <PillBtn key={value} label={label} active={filters.source === value} color={color}
                onClick={() => set({ source: value })} />
            ))}
          </Section>

          {/* PPT round */}
          <Section title="Rounds">
            {PPT_OPTS.map(({ label, value, color }) => (
              <PillBtn key={value} label={label} active={filters.ppt === value} color={color}
                onClick={() => set({ ppt: value })} />
            ))}
          </Section>

          {/* Reset */}
          {active > 0 && (
            <div>
              <button
                onClick={onReset}
                className="font-pixel text-[7px] px-3 py-1.5 transition-all"
                style={{
                  border: "2px solid #FF2E88",
                  color: "#FF2E88",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                CLEAR ALL FILTERS
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
