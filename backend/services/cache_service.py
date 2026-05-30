import json

from core.cache import redis_client


CACHE_TTL = 300


async def get_cached_response(key: str):
    try:
        cached = await redis_client.get(key)
        if cached:
            try:
                await redis_client.incr("cache:hits")
            except Exception:
                pass
            return json.loads(cached)
        try:
            await redis_client.incr("cache:misses")
        except Exception:
            pass
    except Exception:
        pass
    return None


async def set_cached_response(
    key: str,
    value: dict
):
    try:
        await redis_client.set(
            key,
            json.dumps(value),
            ex=CACHE_TTL
        )
    except Exception:
        pass


async def track_cache_savings(
    tokens_saved: int,
    cost_saved: float,
    latency_saved: float
):
    """
    Increment Redis counters for cache savings metrics.
    Called whenever a cache hit avoids an LLM call.
    """
    try:
        await redis_client.incrby(
            "cache:tokens_saved",
            tokens_saved
        )
        await redis_client.incrbyfloat(
            "cache:cost_saved",
            cost_saved
        )
        await redis_client.incrbyfloat(
            "cache:latency_saved",
            latency_saved
        )
    except Exception:
        pass