"""
InferFlow Analytics Controller
-------------------------------
Thin controller layer that delegates to the analytics service.
"""

from .service import (
    get_analytics,
    get_global_analytics,
    get_user_analytics,
    get_cache_analytics,
    get_cache_trends,
    get_redis_info,
    get_dashboard_overview,
    get_request_logs_service,
    get_routing_decisions_service,
)


# ── Existing ──────────────────────────────────────────────

async def analytics():
    return await get_analytics()


async def global_analytics_controller():
    return await get_global_analytics()


async def user_analytics_controller(db, user_id):
    return await get_user_analytics(db, user_id)


# ── Cache Analytics ───────────────────────────────────────

async def cache_analytics_controller():
    return await get_cache_analytics()


async def cache_trends_controller(days: int = 30):
    return await get_cache_trends(days=days)


async def redis_info_controller():
    return await get_redis_info()


# ── Dashboard Overview ────────────────────────────────────

async def dashboard_overview_controller():
    return await get_dashboard_overview()


async def get_logs_controller(db, user_id):
    return await get_request_logs_service(db, user_id)


async def get_routing_decisions_controller(db, user_id):
    return await get_routing_decisions_service(db, user_id)