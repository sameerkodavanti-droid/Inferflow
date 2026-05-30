from fastapi import Header, Depends, Request, HTTPException
from db.dependencies import get_db

from .service import validate_api_key_service


async def validate_api_key_dependency(
    request: Request,
    db = Depends(get_db)
):
    x_api_key : str = Header(...)
    if not x_api_key:
        raise HTTPException(
            status_code=401,
            detail="Authorization header is missing"
        )

    x_api_key = x_api_key.split(" ")[-1]

    return await validate_api_key_service(
        x_api_key,
        db
    )