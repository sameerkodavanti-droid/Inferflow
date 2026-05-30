import os
import uuid
import random

from datetime import (
    datetime,
    timedelta,
    UTC
)

from fastapi import (
    HTTPException,
    status
)

from sqlalchemy import (
    select,
    update
)

from sqlalchemy.ext.asyncio import AsyncSession

from dotenv import load_dotenv

from routes.users.models import User

from .models import PasswordResetOTP

from core.security import (
    get_password_hash,
    verify_password
)

from services.email_service import send_email

load_dotenv()

OTP_EXPIRY_MINUTES = int(
    os.getenv("OTP_EXPIRY_MINUTES", 5)
)

MAX_OTP_ATTEMPTS = int(
    os.getenv("MAX_OTP_ATTEMPTS", 5)
)

OTP_RESEND_COOLDOWN = int(
    os.getenv("OTP_RESEND_COOLDOWN", 20)
)


def generate_otp():

    return str(
        random.randint(
            100000,
            999999
        )
    )


async def forgot_password_service(
    email: str,
    db: AsyncSession
):

    result = await db.execute(
        select(User).where(
            User.email == email
        )
    )

    user = result.scalar_one_or_none()

    if not user:

        return {
            "message": (
                "If an account exists "
                "with this email, "
                "an OTP has been sent."
            )
        }

    latest_otp_result = await db.execute(
        select(PasswordResetOTP)
        .where(
            PasswordResetOTP.user_id == user.id
        )
        .order_by(
            PasswordResetOTP.created_at.desc()
        )
    )

    latest_otp = (
        latest_otp_result
        .scalars()
        .first()
    )

    if latest_otp:

        cooldown_remaining = (
            latest_otp.created_at
            + timedelta(
                seconds=OTP_RESEND_COOLDOWN
            )
            - datetime.now(UTC).replace(tzinfo=None)
        ).total_seconds()

        # If cooldown is abnormally large, it is due to a timezone mismatch on old records
        if cooldown_remaining > OTP_RESEND_COOLDOWN:
            cooldown_remaining = 0

        if cooldown_remaining > 0:

            raise HTTPException(
                status_code=429,
                detail=(
                    f"Please wait "
                    f"{int(cooldown_remaining)}s "
                    f"before requesting another OTP"
                )
            )

    await db.execute(
        update(PasswordResetOTP)
        .where(
            PasswordResetOTP.user_id == user.id,
            PasswordResetOTP.used == False
        )
        .values(
            used=True
        )
    )

    otp = generate_otp()

    otp_hash = get_password_hash(otp)

    otp_entry = PasswordResetOTP(

        id=uuid.uuid4(),

        user_id=user.id,

        otp_hash=otp_hash,

        expires_at=(
            datetime.now(UTC).replace(tzinfo=None)
            + timedelta(
                minutes=OTP_EXPIRY_MINUTES
            )
        ),

        created_at=datetime.now(UTC).replace(tzinfo=None),

        attempts=0,

        used=False
    )

    db.add(otp_entry)

    await db.commit()

    try:

        await send_email(

            to_email=user.email,

            subject=(
                "InferFlow Password Reset OTP"
            ),

            body = f"""
                <!DOCTYPE html>
                <html>
                <head>
                <meta charset="UTF-8">
                </head>
                <body style="
                    margin:0;
                    padding:40px 20px;
                    background:#000000;
                    font-family:Inter,Arial,sans-serif;
                ">

                    <div style="
                        max-width:520px;
                        margin:auto;
                        background:#09090b;
                        border:1px solid rgba(255,255,255,0.1);
                        border-radius:24px;
                        overflow:hidden;
                    ">

                        <div style="
                            height:4px;
                            background:linear-gradient(
                                90deg,
                                #3b82f6,
                                #6366f1,
                                #8b5cf6
                            );
                        "></div>

                        <div style="padding:40px;">

                            <div style="
                                width:52px;
                                height:52px;
                                margin:0 auto 24px;
                                border-radius:16px;
                                background:rgba(59,130,246,0.12);
                                border:1px solid rgba(59,130,246,0.25);
                                text-align:center;
                                line-height:52px;
                                font-size:24px;
                            ">
                                🔐
                            </div>

                            <h1 style="
                                margin:0;
                                text-align:center;
                                color:#ffffff;
                                font-size:28px;
                                font-weight:700;
                            ">
                                Verify Your Account
                            </h1>

                            <p style="
                                margin:16px 0 32px;
                                text-align:center;
                                color:#a1a1aa;
                                font-size:14px;
                                line-height:1.6;
                            ">
                                Use the verification code below to continue with InferFlow.
                            </p>

                            <div style="
                                background:#000000;
                                border:1px solid rgba(255,255,255,0.08);
                                border-radius:16px;
                                padding:24px;
                                text-align:center;
                            ">
                                <div style="
                                    color:#60a5fa;
                                    font-size:34px;
                                    font-weight:800;
                                    letter-spacing:10px;
                                    font-family:monospace;
                                ">
                                    {otp}
                                </div>
                            </div>

                            <p style="
                                margin-top:28px;
                                color:#d4d4d8;
                                font-size:14px;
                                line-height:1.8;
                            ">
                                This verification code expires in
                                <span style="color:#60a5fa;">
                                    {OTP_EXPIRY_MINUTES} minutes
                                </span>.
                            </p>

                            <div style="
                                margin-top:24px;
                                padding:16px;
                                border-radius:12px;
                                background:rgba(245,158,11,0.08);
                                border:1px solid rgba(245,158,11,0.15);
                            ">
                                <p style="
                                    margin:0;
                                    color:#fbbf24;
                                    font-size:13px;
                                    line-height:1.6;
                                ">
                                    Never share this code with anyone. InferFlow will never ask for your OTP.
                                </p>
                            </div>

                            <div style="
                                margin-top:32px;
                                border-top:1px solid rgba(255,255,255,0.08);
                                padding-top:20px;
                                text-align:center;
                            ">
                                <p style="
                                    margin:0;
                                    color:#71717a;
                                    font-size:12px;
                                ">
                                    © InferFlow
                                </p>
                            </div>

                        </div>
                    </div>

                </body>
                </html>
                """
        )

    except Exception:

        raise HTTPException(
            status_code=500,
            detail="Failed to send OTP"
        )

    return {
        "message": (
            "If an account exists "
            "with this email, "
            "an OTP has been sent."
        )
    }


async def reset_password_service(
    email: str,
    otp: str,
    new_password: str,
    db: AsyncSession
):

    result = await db.execute(
        select(User).where(
            User.email == email
        )
    )

    user = result.scalar_one_or_none()

    if not user:

        raise HTTPException(
            status_code=400,
            detail="Invalid OTP"
        )

    otp_result = await db.execute(
        select(PasswordResetOTP)
        .where(
            PasswordResetOTP.user_id == user.id,
            PasswordResetOTP.used == False
        )
        .order_by(
            PasswordResetOTP.created_at.desc()
        )
    )

    otp_entry = (
        otp_result
        .scalars()
        .first()
    )

    if not otp_entry:

        raise HTTPException(
            status_code=400,
            detail="OTP not found"
        )

    if otp_entry.expires_at < datetime.now(UTC).replace(tzinfo=None):

        raise HTTPException(
            status_code=400,
            detail="OTP expired"
        )

    if otp_entry.attempts >= MAX_OTP_ATTEMPTS:

        raise HTTPException(
            status_code=429,
            detail="Too many OTP attempts"
        )

    otp_valid = verify_password(
        otp,
        otp_entry.otp_hash
    )

    if not otp_valid:

        otp_entry.attempts += 1

        await db.commit()

        raise HTTPException(
            status_code=400,
            detail="Invalid OTP"
        )

    user.hashed_password = get_password_hash(
        new_password
    )

    otp_entry.used = True

    try:
        from core.cache import redis_client
        await redis_client.delete(f"login_failures:{email}")
    except Exception:
        pass

    await db.commit()

    return {
        "message": (
            "Password reset successfully"
        )
    }


async def change_password_service(
    curr_user,
    current_password: str,
    new_password: str,
    db: AsyncSession
):

    result = await db.execute(
        select(User).where(
            User.id == curr_user.id
        )
    )

    user = result.scalar_one_or_none()

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    valid_password = verify_password(
        current_password,
        user.hashed_password
    )

    if not valid_password:

        raise HTTPException(
            status_code=400,
            detail=(
                "Current password "
                "is incorrect"
            )
        )

    user.hashed_password = get_password_hash(
        new_password
    )

    await db.commit()

    return {
        "message": (
            "Password changed successfully"
        )
    }