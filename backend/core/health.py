from sqlalchemy import select, func, Integer
from db.session import AsyncSessionLocal
from db.models import RequestLog


async def get_model_health():

    async with AsyncSessionLocal() as db:

        result = await db.execute(
            select(
                RequestLog.model_type,

                func.count(RequestLog.id).label("requests"),

                func.avg(RequestLog.latency).label("avg_latency"),

                func.avg(RequestLog.cost).label("avg_cost"),

                func.avg(
                    func.cast(RequestLog.fallback_used, Integer)
                ).label("fallback_rate")
            )
            .group_by(RequestLog.model_type)
        )

        rows = result.all()

    formatted = []

    for row in rows:

        formatted.append({
            "model_type": row.model_type,
            "requests": row.requests,
            "avg_latency": round(row.avg_latency or 0, 4),
            "avg_cost": round(row.avg_cost or 0, 6),
            "fallback_rate": round((row.fallback_rate or 0) * 100, 2)
        })

    return formatted


    

async def get_global_analytics():

    async with AsyncSessionLocal() as db:

        result = await db.execute(
            select(
                func.count(RequestLog.id).label("total_requests"),

                func.avg(RequestLog.latency).label("avg_latency"),

                func.sum(RequestLog.cost).label("total_cost"),

                func.avg(
                    func.cast(RequestLog.fallback_used, Integer)
                ).label("fallback_rate")
            )
        )

        row = result.one()

    return {

        "total_requests": row.total_requests,

        "avg_latency": round(row.avg_latency or 0, 4),

        "total_cost": round(row.total_cost or 0, 6),

        "fallback_rate": round(
            (row.fallback_rate or 0) * 100,
            2
        )
    }

async def get_user_analytics_core(db,user_id):

        result = await db.execute(
            select(

                func.count(RequestLog.id).label("total_requests"),

                func.avg(RequestLog.latency).label("avg_latency"),

                func.sum(RequestLog.cost).label("total_cost"),

                func.avg(
                    func.cast(RequestLog.fallback_used, Integer)
                ).label("fallback_rate")
            )
            .where(RequestLog.user_id == user_id)
        )

        row = result.one()

        formatted = {
            "total_requests": row.total_requests,
            "avg_latency": round(row.avg_latency or 0, 4),
            "total_cost": round(row.total_cost or 0, 6),
            "fallback_rate": round(
                (row.fallback_rate or 0) * 100,
                2
            )
        }

        return formatted
    