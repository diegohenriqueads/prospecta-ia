import { useState } from "react";
import { Building2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { CompanyFilters } from "@/components/companies/CompanyFilters";
import { CompanyTable } from "@/components/companies/CompanyTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useFetch } from "@/hooks/useFetch";
import { listCompanies } from "@/api/companies";
import type { CompanyListFilters } from "@/types/company";

export function CompaniesPage() {
  const [filters, setFilters] = useState<CompanyListFilters>({});
  const { data, loading, error, refetch } = useFetch(
    () => listCompanies(filters),
    [filters.status, filters.city, filters.segment, filters.q, filters.min_score]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-800 dark:text-white">
          Empresas
        </h1>
        <p className="mt-1 text-sm text-ink-400">
          Todas as empresas já prospectadas, com filtros e ordenação por score.
        </p>
      </div>

      <Card className="p-4">
        <CompanyFilters filters={filters} onChange={setFilters} />
      </Card>

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {!loading && error && <ErrorState message={error} onRetry={refetch} />}

      {!loading && !error && data && data.length === 0 && (
        <EmptyState
          icon={Building2}
          title="Nenhuma empresa encontrada"
          description="Ajuste os filtros ou vá até a tela de Prospecção para buscar novas empresas."
        />
      )}

      {!loading && !error && data && data.length > 0 && (
        <>
          <p className="text-xs text-ink-400">
            {data.length} empresa{data.length === 1 ? "" : "s"} encontrada{data.length === 1 ? "" : "s"}
          </p>
          <CompanyTable companies={data} />
        </>
      )}
    </div>
  );
}
