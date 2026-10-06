import { apiRequest } from "@/api/client";
import type {
  Company,
  CompanyListFilters,
  CompanySearchRequest,
  CompanySearchResponse,
  CompanyUpdatePayload,
  MessageChannel,
} from "@/types/company";

export function searchCompanies(payload: CompanySearchRequest): Promise<CompanySearchResponse> {
  return apiRequest<CompanySearchResponse>("/api/companies/search", {
    method: "POST",
    body: payload,
  });
}

export function listCompanies(filters: CompanyListFilters = {}): Promise<Company[]> {
  return apiRequest<Company[]>("/api/companies", { params: { ...filters } });
}

export function getCompany(id: string): Promise<Company> {
  return apiRequest<Company>(`/api/companies/${id}`);
}

export function updateCompany(id: string, payload: CompanyUpdatePayload): Promise<Company> {
  return apiRequest<Company>(`/api/companies/${id}`, { method: "PATCH", body: payload });
}

export function deleteCompany(id: string): Promise<void> {
  return apiRequest<void>(`/api/companies/${id}`, { method: "DELETE" });
}

export function analyzeCompany(id: string): Promise<Company> {
  return apiRequest<Company>(`/api/companies/${id}/analyze`, { method: "POST" });
}

export function generateMessage(id: string, channel: MessageChannel): Promise<Company> {
  return apiRequest<Company>(`/api/companies/${id}/generate-message`, {
    method: "POST",
    body: { channel },
  });
}
