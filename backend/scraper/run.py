"""
Main scraper entry point.
Usage:
    python -m scraper.run              # run all scrapers
    python -m scraper.run devpost      # run only Devpost
    python -m scraper.run unstop       # run only Unstop
"""
import asyncio
import sys
from scraper.devpost import DevpostScraper
from scraper.unstop import UnstopScraper
from scraper.hackerearth import HackerEarthScraper

SCRAPERS = {
    "devpost": DevpostScraper,
    "unstop": UnstopScraper,
    "hackerearth": HackerEarthScraper,
}


async def run_all(targets: list[str]):
    for name in targets:
        cls = SCRAPERS[name]
        print(f"\n{'='*40}")
        print(f"  Running scraper: {name.upper()}")
        print(f"{'='*40}")
        try:
            async with cls() as scraper:
                result = await scraper.run()
                print(f"[{name}] Result: {result}")
        except Exception as e:
            print(f"[{name}] FAILED: {e}")


if __name__ == "__main__":
    args = [a.lower() for a in sys.argv[1:]]
    targets = args if args else list(SCRAPERS.keys())
    invalid = [t for t in targets if t not in SCRAPERS]
    if invalid:
        print(f"Unknown scrapers: {invalid}. Available: {list(SCRAPERS.keys())}")
        sys.exit(1)
    asyncio.run(run_all(targets))
