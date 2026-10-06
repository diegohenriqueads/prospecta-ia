"""
Configuração central da aplicação.
Todas as chaves sensíveis vêm de variáveis de ambiente (.env) e NUNCA
devem ser expostas ao frontend.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Banco de dados
    database_url: str = "postgresql+psycopg2://prospecta:prospecta@db:5432/prospecta"

    # Busca de empresas (Google Places API - respeita os Termos de Serviço do Google)
    google_places_api_key: str = ""

    # Análise de sites (Google PageSpeed Insights API - fonte primária)
    google_pagespeed_api_key: str = ""

    # Provedor de IA para geração de mensagens: "claude" ou "openai"
    ai_provider: str = "claude"
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-6"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    # Agência (usado nos prompts de geração de mensagem)
    agency_name: str = "Sua Agência de Software"
    agency_pitch: str = (
        "desenvolvimento de sites, landing pages, sistemas web, apps, "
        "automações com IA, integrações com WhatsApp e chatbots"
    )

    # CORS
    frontend_origin: str = "http://localhost:5173"


@lru_cache
def get_settings() -> Settings:
    return Settings()
