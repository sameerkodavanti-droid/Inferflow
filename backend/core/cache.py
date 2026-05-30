import os
from redis.asyncio import Redis

redis_client = Redis.from_url(
    os.getenv("REDIS_URL"),
    decode_responses=True
)