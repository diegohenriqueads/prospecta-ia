from functools import lru_cache

from app.ai.base import AIProvider
from app.config import get_settings


@lru_cache
def get_ai_provider() -> AIProvider:
    settings = get_settings()
    if settings.ai_provider == "openai":
        from app.ai.openai_provider import OpenAIProvider

        return OpenAIProvider()
    from app.ai.claude_provider import ClaudeProvider

    return ClaudeProvider()
