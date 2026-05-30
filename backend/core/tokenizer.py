import tiktoken


encoding = tiktoken.encoding_for_model("gpt-4")


def count_tokens(text: str):

    tokens = encoding.encode(text)

    return len(tokens)