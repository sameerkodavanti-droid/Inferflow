from db.session import Base
from sqlalchemy import (
    Column,
    UUID,
    String,
    Boolean,
    DateTime,
    Integer,
    ForeignKey
)

from sqlalchemy.sql import func




class PasswordResetOTP(Base):
    __tablename__ = "password_reset_otps"

    id = Column(UUID, primary_key=True)

    user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    otp_hash = Column(
        String,
        nullable=False
    )

    expires_at = Column(
        DateTime,
        nullable=False
    )

    attempts = Column(
        Integer,
        default=0
    )

    used = Column(
        Boolean,
        default=False,
        nullable=False
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )