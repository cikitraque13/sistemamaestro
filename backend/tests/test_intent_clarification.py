"""Offline J06.1 state/atomic-filter tests; no config or database imports."""
import asyncio
from copy import deepcopy
from datetime import datetime,timezone,timedelta
import hashlib
from types import SimpleNamespace
from uuid import uuid4
import pytest
from backend.app.ai.schemas.intent_clarification import IntentOperation,LABELS
from backend.app.services.intent_clarification import apply_intent,IntentError,jcs,digest,text_fingerprint

REV="2026-10-20T12:00:00+00:00"
def project():return {"project_id":"p","user_id":"owner","updated_at":REV,"input_type":"text","input_content":"Synthetic project","route":"idea","refine_answers":{"keep":"unchanged"}}
async def clear(data):return {"title":"Propuesta","goal":data["sources"]["request.text"],"scope":["Una página"],"assumptions":[],"success_criteria":["Confirmación"],"questions":data.get("questions",[]),"blocker_ids":[]}
async def ambiguous(data):
    r=await clear(data)
    r["questions"]=[{"question_id":"goal","question":"¿Para quién?","depends_on":["project.input_content"]}]
    r["blocker_ids"]=[] if data["answers"].get("goal") else ["goal"]
    return r
class Collection:
    def __init__(self,p=None):self.doc=deepcopy(p or project());self.filters=[];self.writes=0;self.barrier=None;self.reads=0
    async def find_one(self,q,projection=None):
        result=deepcopy(self.doc) if self.doc and all(self.doc.get(k)==v for k,v in q.items()) else None
        self.reads+=1
        if self.barrier and self.reads<=2:
            if self.reads==2:self.barrier.set()
            await self.barrier.wait()
        return result
    async def update_one(self,q,update):
        self.filters.append(deepcopy(q))
        for key,value in q.items():
            if key=="j06_1_operation_receipts":
                scope=value["$not"]["$elemMatch"]["scope_key"]
                if any(x["scope_key"]==scope for x in self.doc.get(key,[])):return SimpleNamespace(modified_count=0)
            else:
                current=self.doc
                for part in key.split('.'):
                    current=current.get(part) if isinstance(current,dict) else None
                if isinstance(value,dict) and value.get("$exists") is False:
                    if current is not None:return SimpleNamespace(modified_count=0)
                elif current!=value:return SimpleNamespace(modified_count=0)
        self.doc.update(deepcopy(update["$set"]))
        for key,value in update.get("$push",{}).items():self.doc.setdefault(key,[]).append(deepcopy(value))
        self.writes+=1
        return SimpleNamespace(modified_count=1)
def op(operation_type="CREATE_INTENT",result=None,**kw):
    data={"kind":"intent","projectId":"p","operation_id":str(uuid4()),"operation_type":operation_type}
    if result:
        i=result["intent"];data.update(intent_id=i["intent_id"],draft_revision=i["draft_revision"],state_revision=i["state_revision"])
    data.update(kw);return IntentOperation(**data)
def run(c,o,revision=REV,classifier=clear):return asyncio.run(apply_intent(c,"owner",o,revision,classifier))
def test_jcs_utf16_and_raw_fingerprint():
    assert jcs({"\ue000":1,"\U00010000":2})=='{"\U00010000":2,"\ue000":1}'
    assert text_fingerprint("é")==hashlib.sha256("é".encode()).hexdigest()
    assert text_fingerprint("x")!=digest("x")
@pytest.mark.parametrize('bad',[1.1,float('nan'),9007199254740992,"\ud800"])
def test_non_ijson_rejected(bad):
    with pytest.raises((IntentError,UnicodeError)):jcs(bad)
def test_ready_persisted_and_exact_confirm():
    c=Collection();r=run(c,op(text="Página"));i=r["intent"]
    assert i["status"]=="READY_FOR_CONFIRMATION"
    challenge=i["confirmation_challenge"]
    assert challenge["display_projection"]["labels"]==LABELS
    assert digest(challenge["envelope"])==challenge["digest"]
    assert c.doc["active_j06_1_intent"]["confirmation_challenge"]==challenge
    result=run(c,op("CONFIRM",r,digest=challenge["digest"]),r["updated_at"])
    assert result["intent"]["status"]=="CONFIRMED" and c.writes==2
    assert c.doc["refine_answers"]=={"keep":"unchanged"}
def test_replay_exact_no_second_call():
    c=Collection();o=op(text="Page");r=run(c,o)
    async def must_not_call(_):raise AssertionError()
    assert run(c,o,classifier=must_not_call)==r and c.writes==1
@pytest.mark.parametrize('same_body',[True,False])
def test_first_save_race_receipt_precedes_state(same_body):
    async def execute():
        c=Collection();c.barrier=asyncio.Event();a=op(text="A");b=a if same_body else a.model_copy(update={"text":"B"})
        results=await asyncio.gather(apply_intent(c,"owner",a,REV,clear),apply_intent(c,"owner",b,REV,clear),return_exceptions=True)
        assert c.writes==1 and len(c.doc["j06_1_operation_receipts"])==1
        if same_body:assert results[0]==results[1]
        else:assert [x.code for x in results if isinstance(x,IntentError)]==["IDEMPOTENCY_KEY_REUSED"]
    asyncio.run(execute())
def test_different_create_ids_race():
    async def execute():
        c=Collection();c.barrier=asyncio.Event()
        result=await asyncio.gather(*(apply_intent(c,"owner",op(text="A"),REV,clear) for _ in range(2)),return_exceptions=True)
        assert c.writes==1
        assert [x.code for x in result if isinstance(x,IntentError)]==["ACTIVE_INTENT_EXISTS"]
    asyncio.run(execute())
def test_clarification_then_confirmation():
    c=Collection();r=run(c,op(text="Page"),classifier=ambiguous)
    assert r["intent"]["status"]=="AWAITING_CLARIFICATION"
    r=run(c,op("ANSWER",r,answers={"goal":"Equipos"}),r["updated_at"],ambiguous)
    assert r["intent"]["status"]=="READY_FOR_CONFIRMATION"
    assert r["intent"]["answers"]["goal"]["text"]=="Equipos"
def test_unknown_answer_without_write():
    c=Collection();r=run(c,op(text="Page"),classifier=ambiguous);before=deepcopy(c.doc)
    with pytest.raises(IntentError,match="INVALID_REQUEST"):run(c,op("ANSWER",r,answers={"foreign":"X"}),r["updated_at"])
    assert c.doc==before
@pytest.mark.parametrize('kind',["failure","invalid"])
def test_classifier_failure_has_no_effect(kind):
    c=Collection();before=deepcopy(c.doc)
    async def failing(_):
        if kind=="failure":raise TimeoutError("not emitted")
        return {"extra":"bad"}
    with pytest.raises(IntentError,match="CLASSIFIER_UNAVAILABLE"):run(c,op(text="Page"),classifier=failing)
    assert c.doc==before
@pytest.mark.parametrize('field',["input_content","route"])
def test_external_revision_refresh_preserves_history(field):
    c=Collection();r=run(c,op(text="Page"),classifier=ambiguous)
    r=run(c,op("ANSWER",r,answers={"goal":"Team"}),r["updated_at"],ambiguous)
    c.doc[field]="changed";c.doc["updated_at"]="2026-11-20T12:00:00+00:00"
    with pytest.raises(IntentError,match="INTENT_STALE"):run(c,op("EDIT",r,text="X"),c.doc["updated_at"])
    result=run(c,op("REFRESH",r),c.doc["updated_at"],ambiguous)
    if field=="input_content":
        assert result["intent"]["status"]=="AWAITING_CLARIFICATION"
        assert any("superseded_value" in x for x in result["intent"]["history"])
    else:assert result["intent"]["answers"]["goal"]["text"]=="Team"
def test_digest_tamper_no_effect():
    c=Collection();r=run(c,op(text="Page"));before=deepcopy(c.doc)
    with pytest.raises(IntentError,match="DIGEST_MISMATCH"):run(c,op("CONFIRM",r,digest="0"*64),r["updated_at"])
    assert c.doc==before
def test_owner_isolation():
    c=Collection();o=op(text="Page")
    with pytest.raises(IntentError,match="ACCESS_DENIED"):asyncio.run(apply_intent(c,"foreign",o,REV,clear))
    assert c.writes==0
def test_tombstone_and_changed_fingerprint():
    c=Collection();o=op(text="Page");run(c,o);receipt=c.doc["j06_1_operation_receipts"][0];receipt["expired"]=True;receipt.pop("response")
    with pytest.raises(IntentError,match="IDEMPOTENCY_RESULT_EXPIRED"):run(c,o)
    with pytest.raises(IntentError,match="IDEMPOTENCY_KEY_REUSED"):run(c,o.model_copy(update={"text":"Other"}))
def test_cancel_and_supersede():
    c=Collection();r=run(c,op(text="Page"));new=run(c,op("SUPERSEDE_AND_CREATE",r,text="New"),r["updated_at"])
    assert new["intent"]["intent_id"]!=r["intent"]["intent_id"]
    assert new["intent"]["history"][0]["status"]=="SUPERSEDED"
    r=run(c,op("CANCEL",new),new["updated_at"]);assert r["intent"]["status"]=="CANCELLED"
def test_save_draft_has_no_challenge():
    c=Collection();r=run(c,op(text="Page"));r=run(c,op("SAVE_DRAFT",r),r["updated_at"])
    assert r["intent"]["status"]=="DRAFT" and r["intent"]["confirmation_challenge"] is None

def test_intent_route_dispatch_and_invalid_union_no_fallback():
    import sys
    sys.path.insert(0,str(__import__('pathlib').Path(__file__).parent))
    import test_consumption_callers as f
    from unittest.mock import AsyncMock,patch
    from pydantic import TypeAdapter,ValidationError
    from backend.app.routers.builder_ai import BuilderEndpointInput
    o=op(text="Test")
    with pytest.raises(ValidationError):TypeAdapter(BuilderEndpointInput).validate_python({"kind":"intent","userInput":"build","projectId":"p"})
    with patch.object(f.builder_ai,"db",SimpleNamespace(projects=object())), patch.object(f.builder_ai,"apply_intent",new=AsyncMock(return_value={"code":"DRAFT_SAVED"})) as intent_call, patch.object(f.builder_ai,"run_economic_operation",new=AsyncMock()) as economic, patch.object(f.builder_ai,"run_builder_agent",new=AsyncMock()) as builder:
        result=asyncio.run(f.builder_ai.build_with_ai(o,SimpleNamespace(headers={"If-Match":REV})))
        assert result["code"]=="DRAFT_SAVED"
        intent_call.assert_awaited_once();economic.assert_not_awaited();builder.assert_not_awaited()

def test_refresh_policy_invalidates_inference_and_answers_before_regeneration():
    from backend.app.ai.schemas.intent_clarification import POLICY_VERSION
    c=Collection();r=run(c,op(text="Page"),classifier=ambiguous)
    r=run(c,op("ANSWER",r,answers={"goal":"Old answer"}),r["updated_at"],ambiguous)
    c.doc["active_j06_1_intent"]["intent_policy_version"]="previous-policy"
    observed=[]
    async def regenerated(data):
        observed.append(deepcopy(data))
        return await clear(data)
    r=run(c,op("REFRESH",r),r["updated_at"],regenerated)
    assert observed[0]["answers"]=={} and observed[0]["questions"]==[]
    assert r["intent"]["intent_policy_version"]==POLICY_VERSION
    assert any(h.get("intent_policy_version")=="previous-policy" and h["superseded_value"]["answers"]["goal"]["text"]=="Old answer" for h in r["intent"]["history"])
    assert r["intent"]["status"]=="READY_FOR_CONFIRMATION"
    confirmed=run(c,op("CONFIRM",r,digest=r["intent"]["confirmation_challenge"]["digest"]),r["updated_at"])
    assert confirmed["intent"]["status"]=="CONFIRMED"
def test_save_draft_preserves_proposal_and_content_revision():
    c=Collection();r=run(c,op(text="Page"));before=deepcopy(r["intent"])
    saved=run(c,op("SAVE_DRAFT",r),r["updated_at"])
    assert saved["intent"]["proposal"]==before["proposal"]
    assert saved["intent"]["draft_revision"]==before["draft_revision"]
    assert int(saved["intent"]["state_revision"])==int(before["state_revision"])+1
    assert saved["intent"]["confirmation_challenge"] is None
def test_question_dependency_change_invalidates_answer_with_same_text():
    c=Collection();r=run(c,op(text="Page"),classifier=ambiguous)
    r=run(c,op("ANSWER",r,answers={"goal":"Old answer"}),r["updated_at"],ambiguous)
    async def changed(data):
        value=await ambiguous(data);value["questions"][0]["depends_on"]=["project.route"];return value
    result=run(c,op("EDIT",r),r["updated_at"],changed)
    assert result["intent"]["questions"][0]["question_revision"]=="2"
    assert "goal" not in result["intent"]["answers"]
    assert result["intent"]["status"]=="AWAITING_CLARIFICATION"
    assert any(h.get("question_id")=="goal" and h["superseded_value"]["text"]=="Old answer" for h in result["intent"]["history"])
@pytest.mark.parametrize('tamper',["label","extra_projection","source_revision","owner","draft_revision"])
def test_stored_display_schema_and_bound_field_tampering_rejected(tamper):
    c=Collection();r=run(c,op(text="Page"));challenge=c.doc["active_j06_1_intent"]["confirmation_challenge"]
    challenge["envelope"]=deepcopy(challenge["envelope"])
    if tamper=="label":challenge["display_projection"]["labels"]["goal"]="Different"
    elif tamper=="extra_projection":challenge["display_projection"]["extra"]="hidden"
    elif tamper=="source_revision":challenge["envelope"]["source_revision_vector"][0]["source_revision"]="different"
    elif tamper=="owner":challenge["envelope"]["owner_id"]="foreign"
    else:challenge["envelope"]["draft_revision"]="99"
    before=deepcopy(c.doc)
    with pytest.raises(IntentError,match="DIGEST_MISMATCH"):run(c,op("CONFIRM",r,digest=r["intent"]["confirmation_challenge"]["digest"]),r["updated_at"])
    assert c.doc==before
@pytest.mark.parametrize('field',["owner_id","project_id","intent_id","project_revision","draft_revision","ready_state_revision","intent_policy_version"])
def test_each_bound_scalar_changes_digest(field):
    c=Collection();r=run(c,op(text="Page"));e=r["intent"]["confirmation_challenge"]["envelope"];old=digest(e);e[field]+="-changed";assert digest(e)!=old
@pytest.mark.parametrize('outcome',["same_tombstone","different_tombstone","unreadable"])
def test_post_cas_reread_outcomes(outcome):
    class RacingCollection(Collection):
        async def update_one(self,q,update):
            await super().update_one(q,update)
            receipt=self.doc["j06_1_operation_receipts"][0]
            if outcome=="different_tombstone":receipt["fingerprint"]="different"
            receipt["expired"]=True;receipt.pop("response")
            return SimpleNamespace(modified_count=0)
        async def find_one(self,q,projection=None):
            if outcome=="unreadable" and self.reads:raise TimeoutError("not emitted")
            return await super().find_one(q,projection)
    c=RacingCollection()
    expected={"same_tombstone":"IDEMPOTENCY_RESULT_EXPIRED","different_tombstone":"IDEMPOTENCY_KEY_REUSED","unreadable":"PERSISTENCE_UNAVAILABLE"}[outcome]
    with pytest.raises(IntentError,match=expected):run(c,op(text="Page"))
    assert c.writes==1


# Physical receipt retention tests. The fake implements the Mongo operators
# used by this narrowly scoped worker; Atlas proves those operators separately.
from backend.app.services.intent_clarification import ReceiptCompactionPass, compact_project_receipts, run_receipt_compaction_worker
NOW = datetime(2026, 12, 20, tzinfo=timezone.utc)
TOMBSTONE_FIELDS = {"scope_key", "fingerprint", "original_code", "resulting_ids", "resulting_revisions", "expired"}
def full_receipt(pid="p",key="scope",age=31):
    return {"scope_key":key,"fingerprint":"fingerprint","original_code":"DRAFT_SAVED",
        "resulting_ids":{"project_id":pid,"intent_id":"intent"},
        "resulting_revisions":{"project_revision":REV,"draft_revision":"1","state_revision":"1"},
        "operation_type":"CREATE_INTENT","completed_at":(NOW-timedelta(days=age)).isoformat(),"response":{"code":"DRAFT_SAVED","sensitive_body":"SYNTHETIC"}}
def maintenance_project(number=1,age=31):
    pid="maintenance-"+str(number)
    return {"_id":number,"project_id":pid,"user_id":"owner", "updated_at":REV,
        "active_j06_1_intent":{"status":"DRAFT","draft_revision":"1","state_revision":"1","confirmation_digest":"unchanged","source_revision_vector":[]},
        "j06_1_operation_receipts":[full_receipt(pid,age=age)]}
class MaintenanceCollection:
    def __init__(self,documents):
        self.docs={p["_id"]:deepcopy(p) for p in documents};self.failed=set();self.cas_miss=set();self.attempts=[];self.queries=[];self.updates=[]
    def find(self,query,projection):
        self.queries.append((deepcopy(query),deepcopy(projection)))
        collection=self
        class Cursor:
            def sort(self,*args):return self
            def limit(self,length):self.length=length;return self
            async def to_list(self,length):
                cutoff=query["j06_1_operation_receipts"]["$elemMatch"]["completed_at"]["$lte"]
                result=[]
                for ident,p in sorted(collection.docs.items()):
                    if "_id" in query and ident<=query["_id"]["$gt"]:continue
                    if not any("response" in r and r.get("completed_at", "z")<=cutoff for r in p["j06_1_operation_receipts"]):continue
                    doc={k:deepcopy(p[k]) for k in ("_id","project_id","user_id","updated_at") if k in p}
                    names={k.split('.',1)[1] for k in projection if k.startswith("j06_1_operation_receipts.")}
                    doc["j06_1_operation_receipts"]=[{k:deepcopy(v) for k,v in r.items() if k in names} for r in p["j06_1_operation_receipts"]]
                    result.append(doc)
                return result[:min(length,self.length)]
        return Cursor()
    async def update_one(self,predicate,update,array_filters=None):
        ident=predicate["_id"];self.attempts.append(ident);self.updates.append((deepcopy(predicate),deepcopy(update),deepcopy(array_filters)))
        if ident in self.failed:raise RuntimeError("SYNTHETIC_EXCEPTION_DO_NOT_LOG")
        p=self.docs[ident]
        if ident in self.cas_miss:return SimpleNamespace(modified_count=0)
        for key in ("project_id","user_id","updated_at"):
            expected=predicate[key]
            if isinstance(expected,dict):
                if key in p:return SimpleNamespace(modified_count=0)
            elif p.get(key)!=expected:return SimpleNamespace(modified_count=0)
        conditions=predicate["j06_1_operation_receipts"]["$elemMatch"]["$or"]
        selected=[r for r in p["j06_1_operation_receipts"] if any(all((key=="response" and "response" in r) or (key!="response" and r.get(key)==value) for key,value in condition.items()) for condition in conditions)]
        if not selected:return SimpleNamespace(modified_count=0)
        for r in selected:
            r["expired"]=True
            for key in ("response","operation_type","completed_at"):r.pop(key,None)
        return SimpleNamespace(modified_count=1)

def test_receipt_creation_contains_tombstone_metadata():
    c=Collection();result=run(c,op(text="Page"));receipt=c.doc["j06_1_operation_receipts"][0]
    assert receipt["original_code"]==result["code"]
    assert receipt["resulting_ids"]=={"project_id":"p","intent_id":result["intent"]["intent_id"]}
    assert receipt["resulting_revisions"]=={"project_revision":result["updated_at"],"draft_revision":"1","state_revision":"1"}
def test_compaction_exact_tombstone_live_retention_and_revision_stability():
    p=maintenance_project();p["j06_1_operation_receipts"].append(full_receipt(p["project_id"],key="live",age=29))
    c=MaintenanceCollection([p]);before=deepcopy(c.docs[1]);stats=asyncio.run(ReceiptCompactionPass().tick(c,NOW))
    assert stats=={"selected":1,"modified":1,"failed":0}
    tombstone=c.docs[1]["j06_1_operation_receipts"][0]
    assert set(tombstone)==TOMBSTONE_FIELDS
    assert tombstone=={**{k:before["j06_1_operation_receipts"][0][k] for k in TOMBSTONE_FIELDS-{"expired"}},"expired":True}
    assert c.docs[1]["j06_1_operation_receipts"][1]==before["j06_1_operation_receipts"][1]
    assert c.docs[1]["updated_at"]==before["updated_at"]
    assert c.docs[1]["active_j06_1_intent"]==before["active_j06_1_intent"]
    assert all("response" not in projection and "j06_1_operation_receipts.response" not in projection for _,projection in c.queries)
    assert [r["scope_key"] for r in c.docs[1]["j06_1_operation_receipts"]]==["scope","live"]
def test_compaction_keyset_more_than_page_progresses_past_failures_and_misses(caplog):
    c=MaintenanceCollection([maintenance_project(i) for i in range(1,206)])
    c.failed={1};c.cas_miss={2};progress=ReceiptCompactionPass()
    first=asyncio.run(progress.tick(c,NOW));second=asyncio.run(progress.tick(c,NOW));third=asyncio.run(progress.tick(c,NOW))
    assert first=={"selected":100,"modified":98,"failed":1}
    assert second["selected"]==100 and third["selected"]==5
    assert c.attempts==list(range(1,206))
    assert progress.cursor==205
    assert all("SYNTHETIC_EXCEPTION_DO_NOT_LOG" not in rec.message for rec in caplog.records)
    # End of pass wraps: failing/missed early entries remain eligible.
    wrapped=asyncio.run(progress.tick(c,NOW));assert wrapped["selected"]==2 and c.attempts[-2:]==[1,2]
    assert all(len([i for i in c.attempts if i==ident])==1 for ident in range(3,206))
def test_compaction_restart_fresh_cursor_reaches_later_records():
    c=MaintenanceCollection([maintenance_project(i) for i in range(1,152)]);c.failed={1}
    initial=ReceiptCompactionPass();asyncio.run(initial.tick(c,NOW));assert initial.cursor==100
    restarted=ReceiptCompactionPass();stats=asyncio.run(restarted.tick(c,NOW))
    assert stats["selected"]==52 and restarted.cursor==151
    assert all("response" not in c.docs[i]["j06_1_operation_receipts"][0] for i in range(2,152))
def test_compaction_two_workers_same_revision_one_update():
    async def execute():
        c=MaintenanceCollection([maintenance_project()]);metadata=deepcopy(c.docs[1]);metadata["j06_1_operation_receipts"][0].pop("response")
        results=await asyncio.gather(*(compact_project_receipts(c,deepcopy(metadata),NOW-timedelta(days=30)) for _ in range(2)))
        assert sum(results)==1
        assert c.docs[1]["updated_at"]==REV
        assert set(c.docs[1]["j06_1_operation_receipts"][0])==TOMBSTONE_FIELDS
    asyncio.run(execute())
def test_compaction_observed_revision_mismatch_preserves_body():
    c=MaintenanceCollection([maintenance_project()]);project=deepcopy(c.docs[1]);project["j06_1_operation_receipts"][0].pop("response")
    c.docs[1]["updated_at"]="2026-12-20T00:00:00+00:00"
    assert asyncio.run(compact_project_receipts(c,project,NOW-timedelta(days=30)))==0
    assert "response" in c.docs[1]["j06_1_operation_receipts"][0]
def test_compaction_malformed_due_receipt_skipped_without_data_loss(caplog):
    p=maintenance_project();p["j06_1_operation_receipts"][0].pop("resulting_revisions")
    c=MaintenanceCollection([p]);before=deepcopy(c.docs[1]);stats=asyncio.run(ReceiptCompactionPass().tick(c,NOW))
    assert stats["failed"]==1 and c.docs[1]==before and c.attempts==[]
    assert "INVALID_METADATA" in caplog.text
@pytest.mark.parametrize('age,expired',[(timedelta(days=30)-timedelta(microseconds=1),False),(timedelta(days=30),True)])
def test_logical_expiry_exact_boundary_no_write(age,expired):
    import backend.app.services.intent_clarification as service
    from unittest.mock import patch
    class FrozenDatetime(datetime):
        @classmethod
        def now(cls,tz=None):return NOW
    c=Collection();o=op(text="Page");result=run(c,o);receipt=c.doc["j06_1_operation_receipts"][0];receipt["completed_at"]=(NOW-age).isoformat();before=deepcopy(c.doc)
    with patch.object(service,"datetime",FrozenDatetime):
        if expired:
            with pytest.raises(IntentError,match="IDEMPOTENCY_RESULT_EXPIRED"):run(c,o)
        else:assert run(c,o)==result
    assert c.doc==before and c.writes==1

def test_worker_cadence_and_shutdown_cancellation_before_close():
    import ast
    import contextlib
    from pathlib import Path
    from unittest.mock import AsyncMock,patch
    import backend.app.services.intent_clarification as service
    main=Path(__file__).parents[1]/"app"/"main.py"
    tree=ast.parse(main.read_text(encoding="utf-8-sig"));functions=[n for n in tree.body if isinstance(n,ast.AsyncFunctionDef) and n.name in {"startup_event","shutdown_db_client"}]
    for n in functions:n.decorator_list=[]
    events=[]
    async def fake_worker(collection):
        events.append("start")
        try:await asyncio.Event().wait()
        finally:events.append("cancelled")
    def close():events.append("close")
    index=AsyncMock();collection=SimpleNamespace(create_index=index)
    db=SimpleNamespace(**{name:collection for name in ("users","projects","user_sessions","payment_transactions","login_attempts","newsletter_subscribers")})
    namespace={"asyncio":asyncio,"suppress":contextlib.suppress,"app":SimpleNamespace(state=SimpleNamespace()),"db":db,"client":SimpleNamespace(close=close),"run_receipt_compaction_worker":fake_worker}
    exec(compile(ast.Module(body=functions,type_ignores=[]),str(main),"exec"),namespace)
    async def execute():
        await namespace["startup_event"]();await asyncio.sleep(0);await namespace["shutdown_db_client"]()
    asyncio.run(execute());assert events==["start","cancelled","close"]
    intervals=[]
    async def stop_sleep(seconds):intervals.append(seconds);raise asyncio.CancelledError()
    with patch.object(service.asyncio,"sleep",stop_sleep):
        with pytest.raises(asyncio.CancelledError):asyncio.run(run_receipt_compaction_worker(object()))
    assert intervals==[900]

def test_compaction_absent_revision_uses_existing_absence_cas():
    p=maintenance_project();p.pop("updated_at");c=MaintenanceCollection([p])
    stats=asyncio.run(ReceiptCompactionPass().tick(c,NOW))
    assert stats["modified"]==1 and "updated_at" not in c.docs[1]
    assert c.updates[0][0]["updated_at"]=={"$exists":False}
def test_physical_expiry_at_boundary_and_early_body_retained():
    due=maintenance_project(1,age=30);early=maintenance_project(2,age=30)
    early["j06_1_operation_receipts"][0]["completed_at"]=(NOW-timedelta(days=30)+timedelta(microseconds=1)).isoformat()
    c=MaintenanceCollection([due,early]);stats=asyncio.run(ReceiptCompactionPass().tick(c,NOW))
    assert stats["selected"]==1 and stats["modified"]==1
    assert "response" in c.docs[2]["j06_1_operation_receipts"][0]
@pytest.mark.parametrize('field,value',[("user_id","another-owner"),("project_id","another-project")])
def test_compaction_identity_cas_rejects_changed_owner_or_project(field,value):
    c=MaintenanceCollection([maintenance_project()]);selected=deepcopy(c.docs[1]);selected["j06_1_operation_receipts"][0].pop("response")
    c.docs[1][field]=value
    assert asyncio.run(compact_project_receipts(c,selected,NOW-timedelta(days=30)))==0
    assert "response" in c.docs[1]["j06_1_operation_receipts"][0]
