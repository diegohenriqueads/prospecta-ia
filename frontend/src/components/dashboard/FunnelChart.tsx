import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CRM_STATUS_LABELS, KANBAN_COLUMNS, type DashboardStats } from "@/types/company";

export function FunnelChart({ stats }: { stats: DashboardStats }) {
  const data = KANBAN_COLUMNS.map((status) => ({
    status: CRM_STATUS_LABELS[status],
    total: stats.by_status[status] ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-ink-100 dark:stroke-ink-800" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} className="fill-ink-400" />
        <YAxis
          type="category"
          dataKey="status"
          width={90}
          tick={{ fontSize: 12 }}
          className="fill-ink-500"
        />
        <Tooltip
          cursor={{ fill: "rgba(242, 88, 46, 0.06)" }}
          contentStyle={{
            borderRadius: 8,
            border: "1px solid rgb(231 235 239)",
            fontSize: 12,
          }}
        />
        <Bar dataKey="total" fill="#F2582E" radius={[0, 6, 6, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}
