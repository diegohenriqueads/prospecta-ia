import json

from app.ai.base import AIProvider
from app.ai.prompts import build_prompt
from app.config import get_settings


class OpenAIProvider(AIProvider):
    def __init__(self):
        settings = get_settings()
        from openai import OpenAI

        self.client = OpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_model

    def generate_outreach_message(self, *, channel, company_name, segment, city,
                                   reasons, agency_name, agency_pitch) -> dict:
        prompt = build_prompt(
            channel=channel, company_name=company_name, segment=segment, city=city,
            reasons=reasons, agency_name=agency_name, agency_pitch=agency_pitch,
        )
        response = self.client.chat.completions.create(
            model=self.model,
            response_format={"type": "json_object"},
            messages=[{"role": "user", "content": prompt}],
        )
        return json.loads(response.choices[0].message.content)
