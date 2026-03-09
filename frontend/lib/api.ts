const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface HackEvent {
  id: string;
  source: string;
  name: string;
  url: string;
  start_date: string | null;
  end_date: string | null;
  location_raw: string | null;
  mode: "online" | "offline" | "hybrid" | null;
  organizer: string | null;
  tags: string[];
  latitude: number | null;
  longitude: number | null;
  prize_pool: string | null;
  participants: string | null;
  image_url: string | null;
  has_ppt_round: boolean | null;
  first_seen_at: string;
  last_seen_at: string;
  status: string;
}

export interface EventsResponse {
  events: HackEvent[];
  total: number;
  page: number;
  page_size: number;
  last_updated: string | null;
}

export interface MetaResponse {
  total_events: number;
  active_events: number;
  last_scrape_time: string | null;
}

export async function fetchEvents(params?: {
  q?: string;
  mode?: string;
  has_ppt?: boolean;
  source?: string;
  page?: number;
  page_size?: number;
}): Promise<EventsResponse> {
  const url = new URL(`${BASE}/api/events`);
  if (params?.q) url.searchParams.set("q", params.q);
  if (params?.mode && params.mode !== "all") url.searchParams.set("mode", params.mode);
  if (params?.has_ppt !== undefined) url.searchParams.set("has_ppt", String(params.has_ppt));
  if (params?.source && params.source !== "all") url.searchParams.set("source", params.source);
  if (params?.page) url.searchParams.set("page", String(params.page));
  if (params?.page_size) url.searchParams.set("page_size", String(params.page_size));
  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchMeta(): Promise<MetaResponse> {
  const res = await fetch(`${BASE}/api/meta`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchAllGlobeEvents(): Promise<HackEvent[]> {
  // Fetch all events with lat/lng for the globe (up to 200)
  const res = await fetchEvents({ page_size: 200 });
  return res.events.filter((e) => e.latitude !== null && e.longitude !== null);
}

export async function fetchAllListEvents(): Promise<HackEvent[]> {
  // Fetch all events for the list view (no lat/lng filter — includes online-only events)
  const res = await fetchEvents({ page_size: 200 });
  return res.events;
}
