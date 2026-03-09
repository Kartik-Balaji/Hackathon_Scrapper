"""HackerEarth scraper – uses their public API (no auth required)."""
import asyncio
import hashlib
from datetime import datetime
from typing import Optional
import httpx
from scraper.base import BaseScraper
from scraper.geocoder import geocode
from app.fetcher import detect_ppt_round

HE_API = "https://www.hackerearth.com/chrome-extension/events/"
HEADERS = {
    "User-Agent": "HackathonGlobeRadar/1.0",
    "Accept": "application/json",
}


def _uid(url: str) -> str:
    return hashlib.md5(f"hackerearth::{url}".encode()).hexdigest()


def _parse_date(s: Optional[str]) -> Optional[datetime]:
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00")).replace(tzinfo=None)
    except Exception:
        return None


def _infer_mode(event: dict) -> str:
    t = (event.get("type") or "").lower()
    if t in ("online", "virtual"):
        return "online"
    if t == "hybrid":
        return "hybrid"
    if t in ("college", "offline", "on-site", "onsite"):
        return "offline"
    # Fallback: check title/description
    text = (event.get("title", "") + " " + event.get("description", "")).lower()
    if "online" in text or "virtual" in text:
        return "online"
    if "hybrid" in text:
        return "hybrid"
    return "offline"


class HackerEarthScraper(BaseScraper):
    SOURCE = "hackerearth"

    async def scrape(self) -> list[dict]:
        events: list[dict] = []

        async with httpx.AsyncClient(headers=HEADERS, timeout=30, follow_redirects=True) as client:
            try:
                resp = await client.get(HE_API)
                resp.raise_for_status()
                data = resp.json()
            except Exception as e:
                print(f"[HackerEarth] API error: {e}")
                return []

        # HE returns a dict with "hackathon" and "challenge" keys
        raw_events = data.get("response", {})
        hackathons = raw_events.get("hackathon", [])
        challenges = raw_events.get("challenge", [])
        all_items = hackathons + challenges

        print(f"[HackerEarth] Found {len(hackathons)} hackathons + {len(challenges)} challenges")

        async with httpx.AsyncClient() as geo_client:
            for item in all_items:
                url = item.get("url") or item.get("event_url", "")
                if not url:
                    continue

                title = item.get("title", "Unnamed")
                start_date = _parse_date(item.get("start_time") or item.get("startdate"))
                end_date = _parse_date(item.get("end_time") or item.get("enddate"))

                # Location
                location_raw = (
                    item.get("location")
                    or item.get("city")
                    or "Online"
                )
                if not location_raw or location_raw.strip() == "":
                    location_raw = "Online"

                mode = _infer_mode(item)

                # Tags from difficulty / skills / type
                tags = []
                for field in ("skills", "tags", "domain"):
                    val = item.get(field)
                    if isinstance(val, list):
                        tags.extend(str(v) for v in val if v)
                    elif isinstance(val, str) and val:
                        tags.append(val)
                tags = list(dict.fromkeys(tags))[:8]

                # Geocode offline events
                lat = lon = None
                if mode != "online" and location_raw.lower() not in ("online", "virtual", ""):
                    coords = await geocode(location_raw)
                    if coords:
                        lat, lon = coords
                    await asyncio.sleep(1.1)

                organizer = item.get("company_name") or item.get("organization")
                prize_pool = item.get("prize_in_cash") or item.get("prize")
                if isinstance(prize_pool, (int, float)) and prize_pool:
                    prize_pool = f"${prize_pool:,.0f}"
                elif prize_pool:
                    prize_pool = str(prize_pool)
                else:
                    prize_pool = None

                description = item.get("description", "") or ""
                has_ppt = detect_ppt_round(title, description, " ".join(tags))

                events.append({
                    "id": _uid(url),
                    "source": self.SOURCE,
                    "name": title,
                    "url": url,
                    "start_date": start_date,
                    "end_date": end_date,
                    "location_raw": location_raw,
                    "mode": mode,
                    "organizer": organizer,
                    "tags": tags,
                    "prize_pool": prize_pool,
                    "participants": str(item.get("registrations_count") or ""),
                    "image_url": item.get("thumb_url") or item.get("logo"),
                    "latitude": lat,
                    "longitude": lon,
                    "has_ppt_round": has_ppt,
                    "status": "active",
                })

        print(f"[HackerEarth] Total scraped: {len(events)}")
        return events


if __name__ == "__main__":
    async def _run():
        async with HackerEarthScraper() as s:
            await s.run()
    asyncio.run(_run())
