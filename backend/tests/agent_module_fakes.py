"""In-memory Mongo stand-in for the agent-module tests."""

from __future__ import annotations

import copy

from pymongo.errors import DuplicateKeyError
from types import SimpleNamespace


def _get_path(doc, path):
    current = doc
    for part in str(path).split("."):
        if not isinstance(current, dict) or part not in current:
            return None
        current = current[part]
    return current


def _set_path(doc, path, value):
    parts = str(path).split(".")
    current = doc
    for part in parts[:-1]:
        child = current.get(part)
        if not isinstance(child, dict):
            child = {}
            current[part] = child
        current = child
    current[parts[-1]] = value


def _compare(value, op, operand):
    if op == "$eq":
        return value == operand
    if op == "$ne":
        return value != operand
    if value is None or operand is None:
        return False
    if op == "$lt":
        return value < operand
    if op == "$lte":
        return value <= operand
    if op == "$gt":
        return value > operand
    if op == "$gte":
        return value >= operand
    raise AssertionError(op)


def matches(doc, query):
    if not query:
        return True
    for key, expected in query.items():
        if isinstance(expected, dict) and expected and all(str(op).startswith("$") for op in expected):
            value = _get_path(doc, key)
            for op, operand in expected.items():
                if not _compare(value, op, operand):
                    return False
            continue
        if _get_path(doc, key) != expected:
            return False
    return True


class Cursor:
    def __init__(self, docs):
        self.docs = docs

    def sort(self, key, direction=1):
        return self

    async def to_list(self, length=None):
        if length is None:
            return list(self.docs)
        return list(self.docs[:length])


class MemoryCollection:
    def __init__(self):
        self.docs = []
        self.indexes = []
        self._seq = 0

    def _conflicts(self, doc):
        for index in self.indexes:
            if not index["unique"]:
                continue
            partial = index.get("partial")
            if partial and not matches(doc, partial):
                continue
            for existing in self.docs:
                if partial and not matches(existing, partial):
                    continue
                same = all(
                    _get_path(existing, key) == _get_path(doc, key)
                    for key, _direction in index["keys"]
                )
                if same:
                    return True
        return False

    async def create_index(self, keys, unique=False, name=None, expireAfterSeconds=None, partialFilterExpression=None, **kwargs):
        key_list = [(keys, 1)] if isinstance(keys, str) else list(keys)
        self.indexes = [item for item in self.indexes if item.get("name") != name]
        self.indexes.append({
            "keys": key_list,
            "unique": unique,
            "partial": partialFilterExpression,
            "name": name,
        })
        return name

    async def insert_one(self, doc):
        stored = copy.deepcopy(doc)
        if self._conflicts(stored):
            raise DuplicateKeyError("duplicate")
        self._seq += 1
        stored["_id"] = self._seq
        self.docs.append(stored)
        return SimpleNamespace(inserted_id=stored["_id"])

    def _apply(self, doc, update):
        for key, value in (update.get("$set") or {}).items():
            _set_path(doc, key, copy.deepcopy(value))
        for key, amount in (update.get("$inc") or {}).items():
            current = _get_path(doc, key)
            _set_path(doc, key, (0 if current is None else current) + amount)

    async def update_one(self, query, update, upsert=False):
        for doc in self.docs:
            if matches(doc, query):
                self._apply(doc, update)
                return SimpleNamespace(matched_count=1, modified_count=1, upserted_id=None)
        if not upsert:
            return SimpleNamespace(matched_count=0, modified_count=0, upserted_id=None)
        created = {}
        for key, value in (query or {}).items():
            if isinstance(value, dict):
                continue
            _set_path(created, key, copy.deepcopy(value))
        self._apply(created, update)
        if self._conflicts(created):
            raise DuplicateKeyError("duplicate")
        self._seq += 1
        created["_id"] = self._seq
        self.docs.append(created)
        return SimpleNamespace(matched_count=0, modified_count=0, upserted_id=created["_id"])

    def find(self, query=None, projection=None):
        rows = [copy.deepcopy(doc) for doc in self.docs if matches(doc, query or {})]
        return Cursor(rows)

    async def find_one(self, query=None, projection=None):
        for doc in self.docs:
            if matches(doc, query or {}):
                return copy.deepcopy(doc)
        return None

    async def delete_one(self, query):
        for index, doc in enumerate(self.docs):
            if matches(doc, query):
                del self.docs[index]
                return SimpleNamespace(deleted_count=1)
        return SimpleNamespace(deleted_count=0)

    async def delete_many(self, query):
        before = len(self.docs)
        self.docs = [doc for doc in self.docs if not matches(doc, query or {})]
        return SimpleNamespace(deleted_count=before - len(self.docs))


class FakeDB:
    def __init__(self):
        self._collections = {}

    def __getattr__(self, name):
        if name.startswith("_"):
            raise AttributeError(name)
        collection = self._collections.get(name)
        if collection is None:
            collection = MemoryCollection()
            self._collections[name] = collection
        return collection
