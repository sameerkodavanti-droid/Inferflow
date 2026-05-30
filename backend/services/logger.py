
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import RequestLog


async def log_request(
    db: AsyncSession,

    request_id: str,

    user_id: int,

    prompt: str,

    response: str,

    model_type: str,

    input_tokens: int,

    output_tokens: int,

    total_tokens: int,

    cost: float,

    latency: float,

    fallback_used: bool,

    error: str | None = None,

    cache_hit: bool = False,

    api_key_id: int | None = None,

    tokens_saved: int = 0,

    cost_saved: float = 0.0,

    latency_saved: float = 0.0,
):
    try:

        log = RequestLog(

            request_id=request_id,

            user_id=user_id,

            prompt=prompt,

            response=response,

            model_type=model_type,

            input_tokens=input_tokens,

            output_tokens=output_tokens,

            total_tokens=total_tokens,

            cost=cost,

            latency=latency,

            fallback_used=fallback_used,

            error=error,

            cache_hit=cache_hit,

            api_key_id=api_key_id,

            tokens_saved=tokens_saved,

            cost_saved=cost_saved,

            latency_saved=latency_saved
        )

        db.add(log)

        await db.commit()

        await db.refresh(log)

        return log
    except Exception as e:
        await db.rollback()
        raise e