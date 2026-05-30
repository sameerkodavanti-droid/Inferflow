
from routes.chat.models import ChatSession
from routes.chat.models import Message
from sqlalchemy import select, delete
import re
from routes.chat.models import UserMemory, ChatSession, Message

async def create_session(
    db,
    user_id: int,
    title: str = "New Chat"
):

    session = ChatSession(
        user_id=user_id,
        title=title
    )

    db.add(session)

    await db.commit()

    await db.refresh(session)

    return session



async def save_user_memory(
    db,
    user_id: int,
    key: str,
    value: str
):

    result = await db.execute(
        select(UserMemory)
        .where(
            UserMemory.user_id == user_id,
            UserMemory.key == key
        )
    )

    memory = result.scalars().first()

    if memory:

        memory.value = value

    else:

        memory = UserMemory(
            user_id=user_id,
            key=key,
            value=value
        )

        db.add(memory)

    await db.commit()

    await db.refresh(memory)

    return memory

async def get_user_memory(
    db,
    user_id: int
):

    result = await db.execute(
        select(UserMemory)
        .where(
            UserMemory.user_id == user_id
        )
    )

    return result.scalars().all()

async def delete_user_memory(
    db,
    user_id: int,
    key: str
):

    result = await db.execute(
        select(UserMemory)
        .where(
            UserMemory.user_id == user_id,
            UserMemory.key == key
        )
    )

    memory = result.scalars().first()

    if memory:
        await db.delete(memory)
        await db.commit()
    else:
        raise ValueError("User memory not found")


async def get_user_sessions(
    db,
    user_id: int
):

    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == user_id)
        .order_by(ChatSession.created_at.desc())
    )

    return result.scalars().all()


async def get_session_messages(
    db,
    session_id: int,
    user_id: int
):

    result = await db.execute(
        select(Message)
        .where(
            Message.session_id == session_id,
            Message.user_id == user_id
        )
        .order_by(Message.created_at.asc())
    )

    return result.scalars().all()


async def delete_session(
    db,
    session_id: int,
    user_id: int
):

    result = await db.execute(
        select(ChatSession)
        .where(
            ChatSession.id == session_id,
            ChatSession.user_id == user_id
        )
    )

    session = result.scalars().first()

    if not session:
        return False

    await db.execute(
            delete(Message)
        .where(Message.session_id == session_id)
    )

    await db.delete(session)

    await db.commit()

    return True


async def rename_session(
    db,
    session_id: int,
    user_id: int,
    title: str
):

    result = await db.execute(
        select(ChatSession)
        .where(
            ChatSession.id == session_id,
            ChatSession.user_id == user_id
        )
    )

    session = result.scalars().first()

    if not session:
        return None

    session.title = title

    await db.commit()

    await db.refresh(session)

    return session
    
async def save_message(
    db,
    session_id: int,
    user_id: int,
    role: str,
    content: str
):

    message = Message(
        session_id=session_id,
        user_id=user_id,
        role=role,
        content=content
    )

    db.add(message)

    await db.commit()

    await db.refresh(message)

    return message



async def extract_and_store_memory(
    db,
    user_id: int,
    prompt: str,
    response: str
):
    
    text = prompt.lower()

    patterns = [
        (
            r"(?:my name is|i am|i'm)\s+(\w+)",
            "name"
        ),
        (
            r"i love (\w+)",
            "likes"
        ),
        (
            r"my favorite language is (\w+)",
            "favorite_language"
        ),
    ]

    for pattern, key in patterns:

        match = re.search(pattern, text)

        if match:

            value = match.group(1)

            await save_user_memory(
                db=db,
                user_id=user_id,
                key=key,
                value=value
            )



























