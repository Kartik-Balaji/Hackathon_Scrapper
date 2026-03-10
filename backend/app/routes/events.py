from typing import Optional, List
from fastapi import APIRouter, Query
from app import crud
from app.schemas import EventsResponse, MetaResponse
from app.models import EventOut

router = APIRouter()


@router.get("/events", response_model=EventsResponse)
async def list_events(
    q: Optional[str] = Query(None),
    mode: Optional[str] = Query(None),
    has_ppt: Optional[bool] = Query(None),
    source: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
):
    events, total = await crud.get_events(q=q, mode=mode, has_ppt=has_ppt, source=source, page=page, page_size=page_size)
    meta = await crud.get_meta()
    return EventsResponse(
        events=events,
        total=total,
        page=page,
        page_size=page_size,
        last_updated=meta["last_scrape_time"],
    )


@router.get("/globe", response_model=List[EventOut])
async def globe_events():
    """Return ALL geolocated events (lat+lon set) for the 3-D globe — no pagination."""
    await crud.cache.ensure_fresh()
    all_events = crud.cache.get_events_raw()
    geo_events = [
        EventOut(**{k: v for k, v in ev.items() if k in EventOut.model_fields})
        for ev in all_events
        if ev.get("latitude") is not None and ev.get("longitude") is not None
    ]
    return geo_events


@router.get("/meta", response_model=MetaResponse)
async def get_meta():
    meta = await crud.get_meta()
    return MetaResponse(**meta)
