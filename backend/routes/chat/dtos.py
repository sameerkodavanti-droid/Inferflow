from pydantic import BaseModel


class ChatRequest(BaseModel):
    prompt: str
    model_type: str | None = None
    session_id: int | None = None



class ChatResponse(BaseModel):
    response: str
    model_type: str

    input_tokens: int
    output_tokens: int
    total_tokens: int

    cached: bool

    cost: float
    latency: float


class CreateSessionResponse(BaseModel):
    session_id: int
    title: str


class SessionResponse(BaseModel):
    id: int
    title: str


class RenameSessionRequest(BaseModel):
    title: str


class MessageResponse(BaseModel):
    id: int
    role: str
    content: str