"""Bounded user-authored project plans. No Builder, provider or economy calls."""
from copy import deepcopy
from datetime import datetime, timezone
import hashlib
import hmac
import logging
import re
import unicodedata
from uuid import UUID, uuid4

from bson import BSON
from backend.app.ai.schemas.intent_clarification import POLICY_VERSION
from backend.app.services.intent_clarification import jcs, digest, IntentError

MAX_COUNTER = 9007199254740991
MAX_PLAN_BYTES = 96000
MAX_CONTENT_BYTES = 24000
MAX_TRANSITION_BYTES = 1024
MAX_PROJECT_BYTES = 15 * 1024 * 1024
HISTORY_ERROR = "PLAN_HISTORY_INTEGRITY_ERROR"
HISTORY_RESPONSE = {"code": HISTORY_ERROR, "retryable": False, "mutation_applied": False}
LABELS = {"title": "Título del plan", "objective": "Objetivo", "steps": "Pasos en orden",
          "step_id": "ID del paso", "step_title": "Título del paso", "description": "Descripción",
          "acceptance_criterion": "Criterio de aceptación"}
STATES = {"DRAFT", "READY_FOR_CONFIRMATION", "CONFIRMED", "CANCELLED", "STALE"}
HEX = re.compile(r"^[0-9a-f]{64}$")
WHITE_SPACE = frozenset("\u0009\u000a\u000b\u000c\u000d\u0020\u0085\u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000")
logger = logging.getLogger(__name__)


class PlanError(Exception):
    def __init__(self, code):
        self.code = code
        super().__init__(code)


def encoded(value):
    try:
        return jcs(value).encode("utf-8")
    except (IntentError, UnicodeError, ValueError, TypeError):
        raise PlanError("INVALID_PLAN") from None


def _hash(value):
    return hashlib.sha256(encoded(value)).hexdigest()


def _uuid(value):
    try:
        if not isinstance(value, str) or str(UUID(value)) != value:
            raise ValueError()
    except (ValueError, TypeError, AttributeError):
        raise PlanError("INVALID_PLAN") from None
    return value


def _counter(value, zero=False):
    if type(value) is not int or not (0 if zero else 1) <= value <= MAX_COUNTER:
        raise PlanError("PLAN_SIZE_LIMIT")
    return value


def _inc(value):
    return _counter(value + 1)


def _source_revision(project):
    value = project.get("updated_at", "0")
    if not isinstance(value, str) or len(encoded(value)) > 128:
        raise PlanError("PLAN_SIZE_LIMIT")
    if value != "0":
        try:
            if value != value.strip() or datetime.fromisoformat(value).tzinfo is None:
                raise ValueError()
        except ValueError:
            raise PlanError("PLAN_STALE") from None
    return value


def _text(value, maximum):
    if not isinstance(value, str):
        raise PlanError("INVALID_PLAN")
    value = unicodedata.normalize("NFC", value.replace("\r\n", "\n").replace("\r", "\n"))
    if len(value) > maximum or not any(c not in WHITE_SPACE for c in value):
        raise PlanError("INVALID_PLAN")
    encoded(value)
    return value


def normalize_content(raw):
    if not isinstance(raw, dict) or set(raw) != {"title", "objective", "steps"}:
        raise PlanError("INVALID_PLAN")
    if not isinstance(raw["steps"], list) or not 1 <= len(raw["steps"]) <= 12:
        raise PlanError("INVALID_PLAN")
    content = {"title": _text(raw["title"], 120), "objective": _text(raw["objective"], 1000), "steps": []}
    ids = set()
    for raw_step in raw["steps"]:
        if not isinstance(raw_step, dict) or set(raw_step) != {"step_id", "title", "description", "acceptance_criterion"}:
            raise PlanError("INVALID_PLAN")
        step_id = _uuid(raw_step["step_id"])
        if step_id in ids:
            raise PlanError("INVALID_PLAN")
        ids.add(step_id)
        content["steps"].append({"step_id": step_id, "title": _text(raw_step["title"], 120),
                                 "description": _text(raw_step["description"], 600),
                                 "acceptance_criterion": _text(raw_step["acceptance_criterion"], 400)})
    if len(encoded(content)) > MAX_CONTENT_BYTES:
        raise PlanError("PLAN_SIZE_LIMIT")
    return content


def _binding(project, owner):
    """Validate the persisted J06.1 confirmation, without reclassifying intent."""
    intent = project.get("active_j06_1_intent")
    if not isinstance(intent, dict) or intent.get("status") != "CONFIRMED":
        raise PlanError("INTENT_NOT_CONFIRMED")
    try:
        revision = _source_revision(project)
        receipt, challenge = intent["confirmation_receipt"], intent["confirmation_challenge"]
        envelope = challenge["envelope"]
        confirmation_digest = receipt["digest"]
        if (intent["bound_project_revision"] != revision or receipt["resulting_project_revision"] != revision
                or intent["intent_policy_version"] != POLICY_VERSION
                or envelope["owner_id"] != owner or envelope["project_id"] != project["project_id"]
                or envelope["intent_id"] != intent["intent_id"]
                or envelope["intent_policy_version"] != POLICY_VERSION
                or envelope["project_revision"] != receipt["confirmed_against_project_revision"]
                or envelope["source_revision_vector"] != intent["source_revision_vector"]
                or envelope["display_projection"] != challenge["display_projection"]
                or not isinstance(confirmation_digest, str) or not HEX.fullmatch(confirmation_digest)
                or not hmac.compare_digest(digest(envelope), confirmation_digest)
                or not hmac.compare_digest(challenge["digest"], confirmation_digest)):
            raise ValueError()
        return {"intent_id": intent["intent_id"], "confirmation_digest": confirmation_digest,
                "policy_version": POLICY_VERSION, "source_vector_digest": _hash(intent["source_revision_vector"]),
                "source_revision": revision}
    except PlanError:
        raise
    except (KeyError, TypeError, ValueError, IntentError):
        raise PlanError("INTENT_STALE") from None


def _effective_status(project, owner, plan):
    try:
        if _binding(project, owner) != plan["source_binding"]:
            return "STALE"
    except PlanError as exc:
        if exc.code == "PLAN_SIZE_LIMIT":
            raise
        return "STALE"
    return plan["status"]


def _tuple(plan, state=None):
    return {"plan_id": plan["plan_id"], "generation": plan["generation"], "state": state or plan["status"],
            "plan_revision": plan["plan_revision"], "state_revision": plan["state_revision"]}


def _check_tuple(value):
    if not isinstance(value, dict) or set(value) != {"plan_id", "generation", "state", "plan_revision", "state_revision"}:
        raise ValueError()
    _uuid(value["plan_id"])
    for key in ("generation", "plan_revision", "state_revision"):
        _counter(value[key])
    if value["state"] not in STATES:
        raise ValueError()


def _legal_event(record):
    before, after, event = record["from"], record["to"], record["event_type"]
    _check_tuple(after)
    if event == "CREATE":
        return before is None and after["generation"] == after["plan_revision"] == after["state_revision"] == 1 and after["state"] == "DRAFT"
    _check_tuple(before)
    if event == "RESTART":
        return (before["state"] in {"CANCELLED", "STALE"} and after["state"] == "DRAFT"
                and before["plan_id"] != after["plan_id"] and after["generation"] == before["generation"] + 1
                and after["plan_revision"] == after["state_revision"] == 1)
    if before["plan_id"] != after["plan_id"] or before["generation"] != after["generation"]:
        return False
    if event == "CONTENT_EDIT":
        return (before["state"] in {"DRAFT", "READY_FOR_CONFIRMATION"} and after["state"] == "DRAFT"
                and after["plan_revision"] == before["plan_revision"] + 1
                and after["state_revision"] == before["state_revision"] + (before["state"] != "DRAFT"))
    targets = {"READY": ({"DRAFT"}, "READY_FOR_CONFIRMATION"), "CONFIRM": ({"READY_FOR_CONFIRMATION"}, "CONFIRMED"),
               "CANCEL": ({"DRAFT", "READY_FOR_CONFIRMATION", "STALE"}, "CANCELLED")}
    if event not in targets:
        return False
    states, target = targets[event]
    return (before["state"] in states and after["state"] == target and after["plan_revision"] == before["plan_revision"]
            and after["state_revision"] == before["state_revision"] + 1)


def _record_hash(record):
    return hashlib.sha256(b"sm.j06.2.plan-transition.v1\n" + encoded({k: v for k, v in record.items() if k != "record_hash"})).hexdigest()


def verify_history(plan):
    try:
        if not isinstance(plan, dict):
            raise ValueError()
        receipt_fields = {"key", "fingerprint", "result_code", "plan_id", "generation", "plan_revision", "state_revision", "completed_at"}
        receipts = plan["receipts"]
        if not isinstance(receipts, list) or len(receipts) != min(plan["transition_sequence"], 64):
            raise ValueError()
        receipt_keys = set()
        for receipt in receipts:
            if not isinstance(receipt, dict) or set(receipt) != receipt_fields or len(encoded(receipt)) > 512:
                raise ValueError()
            if any(not isinstance(receipt[k], str) or not HEX.fullmatch(receipt[k]) for k in ("key", "fingerprint")) or receipt["key"] in receipt_keys:
                raise ValueError()
            receipt_keys.add(receipt["key"])
            _uuid(receipt["plan_id"])
            for k in ("generation", "plan_revision", "state_revision"):
                _counter(receipt[k])
            if receipt["result_code"] not in {"PLAN_DRAFT_SAVED", "PLAN_REVIEW_READY", "PLAN_CONFIRMED", "PLAN_CANCELLED"}:
                raise ValueError()
            if not isinstance(receipt["completed_at"], str) or datetime.fromisoformat(receipt["completed_at"]).tzinfo is None:
                raise ValueError()
        records = plan["transitions"]
        _counter(plan["transition_sequence"], zero=True)
        if not isinstance(records, list) or len(records) > 20:
            raise ValueError()
        if len(records) != min(plan["transition_sequence"], 20):
            raise ValueError()
        if not records:
            if plan["transition_sequence"] != 0 or plan["transition_chain_head"] is not None:
                raise ValueError()
            # A persisted plan cannot exist without its CREATE transition.
            if "plan_id" in plan:
                raise ValueError()
            return
        previous = None
        fields = {"seq", "event_type", "from", "to", "operation_id", "operation_fingerprint", "source_revision", "previous_hash", "record_hash"}
        for record in records:
            if not isinstance(record, dict) or set(record) != fields or len(encoded(record)) > MAX_TRANSITION_BYTES:
                raise ValueError()
            _counter(record["seq"])
            _uuid(record["operation_id"])
            if any(not isinstance(record[k], str) or not HEX.fullmatch(record[k]) for k in ("operation_fingerprint", "previous_hash", "record_hash")):
                raise ValueError()
            _source_revision({"updated_at": record["source_revision"]})
            if (record["previous_hash"] == "0" * 64) != (record["seq"] == 1):
                raise ValueError()
            if record["seq"] == 1 and record["event_type"] != "CREATE":
                raise ValueError()
            if record["seq"] > 1 and record["event_type"] == "CREATE":
                raise ValueError()
            if not _legal_event(record) or not hmac.compare_digest(_record_hash(record), record["record_hash"]):
                raise ValueError()
            if previous:
                if record["seq"] != previous["seq"] + 1 or record["previous_hash"] != previous["record_hash"]:
                    raise ValueError()
                prior, current = previous["to"], record["from"]
                if current is None or any(current[k] != prior[k] for k in ("plan_id", "generation", "plan_revision", "state_revision")):
                    raise ValueError()
                if current["state"] != prior["state"] and current["state"] != "STALE":
                    raise ValueError()
            previous = record
        if (records[-1]["seq"] != plan["transition_sequence"] or records[-1]["record_hash"] != plan["transition_chain_head"]
                or records[-1]["to"] != _tuple(plan)):
            raise ValueError()
    except (KeyError, TypeError, ValueError, PlanError):
        logger.warning(HISTORY_ERROR)
        raise PlanError(HISTORY_ERROR) from None


def _projection(plan):
    return {"schema": "sm.j06.2.plan-display.v1", "labels": dict(LABELS), "field_order": ["title", "objective", "steps"],
            "step_field_order": ["step_id", "title", "description", "acceptance_criterion"], **deepcopy(plan["content"])}


def _envelope(owner, pid, plan):
    return {"schema": "sm.j06.2.plan-confirmation.v1", "domain": "SM/J06.2/PLAN-CONFIRM/V1",
            "owner_id": owner, "project_id": pid, **deepcopy(plan["source_binding"]),
            "plan_id": plan["plan_id"], "generation": plan["generation"], "plan_revision": plan["plan_revision"],
            "state_revision": plan["state_revision"], "display_projection": _projection(plan), "unresolved_blocker_ids": []}


def project_plan_view(project, owner):
    plan = project.get("j06_2_plan")
    if plan is None:
        return None
    verify_history(plan)
    view = {k: deepcopy(plan[k]) for k in ("plan_id", "generation", "plan_revision", "state_revision", "content", "status")}
    view["stored_status"] = plan["status"]
    view["status"] = _effective_status(project, owner, plan)
    view["confirmation_challenge"] = deepcopy(plan.get("confirmation_challenge")) if view["status"] == "READY_FOR_CONFIRMATION" else None
    return view


def _response(project, owner, code=None):
    return {**({"code": code} if code else {}), "project_id": project["project_id"], "user_id": owner,
            "updated_at": project.get("updated_at", "0"), "plan": project_plan_view(project, owner)}


def _admit(project, plan):
    if len(encoded(plan)) > MAX_PLAN_BYTES:
        raise PlanError("PLAN_SIZE_LIMIT")
    try:
        if len(BSON.encode({**project, "j06_2_plan": plan})) > MAX_PROJECT_BYTES:
            raise PlanError("PLAN_SIZE_LIMIT")
    except PlanError:
        raise
    except Exception:
        raise PlanError("PERSISTENCE_UNAVAILABLE") from None


async def apply_plan(collection, owner, operation, expected):
    """One owner-scoped read plus one whole-plan CAS. Replay never writes."""
    raw = operation.model_dump()
    _uuid(raw["operation_id"])
    op = raw["operation_type"]
    if op == "EDIT":
        raw["content"] = normalize_content(raw["content"])
    elif raw["content"] is not None:
        raise PlanError("INVALID_PLAN")
    if op != "CONFIRM" and raw["digest"] is not None:
        raise PlanError("INVALID_PLAN")
    if op == "CONFIRM" and (not isinstance(raw["digest"], str) or not HEX.fullmatch(raw["digest"])):
        raise PlanError("DIGEST_MISMATCH")
    fingerprint = _hash({"domain": "SM/J06.2/OPERATION/V1", "owner_id": owner, "project_id": raw["projectId"],
                         "expected_source_revision": expected, "request": raw})
    key = _hash({"domain": "SM/J06.2/OPERATION/V1", "owner_id": owner, "project_id": raw["projectId"], "operation_id": raw["operation_id"]})
    async def read():
        try:
            p = await collection.find_one({"project_id": raw["projectId"], "user_id": owner})
        except Exception:
            raise PlanError("PERSISTENCE_UNAVAILABLE") from None
        if not p:
            raise PlanError("PROJECT_NOT_FOUND_OR_NOT_OWNED")
        if p.get("j06_2_plan") is not None:
            verify_history(p["j06_2_plan"])
        return p
    def replay(p):
        plan = p.get("j06_2_plan")
        if plan is None:
            return None
        receipts = plan.get("receipts")
        if not isinstance(receipts, list) or len(receipts) > 64:
            raise PlanError(HISTORY_ERROR)
        keys = set()
        for receipt in receipts:
            if not isinstance(receipt, dict) or len(encoded(receipt)) > 512 or receipt.get("key") in keys:
                raise PlanError(HISTORY_ERROR)
            keys.add(receipt.get("key"))
            if receipt.get("key") == key:
                if receipt.get("fingerprint") != fingerprint:
                    raise PlanError("IDEMPOTENCY_KEY_REUSE")
                return _response(p, owner, "PLAN_ALREADY_APPLIED")
        return None
    project = await read()
    result = replay(project)
    if result:
        return result
    revision = _source_revision(project)
    if expected != revision:
        raise PlanError("STALE_OPERATION")
    old = deepcopy(project.get("j06_2_plan"))
    effective = _effective_status(project, owner, old) if old else None
    if op == "CREATE":
        if old is not None:
            raise PlanError("STALE_OPERATION")
        if any(raw[k] is not None for k in ("plan_id", "generation", "plan_revision", "state_revision", "expected_status")):
            raise PlanError("INVALID_PLAN")
    else:
        if old is None:
            raise PlanError("STALE_OPERATION")
        for k in ("generation", "plan_revision", "state_revision"):
            _counter(raw[k])
        _uuid(raw["plan_id"])
        if any(raw[k] != old[k] for k in ("plan_id", "generation", "plan_revision", "state_revision")):
            raise PlanError("STALE_OPERATION")
        if raw["expected_status"] != effective:
            raise PlanError("PLAN_STALE" if effective == "STALE" else "PLAN_REVISION_CONFLICT")
    if op not in {"CANCEL", "RESTART"} and effective == "STALE":
        raise PlanError("PLAN_STALE")
    binding = _binding(project, owner) if op != "CANCEL" else None
    if op in {"CREATE", "RESTART"}:
        if op == "RESTART" and effective not in {"CANCELLED", "STALE"}:
            raise PlanError("PLAN_REVISION_CONFLICT")
        plan = {"plan_id": str(uuid4()), "generation": _inc(old["generation"]) if old else 1,
                "plan_revision": 1, "state_revision": 1, "status": "DRAFT",
                "content": {"title": "", "objective": "", "steps": []}, "source_binding": binding,
                "confirmation_challenge": None, "receipts": deepcopy(old["receipts"]) if old else [],
                "transitions": deepcopy(old["transitions"]) if old else [],
                "transition_sequence": old["transition_sequence"] if old else 0,
                "transition_chain_head": old["transition_chain_head"] if old else None}
        code = "PLAN_DRAFT_SAVED"
        event = op
    else:
        plan = deepcopy(old)
        if op == "EDIT":
            if effective not in {"DRAFT", "READY_FOR_CONFIRMATION"}:
                raise PlanError("PLAN_REVISION_CONFLICT")
            plan["content"] = raw["content"]
            plan["plan_revision"] = _inc(plan["plan_revision"])
            plan["state_revision"] += effective != "DRAFT"
            _counter(plan["state_revision"])
            plan["status"] = "DRAFT"
            plan["confirmation_challenge"] = None
            event, code = "CONTENT_EDIT", "PLAN_DRAFT_SAVED"
        elif op == "REVIEW":
            if effective != "DRAFT":
                raise PlanError("PLAN_REVISION_CONFLICT")
            plan["content"] = normalize_content(plan["content"])
            plan["status"] = "READY_FOR_CONFIRMATION"
            plan["state_revision"] = _inc(plan["state_revision"])
            envelope = _envelope(owner, raw["projectId"], plan)
            if len(encoded(envelope["display_projection"])) > MAX_CONTENT_BYTES:
                raise PlanError("PLAN_SIZE_LIMIT")
            plan["confirmation_challenge"] = {"envelope": envelope, "display_projection": envelope["display_projection"], "digest": _hash(envelope)}
            event, code = "READY", "PLAN_REVIEW_READY"
        elif op == "CONFIRM":
            if effective != "READY_FOR_CONFIRMATION":
                raise PlanError("PLAN_REVISION_CONFLICT")
            challenge = plan.get("confirmation_challenge")
            envelope = _envelope(owner, raw["projectId"], plan)
            calculated = _hash(envelope)
            if (not isinstance(challenge, dict) or challenge.get("envelope") != envelope
                    or challenge.get("display_projection") != envelope["display_projection"]
                    or not isinstance(challenge.get("digest"), str)
                    or not hmac.compare_digest(calculated, challenge["digest"])
                    or not hmac.compare_digest(calculated, raw["digest"])):
                raise PlanError("DIGEST_MISMATCH")
            plan["status"] = "CONFIRMED"
            plan["state_revision"] = _inc(plan["state_revision"])
            plan["confirmation_receipt"] = {"digest": calculated, "plan_revision": plan["plan_revision"], "state_revision": plan["state_revision"]}
            event, code = "CONFIRM", "PLAN_CONFIRMED"
        elif op == "CANCEL":
            if old["status"] == "CANCELLED" or effective not in {"DRAFT", "READY_FOR_CONFIRMATION", "STALE"}:
                raise PlanError("PLAN_REVISION_CONFLICT")
            plan["status"] = "CANCELLED"
            plan["state_revision"] = _inc(plan["state_revision"])
            plan["confirmation_challenge"] = None
            event, code = "CANCEL", "PLAN_CANCELLED"
        else:
            raise PlanError("INVALID_PLAN")
    sequence = _inc(plan["transition_sequence"])
    record = {"seq": sequence, "event_type": event, "from": _tuple(old, effective) if old else None,
              "to": _tuple(plan), "operation_id": raw["operation_id"], "operation_fingerprint": fingerprint,
              "source_revision": revision, "previous_hash": plan["transition_chain_head"] or "0" * 64}
    record["record_hash"] = _record_hash(record)
    if len(encoded(record)) > MAX_TRANSITION_BYTES:
        raise PlanError("PLAN_SIZE_LIMIT")
    plan["transitions"] = (plan["transitions"] + [record])[-20:]
    plan["transition_sequence"], plan["transition_chain_head"] = sequence, record["record_hash"]
    receipt = {"key": key, "fingerprint": fingerprint, "result_code": code, "plan_id": plan["plan_id"],
               "generation": plan["generation"], "plan_revision": plan["plan_revision"], "state_revision": plan["state_revision"],
               "completed_at": datetime.now(timezone.utc).isoformat()}
    if len(encoded(receipt)) > 512:
        raise PlanError("PLAN_SIZE_LIMIT")
    plan["receipts"] = (plan["receipts"] + [receipt])[-64:]
    verify_history(plan)
    _admit(project, plan)
    # Whole observed subdocument binds history, revisions and absence of the new
    # receipt key, preventing races with edits, restarts or idempotency reuse.
    predicate = {"project_id": raw["projectId"], "user_id": owner,
                 "updated_at": {"$exists": False} if revision == "0" else revision,
                 "j06_2_plan": old if old is not None else {"$exists": False},
                 "active_j06_1_intent": project.get("active_j06_1_intent", {"$exists": False})}
    try:
        result = await collection.update_one(predicate, {"$set": {"j06_2_plan": plan}})
    except Exception:
        raise PlanError("PERSISTENCE_UNAVAILABLE") from None
    if result.modified_count == 1:
        return _response({**project, "j06_2_plan": plan}, owner, code)
    current = await read()
    result = replay(current)
    if result:
        return result
    raise PlanError("PLAN_REVISION_CONFLICT")


async def read_plan(collection, owner, project_id):
    """Same owner-scoped recovery used by the existing project GET; no receipt."""
    try:
        project = await collection.find_one({"project_id": project_id, "user_id": owner})
    except Exception:
        raise PlanError("PERSISTENCE_UNAVAILABLE") from None
    if not project:
        raise PlanError("PROJECT_NOT_FOUND_OR_NOT_OWNED")
    return _response(project, owner)
