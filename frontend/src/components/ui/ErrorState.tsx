import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-opportunity-high/20 bg-opportunity-high/5 px-6 py-12 text-center">
      <AlertTriangle className="mb-3 h-8 w-8 text-opportunity-high" />
      <p className="max-w-md text-sm text-ink-600 dark:text-ink-300">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
