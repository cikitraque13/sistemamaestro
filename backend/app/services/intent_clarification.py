"""J06.1 single-project atomic intent lifecycle; no economic/build integration."""
from copy import deepcopy
from datetime import datetime, timezone, timedelta
import asyncio
import logging
import hashlib
import hmac
import json
from uuid import UUID, uuid4
from backend.app.ai.schemas.intent_clarification import LABELS, POLICY_VERSION, Inference
from backend.app.ai.agents.intent_clarification import classify_intent
from backend.app.services.project_context_snapshot import build_project_context_snapshot

TERMINAL={"CONFIRMED","CANCELLED","SUPERSEDED"}
PROJECT_PATHS={"project.input_type","project.input_content","project.route"}
class IntentError(Exception):
    def __init__(self,code): self.code=code

def jcs(value):
    """RFC8785 subset used by R4: null, bool, safe integers, strings, arrays/objects.
    Floats are not in the closed intent contract. UTF-16 member ordering is JCS.
    """
    if value is None:return "null"
    if isinstance(value,bool):return "true" if value else "false"
    if isinstance(value,int):
        if abs(value)>9007199254740991:raise IntentError("INVALID_REQUEST")
        return str(value)
    if isinstance(value,str):
        try:value.encode("utf-8")
        except UnicodeError:raise IntentError("INVALID_REQUEST") from None
        return json.dumps(value,ensure_ascii=False,separators=(",",":"))
    if isinstance(value,list):return "["+",".join(jcs(x) for x in value)+"]"
    if isinstance(value,dict) and all(isinstance(k,str) for k in value):
        return "{"+",".join(jcs(k)+":"+jcs(value[k]) for k in sorted(value,key=lambda s:s.encode("utf-16-be")))+"}"
    raise IntentError("INVALID_REQUEST")
def digest(value):return hashlib.sha256(jcs(value).encode("utf-8")).hexdigest()
def text_fingerprint(value):return hashlib.sha256(value.encode("utf-8")).hexdigest()
def _revision(p):return p.get("updated_at","0")
def _next(expected):
    now=datetime.now(timezone.utc)
    if expected!="0":now=max(now,datetime.fromisoformat(expected)+timedelta(microseconds=1))
    return now.isoformat()
def _receipts(p,key,fingerprint):
    receipts=p.get("j06_1_operation_receipts",[])
    if not isinstance(receipts,list) or any(not isinstance(x,dict) or not isinstance(x.get("scope_key"),str) or not isinstance(x.get("fingerprint"),str) for x in receipts):raise IntentError("PERSISTENCE_UNAVAILABLE")
    if len({x["scope_key"] for x in receipts})!=len(receipts):raise IntentError("PERSISTENCE_UNAVAILABLE")
    for x in receipts:
        if x["scope_key"]==key:
            if x["fingerprint"]!=fingerprint:raise IntentError("IDEMPOTENCY_KEY_REUSED")
            if x.get("expired") or datetime.now(timezone.utc)-datetime.fromisoformat(x["completed_at"])>=timedelta(days=30):raise IntentError("IDEMPOTENCY_RESULT_EXPIRED")
            return deepcopy(x["response"])
    return None

def _sources(project,request_id,text,questions,answers):
    try:snapshot=build_project_context_snapshot(project,project_id=project["project_id"],expected_revision=_revision(project),context_use="project_overview")
    except Exception:raise IntentError("INTENT_STALE") from None
    source=[]; values={"request.text":text}
    for item in snapshot["items"]:
        path=item["source"]
        if path not in PROJECT_PATHS:raise IntentError("INTENT_STALE")
        values[path]=item["value"]
        source.append({"source_id":project["project_id"],"field_path":path,"provenance":item["provenance"],"source_revision":item["revision"],"value_sha256":text_fingerprint(item["value"]),"depends_on_question_ids":[q["question_id"] for q in questions if path in q["depends_on"]]})
    source.append({"source_id":request_id,"field_path":"request.text","provenance":"user_authored","source_revision":"1","value_sha256":text_fingerprint(text),"depends_on_question_ids":[q["question_id"] for q in questions]})
    source.append({"source_id":"server","field_path":"intent_policy_version","provenance":"server_owned","source_revision":POLICY_VERSION,"value_sha256":text_fingerprint(POLICY_VERSION),"depends_on_question_ids":[q["question_id"] for q in questions]})
    for q in questions:
        qid=q["question_id"]
        if qid in answers:
            a=answers[qid]
            source.append({"source_id":qid,"field_path":"clarification.answer","provenance":"user_authored","source_revision":q.get("question_revision","1")+":"+a["revision"],"value_sha256":text_fingerprint(a["text"]),"depends_on_question_ids":[qid]})
    return sorted(source,key=lambda x:(x["field_path"],x["source_id"])),values

def _projection(intent):
    proposal=intent["proposal"]
    result={"schema":"sm.j06.1.intent-display.v1","labels":dict(LABELS),**{k:proposal[k] for k in ("title","goal","scope","assumptions","success_criteria")},
        "clarifications":[{"question_id":q["question_id"],"question":q["question"],"answer":intent["answers"].get(q["question_id"],{}).get("text","")} for q in intent["questions"]],
        "sources":[{"label":s["provenance"],"field_path":s["field_path"],"revision":s["source_revision"]} for s in intent["source_revision_vector"]]}
    if len(jcs(result).encode("utf-8"))>24000:raise IntentError("INVALID_REQUEST")
    return result

def _envelope(owner,project_id,intent,revision):
    return {"domain":"SM/J06.1/INTENT-CONFIRM/V1","schema":"sm.j06.1.confirmation-envelope.v1","owner_id":owner,"project_id":project_id,"intent_id":intent["intent_id"],"project_revision":revision,"draft_revision":intent["draft_revision"],"ready_state_revision":intent["state_revision"],"intent_policy_version":POLICY_VERSION,"display_projection":_projection(intent),"source_revision_vector":intent["source_revision_vector"],"unresolved_blocker_ids":[]}

def _validate_inference(raw):
    try:result=Inference.model_validate(raw).model_dump()
    except Exception:raise IntentError("CLASSIFIER_UNAVAILABLE") from None
    ids=[q["question_id"] for q in result["questions"]]
    if len(ids)!=len(set(ids)) or set(result["blocker_ids"])-set(ids):raise IntentError("CLASSIFIER_UNAVAILABLE")
    for key in ("scope","assumptions","success_criteria"):
        if any(not isinstance(x,str) or len(x)>2000 for x in result[key]):raise IntentError("CLASSIFIER_UNAVAILABLE")
    for q in result["questions"]:
        if set(q["depends_on"])-(PROJECT_PATHS|{"request.text"}):raise IntentError("CLASSIFIER_UNAVAILABLE")
    return result

async def apply_intent(collection,owner,op,expected,classifier=None,revision_factory=None):
    """Collection injection keeps local tests offline and real Atlas tests isolated."""
    classifier=classifier or classify_intent
    try:
        if str(UUID(op.operation_id))!=op.operation_id:raise ValueError()
        if any(len(k)>80 or len(v)>2000 for k,v in op.answers.items()):raise ValueError()
        jcs(op.model_dump())
    except Exception:raise IntentError("INVALID_REQUEST") from None
    create=op.operation_type=="CREATE_INTENT"
    if create and any((op.intent_id,op.draft_revision,op.state_revision,op.answers,op.digest)):raise IntentError("INVALID_REQUEST")
    if not create and not all((op.intent_id,op.draft_revision,op.state_revision)):raise IntentError("INVALID_REQUEST")
    key=digest({"owner_id":owner,"project_id":op.projectId,"operation_id":op.operation_id})
    fingerprint=digest({"domain":"SM/J06.1/OPERATION/V1","owner_id":owner,"project_id":op.projectId,"operation_id":op.operation_id,"operation_type":op.operation_type,"expected_project_revision":expected,"intent_id":op.intent_id,"draft_revision":op.draft_revision,"state_revision":op.state_revision,"normalized_mutation_body":{"text":op.text,"answers":op.answers,"digest":op.digest}})
    async def read():
        try:return await collection.find_one({"project_id":op.projectId,"user_id":owner},{"_id":0})
        except Exception:raise IntentError("PERSISTENCE_UNAVAILABLE") from None
    project=await read()
    if not project:raise IntentError("ACCESS_DENIED")
    replay=_receipts(project,key,fingerprint)
    if replay is not None:return replay
    old=deepcopy(project.get("active_j06_1_intent"))
    def conflict(p):
        active=p.get("active_j06_1_intent")
        if create:
            if active is not None:raise IntentError("ACTIVE_INTENT_EXISTS")
            if _revision(p)!=expected:raise IntentError("REVISION_CONFLICT")
        else:
            if not active or active["intent_id"]!=op.intent_id or active["status"] in TERMINAL:raise IntentError("INTENT_NOT_CURRENT")
            if op.operation_type!="REFRESH" and (active["bound_project_revision"]!=_revision(p) or active.get("intent_policy_version")!=POLICY_VERSION):raise IntentError("INTENT_STALE")
            if active["draft_revision"]!=op.draft_revision or active["state_revision"]!=op.state_revision:raise IntentError("DRAFT_STALE")
            if _revision(p)!=expected:raise IntentError("REVISION_CONFLICT")
    conflict(project)
    revision=(revision_factory or _next)(expected)
    if create or op.operation_type=="SUPERSEDE_AND_CREATE":
        if not op.text:raise IntentError("INVALID_REQUEST")
        intent={"intent_id":str(uuid4()),"request_id":str(uuid4()),"text":op.text,"draft_revision":"1","state_revision":"1","questions":[],"answers":{},"history":[],"status":"DRAFT","intent_policy_version":POLICY_VERSION}
        if old:intent["history"].append({"status":"SUPERSEDED","intent":old})
    else:
        intent=deepcopy(old)
        intent["state_revision"]=str(int(intent["state_revision"])+1)
    intent["confirmation_challenge"]=None
    operation=op.operation_type
    if operation=="CONFIRM":
        challenge=old.get("confirmation_challenge")
        if old["status"]!="READY_FOR_CONFIRMATION" or not challenge or not op.digest:raise IntentError("DIGEST_MISMATCH")
        vector,_=_sources(project,old["request_id"],old["text"],old["questions"],old["answers"])
        if vector!=old["source_revision_vector"]:raise IntentError("INTENT_STALE")
        envelope=_envelope(owner,op.projectId,old,expected)
        if challenge.get("envelope")!=envelope or challenge.get("display_projection")!=envelope["display_projection"]:raise IntentError("DIGEST_MISMATCH")
        calculated=digest(envelope)
        if not hmac.compare_digest(calculated,challenge["digest"]) or not hmac.compare_digest(calculated,op.digest):raise IntentError("DIGEST_MISMATCH")
        intent["status"]="CONFIRMED";intent["confirmation_challenge"]=challenge
        intent["confirmation_receipt"]={"digest":calculated,"confirmed_against_project_revision":expected,"resulting_project_revision":revision}
        code="INTENT_CONFIRMED"
    elif operation=="CANCEL":
        if op.text or op.answers or op.digest:raise IntentError("INVALID_REQUEST")
        intent["status"]="CANCELLED";code="INTENT_CANCELLED"
    else:
        if operation in {"ANSWER","EDIT"}:
            if op.digest:raise IntentError("INVALID_REQUEST")
            ids={q["question_id"] for q in intent["questions"]}
            if set(op.answers)-ids:raise IntentError("INVALID_REQUEST")
            if op.text is not None and op.text!=intent["text"]:
                intent["history"].append({"superseded_value":deepcopy(intent["answers"]),"text":intent["text"]})
                intent["answers"]={};intent["questions"]=[];intent["text"]=op.text;intent["request_id"]=str(uuid4())
            for qid,text in op.answers.items():
                prior=intent["answers"].get(qid)
                if prior:intent["history"].append({"question_id":qid,"superseded_value":prior})
                intent["answers"][qid]={"text":text,"revision":str(int(prior["revision"])+1 if prior else 1)}
            intent["draft_revision"]=str(int(intent["draft_revision"])+1)
        elif operation=="REFRESH":
            if op.text or op.answers or op.digest:raise IntentError("INVALID_REQUEST")
            if intent.get("intent_policy_version")!=POLICY_VERSION:
                intent["history"].append({"intent_policy_version":intent.get("intent_policy_version"),"superseded_value":{"proposal":deepcopy(intent["proposal"]),"questions":deepcopy(intent["questions"]),"answers":deepcopy(intent["answers"])}})
                intent["proposal"]={};intent["questions"]=[];intent["answers"]={};intent["blocker_ids"]=[]
                intent["intent_policy_version"]=POLICY_VERSION
            current,_=_sources(project,intent["request_id"],intent["text"],intent["questions"],intent["answers"])
            before={s["field_path"]:s["value_sha256"] for s in intent["source_revision_vector"]}
            changed={s["field_path"] for s in current if before.get(s["field_path"])!=s["value_sha256"]}
            for q in intent["questions"]:
                qid=q["question_id"]
                if changed.intersection(q["depends_on"]) and qid in intent["answers"]:
                    intent["history"].append({"question_id":qid,"superseded_value":intent["answers"].pop(qid)})
            intent["history"].append({"status":"STALE","source_revision_vector":old["source_revision_vector"]})
            intent["draft_revision"]=str(int(intent["draft_revision"])+1)
        vector,values=_sources(project,intent["request_id"],intent["text"],intent["questions"],intent["answers"])
        if operation=="SAVE_DRAFT":
            raw={**deepcopy(intent["proposal"]),"questions":deepcopy(intent["questions"]),"blocker_ids":list(intent.get("blocker_ids",[]))}
        else:
            try:raw=_validate_inference(await classifier({"sources":values,"answers":{k:v["text"] for k,v in intent["answers"].items()},"questions":[{k:q[k] for k in ("question_id","question","depends_on")} for q in intent["questions"]]}))
            except Exception:raise IntentError("CLASSIFIER_UNAVAILABLE") from None
        # Existing questions retain identity/revision; no silent remapping.
        old_questions={q["question_id"]:q for q in intent["questions"]}
        for q in raw["questions"]:
            q["question_revision"]=old_questions.get(q["question_id"],{}).get("question_revision","1")
            prior=old_questions.get(q["question_id"])
            if prior and (prior["question"]!=q["question"] or prior["depends_on"]!=q["depends_on"]):
                q["question_revision"]=str(int(prior["question_revision"])+1)
                if q["question_id"] not in raw["blocker_ids"]:raw["blocker_ids"].append(q["question_id"])
                if q["question_id"] in intent["answers"]:intent["history"].append({"question_id":q["question_id"],"superseded_value":intent["answers"].pop(q["question_id"])})
        removed=set(old_questions)-{q["question_id"] for q in raw["questions"]}
        for qid in removed:
            if qid in intent["answers"]:intent["history"].append({"question_id":qid,"superseded_value":intent["answers"].pop(qid)})
        intent["questions"]=raw["questions"]
        intent["proposal"]={k:raw[k] for k in ("title","goal","scope","assumptions","success_criteria")}
        intent["blocker_ids"]=[qid for qid in raw["blocker_ids"] if qid not in intent["answers"] or not intent["answers"][qid]["text"].strip()]
        intent["status"]="DRAFT" if operation=="SAVE_DRAFT" else "AWAITING_CLARIFICATION" if intent["blocker_ids"] else "READY_FOR_CONFIRMATION"
        # Rebind only after own successful write; externally changed revisions
        # still fail closed. Preserve superseded source vectors in history.
        rebound=dict(project,updated_at=revision)
        intent["source_revision_vector"],_=_sources(rebound,intent["request_id"],intent["text"],intent["questions"],intent["answers"])
        if intent["status"]=="READY_FOR_CONFIRMATION":
            envelope=_envelope(owner,op.projectId,intent,revision)
            intent["confirmation_challenge"]={"envelope":envelope,"display_projection":envelope["display_projection"],"digest":digest(envelope)}
        code={"DRAFT":"DRAFT_SAVED","AWAITING_CLARIFICATION":"CLARIFICATION_REQUIRED","READY_FOR_CONFIRMATION":"INTENT_REVIEW_REQUIRED"}[intent["status"]]
    intent["bound_project_revision"]=revision
    if len(jcs(intent).encode("utf-8"))>120000:raise IntentError("INVALID_REQUEST")
    response={"code":code,"project_id":op.projectId,"user_id":owner,"updated_at":revision,"intent":intent}
    receipt={"scope_key":key,"fingerprint":fingerprint,"original_code":code,
        "resulting_ids":{"project_id":op.projectId,"intent_id":intent["intent_id"]},
        "resulting_revisions":{"project_revision":revision,"draft_revision":intent["draft_revision"],"state_revision":intent["state_revision"]},
        "operation_type":operation,"completed_at":datetime.now(timezone.utc).isoformat(),"response":response}
    predicate={"project_id":op.projectId,"user_id":owner,"updated_at":{"$exists":False} if expected=="0" else expected,"j06_1_operation_receipts":{"$not":{"$elemMatch":{"scope_key":key}}}}
    if create:predicate["active_j06_1_intent"]={"$exists":False}
    else:
        for field in ("intent_id","draft_revision","state_revision","status"):
            predicate["active_j06_1_intent."+field]=old[field]
        if operation=="CONFIRM":
            predicate["active_j06_1_intent.confirmation_challenge.digest"]=op.digest
            predicate["active_j06_1_intent.source_revision_vector"]=old["source_revision_vector"]
    try:
        result=await collection.update_one(predicate,{"$set":{"active_j06_1_intent":intent,"updated_at":revision},"$push":{"j06_1_operation_receipts":receipt}})
    except Exception:raise IntentError("PERSISTENCE_UNAVAILABLE") from None
    if result.modified_count==1:return deepcopy(response)
    current=await read()
    if not current:raise IntentError("ACCESS_DENIED")
    replay=_receipts(current,key,fingerprint)
    if replay is not None:return replay
    conflict(current)
    raise IntentError("PERSISTENCE_UNAVAILABLE")


# A narrow lifecycle worker, not an intent operation: replay never invokes it.
COMPACTION_INTERVAL_SECONDS = 15 * 60
COMPACTION_PAGE_SIZE = 100
_RECEIPT_METADATA = ("scope_key", "fingerprint", "original_code", "resulting_ids", "resulting_revisions", "completed_at", "operation_type", "expired")
_COMPACTION_LOG = logging.getLogger(__name__)

def _safe_compaction_failure(category):
    # Categories only: no IDs, bodies, fingerprints or exception messages.
    _COMPACTION_LOG.warning("J061_RECEIPT_COMPACTION_%s", category)

def _compaction_receipts(project, cutoff):
    receipts = project.get("j06_1_operation_receipts")
    if not isinstance(receipts, list):
        raise IntentError("INVALID_RECEIPT_METADATA")
    seen = set()
    selected = []
    for receipt in receipts:
        if not isinstance(receipt, dict):
            raise IntentError("INVALID_RECEIPT_METADATA")
        scope = receipt.get("scope_key")
        if not isinstance(scope, str) or not scope or scope in seen:
            raise IntentError("INVALID_RECEIPT_METADATA")
        seen.add(scope)
        if receipt.get("expired") is True:
            if "completed_at" in receipt or "operation_type" in receipt:
                raise IntentError("INVALID_RECEIPT_METADATA")
            continue
        try:
            completed = datetime.fromisoformat(receipt["completed_at"])
            if completed.tzinfo is None:
                raise ValueError()
        except (KeyError, ValueError, TypeError):
            raise IntentError("INVALID_RECEIPT_METADATA") from None
        if completed > cutoff:
            continue
        required = {"scope_key", "fingerprint", "original_code", "resulting_ids", "resulting_revisions", "completed_at", "operation_type"}
        if not required.issubset(receipt) or any(not isinstance(receipt[k], str) or not receipt[k] for k in ("fingerprint", "original_code", "operation_type")):
            raise IntentError("INVALID_RECEIPT_METADATA")
        ids, revisions = receipt["resulting_ids"], receipt["resulting_revisions"]
        if not isinstance(ids, dict) or set(ids) != {"project_id", "intent_id"} or ids["project_id"] != project.get("project_id") or any(not isinstance(v, str) or not v for v in ids.values()):
            raise IntentError("INVALID_RECEIPT_METADATA")
        if not isinstance(revisions, dict) or set(revisions) != {"project_revision", "draft_revision", "state_revision"} or any(not isinstance(v, str) or not v for v in revisions.values()):
            raise IntentError("INVALID_RECEIPT_METADATA")
        selected.append({k: deepcopy(receipt[k]) for k in required})
    return selected

async def compact_project_receipts(collection, project, cutoff):
    """One atomic metadata-only maintenance CAS; no project revision changes."""
    if not isinstance(project.get("project_id"), str) or not isinstance(project.get("user_id"), str):
        raise IntentError("INVALID_RECEIPT_METADATA")
    selected = _compaction_receipts(project, cutoff)
    if not selected:
        return 0
    revision = project.get("updated_at", {"$exists": False})
    if "updated_at" in project:
        if not isinstance(revision, str) or not revision:
            raise IntentError("INVALID_RECEIPT_METADATA")
        try:
            if datetime.fromisoformat(revision).tzinfo is None:raise ValueError()
        except (ValueError, TypeError):raise IntentError("INVALID_RECEIPT_METADATA") from None
    # Exact metadata guards prevent compacting an element whose identity or
    # retained result changed since the narrow projected selection.
    element_conditions = [{**item, "response": {"$exists": True}} for item in selected]
    predicate = {"_id": project["_id"], "project_id": project["project_id"], "user_id": project["user_id"], "updated_at": revision,
        "j06_1_operation_receipts": {"$elemMatch": {"$or": element_conditions}}}
    array_conditions = [{"old." + key: value for key, value in condition.items()} for condition in element_conditions]
    update = {"$set": {"j06_1_operation_receipts.$[old].expired": True},
        "$unset": {"j06_1_operation_receipts.$[old].response": "", "j06_1_operation_receipts.$[old].operation_type": "", "j06_1_operation_receipts.$[old].completed_at": ""}}
    result = await collection.update_one(predicate, update, array_filters=[{"$or": array_conditions}])
    return result.modified_count

class ReceiptCompactionPass:
    """In-memory stable keyset, deliberately reset on worker restart."""
    def __init__(self):
        self.cursor = None

    async def tick(self, collection, now=None):
        cutoff = (now or datetime.now(timezone.utc)) - timedelta(days=30)
        due = {"completed_at": {"$lte": cutoff.isoformat()}, "response": {"$exists": True}}
        projection = {"_id": 1, "project_id": 1, "user_id": 1, "updated_at": 1,
            **{"j06_1_operation_receipts." + name: 1 for name in _RECEIPT_METADATA}}
        async def page():
            query = {"j06_1_operation_receipts": {"$elemMatch": due}}
            if self.cursor is not None:query["_id"] = {"$gt": self.cursor}
            return await collection.find(query, projection).sort("_id", 1).limit(COMPACTION_PAGE_SIZE).to_list(length=COMPACTION_PAGE_SIZE)
        try:
            projects = await page()
            if not projects and self.cursor is not None:
                self.cursor = None
                projects = await page()
        except asyncio.CancelledError:
            raise
        except Exception:
            _safe_compaction_failure("SELECTION_FAILED")
            return {"selected": 0, "modified": 0, "failed": 1}
        stats = {"selected": len(projects), "modified": 0, "failed": 0}
        for project in projects:
            # Advance before processing, including malformed metadata/CAS misses.
            self.cursor = project["_id"]
            try:
                stats["modified"] += await compact_project_receipts(collection, project, cutoff)
            except asyncio.CancelledError:
                raise
            except IntentError:
                stats["failed"] += 1
                _safe_compaction_failure("INVALID_METADATA")
            except Exception:
                stats["failed"] += 1
                _safe_compaction_failure("UPDATE_FAILED")
        return stats

async def run_receipt_compaction_worker(collection):
    progress = ReceiptCompactionPass()
    while True:
        # Cadence is per pass, not a maximum per-record retention guarantee.
        await asyncio.sleep(COMPACTION_INTERVAL_SECONDS)
        await progress.tick(collection)
