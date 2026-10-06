import type { HTMLAttributes } from "react";
import clsx from "clsx";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-ink-100 dark:border-ink-800 bg-white dark:bg-ink-900 shadow-card",
        className
      )}
      {...props}
    />
  );
}
