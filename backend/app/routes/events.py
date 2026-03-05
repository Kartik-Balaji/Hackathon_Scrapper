from typing import Optional
from fastapi import APIRouter, Query
from app import crud
from app.schemas import EventsResponse, MetaResponse

router = APIRouter()


@router.get("/events", response_model=EventsResponse)
async def list_events(
    q: Optional[str] = Query(None),
    mode: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
):
    events, total = await crud.get_events(q=q, mode=mode, page=page, page_size=page_size)
    meta = await crud.get_meta()
    return EventsResponse(
        events=events,
        total=total,
        page=page,
        page_size=page_size,
        last_updated=meta["last_scrape_time"],
    )


@router.get("/meta", response_model=MetaResponse)
async def get_meta():
    meta = await crud.get_meta()
    return MetaResponse(**meta)
