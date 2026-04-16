from typing import Optional

from pydantic import BaseModel


class CheckoutCreate(BaseModel):
    origin_url: str
    plan_id: Optional[str] = None
    item_type: Optional[str] = None
    item_id: Optional[str] = None
