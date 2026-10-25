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
PROGRESS_STATUSES = {"NOT_STARTED", "IN_PROGRESS", "BLOCKED", "COMPLETED"}
DIGEST_TAGS = {"progress-snapshot", "plan-content", "source-binding", "predecessor-reference", "progress-checkpoint"}
RECEIPT_CODES = {"PLAN_DRAFT_SAVED", "PLAN_REVIEW_READY", "PLAN_CONFIRMED", "PLAN_CANCELLED",
                 "PLAN_PROGRESS_RECORDED", "PLAN_REPLANNED"}
EVENT_COMMON_FIELDS = {"seq", "event_type", "from", "to", "operation_id", "operation_fingerprint",
                       "source_revision", "previous_hash", "record_hash"}
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


def _digest(tag, value):
    if tag not in DIGEST_TAGS:
        raise PlanError(HISTORY_ERROR)
    try:
        return hashlib.sha256(f"SM/J06/PHASE3B/{tag}/V1\n".encode("utf-8") + encoded(value)).hexdigest()
    except PlanError:
        raise PlanError(HISTORY_ERROR) from None


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


def _step_ids(plan):
    content = plan["content"]
    if (plan.get("status") in {"DRAFT", "CANCELLED", "STALE"} and isinstance(content, dict)
            and set(content) == {"title", "objective", "steps"} and content["steps"] == []):
        return []
    content = normalize_content(content)
    return [step["step_id"] for step in content["steps"]]


def _baseline_snapshot(plan):
    return {"progress_revision": 0, "step_statuses": {step_id: "NOT_STARTED" for step_id in _step_ids(plan)}}


def _progress_snapshot(plan):
    has_snapshot = "progress_snapshot" in plan
    has_checkpoint = "progress_checkpoint" in plan
    if has_snapshot != has_checkpoint:
        raise PlanError(HISTORY_ERROR)
    if not has_snapshot:
        snapshot = _baseline_snapshot(plan)
        if any(event.get("event_type") == "PROGRESS_UPDATE" and event.get("to", {}).get("plan_id") == plan.get("plan_id")
               for event in plan.get("transitions", [])):
            raise PlanError(HISTORY_ERROR)
        return snapshot
    snapshot = plan["progress_snapshot"]
    if not isinstance(snapshot, dict) or set(snapshot) != {"progress_revision", "step_statuses"}:
        raise PlanError(HISTORY_ERROR)
    revision = snapshot["progress_revision"]
    statuses = snapshot["step_statuses"]
    try:
        if type(revision) is not int or not 0 <= revision <= MAX_COUNTER:
            raise ValueError()
        expected_ids = set(_step_ids(plan))
        if not isinstance(statuses, dict) or set(statuses) != expected_ids or any(v not in PROGRESS_STATUSES for v in statuses.values()):
            raise ValueError()
        checkpoint = plan["progress_checkpoint"]
        fields = {"plan_id", "generation", "progress_revision", "snapshot_digest", "last_event_seq", "last_event_hash", "checkpoint_digest"}
        if not isinstance(checkpoint, dict) or set(checkpoint) != fields:
            raise ValueError()
        if checkpoint["plan_id"] != plan["plan_id"] or checkpoint["generation"] != plan["generation"] or checkpoint["progress_revision"] != revision:
            raise ValueError()
        snapshot_digest = _digest("progress-snapshot", snapshot)
        if not hmac.compare_digest(snapshot_digest, checkpoint["snapshot_digest"]):
            raise ValueError()
        event_seq = checkpoint["last_event_seq"]
        _counter(event_seq)
        if event_seq > plan["transition_sequence"]:
            raise ValueError()
        if not HEX.fullmatch(checkpoint["last_event_hash"]):
            raise ValueError()
        checkpoint_body = {k: v for k, v in checkpoint.items() if k != "checkpoint_digest"}
        if not HEX.fullmatch(checkpoint["checkpoint_digest"]) or not hmac.compare_digest(
                _digest("progress-checkpoint", checkpoint_body), checkpoint["checkpoint_digest"]):
            raise ValueError()
        retained_pointer = False
        first_retained = plan["transitions"][0]["seq"] if plan["transitions"] else plan["transition_sequence"] + 1
        latest_progress = None
        for event in plan["transitions"]:
            if (event["event_type"] == "PROGRESS_UPDATE"
                    and event["to"]["plan_id"] == plan["plan_id"]
                    and event["to"]["generation"] == plan["generation"]):
                latest_progress = event
            if event["seq"] == event_seq:
                retained_pointer = True
                if (event["event_type"] != "PROGRESS_UPDATE" or event["record_hash"] != checkpoint["last_event_hash"]
                        or event["to"]["plan_id"] != plan["plan_id"] or event["to"]["generation"] != plan["generation"]
                        or event["snapshot_after_digest"] != snapshot_digest):
                    raise ValueError()
        if event_seq >= first_retained and not retained_pointer:
            raise ValueError()
        if latest_progress is not None and (
                latest_progress["seq"] != event_seq
                or latest_progress["record_hash"] != checkpoint["last_event_hash"]
                or latest_progress["snapshot_after_digest"] != snapshot_digest
                or latest_progress["progress_revision_after"] != revision):
            raise ValueError()
        return deepcopy(snapshot)
    except (KeyError, TypeError, ValueError, PlanError):
        raise PlanError(HISTORY_ERROR) from None


def _predecessor_reference(plan):
    snapshot = _progress_snapshot(plan)
    confirmation = plan.get("confirmation_receipt")
    confirmation_digest = confirmation.get("digest") if isinstance(confirmation, dict) else None
    if not isinstance(confirmation_digest, str) or not HEX.fullmatch(confirmation_digest):
        raise PlanError(HISTORY_ERROR)
    reference = {"plan_id": plan["plan_id"], "generation": plan["generation"],
                 "plan_revision": plan["plan_revision"], "state_revision": plan["state_revision"],
                 "content_digest": _digest("plan-content", plan["content"]),
                 "confirmation_digest": confirmation_digest,
                 "source_binding_digest": _digest("source-binding", plan["source_binding"]),
                 "progress_revision": snapshot["progress_revision"],
                 "progress_snapshot_digest": _digest("progress-snapshot", snapshot)}
    return reference, _digest("predecessor-reference", reference), snapshot


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
    if event == "REPLAN":
        return (before["state"] in {"CONFIRMED", "STALE"} and after["state"] == "DRAFT"
                and before["plan_id"] != after["plan_id"] and after["generation"] == before["generation"] + 1
                and after["plan_revision"] == after["state_revision"] == 1)
    if event == "PROGRESS_UPDATE":
        try:
            _uuid(record.get("step_id"))
        except PlanError:
            return False
        return (before == after and before["state"] == "CONFIRMED"
                and record.get("status_before") in PROGRESS_STATUSES and record.get("status_after") in PROGRESS_STATUSES
                and type(record.get("progress_revision_before")) is int
                and type(record.get("progress_revision_after")) is int
                and record["progress_revision_after"] == record["progress_revision_before"] + 1
                and all(isinstance(record.get(k), str) and HEX.fullmatch(record[k]) for k in ("snapshot_before_digest", "snapshot_after_digest")))
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
            if receipt["result_code"] not in RECEIPT_CODES:
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
        for record in records:
            event = record.get("event_type") if isinstance(record, dict) else None
            extra = ({"step_id", "progress_revision_before", "progress_revision_after", "status_before", "status_after",
                      "snapshot_before_digest", "snapshot_after_digest"} if event == "PROGRESS_UPDATE" else
                     {"predecessor_reference_digest", "successor_content_digest", "successor_source_binding_digest"} if event == "REPLAN" else set())
            fields = EVENT_COMMON_FIELDS | extra
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
            if event == "PROGRESS_UPDATE":
                for key in ("progress_revision_before", "progress_revision_after"):
                    if type(record[key]) is not int or not 0 <= record[key] <= MAX_COUNTER:
                        raise ValueError()
                for key in ("snapshot_before_digest", "snapshot_after_digest"):
                    if not HEX.fullmatch(record[key]):
                        raise ValueError()
            if event == "REPLAN":
                for key in ("predecessor_reference_digest", "successor_content_digest", "successor_source_binding_digest"):
                    if not isinstance(record[key], str) or not HEX.fullmatch(record[key]):
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
                if event == "PROGRESS_UPDATE":
                    previous_progress = next((candidate for candidate in reversed(records[:records.index(record)])
                                              if candidate["event_type"] == "PROGRESS_UPDATE"
                                              and candidate["to"]["plan_id"] == record["to"]["plan_id"]
                                              and candidate["to"]["generation"] == record["to"]["generation"]), None)
                    if previous_progress and (previous_progress["progress_revision_after"] != record["progress_revision_before"]
                                              or previous_progress["snapshot_after_digest"] != record["snapshot_before_digest"]
                                              or (previous_progress["step_id"] == record["step_id"]
                                                  and previous_progress["status_after"] != record["status_before"])):
                        raise ValueError()
            previous = record
        result_by_event = {
            "CREATE": "PLAN_DRAFT_SAVED", "RESTART": "PLAN_DRAFT_SAVED", "CONTENT_EDIT": "PLAN_DRAFT_SAVED",
            "READY": "PLAN_REVIEW_READY", "CONFIRM": "PLAN_CONFIRMED", "CANCEL": "PLAN_CANCELLED",
            "PROGRESS_UPDATE": "PLAN_PROGRESS_RECORDED", "REPLAN": "PLAN_REPLANNED",
        }
        event_by_fingerprint = {record["operation_fingerprint"]: record["event_type"] for record in records}
        for receipt in receipts:
            event_type = event_by_fingerprint.get(receipt["fingerprint"])
            if event_type is not None and receipt["result_code"] != result_by_event[event_type]:
                raise ValueError()
        if (records[-1]["seq"] != plan["transition_sequence"] or records[-1]["record_hash"] != plan["transition_chain_head"]
                or records[-1]["to"] != _tuple(plan)):
            raise ValueError()
        predecessor_keys = ("predecessor_reference", "predecessor_reference_digest")
        if any(k in plan for k in predecessor_keys) != all(k in plan for k in predecessor_keys):
            raise ValueError()
        if all(k in plan for k in predecessor_keys):
            reference = plan["predecessor_reference"]
            ref_fields = {"plan_id", "generation", "plan_revision", "state_revision", "content_digest",
                          "confirmation_digest", "source_binding_digest", "progress_revision", "progress_snapshot_digest"}
            if not isinstance(reference, dict) or set(reference) != ref_fields:
                raise ValueError()
            _uuid(reference["plan_id"])
            if reference["plan_id"] == plan["plan_id"] or reference["generation"] + 1 != plan["generation"]:
                raise ValueError()
            for key in ("generation", "plan_revision", "state_revision"):
                _counter(reference[key])
            _counter(reference["progress_revision"], zero=True)
            if any(not isinstance(reference[key], str) or not HEX.fullmatch(reference[key])
                   for key in ("content_digest", "confirmation_digest", "source_binding_digest", "progress_snapshot_digest")):
                raise ValueError()
            if not hmac.compare_digest(_digest("predecessor-reference", reference), plan["predecessor_reference_digest"]):
                raise ValueError()
            replan_event = next((e for e in reversed(records) if e["event_type"] == "REPLAN"
                                 and e["to"]["plan_id"] == plan["plan_id"] and e["to"]["generation"] == plan["generation"]), None)
            if replan_event and (replan_event["predecessor_reference_digest"] != plan["predecessor_reference_digest"]
                                 or (plan["plan_revision"] == 1 and replan_event["successor_content_digest"] != _digest("plan-content", plan["content"]))
                                 or replan_event["successor_source_binding_digest"] != _digest("source-binding", plan["source_binding"])):
                raise ValueError()
        _progress_snapshot(plan)
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
    progress = _progress_snapshot(plan)
    view["progress_revision"] = progress["progress_revision"]
    view["step_statuses"] = deepcopy(progress["step_statuses"])
    view["predecessor_reference"] = deepcopy(plan.get("predecessor_reference"))
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
    if op not in {"PROGRESS_UPDATE", "REPLAN"}:
        for key in ("expected_progress_revision", "step_id", "status"):
            raw.pop(key, None)
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
                expected_phase3b_code = {"PROGRESS_UPDATE": "PLAN_PROGRESS_RECORDED", "REPLAN": "PLAN_REPLANNED"}.get(op)
                if expected_phase3b_code is not None and receipt["result_code"] != expected_phase3b_code:
                    raise PlanError(HISTORY_ERROR)
                if expected_phase3b_code is None and receipt["result_code"] in {"PLAN_PROGRESS_RECORDED", "PLAN_REPLANNED"}:
                    raise PlanError(HISTORY_ERROR)
                replay_code = receipt["result_code"] if receipt["result_code"] in {"PLAN_PROGRESS_RECORDED", "PLAN_REPLANNED"} else "PLAN_ALREADY_APPLIED"
                return _response(p, owner, replay_code)
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
    if op not in {"CANCEL", "RESTART", "REPLAN"} and effective == "STALE":
        raise PlanError("PLAN_STALE")
    binding = _binding(project, owner) if op != "CANCEL" else None
    event_extra = {}
    if op in {"CREATE", "RESTART", "REPLAN"}:
        if op == "REPLAN":
            if effective not in {"CONFIRMED", "STALE"}:
                raise PlanError("PLAN_REVISION_CONFLICT")
            predecessor_reference, predecessor_digest, predecessor_snapshot = _predecessor_reference(old)
            successor_id = str(uuid4())
            plan = {"plan_id": successor_id, "generation": _inc(old["generation"]),
                    "plan_revision": 1, "state_revision": 1, "status": "DRAFT",
                    "content": deepcopy(old["content"]), "source_binding": binding,
                    "confirmation_challenge": None, "predecessor_reference": predecessor_reference,
                    "predecessor_reference_digest": predecessor_digest,
                    "receipts": deepcopy(old["receipts"]), "transitions": deepcopy(old["transitions"]),
                    "transition_sequence": old["transition_sequence"],
                    "transition_chain_head": old["transition_chain_head"]}
            code, event = "PLAN_REPLANNED", "REPLAN"
            event_extra = {"predecessor_reference_digest": predecessor_digest,
                           "successor_content_digest": _digest("plan-content", plan["content"]),
                           "successor_source_binding_digest": _digest("source-binding", plan["source_binding"])}
        else:
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
        if op == "PROGRESS_UPDATE":
            if effective != "CONFIRMED" or raw["expected_status"] != "CONFIRMED":
                raise PlanError("PLAN_REVISION_CONFLICT")
            before_snapshot = _progress_snapshot(old)
            if raw["expected_progress_revision"] != before_snapshot["progress_revision"]:
                raise PlanError("PLAN_REVISION_CONFLICT")
            step_id = _uuid(raw["step_id"])
            if step_id not in before_snapshot["step_statuses"] or raw["status"] not in PROGRESS_STATUSES:
                raise PlanError("INVALID_PLAN")
            after_snapshot = deepcopy(before_snapshot)
            after_snapshot["progress_revision"] = _inc(before_snapshot["progress_revision"])
            before_status = before_snapshot["step_statuses"][step_id]
            after_snapshot["step_statuses"][step_id] = raw["status"]
            plan["progress_snapshot"] = after_snapshot
            code, event = "PLAN_PROGRESS_RECORDED", "PROGRESS_UPDATE"
            event_extra = {"step_id": step_id, "progress_revision_before": before_snapshot["progress_revision"],
                           "progress_revision_after": after_snapshot["progress_revision"],
                           "status_before": before_status, "status_after": raw["status"],
                           "snapshot_before_digest": _digest("progress-snapshot", before_snapshot),
                           "snapshot_after_digest": _digest("progress-snapshot", after_snapshot)}
        elif op == "EDIT":
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
              "source_revision": revision, "previous_hash": plan["transition_chain_head"] or "0" * 64,
              **event_extra}
    record["record_hash"] = _record_hash(record)
    if len(encoded(record)) > MAX_TRANSITION_BYTES:
        raise PlanError("PLAN_SIZE_LIMIT")
    plan["transitions"] = (plan["transitions"] + [record])[-20:]
    plan["transition_sequence"], plan["transition_chain_head"] = sequence, record["record_hash"]
    if op == "PROGRESS_UPDATE":
        checkpoint = {"plan_id": plan["plan_id"], "generation": plan["generation"],
                      "progress_revision": plan["progress_snapshot"]["progress_revision"],
                      "snapshot_digest": event_extra["snapshot_after_digest"], "last_event_seq": sequence,
                      "last_event_hash": record["record_hash"]}
        plan["progress_checkpoint"] = {**checkpoint, "checkpoint_digest": _digest("progress-checkpoint", checkpoint)}
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
