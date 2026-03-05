"""Base scraper and in-process upsert helper (no database required)."""
import asyncio
from abc import ABC, abstractmethod
from datetime import datetime
import app.database as cache


def upsert_local(store: dict, data: dict) -> str:
    """Upsert into an in-process dict keyed by (source, url)."""
    key = f"{data['source']}::{data['url']}"
    if key in store:
        existing = store[key]
        existing.update({k: v for k, v in data.items() if v is not None and k != 'first_seen_at'})
        existing['last_seen_at'] = datetime.utcnow().isoformat()
        return 'updated'
    data.setdefault('first_seen_at', datetime.utcnow().isoformat())
    data['last_seen_at'] = datetime.utcnow().isoformat()
    store[key] = data
    return 'inserted'


class BaseScraper(ABC):
    SOURCE: str = ""

    @abstractmethod
    async def scrape(self) -> list[dict]:
        """Return list of raw event dicts."""

    async def run(self) -> dict:
        events = await self.scrape()
        store: dict = {}
        inserted = updated = skipped = 0
        for ev in events:
            ev["source"] = self.SOURCE
            try:
                action = upsert_local(store, ev)
                if action == "inserted":
                    inserted += 1
                else:
                    updated += 1
            except Exception as e:
                print(f"[{self.SOURCE}] Error: {e}")
                skipped += 1

        # Merge scraped events into the in-memory global cache
        scraped_keys = set(store.keys())
        merged = list(store.values()) + [
            e for e in cache.get_events_raw()
            if f"{e['source']}::{e['url']}" not in scraped_keys
        ]
        cache.set_events(merged)

        print(
            f"[{self.SOURCE}] Done - inserted={inserted} updated={updated} "
            f"skipped={skipped} total_processed={len(events)}"
        )
        return {"inserted": inserted, "updated": updated, "skipped": skipped}
