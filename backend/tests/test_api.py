"""
Testes de integração do fluxo completo:
busca -> análise de site -> scoring -> geração de mensagem -> CRM.

As integrações externas reais (Google Places, PageSpeed, Claude/OpenAI)
são mockadas aqui de propósito: elas dependem de API keys configuradas em
produção (ver README) e não devem ser chamadas de verdade em testes
automatizados. Isso é comentado em cada teste que faz o mock.
"""
import uuid

import pytest

from app.models import Company, CRMStatus
from app.scoring import WebsiteAnalysis


def _make_company(db_session, **overrides) -> Company:
    defaults = dict(
        id=uuid.uuid4(),
        name="Padaria Pão Quente",
        segment="padaria",
        city="Curitiba",
        has_website=False,
        opportunity_score=0,
        status=CRMStatus.novo,
    )
    defaults.update(overrides)
    company = Company(**defaults)
    db_session.add(company)
    db_session.commit()
    db_session.refresh(company)
    return company


def test_health_check(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"


def test_search_sem_api_key_retorna_erro_explicito(client):
    """Sem GOOGLE_PLACES_API_KEY configurada, a busca NÃO deve inventar dados
    mockados: deve falhar de forma explícita (502) explicando o motivo."""
    resp = client.post("/api/companies/search", json={"city": "Curitiba", "segment": "padaria"})
    assert resp.status_code == 502
    assert "GOOGLE_PLACES_API_KEY" in resp.json()["detail"]


def test_search_com_dados_mockados_do_google_places(client, monkeypatch):
    """Mocka apenas a resposta da API externa (Google Places) -- não o
    restante da lógica -- para validar que a busca real, quando a chave
    existir, persiste corretamente as empresas encontradas."""

    async def fake_search(city, segment, limit=20):
        return [
            {
                "google_place_id": "place-123",
                "name": "Padaria Pão Quente",
                "address": "Rua das Flores, 100",
                "city": city,
                "segment": segment,
                "phone": "+55 41 99999-0000",
                "website_url": None,
                "has_website": False,
            }
        ]

    monkeypatch.setattr("app.routers.companies.search_companies", fake_search)

    resp = client.post("/api/companies/search", json={"city": "Curitiba", "segment": "padaria"})
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["results"]) == 1
    assert data["new_count"] == 1
    assert data["already_known_count"] == 0
    assert data["results"][0]["name"] == "Padaria Pão Quente"
    assert data["results"][0]["has_website"] is False
    # empresa sem site -> score alto de oportunidade, calculado de verdade (não mockado)
    assert data["results"][0]["opportunity_score"] >= 90
    assert data["results"][0]["status"] == "novo"

    # buscar de novo com o mesmo place_id não deve duplicar -- e o response
    # deve deixar isso explícito via already_known_count (é exatamente esse
    # comportamento que confundia quem via "os mesmos resultados de novo").
    resp2 = client.post("/api/companies/search", json={"city": "Curitiba", "segment": "padaria"})
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert len(data2["results"]) == 1
    assert data2["new_count"] == 0
    assert data2["already_known_count"] == 1

    resp3 = client.get("/api/companies")
    assert len(resp3.json()) == 1


def test_analyze_empresa_sem_site(client, db_session):
    company = _make_company(db_session, has_website=True, website_url=None)
    # has_website=True mas sem website_url -> tratado como "sem site" pela rota
    resp = client.post(f"/api/companies/{company.id}/analyze")
    assert resp.status_code == 200
    data = resp.json()
    assert data["opportunity_score"] == 92


def test_analyze_empresa_com_site_ruim(client, db_session, monkeypatch):
    """Mocka apenas a chamada de rede real (PageSpeed/scraping) — o cálculo
    de score em cima do resultado é real."""
    company = _make_company(
        db_session, has_website=True, website_url="http://siteantigo.com.br"
    )

    async def fake_analyze(url):
        return WebsiteAnalysis(
            has_website=True,
            has_https=False,
            is_mobile_friendly=False,
            performance_score=25,
            seo_score=15,
            load_time_ms=7000,
            issues=["Sem HTTPS", "Não responsivo"],
        )

    monkeypatch.setattr("app.routers.companies.analyze_website", fake_analyze)

    resp = client.post(f"/api/companies/{company.id}/analyze")
    assert resp.status_code == 200
    data = resp.json()
    assert data["has_https"] is False
    assert data["is_mobile_friendly"] is False
    assert data["opportunity_score"] >= 70  # site ruim -> alta oportunidade


def test_generate_message_sem_api_key_retorna_erro_explicito(client, db_session):
    """Sem ANTHROPIC_API_KEY/OPENAI_API_KEY configurada, a geração de
    mensagem NÃO deve inventar um texto: deve falhar de forma explícita."""
    company = _make_company(db_session, has_website=False, opportunity_score=92)
    resp = client.post(
        f"/api/companies/{company.id}/generate-message", json={"channel": "whatsapp"}
    )
    assert resp.status_code == 502
    assert "IA" in resp.json()["detail"] or "ia" in resp.json()["detail"].lower()


def test_generate_message_com_provider_mockado(client, db_session, monkeypatch):
    """Mocka apenas o provedor de IA (equivalente a ter uma API key real) —
    o restante do fluxo (persistência, resposta) é real."""
    company = _make_company(db_session, has_website=False, opportunity_score=92)

    class FakeProvider:
        def generate_outreach_message(self, **kwargs):
            assert kwargs["company_name"] == "Padaria Pão Quente"
            return {"message": "Olá! Notei que vocês ainda não têm site. Podemos conversar?"}

    monkeypatch.setattr("app.routers.companies.get_ai_provider", lambda: FakeProvider())

    resp = client.post(
        f"/api/companies/{company.id}/generate-message", json={"channel": "whatsapp"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "site" in data["whatsapp_message"].lower()


def test_fluxo_crm_completo_ponta_a_ponta(client, db_session, monkeypatch):
    """Simula o fluxo inteiro: busca -> análise -> score -> mensagem -> CRM,
    mockando apenas as 3 integrações externas (Places, análise de site, IA)."""

    async def fake_search(city, segment, limit=20):
        return [
            {
                "google_place_id": "place-999",
                "name": "Studio de Pilates Equilíbrio",
                "address": "Av. Central, 500",
                "city": city,
                "segment": segment,
                "phone": "+55 41 98888-1111",
                "website_url": "http://pilatesequilibrio.com.br",
                "has_website": True,
            }
        ]

    async def fake_analyze(url):
        return WebsiteAnalysis(
            has_website=True,
            has_https=False,
            is_mobile_friendly=False,
            performance_score=40,
            seo_score=30,
            load_time_ms=5000,
        )

    class FakeProvider:
        def generate_outreach_message(self, **kwargs):
            return {
                "subject": "Seu site pode estar afastando clientes",
                "message": "Olá, tudo bem? Percebi uma oportunidade de melhoria no site de vocês...",
            }

    monkeypatch.setattr("app.routers.companies.search_companies", fake_search)
    monkeypatch.setattr("app.routers.companies.analyze_website", fake_analyze)
    monkeypatch.setattr("app.routers.companies.get_ai_provider", lambda: FakeProvider())

    # 1. Busca
    resp = client.post("/api/companies/search", json={"city": "Curitiba", "segment": "pilates"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["new_count"] == 1
    company = body["results"][0]
    company_id = company["id"]
    assert company["has_website"] is True

    # 2. Análise de site + scoring
    resp = client.post(f"/api/companies/{company_id}/analyze")
    assert resp.status_code == 200
    analyzed = resp.json()
    assert analyzed["opportunity_score"] > 0

    # 3. Geração de mensagem (e-mail)
    resp = client.post(
        f"/api/companies/{company_id}/generate-message", json={"channel": "email"}
    )
    assert resp.status_code == 200
    with_message = resp.json()
    assert with_message["email_subject"]
    assert with_message["email_message"]

    # 4. Avança no funil do CRM
    resp = client.patch(
        f"/api/companies/{company_id}",
        json={"status": "contatado", "notes": "Respondeu no WhatsApp, agendou reunião"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "contatado"

    resp = client.patch(f"/api/companies/{company_id}", json={"status": "cliente"})
    assert resp.status_code == 200

    # 5. Dashboard reflete a conversão
    resp = client.get("/api/dashboard/stats")
    assert resp.status_code == 200
    stats = resp.json()
    assert stats["total_companies"] == 1
    assert stats["by_status"]["cliente"] == 1
    assert stats["conversion_rate"] == 100.0


def test_update_status_invalido_retorna_422(client, db_session):
    company = _make_company(db_session)
    resp = client.patch(f"/api/companies/{company.id}", json={"status": "nao_existe"})
    assert resp.status_code == 422


def test_delete_company(client, db_session):
    company = _make_company(db_session)
    resp = client.delete(f"/api/companies/{company.id}")
    assert resp.status_code == 204
    resp = client.get(f"/api/companies/{company.id}")
    assert resp.status_code == 404


def test_status_respondeu_disponivel_no_funil(client, db_session):
    """Coluna 'Respondeu' do Kanban precisa existir como status válido."""
    company = _make_company(db_session)
    resp = client.patch(f"/api/companies/{company.id}", json={"status": "respondeu"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "respondeu"

    resp = client.get("/api/dashboard/stats")
    assert "respondeu" in resp.json()["by_status"]


def test_analyze_retorna_motivos_e_problemas_estruturados(client, db_session, monkeypatch):
    """A tela de detalhe da empresa precisa dos motivos/problemas já
    estruturados em lista (não como uma string JSON crua)."""
    company = _make_company(db_session, has_website=True, website_url="http://site.com.br")

    async def fake_analyze(url):
        return WebsiteAnalysis(
            has_website=True,
            has_https=False,
            is_mobile_friendly=False,
            performance_score=20,
            seo_score=10,
            load_time_ms=6000,
            issues=["Sem HTTPS", "Sem meta description"],
        )

    monkeypatch.setattr("app.routers.companies.analyze_website", fake_analyze)

    resp = client.post(f"/api/companies/{company.id}/analyze")
    data = resp.json()
    assert isinstance(data["opportunity_reasons"], list)
    assert len(data["opportunity_reasons"]) > 0
    assert isinstance(data["site_issues"], list)
    assert "Sem HTTPS" in data["site_issues"]


def test_busca_por_nome_e_atualizacao_de_contato(client, db_session):
    _make_company(db_session, name="Padaria Pão Quente")
    _make_company(db_session, name="Studio de Yoga Zen", id=uuid.uuid4())

    resp = client.get("/api/companies", params={"q": "padaria"})
    assert resp.status_code == 200
    results = resp.json()
    assert len(results) == 1
    assert results[0]["name"] == "Padaria Pão Quente"

    company_id = results[0]["id"]
    resp = client.patch(
        f"/api/companies/{company_id}",
        json={"email": "contato@padaria.com.br", "phone": "+55 41 90000-0000"},
    )
    assert resp.status_code == 200
    updated = resp.json()
    assert updated["email"] == "contato@padaria.com.br"
    assert updated["phone"] == "+55 41 90000-0000"
