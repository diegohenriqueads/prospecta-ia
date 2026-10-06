import { Link } from "react-router-dom";
import { Globe, GlobeLock } from "lucide-react";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Company } from "@/types/company";

export function OpportunityList({ companies }: { companies: Company[] }) {
  if (companies.length === 0) {
    return (
      <EmptyState
        icon={Globe}
        title="Nenhuma oportunidade ainda"
        description="Busque empresas na tela de Prospecção para começar a ver as melhores oportunidades aqui."
      />
    );
  }

  return (
    <ul className="divide-y divide-ink-100 dark:divide-ink-800">
      {companies.map((company) => (
        <li key={company.id}>
          <Link
            to={`/empresas/${company.id}`}
            className="flex items-center gap-4 px-1 py-3 hover:bg-ink-50 dark:hover:bg-ink-800/60 rounded-lg transition-colors -mx-1"
          >
            <ScoreBadge score={company.opportunity_score} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink-800 dark:text-ink-100">
                {company.name}
              </p>
              <p className="truncate text-xs text-ink-400">
                {company.segment ?? "—"} · {company.city ?? "—"}
              </p>
            </div>
            {company.has_website ? (
              <Globe className="h-4 w-4 shrink-0 text-ink-300" aria-label="Possui site" />
            ) : (
              <GlobeLock className="h-4 w-4 shrink-0 text-opportunity-high" aria-label="Sem site" />
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
