from fastapi import APIRouter, Depends

from sqlalchemy.ext.asyncio import AsyncSession

from db.dependencies import get_db

from .dtos import UserRequest, UserResponse

from .service import (
    register_user,
    login_user,
    is_authorized
)

router = APIRouter()


@router.post(
    "/register",
    response_model=UserResponse
)
async def register(
    request: UserRequest,
    db: AsyncSession = Depends(get_db)
):

    return await register_user(
        request,
        db
    )


@router.post("/login")
async def login(
    request: UserRequest,
    db: AsyncSession = Depends(get_db)
):

    return await login_user(
        request,
        db
    )


@router.get("/is_auth")
async def is_auth(
    user = Depends(is_authorized)
):

    return {
        "authenticated": True,
        "user_id": user.id,
        "email": user.email
    }