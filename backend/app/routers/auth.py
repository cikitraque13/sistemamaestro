import secrets
import uuid
from datetime import datetime, timezone, timedelta

import httpx
from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel, ConfigDict, EmailStr

from app.core.config import get_google_client_id
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    set_auth_cookies,
    clear_auth_cookies,
    get_current_user,
    check_brute_force,
    record_failed_attempt,
    clear_failed_attempts,
    should_use_secure_cookies,
)
from app.db.mongodb import db

router = APIRouter(prefix="/api/auth", tags=["auth"])


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    role: str = "user"
    plan: str = "free"


@router.post("/register")
async def register(user_data: UserCreate, request: Request, response: Response):
    email = user_data.email.lower().strip()
    name = user_data.name.strip() if user_data.name else "User"
    password = user_data.password

    existing = await db.users.find_one({"email": email}, {"_id": 0})

    if existing:
        if not existing.get("password_hash"):
            await db.users.update_one(
                {"user_id": existing["user_id"]},
                {
                    "$set": {
                        "password_hash": hash_password(password),
                        "name": name or existing.get("name", "User"),
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )

            updated_user = await db.users.find_one({"user_id": existing["user_id"]}, {"_id": 0})
            access_token = create_access_token(updated_user["user_id"], updated_user["email"])
            refresh_token = create_refresh_token(updated_user["user_id"])
            set_auth_cookies(response, access_token, refresh_token, request)

            updated_user.pop("password_hash", None)
            return updated_user

        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": email,
        "password_hash": hash_password(password),
        "name": name or "User",
        "role": "user",
        "plan": "free",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)

    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    set_auth_cookies(response, access_token, refresh_token, request)

    return {
        "user_id": user_id,
        "email": email,
        "name": name or "User",
        "role": "user",
        "plan": "free"
    }


@router.post("/login")
async def login(user_data: UserLogin, request: Request, response: Response):
    email = user_data.email.lower().strip()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"

    await check_brute_force(identifier)

    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        await record_failed_attempt(identifier)
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.get("password_hash"):
        raise HTTPException(
            status_code=400,
            detail="Esta cuenta usa acceso con Google. Continúa con Google o crea una contraseña desde registro."
        )

    if not verify_password(user_data.password, user.get("password_hash", "")):
        await record_failed_attempt(identifier)
        raise HTTPException(status_code=401, detail="Invalid credentials")

    await clear_failed_attempts(identifier)

    access_token = create_access_token(user["user_id"], email)
    refresh_token = create_refresh_token(user["user_id"])
    set_auth_cookies(response, access_token, refresh_token, request)

    user.pop("password_hash", None)
    return user


@router.post("/logout")
async def logout(response: Response):
    clear_auth_cookies(response)
    return {"message": "Logged out successfully"}


@router.get("/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user


@router.post("/refresh")
async def refresh_token_endpoint(request: Request, response: Response):
    refresh_tok = request.cookies.get("refresh_token")
    if not refresh_tok:
        raise HTTPException(status_code=401, detail="No refresh token")

    try:
        import jwt

        payload = jwt.decode(refresh_tok, options={"verify_signature": False})
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")

        user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        new_access_token = create_access_token(user["user_id"], user["email"])
        secure = should_use_secure_cookies(request)

        response.set_cookie(
            key="access_token",
            value=new_access_token,
            httponly=True,
            secure=secure,
            samesite="lax",
            max_age=900,
            path="/"
        )

        return {"message": "Token refreshed"}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


@router.post("/google/session")
async def google_session(request: Request, response: Response):
    body = await request.json()

    session_id = body.get("session_id")
    google_token = body.get("credential")
    google_data = None

    if google_token:
        expected_client_id = get_google_client_id()

        async with httpx.AsyncClient() as http_client:
            resp = await http_client.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={google_token}"
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid Google token")

            google_data = resp.json()

        if expected_client_id and google_data.get("aud") != expected_client_id:
            raise HTTPException(status_code=401, detail="Invalid Google token")

        google_data["name"] = google_data.get("name", google_data.get("given_name", "User"))

    elif session_id:
        async with httpx.AsyncClient() as http_client:
            resp = await http_client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            google_data = resp.json()
    else:
        raise HTTPException(status_code=400, detail="Missing authentication data")

    email = (google_data.get("email") or "").lower().strip()
    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email")

    existing_user = await db.users.find_one({"email": email}, {"_id": 0})

    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "name": google_data.get("name", existing_user.get("name", "User")),
                    "picture": google_data.get("picture"),
                    "google_id": google_data.get("id") or google_data.get("sub") or existing_user.get("google_id"),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": google_data.get("name", "User"),
            "picture": google_data.get("picture"),
            "role": "user",
            "plan": "free",
            "google_id": google_data.get("id") or google_data.get("sub"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)

    session_token = google_data.get("session_token", secrets.token_urlsafe(32))
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    secure = should_use_secure_cookies(request)
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=secure,
        samesite="lax",
        max_age=604800,
        path="/"
    )

    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return user
