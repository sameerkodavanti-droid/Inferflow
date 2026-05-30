
from pydantic import BaseModel


class CreateAPIKeyRequest(BaseModel):

    name: str


class CreateAPIKeyResponse(BaseModel):

    api_key: str

class RevokeAPIKeyRequest(BaseModel):

    name: str
    