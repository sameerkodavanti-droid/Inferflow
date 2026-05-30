from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from db.dependencies import get_db

from routes.users.service import is_authorized

from routes.chat.dtos import (
    CreateSessionResponse,
    SessionResponse,
    RenameSessionRequest,
    MessageResponse
)

from services.chatsession import (
    create_session,
    get_user_sessions,
    get_session_messages,
    delete_session,
    rename_session
)

router = APIRouter(
    prefix="/sessions",
    tags=["sessions"]
)


@router.post(
    "",
    response_model=CreateSessionResponse
)
async def create_chat_session(
    db: AsyncSession = Depends(get_db),
    curr_user=Depends(is_authorized)
):

    session = await create_session(
        db=db,
        user_id=curr_user.id
    )

    return {
        "session_id": session.id,
        "title": session.title
    }


@router.get(
    "",
    response_model=list[SessionResponse]
)
async def get_sessions(
    db: AsyncSession = Depends(get_db),
    curr_user=Depends(is_authorized)
):

    sessions = await get_user_sessions(
        db=db,
        user_id=curr_user.id
    )

    return sessions


@router.get(
    "/{session_id}/messages",
    response_model=list[MessageResponse]
)
async def get_messages(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    curr_user=Depends(is_authorized)
):

    messages = await get_session_messages(
        db=db,
        session_id=session_id,
        user_id=curr_user.id
    )

    return messages


@router.delete("/{session_id}")
async def remove_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    curr_user=Depends(is_authorized)
):

    deleted = await delete_session(
        db=db,
        session_id=session_id,
        user_id=curr_user.id
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Session not found"
        )

    return {
        "message": "Session deleted"
    }


@router.patch("/{session_id}")
async def update_session(
    session_id: int,
    request: RenameSessionRequest,
    db: AsyncSession = Depends(get_db),
    curr_user=Depends(is_authorized)
):

    session = await rename_session(
        db=db,
        session_id=session_id,
        user_id=curr_user.id,
        title=request.title
    )

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Session not found"
        )

    return session