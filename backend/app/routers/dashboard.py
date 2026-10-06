from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Company, CRMStatus
from app.schemas import DashboardStats

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
def stats(db: Session = Depends(get_db)):
    total = db.query(Company).count()
    opportunities = db.query(Company).filter(Company.opportunity_score >= 70).count()

    by_status = {s.value: 0 for s in CRMStatus}
    rows = db.query(Company.status, func.count(Company.id)).group_by(Company.status).all()
    for status_value, count in rows:
        by_status[status_value.value] = count

    clientes = by_status.get(CRMStatus.cliente.value, 0)
    perdidos = by_status.get(CRMStatus.perdido.value, 0)
    novos = by_status.get(CRMStatus.novo.value, 0)
    engajados = total - novos  # já tiveram algum contato (contatado, reunião, proposta, cliente, perdido)
    conversion_rate = round((clientes / engajados) * 100, 1) if engajados > 0 else 0.0

    avg_score = db.query(func.avg(Company.opportunity_score)).scalar() or 0

    return DashboardStats(
        total_companies=total,
        total_opportunities=opportunities,
        by_status=by_status,
        conversion_rate=conversion_rate,
        avg_opportunity_score=round(float(avg_score), 1),
    )
