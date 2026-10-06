import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: "border-l-4 border-opportunity-low",
  error: "border-l-4 border-opportunity-high",
  info: "border-l-4 border-ink-400",
};

const VARIANT_ICON: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-opportunity-low shrink-0" />,
  error: <XCircle className="h-5 w-5 text-opportunity-high shrink-0" />,
  info: <Info className="h-5 w-5 text-ink-400 shrink-0" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, variant }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start gap-2 rounded-xl bg-white dark:bg-ink-800 px-4 py-3 shadow-lg shadow-black/10 dark:shadow-black/30 ${VARIANT_STYLES[toast.variant]}`}
            role="status"
          >
            {VARIANT_ICON[toast.variant]}
            <p className="flex-1 text-sm text-ink-700 dark:text-ink-100">{toast.message}</p>
            <button
              onClick={() => dismiss(toast.id)}
              className="text-ink-400 hover:text-ink-600 dark:hover:text-ink-200"
              aria-label="Fechar notificação"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast deve ser usado dentro de um ToastProvider");
  return ctx;
}
