import json
import uuid
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models import CRMStatus


class CompanySearchRequest(BaseModel):
    city: str
    segment: str
    limit: int = Field(default=20, ge=1, le=60)


class CompanyBase(BaseModel):
    name: str
    segment: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website_url: Optional[str] = None


class CompanyOut(CompanyBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    has_website: bool
    has_https: Optional[bool] = None
    is_mobile_friendly: Optional[bool] = None
    load_time_ms: Optional[int] = None
    performance_score: Optional[int] = None
    seo_score: Optional[int] = None
    opportunity_score: int
    status: CRMStatus
    notes: Optional[str] = None
    whatsapp_message: Optional[str] = None
    email_subject: Optional[str] = None
    email_message: Optional[str] = None
    analyzed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    # Derivados de `analysis_details` (JSON serializado no banco), expostos
    # de forma estruturada para o frontend não precisar fazer parsing.
    opportunity_reasons: list[str] = []
    site_issues: list[str] = []

    @model_validator(mode="before")
    @classmethod
    def _parse_analysis_details(cls, data: Any) -> Any:
        if isinstance(data, dict):
            details_raw = data.get("analysis_details")
        else:
            details_raw = getattr(data, "analysis_details", None)

        reasons: list[str] = []
        issues: list[str] = []
        if details_raw:
            try:
                parsed = json.loads(details_raw)
                reasons = parsed.get("reasons", [])
                issues = parsed.get("issues", [])
            except (ValueError, TypeError):
                pass

        if isinstance(data, dict):
            return {**data, "opportunity_reasons": reasons, "site_issues": issues}

        # Objeto ORM (SQLAlchemy) -> converte para dict antes de validar,
        # incluindo os campos derivados calculados acima.
        result = {c: getattr(data, c) for c in data.__table__.columns.keys()}
        result["opportunity_reasons"] = reasons
        result["site_issues"] = issues
        return result


class CompanySearchResponse(BaseModel):
    results: list[CompanyOut]
    new_count: int
    already_known_count: int


class CompanyUpdate(BaseModel):
    status: Optional[CRMStatus] = None
    notes: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


class MessageGenerateRequest(BaseModel):
    channel: str  # "whatsapp" ou "email"


class DashboardStats(BaseModel):
    total_companies: int
    total_opportunities: int  # score >= 70
    by_status: dict[str, int]
    conversion_rate: float  # clientes / (total - novo - perdido), em %
    avg_opportunity_score: float
