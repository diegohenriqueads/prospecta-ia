import { useMemo, useRef, useState } from "react";
import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import { updateCompany } from "@/api/companies";
import { ApiError } from "@/api/client";
import { useToast } from "@/context/ToastContext";
import { KANBAN_COLUMNS, type Company, type CRMStatus } from "@/types/company";

interface KanbanBoardProps {
  companies: Company[];
  onCompanyUpdated: (updated: Company) => void;
}

export function KanbanBoard({ companies, onCompanyUpdated }: KanbanBoardProps) {
  const { showToast } = useToast();
  const draggingId = useRef<string | null>(null);
  const [pending, setPending] = useState<Set<string>>(new Set());

  const grouped = useMemo(() => {
    const map: Record<CRMStatus, Company[]> = {
      novo: [],
      contatado: [],
      respondeu: [],
      reuniao: [],
      proposta: [],
      cliente: [],
      perdido: [],
    };
    for (const company of companies) {
      map[company.status].push(company);
    }
    return map;
  }, [companies]);

  async function handleDrop(newStatus: CRMStatus) {
    const id = draggingId.current;
    draggingId.current = null;
    if (!id) return;

    const company = companies.find((c) => c.id === id);
    if (!company || company.status === newStatus) return;

    setPending((prev) => new Set(prev).add(id));
    try {
      const updated = await updateCompany(id, { status: newStatus });
      onCompanyUpdated(updated);
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.detail : "Não foi possível mover o lead. Tente novamente.",
        "error"
      );
    } finally {
      setPending((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
      {KANBAN_COLUMNS.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          companies={grouped[status]}
          onDragStart={(id) => {
            draggingId.current = id;
          }}
          onDrop={handleDrop}
        />
      ))}
      {pending.size > 0 && (
        <span className="sr-only" role="status">
          Salvando alteração de status...
        </span>
      )}
    </div>
  );
}
