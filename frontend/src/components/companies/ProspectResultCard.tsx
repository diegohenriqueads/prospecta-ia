import { useState } from "react";
import { Link } from "react-router-dom";
import { Globe, GlobeLock, ScanSearch, MessageSquarePlus, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ScoreBadge, scoreLabel } from "@/components/ui/ScoreBadge";
import { analyzeCompany, generateMessage } from "@/api/companies";
import { ApiError } from "@/api/client";
import { useToast } from "@/context/ToastContext";
import type { Company } from "@/types/company";

interface ProspectResultCardProps {
  company: Company;
  onUpdate: (updated: Company) => void;
}

export function ProspectResultCard({ company, onUpdate }: ProspectResultCardProps) {
  const { showToast } = useToast();
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);

  async function handleAnalyze() {
    setAnalyzing(true);
    try {
      const updated = await analyzeCompany(company.id);
      onUpdate(updated);
      showToast(`Site de ${company.name} analisado.`, "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.detail : "Erro ao analisar site.", "error");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleGenerateMessage() {
    setGenerating(true);
    try {
      const updated = await generateMessage(company.id, "whatsapp");
      onUpdate(updated);
      showToast("Mensagem de WhatsApp gerada.", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.detail : "Erro ao gerar mensagem.", "error");
    } finally {
      setGenerating(false);
    }
  }

  const hasReasons = company.opportunity_reasons.length > 0;

  return (
    <Card className="p-5">
      <div className="flex items-start gap-4">
        <ScoreBadge score={company.opportunity_score} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/empresas/${company.id}`}
              className="font-display font-semibold text-ink-800 hover:text-accent-500 dark:text-ink-100 dark:hover:text-accent-400"
            >
              {company.name}
            </Link>
            <ArrowUpRight className="h-3.5 w-3.5 text-ink-300" />
          </div>
          <p className="mt-0.5 text-sm text-ink-400">
            {company.segment ?? "—"} · {company.city ?? "—"}
            {company.phone ? ` · ${company.phone}` : ""}
          </p>

          <div className="mt-2 flex items-center gap-1.5 text-xs">
            {company.has_website ? (
              <span className="inline-flex items-center gap-1 text-ink-400">
                <Globe className="h-3.5 w-3.5" /> Site: {company.website_url}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-medium text-opportunity-high">
                <GlobeLock className="h-3.5 w-3.5" /> Empresa sem site
              </span>
            )}
          </div>

          {hasReasons && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {company.opportunity_reasons.map((reason) => (
                <li
                  key={reason}
                  className="rounded-full bg-ink-100 px-2.5 py-1 text-xs text-ink-500 dark:bg-ink-800 dark:text-ink-300"
                >
                  {reason}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-1.5 text-xs font-medium text-ink-400">{scoreLabel(company.opportunity_score)}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {company.has_website && (
              <Button variant="secondary" size="sm" onClick={handleAnalyze} loading={analyzing}>
                <ScanSearch className="h-3.5 w-3.5" />
                {company.analyzed_at ? "Reanalisar site" : "Analisar site"}
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={handleGenerateMessage} loading={generating}>
              <MessageSquarePlus className="h-3.5 w-3.5" />
              {company.whatsapp_message ? "Regenerar mensagem" : "Gerar mensagem"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
