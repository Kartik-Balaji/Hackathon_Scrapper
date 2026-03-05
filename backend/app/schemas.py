from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models import EventOut  # re-export


class EventsResponse(BaseModel):
    events: List[EventOut]
    total: int
    page: int
    page_size: int
    last_updated: Optional[datetime] = None


class MetaResponse(BaseModel):
    total_events: int
    active_events: int
    last_scrape_time: Optional[datetime] = None
