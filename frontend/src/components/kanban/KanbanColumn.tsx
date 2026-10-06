import { useState, type DragEvent } from "react";
import clsx from "clsx";
import { KanbanCard } from "@/components/kanban/KanbanCard";
import { CRM_STATUS_LABELS, type Company, type CRMStatus } from "@/types/company";

interface KanbanColumnProps {
  status: CRMStatus;
  companies: Company[];
  onDragStart: (id: string) => void;
  onDrop: (status: CRMStatus) => void;
}

export function KanbanColumn({ status, companies, onDragStart, onDrop }: KanbanColumnProps) {
  const [isOver, setIsOver] = useState(false);

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    setIsOver(true);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setIsOver(false);
    onDrop(status);
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={() => setIsOver(false)}
      onDrop={handleDrop}
      className={clsx(
        "flex w-72 shrink-0 flex-col rounded-xl border bg-ink-100/60 dark:bg-ink-900/60 transition-colors",
        isOver ? "border-accent-400 bg-accent-50 dark:bg-accent-500/5" : "border-ink-100 dark:border-ink-800"
      )}
    >
      <div className="flex items-center justify-between px-3 py-3">
        <h3 className="text-sm font-semibold text-ink-700 dark:text-ink-100">
          {CRM_STATUS_LABELS[status]}
        </h3>
        <span className="rounded-full bg-white dark:bg-ink-800 px-2 py-0.5 text-xs font-medium text-ink-400">
          {companies.length}
        </span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto scrollbar-thin px-2.5 pb-3" style={{ maxHeight: "calc(100vh - 220px)" }}>
        {companies.map((company) => (
          <KanbanCard key={company.id} company={company} onDragStart={onDragStart} />
        ))}
        {companies.length === 0 && (
          <p className="px-1 py-6 text-center text-xs text-ink-300">Arraste um lead para cá</p>
        )}
      </div>
    </div>
  );
}
