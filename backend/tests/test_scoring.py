from app.scoring import WebsiteAnalysis, calculate_opportunity_score, classify_score


def test_empresa_sem_site_tem_score_alto():
    analysis = WebsiteAnalysis(has_website=False)
    score, reasons = calculate_opportunity_score(analysis)
    assert score >= 90
    assert "nao possui site" in reasons[0].lower()


def test_site_perfeito_tem_score_baixo():
    """Site sem nenhum problema tecnico = baixa oportunidade de venda."""
    analysis = WebsiteAnalysis(
        has_website=True,
        has_https=True,
        is_mobile_friendly=True,
        performance_score=95,
        seo_score=90,
        load_time_ms=1200,
    )
    score, reasons = calculate_opportunity_score(analysis)
    assert score == 0
    assert classify_score(score) == "baixa"


def test_site_ruim_tem_score_alto():
    analysis = WebsiteAnalysis(
        has_website=True,
        has_https=False,
        is_mobile_friendly=False,
        performance_score=30,
        seo_score=20,
        load_time_ms=6000,
    )
    score, reasons = calculate_opportunity_score(analysis)
    assert score >= 70
    assert len(reasons) >= 3
    assert classify_score(score) == "alta"


def test_score_nunca_ultrapassa_100():
    analysis = WebsiteAnalysis(
        has_website=True,
        has_https=False,
        is_mobile_friendly=False,
        performance_score=0,
        seo_score=0,
        load_time_ms=10000,
    )
    score, _ = calculate_opportunity_score(analysis)
    assert 0 <= score <= 100


def test_classify_score_faixas():
    assert classify_score(80) == "alta"
    assert classify_score(40) == "media"
    assert classify_score(10) == "baixa"
