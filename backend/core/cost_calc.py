from core.pricing import MODEL_PRICING


def calculate_cost(
    model_type: str,
    input_tokens: int,
    output_tokens: int
):

    pricing =  MODEL_PRICING[model_type]

    input_cost = (
        input_tokens * pricing["input"]
    )

    output_cost = (
        output_tokens * pricing["output"]
    )

    return round(
        input_cost + output_cost,
        6
    )