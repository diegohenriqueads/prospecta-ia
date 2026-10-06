from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import Base, engine, get_db
from app.routers import companies, dashboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    # MVP: cria as tabelas automaticamente. Em produção, prefira Alembic
    # (ver README > "Próximos passos").
    # Em testes, o banco é substituído via dependency_overrides e o schema
    # é criado pela fixture, então uma eventual falha de conexão aqui não
    # deve derrubar a aplicação.
    try:
        Base.metadata.create_all(bind=engine)
    except Exception:
        pass
    yield


settings = get_settings()

app = FastAPI(
    title="Prospecta IA",
    description="Mini CRM inteligente de prospecção para agências de software.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(companies.router)
app.include_router(dashboard.router)


@app.get("/api/health")
def health(db: Session = Depends(get_db)):
    """Health check da API + verificação real de conexão com o banco.

    Retorna 200 se a API e o banco estiverem OK, e 503 se o banco estiver
    inacessível (útil para healthcheck do Docker Compose e para
    orquestradores como Kubernetes/ECS).
    """
    try:
        db.execute(text("SELECT 1"))
        database_status = "connected"
    except Exception:
        database_status = "unavailable"

    status_code = 200 if database_status == "connected" else 503
    return JSONResponse(
        status_code=status_code,
        content={"status": "ok", "database": database_status},
    )
