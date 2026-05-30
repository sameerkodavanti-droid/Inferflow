from sqlalchemy import select
from fastapi import HTTPException

from .models import APIKey

from core.security import (
    generate_api_key,
    hash_api_key
)


async def create_api_key_service(
    request,
    db,
    curr_user
):


    raw_key = generate_api_key()

    hashed_key = hash_api_key(raw_key)

    api_key = APIKey(
        user_id = curr_user.id,
        name=request.name,
        hashed_key=hashed_key
    )

    db.add(api_key)

    await db.commit()

    return {
        "api_key": raw_key
    }


async def validate_api_key_service(
    x_api_key,
    
    db
):

    hashed = hash_api_key(x_api_key)

    result = await db.execute(
        select(APIKey).where(
            APIKey.hashed_key == hashed,

        )
    )

    api_key = result.scalars().first()

    if not api_key or not api_key.is_active:

        raise HTTPException(
            status_code=401,
            detail="Invalid API Key"
        )

    if api_key.request_used >= api_key.request_limit:

        raise HTTPException(
            status_code=403,
            detail="API Key limit reached"
        )

    api_key.request_used += 1

    await db.commit()

    return api_key


async def revoke_api_key_service(
    request,
    db,
    curr_user
):

    user_id = curr_user.id
    api_name= request.name

    result = await db.execute(
        select(APIKey).where(
            APIKey.name == api_name,
            APIKey.user_id == user_id
        )
    )

    api_key = result.scalars().first()

    if not api_key or api_key.user_id != curr_user.id:

        raise HTTPException(
            status_code=404,
            detail="API Key not found"
        )

    api_key.is_active = False

    await db.commit()

    return {
        "message": "API key revoked"
    }

async def get_my_api_keys_service(
    db,
    curr_user
):

    user_id = curr_user.id

    result = await db.execute(
        select(APIKey).where(
            APIKey.user_id == user_id
        )
    )

    api_keys = result.scalars().all()

    formatted = []

    for key in api_keys:

        formatted.append({
            "id": key.id,
            "name": key.name,
            "requests_used": key.request_used,
            "request_limit": key.request_limit,
            "is_active": key.is_active,
            "created_at": key.created_at
        })

    return formatted