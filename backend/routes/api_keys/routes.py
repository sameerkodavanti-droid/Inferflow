from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db.dependencies import get_db

from routes.users.service import is_authorized

from .dtos import (
    CreateAPIKeyRequest,
    CreateAPIKeyResponse,
    RevokeAPIKeyRequest
)

from .controller import (
    create_api_key_controller,
    revoke_api_key_controller,
    get_my_api_keys_controller
)

router = APIRouter()


@router.post(
    "/api-keys/create",
    response_model=CreateAPIKeyResponse
)
async def create_api_key(
    request: CreateAPIKeyRequest,
    db = Depends(get_db),
    curr_user = Depends(is_authorized)
):

    return await create_api_key_controller(
        request,
        db,
            curr_user
    )



@router.post(
    "/api-keys/revoke"
)
async def revoke_api_key(
    request: RevokeAPIKeyRequest,
    db = Depends(get_db),
    curr_user = Depends(is_authorized)
):

    return await revoke_api_key_controller(
        request,
        db,
        curr_user
    )

@router.get("/api-keys")
async def get_my_api_keys(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(is_authorized)
):

    return await get_my_api_keys_controller(
        db,
        current_user
    )
    