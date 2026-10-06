"""
Analisa a qualidade técnica de um site.

Estratégia:
1. Tenta a Google PageSpeed Insights API (performance, SEO, acessibilidade,
   mobile) — fonte primária, mais confiável.
2. Se indisponível (sem API key, erro, timeout), cai para uma análise leve
   via requests + BeautifulSoup (HTTPS, viewport mobile, título, meta
   description, tempo de resposta) como fallback.
"""
import time

import httpx
from bs4 import BeautifulSoup

from app.config import get_settings
from app.scoring import WebsiteAnalysis

PAGESPEED_URL = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"


async def analyze_website(url: str) -> WebsiteAnalysis:
    settings = get_settings()

    if settings.google_pagespeed_api_key:
        try:
            return await _analyze_with_pagespeed(url, settings.google_pagespeed_api_key)
        except Exception:
            # Cai para o fallback silenciosamente; o erro não deve travar o fluxo.
            pass

    return await _analyze_with_fallback(url)


async def _analyze_with_pagespeed(url: str, api_key: str) -> WebsiteAnalysis:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            PAGESPEED_URL,
            params={
                "url": url,
                "key": api_key,
                "strategy": "mobile",
                "category": ["performance", "seo", "accessibility"],
            },
        )
        resp.raise_for_status()
        data = resp.json()

    lighthouse = data.get("lighthouseResult", {})
    categories = lighthouse.get("categories", {})
    audits = lighthouse.get("audits", {})

    performance_score = _pct(categories.get("performance"))
    seo_score = _pct(categories.get("seo"))

    viewport_audit = audits.get("viewport", {})
    is_mobile_friendly = viewport_audit.get("score") == 1

    load_time_ms = None
    fcp = audits.get("first-contentful-paint", {}).get("numericValue")
    if fcp is not None:
        load_time_ms = int(fcp)

    issues = []
    for audit_id in ("viewport", "document-title", "meta-description", "is-on-https"):
        audit = audits.get(audit_id, {})
        if audit.get("score") not in (1, None):
            issues.append(audit.get("title", audit_id))

    has_https = url.strip().lower().startswith("https://")

    return WebsiteAnalysis(
        has_website=True,
        has_https=has_https,
        is_mobile_friendly=is_mobile_friendly,
        performance_score=performance_score,
        seo_score=seo_score,
        load_time_ms=load_time_ms,
        issues=issues,
    )


def _pct(category: dict | None) -> int | None:
    if not category or category.get("score") is None:
        return None
    return round(category["score"] * 100)


async def _analyze_with_fallback(url: str) -> WebsiteAnalysis:
    has_https = url.strip().lower().startswith("https://")
    issues: list[str] = []

    try:
        start = time.monotonic()
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0 (ProspectaIA-Bot)"})
        load_time_ms = int((time.monotonic() - start) * 1000)
        resp.raise_for_status()
        html = resp.text
    except Exception:
        issues.append("Não foi possível acessar o site")
        return WebsiteAnalysis(
            has_website=True,
            has_https=has_https,
            is_mobile_friendly=None,
            performance_score=None,
            seo_score=20,
            load_time_ms=None,
            issues=issues,
        )

    soup = BeautifulSoup(html, "html.parser")

    viewport = soup.find("meta", attrs={"name": "viewport"})
    is_mobile_friendly = viewport is not None
    if not is_mobile_friendly:
        issues.append("Sem meta tag viewport (não responsivo)")

    title = soup.find("title")
    meta_desc = soup.find("meta", attrs={"name": "description"})
    h1 = soup.find("h1")

    seo_points = 0
    seo_total = 3
    if title and title.get_text(strip=True):
        seo_points += 1
    else:
        issues.append("Sem tag <title>")
    if meta_desc and meta_desc.get("content", "").strip():
        seo_points += 1
    else:
        issues.append("Sem meta description")
    if h1:
        seo_points += 1
    else:
        issues.append("Sem H1 na página")

    seo_score = round((seo_points / seo_total) * 100)

    if not has_https:
        issues.append("Site sem HTTPS")

    return WebsiteAnalysis(
        has_website=True,
        has_https=has_https,
        is_mobile_friendly=is_mobile_friendly,
        performance_score=None,
        seo_score=seo_score,
        load_time_ms=load_time_ms,
        issues=issues,
    )
