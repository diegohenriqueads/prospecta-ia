import { Search } from "lucide-react";
import { Input, Select } from "@/components/ui/Field";
import { CRM_STATUS_LABELS, KANBAN_COLUMNS, type CompanyListFilters } from "@/types/company";

interface CompanyFiltersProps {
  filters: CompanyListFilters;
  onChange: (filters: CompanyListFilters) => void;
}

export function CompanyFilters({ filters, onChange }: CompanyFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <Input
          placeholder="Buscar por nome da empresa..."
          className="pl-9"
          value={filters.q ?? ""}
          onChange={(e) => onChange({ ...filters, q: e.target.value || undefined })}
        />
      </div>

      <Select
        className="sm:w-44"
        value={filters.status ?? ""}
        onChange={(e) =>
          onChange({ ...filters, status: (e.target.value || undefined) as CompanyListFilters["status"] })
        }
      >
        <option value="">Todos os status</option>
        {KANBAN_COLUMNS.map((status) => (
          <option key={status} value={status}>
            {CRM_STATUS_LABELS[status]}
          </option>
        ))}
      </Select>

      <Input
        placeholder="Segmento"
        className="sm:w-40"
        value={filters.segment ?? ""}
        onChange={(e) => onChange({ ...filters, segment: e.target.value || undefined })}
      />

      <Select
        className="sm:w-48"
        value={String(filters.min_score ?? 0)}
        onChange={(e) => onChange({ ...filters, min_score: Number(e.target.value) })}
      >
        <option value="0">Qualquer score</option>
        <option value="25">Score ≥ 25 (média+)</option>
        <option value="55">Score ≥ 55 (alta oportunidade)</option>
      </Select>
    </div>
  );
}
