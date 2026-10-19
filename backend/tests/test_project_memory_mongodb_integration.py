"""Opt-in integration check for durable refine answers and Blueprint recovery.

This test is inert unless SM_J05_V2_MONGODB_INTEGRATION=1. A local launcher
passes hidden terminal input to this one-shot process in memory. The test
checks the fixed non-production target before constructing a client and never
prints the URI or driver errors.
"""
import asyncio
import logging
import os
import sys
from datetime import datetime, timezone
from types import SimpleNamespace
from urllib.parse import parse_qsl, unquote, urlsplit
from uuid import uuid4

import pytest


ALLOWED_MONGODB_HOST = "sm-testing.hbnrkcj.mongodb.net"
ALLOWED_MONGODB_USERNAME = "sm_testing_app"
ALLOWED_DATABASE_NAME = "sistemamaestro_test"
OPT_IN_ENV = "SM_J05_V2_MONGODB_INTEGRATION"
_SENSITIVE_ENV_NAMES = (
    "STRIPE_SECRET_KEY",
    "STRIPE_API_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "OPENAI_API_KEY",
)


def _read_uri_hidden():
    # The local launcher supplies the hidden terminal input to this one-shot
    # Python process in memory. No command-line argument or file is used.
    return os.environ.get("MONGO_URL")


def _target_is_allowlisted(uri, configured_db_name):
    if configured_db_name != ALLOWED_DATABASE_NAME:
        return False
    try:
        parsed = urlsplit(uri)
        database_name = unquote(parsed.path.lstrip("/"))
        username = unquote(parsed.username or "")
        host = (parsed.hostname or "").lower()
        port = parsed.port
        authority = parsed.netloc.rsplit("@", 1)[-1]
        options = parse_qsl(parsed.query, keep_blank_values=True, strict_parsing=True)
    except Exception:
        return False
    allowed_options = {"retryWrites", "w", "appName", "authSource", "tls", "ssl"}
    option_keys = [key for key, _ in options]
    if len(option_keys) != len(set(option_keys)) or any(
        key not in allowed_options for key in option_keys
    ):
        return False
    for key, value in options:
        if key in ("tls", "ssl") and value.lower() not in ("true", "1"):
            return False
        if key in ("authSource", "retryWrites", "w", "appName") and not value:
            return False
        if key == "retryWrites" and value.lower() not in ("true", "false"):
            return False
        if key == "w" and value != "majority":
            try:
                if int(value) < 1:
                    return False
            except ValueError:
                return False
    return (
        parsed.scheme == "mongodb+srv"
        and parsed.netloc.count("@") == 1
        and host == ALLOWED_MONGODB_HOST
        and port is None
        and "," not in authority
        and username == ALLOWED_MONGODB_USERNAME
        and bool(parsed.password)
        and database_name == ALLOWED_DATABASE_NAME
        and not parsed.path.lstrip("/").count("/")
        and not parsed.fragment
        and not parsed.fragment
    )


async def _run_isolated_flow():
    """Return only a fixed status token; never propagate driver exceptions."""
    if OPT_IN_ENV not in os.environ or os.environ.get(OPT_IN_ENV) != "1":
        return "NOT_OPTED_IN"

    configured_db_name = os.environ.get("DB_NAME")
    if configured_db_name != ALLOWED_DATABASE_NAME:
        return "DB_NAME_NOT_ALLOWLISTED"
    if os.environ.get("PYTHON_DOTENV_DISABLED") != "1":
        return "DOTENV_NOT_DISABLED"

    # Do not allow this test to import app configuration that could already
    # have read dotenv or point a global DB client at an unknown target.
    if any(name in sys.modules for name in (
        "backend.app.core.config",
        "backend.app.db.mongodb",
        "backend.app.routers.projects",
    )):
        return "APP_CONFIG_ALREADY_LOADED"
    if any(name in os.environ for name in _SENSITIVE_ENV_NAMES):
        return "SENSITIVE_PROCESS_ENV_PRESENT"

    uri = _read_uri_hidden()
    if not uri or not _target_is_allowlisted(uri, configured_db_name):
        return "TARGET_NOT_ALLOWLISTED_OR_INPUT_NOT_HIDDEN"

    # App imports require JWT configuration. The launcher supplies a synthetic
    # runtime-only value; the target URI remains in this process environment.
    if len(os.environ.get("JWT_SECRET", "")) < 32:
        return "SYNTHETIC_JWT_CONFIGURATION_MISSING"
    dotenv_module = None
    original_load_dotenv = None
    target_client = None
    placeholder_client = None
    database = None
    projects_router = None
    original_router_attrs = {}
    project_id = f"smj05v2-{uuid4().hex}"
    owner_id = f"smj05v2-owner-{uuid4().hex}"
    cleanup_needed = False
    recovery_project_id = None
    outcome = "INTEGRATION_FAILED"
    prior_log_disable = logging.root.manager.disable

    try:
        # Prevent backend config import from reading any .env file.
        import dotenv as dotenv_module

        original_load_dotenv = dotenv_module.load_dotenv
        dotenv_module.load_dotenv = lambda *args, **kwargs: False

        from motor.motor_asyncio import AsyncIOMotorClient

        target_client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
        database = target_client[ALLOWED_DATABASE_NAME]

        # Ensure the globally constructed placeholder client cannot be used by
        # the route; all subsequent app DB calls are pinned to the allowlisted DB.
        from backend.app.routers import projects as projects_router
        for name in (
            "db",
            "get_current_user",
            "build_plan_recommendation",
            "get_credit_operation",
            "build_project_consumption_request",
            "run_economic_operation",
            "generate_blueprint",
        ):
            original_router_attrs[name] = getattr(projects_router, name)
        placeholder_client = projects_router.db.client
        projects_router.db = database
        logging.disable(logging.CRITICAL)

        await target_client.admin.command("ping")
        existing = await database.projects.find_one({"project_id": project_id})
        if existing is not None:
            outcome = "SYNTHETIC_ID_COLLISION"
        else:
            revision = datetime.now(timezone.utc).isoformat()
            project = {
                "project_id": project_id,
                "user_id": owner_id,
                "updated_at": revision,
                "input_type": "text",
                "input_content": "synthetic J05 V2 integration fixture",
                "route": "idea",
                "diagnosis": {"summary": "synthetic"},
                "refine_questions": [
                    {"id": "goal", "question": "What is the synthetic goal?"}
                ],
                "refine_answers": {"legacy_goal": "preserved synthetic answer"},
                "url_analysis": "N/A",
            }
            cleanup_needed = True
            await database.projects.insert_one(project)

            async def current_user(_request):
                return {"user_id": owner_id, "plan": "premium"}

            projects_router.get_current_user = current_user
            projects_router.build_plan_recommendation = lambda **kwargs: {
                "synthetic": True,
                "answers_seen": kwargs["refine_answers"],
            }
            request = lambda headers: SimpleNamespace(headers=headers)

            refined = await projects_router.refine_project(
                project_id,
                SimpleNamespace(answers={"goal": "durable synthetic answer"}),
                request({"If-Match": revision}),
            )
            refined_revision = refined["updated_at"]

            # A separate DB read/request boundary confirms the answer is durable.
            recovered = await database.projects.find_one(
                {"project_id": project_id, "user_id": owner_id}, {"_id": 0}
            )
            if not recovered or recovered.get("refine_answers") != {
                "goal": "durable synthetic answer",
                "legacy_goal": "preserved synthetic answer",
            }:
                outcome = "DURABLE_RECOVERY_MISMATCH"
            else:
                provider_payloads = []

                async def synthetic_blueprint_provider(payload):
                    provider_payloads.append(payload)
                    return {"synthetic": "blueprint"}

                async def invoke_work_without_economics(
                    *, user, consumption_payload, inputs, work
                ):
                    return await work({
                        "trace": {"operation_id": consumption_payload.meta.trace_id}
                    })

                operation_id = f"create_blueprint:j05v2_{uuid4().hex}"
                projects_router.get_credit_operation = AsyncNoOperationLookup()
                projects_router.build_project_consumption_request = (
                    lambda **kwargs: SimpleNamespace(
                        meta=SimpleNamespace(trace_id=operation_id)
                    )
                )
                projects_router.run_economic_operation = invoke_work_without_economics
                projects_router.generate_blueprint = synthetic_blueprint_provider

                await projects_router.create_blueprint(
                    project_id,
                    request({
                        "If-Match": refined_revision,
                        "Idempotency-Key": operation_id.split(":", 1)[1],
                    }),
                )

                expected_payload = {
                    "route": "idea",
                    "diagnosis": {"summary": "synthetic"},
                    "input_content": "synthetic J05 V2 integration fixture",
                    "refine_answers": {
                        "goal": "durable synthetic answer",
                        "legacy_goal": "preserved synthetic answer",
                    },
                    "url_analysis": "N/A",
                }
                if provider_payloads != [expected_payload]:
                    outcome = "BLUEPRINT_PAYLOAD_MISMATCH"
                else:
                    after_blueprint = await database.projects.find_one(
                        {"project_id": project_id, "user_id": owner_id},
                        {"_id": 0},
                    )
                    outcome = (
                        "PASS"
                        if after_blueprint
                        and after_blueprint.get("blueprint") == {"synthetic": "blueprint"}
                        and after_blueprint.get("refine_answers") == expected_payload["refine_answers"]
                        else "BLUEPRINT_PERSISTENCE_MISMATCH"
                    )
    except Exception:
        # Do not let driver errors or traceback locals disclose a connection URI.
        outcome = "INTEGRATION_FAILED"
    finally:
        if cleanup_needed and database is not None:
            try:
                exact_scope = {"project_id": project_id, "user_id": owner_id}
                await database.projects.delete_one(exact_scope)
                if await database.projects.find_one(exact_scope, {"_id": 1}) is not None:
                    outcome = "EXACT_SCOPE_CLEANUP_FAILED"
                    recovery_project_id = project_id
            except Exception:
                outcome = "EXACT_SCOPE_CLEANUP_FAILED"
                recovery_project_id = project_id
        if target_client is not None:
            target_client.close()
        if projects_router is not None:
            for name, value in original_router_attrs.items():
                setattr(projects_router, name, value)
        if placeholder_client is not None:
            placeholder_client.close()
        if dotenv_module is not None and original_load_dotenv is not None:
            dotenv_module.load_dotenv = original_load_dotenv
        logging.disable(prior_log_disable)
        os.environ.pop("MONGO_URL", None)
        os.environ.pop("JWT_SECRET", None)

    if recovery_project_id:
        return f"EXACT_SCOPE_CLEANUP_FAILED:{recovery_project_id}"
    return outcome


class AsyncNoOperationLookup:
    async def __call__(self, *_args, **_kwargs):
        return None


def test_refine_persists_and_blueprint_recovers_answers_from_allowlisted_test_db():
    if os.environ.get(OPT_IN_ENV) != "1":
        pytest.skip("Explicit J05 V2 MongoDB integration opt-in required")
    outcome = asyncio.run(_run_isolated_flow())
    assert outcome == "PASS", f"Isolated integration outcome: {outcome}"
