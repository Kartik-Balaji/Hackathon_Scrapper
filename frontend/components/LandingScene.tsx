"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { HackEvent } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";

const GlobeView = dynamic(() => import("./GlobeView"), { ssr: false });

// ── Types ───────────────────────────────────────────────────────────────────
interface Props {
  events: HackEvent[];      // lat/lng-filtered, used for GlobeView
  listEvents?: HackEvent[]; // all events (incl. online-only), used for ChannelList
  onSelectEvent: (event: HackEvent) => void;
  lastUpdated?: string | null;
}

const CHANNELS = [
  { id: 1, label: "GLOBE RADAR", icon: "🌍" },
  { id: 2, label: "EVENT LIST",  icon: "📋" },
] as const;

// ── Globe pin colours (same as GlobeView) ──────────────────────────────────
const MODE_COLORS: Record<string, string> = {
  offline: "#FFD600",
  hybrid:  "#FF2E88",
  online:  "#2EDBFF",
};

// ── Compact list rendered inside the monitor screen ────────────────────────
function ChannelList({
  events,
  onSelectEvent,
}: {
  events: HackEvent[];
  onSelectEvent: (e: HackEvent) => void;
}) {
  const [filter, setFilter] = useState<"all" | "online" | "offline" | "hybrid">("all");
  const [search, setSearch] = useState("");
  const [pptFilter, setPptFilter] = useState<"all" | "yes" | "no">("all");

  const filtered = events.filter((e) => {
    if (filter !== "all" && e.mode !== filter) return false;
    if (pptFilter === "yes" && !e.has_ppt_round) return false;
    if (pptFilter === "no" && e.has_ppt_round) return false;
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const fmt = (d: string | null | undefined) => {
    if (!d) return "?";
    try {
      return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return "?";
    }
  };

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "10px 12px",
        overflow: "hidden",
      }}
    >
      {/* Search + filter row */}
      <div style={{ display: "flex", gap: 6, marginBottom: 8, flexShrink: 0, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          placeholder="SEARCH EVENTS..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 120,
            background: "transparent",
            border: "1px solid var(--accent1)",
            color: "var(--text)",
            fontFamily: '"Share Tech Mono", monospace',
            fontSize: 9, padding: "4px 8px", outline: "none",
          }}
        />
        {(["all", "online", "offline", "hybrid"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              fontFamily: '"Press Start 2P", monospace', fontSize: 6, padding: "4px 7px",
              border: `2px solid ${filter === f ? "var(--accent1)" : "var(--text-dim)"}`,
              color: filter === f ? "var(--bg)" : "var(--text-dim)",
              background: filter === f ? "var(--accent1)" : "transparent",
              cursor: "pointer",
              boxShadow: filter === f ? "3px 3px 0 var(--accent3)" : "2px 2px 0 rgba(0,0,0,0.3)",
              transform: filter === f ? "translate(-1px,-1px)" : "none",
              transition: "all 0.1s",
            }}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* PPT filter row */}
      <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
        {([
          { label: "ALL",  value: "all" },
          { label: "📊 PPT", value: "yes" },
          { label: "⚡ NO PPT", value: "no" },
        ] as const).map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setPptFilter(value)}
            style={{
              fontFamily: '"Press Start 2P", monospace', fontSize: 6, padding: "4px 7px",
              border: `2px solid ${pptFilter === value ? (value === "yes" ? "#FF2E88" : value === "no" ? "#2EDBFF" : "var(--accent1)") : "var(--text-dim)"}`,
              color: pptFilter === value ? "var(--bg)" : "var(--text-dim)",
              background: pptFilter === value ? (value === "yes" ? "#FF2E88" : value === "no" ? "#2EDBFF" : "var(--accent1)") : "transparent",
              cursor: "pointer",
              boxShadow: pptFilter === value ? "3px 3px 0 rgba(0,0,0,0.4)" : "2px 2px 0 rgba(0,0,0,0.3)",
              transform: pptFilter === value ? "translate(-1px,-1px)" : "none",
              transition: "all 0.1s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Scrollable event list */}
      <div style={{ flex: 1, overflowY: "auto", paddingRight: 4 }}>
        {filtered.length === 0 ? (
          <p style={{ color: "var(--text-dim)", fontFamily: '"Press Start 2P", monospace', fontSize: 7, textAlign: "center", marginTop: 32 }}>
            NO EVENTS FOUND
          </p>
        ) : (
          filtered.map((ev) => (
            <div
              key={ev.id}
              onClick={() => onSelectEvent(ev)}
              style={{
                display: "flex", gap: 10, marginBottom: 5, padding: "7px 10px",
                border: "1px solid var(--text-dim)", background: "var(--surface)",
                cursor: "pointer", transition: "border-color 0.1s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent1)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--text-dim)")}
            >
              {/* Mode dot + PPT badge */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flexShrink: 0 }}>
                <div style={{
                  width: 8, height: 8,
                  background: MODE_COLORS[ev.mode ?? "online"] ?? "#2EDBFF",
                  boxShadow: `0 0 5px ${MODE_COLORS[ev.mode ?? "online"] ?? "#2EDBFF"}`,
                }} />
                {ev.has_ppt_round && (
                  <div style={{
                    width: 8, height: 8, background: "#FF2E88",
                    boxShadow: "0 0 4px #FF2E88",
                    fontSize: 5, display: "flex", alignItems: "center", justifyContent: "center",
                  }} title="Has PPT round" />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontFamily: '"Share Tech Mono", monospace', fontSize: 10, color: "var(--text)",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 2,
                }}>
                  {ev.name}
                </p>
                <p style={{ fontSize: 9, color: "var(--text-dim)", fontFamily: '"Share Tech Mono", monospace' }}>
                  {ev.location_raw} · {fmt(ev.start_date)}–{fmt(ev.end_date)}
                  {ev.prize_pool ? ` · ${ev.prize_pool}` : ""}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <p style={{ fontSize: 8, color: "var(--text-dim)", fontFamily: '"Share Tech Mono", monospace', flexShrink: 0, marginTop: 5 }}>
        {filtered.length} / {events.length} EVENTS SHOWN
      </p>
    </div>
  );
}

// ── TV-static flash overlay on channel change ──────────────────────────────
function StaticFlash() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0.6, 0.85, 0.2, 0] }}
      transition={{ duration: 0.4, times: [0, 0.05, 0.2, 0.4, 0.75, 1] }}
      style={{
        position: "absolute", inset: 0, zIndex: 100, pointerEvents: "none",
        backgroundImage:
          "repeating-linear-gradient(0deg,rgba(255,255,255,0.06) 0px,rgba(255,255,255,0.06) 1px,transparent 1px,transparent 3px)",
        backgroundColor: "rgba(255,255,255,0.3)",
      }}
    />
  );
}

// ── Inline theme toggle ────────────────────────────────────────────────────
function ThemeBtn() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      title="Toggle theme"
      style={{
        fontFamily: '"Press Start 2P", monospace', fontSize: 6, padding: "4px 8px",
        border: "2px solid var(--accent1)", color: "var(--accent1)",
        background: "transparent", cursor: "pointer", letterSpacing: "0.05em",
        boxShadow: "2px 2px 0 var(--accent1)",
        transition: "all 0.12s",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--accent1)";
        e.currentTarget.style.color = "var(--bg)";
        e.currentTarget.style.boxShadow = "3px 3px 0 var(--accent3)";
        e.currentTarget.style.transform = "translate(-1px,-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "var(--accent1)";
        e.currentTarget.style.boxShadow = "2px 2px 0 var(--accent1)";
        e.currentTarget.style.transform = "none";
      }}
    >
      {theme === "dark" ? "☀ LIGHT" : "☾ DARK"}
    </button>
  );
}

// ── Channel nav button ─────────────────────────────────────────────────────
function ChanBtn({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: '"Press Start 2P", monospace', fontSize: 6, padding: "5px 10px",
        border: `2px solid ${active ? "var(--accent3)" : "var(--text-dim)"}`,
        color: active ? "var(--accent3)" : "var(--bg)",
        background: active ? "var(--accent3)" : "var(--text-dim)",
        cursor: "pointer",
        boxShadow: active ? "3px 3px 0 var(--accent1)" : "2px 2px 0 rgba(0,0,0,0.4)",
        transform: active ? "translate(-1px,-1px)" : "none",
        transition: "all 0.1s",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.boxShadow = "3px 3px 0 rgba(0,0,0,0.5)";
          e.currentTarget.style.transform = "translate(-1px,-1px)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.boxShadow = "2px 2px 0 rgba(0,0,0,0.4)";
          e.currentTarget.style.transform = "none";
        }
      }}
    >
      {label}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function LandingScene({ events, listEvents, onSelectEvent, lastUpdated }: Props) {
  const allEvents = listEvents && listEvents.length > 0 ? listEvents : events;
  const [channel, setChannel] = useState(1);
  const [flashing, setFlashing] = useState(false);

  const switchTo = (next: number) => {
    if (flashing || next === channel) return;
    setFlashing(true);
    setTimeout(() => {
      setChannel(next);
      setTimeout(() => setFlashing(false), 50);
    }, 200);
  };

  const timeStr = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "--:--";

  const ch = CHANNELS.find((c) => c.id === channel)!;

  return (
    <section
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: "24px 16px",
      }}
    >
      {/* ── Monitor shell ──────────────────────────────────────────── */}
      <motion.div
        animate={{ maxWidth: channel === 1 ? 1280 : 900 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        style={{
          width: "min(calc(100vw - 32px), 100%)",
          background: "var(--monitor-bg)",
          border: "3px solid var(--accent1)",
          boxShadow: "6px 6px 0 var(--accent1)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          aspectRatio: "900 / 580",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "6px 14px", borderBottom: "2px solid var(--accent1)",
            background: "var(--header-bg)", flexShrink: 0, gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              border: "2px solid var(--accent1)", width: 26, height: 26,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
            }}>
              {ch.icon}
            </div>
            <div>
              <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: "var(--accent1)", letterSpacing: "0.05em" }}>
                HACKATHON GLOBE RADAR
              </span>
              <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: "var(--text-dim)", display: "block", marginTop: 2 }}>
                CH {String(channel).padStart(2, "0")} · {ch.label}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <span style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: 9, color: "var(--text-dim)" }}>
              {timeStr}
            </span>
            <ThemeBtn />
            <div style={{ display: "flex", gap: 5 }}>
              {(["var(--accent1)", "var(--accent3)", "var(--accent2)"] as const).map((c, i) => (
                <div key={i} style={{ width: 8, height: 8, background: c, boxShadow: `0 0 5px ${c}`, animation: `blink ${1.1 + i * 0.35}s step-end infinite` }} />
              ))}
            </div>
          </div>
        </div>

        {/* Body: screen + sidebar */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* Screen area */}
          <div
            style={{
              position: "relative", flex: 1,
              background: "var(--screen-bg)",
              borderRight: "2px solid var(--accent1)",
              overflow: "hidden",
            }}
          >
            <div className="absolute inset-0 scanlines pointer-events-none z-10 opacity-20" />

            {/* Corner brackets */}
            {(["top-0 left-0 border-t-2 border-l-2", "top-0 right-0 border-t-2 border-r-2",
               "bottom-0 left-0 border-b-2 border-l-2", "bottom-0 right-0 border-b-2 border-r-2"] as const)
              .map((cls, i) => (
                <div key={i} className={`absolute w-5 h-5 ${cls} z-20 pointer-events-none`}
                  style={{ borderColor: "var(--accent1)" }} />
              ))}

            {flashing && <StaticFlash />}

            <AnimatePresence mode="wait">
              <motion.div
                key={`ch-${channel}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ position: "absolute", inset: 0 }}
              >
                {channel === 1 ? (
                  <GlobeView events={events} onSelectEvent={onSelectEvent} interactive />
                ) : (
                  <ChannelList events={allEvents} onSelectEvent={onSelectEvent} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div style={{
            width: 150, padding: "12px 10px", background: "var(--header-bg)",
            display: "flex", flexDirection: "column", gap: 10, flexShrink: 0,
          }}>
            {/* Channel list */}
            <div>
              <p style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: "var(--accent1)", borderBottom: "1px solid var(--text-dim)", paddingBottom: 6, marginBottom: 8 }}>
                CHANNELS
              </p>
              {CHANNELS.map((c) => (
                <div
                  key={c.id}
                  onClick={() => switchTo(c.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", marginBottom: 4,
                    border: `2px solid ${c.id === channel ? "var(--accent1)" : "transparent"}`,
                    cursor: "pointer", transition: "border-color 0.15s",
                    background: c.id === channel ? "rgba(128,128,128,0.08)" : "transparent",
                  }}
                >
                  <span style={{ fontSize: 11 }}>{c.icon}</span>
                  <div>
                    <p style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: c.id === channel ? "var(--accent1)" : "var(--text-dim)" }}>
                      CH {String(c.id).padStart(2, "0")}
                    </p>
                    <p style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: 8, color: "var(--text-dim)", marginTop: 2 }}>
                      {c.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div>
              <p style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: "var(--accent1)", borderBottom: "1px solid var(--text-dim)", paddingBottom: 6, marginBottom: 8 }}>
                LEGEND
              </p>
              {[
                { label: "OFFLINE", color: "#FFD600" },
                { label: "HYBRID",  color: "#FF2E88" },
                { label: "ONLINE",  color: "#2EDBFF" },
              ].map(({ label, color }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 10, height: 10, background: color, boxShadow: `0 0 6px ${color}`, flexShrink: 0 }} />
                  <span style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: 9, color: "var(--text)" }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div style={{ marginTop: "auto", borderTop: "1px solid var(--text-dim)", paddingTop: 10 }}>
              <p style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: "var(--accent1)", marginBottom: 8 }}>STATS</p>
              <div style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: 9, color: "var(--text-dim)", lineHeight: 2 }}>
                <div>{allEvents.length} TOTAL</div>
                <div>{allEvents.filter((e) => e.mode === "offline").length} OFFLINE</div>
                <div>{allEvents.filter((e) => e.mode === "online").length} ONLINE</div>
                <div>{allEvents.filter((e) => e.mode === "hybrid").length} HYBRID</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "5px 14px", borderTop: "2px solid var(--accent1)",
          background: "var(--header-bg)", flexShrink: 0,
        }}>
          <div style={{ display: "flex", gap: 6 }}>
            <ChanBtn label="◀ GLOBE" active={channel === 1} onClick={() => switchTo(1)} />
            <ChanBtn label="LIST ▶"  active={channel === 2} onClick={() => switchTo(2)} />
          </div>

          {/* Signal bars */}
          <div style={{ display: "flex", gap: 2, alignItems: "flex-end" }}>
            {[5, 8, 11, 8, 5].map((h, i) => (
              <div key={i} style={{ width: 4, height: h, background: i < 3 ? "var(--accent1)" : "var(--text-dim)" }} />
            ))}
          </div>

          <span style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: 8, color: "var(--text-dim)" }}>
            v1.0 · LIVE
          </span>
        </div>
      </motion.div>
    </section>
  );
}
