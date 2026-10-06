import { NavLink } from "react-router-dom";
import { LayoutDashboard, Radar, Building2, Trello, Sparkles } from "lucide-react";
import clsx from "clsx";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/prospeccao", label: "Prospecção", icon: Radar },
  { to: "/empresas", label: "Empresas", icon: Building2 },
  { to: "/kanban", label: "Kanban CRM", icon: Trello },
];

export function Sidebar() {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-ink-100 dark:border-ink-800 bg-white dark:bg-ink-950">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <span className="font-display text-[15px] font-semibold text-ink-800 dark:text-white">
          Prospecta IA
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent-50 text-accent-600 dark:bg-accent-500/10 dark:text-accent-400"
                  : "text-ink-500 hover:bg-ink-50 hover:text-ink-800 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-100"
              )
            }
          >
            <Icon className="h-[18px] w-[18px]" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center justify-between border-t border-ink-100 dark:border-ink-800 px-5 py-4">
        <span className="text-xs text-ink-400">v0.1 · MVP</span>
        <ThemeToggle />
      </div>
    </aside>
  );
}
