"""
No database to initialize in the in-memory cache architecture.
Run this to warm the cache and verify the backend can fetch events.
"""
import asyncio
from app.fetcher import fetch_all_events
import app.database as cache


async def main():
    print("[Init] Warming event cache...")
    events = await fetch_all_events()
    cache.set_events(events)
    print(f"[Init] Done. {len(events)} events loaded.")
    for e in events[:5]:
        print(f"  {e['source']:8} {e['mode']:8} {e['name'][:55]}")


if __name__ == "__main__":
    asyncio.run(main())
