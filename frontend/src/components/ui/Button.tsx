import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-accent-500 text-white hover:bg-accent-600 focus-visible:outline-accent-500 disabled:bg-accent-300",
  secondary:
    "bg-white dark:bg-ink-800 text-ink-700 dark:text-ink-100 border border-ink-200 dark:border-ink-700 hover:bg-ink-50 dark:hover:bg-ink-700 focus-visible:outline-ink-400",
  ghost:
    "bg-transparent text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800 focus-visible:outline-ink-400",
  danger:
    "bg-white dark:bg-ink-800 text-opportunity-high border border-opportunity-high/30 hover:bg-opportunity-high/10 focus-visible:outline-opportunity-high",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5 gap-1.5",
  md: "text-sm px-4 py-2.5 gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, disabled, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-60",
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
