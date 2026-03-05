"""
In-memory event cache with 30-minute TTL.
No database required – events are fetched live from Devpost + Unstop
and stored here until they expire.
"""
import asyncio
import time
from typing import Optional

# ── Cache state ───────────────────────────────────────────────────────────────
_events: list[dict] = []
_last_fetched: float = 0.0          # Unix timestamp
CACHE_TTL_SECONDS = 30 * 60        # 30 minutes
_refresh_lock = asyncio.Lock()


def is_stale() -> bool:
    return (time.time() - _last_fetched) > CACHE_TTL_SECONDS


def set_events(events: list[dict]) -> None:
    global _events, _last_fetched
    _events = events
    _last_fetched = time.time()


def get_events_raw() -> list[dict]:
    return _events


def last_fetch_time() -> Optional[float]:
    return _last_fetched if _last_fetched else None


async def ensure_fresh(force: bool = False) -> None:
    """Trigger a background refresh if the cache is stale."""
    if not force and not is_stale():
        return
    async with _refresh_lock:
        # Double-check after acquiring lock
        if not force and not is_stale():
            return
        from app.fetcher import fetch_all_events
        events = await fetch_all_events()
        set_events(events)
        print(f"[Cache] Refreshed – {len(events)} events loaded")

