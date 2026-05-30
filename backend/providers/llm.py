from openai import AsyncOpenAI

import os

from dotenv import load_dotenv

from core.exceptions import ProviderError



load_dotenv()


client = AsyncOpenAI(
    api_key=os.getenv("Groq"),
    base_url="https://api.groq.com/openai/v1"
)


MODELS = {
    "simple": "llama-3.1-8b-instant",

    "reasoning": "deepseek-r1-distill-llama-70b",

    "coding": "llama-3.3-70b-versatile"
}



async def generate_response(
    prompt: str,
    model_type: str
):

    try:

        response = await client.chat.completions.create(
            model=MODELS[model_type],

            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        return response.choices[0].message.content

    except Exception as e:

        print(e)

        raise ProviderError("llm failed")


async def generate_stream(
    prompt: str,
    model_type: str
):

    try:

        stream = await client.chat.completions.create(
            model=MODELS[model_type],

            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],

            stream=True
        )

        async for chunk in stream:

            content = chunk.choices[0].delta.content

            if content:
                yield content

    except Exception as e:

        print(e)

        raise ProviderError("Streaming failed")