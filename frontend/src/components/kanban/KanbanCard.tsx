import { Link } from "react-router-dom";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import type { Company } from "@/types/company";

interface KanbanCardProps {
  company: Company;
  onDragStart: (id: string) => void;
}

export function KanbanCard({ company, onDragStart }: KanbanCardProps) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(company.id)}
      className="cursor-grab rounded-lg border border-ink-100 dark:border-ink-800 bg-white dark:bg-ink-900 p-3 shadow-sm active:cursor-grabbing hover:border-accent-300 dark:hover:border-accent-500/40 transition-colors"
    >
      <div className="flex items-start gap-2.5">
        <ScoreBadge score={company.opportunity_score} size="sm" />
        <div className="min-w-0 flex-1">
          <Link
            to={`/empresas/${company.id}`}
            className="block truncate text-sm font-medium text-ink-800 hover:text-accent-500 dark:text-ink-100"
          >
            {company.name}
          </Link>
          <p className="truncate text-xs text-ink-400">{company.segment ?? "—"} · {company.city ?? "—"}</p>
        </div>
      </div>
    </div>
  );
}
