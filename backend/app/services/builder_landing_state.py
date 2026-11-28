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


PREVIEW_SCHEMA = "sm.builder.preview.v1"
MAX_PREVIEW_VERSIONS = 8


def _checked_preview(owner_id: str, project_id: str, preview: dict) -> dict:
    if not isinstance(preview, dict):
        raise LandingStateError("invalid_record", 422)
    if preview.get("schema") != PREVIEW_SCHEMA:
        raise LandingStateError("invalid_record", 422)
    if preview.get("ownerId") != owner_id or preview.get("projectId") != project_id:
        raise LandingStateError("invalid_record", 422)
    versions = preview.get("versions")
    if not isinstance(versions, list) or not versions or len(versions) > MAX_PREVIEW_VERSIONS:
        raise LandingStateError("invalid_record", 422)
    encoded = json.dumps(preview, ensure_ascii=False)
    if len(encoded.encode("utf-8")) > MAX_RECORD_BYTES:
        raise LandingStateError("record_too_large", 413)
    return preview


async def load_generated_preview(projects, landings, owner_id: str, project_id: str) -> dict:
    await _owned_project(projects, owner_id, project_id)
    document = await landings.find_one(
        {"project_id": project_id, "user_id": owner_id},
        {"_id": 0, "preview": 1, "preview_updated_at": 1},
    )
    preview = document.get("preview") if isinstance(document, dict) else None
    if not isinstance(preview, dict):
        raise LandingStateError("not_found", 404)
    return {"preview": preview, "updated_at": document.get("preview_updated_at")}


async def save_generated_preview(projects, landings, owner_id: str, project_id: str, preview: dict, updated_at: str | None = None) -> dict:
    """Store the generated preview beside the client record.

    The durable workspace keeps using `record`. This write does not replace it.
    """
    await _owned_project(projects, owner_id, project_id)
    preview = _checked_preview(owner_id, project_id, preview)
    stamp = updated_at or _now_iso()
    await landings.update_one(
        {"project_id": project_id, "user_id": owner_id},
        {"$set": {
            "project_id": project_id,
            "user_id": owner_id,
            "preview": preview,
            "preview_updated_at": stamp,
        }},
        upsert=True,
    )
    return {"updated_at": stamp, "preview": preview}


async def save_landing(projects, landings, owner_id: str, project_id: str, record: str, updated_at: str | None = None, expected_updated_at: str | None = None) -> dict:
    await _owned_project(projects, owner_id, project_id)
    record = _checked_record(owner_id, project_id, record)
    if expected_updated_at is not None:
        current = await landings.find_one(
            {"project_id": project_id, "user_id": owner_id},
            {"_id": 0, "record": 1, "updated_at": 1},
        )
        current_stamp = current.get("updated_at") if isinstance(current, dict) and isinstance(current.get("record"), str) else None
        if expected_updated_at == "0":
            if current_stamp is not None:
                raise LandingStateError("revision_conflict", 409)
        elif current_stamp != expected_updated_at:
            raise LandingStateError("revision_conflict", 409)
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
