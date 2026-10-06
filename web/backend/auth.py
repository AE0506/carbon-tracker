import base64
import hashlib
import hmac
import json
import secrets
from datetime import datetime, timedelta, timezone
from html import escape
from typing import Optional
from urllib.parse import quote

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRE_DAYS, AVATAR_COLORS
from database import get_db
from models import User

security = HTTPBearer(auto_error=False)
PASSWORD_ITERATIONS = 260_000


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(f"{data}{padding}".encode("ascii"))


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    derived = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        PASSWORD_ITERATIONS,
    )
    return f"pbkdf2_sha256${PASSWORD_ITERATIONS}${salt}${derived.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        algorithm, iterations, salt, expected = hashed_password.split("$", 3)
    except ValueError:
        return False

    if algorithm != "pbkdf2_sha256":
        return False

    derived = hashlib.pbkdf2_hmac(
        "sha256",
        plain_password.encode("utf-8"),
        salt.encode("utf-8"),
        int(iterations),
    ).hex()
    return hmac.compare_digest(derived, expected)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    payload = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(days=JWT_EXPIRE_DAYS))
    payload.update({"exp": int(expire.timestamp())})
    header = {"alg": JWT_ALGORITHM, "typ": "JWT"}
    encoded_header = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    encoded_payload = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{encoded_header}.{encoded_payload}".encode("ascii")
    signature = hmac.new(JWT_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
    return f"{encoded_header}.{encoded_payload}.{_b64url_encode(signature)}"


def decode_access_token(token: str) -> Optional[dict]:
    """解码 JWT，失败返回 None"""
    try:
        encoded_header, encoded_payload, encoded_signature = token.split(".", 2)
        signing_input = f"{encoded_header}.{encoded_payload}".encode("ascii")
        expected_signature = hmac.new(
            JWT_SECRET.encode("utf-8"),
            signing_input,
            hashlib.sha256,
        ).digest()
        if not hmac.compare_digest(_b64url_decode(encoded_signature), expected_signature):
            return None

        header = json.loads(_b64url_decode(encoded_header))
        if header.get("alg") != JWT_ALGORITHM:
            return None

        payload = json.loads(_b64url_decode(encoded_payload))
        expires_at = payload.get("exp")
        if not isinstance(expires_at, int) or datetime.now(timezone.utc).timestamp() > expires_at:
            return None
        return payload
    except (ValueError, json.JSONDecodeError):
        return None


def create_avatar(nickname: str, user_id: int) -> str:
    """生成默认头像（SVG data URL）"""
    color = AVATAR_COLORS[user_id % len(AVATAR_COLORS)]
    label = escape(nickname[0] if nickname else "低")
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">'
        f'<rect width="96" height="96" rx="48" fill="{color}"/>'
        '<text x="48" y="58" text-anchor="middle" font-size="34" '
        f'font-family="Arial,sans-serif" font-weight="700" fill="white">{label}</text>'
        '</svg>'
    )
    return f"data:image/svg+xml,{quote(svg)}"


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """FastAPI 依赖：从 JWT 获取当前登录用户"""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="请先登录",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="登录已过期，请重新登录",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id: int = payload.get("user_id")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="无效的认证令牌")
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户不存在")
    return user
