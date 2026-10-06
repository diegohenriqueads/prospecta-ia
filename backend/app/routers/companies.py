import json
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.ai.factory import get_ai_provider
from app.config import get_settings
from app.database import get_db
from app.models import Company, CRMStatus
from app.schemas import (
    CompanyOut,
    CompanySearchRequest,
    CompanySearchResponse,
    CompanyUpdate,
    MessageGenerateRequest,
)
from app.scoring import WebsiteAnalysis, calculate_opportunity_score
from app.services.places_search import search_companies
from app.services.website_analyzer import analyze_website

router = APIRouter(prefix="/api/companies", tags=["companies"])


@router.post("/search", response_model=CompanySearchResponse)
async def search(payload: CompanySearchRequest, db: Session = Depends(get_db)):
    """Busca empresas via Google Places, salva as novas no banco (evitando
    duplicadas) e calcula um score inicial (empresas sem site já pontuam alto).

    Empresas que já existem no CRM (mesmo google_place_id) são retornadas
    como já estão salvas — não são duplicadas nem sobrescritas. Isso é
    intencional: se você já prospectou uma marcenaria antes, buscar de novo
    não deve apagar o status/notas que você já registrou para ela. O response
    informa quantos resultados eram novos e quantos já eram conhecidos, para
    deixar esse comportamento visível (e não parecer que a busca "travou").
    """
    try:
        found = await search_companies(payload.city, payload.segment, payload.limit)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=f"Erro na Google Places API: {exc}")

    if not found:
        raise HTTPException(
            status_code=502,
            detail=(
                "Nenhum resultado. Verifique se GOOGLE_PLACES_API_KEY está configurada "
                "no .env, ou tente outra cidade/segmento/bairro mais específico."
            ),
        )

    saved: list[Company] = []
    new_count = 0
    already_known_count = 0
    for item in found:
        existing = None
        if item.get("google_place_id"):
            existing = (
                db.query(Company)
                .filter(Company.google_place_id == item["google_place_id"])
                .first()
            )
        if existing:
            saved.append(existing)
            already_known_count += 1
            continue

        analysis = WebsiteAnalysis(has_website=item["has_website"])
        score, reasons = calculate_opportunity_score(analysis)

        company = Company(
            id=uuid.uuid4(),
            name=item["name"],
            segment=item["segment"],
            city=item["city"],
            address=item.get("address"),
            phone=item.get("phone"),
            google_place_id=item.get("google_place_id"),
            website_url=item.get("website_url"),
            has_website=item["has_website"],
            opportunity_score=score,
            analysis_details=json.dumps({"reasons": reasons}),
            status=CRMStatus.novo,
        )
        db.add(company)
        saved.append(company)
        new_count += 1

    db.commit()
    for c in saved:
        db.refresh(c)
    return CompanySearchResponse(
        results=saved,
        new_count=new_count,
        already_known_count=already_known_count,
    )


@router.get("", response_model=list[CompanyOut])
def list_companies(
    status: CRMStatus | None = None,
    city: str | None = None,
    segment: str | None = None,
    q: str | None = Query(default=None, description="Busca por nome da empresa"),
    min_score: int = 0,
    db: Session = Depends(get_db),
):
    query = db.query(Company)
    if status:
        query = query.filter(Company.status == status)
    if city:
        query = query.filter(Company.city.ilike(f"%{city}%"))
    if segment:
        query = query.filter(Company.segment.ilike(f"%{segment}%"))
    if q:
        query = query.filter(Company.name.ilike(f"%{q}%"))
    query = query.filter(Company.opportunity_score >= min_score)
    return query.order_by(Company.opportunity_score.desc()).all()


@router.get("/{company_id}", response_model=CompanyOut)
def get_company(company_id: uuid.UUID, db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    return company


@router.patch("/{company_id}", response_model=CompanyOut)
def update_company(company_id: uuid.UUID, payload: CompanyUpdate, db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    if payload.status is not None:
        company.status = payload.status
    if payload.notes is not None:
        company.notes = payload.notes
    if payload.email is not None:
        company.email = payload.email
    if payload.phone is not None:
        company.phone = payload.phone
    db.commit()
    db.refresh(company)
    return company


@router.delete("/{company_id}", status_code=204)
def delete_company(company_id: uuid.UUID, db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    db.delete(company)
    db.commit()


@router.post("/{company_id}/analyze", response_model=CompanyOut)
async def analyze(company_id: uuid.UUID, db: Session = Depends(get_db)):
    from datetime import datetime

    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")

    if not company.has_website or not company.website_url:
        analysis = WebsiteAnalysis(has_website=False)
    else:
        analysis = await analyze_website(company.website_url)

    score, reasons = calculate_opportunity_score(analysis)

    company.has_https = analysis.has_https
    company.is_mobile_friendly = analysis.is_mobile_friendly
    company.performance_score = analysis.performance_score
    company.seo_score = analysis.seo_score
    company.load_time_ms = analysis.load_time_ms
    company.opportunity_score = score
    company.analysis_details = json.dumps({"reasons": reasons, "issues": analysis.issues})
    company.analyzed_at = datetime.utcnow()

    db.commit()
    db.refresh(company)
    return company


@router.post("/{company_id}/generate-message", response_model=CompanyOut)
def generate_message(
    company_id: uuid.UUID, payload: MessageGenerateRequest, db: Session = Depends(get_db)
):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")

    settings = get_settings()
    details = json.loads(company.analysis_details) if company.analysis_details else {}
    reasons = details.get("reasons", ["Presença digital pode ser melhorada"])

    provider = get_ai_provider()
    try:
        result = provider.generate_outreach_message(
            channel=payload.channel,
            company_name=company.name,
            segment=company.segment or "",
            city=company.city or "",
            reasons=reasons,
            agency_name=settings.agency_name,
            agency_pitch=settings.agency_pitch,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Falha ao gerar mensagem com IA: {exc}")

    if payload.channel == "whatsapp":
        company.whatsapp_message = result.get("message")
    else:
        company.email_subject = result.get("subject")
        company.email_message = result.get("message")

    db.commit()
    db.refresh(company)
    return company
