from copy import deepcopy
import sys
from types import ModuleType, SimpleNamespace
import unittest
from unittest.mock import Mock, patch


class HTTPException(Exception):
    def __init__(self, status_code, detail):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


class Response:
    def __init__(self):
        self.headers = {}


class APIRouter:
    def __init__(self, *args, **kwargs):
        pass

    def post(self, *args, **kwargs):
        return lambda function: function

    def get(self, *args, **kwargs):
        return lambda function: function


class BaseModel:
    def __init__(self, **values):
        for key, value in values.items():
            setattr(self, key, value)


fastapi_stub = ModuleType("fastapi")
fastapi_stub.APIRouter = APIRouter
fastapi_stub.HTTPException = HTTPException
fastapi_stub.Request = object
fastapi_stub.Response = Response

pydantic_stub = ModuleType("pydantic")
pydantic_stub.BaseModel = BaseModel
pydantic_stub.ConfigDict = lambda **kwargs: kwargs
pydantic_stub.EmailStr = str

httpx_stub = ModuleType("httpx")
httpx_stub.AsyncClient = object

jwt_stub = ModuleType("jwt")
jwt_stub.ExpiredSignatureError = type("ExpiredSignatureError", (Exception,), {})
jwt_stub.InvalidTokenError = type("InvalidTokenError", (Exception,), {})

config_stub = ModuleType("backend.app.core.config")
config_stub.JWT_ALGORITHM = "HS256"
config_stub.JWT_SECRET = "unit-test-secret"
config_stub.get_google_client_id = lambda: None

security_stub = ModuleType("backend.app.core.security")
for function_name in (
    "hash_password",
    "verify_password",
    "create_access_token",
    "create_refresh_token",
    "set_auth_cookies",
    "clear_auth_cookies",
    "get_current_user",
    "check_brute_force",
    "record_failed_attempt",
    "clear_failed_attempts",
    "should_use_secure_cookies",
):
    setattr(security_stub, function_name, lambda *args, **kwargs: None)

mongodb_stub = ModuleType("backend.app.db.mongodb")
mongodb_stub.db = SimpleNamespace()

for module_name, module in (
    ("fastapi", fastapi_stub),
    ("pydantic", pydantic_stub),
    ("httpx", httpx_stub),
    ("jwt", jwt_stub),
    ("backend.app.core.config", config_stub),
    ("backend.app.core.security", security_stub),
    ("backend.app.db.mongodb", mongodb_stub),
):
    sys.modules.setdefault(module_name, module)

from backend.app.routers import auth


class FakeUsers:
    def __init__(self, existing=None):
        self.existing = deepcopy(existing)
        self.inserted = []
        self.update_calls = []

    async def find_one(self, query, projection):
        if self.existing and query.get("email") == self.existing.get("email"):
            return deepcopy(self.existing)
        return None

    async def update_one(self, *args, **kwargs):
        self.update_calls.append((args, kwargs))

    async def insert_one(self, document):
        self.inserted.append(deepcopy(document))


class FakeDb:
    def __init__(self, users):
        self.users = users


def make_request():
    return SimpleNamespace()


class RegistrationSecurityTests(unittest.IsolatedAsyncioTestCase):
    async def assert_existing_account_is_rejected_without_side_effects(
        self,
        existing,
    ):
        users = FakeUsers(existing)
        response = Response()
        original = deepcopy(users.existing)
        unexpected = Mock(
            side_effect=AssertionError(
                "existing-email registration created authentication state"
            )
        )

        with (
            patch.object(auth, "db", FakeDb(users)),
            patch.object(auth, "hash_password", unexpected),
            patch.object(auth, "create_access_token", unexpected),
            patch.object(auth, "create_refresh_token", unexpected),
            patch.object(auth, "set_auth_cookies", unexpected),
        ):
            with self.assertRaises(HTTPException) as raised:
                await auth.register(
                    auth.UserCreate(
                        email="existing@example.test",
                        password="attacker-controlled-password",
                        name="Attacker Controlled Name",
                    ),
                    make_request(),
                    response,
                )

        self.assertEqual(raised.exception.status_code, 400)
        self.assertEqual(raised.exception.detail, "Email already registered")
        self.assertEqual(users.existing, original)
        self.assertEqual(users.update_calls, [])
        self.assertEqual(users.inserted, [])
        self.assertIsNone(response.headers.get("set-cookie"))
        unexpected.assert_not_called()

    async def test_existing_local_account_is_rejected_without_side_effects(self):
        await self.assert_existing_account_is_rejected_without_side_effects(
            {
                "user_id": "user_local",
                "email": "existing@example.test",
                "password_hash": "existing-password-hash",
                "name": "Local User",
            }
        )

    async def test_existing_google_account_is_rejected_without_side_effects(self):
        await self.assert_existing_account_is_rejected_without_side_effects(
            {
                "user_id": "user_google",
                "email": "existing@example.test",
                "name": "Google User",
                "google_id": "google-account-id",
            }
        )

    async def test_new_email_preserves_account_creation_and_authentication(self):
        users = FakeUsers()
        set_auth_cookies = Mock()

        with (
            patch.object(auth, "db", FakeDb(users)),
            patch.object(auth, "hash_password", return_value="hashed-password"),
            patch.object(
                auth,
                "create_access_token",
                return_value="access-token",
            ),
            patch.object(
                auth,
                "create_refresh_token",
                return_value="refresh-token",
            ),
            patch.object(auth, "set_auth_cookies", set_auth_cookies),
        ):
            response = Response()
            request = make_request()
            result = await auth.register(
                auth.UserCreate(
                    email="NEW@example.test",
                    password="new-account-password",
                    name="New User",
                ),
                request,
                response,
            )

        self.assertEqual(result["email"], "new@example.test")
        self.assertEqual(result["name"], "New User")
        self.assertEqual(result["role"], "user")
        self.assertEqual(result["plan"], "free")
        self.assertTrue(result["user_id"].startswith("user_"))
        self.assertEqual(len(users.inserted), 1)
        self.assertEqual(users.inserted[0]["email"], "new@example.test")
        self.assertEqual(users.inserted[0]["password_hash"], "hashed-password")
        set_auth_cookies.assert_called_once_with(
            response,
            "access-token",
            "refresh-token",
            request,
        )
