"""Landing records are stored per owner and project. Another user cannot read them."""
import asyncio

from backend.app.services.builder_landing_state import (
    LandingStateError,
    load_landing,
    save_landing,
)

RECORD = '{"version":1,"ownerId":"alice","projectId":"project-a","headline":"Consulta"}'
STAMP = "2026-11-27T21:00:00+00:00"


class Projects:
    def __init__(self, documents):
        self.documents = documents

    async def find_one(self, query, projection=None):
        for document in self.documents:
            if all(document.get(key) == value for key, value in query.items()):
                return {"project_id": document["project_id"]}
        return None


class Landings:
    def __init__(self):
        self.documents = []

    async def find_one(self, query, projection=None):
        for document in self.documents:
            if all(document.get(key) == value for key, value in query.items()):
                return {
                    "record": document["record"],
                    "updated_at": document["updated_at"],
                }
        return None

    async def update_one(self, query, update, upsert=False):
        fields = update["$set"]
        for document in self.documents:
            if all(document.get(key) == value for key, value in query.items()):
                document.update(fields)
                return
        if upsert:
            self.documents.append(dict(fields))


def test_owner_saves_and_loads_the_same_record():
    projects = Projects([{"project_id": "project-a", "user_id": "alice"}])
    landings = Landings()

    async def run():
        saved = await save_landing(projects, landings, "alice", "project-a", RECORD, STAMP)
        loaded = await load_landing(projects, landings, "alice", "project-a")
        return saved, loaded

    saved, loaded = asyncio.run(run())
    assert saved["updated_at"] == STAMP
    assert loaded["record"] == RECORD
    assert loaded["updated_at"] == STAMP
    assert landings.documents[0]["user_id"] == "alice"


def test_another_user_cannot_read_or_write():
    projects = Projects([{"project_id": "project-a", "user_id": "alice"}])
    landings = Landings()

    async def run():
        await save_landing(projects, landings, "alice", "project-a", RECORD, STAMP)
        bob_record = '{"version":1,"ownerId":"bob","projectId":"project-a"}'
        with_raises = []
        for action in (
            lambda: load_landing(projects, landings, "bob", "project-a"),
            lambda: save_landing(projects, landings, "bob", "project-a", bob_record, STAMP),
        ):
            try:
                await action()
            except LandingStateError as exc:
                with_raises.append(exc)
        return with_raises

    errors = asyncio.run(run())
    assert [error.status for error in errors] == [404, 404]
    assert [error.code for error in errors] == ["not_found", "not_found"]
    assert len(landings.documents) == 1
    assert landings.documents[0]["user_id"] == "alice"


def test_record_must_name_the_same_owner_and_project():
    projects = Projects([{"project_id": "project-a", "user_id": "alice"}])
    landings = Landings()
    foreign = '{"ownerId":"bob","projectId":"project-a"}'

    async def run():
        try:
            await save_landing(projects, landings, "alice", "project-a", foreign, STAMP)
        except LandingStateError as exc:
            return exc
        return None

    error = asyncio.run(run())
    assert error is not None
    assert error.status == 422
    assert landings.documents == []
