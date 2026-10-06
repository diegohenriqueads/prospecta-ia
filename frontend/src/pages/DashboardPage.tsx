import { Building2, UserPlus, PhoneCall, FileText, Users, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { FunnelChart } from "@/components/dashboard/FunnelChart";
import { OpportunityList } from "@/components/dashboard/OpportunityList";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { useFetch } from "@/hooks/useFetch";
import { getDashboardStats } from "@/api/dashboard";
import { listCompanies } from "@/api/companies";

export function DashboardPage() {
  const stats = useFetch(getDashboardStats, []);
  const opportunities = useFetch(() => listCompanies({ min_score: 25 }), []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-800 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-ink-400">
          Visão geral da sua prospecção e do funil de vendas.
        </p>
      </div>

      {stats.loading && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {stats.error && <ErrorState message={stats.error} onRetry={stats.refetch} />}

      {stats.data && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <StatCard label="Empresas encontradas" value={String(stats.data.total_companies)} icon={Building2} />
          <StatCard label="Leads novos" value={String(stats.data.by_status.novo ?? 0)} icon={UserPlus} />
          <StatCard label="Contatados" value={String(stats.data.by_status.contatado ?? 0)} icon={PhoneCall} />
          <StatCard label="Propostas" value={String(stats.data.by_status.proposta ?? 0)} icon={FileText} />
          <StatCard label="Clientes" value={String(stats.data.by_status.cliente ?? 0)} icon={Users} accent />
          <StatCard
            label="Taxa de conversão"
            value={`${stats.data.conversion_rate.toFixed(1)}%`}
            icon={TrendingUp}
            accent
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <h2 className="font-display font-semibold text-ink-800 dark:text-ink-100">
            Funil de vendas
          </h2>
          <p className="mt-0.5 text-xs text-ink-400">Empresas por etapa do CRM</p>
          <div className="mt-4">
            {stats.loading && <Skeleton className="h-[280px] w-full" />}
            {stats.data && <FunnelChart stats={stats.data} />}
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h2 className="font-display font-semibold text-ink-800 dark:text-ink-100">
            Melhores oportunidades
          </h2>
          <p className="mt-0.5 text-xs text-ink-400">Maior score de oportunidade primeiro</p>
          <div className="mt-3">
            {opportunities.loading && (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            )}
            {opportunities.error && <ErrorState message={opportunities.error} onRetry={opportunities.refetch} />}
            {opportunities.data && <OpportunityList companies={opportunities.data.slice(0, 8)} />}
          </div>
        </Card>
      </div>
    </div>
  );
}
