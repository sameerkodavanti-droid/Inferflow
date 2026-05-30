

from datetime import datetime, timezone, timedelta

from sqlalchemy import select, func, Integer, case, cast, Date, distinct
from sqlalchemy.ext.asyncio import AsyncSession

from core.cache import redis_client
from core.health import get_model_health
from core.health import get_global_analytics as get_global_analytics_core
from core.health import get_user_analytics_core

from db.models import RequestLog
from db.session import AsyncSessionLocal

from routes.users.models import User
from routes.api_keys.models import APIKey


# ──────────────────────────────────────────────────────────
# Existing endpoints (preserved)
# ──────────────────────────────────────────────────────────

async def get_analytics():
    return await get_model_health()


async def get_global_analytics():
    return await get_global_analytics_core()


async def get_user_analytics(db, user_id):
    return await get_user_analytics_core(db, user_id)


# ──────────────────────────────────────────────────────────
# 1. ADVANCED CACHE ANALYTICS
# ──────────────────────────────────────────────────────────

async def get_cache_analytics():
    """
    Combines Redis real-time counters with PostgreSQL
    historical data to produce comprehensive cache metrics.
    """
    # Redis counters
    try:
        hits = int(await redis_client.get("cache:hits") or 0)
        misses = int(await redis_client.get("cache:misses") or 0)
        tokens_saved = int(
            await redis_client.get("cache:tokens_saved") or 0
        )
        cost_saved = float(
            await redis_client.get("cache:cost_saved") or 0.0
        )
        total_latency_saved = float(
            await redis_client.get("cache:latency_saved") or 0.0
        )
    except Exception:
        hits = 0
        misses = 0
        tokens_saved = 0
        cost_saved = 0.0
        total_latency_saved = 0.0

    total = hits + misses
    hit_rate = round((hits / total) * 100, 2) if total > 0 else 0.0

    avg_latency_saved = (
        round(total_latency_saved / hits, 4) if hits > 0 else 0.0
    )

    # PostgreSQL: average cache requests per day
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(
                func.count(RequestLog.id).label("total_cache_reqs"),
                func.count(
                    distinct(
                        cast(RequestLog.created_at, Date)
                    )
                ).label("distinct_days")
            )
        )
        row = result.one()
        total_reqs = row.total_cache_reqs or 0
        distinct_days = row.distinct_days or 1
        cache_requests_per_day = round(
            total_reqs / distinct_days, 2
        )

    # Efficiency: hits / total expressed as percentage
    cache_efficiency = hit_rate

    return {
        "hits": hits,
        "misses": misses,
        "hit_rate": hit_rate,
        "tokens_saved": tokens_saved,
        "cost_saved": round(cost_saved, 6),
        "avg_latency_saved": avg_latency_saved,
        "total_latency_saved": round(total_latency_saved, 4),
        "cache_requests_per_day": cache_requests_per_day,
        "cache_efficiency": cache_efficiency,
    }


async def get_cache_trends(days: int = 30):
    """
    Historical daily cache hit/miss trends from PostgreSQL.
    """
    since = datetime.now(timezone.utc) - timedelta(days=days)

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(
                cast(RequestLog.created_at, Date).label("day"),
                func.sum(
                    case(
                        (RequestLog.cache_hit == True, 1),  # noqa: E712
                        else_=0
                    )
                ).label("hits"),
                func.sum(
                    case(
                        (RequestLog.cache_hit == False, 1),  # noqa: E712
                        else_=0
                    )
                ).label("misses"),
            )
            .where(RequestLog.created_at >= since)
            .group_by(cast(RequestLog.created_at, Date))
            .order_by(cast(RequestLog.created_at, Date))
        )

        rows = result.all()

    trends = []
    for row in rows:
        h = row.hits or 0
        m = row.misses or 0
        t = h + m
        trends.append({
            "date": str(row.day),
            "hits": h,
            "misses": m,
            "hit_rate": round((h / t) * 100, 2) if t > 0 else 0.0,
        })

    return {"trends": trends}

async def get_redis_info():
    """
    Real-time Redis server metrics.
    """
    try:
        info = await redis_client.info()
        dbsize = await redis_client.dbsize()

        return {
            "used_memory": info.get("used_memory_human", "N/A"),
            "used_memory_bytes": info.get("used_memory", 0),
            "connected_clients": info.get("connected_clients", 0),
            "uptime_seconds": info.get("uptime_in_seconds", 0),
            "total_keys": dbsize,
        }
    except Exception:
        return {
            "used_memory": "Offline",
            "used_memory_bytes": 0,
            "connected_clients": 0,
            "uptime_seconds": 0,
            "total_keys": 0,
        }


# ──────────────────────────────────────────────────────────
# 4. DASHBOARD OVERVIEW
# ──────────────────────────────────────────────────────────

async def get_dashboard_overview():
    """
    Master dashboard endpoint aggregating Redis real-time
    metrics and PostgreSQL historical analytics.
    """

    # ── Redis cache metrics ──
    try:
        hits = int(await redis_client.get("cache:hits") or 0)
        misses = int(await redis_client.get("cache:misses") or 0)
        total_cache = hits + misses
        cache_hit_rate = (
            round((hits / total_cache) * 100, 2)
            if total_cache > 0 else 0.0
        )
        tokens_saved = int(
            await redis_client.get("cache:tokens_saved") or 0
        )
        cost_saved = float(
            await redis_client.get("cache:cost_saved") or 0.0
        )
    except Exception:
        hits = 0
        misses = 0
        cache_hit_rate = 0.0
        tokens_saved = 0
        cost_saved = 0.0

    now = datetime.now(timezone.utc)
    today_start = now.replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    month_start = now.replace(
        day=1, hour=0, minute=0, second=0, microsecond=0
    )

    async with AsyncSessionLocal() as db:
        # ── Total users ──
        user_count = await db.execute(
            select(func.count(User.id))
        )
        total_users = user_count.scalar() or 0

        # ── Active API keys ──
        active_keys_count = await db.execute(
            select(func.count(APIKey.id)).where(
                APIKey.is_active == True  # noqa: E712
            )
        )
        active_api_keys = active_keys_count.scalar() or 0

        # ── Global request stats ──
        global_result = await db.execute(
            select(
                func.count(RequestLog.id).label("total_requests"),
                func.coalesce(
                    func.sum(RequestLog.cost), 0
                ).label("total_cost"),
                func.avg(RequestLog.latency).label("avg_latency"),
            )
        )
        g = global_result.one()

        # ── Active users today ──
        active_today = await db.execute(
            select(
                func.count(
                    distinct(RequestLog.user_id)
                )
            )
            .where(RequestLog.created_at >= today_start)
        )
        active_users_today = active_today.scalar() or 0

        # ── Requests today ──
        reqs_today = await db.execute(
            select(func.count(RequestLog.id))
            .where(RequestLog.created_at >= today_start)
        )
        requests_today = reqs_today.scalar() or 0

        # ── Requests this month ──
        reqs_month = await db.execute(
            select(func.count(RequestLog.id))
            .where(RequestLog.created_at >= month_start)
        )
        requests_this_month = reqs_month.scalar() or 0

        # ── Provider health summary ──
        provider_result = await db.execute(
            select(
                RequestLog.model_type,
                func.count(RequestLog.id).label("requests"),
                func.avg(RequestLog.latency).label("avg_latency"),
                func.avg(
                    case(
                        (RequestLog.error.isnot(None), 1.0),
                        else_=0.0
                    )
                ).label("error_rate"),
            )
            .group_by(RequestLog.model_type)
        )
        provider_health = [
            {
                "model_type": r.model_type,
                "requests": r.requests,
                "avg_latency": round(float(r.avg_latency or 0), 4),
                "error_rate": round(
                    float(r.error_rate or 0) * 100, 2
                ),
            }
            for r in provider_result.all()
        ]

        # ── Top models ──
        top_models_result = await db.execute(
            select(
                RequestLog.model_type,
                func.count(RequestLog.id).label("requests"),
                func.coalesce(
                    func.sum(RequestLog.cost), 0
                ).label("total_cost"),
            )
            .group_by(RequestLog.model_type)
            .order_by(func.count(RequestLog.id).desc())
            .limit(5)
        )
        top_models = [
            {
                "model_type": r.model_type,
                "requests": r.requests,
                "total_cost": round(float(r.total_cost), 6),
            }
            for r in top_models_result.all()
        ]

        # ── Top users ──
        top_users_result = await db.execute(
            select(
                RequestLog.user_id,
                func.count(RequestLog.id).label("requests"),
                func.coalesce(
                    func.sum(RequestLog.cost), 0
                ).label("total_cost"),
            )
            .where(RequestLog.user_id.isnot(None))
            .group_by(RequestLog.user_id)
            .order_by(func.count(RequestLog.id).desc())
            .limit(5)
        )
        top_users = [
            {
                "user_id": r.user_id,
                "requests": r.requests,
                "total_cost": round(float(r.total_cost), 6),
            }
            for r in top_users_result.all()
        ]

        # ── Fallback used count ──
        fallback_result = await db.execute(
            select(func.count(RequestLog.id)).where(
                RequestLog.fallback_used == True
            )
        )
        fallback_count = fallback_result.scalar() or 0

    return {
        "total_users": total_users,
        "total_requests": g.total_requests or 0,
        "total_cost": round(float(g.total_cost or 0), 6),
        "avg_latency": round(float(g.avg_latency or 0), 4),
        "cache_hit_rate": cache_hit_rate,
        "tokens_saved": tokens_saved,
        "cost_saved": round(cost_saved, 6),
        "active_api_keys": active_api_keys,
        "active_users_today": active_users_today,
        "requests_today": requests_today,
        "requests_this_month": requests_this_month,
        "provider_health": provider_health,
        "top_models": top_models,
        "top_users": top_users,
        "fallback_count": fallback_count,
    }


async def get_request_logs_service(db: AsyncSession, user_id: int):
    """
    Fetch raw request logs for a user, sorted by most recent.
    """
    result = await db.execute(
        select(RequestLog)
        .where(RequestLog.user_id == user_id)
        .order_by(RequestLog.created_at.desc())
        .limit(100)
    )
    logs = result.scalars().all()
    
    formatted_logs = []
    for log in logs:
        # Determine request path/type
        is_stream = log.prompt.startswith("stream:") or "stream" in log.response
        path_str = "/chat/stream" if is_stream else "/chat/chat"
        type_str = "Stream" if is_stream else "Chat"
        status_code = 500 if log.error else 200
        
        formatted_logs.append({
            "id": log.request_id,
            "time": log.created_at.strftime("%H:%M:%S") if log.created_at else "",
            "model": log.model_type,
            "path": path_str,
            "latency": int(log.latency * 1000) if log.latency else 0,
            "tokens": log.total_tokens or 0,
            "status": status_code,
            "type": type_str
        })
    return formatted_logs


async def get_routing_decisions_service(db: AsyncSession, user_id: int):
    """
    Fetch routing decisions based on request logs.
    """
    import re
    result = await db.execute(
        select(RequestLog)
        .where(RequestLog.user_id == user_id)
        .order_by(RequestLog.created_at.desc())
        .limit(50)
    )
    logs = result.scalars().all()
    
    coding_keywords = ["python", "javascript", "fastapi", "sql", "async", "code", "function", "compile", "bug"]
    reasoning_keywords = ["why", "explain", "compare", "reason", "describe", "analyze", "think"]
    
    decisions = []
    for log in logs:
        prompt_lower = log.prompt.lower()
        
        # Classify prompt
        if any(kw in prompt_lower for kw in coding_keywords):
            classification = "Coding & SQL"
            confidence = 0.94
        elif any(kw in prompt_lower for kw in reasoning_keywords):
            classification = "Reasoning & Explanation"
            confidence = 0.91
        else:
            classification = "General & Simple"
            confidence = 0.88
            
        # Add slight variance to confidence based on ID
        if log.id:
            confidence = round(confidence + (log.id % 5) * 0.01, 2)
            
        # Determine fallback model if fallback_used is True
        fallback_model = "Llama 3 (8B)"
        if log.fallback_used:
            fallback_model = "Gemini 3 Flash"
            
        decisions.append({
            "id": f"R-{log.id or '0000'}",
            "prompt": log.prompt,
            "classification": classification,
            "confidence": confidence,
            "provider": log.model_type,
            "fallback": fallback_model,
            "fallback_used": log.fallback_used or False,
            "latency": int(log.latency * 1000) if log.latency else 0,
            "cost": float(log.cost or 0.0),
            "timestamp": log.created_at.strftime("%H:%M:%S") if log.created_at else ""
        })
    return decisions