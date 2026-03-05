"use client";
import { useEffect, useRef, useState } from "react";
import { HackEvent } from "@/lib/api";

const MODE_COLORS: Record<string, string> = {
  offline: "#FFD600",
  hybrid:  "#FF2E88",
  online:  "#2EDBFF",
};

const COUNTRIES_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface Props {
  events: HackEvent[];
  onSelectEvent: (event: HackEvent) => void;
  interactive: boolean;
}

function modeColor(mode: string | null | undefined) {
  return MODE_COLORS[mode ?? "online"] ?? "#2EDBFF";
}

function fmt(d: string | null | undefined) {
  if (!d) return "TBA";
  try {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return "TBA"; }
}

/* ── Inline pin popup ─────────────────────────────────── */
function PinPopup({
  event,
  pos,
  containerRect,
  onClose,
  onDetails,
}: {
  event: HackEvent;
  pos: { x: number; y: number };
  containerRect: DOMRect;
  onClose: () => void;
  onDetails: () => void;
}) {
  const POPUP_W = 230;
  const POPUP_H = 160; // approx
  const MARGIN  = 10;

  // pos is in viewport coords — convert to container-relative
  let left = pos.x - containerRect.left - POPUP_W / 2;
  let top  = pos.y - containerRect.top  - POPUP_H - 16; // above the pin

  // Edge clamp
  left = Math.max(MARGIN, Math.min(left, containerRect.width  - POPUP_W - MARGIN));
  top  = Math.max(MARGIN, Math.min(top,  containerRect.height - POPUP_H - MARGIN));

  const color = modeColor(event.mode);

  return (
    <div
      style={{
        position: "absolute",
        left, top,
        width: POPUP_W,
        zIndex: 60,
        background: "var(--monitor-bg, #0d0d0d)",
        border: `2px solid ${color}`,
        boxShadow: `4px 4px 0 ${color}`,
        pointerEvents: "auto",
        animation: "fadeUp 0.15s ease-out",
      }}
    >
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        padding: "7px 8px 5px", borderBottom: `1px solid ${color}44`,
      }}>
        <p style={{
          fontFamily: '"Press Start 2P", monospace', fontSize: 7, lineHeight: 1.6,
          color: "var(--text, #f5f1e8)", maxWidth: 180,
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>
          {event.name}
        </p>
        <button
          onClick={onClose}
          style={{
            fontFamily: '"Press Start 2P", monospace', fontSize: 8,
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-dim, #888)", lineHeight: 1, flexShrink: 0, marginLeft: 4,
          }}
        >×</button>
      </div>

      {/* Body */}
      <div style={{ padding: "6px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
        <p style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: 9, color: "var(--text-dim, #888)" }}>
          📍 {event.location_raw ?? "Online"}
        </p>
        <p style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: 9, color: "var(--text-dim, #888)" }}>
          📅 {fmt(event.start_date)}{event.end_date ? ` – ${fmt(event.end_date)}` : ""}
        </p>
        {event.prize_pool && (
          <p style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: 9, color }}>
            🏆 {event.prize_pool}
          </p>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "5px 8px 7px", display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{
          fontFamily: '"Press Start 2P", monospace', fontSize: 6, padding: "3px 6px",
          background: color, color: "#0b0b0b",
        }}>
          {(event.mode ?? "online").toUpperCase()}
        </span>
        <button
          onClick={onDetails}
          style={{
            fontFamily: '"Press Start 2P", monospace', fontSize: 6, padding: "4px 8px",
            border: `2px solid ${color}`, color, background: "transparent",
            cursor: "pointer", marginLeft: "auto",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = color;
            e.currentTarget.style.color = "#0b0b0b";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = color;
          }}
        >
          DETAILS ↗
        </button>
      </div>
    </div>
  );
}

export default function GlobeView({ events, onSelectEvent, interactive }: Props) {
  const wrapRef  = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null);
  const [hoveredEvent, setHoveredEvent] = useState<HackEvent | null>(null);
  const [tipPos,       setTipPos]       = useState({ x: 0, y: 0 });
  const [clickedEvent, setClickedEvent] = useState<HackEvent | null>(null);
  const [clickPos,     setClickPos]     = useState({ x: 0, y: 0 });

  /* ── init globe once ──────────────────────────────── */
  useEffect(() => {
    if (!mountRef.current || !wrapRef.current) return;
    let alive = true;

    const init = async () => {
      const [{ default: GlobeGL }, topojson, topo] = await Promise.all([
        import("globe.gl"),
        import("topojson-client"),
        fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then((r) => r.json()),
      ]);
      if (!alive || !mountRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const countries = (topojson as any).feature(topo, topo.objects.countries);
      const w = wrapRef.current!.clientWidth  || 640;
      const h = wrapRef.current!.clientHeight || 480;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const globe = (GlobeGL as any)({ animateIn: true, width: w, height: h })(mountRef.current!);

      globe
        .backgroundColor("rgba(0,0,0,0)")
        .showAtmosphere(true)
        .atmosphereColor("#2EDBFF")
        .atmosphereAltitude(0.14)
        .showGraticules(true);

      globe.globeMaterial().color.set("#060612");
      globe.globeMaterial().emissive.set("#0a1a30");
      globe.globeMaterial().emissiveIntensity = 0.25;

      globe
        .polygonsData(countries.features)
        .polygonCapColor(() => "#0d1530")
        .polygonSideColor(() => "#0d1530")
        .polygonStrokeColor(() => "#2EDBFF44")
        .polygonAltitude(0.005);

      globe
        .pointsData(events)
        .pointLat((d: HackEvent) => d.latitude!)
        .pointLng((d: HackEvent) => d.longitude!)
        .pointAltitude(0.015)
        .pointRadius((d: HackEvent) => 0.5)
        .pointColor((d: HackEvent) => modeColor(d.mode))
        .pointResolution(8)
        .onPointHover((pt: HackEvent | null, _prev: unknown, ev: MouseEvent) => {
          setHoveredEvent(pt);
          if (pt && ev) setTipPos({ x: ev.clientX, y: ev.clientY });
        })
        // globe.gl: onPointClick(point, event, coords) — event is 2nd arg
        .onPointClick((pt: HackEvent, ev: MouseEvent) => {
          if (!pt) return;
          if (globeRef.current) globeRef.current.controls().autoRotate = false;
          setClickedEvent(pt);
          setClickPos({ x: ev.clientX, y: ev.clientY });
        })
        .pointLabel(() => "");

      globe
        .ringsData(events.slice(0, 40))
        .ringLat((d: HackEvent) => d.latitude!)
        .ringLng((d: HackEvent) => d.longitude!)
        .ringColor((d: HackEvent) => (t: number) => {
          const c = modeColor(d.mode);
          const alpha = Math.round((1 - t) * 80).toString(16).padStart(2, "0");
          return `${c}${alpha}`;
        })
        .ringMaxRadius(3.5)
        .ringPropagationSpeed(1.8)
        .ringRepeatPeriod(1400);

      globe.controls().autoRotate      = true;
      globe.controls().autoRotateSpeed = 0.3;
      globe.controls().enableZoom      = interactive;
      globe.controls().enablePan       = false;
      globe.pointOfView({ lat: 15, lng: 10, altitude: 1.9 }, 1200);

      globeRef.current = globe;
    };

    init();
    return () => {
      alive = false;
      try { globeRef.current?._destructor?.(); } catch { /* noop */ }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Update points when events list changes ── */
  useEffect(() => {
    const g = globeRef.current;
    if (!g || !events.length) return;
    g.pointsData(events).ringsData(events.slice(0, 40));
  }, [events]);

  /* ── Sync interactive flag ── */
  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    g.controls().enableZoom = interactive;
  }, [interactive]);

  /* ── Resize observer ── */
  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(() => {
      const g = globeRef.current;
      const el = wrapRef.current;
      if (!g || !el) return;
      g.width(el.clientWidth).height(el.clientHeight);
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const closePopup = () => {
    setClickedEvent(null);
    // Resume auto-rotation
    if (globeRef.current) globeRef.current.controls().autoRotate = true;
  };

  return (
    <div ref={wrapRef} className="relative w-full h-full overflow-hidden">
      {/* Globe canvas mount */}
      <div ref={mountRef} className="absolute inset-0 flex items-center justify-center" />

      {/* Hover tooltip — only when no popup is open */}
      {hoveredEvent && !clickedEvent && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: tipPos.x + 16, top: tipPos.y - 8 }}
        >
          <div
            className="px-3 py-1.5 max-w-[200px]"
            style={{
              background: "#0B0B0B",
              border: `2px solid ${modeColor(hoveredEvent.mode)}`,
              boxShadow: `2px 2px 0 ${modeColor(hoveredEvent.mode)}`,
            }}
          >
            <p className="font-pixel text-[7px] leading-relaxed" style={{ color: "var(--text, #f5f1e8)" }}>
              {hoveredEvent.name}
            </p>
            <p className="font-mono text-[8px] opacity-60 mt-0.5" style={{ color: "var(--text, #f5f1e8)" }}>
              click for details
            </p>
          </div>
        </div>
      )}

      {/* Click popup */}
      {clickedEvent && wrapRef.current && (
        <PinPopup
          event={clickedEvent}
          pos={clickPos}
          containerRect={wrapRef.current.getBoundingClientRect()}
          onClose={closePopup}
          onDetails={() => { onSelectEvent(clickedEvent); closePopup(); }}
        />
      )}
    </div>
  );
}

