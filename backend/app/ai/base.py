from abc import ABC, abstractmethod
from typing import Literal

Channel = Literal["whatsapp", "email"]


class AIProvider(ABC):
    """Interface que qualquer provedor de IA (Claude, OpenAI, ...) deve implementar."""

    @abstractmethod
    def generate_outreach_message(
        self,
        *,
        channel: Channel,
        company_name: str,
        segment: str,
        city: str,
        reasons: list[str],
        agency_name: str,
        agency_pitch: str,
    ) -> dict:
        """
        Retorna um dict:
          - {"message": str}                       para whatsapp
          - {"subject": str, "message": str}        para email
        """
        raise NotImplementedError
