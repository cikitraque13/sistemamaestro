"""Compatibility entrypoint for the standalone payment recovery harness."""

from backend.tests import test_payment_recovery as _payment_recovery

if hasattr(_payment_recovery, 'RecoveryTests'):
    RecoveryTests = _payment_recovery.RecoveryTests
