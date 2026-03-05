"use client";
import { motion, AnimatePresence } from "framer-motion";
import { HackEvent } from "@/lib/api";

const MODE_COLOR: Record<string, string> = {
  offline: "#FFD600",
  hybrid: "#FF2E88",
  online: "#2EDBFF",
};

interface Props {
  event: HackEvent | null;
  onClose: () => void;
}

function formatDate(d: string | null) {
  if (!d) return "TBA";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function EventDrawer({ event, onClose }: Props) {
  return (
    <AnimatePresence>
      {event && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            key="drawer"
            className="fixed right-0 top-0 h-full z-50 flex flex-col overflow-y-auto"
            style={{
              width: 360,
              background: "var(--monitor-bg)",
              borderLeft: "3px solid var(--accent1)",
              boxShadow: "-6px 0 0 var(--accent1)",
            }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.22 }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "2px solid var(--accent1)", background: "var(--header-bg)" }}
            >
              <span className="font-pixel text-neon-yellow text-[9px]">
                // EVENT DATA
              </span>
              <button
                onClick={onClose}
                className="font-pixel text-cream-white text-[10px] hover:text-hot-pink transition-colors"
              >
                [X]
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-5 p-5 flex-1">
              {/* Name */}
              <div>
                <Label text="NAME" />
                <h2
                  className="font-pixel text-[11px] leading-relaxed mt-1"
                  style={{ color: "var(--text)", textShadow: "0 0 8px rgba(255,214,0,0.3)" }}
                >
                  {event.name}
                </h2>
              </div>

              {/* Dates */}
              <div>
                <Label text="DATE" />
                <p className="font-mono text-[12px] mt-1" style={{ color: "var(--accent1)" }}>
                  {formatDate(event.start_date)}
                  {event.end_date && event.end_date !== event.start_date
                    ? ` – ${formatDate(event.end_date)}`
                    : ""}
                </p>
              </div>

              {/* Location */}
              <div>
                <Label text="LOCATION" />
                <p className="font-mono text-[12px] mt-1 flex items-center gap-2" style={{ color: "var(--text)" }}>
                  <span className="text-hot-pink">📍</span>
                  {event.location_raw ?? "Unknown"}
                </p>
              </div>

              {/* Mode badge */}
              <div>
                <Label text="FORMAT" />
                <div className="mt-1">
                  <span
                    className="font-pixel text-pixel-black text-[8px] px-3 py-1"
                    style={{
                      background: MODE_COLOR[event.mode ?? "online"] ?? "#2EDBFF",
                    }}
                  >
                    {(event.mode ?? "online").toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Organizer */}
              {event.organizer && (
                <div>
                  <Label text="ORGANIZER" />
                  <p className="font-mono text-[12px] mt-1 opacity-80" style={{ color: "var(--text)" }}>
                    {event.organizer}
                  </p>
                </div>
              )}

              {/* Prize */}
              {event.prize_pool && (
                <div>
                  <Label text="PRIZE POOL" />
                  <p className="font-mono text-[13px] mt-1" style={{ color: "var(--accent1)" }}>
                    {event.prize_pool}
                  </p>
                </div>
              )}

              {/* Participants */}
              {event.participants && (
                <div>
                  <Label text="PARTICIPANTS" />
                  <p className="font-mono text-[12px] mt-1" style={{ color: "var(--accent2)" }}>
                    {event.participants}
                  </p>
                </div>
              )}

              {/* Source */}
              <div>
                <Label text="SOURCE" />
                  <p className="font-mono text-[11px] mt-1 uppercase opacity-60" style={{ color: "var(--text)" }}>
                  {event.source}
                </p>
              </div>

              {/* Tags */}
              {event.tags && event.tags.length > 0 && (
                <div>
                  <Label text="TAGS" />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {event.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="font-mono text-[9px] px-2 py-0.5"
                        style={{
                          border: "1px solid var(--accent2)",
                          color: "var(--accent2)",
                        }}
                      >
                        ▶{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="p-5 pt-0">
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center font-pixel text-[9px] py-3"
                style={{
                  border: "2px solid var(--accent3)",
                  color: "var(--accent3)",
                  boxShadow: "3px 3px 0 var(--accent3)",
                  textDecoration: "none",
                  transition: "all 0.1s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--accent3)";
                  (e.currentTarget as HTMLElement).style.color = "var(--bg)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "var(--accent3)";
                }}
              >
                VIEW OFFICIAL LISTING ↗
              </a>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Label({ text }: { text: string }) {
  return (
    <span className="font-pixel text-[7px] uppercase tracking-widest" style={{ color: "var(--text-dim)" }}>
      {text}
    </span>
  );
}
