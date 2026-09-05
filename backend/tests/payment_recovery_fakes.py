"""Synthetic Mongo/API doubles: atomic matching, nested paths, CAS, fault windows."""
import asyncio
from copy import deepcopy
from types import SimpleNamespace

MISSING = object()


def value(doc, path):
    for part in path.split('.'):
        if not isinstance(doc, dict) or part not in doc:
            return MISSING
        doc = doc[part]
    return doc


def matches(doc, query):
    for key, expected in query.items():
        if key == '$or':
            if not any(matches(doc, item) for item in expected):
                return False
            continue
        actual = value(doc, key)
        if isinstance(expected, dict):
            for op, operand in expected.items():
                if op == '$exists':
                    good = (actual is not MISSING) == operand
                elif op == '$in':
                    good = actual in operand
                elif op == '$nin':
                    good = actual not in operand
                elif op == '$ne':
                    good = actual != operand
                elif op == '$gte':
                    good = actual is not MISSING and actual >= operand
                else:
                    raise AssertionError(f'Unsupported query operator {op}')
                if not good:
                    return False
        elif actual != expected and not (actual is MISSING and expected is None):
            return False
    return True


def update_doc(doc, update):
    for operator, fields in update.items():
        for path, item in fields.items():
            target = doc
            parts = path.split('.')
            for part in parts[:-1]:
                target = target.setdefault(part, {})
            key = parts[-1]
            if operator == '$set':
                target[key] = deepcopy(item)
            elif operator == '$unset':
                target.pop(key, None)
            elif operator == '$inc':
                target[key] = target.get(key, 0) + item
            else:
                raise AssertionError(f'Unsupported update {operator}')


class Collection:
    def __init__(self, name, docs=()):
        self.name, self.docs, self.events, self.faults = name, deepcopy(list(docs)), [], []

    def fault(self, method, when, predicate, action):
        self.faults.append((method, when, predicate, action))

    async def event(self, method, when, query, update):
        self.events.append((method, when, deepcopy(query), deepcopy(update)))
        # Yield outside the atomic matching+mutation block to exercise overlap.
        await asyncio.sleep(0)
        for fault in list(self.faults):
            m, w, predicate, action = fault
            if m == method and w == when and predicate(query, update):
                self.faults.remove(fault)
                if isinstance(action, BaseException):
                    raise action
                if callable(action):
                    result = action()
                    if hasattr(result, '__await__'):
                        return await result
                    return result
                return action

    async def find_one(self, query, projection=None):
        await self.event('find_one', 'before', query, {})
        result = next((deepcopy(d) for d in self.docs if matches(d, query)), None)
        await self.event('find_one', 'after', query, {})
        return result

    async def insert_one(self, doc):
        await self.event('insert_one', 'before', doc, {})
        if '_id' in doc and any(d.get('_id') == doc['_id'] for d in self.docs):
            raise RuntimeError('Synthetic duplicate _id')
        self.docs.append(deepcopy(doc))
        await self.event('insert_one', 'after', doc, {})
        return SimpleNamespace(inserted_id=doc.get('_id'))

    async def mutate(self, method, query, update):
        zero = await self.event(method, 'before', query, update)
        doc = None if zero == 'zero' else next((d for d in self.docs if matches(d, query)), None)
        prior = deepcopy(doc)
        if doc is not None:
            update_doc(doc, update)
        result = deepcopy(doc)
        changed = prior != result
        await self.event(method, 'after', query, update)
        return result, int(doc is not None), int(changed)

    async def find_one_and_update(self, query, update, **kwargs):
        result, _, _ = await self.mutate('find_one_and_update', query, update)
        return result

    async def update_one(self, query, update):
        _, matched, changed = await self.mutate('update_one', query, update)
        return SimpleNamespace(matched_count=matched, modified_count=changed)


class Database:
    def __init__(self):
        self.payment_transactions = Collection('payments', [{
            'stripe_session_id': 'cs_test', 'user_id': 'user_test', 'item_type': 'plan',
            'item_id': 'blueprint', 'payment_status': 'initiated', 'status': 'pending'}])
        self.users = Collection('users', [{'user_id': 'user_test', 'plan': 'free',
            'credit_balance': 0, 'credit_lifetime_used': 0, 'credit_lifetime_granted': 0}])
        self.ledger = Collection('ledger')

    def __getitem__(self, name):
        assert name == 'synthetic_credit_ledger'
        return self.ledger
