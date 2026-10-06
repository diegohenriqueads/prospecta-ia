"""
Testes do serviço de busca no Google Places, focados na paginação — que é
o que resolve buscas repetidas sempre trazendo os mesmos ~20 resultados.

httpx.AsyncClient é mockado (não fazemos chamadas reais à API do Google em
testes automatizados), mas a lógica de paginação/limite é exercitada de
verdade.
"""
import httpx
import pytest

from app.services import places_search


class FakeResponse:
    def __init__(self, payload: dict):
        self._payload = payload

    def raise_for_status(self):
        pass

    def json(self):
        return self._payload


class FakeAsyncClient:
    """Simula httpx.AsyncClient devolvendo páginas pré-definidas em sequência."""

    def __init__(self, pages: list[dict], details: dict | None = None):
        self.pages = pages
        self.details = details or {}
        self.calls: list[dict] = []

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    async def get(self, url, params=None):
        self.calls.append({"url": url, "params": params})
        if url == places_search.DETAILS_URL:
            return FakeResponse({"result": self.details})
        # Text Search: cada chamada consome a próxima página da lista
        page = self.pages.pop(0)
        return FakeResponse(page)


def _place(place_id: str) -> dict:
    return {"place_id": place_id, "name": f"Marcenaria {place_id}", "formatted_address": "Rua X"}


@pytest.mark.asyncio
async def test_pagina_automaticamente_ate_o_limite_pedido(monkeypatch):
    """Com limit=40 e páginas de 20, deve buscar 2 páginas (usando o
    next_page_token) em vez de parar nos primeiros 20 resultados sempre
    iguais."""
    page1 = {
        "status": "OK",
        "results": [_place(f"p{i}") for i in range(20)],
        "next_page_token": "TOKEN_PAGINA_2",
    }
    page2 = {
        "status": "OK",
        "results": [_place(f"p{i}") for i in range(20, 40)],
    }
    fake_client = FakeAsyncClient(pages=[page1, page2])

    monkeypatch.setattr(places_search.httpx, "AsyncClient", lambda **kw: fake_client)
    monkeypatch.setattr(places_search.asyncio, "sleep", _no_sleep)
    monkeypatch.setattr(
        places_search,
        "get_settings",
        lambda: _FakeSettings(google_places_api_key="fake-key"),
    )

    results = await places_search.search_companies("São Paulo", "marcenaria", limit=40)

    assert len(results) == 40
    # Confirma que os place_ids são todos diferentes (sem repetição entre páginas)
    assert len({r["google_place_id"] for r in results}) == 40


@pytest.mark.asyncio
async def test_limite_e_capado_em_60_pelo_limite_da_propria_api(monkeypatch):
    page1 = {"status": "OK", "results": [_place(f"p{i}") for i in range(20)], "next_page_token": "T2"}
    page2 = {"status": "OK", "results": [_place(f"p{i}") for i in range(20, 40)], "next_page_token": "T3"}
    page3 = {"status": "OK", "results": [_place(f"p{i}") for i in range(40, 60)]}
    fake_client = FakeAsyncClient(pages=[page1, page2, page3])

    monkeypatch.setattr(places_search.httpx, "AsyncClient", lambda **kw: fake_client)
    monkeypatch.setattr(places_search.asyncio, "sleep", _no_sleep)
    monkeypatch.setattr(
        places_search,
        "get_settings",
        lambda: _FakeSettings(google_places_api_key="fake-key"),
    )

    # Pede 200, mas a API do Google só permite 60 no total
    results = await places_search.search_companies("São Paulo", "marcenaria", limit=200)
    assert len(results) == 60


@pytest.mark.asyncio
async def test_status_de_erro_da_google_vira_excecao_clara(monkeypatch):
    page1 = {"status": "OVER_QUERY_LIMIT", "error_message": "cota excedida", "results": []}
    fake_client = FakeAsyncClient(pages=[page1])

    monkeypatch.setattr(places_search.httpx, "AsyncClient", lambda **kw: fake_client)
    monkeypatch.setattr(
        places_search,
        "get_settings",
        lambda: _FakeSettings(google_places_api_key="fake-key"),
    )

    with pytest.raises(RuntimeError, match="OVER_QUERY_LIMIT"):
        await places_search.search_companies("São Paulo", "marcenaria", limit=20)


async def _no_sleep(*args, **kwargs):
    return None


class _FakeSettings:
    def __init__(self, google_places_api_key: str):
        self.google_places_api_key = google_places_api_key
