# models.py – Pydantic domain models
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class EventOut(BaseModel):
    id: str
    source: str
    name: str
    url: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    location_raw: Optional[str] = None
    mode: Optional[str] = None
    organizer: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    prize_pool: Optional[str] = None
    participants: Optional[str] = None
    image_url: Optional[str] = None
    status: str = "active"

    model_config = {"from_attributes": True}


# alias kept for any remaining import
Event = EventOut
EventModel = EventOut

