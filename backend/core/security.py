import secrets
import hashlib

import jwt
import os
from pwdlib import PasswordHash
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
EXP_TIME = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))



password_hash = PasswordHash.recommended()


def verify_password(plain_password, hashed_password):
    return password_hash.verify(
        plain_password,
        hashed_password
    )


def get_password_hash(password):
    return password_hash.hash(password)


def generate_api_key():

    return f"if_sk_{secrets.token_urlsafe(32)}"


def hash_api_key(api_key: str):

    return hashlib.sha256(
        api_key.encode()
    ).hexdigest()
