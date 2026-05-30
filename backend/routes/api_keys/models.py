from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from db.session import Base


class APIKey(Base):

    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    name = Column(String)

    hashed_key = Column(String, unique=True)

    request_used = Column(Integer, default=0)

    request_limit = Column(Integer, default=10000)

    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, server_default=func.now())



