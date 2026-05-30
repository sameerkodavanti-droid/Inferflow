from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Float,
    Boolean,
    TIMESTAMP,
    ForeignKey
)

from sqlalchemy.sql import func

from db.session import Base


class RequestLog(Base):

    __tablename__ = "logs"

    id = Column(Integer, primary_key=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    
    api_key_id = Column(
        Integer,
        ForeignKey("api_keys.id"),
        nullable=True
    )

    cache_hit = Column(Boolean, default=False)

    request_id = Column(String, nullable=False)

    prompt = Column(Text, nullable=False)

    response = Column(Text, nullable=False)

    model_type = Column(String, nullable=False)

    input_tokens = Column(Integer)

    output_tokens = Column(Integer)

    total_tokens = Column(Integer)

    cost = Column(Float)

    latency = Column(Float)

    tokens_saved = Column(Integer, default=0)

    cost_saved = Column(Float, default=0.0)

    latency_saved = Column(Float, default=0.0)

    fallback_used = Column(Boolean, default=False)

    error = Column(Text, nullable=True)

    created_at = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now()
    )