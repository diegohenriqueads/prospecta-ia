import { CRM_STATUS_LABELS, type CRMStatus } from "@/types/company";

const STATUS_CLASSES: Record<CRMStatus, string> = {
  novo: "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300",
  contatado: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  respondeu: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  reuniao: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  proposta: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  cliente: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  perdido: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

export function StatusBadge({ status }: { status: CRMStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      {CRM_STATUS_LABELS[status]}
    </span>
  );
}
