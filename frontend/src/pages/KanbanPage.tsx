import { useState, useEffect } from "react";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { listCompanies } from "@/api/companies";
import { ApiError } from "@/api/client";
import type { Company } from "@/types/company";

export function KanbanPage() {
  const [companies, setCompanies] = useState<Company[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listCompanies()
      .then((data) => {
        if (!cancelled) setCompanies(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.detail : "Erro ao carregar leads.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleCompanyUpdated(updated: Company) {
    setCompanies((prev) => prev?.map((c) => (c.id === updated.id ? updated : c)) ?? prev);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-800 dark:text-white">
          Kanban CRM
        </h1>
        <p className="mt-1 text-sm text-ink-400">
          Arraste os cards entre as colunas para atualizar o status — a mudança é salva automaticamente.
        </p>
      </div>

      {loading && (
        <div className="flex gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-96 w-72 shrink-0" />
          ))}
        </div>
      )}

      {!loading && error && (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      )}

      {!loading && !error && companies && (
        <KanbanBoard companies={companies} onCompanyUpdated={handleCompanyUpdated} />
      )}
    </div>
  );
}
