from .dtos import ChatRequest, ChatResponse
from .service import process_chat, process_chat_stream


async def chat(
    request: ChatRequest,
    db,
    user_id: int,
    api_key_id: int | None = None
):

    ai_response = await process_chat(
        request, db, user_id,
        api_key_id=api_key_id
    )

    return ChatResponse(**ai_response)
