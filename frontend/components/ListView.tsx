"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchEvents, HackEvent } from "@/lib/api";
import Filters, { ActiveFilters } from "./Filters";

const MODE_COLOR: Record<string, string> = {
  offline: "#FFD600",
  hybrid:  "#FF2E88",
  online:  "#2EDBFF",
};

const SOURCE_COLOR: Record<string, string> = {
  devpost:     "#FF6B35",
  unstop:      "#A78BFA",
  hackerearth: "#34D399",
};

const DEFAULT_FILTERS: ActiveFilters = {
  mode: "", source: "all", ppt: "all", query: "",
};

const PAGE_SIZE = 24;

interface Props {
  onSelectEvent: (event: HackEvent) => void;
}

function formatDate(d: string | null) {
  if (!d) return "TBA";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ListView({ onSelectEvent }: Props) {
  const [filters, setFilters] = useState<ActiveFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);

  const hasPpt =
    filters.ppt === "yes" ? true : filters.ppt === "no" ? false : undefined;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["events", filters, page],
    queryFn: () =>
      fetchEvents({
        q:         filters.query || undefined,
        mode:      filters.mode   || undefined,
        has_ppt:   hasPpt,
        source:    filters.source !== "all" ? filters.source : undefined,
        page,
        page_size: PAGE_SIZE,
      }),
    placeholderData: (prev) => prev,
  });

  const events     = data?.events ?? [];
  const total      = data?.total  ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handleFilterChange(f: ActiveFilters) {
    setFilters(f);
    setPage(1);
  }

  return (
    <section id="list-view" className="min-h-screen" style={{ background: "#0B0B0B" }}>
      {/* Header */}
      <div className="px-6 py-8">
        <h2 className="font-pixel text-neon-yellow text-[13px] mb-1">// HACKATHON LISTINGS</h2>
        <p className="font-mono text-cream-white text-[11px] opacity-50">
          Aggregated from Devpost · Unstop · HackerEarth
        </p>
      </div>

      {/* Filters bar */}
      <Filters
        filters={filters}
        total={total}
        onChange={handleFilterChange}
        onReset={() => { setFilters(DEFAULT_FILTERS); setPage(1); }}
      />

      {/* Content */}
      <div className="p-6">
        {isLoading && (
          <div className="font-mono text-electric-blue text-[11px] animate-pulse">
            {">"} Loading events…
          </div>
        )}
        {isError && (
          <div className="font-mono text-hot-pink text-[11px]">
            {">"} ERROR: Could not fetch events. Is the backend running?
          </div>
        )}
        {!isLoading && events.length === 0 && !isError && (
          <div className="font-mono text-cream-white text-[11px] opacity-40">
            {">"} No events found for the current filters.
          </div>
        )}

        {/* Card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {events.map((ev) => (
            <EventCard key={ev.id} event={ev} onClick={() => onSelectEvent(ev)} />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center gap-3 mt-8">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="font-pixel text-[7px] px-3 py-2 transition-all disabled:opacity-30"
              style={{ border: "2px solid #444", color: "#888", cursor: page <= 1 ? "default" : "pointer" }}
            >
              ◀ PREV
            </button>

            {/* Page numbers — show a window around current page */}
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const half = 3;
                let start = Math.max(1, page - half);
                const end = Math.min(totalPages, start + 6);
                start = Math.max(1, end - 6);
                return start + i;
              }).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="font-pixel text-[7px] px-2 py-2 transition-all"
                  style={{
                    border: `2px solid ${p === page ? "#FFD600" : "#333"}`,
                    background: p === page ? "#FFD600" : "transparent",
                    color: p === page ? "#0B0B0B" : "#888",
                    minWidth: 28,
                    cursor: "pointer",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="font-pixel text-[7px] px-3 py-2 transition-all disabled:opacity-30"
              style={{ border: "2px solid #444", color: "#888", cursor: page >= totalPages ? "default" : "pointer" }}
            >
              NEXT ▶
            </button>

            <span className="font-mono text-cream-white text-[10px] opacity-40 ml-2">
              {page} / {totalPages} &nbsp;({total.toLocaleString()} total)
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Event card ────────────────────────────────────────────────────────────────
function EventCard({ event, onClick }: { event: HackEvent; onClick: () => void }) {
  const modeColor   = MODE_COLOR[event.mode   ?? "online"] ?? "#2EDBFF";
  const sourceColor = SOURCE_COLOR[event.source] ?? "#888";

  return (
    <div
      className="hack-card cursor-pointer p-4 flex flex-col gap-3"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      {/* Top: source pill + mode badge + PPT */}
      <div className="flex items-center justify-between gap-1 flex-wrap">
        <span
          className="font-pixel text-[6px] px-1.5 py-0.5"
          style={{ background: sourceColor, color: "#0B0B0B" }}
        >
          {event.source.toUpperCase()}
        </span>
        <div className="flex items-center gap-1">
          {event.has_ppt_round && (
            <span className="font-pixel text-[6px] px-1.5 py-0.5" style={{ background: "#FF2E88", color: "#0B0B0B" }}>
              📊 PPT
            </span>
          )}
          <span
            className="font-pixel text-pixel-black text-[6px] px-1.5 py-0.5"
            style={{ background: modeColor }}
          >
            {(event.mode ?? "online").toUpperCase()}
          </span>
        </div>
      </div>

      {/* Name */}
      <h3 className="font-pixel text-cream-white text-[10px] leading-relaxed line-clamp-2">
        {event.name}
      </h3>

      {/* Date */}
      <p className="font-mono text-neon-yellow text-[11px]">
        {formatDate(event.start_date)}
        {event.end_date && event.end_date !== event.start_date
          ? ` – ${formatDate(event.end_date)}` : ""}
      </p>

      {/* Location */}
      <p className="font-mono text-cream-white text-[10px] opacity-60 flex items-center gap-1.5">
        <span style={{ color: "#FF2E88" }}>📍</span>
        {event.location_raw ?? "Online"}
      </p>

      {/* Tags */}
      {event.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {event.tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="font-mono text-[8px] px-1.5 py-0.5"
              style={{ border: "1px solid #333", color: "#888" }}>
              {tag}
            </span>
          ))}
          {event.tags.length > 3 && (
            <span className="font-mono text-[8px] text-electric-blue opacity-60">
              +{event.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
