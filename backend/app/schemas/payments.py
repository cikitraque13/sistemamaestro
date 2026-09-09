from typing import Optional

from pydantic import AnyHttpUrl, BaseModel


class CheckoutCreate(BaseModel):
    origin_url: AnyHttpUrl
    plan_id: Optional[str] = None
    item_type: Optional[str] = None
    item_id: Optional[str] = None
