import { apiRequest } from "@/api/client";
import type { DashboardStats } from "@/types/company";

export function getDashboardStats(): Promise<DashboardStats> {
  return apiRequest<DashboardStats>("/api/dashboard/stats");
}

export interface HealthStatus {
  status: string;
  database: "connected" | "unavailable";
}

export function getHealth(): Promise<HealthStatus> {
  return apiRequest<HealthStatus>("/api/health");
}
