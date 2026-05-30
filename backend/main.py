from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.chat.chat import router as chat_router
from db.session import engine, Base
from routes.analytics.analytics import router as analytics_router
from routes.api_keys.routes import router as api_key_router
from routes.users.user import router as user_router
from routes.chat.session_routes import router as session_router
from routes.auth.auth import router as auth_router
from core.exceptions import global_exception_handler

app = FastAPI(
    title="InferFlow",
    description="Production-grade AI Gateway Platform",
)

app.add_exception_handler(Exception, global_exception_handler)

@app.on_event("startup")
async def startup():

    async with engine.begin() as conn:

        await conn.run_sync(Base.metadata.create_all)

import os

cors_origins_str = os.getenv("CORS_ORIGINS", "*")
allow_origins = [o.strip() for o in cors_origins_str.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_key_router)
app.include_router(session_router)
app.include_router(user_router, prefix="/users")
app.include_router(chat_router, prefix="/chat")
app.include_router(analytics_router, prefix="/analytics")
app.include_router(auth_router)



