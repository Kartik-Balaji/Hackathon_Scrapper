"""
Live event fetcher — pulls from Devpost public API using httpx.
Unstop requires Playwright; its scraper is in scraper/unstop.py and can
be triggered manually. Results are merged into the in-memory cache.
"""
import asyncio
import hashlib
import re
from datetime import datetime
from typing import Optional
import httpx
from dateutil import parser as _dateutil

DEVPOST_API = "https://devpost.com/api/hackathons"
HEADERS = {
    "User-Agent": "HackathonGlobeRadar/1.0",
    "Accept": "application/json",
}
GEOCODE_URL = "https://nominatim.openstreetmap.org/search"
GEOCODE_HEADERS = {"User-Agent": "HackathonGlobeRadar/1.0 (educational)"}

# Simple in-process geocode cache to avoid hammering Nominatim
_geo_cache: dict[str, tuple[float, float] | None] = {}


def _uid(source: str, url: str) -> str:
    return hashlib.md5(f"{source}::{url}".encode()).hexdigest()


def _strip_html(s: str) -> str:
    return re.sub(r"<[^>]+>", "", s).strip()


def _parse_date(s: Optional[str]) -> Optional[datetime]:
    if not s:
        return None
    s = _strip_html(str(s)).strip()
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00")).replace(tzinfo=None)
    except Exception:
        pass
    try:
        return _dateutil.parse(s, fuzzy=True).replace(tzinfo=None)
    except Exception:
        return None


def _infer_mode(h: dict) -> str:
    if h.get("online_only"):
        return "online"
    dl = h.get("displayed_location") or {}
    if isinstance(dl, str):
        loc = dl.lower()
    else:
        loc = (dl.get("location") or "").lower()
    if not loc or loc in ("online", "virtual", "remote"):
        return "online"
    if "hybrid" in loc:
        return "hybrid"
    return "offline"


# Shared across all scrapers — import this from fetcher
PPT_KEYWORDS = frozenset([
    "presentation", "ppt", "pitch", "pitching", "demo day", "demo-day",
    "slide deck", "slides", "present your", "present their", "final round presentation",
])


def detect_ppt_round(*text_fields: str | None) -> bool:
    """Return True if any of the text fields mention a PPT/presentation round."""
    combined = " ".join(f for f in text_fields if f).lower()
    return any(kw in combined for kw in PPT_KEYWORDS)



async def _geocode(client: httpx.AsyncClient, location: str) -> tuple[float, float] | None:
    key = location.strip().lower()
    if key in _geo_cache:
        return _geo_cache[key]
    try:
        resp = await client.get(
            GEOCODE_URL,
            params={"q": location, "format": "json", "limit": 1},
            headers=GEOCODE_HEADERS,
            timeout=8,
        )
        data = resp.json()
        if data:
            result: tuple[float, float] = (float(data[0]["lat"]), float(data[0]["lon"]))
            _geo_cache[key] = result
            return result
    except Exception:
        pass
    _geo_cache[key] = None
    return None


async def _fetch_devpost_page(
    client: httpx.AsyncClient, geo_client: httpx.AsyncClient, page: int
) -> list[dict]:
    params = {
        "status[]": ["upcoming", "open"],
        "order_by": "deadline",
        "per_page": 24,
        "page": page,
    }
    try:
        resp = await client.get(DEVPOST_API, params=params, timeout=20)
        resp.raise_for_status()
        hackathons = resp.json().get("hackathons", [])
    except Exception as e:
        print(f"[Devpost] Page {page} error: {e}")
        return []

    results = []
    for h in hackathons:
        dl = h.get("displayed_location") or {}
        location_raw = (dl if isinstance(dl, str) else dl.get("location")) or "Online"
        mode = _infer_mode(h)

        lat = lon = None
        if mode != "online" and location_raw.lower() not in ("online", "virtual", ""):
            coords = await _geocode(geo_client, location_raw)
            if coords:
                lat, lon = coords
            await asyncio.sleep(1.1)  # Nominatim rate limit

        # Extract submission dates from the nested structure
        dates = h.get("submission_period_dates") or {}
        if not isinstance(dates, dict):
            dates = {}
        start_date = _parse_date(dates.get("start") or h.get("open_state_at"))
        end_date   = _parse_date(dates.get("end")   or h.get("submission_period_end_at"))

        tags = [t.get("name") or t.get("slug", "") if isinstance(t, dict) else str(t) for t in h.get("themes", [])]
        tags = [t.title() for t in tags if t][:8]

        prize = h.get("prize_amount") or h.get("total_prize_amount")
        if isinstance(prize, str) and prize:
            prize = _strip_html(prize) or None
        elif isinstance(prize, (int, float)) and prize:
            prize = f"${prize:,.0f}"
        else:
            prize = None

        has_ppt = detect_ppt_round(
            h.get("title"),
            h.get("requirements"),
            h.get("round_prize_amounts"),  # sometimes mentions rounds
            " ".join(tags),
        )

        results.append({
            "id": _uid("devpost", h.get("url", h.get("title", ""))),
            "source": "devpost",
            "name": h.get("title", "Unnamed"),
            "url": h.get("url", ""),
            "start_date": start_date,
            "end_date": end_date,
            "location_raw": location_raw,
            "mode": mode,
            "organizer": h.get("organization_name"),
            "tags": tags,
            "prize_pool": prize,
            "participants": str(h.get("registrations_count") or ""),
            "image_url": h.get("thumbnail_url"),
            "latitude": lat,
            "longitude": lon,
            "has_ppt_round": has_ppt,
            "status": "active",
        })

    return results


async def fetch_devpost(max_pages: int = 5) -> list[dict]:
    events: list[dict] = []
    async with (
        httpx.AsyncClient(headers=HEADERS, follow_redirects=True) as client,
        httpx.AsyncClient() as geo_client,
    ):
        for page in range(1, max_pages + 1):
            batch = await _fetch_devpost_page(client, geo_client, page)
            if not batch:
                break
            events.extend(batch)
            print(f"[Devpost] Page {page}: +{len(batch)} events (total {len(events)})")

    return events


async def fetch_all_events() -> list[dict]:
    """Fetch from all configured sources and merge."""
    print("[Fetcher] Starting live fetch...")

    # Fetch Devpost via built-in httpx fetcher
    devpost_events = await fetch_devpost()

    # Fetch Unstop via its API scraper
    unstop_events: list[dict] = []
    try:
        from scraper.unstop import UnstopScraper
        async with UnstopScraper() as us_scraper:
            unstop_events = await us_scraper.scrape()
        print(f"[Fetcher] Unstop: {len(unstop_events)} events")
    except Exception as e:
        print(f"[Fetcher] Unstop failed (non-fatal): {e}")

    # Fetch HackerEarth via its scraper
    hackerearth_events: list[dict] = []
    try:
        from scraper.hackerearth import HackerEarthScraper
        async with HackerEarthScraper() as he_scraper:
            hackerearth_events = await he_scraper.scrape()
        print(f"[Fetcher] HackerEarth: {len(hackerearth_events)} events")
    except Exception as e:
        print(f"[Fetcher] HackerEarth failed (non-fatal): {e}")

    all_events = devpost_events + unstop_events + hackerearth_events

    # Deduplicate by (source, url)
    seen: set[str] = set()
    merged: list[dict] = []
    for ev in all_events:
        key = f"{ev['source']}::{ev['url']}"
        if key not in seen:
            seen.add(key)
            merged.append(ev)

    print(f"[Fetcher] Done — {len(merged)} unique events")
    return merged


if __name__ == "__main__":
    async def _test():
        events = await fetch_all_events()
        print(f"Fetched {len(events)} events")
        for e in events[:3]:
            print(e["name"], e["mode"], e["location_raw"])
    asyncio.run(_test())
