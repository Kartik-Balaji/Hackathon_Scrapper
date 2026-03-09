"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchEvents, HackEvent } from "@/lib/api";
import Filters from "./Filters";

type PptFilter = "all" | "yes" | "no";
type SourceFilter = "all" | "devpost" | "unstop" | "hackerearth";

const MODE_COLOR: Record<string, string> = {
  offline: "#FFD600",
  hybrid: "#FF2E88",
  online: "#2EDBFF",
};

interface Props {
  onSelectEvent: (event: HackEvent) => void;
}

function formatDate(d: string | null) {
  if (!d) return "TBA";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ListView({ onSelectEvent }: Props) {
  const [mode, setMode] = useState("");
  const [query, setQuery] = useState("");
  const [pptFilter, setPptFilter] = useState<PptFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 18;

  const hasPpt =
    pptFilter === "yes" ? true : pptFilter === "no" ? false : undefined;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["events", mode, query, pptFilter, sourceFilter, page],
    queryFn: () =>
      fetchEvents({
        q: query || undefined,
        mode: mode || undefined,
        has_ppt: hasPpt,
        source: sourceFilter !== "all" ? sourceFilter : undefined,
        page,
        page_size: PAGE_SIZE,
      }),
    placeholderData: (prev) => prev,
  });

  const events = data?.events ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <section id="list-view" className="min-h-screen" style={{ background: "#0B0B0B" }}>
      {/* Section header */}
      <div className="px-6 py-8">
        <h2 className="font-pixel text-neon-yellow text-[13px] mb-1">
          // HACKATHON LISTINGS
        </h2>
        <p className="font-mono text-cream-white text-[11px] opacity-50">
          Aggregated from Devpost · Unstop · HackerEarth
        </p>
      </div>

      {/* Filters bar */}
      <Filters
        mode={mode}
        query={query}
        pptFilter={pptFilter}
        sourceFilter={sourceFilter}
        onModeChange={(m) => { setMode(m); setPage(1); }}
        onQueryChange={(q) => { setQuery(q); setPage(1); }}
        onPptChange={(p) => { setPptFilter(p); setPage(1); }}
        onSourceChange={(s) => { setSourceFilter(s); setPage(1); }}
        total={total}
      />

      {/* Content */}
      <div className="p-6">
        {isLoading && (
          <div className="font-mono text-electric-blue text-[11px] animate-pulse">
            {">"} Loading events<span className="animate-blink">▮</span>
          </div>
        )}

        {isError && (
          <div className="font-mono text-hot-pink text-[11px]">
            {">"} ERROR: Could not fetch events. Is the backend running?
          </div>
        )}

        {!isLoading && events.length === 0 && !isError && (
          <div className="font-mono text-cream-white text-[11px] opacity-40">
            {">"} No events found. Try running the scraper first.
          </div>
        )}

        {/* Card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} onClick={() => onSelectEvent(event)} />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2 mt-8">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="font-pixel text-[8px] px-3 py-2 disabled:opacity-30 transition-all"
              style={{
                border: "2px solid #444",
                color: "#888",
                cursor: page <= 1 ? "default" : "pointer",
              }}
            >
              ◀ PREV
            </button>
            <span className="font-mono text-cream-white text-[10px] opacity-50 px-3">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="font-pixel text-[8px] px-3 py-2 disabled:opacity-30 transition-all"
              style={{
                border: "2px solid #444",
                color: "#888",
                cursor: page >= totalPages ? "default" : "pointer",
              }}
            >
              NEXT ▶
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function EventCard({ event, onClick }: { event: HackEvent; onClick: () => void }) {
  const modeColor = MODE_COLOR[event.mode ?? "online"] ?? "#2EDBFF";

  return (
    <div
      className="hack-card cursor-pointer p-4 flex flex-col gap-3"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      {/* Top row: source + mode + ppt badge */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase opacity-40 text-cream-white">
          {event.source}
        </span>
        <div className="flex items-center gap-1.5">
          {event.has_ppt_round && (
            <span
              className="font-pixel text-[6px] px-1.5 py-0.5"
              style={{ background: "#FF2E88", color: "#0B0B0B" }}
            >
              📊 PPT
            </span>
          )}
          <span
            className="font-pixel text-pixel-black text-[7px] px-2 py-0.5"
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
          ? ` – ${formatDate(event.end_date)}`
          : ""}
      </p>

      {/* Location */}
      <p className="font-mono text-cream-white text-[10px] opacity-60 flex items-center gap-1.5">
        <span style={{ color: "#FF2E88" }}>📍</span>
        {event.location_raw ?? "Online"}
      </p>

      {/* Tags */}
      {event.tags && event.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {event.tags.slice(0, 3).map((tag, i) => (
            <span
              key={i}
              className="font-mono text-[8px] px-1.5 py-0.5"
              style={{ border: "1px solid #333", color: "#888" }}
            >
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

      {/* Organizer */}
      {event.organizer && (
        <p className="font-mono text-[9px] opacity-40 text-cream-white border-t border-gray-800 pt-2 mt-auto">
          {event.organizer}
        </p>
      )}
    </div>
  );
}
