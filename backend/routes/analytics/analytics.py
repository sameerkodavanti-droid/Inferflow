"""
InferFlow Analytics Routes
---------------------------
All analytics endpoints grouped by feature.
Protected by JWT authentication with ownership enforcement.
"""

from fastapi import APIRouter, Depends, HTTPException, Query

from sqlalchemy.ext.asyncio import AsyncSession

from db.dependencies import get_db
from routes.users.service import is_authorized

from .dtos import (
    ModelHealthResponse,
    CacheAnalyticsResponse,
    CacheTrendsResponse,
    RedisMetricsResponse,
    DashboardOverviewResponse,
)

from .controller import (
    analytics as analytics_controller,
    global_analytics_controller,
    cache_analytics_controller,
    cache_trends_controller,
    redis_info_controller,
    dashboard_overview_controller,
    get_logs_controller,
    get_routing_decisions_controller,
)

router = APIRouter()


# ──────────────────────────────────────────────────────────
# Existing endpoints (preserved)
# ──────────────────────────────────────────────────────────

@router.get(
    "/model-health",
    response_model=list[ModelHealthResponse]
)
async def model_health():
    return await analytics_controller()


@router.get("/global-health")
async def global_health():
    return await global_analytics_controller()


@router.get("/user-health")
async def user_health(
    db: AsyncSession = Depends(get_db),
    curr_user=Depends(is_authorized)
):
    return await user_analytics_controller(
        db, curr_user.id
    )


# ──────────────────────────────────────────────────────────
# 1. Advanced Cache Analytics
# ──────────────────────────────────────────────────────────

@router.get(
    "/cache",
    response_model=CacheAnalyticsResponse
)
async def cache_analytics(
    curr_user=Depends(is_authorized)
):
    return await cache_analytics_controller()



@router.get(
    "/cache/redis",
    response_model=RedisMetricsResponse
)
async def redis_metrics(
    curr_user=Depends(is_authorized)
):
    return await redis_info_controller()


# ──────────────────────────────────────────────────────────
# 4. Dashboard Overview
# ──────────────────────────────────────────────────────────

@router.get(
    "/overview",
    response_model=DashboardOverviewResponse
)
async def dashboard_overview(
    curr_user=Depends(is_authorized)
):
    return await dashboard_overview_controller()


@router.get(
    "/cache/trends",
    response_model=CacheTrendsResponse
)
async def cache_trends(
    days: int = Query(default=30, ge=1, le=365),
    curr_user=Depends(is_authorized)
):
    return await cache_trends_controller(days=days)


@router.get("/logs")
async def get_logs(
    db: AsyncSession = Depends(get_db),
    curr_user=Depends(is_authorized)
):
    return await get_logs_controller(db, curr_user.id)


@router.get("/routing-decisions")
async def get_routing_decisions(
    db: AsyncSession = Depends(get_db),
    curr_user=Depends(is_authorized)
):
    return await get_routing_decisions_controller(db, curr_user.id)
