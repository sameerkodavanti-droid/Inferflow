from fastapi import (
    APIRouter,
    Depends
)

from sqlalchemy.ext.asyncio import AsyncSession

from db.dependencies import get_db
from routes.users.service import is_authorized

    

from .dtos import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    ChangePasswordRequest,
    ChangePasswordResponse
)

from .service import (
    forgot_password_service,
    reset_password_service,
    change_password_service
)

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)


@router.post(
    "/forgot-password",
    response_model=ForgotPasswordResponse
)
async def forgot_password(
    data: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db)
):

    return await forgot_password_service(
        email=data.email,
        db=db
    )


@router.post(
    "/reset-password",
    response_model=ResetPasswordResponse
)
async def reset_password(
    data: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):

    return await reset_password_service(
        email=data.email,
        otp=data.otp,
        new_password=data.new_password,
        db=db
    )


@router.post(
    "/change-password",
    response_model=ChangePasswordResponse
)
async def change_password(
    data: ChangePasswordRequest,

    curr_user=Depends(is_authorized),

    db: AsyncSession = Depends(get_db)
):

    return await change_password_service(
        curr_user=curr_user,
        current_password=data.current_password,
        new_password=data.new_password,
        db=db
    )