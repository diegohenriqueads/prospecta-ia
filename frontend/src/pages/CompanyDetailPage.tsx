import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Globe,
  ScanSearch,
  MessageSquarePlus,
  Copy,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select, Textarea, Label, Input } from "@/components/ui/Field";
import { ScoreBadge, scoreLabel } from "@/components/ui/ScoreBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useFetch } from "@/hooks/useFetch";
import { useToast } from "@/context/ToastContext";
import {
  analyzeCompany,
  deleteCompany,
  generateMessage,
  getCompany,
  updateCompany,
} from "@/api/companies";
import { ApiError } from "@/api/client";
import { CRM_STATUS_LABELS, KANBAN_COLUMNS, type Company, type MessageChannel } from "@/types/company";

export function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: company, loading, error, refetch } = useFetch<Company>(
    () => getCompany(id!),
    [id]
  );

  const [notes, setNotes] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");

  // Sincroniza o formulário local sempre que a empresa carregada mudar
  // (inclusive ao navegar de uma empresa para outra sem desmontar a página).
  useEffect(() => {
    if (company) {
      setNotes(company.notes ?? "");
      setEmail(company.email ?? "");
      setPhone(company.phone ?? "");
    }
  }, [company?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState<MessageChannel | null>(null);
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleAnalyze() {
    if (!company) return;
    setAnalyzing(true);
    try {
      await analyzeCompany(company.id);
      refetch();
      showToast("Site analisado com sucesso.", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.detail : "Erro ao analisar site.", "error");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleGenerateMessage(channel: MessageChannel) {
    if (!company) return;
    setGenerating(channel);
    try {
      await generateMessage(company.id, channel);
      refetch();
      showToast(
        `Mensagem de ${channel === "whatsapp" ? "WhatsApp" : "e-mail"} gerada.`,
        "success"
      );
    } catch (err) {
      showToast(err instanceof ApiError ? err.detail : "Erro ao gerar mensagem.", "error");
    } finally {
      setGenerating(null);
    }
  }

  async function handleStatusChange(newStatus: Company["status"]) {
    if (!company) return;
    setChangingStatus(true);
    try {
      await updateCompany(company.id, { status: newStatus });
      refetch();
      showToast("Status atualizado.", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.detail : "Erro ao atualizar status.", "error");
    } finally {
      setChangingStatus(false);
    }
  }

  async function handleSaveNotes() {
    if (!company) return;
    setSavingNotes(true);
    try {
      await updateCompany(company.id, { notes });
      refetch();
      showToast("Notas salvas.", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.detail : "Erro ao salvar notas.", "error");
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleSaveContact() {
    if (!company) return;
    setSavingContact(true);
    try {
      await updateCompany(company.id, { email, phone });
      refetch();
      showToast("Contato atualizado.", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.detail : "Erro ao salvar contato.", "error");
    } finally {
      setSavingContact(false);
    }
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Mensagem copiada para a área de transferência.", "success");
    } catch {
      showToast("Não foi possível copiar automaticamente. Selecione o texto manualmente.", "error");
    }
  }

  async function handleDelete() {
    if (!company) return;
    setDeleting(true);
    try {
      await deleteCompany(company.id);
      showToast("Empresa removida.", "success");
      navigate("/empresas");
    } catch (err) {
      showToast(err instanceof ApiError ? err.detail : "Erro ao remover empresa.", "error");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link
        to="/empresas"
        className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-700 dark:hover:text-ink-100"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para Empresas
      </Link>

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}

      {!loading && error && <ErrorState message={error} onRetry={refetch} />}

      {!loading && company && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <ScoreBadge score={company.opportunity_score} size="lg" />
              <div>
                <h1 className="font-display text-2xl font-semibold text-ink-800 dark:text-white">
                  {company.name}
                </h1>
                <p className="mt-0.5 text-sm text-ink-400">
                  {company.segment ?? "—"} · {company.city ?? "—"}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <StatusBadge status={company.status} />
                  <span className="text-xs text-ink-400">{scoreLabel(company.opportunity_score)}</span>
                </div>
              </div>
            </div>
            <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-3.5 w-3.5" /> Excluir
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Coluna principal */}
            <div className="space-y-6 lg:col-span-2">
              {/* Informações de contato */}
              <Card className="p-5">
                <h2 className="font-display font-semibold text-ink-800 dark:text-ink-100">
                  Informações de contato
                </h2>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center gap-2.5 text-ink-500 dark:text-ink-400">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {company.address ?? "Endereço não informado"}
                  </div>
                  {company.website_url ? (
                    <a
                      href={company.website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 text-accent-500 hover:underline"
                    >
                      <Globe className="h-4 w-4 shrink-0" />
                      {company.website_url}
                    </a>
                  ) : (
                    <div className="flex items-center gap-2.5 font-medium text-opportunity-high">
                      <Globe className="h-4 w-4 shrink-0" /> Empresa sem site
                    </div>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Telefone</Label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                      <Input className="pl-9" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Não informado" />
                    </div>
                  </div>
                  <div>
                    <Label>E-mail</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                      <Input
                        className="pl-9"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Não disponível (Google Places não retorna e-mail)"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button variant="secondary" size="sm" onClick={handleSaveContact} loading={savingContact}>
                    Salvar contato
                  </Button>
                </div>
              </Card>

              {/* Análise do site */}
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-semibold text-ink-800 dark:text-ink-100">
                    Análise do site
                  </h2>
                  {company.has_website && (
                    <Button variant="secondary" size="sm" onClick={handleAnalyze} loading={analyzing}>
                      <ScanSearch className="h-3.5 w-3.5" />
                      {company.analyzed_at ? "Reanalisar" : "Analisar site"}
                    </Button>
                  )}
                </div>

                {!company.has_website && (
                  <p className="mt-3 text-sm text-ink-400">
                    Esta empresa não possui site — por isso já recebe um score alto de oportunidade
                    (projeto do zero).
                  </p>
                )}

                {company.has_website && !company.analyzed_at && (
                  <p className="mt-3 text-sm text-ink-400">
                    Site ainda não analisado. Clique em "Analisar site" para verificar HTTPS,
                    responsividade, performance e SEO.
                  </p>
                )}

                {company.has_website && company.analyzed_at && (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <MetricPill label="HTTPS" value={company.has_https} />
                      <MetricPill label="Mobile-friendly" value={company.is_mobile_friendly} />
                      <MetricPill
                        label="Performance"
                        text={company.performance_score !== null ? `${company.performance_score}/100` : "—"}
                      />
                      <MetricPill label="SEO" text={company.seo_score !== null ? `${company.seo_score}/100` : "—"} />
                    </div>

                    {company.site_issues.length > 0 && (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                          Problemas encontrados
                        </p>
                        <ul className="mt-2 space-y-1.5">
                          {company.site_issues.map((issue) => (
                            <li key={issue} className="flex items-start gap-2 text-sm text-ink-600 dark:text-ink-300">
                              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-opportunity-mid" />
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {company.opportunity_reasons.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                      Por que é uma oportunidade
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {company.opportunity_reasons.map((reason) => (
                        <li
                          key={reason}
                          className="rounded-full bg-ink-100 px-2.5 py-1 text-xs text-ink-500 dark:bg-ink-800 dark:text-ink-300"
                        >
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>

              {/* Mensagens geradas por IA */}
              <Card className="p-5">
                <h2 className="font-display font-semibold text-ink-800 dark:text-ink-100">
                  Mensagens de abordagem (IA)
                </h2>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleGenerateMessage("whatsapp")}
                    loading={generating === "whatsapp"}
                  >
                    <MessageSquarePlus className="h-3.5 w-3.5" />
                    {company.whatsapp_message ? "Regenerar WhatsApp" : "Gerar mensagem WhatsApp"}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleGenerateMessage("email")}
                    loading={generating === "email"}
                  >
                    <MessageSquarePlus className="h-3.5 w-3.5" />
                    {company.email_message ? "Regenerar e-mail" : "Gerar mensagem e-mail"}
                  </Button>
                </div>

                {company.whatsapp_message && (
                  <MessageBlock
                    title="WhatsApp"
                    body={company.whatsapp_message}
                    onCopy={() => handleCopy(company.whatsapp_message!)}
                  />
                )}

                {company.email_message && (
                  <MessageBlock
                    title="E-mail"
                    subject={company.email_subject ?? undefined}
                    body={company.email_message}
                    onCopy={() =>
                      handleCopy(
                        company.email_subject
                          ? `Assunto: ${company.email_subject}\n\n${company.email_message}`
                          : company.email_message!
                      )
                    }
                  />
                )}

                {!company.whatsapp_message && !company.email_message && (
                  <p className="mt-3 text-sm text-ink-400">
                    Nenhuma mensagem gerada ainda. Se o provedor de IA não estiver configurado no
                    backend (ANTHROPIC_API_KEY ou OPENAI_API_KEY), a geração retornará um erro.
                  </p>
                )}
              </Card>
            </div>

            {/* Coluna lateral */}
            <div className="space-y-6">
              <Card className="p-5">
                <h2 className="font-display font-semibold text-ink-800 dark:text-ink-100">
                  Status no CRM
                </h2>
                <div className="mt-3">
                  <Select
                    value={company.status}
                    disabled={changingStatus}
                    onChange={(e) => handleStatusChange(e.target.value as Company["status"])}
                  >
                    {KANBAN_COLUMNS.map((status) => (
                      <option key={status} value={status}>
                        {CRM_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </Select>
                </div>
              </Card>

              <Card className="p-5">
                <h2 className="font-display font-semibold text-ink-800 dark:text-ink-100">Notas</h2>
                <Textarea
                  className="mt-3"
                  rows={6}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anotações sobre esta empresa, conversas, próximos passos..."
                />
                <div className="mt-3 flex justify-end">
                  <Button size="sm" onClick={handleSaveNotes} loading={savingNotes}>
                    Salvar notas
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Excluir esta empresa?"
        description={`"${company?.name}" será removida permanentemente do CRM. Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

function MetricPill({ label, value, text }: { label: string; value?: boolean | null; text?: string }) {
  const display = text ?? (value === null || value === undefined ? "—" : value ? "Sim" : "Não");
  const good = text ? undefined : value === true;
  const bad = text ? undefined : value === false;
  return (
    <div className="rounded-lg border border-ink-100 dark:border-ink-800 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-ink-400">{label}</p>
      <p
        className={`mt-0.5 text-sm font-semibold ${
          good ? "text-opportunity-low" : bad ? "text-opportunity-high" : "text-ink-700 dark:text-ink-100"
        }`}
      >
        {display}
      </p>
    </div>
  );
}

function MessageBlock({
  title,
  subject,
  body,
  onCopy,
}: {
  title: string;
  subject?: string;
  body: string;
  onCopy: () => void;
}) {
  return (
    <div className="mt-4 rounded-lg border border-ink-100 dark:border-ink-800 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{title}</p>
        <Button variant="ghost" size="sm" onClick={onCopy}>
          <Copy className="h-3.5 w-3.5" /> Copiar
        </Button>
      </div>
      {subject && <p className="mt-2 text-sm font-medium text-ink-700 dark:text-ink-100">{subject}</p>}
      <p className="mt-1.5 whitespace-pre-wrap text-sm text-ink-600 dark:text-ink-300">{body}</p>
    </div>
  );
}
