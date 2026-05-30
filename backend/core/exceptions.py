class ProviderError(Exception):
    pass

from fastapi import Request
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

async def global_exception_handler(
    request: Request,
    exc: Exception
):
    logger.exception("Unhandled exception")

    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error"
        }
    )