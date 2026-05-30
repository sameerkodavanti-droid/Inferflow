from sqlalchemy import select
from routes.chat.models import UserMemory,ChatSession

async def get_session(
    db,
    user_id: int
):
    try:

        result = await db.execute(
            select(Session)
            .where(
                Session.user_id == user_id
            )
        )

        return result.scalars().first()

    except Exception as e:
        raise e


async def get_user_memory(
    db,
    session_id: int
):
    try:

        result = await db.execute(
            select(Message)
            .where(Message.session_id == session_id)
        )

        return result.scalars().all()

    except Exception as e:
        raise e
