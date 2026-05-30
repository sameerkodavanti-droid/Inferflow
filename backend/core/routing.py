import re
from .config import MAX_FALLBACK_RATE
from .health import get_model_health


async def route_model(prompt: str):
    

    prompt_words = re.findall(
        r"\b\w+\b",
        prompt.lower()
    )

    coding_keywords = [
        "python",
        "javascript",
        "fastapi",
        "sql",
        "async"
    ]

    reasoning_keywords = [
        "why",
        "explain",
        "compare",
        "reason"
    ]

    if any(word in prompt_words for word in coding_keywords):

        target_type = "coding"

    elif any(word in prompt_words for word in reasoning_keywords):

        target_type = "reasoning"

    else:

        target_type = "simple"

    model_health = await get_model_health()

    matching_models = [
        model
        for model in model_health
        if model["model_type"] == target_type
    ]

    best_model = None

    best_score = float("inf")


    for model in matching_models:

        if model["fallback_rate"] > MAX_FALLBACK_RATE:
            continue
        latency = float(model["avg_latency"] or 0)
        fallback_rate = float(model["fallback_rate"] or 0)
        cost = float(model["avg_cost"] or 0)

        score = (
            latency * 0.4
            +
            fallback_rate * 0.5
            +
            cost * 0.1
        )

        if score < best_score:

            best_score = score

            best_model = model["model_type"]
        if not best_model:
            return "simple"

    return best_model