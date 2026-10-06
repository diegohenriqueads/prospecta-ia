"""
Busca empresas usando a Google Places API (Text Search + Place Details).
Fonte pública e oficial, dentro dos Termos de Serviço do Google — não faz
scraping do Google Maps.

Requer GOOGLE_PLACES_API_KEY no .env. Sem a chave, retorna lista vazia
(a rota deixa isso explícito na resposta).

IMPORTANTE sobre variedade de resultados: a Text Search do Google não é uma
amostra aleatória — para a mesma query ela sempre retorna o mesmo ranking.
A API limita cada busca a no máximo 60 resultados no total (3 páginas de 20),
mesmo para cidades grandes com milhares de empresas do segmento. Este módulo
já pagina automaticamente até `limit` (capado em 60). Para obter empresas
diferentes das já vistas, refine a busca (bairro/região específica, termo
mais específico) em vez de repetir exatamente os mesmos termos.
"""
import asyncio

import httpx

from app.config import get_settings

TEXT_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json"
DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"

GOOGLE_MAX_RESULTS = 60  # limite rígido da própria API (3 páginas de 20)
# Delay entre páginas: o next_page_token do Google só fica válido depois de
# alguns segundos. É uma exigência documentada da própria API, não uma
# escolha nossa.
NEXT_PAGE_DELAY_SECONDS = 2.2


async def search_companies(city: str, segment: str, limit: int = 20) -> list[dict]:
    settings = get_settings()
    if not settings.google_places_api_key:
        return []

    limit = min(limit, GOOGLE_MAX_RESULTS)
    query = f"{segment} em {city}"
    raw_places: list[dict] = []

    async with httpx.AsyncClient(timeout=15) as client:
        params = {"query": query, "key": settings.google_places_api_key, "language": "pt-BR"}
        next_page_token: str | None = None

        while len(raw_places) < limit:
            if next_page_token:
                await asyncio.sleep(NEXT_PAGE_DELAY_SECONDS)
                page_params = {"pagetoken": next_page_token, "key": settings.google_places_api_key}
            else:
                page_params = params

            resp = await client.get(TEXT_SEARCH_URL, params=page_params)
            resp.raise_for_status()
            data = resp.json()

            status = data.get("status")
            if status not in ("OK", "ZERO_RESULTS"):
                # Ex: OVER_QUERY_LIMIT, REQUEST_DENIED, INVALID_REQUEST
                raise RuntimeError(f"Google Places retornou status '{status}': {data.get('error_message', '')}")

            raw_places.extend(data.get("results", []))
            next_page_token = data.get("next_page_token")
            if not next_page_token:
                break

        raw_places = raw_places[:limit]

        results: list[dict] = []
        for place in raw_places:
            place_id = place.get("place_id")
            details = await _get_details(client, place_id, settings.google_places_api_key)
            results.append(
                {
                    "google_place_id": place_id,
                    "name": place.get("name"),
                    "address": place.get("formatted_address"),
                    "city": city,
                    "segment": segment,
                    "phone": details.get("formatted_phone_number"),
                    "website_url": details.get("website"),
                    "has_website": bool(details.get("website")),
                }
            )
    return results


async def _get_details(client: httpx.AsyncClient, place_id: str, api_key: str) -> dict:
    if not place_id:
        return {}
    resp = await client.get(
        DETAILS_URL,
        params={
            "place_id": place_id,
            "fields": "website,formatted_phone_number",
            "key": api_key,
            "language": "pt-BR",
        },
    )
    resp.raise_for_status()
    return resp.json().get("result", {})
