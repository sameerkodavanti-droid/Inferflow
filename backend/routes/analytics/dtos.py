from pydantic import BaseModel
from datetime import datetime


# ── Existing ──────────────────────────────────────────────

class ModelHealthResponse(BaseModel):

    model_type: str

    requests: int

    avg_latency: float

    avg_cost: float

    fallback_rate: float


class GlobalAnalyticsResponse(BaseModel):
    total_requests: int
    avg_latency: float
    total_cost: float
    fallback_rate: float


# ── Cache Analytics ───────────────────────────────────────

class CacheAnalyticsResponse(BaseModel):
    hits: int
    misses: int
    hit_rate: float
    tokens_saved: int
    cost_saved: float
    avg_latency_saved: float
    total_latency_saved: float
    cache_requests_per_day: float
    cache_efficiency: float


class CacheTrendItem(BaseModel):
    date: str
    hits: int
    misses: int
    hit_rate: float


class CacheTrendsResponse(BaseModel):
    trends: list[CacheTrendItem]


class RedisMetricsResponse(BaseModel):
    used_memory: str
    used_memory_bytes: int
    connected_clients: int
    uptime_seconds: int
    total_keys: int


# ── Dashboard Overview ────────────────────────────────────

class ProviderHealthItem(BaseModel):
    model_type: str
    requests: int
    avg_latency: float
    error_rate: float


class TopModelItem(BaseModel):
    model_type: str
    requests: int
    total_cost: float


class TopUserItem(BaseModel):
    user_id: int
    requests: int
    total_cost: float


class DashboardOverviewResponse(BaseModel):
    total_users: int
    total_requests: int
    total_cost: float
    avg_latency: float
    cache_hit_rate: float
    tokens_saved: int
    cost_saved: float
    active_api_keys: int
    active_users_today: int
    requests_today: int
    requests_this_month: int
    provider_health: list[ProviderHealthItem]
    top_models: list[TopModelItem]
    top_users: list[TopUserItem]