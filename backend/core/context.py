from sqlalchemy import select, func, Integer
from db.session import AsyncSessionLocal
from routes.chat.models import Message

async def get_recent_conversation(
    db,
    user_id: int,
    limit: int = 5
):
    result = await db.execute(
        select(Message)
        .where(Message.user_id == user_id)
        .order_by(Message.created_at.desc())
        .limit(limit)
    )

    logs = result.scalars().all()

    return list(reversed(logs))

async def get_recent_messages(
    db,
    session_id: int,
    limit: int = 10
):

    result = await db.execute(
        select(Message)
        .where(
            Message.session_id == session_id
        )
        .order_by(Message.created_at.desc())
        .limit(limit)
    )

    messages = result.scalars().all()

    return list(reversed(messages))