// Espelha 1:1 os schemas Pydantic em backend/app/schemas.py e o enum
// CRMStatus em backend/app/models.py. Qualquer mudança no backend deve ser
// refletida aqui.

export type CRMStatus =
  | "novo"
  | "contatado"
  | "respondeu"
  | "reuniao"
  | "proposta"
  | "cliente"
  | "perdido";

export const CRM_STATUS_LABELS: Record<CRMStatus, string> = {
  novo: "Novo",
  contatado: "Contatado",
  respondeu: "Respondeu",
  reuniao: "Reunião",
  proposta: "Proposta",
  cliente: "Cliente",
  perdido: "Perdido",
};

// Ordem das colunas do Kanban
export const KANBAN_COLUMNS: CRMStatus[] = [
  "novo",
  "contatado",
  "respondeu",
  "reuniao",
  "proposta",
  "cliente",
  "perdido",
];

export interface Company {
  id: string;
  name: string;
  segment: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;

  has_website: boolean;
  has_https: boolean | null;
  is_mobile_friendly: boolean | null;
  load_time_ms: number | null;
  performance_score: number | null;
  seo_score: number | null;

  opportunity_score: number;
  opportunity_reasons: string[];
  site_issues: string[];

  status: CRMStatus;
  notes: string | null;
  whatsapp_message: string | null;
  email_subject: string | null;
  email_message: string | null;

  analyzed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanySearchRequest {
  city: string;
  segment: string;
  limit?: number;
}

export interface CompanySearchResponse {
  results: Company[];
  new_count: number;
  already_known_count: number;
}

export interface CompanyListFilters {
  status?: CRMStatus;
  city?: string;
  segment?: string;
  q?: string;
  min_score?: number;
}

export interface CompanyUpdatePayload {
  status?: CRMStatus;
  notes?: string;
  email?: string;
  phone?: string;
}

export type MessageChannel = "whatsapp" | "email";

export interface DashboardStats {
  total_companies: number;
  total_opportunities: number;
  by_status: Record<string, number>;
  conversion_rate: number;
  avg_opportunity_score: number;
}
