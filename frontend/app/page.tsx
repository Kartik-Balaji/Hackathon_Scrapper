"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAllGlobeEvents, fetchMeta, HackEvent } from "@/lib/api";
import LandingScene from "@/components/LandingScene";
import EventDrawer from "@/components/EventDrawer";

export default function Home() {
  const [selectedEvent, setSelectedEvent] = useState<HackEvent | null>(null);

  const { data: globeEvents = [] } = useQuery({
    queryKey: ["globe-events"],
    queryFn: fetchAllGlobeEvents,
    staleTime: 5 * 60_000,
  });

  const { data: meta } = useQuery({
    queryKey: ["meta"],
    queryFn: fetchMeta,
    staleTime: 60_000,
  });

  return (
    <main>
      <LandingScene
        events={globeEvents}
        onSelectEvent={setSelectedEvent}
        lastUpdated={meta?.last_scrape_time}
      />
      <EventDrawer event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </main>
  );
}
