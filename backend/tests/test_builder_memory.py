"""Owner-scoped preferences. No page text and no cross-user reads."""
import os

os.environ.setdefault("MONGO_URL", "mongodb://127.0.0.1:27017")
os.environ.setdefault("JWT_SECRET", "unit-test-secret-that-is-at-least-32")

import asyncio

from backend.app.services.builder_memory import infer_preference, load_preferences, remember_saved

PREVIEW = {
    "versions": [{
        "preference": {"tone": "cercano", "style": "calido", "structure": ["oferta", "paso"]},
    }],
}


class Collection:
    def __init__(self):
        self.documents = []
        self.queries = []

    async def find_one(self, query, projection=None):
        self.queries.append(query)
        for document in self.documents:
            if all(document.get(key) == value for key, value in query.items()):
                return {key: value for key, value in document.items() if key != "_id"}
        return None

    async def update_one(self, query, update, upsert=False):
        self.queries.append(query)
        for document in self.documents:
            if all(document.get(key) == value for key, value in query.items()):
                document.update(update.get("$set") or {})
                for key, amount in (update.get("$inc") or {}).items():
                    document[key] = int(document.get(key) or 0) + amount
                return
        if upsert:
            created = dict(update.get("$set") or {})
            for key, amount in (update.get("$inc") or {}).items():
                created[key] = amount
            self.documents.append(created)


def test_memory_is_isolated_and_stores_no_copy():
    collection = Collection()
    collection.documents.append({
        "user_id": "bob",
        "tone": "formal",
        "style": "comercial",
        "structure": ["prueba"],
        "kept": 4,
        "reverted": 1,
        "email": "bob@example.com",
        "instruction": "texto privado de Bob",
    })

    async def run():
        foreign = await load_preferences(collection, "alice")
        await remember_saved(collection, "alice", PREVIEW)
        own = await load_preferences(collection, "alice")
        bob = await load_preferences(collection, "bob")
        return foreign, own, bob

    foreign, own, bob = asyncio.run(run())
    assert foreign is None
    assert own["tone"] == "cercano"
    assert own["style"] == "calido"
    assert own["kept"] == 1
    assert "email" not in own
    assert "instruction" not in own
    assert bob["tone"] == "formal"
    assert all("user_id" in query for query in collection.queries)
    stored = next(item for item in collection.documents if item["user_id"] == "alice")
    assert "instruction" not in stored
    assert "html" not in stored
    assert "email" not in stored


def test_a_changed_structure_counts_as_reverted_not_as_text():
    collection = Collection()

    async def run():
        await remember_saved(collection, "alice", PREVIEW)
        await remember_saved(collection, "alice", {
            "versions": [{"preference": {"tone": "directo", "style": "sobrio", "structure": ["objecion"]}}],
        })
        return await load_preferences(collection, "alice")

    saved = asyncio.run(run())
    assert saved["tone"] == "directo"
    assert saved["kept"] == 2
    assert saved["reverted"] == 1
    assert infer_preference({
        "title": "Clara",
        "subtitle": "Te espera",
        "cta": "Pedir cita",
        "sections": [{"title": "Cita", "text": "Reservas la primera visita.", "role": "paso"}],
    })["tone"] == "cercano"
