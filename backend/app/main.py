import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.events import router
import app.database as cache


async def _auto_refresh_loop():
    """Background task: refresh cache every 30 minutes."""
    while True:
        await asyncio.sleep(cache.CACHE_TTL_SECONDS)
        try:
            await cache.ensure_fresh(force=True)
        except Exception as e:
            print(f"[AutoRefresh] Error: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm the cache on startup (non-blocking: let server start immediately)
    asyncio.create_task(cache.ensure_fresh(force=True))
    asyncio.create_task(_auto_refresh_loop())
    print("[API] Server ready. Cache warming in background...")
    yield


app = FastAPI(
    title="Hackathon Globe Radar API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/")
async def root():
    return {"status": "ok", "message": "Hackathon Globe Radar API"}

