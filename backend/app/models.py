import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class CRMStatus(str, enum.Enum):
    novo = "novo"
    contatado = "contatado"
    respondeu = "respondeu"
    reuniao = "reuniao"
    proposta = "proposta"
    cliente = "cliente"
    perdido = "perdido"


class Company(Base):
    __tablename__ = "companies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Identificação / origem
    name = Column(String, nullable=False, index=True)
    segment = Column(String, index=True)
    city = Column(String, index=True)
    state = Column(String)
    address = Column(String)
    phone = Column(String)
    email = Column(String, nullable=True)  # não vem do Google Places; editável manualmente no CRM
    google_place_id = Column(String, unique=True, nullable=True, index=True)
    source = Column(String, default="google_places")

    # Presença digital
    website_url = Column(String, nullable=True)
    has_website = Column(Boolean, default=False)
    has_https = Column(Boolean, nullable=True)
    is_mobile_friendly = Column(Boolean, nullable=True)
    load_time_ms = Column(Integer, nullable=True)
    performance_score = Column(Integer, nullable=True)  # 0-100 (PageSpeed)
    seo_score = Column(Integer, nullable=True)  # 0-100 (heurístico)
    analysis_details = Column(Text, nullable=True)  # JSON serializado com achados
    analyzed_at = Column(DateTime, nullable=True)

    # Score de oportunidade para a agência (0-100, quanto maior, melhor lead)
    opportunity_score = Column(Integer, default=0, index=True)

    # CRM
    status = Column(Enum(CRMStatus), default=CRMStatus.novo, index=True)
    notes = Column(Text, nullable=True)
    whatsapp_message = Column(Text, nullable=True)
    email_subject = Column(String, nullable=True)
    email_message = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
