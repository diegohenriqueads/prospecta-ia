import { useState, type FormEvent } from "react";
import { Search, Radar } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { ProspectResultCard } from "@/components/companies/ProspectResultCard";
import { searchCompanies } from "@/api/companies";
import { ApiError } from "@/api/client";
import { useToast } from "@/context/ToastContext";
import type { Company } from "@/types/company";

export function ProspectingPage() {
  const { showToast } = useToast();
  const [city, setCity] = useState("");
  const [segment, setSegment] = useState("");
  const [limit, setLimit] = useState(20);
  const [results, setResults] = useState<Company[] | null>(null);
  const [summary, setSummary] = useState<{ newCount: number; knownCount: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function runSearch() {
    if (!city.trim() || !segment.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const { results: found, new_count, already_known_count } = await searchCompanies({
        city,
        segment,
        limit,
      });
      setResults(found);
      setSummary({ newCount: new_count, knownCount: already_known_count });

      if (new_count === 0 && already_known_count > 0) {
        showToast(
          `Todas as ${already_known_count} empresas encontradas já estavam no seu CRM. Tente um bairro/termo mais específico para achar empresas diferentes.`,
          "info"
        );
      } else {
        showToast(
          `${found.length} empresa(s) encontrada(s) — ${new_count} nova(s), ${already_known_count} já no CRM.`,
          "success"
        );
      }
    } catch (err) {
      const message =
        err instanceof ApiError ? err.detail : "Erro inesperado ao buscar empresas.";
      setError(message);
      setResults(null);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    void runSearch();
  }

  function handleUpdate(updated: Company) {
    setResults((prev) => prev?.map((c) => (c.id === updated.id ? updated : c)) ?? prev);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-800 dark:text-white">
          Prospecção
        </h1>
        <p className="mt-1 text-sm text-ink-400">
          Busque empresas reais por cidade e segmento via Google Places.
        </p>
      </div>

      <Card className="p-5">
        <form onSubmit={handleSearch} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label>Cidade / região</Label>
            <Input
              placeholder="Ex: Curitiba, PR ou Vila Mariana, São Paulo"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </div>
          <div className="flex-1">
            <Label>Segmento</Label>
            <Input
              placeholder="Ex: barbearia, marcenaria planejados"
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              required
            />
          </div>
          <div className="sm:w-40">
            <Label>Quantidade</Label>
            <Select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
              <option value={20}>Até 20</option>
              <option value={40}>Até 40</option>
              <option value={60}>Até 60 (máximo)</option>
            </Select>
          </div>
          <Button type="submit" loading={loading}>
            <Search className="h-4 w-4" />
            Buscar empresas
          </Button>
        </form>
        <p className="mt-3 text-xs text-ink-400">
          Dica: o Google limita cada busca a no máximo 60 resultados, sempre no mesmo
          ranking de relevância. Para encontrar empresas diferentes das que você já
          prospectou, use um bairro/região específica (ex: "Vila Mariana, São Paulo") em
          vez de repetir a cidade inteira.
        </p>
      </Card>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && error && (
        <ErrorState
          message={
            error.includes("GOOGLE_PLACES_API_KEY")
              ? `${error} Configure essa variável no arquivo .env do backend para habilitar a busca.`
              : error
          }
          onRetry={() => void runSearch()}
        />
      )}

      {!loading && !error && searched && results && results.length === 0 && (
        <EmptyState
          icon={Search}
          title="Nenhuma empresa encontrada"
          description="Tente outra combinação de cidade e segmento."
        />
      )}

      {!loading && !error && !searched && (
        <EmptyState
          icon={Radar}
          title="Pronto para prospectar"
          description="Informe uma cidade e um segmento acima para buscar empresas reais na região."
        />
      )}

      {!loading && results && results.length > 0 && (
        <div className="space-y-3">
          {summary && (
            <p className="text-xs text-ink-400">
              {results.length} resultado(s) ·{" "}
              <span className="font-medium text-opportunity-low">{summary.newCount} novo(s)</span>{" "}
              ·{" "}
              <span className="font-medium text-ink-500">
                {summary.knownCount} já no seu CRM
              </span>
            </p>
          )}
          {results.map((company) => (
            <ProspectResultCard key={company.id} company={company} onUpdate={handleUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
