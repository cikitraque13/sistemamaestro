from datetime import datetime, timedelta, timezone

import jwt
import pytest

from backend.app.core.config import JWT_ALGORITHM, JWT_SECRET


def test_forged_refresh_token_is_rejected():
    forged_token = jwt.encode(
        {
            "sub": "fake_user",
            "type": "refresh",
            "exp": datetime.now(timezone.utc) + timedelta(days=1),
        },
        "wrong-secret",
        algorithm=JWT_ALGORITHM,
    )

    with pytest.raises(jwt.InvalidTokenError):
        jwt.decode(
            forged_token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
        )