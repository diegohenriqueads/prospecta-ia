import json

from app.ai.base import AIProvider
from app.ai.prompts import build_prompt
from app.config import get_settings


class ClaudeProvider(AIProvider):
    def __init__(self):
        settings = get_settings()
        # Import tardio para não exigir a lib se o provider não for usado
        import anthropic

        self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        self.model = settings.anthropic_model

    def generate_outreach_message(self, *, channel, company_name, segment, city,
                                   reasons, agency_name, agency_pitch) -> dict:
        prompt = build_prompt(
            channel=channel, company_name=company_name, segment=segment, city=city,
            reasons=reasons, agency_name=agency_name, agency_pitch=agency_pitch,
        )
        response = self.client.messages.create(
            model=self.model,
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}],
        )
        text = "".join(block.text for block in response.content if block.type == "text")
        return json.loads(text)
