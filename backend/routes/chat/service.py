import time
import uuid
import json
import asyncio

from providers import llm

from core.routing import route_model
from core.tokenizer import count_tokens
from core.cost_calc import calculate_cost
from core.exceptions import ProviderError

from services.logger import log_request

from core.context import get_recent_conversation, get_recent_messages

import hashlib

from services.cache_service import (
    get_cached_response,
    set_cached_response,
    track_cache_savings
)

from services.chatsession import (
    save_message,
    create_session,
    save_user_memory,
    get_user_memory,
    delete_user_memory,
    extract_and_store_memory
    )


async def process_chat(
    request,
    db,
    user_id: int | None = None,
    api_key_id: int | None = None
):

    request_id = str(uuid.uuid4())

    fallback_used = False

    error = None
    
    if request.model_type:
        model_type = request.model_type
    else:
        model_type = await route_model(
            request.prompt
        )

    normalized_prompt = (
        request.prompt
        .strip()
        .lower()
    )

    cache_key = (
        f"{model_type}:{normalized_prompt}"
    )

    cache_start = time.time()

    cached_response = await get_cached_response(
        cache_key
    )

    if cached_response:

        latency = time.time() - cache_start

        # Calculate savings from cache hit
        tokens_saved = int(
            cached_response.get("total_tokens", 0)
        )
        cost_saved = float(
            cached_response.get("cost", 0)
        )
        latency_saved = float(
            cached_response.get("latency", 0)
        )

        # Track savings in Redis for real-time analytics
        await track_cache_savings(
            tokens_saved=tokens_saved,
            cost_saved=cost_saved,
            latency_saved=latency_saved
        )

        cached_response["cached"] = True

        cached_response["cost"] = 0

        cached_response["latency"] = round(
            latency,
            4
        )

        await log_request(

            db=db,

            request_id=request_id,

            user_id=user_id,

            prompt=request.prompt,

            response=cached_response["response"],

            model_type=model_type,

            input_tokens=0,

            output_tokens=0,

            total_tokens=0,

            cost=0,

            latency=latency,

            fallback_used=False,

            cache_hit=True,

            error=None,

            api_key_id=api_key_id,

            tokens_saved=tokens_saved,

            cost_saved=cost_saved,

            latency_saved=latency_saved
        )

        return cached_response
    SYSTEM_PROMPT = """
        You are a modern conversational AI assistant.

        Response style:
        - Be natural and human-like.
        - Keep responses concise unless detail is requested.
        - Avoid excessive markdown formatting.
        - Avoid too many bullet points.
        - Do not overuse bold text.
        - Prefer short paragraphs over large lists.
        - Only use markdown for code blocks.
        - Sound calm and confident, not overly enthusiastic.
        """

    final_prompt = f"""
        {SYSTEM_PROMPT}

        User: {request.prompt}

        Assistant:
        """

    start = time.time()

    try:

        response = await llm.generate_response(
            prompt=final_prompt,
            model_type=model_type
        )

    except ProviderError as e:

        fallback_used = True

        error = str(e)

        model_type = "simple"

        response = await llm.generate_response(
            prompt=final_prompt,
            model_type=model_type
        )

    latency = time.time() - start

    input_tokens = count_tokens(
        request.prompt
    )

    output_tokens = count_tokens(
        response
    )

    total_tokens = (
        input_tokens + output_tokens
    )

    cost = calculate_cost(
        model_type=model_type,
        input_tokens=input_tokens,
        output_tokens=output_tokens
    )

    response_payload = {

        "response": response,

        "model_type": model_type,

        "input_tokens": input_tokens,

        "output_tokens": output_tokens,

        "total_tokens": total_tokens,

        "cost": cost,

        "latency": round(latency, 4),

        "cached": False
    }

    await set_cached_response(
        cache_key,
        response_payload
    )

    await log_request(

        db=db,

        request_id=request_id,

        user_id=user_id,

        prompt=request.prompt,

        response=response,

        model_type=model_type,

        input_tokens=input_tokens,

        output_tokens=output_tokens,

        total_tokens=total_tokens,

        cost=cost,

        latency=latency,

        fallback_used=fallback_used,

        cache_hit=False,

        error=error,

        api_key_id=api_key_id,

        tokens_saved=0,

        cost_saved=0.0,

        latency_saved=0.0
    )

    return response_payload










async def process_chat_stream(
    prompt: str,
    model_type: str | None = None,
    user_id: int | None = None,
    session_id: int | None = None,
    db=None,
    api_key_id: int | None = None
):

    request_id = str(uuid.uuid4())

    fallback_used = False

    error = None

    full_response = ""

    if model_type:
        model_type = model_type
    else:
        model_type = await route_model(
            prompt
        )


    normalized_prompt = (
        prompt
        .strip()
        .lower()
    )
    if not session_id:
        session = await create_session(
            db=db,
            user_id=user_id,
            title=prompt[:30]
        )
        session_id = session.id
        yield f"data: {json.dumps({
            'session_id': session_id
        })}\n\n"
        
    conversation_history = await get_recent_messages(
        db=db,
        session_id=session_id,
        limit=5
    )
    

    SYSTEM_PROMPT = """
        You are a modern AI assistant.

        Style rules:
        - Keep responses concise and natural.
        - Avoid excessive markdown formatting.
        - Do not invent facts about names, history, or meanings.
        - If unsure, say you are unsure.
        - Stay consistent with previous answers.
        - Avoid too many bullet points.
        - Use bold text sparingly.
        - Keep responses conversational.
        - Only use markdown for code blocks when necessary.
        """

    conversation_history = conversation_history[-5:]
    memory_context = ""

    for msg in conversation_history:
        user_prompt = msg.content[:300]
        response = msg.content[:500]

        if msg.role == "user":
            memory_context += (
                f"User: {user_prompt}\n"
            )
        else:
            memory_context += (
                f"Assistant: {response}\n"
            )

    memory_hash = hashlib.md5(
        memory_context.encode()
    ).hexdigest()

    

    user_memories = await get_user_memory(
        db=db,
        user_id=user_id
    )

    persistent_context = ""

    for memory in user_memories:
        persistent_context += (
            f"The user's {memory.key} is {memory.value}.\n"
        )
    persistent_hash = hashlib.md5(
        persistent_context.encode()
    ).hexdigest()

    final_prompt = f"""
        {SYSTEM_PROMPT}

        Persistent user info:

        {persistent_context}

        Previous conversation:

        {memory_context}

        Current conversation:

        User: {prompt}

        Assistant:
        """


    cache_key = (
        f"{user_id}:{session_id}:{model_type}:"
        f"{memory_hash}:{persistent_hash}:{normalized_prompt}"
    )

    cache_start = time.time()

    cached_response = await get_cached_response(cache_key)
    if cached_response:

        latency = time.time() - cache_start

        text = cached_response["response"]

        # Calculate savings from cache hit
        tokens_saved = int(
            cached_response.get("total_tokens", 0)
        )
        cost_saved = float(
            cached_response.get("cost", 0)
        )
        latency_saved = float(
            cached_response.get("latency", 0)
        )

        # Track savings in Redis
        await track_cache_savings(
            tokens_saved=tokens_saved,
            cost_saved=cost_saved,
            latency_saved=latency_saved
        )

        for i in range(0, len(text), 20):
            chunk = text[i:i+20]

            yield f"data: {json.dumps({'text': chunk})}\n\n"

            await asyncio.sleep(0.03)  

        yield "data: [DONE]\n\n"


        await log_request(

            db=db,

            request_id=request_id,

            user_id=user_id,

            prompt=prompt,

            response=text,

            model_type=model_type,

            input_tokens=0,

            output_tokens=0,

            total_tokens=0,

            cost=0,

            latency=latency,

            fallback_used=False,

            cache_hit=True,

            error=None,

            api_key_id=api_key_id,

            tokens_saved=tokens_saved,

            cost_saved=cost_saved,

            latency_saved=latency_saved
        )
        await save_message(
            db=db,
            session_id=session_id,
            user_id=user_id,
            role="user",
            content=prompt
        )

        await save_message(
            db=db,
            session_id=session_id,
            user_id=user_id,
            role="assistant",
            content=text
        )

        return

    await save_message(
        db=db,
        user_id=user_id,
        role="user",
        session_id=session_id,
        content=prompt
    )
        

    start = time.time()

    try:
        # Get stream iterator with timeout failover capability
        stream_iter = llm.generate_stream(
            prompt=final_prompt,
            model_type=model_type
        ).__aiter__()

        while True:
            try:
                # Wait up to 5.0 seconds for the next chunk from the stream
                chunk = await asyncio.wait_for(stream_iter.__anext__(), timeout=5.0)
                full_response += chunk
                yield f"data: {json.dumps({'text': chunk})}\n\n"
                await asyncio.sleep(0.03)
            except StopAsyncIteration:
                break

    except Exception as e:
        print(f"Streaming error: {e}")
        fallback_used = True
        error = str(e)

        if model_type != "simple":
            try:
                model_type = "simple"
                stream_iter_fallback = llm.generate_stream(
                    prompt=final_prompt,
                    model_type=model_type
                ).__aiter__()

                while True:
                    try:
                        chunk = await asyncio.wait_for(stream_iter_fallback.__anext__(), timeout=5.0)
                        full_response += chunk
                        yield f"data: {json.dumps({'text': chunk})}\n\n"
                        await asyncio.sleep(0.03)
                    except StopAsyncIteration:
                        break

                yield "data: [DONE]\n\n"

            except Exception as fallback_err:
                print(
                    f"Fallback streaming error: {fallback_err}"
                )
                yield f"data: {json.dumps({'error': str(fallback_err)})}\n\n"
                return

    latency = time.time() - start

    input_tokens = count_tokens(
        final_prompt
    )

    output_tokens = count_tokens(
        full_response
    )

    total_tokens = (
        input_tokens + output_tokens
    )

    cost = calculate_cost(
        model_type=model_type,
        input_tokens=input_tokens,
        output_tokens=output_tokens
    )

    response_payload = {

    "response": full_response,

    "model_type": model_type,

    "input_tokens": input_tokens,

    "output_tokens": output_tokens,

    "total_tokens": total_tokens,

    "cost": cost,

    "latency": round(latency, 4),

    "cached": False
    }

    await set_cached_response(
        cache_key,
        response_payload
    )

    await save_message(
        db=db,
        user_id=user_id,
        role="assistant",
        session_id=session_id,
        content=full_response
    )
    await extract_and_store_memory(
    db=db,
    user_id=user_id,
    prompt=prompt,
    response=full_response
    )

    await log_request(

        db=db,

        request_id=request_id,

        user_id=user_id,

        prompt=prompt,

        response=full_response,

        model_type=model_type,

        input_tokens=input_tokens,

        output_tokens=output_tokens,

        total_tokens=total_tokens,

        cost=cost,

        latency=latency,

        fallback_used=fallback_used,

        cache_hit=False,

        error=error,

        api_key_id=api_key_id,

        tokens_saved=0,

        cost_saved=0.0,

        latency_saved=0.0
    )
    yield "data: [DONE]\n\n"
