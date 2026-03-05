"""Nominatim geocoder – free, no API key required."""
import asyncio
import httpx

_CACHE: dict[str, tuple[float, float] | None] = {}

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
HEADERS = {"User-Agent": "HackathonGlobeRadar/1.0 (educational project)"}


async def geocode(location: str) -> tuple[float, float] | None:
    """Return (lat, lng) or None."""
    if not location:
        return None
    key = location.strip().lower()
    if key in _CACHE:
        return _CACHE[key]

    params = {"q": location, "format": "json", "limit": 1}
    try:
        async with httpx.AsyncClient(headers=HEADERS, timeout=10) as client:
            resp = await client.get(NOMINATIM_URL, params=params)
            data = resp.json()
            if data:
                result = (float(data[0]["lat"]), float(data[0]["lon"]))
                _CACHE[key] = result
                return result
    except Exception as e:
        print(f"[Geocoder] Failed for '{location}': {e}")

    _CACHE[key] = None
    return None


if __name__ == "__main__":
    async def _test():
        r = await geocode("San Francisco, CA")
        print(r)
    asyncio.run(_test())
