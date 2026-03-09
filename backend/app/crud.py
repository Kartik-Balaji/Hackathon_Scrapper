import re
from datetime import datetime
from typing import Optional, Tuple, List
import app.database as cache


def _matches_filter(ev: dict, q: Optional[str], mode: Optional[str], has_ppt: Optional[bool] = None) -> bool:
    if mode and mode.lower() not in ("", "all"):
        if (ev.get("mode") or "").lower() != mode.lower():
            return False
    if has_ppt is not None:
        if ev.get("has_ppt_round") != has_ppt:
            return False
    if q:
        pattern = re.compile(re.escape(q), re.IGNORECASE)
        haystack = " ".join(filter(None, [
            ev.get("name", ""),
            ev.get("location_raw", ""),
            ev.get("organizer", ""),
            " ".join(ev.get("tags") or []),
        ]))
        if not pattern.search(haystack):
            return False
    return True


async def get_events(
    q: Optional[str] = None,
    mode: Optional[str] = None,
    has_ppt: Optional[bool] = None,
    page: int = 1,
    page_size: int = 20,
) -> Tuple[List[dict], int]:
    await cache.ensure_fresh()
    all_events = cache.get_events_raw()
    filtered = [e for e in all_events if _matches_filter(e, q, mode, has_ppt)]
    # Sort by start_date ascending, None last
    filtered.sort(key=lambda e: e.get("start_date") or datetime.max)
    total = len(filtered)
    page_events = filtered[(page - 1) * page_size : page * page_size]
    return page_events, total


async def get_meta() -> dict:
    await cache.ensure_fresh()
    all_events = cache.get_events_raw()
    active = [e for e in all_events if e.get("status") == "active"]
    last_fetch = cache.last_fetch_time()
    last_scrape = datetime.utcfromtimestamp(last_fetch) if last_fetch else None
    return {
        "total_events": len(all_events),
        "active_events": len(active),
        "last_scrape_time": last_scrape,
    }

