"""Admin-only builder test mode. Off unless BUILDER_FREE_TEST_MODE is set.

The flag skips gem charges for builder build and preview. It does not change
Stripe, plan prices, or the credit ledger of a non-admin.
"""
import logging
import os

logger = logging.getLogger(__name__)

_ENABLED_VALUES = {"1", "true", "yes", "on"}


def builder_free_test_mode_enabled() -> bool:
    raw = os.environ.get("BUILDER_FREE_TEST_MODE")
    if raw is None:
        return False
    return raw.strip().lower() in _ENABLED_VALUES


def builder_charge_waived(user) -> bool:
    if not builder_free_test_mode_enabled():
        return False
    from backend.app.core.builder_access import user_is_admin

    return user_is_admin(user)


def log_skipped_builder_charge(user, action: str) -> None:
    user_id = user.get("user_id") if isinstance(user, dict) else ""
    logger.info("builder_charge_skipped action=%s user_id=%s", action, user_id)


async def run_builder_operation(*, user, action, consumption_payload, inputs, work, charge):
    """Run builder work. Admins in test mode skip the gem reservation.

    `charge` is the router's economic operation, so existing tests can still
    replace that name and observe whether a reservation was attempted.
    """
    if builder_charge_waived(user):
        log_skipped_builder_charge(user, action)
        return await work({
            "status": "skipped",
            "reason": "builder_free_test_mode",
            "trace": {"operation_status": "skipped"},
        })
    return await charge(
        user=user,
        consumption_payload=consumption_payload,
        inputs=inputs,
        work=work,
    )
