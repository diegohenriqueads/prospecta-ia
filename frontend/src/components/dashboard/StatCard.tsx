import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: boolean;
}

export function StatCard({ label, value, icon: Icon, accent }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink-400">{label}</span>
        <Icon className={`h-4 w-4 ${accent ? "text-accent-500" : "text-ink-300"}`} />
      </div>
      <p className="mt-3 font-mono text-3xl font-semibold tabular-nums text-ink-800 dark:text-white">
        {value}
      </p>
    </Card>
  );
}
