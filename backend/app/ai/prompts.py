def build_prompt(
    *,
    channel: str,
    company_name: str,
    segment: str,
    city: str,
    reasons: list[str],
    agency_name: str,
    agency_pitch: str,
) -> str:
    reasons_txt = "\n".join(f"- {r}" for r in reasons)
    canal_txt = "mensagem de WhatsApp" if channel == "whatsapp" else "e-mail"

    formato = (
        'Responda APENAS em JSON válido no formato {"message": "..."} '
        "(sem markdown, sem crases, sem texto extra)."
        if channel == "whatsapp"
        else 'Responda APENAS em JSON válido no formato {"subject": "...", "message": "..."} '
        "(sem markdown, sem crases, sem texto extra)."
    )

    return f"""Você é um SDR (pré-vendas) experiente da agência "{agency_name}", especializada em
{agency_pitch}.

Escreva uma {canal_txt} curta, personalizada e consultiva (não genérica, não robótica)
para prospectar a empresa "{company_name}", do segmento "{segment}", localizada em {city}.

Use como gancho os seguintes pontos identificados na presença digital da empresa:
{reasons_txt}

Regras:
- Tom humano, direto, sem exagero de emojis (no máximo 1 se for WhatsApp).
- Foque em UM problema/oportunidade específica, não liste tudo.
- Termine com uma pergunta simples de baixo atrito (ex: convite para conversa rápida).
- Nunca invente dados que você não recebeu sobre a empresa.
- {"Para WhatsApp, no máximo 60 palavras." if channel == "whatsapp" else "Para e-mail, no máximo 130 palavras no corpo, e um assunto curto e específico."}

{formato}
"""
