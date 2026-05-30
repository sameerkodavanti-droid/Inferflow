from .models import User
from .dtos import UserRequest
from db.dependencies import get_db

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from fastapi import HTTPException, Header, Depends, Request

from datetime import datetime, timedelta, timezone
from core.security import verify_password, get_password_hash
from dotenv import load_dotenv

import jwt
import os


load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
EXP_TIME = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))



async def register_user(
    request: UserRequest,
    db: AsyncSession
):
    existing_user = await db.execute(
        select(User).where(
            User.email == request.email
        )
    )

    existing_user = existing_user.scalar_one_or_none()

    if existing_user:

        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user = User(
        email=request.email,
        hashed_password=get_password_hash(
            request.password
        )
    )

    db.add(new_user)

    await db.commit()

    await db.refresh(new_user)

    return new_user


async def login_user(
    request: UserRequest,
    db: AsyncSession
):
    from core.cache import redis_client

    # 1. Login rate limit (10 per minute per email)
    rate_key = f"login_rate:{request.email}"
    try:
        current_rate = await redis_client.incr(rate_key)
        if current_rate == 1:
            await redis_client.expire(rate_key, 60)
        if current_rate > 10:
            raise HTTPException(
                status_code=429,
                detail="Too many login attempts. Please try again in a minute."
            )
    except HTTPException:
        raise
    except Exception:
        pass

    # 2. Lockout check (5 failed attempts maximum)
    failures_key = f"login_failures:{request.email}"
    try:
        failures = int(await redis_client.get(failures_key) or 0)
    except Exception:
        failures = 0
        
    if failures >= 5:
        raise HTTPException(
            status_code=403,
            detail="Account temporarily locked due to too many failed login attempts. Try again in 10 minutes."
        )

    result = await db.execute(
        select(User).where(
            User.email == request.email
        )
    )

    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if not verify_password(
        request.password,
        user.hashed_password
    ):
        # Increment failed login attempts
        try:
            await redis_client.incr(failures_key)
            await redis_client.expire(failures_key, 600)  # Lockout expires in 10 minutes
        except Exception:
            pass

        raise HTTPException(
            status_code=401,
            detail="Invalid password"
        )

    # Success - clear any lockout metrics
    try:
        await redis_client.delete(failures_key)
    except Exception:
        pass

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=EXP_TIME
    )

    token = jwt.encode(
        {
            "sub": str(user.id),
            "exp": expire
        },
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }


async def is_authorized(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    authorization = request.headers.get("Authorization")
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header is missing"
        )

    try:

        token = authorization.split(" ")[-1]

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        result = await db.execute(
            select(User).where(
                User.id == int(user_id)
            )
        )

        user = result.scalar_one_or_none()

        if not user:

            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        return user

    except jwt.ExpiredSignatureError:

        raise HTTPException(
            status_code=401,
            detail="Token expired"
        )

    except jwt.InvalidTokenError:

        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )