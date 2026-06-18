import os
from datetime import datetime, timedelta, timezone

import jwt
from dotenv import load_dotenv
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from pathlib import Path

load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", "24"))


def verify_google_token(credential: str) -> dict:
    if not GOOGLE_CLIENT_ID:
        raise ValueError("Google OAuth is not configured on the server")

    idinfo = id_token.verify_oauth2_token(
        credential,
        google_requests.Request(),
        GOOGLE_CLIENT_ID,
    )

    if idinfo.get("iss") not in {"accounts.google.com", "https://accounts.google.com"}:
        raise ValueError("Invalid token issuer")

    email = idinfo.get("email")
    if not email:
        raise ValueError("Google account has no email")

    if not idinfo.get("email_verified", False):
        raise ValueError("Google email is not verified")

    return {
        "sub": idinfo["sub"],
        "email": email,
        "name": idinfo.get("name", email.split("@")[0]),
        "picture": idinfo.get("picture"),
    }


def create_access_token(user: dict) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user["sub"],
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture"),
        "iat": now,
        "exp": now + timedelta(hours=JWT_EXPIRE_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    return {
        "sub": payload["sub"],
        "email": payload["email"],
        "name": payload["name"],
        "picture": payload.get("picture"),
    }
