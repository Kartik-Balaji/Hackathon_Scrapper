"""Devpost scraper – uses their public JSON API (no auth required)."""
import asyncio
from datetime import datetime
from typing import Optional
import httpx
from scraper.base import BaseScraper
from scraper.geocoder import geocode

DEVPOST_API = "https://devpost.com/api/hackathons"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json",
}


def _parse_date(s: Optional[str]) -> Optional[datetime]:
    if not s:
        return None
    try:
        # Devpost returns ISO-like strings
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:
        return None


def _infer_mode(hackathon: dict) -> str:
    loc = (hackathon.get("displayed_location", {}).get("location") or "").lower()
    online = hackathon.get("online_only", False)
    if online:
        return "online"
    if loc in ("", "online"):
        return "online"
    return "offline"


def _extract_tags(hackathon: dict) -> list[str]:
    tags = []
    for theme in hackathon.get("themes", []):
        name = theme.get("name") or theme.get("slug", "")
        if name:
            tags.append(name.title())
    return tags[:8]


class DevpostScraper(BaseScraper):
    SOURCE = "devpost"

    async def scrape(self) -> list[dict]:
        events = []
        async with httpx.AsyncClient(headers=HEADERS, timeout=30, follow_redirects=True) as client:
            for page in range(1, 6):  # up to 5 pages × 24 = 120 events
                params = {
                    "status[]": ["upcoming", "open"],
                    "order_by": "deadline",
                    "per_page": 24,
                    "page": page,
                }
                try:
                    resp = await client.get(DEVPOST_API, params=params)
                    resp.raise_for_status()
                    data = resp.json()
                except Exception as e:
                    print(f"[Devpost] Page {page} error: {e}")
                    break

                hackathons = data.get("hackathons", [])
                if not hackathons:
                    print(f"[Devpost] No more hackathons at page {page}")
                    break

                print(f"[Devpost] Page {page}: {len(hackathons)} hackathons")

                for h in hackathons:
                    location_raw = (
                        h.get("displayed_location", {}).get("location") or "Online"
                    )
                    mode = _infer_mode(h)

                    # Geocode non-online events
                    lat = lon = None
                    if mode != "online" and location_raw.lower() not in ("", "online"):
                        coords = await geocode(location_raw)
                        if coords:
                            lat, lon = coords
                        await asyncio.sleep(1.1)  # Nominatim rate limit: 1 req/sec

                    events.append(
                        {
                            "source": self.SOURCE,
                            "name": h.get("title", "Unnamed"),
                            "url": h.get("url", ""),
                            "start_date": _parse_date(h.get("submission_period_dates", {}).get("start")),
                            "end_date": _parse_date(h.get("submission_period_dates", {}).get("end")),
                            "location_raw": location_raw,
                            "mode": mode,
                            "organizer": h.get("organization_name"),
                            "tags": _extract_tags(h),
                            "prize_pool": h.get("prize_amount"),
                            "participants": str(h.get("registrations_count", "")),
                            "image_url": h.get("thumbnail_url"),
                            "latitude": lat,
                            "longitude": lon,
                            "status": "active",
                        }
                    )

        print(f"[Devpost] Total scraped: {len(events)}")
        return events


if __name__ == "__main__":
    async def _run():
        async with DevpostScraper() as s:
            await s.run()
    asyncio.run(_run())
