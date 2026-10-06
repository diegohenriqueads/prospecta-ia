"""
Motor de score de oportunidade comercial.

Filosofia: quanto PIOR a presenca digital da empresa, MAIOR a oportunidade
de venda para a agencia (0 = sem oportunidade / site ja excelente,
100 = altissima oportunidade).

Implementacao: comecamos de 0 e SOMAMOS pontos a cada problema tecnico
encontrado (sem HTTPS, nao responsivo, performance ruim, SEO fraco...).
Uma empresa sem site nenhum recebe um score fixo alto (NO_WEBSITE_SCORE),
pois e a maior oportunidade possivel (projeto do zero).
"""
from dataclasses import dataclass, field


@dataclass
class WebsiteAnalysis:
    has_website: bool
    has_https: bool | None = None
    is_mobile_friendly: bool | None = None
    performance_score: int | None = None  # 0-100, do PageSpeed (maior = melhor)
    seo_score: int | None = None  # 0-100, heuristico (maior = melhor)
    load_time_ms: int | None = None
    issues: list[str] = field(default_factory=list)


NO_WEBSITE_SCORE = 92

_PESO_HTTPS = 20
_PESO_MOBILE = 20
_PESO_PERFORMANCE_RUIM = 25
_PESO_PERFORMANCE_MEDIA = 10
_PESO_LOAD_TIME = 10
_PESO_SEO_RUIM = 20
_PESO_SEO_MEDIO = 10


def calculate_opportunity_score(analysis: WebsiteAnalysis) -> tuple[int, list[str]]:
    """Retorna (score, lista_de_motivos) explicando a oportunidade.

    score = soma dos pontos de cada problema encontrado, limitado a 0-100.
    """
    reasons: list[str] = []

    if not analysis.has_website:
        reasons.append("Empresa nao possui site proprio")
        return NO_WEBSITE_SCORE, reasons

    score = 0

    if analysis.has_https is False:
        score += _PESO_HTTPS
        reasons.append("Site sem certificado HTTPS (inseguro)")

    if analysis.is_mobile_friendly is False:
        score += _PESO_MOBILE
        reasons.append("Site nao e responsivo / mobile-friendly")

    if analysis.performance_score is not None:
        if analysis.performance_score < 50:
            score += _PESO_PERFORMANCE_RUIM
            reasons.append("Performance de carregamento muito baixa")
        elif analysis.performance_score < 80:
            score += _PESO_PERFORMANCE_MEDIA
            reasons.append("Performance de carregamento mediana")

    if analysis.load_time_ms is not None and analysis.load_time_ms > 4000:
        score += _PESO_LOAD_TIME
        reasons.append("Tempo de carregamento acima de 4s")

    if analysis.seo_score is not None:
        if analysis.seo_score < 40:
            score += _PESO_SEO_RUIM
            reasons.append("SEO on-page muito fraco (titulo/meta description/H1)")
        elif analysis.seo_score < 70:
            score += _PESO_SEO_MEDIO
            reasons.append("SEO on-page pode melhorar")

    score = max(0, min(100, round(score)))
    if not reasons:
        reasons.append("Site ja apresenta boa qualidade tecnica")
    return score, reasons


def classify_score(score: int) -> str:
    """Classifica o score de oportunidade: 'alta' = muito propicio a venda."""
    if score >= 55:
        return "alta"
    if score >= 25:
        return "media"
    return "baixa"
