import { Link } from "react-router-dom";
import { Globe, GlobeLock } from "lucide-react";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Company } from "@/types/company";

export function CompanyTable({ companies }: { companies: Company[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-ink-100 dark:border-ink-800 bg-white dark:bg-ink-900">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-ink-100 dark:border-ink-800 text-xs uppercase tracking-wide text-ink-400">
            <th className="px-4 py-3 font-medium">Score</th>
            <th className="px-4 py-3 font-medium">Empresa</th>
            <th className="px-4 py-3 font-medium">Segmento</th>
            <th className="px-4 py-3 font-medium">Cidade</th>
            <th className="px-4 py-3 font-medium">Site</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
          {companies.map((company) => (
            <tr key={company.id} className="hover:bg-ink-50 dark:hover:bg-ink-800/60 transition-colors">
              <td className="px-4 py-3">
                <ScoreBadge score={company.opportunity_score} size="sm" />
              </td>
              <td className="px-4 py-3">
                <Link
                  to={`/empresas/${company.id}`}
                  className="font-medium text-ink-800 hover:text-accent-500 dark:text-ink-100 dark:hover:text-accent-400"
                >
                  {company.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-ink-500 dark:text-ink-400">{company.segment ?? "—"}</td>
              <td className="px-4 py-3 text-ink-500 dark:text-ink-400">{company.city ?? "—"}</td>
              <td className="px-4 py-3">
                {company.has_website ? (
                  <span className="inline-flex items-center gap-1 text-xs text-ink-400">
                    <Globe className="h-3.5 w-3.5" /> Tem site
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-opportunity-high">
                    <GlobeLock className="h-3.5 w-3.5" /> Sem site
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={company.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
