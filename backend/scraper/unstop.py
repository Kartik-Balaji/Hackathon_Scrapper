"""Unstop scraper – uses Playwright to scrape hackathon listings."""
import asyncio
import re
from datetime import datetime
from typing import Optional
from playwright.async_api import async_playwright, Page
from scraper.base import BaseScraper
from scraper.geocoder import geocode
from app.fetcher import detect_ppt_round

UNSTOP_URL = "https://unstop.com/hackathons"


def _clean_text(t: str | None) -> str | None:
    if not t:
        return None
    return re.sub(r"\s+", " ", t).strip()


def _parse_unstop_date(s: str | None) -> Optional[datetime]:
    """Try to parse the various date formats Unstop uses."""
    if not s:
        return None
    s = s.strip()
    for fmt in (
        "%d %b %Y",
        "%b %d, %Y",
        "%d %B %Y",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d",
    ):
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            pass
    return None


def _infer_mode(location: str | None) -> str:
    if not location:
        return "online"
    low = location.lower()
    if "online" in low or "virtual" in low or "remote" in low:
        return "online"
    if "hybrid" in low:
        return "hybrid"
    return "offline"


class UnstopScraper(BaseScraper):
    SOURCE = "unstop"

    async def scrape(self) -> list[dict]:
        events: list[dict] = []

        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=True)
            context = await browser.new_context(
                viewport={"width": 1280, "height": 900},
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                ),
            )
            page = await context.new_page()

            print(f"[Unstop] Navigating to {UNSTOP_URL}")
            await page.goto(UNSTOP_URL, wait_until="networkidle", timeout=60000)
            await page.wait_for_timeout(3000)

            # Scroll to lazy-load more cards
            for _ in range(8):
                await page.keyboard.press("End")
                await page.wait_for_timeout(1500)

            # Unstop card selectors (may need updating if site changes)
            cards = await page.query_selector_all("app-competition-card, .competition-card, [class*='listing-card']")
            print(f"[Unstop] Found {len(cards)} cards (raw)")

            # Fallback: grab all <a> links containing /hackathon/ or /competition/
            if len(cards) < 3:
                cards = await page.query_selector_all("a[href*='/hackathon'], a[href*='/competition']")
                print(f"[Unstop] Fallback link scan: {len(cards)} found")

            seen_urls: set[str] = set()

            for card in cards:
                try:
                    event_data = await self._extract_card(page, card)
                    if not event_data or not event_data.get("url"):
                        continue
                    url = event_data["url"]
                    if url in seen_urls:
                        continue
                    seen_urls.add(url)

                    # Geocode
                    loc = event_data.get("location_raw", "")
                    mode = event_data.get("mode", "online")
                    if mode != "online" and loc and loc.lower() not in ("", "online", "virtual"):
                        coords = await geocode(loc)
                        if coords:
                            event_data["latitude"], event_data["longitude"] = coords
                        await asyncio.sleep(1.1)

                    events.append(event_data)
                except Exception as e:
                    print(f"[Unstop] Card parse error: {e}")

            await browser.close()

        print(f"[Unstop] Total scraped: {len(events)}")
        return events

    async def _extract_card(self, page: Page, card) -> dict | None:
        # Try getting the href of the card
        href = await card.get_attribute("href")
        if not href:
            parent = await card.query_selector("a")
            if parent:
                href = await parent.get_attribute("href")
        if not href:
            return None

        url = href if href.startswith("http") else f"https://unstop.com{href}"

        # Name
        name = None
        for sel in ["h2", "h3", "[class*='title']", "[class*='name']", "strong"]:
            el = await card.query_selector(sel)
            if el:
                name = _clean_text(await el.inner_text())
                if name:
                    break

        if not name:
            name = _clean_text(await card.inner_text())
            name = name[:80] if name else "Unknown Hackathon"

        # Location
        location_raw = None
        for sel in ["[class*='location']", "[class*='venue']", "[class*='city']"]:
            el = await card.query_selector(sel)
            if el:
                location_raw = _clean_text(await el.inner_text())
                if location_raw:
                    break

        # Dates
        start_date = end_date = None
        for sel in ["[class*='date']", "[class*='deadline']", "time"]:
            el = await card.query_selector(sel)
            if el:
                date_text = _clean_text(await el.inner_text())
                parsed = _parse_unstop_date(date_text)
                if parsed:
                    start_date = parsed
                    break

        # Organizer
        organizer = None
        for sel in ["[class*='organizer']", "[class*='company']", "[class*='host']"]:
            el = await card.query_selector(sel)
            if el:
                organizer = _clean_text(await el.inner_text())
                if organizer:
                    break

        # Tags
        tags = []
        for sel in ["[class*='tag']", "[class*='label']", "[class*='chip']"]:
            els = await card.query_selector_all(sel)
            for el in els[:6]:
                t = _clean_text(await el.inner_text())
                if t and len(t) < 30:
                    tags.append(t)

        mode = _infer_mode(location_raw)

        has_ppt = detect_ppt_round(name, " ".join(tags), location_raw)

        return {
            "source": self.SOURCE,
            "name": name,
            "url": url,
            "start_date": start_date,
            "end_date": end_date,
            "location_raw": location_raw or "Online",
            "mode": mode,
            "organizer": organizer,
            "tags": list(dict.fromkeys(tags))[:8],  # dedupe preserving order
            "latitude": None,
            "longitude": None,
            "has_ppt_round": has_ppt,
            "status": "active",
        }


if __name__ == "__main__":
    async def _run():
        async with UnstopScraper() as s:
            await s.run()
    asyncio.run(_run())
