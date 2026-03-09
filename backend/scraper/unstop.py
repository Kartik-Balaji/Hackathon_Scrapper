"""Unstop scraper – uses their public REST API (no Playwright, works on Render)."""
import asyncio
import hashlib
from datetime import datetime
from typing import Optional
import httpx
from scraper.base import BaseScraper
from scraper.geocoder import geocode
from app.fetcher import detect_ppt_round

UNSTOP_API = "https://unstop.com/api/public/opportunity/search"
# type=3 filters for hackathons on Unstop
BASE_PARAMS = {
    "page": 1,
    "rows": 25,
    "oppstatus": "open",
    "type": 3,  # 3 = Hackathon
}
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/plain, */*",
    "Referer": "https://unstop.com/hackathons",
}
MAX_PAGES = 5  # 5 × 25 = 125 events max


def _uid(item_id: int) -> str:
    return hashlib.md5(f"unstop::{item_id}".encode()).hexdigest()


def _parse_date(s: Optional[str]) -> Optional[datetime]:
    if not s:
        return None
    try:
        # Unstop returns ISO with timezone offset, e.g. "2025-04-01T00:00:00+05:30"
        return datetime.fromisoformat(s).replace(tzinfo=None)
    except Exception:
        return None


def _infer_mode(item: dict) -> str:
    # Unstop has an is_online flag or location field
    if item.get("is_online") or item.get("online"):
        return "online"
    loc = (item.get("location") or "").lower()
    if not loc or loc in ("online", "virtual", "remote"):
        return "online"
    if "hybrid" in loc:
        return "hybrid"
    return "offline"


def _extract_tags(item: dict) -> list[str]:
    tags: list[str] = []
    # Unstop uses `filters` list of dicts with domain/category info
    filters = item.get("filters") or []
    for f in filters:
        name = f.get("name") or f.get("file_name") or ""
        if name and len(name) < 30:
            tags.append(name.title())
    # Also add type label
    return list(dict.fromkeys(tags))[:8]


def _extract_prize(item: dict) -> Optional[str]:
    prize = item.get("prizes") or item.get("prize_amount")
    if isinstance(prize, (int, float)) and prize:
        return f"₹{prize:,.0f}"
    if isinstance(prize, str) and prize.strip():
        return prize.strip()
    # Try from meta field
    meta = item.get("meta") or {}
    if isinstance(meta, dict):
        p = meta.get("prize_money") or meta.get("cash_prize")
        if p:
            return str(p)
    return None


class UnstopScraper(BaseScraper):
    SOURCE = "unstop"

    async def scrape(self) -> list[dict]:
        events: list[dict] = []
        seen_ids: set[int] = set()

        async with httpx.AsyncClient(http2=True, headers=HEADERS, timeout=20, follow_redirects=True) as client:
            for page in range(1, MAX_PAGES + 1):
                params = {**BASE_PARAMS, "page": page}
                try:
                    resp = await client.get(UNSTOP_API, params=params)
                    resp.raise_for_status()
                    data = resp.json()
                except Exception as e:
                    print(f"[Unstop] Page {page} error: {e}")
                    break

                items = data.get("data", {}).get("data", [])
                if not items:
                    print(f"[Unstop] No more items at page {page}")
                    break

                print(f"[Unstop] Page {page}: {len(items)} items")

                for item in items:
                    item_id = item.get("id")
                    if not item_id or item_id in seen_ids:
                        continue
                    seen_ids.add(item_id)

                    slug = item.get("public_url") or str(item_id)
                    url = f"https://unstop.com/{slug}"

                    title = item.get("title") or "Unnamed Hackathon"
                    start_date = _parse_date(item.get("start_date"))
                    end_date = _parse_date(item.get("end_date"))

                    location_raw = item.get("location") or "Online"
                    if not location_raw.strip():
                        location_raw = "Online"

                    mode = _infer_mode(item)
                    tags = _extract_tags(item)

                    # Organizer from organisation_details
                    org = item.get("organisation_details") or {}
                    organizer = org.get("name") if isinstance(org, dict) else None

                    prize_pool = _extract_prize(item)

                    image_url = (
                        item.get("logo_url")
                        or item.get("image")
                        or (org.get("logo") if isinstance(org, dict) else None)
                    )

                    participants = item.get("total_registered") or item.get("registered")

                    has_ppt = detect_ppt_round(title, " ".join(tags))

                    events.append({
                        "id": _uid(item_id),
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
                        "participants": str(participants) if participants else "",
                        "image_url": image_url,
                        "latitude": None,
                        "longitude": None,
                        "has_ppt_round": has_ppt,
                        "status": "active",
                    })

        # Geocode offline events (rate-limited to Nominatim 1 req/s)
        async with httpx.AsyncClient() as geo_client:
            for ev in events:
                if ev["mode"] != "online" and ev["location_raw"].lower() not in ("online", "virtual", ""):
                    coords = await geocode(ev["location_raw"])
                    if coords:
                        ev["latitude"], ev["longitude"] = coords
                    await asyncio.sleep(1.1)

        print(f"[Unstop] Total scraped: {len(events)}")
        return events


if __name__ == "__main__":
    async def _run():
        async with UnstopScraper() as s:
            result = await s.run()
            print(result)
    asyncio.run(_run())
