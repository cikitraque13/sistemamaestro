"""Per-project builder landing record.

The authenticated owner is the only reader and writer. The stored value is
the client record string, unchanged, so a later browser can load the same bytes.
"""
import json
from datetime import datetime, timezone

MAX_RECORD_BYTES = 400 * 1024


class LandingStateError(Exception):
    def __init__(self, code: str, status: int):
        super().__init__(code)
        self.code = code
        self.status = status


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _checked_record(owner_id: str, project_id: str, record: str) -> str:
    if not isinstance(record, str) or not record.strip():
        raise LandingStateError("invalid_record", 422)
    if len(record.encode("utf-8")) > MAX_RECORD_BYTES:
        raise LandingStateError("record_too_large", 413)
    try:
        parsed = json.loads(record)
    except json.JSONDecodeError as exc:
        raise LandingStateError("invalid_record", 422) from exc
    if not isinstance(parsed, dict):
        raise LandingStateError("invalid_record", 422)
    if parsed.get("ownerId") != owner_id or parsed.get("projectId") != project_id:
        raise LandingStateError("invalid_record", 422)
    return record


async def _owned_project(projects, owner_id: str, project_id: str):
    project = await projects.find_one(
        {"project_id": project_id, "user_id": owner_id},
        {"_id": 0, "project_id": 1},
    )
    if not project:
        raise LandingStateError("not_found", 404)
    return project


async def load_landing(projects, landings, owner_id: str, project_id: str) -> dict:
    await _owned_project(projects, owner_id, project_id)
    document = await landings.find_one(
        {"project_id": project_id, "user_id": owner_id},
        {"_id": 0, "record": 1, "updated_at": 1},
    )
    if not document or not isinstance(document.get("record"), str):
        raise LandingStateError("not_found", 404)
    return {"record": document["record"], "updated_at": document.get("updated_at")}


async def save_landing(projects, landings, owner_id: str, project_id: str, record: str, updated_at: str | None = None) -> dict:
    await _owned_project(projects, owner_id, project_id)
    record = _checked_record(owner_id, project_id, record)
    stamp = updated_at or _now_iso()
    await landings.update_one(
        {"project_id": project_id, "user_id": owner_id},
        {"$set": {
            "project_id": project_id,
            "user_id": owner_id,
            "record": record,
            "updated_at": stamp,
        }},
        upsert=True,
    )
    return {"updated_at": stamp}
