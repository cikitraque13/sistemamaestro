"""Explicit opt-in integration against isolated Atlas Testing only.
No credentials or backend configuration are read during module import.
"""
import asyncio
from copy import deepcopy
import json
import os
from pathlib import Path
from urllib.parse import urlsplit,unquote
from uuid import uuid4
import pytest
from backend.app.ai.schemas.intent_clarification import IntentOperation
from backend.app.services.intent_clarification import apply_intent,IntentError

pytestmark=pytest.mark.skipif(os.environ.get("SM_J061_ATLAS_AUTHORIZED")!="YES",reason="isolated Atlas authorization required")
async def mock_classifier(data):
    question={"question_id":"audience","question":"Audience?","depends_on":["project.input_content"]}
    return {"title":"Synthetic intention","goal":data["sources"]["request.text"],"scope":["One page"],"assumptions":[],"success_criteria":["Explicit confirmation"],"questions":[question],"blocker_ids":[] if data["answers"].get("audience") else ["audience"]}
def operation(pid,kind="CREATE_INTENT",prior=None,**values):
    raw={"kind":"intent","projectId":pid,"operation_id":str(uuid4()),"operation_type":kind}
    if prior:
        i=prior["intent"];raw.update(intent_id=i["intent_id"],draft_revision=i["draft_revision"],state_revision=i["state_revision"])
    return IntentOperation(**dict(raw,**values))
async def scenario(body):
    if os.environ.get("DB_NAME")!="sistemamaestro_test" or os.environ.get("PYTHON_DOTENV_DISABLED")!="1":raise RuntimeError("ATLAS_GUARD_FAILED")
    uri=os.environ.get("MONGO_URL","")
    parsed=urlsplit(uri)
    if parsed.scheme!="mongodb+srv" or parsed.hostname!="sm-testing.hbnrkcj.mongodb.net" or unquote(parsed.username or "")!="sm_testing_app" or parsed.path!="/sistemamaestro_test":raise RuntimeError("ATLAS_GUARD_FAILED")
    marker=Path(os.environ.get("SM_J061_CLEANUP_MARKER",""))
    if not marker.is_absolute() or not marker.is_file():raise RuntimeError("CLEANUP_MARKER_REQUIRED")
    record=json.loads(marker.read_text(encoding="utf-8-sig"))
    run_id=record["run_id"]
    if len(run_id)!=32 or not isinstance(record.get("documents"),list):raise RuntimeError("CLEANUP_MARKER_INVALID")
    pid="smj061-"+uuid4().hex;owner="smj061-owner-"+uuid4().hex
    record["documents"].append({"project_id":pid,"owner_id":owner})
    marker.write_text(json.dumps(record),encoding="utf-8")
    from motor.motor_asyncio import AsyncIOMotorClient
    client=AsyncIOMotorClient(uri,serverSelectionTimeoutMS=5000,connectTimeoutMS=5000)
    collection=client["sistemamaestro_test"]["projects"]
    identity={"project_id":pid,"user_id":owner,"_sm_j061_run":run_id}
    original={**identity,"updated_at":"2026-10-20T12:00:00+00:00","input_type":"text","input_content":"Synthetic page","route":"idea","refine_answers":{"historical":"preserve"}}
    try:
        await collection.insert_one(deepcopy(original))
        await body(collection,pid,owner,original)
    finally:
        try:
            await collection.delete_one(identity)
            if await collection.count_documents(identity)!=0:raise RuntimeError("CLEANUP_NOT_VERIFIED")
        finally:client.close()
async def create(c,p,o,original):return await apply_intent(c,o,operation(p,text="Synthetic page"),original["updated_at"],mock_classifier)
def test_real_separate_recovery_and_joint_confirmation():
    async def body(c,p,o,original):
        r=await create(c,p,o,original)
        saved=await c.find_one({"project_id":p,"user_id":o})
        assert saved["active_j06_1_intent"]["status"]=="AWAITING_CLARIFICATION"
        r=await apply_intent(c,o,operation(p,"ANSWER",r,answers={"audience":"Teams"}),r["updated_at"],mock_classifier)
        challenge=r["intent"]["confirmation_challenge"]
        r=await apply_intent(c,o,operation(p,"CONFIRM",r,digest=challenge["digest"]),r["updated_at"],mock_classifier)
        assert r["intent"]["status"]=="CONFIRMED"
        assert (await c.find_one({"project_id":p,"user_id":o}))["refine_answers"]==original["refine_answers"]
    asyncio.run(scenario(body))
def test_real_owner_isolation():
    async def body(c,p,o,original):
        with pytest.raises(IntentError,match="ACCESS_DENIED"):await apply_intent(c,"smj061-owner-foreign",operation(p,text="X"),original["updated_at"],mock_classifier)
        assert "active_j06_1_intent" not in await c.find_one({"project_id":p,"user_id":o})
    asyncio.run(scenario(body))
def test_real_idempotent_recovery():
    async def body(c,p,o,original):
        op=operation(p,text="X");r=await apply_intent(c,o,op,original["updated_at"],mock_classifier)
        async def fail(_):raise AssertionError("classifier must not run")
        assert await apply_intent(c,o,op,original["updated_at"],fail)==r
        assert len((await c.find_one({"project_id":p,"user_id":o}))["j06_1_operation_receipts"])==1
    asyncio.run(scenario(body))
def test_real_first_save_fingerprint_race():
    async def body(c,p,o,original):
        op=operation(p,text="A")
        result=await asyncio.gather(apply_intent(c,o,op,original["updated_at"],mock_classifier),apply_intent(c,o,op.model_copy(update={"text":"B"}),original["updated_at"],mock_classifier),return_exceptions=True)
        assert len([x for x in result if isinstance(x,dict)])==1
        assert [x.code for x in result if isinstance(x,IntentError)]==["IDEMPOTENCY_KEY_REUSED"]
        assert len((await c.find_one({"project_id":p,"user_id":o}))["j06_1_operation_receipts"])==1
    asyncio.run(scenario(body))
def test_real_stale_revision_no_mutation():
    async def body(c,p,o,original):
        r=await create(c,p,o,original)
        await c.update_one({"project_id":p,"user_id":o},{"$set":{"updated_at":"2026-11-20T12:00:00+00:00"}})
        before=await c.find_one({"project_id":p,"user_id":o})
        with pytest.raises(IntentError,match="INTENT_STALE"):await apply_intent(c,o,operation(p,"ANSWER",r,answers={"audience":"Team"}),r["updated_at"],mock_classifier)
        assert await c.find_one({"project_id":p,"user_id":o})==before
    asyncio.run(scenario(body))
def test_real_classifier_failure_no_mutation():
    async def body(c,p,o,original):
        before=await c.find_one({"project_id":p,"user_id":o})
        async def fail(_):raise TimeoutError()
        with pytest.raises(IntentError,match="CLASSIFIER_UNAVAILABLE"):await apply_intent(c,o,operation(p,text="X"),original["updated_at"],fail)
        assert await c.find_one({"project_id":p,"user_id":o})==before
    asyncio.run(scenario(body))
def test_real_concurrent_answers_cas():
    async def body(c,p,o,original):
        r=await create(c,p,o,original)
        results=await asyncio.gather(*(apply_intent(c,o,operation(p,"ANSWER",r,answers={"audience":v}),r["updated_at"],mock_classifier) for v in ["A","B"]),return_exceptions=True)
        assert len([x for x in results if isinstance(x,dict)])==1
        assert len([x for x in results if isinstance(x,IntentError)])==1
        assert len((await c.find_one({"project_id":p,"user_id":o}))["j06_1_operation_receipts"])==2
    asyncio.run(scenario(body))
def test_real_refresh_invalidates_dependent_answer():
    async def body(c,p,o,original):
        r=await create(c,p,o,original)
        r=await apply_intent(c,o,operation(p,"ANSWER",r,answers={"audience":"Team"}),r["updated_at"],mock_classifier)
        changed="2026-11-20T12:00:00+00:00"
        await c.update_one({"project_id":p,"user_id":o},{"$set":{"updated_at":changed,"input_content":"Changed source"}})
        r=await apply_intent(c,o,operation(p,"REFRESH",r),changed,mock_classifier)
        assert r["intent"]["status"]=="AWAITING_CLARIFICATION"
        assert any("superseded_value" in h for h in r["intent"]["history"])
    asyncio.run(scenario(body))


def test_real_receipt_compaction_cas_concurrency_and_metadata_retention():
    from datetime import datetime,timezone,timedelta
    from backend.app.services.intent_clarification import ReceiptCompactionPass,compact_project_receipts
    async def body(c,p,o,original):
        # Every maintenance sweep/update is test-only scoped to the exact run
        # triple, so this test cannot compact unrelated Testing documents.
        scope={"project_id":p,"user_id":o,"_sm_j061_run":original["_sm_j061_run"]}
        class ScopedCollection:
            def find(self,query,projection):return c.find({**query,**scope},projection)
            async def update_one(self,query,update,**kwargs):return await c.update_one({**query,**scope},update,**kwargs)
        scoped=ScopedCollection()
        r=await create(c,p,o,original)
        now=datetime.now(timezone.utc);due=(now-timedelta(days=31)).isoformat()
        await c.update_one(scope,{"$set":{"j06_1_operation_receipts.0.completed_at":due}})
        before=await c.find_one(scope)
        metadata={k:deepcopy(before[k]) for k in ("_id","project_id","user_id","updated_at","j06_1_operation_receipts")}
        for receipt in metadata["j06_1_operation_receipts"]:receipt.pop("response",None)
        results=await asyncio.gather(*(compact_project_receipts(scoped,deepcopy(metadata),now-timedelta(days=30)) for _ in range(2)))
        assert sum(results)==1
        after=await c.find_one(scope)
        tomb=after["j06_1_operation_receipts"][0]
        assert set(tomb)=={"scope_key","fingerprint","original_code","resulting_ids","resulting_revisions","expired"}
        assert tomb["expired"] is True
        for field in ("scope_key","fingerprint","original_code","resulting_ids","resulting_revisions"):
            assert tomb[field]==before["j06_1_operation_receipts"][0][field]
        assert after["updated_at"]==before["updated_at"] and after["active_j06_1_intent"]==before["active_j06_1_intent"]
        # A new live operation remains a full receipt. A due candidate selected
        # at an obsolete revision loses CAS and retains its body.
        r=await apply_intent(c,o,operation(p,"SAVE_DRAFT",r),r["updated_at"],mock_classifier)
        stats=await ReceiptCompactionPass().tick(scoped,now)
        assert stats["modified"]==0
        assert "response" in (await c.find_one(scope))["j06_1_operation_receipts"][1]
        await c.update_one(scope,{"$set":{"j06_1_operation_receipts.1.completed_at":due}})
        selected=await c.find_one(scope)
        selected.pop("_sm_j061_run")
        for receipt in selected["j06_1_operation_receipts"]:receipt.pop("response",None)
        await c.update_one(scope,{"$set":{"updated_at":"2099-01-01T00:00:00+00:00"}})
        assert await compact_project_receipts(scoped,selected,now-timedelta(days=30))==0
        assert "response" in (await c.find_one(scope))["j06_1_operation_receipts"][1]
    asyncio.run(scenario(body))


def test_real_compaction_keyset_more_than_one_page_scoped_cleanup():
    from datetime import datetime,timezone,timedelta
    from backend.app.services.intent_clarification import ReceiptCompactionPass
    async def body(c,p,o,original):
        now=datetime.now(timezone.utc);due=(now-timedelta(days=31)).isoformat()
        r=await create(c,p,o,original)
        initial=await c.find_one({"project_id":p,"user_id":o})
        template=initial["j06_1_operation_receipts"][0]
        await c.update_one({"project_id":p,"user_id":o,"_sm_j061_run":original["_sm_j061_run"]},{"$set":{"j06_1_operation_receipts.0.completed_at":due}})
        marker=Path(os.environ["SM_J061_CLEANUP_MARKER"])
        record=json.loads(marker.read_text(encoding="utf-8-sig"))
        extras=["smj061-"+uuid4().hex for _ in range(101)]
        record["documents"].extend({"project_id":pid,"owner_id":o} for pid in extras)
        # All identifiers are recoverable before the first additional insert.
        marker.write_text(json.dumps(record),encoding="utf-8")
        identities=[{"project_id":pid,"user_id":o,"_sm_j061_run":original["_sm_j061_run"]} for pid in extras]
        ids=[p,*extras]
        class RunScopedCollection:
            def find(self,query,projection):return c.find({**query,"project_id":{"$in":ids},"user_id":o,"_sm_j061_run":original["_sm_j061_run"]},projection)
            async def update_one(self,query,update,**kwargs):
                if query.get("project_id") not in ids:raise RuntimeError("TEST_SCOPE_FAILED")
                return await c.update_one({**query,"user_id":o,"_sm_j061_run":original["_sm_j061_run"]},update,**kwargs)
        try:
            for identity in identities:
                receipt=deepcopy(template);receipt["scope_key"]=uuid4().hex;receipt["completed_at"]=due
                receipt["resulting_ids"]["project_id"]=identity["project_id"]
                await c.insert_one({**identity,"updated_at":original["updated_at"],"j06_1_operation_receipts":[receipt]})
            worker=ReceiptCompactionPass();scoped=RunScopedCollection()
            first=await worker.tick(scoped,now);second=await worker.tick(scoped,now)
            assert first=={"selected":100,"modified":100,"failed":0}
            assert second=={"selected":2,"modified":2,"failed":0}
            assert await c.count_documents({"project_id":{"$in":ids},"user_id":o,"_sm_j061_run":original["_sm_j061_run"],"j06_1_operation_receipts.response":{"$exists":True}})==0
        finally:
            # Individual exact triple deletes; never broad deletion.
            for identity in identities:
                await c.delete_one(identity)
                if await c.count_documents(identity)!=0:raise RuntimeError("CLEANUP_NOT_VERIFIED")
    asyncio.run(scenario(body))
