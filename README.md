# Prospecta IA

Mini CRM inteligente de prospecção para agências de desenvolvimento de software.
Busca empresas por cidade/segmento, analisa a qualidade técnica do site delas
(HTTPS, mobile-friendly, performance, SEO), calcula um **score de oportunidade
(0-100)**, gera mensagens de abordagem personalizadas com IA (WhatsApp/e-mail)
e organiza tudo em um funil de CRM (novo → contatado → respondeu → reunião →
proposta → cliente/perdido).

> **Status atual do projeto:** backend, banco de dados e frontend completos e
> validados de ponta a ponta. Ver [O que ainda falta](#o-que-ainda-falta)
> para os próximos passos (agente de vendas IA).

---

## Arquitetura

```
Frontend (React + TypeScript + Tailwind, servido via nginx)
        │  HTTP/JSON (VITE_API_URL)
        ▼
Backend (FastAPI, Python 3.12)
        │
        ├── Google Places API ──────► busca empresas por cidade/segmento
        ├── Google PageSpeed API ───► analisa performance/SEO do site
        │   (fallback: requests + BeautifulSoup, se a chave não existir)
        ├── Claude ou OpenAI ───────► gera mensagens de WhatsApp/e-mail
        │   (provider escolhido via variável de ambiente AI_PROVIDER)
        ▼
PostgreSQL 16 (persistência das empresas / status do CRM)
```

Todas as integrações externas (Google Places, PageSpeed, Claude/OpenAI) são
**opcionais na inicialização**: sem a respectiva API key, a funcionalidade
correspondente responde com um erro HTTP claro (nunca com dados inventados),
e o frontend exibe esse erro de forma legível.

---

## Stack

| Camada           | Tecnologia                                      |
|-------------------|--------------------------------------------------|
| Frontend            | React 18 + TypeScript + Vite + Tailwind CSS      |
| Backend             | FastAPI (Python 3.12), SQLAlchemy 2.0            |
| Banco de dados      | PostgreSQL 16                                    |
| IA (mensagens)      | Claude (Anthropic) **ou** OpenAI, via .env       |
| Busca de empresas   | Google Places API                                |
| Análise de sites    | Google PageSpeed Insights API + fallback local   |
| Gráficos            | Recharts                                         |
| Testes              | pytest + SQLite in-memory (isolado do Postgres)  |
| Containerização     | Docker + Docker Compose (3 serviços: db, backend, frontend) |

---

## Pré-requisitos

- Docker e Docker Compose (v2+) — **forma recomendada** de rodar o projeto.
- Alternativa sem Docker: Python 3.12+, Node.js 20+, e um PostgreSQL 16 acessível.

---

## Como rodar com Docker Compose (recomendado)

1. Copie o arquivo de variáveis de ambiente:

   ```bash
   cp .env.example .env
   ```

2. Abra o `.env` e preencha ao menos as chaves que você for usar agora
   (todas são opcionais para os serviços subirem; sem elas, as respectivas
   funcionalidades retornam erro claro em vez de dados falsos):

   - `GOOGLE_PLACES_API_KEY` — necessária para a tela de **Prospecção** (busca).
   - `GOOGLE_PAGESPEED_API_KEY` — opcional (há fallback local sem ela).
   - `AI_PROVIDER` (`claude` ou `openai`) + a respectiva `ANTHROPIC_API_KEY`
     ou `OPENAI_API_KEY` — necessárias para o botão "Gerar mensagem".

   As credenciais de banco já vêm com um valor padrão de desenvolvimento.

   > ⚠️ **Importante sobre `VITE_API_URL`**: essa variável é embutida no
   > bundle estático do frontend **no momento do build** (variáveis Vite são
   > compile-time, não runtime). O valor padrão (`http://localhost:8000`)
   > funciona para rodar tudo na sua própria máquina. Se você alterar essa
   > variável depois de já ter feito o build, precisa rodar
   > `docker compose up --build frontend` novamente para o novo valor ter efeito.

3. Suba os serviços:

   ```bash
   docker compose up --build
   ```

4. Acesse:

   - **Frontend**: http://localhost:5173
   - **API**: http://localhost:8000 (health check em `/api/health`)
   - **Documentação interativa (Swagger)**: http://localhost:8000/docs

Os dados do PostgreSQL ficam persistidos no volume Docker
`prospecta_postgres_data` — sobrevivem a `docker compose down` (mas não a
`docker compose down -v`, que remove os volumes).

### Parar os serviços

```bash
docker compose down          # mantém os dados
docker compose down -v       # remove também os dados do Postgres
```

---

## Como rodar sem Docker (desenvolvimento local)

### Backend

1. Tenha um PostgreSQL 16 rodando localmente e crie o banco:

   ```sql
   CREATE USER prospecta WITH PASSWORD 'prospecta';
   CREATE DATABASE prospecta OWNER prospecta;
   ```

2. Configure o `.env` (copiado de `.env.example`) com:

   ```
   DATABASE_URL=postgresql+psycopg2://prospecta:prospecta@localhost:5432/prospecta
   ```

   (note o host `localhost` em vez de `db`, que só existe dentro da rede do
   Docker Compose).

3. Instale as dependências e suba a API:

   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

As tabelas são criadas automaticamente na primeira inicialização
(`Base.metadata.create_all`). Isso é adequado para o estágio atual (MVP) —
ver nota sobre Alembic em [O que ainda falta](#o-que-ainda-falta). **Se você
alterar `app/models.py`** (novo campo, novo valor de enum), o
`create_all` **não altera tabelas existentes**: em ambiente de
desenvolvimento, apague a tabela/volume e deixe a aplicação recriar o schema
do zero.

### Frontend

```bash
cd frontend
cp .env.example .env    # ajuste VITE_API_URL se necessário
npm install
npm run dev
```

Acesse http://localhost:5173.

---

## Testes automatizados (backend)

```bash
cd backend
pip install -r requirements.txt
pytest -v
```

- **18 testes** cobrindo: motor de score, CRUD de empresas, CRM (status/notas/contato),
  dashboard/conversão, health check, e o **fluxo ponta a ponta completo**
  (busca → análise → score → geração de mensagem → CRM → dashboard).
- Os testes rodam contra **SQLite em memória** (isolado do Postgres de
  desenvolvimento/produção) e **mockam apenas as chamadas de rede externas**
  (Google Places, PageSpeed, Claude/OpenAI) — toda a lógica de negócio
  (scoring, persistência, regras do CRM) é exercitada de verdade.
- Não é necessário Docker nem PostgreSQL rodando para executar os testes.

## Validação do frontend

```bash
cd frontend
npm install
npm run typecheck   # tsc --noEmit
npm run build        # tsc -b && vite build
```

---

## Endpoints principais

| Método | Rota                                        | Descrição                                        |
|--------|----------------------------------------------|---------------------------------------------------|
| GET    | `/api/health`                                 | Health check da API + conexão com o banco          |
| POST   | `/api/companies/search`                       | Busca empresas por cidade/segmento (Google Places) |
| GET    | `/api/companies`                              | Lista empresas (filtros: `status`, `city`, `segment`, `q`, `min_score`) |
| GET    | `/api/companies/{id}`                         | Detalhe de uma empresa                             |
| PATCH  | `/api/companies/{id}`                         | Atualiza status/notas/e-mail/telefone no CRM       |
| DELETE | `/api/companies/{id}`                         | Remove uma empresa                                 |
| POST   | `/api/companies/{id}/analyze`                 | Analisa o site e recalcula o score de oportunidade |
| POST   | `/api/companies/{id}/generate-message`        | Gera mensagem de WhatsApp ou e-mail com IA         |
| GET    | `/api/dashboard/stats`                        | Estatísticas: oportunidades, funil, taxa de conversão |

Documentação completa e interativa em `/docs` (Swagger UI).

---

## Variáveis de ambiente

Ver `.env.example` (raiz) para o backend + Docker Compose, e
`frontend/.env.example` para o frontend. Nenhuma API key real está incluída
no repositório — os arquivos `.env` reais estão no `.gitignore`.

---

## Estrutura de pastas

```
prospecta-ia/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── requirements.txt
│   ├── pytest.ini
│   ├── app/
│   │   ├── main.py               # app FastAPI, CORS, health check
│   │   ├── config.py             # settings via .env (pydantic-settings)
│   │   ├── database.py           # engine/sessão SQLAlchemy
│   │   ├── models.py             # modelo Company + enum CRMStatus
│   │   ├── schemas.py            # schemas Pydantic (request/response)
│   │   ├── scoring.py            # motor de score de oportunidade (0-100)
│   │   ├── ai/
│   │   │   ├── base.py           # interface AIProvider
│   │   │   ├── factory.py        # escolhe o provider via AI_PROVIDER
│   │   │   ├── claude_provider.py
│   │   │   ├── openai_provider.py
│   │   │   └── prompts.py
│   │   ├── services/
│   │   │   ├── places_search.py      # Google Places API
│   │   │   └── website_analyzer.py   # PageSpeed API + fallback BS4
│   │   └── routers/
│   │       ├── companies.py
│   │       └── dashboard.py
│   └── tests/
│       ├── conftest.py            # fixtures (SQLite in-memory + StaticPool)
│       ├── test_scoring.py
│       └── test_api.py
└── frontend/
    ├── Dockerfile                 # build multi-stage + nginx
    ├── nginx.conf                 # serve a SPA (fallback para index.html)
    ├── .dockerignore
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── tsconfig.json / tsconfig.node.json
    ├── index.html
    ├── .env.example
    └── src/
        ├── main.tsx / App.tsx / index.css
        ├── types/company.ts       # tipos espelhando os schemas do backend
        ├── api/
        │   ├── client.ts          # camada HTTP centralizada (única fonte da URL base)
        │   ├── companies.ts
        │   └── dashboard.ts
        ├── context/               # ThemeContext (dark mode), ToastContext
        ├── hooks/useFetch.ts
        ├── components/
        │   ├── layout/            # Sidebar, Layout, ThemeToggle
        │   ├── ui/                # Button, Card, ScoreBadge, StatusBadge,
        │   │                      # Skeleton, EmptyState, ErrorState, ConfirmDialog, Field
        │   ├── companies/         # CompanyTable, CompanyFilters, ProspectResultCard
        │   ├── kanban/            # KanbanBoard, KanbanColumn, KanbanCard
        │   └── dashboard/         # StatCard, FunnelChart, OpportunityList
        └── pages/
            ├── DashboardPage.tsx
            ├── ProspectingPage.tsx
            ├── CompaniesPage.tsx
            ├── KanbanPage.tsx
            └── CompanyDetailPage.tsx
```

---

## Decisões técnicas relevantes

- **Score de oportunidade**: começa em 0 e soma pontos por problema técnico
  encontrado (sem HTTPS, não responsivo, performance/SEO ruins). Empresa sem
  site recebe um score fixo alto (92), pois representa a maior oportunidade
  possível. Ver `app/scoring.py`.
- **Camada de IA plugável**: `AIProvider` é uma interface abstrata; o restante
  do backend nunca importa `anthropic` ou `openai` diretamente, apenas
  `get_ai_provider()`. Trocar de provedor é uma mudança de uma variável de
  ambiente (`AI_PROVIDER`).
- **Análise de site resiliente**: tenta PageSpeed Insights primeiro; se a
  chave não estiver configurada ou a chamada falhar, cai automaticamente para
  uma análise local via `requests` + `BeautifulSoup`.
- **Sem dados inventados**: toda funcionalidade que depende de uma API
  externa retorna um erro HTTP explícito (502, com mensagem clara) quando a
  credencial não está configurada — nunca preenche com valores fictícios. O
  frontend propaga essa mensagem de erro tal como veio da API.
- **Camada de API centralizada no frontend**: nenhum componente chama `fetch`
  diretamente ou hardcoda uma URL; tudo passa por `src/api/*`, que lê
  `VITE_API_URL`.
- **Kanban com persistência real**: arrastar um card entre colunas dispara um
  `PATCH /api/companies/{id}` de verdade; não há estado "fake" no frontend
  que não seja refletido no backend.

---

## O que ainda falta

1. **Alembic**: substituir `Base.metadata.create_all` por migrações
   versionadas — necessário antes de qualquer alteração de schema em produção
   (hoje, mudar `models.py` exige recriar o banco em dev).
2. **Agente de vendas IA**: camada que lê as empresas já cadastradas,
   prioriza automaticamente por score + segmento, e sugere/gera propostas
   personalizadas — construído em cima da API já existente.
3. Code-splitting do bundle do frontend (hoje ~591kB minificado, majoritariamente
   por causa do Recharts) — otimização, não bloqueante.
4. Autenticação/multiusuário (hoje é single-tenant, sem login).
