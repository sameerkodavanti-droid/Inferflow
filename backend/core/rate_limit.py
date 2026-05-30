from fastapi import HTTPException
from core.cache import redis_client
from datetime import datetime


RATE_LIMIT = 20
WINDOW_SECONDS = 60


async def check_rate_limit(
    api_key_id: int
):
    try:
        now = datetime.utcnow()
        window = now.strftime("%Y-%m-%d-%H-%M")
        redis_key = f"rate_limit:{api_key_id}:{window}"
        current = await redis_client.incr(redis_key)
        if current == 1:
            await redis_client.expire(redis_key, WINDOW_SECONDS)
        if current > RATE_LIMIT:
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded"
            )
        remaining = RATE_LIMIT - current
        return {
            "limit": RATE_LIMIT,
            "remaining": remaining,
            "current": current
        }
    except HTTPException:
        raise
    except Exception:
        # Fail open if Redis is offline
        return {
            "limit": RATE_LIMIT,
            "remaining": RATE_LIMIT,
            "current": 0
        }


USER_RATE_LIMIT = 60
WINDOW_SECONDS = 60


async def check_user_rate_limit(
    user_id: int
):
    try:
        now = datetime.utcnow()
        window = now.strftime("%Y-%m-%d-%H-%M")
        redis_key = f"user_rate_limit:{user_id}:{window}"
        current = await redis_client.incr(redis_key)
        if current == 1:
            await redis_client.expire(redis_key, WINDOW_SECONDS)
        if current > USER_RATE_LIMIT:
            raise HTTPException(
                status_code=429,
                detail="User rate limit exceeded"
            )
        remaining = USER_RATE_LIMIT - current
        return {
            "limit": USER_RATE_LIMIT,
            "remaining": remaining,
            "current": current
        }
    except HTTPException:
        raise
    except Exception:
        # Fail open if Redis is offline
        return {
            "limit": USER_RATE_LIMIT,
            "remaining": USER_RATE_LIMIT,
            "current": 0
        }