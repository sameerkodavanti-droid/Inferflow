from fastapi.responses import StreamingResponse
from fastapi import APIRouter , Response
from .service import process_chat_stream

from .dtos import ChatRequest, ChatResponse
from .controller import chat as chat_controller


from sqlalchemy.ext.asyncio import AsyncSession

from fastapi import Depends

from db.dependencies import get_db


from routes.api_keys.dependencies import validate_api_key_dependency
from routes.users.service import is_authorized
from core.rate_limit import check_rate_limit, check_user_rate_limit


router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
    api_key=Depends(validate_api_key_dependency),
):
    rate = await check_rate_limit(
        api_key_id=api_key.id
    )
    response.headers[
        "X-RateLimit-Limit"
    ] = str(rate["limit"])

    response.headers[
        "X-RateLimit-Remaining"
    ] = str(rate["remaining"])

    return await chat_controller(
        request, db,
        user_id=api_key.user_id,
        api_key_id=api_key.id
    )


@router.post("/stream")
async def stream_chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    curr_user=Depends(is_authorized)
):
    await check_user_rate_limit(
        user_id=curr_user.id
    )

    stream = process_chat_stream(
        prompt=request.prompt,
        model_type=request.model_type,
        session_id=request.session_id,
        user_id=curr_user.id,
        db=db,
        api_key_id=None
    )

    return StreamingResponse(
        stream,
        media_type="text/event-stream"
    )